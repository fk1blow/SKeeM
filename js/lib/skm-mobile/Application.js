  
// Match List View

define(['skm/util/Logger'],
  function(SKMLogger) {
'use strict';


var Logger = new SKMLogger();


var Application = {
  Name: "BetBrain Mobile",

  Version: "0.0.2",  

  Config: null,

  Navigation: null,

  EventCenter: null
};

// @todo decide if this becomes a fct constructor or will remain a plain object
return Application;


});