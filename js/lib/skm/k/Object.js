
// @deprecated
// Use /k/Objekt instead
  
// SKM Core Object definition

define([], function()
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
}


/**
 * Safer test for an Object
 * though it excludes null and Array
 * 
 * @param  {Mixed}  obj The object to test
 * @return {Boolean}     
 */
var isObject = function(obj) {
  return Object.prototype.toString.apply(obj) === '[object Object]';
}


/**
 * Test if the passed object is a function
 * 
 * @param  {Object} obj testing parameter
 */
var isFunction = function(obj) {
  return (typeof obj === 'function');
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


var TO_MANY_PARAMS_ERR = 'SKMObject expects only an '
  + 'object as an options parameter.';

/**
 * Actual constructor function
 */
var SKMObject = function(options) {
  this.options = this.options || {};
  // Every object must define its own initialization setup therefore, the options
  // object becomes the container for options passed to the constructor function
  mixin(this.options, options);

  // call the initialize function
  if ( isFunction(this.initialize) )
    this.initialize.apply(this, arguments);
}


/**
 * Creates a constructor function based its prototype
 * to an SKMObject definition
 * 
 * @param  {Object} mixins     A list of zero or more Objects
 * that represent the definition of this constructor
 * @return {Function}  function  constructor function used as a 
 * template for the new SKMObject
 */
SKMObject.extend = function(extension) {
  var args = slice.call(arguments);
  var parent = this, child = null;
  var i, argsLen = args.length;
  // Use the initialize function as a function constructor
  
  if ( extension && ( 'initialize' in extension ) ) {
    child = extension.initialize;
  } else {
    child = function() {
      parent.apply(this, arguments);
    }
  }

  // Establish the base prototype chain
  inherits(child, parent);

  // Add static methods directly to child
  // function constructor
  mixin(child, parent);

  // Inject every extension Object to [this.prototype]
  // and see if the mixin is an Object
  for (i = 0; i < argsLen; i++) {
    if ( isObject(args[i]) )
      mixin(child.prototype, args[i]);
  }

  return child;
}


/**
 * Creates (instantiates) and object
 * based on [this]
 *
 * @description Every function consctructor created using [SKMObject.extend]
 * will automagically inherit the [create, extend, mixin] static methods.
 * @param {Object} options A single object to be 
 * injected to the newly created object
 * @return {Object}
 */
SKMObject.create = function(proto) {
  var f = function(){};
  f.prototype = proto;
  return new f();
}


/**
 * Merges [this.prototype] with an Object
 * or a function constructor's prototype
 */
SKMObject.mixin = function() {
  var i, mixin, len = arguments.length;
  for (i = 0; i < len; i++) {
    if ( isObject(mixin = arguments[i]) )
      extend(this.prototype, mixin);
  }
}


return SKMObject;


});