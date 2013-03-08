
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
 * Abstract connector
 */
var Connector = SKMObject.extend(Subscribable, {
  /**
   * Transport type object
   * @type {WSWrapper, XHRWrapper} an instance of a Transport type
   */
  transport: null,

  /**
   * Base url for the given transport
   * @type {String}
   */
  baseUrl: null,

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
  removeTransportListeners: function() {},

  /**
   * Adds a transport type object
   * instance of Transport type
   */
  addTransport: function() {},

  /**
   * Returns the base url for the given transport
   * @return {String}
   */
  getBaseUrl: function() {
    return this.baseUrl;
  },

  /**
   * Sets the base url for the given transport
   * @param {String} url
   */
  setBaseUrl: function(url) {
    this.baseUrl = url;
    return this;
  }
});


return Connector;


});