
// SKM EventResponder implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Observable'], function(SKMObject, SKMLogger, SKMObservable)
{
'use strict';


/**
 * Responder object
 * 
 * @description similar with ios Responder object, in the sense that
 * it adds pub/sub, alongside with proper event propagation
 * @type {Object}
 */
var EventResponder = SKMObject.extend(SKMObservable, {
	_childResponders: null,

  initialize: function() {
    cl('EventResponder.initialize');
    this._childResponders = [];
  },

  addChildResponder: function(responder) {
  	var that = this;
  	this._childResponders.push(responder);
  	responder.on('all', this.handleChildResponder, this);
  },

  removeChildResponder: function() {
  	//
  },

  handleChildResponder: function(eventName) {
  	var args = [].slice.call(arguments);
  	this.fire(eventName, args.slice(args.length - 1));
  }
});


return EventResponder;


});