  
// Match List View

define(['skm/util/KLogger',
  'skm-mobile/navigation/NavigationController',
  'skm/util/ConfigManager',
  'skm-mobile/EventCenter'],
  function(KLogger, NavigationController, ConfigManager, EventCenter)
{
'use strict';


/** screen resize events variables */
var resizeTickerTimeout, resizeTickerFirst = 0;


var Application = function(options) {
  var options = options || {};

  this.NAME = options.NAME || "AppX";

  this.VERSION = options.VERSION || "x.x.x";

  this.BASEURL = options.BASEURL || null;

  this.Logger = KLogger.getRootLogger().setLevel(1);

  this.ConfigManager = new ConfigManager();

  this.EventCenter = new EventCenter();

  // Pass the EventCenter and the ConfigManager as a Depencency
  // to the application's NavigationController instance
  this.Navigation = new NavigationController({
    EventCenter: this.EventCenter,
    ConfigManager: this.ConfigManager
  });

  // attach application-wide events
  this._attachApplicationEvents();
};


Application.prototype = {

  startApplication: function(withPageController) {
    var that = this;
    $(function() {
      that.Navigation.navigateToPage(withPageController);
    });
  },

  _attachApplicationEvents: function() {
    var that = this;

    $(window).resize(function() {
      clearTimeout(resizeTickerTimeout);

      resizeTickerTimeout = setTimeout(function() {
        that.EventCenter.trigger('window:resized');
        resizeTickerFirst = 0;
      }, 500);

      resizeTickerFirst = 1;
    });
  }
}


return Application;


});
