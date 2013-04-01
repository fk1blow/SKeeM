define([
  'underscore'

], function(_){
	/**
	 * Custom Module that holds references to utility classes and custom attributes
	 * @type {Object}
	 */
	var jsonDataObject = {};
	/**
	 * Extend the module with any utility functions from external sources
	 */
	_.extend( jsonDataObject, {

		getData: function(){
			return this._data;
		},
		setData: function(data){
			this._data = data;
		},

		updateData: function(newData){
			_.extend( this._data, newData );
		},

		flushData: function(){
			this._data = null;
		},

		_data: {
			viewData: [
				{
					marker: 123456,
					table_cell_class: 'wd-table-green-cell',
					content: 'celula verde'
				},
				{
					marker: 654321,
					table_cell_class: 'wd-table-yellow-cell',
					content: 'celula galbena'
				},
				{
					marker: 223344,
					table_cell_class: 'wd-table-red-cell',
					content: 'celula rosie'
				}

			],
			serverMessage: [],
			loopback: null
		}

	});

	return jsonDataObject;

});