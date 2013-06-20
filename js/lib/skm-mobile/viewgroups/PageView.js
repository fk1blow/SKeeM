
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
  renderContent: function(content) {
    this.trigger('before:renderContent');

    if ( this.alreadyHasContent() == false ) {
      Logger.debug('PageView : will render content');
      this.attachPageSkeleton();
      this.$el.html(content); 
    } else {
      Logger.debug('PafeView : content already rendered')
    }

    this.trigger('after:renderContent');

    return this;
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
  alreadyHasContent: function() {
    return this.$el.children().length;
  },

  /*
    Page skeleton, html framework
    -----------------------------
   */

  /**
   * Attaches the page container to the html framework
   */
  attachPageSkeleton: function() {
    Logger.info('PageView.attachPageSkeleton');

    var containerId = 'page' + this.options.identifier;
    if ( ! this.skeletonAlreadyAttached(containerId) ) {
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

  skeletonAlreadyAttached: function(pageId) {
    return $('#' + pageId).length;
  }
});


return PageView;


});