// Connector Manager implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable'],
  function(SKMObject, SKMLogger, Subscribable)
{
'use strict';


var Logger = SKMLogger.create();


var ManagerDelegates = {
  handleConnectorTransportDeactivated: function() {
    this.fire('connector:deactivated');
    this._stopCurrentSequence();
    this._startNextSequence();
  },

  handleConnectorApiError: function() {
    this.fire('error');
    this._stopCurrentSequence();
  },

  handleConnectorApiUpdate: function(message) {
    this.fire('update', message);
  },

  handleConnectorReady: function() {
    this.fire('connector:ready');
  }
};


var Manager = SKMObject.extend(Subscribable, ManagerDelegates, {
  /**
   * List of connector object instances
   * @type {Object} a connector instance
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
   * The default sequence of the connectors
   * 
   * @description usual configuration is ['WebSocket', 'XHR']
   * and those strings should map directly to connector
   * instances inside [this._connectors] list
   * @type {Array}
   */
  sequence: null,

  initialize: function() {
    Logger.debug('%cnew Manager', 'color:#a2a2a2');
    this._connectors = null;
    this._activeConnector = null;
  },


  /**
   * Starts the connectors [beginUpdate]
   * and creates the transports available
   */
  startConnectors: function() {
    Logger.info('ConnectorManager.startConnectors');
    if ( this.getActiveConnector() )
      Logger.error('Unable to start a sequence; connectors already started!');
    else
      this._startInitialSequence();
          
  },

  /**
   * Stops all connectors
   * 
   * @todo stop all connectors and clear all transport
   * instances - destroy
   */
  stopConnectors: function() {
    Logger.info('ConnectorManager.stopConnectors');
    if ( this.getActiveConnector() )
      this._stopCurrentSequence();
    this._activeConnector = null;
  },
  
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
    var connector = null;
    if ( this._connectors && type in this._connectors ) {
      connector = this._connectors[type];
    }
    return connector;
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
  // @todo remove unused method
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
   * @param {JSON} optData an object containing additional
   * parameters sent to the connector - wrapper
   */
  sendMessage: function(message) {
    var connector;
    if ( connector = this.getActiveConnector() )
      connector.sendMessage(message);
    else {
      Logger.info('ConnectorManager.sendMessage : invalid connector type' 
        + ' or connector is null');
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
    var nextConnector, list = this._connectors;
    this._activeSequenceIdx = 0;
    
    if ( list === null || ( list && ! ( this.sequence[0] in list ) ) ) {
      Logger.info('%cConnectorManager : connector list is empty or null',
        'color:red');
      return;
    }

    this.fire('before:initialSequence');

    this._activeConnector = list[this.sequence[0]];
    this._startConnector(this._activeConnector);

    this.fire('after:initialSequence');
  },

  /**
   * Gets the next connector in sequence
   * and starts the update
   */
  _startNextSequence: function() {
    Logger.debug('ConnectorManager : starting next sequence');

    // tell that a next sequence is about the be started
    this.fire('before:nextSequence');

    this._activeSequenceIdx = this._getNextSequence();
    this._activeConnector = this._connectors[this._activeSequenceIdx];

    if ( this._activeConnector != undefined ) {
      this._startConnector(this._activeConnector);
    } else {
      Logger.debug('ConnectorManager : sequence complete!');
      this._activeConnector = null;
    }

    this.fire('after:nextSequence');
  },

  /**
   * Stops the current sequence and end update
   */
  _stopCurrentSequence: function() {
    Logger.debug('ConnectorManager : stopping current sequence');
    // Remove events and end update
    if ( this._activeConnector ) {
      this._activeConnector.off()
      this._activeConnector.endUpdate();
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
    this.fire('before:startConnector');
    // Stop current connectors and start next one
    connector.on('transport:deactivated',
      this.handleConnectorTransportDeactivated, this);
    // Stop and clean current connector
    connector.on('api:error', this.handleConnectorApiError, this);
    // notify of update...
    connector.on('api:update', this.handleConnectorApiUpdate, this);
    // when is ready to being
    connector.on('connector:ready', this.handleConnectorReady, this);
    // Begin update connector
    connector.beginUpdate();
    // ...aaaaaaand, be gone
    this.fire('after:startConnector');
  }
});


return Manager;


});
