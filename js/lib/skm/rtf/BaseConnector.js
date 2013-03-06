
// Base Connector implementation

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
 * Additional methods should be added to a delegated object.
 * Methods like [addSubscription] aren't actually part of
 * the connector responsabilities...
 */


/**
 * @abstract
 * 
 * Adds a subscription id and sends it to the server
 * @description should be sent with the first request,
 * apended as query string 
 */
  // addSubscription: function() {},


/**
 * Abstract connector
 */
var Connector = SKMObject.extend(Subscribable, {
  /**
   * Transport type object
   * @type {WSWrapper, XHRWrapper} an instance of a Transport type
   */
  transport: null,

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
  removeTransportListeners: function() {}
});


return Connector;


});