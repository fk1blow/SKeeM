
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
		Logger.info('XHRWrapper.handleOnError', err)
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
	send: function(messageObj) {
		Logger.info('XHRWrapper.send');
		this._doAjaxRequest({ data: messageObj });
		return this;
	},

	/**
	 * Send a message using a GET request
	 * @param  {Object} messageObj the message to be sened
	 */
	sendGetRequest: function(messageObj) {
		Logger.info('XHRWrapper.sendGetRequest');
		this._doAjaxRequest({ type: 'GET', data: messageObj });
		return this;
	},

	/**
	 * Sends a message using a POST request
	 * @param  {Object} messageObj the message to be sened
	 */
	sendPostRequest: function(messageObj) {
		Logger.info('XHRWrapper.sendPostRequest');
		this._doAjaxRequest({ type: 'POST', data: messageObj });
		return this;
	},

	abortRequest: function(triggersError) {
		if ( !triggersError )
			this._expectedClose = true;
		this._request.abort();
	},

	/**
	 * Sends an Ajax request, using the provided adapter
	 * @param  {Object} options an object used for
	 * AJAX setting(method, url, type, etc)
	 */
	_doAjaxRequest: function(options) {
		var opt = options || {};
		var methodType = opt.type || this.defaults.type;
		var dataType = opt.dataType || this.defaults.dataType;

		this.abortRequest();

		this._request = this._wrapper.ajax({
			url: this.url,

			context: this,

			type: methodType,

			dataType: dataType,

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