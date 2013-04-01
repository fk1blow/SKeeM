define([
  'jquery', 
  'underscore', 
  'backbone',
  'controllers/TableController',
  'observers/RequestObserver',
  'modules/utils/jsonDataProvider'

], function($, _, Backbone, TableController, RequestObserver, jsonDataProvider){
  /**
   * Main Application File Module
   * Store Components inside this object for global refs handles
   * @type {[type]}
   */
  var App = {};

    _.extend ( App, {
      /**
       * Application Entry point. It is called the first time DOM finishes loading
       * @return {[function]} 
       */
      initialize: function(){

        console.log('App::initialize', this);
        var self = this;
        /**
         *   Start Drawing Application
         */
        this.controller.start();
        this.controller.trigger('on:InitialLoad');

        /**
         *   Listen to server Requests and respond accordingly
         */
        this.controller.listenTo( this.communicationObserver, 'on:UpdateData', function(jsonData){
                var self = this;
                //// SET TIMEOUT TO PREFEVENT FAST DELEGATION
                // setTimeout(function(){
                    //  Server Sends new json -->  Views must update their data
                    self.trigger('on:UpdateContent', jsonData);
                // }, 0);          
        }, this);
     
        /**
         *   Set a timeout for a page update
         */
         setTimeout(function(){
         
            var data = jsonDataProvider.getData();
            console.log('Controller:: Aquired Update Data');

            self.communicationObserver.trigger(
              'on:UpdateData', 
               data
            );
         
         }, 3000);



        return this;

      },

      controller: TableController,
      communicationObserver: RequestObserver,
      dataProvider: jsonDataProvider

      // CustomModule: MyModule

    });


  return App;
});