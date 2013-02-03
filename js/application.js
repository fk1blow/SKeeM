requirejs.config({
  baseUrl: 'js/lib',
  paths: {
    "jquery": "jquery-1.7.2.min",
    "underscore": "underscore-min",
    "console": "console-wrapper",
    "skm": "./skm"
    // "templates": "templates",
    // "text": "lib/require/text",
    // "views": "views"
  }
});


require(['console', 'skm/skm'], function() {
  var testFile = require(['skm/test-websocket']);
  // var testFile = require(['skm/test']);
  // var EM = require(['js/lib/ember-0.9.3.js']);
  console.log('Required :: application.js');
});