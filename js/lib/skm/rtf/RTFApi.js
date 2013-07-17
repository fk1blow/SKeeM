
/**
 * BetBrain RTF.js v0.1.9
 *
 * Dragos Tudorache, BetBrain Ltd.
 * http://betbrain.com
 * RTF.js may be freely distributed under the MIT license.
 */
define(['skm/k/Objekt',
  'skm/util/Logger',
  'skm/util/Subscribable',
  'skm/net/XHRWrapper',
  'skm/rtf/ConnectorManager',
  'skm/rtf/models/ChannelsList',
  'skm/rtf/models/UrlParam',
  'skm/rtf/RTFEventsDelegates'],
  function(SKMObject, SKMLogger, Subscribable, XHRWrapper, ConnectorManager,
    ChannelstListModel, UrlParamModel, RTFEventsDelegates)
{
'use strict';


var Logger = new SKMLogger();


var Config = {
  Sequence: ['WebSocket', 'XHR'],

  Connectors: {
    WebSocket: {
      url: 'ws://localhost:8080/testws',
      maxReconnectAttempts: 5,
      pingServer: true,
      pingInterval: 10 * 1000
    },

    XHR: {
      url: 'http://localhost:8080/testajax',
      maxReconnectAttempts: 5,
      pingServer: true,
      pingInterval: 30 * 1000
    }
  },

  Errors: {
    INVALID_CHANNEL_DECLARATION: 'Invalid or malformed channel declaration'
  },

  Warnings: {
    DUPLICATE_CHANNEL_SUBSCRIPTION: 'Channel already subscribed and confirmed'
  }
};


var RTFApi = function() {
  this.connectorsUrlParam = null;
  this.channelstList = null;
  this.connectorsManager = null;

  this._batchId = 0;

    // Create the parameters list object
    this.connectorsUrlParam = new UrlParamModel();
    // Prepare batchId and add it to the parameterizer
    this.connectorsUrlParam.add('batchId', this._batchId);
    // creates the connector manager
    this._buildConnectorManager();

  this._preparePageUnload();
    };


SKMObject.mixin(RTFApi.prototype, Subscribable, RTFEventsDelegates, {
  /**
   * Starts the connectors updates
   *
   * @description starts the connector and update process - it tries to get
   * the list of subscriptions and sends those messages to the server api
   */
  startUpdates: function() {
    this.connectorsManager.startConnectors();
    return this;
  },

  /**
   * Stops the connectors updates
   *
   * Currently, the correct method for closing a subscription
   * is to send a shutdown message to the API
   *
   * @description stops the updates and disconnects/interrupts
   * current transport, making it avaiable for a resume call.
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
   * @param  {Object} options optional shutdown parameters
   */
  shutdown: function(options) {

     this.isStopped=true;
     try{
         this.connectorsUrlParam.add('closeConnection', true);
         this.connectorsManager.getActiveConnector().sendMessage('closeConnection');
         this.switchToNextConnector();
     }catch(e){
         console.log('ws error close = ');
         console.error(e);
     }
    var url, opt = options || {};
    // try to stop current updates, if any
    this.stopUpdates();
    // build xhr's url and send the message
    url = this.connectorsUrlParam.toQueryString()
      + '&closeConnection=true';
    // gg xhr

    new XHRWrapper({
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
    var connector;
    if ( connector = this.connectorsManager.getActiveConnector() )
      connector.sendMessage(message);
    else {
      Logger.warn('Unable to send message : invalid connector type'
        + ' or connector is null');
    }
    return this;
  },

  /*
    Parameters delegates
   */

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
  },

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
      // Add the subscription then send the 
      // message to connector, if any available
      channelsList.addChannel(channel);

      // check to see if an active connector is found
      if ( activeConnector = this.connectorsManager.getActiveConnector() )
        activeConnector.sendMessage(channelsList.toStringifiedJson());
      else
        Logger.info('Channel added to list but no active connector found!'
          + ' Confirmation will be sent after activating a connector');
    }
  },

  removeChannel: function(name) {
    // remove from Channels list
    this._getChannelsList().removeChannel(name);
    // send message back to server
    this.sendMessage('closeSubscription:{' + name + '}');
    return this;
  },

  /*
    Privates
   */

  _preparePageUnload: function() {
    var that = this;
    that.unloadfired=false;
    
    //please do not extract the following into anothebbr function ,CHROME BUG !!!
    window.onbeforeunload = function() {
      if (that.unloadfired==false && !that.isStopped){
        that.unloadfired=true;
        that.stopUpdates();
        jQuery.ajax({
          url:  Config.Connectors.XHR.url + that.connectorsUrlParam.toQueryString() + '&closeConnection=true',
          async:false
        });
      }
    }
    jQuery(window).unload(function(){
      if (that.unloadfired==false && !that.isStopped){
        that.unloadfired=true;
        that.stopUpdates();
        jQuery.ajax({
          url:  Config.Connectors.XHR.url + that.connectorsUrlParam.toQueryString() + '&closeConnection=true',
          async:false
        });
      }
    });
  },

  _getChannelsList: function() {
    if ( this.channelstList == null ) {
      this.channelstList = new ChannelstListModel();
    }
    return this.channelstList;
  },

  _buildConnectorManager: function() {
    this.connectorsManager = new ConnectorManager({
      sequence: Config.Sequence,
      connectorsUrlParamModel: this.connectorsUrlParam,
      connectorsOptions: Config.Connectors
    });

    /** transport events */

    this.connectorsManager
      .on('ready', this.handleTransportReady, this)
      .on('interrupted', this.handleTransportInterrupted, this)
      .on('closed', this.handleTransportClosed, this)
      .on('reconnecting', this.handleTransportReconnecting, this)
      .on('reconnect:failed', this.handleTransportReconnectFailed, this);


    /** sequence events */

    this.connectorsManager
      .on('sequence:switching', this.handleManagerSequenceSwitching, this)
      .on('sequence:complete', this.handleManagerSequenceComplete, this);

    /** api/server events */
    this.connectorsManager.on('message', this.handleApiMessage, this);
    this.connectorsManager.on('error', this.handleApiError, this);
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
          apiSingletonInstance = new RTFApi();
        return apiSingletonInstance;
      }
    };
  }())
};


});
