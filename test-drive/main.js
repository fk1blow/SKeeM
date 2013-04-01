/**
 * Configure application modules paths
 */
require.config({
	baseUrl: 'js',
	paths: {
		jquery: 'library/min/jquery',
	    underscore: 'library/min/underscore',
	    backbone: 'library/min/backbone',
	    templates: 'templates',
	    controllers: 'modules/controllers',
	    models: 'modules/models',
	    observers: 'modules/observers',
	    views: 'modules/views',
	    modules: 'modules',
	    utils: 'utils'
	}
});
/**
 * Load main App module
 */
require([
	'app'

], function(App){ 
	/**
	 *  Initialize application when DOM finishes loading
	 */
	$(function(){

		window.App = App.initialize();

	});

});