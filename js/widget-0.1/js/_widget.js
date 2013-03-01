/* Widget
 * - Generic base class for all view type objects
 *
 * @object Extends Backbone.View
 */
var Widget = Backbone.View.extend({
        
        _subviews: null,
    
        _initSubviews: function(){
//if (this.options.subviews) console.log('0-----> Initialize subviews:', this.options.subviews );
            var subviewItems = this.options.subviews || [];
            for (var i = 0; i < subviewItems.length; i++){
//console.log('1------> Inner subview:', subviewItems[i]);
                this._subviews.push(new Widget(subviewItems[i]));
            }
        },
    
        _delegateToSubviews: function(){},
    
        initialize: function(){
            this._subviews = [];
            this._initSubviews();
//console.log('2---------> Finished subview Initialize. _subviews:',this.options.type, this._subviews);
        },
    
        render: function(){},
    
        remove: function(){}
});

var 

var myWidget = new Widget({
        type: ul,
        name: 'my_list',
        subviews:[
            {
            type: li,
            name: 'first_item',
            subviews: [
                {
                    type:Text
                }                
            ]   
            },
            {
            type: li,
            name: 'first_item',
            subviews: [
                {
                    type:Text
                }                
            ]   
            }             
        ]
});

//console.log(myWidget);
