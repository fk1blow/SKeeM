
// PageView container view

define(['skm/util/Logger'],
  function(SKMLogger)
{
'use strict';


var Logger = new SKMLogger();


Logger.debug('%c@todo : PageView : load the template using require, when declaring PageView dependencies', 'color:red');
// define(['skm/k/Object', 'mytemplate'....


var Logger = new SKMLogger();


var PageView = Backbone.View.extend({
  className: "Page",

  attributes: {
    "data-role": "page"
  },

  _activePageClass: "ActivePage",

  _frameworkContainer: $('#content'),

  initialize: function() {
    this._ensureSkeletonIsAttached();
  },

  /*
    Content rendering
   */
  
  prepareTemplate: function() {
    Logger.info('PageView.prepareTemplate');

    if ( this.pageNeedsRender() ) {
      this.trigger('needsTemplateData');
    } else {
      this.renderPrefetched();
    }
  },
  
  /**
   * Render the page view's content on the framework
   * @param  {String} content The content html of the page view
   */
  renderTemplateData: function(templateData) {
    Logger.info('PageView.renderTemplateData');
    
    this._ensureSkeletonIsAttached();

    this.$el.html(this.template(templateData));

    this.trigger('templateRendered');

    return this;
  },

  /**
   * Renders the page over existing page layout elements
   */
  renderPrefetched: function() {
    Logger.info('PageView.renderPrefetched');
    Logger.debug('%c@todo : PageView : implement the layout render mechanism', 'color:red');

    var containerId = 'page' + this.options.identifier;
    this.setElement($('#' + containerId));

    this.trigger('templateRendered');

    return this;
  },

  /**
   * Triggered when the Page becomes the next one after the hidden page
   *
   * @description when a Page becomes the next after a hidden one,
   * this controller must dispose its view, html, events, updates, etc
   */
  dispose: function() {
    this.trigger('before:dispose');
    // if the view decides otherwise
    if ( this.shouldEmptyContentOnDispose() )
      this.emptyPageContent();
    this.trigger('after:dispose');
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
    this.trigger('before:show');
    this.$el.addClass(this._activePageClass);
    Logger.debug('%c@todo : PageView : trigger the "after:show" event, after the show animation has ended', 'color:red');
    // @todo should be triggered after the animation has ended
    this.trigger('after:show');
    return this;
  },

  /**
   * Hides the page content on the framework
   */
  hide: function() {
    this.trigger('before:hide');
    this.$el.removeClass(this._activePageClass);
    Logger.debug('%c@todo : PageView : trigger the "after:hide" event, after the hide animation has ended', 'color:red');
    // @todo should be triggered after the animation has ended
    this.trigger('after:hide');
    return this;
  },

  /**
   * Returns true if the page needs data for its template content
   * @return {Boolean}
   */
  pageNeedsRender: function() {
    var containerId = 'page' + this.options.identifier;
    if ( $('#' + containerId).children().length < 1 )
      return true;
    else
      return false;
  },

  /*
    Page skeleton, html framework
    -----------------------------
   */

  /**
   * Ensures that the PageView's skeleton(its content wrapper)
   * is attached to the html framework
   */
  _ensureSkeletonIsAttached: function() {
    var id = 'page' + this.options.identifier;
    var $skeleton = $('#' + id);

    // if not attached
    if ( $skeleton.length < 1 ) {
      this._frameworkContainer.append(this.$el.attr('id', id));
    } else {
      this.setElement($skeleton);
    }
  },

  /**
   * @todo remove ?
   * 
   * Attaches the page container to the html framework
   */
  /*_attachSkeletonToFramework: function() {
    var containerId = 'page' + this.options.identifier;

    if ( ! this._skeletonAlreadyAttached(containerId) ) {
      this.$el.attr('id', 'page' + this.options.identifier);
      this._frameworkContainer.append(this.$el);
    }

    return this;
  },*/

  // @todo remove ?
  /*_skeletonAlreadyAttached: function(pageId) {
    return $('#' + pageId).length > 0;
  },*/

  /**
   * @tbd
   * 
   * Dettaches the page from the html framework
   */
  dettachPageSkeleton: function() {
    Logger.info('PageView.dettachPageSkeleton');
    return this;
  }
});


return PageView;


});