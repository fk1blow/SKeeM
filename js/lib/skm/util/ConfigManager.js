  
// Configuration manager

define([], function() {
'use strict';


var Errors = {
  LIST_ALREADY_ADDED: "Unable to add configuration: "
    + " configuration list already added"
}


var configurationList = {
  prefix: null
};


return {
  addConfigurationList: function(list) {
    configurationList = list;
    return this;
  },

  getConfigurationList: function() {
    return configurationList;
  },

  getPrefix: function(configAttr) {
    var prefix = null, list = this.getConfigurationList().prefix;
    if ( configAttr in list )
      prefix = list[configAttr];
    return prefix;
  }
}


});