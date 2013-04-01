define([
 'underscore', 
 'backbone',
 'views/MyView'

], function(_, Backbone, MyView){
	/**
	 * Controller Object responsible for View construction and application event flow
	 * @type {[Object]}
	 */
	var MyController = _.extend( {}, Backbone.Events );

	(function(module){
		/**
		 * Define application logic here, by extending the Controller
		 */
		_.extend( module, {
			/**
			 * Function called immediately after App Initialize 
			 */
			start: function(){

				console.log('Controller::Start  --> define logic');
				
			}

		});

	})(MyController);

	return MyController;

});