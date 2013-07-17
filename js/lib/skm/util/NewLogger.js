// a small shortcut for console.log
// only for development debugging!!!
if ( window.console )
  window.cl = console.log;
else
  window.cl = function() {};


/**
 * @todo Add a cache when lookup for namespaces are called
 * @todo (Radu) append logger namespace to handler message
 *
 * 
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
		// if ( this._handlers && this.isLoggable(level) )
		if ( this.isLoggable(level) )
			this._processHandlers(message);
	},

	debug: function(message) {
		this.log(message, Level.DEBUG);
	},

	info: function(message) {
		this.log(message, Level.INFO);
	},

	trace :function (message) {
		this.log(message,Level.TRACE);
	},

	warning: function(message) {
		this.log(message, Level.WARNING);
	},

	error: function(message) {
		this.log(message, Level.ERROR);
	},

	fatal: function(message) {
		this.log(message, Level.FATAL);
	}
};


/**
 * Declares the basic levels of the Loggers
 * @type {Object}
 */
var Level = {
	OFF: -1,
	ALL: 0,

	DEBUG: 1,
	INFO: 2,
	TRACE: 3,
	WARNING: 4,
	ERROR: 5,
	FATAL: 6
	};


// @todo(Dragos) fix hierarchy condition check and typo
var hierarcyEnabled = true;


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

	/**
	 * The name identifier ot this Logger instance
	 * @type {String}
	 */
	this._name = name;

	/**
	 * [_parent description]
	 * @type {[type]}
	 */
	this._parent = null;

	/**
	 * [_child description]
	 * @type {[type]}
	 */
	this._children = {};

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
	this._addDefaultHandler();
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
	 * @return {Level<Number>}
	 */
	getLevel: function() {
		// @todo(Dragos) check for Global logging enabled
		return this._level;
	},

	/**
	 * Gets the level relative to the parent, hierarcy or own level
	 * @return {Level<Number>} 
	 */
	getRelativeLevel: function() {
		// no hierarchy, level == 0
		if ( ! hierarcyEnabled )
			return Level.ALL;
		// if it has defined a level, don't try to get the parent's level
		if ( this._level )
			return this._level;
		// if parent is defined, get its level
		if ( this._parent )
			return this._parent.getRelativeLevel();
		// or level off if no level set
		return Level.OFF;
	},

	/**
	 * Tests if the requested level is to low for the handler
	 * @param  {Level} level a reference to a field in Level struct
	 * @return {Bool}
	 */
	isLoggable: function(requestedLevel) {
		var relativeLevel = this.getRelativeLevel();
		// level is -1, not loggable
		if ( this.isDisabled() )
			return false;
		// everything is loggable
		if ( relativeLevel === Level.ALL )
			return true;
		// if requested level is bigger or equal than the current level
		if ( requestedLevel >= relativeLevel )
			return true;
	},

	/**
	 * Test if the current level is Level.OFF == "-1"
	 * @return {Bool}
	 */
	isDisabled: function() {
		return this.getLevel() === Level.OFF;
	},

	addChild: function(name, logger) {
		this._children[name] = logger;
	},

	setParent: function(logger) {
		this._parent = logger;
	},

	/*
		Privates
	 */
	
	_callParentHandlers: function(message) {
		if ( this._parent )
			this._parent._processHandlers(message);
	},
	
	_addDefaultHandler: function() {
		var handler = this.options.defaultHandler;
		if ( typeof handler === 'function' )
			this.addHandler(handler);
	},

	_processHandlers: function(message) {
		var handlers = this._handlers, len = handlers.length;
		for ( var i = 0; i < len; i++ )
			handlers[i].call(this, message);
		this._callParentHandlers(message);
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
	Manager
 -----------------------------------*/


var Config = {
	DefaultLevel: Level.ALL,

	DefaultHandler: ConsoleHandlers.debug
};


var Manager = {
	_loggers: {
		rootLogger: new Logger("root", { defaultHandler: Config.DefaultHandler })
	},

	getLogger: function(name) {
		return this._loggers[name] || Manager.createLogger(name);
	},

	getRootLogger: function() {
		return this.getLogger('rootLogger');
	},

	/**
	 * Creates a logger and its parent
	 * 
	 * @param  {String} name the name of the logger as a namespace
	 * @return {Logger}      an instance of the child logger
	 *
	 * @description based on google closure's Logger module
	 * @link  {http://docs.closure-library.googlecode.com/git/class_goog_debug_Logger.html}
	 */
	createLogger: function(name) {
		var logger = new Logger(name);
		var lastDotIndex, parentName, leafName, parentLogger;

		// fucking typo...
		if ( hierarcyEnabled ) {
			lastDotIndex = name.lastIndexOf('.');
			parentName = name.substr(0, lastDotIndex) || 'rootLogger';
			leafName = name.substr(lastDotIndex + 1);
			parentLogger = Manager.getLogger(parentName);

			parentLogger.addChild(leafName, logger);
			logger.setParent(parentLogger);
		}

		this._loggers[name] = logger;
	
		return logger;
	},

	getConfig: function() {
		return Config;
	}
};


return Manager;


});