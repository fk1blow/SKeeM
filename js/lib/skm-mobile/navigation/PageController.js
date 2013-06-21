
// Page controller

define(['skm/util/Logger', 'skm/util/ConfigManager'],
  function(SKMLogger, ConfigManager)
{
'use strict';


var Logger = new SKMLogger();


// @todo make this variables configurable
var TemplatesUrlHost = "http://10.0.3.98:82/BB-Mobile-framework";
// var TemplatesUrlHost = window.location.href;
var TemplatesBaseUrl = TemplatesUrlHost + '/js/app/templates/';
var TemplatesExtension = '.html';


var PageController = function(options) {
  options || (options = {});
  this.view = null;
  this.pageContent = null;
  this.identifier = options.identifier || null;
  this.viewNormalizedName = null;
  this.initialize.apply(this, arguments);
}


PageController.extend = Backbone.Model.extend;


_.extend(PageController.prototype, Backbone.Events, {

  initialize: function() {},

  /*
    Handlers
    --------
   */

  handleViewLoaded: function(view) {
    Logger.info('PageController.handleViewLoaded');

    // loads the page view content
    this.loadContent();
  },

  handleContentLoaded: function() {
    Logger.info('PageController.handleContentLoaded');

    // render content on the view
    this.view.renderContent(this.pageContent);
    
    // tell the nav controller that the view's content has been loaded
    this.trigger('pageSetupComplete');
  },

  /*
    Page management
    ---------------
   */

  /**
   * Prepares the requested page by creating the page view 
   * and rendering its page content
   */
  setupPage: function() {
    Logger.info('PageController.setupPage');
    this.loadView();
    return this;
  },

  /**
   * Disposes the page - opposite to [preparePage]
   *
   * @description usually, it means that this page controller
   * will be hidden and its data/dom disposed from the page
   */
  disposePage: function() {
    Logger.info('PageController.disposePage');
    this.view.disposeContent();
    this.pageContent = null;
    return this;
  },

  /*
    View and content api
    --------------------
   */

  /**
   * Loads and instantiates the PageView constructor
   *
   * @description by convention, if the view object is null, it attempts
   * to require the module. After module required, it instantiates the object
   * and calls the callback function
   * 
   * @param  {Function} callback method callback handler
   */
  loadView: function() {
    var that = this, viewName = "";
    
    if ( this.view == null ) {
      Logger.debug('PageController : view is null; loading view constructor');
      viewName = this.getViewNormalizedName();
      this._requireView(viewName, this.handleViewLoaded);
    } else {
      Logger.debug('PageController : view already set');
      this.handleViewLoaded();
    }

    return this;
  },

  /**
   * Loads the content of the page view
   *
   * @description it first asks the PageView if it should attempt
   * to load the content and if so, it makes an ajax request for a file
   * name [this.identifier] + 'View' + [TemplatesExtension]
   *
   * @todo this is not the actual content of the view but it's data
   * that will fill in the template of the PageView.
   * Therefor, should be renamed to loadPageData or ...
   */
  loadContent: function() {
    Logger.info('PageController.loadContent');
    var viewPath = null;

    if ( this.shouldLoadViewContent() ) {
      Logger.debug('PageController : will load content.');
      viewPath = this.getViewContentPath(this.getViewNormalizedName());
      this._requestContent(viewPath, this.handleContentLoaded);
    } else {
      Logger.debug('PageController : content already loaded');
      this.handleContentLoaded();
    }

    return this;
  },

  /*
    Content management
    ------------------
   */

  /**
   * Asks the controller if it should attempt to load the page view's content
   * 
   * @return {Boolean}
   */
  shouldLoadViewContent: function() {
    return this.pageContent == null;
  },

  /**
   * Returns the default implicit path of the page view
   * 
   * @param  {String} viewName the name of the page view
   * @return {String}          the page content path
   */
  getViewContentPath: function(viewName) {
    return TemplatesBaseUrl + viewName + this.getPageContentTemplateExtension();
  },

  /**
   * Returns the default extension for the page content template
   * 
   * @return {String} extension
   */
  getPageContentTemplateExtension: function() {
    return TemplatesExtension;
  },

  // @todo make it configurable
  /**
   * Returns the normalize standard name of a view
   *
   * @description usually, the implicit name of a page view is composed
   * from the PageController's identifier, concatenated with the "View" string
   * @return {String} page view name
   */
  getViewNormalizedName: function() {
    var prefix = ConfigManager.getModulePrefixes().PageView;
    if ( ! this.viewNormalizedName )
      this.viewNormalizedName = this.identifier + prefix;
    return this.viewNormalizedName;
  },

  /*
    Privates
    --------
   */

  _requireView: function(identifier, callback) {
    var that = this;
    var viewPath = this._getPageViewPath(identifier);

    require([viewPath], function(viewConstructor) {
      // set the page view instance
      that.view = new viewConstructor({ identifier: that.identifier });
      callback.call(that);
    });
  },

  _getPageViewPath: function() {
    var pathInFolder = this.identifier.toLowerCase().replace(/[^\w\d]+/g, '');
    var viewName = this.getViewNormalizedName();
    var viewsPath = 'views';
    return viewsPath + '/' + pathInFolder + '/' + viewName;
  },

  _requestContent: function(viewPath, callback) {
    var req = $.ajax({
      url: viewPath,
      context: this,
      error: function() {
        this.trigger('pageSetupError');
      },
      success: function(contentData) {
        this.pageContent = contentData;
        callback.call(this, contentData);
      }
    });
  }
});


return PageController;


});