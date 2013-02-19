
// RTF Connector Manager implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable'],
  function(SKMObject, SKMLogger, Subscribable)
{
'use strict';


var Logger = SKMLogger.create();


var ConnectorEvents = {
	onUpdate: function() {
		//
	},

	onError: function() {
		//
	},

	onClose: function() {
		//
	}
};


var ConnectorManager = SKMObject.extend(Subscribable, ConnectorEvents, {
	_connectorList: null,

	_activeConnector: null,

	initialize: function() {
		Logger.debug('%cnew ConnectorManager', 'color:#A2A2A2');
		this._connectorList = {};
		this._activeConnector = null;
	},

	addConnector: function(name, connector) {
		Logger.debug('ConnectorManager.addConnector', name, connector);
		if ( !( name in this._connectorList ) ) {
			this._connectorList[name] = connector;
			connector.on('terminate', function() {
				cl('connector terminates');
			});
		}
		return this;
	},

	/**
	 * Remove, unbind and destroy the connector
	 * @param  {String} name connector name
	 * @return {Boolean}
	 */
	removeConnector: function(name) {
		this._connectorList[name].off().destroy();
		delete this._connectorList[name];
		return true;
	},

	swapConnectors: function() {
		// var list = this._connectorList;
		// if ( this._activeConnector )
	},

	beginUpdateUsing: function(connectorName) {
		var connector = this._connectorList[connectorName];
		connector.openConnection();
	}
});


return ConnectorManager;


});