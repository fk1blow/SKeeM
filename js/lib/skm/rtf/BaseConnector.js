
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


var Parameterizer = {
  _urlParams: null,

  concatParams: function(concatStr) {
    var part, params = this._urlParams, qs = '';
    for ( part in params ) {
      if ( qs.length < 1 ) {
        qs += '?';
      } else {
        qs += concatStr;
      }
      qs += (part + '=' + params[part]);
    }
    return qs;
  },

  addParameter: function(name, value) {
    this._urlParams = this._urlParams || {};
    this._urlParams[name] = value;
    return this;
  },

  removeParameter: function(name) {
    if ( name in this._urlParams )
      delete this._urlParams[name];
    return this;
  }
};


/**
 * Abstract connector
 */
var Connector = SKMObject.extend(Subscribable, Parameterizer, {
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
  }
});


return Connector;


});