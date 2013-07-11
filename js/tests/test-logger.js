  
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




/*var myLogger = NewLogger.Manager.getLogger("rtfapi");

console.log(myLogger)

myLogger.setLevel(2)

myLogger.debug("asd", NewLogger.Level.FINE)*/




var otherLogger = NewLogger.Manager.getLogger("xrx");

// cl(otherLogger)

otherLogger.setLevel(5)

// cl(otherLogger.getLevel())


otherLogger.finest("debugging : finest")
otherLogger.config("debugging : config")
otherLogger.info("debugging : info")
otherLogger.warning("debugging : warning")
otherLogger.severe("debugging : severe")




});