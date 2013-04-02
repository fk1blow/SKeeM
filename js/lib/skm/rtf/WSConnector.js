
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
  _typeName: 'WS',

  beginUpdate: function() {
    this.buildTransportUrl();
    Logger.debug('WebSocketConnector.beginUpdate\n', this.transport.url);
    this.transport.connect();
    return this;
  },

  endUpdate: function() {
    Logger.debug('WebSocketConnector.endUpdate');
    // disconnect and remove events
    this.transport.disconnect();
    return this;
  },

  addTransportListeners: function() {
    // connection dropped
    this.transport.on('link:closed', this.hanleLinkClosed, this);
    // handles connection message event - rtf server api update
    this.transport.on('message', this.handleReceivedMessage, this);
    // unable to connect through provided transport(various reasons)
    this.transport
      .on('reconnecting:stopped', this.handleReconnectingStopped, this)
      .on('implementation:missing', this.handleReconnectingStopped, this);
    return this;
  },


  /*
    Message senders
   */
  
  sendMessage: function(msg) {
    if ( msg && (typeof msg === 'object') )
      msg = JSON.stringify(msg);
    Logger.debug('WebSocketConnector.sendMessage : ', msg);
    this.transport.send(msg);
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
  handleReceivedMessage: function(message) {
    // Logger.info('WebSocketConnector.handleReceivedMessage');
    message = JSON.parse(message);
    this.fire('api:update', message);
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
    this.fire('transport:deactivated');
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
    if ( message ) { // if the message is string you got an exception, thats baaad!!!
        try{
            reason = JSON.parse(message.reason);// JSON.parse douchebag
        }catch(e){
            reason = message;
        }
      if ( reason )
        this.fire('api:error', reason);
    }
  }
});


return WebSocketConnector;


});