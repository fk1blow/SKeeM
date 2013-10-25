
// RTF WebSocket Connector implementation

define(['skm/k/Objekt',
  'skm/util/Logger',
  'skm/rtf/BaseConnector',
  'skm/net/WSWrapper'],
  function(SKMObject, SKMLogger, BaseConnector, WSWrapper)
{
'use strict';


var Logger = new SKMLogger();


/**
 * @constructor
 */
var WSConnector = function() {
  BaseConnector.prototype.constructor.apply(this, arguments);
};


SKMObject.inherits(WSConnector, BaseConnector);


SKMObject.mixin(WSConnector.prototype, {
  /**
   * Begins update by calling [connect] on the transport object
   *
   * @description because of some previous bad design decisions, the
   * [_ensureTransportCreated] should always be called for each 
   * connector object...
   */
  beginUpdate: function() {
    this._ensureTransportCreated(WSWrapper)._buildTransportUrl();
    Logger.info('WSConnector.beginUpdate');
    Logger.debug('WSConnector : transport url :', this.transport.url);
    // after connect, a ["connector:ready"] event will trigger
    this.transport.connect();
    return this;
  },

  endUpdate: function() {
    Logger.info('WSConnector.endUpdate');
    // disconnect and remove events
    this.transport.disconnect();
    // Stop the reconnecting attempts
    this._stopReconnectAttempts();
    return this;
  },

  /**
   * Sends a message through/using the transport
   * 
   * @param  {String} message   the message to be sent to endpoint
   */
  sendMessage: function(message) {
   // Logger.debug('%cWSConnector : sending message : ', 'color:green', message);
    this.transport.send(message);
  },

  addTransportListeners: function() {
    // connection established
    this.transport.on('link:opened', this.handleLinkOpened, this);

    // connection closed by server; wasClean == true
    this.transport.on('link:closed', this.hanleLinkClosed, this);

    // Connection has been interrupted, not by the user nor the server
    this.transport.on('link:interrupted', this.handleLinkInterrupted, this);

    // Link established though not able to communicate - vpn, proxy, middleware
    this.transport.on('link:ghosting', this.handleLinkGhosting, this);

    // Transport has been stopped or closed
    this.transport.on('connecting:closed', this.handleConnectingClosed, this);

    // handles connection message event - rtf server api update
    this.transport.on('message', this.handleReceivedMessage, this);

    // WebSocket native implementation not found
    this.transport.on('implementation:missing',
      this.handleImplementationMissing, this);
  },

  /**
   * Triggered when the transport is ready
   *
   * @description when the transport is ready to send messages
   * this methods signals this by triggerring a 'api:ready'
   * @return {[type]} [description]
   */
  handleLinkOpened: function() {
    this._resetReconnectAttempts();
    this.fire('transport:ready');
  },

  /**
   * Handled when the native WebSocket is not present
   */
  handleImplementationMissing: function() {
    Logger.info('WSConnector.handleImplementationMissing');
    // in case of implementation missing we need to null websocket, so we will never try to use it again, time loose.
    window['WebSocket']=null;
	window['MozWebSocket']=null;
    this.fire('transport:error');
  },

  /**
   * Handles link:closed
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
    this._resetReconnectAttempts();
    // if the message is a string, you got an exception and that's baaad!!!
    if ( message ) {
      this.fire('api:error', message);
    } else {
      this.fire('transport:closed');
    }
  },

  /**
   * Handled when an opened link/connection has been interrupted
   *
   * @description besides fireing an event, it will try
   * to make another reconnect attempt
   */
  handleLinkInterrupted: function() {
    Logger.info('Connector.handleLinkInterrupted');
    // besides the reconnect attempt, tell the use what happened
    this.fire('transport:interrupted');
    this._makeReconnectAttempt();
  },

  /**
   * Handled after a link is opened but the WSWrapper is not
   * able to exchange any message with the server
   */
  handleLinkGhosting: function() {
    Logger.info('Connector.handleLinkInterrupted');
    //we need to null the websocket so we can assure that we won't try again on it, since it is not working
    window['websocket']=null;
    this.fire('transport:error');
  },

  /**
   * Handles a message received from server api
   *
   * @description handles the server's update message
   * and passes it to the subscribers/clients of rtf api
   * 
   * @param  {Object} message JSON message send by rtf server api
   */
  handleReceivedMessage: function(message) {
    message = JSON.parse(message);
    this.fire('api:message', message);
  },

  /**
   * Handled while trying to establish a link
   *
   * @see [this._makeReconnectAttempt]
   * @see reconnection mechanism
   * 
   * @description this handler is called whenever the websocket wrapper
   * tries to establish a connection but fails to do that.
   * It cand fail if the wrapper auto-disconnects the attemp,
   * or if the native wrapper triggers the close event.
   */
  handleConnectingClosed: function() {
    Logger.info('Connector.handleConnectingClosed');
    this._makeReconnectAttempt();
  }
});


return WSConnector;


});
