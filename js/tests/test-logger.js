  
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



var ml = NewLogger.getLogger("rtf.api.manager.connector");
var ml2 = NewLogger.getLogger("rtf.api.manager");
var ml3 = NewLogger.getLogger("rtf.api");
var ml4 = NewLogger.getLogger("rtf");

// ml4.setLevel(4);
// ml.setLevel(2);
// myLogger.addHandler(console.log)

ml2.addHandler(function(message) {
  $('#console').append.apply(jQuery, arguments.concat('ml2 message...'))
})

ml.setLevel(1)

ml2.setLevel(3)

// ml2.error('ml2 : error')

// NewLogger.getRootLogger().setLevel(4)

ml.debug("ml : debug");
ml.info("ml : info");
ml.trace("ml : trace");


// // myLogger.removeHandler(2NewLogger.Config.DefaultHandlers.debug)


// myLogger.config("myLogger : config");


// cl('_______________________________')


// var otherLogger = NewLogger.Manager.getLogger("xrx");

// // cl(otherLogger)

// otherLogger.setLevel(5)

// // cl(otherLogger.getLevel())

// otherLogger.finest("otherLogger : finest")
// otherLogger.config("otherLogger : config")
// otherLogger.info("otherLogger : info")
// otherLogger.warning("otherLogger : warning")
// otherLogger.severe("otherLogger : severe")



/**
 * @todo
 * - make the ConsoleHandler behave just like the Logger.js console
 * - add the [removeHandler] method implementation
 * - normalize the Manager and the Config
 * - add conditions that check if the logging is enabled or not(done via Config and Manager)
 */


});