define([
  'underscore',
  'backbone'

], function(_){
	/**
	 * Custom Module that holds references to utility classes and custom attributes
	 * @type {Object}
	 */
	var ReqObserver = _.extend( {}, Backbone.Events );

	/**
	 * [ Log Request Events ]
	 */
	ReqObserver.on('all', function(eventName){
		console.log('RequestObserver::', eventName)
	});

	return ReqObserver;

});