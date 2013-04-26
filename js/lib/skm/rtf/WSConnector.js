
// RTF WebSocket Connector implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/rtf/BaseConnector',
  'skm/net/WSWrapper'],
  function(SKMObject, SKMLogger, BaseConnector, WSWrapper)
{
'use strict';


var Logger = SKMLogger.create();


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
    // Logger.info('WSConnector.handleReceivedMessage');
    message = JSON.parse(message);
    this.fire('api:update', message);
  },

  /**
   * Handled when the native WebSocket is not present
   */
  handleImplementationMissing: function() {
    Logger.info('WSConnector.handleImplementationMissing');
    this.fire('transport:deactivated');
  },
  
  /**
   * Handles ws link:closed
   *
   * @description if server api closes the link, it sends a message
   * describing the reason for the close.
   * Usually, the server api will close the link because of a problem
   * involving protocols or for network issues.
   * Anything else is not interpreted!
   * 
   * @param  {Object} message JSON message sent by rtf server api
   */
  hanleLinkClosed: function(message) {
    Logger.info('WSConnector.hanleLinkClosed');
    // if the message is a string, you got an exception and that's baaad!!!
    if ( message ) {
      this.fire('api:error', message);
    }
    this.fire('api:error');
  },

  /**
   * Triggered when the transport is ready
   *
   * @description when the transport is ready to send messages
   * this methods signals this by triggerring a 'api:ready'
   * @return {[type]} [description]
   */
  handleLinkOpened: function() {
    this._isReconnecting = false;
    this._currentAttempt = 1;
    this.fire('connector:ready');
  },

  /**
   * Handled while trying to establish a link
   *
   * @description this handler is called whenever the websocket wrapper
   * tries to establish a connection but fails to do that.
   * It cand fail if the wrapper auto-disconnects the attemp,
   * or if the native wrapper triggers the close event.
   */
  handleConnectingStopped: function() {
    var that = this;

    Logger.info('WSConnector.handleConnectingStopped');

    if ( this._currentAttempt <= this.maxReconnectAttempts ) {
      Logger.debug('WSConnector : will make attempt in', this.reconnectDelay, 'ms');

      // Try to begin update and reconnect after [this.reconnectDelay]
      setTimeout(function() {
        Logger.debug('_____________________________________________');
        Logger.debug('WSConnector : attempt #', that._currentAttempt);
        // is reconnecting and increment current attempt
        that._isReconnecting = true;
        that._currentAttempt += 1;
        // try to re-establish connection by calling [beginUpdate]
        that.beginUpdate();
      }, this.reconnectDelay);
    } else {
      Logger.debug('WSConnector : maxReconnectAttempts of ' 
        + this.maxReconnectAttempts + ' reached!');
      // has stopped reconnecting and reset current attempt
      this._isReconnecting = false;
      this._currentAttempt = 1;
      // tell the manager the transport has been deactivated
      this.fire('transport:deactivated');
    }
  }
};


var WSConnector = BaseConnector.extend(EventsDelegates, {
  _typeName: 'WebSocket',

  _currentAttempt: 1,

  _isReconnecting: false,

  maxReconnectAttempts: 3,

  reconnectDelay: 3000,

  beginUpdate: function() {
    // ensure transport type and transport url creation
    this.ensureTransportCreated(WSWrapper).buildTransportUrl();
    Logger.info('WSConnector.beginUpdate \n', this.transport.url);
    // after connect, a ["connector:ready"] event will trigger
    this.transport.connect();
    return this;
  },

  endUpdate: function() {
    Logger.debug('WSConnector.endUpdate');
    // disconnect and remove events
    this.transport.disconnect();
    return this;
  },

  /**
   * Sends a message through/using the transport
   * 
   * @param  {String} message   the message to be sent to endpoint
   */
  sendMessage: function(message) {
    Logger.debug('%cWSConnector.sendMessage : ', 'color:red', message);
    this.transport.send(message);
  },

  /*
    - define the list of events that a connector can trigger
    - for ex, if the link is being interrupted, make sure you notify the manager
    that an error has ocured - this error will be sent to the widget
  */
  addTransportListeners: function() {
    // connection established
    this.transport.on('link:opened', this.handleLinkOpened, this);

    // connection dropped by server
    this.transport.on('link:closed', this.hanleLinkClosed, this);

    // handles connection message event - rtf server api update
    this.transport.on('message', this.handleReceivedMessage, this);

    // WebSocket native implementation not found
    this.transport.on('implementation:missing',
      this.handleImplementationMissing, this);

    // Try to reconnect when "stopped", "timeout" or "interrupted"
    // will reconnect
    this.transport.on('connecting:stopped connecting:timeout link:interrupted',
      this.handleConnectingStopped, this);

    return this;
  }
});


return WSConnector;


});