
// SKM EventResponder implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/k/Mixin',
  'skm/util/Observable'], function(SKMObject, SKMLogger, SKMMixin, SKMObservable)
{
'use strict';


cl('CHANGE: EventResponder to a mixin');
cl("ADD: the Template, which will extend the View's functionality;");
cl("will compose html from handlerbar js templates or just a single tag.")

/**
 * @Template
 *
 * + el: jQuery element
 * + el: Handlerbars template
 * + el: default element("<div>")
 *
 * +setElement
 *         - similar to Backbone.View.setElement
 *         - resets the View(i guess will call refreshElement())
 * 
 * +getElement
 * 
 */


/**
 * Responder object
 * 
 * @description similar with ios Responder object, in the sense that
 * it adds pub/sub, alongside with proper event propagation
 * @type {Object}
 */
// var EventResponder = SKMObject.extend(SKMObservable, {
var EventResponder = SKMMixin.define({
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

cl(EventResponder)

/*var EventResponder = SKMObject.extend(SKMObservable, {
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
});*/


return EventResponder;


});