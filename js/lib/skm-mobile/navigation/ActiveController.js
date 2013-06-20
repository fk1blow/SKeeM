
// Action controller 

define(['skm/util/Logger',
  'skm-mobile/navigation/ErrorsConstants',
  'skm-mobile/navigation/ActionDispatcher',
  'skm-mobile/ApplicationObserver'],
  function(SKMLogger, ErrorsConstants,
    ActionDispatcher, AppObserver)
{
'use strict';


var Logger = new SKMLogger();


var AppObserver = AppObserver.getInstance();


var ControllersList = {
  addController: function(identifier, controllerInstance) {
    if ( this.controllerInStack(identifier) )
      throw new Error(ErrorsConstants.CONTROLLER_ALREADY_ADDED);
    this._controllerStack[identifier] = controllerInstance;
    return this;
  },

  removeController: function(identifier) {
    if ( ! this.controllerInStack(identifier) )
      throw new Error(ErrorsConstants.CONTROLLER_REMOVE_NOT_FOUND + identifier);
    delete this._controllerStack[identifier];
    return this;
  },

  controllerInStack: function(identifier) {
    return ( identifier in this._controllerStack );
  }
};


/**
 * ActiveController object
 *
 * @description acts as the Mediator between the current active PageController
 * and the NavigationController that sends it commands
 */
var ActiveController = function() {
  this._controllerStack = null;
  this._activeController = null;
  this._previousController = null;
  this._temporaryController = null;
  this._actionDispatcher = null;
  this._navigationTask = null;
  this._beforeTransitionDelay = 50;
  this.initialize.apply(this, arguments);
}


_.extend(ActiveController.prototype, Backbone.Events, ControllersList, {

  initialize: function() {
    this._controllerStack = {};
    this._actionDispatcher = new ActionDispatcher();
  },

  processNavigationTask: function(task) {
    Logger.info('ActiveController.processNavigationTask');
    this._navigationTask = task.setTaskInProgress();
    this._loadController(task.getParameter('controller'));
  },

  /*
    Controllers accessors
    ---------------------
   */
  
  setActiveController: function(controller) {
    // paranoid or just mistaken?
    controller.off();
    this._activeController = controller;
  },

  setPreviousController: function(controller) {
    this._previousController = controller;
  },

  setTemporaryController: function(controller) {
    this._temporaryController = controller;
  },

  /*
    Handlers
    --------
   */
  
  handleDelayedTransition: function() {
    Logger.info('ActiveController.handleDelayedTransition');

    // deactivates the previous active page controller
    this._deactivateActiveController();

    // activates the next active page controller
    this._activateNextController();

    // dispatches the active controller's action and params
    this._actionDispatcher.dispatch(this._activeController, {
      action: this._navigationTask.getParameter('action'),
      params: this._navigationTask.getParameter('actionParams')
    });

    // Mark navigation task as done and nullify reference
    this._navigationTask.setTaskDone();

    // notify app about page activated...
    AppObserver.trigger('PageActivated');
  },

  handlePageSetupComplete: function() {
    Logger.info('ActiveController.handlePageSetupComplete');

    var that = this;

    // tbd
    // not yet fully tested
    this._disposePreviousController();

    // set the previous controller, if any
    this.setPreviousController(this._activeController);

    // set the new active controller
    this.setActiveController(this._temporaryController);

    // dispose the _next controller event handlers and reference
    this._clearTemporaryController();

    // start transitions after a small delay
    setTimeout(function() {
      that.handleDelayedTransition();
    }, this._beforeTransitionDelay);
  },

  handlePageSetupError: function() {
    Logger.info('ActiveController.handlePageSetupError');
    
    // dispose the _next controller event handlers and reference
    this._clearTemporaryController();

    // Mark navigation task as done and nullify reference
    this._navigationTask.setTaskDone();

    // @todo no events triggered to NavCtrl
    this.trigger('errorActivating');
  },

  handlControllerRequired: function(controller) {
    Logger.info('ActiveController.handlControllerRequired');

    // Set temporary next controller
    this.setTemporaryController(controller);

    // attach some events to the temporary controller
    this._temporaryController
      .on('pageSetupComplete', this.handlePageSetupComplete, this)
      .on('pageSetupError', this.handlePageSetupError, this);

    // loads and creates the view, load its content....
    controller.setupPage();
  },

  /*
    Private realm
    -------------
   */
  
  _loadController: function(identifier) {
    var that = this, instance = null, name = identifier + 'Controller';

    if ( this.controllerInStack(identifier) ) {
      this.handlControllerRequired(this._controllerStack[identifier]);
    } else {
      require(['controllers/' + name], function(constructor) {
        instance = new constructor({ identifier: identifier });
        that.addController(identifier, instance);
        that.handlControllerRequired(instance);
      });
    }
  },

  _disposePreviousController: function() {
    var prev = this._previousController;
    // check if the previous is not eq to the next controller
    if ( prev && prev != this._temporaryController )
      this._previousController.disposePage();
  },

  _clearTemporaryController: function() {
    if ( this._temporaryController ) {
      this._temporaryController.off();
      this._temporaryController = null;
    }
  },

  _activateNextController: function() {
    this._activeController.view.show();
  },

  _deactivateActiveController: function() {
    if ( this._previousController )
      this._previousController.view.hide();
  }
});


return ActiveController;


});