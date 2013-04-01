define([
  'underscore'

], function(_){
	/**
	 * Custom Module that holds references to utility classes and custom attributes
	 * @type {Object}
	 */
	var MyModule = {};

	(function(module){
		/**
		 * Extend the module with any utility functions from external sources
		 */
		_.extend( module, {

				defaultsOptions : {
					WidgetOptions: {
						setOptions: {
							viewOptions: ['marker'],
							configOptions: {
								debug: true,
								renderTemplate: true

							}
						},
					}
				}

		});

	})(MyModule);	

	return MyModule;

});				