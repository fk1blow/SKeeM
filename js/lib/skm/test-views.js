


require(['skm/k/Object', 'skm/ui/View', 'skm/ui/EventResponder', 'skm/util/Observable'],
  function(SKMObject, SKMView, SKMResponder, SKMObservable)
{


console.clear();




var A = SKMView.extend({
  el: $('#dummyParentModule'),

  setup: function() {
    var b = B.create();
    b.on('test', function() {
      cl('A:test');
    });
    this.addChildResponder(b);
  }
});

var B = SKMView.extend({
  el: $('#playbackControls'),

  setup: function() {
    var c = C.create();
    c.on('test', function() {
      cl('B:test');
    });
    this.addChildResponder(c);
  }
});

var C = SKMView.extend({
  el: $('#playbackControls').find('li'),

  events: {
    'click #playbackBack': 'handlePlaybackButton',
    'click #playbackStop': 'handlePlaybackButton',
    'click #playbackPause': 'handlePlaybackButton',
    'click #playbackPlay': 'handlePlaybackButton',
    'click #playbackForward': 'handlePlaybackButton',
  },

  setup: function() {
    cl('%cC.initialize', 'color:#a2a2a2');
  },

  handlePlaybackButton: function(evt) {
    var el = $(evt.currentTarget);
    evt.preventDefault();
    cl('handlePlaybackButton', el.attr('id'))
    this.fire('test');
  }
});


A.create();


// console.clear();



/*var A = SKMView.extend({
	el: $('#playbackControls'),

	events: {
		'click #playbackBack': 'handlePlaybackButton',
		'click #playbackStop': 'handlePlaybackButton',
		'click #playbackPause': 'handlePlaybackButton',
		'click #playbackPlay': 'handlePlaybackButton',
		'click #playbackForward': 'handlePlaybackButton',
		'longtap 400 50 #playbackPause': 'handleTapPause'
	},

	handlePlaybackButton: function(evt) {
    var el = $(evt.currentTarget);
    evt.preventDefault();
		cl('handlePlaybackButton', el.attr('id'))
	},

	handleTapPause: function() {
		cl('handleTapPause')
	}
});


// console.time('abx');
// for(var i = 0; i < 1000; i++) {
	A.create();
// }
// console.timeEnd('abx');*/






return;























var AButton = SKMObject.extend({
  name: 'AButton',

  initialize: function() {
    this._attachEvents();
  },

  _attachEvents: function() {
    var that = this;
    $(document).on('vmouse', this.targetSelector, function(evt) {
      that._processEvent(evt);
    });
  },

  _processEvent: function(evt) {
    var currentHit = $(evt.hitTarget);
    // cl(currentHit, this.targetSelector)
    if (currentHit.is(this.targetSelector)) {
      cl('X : ', this.name)
      evt.stopPropagation();
    //   cl('same', currentHit)
    }
    // return false;
  }
});

var BButton = AButton.extend({
  name: 'BButton',

  initialize: function() {
    this._attachEvents();
  }
});


var $el = $('#playbackControls');
AButton.create({ el: $el, targetSelector: $el.find('a') });
BButton.create({ el: $el, targetSelector: $el });


return;





















return;

/**
 * document binds implementation
 */

var vMouseEvents = 'click mouseover mousedown mousemove mouseup mouseout mousecancel';
$(document).bind(vMouseEvents, function(evt) {
  $(this).trigger({
    type: 'vmouse',
    hitTarget: evt.target
  });
});


var $list = $('#playbackList').find('li');


var XButton = SKMObject.extend({
  initialize: function() {
    this._attachEvents();
  },

  _attachEvents: function() {
    var that = this;
    $(document).on('vmouse', function(evt) {
      that._processEvent(evt);
    });
  },

  _processEvent: function(evt) {
    var currentHit = $(evt.hitTarget);
    if (currentHit.is(this.targetSelector)) {
      cl('same', currentHit)
    }
  }
});


var YButton = SKMObject.extend({
  events: ['click', 'click', 'click', 'click', 'click', 'click'],

  initialize: function() {
    this._attachEvents();
  },

  _attachEvents: function() {
    var that = this;
    for (var i = 0; i < this.events.length; i++) {
      this.el.on(this.events[i], 'a', function() {
        cl('click on YButton')
      });
    }
  }
});


console.time('XButton');
$list.each(function() {
  var $el = $(this);
  XButton.create({ el: $el, targetSelector: $el.find('a') });
  // YButton.create({ el: $(this), targetSelector: $(this).find('a') });
});
console.timeEnd('XButton');


return;





















var A = SKMView.extend({
	el: $('#playbackControls'),

	events: {
		'click #playbackBack': 'handlePlaybackButton',
		'click #playbackStop': 'handlePlaybackButton',
		'click #playbackPause': 'handlePlaybackButton',
		'click #playbackPlay': 'handlePlaybackButton',
		'click #playbackForward': 'handlePlaybackButton'
	},

	handlePlaybackButton: function() {
		cl('handlePlaybackButton')
	}
});

// A.create();


var B = SKMView.extend({
	events: {
		'click a': 'handleClick',
		'click #playbackBack': 'handlePlaybackButton',
		'click #playbackStop': 'handlePlaybackButton',
		'click #playbackPause': 'handlePlaybackButton',
		'click #playbackPlay': 'handlePlaybackButton',
		'click #playbackForward': 'handlePlaybackButton'
	},

	handleClick: function() {
		cl('handleClick')
	},

	handlePlaybackButton: function() {
		cl('handlePlaybackButton')
	}
});


console.time('xae');
var a = new Date().getTime();


var list = $('#playbackList').find('li');

// $(list.splice(110)).each(function() {
list.each(function() {
	// $('#playbackList').on('click', 'a', function() {
	// 	cl('this')
	// })
	// B.create({
	// 	el: $(this)
	// });
});

B.create({ el: $('#playbackList') });

var b = new Date().getTime() - a;

// $('#playbackControls').after(b)
// alert(b)
cl(b)


// console.timeEnd('xae');


});