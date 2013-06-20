
// ArrayAdapter implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable',
  'skm-mobile/data/BaseAdapter',
  'skm-mobile/data/ArrayList'],
  function(SKMObject, SKMLogger, Subscribable, BaseAdapter, ArrayList)
{
'use strict';


var Logger = SKMLogger.create();


var ArrayAdapter = BaseAdapter.extend(ArrayList, {
  initialize: function() {
    this._listData = [];
    this._view = null;
  }
});


return ArrayAdapter;


});