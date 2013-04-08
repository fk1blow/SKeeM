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
  'skm/rtf/WSConnector',
  'skm/rtf/MessagesHandler'],
  function(SKMObject, SKMLogger, Subscribable, WSWrapper, XHRWrapper,
           ConnectorManager, XHRConnector, WSConnector, MessagesHandler)
{
'use strict';


var Logger = SKMLogger.create();


var Config = {
  sequence: ['WebSocket', 'XHR'],

  urls: {
    ws: 'ws://localhost:8080/testws',
    xhr: 'http://localhost:8080/testajax'
  },

  wsReconnectAttempts: 3
};


var ChannelsList = {
  _currentList: null,

  _confirmedList: null,
  
  addChannel: function(channel) {
    var list = this._currentList = this._currentList || {},
        channelItem, paramItem,
        channelParams = channel['params'],
        channelName = channel['name'];

    if ( channelName in list ) {
      channelItem = list[channelName];
    } else {
      channelItem = list[channelName] = {};
    }
    // ...and add channel parameters, if any
    for ( paramItem in channelParams ) {
      channelItem[paramItem] = channelParams[paramItem];
    }
  }, 

  // Remove subscription from channel list and removes
  // the item from [_confirmedList] as well
  removeChannel: function(name) {
    var subscription = null;
    if ( name in this._currentList ) {
      delete this._currentList[name];
    }
  },

  confirmSubscription: function(channelName, willConfirm) {
    var confirmed = this._confirmedList = this._confirmedList || {};
    var list = this._currentList;

    if ( channelName in list && willConfirm ) {
      confirmed[channelName] = list[channelName];
      delete list[channelName];
    }
  },

  hasSubscribedAndConfirmed: function(name) {
    var list = this._currentList;
    var hasSubscribed = false;

    if ( list ) {
      hasSubscribed = (name in list);
    }
    return hasSubscribed;
  },

  parameterizeForXHR: function() {
    var parameterized = JSON.stringify(this._currentList).replace(/\'|\"/g, '');
    return parameterized;
  },

  parameterizeForWS : function() {
    var item, first = true, parameterized = 'subscribe:{';
    var list = this._currentList;
    for ( item in list ) {
      if (!first) {
        parameterized+= ',';
      }
      parameterized += item;
      first = false;
    }
    parameterized += '}';
    parameterized += 'params:' + this.parameterizeForXHR();
    return parameterized;
  }
};


var UrlModel = SKMObject.extend(Subscribable, {
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


// main API constructor
var RTFApi = SKMObject.extend(Subscribable, MessagesHandler, {
  _batchId: 0,

  _connectorsUrlModel: null,

  _connectorsManager: null,

  _messagesHandler: null,

  initialize: function(options) {
    Logger.debug('%cnew RTFApi', 'color:#A2A2A2');
    // Create the parameters list object
    this._connectorsUrlModel = UrlModel.create();
    // Prepare batchId and add it to the parameterizer
    this._connectorsUrlModel.add('batchId', this._batchId);
    // creates the connector manager
    this._createConnectorManager();
    // attaches connector handlers
    this._attachConnectorManagerHandlers();
  },

  startUpdates: function(initialChannels) {
    // if no channelList sent, hit them with an error
    if ( !initialChannels || typeof initialChannels !== 'object' ) {
      throw new TypeError('RTFApi.startUpdates :: unable to start updates'
        + ' without a subscription list');
    }
    // Add every channel in list to the ChannelList collection object
    for ( var channel in initialChannels ) {
      ChannelsList.addChannel(initialChannels[channel]);
    }
    // Start the connectors, if any available
    this._connectorsManager.startConnectors({
      updateWrapperDelegate: ChannelsList
    });
  },

  addChannel: function(name, optParams) {
    var connector = null;
    var resubscribeMessage = 'Channel "' + name + '" already subscribed.'
      + ' Unsubscribe then subscribe again.';

    if ( ChannelsList.hasSubscribedAndConfirmed(name) ) {
      Logger.error(resubscribeMessage);
    } else {
      // get active connector
      connector = this._connectorsManager.getActiveConnector();
      // Added to the connector url model
      this._connectorsUrlModel.add('subscribe', name);
      // Add subscription
      ChannelsList.addSubscription(name, optParams);
      // send a different message for every connector type
      if ( connector.getType() == 'WebSocket' ) {
        connector.sendMessage(ChannelsList.parameterizeForWS());
      } else if ( connector.getType() == 'XHR' ) {
        connector.sendMessage(ChannelsList.parameterizeForXHR());
      }
    }
  },
  
  // @todo implement feature
  removeChannel: function(name) {
    cl(this._connectorsUrlModel)
    // it shouldn't fire, instead, it should(somehow) remove 
    // the channel from ChannelsList collection
    // this.fire('removed:subscription', name);
    // this._connectorsUrlModel.alter(name, );
  },

  getChannelsList: function() {
    return ChannelsList;
  },


  /*
    Commands
   */
  

  stopUpdates: function() {
    this._connectorsManager.stopConnectors();
  },

  switchToNextConnector: function() {
    this._connectorsManager.switchToNextConnector();
  },

  addUrlParameter: function(name, value) {
    this._connectorsUrlModel.add(name, value);
    return this;
  },

  sendMessage: function(message) {
    this._connectorsManager.sendMessage(message);
  },


  /*
    Handlers
   */
  

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
    this._connectorsUrlModel.reset('subscribe');
  },

  // @todo subscribe doesn't resides on the connectorUrlsModel
  // instead, remove it from the ChannelsList
  // Actually, it doesn't need to remove the channel name because it will be confirmed
  // and remove from the [ChannelsList._currentList] collection
  /*handleAfterStartConnector: function() {
    this._connectorsUrlModel.remove('subscribe');
  },*/

  // @todo add handler from ChannelsHandler
  handleMbeanMessage: function(message) {
    Logger.debug('%cApiHandlersDelegate.handleMbeanMessage',
      'color:red', message);
  },

  handleUpdateBatchId: function(batchId) {
    Logger.debug('RTFApi.handleUpdateBatchId', batchId);
    this._connectorsUrlModel.alter('batchId', batchId);
    // Dude, you must set the current object property too, so when you'll
    // try to reconnect you must have last batchId, not 0!! - Thanks, dude!
    this._batchId = batchId;
    // this.sendMessage('batchId:{' + batchId + '}');
    this.sendMessage('batchId:{' + batchId + '}');
  },


  // - adauga urmatoarele linii, in documentatie:
  // - daca am primit confirmarea unei subscriptii, nu fac nimic
  // - daca nu se primeste, atunci widgetul poate presupune ca a survenit o eroare

  // @todo handle confirmation and batch id different for every connector type
  // If current connector is XHR, prepare both batchID and
  // Reconfirmation messages, before sendinf them using [sendMessage]



  /*
    Privates
   */

 
  _createConnectorManager: function() {
    var manager = this._connectorsManager = ConnectorManager.create({
      sequence: Config.sequence
    });

    manager.registerConnector('WebSocket', WSConnector.create({
      urlBase: Config.urls.ws,
      urlParamModel: this._connectorsUrlModel
    })).addTransport(WSWrapper.create({
      reconnectAttempts: Config.wsReconnectAttempts,
      pingServer: true
    }));

    manager.registerConnector('XHR', XHRConnector.create({
      urlBase: Config.urls.xhr,
      urlParamModel: this._connectorsUrlModel
    })).addTransport(XHRWrapper.create());
  },

  _attachConnectorManagerHandlers: function() {
    // Handle when manager has been deactivated - next/sequence switch
    // or transport issues - issues handled by the manager
    this._connectorsManager.on('connector:deactivated',
      this.handleConnectorDeactivated, this);

    // reset subscriptions before next sequence begins
    this._connectorsManager.on('before:nextSequence',
      this.handleBeforeNextSequence, this);

    // remove subscribtions after every connector has began update
    this._connectorsManager.on('after:startConnector',
      this.handleAfterStartConnector, this);

    // handle the raw incoming message
    this._connectorsManager.on('update', this.handleMessage, this);
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