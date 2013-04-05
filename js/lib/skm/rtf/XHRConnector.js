
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
  _typeName: 'XHR',

  beginUpdate: function(options) {
    var opt = options || {}, paramMessage = null;
    this.buildTransportUrl();
    Logger.debug('XHRConnector.beginUpdate\n', this.transport.url);
    
    if ( opt.channelsParamsDelegate ) {
      paramMessage = opt.channelsParamsDelegate.parameterizeForXHR();
      Logger.debug('%csending parameters', 'color:red', paramMessage);
    }

    this.sendMessage(paramMessage);
    return this;
  },

  endUpdate: function() {
    Logger.debug('XHRConnector.endUpdate');
    // disconnect and remove events
    this.transport.abortRequest();
    // this.removeTransportListeners();
    return this;
  },

  addTransportListeners: function() {
    this.transport
      .on('error', this.handleError, this)
      .on('success', this.handleReceivedMessage, this);
    return this;
  },


  /*
    Message senders
   */
  

  sendSubscribeRequest: function(subscribeName, subscribeParams) {
    var json = {};
    json[subscribeName] = subscribeParams;
    var subscribeParamsAsStr = JSON.stringify(json).replace(/\"|\'/g, '');

    this.transport.sendMessage(subscribeParamsAsStr);
  },

  sendMessage: function(message) {
    Logger.debug('%cXHRConnector.sendMessage : ', 'color:red', message);
    this.transport.sendMessage(message);
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
    Logger.info('XHRConnector.handleReceivedMessage');
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
      this.fire('transport:deactivated');
    }
  }
});


return XHRConnector;


});