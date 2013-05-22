requirejs.config({
  baseUrl: 'http://10.0.3.98:82/SKeeM/js/lib',
  paths: {
    "jquery": "jquery-1.7.2.min",
    "underscore": "underscore-min",
    "console": "console-wrapper",
    "skm": "./skm"
  }
});


require(['console', 'skm/skm'], function() {
  // var testFile = require(['skm/test-websocket']);
  var testFile = require(['skm/test-skmobject']);
  console.log('Required :: application.js');
});