/*

### parameterize channels/parameters
  - the parameterization(i guess) of the channels list, must be made
  from a delegates object
  - every connector could mixin a Parameterizer object that will declare
  a [parameterizeFor] method for every type of connector

### don't add url to connectorsUrlModel anymore
  - this._connectorsUrlModel.add('subscribe', name) - this call should be removed
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
  'skm/rtf/MessagesHandler'],
  function(SKMObject, SKMLogger, Subscribable, WSWrapper, XHRWrapper,
           ConnectorManager, XHRConnector, WSConnector, MessagesHandler)
{
'use strict';


var Logger = SKMLogger.create();


var Config = {
  sequence: ['WebSocket', 'XHR'],

  urls: {
    ws: 'ws://localhost:8080/testws',
    xhr: 'http://localhost:8080/testajax'
  },

  wsReconnectAttempts: 3
};


var ChannelsList = {
  _currentList: null,

  _confirmedList: null,
  
  addChannel: function(channel) {
    var list = this._currentList = this._currentList || {},
        channelItem, paramItem,
        channelParams = channel['params'],
        channelName = channel['name'];

    if ( channelName in list ) {
      channelItem = list[channelName];
    } else {
      channelItem = list[channelName] = {};
    }
    // ...and add channel parameters, if any
    for ( paramItem in channelParams ) {
      channelItem[paramItem] = channelParams[paramItem];
    }
  }, 

  removeChannel: function(name) {
    var subscription = null;
    if ( name in this._currentList ) {
      delete this._currentList[name];
    }
    if ( name in this._confirmedList ) {
      delete this._confirmedList[name];
    }
  },

  // @todo move it to the api module
  confirmChannel: function(channelName, willConfirm) {
    var confirmed = this._confirmedList = this._confirmedList || {};
    var list = this._currentList;

    if ( channelName in list && willConfirm ) {
      confirmed[channelName] = list[channelName];
      delete list[channelName];
    }
  },

  hasSubscribedAndConfirmed: function(channelObj) {
    var list = this._confirmedList;
    var hasSubscribed = false;
    if ( list ) {
      hasSubscribed = (channelObj['name'] in list);
    }
    return hasSubscribed;
  },

  getCurrentList: function() {
    return this._currentList;
  }
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


// main API constructor
var RTFApi = SKMObject.extend(Subscribable, MessagesHandler, {
  _batchId: 0,

  _connectorsUrlModel: null,

  _messagesHandler: null,

  connectorsManager: null,

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
  },


  /*
    Channels commands
   */


  startWithChannels: function(initialChannels) {
    // if no channelList sent, hit them with an error
    if ( !initialChannels || typeof initialChannels !== 'object' ) {
      throw new TypeError('RTFApi.startUpdates :: unable to start updates'
        + ' without a subscription list');
    }
    // Add every channel in list to the ChannelList collection object
    for ( var channel in initialChannels ) {
      ChannelsList.addChannel(initialChannels[channel]);
    }
    // Start the connectors, if any available
    this.connectorsManager.startConnectors({
      initialParameters: ChannelsList.getCurrentList()
    });
  },

  addChannel: function(channel) {
    var connector = null;
    var resubscribeMessage = 'Channel "' + name + '" already subscribed.'
      + ' Unsubscribe then subscribe again.';

    if ( ChannelsList.hasSubscribedAndConfirmed(channel) ) {
      Logger.error(resubscribeMessage);
    } else {
      // Add subscription
      ChannelsList.addChannel(channel);
      // send message to connector
      if ( connector = this.connectorsManager.getActiveConnector() )
        connector.sendParameters(ChannelsList.getCurrentList());
    }
  },
  
  removeChannel: function(name) {
    // remove from Channels list
    ChannelsList.removeChannel(name);
    // send message back to server
    this.sendMessage('closeSubscription:{' + name + '}');
  },

  getChannelsListObject: function() {
    return ChannelsList;
  },


  /*
    Connectors Commands
   */
  

  stopConnectors: function() {
    this.connectorsManager.stopConnectors();
  },

  switchToNextConnector: function() {
    this.connectorsManager.switchToNextConnector();
  },

  sendMessage: function(message) {
    this.connectorsManager.sendMessage(message);
  },

  addUrlParameter: function(name, value) {
    this._connectorsUrlModel.add(name, value);
    return this;
  },


  /*
    Privates
   */

 
  _createConnectorManager: function() {
    var manager = this.connectorsManager = ConnectorManager.create({
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
    this.connectorsManager.on('connector:deactivated',
      this.handleConnectorDeactivated, this);

    // remove subscribtions after every connector has began update
    this.connectorsManager.on('after:startConnector',
      this.handleAfterStartConnector, this);

    // handle the raw incoming message
    this.connectorsManager.on('update', this.handleMessage, this);
  },

  _getIncrementedBatchId: function() {
    var bid = this._batchId++
    return bid;
  }
});


var ApiSingleton = (function() {
  var instance = null;

  return {
    getInstance: function() {
      if ( instance == null ) {
        instance = RTFApi.create();
      }
      return instance;
    }
  }
}());


return {
  Config: Config,
  Api: ApiSingleton
};


});