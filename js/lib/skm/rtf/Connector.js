
// RTF Connector implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable',
  'skm/rtf/AbstractConnector'],
  function(SKMObject, SKMLogger, Subscribable, AbstractConnector)
{
'use strict';


var Logger = SKMLogger.create();


/**
 * [WSConnector description]
 * @type {[type]}
 */
var WebSocketConnector = AbstractConnector.extend({
	initialize: function() {
		Logger.debug('%cnew WebSocketConnector', 'color:#A2A2A2');
		this.attachTransportListeners();
	},

	/**
   * Starts the update(sync) between
   * client(transport object) and server
   */
  beginUpdate: function() {
  	Logger.info('WebSocketConnector.beginUpdate');
  	this.transport.connect();
  },

  /**
   * Closes the update(sync) channel
   * and disconnects the transport object
   */
  terminateUpdate: function() {
  	Logger.info('WebSocketConnector.terminateUpdate');
  	this.transport.disconnect();
  },

  attachTransportListeners: function() {
  	this.transport.on('disconnected', function() {
  		cl('transport disconnected')
  	}, this)
  	.on('reconnecting:stopped', function() {
  		cl('transport reconnecting:stopped - disconnected')
  	}, this)
  	.on('message', function(msg) {
  		cl('transport:message', msg)
  	}, this);
  }
});


/**
 * [XHRConnector description]
 * @type {[type]}
 */
var AjaxConnector = AbstractConnector.extend({
	initialize: function() {
		Logger.debug('%cnew AjaxConnector', 'color:#A2A2A2');
	}
});


return {
	XHR: AjaxConnector,
	WS: WebSocketConnector
};


});