define(['underscore', 'backbone'], function(_, Backbone){
    //adding subview rendering
    var Widget = Backbone.View.extend({

        _template: null,
        
        _templateDefaults: {
            templateString: '<div></div>',
            templateDataObject: {},
            templateEngine: _
        },
        
        _subviews: null,
        
        _subviewsContainer: function(){
            return this.$el;
        },  // use $(selector) 
        
        _config:null,
        
        _configDefaults: {
            debug: false,
            time: false
        },
        
        _viewOptions:  ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'],
        
        makeConfig: function(){
             var _config = {};
            _.extend(_config, this.options.config || this.config);
            this._config = _.extend( _config, _.omit(this._configDefaults, _.keys(_config)));
            
        },
        
        attachViewOptions: function(){
              var _newViewOptions = this.options.viewOptions || this.viewOptions;
              if(this._config.debug === true) console.log('%c Attempting to attach viewOption', 'color:red', _newViewOptions);
              if(_newViewOptions) {
                  if(this._config.debug === true) console.log('%c attaching')
                  this._viewOptions = _.union(this._viewOptions, _newViewOptions);
              }
              if(this._config.debug === true) console.log('%c Done','color:red', this._viewOptions);
              _.extend(this, _.pick(this.options, this._viewOptions));
        },

        initSubviews: function(){
                var _subviewsContainer = this.options.subviewsContainer || this.subviewsContainer;
                if (_subviewsContainer) this._subviewsContainer = _subviewsContainer;
                var _subviews = this.options.subviews || this.subviews;
                if (_.isArray(_subviews)) this._subviews = _subviews;
        },
        
        renderSubviews: function(){
            if(this._subviews) {
                if(this._config.debug === true) console.log('%c SUBVIEWS:', 'color:green', this._subviews);
                
                    var $subviewContainer = this.$( this._subviewsContainer )
                    $subviewContainer = ($subviewContainer.length) ? $subviewContainer : $subviewContainer.prevObject
                    
                _.map(this._subviews, function(subview){
                    if(this._config.debug === true) console.log('Attaching Subviews',subview, ' to:', $subviewContainer)

                    subview.renderSubviews();
                    $subviewContainer.append( subview.$el );
                    
                }, this);
            }
        },
        
        addSubview: function(subview){
            this._subviews.push(subview);
        },
        
        removeSubview: function(idx){
            if(this._config.debug === true) console.log('Remove Sent from parent ==============>')
            this._subviews[idx].remove();
            this._subviews.splice(idx, 1);
        },
        
        getSubview: function(idx){
            return this._subviews[idx];
        },
        
        initTemplate: function(){
            var _template = {};
            _.extend(_template, this.options.template || this.template);
            this._template = _.extend( _template, _.omit(this._templateDefaults, _.keys(_template)));
            if( _.isEmpty(this._template.templateDataObject) )  {
                if(this.model)  this._template.templateDataObject = this.model.attributes;   
            }
            if(this._config.debug === true) console.log('%c this.options.Template', 'color:blue', this.options.template);
            if(this._config.debug === true) console.log('%c this.template', 'color:blue', this.template);
            if(this._config.debug === true) console.log('%c _template', 'color:blue', _template);
            if(this._config.debug === true) console.log('%c this._template', 'color:blue', this._template);
            this.setTemplate();
            
        },
        /**
         * template method - Interface args [ tmplStr, tmplObj ]
         * uses the attached template string and a new tmpl Obj, either from the Model or a new attributes
         */
        processTemplate: function(dataObj){
            return this._template.templateEngine.template(
                this._template.templateString,
                dataObj || this._template.templateDataObject 
            );
        },
        
        setTemplate: function(dataObj){
            this.setElement( this.processTemplate(dataObj), true );
        },
        
        initialize: function(){
            this.makeConfig();
            if(this._config.time === true) window.console.time(this.cid);
            if(this._config.debug === true) console.log("%c Creating Widget -- options:", 'color:#a34', this.options);
            this.attachViewOptions();
            this.initTemplate();
            this.initSubviews();
            this.renderSubviews();
            if(this._config.debug === true) console.log(this);
            if(this._config.time === true) window.console.timeEnd(this.cid);
            if (this._config.debug === true) console.log('%c Rendering complete:', 'color: #094', this.$el);
            if (this.model) {
                this.listenTo(this.model, 'change', function(){
                    this.handleModelUpdate();
                    if(this._config.debug === true) console.log('Model changed for', this)
                },this)
                this.listenTo(this.model, 'remove', function(){
                    if(this._config.debug === true) console.log('Removing view', this);
                    this.remove();
                }, this)
            }
            this.delegateEvents();
            if ( this.options && this.options.initialize ) this.options.initialize.call(this);
            
        },
        
        // initModelBindings: function(){
        //     if(this.model) this.model.on('change', function(evt){
        //         console.log('MODEL EVENT RECIEVED:',evt);
        //         this.handleUpdate();
        //     }, this);
        // },
        
        /** this will trigger a rerendering of the template  with new attributes
         * args [ model.updatedAttributes  ]
         */
        handleModelUpdate: function(){
            if(this._config.debug === true) console.log('%c Model Update', 'color:green', this.model.changed );
            var HTML = this.processTemplate(this.model.attributes);
            if(this._config.debug === true) console.log('%c Template Updated', 'color:green', HTML);
            this.replaceContent(HTML);
            if(this._config.debug === true) console.log('$EL:', this.$el);
            this.renderSubviews();
            if(this._config.debug === true) console.log('Attached Subviews', this.$el);
            this.render();
            
        },
        
        render: function(add){
            if(this._config.debug === true) console.log('___$ == ',this);
            if (add === true) this.container.append( this.$el )
            else $( this.container ).html( this.$el )
            
        },
        
        renderTo: function(container$el, render){
           this.container =  container$el.length ? container$el : container$el.prevObject ;
           if (render === true) this.render();
        },
        
        replaceContent: function(HTML, delegate){
            if (delegate === true) this.undelegateEvents();
            this.$el.replaceWith(HTML);
            this.setElement(HTML, true);
            if (delegate === true) this.delegateEvents();
            if(this._config.debug === true) console.log('#########', this.$el);
        },
        
        remove: function(){
            if(this._config.debug === true) console.log('removing $EL',this.$el);
            if(this._config.debug === true) console.log('and subviews', this._subviews)
            this._subviews = null;
            Backbone.View.prototype.remove.call(this) // ??
            // this.$el.remove();
        }
        // handleAdd: function(){},
        // 
        // handleRemove: function(){}
        
        
    });
    
    return Widget;
    
});