
var App = window.App || {};


$(function() {


/**
 * PlaybackController
 */
App.PlaybackController = function() {
	this.playbackView = new App.PlaybackView();

	this.playbackView.on('playaback:back', function() {
		console.log('Player state : back')
	})
	this.playbackView.on('playaback:stop', function() {
		console.log('Player state : stop')
	})
	this.playbackView.on('playaback:play', function() {
		console.log('Player state : play')
	})
	this.playbackView.on('playaback:pause', function() {
		console.log('Player state : pause')
	})
	this.playbackView.on('playaback:forward', function() {
		console.log('Player state : forward')
	})
}
App.PlaybackController.prototype = {
	playbackView: null
}


/**
 * PlaybackView
 * @type {Backbone.View}
 */
App.PlaybackView = Backbone.View.extend({
	el: $('#playbackControls'),

	backButton: null,

	stopButton: null,

	pauseButton: null,

	playButton: null,

	forwardButton: null,

	initialize: function() {
		console.log('App.PlaybackView:initialize');
		this.initializeBackButton();
		this.initializeStopButton();
		this.initializePauseButton();
		this.initializePlayButton();
		this.initializeForwardButton();
	},

	initializeBackButton: function() {
		this.backButton = new App.PlaybackButtonView({ el: this.$el.find('#playbackBack') });
		this.backButton.on('clicked', function() {
			this.trigger('playaback:back');
		}, this);
	},

	initializeStopButton: function() {
		this.stopButton = new App.PlaybackButtonView({ el: $('#playbackStop') });
		this.stopButton.on('clicked', function() {
			this.trigger('playaback:stop');
		}, this);
	},

	initializePauseButton: function() {
		this.pauseButton = new App.PlaybackButtonView({ el: $('#playbackPause') });
		this.pauseButton.on('clicked', function() {
			this.trigger('playaback:pause');
		}, this);
	},

	initializePlayButton: function() {
		this.playButton = new App.PlaybackButtonView({ el: $('#playbackPlay') });
		this.playButton.on('clicked', function() {
			this.trigger('playaback:play');
		}, this);
	},

	initializeForwardButton: function() {
		this.forwardButton = new App.PlaybackButtonView({ el: $('#playbackForward') });
		this.forwardButton.on('clicked', function() {
			this.trigger('playaback:forward');
		}, this);
	},
});


/**
 * PlaybackButtonView
 * @type {Backbone.View}
 */
App.PlaybackButtonView = Backbone.View.extend({
	events: {
		'click': 'handleClick',
	},

	initialize: function() {
		console.log('App.PlaybackButtonView : initialize : ', this.$el);
	},

	handleClick: function(evt) {
		var $el = $(evt.currentTarget);
		console.log('button was clicked ', $el.text());
		this.trigger('clicked');
	} 
});


new App.PlaybackController();


});