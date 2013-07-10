
// @deprecated
// Use /k/Objekt instead

// SKM Object utils definition

define([], function() {
"use strict";


var slice = Array.prototype.slice;

var __hasProp = {}.hasOwnProperty;


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
 * CoffeeScript's extend function
 */
var extend = function(child, parent) {
  for (var key in parent) {
    if (__hasProp.call(parent, key))
      child[key] = parent[key];
  }
  function ctor() {
    this.constructor = child; 
  }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
  child.__super__ = parent.prototype;
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
  mixin: mixin,

  extend: extend,

  isObject: isObject,

  isArray: isArray,

  isFunction: isFunction
}


});