
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


/**
 * Abstract methods to be overriten by the PageController implementation
 */
var AbstractHandlers = {
  /**
   * Handled after the page was attached to the dom
   * @description  if the dom element is already in the framework, the events
   * will still be triggered
   */
  handlePageViewRendered: function() {
    return this;
  },

  /**
   * Handled after the view has been received the dispose command
   */
  handlePageViewDisposed: function() {
    return this;
  },

  /**
   * Handled after the page view has finished the "show" animation
   */
  handlePageViewShow: function() {
    return this;
  },

  /**
   * Handled after the page view has finished the "hide" animation
   */
  handlePageViewHide: function() {
    return this;
  }
};


var PageController = function(options) {
  options || (options = {});
  this.view = null;
  this.pageContent = null;
  this.identifier = options.identifier || null;
  this.viewNormalizedName = null;
  this.initialize.apply(this, arguments);
}


PageController.extend = Backbone.Model.extend;


_.extend(PageController.prototype, Backbone.Events, AbstractHandlers, {

  initialize: function() {},

  action_default: function() {},

  /*
    Handlers
    --------
   */

  handleViewLoaded: function() {
    Logger.info('PageController.handleViewLoaded');

    // attach some events on the PageView
    this._attachViewEvents();

    // loads the page view content
    this.loadContent();
  },

  handlePageContentLoaded: function(contentData) {
    Logger.info('PageController.handlePageContentLoaded');

    // render content on the view
    this.view.renderPageContent(contentData);
    
    // tell the nav controller that the view's content has been loaded
    this.trigger('pageSetupComplete');
  },

  handlePageAlreadyHasContent: function() {
    Logger.info('PageController.handlePageAlreadyHasContent');

    // render the page by attaching to the existing layout elements
    this.view.renderPrefetchedPage();

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
      this._requireView(this.getViewNormalizedName(), this.handleViewLoaded);
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

    if ( this.pageViewNeedsContent() ) {
      Logger.debug('PageController : will load content.');
      viewPath = this.getViewContentPath(this.getViewNormalizedName());
      this._requestContent(viewPath, this.handlePageContentLoaded);
    } else {
      Logger.debug('PageController : content already loaded');
      this.handlePageAlreadyHasContent();
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
  pageViewNeedsContent: function() {
    return ( this.view && ! this.view.pageAlreadyHasContent() );
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
    var prefix = ConfigManager.getPrefix('PageView');
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
      // that.pageContent = new PageContentModel({ url: window.location.pathname });

      // set the page view instance
      that.view = new viewConstructor({
        identifier: that.identifier
        // model: contentModel
      });

      // that._attachPageViewEvents();

      callback.call(that);
    });
  },

  _getPageViewPath: function() {
    var pathInFolder = this.identifier.toLowerCase().replace(/[^\w\d]+/g, '');
    var viewName = this.getViewNormalizedName();
    var viewsPath = 'views';
    return viewsPath + '/' + pathInFolder + '/' + viewName;
  },

  // @todo make the loading mechanism, higly customisable
  // by letting the PageController to set its content path
  _requestContent: function(viewPath, callback) {
    var contentPath = window.location.pathname;

    var req = $.ajax({
      url: contentPath,
      
      context: this,

      data: { ajax: true },

      error: function() {
        this.trigger('pageSetupError');
      },

      success: function(contentData) {
        // this.pageContent = contentData;
        callback.call(this, contentData);
      }
    });
  },

  _attachViewEvents: function() {
    this.view.on('after:renderContent', this.handlePageViewRendered, this);
    this.view.on('after:show', this.handlePageViewShow, this);
    this.view.on('after:hide', this.handlePageViewHide, this);
    this.view.on('after:disposeContent', this.handlePageViewDisposed, this);
  }
});


return PageController;


});