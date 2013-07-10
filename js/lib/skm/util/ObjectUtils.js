// SKM Object utils definition

define([], function() {
"use strict";


var slice = Array.prototype.slice;


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
 * Extends a given object with a given
 * array of extension objects
 * 
 * @param  {Object} target Destination object
 */
var mixin = function(target) {
  var ext = [].slice.call(arguments, 1);
  var i, prop, extension, extLen = ext.length;
  for (i = 0; i < extLen; i++) {
    extension = ext[i];
    for (prop in extension) {
      if (extension.hasOwnProperty(prop))
        target[prop] = extension[prop];
    }
  }
};

/**
 * Creates a constructor function based its prototype
 * to an SKMObject definition
 * 
 * @param  {Object} mixins     A list of zero or more Objects
 * that represent the definition of this constructor
 * @return {Function}  function  constructor function used as a 
 * template for the new SKMObject
 */
var extend = function(protoProps) {
  var args = slice.call(arguments);
  var parent = this, child = null;
  var i, argsLen = args.length;

  // Use the initialize function as a function constructor
  if ( protoProps && ( 'initialize' in protoProps ) ) {
    child = protoProps.initialize;
  } else {
    child = function() {
      parent.apply(this, arguments);
    }
  }

  // Establish the base prototype chain
  inherits(child, parent);

  // Add static methods directly to child constructor function
  // mixin(child, staticProps);

  // Inject every extension Object to [this.prototype]
  // and see if the mixin is an Object
  for (i = 0; i < argsLen; i++) {
    if ( isObject(args[i]) )
      mixin(child.prototype, args[i]);
  }

  return child;
};

/**
 * Safer test for an Object
 * though it excludes null and Array
 * 
 * @param  {Mixed}  obj The object to test
 * @return {Boolean}     
 */
var isObject = function(obj) {
  return Object.prototype.toString.apply(obj) === '[object Object]';
};

/**
 * Test for determining if object is an array
 * 
 * @param  {Mixed}  obj The object to test
 * @return {Boolean}
 */
var isArray = function(obj) {
  return Object.prototype.toString.apply(obj) === '[object Array]';
};

/**
 * Test if the passed object is a function
 * 
 * @param  {Object} obj testing parameter
 */
var isFunction = function(obj) {
  return (typeof obj === 'function');
};


return {
  extend: extend,

  inherits: inherits,

  mixin: mixin,

  isObject: isObject,

  isArray: isArray,

  isFunction: isFunction
}


});