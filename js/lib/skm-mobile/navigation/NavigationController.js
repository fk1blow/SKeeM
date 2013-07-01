
// Navigation controller

define(['skm/k/Object',
  'skm/util/Logger',
  'skm-mobile/navigation/ActiveController'],
  function(SKMObject, SKMLogger, ActiveController)
{
'use strict';


var Logger = new SKMLogger();


/**
 * Represents a command given to the Navigation Controller
 *
 * @description acts as a state machine that changes its [_inProgresss]
 * attribute everytime the navigation has successfully
 * completed after a call to [NavigationController.navigateTo]
 */
var NavigationTask = function() {
  this._inProgress = true;
  this.parameters = null;
  this._resetParameters();
};

NavigationTask.prototype = {
  isInProgress: function() {
    return this._inProgress == true;
  },

  addParametersList: function(paramsObject) {
    this.parameters = paramsObject;
    return this;
  },

  getParameter: function(name) {
    return this.parameters[name] || null;
  },

  setParameter: function(parameter, value) {
    return this[parameter] = value;
  },

  setTaskInProgress: function() {
    this._inProgress = true;
    return this;
  },

  setTaskDone: function() {
    this._inProgress = false;
    this._resetParameters();
    return this;
  },

  _resetParameters: function() {
    this.parameters = {
      targetController: null, controllerAction: null, actionParams: null
    };
  }
};


/**
 * @todo add methods for interogating this object about the
 * pages controller stack, its state and various assets that it holds
 */
var NavigationController = function(options) {
  this.activeController = null;
  this.currentTask = null;
  this.activeController = new ActiveController(options);
}


NavigationController.prototype = {

  /**
   * I tries to navigate to the required controller and action
   * 
   * @param  {Object} pageObject The action and action parameters values
   *
   * @todo should become [navigateTo] and the options parameters sent
   * as an options param object
   */
  navigateToPage: function(requestedTask) {
    Logger.info('NavigationController.navigateToPage');
    var task = this.currentTask;
    
    // if a task exist but is not in progress,
    // mark as done and create a new task instance
    if ( task == null || ( task && task.isInProgress() == false ) ) {
      task = this.currentTask = new NavigationTask();
      task.addParametersList(requestedTask || {});
      // tries to activate the requested page controller object
      this.activeController.processNavigationTask(task);
    } else {
      // a task is hanging: notify with an error logger
      Logger.warn("Unable to navigate: task already in progress!");
    }
  },

  /**
   * @tbd
   * 
   * Navigates to a given URL
   *
   * @description given a string url, the ActiveCtrl trie to navigate
   * to that url, using window.location object
   * @param  {[type]} url The url as a string, used in this relocation
   */
  navigateToUrl: function(url) {
    Logger.info('NavigationController.navigateToUrl');
  },

  /**
   * @tbd
   * 
   * Activates a requested page without changing the url or the history
   * @return {[type]} [description]
   */
  navigateWithoutHistory: function() {
    Logger.info('NavigationController.navigateToUrl');
  }
};


return NavigationController;


});