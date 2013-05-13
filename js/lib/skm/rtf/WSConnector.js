
// RTF WebSocket Connector implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/rtf/BaseConnector',
  'skm/net/WSWrapper'],
  function(SKMObject, SKMLogger, BaseConnector, WSWrapper)
{
'use strict';


var Logger = SKMLogger.create();


/*------------------------
  Delegates
------------------------*/


var EventsDelegates = {
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
    this.fire('transport:ready');
  },

  /**
   * Handled when the native WebSocket is not present
   */
  handleImplementationMissing: function() {
    Logger.info('WSConnector.handleImplementationMissing');
    this.fire('transport:error');
  },

  /**
   * Handled when the reconnect attemps has reached maximum attempts
   */
  handleMaxReconnectAttemptsReached: function() {
    Logger.info('WSConnector.handleMaxReconnectAttemptsReached');
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
    // if the message is a string, you got an exception and that's baaad!!!
    if ( message ) {
      this.fire('api:error', message);
    } else {
      this.fire('transport:closed');
    }
  },

  /**
   * Handled when the user has canceled the connecting attempt
   *
   * @description easily confused with connecting:closed, this event is
   * triggered only when an attempt to connect is being aborted by the user.
   */
  handleConnectingAttemptAborted: function() {
    Logger.info('Connector.handleConnectingAttemptAborted');
    this.fire('transport:closed');
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
   * Handled while trying to establish a link
   *
   * @description this handler is called whenever the websocket wrapper
   * tries to establish a connection but fails to do that.
   * It cand fail if the wrapper auto-disconnects the attemp,
   * or if the native wrapper triggers the close event.
   */
  handleConnectingAttemptStopped: function() {
    // cl(this.transport._nativeSocket)
    Logger.info('Connector.handleConnectingAttemptStopped');
    this._makeReconnectAttempt();
  }
};


/*------------------------
  Delegates
------------------------*/


var WSConnector = BaseConnector.extend(EventsDelegates, {
  name: 'WS',
  
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
    Logger.debug('%cWSConnector : sending message : ', 'color:green', message);
    this.transport.send(message);
  },

  addTransportListeners: function() {
    // this.transport.on('all', function() { cl('WSConnector < ', arguments); });
    // return;

    /** Transport related handlers */

    // connection established
    this.transport.on('link:opened', this.handleLinkOpened, this);

    // connection closed by server; wasClean == true
    this.transport.on('link:closed', this.hanleLinkClosed, this);

     // Connection has been interrupted, not by the user nor the server
    this.transport.on('link:interrupted', this.handleLinkInterrupted, this);

    /** Connecting attempts handlers */

    // A connecting attempt aborted by user
    this.transport.on('connecting:aborted',
      this.handleConnectingAttemptAborted, this);

    // WILL TRY TO RECONNECT !!!!!!!!!!
    // Try to reconnect when "stopped", "timeout" or "interrupted"
    // add special handler for [link:interrupted] - should notifiy the user
    this.transport.on('connecting:stopped connecting:timeout',
      this.handleConnectingAttemptStopped, this);

    /** Message and implementation missing handlers */

    // handles connection message event - rtf server api update
    this.transport.on('message', this.handleReceivedMessage, this);

    // WebSocket native implementation not found
    this.transport.on('implementation:missing',
      this.handleImplementationMissing, this);

    return this;
  }
});


return WSConnector;


});