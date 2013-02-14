// SKM WebSocketHandler implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable',
  'skm/util/Timer'], function(SKMObject, SKMLogger, Subscribable, SKMTimer)
{
'use strict';

  
var Logger = SKMLogger.create();


var WebSocketHandler = SKMObject.extend(Subscribable, {
	connectionTimeout: 1500,

	autoReconnectDelay: 3000,

	maxReconnectAttempts: 5,

	_timerAutoDisconnect: null,

	_timerAutoReconnect: null,

	_reconnectionAttempt: 0,

	_closeExpected: false,

	_isReconnecting: false,

	initialize: function() {
		Logger.debug('%cnew WebSocketHandler', 'color:#A2A2A2');
		this._timerAutoDisconnect = SKMTimer.create({
      tickInterval: this.connectionTimeout
    }).on('tick', this._handleAutoDisconnect, this);
    this._timerAutoReconnect = SKMTimer.create({
      tickInterval: this.autoReconnectDelay
    }).on('tick', this._handleAutoReconnect, this);
	},

	addEventHandlers: function(connection) {
		var that = this;
		connection.onopen = function() {
      that._handleOnOpen.apply(that, arguments);
    }
    connection.onerror = function() {
      that._handleOnError.apply(that, arguments);
    }
    connection.onclose = function() {
      that._handleOnClose.apply(that, arguments);
    }
    connection.onmessage = function() {
      that._handleOnMessage.apply(that, arguments);
    }
	},

  /**
   * Events Handlers
   * @private
   */

	_handleAutoDisconnect: function() {
    Logger.debug('WebSocketHandler auto-disconnected after ' +
      this._timerAutoDisconnect.tickInterval + ' ms');
    this.fire('autodisconnect');
  },
  
  _handleAutoReconnect: function() {
    Logger.debug('WebSocketHandler._handleAutoReconnect; attempt #', this._reconnectionAttempt);
    this.stopTimers();
    this.shouldExpectClose(false);
    this.fire('autoreconnect');
  },

  _handleOnClose: function(event) {
    Logger.info('WebSocketHandler has closed : ', event);
    this.stopTimers();
    if ( this.isCloseExpected() ) {
      Logger.info('Close expected. Nothing more to do');
      this._isReconnecting = false;
    } else {
      this._makeReconnectAttempt();
    }
    this.shouldExpectClose(false);
  },

  _handleOnOpen: function() {
    Logger.info('WebSocketHandler connection opened');
    this.fire('open');
    this.stopTimers();
    this._reconnectionAttempt = 0;
  },

  _handleOnError: function(event) {
    Logger.info('Socket error');
    this.fire('error', event);
  },
 
  _handleOnMessage: function(message) {
    var data = message.data;
    switch( data ) {
      case 'pong':
        this.fire('pong');
        break;
      case 'close':
        this.fire('close');
        break;
      default:
        this.fire('message', data);
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

  _makeReconnectAttempt: function() {
    if ( this._reconnectionAttempt > this.maxReconnectAttempts - 1 ) {
      Logger.debug('WebSocketHandler Max reconnection attempts reached');
      this._reconnectionAttempt = 0;
      this._isReconnecting = false;
    } else {
      Logger.debug('WebSocketHandler will try to reconnect in ' + 
        this._timerAutoReconnect.tickInterval + ' ms');
      this._isReconnecting = true;
      this._reconnectionAttempt++;
      this.restartAutoreconnectTimer();
    }
  }
});


return WebSocketHandler;


});