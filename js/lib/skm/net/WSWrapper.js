
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

  stopConnectingAttempt: function(expected) {
    this._timerAutoDisconnect.stop();
    this._closeExpected = expected || false;
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
    // or it's aborted manually by the user
    if ( event.wasClean ) {
      Logger.debug('NativeWebSocketHandler : link closed');
      this.fire('link:closed', event.reason);
    }
    // if manually closed during the connecting attempt
    else if ( this._closeExpected ) {
      Logger.debug('NativeWebSocketHandler : connecting manually aborted during attempt');
      this.fire('connecting:aborted');
    }
    // default case, where no manual close or server close has been triggered
    else  {
      // if has been opened before
      if ( this._linkWasOpened ) {
        Logger.debug('NativeWebSocketHandler : connection interrupted');
        this.fire('link:interrupted');
      }
      // default case
      else {
        Logger.debug('NativeWebSocketHandler : connecting stopped/ended');
        this.fire('connecting:ended');
      }
    }

    this._linkWasOpened = false;
    this._closeExpected = false;
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
        // @todo change trigger to "pong"
        this.fire('server:pong');
        break;
      default:
        this.fire('message', data);
    }
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
    this._abortConnecting({ expected: true });
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
      this._abortConnecting({ expected: true });
    } else {
      this._connectionHandler.attachListenersTo(this._nativeSocket)
        .startConnectingAttempt();
      this.fire('connecting:started');
    }
  },

  _abortConnecting: function(options) {
    Logger.debug('WSWrapper : abort websocket connecting...');
    var opt = options || {};
    
    // only stop if the connection is not already closed
    if ( this.getConnectionState() != 3 ) {
      this._connectionHandler.stopConnectingAttempt(opt.expected);
    }
    // destroy the native socket instance
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
    });
    this._attachConnectionEvents();
  },

  _attachConnectionEvents: function() {
    var connection = this._connectionHandler;

    // Connecting timeout triggered
    connection.on('connecting:timeout', function() {
      this._abortConnecting({ expected: false });
      this.fire('connecting:timeout');
    }, this);

    // Don't attempt to call [_stopConnecting] because this is already
    // called when the close event of the native websocket has been triggered
    connection.on('connecting:ended', function() {
      this.fire('connecting:ended');
    }, this)
    .on('connecting:aborted', function() {
      this.fire('connecting:aborted');
    }, this);


    // As well, link:closed/interrupted already will have been trigger
    // the close events on the native websocket object
    connection.on('link:opened', function() {
      this.fire('link:opened');
      this._initPingTimer();
    }, this)
    .on('link:closed', function(evt) {
      this.fire('link:closed', evt);
    }, this)
    .on('link:interrupted', function(evt) {
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