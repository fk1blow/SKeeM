
// test ListView implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'backbone'],
  function(SKMObject, SKMLogger)
{
'use strict';


var Logger = new SKMLogger();


var Scroller = _.extend(Backbone.Events, {
  _current: 0,

  _previous: 0,

  handleScroll: function(options) {
    var top = Math.floor(options.top / 40);
    this._previous = this._current;
    if ( this._previous != top )
      this.setCurrent(top);
  },

  setCurrent: function(current) {
    this._current = current;
    if ( current > this._previous )
      this.trigger('scrolled:down', current);
    else
      this.trigger('scrolled:up', current);
  }
});


var TestListViewAdapter = _.extend(Backbone.Events, {
  _visibleElementsCount: 8, 

  getView: function(pos) {
    return $('<li>' + pos + '</li>');
  },

  handleMovingUp: function(pos) {
    // cl('moving up', pos)
    
    var toAdd = pos;
    var view = this.getView(toAdd);
    
    // cl('add upper element :', toAdd)
    
    var $container = $('#listContainer');
    var topPadding = +$container.css('padding-top').replace('px', '');
    $container.prepend(view);
    $container.find('li:last').remove();
    $container.css({ 'padding-top': topPadding - 40 + 'px' })
  },

  handleMovingDown: function(pos) {
    // cl('moving down', pos)
    
    var toAdd = this._visibleElementsCount + pos + 1;
    var view = this.getView(toAdd);

    // cl('remove upper element :', toRemove)
    // cl('add lower element :', toAdd)
    
    var $container = $('#listContainer');
    var topPadding = +$container.css('padding-top').replace('px', '');
    $container.append(view);
    $container.find('li:first').remove();
    $container.css({ 'padding-top': topPadding + 40 + 'px' })
  }
});


var ListView = Backbone.View.extend({
  _adapter: null,

  _itemCount: 0,

  _listContainerElement: null,

  initialize: function() {
    this._listContainerElement = $('#listContainer');
    this._attachScrollingEvents();
  },

  setAdapter: function(adapter) {
    this._adapter = adapter;
    this._attachAdapterEvents();
  },

  _attachScrollingEvents: function() {
    this.$el.scroll(function() {
      Scroller.handleScroll({
        element: this,
        top: $(this).scrollTop()
      });
    });

    Scroller.on('scrolled:up', 
      TestListViewAdapter.handleMovingUp, TestListViewAdapter);

    Scroller.on('scrolled:down', 
      TestListViewAdapter.handleMovingDown, TestListViewAdapter);
  },

  _attachAdapterEvents: function() {
    var adapter = this._adapter;

    adapter.on('added:element', function() {
      cl('added element')
    });

    adapter.on('inserted', function() {
      cl('inserted element')
    });

    adapter.on('removed', function() {
      cl('removed element')
    });
  }
});


return ListView;


});