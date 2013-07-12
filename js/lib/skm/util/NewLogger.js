
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
var Logger = function(name, options) {
	this.options = options || {};

// cl(arguments)

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
	this._level = this.getDefaultLevel();


	// Adds the default handler available on default handler object
	// Default handler is the ConsoleHandler - console in a browser env
	this._addDefaultHandlersList(options.handlersList);
};


SKMObject.mixin(Logger.prototype, Loggable, {
	/**
	 * Returns the default level available through the Config module
	 * @return {Level} 
	 */
	getDefaultLevel: function() {
		return this.options.defaultLevel || 0;
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
	 * Removes a handler from the handlers list
	 * @param  {Function} handler A recerence to a handler function in the list
	 */
	removeHandler: function(handler) {
		var index = this._handlers.indexOf(handler);
		if ( index >= 0 )
			this._handlers.splice(index, 1);
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
		
		// level is -1, not loggable
		if ( this.isDisabled() )
			return false;

		// If the required level is 0, it means all levels are loggable
		// or if the current level is smaller or eq to required, logger is loggable
		if ( level === Level.ALL || currentLevel <= level )
			return true;
	},

	/**
	 * Test if the current level is Level.OFF == "-1"
	 * @return {Bool}
	 */
	isDisabled: function() {
		return this.getLevel() === Level.OFF;
	},

	/*
		Privates
	 */

	_addDefaultHandlersList: function(handlersList) {
		var handler = null;
		for ( handler in handlersList )
			this.addHandler(handlersList[handler]);
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
var ConsoleHandlers = {
	debug: function() {
		if ( console && typeof console.debug === 'function' )
			console.log.apply(console, arguments);
	},

	info: function() {
		if ( console && typeof console.info === 'function' )
			console.info.apply(console, arguments);
	},

	warn: function() {
		if ( console && typeof console.warn === 'function' )
			console.warn.apply(console, arguments);
	},
	
	error: function() {
		if ( console && typeof console.error === 'function' )
			console.error.apply(console, arguments);
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
	SEVERE: 7,
	ERROR: 8
};


/*------------------------------------
	Manager
 -----------------------------------*/


var Config = {
	DefaultLevel: Level.ALL,

	DefaultHandlers: ConsoleHandlers
};


var LoggerManager = (function(){
	var loggerList = {};

	var getLoggerOptions = function() {
		return {
			defaultLevel: Config.DefaultLevel,
			handlersList: Config.DefaultHandlers
		}
	};

	return {
		createLogger: function(name) {
			var options = getLoggerOptions();
			return loggerList[name] = new Logger(name, options);
		},

		getLogger: function(name) {
			return loggerList[name] || this.createLogger(name);
		},

		turnOffLoggers: function() {
			for ( var logger in loggerList )
				loggerList[logger].setLevel(Level.OFF);
		}
	}
}());


return {
	Manager: LoggerManager,

	Level: Level,

	Config: Config
};


});