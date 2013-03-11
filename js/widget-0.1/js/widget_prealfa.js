var Widget = Backbone.View.extend({
	/**
	 * Object reference containing some default UI Components and a Factory method for creating different types of Widgets
	 * @type {[Object]}
	 */
	UIManager: null,
	/**
	 * Subviews container storing references to any child element it contains
	 * @type {[Array]}
	 */
	_subviews: null,
	/**
	 * Initialization entry point. 
	 * @return {[void]}
	 */
	initialize: function(){},
	/**
	 * @type {[Public function]}
	 * Renders the element in the parents container or the specified el option
	 * @return {[Object]}
	 */
	render: function(_$){
		var _$ = _$ || this.$el;
		this._delegateToSubviews(this.$el);
		_$.append(this.$el);
		return this;
	},
	/**
	 * @type {[public function]}
	 * Appends a new Widget instance to the _subviews array with the arguments provided by the [subviews] parameter
	 * @return {[bool]} 
	 */
	addSubview: function(){
		if (arguments.length == 1) {
			this._subviews.push(new Widget(arguments[0]));
			// console.log('subviews', this._subviews);
			return true;
		} else {
			console.log(' Usage: addSubview[Object] ');
       		return false;
		}
	},
	/**
	 * @type {[public function]}
	 * Returns specified subview by index from the _subviews Array
	 * @return {[Object]}
	 */
	getSubview: function(){
		if (arguments.length == 1) {
			if (this._subviews.length - 1 >= arguments[0] && arguments[0] >= 0) {
				return this._subviews[arguments[0]];
			} else {
				console.log('Array index out of bounds:', arguments[0]);
				return false;
			}
		} else {
			console.log('Usage: getSubview[index] ');
			return false;
		}
	},
	/**
	 * @type {[public function]}
	 * Removes the specified index from the _subviews array
	 * @return {[type]}
	 */
	removeSubview: function(){
		if (arguments.length == 1) {
			if (this._subviews.length - 1 >= arguments[0] && arguments[0] >= 0) {
				console.log('Removing ', this._subviews[arguments[0]]);
				this._subviews[arguments[0]].remove();
				this._subviews.splice(arguments[0], 1);
				return true;
			} else {
				console.log('Array index out of bounds:', arguments[0]);
				return false;
			}
		} else {
			console.log('Usage: removeSubview[index]');
			return false;
		}
	},
	/**
	 * [Override Backbone.View constructor]
	 * Added call to _initSubviews
	 * @param  {[Object]} options
	 * @return {[void]}
	 */
	constructor: function(options){
        this.cid = _.uniqueId('view');
        this._configure(options || {});
        this._ensureElement();
        this._initSubviews();
        this.initialize.apply(this, arguments);
        this.delegateEvents();         
    },
   /**
    * [Override Backbone.View _configure]
    * Modify viewOptions array for any specialized configuration preference.
    * Any option found in the constructor argument that also resides in the viewOptions array will be added as a instance property.
    * var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];
    * @param  {[Object]} options
    * @return {[void]}
    */ 
    _configure: function(options){
    	var genericOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events', 'template' , 'UIManager', 'initialize'] ;
    	if(options.registerOptions) {
    		var viewOptions = genericOptions.concat(options.registerOptions);
    	} else {
    		var viewOptions = genericOptions;
    	}
    	
    	if (this.options) options = _.extend({}, _.result(this, 'options'), options);
     	_.extend(this, _.pick(options, viewOptions));
    	this.options = options;
    	// console.log('Override _configuration:', this.options);
    },
    /**
     * [Override Backbone.View _ensureElement]
     * Added templating compilation option
     * @return {[void]}
     */
    _ensureElement: function() {
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        if (this.template) {
            // console.log('_ensure element template found', this.template );
            var compileTpl = _.template(this.template.templateString);
            var compiledObj = compileTpl(this.template.dataObject);
            var $el = Backbone.$(compiledObj).attr(attrs);
        } else {
            // console.log('_ensure element template not found', this.template);
            var $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
        }
        this.setElement($el, false);
      } else {
        this.setElement(_.result(this, 'el'), false);
      }
    },

    _initSubviews: function(){
    	this._subviews = [];
    	if (this.options.subviews) {
    		for (var i = 0, subvLen = this.options.subviews.length; i < subvLen; i++) {
		    		if(! this.options.subviews[i].UIManager) { 
				    		// console.log('Initializing with parents UIManager', this.UI);
				    		_.extend(this.options.subviews[i], { UIManager : this.UIManager} ); 
				    	}
		    		if (this.UIManager && this.UIManager.Components.hasOwnProperty(this.options.subviews[i].type)){
				    	// console.log('type found in Manager');
				    	this._subviews.push(
				    		this.UIManager.WidgetFactory(this.options.subviews[i].type, this.options.subviews[i])
				    	);
		    		} else {
		    			// console.log('type NOT in Manager, creating Generic widget');
		    			this._subviews.push(
				    		new Widget(this.options.subviews[i])
				    	);
		    		}
		    	// console.log('option Subview for,',this.options.subviews[i].type, '-- ',this.options.subviews[i].UIManager);
		    }    	
    	}
    },

    _delegateToSubviews: function(_$){
    	if ( this._subviews.length ) {
    		for ( var i = 0, subvLen = this._subviews.length; i < subvLen; i++ ) {
    			this._subviews[i].render(_$);
    		}
    		return true;
    	}
    	return false;
    }

});

