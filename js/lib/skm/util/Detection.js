
// Various detections
// Majority of tests taken from Nodernizr - https://github.com/Modernizr/Modernizr, or
// other libraries.

define(['skm/skm', 'skm/util/Logger'], function() {
'use strict';


var Logger = new SKMLogger();


SKM.util.Detection = {
	websocket: function() {
		return 'WebSocket' in window || 'MozWebSocket' in window;
	},

  webworkers: function() {
    return !!window.Worker;
  },

  uaIsiDevice: function() {
  	return (typeof navigator !== 'undefined' && /iPad|iPhone|iPod/i.test(navigator.userAgent));
  }
}


});