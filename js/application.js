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
  var testFile = require(['skm/test-views']);
  console.log('Required :: application.js');
});