
// SKM Core Object definition

define(['skm/k/Mixin', 'skm/util/ObjectUtils'], function(SKMMixin, Utils)
{
'use strict';


cl('ADD: add Object.destroy method and fire a [beforeDestroy] event.');
cl('ADD: on [beforeDestroy], the Observables will have to remove themselves.');
cl('ADD: add Object.dispose - destroy');


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * Taken from http://closure-library.googlecode.com/svn/docs/closure_goog_base.js.source.html
 */
var inherits = function(childCtor, parentCtor) {
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.__super__ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  /** @override */
  childCtor.prototype.constructor = childCtor;
};


var augmentInstance = function(extension, target) {
  var argsLen = extension.length;
  var item = null;
  var i = 0;
  if ( ! extension || ! extension.length )
    return;
  for (; i < argsLen; i++) {
    item = extension[i];
    if ( item === null )
      continue;
    if ( item instanceof SKMMixin ) {
      item.injectInto(target);
    } else if (Utils.ObjectUtil.isObject(item)) {
      Utils.ObjectUtil.include(target, item);
    }
  }
}


var SKMObject = function() {};


SKMObject.extend = function(mixinsArr, propertiesObj) {
  var args        = [].slice.call(arguments);
  var mixins      = [].slice.call(args, 0, args.length - 1);
  var extension   = args[args.length - 1];
  var parent      = this;
  var child       = null;
  // Use the initialize function as a function constructor
  // Don't check for typeof intialize - "initialize" field should always be a function
  /*if ( extension && ( 'initialize' in extension ) ) {
    child = extension.initialize;
  } else {
    child = function() {
      parent.apply(this, arguments);
    }
  }*/
  child = function() {
    parent.apply(this, arguments);
  }
  // Add the function object "static" methods
  child.extend = this.extend;
  child.create = this.create;
  child.mixin = this.mixin;
  // Establish the basic proto chain
  inherits(child, parent);
  // If has extension(properties), add it
  // to the prototype of the child
  if ( extension )
    Utils.ObjectUtil.include(child.prototype, extension);
  // Add the function mixins to child proto
  if ( mixins )
    child.mixin(mixins);
  return child;
}


SKMObject.create = function() {
  var args = [].slice.call(arguments);
  // Create the actual "instance"
  var instance = new this();
  // Check every argument if it's a SKM.Mixin or plain object
  // If it's an Object, add it to the target instance
  // If it's a Mixin, use Mixin.injectTo and add it to the instance object
  if ( args.length ) {
    augmentInstance(args, instance);
  }
  // Try to call the initialize function
  if ( typeof instance.initialize === 'function' ) {
    instance.initialize.apply(instance, arguments);
  }
  return instance;
}


/**
 * TO BE REMOVED
 *
 * It's not ok to add a mixin to an Object after it was declared.
 * Also, it's kind of reduntant the add the posibility to inject
 * mixins when defining an SKMObject and after if was defined...
 */
SKMObject.mixin = function(mixins) {
  if ( !arguments.length )
    return;
  var args = [].slice.call(arguments);
  var argsLen = args.length;
  var asArray = Object.prototype.toString.apply(mixins) === '[object Array]';
  // if only one mixin function is passed 
  if (argsLen == 1 && mixins instanceof SKMMixin) {
    mixins[0].injectTo(this.prototype);
  // if a single mixin array of multiple mixins as params 
  } else if ((asArray && argsLen == 1) || argsLen > 1) {
    var mixinsArr = ((argsLen > 1) ? args : args[0]),
      arrLen = mixinsArr.length, mixinItem;
    for(var i = 0; i < arrLen; i++) {
      mixinItem = mixinsArr[i];
      if ( mixinItem instanceof SKMMixin ) {
        mixinItem.injectInto(this.prototype);
      }
    }
  }
  return this;
}


return SKMObject;


});