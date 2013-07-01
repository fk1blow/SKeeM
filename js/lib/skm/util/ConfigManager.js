  
// Configuration manager

define([], function() {
'use strict';


var Errors = {
  LIST_ALREADY_ADDED: "Unable to add configuration: "
    + " configuration list already added"
}


var ConfigManager = function() {
  this.configurationList = {
    prefix: null
  };
}


ConfigManager.prototype = {
  addConfigurationList: function(list) {
    this.configurationList = list;
    return this;
  },

  getConfigurationList: function() {
    return this.configurationList;
  },

  getPrefix: function(configAttr) {
    var prefix = null, list = this.getConfigurationList().prefix;
    if ( configAttr in list )
      prefix = list[configAttr];
    return prefix;
  }
}


return ConfigManager;


});