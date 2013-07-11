
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

// Based on Google's Closure Library
// @url http://docs.closure-library.googlecode.com/git/class_goog_debug_Logger.html

define(['../k/Objekt'], function(SKMObject) {
'use strict';


/**
 * Interface protocol available for a Logger instance
 *
 * @protocol
 * @type {Object}
 */
var Loggable = {
	log: function(message, level) {
		if ( this._handlers && this.isLoggable(level) )
			this._processHandlers(message);
	},

	finest: function(message) {
		this.log(message, Level.FINEST);
	},

	finer: function(message) {
		this.log(message, Level.FINER);
	},

	fine: function(message) {
		this.log(message, Level.FINE);
	},

	config: function(message) {
		this.log(message, Level.CONFIG);
	},

	info: function(message) {
		this.log(message, Level.INFO);
	},

	warning: function(message) {
		this.log(message, Level.WARNING);
	},

	severe: function(message) {
		this.log(message, Level.SEVERE);
	},

	error: function(message) {
		this.log(message, Level.SEVERE);
	}
};


/**
 * Logger moduler, similar to google's closure Logger 
 * 
 * @constructor
 * @param  {String} name    the id/name of the logger
 * @param  {Object} handler the handler assigned to this logger or
 * get default logger if not available
 */
var Logger = function(name) {
	/**
	 * The name identifier ot this Logger instance
	 * @type {String}
	 */
	this._name = name;

	/**
	 * Array of handler functions available to this Logger
	 * @type {Array.<Function>}
	 */
	this._handlers = [];

	/**
	 * The logging level taken from the options object
	 * or the default one - [Level.ALL]
	 * @type {Level}
	 */
	this._level = Config.DefaultLevel;


	/**
	 * Default object that has a list of handlers used for by default
	 * @type {ConsoleHandler}
	 */
	this._defaultHandlerObject = Config.DefaultHandler;


	// Adds the default handler available on default handler object
	// Default handler is the ConsoleHandler - console in a browser env
	this._addDefaultHandlersList();
};


SKMObject.mixin(Logger.prototype, Loggable, {
	/**
	 * Returns the default level available through the Config module
	 * @return {Level} 
	 */
	getDefaultLevel: function() {
		return Config.DefaultLevel;
	},

	/**
	 * Adds a logging handler object
	 * @param  {Function} handler A delegate fucntion that parses the logging
	 * information usually(and by default) a ConsoleHandler instance
	 */
	addHandler: function(handler) {
		if ( handler && typeof handler === 'function' )
			this._handlers.push(handler);
	},

	/**
	 * TBD
	 * @param  {[type]} handler [description]
	 * @return {[type]}         [description]
	 */
	removeHandler: function(handler) {
		//
	},

	/**
	 * Sets the level of the Logger
	 * @param  {Level} level a reference to a field in Level struct
	 */
	setLevel: function(level) {
		if ( ( level == 0 || level ) && typeof level === 'number' )
			this._level = level;
	},

	/**
	 * Returns the current Logger's reference
	 * @return {Level}
	 */
	getLevel: function() {
		return this._level;
	},

	/**
	 * Tests if the requested level is to low for the handler
	 * @param  {Level} level a reference to a field in Level struct
	 * @return {Bool}
	 */
	isLoggable: function(level) {
		var currentLevel = this.getLevel();
		level = (typeof level !== 'number') ? currentLevel : level;

		// cl(level, currentLevel)

		// If the required level is 0, it means all levels are loggable
		if ( level === Level.ALL )
			return true;

		// if the current level is smaller or eq to required, logger is loggable
		if ( this.getLevel() <= level )
			return true;
	},

	/*
		Privates
	 */

	_addDefaultHandlersList: function() {
		var handler = null, handlerObject = this._defaultHandlerObject;
		for ( handler in handlerObject )
			this.addHandler(handlerObject[handler]);
	},

	_processHandlers: function(message) {
		var handlers = this._handlers, len = handlers.length;
		for ( var i = 0; i < len; i++ ) {
			handlers[i].call(this._defaultHandlerObject, message);
		}
	}
});


/*------------------------------------
	Console handler
 -----------------------------------*/

/**
 * Default handler for the console implementation
 * available in most standard/normal browsers
 *
 * @description the console handler acts as a delegate(handler)
 * for a Logger object. It should adhere to a Loggable interface
 * that will be used for every handler.
 */
/*var ConsoleHandler = function() {
	// check if console available
	// use those checks available inside /utile/Logger.js
}*/


// ConsoleHandler.prototype = {
var ConsoleHandler = {
	debug: function() {
		console.log.apply(this, arguments);
	},

	info: function() {
		console.info.apply(this, arguments);
	},

	warn: function() {
		console.warn.apply(this, arguments);
	},
	
	error: function() {
		console.error.apply(this, arguments);
	}
};


/*------------------------------------
	Levels
 -----------------------------------*/

var Level = {
	OFF: -1,
	ALL: 0,
	FINEST: 1,
	FINER: 2,
	FINE: 3,
	CONFIG: 4,
	INFO: 5,
	WARNING: 6,
	SEVERE: 7
}


/*------------------------------------
	Manager
 -----------------------------------*/


var Config = {
	DefaultLevel: Level.ALL,

	DefaultHandler: ConsoleHandler
};


var LoggerManager = {
	_list: {},

	addLogger: function(name, logger) {
		this._list[name] = logger;
	},

	getLogger: function(name) {
		return this._list[name] || new Logger(name);
	}
}


return {
	Manager: LoggerManager,

	Level: Level

	// ConsoleHandler: ConsoleHandler
};


});