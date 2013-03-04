
// SKM WebSocket implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable',
  'skm/util/Timer',
  'skm/net/WSNativeWrapper',
  'skm/net/WSHandler'],
  function(SKMObject, SKMLogger, Subscribable,
    SKMTimer, WSNativeWrapper, WSHandler)
{
'use strict';


var Logger = SKMLogger.create();


var WebsocketStates = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
};


var iDevice = function() {
  return typeof navigator !== 'undefined'
    && /iPad|iPhone|iPod/i.test(navigator.userAgent);
}


var HandlerEventDelegates = {
  _attachConnectionEvents: function() {
    var connection = this._connectionHandler;

    /**
     * Connecting handlers
     */
    
    // Connecting timeout triggered
    connection.on('connecting:timeout', function() {
      this._startReconnecting();
      this.fire('connecting:timeout');
    }, this);

    // A connecting attempt stopped
    connection.on('connecting:stopped', function() {
      this.fire('connecting:stopped');
    }, this);

    // One reconnecting cycle started
    connection.on('reconnecting:started', function() {
      this._startConnecting();
      this.fire('reconnecting:started');
    }, this);

    // When maximum reconnecting attempts reached
    connection.on('reconnecting:stopped', function() {
      this._stopConnecting();
      this.fire('reconnecting:stopped');
    }, this);

    /**
     * Link handlers
     */

    connection.on('link:opened', function() {
      this.fire('link:opened');
    }, this)
    .on('link:closed', function(evt) {
      this._stopConnecting();
      this.fire('link:closed', evt);
    }, this);

    /**
     * Message and pong listeners
     */

    connection.on('message', function(message) {
      this.fire('message', message);
    }, this)
    .on('server:pong', function() {
      this.fire('server:pong');
    }, this);


    /**
     * Error handler
     */

    connection.on('error', function() {
      this.fire('error');
    }, this);
  }
}


var WSWrapper = SKMObject.extend(Subscribable, HandlerEventDelegates, {
  /**
   * URL of the WebSocket server
   * @type {String}
   */
  url: null,

  /**
   * TBD
   * @type {Array}
   */
  protocols: null,

  /**
   * How long before aborting the connection attempt
   */
  timeout: 1500,

  /**
   * Amount of time, before trying to reconnect
   */
  reconnectDelay: 3000,

  /**
   * The number of times will attempt to reconnect
   */
  reconnectAttempts: 1,

  /**
   * If will try to ping the server or not
   */
  pingServer: true,

  /**
   * The interval at which will send pings to the server
   */
  pingInterval: 10 * 1000, // 10 seconds

  /**
   * Similar to Socket.IO's "sync disconnect on unload"
   * @todo add actual implementation
   * @type {Boolean}
   */
  syncDisconnectOnUnload: true,

  /**
   * The native wrapper implementation object
   * @type {WSNativeWrapper}
   * @private
   */
  _nativeWrapper: null,

  /**
   * Event handler/delegate object
   * @type {WSHandler}
   * @private
   */
  _connectionHandler: null,

  _timerPing: null,

  initialize: function() {
    Logger.debug('%cnew WSWrapper', 'color:#A2A2A2');
    this._timerPing = Timer.create({ tickInterval: this.pingInterval, ticks: 0 })
      .on('tick', this.ping, this);
    this._initNativeWrapper();
    this._initConnectionHandler();
  },

  /**
   * Public
   */

  connect: function() {
    if ( this.isOpened() ) {
      Logger.error('WebSocket already open.');
      return false;
    }
    if ( this.isReconnecting() ) {
      Logger.error('WebSocket already trying to reconnect.');
      return false;
    }
    this._startConnecting();
    return this;
  },

  disconnect: function() {
    Logger.info('WebSocket disconnect.');
    this._stopConnecting();
  },

  send: function(message) {
    var socketObject = this._nativeWrapper.getSocketObject();
    // If the socket is not ready or not created yet
    if ( socketObject === null || !this.isOpened() ) {
      Logger.info('Unable to send message; invalid socket ' +
                  'wrapper state or connection not yet opened.');
      return;
    }
    // Wrap inside a timeout if iDevice browser detected
    if ( iDevice ) {
      setTimeout(function() {
        socketObject.send(message);
      }, 0);
    } else {
      socketObject.send(message);
    }
    return this;
  },

  /**
   * @todo Refactor conditions
   */
  ping: function() {
    if ( ! this.isOpened() ) {
      Logger.info('Cannot ping server. WebSocket connection is closed.');
      this._timerPing.stop();
      return false;
    }
    this.send('ping');
    return this;
  },

  /**
   * Queries
   */

  isConnecting: function() {
    return this._nativeWrapper.getConnectionState() === 0;
  },

  isOpened: function() {
    return this._nativeWrapper.getConnectionState() === 1;
  },

  isClosing: function() {
    return this._nativeWrapper.getConnectionState() === 2;
  },

  isClosed: function() {
    return this._nativeWrapper.getConnectionState() === 3;
  },

  isReconnecting: function() {
    return this._connectionHandler.isReconnecting();
  },

  /**
   * Private
   */
  
  _startConnecting: function() {
    var socket = this._nativeWrapper.createSocket(this.url, this.protocols);
    if ( socket == null )
      this.fire('implementation:missing')._stopConnecting();
    else
      this._connectionHandler.attachListenersTo(socket)
          .startConnectingAttempt();
  },

  _stopConnecting: function() {
    this._connectionHandler.stopConnectingAttempt();
    this._nativeWrapper.destroySocket();
  },

  _startReconnecting: function() {
    this._connectionHandler.holdConnectingAttempt();
    this._nativeWrapper.destroySocket();
  },

  _initPingTimer: function() {
    if ( !this.pingServer )
      return false;
    // if timer is not enable, only then try to (re)start it
    if ( !this._timerPing.enabled ) {
      Logger.info('Ping started.');
      this._timerPing.start();
    }
  },

  _initNativeWrapper: function(url, protocols) {
    this._nativeWrapper = WSNativeWrapper.create();
  },

  _initConnectionHandler: function() {
    this._connectionHandler = WSHandler.create({
      connectionTimeout: this.timeout,
      reconnectDelay: this.reconnectDelay,
      maxReconnectAttempts: this.reconnectAttempts
    });
    // Disconnect and auto reconnect bindings
    this._attachConnectionEvents();
  }
});


return WSWrapper;


});
