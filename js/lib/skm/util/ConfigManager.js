  
// Configuration manager

define([], function() {
'use strict';


var Errors = {
  LIST_ALREADY_ADDED: "Unable to add configuration: "
    + " configuration list already added"
}

var ConfigManager = (function() {
  var configurationList = null;

  return {
    addConfigurationList: function(config) {
      if ( configurationList != null ) {
        throw new Error(Errors.LIST_ALREADY_ADDED);
      }
      configurationList = config;
    },

    getConfigurationList: function() {
      return configurationList;
    },

    getModulePrefixes: function() {
      var prefixes = null;
      if ( configurationList )
        prefixes = configurationList.prefixes;
      return prefixes;
    }
  }
}());


return ConfigManager;


});