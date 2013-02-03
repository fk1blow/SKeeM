
// SKM Mixin object definition

define(['skm/k/Object', 'skm/util/ObjectUtils'], function(SKMObject, Utils)
{
'use strict';


var createFunctionalMixin = function(mixinObject) {
  return function() {
    // If the mixin has an [initialize] method
    // rename it and delete the mixin property(method) 
    if('initialize' in mixinObject) {
      this['initializeMixin'] = mixinObject.initialize;
      delete mixinObject['initialize'];
    }
    // Now add every other property of the mixin to the caller's context 
    for ( var item in mixinObject ) {
      if ( mixinObject.hasOwnProperty(item) )
        this[item] = mixinObject[item];
    }
    return this;
  }

  mixinObject = null;
};


var Mixin = function() {};


Mixin.create = function() {
  var args = [].slice.call(arguments);
  var mixinDependencies = [].slice.call(args, 0, args.length - 1);
  var properties = args[args.length - 1];
  var instance = null;

  if (mixinDependencies.length) {
    var combinedMixin = {};
    for (var i = 0; i < mixinDependencies.length; i++) {
      if(typeof mixinDependencies[i] === 'function')
        mixinDependencies[i].call(combinedMixin);
    }
    properties = Utils.ObjectUtil.merge(properties, combinedMixin);
  }

  instance = new this();

  instance._functionalMixin = createFunctionalMixin(properties);

  return instance;
}


Mixin.prototype._functionalMixin = null;

Mixin.prototype.getFunctionalMixin = function() {
  return this._functionalMixin;
}

Mixin.prototype.injectInto = function(targetObject) {
  var init = null;
  var mixin = this.getFunctionalMixin();
  // check the target 
  if ( Object.prototype.toString.apply(targetObject) !== '[object Object]' ) {
    throw new TypeError('Mixin.inject :: targetObject param target must be of type Object!');
  }
  // check the mixin function against typeof
  if ( typeof mixin !== 'function' ) {
    throw new TypeError('Mixin.injectInto :: functional mixin must be of type function;' +
      'current type :: ' + typeof mixin);
  }
  // add the mixin by calling the functional mixin
  // on the target's context - targetObject 
  mixin.call(targetObject);
  // shortcut to mixin's initialize method 
  init = targetObject.initializeMixin;
  // check to see if there's a initialize mixin method 
  if ( typeof init === 'function' ) {
    init.call(targetObject);
    delete targetObject['initializeMixin'];
  }
}


return Mixin;


});