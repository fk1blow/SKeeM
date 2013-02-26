
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
    this.transport.sendMessage();
    return this;
  },

  endUpdate: function() {
    Logger.debug('XHRConnector.endUpdate');
    this.transport.abortRequest();
    return this;
  },

  addTransportListeners: function() {
    this.transport.on('error', this.handleError, this);
    return this;
  },

  removeTransportListeners: function() {
    this.transport.off();
    return this;
  },

  /**
   * Handlers
   */

  handleError: function(err) {
    // If server triggers errors
    if ( err.status == 405 ) {
      this.fire('params:error', err.responseText);
    } else {
      this.fire('connector:deactivated');
    }
  }
});


return XHRConnector;


});