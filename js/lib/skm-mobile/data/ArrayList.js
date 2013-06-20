
// ArrayList implementation

define([], function() {
'use strict';


var ArrayList = {
  _listData: null,

  add: function(element) {
    this._listData.push(element);
    this.trigger('added:element', element);
    return this;
  },

  addElements: function(elementList) {
    this._listData = this._listData.concat(elementList);
    this.trigger('added:list', elementList);
    return this;
  },

  insert: function(element, index) {
    var index = index || this.getCount() - 1;
    this._listData.splice(index, 1, element);
    this.trigger('inserted', element, index);
    return this;
  },

  remove: function(element) {
    var data = this._listData, index = this.getIndex(element);
    data.splice(index, 1);
    this.trigger('removed', element);
    return this;
  },

  clear: function() {
    this._listData.splice(0);
    this.trigger('cleared');
    return this;
  },

  getItem: function(position) {
    return this._listData[position] || null;
  },

  getIndex: function(element) {
    return this._listData.indexOf(element);
  },

  getCount: function() {
    return this._listData.length;
  }
}


return ArrayList;


});
