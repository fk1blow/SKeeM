
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
  _typeName: 'WebSocket',

  beginUpdate: function(options) {
    var opt = options || {}, paramMessage = null;
    this.buildTransportUrl();
    Logger.debug('WSConnector.beginUpdate \n', this.transport.url);

    if ( opt.initialParameters ) {
      // paramMessage = this.parameterizeForWS(opt.initialParameters);
      paramMessage = opt.initialParameters;
      // after link established, build the parameter object
      // and send it through the transport
      this.transport.on('link:opened', function() {
        Logger.debug('%csending parameters', 'color:red', paramMessage);
        this.send(paramMessage);
      });
    }

    this.transport.connect();
    return this;
  },

  endUpdate: function() {
    Logger.debug('WSConnector.endUpdate');
    // disconnect and remove events
    this.transport.disconnect();
    return this;
  },

  /*
    - define the list of events that a connector can trigger
    - for ex, if the link is being interrupted, make sure you notify the manager
    that an error has ocured - this error will be sent to the widget
  */
  addTransportListeners: function() {
    // connection dropped by server
    this.transport.on('link:closed', this.hanleLinkClosed, this);
    // handles connection message event - rtf server api update
    this.transport.on('message', this.handleReceivedMessage, this);
    // unable to connect through provided transport(various reasons)
    this.transport.on('link:interrupted', this.handleReconnectingStopped, this);
    this.transport.on('reconnecting:stopped implementation:missing',
      this.handleReconnectingStopped, this);
    return this;
  },


  /*
    Message senders
   */
  

  /**
   * [sendMessage description]
   * 
   * @param  {String} messageKey   [description]
   */
  sendMessage: function(message) {
    Logger.debug('%cWSConnector.sendMessage : ', 'color:red', message);
    this.transport.send(message);
  },

  /*sendParameters: function(parametersList) {
    this.sendMessage(this.parameterizeForWS(parametersList));
  },*/

  
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
    // Logger.info('WSConnector.handleReceivedMessage');
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
    Logger.info('WSConnector.handleReconnectingStopped');
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
    Logger.info('WSConnector.hanleLinkClosed');
    // if the message is string you got an exception, thats baaad!!!
    if ( message ) {
      this.fire('api:error', message);
    }
    this.fire('api:error');
  }
});


return WebSocketConnector;


});