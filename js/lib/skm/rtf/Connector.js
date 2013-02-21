
// RTF Connector implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable',
  'skm/rtf/AbstractConnector'],
  function(SKMObject, SKMLogger, Subscribable, AbstractConnector)
{
'use strict';


var Logger = SKMLogger.create();


var ConnectorErrors = {
  INACTIVE: 'Innactive connection',
  LIST_TO_BIG: 'Confirmation Message Sent list is too big',
  READY_LIST_TO_BIG: 'Ready To send Message list is too big'
}


/**
 * [WSConnector description]
 * @type {[type]}
 */
var WebSocketConnector = AbstractConnector.extend({
	initialize: function() {
		Logger.debug('%cnew WebSocketConnector', 'color:#A2A2A2');
    this.addTransportListeners();
	},

  beginUpdate: function() {
    Logger.debug('WebSocketConnector.beginUpdate');
    this.transport.connect();
    return this;
  },

  endUpdate: function() {
    Logger.debug('WebSocketConnector.endUpdate');
    this.transport.disconnect();
    return this;
  },

  addTransportListeners: function() {
    this.transport
      .on('disconnected', this.handleDisconnected, this)
      .on('reconnecting:stopped', this.handleReconnectingStopped, this);
    return this;
  },

  removeTransportListeners: function() {
    this.transport.off();
    return this;
  },

  /**
   * Handlers
   */
  
  handleReconnectingStopped: function() {
    Logger.debug('WebSocketConnector.handleReconnectingStopped');
    this.fire('connector:switch');
  },
  
  handleDisconnected: function(message) {
    var error, reason = jQuery.parseJSON(message.reason);
    Logger.debug('WebSocketConnector.handleDisconnected');
    if ( error = reason.error )
      this._handleParametersErrors(reason.error);
  },

  _handleParametersErrors: function(errorArr) {
    var idx, err = errorArr;
    if ( (idx = err.indexOf(ConnectorErrors.INACTIVE)) > -1 ) {
      cl('WebSocketConnector.handleErrors : connection inactive; ', err[idx])
    }
    if ( (idx = err.indexOf(ConnectorErrors.LIST_TO_BIG)) > -1 ) {
      cl('WebSocketConnector.handleErrors : confirmation list to big;', err[idx])
    }
    if ( (idx = err.indexOf(ConnectorErrors.READY_LIST_TO_BIG)) > -1 ) {
      cl('WebSocketConnector.handleErrors : ready message list to big;', err[idx])
    }
    this.transport.disconnect();
    this.fire('server:params:error');
  }
});


/**
 * [XHRConnector description]
 * @type {[type]}
 */
var AjaxConnector = AbstractConnector.extend({
	initialize: function() {
		Logger.debug('%cnew AjaxConnector', 'color:#A2A2A2');
	}
});


return {
	XHR: AjaxConnector,
	WS: WebSocketConnector
};


});