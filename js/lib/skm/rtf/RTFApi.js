
// RTF Api Manager implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable'
  'skm/net/WSWrapper',
  'skm/net/XHRWrapper',
  'skm/rtf/ConnectorManager',
  'skm/rtf/XHRConnector',
  'skm/rtf/WSConnector'],
  function(SKMObject, SKMLogger, Subscribable, WSWrapper, XHRWrapper,
           ConnectorManager, XHRConnector, WSConnector)
{
'use strict';


var Logger = SKMLogger.create();
  

// RTFApi implementation
var Api = SKMObject.extend(Subscribable, {
  _connectorManager: null,

  initialize: function() {
    Logger.debug('%cnew RTFApi', 'color:#A2A2A2');
    this._initConnectorManager();
  },

  start: function() {
    //
  },

  stop: function() {
    //
  },

  
  /*
    Subscriptions
   */
  

  

  subscribeTo: function(name, callback) {
    //
  },

  unsubscribeFrom: function(name) {
    //
  },


  /*
    Private
   */
  

  _initConnectorManager: function() {
    this._connectorManager = ConnectorManager.create();
  }
});


return Api;


});