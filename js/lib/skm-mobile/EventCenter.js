
// Event center

define(['backbone'], function() {
'use strict';


var EventCenter = function() {};


_.extend(EventCenter.prototype, Backbone.Events);


return (function() {
  var EventCenterInstance = null;

  return {
    getInstance: function() {
      if ( EventCenterInstance == null )
        EventCenterInstance = new EventCenter();
      return EventCenterInstance;
    }
  }
}());


});