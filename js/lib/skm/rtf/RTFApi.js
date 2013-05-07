
// RTF Api Manager implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable',
  'skm/net/XHRWrapper',
  'skm/rtf/ConnectorManager',
  'skm/rtf/models/ChannelsList',
  'skm/rtf/models/UrlParam',
  'skm/rtf/RTFEventsDelegates'],
  function(SKMObject, SKMLogger, Subscribable, XHRWrapper,
    ConnectorManager, ChannelstListModel, UrlParamModel, RTFEventsDelegates)
{
'use strict';


var Logger = SKMLogger.create();


var Config = {
  Sequence: ['WebSocket', 'XHR'],

  Connectors: {
    WebSocket: {
      url: 'ws://localhost:8080/testws',
      reconnectAttempts: 10,
      pingServer: true
    },

    XHR: {
      url: 'http://localhost:8080/testajax',
      reconnectAttempts: 10,
    }
  },

  Errors: {
    INVALID_CHANNEL_DECLARATION: 'Invalid or malformed channel declaration'
  },

  Warnings: {
    DUPLICATE_CHANNEL_SUBSCRIPTION: 'Channel already subscribed and confirmed'
  }
};


/**
 * Channels handling delegates
 */
var ChannelsDelegate = {
  addChannel: function(channel) {
    var activeConnector = null;
    var channelsList = this._getChannelsList();

    // check if it's an object and has ['name'] inside
    if ( ! channel || ! ('name' in channel) ) {
      throw new TypeError(Config.Errors.INVALID_CHANNEL_DECLARATION);
    }
    if ( channelsList.hasSubscribedAndConfirmed(channel) ) {
      Logger.warn(Config.Warnings.DUPLICATE_CHANNEL_SUBSCRIPTION, channel);
    } else {
      // Add subscription then send the 
      // message to connector, if any available
      channelsList.addChannel(channel);
      if ( activeConnector = this.connectorsManager.getActiveConnector() )
        activeConnector.sendMessage(channelsList.toStringifiedJson());
    }
  },

  removeChannel: function(name) {
    // remove from Channels list
    this._getChannelsList().removeChannel(name);
    // send message back to server
    this.sendMessage('closeSubscription:{' + name + '}');
    return this;
  }
};


/**
 * Url parameters handling delegates
 */
var ParamatersDelegates = {
  /**
   * Adds a parameter to the connectors url model
   * 
   * @description it will add the parameter, will trigger a "added" event
   * that will oblige the active connector to reset its url accordingly   
   * @param {String} name   the key name of the parameter
   * @param {String} value  actual value of the parameter, expressed as a string
   * @return {Object}      current object context
   */
  addUrlParameter: function(name, value) {
    this.connectorsUrlParam.add(name, value);
    return this;
  },

  /**
   * Remove the parameter from the connectors url
   * 
   * @param {String} name   the key name of the parameter
   * @return {Object}      current object context
   */
  removeUrlParameter: function(name) {
    this.connectorsUrlParam.remove(name);
    return this;
  }
};


// main constructor
var RTFApi = SKMObject.extend(Subscribable, RTFEventsDelegates, 
  ChannelsDelegate, ParamatersDelegates,
{
  _batchId: 0,

  /**
   * Holds the url parameters list of the connectors and their model
   * @type {UrlParam}
   */
  connectorsUrlParam: null,

  /**
   * Holds the list of subscribed channels and their model
   * @type {ChannelstList}
   */
  channelstList: null,

  /**
   * The connector manager instance
   * @type {ConnectorManager}
   */
  connectorsManager: null,

  /**
   * Yo dawg, i heard you like initializers...
   */
  initialize: function() {
    // Create the parameters list object
    this.connectorsUrlParam = UrlParamModel.create();
    // Prepare batchId and add it to the parameterizer
    this.connectorsUrlParam.add('batchId', this._batchId);
    // creates the connector manager
    this._buildConnectorManager();
    // prepare before unload auto disconnect
    this._prepareSyncOnUnload();
  },

  /**
   * Stops the connectors updates, mainly for debugging purpose
   * 
   * @description currently, the correct method for closing a subscription
   * is to send a shutdown message to the API
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
    var url, connector = this.connectorsManager.getActiveConnector();
    
    url = this.connectorsUrlParam.toQueryString()
      + '&closeConnection=true';

    connector = XHRWrapper.create({
      url: opt.url || Config.Connectors.XHR.url + url,
      async: opt.async
    }).sendMessage();
  },

  /**
   * It tries to switch to the next connector
   *
   * @description if it has reached the end of the sequence, as it is defined
   * in the Config.Sequence, it will stop every connector
   * and trigger a 'connector:sequence:complete' event
   */
  switchToNextConnector: function() {
    this.connectorsManager.switchToNextConnector();
  },

  /**
   * Sends a message using the current active transport
   * @param  {String} message the message to be sent by the active connector
   * If the active is a WSConnector instance, it should try to stringify
   * the content of the message, implementation done by each connector
   */
  sendMessage: function(message) {
    this.connectorsManager.sendMessage(message);
  },


  /*
    Privates
   */

  
  _getChannelsList: function() {
    if ( this.channelstList == null ) {
      this.channelstList = new ChannelstListModel();
    }
    return this.channelstList;
  },

  _buildConnectorManager: function() {
    this.connectorsManager = ConnectorManager.create({
      sequence: Config.Sequence,
      connectorsUrlParamModel: this.connectorsUrlParam,
      connectorsOptions: Config.Connectors
    });

    // handle the raw incoming message
    this.connectorsManager.on('api:message', this.handleMessage, this);

    // now parse and send channels list
    this.connectorsManager.on('connector:ready',
      this.handleConnectorReady, this);

    // Handle when manager has been deactivated; next/sequence switch
    // or transport issues - issues handled by the manager
    this.connectorsManager.on('connector:deactivated',
      this.handleConnectorDeactivated, this);

    // when the server closes the link
    this.connectorsManager.on('connector:closed',
      this.handleConnectorClosed, this);
  },

  _prepareSyncOnUnload: function() {
    var that = this;
    window.onbeforeunload = function() {
      that.shutdown({ async: false });
    };
  }
});


return {
  Config: Config,
  
  // singleton method
  Api: (function() {
    var apiSingletonInstance = null;
    return {
      getInstance: function() {
        if ( apiSingletonInstance == null )
          apiSingletonInstance = RTFApi.create();
        return apiSingletonInstance;
      }
    };
  }())
};


});