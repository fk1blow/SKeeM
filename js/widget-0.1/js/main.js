/* Widget
 * - Generic base class for all view type objects
 *
 * @object Extends Backbone.View
 */
var Widget = Backbone.View.extend({
    /* @string
     * - The type of view element. Can be a Button, ButtonGroup, ListItem .. etc  
     * - Corresponds to a predefined Constructor object from UI.Components  ***/
        _type: null,
    /* @String
     * - Compiled Template string, used as the markup for the View **/     
        _template: null,
    /* @Object UI.WidgetFactory && UI.Components 
     * - Object containing UI Components and Factory method for creating objects */  
        _UIManager: null,    
    /* @Array
     * - Array object, used to store nested subviews **/
        _subviews: null,
    /*  Initialization logic. */ 
        initialize: function(){
            this._registerOptions();
            this._initTemplate();
            this._initSubviews(this._UIManager);
            
        },
    /* @function 
     * - Composite template object { _$ } is passed to all subviews (appending templates to it) and finally appended to DOM as a composite structure */
        render: function(_$){
            var _$ = _$ || this.$el;
            this.el = this._template;
            this.$el = $(this._template);
            // console.log('Render Template for ', this._type, this.el);
            if( this._delegateToSubviews(this.$el)) { _$.append(this.$el); } 
            else { _$.append(this.$el); }      // append(this._template)
            if (this.events) {
                // console.log('^^^^^^^^EVENTS^^^^^^',this.events, 'Attached on parent View\'s $el', this.$el);
                this.delegateEvents();
            } 
        },
    
    /* @function
     * - Removes $el DOM node for parrent view */
        remove: function(){
            // console.log('Remove delegated from ', this);
            this.off();
            this.$el.off();
            this.undelegateEvents();
            
            for (var i = 0; i < this._subviews.length; i++){
                // this._subviews[i].off();
                this._subviews[i].remove();
            }
            this._subviews.splice(0,this._subviews.length);

            this.$el.remove();
            

            // this.off();
            // this.model.unbind('changed', this.render, this)
            
            delete this.$el;
            delete this.el;
            
        },
    /* @function 
     * - Called uppon initialization. Registeres any functions passed inside [register] property to this instance */
        _registerOptions: function(){
            if (this.options.type) {
// /******/                console.log('<===== this ====>', this);
                this._type = this.options.type;
                if (this.options.register) {
                    for (var prop in this.options.register) {
                        if (prop == 'UIManager') {
                         this._UIManager = this.options.register[prop]; 
                         console.log('Initializing ====>',this._type,' UI manager', this.options.register.UIManager);
                     }
                        else { this[prop] = this.options.register[prop]; }
                    }  
                 }
                 return true;
            } else return false; 
        },    
    /* @function - Underscore Templating Engine
     * - Compiles the template property from the templateString and dataObject provided */
        _compileTemplate: function(templateString, dataObject){



            // TODO 

           var compiled = _.template(templateString);
           this._template = compiled(dataObject);            
        },  
    /* @function 
     * - Overrides default Template if a {template object} is passed when creating instances */
        _initTemplate: function(){
            if(this.options.template && this.options.template.templateString && this.options.template.dataObject) {
                this._compileTemplate( this.options.template.templateString , this.options.template.dataObject);
            }
        },
    /* @function
     * - Creates new View Elements with the specified type from UI.Components or generic Widget */
        _initSubviews: function(pUIM){
            console.log('InitSubviews for ====>',this._type);
    /* Initialize subviews as empty array */
            this._subviews = [];
            
            var subviewItems = this.options.subviews || [];
            for (var i = 0; i < subviewItems.length; i++){

                if ( subviewItems[i].type ) {
    /* Check for a UIManager property passed to the register object as this.options  */
                    if ( subviewItems[i].register && subviewItems[i].register.UIManager) {
                        // console.log('subview manager found. _UIManager = ',subviewItems[i].register.UIManager);
                    } else {
                        // console.log('subview manager not found.. Using parrents _UIManager = ', pUIM);
                        _.extend(subviewItems[i], { register : { UIManager: pUIM}});
                    }
    /* Create subwidget based on the type if found by WidgetFactory method of the UIManager object */
                    if (subviewItems[i].type in this._UIManager.Components) {
                        // console.log('-$-$-$-$- Object type found in factory: Creating new ', subviewItems[i].type);
 // /***/                       console.log('{{{{{{ +_+_+_+_+_+_+_+_+_+_+ }}}}}}', subviewItems[i]);
                        this._subviews.push(this._UIManager.WidgetFactory(subviewItems[i].type, subviewItems[i]));
                    } else {        
                            // console.log('Object type not in factory, creating Generic Widget:', subviewItems[i].type);
                            this._subviews.push(new Widget(subviewItems[i]));
                    }
                }
            }
        },
    /* @function 
     * - Delegates the render method to all the children subviews  */
        _delegateToSubviews: function( _$){
            if(this._subviews.length) {
                for (var i = 0; i < this._subviews.length; i++) {
                    this._subviews[i].render( _$);
                }
                return true; 
            } 
            else { return false; }
            
        }

});


