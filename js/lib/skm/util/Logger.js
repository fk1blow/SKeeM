
// skm Logger module

define([], function() {
'use strict';


var slice = Array.prototype.slice;


var Logger = function() {
	this._console = window.console || {};
	this._enabled = true;
	// @todo define the actual levels and their constraints
	this._level = 0;
}

Logger.prototype = {
	consoleUnavailable: function() {
	  return typeof (window.console !== 'undefined');
	},

	/* Now, for every console method, check if it's a function(Because IE that's why) */

	debug: function() {
	  if ( typeof this._console.debug === 'function' )
	    this._console.debug.apply(console, slice.call(arguments));
	},

	info: function() {
 		if ( typeof this._console.info === 'function' )
	    this._console.info.apply(console, slice.call(arguments));
	},

	warn: function() {
	  if ( typeof this._console.warn === 'function' )
	    this._console.warn.apply(console, slice.call(arguments));
	},

	error: function() {
	  if ( typeof this._console.error === 'function' )
	    this._console.error.apply(console, slice.call(arguments));
	}
};


// a small shortcut for console.log
// only for development debugging!!!
if ( window.console )
	window.cl = console.log;
else
	window.cl = function() {};


return Logger;


});