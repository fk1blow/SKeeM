
// RTF XHR Connector implementation

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


var XHRConnector = BaseConnector.extend({
  initialize: function() {
    Logger.debug('%cnew XHRConnector', 'color:#A2A2A2');
    // this.addTransportListeners();
  },

  addTransport: function(transportObject) {
    this.transport = transportObject;
    this.addTransportListeners();
  },

  beginUpdate: function() {
    Logger.debug('XHRConnector.beginUpdate');
    this.transport.sendMessage();
    return this;
  },

  endUpdate: function() {
    Logger.debug('XHRConnector.endUpdate');
    // disconnect and remove events
    this.transport.abortRequest();
    this.transport.off();
    return this;
  },

  addTransportListeners: function() {
    this.transport
      .on('error', this.handleError, this)
      .on('success', this.handleMessage, this);
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
    Logger.debug('XHRConnector.sendBachtId',
      paramCollection.getParamByName('batchId'));
    this.transport.url = this.getBaseUrl() + paramCollection.concatParams();
    this.transport.sendMessage();
  },

  sendNewSubscription: function() {
    //
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
    Logger.info('XHRConnector.handleMessage');
    this.fire('api:update', message);
  },

  /**
   * Handles xhr connection error
   *
   * @description triggered when the transport cannot
   * connect to the host url or when the server
   * closes a connection giving a reason as the "405" status code
   * 
   * @param  {[type]} err JSON message representing the reason
   */
  handleError: function(err) {
    Logger.info('XHRConnector.handleError');
    // If server triggers errors
    if ( err.status == 405 ) {
      this.fire('api:error', err.responseText);
    } else {
      this.fire('connector:deactivated');
    }
  }
});


return XHRConnector;


});