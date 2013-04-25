
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
var BaseConnector = SKMObject.extend(Subscribable, {
  /**
   * Transport type object
   * @type {WSWrapper, XHRWrapper} an instance of a Transport type
   */
  transport: null,

  /**
   * Transport's own configuration options
   * @type {Object}
   */
  transportOptions: null,

  /**
   * Object that models the url and 
   * its parameters
   * @type {Object}
   */
  urlParamModel: null,

  initialize: function() {
    Logger.debug('%cnew BaseConnector::' + this.getType(), 'color:#a2a2a2');
    
    // create the reconnect handler object
    // this._creadReconnectHandler();
    
    // after transport created, add trnasport and urlparam listeners
    this.on('transport:added', function() {
      // add transport listeners
      this.addTransportListeners();
      // attach url param model events
      if ( this.urlParamModel )
        this.urlParamModel.on('added altered removed', this.buildTransportUrl, this);
    }, this);
  },

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
  removeTransportListeners: function() {
    this.transport.off();
    return this;
  },

  /**
   * Adds a transport type object
   * instance of Transport type and listens
   * to various events
   */
  addTransport: function(transportObject) {
    if ( this.transport == null ) {
      this.transport = transportObject;
      this.fire('transport:added');
    } else {
      throw new Error('BaseConnector.addTransport : ' + 
        'transport object already exists');
    }
    return this;
  },

  /**
   * Ensures the presence of a transport type
   * @param  {Object} transportType Reference to the transport
   * used by this particular connecgtor(WSWrapper, XHRWrapper, etc)
   */
  ensureTransportCreated: function(transportType) {
    if ( this.transport == null )
      this.addTransport(transportType.create(this.transportOptions));
    return this;
  },

  /**
   * Destroys the object
   * @description nullifies every field
   * and removes any events bound to that particular field
   */
  destroy: function() {
    this.removeTransportListeners();
    this.transport = null;
    this.urlParamModel = null;
  },

  /**
   * Builds the transport utl, based on
   * urlParams and transportBaseUrl fields
   */
  buildTransportUrl: function() {
    var qs = '';
    if ( this.transport && this.urlParamModel ) {
      qs = this.urlParamModel.toQueryString();
      this.transport.url = this.transportOptions.url + qs;
    }
  },

  getType: function() {
    return this._typeName;
  }
});


return BaseConnector;


});