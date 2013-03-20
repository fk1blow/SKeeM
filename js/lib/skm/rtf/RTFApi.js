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


/*
  Config - urls, connector sequence, etc
 */


var Config = (function(){
  var transportsURLs = {
    ws: 'ws://localhost:8080/testws',
    xhr: 'http://localhost:8080/testajax'
  };

  var defaultURLs = {
    ws: 'ws://localhost:8080/testws',
    xhr: 'http://localhost:8080/testajax'
  };

  var connectorSequence = ['WebSocket', 'XHR'];

  return {
    getSequence: function() {
      return connectorSequence;
    },

    setSequence: function(sequence) {
      connectorSequence = sequence;
    },

    getWSUrl: function() {
      var url = null;
      if ( ! (url = transportsURLs.ws) ) {
        url = defaultURLs.ws;
        Logger.info('%cConfig.getWSUrl : ws url is null - '
          + ' returning default url', 'color:red');
      }
      return transportsURLs.ws;
    },

    setWSUrl: function(url) {
      transportsURLs.ws = url;
    },

    getXHRUrl: function() {
      var url = null;
      if ( ! (url = transportsURLs.xhr) ) {
        url = defaultURLs.xhr;
        Logger.info('%cConfig.getXHRUrl : xhr url is null - '
          + ' returning default url', 'color:red');
      }
      return transportsURLs.xhr;
    },

    setXHRUrl: function(url) {
      transportsURLs.xhr = url;
    }
  }
}());


/*
  Subscriptions and Param lists
 */


var Subscription = SKMObject.extend({
  name: undefined,

  initialize: function() {
    Logger.debug('%cnew Subscription', 'color:#A2A2A2', this.name);
  },

  handleUpdate: function(message) {
    Logger.debug('%cSubscription.handleUpdate :: ', 'color:blue',
      'subscription : ' + this.name, ', message : ', message['message']);
  },

  destroy: function() {
    Logger.debug('%cSubscription.destroy', 'color:green');
  }
});


var rtfSubscriptionList = {
  _subscriptions: null,

  add: function(name, subscription) {
    if ( ! this._subscriptions )
      this._subscriptions = {};
    return this._subscriptions[name] = subscription;
  },

  remove: function(name) {
    if ( name in this._subscriptions )
      delete this._subscriptions[name];
    return true;
  },

  get: function(name) {
    return this._subscriptions[name];
  },

  eachSubscription: function(callback, context) {
    var subscription, list = this._subscriptions;
    for ( subscription in list ) {
      callback.call(context || this, list[subscription]);
    }
  },

  has: function(subscription) {
    return this._subscriptions && (subscription in this._subscriptions);
  },

  isNullOrEmpty: function() {
    var counter = 0, sub;
    if ( this._subscriptions !== null ) {
      for (sub in this._subscriptions) {
        counter++;
      }
      if (counter > 0)
        return false;
    }
    return true;
  }
};