/* -------->  GUI Components Constructors <---------- */
var UI = {};

/* @function Factory */
/* Creates new component of specified type, passing arguments to constructor */
UI.WidgetFactory = function(type, args){
    return new UI.Components[type](args);    
};

UI.Components = {};

UI.Components.Label = Widget.extend({
    template: {
    	templateString: '<div class="label">', 
    	dataObject: {}
    }

});

UI.Components.UList = Widget.extend({
    template: {
    	templateString: '<ul> ', 
    	dataObject: {}
    }

});

UI.Components.ListItem = Widget.extend({
    template: {
    	templateString: '<li>', 
    	dataObject: {}
    }

});

UI.Components.Container = Widget.extend({
    template: {
    	templateString: '<div class="container">', 
    	dataObject: {}
    }

});

UI.Components.Panel = Widget.extend({
    template: {
    	templateString: '<div class="panel">', 
    	dataObject: {}
    }

});
UI.Components.Text = Widget.extend({
    template: {
    	templateString: '<div> Text 1</div>', 
    	dataObject: {}
    }

});

var UI2 = {};
UI2.Components = {};
UI2.WidgetFactory = function(type, args){
    return new UI2.Components[type](args);    
};
UI2.Components.Label = Widget.extend({
    template: {
    	templateString: '<div class="label2">', 
    	dataObject: {}
    }

});

UI2.Components.Container = Widget.extend({
    template: {
    	templateString: '<div class="container2">', 
    	dataObject: {}
    }

});

UI2.Components.Panel = Widget.extend({
    template: {
    	templateString: '<div class="panel2">', 
    	dataObject: {}
    }

});
UI2.Components.Text = Widget.extend({
    template: {
    	templateString: '<div> <%= content %> </div>', 
    	dataObject: {
    		content: 'Content text'
    	}
    }

});
///////    ----------> END Components Constructors <-----------   ///////

var textArray = ['text','text1','text2']
var testObj = [];
for (var i = 0, textLen = textArray.length; i < textLen; i++) {
	testObj.push( { type: 'Text', 
		template : { 
			templateString: '<div class="text"> <%= content %> </div>',
			dataObject: {
				content: textArray[i]
			}
		} 
	} );
}
console.log(testObj);
var myList = new Widget({
	el: $('#display_wrapper'),
	UIManager: UI,
	events: {
		"click #clickme" : function(){ console.log('clicked'); }
	},
	initialize: function(){  this.render(); },
	// registerOptions: ['render'],
	subviews: [
		{
			type: 'Container',
			subviews: [
				{
					type: 'Panel',
					attributes: {
						id: 'clickme'
					},
					// UIManager: UI2,
					subviews: [
						{
							type: 'Label',
							// UIManager: UI,
							subviews: 
								testObj
							
						}
					]


				}
			]

		}
	]
});

// myList.render();
console.log(myList)
// myList.getSubview(0).getSubview(0).getSubview(0).removeSubview(2)
