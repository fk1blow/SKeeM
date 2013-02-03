/**
 * SkeemM - 0.0.02
 * 
 * === Updates
 *    - nil
 * 
 * === Description
 *   - Seek Mobile - it has touch gestures and sheet
 */
;(function() {
  "use strict";

  var SKM, SK, ALIAS, VERSION;

  ALIAS = ((typeof a === 'string') && a.length > 1);
  SKM = SK = ALIAS ? (window[a] = {}) : (window['SKM'] = {});
  VERSION = '0.0.19';

// -----------------------------------
//              Namespaces
// -----------------------------------

  SK.Global = {
    TOUCH_ENABLED: ('ontouchstart' in window),
    VERSION: '0.0.02'
  }

  SK.app = {};

  SK.config = {
    generators: {
      app: true
    },
    development: true
  };

  // various data structures(not just local storage - gen)
  SK.datastore = {
    localStorage: null,

    collection: null
  };

  SK.communication = {
    geolocation: null,

    socket: null,

    /*
      === 1
      Could add much more powerful ajax manager here.

      === 2
      Say, for example, someone doesn't want to use the jquery ajax function. For this,
      it should receive a way to extend/add xhr adapters.

      === 3
      Should add a manager object that deals with the ajax request.
      If an object is created, you can use that instance to easly manage the request,
      its responses and callbacks.
    */
    ajax: null
  };

  SK.ui = {
    ViewController: null,

    View: null,

    events: {
      touch: null
    },

    components: null
  };

  cl('ADAPT: in a ui env, the delegates of an object can also be his parent.')
  cl('REMOVE: SK.manager!');

  // SK.manager = null;

  SK.util = null;

  SK.model = null;

// -----------------------------------
//                Object
// -----------------------------------

// Object.create shim
if (typeof Object.create !== 'function') {
  Object.create = function (o) {
    function F() {}
    F.prototype = o;
    return new F();
  }
};


/*
  === Main constructor ===
*/
SK.Object = function() {};

SK.Object.extend = function() {
  var args        = [].slice.call(arguments);
  var mixins      = [].slice.call(args, 0, args.length - 1);
  var extension   = args[args.length - 1];
  var Template    = function() {};

  // add base properties
  Template.extend = this.extend;
  Template.create = this.create;
  Template.mixin = this.mixin;

  // if [this] has a prototype object
  if ( Object.prototype.toString.apply(this.prototype) === '[object Object]' ) {
    Template.prototype = Object.create(this.prototype);
    Template.prototype.constructor = Template;
  }

  // addd the extension, overriding superConstruct properties 
  for(var prop in extension)
    SK.util.Object.include(Template.prototype, extension);

  // add the mixins to the Template constructor
  Template.mixin(mixins);

  return Template;
}

SK.Object.create = function() {
  var args = [].slice.call(arguments);
  var instance = new this();
  if ( typeof instance.initialize === 'function' )
    instance.initialize.apply(instance, args);
  return instance;
}

SK.Object.mixin = function(mixins) {
  if ( ! arguments.length )
    return;

  var args = [].slice.call(arguments);
  var argsLen = args.length;
  var asArray = Object.prototype.toString.apply(mixins) === '[object Array]';

  // if only one mixin function is passed 
  if(typeof mixins === 'function' && argsLen == 1) {
    SK.Mixin.inject(mixins, this.prototype);
  // if a single mixin array of multiple mixins as params 
  } else if((asArray && argsLen == 1) || argsLen > 1) {
    var mixinsArr = (argsLen > 1) ? args : args[0];
    var arrLen = mixinsArr.length;
    for(var i = 0; i < arrLen; i++) {
      SK.Mixin.inject(mixinsArr[i], this.prototype);
    }
  }

  return this;
}



SK.Mixin = {
  createFunctionalMixin: function(mixinObject) {
    return function() {
      /* if the mixin has an [initialize] method
      rename it and delete the mixin property(method) */
      if('initialize' in mixinObject) {
        this['initializeMixin'] = mixinObject.initialize;
        delete mixinObject['initialize'];
      }
      /* now add every other property of the mixin to the "functional" */
      for ( var item in mixinObject ) {
        if ( mixinObject.hasOwnProperty(item) )
          this[item] = mixinObject[item];
      }
      return this;
    }
  },

  /**
   * Desfines a functional mixin
   * 
   * @description if the method has a mixin function as a parameter,
   * it will try to combine it/them into the newly defined mixin.
   * 
   * @return {Function} the mixin function
   */
  create: function() {
    var args = [].slice.call(arguments);
    var mixinDependencies = [].slice.call(args, 0, args.length - 1);
    var properties = args[args.length - 1];

    if (mixinDependencies.length) {
      var combinedMixin = {};
      for (var i = 0; i < mixinDependencies.length; i++) {
        if(typeof mixinDependencies[i] === 'function')
          mixinDependencies[i].call(combinedMixin);
      }
      properties = SK.util.Object.merge(properties, combinedMixin);
    }

    return SK.Mixin.createFunctionalMixin(properties);
  },

  /**
   * Injects the mixin function into a target object
   * 
   * @param  {Function} mixinFunction the actual mixin function
   * @param  {Object} targetObject  the target object where the mixin will be injected
   */
  inject: function(mixinFunction, targetObject) {
    var init = null;

    // check the target 
    if ( Object.prototype.toString.apply(targetObject) !== '[object Object]' )
      throw new TypeError('Mixin.inject :: targetObject param target must be of type Object!');


    // check the mixin function against typeof
    if ( typeof mixinFunction !== 'function' ) {
      throw new Error('Mixin.inject :: mixinFunction param must be of type function! Current type :: ' +
        typeof mixinFunction);
    }

    // add the mixin by calling the functional mixin
    // on the target's context - targetObject 
    mixinFunction.call(targetObject);

    // shortcut to mixin's initialize method 
    init = targetObject.initializeMixin;

    // check to see if there's a initialize mixin method 
    if ( typeof init === 'function' ) {
      init.call(targetObject);
      delete targetObject['initializeMixin'];
    }
  }
};

// -----------------------------------
//                Manager
// -----------------------------------

SK.Manager = SK.Object.extend({});

// -----------------------------------
//                Util
// -----------------------------------
  
  SK.util = {};
  
  var eventSplitter = /\s+/;

  /**
   * Mutates an object's method
   * 
   * @example
   * Util.Mutator({aMethod: function}, {aMethod: function});
   * will simply mutate the aMethod from the template and add "_super" to it
   */
  SK.util.Mutator = {
    wrapObject: function(template, parent) {
      var pp, cp, prop;
      for(prop in template) {
        pp = parent[prop];
        cp = template[prop];
        if(prop in parent && typeof cp === 'function' && cp != pp) {
          template[prop] = SK.util.Mutator.mutateFunction(cp, pp, parent, template);
        }
      }
    },

    mutateFunction: function(childProp, parentProp, parentCtx, childCtx) {
      return function() {
        this._super = function() {
          return parentProp.apply(childCtx, arguments);
        };
        this._parent = parentCtx;
        return childProp.apply(this, arguments);
      }
    }
  };

  /**
   * Array utils
   * @type {Object}
   */ 
  SK.util.Array = {
    forEach: function(arr, callback, ctx) {
      if(arr == null)
        return;
      var i, len = arr.length;
      for(i = 0; i < len; i++)
        callback.call(ctx || this, arr[i], i);
    },

    isArray: function(object) {
      return Object.prototype.toString.apply(object) === '[object Array]';
    }
  };

  /**
   * Object utils
   */
  SK.util.Object = {
    /**
     * my.class extend method
     * @author jie http://myjs.fr/my-class/
     * 
     * @param  {Object} obj     target object
     * @param  {Object} extension   template/extension object
     * @param  {Boolean} override   if extension prop overrides the target prop
     */
    include: function(obj, extension, override) {
      var prop;
      if (override === false) {
        for (prop in extension) {
          if ((prop in obj)) continue;
          obj[prop] = extension[prop];
        }
      } else {
        for (prop in extension) {
          obj[prop] = extension[prop];
          // if (extension.toString !== Object.prototype.toString)
          //   obj.toString = extension.toString;
        }
      }
      return obj;
    },

    /**
     * Merges two or more objects
     * 
     * @description the merge will overrite previously declaredy attributes
     * @param  {[type]} target the object that should be merged to
     * @return {Object}    target merged object
     */
    merge: function(target) {
      var targetObject = target;
      var extension = Array.prototype.slice.call(arguments, 1);
      // for each object extension, merge into target object
      SK.util.Array.forEach(extension, function(item) {
        if(SK.util.Object.isObject(item) == false)
          throw new Error('Merged/Extension argument must be of type Object; [SK.util.Object.merge]');
        SK.util.Object.include(target, item || {});
      });
      return target;
    },

    isObject: function(module) {
      return Object.prototype.toString.apply(module) === '[object Object]';
    },

    prepareDefaultAttributes: function(target, defaultOptions) {
      /* if the arguments is an Object */
      if(SK.util.Object.isObject(defaultOptions)) {
        for(var item in defaultOptions) {
          if(defaultOptions.hasOwnProperty(item))
            target[item] = defaultOptions[item];
        }
        target._defaultAttributes = defaultOptions;
      /* if it's an Array of attributes, assign to each a value of undefined */
      } else if(SK.util.Array.isArray(defaultOptions)) {
        var len = defaultOptions.length;
        for(var i = 0; i < len; i++) {
          target[defaultOptions[i]] = undefined;
        }
        target._defaultAttributes = defaultOptions;
      }
    }
  };

  /**
   * @todo
   * TO BE REMOVED
   */
  SK.util.Identifier = (function() {
    var incrementID = 0;

    return {
      getIncrementedId: function(prefix) {
        var _prefix = prefix || '';
        return _prefix + '_' + (incrementID += 1);
      }
    }
  }());

  /**
   * Event mixin
   * A slight modification of backbone's Event Object
   * 
   * @author Jeremy Ashkenas, DocumentCloud Inc
   */
  SK.util.Event = SK.Mixin.create({
    bind: function(events, callback, context) {
      var calls, event, list;
      if (!callback) return this;

      events = events.split(eventSplitter);
      calls = this._eventCallbacks || (this._eventCallbacks = {});

      while (event = events.shift()) {
        list = calls[event] || (calls[event] = []);
        list.push(callback, context || this);
      }

      return this;
    },

    unbind: function(events, callback, context) {
      var event, calls, list, i;

      // No events, or removing *all* events.
      if (!(calls = this._eventCallbacks)) return this;
      if (!(events || callback || context)) {
        delete this._eventCallbacks;
        return this;
      }

      events = events.split(eventSplitter);

      // Loop through the callback list, splicing where appropriate.
      while (event = events.shift()) {
        list = calls[event];

        if (!(list = calls[event]) || !(callback || context)) {
          delete calls[event];
          continue;
        }

        for (i = list.length - 2; i >= 0; i -= 2) {
          if (!(callback && list[i] !== callback || context && list[i + 1] !== context)) {
            list.splice(i, 2);
          }
        }
      }

      return this;
    },

    fire: function(events) {
      var event, calls, list, i, length, args, all, rest;
      if (!(calls = this._eventCallbacks)) return this;

      rest = [];
      events = events.split(eventSplitter);
      for (i = 1, length = arguments.length; i < length; i++) {
        rest[i - 1] = arguments[i];
      }

      while (event = events.shift()) {
        // Copy callback lists to prevent modification.
        if (list = calls[event])
          list = list.slice();

        if (list) {
          for (i = 0, length = list.length; i < length; i += 2) {
            list[i].apply(list[i + 1] || this, rest);
          }
        }
      }

      return this;
    }
  });

  SK.util.Observable = SK.util.Event;

  /**
   * Accessor methods
   */
  SK.util.Accessible = SK.Mixin.create(SK.util.Events, {
    initialize: function() {
      this._previousAttributes = {};
    },

    get: function(attr) {
      return this[attr];
    },

    set: function(attr, val, silent) {
      var args = [].slice.call(arguments);
      var attributesObject = {}, prop;
      // try to obtain the same outcome event though the arguments are different
      if (SK.util.Object.isObject(args[0]))
        attributesObject = args[0];
      else
        attributesObject[attr] = val;
      // iterate for every property and call setAttribute
      for(prop in attributesObject) {
        this.setAttribute(prop, attributesObject[prop], silent || false);
      }
      return this;
    },

    setAttribute: function(attr, val, silent) {
      this._previousAttributes = this._previousAttributes || {};
      var currAttribute, previous, event;
      previous = this[attr] || undefined;
      // if element in this, trigger created:attr, else updated:attr 
      event = ((this.has(attr)) ? 'updated:' : 'created:') + attr;
      // set the attribute on [this] object
      this[attr] = val;
      // finnaly, add the previous attribute to the _previousAttr object
      this._previousAttributes[attr] = previous;
      // if it's silent, don't fire the event
      if (!silent || silent === false) {
        currAttribute = { previous: this.previous(attr),  current: this[attr] };
        this.fire('changed:' + attr, currAttribute).fire(event, currAttribute);
      }
      return this;
    },

    unset: function(attr) {
      var event = 'unsetted:' + attr;
      var previous = this._previousAttributes[attr] = this[attr];
      delete this[attr];
      this.fire(event, { previous: previous });
      return this;
    },

    previous: function(attr) {
      var previousAttribute = this._previousAttributes[attr] || this[attr];
      return previousAttribute || undefined;
    },

    has: function(attr) {
      return (attr in this);
    }
  });

  /**
   * Logger singleton object
   * 
   * @description  Adds a convenient and safe method to use the console 
   * even in browser that don't support it
   * @author Paul Irish, linked from http://www.jquery4u.com/snippets/lightweight-wrapper-firebug-console-log/#.T-2xA-HWRhE
   */
  SK.util.Logger = SK.Object.extend({
    TYPE: 'Logger',

    _instance: null,

    _console: null,

    _enabled: true,

    initialize: function(options) {
      this._prepareConsole();
    },

    _prepareConsole: function() {
      this._console = window.console;
      // if the browser does not support console(IE, mobiles, etc)
      if(this.consoleUnavailable())
        this._clearUndefinedConsole();
    },

    _clearUndefinedConsole: function() {
      var c = this._console || {};
      for(var d="assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(","),a;a=d.pop();)c[a]=c[a] || function() {};
      // is it safe?!
      this._console = c;
    },

    disablePrinter: function() {
      window.console = window.console || {};
      var c = function(){};
      for(var d="info,debug,error,log".split(","), a; a=d.pop();)
        window.console[a]=c;
      return true;
    },

    consoleUnavailable: function() {
      return typeof (window.console !== 'undefined');
    },

    /* Now, for every console method, check if it's a function(Because IE that's why) */

    debug: function() {
      if(typeof this._console.debug === 'function')
        this._console.debug.apply(console, [].slice.call(arguments));
    },

    info: function() {
      if(typeof this._console.info === 'function')
        this._console.info.apply(console, [].slice.call(arguments));
    },

    warn: function() {
      if(typeof this._console.warn === 'function')
        this._console.warn.apply(console, [].slice.call(arguments));
    },

    error: function() {
      if(typeof this._console.error === 'function')
        this._console.error.apply(console, [].slice.call(arguments));
    }
  });

// -----------------------------------
//               ui.Events
// -----------------------------------

SK.ui.events = {
  touch: null
};

cl('CHANGE ns from gstures to SK.ui.events.touch')
var Gsture = SK.ui.events.touch = {};


Gsture.xxx_BaseGsture = SK.Object.extend(SK.util.Observable, {
  startX: 0,

  startY: 0,

  startTime: null,

  currentX: 0,

  currentY: 0,

  currentTime: null,

  /**
   * If the gesture has become active therefore, recognized 
   * as an actual gesture on the view/screeen
   * @type {Boolean}
   */
  gestureRecognized: false,

  /**
   * The attached view event as a map
   * @type {Object}
   */
  _originalDelegatedViewEvent: null,

  /**
   * The delegated object acting as a glue between the manager, the
   * view and the gesture object
   * @type {Object}
   */
  _delegatedManager: null,

  initialize: function(options) {
    cl('new gesture : ', this.gestureType);
    var opt = options || {};
    this._originalDelegatedViewEvent = opt.viewEvent;
    this._delegatedManager = opt.delegatedManager;
    this._addDelegatedManagerBinds();
  },

  _addDelegatedManagerBinds: function() {
    var self = this;
    this._delegatedManager.bind('started:touches', function(touchEvent) {
      this.handleTouchStart(touchEvent);
    }, this);

    this._delegatedManager.bind('moved:touches', function(touchEvent) {
      this.handleTouchMove(touchEvent);
    }, this);

    this._delegatedManager.bind('ended:touches', function(touchEvent) {
      this.handleTouchEnd(touchEvent);
    }, this);
  },


  handleTouchStart: function(evt) {
    // set the current clientX, clientY
    var clientCoords = this._getEventClientCoords(evt);
    this.startX = this.currentX = clientCoords.x;
    this.startY = this.currentY = clientCoords.y;

    // time
    this.startTime = (new Date().getTime());
    
    // the element's offset
    // var element = this._targetElement[0];
    var element = evt.target;
    var box = element.getBoundingClientRect();
    var clientTop  = element.clientTop  || document.body.clientTop  || 0;
    var clientLeft = element.clientLeft || document.body.clientLeft || 0;
    var scrollTop  = window.pageYOffset || element.scrollTop  || document.body.scrollTop;
    var scrollLeft = window.pageXOffset || element.scrollLeft || document.body.scrollLeft;

    this._targetOffset = {
      top: box.top + scrollTop - clientTop,
      left: box.left + scrollLeft - clientLeft
    };

    return true;
  },

  handleTouchMove: function(evt) {
    // this._preventScrollOnTap()
    var clientCoords = this._getEventClientCoords(evt);
    this.currentX = clientCoords.x;
    this.currentY = clientCoords.y;
  },

  handleTouchEnd: function(evt) {
    this.currentTime = (new Date().getTime());
  },

  _getEventClientCoords: function(evt) {
    var clientCoords = {};
    var originalEvent = evt.originalEvent;
    if ( originalEvent.touches )
      clientCoords = { x: originalEvent.touches[0].clientX, y: originalEvent.touches[0].clientY };
    else
      clientCoords = { x: originalEvent.clientX, y: originalEvent.clientY };
    return clientCoords;
  },

  _preventScrollOnTap: function(evt) {
    return;
    var eventObject = this._originalDelegatedViewEvent;
    // prevent default if is a tap gesture
    if (eventObject.type == 'tap' ||
        eventObject.type == 'longtap' ||
        eventObject.type == 'doubletap') {
      evt.preventDefault();
    }
  }
});

Gsture.BaseGsture = SK.Object.extend(SK.util.Observable, {
  startX: 0,

  startY: 0,

  startTime: null,

  currentX: 0,

  currentY: 0,

  currentTime: null,

  _delegatesObject: null,

  _viewEventObject: null,

  initialize: function(options) {
    cl('%cnew gsture : ', 'color:red', this.gestureType, new Date().getMilliseconds());
    var opt = options || {};
    this._delegatesObject = opt.delegatesObject;
    this._viewEventObject = opt.viewEvent;
    this._addDelegatedManagerBinds();
  },

  destroy: function() {
    cl('%cdestroy', 'color:red', new Date().getMilliseconds())
    this.unbind();
    this._removeDelegatedManagerBinds();
    delete this._delegatesObject;
    delete this._viewEventObject;
  },

  getType: function() {
    return this.gestureType;
  },

  handleTouchStart: function(evt) {
    // set the current clientX, clientY
    var clientCoords = this._getEventClientCoords(evt);
    this.startX = this.currentX = clientCoords.x;
    this.startY = this.currentY = clientCoords.y;

    // time
    this.startTime = (new Date().getTime());
    
    // the element's offset
    // var element = this._targetElement[0];
    var element = evt.target;
    var box = element.getBoundingClientRect();
    var clientTop  = element.clientTop  || document.body.clientTop  || 0;
    var clientLeft = element.clientLeft || document.body.clientLeft || 0;
    var scrollTop  = window.pageYOffset || element.scrollTop  || document.body.scrollTop;
    var scrollLeft = window.pageXOffset || element.scrollLeft || document.body.scrollLeft;

    this._targetOffset = {
      top: box.top + scrollTop - clientTop,
      left: box.left + scrollLeft - clientLeft
    };

    return true;
  },

  handleTouchMove: function(evt) {
    this._preventScrollOnTap()
    var clientCoords = this._getEventClientCoords(evt);
    this.currentX = clientCoords.x;
    this.currentY = clientCoords.y;
  },

  handleTouchEnd: function(evt) {
    this.currentTime = (new Date().getTime());
  },

  _getEventClientCoords: function(evt) {
    var clientCoords = {};
    var originalEvent = evt.originalEvent;
    if ( originalEvent.touches )
      clientCoords = { x: originalEvent.touches[0].clientX, y: originalEvent.touches[0].clientY };
    else
      clientCoords = { x: originalEvent.clientX, y: originalEvent.clientY };
    return clientCoords;
  },

  _preventScrollOnTap: function(evt) {
    var eventObject = this._viewEventObject;
    // alert('z')
    // prevent default if is a tap gesture
    if (eventObject.type == 'tap' ||
        eventObject.type == 'longtap' ||
        eventObject.type == 'doubletap') {
      evt.preventDefault();
    }
  },

  _addDelegatedManagerBinds: function() {
    var self = this;
    this._delegatesObject.bind('started:touches', this.handleTouchStart, this);
    this._delegatesObject.bind('moved:touches', this.handleTouchMove, this);
    this._delegatesObject.bind('ended:touches', this.handleTouchEnd, this);
  },

  _removeDelegatedManagerBinds: function() {
    var self = this;
    this._delegatesObject.unbind('started:touches', this.handleTouchStart, this);
    this._delegatesObject.unbind('moved:touches', this.handleTouchMove, this);
    this._delegatesObject.unbind('ended:touches', this.handleTouchEnd, this);
  }
});


/**
 * Tap
 * @type {Gsture}
 */
Gsture.Tap = Gsture.BaseGsture.extend({
  gestureType: 'TAP',

  _defaultTimeTreshold: 300,

  _timerObj: null,

  handleTouchStart: function(evt) {
    Gsture.BaseGsture.prototype.handleTouchStart.call(this, evt);
    var self = this;
    if ( this._timerObj ) {
      clearTimeout(this._timerObj);
      this._timerObj = null;
      cl('cleared timer handleTouchEnd')
    }
    this._timerObj = setTimeout(function() {
      cl(self.gestureType, ' : Gsture.Tap destroyed timed:completed', self._viewEventObject.selector)
      clearTimeout(self._timerObj);
      self._timerObj = null;
      self.fire('completed:gesture', self);
    }, this._defaultTimeTreshold);
  },

  // @override
  handleTouchEnd: function(evt) {
    Gsture.BaseGsture.prototype.handleTouchEnd.call(this, evt);
    var $compareAgainstEl = this._viewEventObject.parentEl.find(this._viewEventObject.selector);
    var treshold = this._viewEventObject.treshold.time || this._defaultTimeTreshold;
    var timeTresholdPassed = (this.currentTime - this.startTime) < treshold;
    
    if ( timeTresholdPassed && this._spaceTresholdPassed() ) {
      cl(this.gestureType, ' : Gsture.Tap completed', this._viewEventObject.selector)
      clearTimeout(this._timerObj);
      this._timerObj = null;
      cl('cleared timer handleTouchEnd')
      this.fire('completed:gesture', this);
    } else {
      cl('too long for a tap!');
      this.fire('completed:gesture', this);
    }
  },

  _spaceTresholdPassed: function() {
    var isTap = false;
    if (Math.abs(this.currentX - this.startX) < 10 ||
        Math.abs(this.currentY - this.startY) < 10) {
      isTap = true;
    }
    return isTap;
  }
});

/**
 * Long Tap
 * @type {Gsture}
 */
Gsture.Longtap = Gsture.BaseGsture.extend({
  gestureType: 'LONG_TAP',

  // the minimum amount of time to be considered a "longtap"
  _defaultTimeTreshold: 1000,

  _timerObject: null,

  initialize: function(event, manager) {
    Gsture.BaseGsture.prototype.initialize.call(this, event);
    this.timerObject = null;
  },

  // @override
  _handleStart: function(evt) {
    Gsture.BaseGsture.prototype._handleStart.call(this, evt);
    var self = this;
    var treshold = this._treshold.time || this._defaultTimeTreshold;
    this._timerObject = setTimeout(function() {
      cl(self.gestureType, ' : Gsture.Longtap completed');
      clearTimeout(self._timerObject);
      self._timerObject = null;
    }, treshold);

    evt.preventDefault();
  },

  // @override
  _handleEnd: function(evt) {
    Gsture.BaseGsture.prototype._handleEnd.call(this, evt);
    // clear the timer
    clearTimeout(this._timerObject);
    this._timerObject = null;
  }
});

/**
 * Double Tap
 * @type {Gsture}
 */
Gsture.Doubletap = Gsture.BaseGsture.extend({
  gestureType: 'DOUBLE_TAP',

  _defaultTimeTreshold: 300,

  _initialiMaxTapTime: 300,

  _timerObject: null,

  initialize: function(event) {
    Gsture.BaseGsture.prototype.initialize.call(this, event);
    this.timerObject = null;
  },

  // @override
  _handleStart: function(evt) {
    Gsture.BaseGsture.prototype._handleStart.call(this, evt);
    evt.preventDefault();
  },

  // @override
  _handleEnd: function(evt) {
    Gsture.BaseGsture.prototype._handleEnd.call(this, evt);
    if ( (this._current.time - this._start.time) < this._initialiMaxTapTime ) {
      if ( this.timerObject != null ) {
        cl(this.gestureType, ' : DoubleTap completed')
        this._clearTimer();
      } else {
        this._setupTimer();
      }
    } else {
      this._clearTimer();
    }

    return false;
  },

  _setupTimer: function() {
    var self = this;
    var treshold = this._treshold.time || this._defaultTimeTreshold;
    this.timerObject = setTimeout(function() {
      clearTimeout(self.timerObject);
      self.timerObject = null;
    }, treshold);
  },

  _clearTimer: function() {
    clearTimeout(this.timerObject);
    this.timerObject = null;
  }
});

/**
 * Swipe - generic type
 * @type {Gsture}
 */
Gsture.Swipe = Gsture.BaseGsture.extend({
  gestureType: 'SWIPE'
});

/**
 * Swipe Move
 * @type {Swipe}
 */
Gsture.SwipeMove = Gsture.BaseGsture.extend({
  gestureType: 'SWIPE_MOVE'
});





Gsture.TouchDelegate = SK.Object.extend(SK.util.Observable, {
  initialize: function() {
    //
  },

  addTouchesDelegates: function(originalViewEvent) {
    var touchEvents = 'touchstart touchmove touchend touchcancel';
    var mouseEvents = 'mousedown mousemove mouseup';
    var parseEvents = SK.Global.TOUCH_ENABLED ? touchEvents : mouseEvents;
    // var mouseEvents = 'mousedown';
    var event = originalViewEvent;
    var self = this;

    originalViewEvent.parentEl.on(parseEvents, originalViewEvent.selector, function(event) {
      if ( event.target != event.currentTarget )
        return false
      
      if ( event.type == 'mousedown' || event.type == 'touchstart' )
        self.fire('create_gesture:for_element', originalViewEvent, event);

      self.handleTouchesEvents(event);
    });
  },

  handleTouchesEvents: function(evt) {
    switch (evt.type) {
      case 'mousedown':
      case 'touchstart':
        this.fire('started:touches', evt);
      break;

      case 'mousemove':
      case 'touchmove':
      // cl('move')
        this.fire('moved:touches', evt);
      break;

      case 'mouseup':
      case 'touchcancel':
      case 'touchend':
        this.fire('ended:touches', evt);
      break;
    }
  },
});





Gsture.GstureManager = SK.Object.extend(SK.util.Observable, {
  _viewEventList: null,

  _gesturesCollection: null,

  _delegatedSelectors: null,

  _delegatesTouchesObj: null,

  initialize: function() {
    this._viewEventList = [];
    this._gesturesCollection = {};
    this._delegatedSelectors = [];
    this._initDelegatedManager();
  },

  addEventWatch: function(event) {
    this._delegatesTouchesObj.addTouchesDelegates(event);
  },

  _initDelegatedManager: function() {
    this._delegatesTouchesObj = Gsture.TouchDelegate.create();
    // the most important shit eveh
    this._delegatesTouchesObj.bind('create_gesture:for_element',
      this.handleCreateWithEventAndElement, this);
  },

  handleCreateWithEventAndElement: function(viewEvent, element) {
    var gstureType = viewEvent.type;
    var gstureConstructor = Gsture[_(gstureType).capitalize()];
    var gstureObject = null;

    if ( typeof gstureConstructor === 'function' ) {
      this._gesturesCollection[gstureType] = this._gesturesCollection[gstureType] || [];
      
      // create the object and initialize it
      gstureObject = gstureConstructor.create({
        viewEvent: viewEvent,
        delegatesObject: this._delegatesTouchesObj
      });

      gstureObject.bind('completed:gesture', this._handleGestureCompleted, this);

      this._gesturesCollection[gstureType].push(gstureObject);
    }
  },

  _handleGestureCompleted: function(gstureObject) {
    return;
    // var elDebug = document.createElement('span');
    // $(elDebug[0]).html('x')

    // cl($)

    // elDebug.html('terminated... in plm')
    // jQuery('#console').prepend(elDebug);

    var type = gstureObject.getType().toLowerCase();
    var gstureTypeInCollection = this._gesturesCollection[type];
    var index;
    
    if ( (index = gstureTypeInCollection.indexOf(gstureObject)) >= 0) {
      gstureObject.destroy();
      gstureTypeInCollection[index] = null;
    }
  },

  /**
   * Creates the gesture objects for this view
   * 
   * @description iterates through every item in the event list
   * and for every item, it creates the appropriate gesture adding it
   * to the this._gestureCollection
   * This method takes every touch event attached to the view
   *
   * @todo should instantiate only the gesture corresponding to 
   * the current touched element's selector
   *   EX:
   *     - if the element touched was .bigButtonBig,
   *     then craete the gestures for each of the
   *     gesture types that have a bigButtonBig selector
   * 
   */
  xxx_createGesturesForEventList: function(viewEventList) {
    var listLen = viewEventList.length;
    var gestureItem, gestureType, gestureName, gestureObject;

    for ( var i = 0; i < listLen; i++ ) {
      gestureItem = viewEventList[i];
      gestureType = gestureItem['type'];
      gestureName = Gsture[_(gestureType).capitalize()];

      this._gesturesCollection[gestureType] = this._gesturesCollection[gestureType] || {};

      // if the gesture is not in the _gesturesCollection, don't do anything
      if ( ! (gestureItem['selector'] in this._gesturesCollection[gestureType]) ) {
        gestureObject = gestureName.create({
          viewEvent: viewEventList[i], delegatedManager: this._delegatesTouchesObj
        });
        this._gesturesCollection[gestureType][gestureItem['selector']] = gestureObject;
      }
    }
  }
});





/**
 * @todo
 * - cache the regexes for later use
 */
SK.ui.EventResponder = SK.Object.extend({
  /**
   * View events object
   */
  _gesturesCollection: null,

  /**
   * The gesture manger of this view
   */
  _gestureManager: null,

  /**
   * The object in which the event handler will be called
   */
  _handleInContext: null,

  /**
   * Should log on delegates to object
   */
  _debug: false,

  /**
   * Test if event is of touch type
   */
  _touchEventRegex: (new RegExp('^touch|tap|swipe.*?')),

  /**
   * Holds data about the views primary attributes - [el], [events], [binds]
   */
  _refreshData: null,

  initialize: function() {
    this._gesturesCollection = [];
      this._gestureManager = Gsture.GstureManager.create();
  },

  /**
   * Delegates an event to this.el
   * 
   * @param  {Array}    events   the event/s
   * @param  {String}   selector selector to undelegate
   * @param  {Function}   callback the delegate handler
   * @param  {Function}   context  callback function apply context
   */
  addDelegatedEvent: function(event, selector, callback, context) {
    var ctx = this._handleInContext || this;
    if ( typeof callback !== 'function' )
      throw new Error('LegacyEvent.attachEvent -> unable to delegate event. Callback is of ' +
        typeof callback + ' type');
    this.el.on(event, selector, function() {
      callback.apply(ctx, [].slice.call(arguments));
    });
  },

  /**
   * Removes the delegated event from this.el - if no argument
   * or "all", unbinds everything
   * 
   * @param  {Array}    events   the event/s
   * @param  {String}   selector selector to undelegate
   * @param  {Function}   callback the delegate handler
   * 
   * @return {Boolean}  if no argument given, the function will immediately return false
   */
  removeDelegatedEvent: function(events, selector, callback) {
    var args = [].slice.call(arguments),
      argsLen = args.length,
      selector = selector || "**";
    // if no argument given, unbind everything
    if ( !args.length )
      return false;
    // every event attached to this element
    if ( argsLen == 1 && events == 'all' )
      this.el.unbind();
    else // if selector and/or callback provided
      jQuery(this.el).off(events, selector, callback);
    return true;
  },

  /**
   * Delegates "this.el.events" to child elements through "this.events" object
   */
  processAttachedEvents: function(eventsList) {
    var previousSplitter = /^(\S+)\s*(.*)$/;
    var key, events = eventsList, splitter = /^([^\s]+)(?:\s*)([\d]+)?(?:\s*)([\d]+)?(.*)$/;
    var matches, callback, selector, event, treshold;
    var gestureType;
    var self = this;

    // now start assingning the events
    for(key in events) {
      if(!events.hasOwnProperty(key))
        continue;
      // key matches; [object, event, target]
      matches = key.match(splitter);
      // handle the event process
      var event = {
        type:           matches[1], // event
        treshold:       { time: matches[2], space: matches[3] },
        selector:       matches[4],
        parentEl:       this.el,
        callback:       this[events[key]] || events[key],
        context:        this
      }
      /**
       * Create a Gsture factory
       * - takes an event as a param
       * - based on that event, it creates the appropriate Gsture object
       * - don't know about the mouse events...
       */
      if ( this._touchEventRegex.test(event.type) ) {
        this._gestureManager.addEventWatch(event);
        // Gsture.Builder.addEvent(event);
        // gestureType = Gsture[_(event.type).capitalize()];
        // this._gesturesCollection.push(gestureType.create(event));
      } else {
        this.addDelegatedEvent(matches[1], matches[4], event.callback, this)
        // this.handleMouseEvent(event);
      }
    }
    events = null;
  },

  /**
   * Prepares an object containing [this.events] object and [this.el] for refreshing
   */
  _prepareForRefresh: function(selector, events) {
    this._refreshData = { selector: selector, events: events };
  }
});

// -----------------------------------
//               ui.View
// -----------------------------------

SK.ui.View = SK.ui.EventResponder.extend(SK.util.Observable, {
  /**
   * The dom element(object) associated with the View
   * @type {Object}
   */
  el: null,

  /**
   * Pseudo ideftifier
   * @type {Integer}
   */
  cid: null,

  /**
   * The parent view object
   * @type {Object}
   */
  parentView: null,

  /**
   * The parent ViewController object(usually, the factory that created this object)
   * @type {Object}
   */
  parentViewController: null,

  /**
   * Initialize and configure the instance
   * @param  {Object} defaults an object representing additional args passed at Object.create
   */
  setup: function() {},

  initialize: function(defaults) {
    // call super implementation
    SK.ui.EventResponder.prototype.initialize.call(this);

    // configure initialization options... if any
    SK.util.Object.prepareDefaultAttributes(this, defaults || {});

    // set identifier
    this.cid = SK.util.Identifier.getIncrementedId(this['TYPE']);

    // some simple validations
    this._debugSelectors();

    
    // Add events to target
    // this.delegateEvents(this.events);
    // this.eventHandlerObject = SK.ui.EventResponder.create({ eventsList: this.events, handleInContext: this });
    this.processAttachedEvents(this.events);


    // prepare refresh data
    this._prepareForRefresh(this.el.selector, this.events);
    // this.eventHandlerObject._prepareForRefresh(this.el.selector, this.events);


    // calls the View pseudo constructor
    // if more than one argument, use method.apply
    // else call the method passing the defaults param
    if(arguments.length > 1)
      this.setup.apply(this, [].slice.call(arguments));
    else
      this.setup(defaults);
  },

  /**
   * Reattaches [this.el] to the View Object reattaching the events along with it
   * @return {Object} [this]
   */
  resetElement: function() {
    // the new jQuery object 
    var newEl = $(this._refreshData.selector);
    // if the new element is not an instance of jQuery 
    if (!(newEl instanceof jQuery))
      return false;
    // notify 
    this.fire('before:resetElement');
    // unbind [this.el] events
    this.removeDelegatedEvent('all');
    // nullify the object [this.el] 
    if (this.el instanceof jQuery)
      this.el = null;
    // reassigns [el] or current 
    this.el = newEl;
    // some simple validations 
    this._debugSelectors();
    // Add events to target 
    this.delegateEvents(this.events);
    // notify 
    this.fire('after:resetElement');
    return this;
  },

  /**
  * Removes this.el from the DOM and everything inside it() and 
  * al bound events and jQuery data associated with the elements are removed.(jQuery docs)
  */
  destroy: function() {
    this.fire('before:destroy');
    // remove/unbind all jQuery events
    this.removeDelegatedEvent('all');
    // removes util.Observable
    this.unbind();
    // and removes the element from the dom
    if(this.el != null)
      this.el.remove();
    // nullify el 
    this.el = null;
  },

  /**
   * Checks [this.el] against jQuery and check for selector result
   */
  _debugSelectors: function() {
    var isJqueryInstance = (this.el instanceof jQuery);
    var selectorHasEntries = (isJqueryInstance && this.el.length > 0);
    if ( !isJqueryInstance && this.debug ) {
      SK.util.Logger.getInstance().warn('View.el should be a jQuery object; current state is :: ',
        '{' + typeof this.el + '}', this.el);
    }
    if ( !selectorHasEntries && this.debug ) {
      SK.util.Logger.getInstance().warn('Unable to find an element matching :: ', this.el.selector);
    }
  }
});

// -----------------------------------
//           UI:ViewController
// -----------------------------------

  SK.ui.ViewController = SK.Object.extend(SK.util.Observable, {
    TYPE: 'ViewController',

    /**
     * Pseudo ideftifier
     * @type {Integer}
     */
    cid: null,

     /**
     * Initialize and configure the instance
     * @param  {Object} defaults an object representing additional args passed at Object.create
     */
    setup: function(defaults) {},

    /**
     * The view instance
     * @type {Object}
     */
    view: null,

    /**
     * Children controller objects
     * Should this be a list of objects or plain instances?!
     * 
     * @type {Object} Object
     */
    _childViewControllers: null,

    /**
     * The parent viewController object
     * 
     * @type {Object}
     */
    _parentViewController: null,

    /**
     * Constructor
     * @param  {Mixed} default attributes
     */
    initialize: function(defaults) {
       SK.util.Object.prepareDefaultAttributes(this, defaults || {});

      // set identifier
      this.cid = SK.util.Identifier.getIncrementedId(this['TYPE']);

      // the children controller/s
      this._childViewControllers = {};

      // call setup initializer
      if(arguments.length > 1) {
        this.setup.apply(this, [].slice.call(arguments));
      } else {
        this.setup(defaults);
      }
    },

    /**
     * Adds a child viewController
     * 
     * @description queries the [this._childViewControllers] to find out if
     * the controller already resides and if not, it creates it
     * 
     * @param {String} controllerId  controller string identifier
     * @param {Object} childController the actual object to be created and inserted as a child
     * @param {Object} options     an options argument for the child viewController
     */
    addChildViewController: function(controllerId, childController, options) {
      /* check childController object reference */
      if(! SK.util.Object.isObject(childController))
        throw new TypeError('childController argument must be of type Object.');
      /* check options object argument */
      if(options && ! SK.util.Object.isObject(options))
        throw new TypeError('options argument argument must be of type Object.');
      
      /* not sure if this (and the removal from the parent) 
      should be done implicitly or by the user*/
      // var options = options || {};
      // options._parentViewController = this;
      
      /* if not in [this.childViewController], create it */
      if(! (controllerId in this._childViewControllers))
        this._childViewControllers[controllerId] = childController.create(options);
      return this._childViewControllers[controllerId];
    },

    /**
     * Removes a child from the current viewController
     * 
     * @description finds the child(if exists), calls the destroy method and then
     * nullifies the reference from [this._childViewControllers]
     * 
     * @param  {String} controllerId  controller string identifier
     */
    removeChildViewController: function(controllerId) {
      var options = options || {};
      if(controllerId in this._childViewControllers) {
        this._childViewControllers[controllerId].destroy();
        delete this._childViewControllers[controllerId];
      }
      return this;
    },

    removeFromParentViewController: function() {
      //
    },

    /**
     * Returns the child viewController
     * 
     * @param  {String} controllerId controller string identifier 
     * @return {Mixed}        viewController or undefined
     */
    getChildViewController: function(controllerId) {
      return this._childViewControllers[controllerId];
    },

    loadView: function() {
      //
    },

    unloadView: function() {
      //
    },

    /**
     * Destroys all the childViewController and their respective childViews,
     * then destroys the current view(by calling this.view.destroyView)
     * and resets the [childViewController] to a blank new object
     * 
     * @return {Object} [this]
     */
    destroy: function() {
      // this.removeFromParentViewController();
      // delete this._parentViewController;
      var subControllers = this._childViewControllers;
      for(var controller in subControllers) {
        if(subControllers.hasOwnProperty(controller)) {
          subControllers[controller].destroy();
          delete this._childViewControllers[controller];
        }
      }
      this._childViewControllers = {};
      this.unbind()
      this.destroyChildView();
      return this;
    },

    /**
     * Destroys the view child by calling its destroy method
     */
    destroyChildView: function() {
      if(this.view)
        this.view.destroy();
      return this;
    }
  });

// -----------------------------------
//              Services
// -----------------------------------

// -----------------------------------
//             Application
// -----------------------------------

  SK.app.Window = SK.Object.extend(SK.util.Observable, {
    initialize: function() {
      this._buildResizeHandler();
      this._buildEscKeyHandler();
      this._createScrollHandler();
    },

    getDimensions: function() {
      var dimensions = {};
      dimensions.width = $(window).width();
      dimensions.height = $(window).height();  
    },

    _buildResizeHandler: function() {
      var resizeTickerTimeout, resizeTickerFirst = 0, self = this;

      $(window).resize(function() {
        if(resizeTickerFirst == 0) {
          self.fire('window:resize_started');
        }
        clearTimeout(resizeTickerTimeout);
        resizeTickerTimeout = setTimeout(function() {
          self.fire('window:resize_ended');
          resizeTickerFirst = 0;
        }, 500);
        resizeTickerFirst = 1;
      });
    },

    _buildEscKeyHandler: function() {
      var self = this;
      $(window).keydown(function(evt) {
        if(evt.keyCode == 27) { // ESC
          evt.preventDefault();
          // self.keyEscPressed.dispatch();
          self.fire('window:esc_pressed');
        }
      });
    },

    /* Thanks again, IE */
    _createScrollHandler: function() {
      var self = this;
      $(window).scroll(function() {
        self.fire('window:scrolled');
      });
    }
  });

  SK.app.Document = SK.Object.extend(SK.util.Observable, {
    initialize: function() {
      this._createScrollHandler();
    },

    getDimensions: function() {
      var dimensions = {};
      dimensions.width = $(document).width();
      dimensions.height = $(document).height();
    },

    _createScrollHandler: function() {
      var self = this;
      $(document).scroll(function() {
        self.fire('document:scrolled');
      });
    }
  });
  
  SK.app.Application = SK.Object.extend(SK.util.Observable, {
    TYPE: 'Application',

    logger: null,

    _zoneStack: null,

    _namespace: null,

    // not sure if .window is better than .windowHelper xd
    window: null,

    // not sure if the above applies here
    document: null,

    manager: null,

    initialize: function(zones) {
      this._zoneStack = {};
      this.window = SK.app.Window.create();
      this.document = SK.app.Document.create();
      this.logger = SK.util.Logger.getInstance();
      this.manager = SK.data.Manager;

      if(SK.util.Object.isObject(zones))
        this.prepareZones(zones);
    },

    /**
     * Starts to create the zone controllers(if any)
     * By default, the "Default" zone will be instantiated first
     */
    start: function() {
      this.logger.info('Application started!');
      this._buildZones();
    },

    getZone: function(name) {
      return SK.Manager.get(name);
    },

    prepareZones: function(zones) {
      for(var module in zones) {
        if(zones.hasOwnProperty(module))
          this.addZone(module, zones[module])
      }
    },

    addZone: function(name, module) {
      if(SK.util.Object.isObject(module) == false || typeof module.create !== 'function')
        throw new TypeError('Zone Module must be of type Object and extend SK.Object!');
      this._zoneStack[name] = module;
    },

    _buildZones: function() {
      var zones = this._zoneStack, module;
      if('Default' in zones) {
        this.manager.register('Default', zones['Default'].create());
        // this._instanceStack['Default'] = zones['Default'].create();
        delete this._zoneStack['Default'];
      }
      for(module in zones) {
        if(zones.hasOwnProperty(module))
          if(module == 'Default')
            continue;
          // this._instanceStack[module] = zones[module].create();
          this.manager.register(module, zones[module].create());
      }
    }
  });

  // backwords compatible
  SK.Application = SK.app.Application;

}('SKM'));