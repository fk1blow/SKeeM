define([
 'underscore',
 'backbone'

], function(_, Backbone){
	
	var Widget = Backbone.View.extend({
		/**
		 * Config option. Enable to log feedback
		 * @type {Boolean}
		 */
		debug: false,
		/**
		 * Property holding the currently set template for the Widget
		 * @type {[type]}
		 */
		templateString: null,
		/**
		 * Object contining template processing methods,  
		 *  Must implement Following interface:
		 * {function} template(tmpStr, dataObj)
		 *      @param {[string]} tmpStr [Template string to be processed]
		 *      @param {[Object]} dataObj [Object holding values for template processing]
		 * @type {[Object]}
		 */
		templateEngine: null,
		/**
		 * Should contain config data about instance creation
		 * Auto process / render Template [ disabled ]
		 * @type {[ Object ]}
		 */
		_configOptions: {
			renderTemplate: false,
		},
		/**
		 * Property array used to pick Own Properties
		 * @type {Array}
		 */
		_viewOptions : ['model', 'collection', 'el', 'id', 'attributes', 'className', 'debug', 'tagName', 'events', 'initialize'],
		/**
		 * @Override Backbone.View.Constructor
		 */
		constructor: function(options){
			this.cid = _.uniqueId('view');
			this._setOptions(options);
		    this._configure(options || {});
		    this._initTemplate();
		    this._ensureElement();

		    this._initSubviews();

		    this.initialize.apply(this, arguments);
		    this.delegateEvents();
		},
		renderTo: function(selector){
			if(selector){
				console.log('Attaching to container', selector );
				selector.html( this.$el );
			}
		},
		/**
		 * Extends this Widget with a _templateString property.
		 * This should be called before processTemplate
		 * @param {[String]} templateString [raw template string]
		 */
		 setTemplate: function(templateString){
            _.extend(this, { templateString: templateString });
        },
           /**
         * Call this function to set the Widget $el to a processed template 
         * + read from  the _templateString property 
         * @param  {[Object]} dataObj [Object containing the values for the variables in the templateString]
         * @return {[void]}         [If the template was processed successfully, then inject it to the DOM]
         */
        renderTemplate: function(dataObj){
        	if (this._configOptions.debug) console.log('renderTemplate::', dataObj);
        	var template = this.processTemplate(this.templateString, dataObj);
        	if (template) {
        		this.setElement(template);
        		this.render();
        		if (this._configOptions.debug) console.log('renderTemplate::template %c' + template, 'color:#093');
        	}// append to DOM  ?
        },
        updateTemplate: function(dataObj){
        	var newContent = this.processTemplate(this.templateString, dataObj);
        	$( this.$el ).replaceWith( $(newContent) );
        },
        /**
         * Extends the widget with a _templateEngine OBJECT REFERENCE
         * @param {[Object]} templateEngine [Object containing methods for processing templates]
         */
        setTemplateEngine: function(templateEngine){
        	_.extend(this, { templateEngine: templateEngine });
        },
        /**
         * Function takes 2 parameters in order to process the template.
         * @param  {[String]} tmpStr  [String containing the template html structure and ejs vars ]
         * @param  {[Object]} dataObj [Object containing the data for the variables in templateString ]
         * @return {[String]}         [After variable expansion return the processed template String. If an error occured, return False ]
         */
        processTemplate: function(tmpStr, dataObj){
        	if (this.templateEngine && typeof this.templateEngine.template == 'function' ) {
        		if (this._configOptions.debug) console.log('processTemplate::options Engine');
        		var template = this.templateEngine.template(tmpStr, dataObj);
        		if ( template ) return template;
        	} else {
        		if (this._configOptions.debug) console.log('processTemplate::default Engine');
        		var template = _.template(tmpStr, dataObj);
        		if ( template ) return template;
        	}
        	return false;
        },
		/**
		 * @Override Backbone.View._configure
		 */
		_configure: function(options) {
	      if (this.options) options = _.extend({}, _.result(this, 'options'), options);
	      _.extend(this, _.pick(options, this._viewOptions));
	      this.options = options;
	    },
	    /**
	     * Function called to ensure that a property found in constructor args is set as OwnProperty to the Widget
	     * @param {[String]} option [String option indicating the name of the property to bet set]
	     */
	    _setViewOptions: function(options){
	    	for (var i = 0, opLen = options.length; i < opLen; i++){
	    		this._viewOptions.push(options[i]);
	    	}
	    },
	    /**
	     * Checks contructor argumnt for setOptions object and extends current instance with the configOptions
	     * and adds items to the viewOptions property
	     */
	    _setOptions: function(options){
	    	if (options && options.setOptions && options.setOptions.viewOptions) {
				this._setViewOptions(options.setOptions.viewOptions);
			} 
			if (options && options.setOptions && options.setOptions.configOptions) {
				_.extend( this._configOptions, options.setOptions.configOptions);
			}
	    },
		/**
		 * If a templateString is present in the constructor options, then 
		 * + set the _templateString property to that. 
		 * If configOption renderTemplate is true, then call renderTemplate
		 * @return {[type]} [description]
		 */
		_initTemplate: function(){
			if (this._configOptions.debug) console.log('_initTemplate::');
			if (this._configOptions.renderTemplate !== false) {
				var dataObj = this.options.templateDataObject || this.templateDataObject;
				if (this.options && dataObj) {
					if (this._configOptions.debug) console.log('_initTemplate::dataObj', dataObj);
					this.renderTemplate( dataObj );
				}
			}
		},
		/**
		 *  Holding references to subview Items
		 *  @type {[Array]}
		 */
		_initSubviews: function(){
			if(this.options && this.options.subviews) {
				if (this._configOptions.debug) console.log('_initSubviews::', this.options.subviews);
				_.extend(this, {subviews: this.options.subviews} );
				var self = this;
				this.options.subviews.map(function(subviewItem){
					
					console.log('%c subview '+ subviewItem , 'color:#055');

					$(self.$el).append( subviewItem.$el[0] );
				});
			}
		}
        
	});

	return Widget;

});