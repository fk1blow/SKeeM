// SKM WebSocket implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Observable'], function(SKMObject, SKMLogger, SKMObservable)
{


var Logger = SKMLogger.create();


var ViewController = SKMObject.extend(SKMObservable, {
    TYPE: 'ViewController',

    /**
     * Pseudo ideftifier
     * @type {Integer}
     */
    cid: null,

     /**
     * Initialize and configure the instance
     * @param  {Object} defaults an object representing additional args passed at Object.create
     */
    setup: function(defaults) {},

    /**
     * The view instance
     * @type {Object}
     */
    view: null,

    /**
     * Children controller objects
     * Should this be a list of objects or plain instances?!
     * 
     * @type {Object} Object
     */
    _childViewControllers: null,

    /**
     * The parent viewController object
     * 
     * @type {Object}
     */
    _parentViewController: null,

    /**
     * Constructor
     * @param  {Mixed} default attributes
     */
    initialize: function(defaults) {
       SK.util.Object.prepareDefaultAttributes(this, defaults || {});

      // set identifier
      this.cid = SK.util.Identifier.getIncrementedId(this['TYPE']);

      // the children controller/s
      this._childViewControllers = {};

      // call setup initializer
      if(arguments.length > 1) {
        this.setup.apply(this, [].slice.call(arguments));
      } else {
        this.setup(defaults);
      }
    },

    /**
     * Adds a child viewController
     * 
     * @description queries the [this._childViewControllers] to find out if
     * the controller already resides and if not, it creates it
     * 
     * @param {String} controllerId  controller string identifier
     * @param {Object} childController the actual object to be created and inserted as a child
     * @param {Object} options     an options argument for the child viewController
     */
    addChildViewController: function(controllerId, childController, options) {
      /* check childController object reference */
      if(! SK.util.Object.isObject(childController))
        throw new TypeError('childController argument must be of type Object.');
      /* check options object argument */
      if(options && ! SK.util.Object.isObject(options))
        throw new TypeError('options argument argument must be of type Object.');
      
      /* not sure if this (and the removal from the parent) 
      should be done implicitly or by the user*/
      // var options = options || {};
      // options._parentViewController = this;
      
      /* if not in [this.childViewController], create it */
      if(! (controllerId in this._childViewControllers))
        this._childViewControllers[controllerId] = childController.create(options);
      return this._childViewControllers[controllerId];
    },

    /**
     * Removes a child from the current viewController
     * 
     * @description finds the child(if exists), calls the destroy method and then
     * nullifies the reference from [this._childViewControllers]
     * 
     * @param  {String} controllerId  controller string identifier
     */
    removeChildViewController: function(controllerId) {
      var options = options || {};
      if(controllerId in this._childViewControllers) {
        this._childViewControllers[controllerId].destroy();
        delete this._childViewControllers[controllerId];
      }
      return this;
    },

    removeFromParentViewController: function() {
      //
    },

    /**
     * Returns the child viewController
     * 
     * @param  {String} controllerId controller string identifier 
     * @return {Mixed}        viewController or undefined
     */
    getChildViewController: function(controllerId) {
      return this._childViewControllers[controllerId];
    },

    loadView: function() {
      //
    },

    unloadView: function() {
      //
    },

    /**
     * Destroys all the childViewController and their respective childViews,
     * then destroys the current view(by calling this.view.destroyView)
     * and resets the [childViewController] to a blank new object
     * 
     * @return {Object} [this]
     */
    destroy: function() {
      // this.removeFromParentViewController();
      // delete this._parentViewController;
      var subControllers = this._childViewControllers;
      for(var controller in subControllers) {
        if(subControllers.hasOwnProperty(controller)) {
          subControllers[controller].destroy();
          delete this._childViewControllers[controller];
        }
      }
      this._childViewControllers = {};
      this.unbind()
      this.destroyChildView();
      return this;
    },

    /**
     * Destroys the view child by calling its destroy method
     */
    destroyChildView: function() {
      if(this.view)
        this.view.destroy();
      return this;
    }
  });


return ViewController;


});