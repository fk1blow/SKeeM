
// RTF XHR Connector implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/rtf/BaseConnector',
  'skm/net/XHRWrapper'],
  function(SKMObject, SKMLogger, BaseConnector, XHRWrapper)
{
'use strict';


var Logger = SKMLogger.create();


var ConnectorErrors = {
  INACTIVE: 'Innactive connection',
  LIST_TO_BIG: 'Confirmation Message Sent list is too big',
  READY_LIST_TO_BIG: 'Ready To send Message list is too big'
};


var EventsDelegates = {
  /**
   * Handles a message received from server api
   *
   * @description handles the server's update message
   * and passes it to the subscribers/clients of rtf api
   * 
   * @param  {Object} message JSON message send by rtf server api
   */
  handleReceivedMessage: function(message) {
    Logger.info('Connector.handleReceivedMessage');
    this.fire('api:message', message);
  },

  /**
   * Handles xhr connection error
   *
   * @description triggered when the transport cannot
   * connect to the host url or when the server
   * closes a connection giving a reason as the "405" status code
   * 
   * @param  {[type]} err JSON message representing the reason
   */
  handleError: function(err) {
    Logger.info('Connector.handleError');
    // If server triggers errors
    if ( err.status == 405 ) {
      this.fire('api:error', err.responseText);
    } else {
      this.handleConnectingStopped();
      // this.fire('transport:deactivated');
    }
  },

  handleConnectingStopped: function() {
    var that = this;

    Logger.info('Connector.handleConnectingStopped');

    if ( this._currentAttempt <= this.maxReconnectAttempts ) {
      Logger.debug('Connector : will make attempt in', this.reconnectDelay, 'ms');
      // Try to begin update and reconnect after [this.reconnectDelay]
      setTimeout(function() {
        Logger.debug('_____________________________________________');
        Logger.debug('Connector : attempt #', that._currentAttempt);
        // is reconnecting and increment current attempt
        that._isReconnecting = true;
        that._currentAttempt += 1;
        // try to re-establish connection by calling [beginUpdate]
        that.beginUpdate();
      }, this.reconnectDelay);
    } else {
      Logger.debug('Connector : maxReconnectAttempts of ' 
        + this.maxReconnectAttempts + ' reached!');
      // has stopped reconnecting and reset current attempt
      this._isReconnecting = false;
      this._currentAttempt = 1;

      // tell the manager the transport has been deactivated
      this.fire('transport:deactivated');
    }
  }
};


var XHRConnector = BaseConnector.extend(EventsDelegates, {
  _typeName: 'XHR',

  _currentAttempt: 1,

  _isReconnecting: false,

  maxReconnectAttempts: 3,

  reconnectDelay: 3000,

  beginUpdate: function() {
    // ensure transport type and transport url creation
    this.ensureTransportCreated(XHRWrapper).buildTransportUrl();
    Logger.info('Connector.beginUpdate');
    Logger.debug('Connector : transport url :', this.transport.url);
    // because xhr is ready after being instantiated
    this.fire('connector:ready');
    return this;
  },

  endUpdate: function() {
    Logger.info('Connector.endUpdate');
    // disconnect and remove events
    this.transport.abortRequest();
    // this.removeTransportListeners();
    return this;
  },

  sendMessage: function(message) {
    Logger.debug('%cConnector.sendMessage : ', 'color:green', message);
    this.transport.sendMessage({ message: message });
  },

  addTransportListeners: function() {
    this.transport
      .on('error', this.handleError, this)
      .on('success', this.handleReceivedMessage, this);
    return this;
  }
});


return XHRConnector;


});