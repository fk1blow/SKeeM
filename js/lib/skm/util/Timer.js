
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
  // How many times the interval will
  // trigger a tick; (x < 1) == infinity
  ticks: 1,

  // The interval at which a tick is being triggered
  tickInterval: 1000,

  // If the timer is active or not
  enabled: false,

  _intervalScale: 0.8,

  // Timer object reference
  _timerObject: null,

  // How many time the timer has fired a "tick" event
  _tickCounter: 0,

  _lastTickTime: 0,

  initialize: function(options) {
    options || (options = {});
    this._timerObject = null;
    this.ticks = (options.ticks === 0) ? 0  : options.ticks;
    this.tickInterval = options.tickInterval || 1000;
  },

  /**
   * Commands
   */

  start: function() {
    var that = this;
    this.enabled = true;
    // Start only if the timerObject is not assigned(or null)
    if ( !this._timerObject ) {
      this._tickCounter = 0;
      this._timerObject = setTimeout(function() {
        that._tickTack();
      }, this.tickInterval);
      this._lastTickTime = this.now();
    }
    return this;
  },

  stop: function() {
    var lastTickCounter = this.getTicks();
    this.enabled = false;
    this._tickCounter = 0;
    if ( this._timerObject ) {
      clearTimeout(this._timerObject);
      this._timerObject = null;
    }
    return this;
  },

  /**
   * Handlers
   */

  handleTick: function(ticks) {
    this.fire('tick', ticks);
  },

  /**
   * Getters/Setters
   */

  getTicks: function() {
    if ( this.ticks < 1 )
      return 0;
    else
      return this.ticks;
  },


  maxTicksReached: function() {
    if ( this.getTicks() === 0 )
      return false;
    else
      return this._tickCounter >= this.getTicks();
  },

  now: function() {
    return (new Date()).getTime();
  },

  /**
   * Private
   */

  _tickTack: function() {
    if ( this.enabled ) {
      var that = this, elapsed, notSynced;

      // Stop if reached maximum ticks set
      if ( this.maxTicksReached() ) {
        this.stop();
        return;
      }

      // Synchronize the interval with the elapsed time
      // @see closure-library.googlecode.com/svn/docs/closure_goog_timer_timer.js.html
      elapsed = this.now() - this._lastTickTime;
      notSynced = elapsed > 0 && elapsed < (this.tickInterval * this._intervalScale);
      if ( notSynced ) {
        this._timerObject = setTimeout(function() {
          that._tickTack();
        }, this.tickInterval - elapsed);
        return;
      }
      
      // Handle the ticks and increment internal counter
      this.handleTick.call(this, this.getTicks());
      this._tickCounter++;
      
      // In goog.timer, this re-check is required becase a timer may be
      // stopped between a tick so that [this.enabled] could be reset
      if ( this.enabled ) {
        this._timerObject = setTimeout(function() {
          that._tickTack();
        }, this.tickInterval);
        this._lastTickTime = this.now();
      }
    }
  }
});


return Timer;


});