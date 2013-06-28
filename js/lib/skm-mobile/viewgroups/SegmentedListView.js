  
// Match List View

define(['skm-mobile/NotificationCenter'], function(NotificationCenter) {
'use strict';

/**
 * Represents a list view that loads its content based on total sum of the 
 * currently visible elements, scroll position and window height.
 */


var SegmentedListView = Backbone.View.extend({
  _toolbarHeight: 0,

  _rowHeight: 0,

  _listHeight: 0,

  _itemsCount: 0,

  _listSegment: null,

  _listElementsArr: null,

  initialize: function() {
    var that = this;

    this._listElementsArr = this.$el.find('li.Match');

    // initialize scroll
    $(window).scroll(function(evt) {
      that.handleScroll(evt);
    });

    // watch for resize
    NotificationCenter.on('window:resized', function() {
      this._calculateConstraints();
    }, this);

    // calculates the constraints for this scroll list
    this._calculateConstraints();

    this._calculateListSegment();

    this._flashRows();
  },

  render: function(templateData) {
    var html = null;
    if ( ! templateData )
      html = 'Nothing more to load...';
    else
      html = mobile.com.betbrain.nextMatches.matchesList(templateData);
    // append the constructed html
    this.$el.append(html);
    // recalculate constraints after rendering
    this._calculateConstraints();
    // ...and try to load more items, if available
    this.loadMoreItems();
  },

  renderError: function() {
    this.$el.append('Error when trying to load more items. #hardcoded');
  },

  getListItemsCount: function() {
    return this.$el.children().length;
  },

  handleScroll: function(evt) {
    var el = $(evt.currentTarget);
    this._calculateListSegment();
    this._flashRows();
  },

  _flashRows: function() {
    var bottomElement = this._listElementsArr.eq(this._listSegment[0]);
    var topElement = this._listElementsArr.eq(this._listSegment[1]);

    this._listElementsArr.each(function() {
      $(this).css({ 'background': 'none' });
    });

    topElement.css({ 'background-color': 'red' });
    bottomElement.css({ 'background-color': 'red' });
  },

  _calculateListSegment: function() {
    var scroll = $(window).scrollTop();

    // alert('scroll : ' + scroll)
    
    var offsetTop = scroll - this._toolbarHeight;
    var offsetBottom = (this._windowHeight + scroll) - this._toolbarHeight - (51 * 2);

    // alert(this._toolbarHeight)
    // alert(this._toolbarHeight)
    // alert(offsetTop + ', ' + scroll)

    var start = Math.floor(offsetTop / this._rowHeight);
    var end = Math.floor(offsetBottom / this._rowHeight);

    // alert(this._rowHeight)
    // alert(start + ',' + end)

    this._listSegment = [((start < 0) ? 0 : start), end];

    // alert(this._listSegment[0] + ', ' + this._listSegment[1])
  },

  _calculateConstraints: function() {
    this._rowHeight = this.$el.find('li.Match:first-child').outerHeight();
    this._toolbarHeight = $('#toolbar').height();
    this._listHeight = this.$el.height();
    this._windowHeight = $(window).height();
  }
});


return SegmentedListView;


});