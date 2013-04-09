/*

//

 */

// RTF Api Manager implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Timer',
  'skm/util/Subscribable',
  'skm/net/WSWrapper',
  'skm/net/XHRWrapper',
  'skm/rtf/ConnectorManager',
  'skm/rtf/XHRConnector',
  'skm/rtf/WSConnector',
  'skm/rtf/MessagesHandler'],
  function(SKMObject, SKMLogger, SKMTimer, Subscribable, WSWrapper, XHRWrapper,
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
  },

  toStringifiedJson: function() {
    var item, first = true, parameterized = 'subscribe:{';
    var list = this._currentList;
    for ( item in list ) {
      if (!first) {
        parameterized+= ',';
      }
      parameterized += item;
      first = false;
    }
    parameterized += '}';
    parameterized += 'params:' + JSON.stringify(list)
      .replace(/\'|\"/g, '');
    return parameterized;
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

  _beaconTimer: null,

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
    // prepare before unload auto disconnect
    this._prepareSyncOnUnload();
    // start the beacon
    // this._startBeaconTimer();
  },

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
      initialParameters: ChannelsList.toStringifiedJson()
    });
    return this;
  },

  stopUpdates: function() {
    this.connectorsManager.stopConnectors();
    return this;
  },

  resumeUpdates: function() {
    this.connectorsManager.startConnectors();
    return this;
  },

  shutdown: function(optUrl) {
    var modelUrl, connector = this.connectorsManager.getActiveConnector();
    if ( connector ) {
      connector.sendMessage('closeConnection');
    } else {
      modelUrl = this._connectorsUrlModel.toQueryString()
        + '&closeConnection=true';

      connector = XHRWrapper.create({
        url: optUrl || Config.urls.xhr + modelUrl
      }).sendMessage();
    }
  },

  addChannel: function(channel) {
    var resubscribeMessage = 'Channel "' + name + '" already subscribed.'
      + ' Unsubscribe then subscribe again.';

    if ( ChannelsList.hasSubscribedAndConfirmed(channel) ) {
      // @todo trigger an event that tells the widget
      // that the channel was already subscribed/confirmed
      Logger.error(resubscribeMessage);
    } else {
      // Add subscription
      ChannelsList.addChannel(channel);
      // send message to connector
      // if ( connector = this.connectorsManager.getActiveConnector() )
        this.sendMessage(ChannelsList.toStringifiedJson());
    }
    return this;
  },
  
  removeChannel: function(name) {
    // remove from Channels list
    ChannelsList.removeChannel(name);
    // send message back to server
    this.sendMessage('closeSubscription:{' + name + '}');
    return this;
  },

  getChannelsListObject: function() {
    return ChannelsList;
  },

  // ??????
  disconnect: function() {
    //
  },


  /*
    Connectors Commands
   */
  

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
  },

  _startBeaconTimer: function() {
    /*this._beaconTimer = SKMTimer.create({
      tickInterval: //
    })*/
  },

  _prepareSyncOnUnload: function() {
    var that = this;
    window.onbeforeunload = function() {
      that.shutdown();
    }
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