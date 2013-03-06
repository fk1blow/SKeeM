
// RTF WebSocket Connector implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/rtf/BaseConnector'],
  function(SKMObject, SKMLogger, BaseConnector)
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
var WebSocketConnector = BaseConnector.extend({
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
      .on('link:closed', this.hanleLinkClosed, this)
      .on('message', this.handleUpdateMessage, this);

    this.transport
      .on('reconnecting:stopped', this.handleReconnectingStopped, this)
      .on('implementation:missing', this.handleReconnectingStopped, this);

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
    Logger.info('WebSocketConnector.handleUpdateMessage');
    this.fire('api:update', message);
  },
  
  handleReconnectingStopped: function() {
    Logger.info('WebSocketConnector.handleReconnectingStopped');
    this.fire('connector:deactivated');
  },
  
  /**
   * Handles ws connector link:closed
   *
   * @description if server api closes the link, it sends a message
   * describing the reason for the close.
   * Usually, the server api will close the link because of a problem
   * involving protocols or for network issues.
   * Anything else is not interpreted!
   * 
   * @param  {Object} message JSON message sent by rtf server api
   */
  hanleLinkClosed: function(message) {
    var reason;
    Logger.info('WebSocketConnector.hanleLinkClosed');
    if ( message ) {
      reason = jQuery.parseJSON(message.reason);
      if ( reason.error )
        this.fire('api:error', reason.error);
    }
  }
});


return WebSocketConnector;


});