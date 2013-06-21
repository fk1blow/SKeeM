
// Application event

define(['backbone'], function() {
'use strict';


var ApplicationObserver = function() {};


_.extend(ApplicationObserver.prototype, Backbone.Events);


return (function() {
  var AppObserverInstance = null;

  return {
    getInstance: function() {
      if ( AppObserverInstance == null )
        AppObserverInstance = new ApplicationObserver();
      return AppObserverInstance;
    }
  }
}());


});