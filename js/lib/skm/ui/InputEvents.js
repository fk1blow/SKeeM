
// SKM ui Input Events Mixin

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable'], function(SKMObject, SKMLogger, Subscribable)
{
'use strict';


/**
 * Desktop and Touch events mixin
 *
 * @todo add the touch events delegate mechanism
 * @type {SKMMixin}
 */
var InputEvents = {
	_eventsNamespace: '.inputEvents',

  /**
   * Adds events delegates from [this.el]
   * Additionally, it splits the parsing process in two parts:
   *   1. parses the touch events, which will need a special attention
   *   2. parses the desktop event, delegating them through jQuery
   */
  delegateEvents: function(events) {
    var matches, eventRef;
    var item, eventList   = events || this.events;
    var splitterReg       = /^([^\s]+)(?:\s*)([\d]+)?(?:\s*)([\d]+)?(.*)$/;
    var touchReg          = /^touch|tap|swipe.*?'/;
    // Undelegate every event, if there are events binded to the [el]
    this.undelegateEvents();
    // Parse the event list
    for ( item in eventList ) {
      matches = item.match(splitterReg);
      eventRef = {
        type:      matches[1],
        selector:  matches[4],
        parentEl:  this.el,
        callback:  this[eventList[item]] || eventList[item]
      }
      // Separate touch from desktop events
      if ( touchReg.test(matches[1]) ) {
        eventRef['treshold'] = { time: matches[2], space: matches[3] };
        this._delegateTouchEvent(eventRef);
      } else {
        this._delegateDesktopEvent(eventRef);
      }
    }
    return this;
  },

  /**
   * Removes the input events and all related callbacks
   */
  undelegateEvents: function() {
    this.el.off(this._eventsNamespace);
    return this;
  },

  /**
   * Delegates a single event to [this.el]
   */
  _delegateDesktopEvent: function(event) {
    var ctx = this;
    var cb  = event.callback;
    if ( typeof cb !== 'function' ) {
      throw new TypeError('InputEvents._delegateDesktopEvent :: invalid callback type.'
        + ' Callback is of ' + typeof cb + ' type');
    }
    this.el.on(event.type + this._eventsNamespace, event.selector, function(evt) {
      cb.apply(ctx, [].slice.call(arguments));
    });
  },

  /**
   * Delegates the touch/mobile specific events, to an object
   * @description TBD
   */
  _delegateTouchEvent: function(event) {
    cl('ADD: the touch events delegate mechanism')
    // cl('_delegateTouchEvents : To be implemented!', event);
  }
};


return InputEvents;


});