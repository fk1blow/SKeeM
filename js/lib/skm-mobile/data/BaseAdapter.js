
// Base Adapter implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable'],
  function(SKMObject, SKMLogger, Subscribable)
{
'use strict';


var Logger = SKMLogger.create();


var BaseAdapter = SKMObject.extend(Subscribable, {
  _view: null,

  // convert view main method
  getView: function() {
    return this._view;
  },

  createView: function() {
    //
  },

  isEmpty: function() {
    return this.getCount() == 0;
  },

  removeItemAt: function(item, position) {
    //
  },

  addItemAt: function(item, position) {
    //
  }
});


return BaseAdapter;


});