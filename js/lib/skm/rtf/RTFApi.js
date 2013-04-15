/*

//

 */

// RTF Api Manager implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Timer',
  'skm/util/Subscribable',
  'skm/rtf/ConnectorManager',
  'skm/rtf/XHRConnector',
  'skm/rtf/WSConnector',
  'skm/rtf/MessagesHandler'],
  function(SKMObject, SKMLogger, SKMTimer, Subscribable, ConnectorManager, 
    XHRConnector, WSConnector, MessagesHandler)
{
'use strict';


var Logger = SKMLogger.create();


var isObject = function(obj) {
  return Object.prototype.toString.apply(obj) === '[object Object]';
};


var ConnectorsAvailable = {
  'WebSocket': {name: 'WebSocket', reference: WSConnector, activated: false},
  'XHR': {name: 'XHR', reference: XHRConnector, activated: false}
};


var Config = {
  sequence: ['WebSocket', 'XHR'],

  // single type config
  WebSocket: {
    url: 'ws://localhost:8080/testws',
    reconnectAttempts: 1,
    pingServer: true
  },

  // single type config
  XHR: {
    url: 'http://localhost:8080/testajax'
  },

  Errors: {
    'add_channel_err': 'RTFApi.addChannel - invalid or malformed channel declaration'
  }
};


var ChannelsList = {
  _currentList: null,

  _confirmedList: null,
  
  addChannel: function(channel) {
    var list = this._currentList = this._currentList || {},
        channelItem, paramItem;
    var channelParams = channel['params'],
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
    if ( this._currentList && name in this._currentList ) {
      delete this._currentList[name];
    }
    if ( this._confirmedList && name in this._confirmedList ) {
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

  connectorsManager: null,

  initialize: function(options) {
    // Create the parameters list object
    this._connectorsUrlModel = UrlModel.create();
    // Prepare batchId and add it to the parameterizer
    this._connectorsUrlModel.add('batchId', this._batchId);
    // creates the connector manager
    this._buildConnectorManager();
    // build connectors and register them
    this._buildConnectorsList();
    // prepare before unload auto disconnect
    this._prepareSyncOnUnload();
  },


  /*
    Manager operations
   */
  

  /**
   * Stops the connectors updates
   * @return {Object} current context
   */
  startUpdates: function() {
    this.connectorsManager.startConnectors();
    return this;
  },

  /**
   * Stops the connectors updates
   * 
   * @description stops the updates and disconnects/interrupts 
   * current transport, making it avaiable for a resume call.
   * @return {Object} current context
   */
  stopUpdates: function() {
    this.connectorsManager.stopConnectors();
    return this;
  },

  /**
   * Shuts down server updates communication
   * 
   * @description shuts down communication, stops every connector
   * and sends a proper message to the server.
   * @param  {Object} options optionsl shutdown parameters
   */
  shutdown: function(options) {
    var opt = options || {};
    var modelUrl, connector = this.connectorsManager.getActiveConnector();
    
    modelUrl = this._connectorsUrlModel.toQueryString()
      + '&closeConnection=true';

    connector = XHRWrapper.create({
      url: opt.url || Config.urls.xhr + modelUrl,
      async: opt.async
    }).sendMessage();
  },

  switchToNextConnector: function() {
    this.connectorsManager.switchToNextConnector();
  },

  sendMessage: function(message) {
    this.connectorsManager.sendMessage(message);
  },


  /*
    Channel operations
   */


  addChannel: function(channel) {
    var activeConnector = null;
   
    // check if it's an object and has ['name'] inside
    if ( ! isObject(channel) || ! ('name' in channel) ) {
      throw new TypeError(Config.Errors.add_channel_err);
    }
    // @todo trigger an event that tells the widget
    if ( ChannelsList.hasSubscribedAndConfirmed(channel) ) {
      // that the channel was already subscribed/confirmed
      Logger.error('Channel "' + channel + '" already subscribed.'
        + ' Unsubscribe then subscribe again.');
    } else {
      // Add subscription
      ChannelsList.addChannel(channel);
      // send message to connector, if a connector is available
      if ( activeConnector = this.connectorsManager.getActiveConnector() )
        activeConnector.sendMessage(ChannelsList.toStringifiedJson());
    }
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

  addUrlParameter: function(name, value) {
    this._connectorsUrlModel.add(name, value);
    return this;
  },


  /*
    Privates
   */

  
  _buildConnectorManager: function() {
    this.connectorsManager = ConnectorManager.create({
      sequence: Config.sequence
    });
    // attach the manager event handlers
    this._attachConnectorManagerHandlers();
  },

  _attachConnectorManagerHandlers: function() {
    // Handle when manager has been deactivated - next/sequence switch
    // or transport issues - issues handled by the manager
    this.connectorsManager.on('connector:deactivated',
      this.handleConnectorDeactivated, this);

    // handle the raw incoming message
    this.connectorsManager.on('update', this.handleMessage, this);

    // now parse and send channels list
    this.connectorsManager.on('connector:ready',
      this.handleConnectorReady, this);
  },

  _buildConnectorsList: function() {
    var urlModel = this._connectorsUrlModel,
        manager = this.connectorsManager;
    var item, active = false, name = null, type = null;
    var len = Config.sequence.length;
    
    // iterate over the sequence
    for ( var i = 0; i < len; i++ ) {
      item = Config.sequence[i];
      // sequence connector name
      name = ConnectorsAvailable[item]['name'];
      // sequence connector constructor function
      type = ConnectorsAvailable[item]['reference'];
      
      // if connector not already registered
      if ( manager.getConnector(name) == null ) {
        // create the connector and register to manage
        manager.registerConnector(name, type.create({
          urlParamModel: urlModel,
          transportOptions: Config[name]
        }));
      }
    }
  },

  _getIncrementedBatchId: function() {
    var bid = this._batchId++
    return bid;
  },

  _prepareSyncOnUnload: function() {
    var that = this;
    window.onbeforeunload = function() {
      that.shutdown({ async: false });
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