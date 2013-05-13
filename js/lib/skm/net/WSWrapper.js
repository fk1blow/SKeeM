
// WebSocket wrapper

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable',
  'skm/util/Timer'],
  function(SKMObject, SKMLogger, Subscribable,
    SKMTimer)
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
};


var getNativeConstructor = function() {
  var c = null;
  if ('WebSocket' in window)
    c = WebSocket;
  else if ('MozWebSocket' in window)
    c = MozWebSocket;
  return c;
};


var createNativeSocket = function(url, protocols) {
  var ctor = null
  // if no url given, throw error
  if ( !arguments.length ) {
    throw new TypeError(ErrorMessages.MISSSING_URL);
  }
  // check the designated constructor
  ctor = getNativeConstructor();
  if ( ctor === null ) {
    Logger.debug('%ccreateNativeSocket :', NoNativeImplementation, 'red');
  }
  // If no native implementation found, return null
  if ( ctor == null )
    return ctor;
  // assign the native socket and return it
  return (protocols) ? new ctor(url, protocols) : new ctor(url);
};


/**
 * Native WebSocket connection delegates
 */
var NativeWebSocketHandler = SKMObject.extend(Subscribable, {
  connectionTimeout: 1500,

  _timerAutoDisconnect: null,

  _closeExpected: false,

  _linkWasOpened: false,

  initialize: function() {
    // Creates auto-disconnect and reconnect, timers
    this._timerAutoDisconnect = SKMTimer.create({
      tickInterval: this.connectionTimeout
    }).on('tick', this._handleAutoDisconnect, this);
  },

  /**
   * Attaches the socket events to a handler
   * @param  {WebSoclet} connection WebSocket connection reference
   */
  attachListenersTo: function(connection) {
    var that = this;
    connection.onopen = function() {
      that.handleOnOpen.apply(that, arguments);
    }
    connection.onclose = function() {
      that.handleOnClose.apply(that, arguments);
    }
    connection.onmessage = function() {
      that.handleOnMessage.apply(that, arguments);
    }
    return this;
  },

  
  /*
    Commands
   */
  
  
  startConnectingAttempt: function() {
    this._timerAutoDisconnect.start();
    this._closeExpected = false;
    return this;
  },

  stopConnectingAttempt: function() {
    this._timerAutoDisconnect.stop();
    this._closeExpected = true;
    return this;
  },

  /*
    Handlers
   */


  handleOnClose: function(event) {
    Logger.info('NativeWebSocketHandler.handleOnClose');
    Logger.debug('event state : ', 
      'wasClean:', event.wasClean, ' code:', event.code, ' reason:', event.reason);

    // stop all timers
    this._timerAutoDisconnect.stop();

    // If the socket connection is closed by the server
    // or it's aborted by the users
    if ( event.wasClean ) {
      Logger.debug('NativeWebSocketHandler : connection closed');
      this._markAsClosed();
      this.fire('link:closed', event.reason);
    } else {
      // manually closed by the user, no need to trigger events
      // @todo remove declaration - case already covered by the [event.wasClean]
      if ( this._closeExpected ) {
        Logger.debug('NativeWebSocketHandler : close expected or manually invoked');
        this._markAsClosed();
        this.fire('connecting:aborted');
      }
      // if has been opened before
      else if ( this._linkWasOpened ) {
        Logger.debug('NativeWebSocketHandler : connection interrupted');
        this._markAsClosed();
        this.fire('link:interrupted');
      }
      else {
        Logger.debug('NativeWebSocketHandler : connection stopped');
        this._markAsClosed();
        this.fire('connecting:stopped');
      }
    }
  },

  handleOnOpen: function() {
    Logger.info('NativeWebSocketHandler.handleOnOpen');
    this._timerAutoDisconnect.stop();
    this._reconnectionAttempt = 0;
    this._linkWasOpened = true;
    this.fire('link:opened');
  },
 
  handleOnMessage: function(message) {
    var data = message.data;
    switch( data ) {
      case 'server:pong':
        this.fire('server:pong');
        break;
      default:
        this.fire('message', data);
    }
  },

  _markAsClosed: function() {
    this._linkWasOpened = false;
    this._closeExpected = false;
  },
  
  _handleAutoDisconnect: function() {
    Logger.debug('NativeWebSocketHandler : auto-disconnect triggered after:',
      this._timerAutoDisconnect.tickInterval + ' ms');
    this.fire('connecting:timeout');
  }
});


var WSWrapper = SKMObject.extend(Subscribable, {
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
    this._startConnecting();
    return this;
  },

  disconnect: function() {
    this._stopConnecting();
    return true;
  },

  send: function(message) {
    var socketObject = this._nativeSocket;
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
    if ( ! this.getConnectionState() == 1 ) {
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

  /**
   * Private
   */
  
  _startConnecting: function() {
    this._nativeSocket = createNativeSocket(this.url, this.protocols);
    if ( this._nativeSocket == null ) {
      this.fire('implementation:missing');
      this._stopConnecting();
    } else {
      this._connectionHandler.attachListenersTo(this._nativeSocket)
        .startConnectingAttempt();
    }
  },

  _stopConnecting: function() {
    Logger.debug('WSWrapper : stop websocket connecting...');
    // only stop if the connection is not closed
    if ( this.getConnectionState() != 3 )
      this._connectionHandler.stopConnectingAttempt();
    this._destroyNativeSocket();
  },

  _initPingTimer: function() {
    if ( !this.pingServer )
      return false;
    // if timer is not enabled, only then try to (re)start it
    if ( !this._timerPing.enabled ) {
      Logger.info('Ping started.');
      this._timerPing.start();
    }
  },

  /**
   * Closes the socket and nullifies the variable reference
   *
   * @description
   */
  _destroyNativeSocket: function() {
    if ( this._nativeSocket ) {
      Logger.debug('WSWrapper : closing native websocket object');
      this._nativeSocket.close();
      this._nativeSocket = null;
    }
    return true;
  },

  _initConnectionHandler: function() {
    this._connectionHandler = NativeWebSocketHandler.create({
      connectionTimeout: this.timeout
      // reconnectDelay: this.reconnectDelay,
      // maxReconnectAttempts: this.reconnectAttempts
    });
    // Disconnect and auto reconnect bindings
    this._attachConnectionEvents();
  },

  _attachConnectionEvents: function() {
    var connection = this._connectionHandler;

    // connection.on('all', function() { cl('connection > ', arguments) });


    // Connecting timeout triggered
    connection.on('connecting:timeout', function() {
      cl('%cconnecting:timeout', 'color:blue');
      this._stopConnecting();
      this.fire('connecting:timeout');
    }, this);

    // A connecting attempt stopped
    connection.on('connecting:stopped', function() {
      cl('%cconnecting:stopped', 'color:blue');
      // @todo remove call
      // should not close an already closed socket connection
      // this._stopConnecting();
      this.fire('connecting:stopped');
    }, this);


    // link has been established
    connection.on('link:opened', function() {
      this.fire('link:opened');
      this._initPingTimer();
    }, this)
    .on('link:closed', function(evt) {
      // @todo remove call
      // this._stopConnecting();
      // this._destroyNativeSocket();
      this.fire('link:closed', evt);
    }, this)
    .on('link:interrupted', function(evt) {
      // @todo remove call
      // this._stopConnecting();
      // this._destroyNativeSocket();
      this.fire('link:interrupted', evt);
    }, this);

    // message received from the server
    connection.on('message', function(message) {
      if ( message == 'pong' )
        Logger.debug('%cWSWrapper : pong', 'color:blue');
      else
        this.fire('message', message);
    }, this);
  }
});


return WSWrapper;


});