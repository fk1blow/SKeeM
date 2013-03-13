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
    this._connectors = null;
    this._activeConnector = null;
  },


  /**
   * Starts the connectors [beginUpdate]
   * and creates the transports available
   */
  startConnectors: function() {
    Logger.info('ConnectorManager.startConnectors');
    this._startInitialSequence();
    this.started = true;
  },

  /**
   * Stops all connectors
   * 
   * @todo stop all connectors and clear all transport
   * instances - destroy
   */
  stopConnectors: function() {
    Logger.info('ConnectorManager.stopConnectors');
    this._stopCurrentSequence();
    this._activeConnector = null;
    this.started = false;
  },

  /**
  * Pauses the sequence and doesn't
  * modify sequence index
  */
  pauseConnectors: function() {},

  /**
  * Resumes the sequence, not altered
  * since the pause
  */
  resumeConnectors: function() {},
  
  /**
   * Switches to the next connector in sequence
   * 
   * @description Currently, it doesn't go around the tail
   * of the list and stops at the last sequence
   */
  switchToNextConnector: function() {
    Logger.info('ConnectorManager.switchToNextConnector');
    this._stopCurrentSequence();
    this._startNextSequence();
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
    this._connectors = this._connectors || {};
    if ( type in this._connectors ) {
      throw new Error('ConnectorManager.registerConnector :: '
        + ' connector already registered : ' + type);
    }
    return this._connectors[type] = connector;
  },

  /**
   * Connectors list iterator
   * 
   * @param  {Function} callback handler of iteration
   * @param  {Object}   context  context object in which
   * handler is being called
   */
  eachConnector: function(callback, context) {
    var connector, list = this._connectors;
    for ( connector in list ) {
      callback.call(context || this, list[connector]);
    }
  },

  /**
   * Sends a message through a connector
   * @param  {Mixed} message a string or plain json of
   * the message sent to the server
   */
  sendMessage: function(message) {
    var connector;
    if ( connector = this.getActiveConnector() )
      connector.sendMessage(message);
    else {
      Logger.info('%cManager.sendMessage : invalid connector type' + 
        ' or connector is null', 'color:red');
    }
    return this;
  },


/**
   * Private
   */
  

   /**
    * Starts the initial update sequence
    * when the connectors is at 0(zero) index
    */
  _startInitialSequence: function() {
    var list = this._connectors;
    this._activeSequenceIdx = 0;
    var nextConnector;
    
    if ( list === null || ( list && ! ( this.sequence[0] in list ) ) ) {
      Logger.info('%cConnectorManager : connector list is empty or null',
        'color:red');
      this.started = false;
      return;
    }

    this._activeConnector = list[this.sequence[0]];
    this._startConnector(this._activeConnector);
  },

  /**
   * Gets the next connector in sequence
   * and starts the update
   */
  _startNextSequence: function() {
    Logger.debug('%cConnectorManager : starting next sequence', 'color:green');

    this._activeSequenceIdx = this._getNextSequence();
    this._activeConnector = this._connectors[this._activeSequenceIdx];
    if ( this._activeConnector != undefined ) {
      this._startConnector(this._activeConnector);
    } else {
      Logger.debug('%ccConnectorManager : sequence complete!', 'color:red');
      this._activeConnector = null;
      this.started = false;
    }
  },

  /**
   * Stops the current sequence and end update
   */
  _stopCurrentSequence: function() {
    Logger.debug('%cConnectorManager : ' + 
      'stopping current sequence', 'color:green');
    // Remove events and end update
    if ( this._activeConnector ) {
      this._activeConnector.off().endUpdate();
      this._activeConnector = null;
    }
  },

  /**
   * Return the next sequence of connector to use
   */
  _getNextSequence: function() {
    return this.sequence[this._activeSequenceIdx + 1];
  },

  _startConnector: function(connector) {
    // Stop current connectors and start next one
    connector.on('connector:deactivated', function() {
      Logger.debug('%cConnectorManager connector:deactivated!', 'color:red');
      this.fire('stopped');
      this._stopCurrentSequence();
      this._startNextSequence();
    }, this);

    // Stop and clean current connector
    connector.on('api:error', function(error) {
      Logger.debug('%cConnectorManager api:error', 'color:red', error);
      this.fire('stopped');
      this._stopCurrentSequence();
    }, this);

    connector.on('api:update', function(message) {
      Logger.debug('%cConnectorManager message api:update',
        'color:green', arguments);
      this.fire('update', message);
    }, this);

    // Begin update connector
    connector.beginUpdate();
  }
});


return Manager;


});
