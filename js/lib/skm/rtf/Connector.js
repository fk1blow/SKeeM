
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
	 * Sends a message to the RTF server
	 */
	sendMessage: function(message) {
		Logger.debug('WebSocketConnector.sendMessage');
		this.transport.send(message);
	},

  attachTransportListeners: function() {
  	this.transport.on('disconnected', function() {
  		cl('transport disconnected')
  	}, this)
  	.on('reconnecting:stopped', function() {
  		cl('transport reconnecting:stopped - disconnected')
  	}, this)
  	.on('message', function(msg) {
  		this.handleMessage(msg);
  	}, this);
  },

  /**
   * Handlers
   */
  
  handleMessage: function(message) {
  	var message = jQuery.parseJSON(message);
  	Logger.debug('WebSocketConnect.handleMessage', message);
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