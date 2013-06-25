  
// Configuration manager

define([], function() {
'use strict';


var Errors = {
  LIST_ALREADY_ADDED: "Unable to add configuration: "
    + " configuration list already added"
}


var configurationList = {
  prefixes: null
};


return {
  addConfigurationList: function(list) {
    configurationList = list;
    return this;
  },

  getConfigurationList: function() {
    return configurationList;
  },

  getPrefixFor: function(module) {
    var prefix = null;
    if ( module in configurationList.prefixes )
      prefix = configurationList.prefixes[module];
    return prefix;
  }
}


});