
/**
 * @see  http://www.crazysquirrel.com/computing/java/logging.jspx
 *
 * 
 * @see  http://www.javapractices.com/topic/TopicAction.do?Id=143
 * 
 * <code>
 *	logging request of some level is made to logger attached to current package 
 *	if the request level is too low for that package's logger { 
 *	   discard it 
 *	} 
 *		otherwise { 
 *		  cycle through all handlers { 
 *		    if the request level is too low for that handler { 
 *		      discard it 
 *		    } 
 *		    otherwise { 
 *		      log the request 
 *		    }
 *		  }
 *		}
 *	</code>

 */


// skm Logger module

define(['/skm/k/Objekt'], function(SKMObject) {
'use strict';


var Logger = function() {
	/**
	 * The Object in charge of parsing the required logs
	 * 
	 * @type {Object/LoggerHandler}
	 */
	this.handler = null;

	/**
	 * The name identifier ot this Logger instance
	 * @type {String}
	 */
	this.name = undefined;
}


SKMObject.mixin(Logger.prototype, {

	error: function() {
		//
	},

	warning: function() {
		//
	},

	info: function() {
		//
	},

	config: function() {
		//
	},

	/**
	 * Adds a logging handler object
	 * @param  {[type]} handler [description]
	 * @return {[type]}         [description]
	 */
	addHandler: function(handler) {
		//
	}
});


});