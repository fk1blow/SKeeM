
/**
 * @todo
 * - Cache the events parsing if [this.events] has not been changed
 */

// SKM View implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/ui/InputEvents',
  'skm/util/Subscribable'],
  function(SKMObject, SKMLogger, InputEvents, Subscribable)
{
'use strict';


var Logger = SKMLogger.create();


/**
 * SKeeM View implementation
 * @description similar to Backbone.View implementation
 */
var View = SKMObject.extend(InputEvents, Subscribable, {
  /**
   * The DOM element(object) associated with the View
   * @type {Object}
   */
  el: null,

  /**
   * Pseudo ideftifier
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
  defaultTag: 'div',

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
  _subviewCollection: null,

  /**
   * Pointer to the parent of this View
   * @type {SKMView}
   */
  _superview: null,

  /**
   * Parent ViewController reference
   * @type {SKMViewController}
   */
  _viewController: null,

  /**
   * Holds data about the views primary
   * attributes - [el], [events], [binds]
   * @type {Object}
   */
  _refreshData: null,

  /**
   * Initialize and configure the instance
   * @param  {Object} defaults an object representing additional args passed at Object.create
   */
  setup: function() {},

  /**
   * Default view render implementation.
   * Should be overriten by the user.
   */
  render: function() {},

  /**
   * View initialize process
   */
  initialize: function(defaults) {
    // Prepares the bounding default element [this.el]
    this._prepareElement();
    // set identifier
    this.cid = _.uniqueId('SKMView');
    // TBD - View live debugger version
    // if ( this.assignLiveDebugId )
    //   $(this.el).attr('data-viewId', this.cid);
    // delegate eventes
  	this.delegateEvents(this.events);
    // Prepare the element for later refreshing
    // ex: reattaching elements, events, etc
    this._prepareElementRefresh();
    // Calls the View setup function, passing the init arguments
    if ( arguments.length )
      this.setup.apply(this, [].slice.call(arguments));
    else
      this.setup(defaults);
  },

  /**
   * Sets SKMView.el and undelegates attached dom events
   * @param {Object/jQuery} element A dom element
   */
  setElement: function(element) {
    if ( this.el )
      this.undelegateEvents();
    if ( element instanceof jQuery )
      this.el = element;
    else
      jQuery(element);
    return this;
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
    // set the new element
    this.setElement(newEl);
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
    // removes all Subscribable events and callbacks
    this.off();
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
    var el = null;
    // If [this.el] is not defined, create a wrapper for it
    if ( !this.el ) {
      el = $(document.createElement(this.defaultTag));
      this.setElement(el);
    } else {
      // If it's not of jQuery type
      if ( !(this.el instanceof jQuery) )
        throw new TypeError('Invalid [SKMView.el] type.' +
          ' Required type is jQuery!')
    }
  },

  /**
   * Prepares an object containing [this.events]
   * object and [this.el] for refreshing
   */
  _prepareElementRefresh: function() {
    this._refreshData = { selector: this.el.selector,
                          events: this.events };
  }
});


return View;


});