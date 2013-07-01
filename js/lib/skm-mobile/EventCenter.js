
// Event center

define(['backbone'], function() {
'use strict';


var EventCenter = function() {};


_.extend(EventCenter.prototype, Backbone.Events);


return EventCenter;


});