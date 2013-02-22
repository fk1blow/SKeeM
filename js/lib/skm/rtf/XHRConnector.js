
// RTF XHR Connector implementation

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
 * [XHRConnector description]
 * @type {[type]}
 */
var XHRConnector = AbstractConnector.extend({
  initialize: function() {
    Logger.debug('%cnew XHRConnector', 'color:#A2A2A2');
    this.addTransportListeners();
  },

  beginUpdate: function() {
    Logger.debug('XHRConnector.beginUpdate');
    this.transport.send();
    return this;
  },

  endUpdate: function() {
    Logger.debug('XHRConnector.endUpdate');
    this.transport.disconnect();
    return this;
  },

  addTransportListeners: function() {
    // this.transport
      // .on('disconnected', this.handleDisconnected, this)
      // .on('reconnecting:stopped', this.handleReconnectingStopped, this);
    return this;
  },

  removeTransportListeners: function() {
    this.transport.off();
    return this;
  }
});


return XHRConnector;


});