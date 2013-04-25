
// SKM WebSocketHandler implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable',
  'skm/util/Timer'], function(SKMObject, SKMLogger, Subscribable, SKMTimer)
{
'use strict';

  
var Logger = SKMLogger.create();


/**
 * Object that handle a WebSocket connection's events and state
 */
var WSDelegates = SKMObject.extend(Subscribable, {
  connectionTimeout: 1500,

  reconnectDelay: 3000,

  maxReconnectAttempts: 5,

  _timerAutoDisconnect: null,

  _timerAutoReconnect: null,

  _reconnectionAttempt: 0,

  _closeExpected: false,

  _isReconnecting: false,

  _linkWasOpened: false,

  initialize: function() {
    Logger.debug('%cnew WSDelegates', 'color:#A2A2A2');
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
    connection.onerror = function() {
      that.handleOnError.apply(that, arguments);
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
  
  
  isReconnecting: function() {
    return this._isReconnecting;
  },

  startConnectingAttempt: function() {
    Logger.info('WSDelegates.startConnectingAttempt');
    this._timerAutoDisconnect.start();
    this._closeExpected = false;
    return this;
  },

  stopConnectingAttempt: function() {
    Logger.info('WSDelegates.stopConnectingAttempt');
    this._timerAutoDisconnect.stop();
    this._closeExpected = true;
    return this;
  },

  /*
    Handlers
   */


  handleOnClose: function(event) {
    Logger.info('WSDelegates.handleOnClose');
    Logger.debug('WSDelegates : event state : ', 'wasClean:', event.wasClean,
      ' code:', event.code, ' reason:', event.reason);

    // stop all timers
    this._timerAutoDisconnect.stop();

    // If the socket connection is closed by the server
    if ( event.wasClean ) {
      this._isReconnecting = false;
      this.fire('link:closed', event);
    } else {
      // manually closed by the user, no need to trigger events
      if ( this._closeExpected ) {
        Logger.debug('WSDelegates : close expected or manually invoked');
        this._isReconnecting = false;
      }
      // if has been opened before
      else if ( this._linkWasOpened ) {
        this.fire('link:interrupted');
      }
      else {
        this.fire('connecting:stopped');
      }
    }
    
    this._linkWasOpened = false;
    this._closeExpected = false;
  },

  handleOnOpen: function() {
    Logger.info('WSDelegates.handleOnOpen');
    this._timerAutoDisconnect.stop();
    this._reconnectionAttempt = 0;
    this._linkWasOpened = true;
    this.fire('link:opened');
  },

  handleOnError: function(event) {
    this.fire('error', event);
  },
 
  handleOnMessage: function(message) {
    var data = message.data;
    switch( data ) {
      case 'server:pong':
        this.fire('server:pong');
        break;
      // case 'server:close':
      //   this.fire('server:close');
      //   break;
      default:
        this.fire('message', data);
    }
  },
  
  _handleAutoDisconnect: function() {
    Logger.debug('WSDelegates : auto-disconnect triggered after:',
      this._timerAutoDisconnect.tickInterval + ' ms');
    this.fire('connecting:timeout');
  }
});


return WSDelegates;


});