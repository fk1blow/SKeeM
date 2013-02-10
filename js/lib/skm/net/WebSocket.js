// SKM WebSocket implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Observable',
  'skm/util/Timer',
  'skm/net/WebSocketWrapper',
  'skm/net/WebSocketHandler'],
  function(SKMObject, SKMLogger, SKMObservable,
    SKMTimer, WSWrapper, WSHandler)
{
'use strict';


var Logger = SKMLogger.create();


var WebsocketStates = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
};


var WebSocket = SKMObject.extend(SKMObservable, {
  url: null,

  protocols: null,

  /**
   * How long before aborting the connection attempt
   */
  connectTimeout: 1500,

  /**
   * Amount of time, before trying to reconnect
   */
  reconnectDelay: 3000,

  /**
   * The number of times will attempt to reconnect
   */
  reconnectAttempts: 5,

  /**
   * If will try to ping the server or not
   */
  pingServer: true,

  /**
   * The interval at which will send pings to the server
   */
  pingInterval: 10000, // 10 seconds

  /**
   * Similar to Socket.IO's "sync disconnect on unload"
   * @todo add actual implementation
   * @type {Boolean}
   */
  syncDisconnectOnUnload: true,

  /**
   * The native wrapper implementation object
   * @type {WSWrapper}
   * @private
   */
  _nativeWrapper: null,

  /**
   * Event handler/delegate object
   * @type {WSHandler}
 * @private
   */
  _eventHandler: null,

  _timerPing: null,

  initialize: function() {
    Logger.debug('%cnew WebSocket', 'color:#A2A2A2');
    this._timerPing = Timer.create({ tickInterval: this.pingInterval, ticks: 0 })
      .on('tick', this.ping, this);
    this._initNativeWrapper();
    this._initEventHandler();
  },

  /**
   * Public
   */

  connect: function() {
    Logger.debug('WebSocket connect.');
    if ( this.isOpened() ) {
      Logger.error('WebSocket already open.');
      return false;
    }
    if ( this.isReconnecting() ) {
      Logger.error('WebSocket already trying to reconnect.');
      return false;
    }
    this._stopAndRestart();
  },

  disconnect: function() {
    Logger.debug('WebSocket disconnect.');
    this._stopAndClose();
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
    // 
    // setTimeout(function() {
    //   socketObject.send(message);
    // }, 0);
    socketObject.send(message);
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
    Logger.info('Pinging server...');
    this.send('ping');
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
    return this._eventHandler.isReconnecting();
  },

  /**
   * Private
   */
  
  _stopAndClose: function() {
    this._timerPing.stop();
    this._eventHandler.stopTimers();
    this._eventHandler.shouldExpectClose(true);
    this._nativeWrapper.destroySocket();
  },
  
  _stopAndRestart: function() {
    this._eventHandler.stopTimers();
    this._eventHandler.shouldExpectClose(false);
    this._createAndBindWrapper();
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
    this._nativeWrapper = WSWrapper.create();
  },

  _initEventHandler: function() {
    this._eventHandler = WSHandler.create({
      connectionTimeout: this.connectTimeout,
      autoReconnectDelay: this.reconnectDelay,
      maxReconnectAttempts: this.reconnectAttempts
    });
    // Disconnect and auto reconnect bindings
    this._addHandlerConnectionEvents();
  },

  _handleCloseByServer: function() {
    this._stopAndClose();
    this.fire('server:disconnected');
  },

  _addHandlerConnectionEvents: function() {
    this._eventHandler.on('autodisconnect', function() {
        this._nativeWrapper.destroySocket();
      }, this)
      .on('autoreconnect', function() {
        this._createAndBindWrapper();
      }, this)
      .on('open', function() {
        this._initPingTimer();
        this.fire('open');
      }, this)
      .on('close', function() {
        this._handleCloseByServer();
      }, this)
      .on('pong', function() {
        this.fire('received:pong');
      }, this)
      .on('message', function(message) {
        this.fire('received:message', message);
      }, this);
  },

  _createAndBindWrapper: function() {
    this._nativeWrapper.createSocket(this.url, this.protocols);
    this._eventHandler.addEventHandlers(this._nativeWrapper._socket);
    this._eventHandler.restartAutodisconnectTimer();
  }
});


return WebSocket;


});
