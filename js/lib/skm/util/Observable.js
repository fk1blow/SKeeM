
/**
 * Break apart the Publish-Subcribe part of the Observable
 * and build two distinc modules:
 * 	1 - subscribable
 * 	2 - observable
 *
 * #1 Subscribable
 * - this mixin gives the ability to subscribe to notifications
 *
 * #2 Observable
 * - ability to observe object properties
 */

define(['skm/skm',
	'skm/k/Mixin'], function(skm, SKMMixin)
{
'use strict';


var SKM = window.SKM || {};


var eventSplitter = /\s+/;


/**
 * Event/Observable/whatever mixin
 * A slightly modified versions of Backbone's Event Object
 * 
 * @author Jeremy Ashkenas, DocumentCloud Inc
 * @link http://documentcloud.github.com/backbone/
 */
var Observable = SKMMixin.create({
	on: function(events, callback, context) {
	  var calls, event, list;
	  if (!callback) return this;

	  events = events.split(eventSplitter);
	  calls = this._eventCallbacks || (this._eventCallbacks = {});

	  while (event = events.shift()) {
	    list = calls[event] || (calls[event] = []);
	    list.push(callback, context || this);
	  }

	  return this;
	},

	off: function(events, callback, context) {
	  var event, calls, list, i;

	  // No events, or removing *all* events.
	  if (!(calls = this._eventCallbacks)) return this;
	  if (!(events || callback || context)) {
	    delete this._eventCallbacks;
	    return this;
	  }

	  events = events.split(eventSplitter);

	  // Loop through the callback list, splicing where appropriate.
	  while (event = events.shift()) {
	    list = calls[event];

	    if (!(list = calls[event]) || !(callback || context)) {
	      delete calls[event];
	      continue;
	    }

	    for (i = list.length - 2; i >= 0; i -= 2) {
	      if (!(callback && list[i] !== callback || context && list[i + 1] !== context)) {
	        list.splice(i, 2);
	      }
	    }
	  }

	  return this;
	},

	fire: function(events) {
	  var event, calls, list, i, length, args, all, rest;
	  if (!(calls = this._eventCallbacks)) return this;

	  rest = [];
	  events = events.split(eventSplitter);
	  for (i = 1, length = arguments.length; i < length; i++) {
	    rest[i - 1] = arguments[i];
	  }

	  while (event = events.shift()) {
	    // Copy callback lists to prevent modification.
	    if (list = calls[event])
	      list = list.slice();

	    if (list) {
	      for (i = 0, length = list.length; i < length; i += 2) {
	        list[i].apply(list[i + 1] || this, rest);
	      }
	    }
	  }

	  return this;
	}
});


return Observable;


});