
// PageView container view

define(['skm/k/Object',
  'skm/util/Logger',
  'backbone'],
  function(SKMObject, SKMLogger)
{
'use strict';


var Logger = new SKMLogger();


var PageView = Backbone.View.extend({
  className: "Page",

  attributes: {
    "data-role": "page"
  },

  _activePageClass: "ActivePage",

  _frameworkElement: $('#content'),

  /*
    Content rendering
   */

  /**
   * Render the page view's content on the framework
   * @param  {String} content The content html of the page view
   */
  renderPage: function(data) {
    Logger.info('PageView.renderPage');

    this.trigger('before:renderContent');

    this.ensurePageSkeletonAttached();

    Logger.debug('%c@todo implement the layout render mechanism', 'color:red');

    this.$el.html(data);

    this.trigger('after:renderContent');

    return this;
  },

  /**
   * Renders the page over existing page layout elements
   */
  renderPreFetched: function() {
    Logger.info('PageView.renderPreFetched');

    Logger.debug('%c@todo implement the layout render mechanism', 'color:red');

    var containerId = 'page' + this.options.identifier
    var $existingPageSkeleton = $('#' + containerId);

    this.setElement($existingPageSkeleton);
  },

  /**
   * Triggered when the Page becomes the next one after the hidden page
   *
   * @description when a Page becomes the next after a hidden one,
   * this controller must dispose its view, html, events, updates, etc
   */
  disposeContent: function() {
    this.trigger('before:disposeContent');
    // if the view decides otherwise
    if ( this.shouldEmptyContentOnDispose() )
      this.emptyPageContent();
    return this;
  },

  /**
   * Asks whether it should clear the page on dispose
   * 
   * @description overrite on specific cases
   */
  shouldEmptyContentOnDispose: function() {
    return true;
  },

  /**
   * Clears the page content of its html
   *
   * @description overrite on specific cases
   */
  emptyPageContent: function() {
    this.$el.empty();
    this.trigger('after:clearPageContent');
    return this;
  },

  /*
    Page display
    ------------
   */

  /**
   * Displays the content on the framework
   */
  show: function() {
    this.trigger('before:displayContent');
    this.$el.addClass(this._activePageClass);
    return this;
  },

  /**
   * Hides the page content on the framework
   */
  hide: function() {
    this.trigger('before:hideContent');
    this.$el.removeClass(this._activePageClass);
    return this;
  },

  /**
   * Returns if the page has content or not
   * @return {Boolean}
   */
  pageAlreadyHasContent: function() {
    var containerId = 'page' + this.options.identifier;

    // if the page is not attached to the framework
    if ( ! this.pageAlreadyAttached(containerId) )
      return false;
    
    // if page attache but has no children
    if ( $('#' + containerId).children().length < 1 )
      return false;
    
    return true;
  },

  /*
    Page skeleton, html framework
    -----------------------------
   */

  /**
   * Attaches the page container to the html framework
   */
  ensurePageSkeletonAttached: function() {
    Logger.info('PageView.ensurePageSkeletonAttached');

    var containerId = 'page' + this.options.identifier;

    if ( ! this.pageAlreadyAttached(containerId) ) {
      this.$el.attr('id', 'page' + this.options.identifier);
      this._frameworkElement.append(this.$el);
    }

    return this;
  },

  /**
   * @tbd
   * 
   * Dettaches the page from the html framework
   */
  dettachPageSkeleton: function() {
    Logger.info('PageView.dettachPageSkeleton');
    return this;
  },

  pageAlreadyAttached: function(pageId) {
    return $('#' + pageId).length > 0;
  }
});


return PageView;


});