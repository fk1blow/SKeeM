
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
    ws: 'ws://localhost:8080/testws',
    xhr: 'http://localhost:8080/testajax'
  },

  connectorSequence: ['WebSocket', 'XHR']/*.reverse()*/
};


var clientId = null, batchId = 1;


var connectorManager = ConnectorManager.create({
  sequence: Config.connectorSequence
});
connectorManager.registerConnector('WebSocket', WSConnector.create());
connectorManager.registerConnector('XHR', XHRConnector.create());


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


var subscriptionList = {
  _subscriptions: null,

  add: function(name, subscription) {
    if ( ! this._subscriptions )
      this._subscriptions = {};
    return this._subscriptions[name] = subscription;
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


var paramCollection = {
  _parameterizerList: null,

  getParamList: function() {
    return this._parameterizerList;
  },

  getParamByName: function(name) {
    return this._parameterizerList[name];
  },

  concatParams: function(concatStr) {
    var i = 0, qs = '', part, segment, params = this._parameterizerList;
    var concatWith = concatStr || '&';
    for ( part in params ) {
      i = 0, segment = params[part];
      // If at first part
      if ( qs.length < 1 ) {
        qs += '?';
      } else {
        qs += concatWith;
      }
      // for each part, there will be a segment array
      for ( ; i < segment.length; i++ ) {
        if ( i > 0 )
          qs += concatWith;
        qs += (part + '=' + segment[i]);
      }
    }
    return qs;
  },

  addParameter: function(name, value) {
    var list = this._parameterizerList = this._parameterizerList || {};
    if ( list[name] ) {
      list[name].push(value);
    } else {
      list[name] = [value];
    }
    return this;
  },

  removeParameter: function(name) {
    if ( name in this._parameterizerList )
      delete this._parameterizerList[name];
    return this;
  },

  alterParameter: function(name, newValue) {
    var param = this._parameterizerList[name];
    if ( param ) {
      this._parameterizerList[name] = [newValue];
    }
  }
};


// REFACTOR
// RTFApi implementation
var Api = (function() {
  function getIncrementedBatchId() {
    return batchId++;
  }

  function addConnectorsTransports() {
    // add WS transport
    connectorManager.getConnector('WebSocket')
      .setBaseUrl(Config.baseUrl.ws)
      .addTransport( WSWrapper.create({
          url: Config.baseUrl.ws + paramCollection.concatParams(),
          reconnectAttempts: 3
      }));
    // add XHR transport
    connectorManager.getConnector('XHR')
      .setBaseUrl(Config.baseUrl.xhr)
      .addTransport( XHRWrapper.create({
          url: Config.baseUrl.xhr + paramCollection.concatParams()
      }));
  }

  function prepareDefaultParams() {
    paramCollection.addParameter('batchId', getIncrementedBatchId());
    paramCollection.addParameter('clientId', this.getClientId());
  }

  function handleUpdateConfirmation() {
    connectorManager.on('update', function(message) {
        paramCollection.alterParameter('batchId', getIncrementedBatchId());
        if ( 'message' in message || 'reconfirmation' in message ) {
          connectorManager.getActiveConnector()
            .sendBatchId(paramCollection);
        }
      }, this);
  }


  return {
    startUpdates: function() {
      Logger.debug('%cApi.startUpdates', 'color:green');

      // prepares batchId and clientId
      prepareDefaultParams();

      // build the available connectors
      addConnectorsTransports();

      // listens to connector 'update' message
      // and sends a confirmation back to server api
      handleUpdateConfirmation();

      // ...and start the connectors, if any
      // also, check if there are connectors available
      connectorManager.startConnectors();
    },

    stopUpdates: function() {
      Logger.debug('%cApi.stopUpdates', 'color:green');
    },


    /*
      Subscriptions
     */


    /**
     * Adds a new subscription
     *
     * @description creates a new Subscription object
     * and ties it to the connector's "api:update" event
     * @param {String} name subscription name
     */
    addSubscription: function(name) {
      var subscription;
      if ( subscriptionList.has(name) ) {
        Logger.info('Api.addSubscription :: ' + name +
          ' subscription already registered!'); 
      }
      // Create the new subscription and add it to the list
      subscription = subscriptionList.add( name,
        Subscription.create({ name: name }) );
      // subscription = subscriptionList.get(name);
      
      // Tie the subscription to the manager's updates
      // connectorManager.on('update', subscription.handleUpdate, subscription);
      // Tell the connector to notify server api
      // connectorManager.getActiveConnector().sendNewSubscription(name);
      
      // Add it to the paramCollection
      paramCollection.addParameter('subscribe', name);
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
      paramCollection.removeParameter('subscribe');
    },

    /**
     * Returns a subscription
     * @param  {String} name the name of the subscription
     */
    getSubscription: function(name) {
      return subscriptionList.get(name);
    },


    /*
      Client/session, batch
     */


    /**
     * Returens the clientId
     * @return {String} clientId string of session/client 
     */
    getClientId: function() {
      return clientId;
    },

    /**
     * Sets the client/session id
     * @param {String} id the session id of the client
     */
    setCliendId: function(id) {
      clientId = id;
    }
  }
}());


return {
  Api: Api,
  Config: Config
}


});