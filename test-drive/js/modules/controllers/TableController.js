define([
 'underscore', 
 'backbone',
 'views/ui',
 'utils/buildOptions'

], function(_, Backbone, UI, buildOptions){
	/**
	 * Controller Object responsible for View construction and application event flow
	 * @type {[Object]}
	 */
	var TableController = _.extend( {}, Backbone.Events );
	/**
	 * Define application logic here, by extending the Controller
	 */
	_.extend( TableController, {
		views: {
			tablePanel: function(){
				var tablePanel;
				return tablePanel;
			},
			tableRow: function(){
				var tableRow;
				return tableRow;
			},
			redTableCell: function(){
				var redTableCell;
				return redTableCell;
			},
			yellowTableCell: function(){
				var yellowTableCell;
				return yellowTableCell;
			},
			greenTableCell: function(){
				var greenTableCell;
				return greenTableCell;
			}
		},
		/**
		 * Function called immediately after App Initialize 
		 */
		start: function(){
			/**
			 * [ First Page Load ]
			 */
			this.on('on:InitialLoad', function(){
				console.log('Controller:: on:InitialLoad');
				this.onInitialLoad();
			}, this);

			/**
			 *  [ Controller update Request ]
			 */
			this.on('on:UpdateContent', function(jsonData){
				console.log('Controller:: on:UpdateContent');
				console.log('DATA', jsonData);
				this.onUpdateContent(jsonData);
			});

		},

		onInitialLoad: function(){

			this.views.redTableCell = new UI.TableCell({
				setOptions: buildOptions.defaultsOptions.WidgetOptions.setOptions,
				marker:223344
				// templateDataObject: {
				// 	table_cell_class: 'wd-table-red-cell'
				// }
			});

			this.views.yellowTableCell = new UI.TableCell({
				setOptions: buildOptions.defaultsOptions.WidgetOptions.setOptions,
				marker:654321
				// templateDataObject: {
				// 	table_cell_class: 'wd-table-yellow-cell'
				// }
			});

			this.views.greenTableCell = new UI.TableCell({
				setOptions: buildOptions.defaultsOptions.WidgetOptions.setOptions,
				marker:123456
				// templateDataObject: {
				// 	table_cell_class: 'wd-table-green-cell'
				// }
			});

			this.views.tableRow = new UI.TableRow({
				setOptions: buildOptions.defaultsOptions.WidgetOptions.setOptions,
				subviews: [
					this.views.redTableCell,
					this.views.yellowTableCell,
					this.views.greenTableCell
				]
			});

			this.views.tablePanel = new UI.TablePanel({
				setOptions: buildOptions.defaultsOptions.WidgetOptions.setOptions,
				// containerEl: $('#display_wrapper'),
				subviews: [
					this.views.tableRow
				]
			});


			$('body').append( $('<div id="display_wrapper"></div>') );
			
			this.views.tablePanel.renderTo(  $('#display_wrapper')  );


		},

		onUpdateContent: function(jsonData){
			console.log('Controller:: Recieved Update Content data', arguments[0] );
			var self = this;
			
			jsonData.viewData.map(function( data ){
				for (view in self.views){
					if ( self.views[view].marker && self.views[view].marker == data.marker ){
						self.views[view].updateTemplate(data);
					}
				}
			});


			// this.views.greenTableCell.updateTemplate({
			// 		table_cell_class: 'wd-table-green-cell'
			// });

  			// this.views.tablePanel.renderTo(  $('#display_wrapper')  );
			// this.views.tableRow.renderTo( this.views.tablePanel.$el );
		},

		onRefresh: function(){},

		onBlock: function(){},

		onClose: function(){}

	});



	return TableController;

});