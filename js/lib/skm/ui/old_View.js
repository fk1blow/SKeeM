
// SKM WebSocket implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Observable'], function(SKMObject, SKMLogger, SKMObservable)
{
'use strict';


var Logger = SKMLogger.create();


/**
 * @todo
 * - cache the regexes for later use
 */
var EventResponder = SKMObject.extend({
  /**
   * View events object
   */
  _gesturesCollection: null,

  /**
   * The gesture manger of this view
   */
  _gestureManager: null,

  /**
   * The object in which the event handler will be called
   */
  _handleInContext: null,

  /**
   * Should log on delegates to object
   */
  _debug: false,

  /**
   * Test if event is of touch type
   */
  _touchEventRegex: (new RegExp('^touch|tap|swipe.*?')),

  /**
   * Holds data about the views primary attributes - [el], [events], [binds]
   */
  _refreshData: null,

  initialize: function() {
    this._gesturesCollection = [];
    // this._gestureManager = Gsture.GstureManager.create();
  },

  /**
   * Delegates a single event to this.el
   * 
   * @param  {Array}    events   the event/s
   * @param  {String}   selector selector to undelegate
   * @param  {Function}   callback the delegate handler
   * @param  {Function}   context  callback function apply context
   */
  addDelegatedEvent: function(event, selector, callback, context) {
    var ctx = this._handleInContext || this;
    if ( typeof callback !== 'function' )
      throw new Error('LegacyEvent.attachEvent -> unable to delegate event. Callback is of ' +
        typeof callback + ' type');
    this.el.on(event, selector, function() {
      callback.apply(ctx, [].slice.call(arguments));
    });
  },

  /**
   * Removes the delegated event from this.el - if no argument
   * or "all", unbinds everything
   * 
   * @param  {Array}    events   the event/s
   * @param  {String}   selector selector to undelegate
   * @param  {Function}   callback the delegate handler
   * 
   * @return {Boolean}  if no arguments given, the function will immediately return false
   */
  removeDelegatedEvent: function(events, selector, callback) {
    var args = [].slice.call(arguments),
      argsLen = args.length,
      selector = selector || "**";
    // if no argument given, unbind everything
    if ( !args.length )
      return false;
    // every event attached to this element
    if ( argsLen == 1 && events == 'all' )
      this.el.unbind();
    else // if selector and/or callback provided
      jQuery(this.el).off(events, selector, callback);
    return true;
  },

  /**
   * Delegates "this.el.events" to child elements through "this.events" object
   */
  processAttachedEvents: function(eventsList) {
    var previousSplitter = /^(\S+)\s*(.*)$/;
    var key, events = eventsList, splitter = /^([^\s]+)(?:\s*)([\d]+)?(?:\s*)([\d]+)?(.*)$/;
    var matches, callback, selector, event, treshold;
    var gestureType;
    var self = this;

    // now start assingning the events
    for(key in events) {
      if(!events.hasOwnProperty(key))
        continue;
      // key matches; [object, event, target]
      matches = key.match(splitter);
      // handle the event process
      var event = {
        type:           matches[1], // event
        treshold:       { time: matches[2], space: matches[3] },
        selector:       matches[4],
        parentEl:       this.el,
        callback:       this[events[key]] || events[key],
        context:        this
      }
      /**
       * Create a Gsture factory
       * - takes an event as a param
       * - based on that event, it creates the appropriate Gsture object
       * - don't know about the mouse events...
       */
      if ( this._touchEventRegex.test(event.type) ) {
        this._gestureManager.addEventWatch(event);
        // Gsture.Builder.addEvent(event);
        // gestureType = Gsture[_(event.type).capitalize()];
        // this._gesturesCollection.push(gestureType.create(event));
      } else {
        this.addDelegatedEvent(matches[1], matches[4], event.callback, this)
        // this.handleMouseEvent(event);
      }
    }
    events = null;
  },

  /**
   * Prepares an object containing [this.events] object and [this.el] for refreshing
   */
  _prepareForRefresh: function(selector, events) {
    this._refreshData = { selector: selector, events: events };
  }
});


// var View = SK.ui.EventResponder.extend(SK.util.Observable, {
var View = EventResponder.extend(SKMObservable, {
  /**
   * The dom element(object) associated with the View
   * @type {Object}
   */
  el: null,

  /**
   * Pseudo ideftifier
   * @type {Integer}
   */
  cid: null,

  /**
   * The parent view object
   * @type {Object}
   */
  parentView: null,

  /**
   * The parent ViewController object(usually, the factory that created this object)
   * @type {Object}
   */
  parentViewController: null,

  /**
   * Initialize and configure the instance
   * @param  {Object} defaults an object representing additional args passed at Object.create
   */
  setup: function() {},

  initialize: function(defaults) {
    // call super implementation
    SK.ui.EventResponder.prototype.initialize.call(this);

    // configure initialization options... if any
    // SK.util.Object.prepareDefaultAttributes(this, defaults || {});

    // set identifier
    this.cid = SK.util.Identifier.getIncrementedId(this['TYPE']);

    // some simple validations
    this._debugSelectors();

    
    // Add events to target
    // this.delegateEvents(this.events);
    // this.eventHandlerObject = SK.ui.EventResponder.create({ eventsList: this.events, handleInContext: this });
    this.processAttachedEvents(this.events);


    // prepare refresh data
    this._prepareForRefresh(this.el.selector, this.events);
    // this.eventHandlerObject._prepareForRefresh(this.el.selector, this.events);


    // calls the View pseudo constructor
    // if more than one argument, use method.apply
    // else call the method passing the defaults param
    if(arguments.length > 1)
      this.setup.apply(this, [].slice.call(arguments));
    else
      this.setup(defaults);
  },

  /**
   * Reattaches [this.el] to the View Object reattaching the events along with it
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
    this.removeDelegatedEvent('all');
    // nullify the object [this.el] 
    if (this.el instanceof jQuery)
      this.el = null;
    // reassigns [el] or current 
    this.el = newEl;
    // some simple validations 
    this._debugSelectors();
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
    this.removeDelegatedEvent('all');
    // removes util.Observable
    this.unbind();
    // and removes the element from the dom
    if(this.el != null)
      this.el.remove();
    // nullify el 
    this.el = null;
  },

  /**
   * Checks [this.el] against jQuery and check for selector result
   */
  _debugSelectors: function() {
    var isJqueryInstance = (this.el instanceof jQuery);
    var selectorHasEntries = (isJqueryInstance && this.el.length > 0);
    if ( !isJqueryInstance && this.debug ) {
      SK.util.Logger.getInstance().warn('View.el should be a jQuery object; current state is :: ',
        '{' + typeof this.el + '}', this.el);
    }
    if ( !selectorHasEntries && this.debug ) {
      SK.util.Logger.getInstance().warn('Unable to find an element matching :: ', this.el.selector);
    }
  }
});


return View;


});