  
// Match List View

define(['skm/util/Logger',
  'skm-mobile/navigation/NavigationController',
  'skm/util/ConfigManager',
  'skm-mobile/EventCenter'],
  function(SKMLogger, NavigationController, ConfigManager, EventCenter)
{
'use strict';


var Application = function() {
  this.NAME = "BetBrain Mobile";

  this.VERSION = "0.1.0";

  this.Config = ConfigManager;

  this.EventCenter = EventCenter;

  this.Navigation = new NavigationController({
    EventCenter: EventCenter,
    ConfigManager: ConfigManager
  });
}


return Application;


});