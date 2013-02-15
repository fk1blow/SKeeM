
// WebSocket util

define(['skm/k/Object'],
  function(SKMLogger)
{
'use strict';


var Logger = SKMLogger.create();


var Util = {};


Util.ua = {
	webkit: function() {
		return typeof navigator !== 'undefined'
			&& /webkit/i.test(navigator.userAgent);
	},

	iDevice: function() {
		return typeof navigator !== 'undefined'
			&& /iPad|iPhone|iPod/i.test(navigator.userAgent);
	}
}


return Util;


});