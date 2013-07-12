  
// ...

define(['../lib/skm/k/Objekt',
  '../lib/skm/util/NewLogger'], function(SKMObject, NewLogger) {
'use strict';



// a small shortcut for console.log
// only for development debugging!!!
if ( window.console )
  window.cl = console.log;
else
  window.cl = function() {};




cl(NewLogger)



var myLogger = NewLogger.Manager.getLogger("rtfapi");

myLogger.setLevel(3)

// NewLogger.Manager.loggersOff();

cl(myLogger)

myLogger.fine("myLogger : fine");


// myLogger.removeHandler(NewLogger.Config.DefaultHandlers.debug)


myLogger.fine("myLogger : fine .... 2");




/*var otherLogger = NewLogger.Manager.getLogger("xrx");

cl(otherLogger)

otherLogger.setLevel(5)

// cl(otherLogger.getLevel())

otherLogger.finest("debugging : finest")
otherLogger.config("debugging : config")
otherLogger.info("debugging : info")
otherLogger.warning("debugging : warning")
otherLogger.severe("debugging : severe")*/



/**
 * @todo
 * - make the ConsoleHandler behave just like the Logger.js console
 * - add the [removeHandler] method implementation
 * - normalize the Manager and the Config
 * - add conditions that check if the logging is enabled or not(done via Config and Manager)
 */


});