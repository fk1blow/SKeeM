;(function() {


// var ViewController = SK.ui.ViewController;
// var Logger = SK.util.Logger.getInstance( );


// BB.ViewControllers.RTF = {};


// var LiveMatchesTable = BB.ViewControllers.RTF.LiveMatchesTable = {};


// LiveMatchesTable.Wrapper = ViewController.extend({
//   setup: function() {
//     Logger.debug( '%cnew LiveMatchesTable.Wrapper', 'color:#A2A2A2' );

//     // Create the main view
//     this.view = BB.Views.RTF.LiveMatchesTable.Wrapper.create();
//     this.view.bind('after:render', this.view.buildItemRowList, this.view);

//     // render initial json dump
//     this.view.render(rtfMatchesJSON);

//     // Create the rows
//     // this.addChildViewController('RowItem',
//     //   LiveMatchesTable.RowViewController, { itemRows: this.view.getItemRows() });
//   }
// });


// LiveMatchesTable.RowViewController = ViewController.extend({
//   setup: function(options) {
//     var opt = options || {};
//     Logger.debug( '%cnew LiveMatchesTable.RowViewController', 'color:#A2A2A2' );
//     this._buildRowItems(opt.itemRows);
//   },

//   _buildRowItems: function() {
//     //
//   }
// });

var UI = window.UI || {};

UI.Components = {};

UI.Components.ListContainer = Widget.extend({
  template: {
    templateString: '<ul class="<%= className %>">',
    dataObject: {
      className: 'LiveMatchesList'
    },
    engine: 'underscore'
  }
});

UI.Components.ListItem = Widget.extend({
  template: {
    templateString: '<li class=" <%= className %> ">',
    dataObject: {
      className: 'TheMatch'
    }
  }
});

UI.Components.MatchDetails = Widget.extend({
  template: {
    templateString: '<div class="<%= className %>">',
    dataObject: {
      className: 'MatchDetails'
    }
  }
});

UI.Components.OddsList = Widget.extend({
  template: {
    templateString: '<div class="<%= className %>" > ODDDDDD </div>',
    dataObject: {
      className: 'OddsList'
    },
    engine: 'underscore'
  }
});

UI.Components.OddsListItem = Widget.extend({
  template: {
    templateString: '<div class="<%= className %>" > ODDDDDD </div>',
    dataObject: {
      className: 'Outcome'
    },
    engine: 'underscore'
  }
});

UI.Components.MatchNextInfo = Widget.extend({
  template: {
    templateString: '<div class="<%=className%>" >',
    dataObject: {
      className: 'MatchNextInfo'
    }
  }
});


var Mode = Backbone.Model.extend({});
var myModel = new Mode(  { 
    defaults: {
      name: 'match name'
    }
});



var jsonAdapter = function(Widget, JSON) {
  this.JSONData = JSON;
  this.WidgetConstructor = Widget;
  this.WidgetCollection = [];
  this.Components = {};
  this.ComponentsTemplates = {};

  this.initialize();

};

jsonAdapter.prototype = {

  initialize: function(){
    this.parseJSON();

//1
    this.setComponentTemplateUrl( 'matches' , 'js/templates/TheMatch.ejs' );

    // this.setComponentTemplateString( 'matches' , '<div class="<%= name %>">' );
//2
    this.createInterfaceComponents();

    // console.log( this.WidgetCollection );
      
    var complexWidget = this.createViewContainer({
      model: myModel,
      el: $('#NextLiveMatchesRTF'),
      events: {
        "click a.Bet" : function(evt){  evt.preventDefault(); console.log(this); myModel.set('name', 'xxx'); }
      },
      initialize: function(){ this.model.on('change:name', function(){ }); },
      UIManager : UI,
      subviews: [
        {
          type: 'ListContainer',
          subviews: this.WidgetCollection
        }
      ]
      
    });

    complexWidget.render();
    complexWidget.addSubview( UI.Components.OddsListItem , true);


    // console.log( new EJS({ url: 'js/templates/TheMatch.ejs' }).text )
    
    // console.log(this.ComponentsTemplates['matches'].templateString.render(this.JSONData))

  },

  parseJSON : function(){
    var types = Object.keys(this.JSONData) ;
    for (var i = 0; i < types.length; i++) {
      this.setComponentsTypes( types[i] , this.JSONData[ types[i] ]);
    }
  },

  setComponentsTypes : function(type, options){
    this.Components[type] = options;
  },

  setComponentTemplateString : function(type, templateString){
    this.ComponentsTemplates[type] = {
      templateString : templateString
    };
  },

  getComponentTemplateString : function(type){
    return this.ComponentsTemplates[type].templateString;
  },

  setComponentTemplateUrl : function(type, url) {
    this.ComponentsTemplates[type] = {
      url : url
    };
  },

  getComponentTemplateUrl : function(type) {
    return this.ComponentsTemplates[type].url;
  },

  createComponentTemplateObject : function(type, dataObj, engine){
    if (engine == 'underscore') {
      var ts = this.getComponentTemplateString(type);
      return { template :  _.extend( { templateString : ts } , { dataObject: dataObj , engine : 'underscore'} ) } ;  
    } else if (engine == 'ejs') {
      var url = this.getComponentTemplateUrl(type);
      return { template :  _.extend( { url : url } , { dataObject: dataObj , engine : 'ejs'} ) } ;  
    }
    
  },

  getCompiledTemplate : function(templateString, dataObject){
    var compileTpl = _.template(templateString);
    var compiledObj = compileTpl(dataObject); 
    return { compiledString : compiledObj };
  },

  createInterfaceComponents : function(){
    for (var type in this.Components){
      // console.log( 'Creating Inteface Components of type:', type );
      for (var i = 0, arrLen = this.Components[type].length; i < arrLen; i++ ){
        // console.log(this.Components[type][i]);
         var myWidget = this.createView( type, this.Components[type][i] );
         this.addView( myWidget );
      }
    }
  },

  createView : function( type, dataObject){
    var templateObj = this.createComponentTemplateObject( type, dataObject, 'ejs' );
    // var templateObj = this.createComponentTemplateObject( type, dataObject, 'underscore' );
    return new this.WidgetConstructor(  templateObj );
  },

  createViewContainer : function(args) {
    return new Widget( args );
  },

  addView : function(view){
    this.WidgetCollection.push(view);
  },

  removeView : function(index){
    this.WidgetCollection.splice(index, 1);
  },

  getView : function(index){
    return this.WidgetCollection[index];
  },

  clearViews : function(){
    this.WidgetCollection.splice(0, this.WidgetCollection.length );
  }

};

var firstTestAdapter = new jsonAdapter( Widget, window.rtfMatchesJSON );

// firstTestAdapter.parseJSON();


}());