/* Create widgets with ease, using the following structure
var myWidget = new Widget({
    el: $(''),
    name: '',
    type: '',
    template:{
        templateString:'',
        dataObject:{}
    },
    subviews:[]
});
*/

/* -------->  GUI Components Constructors <---------- */
var UI = {};

/* @function Factory */
/* Creates new component of specified type, passing arguments to constructor */
UI.WidgetFactory = function(type, args){
    return new UI.Components[type](args);    
};

UI.Components = {};

UI.Components.Label = Widget.extend({
    _template: 'Default text label',

});

UI.Components.Container = Widget.extend({
    _template: '<div id="container" >',

});

UI.Components.Panel = Widget.extend({
    _template: '<div id="panel" >',

});
///////    ----------> END Components Constructors <-----------   ///////

var UI2 = {};

UI2.WidgetFactory = function(type, args){
    return new UI2.Components[type](args);
}

UI2.Components = {};

UI2.Components.Label = Widget.extend({
    _template: '<b>Default text label2</b>',

});



function createTestWidget(){

// console.log(UI);
var testWidget = new Widget({
    el: $('#display_wrapper'),
    type:'Panel',
     events: {
            "click #del": function(evt){
                var x = $(evt.currentTarget);
                // this.remove();
                console.log('Event initiated by' ,x);
            }
        },
    register:{ 
        UIManager: UI
    },
    template:{
        templateString:'<div id="panel">',
        dataObject:{}
    },
    // // subviews:[{}]
    subviews:[
        { 
            type:'Containerr',
            template: {
                 templateString:'<div id="container"> ',
                 dataObject:{}
            },
            el: $('#panel'),
            events: {
                "click #del2" : function(){
                        alert('Clicked Fake');
                }
            },
            register:{ 
                name: 'txtlabel',
                UIManager: UI2

            },
            subviews:[
                {
                    type:'Label',

                    template: {
                        templateString: '<b> this is my </b> <span> LABEL </span>',
                        dataObject: {}
                    },
                    subviews: [{},{}]
                },
                {
                    type:'Label',
                    //                     events: {
                    //     "click #the_label": function(){
                    //         console.log('Tapped the Label');
                    //     }
                    // },
                    template: {
                        templateString: '<div id="the_label" ><button id="del2"> fake Delete </button><button id="del"> Delete </button></div>',
                        dataObject: {}
                    },
                    subviews: [{},{},{}]
                }
            ]
        }
    ]
});

return testWidget;
}


function createiosTestWidget(args){

    var testWidget = Backbone.View.extend({
        el:$('#display_wrapper'),
        render: function(text){
            this.$el.append(text);
        },
        initialize: function(){
            console.log('View initialized');
            this.render();
        },
        createSubview: function(subV){
            
            this.$el.append(subV);
        }
    });

    return new testWidget(args);
}

   ////////////////////////////////////////////////////////////////////////////////////////



var Registry = function(){};

Registry.prototype = {
    init:function(){
        this._subscribers = [];
    },

    add:function(subscriber){
        if(this._subscribers.indexOf(subscriber) >= 0){
            // Already registered so bail out
            return;
        }
        this._subscribers.push(subscriber);
    },

    remove:function(subscriber){
        if(this._subscribers.indexOf(subscriber) < 0){
            // Not currently registered so bail out
            return;
        }
              this._subscribers.splice(
                  this._subscribers.indexOf(subscriber), 1
              );
    }
};

var Leaker = function(){};
Leaker.prototype = {
    init:function(name, parent, registry){
        this._name = name;
        this._registry = registry;
        this._parent = parent;
        this._child = null;
        this.createChildren();
        this.registerCallback();
    },

    createChildren:function(){
        if(this._parent !== null){
            // Only create child if this is the root
            return;
        }
        this._child = new Leaker();
        this._child.init("leaker 2", this, this._registry);
    },

    registerCallback:function(){
        this._registry.add(this);
    },

    destroy: function(){
        if(this._child !== null){
            this._child.destroy();            
        }
        this._registry.remove(this);
    }
};


var leak;


function test() {
/****************************** TEST FUNCTION ************************************/
    /* @number n
     * - How many times to repeat the function */
    var n =  1;

    var startTime = new Date().getTime() / 1000 ;

/* Before Test */
// init

    for (var i = 0; i < n; i++){
    /* @function to test */        

        /////////////
    } // end For loop
    $('#display_wrapper').html($('<button id="start"> Create </button> <br> <button id="del"> Delete </button>'));
    
    function handleRemove(){

        leak.remove();
        leak.off();
        leak = null;
    }

    $('#start').click(function(){
    

        var leakExists = !(
            window["leak"] === null || window["leak"] === undefined
        );
        
        if(leakExists){
           console.log('cant create new leak view');
            return;
        }
        
        leak = createTestWidget();
        leak.undelegateEvents();
        leak.render();


        // console.log();

    });

    $('#del').click(function(){
       handleRemove();
    });

// registry = new Registry();
// registry.init();

// clear
/* After Test */

    var endTime = new Date().getTime() / 1000 ;
    var elapsed = endTime - startTime;

    console.log(elapsed + ' seconds passed !');
    /* return total time passed for n calls to the function */
//////////////////////////////////// end testing ////////////////////////////////////
}
test();
