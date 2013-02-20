
// RTF Connector implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable'],
  function(SKMObject, SKMLogger, Subscribable)
{
'use strict';


var Logger = SKMLogger.create();


var CONNECTOR_STATE = {
  ACTIVE: 1,
  INACTIVE: 0
}


var TransportHandlers = {
  handleOnError: function() {
    //
  }
}


/**
 * Abstract connector
 */
var AbstractConnector = SKMObject.extend(Subscribable, {
  /**
   * Transport type object
   * @type {WSWrapper, XHRWrapper} an instance of a Transport type
   */
  transport: null,

  /**
   * State of the connector template
   * @type {Number}
   */
  state: CONNECTOR_STATE.INACTIVE,

  /**
   * @abstract
   * Sends a message to the RTF server
   */
  sendMessage: function(message) {},

  /**
   * @abstract
   * Listens to transport events
   */
  attachTransportListeners: function() {},

  /**
   * Changes the state of the connector to Inactive
   */
  changeToActive: function() {
    this.state = CONNECTOR_STATE.ACTIVE;
    this.fire('changed:state', this.state);
  },

  /**
   * Changes the state of the connector to Active
   */
  changeToInactive: function() {
    this.state = CONNECTOR_STATE.INACTIVE;
    this.fire('changed:state', this.state);
  },

  /**
   * Adds the transport object
   */
  provideTransport: function(transportObject) {
    this.transport = transportObject;
  }
});


return AbstractConnector;


});