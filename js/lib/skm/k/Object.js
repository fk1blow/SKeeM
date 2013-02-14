  
// SKM Core Object definition

define(['skm/util/ObjectUtils'], function(Utils)
{
'use strict';


// Shorthand method
var slice = Array.prototype.slice;


/**
 * Extends a given object with a given
 * array of extension objects
 * 
 * @param  {Object} target Destination object
 */
var extend = function(target) {
  var ext = [].slice.call(arguments, 1);
  var i, prop, extension, extLen = ext.length;
  for (i = 0; i < extLen; i++) {
    extension = ext[i];
    for (prop in extension) {
      if (extension.hasOwnProperty(prop))
        target[prop] = extension[prop];
    }
  }
}


/**
 * Safes test for an Object
 * though it excludes null and Array
 * 
 * @param  {Mixed}  obj The object to test
 * @return {Boolean}     
 */
var isObject = function(obj) {
  return Object.prototype.toString.apply(obj) === '[object Object]';
}


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * @description Taken from google's closure library
 * @link http://closure-library.googlecode.com/svn/docs/closure_goog_base.js.source.html
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
    // If it's an Object, include it to target
    if ( isObject(item) )
      extend(target, item);
  }
}


var SKMObject = function() {};


/**
 * Creates a constructor function based its prototype
 * to an SKMObject definition
 * 
 * @param  {Object} mixins     A list of zero or more Objects
 * that represent the definition of this constructor
 * @return {Function}  function  constructor function used as a 
 * template for the new SKMObject
 */
SKMObject.extend = function(mixins) {
  var args = slice.call(arguments);
  var parent = this, child = null;
  // Use the initialize function as a function constructor
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

  // Add static methods directly to child
  // function constructor
  extend(child, parent);

  // Establish the base prototype chain
  inherits(child, parent);

  // Inject every extension Object to [this.prototype]
  if ( args.length ) {
    args.splice(0, 0, this.prototype);
    extend.apply(null, args);
  }

  return child;
}

/**
 * [create description]
 * @return {[type]} [description]
 */
SKMObject.create = function(options) {
  // Create the actual "instance"
  var instance = new this();

  // Check every argument if it's a SKM.Mixin or plain object
  // If it's an Object, add it to the target instance
  // If it's a Mixin, use Mixin.injectTo and add it to the instance object
  if ( arguments.length ) {
    extend(instance, options);
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
  if ( arguments.length )
    extend(this.prototype, arguments);
}


return SKMObject;


});