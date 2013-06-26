
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
   * Handled after the view is initialized and added to the dom(if not already)
   */
  afterPageLoaded: function() {
    return this;
  },

  /**
   * Handled after the view has been received the dispose command
   */
  afterPageDisposed: function() {
    return this;
  },

  /**
   * Handled after the page view has finished the "show" animation
   */
  afterPageDisplayed: function() {
    return this;
  },

  /**
   * Handled after the page view has finished the "hide" animation
   */
  afterPageHidden: function() {
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
    this.view.prepareTemplate();
  },

  handleViewNeedsData: function() {
    Logger.info('PageController.handleViewNeedsData');
    this._requestTemplateData();
  },

  handleDataLoadingSuccess: function(templateData) {
    Logger.info('PageController.handleDataLoadingSuccess');
    this.view.renderTemplateData(templateData);
  },

  handleDataLoadingError: function() {
    Logger.error('PageController.handleDataLoadingError');
    this.trigger('pageSetupError');
  },

  handleViewRendered: function() {
    Logger.info('PageController.handleViewRendered');
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
    this.view.dispose();
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
    var that = this, viewPath = this._getPageViewPath(this.identifier);

    if ( this.view === null ) {
      Logger.debug('PageController : view is null; loading view constructor');
      require([viewPath], function(viewConstructor) {
        that.view = new viewConstructor({ identifier: that.identifier });
        that._attachViewEvents();
        that.handleViewLoaded();
      });
    }

    return this;
  },

  /*
    Content management
    ------------------
   */

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

  _getPageViewPath: function() {
    var pathInFolder = this.identifier.toLowerCase().replace(/[^\w\d]+/g, '');
    var viewName = this.getViewNormalizedName();
    var viewsPath = 'views';
    return viewsPath + '/' + pathInFolder + '/' + viewName;
  },

  // @todo make the loading mechanism, higly customisable
  // by letting the PageController to set its content path
  _requestTemplateData: function(callback) {
    var contentPath = window.location.pathname;
    var req = $.ajax({
      url: contentPath,
      context: this,
      data: { ajax: true },
      error: this.handleDataLoadingError,
      success: this.handleDataLoadingSuccess
    });
  },

  _attachViewEvents: function() {
    this.view.on('needsTemplateData', this.handleViewNeedsData, this);

    // called directly on the overridden methods
    this.view.on('templateRendered', function() {
        this.pageLoaded();
        this.handleViewRendered();
      }, this);

    this.view.on('after:show', this.pageDisplayed, this)
      .on('after:hide', this.pageHidden, this)
      .on('after:dispose', this.pageDisposed, this);
  }
});


return PageController;


});