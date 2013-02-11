  
// SKM Core Object definition

define(['skm/k/Mixin', 'skm/util/ObjectUtils'], function(SKMMixin, Utils)
{
'use strict';


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

/**
 * Extends an Object with a given list or properties
 * 
 * @description adds an Object/function constructor
 * to a target Object
 * 
 * @param  {function, Object} extension the object extension to be added
 * @param  {Object} target    target object
 */
var mergeObjects = function(extensions, target) {
  var item, len = extensions.length;
  for (var i = 0; i < len; i++) {
    item = extensions[i];
    // If it's an Object, include it to this.prototype
    if ( Utils.ObjectUtil.isObject(item) ) {
      Utils.ObjectUtil.include(target, item);
    }
    // if it's not an Object, assume this is a constructor function
    // so take its prototype as a mixin
    else {
      Utils.ObjectUtil.include(target, item.prototype);
    }
  }
}


var SKMObject = function() {};

/**
 * Creates a constructor function based its prototype
 * to an SKMObject definition
 * 
 * @param  {Object} mixins     A list of zero or more SKM/Objects
 * that representing a behaviour rather then inheritance
 * @param  {Object} properties An Object that can be used as a 
 * extension/template for this object
 * @return {Function}  function  constructor function used as a 
 * template for the new SKMObject
 */
SKMObject.extend = function(mixins, properties) {
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
  child.extend = parent.extend;
  child.create = parent.create;
  child.mixin = parent.mixin;
  // Establish the basic proto chain
  inherits(child, parent);
  // If has extension(properties), add it
  // to the prototype of the child
  if ( extension )
    Utils.ObjectUtil.include(child.prototype, extension);
  // Add the function mixins to child proto
  if ( mixins && mixins.length )
    mergeObjects(mixins, this.prototype);
    // child.mixin(mixins);
  return child;
}

/**
 * [create description]
 * @return {[type]} [description]
 */
SKMObject.create = function() {
  var args = [].slice.call(arguments);
  // Create the actual "instance"
  var instance = new this();
  // Check every argument if it's a SKM.Mixin or plain object
  // If it's an Object, add it to the target instance
  // If it's a Mixin, use Mixin.injectTo and add it to the instance object
  if ( args.length ) {
    mergeObjects(args, instance);
  }
  // Try to call the initialize function
  if ( typeof instance.initialize === 'function' ) {
    instance.initialize.apply(instance, arguments);
  }
  return instance;
}

/**
 * Merges [this.prototype] with an Object
 * or a function constructor's prototype
 */
SKMObject.mixin = function() {
  mergeObjects(arguments, this.prototype);
}


return SKMObject;


});