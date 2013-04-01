/*

1 Subscription / Channels
-----------------------

# 1.1 Adding

  - if a subscription was added, the server api will respond with
  either a confirmation message, telling that a subscription was added,
  or by triggering a [message:error], meaning that something went wrong.

  - A "message:error" event is triggered when:
      1. the subscription name is incorrect
      2. the subscription params are incorrect

  - Basically, the widget client can assume that a subscription has been
  successfully registered as long as it doesn't receive an error



# 1.2 Updating / altering 
  
  - on handleBeforeNextSequence
  - on handleAfterStartConnector



 */

// RTF Api Manager implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable',
  'skm/net/WSWrapper',
  'skm/net/XHRWrapper',
  'skm/rtf/ConnectorManager',
  'skm/rtf/XHRConnector',
  'skm/rtf/WSConnector'],
  function(SKMObject, SKMLogger, Subscribable, WSWrapper, XHRWrapper,
           ConnectorManager, XHRConnector, WSConnector)
{
'use strict';


var Logger = SKMLogger.create();


/*
  Config - urls, connector sequence, etc
 */


var Config = {
  sequence: ['WebSocket', 'XHR'],

  urls: {
    ws: 'ws://localhost:8080/testws',
    xhr: 'http://localhost:8080/testajax'
  },

  wsReconnectAttempts: 3
};


var ParamsModel = SKMObject.extend(Subscribable, {
  _parameterizerList: null,

  getList: function() {
    this._parameterizerList = this._parameterizerList || {};
    return this._parameterizerList;
  },

  getByName: function(name) {
    return this._parameterizerList[name];
  },

  toUrl: function() {
    var list = this._parameterizerList;
    return encodeURIComponent(JSON.stringify(list).toString());
  },

  toQueryString: function(concatStr) {
    var i = 0, qs = '', part, segment, params = this.getList();
    var concatWith = concatStr || '&';
    for ( part in params ) {
      i = 0, segment = params[part];
      // If at first part
      if ( qs.length < 1 ) {
        qs += '?';
      } else {
        qs += concatWith;
      }
      // for each part, there will be a segment array
      for ( ; i < segment.length; i++ ) {
        if ( i > 0 )
          qs += concatWith;
        qs += (part + '=' + segment[i]);
      }
    }
    return qs;
  },

  reset: function(name, value) {
    if ( name in this.getList() )
      delete this._parameterizerList[name];
    return this;
  },

  add: function(name, value) {
    var list = this.getList();
    if ( list[name] ) {
      list[name].push(value);
    } else {
      list[name] = [value];
    }
    this.fire('added');
    return this;
  },

  addByKeyAndValue: function(paramObject) {},

  remove: function(name) {
    var list = this.getList();
    if ( name in list )
      delete list[name];
    this.fire('removed');
    return this;
  },

  alter: function(name, newValue) {
    var param, list = this.getList();
    if ( param = list[name] ) {
      list[name] = [newValue];
    }
    this.fire('altered');
    return this;
  }
});


/**
 * RTFApi handlers delegate
 */
var ApiHandlersDelegate = {
  handleMessageObservers: function(dataObj) {
    var itemKey = null, i = 0, len = dataObj.length,
      messageUpdateItem, itemVal = null;
    
    // for every item in the update/reconfirmation array
    for ( i = 0; i < len; i++ ) {
      messageUpdateItem = dataObj[i];

      // each message update object key - subscription/MBEAN/error
      for ( itemKey in messageUpdateItem ) {
        // the value of the current itemKey
        itemVal = messageUpdateItem[itemKey];

        // If the subscription is incorrect, assume it will trigger an error
        /*if ( itemKey == 'subscription' )
          this.handleSubscriptionConfirmation(itemVal);
        else if ( itemKey == 'MBEAN' )*/
        if ( itemKey == 'MBEAN' )
          this.handleMbeanMessage(itemVal);
        // Add test case
        else if ( itemKey == 'error' )
          this.fire('message:error', itemVal);
        else
          this.fire('message:' + itemKey, itemVal);
      }
    }
  },

  handleMessage: function(data) {
    if ( 'update' in data ) {
      Logger.debug('ApiHandlersDelegate.handleMessage, update', data);
      this.handleMessageObservers(data['update']);
      this.handleUpdateBatchId(data['batchId']);
    }
    else if ( 'reconfirmation' in data ) {
      Logger.debug('ApiHandlersDelegate.handleMessage, reconfirmation', data);
      this.handleMessageObservers(data['reconfirmation']); 
      this.handleUpdateBatchId(data['batchId']);
    }
    else if ( 'noupdates' in data ) {
      Logger.debug('ApiHandlersDelegate.handleNoUpdates, batchId ', this._batchId);
      // Just send the same batchId, over and over again
      this.handleUpdateBatchId(this._batchId);
    }
    else {
      Logger.error('ApiHandlersDelegate.handleMessage, invalid data ', data);
    }
  },

  // If the subscription is incorrect, assume it will trigger an error
  handleSubscriptionConfirmation: function(listObj) {
    /*var subscription = null, subscriptionIdx = undefined;
    Logger.debug('ApiHandlersDelegate.handleSubscriptionConfirmation');

    // For each subscription in the confirmation object
    // remove the one found at index - mutate the [_subscriptions] array
    for ( subscription in listObj ) {
      subscriptionIdx = this._subscriptions.indexOf(subscription);
      if ( subscriptionIdx >= 0 ) {
        Logger.debug('%cSubscription confirmed :: ', 'color:red', subscription);
        this._subscriptions.splice(subscriptionIdx, 1);
      }
    }*/
  },

  handleMbeanMessage: function(message) {
    Logger.debug('%cApiHandlersDelegate.handleMbeanMessage',
      'color:red', message);
  },

  handleUpdateBatchId: function(batchId) {
    this._paramList.alter('batchId', batchId);
    // Dude, you must set the current object property too, so when you'll
    // try to reconnect you must have last batchId, not 0!!
    // Thanks, dude!
    this._batchId = batchId;
    this.sendMessage('batchId{' + batchId + '}');
  },

  /**
   * Handles a connector's protocol or api error
   * 
   * @description Event triggered whenever the (server)api/protocols
   * has an issue with the current connection and its parameters.
   * EX: batchId is wrong, the server might trigger api:error and
   * the widget subscribed, might want to resubscribe
   * 
   * @todo Usually, the subscriptions will have to be notified of this error!
   */
  handleConnectorProtocolsApiError: function() {
    Logger.warn('%cApiHandlersDelegate.handleApiProtocolsError '
      + 'An api or protocol error has been triggered', 'color:red');
  },

  /**
   * Handles when a connector has been deactivated
   * 
   * @description Usually, this means the transport could not be
   * initialized or has tried to reconnect unsuccesfully
   * For the time being, just log the event
   */
  handleConnectorDeactivated: function() {
    Logger.debug('%cApiHandlersDelegate.handleConnectorDeactivated', 'color:red');
  },

  handleBeforeNextSequence: function() {
    this._paramList.reset('subscribe');
    
    // Re-add the subscriptions to the params list
    /*rtfSubscriptionList.eachSubscription(function(subscription) {
      this._paramList.add('subscribe', subscription.name);
    });*/
    

    // Rebuild using another object that deals with subscribed channels and shit...
    /*var subscribedChannel;

    for ( subscribedChannel in this._subscribedChannels ) {
      this._paramList.add('subscribe', )
    }*/
  },

  handleAfterStartConnector: function() {
    this._paramList.remove('subscribe');
  }
};


/**
 * API constructor
 */
var RTFApi = SKMObject.extend(ApiHandlersDelegate, Subscribable, {
  _batchId: 0,

  _paramList: null,

  _connectorManager: null,

  _subscribedChannels: null,

  // If the subscription is incorrect, assume it will trigger an error
  /*_subscriptions: null,*/

  initialize: function() {
    Logger.debug('%cnew RTFApi', 'color:#A2A2A2');

    // Create the parameters list object
    this._paramList = ParamsModel.create();
    
    // Prepare batchId and add it to the parameterizer
    this._paramList.add('batchId', this._batchId);
    
    // creates the connector manager
    this._createConnectorManager();

    // attaches connector handlers
    this._attachConnectorManagerHandlers();

    this._subscribedChannels = {};
  },

  startUpdates: function() {
    // Start the connectors, if any available.
    this._connectorManager.startConnectors();
  },

  stopUpdates: function() {
    this._connectorManager.stopConnectors();
  },

  switchToNextConnector: function() {
    this._connectorManager.switchToNextConnector();
  },

  addUrlParameter: function(name, value) {
    this._paramList.add(name, value);
    return this;
  },

  sendMessage: function(message) {
    this._connectorManager.sendMessage(message);
  },

  /**
   * Adds a new subscription
   *
   * @todo Break this functionality outside the Rtf Api
   * @description Adds a new channel listeners and adds
   * the 'subscribe' to [_paramList]
   */
  subscribeToChannel: function(name, optParams) {
    var connectorType, message = '';//'subscribe:{' + name + '}';
    var connector = this._connectorManager.getActiveConnector();
    var messageParamsObj = {};

    // Add it to the this._paramList
    this._paramList.add('subscribe', name);

    this._addParamsForSubscription(name, optParams);

    // functioneaza si fara a verifica daca exista optParams
    if ( connector && optParams ) {
      // connectorType = 'XHR';
      connectorType = connector.getType();
      
      message = 'subscribe:{' + name + '}';
      messageParamsObj[name] = this._subscribedChannels[name];

      if ( connectorType == 'WS' ) {
          message += 'params:' + JSON.stringify(messageParamsObj)
                                     .replace(/\"|\'/g, '');
      }
      else if ( connectorType == 'XHR' ) {
        message = messageParamsObj;
      }

      cl(message)
    }


    // this.sendMessage(message);

    // if params are sent, concatenate to message string
    /*if ( optParams ) {
      var  newParams = {};
      newParams[name] = optParams;

      var strParams = JSON.stringify(newParams).replace(/\"|\'/g, '');
      this.sendMessage({ params: strParams });
    } else {
      this.sendMessage({ message: message });
    }*/

    // cl(this._subscribedChannels)

    // Tell the connector to notify server api
    // this.sendMessage(message, { params: optParams });
  },

  _addParamsForSubscription: function(name, params) {
    var channel, channelList = this._subscribedChannels,
        item, paramsList = params || {};
    // Now compose the subscribed list
    if ( name in channelList ) {
      channel = channelList[name];
    } else {
      channel = channelList[name] = {};
    }
    // ...and add channel parameters, if any
    for ( item in paramsList ) {
      channel[item] = paramsList[item];
    }
  },






  xxx_subscribeToChannel: function(name, optParams) {
    var message = 'subscribe{' + name + '}';

    // Add it to the this._paramList
    this._paramList.add('subscribe', name);

    // if params are sent, concatenate to message string
    if ( optParams ) {
      var  newParams = {};
      newParams[name] = optParams;

      var strParams = JSON.stringify(newParams).replace(/\"|\'/g, '');
      // this._connectorManager += ('params{' + name + ':{' + strParams + '}');
      this.sendMessage({ params: strParams });
    } else {
      this.sendMessage({ message: message });
    }

    // Tell the connector to notify server api
    this.sendMessage(message, { params: optParams });
  },

  /**
   * Removes a subscription
   *
   * @todo Should this method send a message back to the server
   * notifying it that a subscription has been removed ?!?!?!?
   */
  unsubscribeFromChannel: function(name) {
    this._paramList.remove('subscribe');
  },


  /*
    Privates
   */
  

  _createConnectorManager: function() {
    var manager = this._connectorManager = ConnectorManager.create({
      sequence: Config.sequence
    });

    manager.registerConnector('WebSocket', WSConnector.create({
      urlBase: Config.urls.ws,
      urlParamModel: this._paramList
    })).addTransport(WSWrapper.create({
      reconnectAttempts: Config.wsReconnectAttempts,
      pingServer: true
    }));

    manager.registerConnector('XHR', XHRConnector.create({
      urlBase: Config.urls.xhr,
      urlParamModel: this._paramList
    })).addTransport(XHRWrapper.create());
  },

  _attachConnectorManagerHandlers: function() {
    // Resends a confirmation back to server api
    this._connectorManager.on('update', this.handleMessage, this);

    // Handle when manager has stopped - something wrong happened
    this._connectorManager.on('protocols:error api:error',
      this.handleConnectorProtocolsApiError, this);

    // Handle when manager has been deactivated - next/sequence switch
    // or transport issues - issues handled by the manager
    this._connectorManager.on('connector:deactivated',
      this.handleConnectorDeactivated, this);

    // re-add subscriptions to the param list before connector began update
    this._connectorManager.on('before:nextSequence',
      this.handleBeforeNextSequence, this);

    // remove subscribtions after every connector has began update
    this._connectorManager.on('after:startConnector',
      this.handleAfterStartConnector, this);
  },

  _getIncrementedBatchId: function() {
    var bid = this._batchId++
    return bid;
  }
});


return {
  Config: Config,

  Api: (function() {
    var instance = null;

    return {
      get: function() {
        if ( instance == null ) {
          instance = RTFApi.create();
        }
        return instance;
      }
    }
  }())
};


});