var rtfParamList = {
  _parameterizerList: null,

  getParamList: function() {
    return this._parameterizerList;
  },

  getParamByName: function(name) {
    return this._parameterizerList[name];
  },

  toQueryString: function(concatStr) {
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


/*
  Connector Manager
 */


var connectorManagerInstance = (function() {
  // Create the connector manager
  var connectorManager = null;

  // Register defaul connectors and their transports
  function registerDefaultConnectors() {
    var wsconnector, xhrconnector;
    if ( connectorManager ) {
      wsconnector = connectorManager.registerConnector('WebSocket', WSConnector.create({
        urlBase: Config.getWSUrl(),
        urlParamModel: rtfParamList
      }));
      wsconnector.addTransport(WSWrapper.create());

      xhrconnector = connectorManager.registerConnector('XHR', XHRConnector.create({
        urlBase: Config.getXHRUrl(),
        urlParamModel: rtfParamList
      }));
      xhrconnector.addTransport(XHRWrapper.create());
    }
  }

  return {
    get: function() {
      if ( connectorManager == null ) {
        connectorManager = ConnectorManager.create({
          sequence: Config.getSequence()
        });
        registerDefaultConnectors();
      }
      return connectorManager;
    }
  }
}());



/**
 * API
 */


var RTFApi = SKMObject.extend({
  _clientId:  null,

  _batchId: 1,

  initialize: function() {
    Logger.debug('%cnew RTFApi', 'color:#A2A2A2');

    this._clientId = null;

    // Prepare batchId and add it to the parameterizer
    rtfParamList.addParameter('batchId', this._getIncrementedBatchId());
    
    // Resends a confirmation back to server api
    connectorManagerInstance.get().on('update',
      this.handleReconfirmation, this);

    // Removes 'subscribe' from rtfParamList when a connector has stopped
    connectorManagerInstance.get().on('stopped',
      this.handleManagerSequenceStopped, this);
  },


  /*
    Commands
   */


  startUpdates: function() {
    Logger.debug('%cRTFApi.startUpdates', 'color:green');
    
    // Validate clientId presence
    this._validateCliendIdAdded();
    
    // Validates the presence of subscriptions
    this._validateSubscriptionsAdded();

    // Start the connectors, if any available.
    connectorManagerInstance.get().startConnectors();
  },

  stopUpdates: function() {
    Logger.debug('%cRTFApi.stopUpdates', 'color:green');
    // stop all connectors
    connectorManagerInstance.get().stopConnectors();
  },

  switchToNextConnector: function() {
    Logger.debug('%cRTFApi.switchToNextConnector', 'color:green');
    connectorManagerInstance.get().switchToNextConnector();
  },

  /**
   * Sets the clientId of the rtf client
   *
   * @description same as session id though can be left out
   * and the value implicitly retrieved/set by server api
   * @param {String} id cliend/sessions id string
   */
  setClientId: function(id) {
    var cid = this._clientId;
    if ( cid !== null ) {
      throw new Error('RTFApi.setClientId : clientId already set!');
    }
    rtfParamList.addParameter('clientId', this._clientId = id);
  },


  /*
    Handlers
   */


  /**
   * Confirms receiving a message(update) from server api
   * 
   * @description basically, it sends a message back to the server,
   * confirming that he(the client) has received the update message 
   */
  handleReconfirmation: function(message) {
    var batchId;
    
    Logger.debug('RTFApi.handleReconfirmation', 'color:red');

    // sends batch id only if 'message' or 'reconfirmation'
    if ( 'message' in message || 'reconfirmation' in message ) {
      batchId = this._getIncrementedBatchId();
      // Alter batchId parameter
      rtfParamList.alterParameter('batchId', batchId);
      // ...and send the new batch id
      connectorManagerInstance.get().sendMessage('batchId{' + batchId + '}');
    }
  },

  /**
   * Resets the "subscribe" parameter when
   * a connector sequence is closed
   */
  handleManagerSequenceStopped: function() {
    // probably, the [rtfSubscriptionList] should be handled as
    rtfParamList.removeParameter('subscribe');
  },


  /*
    Subscriptions
   */
  

  /**
   * Returns a subscription
   * 
   * @param  {String} name the name identifier of the subscription
   */
  getSubscription: function(name) {
    return rtfSubscriptionList.get(name);
  },

  /**
   * Adds a new subscription
   *
   * @description creates a new Subscription object
   * and ties it to the connector's "api:update" event
   * @param {String} name subscription name
   */
  addSubscription: function(name) {
    var subscription, activeConnector;
    if ( rtfSubscriptionList.has(name) ) {
      Logger.info('RTFApi.addSubscription :: ' + name +
        ' subscription already registered!'); 
    }
    // Create the new subscription and add it to the list
    subscription = rtfSubscriptionList.add( name,
      Subscription.create({ name: name }) );
    
    // Tie the subscription to the manager's updates
    connectorManagerInstance.get().on('update', subscription.handleUpdate, subscription);

    // Add it to the rtfParamList
    // rtfParamList.addParameter('subscribe', name);
    rtfParamList.addParameter('subscribe', name);

    // Tell the connector to notify server api
    connectorManagerInstance.get().sendMessage('subscribe{' + name + '}');

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
    var subscription = rtfSubscriptionList.get(name);

    // Dettach update event
    connectorManagerInstance.get().off('update', subscription.handleUpdate, subscription);
    
    // Remove from subscription list
    rtfSubscriptionList.remove(name);

    // Destroy subscription
    subscription.destroy();
    
    // rtfParamList.removeParameter('subscribe');
    rtfParamList.removeParameter('subscribe');
  },


  /*
    Privates
   */


  _getIncrementedBatchId: function() {
    var bid = this._batchId++
    return bid;
  },

  _validateCliendIdAdded: function() {
    var cid = this._clientId;
    if ( cid  === null || typeof cid === 'undefined'
        || cid.length < 1 ) {
      Logger.info('%cRTFApi : ' + 
        'invalid clientId or clientId not set : ', 'color:red', cid);
    }
  },

  _validateSubscriptionsAdded: function() {
    if ( rtfSubscriptionList.isNullOrEmpty() ) {
      Logger.info('%cRTFApi : ' + 
        'subscription list is empty or null', 'color:red');
    }
  }
});


var ApiInstance = (function() {
  var instance = null;

  return {
    get: function() {
      if ( instance == null ) {
        instance = RTFApi.create();
      }
      return instance;
    }
  }
}());


return {
  Config: Config,
  Api: ApiInstance
};


});
