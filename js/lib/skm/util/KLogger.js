
// skm KLogger module

/**
 * @todo (Dragos) Add a cache when lookup for namespaces are called
 * @todo (Radu) append logger namespace to handler message
 *
 * 
 * @see  http://www.crazysquirrel.com/computing/java/logging.jspx
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

// Based on Google's Closure Library
// @url http://docs.closure-library.googlecode.com/git/class_goog_debug_Logger.html

define(['skm/k/Objekt'], function(SKMObject) {
'use strict';


/**
 * Mixin containing every method available to a logger instance
 * @type {Object}
 */
var Loggable = {
	log: function(message, level) {
		var prefix;
		if ( this.isLoggable(level) ) {
			prefix = this._name + ": \r\n\t";
			this._processHandlers(new Array(prefix, message));
		}
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
 * Enum declaring the basic levels available for the loggers
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


var Config = {
	DefaultLevel: Level.ALL,

	DefaultHandler: ConsoleHandlers.debug,

	LoggingEnabled: true,

	HierarchyEnabled: true
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
	 * Default level is "WARNING" for every logger
	 * @type {Number}
	 */
	this._defaultLevel = 4;

	/**
	 * The logging level taken from the options object
	 * or the default one - [Level.ALL]
	 * @type {Level}
	 */
	this._level;

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
		return this._defaultLevel;
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
	 * @param  {Level<Number>} level a reference to a field in Level struct
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
		return this._level;
	},

	/**
	 * Gets the level relative to the parent, hierarcy or own level
	 * @return {Level<Number>} 
	 */
	getRelativeLevel: function() {
		var level, defaultLevel;

		// if it has defined a level, don't try to get the parent's level
		if ( level = this.getLevel() )
			return level;
		
		// if parent is defined, get its level
		if ( Config.HierarchyEnabled && this._parent )
			return this._parent.getRelativeLevel();

		if ( defaultLevel = this.getDefaultLevel() )
			return defaultLevel;
	},

	/**
	 * Tests if the requested level is to low for the handler
	 * @param  {Level} level a reference to a field in Level struct
	 * @return {Bool}
	 */
	isLoggable: function(requestedLevel) {
		var relativeLevel;
		
		if ( ! this.isDisabled() ) {
			relativeLevel = this.getRelativeLevel();

			// console.log('req', requestedLevel, 'rel', relativeLevel)

			// everything is loggable
			if ( relativeLevel === Level.ALL )
				return true;

			// if requested level is bigger or equal than the current level
			if ( requestedLevel >= relativeLevel )
				return true;
		}
	},

	/**
	 * Test if the current level is Level.OFF == "-1"
	 * @return {Bool}
	 */
	isDisabled: function() {
		return !Config.LoggingEnabled || this.getLevel() === Level.OFF ;
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
		var i, list = this._handlers, len = list.length;
		for ( i = 0; i < len; i++ ) {
			list[i].apply(this, message);
		}
		this._callParentHandlers(message);
	}
});


/*------------------------------------
	Manager
 -----------------------------------*/

var loggersMap = {
	rootLogger: new Logger("root", { defaultHandler: Config.DefaultHandler })
};

var createHierarchy = function(logger, name) {
	var lastDotIndex = name.lastIndexOf('.');
	var parentName = name.substr(0, lastDotIndex) || "rootLogger";
	var leafName = name.substr(lastDotIndex + 1);
	var parentLogger = Manager.getLogger(parentName);

	parentLogger.addChild(leafName, logger);
	logger.setParent(parentLogger);
};

var Manager = {
	/**
	 * Returns a Logger previously defined or creates one
	 *
	 * @description if a namespace is passed as the name, it attempts to
	 * create the parents of the logger until the last one
	 * 
	 * @param  {String} name the name or the namespace of the logger
	 * @return {Logger}      a new or a cached object
	 */
	getLogger: function(name) {
		return loggersMap[name] || Manager.createLogger(name);
	},

	/**
	 * Returns the root logger
	 * @return {Logger}
	 */
	getRootLogger: function() {
		return this.getLogger("rootLogger");
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

		if ( Config.HierarchyEnabled )
			createHierarchy(logger, name);

		loggersMap[name] = logger;
	
		return logger;
	},

	/**
	 * Returns the config
	 * @return {Object}
	 */
	getConfig: function() {
		return Config;
	},

	/**
	 * Levels available for the loggers
	 * @return {Object}
	 */
	getLevels: function() {
		return Level;
	}
};


return Manager;


});
