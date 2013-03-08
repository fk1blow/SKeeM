
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


var WebSocketConnector = BaseConnector.extend({
  initialize: function() {
    Logger.debug('%cnew WebSocketConnector', 'color:#A2A2A2');
    // this.addTransportListeners();
  },

  addTransport: function(transportObject) {
    this.transport = transportObject;
    this.addTransportListeners();
  },

  beginUpdate: function() {
    Logger.debug('WebSocketConnector.beginUpdate');
    this.transport.connect();
    return this;
  },

  endUpdate: function() {
    Logger.debug('WebSocketConnector.endUpdate');
    // disconnect and remove events
    this.transport.disconnect();
    this.transport.off();
    return this;
  },

  addTransportListeners: function() {
    // connection dropped
    this.transport.on('link:closed', this.hanleLinkClosed, this);
    // handles connection message event - rtf server api update
    this.transport.on('message', this.handleMessage, this);
    // unable to connect through provided transport(various reasons)
    this.transport
      .on('reconnecting:stopped', this.handleReconnectingStopped, this)
      .on('implementation:missing', this.handleReconnectingStopped, this);
    return this;
  },

  removeTransportListeners: function() {
    this.transport.off();
    return this;
  },


  /*
    Message senders
   */


  sendBatchId: function(paramCollection) {
    var batchId = paramCollection.getParamByName('batchId');
    Logger.debug('WebSocketConnector.sendBachtId', batchId);
    this.transport.send('batchId{' + batchId + '}');
  },

  sendNewSubscription: function(name, subscription) {
    cl('sendNewSubscription')
  },

  
  /*
    Handlers
  */
  

  /**
   * Handles a message received from server api
   *
   * @description handles the server's update message
   * and passes it to the subscribers/clients of rtf api
   * 
   * @param  {Object} message JSON message send by rtf server api
   */
  handleMessage: function(message) {
    Logger.info('WebSocketConnector.handleMessage');
    this.fire('api:update', JSON.parse(message));
  },
  
  /**
   * Handles ws re/connection attempt
   *
   * @description handles the event where a connection
   * is being closed after a reconnecting attempt or the
   * transport cannot be initialized.
   * After this, usually, the connector manager should 
   * swtich to the next available connector, if any.
   */
  handleReconnectingStopped: function() {
    Logger.info('WebSocketConnector.handleReconnectingStopped');
    this.fire('connector:deactivated');
  },
  
  /**
   * Handles ws link:closed
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