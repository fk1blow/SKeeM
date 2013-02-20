
// SKM WebSocketHandler implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable',
  'skm/util/Timer'], function(SKMObject, SKMLogger, Subscribable, SKMTimer)
{
'use strict';

  
var Logger = SKMLogger.create();


/**
 * WebSocket Message Handler
 *
 * @description this object could be used as a Mixin
 * or as a Delegates object.
 * Or it could expose some methods that will be called
 * in the context of the WSDelegatesHandler or added
 * as a mixin Object.
 * @type {Object}
 */
var WSMessageDelegates = {
  handleOnClose: function(event) {
    Logger.info('WSMessageDelegates : socket has closed : ', event);
    this.stopTimers();
    // If server sends a close event
    if ( event.wasClean ) {
      Logger.info('WSMessageDelegates.handleOnClose : connection closed by server.');
      this._isReconnecting = false;
      this.fire('disconnected');
    } else {
      if ( this.isCloseExpected() ) {
        Logger.info('Close expected/invoked. Nothing more to do');
        // should inform the DelegatesHandler about this state change
        this._isReconnecting = false;
      } else {
        this._makeReconnectAttempt();
      }
    }
    this.shouldExpectClose(false);
  },

  handleOnOpen: function() {
    Logger.info('WSMessageDelegates connection opened');
    this.fire('connected');
    this.stopTimers();
    this._reconnectionAttempt = 0;
  },

  handleOnError: function(event) {
    Logger.info('WSMessageDelegates : Socket error');
    this.fire('error', event);
  },
 
  handleOnMessage: function(message) {
    var data = message.data;
    switch( data ) {
      case 'server:pong':
        this.fire('server:pong');
        break;
      case 'server:close':
        this.fire('server:close');
        break;
      default:
        this.fire('message', data);
    }
  }
};


/**
 * Object that handle a WebSocket connection's events and state
 */
var WSHandler = SKMObject.extend(Subscribable, WSMessageDelegates, {
  connectionTimeout: 1500,

  reconnectDelay: 3000,

  maxReconnectAttempts: 5,

  _timerAutoDisconnect: null,

  _timerAutoReconnect: null,

  _reconnectionAttempt: 0,

  _closeExpected: false,

  _isReconnecting: false,

  initialize: function() {
    Logger.debug('%cnew WSHandler', 'color:#A2A2A2');
    // Creates auto-disconnect and reconnect, timers
    this._createTimers();
  },

  /**
   * Attaches the socket events to a handler
   *
   * @param  {WebSoclet} connection WebSocket connection reference
   */
  listensToConnection: function(connection) {
    var that = this;
    connection.onopen = function() {
      that.handleOnOpen.apply(that, arguments);
    }
    connection.onerror = function() {
      that.handleOnError.apply(that, arguments);
    }
    connection.onclose = function() {
      that.handleOnClose.apply(that, arguments);
    }
    connection.onmessage = function() {
      that.handleOnMessage.apply(that, arguments);
    }
  },

  /**
   * Queries/Commands
   */
  
  isReconnecting: function() {
    return this._isReconnecting;
  },

  shouldExpectClose: function(closeExpected) {
    if ( typeof closeExpected !== 'boolean' ) {
      throw new TypeError('WebSocketHandler.shouldExpectClose : invalid' + 
        ' [closeExpected] param type. Expected boolean.');
    }
    this._closeExpected = closeExpected;
  },

  isCloseExpected: function() {
    return this._closeExpected;
  },

  stopTimers: function() {
    this._timerAutoDisconnect.stop();
    this._timerAutoReconnect.stop();
  },

  restartAutodisconnectTimer: function() {
    this._timerAutoDisconnect.start();
  },

  restartAutoreconnectTimer: function() {
    this._timerAutoReconnect.start();
  },

  /**
   * Private
   */
  
  _handleAutoDisconnect: function() {
    Logger.debug('WSHandler auto-disconnected after ' +
      this._timerAutoDisconnect.tickInterval + ' ms');
    this.fire('autodisconnect');
  },
  
  _handleAutoReconnect: function() {
    Logger.debug('WSHandler._handleAutoReconnect; attempt #', this._reconnectionAttempt);
    this.stopTimers();
    this.shouldExpectClose(false);
    this.fire('reconnecting:started');
  },
  
  _createTimers: function() {
    // Stops the connecting attempt after specified interval
    this._timerAutoDisconnect = SKMTimer.create({
      tickInterval: this.connectionTimeout
    }).on('tick', this._handleAutoDisconnect, this);
    // Tries to reconnect after a specified delay
    this._timerAutoReconnect = SKMTimer.create({
      tickInterval: this.reconnectDelay
    }).on('tick', this._handleAutoReconnect, this);
  },

  _makeReconnectAttempt: function() {
    if ( this._reconnectionAttempt > this.maxReconnectAttempts - 1 ) {
      Logger.debug('WebSocketHandler Max reconnection attempts reached');
      this._reconnectionAttempt = 0;
      this._isReconnecting = false;
      this.fire('reconnecting:stopped');
    } else {
      Logger.debug('WebSocketHandler will try to reconnect in ' + 
        this._timerAutoReconnect.tickInterval + ' ms');
      this._isReconnecting = true;
      this._reconnectionAttempt++;
      this.restartAutoreconnectTimer();
    }
  }
});


return WSHandler;


});