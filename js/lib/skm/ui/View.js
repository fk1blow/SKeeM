
/**
 * @todo
 * - Cache the events parsing if [this.events] has not been changed
 */

// SKM View implementation

define(['skm/k/Object',
  'skm/k/Mixin',
  'skm/ui/EventResponder',
  'skm/util/Logger'],
  function(SKMObject, SKMMixin, Responder, SKMLogger)
{
'use strict';


var Logger = SKMLogger.create();


/**
 * Desktop and Touch events mixin
 *
 * @todo add the touch events delegate mechanism
 * @type {SKMMixin}
 */
var InputEvents = SKMMixin.create({
  /**
   * Holds data about the views primary
   * attributes - [el], [events], [binds]
   * @type {Object}
   */
  _refreshData: null,

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
    this.el.off('.delegatedEvent');
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
    this.el.on(event.type + '.delegatedEvent', event.selector, function(evt) {
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
  },

  /**
   * Prepares an object containing [this.events]
   * object and [this.el] for refreshing
   */
  _prepareElementRefresh: function(selector, events) {
    this._refreshData = { selector: selector, events: events };
  }
});


/**
 * SKeeM View implementation
 * @description similar to Backbone.View implementation
 * @type {Object}
 */
var View = SKMObject.extend(InputEvents, Responder, {
  /**
   * The DOM element(object) associated with the View
   * @type {Object}
   */
  el: null,

  /**
   * Pseudo ideftifierx
   * @type {Integer}
   */
  cid: null,

  /**
   * View events object
   * @type {Object}
   */
  events: null,

  /**
   * The default element used if this.el is not defined
   * @type {String}
   */
  defaultElement: 'div',

  /**
   * Assigns a 'data-viewId' attribute to be used as a visual reference
   * or for the live debugger feature
   * @type {Boolean}
   */
  assignLiveDebugId: false,

  /**
   * Should log on delegates to object
   */
  _debug: false,

  /**
   * The child view elements of this View
   * @type {Object/Array}
   */
  _subViews: null,

  /**
   * Pointer to the parent of this View
   * @type {SKMView}
   */
  superview: null,

  /**
   * Initialize and configure the instance
   * @param  {Object} defaults an object representing additional args passed at Object.create
   */
  setup: function() {},

  /**
   * View initialize process
   */
  initialize: function(defaults) {
    // SKMResponder.prototype.initialize.call(this);
    // Prepares the bounding default element [this.el]
    this._prepareElement();
    // TBD - for live debugger version
    // if ( this.assignLiveDebugId )
    //   $(this.el).attr('data-viewId', this.cid);
    cl('TBD: View live debugger version')
    // delegate eventes
  	this.delegateEvents(this.events);
    // set identifier
    // this.cid = SK.util.Identifier.getIncrementedId(this['TYPE']);
    cl('ADD: View cid idendtifier');
    // Prepare the element for later refreshing
    // ex: reattaching elements, events, etc
    this._prepareElementRefresh(this.el.selector, this.events);
    // Calls the View setup function, passing the init arguments
    if ( arguments.length )
      this.setup.apply(this, [].slice.call(arguments));
    else
      this.setup(defaults);
  },






  /**
   * TBD
   */
  addSubView: function() {
    this.addChildResponder()
  },

  /**
   * TBD
   */
  removeSubView: function() {
    //
  },

  /**
   * TBD
   */
  getSubViews: function() {
    return this._subViews;
  },






  /**
   * Reattaches [this.el] to the View Object, binding the events along with it
   * @return {Object} [this]
   */
  resetElement: function() {
    // the new jQuery object 
    var newEl = $(this._refreshData.selector);
    // if the new element is not an instance of jQuery 
    if (!(newEl instanceof jQuery))
      return false;
    // notify 
    this.fire('before:resetElement');
    // unbind [this.el] events
    this.undelegateEvents();
    // nullify the object [this.el] 
    if (this.el instanceof jQuery)
      this.el = null;
    // reassigns [el] or current 
    this.el = newEl;
    // Add events to target 
    this.delegateEvents(this.events);
    // notify 
    this.fire('after:resetElement');
    return this;
  },

  /**
  * Removes this.el from the DOM, everything inside it and 
  * all bound events and jQuery data associated with the
  * elements are removed.(jQuery docs)
  */
  destroy: function() {
    this.fire('before:destroy');
    // remove/unbind all jQuery events
    this.undelegateEvents();
    // removes util.Observable
    this.unbind();
    // and removes the element from the dom
    if ( this.el != null )
      this.el.remove();
    // nullify el 
    this.el = null;
  },

  /**
   * Prepares and ensures/creates [this.el]
   * @todo should go through an setElement, similar to Backbone's
   */
  _prepareElement: function() {
    // If this.el is not defined, create a wrapper for it
    if ( !this.el ) {
      this.el = $(document.createElement(this.defaultElement));
    }
  }
});


return View;


});