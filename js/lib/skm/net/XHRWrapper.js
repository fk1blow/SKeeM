
// XHR Wrapper implementation

define(['skm/k/Objekt',
  'skm/util/Logger',
  'skm/util/Subscribable'],
  function(SKMObject, SKMLogger, Subscribable)
{
'use strict';


var Logger = new SKMLogger();


var DefaultLibraryWrapper = window.jQuery || null;


// The XHR wrapper that will be used.
// Usually, this wrapper will be for jQuery's $.ajax method
// Direct reference to the Library that will provide the ajax api
var LibraryConfig = {
	wrapper: null,
	ajax: null,
	get: null,
	post: null
}


var XHRMessageDelegates = {
	handleOnSuccess: function(msg) {
		Logger.info('XHRWrapper.handleOnSuccess', msg);
		this.fire('success', msg);
	},
	
	handleOnComplete: function(ajaxObject, status) {
		if ( ajaxObject.status == 405 ) {
			//should trigger next sequence
			this.fire('denied');
		} else if ( ajaxObject.status != 200 && ajaxObject.statusText != 'abort' ) {
			// interrupted by networkd/hardware stack
			this.fire('stopped');
		} else if ( ajaxObject.statusText == 'abort' ) {
			// manually aborted by user
			// shouldn't fire anything
			if ( this._expectedClose != true ) {
				this.fire('aborted');
			}
		}
		this._expectedClose = false;
	}
}


var XHRWrapper = function(options) {
	options || (options = {});
	this.url = options.url || null;
	this.async = options.async || true;
	this.httpMethod = options.httpMethod || "POST";
	this.dataType = options.dataType || "JSON";
	// @todo use a getter for the wrapper
	this._wrapper = LibraryConfig.wrapper || DefaultLibraryWrapper;
	this._request = null;
};


SKMObject.mixin(XHRWrapper.prototype, Subscribable, XHRMessageDelegates, {
	/**
	 * Sends a message through the AJAX connection
	 * using default method type - 'GET'
	 * @param  {Object} messageObj the message to be sened
	 */
	sendMessage: function(message, options) {
		Logger.info('XHRWrapper.send');
		this._doRequest(message, options);
		return this;
	},

	/**
	 * Send a message using a GET request
	 * @param  {Object} messageObj the message to be sened
	 */
	sendGetRequest: function(message, options) {
		Logger.info('XHRWrapper.sendGetRequest');
		var opt = options || {};
		opt.httpMethod = 'GET';
		this._doRequest(message, opt);
		return this;
	},

	/**
	 * Sends a message using a POST request
	 * @param  {Object} messageObj the message to be sened
	 */
	sendPostRequest: function(message, options) {
		Logger.info('XHRWrapper.sendPostRequest');
		var opt = options || {};
		opt.httpMethod = 'POST';
		this._doRequest(message, opt);
		return this;
	},

	/**
	 * Aborts a in-progress request
	 * @param  {Boolean} triggersError Should trigger error
	 * callback or not - [this._expectedClose]
	 */
	abortRequest: function(abortedByUser) {
		Logger.info('XHRWrapper.abortRequest');
		// if triggers error is true, it will trigger the error event
		if ( abortedByUser === true )
			this._expectedClose = true;
		// Set expected close, only it aborts the connection
		if ( this._request != null ) {
			this._request.abort();
		}
		// nullifies the request object
		this._resetRequestObject();
	},

	/**
	 * Sends an Ajax request, using the provided adapter
	 * @param  {Object} options an object used for
	 * AJAX setting(method, url, type, etc)
	 */
	_doRequest: function(messageData, options) {
		var opt = options || {};
		var httpMethod = opt.httpMethod || this.httpMethod;
		var dataType = opt.dataType || this.dataType;
		var async = opt.async || this.async;

		// Abort the request if there is one in progress
		this.abortRequest();
		
		this._request = this._wrapper.ajax({
			url: this.url,

			context: this,

			// http method
			type: httpMethod,
			
			async: async,

			// The type of data that you're expecting back from the server
			dataType: dataType,

			// Data sent to the server
			data: messageData,

			/*error: function (err) {
				this.handleOnError(err);
			},*/
			
			complete: function(ctx, statusText) {
				this.handleOnComplete(ctx, statusText);
			},
			
			success: function(msg) {
				this.handleOnSuccess(msg);
			}
		});
	},

	_resetRequestObject: function() {
		if ( this._request !== null ) {
			this._request = null;
		}
	}
});


/*return {
	Config: LibraryConfig,
	Wrapper: XHRWrapper
};*/


/**
 * Temporarely hardcoded
 */
return XHRWrapper;


});