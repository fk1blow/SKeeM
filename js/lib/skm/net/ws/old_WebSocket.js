// SKM WebSocket implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Observable',
  'skm/util/Timer'], function(SKMObject, SKMLogger, SKMObservable, SKMTimer)
{
'use strict';


var Logger = SKMLogger.create();


var WebsocketStates = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
};


var ErrorMessages = {
  UNAVAILABLE: 'WebSockets implementation is unavailable.',
  NATIVE_IMPLEMENTATION_MISSING: 'Native implementation not found.',
  MISSSING_URL: 'The url param of the WebSocket constructor is mandatory.',
  SOCKET_ALREADY_OPENED: 'Seems that another socket is already opened.'
};


/**
 * SKM WebSocket wrapper
 */
var WebsocketWrapper = SKMObject.extend(SKMObservable, {
  url: null,

  protocols: null,

  maxReconnectAttempts: 5,

  reconnectDelay: 3000,

  autoDisconnectAfter: 1500,

  _socket: null,

  _nativeConstructor: null,

  _timerAutoDisconnect: null,

  _timerReconnect: null,

  _isReconnecting: false,

  _reconnectionAttempt: 0,

  _closeExpected: false,

  initialize: function() {
    this._socket = null;
    this._nativeConstructor = null;
    this._timerAutoDisconnect = SKMTimer.create({ tickInterval: this.autoDisconnectDelay })
      .bind('tick', this.handleAutoDisconnect, this);
    this._timerReconnect = SKMTimer.create({ tickInterval: this.reconnectDelay })
      .bind('tick', this.handleAutoReconnect, this);
  },

  /**
   * Commands
   */
  
  connect: function() {
    Logger.debug('Connect');
    if ( this.getState() === WebsocketStates ) {
      Logger.error('WebSocket already open.');
      return false;
    }
    if ( this._isReconnecting ) {
      Logger.error('WebSocket already trying to reconnect.');
      return false;
    }
    this._clearAndConnect();
  },

  disconnect: function() {
    Logger.debug('Disconnect');
    this._clearTimers();
    this._closeExpected = true;
    this._closeSocketConnection();
  },

  /**
   * Handlers
   */
  
  handleAutoDisconnect: function() {
    Logger.debug('WebSocket auto-disconnected after ' +
      this._timerAutoDisconnect.tickInterval + ' ms');
    this._closeSocketConnection();
  },
  
  handleAutoReconnect: function() {
    Logger.debug('handleAutoReconnect')
    Logger.info('Attempting to reconnect:', this._reconnectionAttempt);
    this._clearAndConnect();
  },

  handleOnClose: function(event) {
    Logger.info('WebSocket has closed : ', event);
    this._clearTimers();
    if ( this._closeExpected ) {
      Logger.info('Close expected. Nothing more to do');
      this._isReconnecting = false;
    } else {
      this._reconnectionTry();
    }
    this._closeExpected = false;
  },

  handleOnOpen: function() {
    Logger.info('WebSocket connection opened');
    this._clearTimers();
    this._reconnectionAttempt = 0;
  },

  handleOnError: function(event) {
    Logger.info('Socket error');
  },

  handleOnMessage: function(message) {
    var message = message || null;
    this.trigger('message', message);
  },

  /**
   * @todo Add queue and check the bufferdAmount
   */
  send: function(message) {
    this._socket.send(message);
  },

  /**
   * Queries
   */

  getState: function() {
    var state = null;
    if ( this._socket )
      state = this._socket.readyState;
    return state;
  },
  
  /**
   * Implementation
   */
  
  _reconnectionTry: function() {
    if ( this._reconnectionAttempt > this.maxReconnectAttempts - 1 ) {
      Logger.info('Max reconnection attempts reached');
      this._reconnectionAttempt = 0;
      this._isReconnecting = false;
    } else {
      Logger.debug('WebSocket will try to reconnect in ' + 
        this._timerReconnect.tickInterval + ' ms');
      this._isReconnecting = true;
      this._reconnectionAttempt++;
      this._timerReconnect.start();
    }
  },
  
  _clearAndConnect: function() {
    this._clearTimers();
    this._closeExpected = false;
    this._createSocketInstace();
    this._timerAutoDisconnect.start();
  },
  
  _clearTimers: function() {
    this._timerAutoDisconnect.stop();
    this._timerReconnect.stop();
  },

  _closeSocketConnection: function() {
    if ( !this._socket )
      return;
    this._socket.close();
    this._socket = null;
  },

  _getProperConstructor: function() {
    var c = null;
    if ('WebSocket' in window)
      c = WebSocket;
    else if ('MozWebSocket' in window)
      c = MozWebSocket;
    else
      c = null;
    return c;
  },

  _getNativeConstructor: function() {
    var ctor = null;
    if ( ctor = this._nativeConstructor )
      return ctor;
    ctor = this._getProperConstructor();
    if ( ctor === null )
      throw new Error(ErrorMessages.NATIVE_IMPLEMENTATION_MISSING);
    return ctor;
  },

  _createSocketInstace: function() {
    var c = this._getNativeConstructor();
    if ( this.protocols )
      this._socket = new c(this.url, this.protocols);
    else
      this._socket = new c(this.url);
    this._attachSocketEvents();
  },

  _attachSocketEvents: function() {
    var self = this;
    this._socket.onopen = function() {
      self.handleOnOpen.apply(self, arguments);
    }
    this._socket.onerror = function() {
      self.handleOnError.apply(self, arguments);
    }
    this._socket.onclose = function() {
      self.handleOnClose.apply(self, arguments);
    }
    this._socket.onmessage = function() {
      self.handleOnMessage.apply(self, arguments);
    }
  }
});


return WebsocketWrapper;


});