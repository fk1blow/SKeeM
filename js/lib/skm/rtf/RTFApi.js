
// RTF Api Manager implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable',
  'skm/net/WSWrapper',
  'skm/net/XHRWrapper',
  'skm/rtf/ConnectorManager',
  'skm/rtf/XHRConnector',
  'skm/rtf/WSConnector'],
  function(SKMObject, SKMLogger, Subscribable, WSWrapper, XHRWrapper,
           ConnectorManager, XHRConnector, WSConnector)
{
'use strict';


var Logger = SKMLogger.create();






var Config = {
  baseUrl: {
    ws: 'ws://localhost:8080',
    xhr: 'http://localhost:8080/testajax'
  },

  useConnectors: ['WebSocket', 'XHR']
};






var wsurls = [
  'ws://localhost:8080/testws?clientId=' + (new Date().getTime()) + '&subscribe=test&batchId=1',
  'ws://10.0.3.98:3000'
];
var xhrUrl = 'http://localhost:8080/testajax?subscribe=test&clientId=' + ((new Date).getTime()) + '&batchId=1';


var connectorManager = ConnectorManager.create({
  sequence: Config.useConnectors
});

/*connectorManager.registerConnector('WebSocket', WSConnector.create({
  transport: WSWrapper.create({ url: wsurls[0], reconnectAttempts: 0 })
}));

connectorManager.registerConnector('XHR', XHRConnector.create({
  transport: XHRWrapper.create({ url: xhrUrl })
}));*/


var subscriptionList = {
  _subscriptions: null,

  add: function(name, subscription) {
    if ( ! this._subscriptions )
      this._subscriptions = {};
    this._subscriptions[name] = subscription;
  },

  remove: function(name) {
    delete this._subscriptions[name];
  },

  get: function(name) {
    return this._subscriptions[name];
  },

  has: function(subscription) {
    return this._subscriptions && (subscription in this._subscriptions);
  }
};


var Subscription = SKMObject.extend({
  name: '',

  initialize: function() {
    Logger.debug('%cnew Subscription', 'color:#A2A2A2', this.name);
  },

  handleUpdate: function(message) {
    Logger.debug('%cSubscription.handleUpdate :: ', 'color:green',
      'subscription : ' + this.name, ', message : ', message);
  },

  destroy: function() {
    Logger.debug('%cSubscription.destroy', 'color:green');
  }
});


// RTFApi implementation
var Api = {
  startUpdates: function() {
    Logger.debug('%cApi.start', 'color:green');
    connectorManager.startConnectors();
  },

  stopUpdates: function() {
    Logger.debug('%cApi.stop', 'color:green');
  },

  /**
   * Adds a new subscription
   *
   * @description creates a new Subscription object
   * and ties it to the connector's "api:update" event
   * @param {String} name subscription name
   */
  addSubscription: function(name) {
    if ( subscriptionList.has(name) ) {
      Logger.info('Api.addSubscription :: ' + name +
        ' subscription already registered!'); 
    }
    var subscription = subscriptionList[name] = Subscription.create({
      name: name
    });
    // Adds the subscription to the collection
    subscriptionList.add(name, subscription);
    // Tie the subscription to the manager's updates
    connectorManager.on('update', subscription.handleUpdate, subscription);
    return subscription;
  },

  /**
   * Removes a subscription
   *
   * @description destroys the instance and
   * removes the callbacks on connector "api:update" event
   * @param  {String} name subscription name
   */
  removeSubscription: function(name) {
    var subscription = subscriptionList.get(name);
    connectorManager.off('update', subscription.handleUpdate);
    subscriptionList.remove(name);
    subscription.destroy();
  },

  /**
   * Returns a subscription
   * @param  {String} name the name of the subscription
   */
  getSubscription: function(name) {
    return subscriptionList.get(name);
  }
};


return {
  Api: Api,
  Config: Config
}


});