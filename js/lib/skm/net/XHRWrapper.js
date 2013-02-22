
// XHR Wrapper implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable'],
  function(SKMObject, SKMLogger, Subscribable)
{
'use strict';


var Logger = SKMLogger.create();


var DefaultLibraryWrapper = window.jQuery || null;


// The XHR wrapper that will use
// Usually, this wrapper will be for jQuery's $.ajax method
// Direct reference to the Library that will provide the ajax api
var LibraryConfig = {
	wrapper: null,
	ajax: null,
	get: null,
	post: null
}


var XHRMessageDelegates = {
	handleOnComplete: function() {
		Logger.info('XHRWrapper.handleOnComplete');
		this._expectedClose = false;
		this.fire('complete');
	},

	handleOnSuccess: function(msg) {
		Logger.info('XHRWrapper.handleOnSuccess', msg);
		this.fire('success', msg);
	},

	handleOnError: function(err) {
		if ( this._expectedClose )
			return;
		Logger.info('XHRWrapper.handleOnError')
		this._expectedClose = false;
		this.fire('error', err);
	}
}


var XHRWrapper = SKMObject.extend(Subscribable, XHRMessageDelegates, {
	/**
	 * Server url
	 * @type {String}
	 */
	url: null,

	/**
	 * Type of request to be made
	 * @type {String}
	 */
	type: 'GET',

	/**
	 * Default configuration
	 * @type {Object}
	 */
	defaults: {
		type: 'POST',
		dataType: 'JSON'
	},

	_wrapper: null,

	_request: null,

	_expectedClose: false,

	initialize: function() {
		Logger.debug('%cnew XHRWrapper', 'color:#A2A2A2');
		this._wrapper = LibraryConfig.wrapper || DefaultLibraryWrapper;
		this._request = null;
	},

	/**
	 * Sends a message through the AJAX connection
	 * using default method type - 'GET'
	 * @param  {Object} messageObj the message to be sened
	 */
	sendMessage: function(messageObj) {
		Logger.info('XHRWrapper.send');
		this._doRequest({ message: messageObj });
		return this;
	},

	/**
	 * Send a message using a GET request
	 * @param  {Object} messageObj the message to be sened
	 */
	sendGetRequest: function(messageObj) {
		Logger.info('XHRWrapper.sendGetRequest');
		this._doRequest({ type: 'GET', message: messageObj });
		return this;
	},

	/**
	 * Sends a message using a POST request
	 * @param  {Object} messageObj the message to be sened
	 */
	sendPostRequest: function(messageObj) {
		Logger.info('XHRWrapper.sendPostRequest');
		this._doRequest({ type: 'POST', message: messageObj });
		return this;
	},

	/**
	 * Aborts a in-progress request
	 * @param  {Boolean} triggersError Should trigger error
	 * callback or not - [this._expectedClose]
	 */
	abortRequest: function(triggersError) {
		if ( triggersError === false )
			this._expectedClose = true;
		// abort only if request is not null
		if ( this._request )
			this._request.abort();
	},

	/**
	 * Sends an Ajax request, using the provided adapter
	 * @param  {Object} options an object used for
	 * AJAX setting(method, url, type, etc)
	 */
	_doRequest: function(options) {
		var opt = options || {};
		var methodType = opt.type || this.defaults.type;
		var dataType = opt.dataType || this.defaults.dataType;
		var messageData = opt.message || {};

		// Abort the request if there is one in progress
		this.abortRequest();

		this._request = this._wrapper.ajax({
			url: this.url,

			context: this,

			type: methodType,

			// The type of data that you're expecting back from the server
			dataType: dataType,

			// Data to be sent to the server
			data: messageData,

			error: function (err) {
				this.handleOnError(err);
			},

			complete: function(msg) {
				this.handleOnComplete(msg);
				this._resetRequestObject();
			},

			success: function(msg) {
				this.handleOnSuccess(msg);
			}
		});
	},

	_resetRequestObject: function() {
		if ( this._request !== null ) {
			this._request.abort();
			this._request = null;
		}
	}
});


return {
	Config: LibraryConfig,
	Wrapper: XHRWrapper
};


});