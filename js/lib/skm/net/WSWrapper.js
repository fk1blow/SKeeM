
// WebSocket wrapper

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable',
  'skm/util/Timer',
  'skm/net/WSHandler'],
  function(SKMObject, SKMLogger, Subscribable,
    SKMTimer, WSHandler)
{
'use strict';


var Logger = SKMLogger.create();


var WebsocketStates = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
};


var NoNativeImplementation = 'No native WebSocket implementation found;'
+ ' WebSocket not available!';


var iDevice = function() {
  return typeof navigator !== 'undefined'
    && /iPad|iPhone|iPod/i.test(navigator.userAgent);
}


var EventsDelegates = {
  _attachConnectionEvents: function() {
    var connection = this._connectionHandler;

    /**
     * Connecting handlers
     */
    
    // Connecting timeout triggered
    connection.on('connecting:timeout', function() {
      // @todo move reconnect feature to WSConnector
      /*this._startReconnecting();*/
      
      // debugger;
      
      this._stopConnecting();
      this.fire('connecting:timeout');

    }, this);

    // A connecting attempt stopped
    connection.on('connecting:stopped', function() {
      this.fire('connecting:stopped');
    }, this);

    // @todo move reconnect feature to WSConnector
    // One reconnecting cycle started
    /*connection.on('reconnecting:started', function() {
      this._startConnecting();
      this.fire('reconnecting:started');
    }, this);*/

    // @todo move reconnect feature to WSConnector
    // When maximum reconnecting attempts reached
    /*connection.on('reconnecting:stopped', function() {
      this._stopConnecting();
      this.fire('reconnecting:stopped');
    }, this);*/

    /**
     * Link handlers
     */

    connection.on('link:opened', function() {
      this.fire('link:opened');
      this._initPingTimer();
    }, this)
    .on('link:closed', function(evt) {
      this._stopConnecting();
      this.fire('link:closed', evt);
    }, this)
    .on('link:interrupted', function(evt) {
      this.fire('link:interrupted', evt);
    }, this);

    /**
     * Message and pong listeners
     */

    connection.on('message', function(message) {
      if ( message == 'pong' )
        Logger.debug('%cWSWrapper : pong', 'color:blue');
      else
        this.fire('message', message);
    }, this);


    /**
     * Error handler
     */

    // @todo remove
    // this event is already being handled by more complex and concrete
    // handlers like disconnected, auto-disconnected, timeout, etc
    /*connection.on('error', function() {
      this.fire('error');
    }, this);*/
  }
};


var WSWrapper = SKMObject.extend(Subscribable, EventsDelegates, {
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
   * Represents the native WebSocket instance 
   * @type {WebSocket}
   */
  _nativeSocket: null,

  /**
   * Event handler/delegate object
   * @type {WSHandler}
   */
  _connectionHandler: null,

  _timerPing: null,

  initialize: function() {
    Logger.debug('%cnew WSWrapper', 'color:#A2A2A2');
    this._timerPing = Timer.create({ tickInterval: this.pingInterval, ticks: 0 });
    this._timerPing.on('tick', this.ping, this);
    this._nativeSocket = null;
    this._initConnectionHandler();
  },

  /**
   * Public
   */

  connect: function() {
    if ( this.getConnectionState() == 1 ) {
      Logger.error('WSWrapper.connect : ws already open.');
      return false;
    }
    // @todo move reconnect feature to WSConnector
    /*if ( this.isReconnecting() ) {
      Logger.error('WSWrapper.connect : ws already trying to reconnect.');
      return false;
    }*/
    this._startConnecting();
    return this;
  },

  disconnect: function() {
    this._stopConnecting();
    return true;
  },

  send: function(message) {
    var socketObject = this._nativeSocket;
    
    // @todo remove below condition
    // If the socket is not ready or not created yet
    /*if ( socketObject === null || !this.isOpened() ) {
      Logger.info('WSWrapper.send : unable to send message; invalid'
        + ' wrapper state or connection not yet opened.');
      return;
    }*/

    // if is opened
    if ( this.getConnectionState() == 1 ) {
      if ( iDevice ) {// Wrap inside a timeout if iDevice browser detected
        setTimeout(function() {
          socketObject.send(message);
        }, 0);
      } else {
        socketObject.send(message);
      }
    }
    return this;
  },

  // @todo move/remove ping from WSWrapper
  ping: function() {
    if ( ! this.isOpened() ) {
      Logger.info('WSWrapper.ping : cannot ping server or'
        + ' connection is closed. Stopping ping timer.');
      this._timerPing.stop();
      return false;
    }
    Logger.debug('%cWSWrapper : ping', 'color:green');
    this.send('ping');
    return this;
  },

  /**
   * Queries
   */
  
  getConnectionState: function() {
    if ( this._nativeSocket )
      return this._nativeSocket.readyState;
    return null;
  },

  // @todo remove all these methods except [getConnectionState]
  /*isConnecting: function() {
    return this.getConnectionState() === 0;
  },

  isOpened: function() {
    return this.getConnectionState() === 1;
  },

  isClosing: function() {
    return this.getConnectionState() === 2;
  },

  isClosed: function() {
    return this.getConnectionState() === 3;
  },*/

  /*isReconnecting: function() {
    return this._connectionHandler.isReconnecting();
  },*/

  /**
   * Private
   */
  
  _startConnecting: function() {
    var socket = this._createNativeSocket(this.url, this.protocols);
    if ( socket == null )
      this.fire('implementation:missing')._stopConnecting();
    else {
      this._connectionHandler.attachListenersTo(socket).startConnectingAttempt();
    }
  },

  _stopConnecting: function() {
    this._connectionHandler.stopConnectingAttempt();
    this._destroyNativeSocket();
  },

  // @todo move reconnect feature to WSConnector
  /*_startReconnecting: function() {
    this._connectionHandler.holdConnectingAttempt();
    this._destroyNativeSocket();
  },*/

  _initPingTimer: function() {
    if ( !this.pingServer )
      return false;
    // if timer is not enabled, only then try to (re)start it
    if ( !this._timerPing.enabled ) {
      Logger.info('Ping started.');
      this._timerPing.start();
    }
  },

  _getProperNativeConstructor: function() {
    var c = null;
    if ('WebSocket' in window)
      c = WebSocket;
    else if ('MozWebSocket' in window)
      c = MozWebSocket;
    return c;
  },

  _createNativeSocket: function(url, protocols) {
    var ctor = null
    // if no url given, throw error
    if ( !arguments.length ) {
      throw new TypeError(ErrorMessages.MISSSING_URL);
    }
    // check the designated constructor
    ctor = this._getProperNativeConstructor();
    if ( ctor === null ) {
      Logger.debug('%cWSWrapper._createNativeSocket : '
        + NoNativeImplementation, 'red');
    }
    // If no native implementation found, return null
    if ( ctor == null )
      return ctor;
    // assign the native socket and return it
    this._nativeSocket = (protocols) ? new ctor(url, protocols) : new ctor(url);
    return this._nativeSocket;
  },

  _destroyNativeSocket: function() {
    if ( !this._nativeSocket )
      return false;
    this._nativeSocket.close();
    this._nativeSocket = null;
    return true;
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