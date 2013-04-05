/*

1 Subscription / Channels
-----------------------

# 1.1 Adding

  - if a subscription was added, the server api will respond with
  either a confirmation message, telling that a subscription was added,
  or by triggering a [message:error], meaning that something went wrong.

  - A "message:error" event is triggered when:
      1. the subscription name is incorrect
      2. the subscription params are incorrect

  - Basically, the widget client can assume that a subscription has been
  successfully registered as long as it doesn't receive an error



# 1.2 Updating / altering 
  
  - on handleBeforeNextSequence
  - on handleAfterStartConnector



 */

// RTF Api Manager implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable',
  'skm/net/WSWrapper',
  'skm/net/XHRWrapper',
  'skm/rtf/ConnectorManager',
  'skm/rtf/XHRConnector',
  'skm/rtf/WSConnector',
  'skm/rtf/ChannelsHandler'],
  function(SKMObject, SKMLogger, Subscribable, WSWrapper, XHRWrapper,
           ConnectorManager, XHRConnector, WSConnector, ChannelsHandler)
{
'use strict';


var Logger = SKMLogger.create();


/*
  Config - urls, connector sequence, etc
 */


var Config = {
  sequence: ['WebSocket', 'XHR'],

  urls: {
    ws: 'ws://localhost:8080/testws',
    xhr: 'http://localhost:8080/testajax'
  },

  wsReconnectAttempts: 3
};


var UrlModel = SKMObject.extend(Subscribable, {
  _parameterizerList: null,

  getList: function() {
    this._parameterizerList = this._parameterizerList || {};
    return this._parameterizerList;
  },

  getByName: function(name) {
    return this._parameterizerList[name];
  },

  toUrl: function() {
    var list = this._parameterizerList;
    return encodeURIComponent(JSON.stringify(list).toString());
  },

  toQueryString: function(concatStr) {
    var i = 0, qs = '', part, segment, params = this.getList();
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

  reset: function(name, value) {
    if ( name in this.getList() )
      delete this._parameterizerList[name];
    return this;
  },

  add: function(name, value) {
    var list = this.getList();
    if ( list[name] ) {
      list[name].push(value);
    } else {
      list[name] = [value];
    }
    this.fire('added');
    return this;
  },

  addByKeyAndValue: function(paramObject) {},

  remove: function(name) {
    var list = this.getList();
    if ( name in list )
      delete list[name];
    this.fire('removed');
    return this;
  },

  alter: function(name, newValue) {
    var param, list = this.getList();
    if ( param = list[name] ) {
      list[name] = [newValue];
    }
    this.fire('altered');
    return this;
  }
});


/**
 * API constructor
 */
var RTFApi = SKMObject.extend(Subscribable, {
  _batchId: 0,

  _connectorsUrlModel: null,

  _connectorManager: null,

  // @todo change name to [subscriptionsHandler]
  subscriptionsHandler: null,

  initialize: function(options) {
    Logger.debug('%cnew RTFApi', 'color:#A2A2A2');
    // Create the parameters list object
    this._connectorsUrlModel = UrlModel.create();
    // Prepare batchId and add it to the parameterizer
    this._connectorsUrlModel.add('batchId', this._batchId);
    // creates the connector manager
    this._createConnectorManager();
    // attaches connector handlers
    this._attachConnectorManagerHandlers();
    // create the subscription channel object
    this._createSubscriptionChannel();
  },

  startUpdates: function(subscriptionList) {
    if ( !subscriptionList || typeof subscriptionList !== 'object' ) {
      throw new TypeError('RTFApi.startUpdates :: unable to start updates'
        + ' without a subscription list');
    }
    // for every subscription in list, compose and add the parameters
    this.subscriptionsHandler.prepareSubscriptionsList(subscriptionList);
    // Start the connectors, if any available.
    this._connectorManager.startConnectors({
      channelsParamsDelegate: this.subscriptionsHandler.subscriptions
    });
  },

  stopUpdates: function() {
    this._connectorManager.stopConnectors();
  },

  switchToNextConnector: function() {
    this._connectorManager.switchToNextConnector();
  },

  addUrlParameter: function(name, value) {
    this._connectorsUrlModel.add(name, value);
    return this;
  },

  sendMessage: function(message) {
    this._connectorManager.sendMessage(message);
  },


  /*
    Handlers
   */
  

  /**
   * Handles when a connector has been deactivated
   * 
   * @description Usually, this means the transport could not be
   * initialized or has tried to reconnect unsuccesfully
   * For the time being, just log the event
   */
  handleConnectorDeactivated: function() {
    Logger.debug('%cApiHandlersDelegate.handleConnectorDeactivated', 'color:red');
  },

  handleBeforeNextSequence: function() {
    this._connectorsUrlModel.reset('subscribe');
  },

  handleAfterStartConnector: function() {
    this._connectorsUrlModel.remove('subscribe');
  },

  // @todo add handler from ChannelsHandler
  handleMbeanMessage: function(message) {
    Logger.debug('%cApiHandlersDelegate.handleMbeanMessage',
      'color:red', message);
  },

  handleUpdateBatchId: function(batchId) {
    Logger.debug('RTFApi.handleUpdateBatchId', batchId);
    this._connectorsUrlModel.alter('batchId', batchId);
    // Dude, you must set the current object property too, so when you'll
    // try to reconnect you must have last batchId, not 0!! - Thanks, dude!
    this._batchId = batchId;
    // this.sendMessage('batchId:{' + batchId + '}');
    this.sendMessage('batchId:{' + batchId + '}');
  },


  /*
    Privates
   */
  

  _createSubscriptionChannel: function() {
    // Create the subscriptionsHandler instance
    this.subscriptionsHandler = ChannelsHandler.create({
      dataSourceDelegate: this._connectorManager
    });


    // update the batchId if an update is received
    this.subscriptionsHandler.on('update:batchId', 
      this.handleUpdateBatchId, this);
    // if no update given, just update using the current batchId
    this.subscriptionsHandler.on('noupdates', function() {
      this.handleUpdateBatchId(this._batchId);
    }, this);
    

    // @todo implement feature
    this.subscriptionsHandler.on('removed:subscription', function(name) {
      this._connectorsUrlModel.remove(name);
    }, this);

    this.subscriptionsHandler.on('added:subscription', function(name) {
      this._connectorsUrlModel.add('subscribe', name);
    }, this);
  },

  _createConnectorManager: function() {
    var manager = this._connectorManager = ConnectorManager.create({
      sequence: Config.sequence
    });

    manager.registerConnector('WebSocket', WSConnector.create({
      urlBase: Config.urls.ws,
      urlParamModel: this._connectorsUrlModel
    })).addTransport(WSWrapper.create({
      reconnectAttempts: Config.wsReconnectAttempts,
      pingServer: true
    }));

    manager.registerConnector('XHR', XHRConnector.create({
      urlBase: Config.urls.xhr,
      urlParamModel: this._connectorsUrlModel
    })).addTransport(XHRWrapper.create());
  },

  _attachConnectorManagerHandlers: function() {
    // Handle when manager has been deactivated - next/sequence switch
    // or transport issues - issues handled by the manager
    this._connectorManager.on('connector:deactivated',
      this.handleConnectorDeactivated, this);

    // reset subscriptions before next sequence begins
    this._connectorManager.on('before:nextSequence',
      this.handleBeforeNextSequence, this);

    // remove subscribtions after every connector has began update
    this._connectorManager.on('after:startConnector',
      this.handleAfterStartConnector, this);
  },

  _getIncrementedBatchId: function() {
    var bid = this._batchId++
    return bid;
  }
});


return {
  Config: Config,

  Api: (function() {
    var instance = null;

    return {
      get: function() {
        if ( instance == null ) {
          instance = RTFApi.create();
        }
        return instance;
      }
    }
  }())
};


});