
// Connector Manager implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable'],
  function(SKMObject, SKMLogger, Subscribable)
{
'use strict';


var Logger = SKMLogger.create();


var Manager = SKMObject.extend(Subscribable, {
  /**
   * List of connector object instances
   * @type {Object Connector}
   */
  _connectors: null,

  /**
   * Reference to the currently/primary used
   * connector instance
   * 
   * @type {Object Connector}
   */
  _activeConnector: null,

  /**
   * Reference to active sequence index
   * @type {Array}
   */
  _activeSequenceIdx: 0,

  /**
   * State of the rtf
   * @type {Boolean}
   */
  started: false,

  /**
   * The default sequence of the connectors
   * @type {Array}
   */
  sequence: [
    'WebSocket', 'XHR'
  ],


  initialize: function() {
    this._connectors = {};
    this._activeConnector = null;
  },


  /**
   * Starts the connectors [beginUpdate]
   * and creates the transports available
   */
  startConnectors: function() {
    Logger.debug('Manager.startConnectors');
    this._startInitialSequence();
  },

  /**
   * Stops all connectors
   * 
   * @todo stop all connectors and clear all transport
   * instances - destroy
   */
  stopConnectors: function() {
    Logger.debug('Manager.stopConnectors');
    this.started = false;
  },

  /**
   * Returns the active connector
   * @return {Object} connector instance
   */
  getActiveConnector: function() {
    return this._activeConnector;
  },

  /**
   * Returns a connector from the connectors list
   * @param  {String} type name of the connector
   * @return {Object}      connector instance
   */
  getConnector: function(type) {
    return this._connectors[type];
  },

  /**
   * Registers a connector instance
   * @param  {String} name      connector's name
   * @param  {Object} connector an object representing the instance
   */
  registerConnector: function(type, connector) {
    if ( type in this._connectors ) {
      throw new Error('Manager.registerConnector :: '
        + ' connector already registered : ' + type);
    }
    this._connectors[type] = connector;
  },


  /**
   * Private
   */
  

   /**
    * Starts the initial update sequence
    * when the connectors is at 0(zero) index
    */
  _startInitialSequence: function() {
    this._activeSequenceIdx = 0;
    this._activeConnector = this._connectors[this.sequence[0]];
    this._startConnectorUpdate(this._activeConnector);
  },

  /**
   * Gets the next connector in sequence
   * and starts the update
   */
  _startNextSequence: function() {
    Logger.debug('%cstarting next sequence', 'color:green');

    this._activeSequenceIdx = this._getNextSequence();
    this._activeConnector = this._connectors[this._activeSequenceIdx];
    if ( this._activeConnector != undefined ) {
      this._startConnectorUpdate(this._activeConnector);
    } else {
      Logger.debug('%cConnector sequence complete!', 'color:red');
    }
  },

  /**
   * Stops the current sequence and end update
   */
  _stopCurrentSequence: function() {
    Logger.debug('%cstopping current sequence', 'color:green');
    // Remove events and end update
    this._activeConnector.off().endUpdate();
  },

  /**
   * Return the next sequence of connector to use
   */
  _getNextSequence: function() {
    return this.sequence[this._activeSequenceIdx + 1];
  },

  _startConnectorUpdate: function(connector) {
    // Stop current connectors and start next one
    connector.on('connector:deactivated', function() {
      Logger.debug('%cConnector connector:deactivated!', 'color:red');
      this._stopCurrentSequence();
      this._startNextSequence();
    }, this);

    // Stop and clean current connector
    connector.on('api:error', function(error) {
      Logger.debug('%cConnector api:error', 'color:red', error);
    }, this);

    connector.on('api:update', function(message) {
      Logger.debug('%cConnector message api:update', 'color:green', arguments);
      this.fire('update', message);
    }, this);

    // Begin update connector
    connector.beginUpdate();
  }
});


return Manager;


});