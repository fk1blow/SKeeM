
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