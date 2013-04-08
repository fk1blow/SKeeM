
// RTF Messages handler

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable'],
  function(SKMObject, SKMLogger, Subscribable)
  {
'use strict';


var Logger = SKMLogger.create();


var ChannelsList = {
  _currentList: null,

  _confirmedList: null,

  addSubscription: function(name, params) {
    this._currentList = this._currentList || {};
    var channel, item, paramsList = params || {};
    var list = this._currentList;

    // if channel already added
    if ( name in list ) {
      channel = list[name];
    } else {
      channel = list[name] = {};
    }

    // ...and add channel parameters, if any
    for ( item in paramsList ) {
      channel[item] = paramsList[item];
    }
  },

  // Remove subscription from channel list and removes
  // the item from [_confirmedList] as well
  removeSubscription: function(name) {
    var subscription = null;
    if ( name in this._currentList ) {
      delete this._currentList[name];
    }
  },

  confirmSubscription: function(name) {
    var list = this._currentList;
    this._confirmedList = this._confirmedList || [];
    // if ( name in list )
    //   this._confirmedList.push(name);
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


var MessagesHandler = SKMObject.extend(Subscribable, {
  channelsList: ChannelsList,

  // the instance of connector manager
  sourceOfMessages: null,

  initialize: function() {
    // Resends a confirmation back to server api
    this.sourceOfMessages.on('update', this.handleMessage, this);
    // Handle when manager has stopped - something wrong happened
    this.sourceOfMessages.on('api:error', this.handleApiError, this);
  },

  /*subscribeTo: function(name, optParams) {
    var connector = null;
    var resubscribeMessage = 'Channel "' + name + '" already subscribed.'
      + ' Unsubscribe then subscribe again.';

    if ( this.channelsList.hasSubscribedAndConfirmed(name) ) {
      Logger.error(resubscribeMessage);
    } else {
      // get active connector
      connector = this.sourceOfMessages.getActiveConnector();

      // Added to the connector url model
      // this._connectorsUrlModel.add('subscribe', name);
      this.fire('added:subscription', name);

      // Add subscription
      this.channelsList.addSubscription(name, optParams);

      if ( connector.getType() == 'WebSocket' ) {
        connector.sendMessage(this.channelsList.parameterizeForWS());
      } else if ( connector.getType() == 'XHR' ) {
        connector.sendMessage(this.channelsList.parameterizeForXHR());
      }
    }
  },*/

  // @todo implement method
  /*unsubscribeFrom: function(name) {
    this.fire('removed:subscription', name);
    // this._connectorsUrlModel.remove('subscribe');
  },*/


  /*
    Handlers
   */


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
        if ( itemKey == 'subscription' )
          this.handleSubscriptionConfirmation(itemVal);
        else if ( itemKey == 'MBEAN' )
          this.fire('message:mbean', itemVal);
        else if ( itemKey == 'error' )
          this.fire('error:' + itemKey, itemVal);
        else
          // or this.fire('message:' .......
          this.fire('update:' + itemKey, itemVal);
      }
    }
  },

  handleMessage: function(data) {
    if ( 'update' in data ) {
      Logger.debug('SubscriptionsHandler.handleMessage, update', data);
      this.handleMessageObservers(data['update']);
      // this.handleUpdate Id(data['chId']);
      this.fire('update:batchId', data['batchId']);
    }
    else if ( 'reconfirmation' in data ) {
      Logger.debug('SubscriptionsHandler.handleMessage, reconfirmation', data);
      this.handleMessageObservers(data['reconfirmation']);
      // this.handleUpdateBatchId(data['batchId']);
      this.fire('update:batchId', data['batchId']);
    }
    else if ( 'noupdates' in data ) {
      Logger.debug('SubscriptionsHandler.handleNoUpdates, batchId ', this._batchId);
      // Just send the same batchId, over and over again
      // this.handleUpdateBatchId(this._batchId);
      this.fire('noupdates'); // if no param given, take the current batchId - this.batchId
    }
    else {
      Logger.error('SubscriptionsHandler.handleMessage, invalid data ', data);
    }
  },

  // If the subscription is incorrect, assume it will trigger an error
  handleSubscriptionConfirmation: function(confirmedList) {
    var subscription = null, subscriptionIdx = undefined;

    Logger.debug('%cSubscriptionsHandler.handleSubscriptionConfirmation',
      'color:red', confirmedList);

    for ( subscription in confirmedList ) {
      Logger.debug('%cconfirmed subscription : ', 'color:red', subscription);
      this.channelsList.confirmSubscription(confirmedList[subscription]);
    }
  },

  handleApiError: function() {
    Logger.warn('%cSubscriptionsHandler.handleApiProtocolsError '
      + 'An api or protocol error has been triggered', 'color:red');
  }
});


return MessagesHandler;


});