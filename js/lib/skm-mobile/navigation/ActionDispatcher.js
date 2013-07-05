// Action dispatcher

define(['skm/util/Logger'], function(SKMLogger) {
'use strict';


var Logger = new SKMLogger();


/**
 * @todo prepare the ActionDispatcher to handle filters simmilar to
 * the ones from RoR - before, after, etc
 */
var ActionDispatcher = function() {
  this._actionPrefix = "action";
  this._actionDefaultSuffix = "default";
  this._currentAction = null;
  this._previousAction = null;
  this._beforeFilters = null;
  this._afterFilters = null;
}


ActionDispatcher.prototype = {

  dispatch: function(controller, options) {
    options || (options = {});
    var actionName = this._getActionNormalizedName(options.action);

    // theres a problem if no controller is found
    if ( ! controller ) {
      // throw new Error("No controller assigned for this action"); 
      throw new Error("No controller found to dispatch this action.");
    }

    // if the controller object contains the required action
    if ( actionName in controller ) {
      this.setCurrentAction(actionName);
      controller[actionName].call(controller, options.params);
    } else {
      Logger.warn('Unable to find: "' + actionName + '" on requested controller');
    }
  },

  setCurrentAction: function(action) {
    if ( this._currentAction )
      this.setPreviousAction(this._currentAction);
    this._currentAction = action;
  },

  setPreviousAction: function(action) {
    this._previousAction = action;
  },

  isEqualToPreviousAction: function(requestedAction) {
    return this._previousAction == requestedAction;
  },

  /*
    Privates
    --------
   */
  
  _getActionNormalizedName: function(action) {
    var segments = [this._actionPrefix, action || this._actionDefaultSuffix];
    return segments.join("_");
  }
};


return ActionDispatcher;


});
