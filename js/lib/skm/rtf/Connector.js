
// RTF Connector implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable'],
  function(SKMObject, SKMLogger, Subscribable)
{
'use strict';


var Logger = SKMLogger.create();


/**
 * Abstract connector
 */
var Connector = SKMObject.extend(Subscribable, {
	/**
	 * Transport type object
	 * 
	 * @description Represents an instance of a Connection object,
	 * represented by a transport type - WebSocket, XHR, flash, etc
	 * @type {WSWrapper, XHRWrapper} an instance of a Transport type
	 */
	transport: null,

	openConnection: function() {
		cl('Connector.openConnection');
		this.transport.connect();
		return this;
	},

	closeConnection: function() {
		this.transport.disconnect();
		return this;
	},

	sendMessage: function(message) {
		this.transport.send(message);
		return this;
	},

	/**
	 * Restarts the channel's update process
	 * @return {Boolean}
	 */
	restart: function() {
		cl('Connector.restart');
	},

	/**
	 * Destroys the object and unbinds all events
	 * @return {Boolean}
	 */
	destroy: function() {
		cl('Connector.destroy - should destroy the transport as well.')
		this.off();
	}
});


/**
 * [WSConnector description]
 * @type {[type]}
 */
var WSConnector = Connector.extend({
	initialize: function() {
		Logger.debug('%cnew WSConnector', 'color:#A2A2A2');

		this.transport.on('reconnecting:stopped', function() {
			this.fire('terminate');
		}, this)
		.on('server:disconnected', function() {
			this.fire('terminate');
		}, this);
	},

	restart: function() {
		cl('WSConnector.restart');
		this.transport.connect();
	}
});


/**
 * [XHRConnector description]
 * @type {[type]}
 */
var XHRConnector = Connector.extend({
	restart: function() {
		cl('XHRConnector.restart')
	}
});


return {
	XHR: XHRConnector,
	WS: WSConnector
};


});
