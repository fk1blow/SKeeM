// Simple Timer object

define(['skm/util/Subscribable',
  'skm/k/Object'], function(Subscribable, SKMObject)
{
'use strict';


/**
 * Timer object that provides an easy and a more manageable
 * way to use intervals/cycles
 * 
 * @description Because some critical modules will use Timers,
 * i had to borrow much of the logic from google closure's timer.
 * @link http://closure-library.googlecode.com/svn/docs/closure_goog_timer_timer.js.html
 */
var Timer = SKMObject.extend(Subscribable, {
  _intervalScale: 0.8,

  // Timer object reference
  _timerObject: null,

  // How many time the timer has fired a "tick" event
  _tickCounter: 0,

  _lastTickTime: 0,

  initialize: function(options) {
    var _base, _ref;
    this.options = options;
    if ((_ref = (_base = this.options).tickInterval) == null) {
      _base.tickInterval = 1000;
    }
    this.options.ticks = this.options.ticks === 0 ? 0 : this.options.ticks || 0;
    this._timerObject = null;
  },

  /**
   * Commands
   */

  start: function() {
    var that;
    that = this;
    this.enabled = true;
    if (!this._timerObject) {
      this._tickCounter = 0;
      this._timerObject = setTimeout(function() {
        return that._tickTack();
      }, this.options.tickInterval);
      this._lastTickTime = this.now();
    }
    return this;
  },

  stop: function() {
    this.enabled = false;
    this._tickCounter = 0;
    if (this._timerObject) {
      clearTimeout(this._timerObject);
      this._timerObject = null;
    }
    return this;
  },

  handleTick: function(ticks) {
    var _ref;
    return (_ref = this.options.tickHandler) != null ? _ref.call(this, ticks) : void 0;
  },

  maxTicksReached: function() {
    if (this.options.ticks === 0) {
      return false;
    } else {
      return this._tickCounter >= this.options.ticks;
    }
  },

  now: function() {
    return (new Date()).getTime();
  },

  /**
   * Private
   */

  _tickTack: function() {
    var elapsed, notSynced, that;
    if (this.enabled) {
      that = this;
      elapsed = void 0;
      notSynced = void 0;
      if (this.maxTicksReached()) {
        this.stop();
        return;
      }
      elapsed = this.now() - this._lastTickTime;
      notSynced = elapsed > 0 && elapsed < (this.options.tickInterval * this._intervalScale);
      if (notSynced) {
        this._timerObject = setTimeout(function() {
          return that._tickTack();
        }, this.options.tickInterval - elapsed);
        return;
      }
      this.handleTick.call(this, ++this._tickCounter);
      if (this.enabled) {
        this._timerObject = setTimeout(function() {
          return that._tickTack();
        }, this.options.tickInterval);
        return this._lastTickTime = this.now();
      }
    }
  }
});


return Timer;


});
