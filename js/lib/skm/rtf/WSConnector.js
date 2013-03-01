
// RTF WebSocket Connector implementation

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
    Logger.info('WebSocketConnector.beginUpdate');
    this.transport.connect();
    return this;
  },

  endUpdate: function() {
    Logger.info('WebSocketConnector.endUpdate');
    this.transport.disconnect();
    return this;
  },

  addTransportListeners: function() {
    this.transport
      .on('link:closed', this.hanleLinkClosed, this)
      .on('reconnecting:stopped', this.handleReconnectingStopped, this)
      .on('missing:implementation', this.handleReconnectingStopped, this)
      .on('message', this.handleUpdateMessage, this);
    return this;
  },

  removeTransportListeners: function() {
    this.transport.off();
    return this;
  },

  /**
   * Handlers
   */
  
  handleUpdateMessage: function(message) {
    this.fire('message:update', message);
  },
  
  handleReconnectingStopped: function() {
    Logger.info('WebSocketConnector.handleReconnectingStopped');
    this.fire('connector:deactivated');
  },
  
  hanleLinkClosed: function(message) {
    var error, reason;
    if ( message ) {
      reason = jQuery.parseJSON(message.reason)
      Logger.info('WebSocketConnector.hanleLinkClosed');
      if ( error = reason.error )
        this._handleParametersErrors(reason.error);
    }
  },

  _handleParametersErrors: function(errorArr) {
    cl('_handleParametersErrors')
    this.fire('params:error', errorArr);
  }
});


return WebSocketConnector;


});