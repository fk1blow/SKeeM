define([
  'underscore',
  'views/Widget'

], function(_, Widget){
	/**
	 * Custom Module that holds references to utility classes and custom attributes
	 * @type {Object}
	 */
	var InterfaceComponents = {};
		/**
		 * Extend the module with any utility functions from external sources
		 */
	_.extend( InterfaceComponents, {

		TablePanel: Widget.extend({
			templateString: '<table class="<%= table_class %>">',
			templateDataObject: {
				table_class: 'wd-table'
			},
			initialize: function(){
				console.log('Creating new TablePanel elem', this);

			},
			renderTo: function(selector){
				if(selector){
					console.log('Attaching to container', selector );
					selector.append( this.$el );
				}
			},
			addRow: function(){},
			addRowAt: function(){},
			removeRow: function(){},
			updateRow: function(){}
		}),

		TableRow: Widget.extend({
			templateString: '<tr class="<%= table_row_class %>">',
			templateDataObject: {
				table_row_class: 'wd-table-row'
			},
			initialize: function(){
				console.log('Creating new TableRow', this);
			},
			addCell: function(){},
			addCellAt: function(){},
			removeCell: function(){},
			updateCell:function(){}
		}),

		TableCell: Widget.extend({
			templateString: '<td class="<%= table_cell_class %>">',
			templateDataObject: {
				table_cell_class: 'wd-table-cell'
			},
			initialize: function(){
				console.log('Creating new TableCell', this);
			},
			buildCell: function(){},
			modifyCell: function(){}
		})

	});

	return InterfaceComponents;

});