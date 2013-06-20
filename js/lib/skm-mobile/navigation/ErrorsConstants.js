
// Navigation Errors constants

define([], function() {
'use strict';


var Errors = {};
Errors.CONTROLLER_ALREADY_ADDED = 'NavigationController.addController : '
  + 'Unable to add controller. Controller instance already added';

Errors.CONTROLLER_NOT_FOUND = 'NavigationController.xxxxxController : '
  + 'Unable to find controller with name : ';

Errors.CONTROLLER_REMOVE_NOT_FOUND = 'NavigationController.addController : '
  + 'Unable to find controller with name : ';

Errors.CONTROLLER_NOT_A_CONSTRUCTOR = 'Controller should be a constructor function.';

Errors.CONTROLLER_ID_UNDEFINED = 'Unable to find a controller without an identifier';

Errors.NEXTCONTROLLER_STILL_ALIVE = 'Unable to navigate; [_nextController] object'
  + ' is still active or not entirely prepared';

Errors.NAV_TASK_INVALID_ACTION_OBJ = "Unable to validate navigation task for"
  + " this action object ";


return Errors;


});