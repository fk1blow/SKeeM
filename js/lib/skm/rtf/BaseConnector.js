
// Base Connector implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Timer',
  'skm/util/Subscribable'],
  function(SKMObject, SKMLogger, SKMTimer, Subscribable)
{
'use strict';


var Logger = SKMLogger.create();


/**
 * Abstract connector
 */
var BaseConnector = SKMObject.extend(Subscribable, {
  name: 'BaseConnector',

  /**
   * Transport type object
   * @type {Transport} an instance of a Transport type
   */
  transport: null,

  /**
   * Transport's own configuration options
   * @type {Object}
   */
  transportOptions: null,

  /**
   * Maximum reconnect attempts
   * @type {Number}
   */
  maxReconnectAttempts: 3,

  /**
   * Delay after a reconnect attemp will begin
   * @type {Number}
   */
  reconnectDelay: undefined,

  /**
   * Delay after a reconnect attemp will begin
   * @type {Number}
   */
  defaultReconnectDelay: 3000,

  /**
   * Object that models the url and 
   * its parameters
   * @type {Object}
   */
  urlParamModel: null,

  _reconnectTimer: null,

  _currentAttempt: 1,

  _isReconnecting: false,

  /*initialize: function() {
    this._reconnectTimer = SKMTimer.create({
      tickInterval:
    });
  },*/

  /**
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
      // add transport listeners
      this.addTransportListeners();
      // attach url param model events
      if ( this.urlParamModel )
        this.urlParamModel.on('added altered removed', this._buildTransportUrl, this);
    } else {
      throw new Error('BaseConnector.addTransport : ' + 
        'transport object already exists');
    }
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
   * @todo move to baseconnector
   * 
   * Handled when the reconnect attemps has reached maximum attempts
   */
  handleReconnectingEnded: function() {
    Logger.info('Connector.handleReconnectingEnded');
    // has stopped reconnecting and reset current attempt
    this._resetReconnectAttempts();
    this.fire('transport:error');
  },

  handleReconnectingBegin: function() {
    Logger.info('Connector.handleReconnectingBegin');
    Logger.debug('-----------------------------------------------------------');
    Logger.debug('Connector : reconnect attempt #', this._currentAttempt);
    // kill current timer
    this._reconnectTimer = null;
    // is reconnecting and increment current attempt
    this._isReconnecting = true;
    this._currentAttempt += 1;
    // start connecting by calling beginUpdate
    this.beginUpdate();
    this.fire('transport:reconnecting');
  },

  /**
   * Ensures the presence of a transport type
   * @param  {Object} transportType Reference to the transport
   * used by this particular connecgtor(WSWrapper, XHRWrapper, etc)
   */
  _ensureTransportCreated: function(transportType) {
    if ( this.transport == null )
      this.addTransport(transportType.create(this.transportOptions));
    return this;
  },

  /**
   * Builds the transport utl, based on
   * urlParams and transportBaseUrl fields
   */
  _buildTransportUrl: function() {
    var qs = '';
    if ( this.transport && this.urlParamModel ) {
      qs = this.urlParamModel.toQueryString();
      this.transport.url = this.transportOptions.url + qs;
    }
  },

  /**
   * Handled while trying to establish a link
   *
   * @description this handler is called whenever the websocket wrapper
   * tries to establish a connection but fails to do that.
   * It cand fail if the wrapper auto-disconnects the attemp,
   * or if the native wrapper triggers the close event.
   */
  _makeReconnectAttempt: function() {
    var maxReconnectAttempts = this.transportOptions.maxReconnectAttempts;
    var reconnectDelay = this.reconnectDelay || this.defaultReconnectDelay;
    var that = this;

    if ( this._currentAttempt <= maxReconnectAttempts ) {
      Logger.debug('Connector : will make attempt in', reconnectDelay, 'ms');
      this._reconnectTimer = setTimeout(function() {
        that.handleReconnectingBegin();
      }, reconnectDelay);
    } else {
      Logger.debug('Connector : maxReconnectAttempts of ' 
        + maxReconnectAttempts + ' reached!');
      this.handleReconnectingEnded();
    }
  },

  _stopReconnectAttempts: function() {
    if ( this._reconnectTimer )
      clearTimeout(this._reconnectTimer);
    this._resetReconnectAttempts();
  },

  _resetReconnectAttempts: function() {
    this._isReconnecting = false;
    this._currentAttempt = 1;
  }
});


return BaseConnector;


});