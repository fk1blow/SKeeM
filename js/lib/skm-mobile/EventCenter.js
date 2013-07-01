
// Event center

define(['backbone'], function() {
'use strict';


var EventCenter = function() {};


_.extend(EventCenter.prototype, Backbone.Events);


var eventCenterInstance = null;


return eventCenterInstance == null
  ? (eventCenterInstance = new EventCenter())
  : eventCenterInstance;


/*return (function() {
  var instance = null;

  return {
    getInstance: function() {
      if ( instance == null )
        instance = new EventCenter();
      return instance;
    }
  }
}());*/


});