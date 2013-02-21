
// RTF Connector implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable'],
  function(SKMObject, SKMLogger, Subscribable)
{
'use strict';


var Logger = SKMLogger.create();


var ConnectorState = {
  ACTIVE: 1,
  INACTIVE: 0,
  STOPPED: -1
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
  // state: ConnectorState.INACTIVE,

  /**
   * @abstract
   * 
   * Begins update by opening the transport's connection
   */
  beginUpdate: function() {},

  /**
   * @abstract
   *
   * Stops updates for this transport by aborting connection
   */
  endUpdate: function() {},

  /**
   * @abstract
   * 
   * Adds a subscription id and sends it to the server
   * @description should be sent with the first request,
   * apended as query string 
   */
  addSubscription: function() {},

  /**
   * @abstract
   * 
   * Sends a message to the RTF server
   */
  sendMessage: function(message) {},

  /**
   * @abstract
   * 
   * Listens to transport events
   */
  addTransportListeners: function() {},

  /**
   * @abstract
   *
   * Removes transport listeners
   */
  removeTransportListeners: function() {},

  /**
   * Changes the state of the connector to Inactive
   */
  // changeToActive: function() {
  //   this.state = ConnectorState.ACTIVE;
  //   this.fire('connector:switch', this.state);
  // },

  /**
   * Changes the state of the connector to Active
   */
  // changeToInactive: function() {
  //   this.state = ConnectorState.INACTIVE;
  //   this.fire('changed:state', this.state);
  // },

  /**
   * [changeToStopped description]
   * @return {[type]} [description]
   */
  // changeToStopped: function() {
  //   this.state = ConnectorState.STOPPED;
  //   this.fire('changed:state', this.state);
  // }
});


return AbstractConnector;


});