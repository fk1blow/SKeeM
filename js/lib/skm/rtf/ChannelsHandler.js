
// RTF Channel / Subscriptions implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable'],
  function(SKMObject, SKMLogger, Subscribable)
{
'use strict';


var Logger = SKMLogger.create();


var SubscriptionsList = {
  _channelList: null,

  _confirmedList: null,

  addSubscription: function(name, params) {
    this._channelList = this._channelList || {};
    var channel, item, paramsList = params || {};
    var list = this._channelList;
    
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

  /*addSubscriptionList: function(list) {
    var subscription = null;
    for ( subscription in list ) {
      this.addSubscription(subscription, list[subscription]);
    }
  },*/

  // Remove subscription from channel list and removes
  // the item from [_confirmedList] as well
  removeSubscription: function(name) {
    var subscription = null;
    if ( name in this._channelList ) {
      delete this._channelList[name];
    }
  },

  confirmSubscription: function(name) {
    var list = this._channelList;
    this._confirmedList = this._confirmedList || [];
    if ( name in list )
      this._confirmedList.push(name);
  },

  hasSubscribedAndConfirmed: function(name) {
    var list = this._channelList;
    var hasSubscribed = false;

    if ( list ) {
      hasSubscribed = (name in list);
    }
    return hasSubscribed;
  },

  parameterizeForXHR: function() {
    var parameterized = JSON.stringify(this._channelList).replace(/\'|\"/g, '');
    return parameterized;
  },

  parameterizeForWS : function() {
    var item, first = true, parameterized = 'subscribe:{';
    var list = this._channelList;
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


/**
 * [SubscriptionChannel description]
 * @type {[type]}
 */
var ChannelsHandler = SKMObject.extend(Subscribable, {
  subscriptions: SubscriptionsList,

  // the instance of connector manager, that will trigger some updates
  dataSourceDelegate: null,

  initialize: function() {
    // Resends a confirmation back to server api
    this.dataSourceDelegate.on('update', this.handleMessage, this);
    // Handle when manager has stopped - something wrong happened
    this.dataSourceDelegate.on('api:error', this.handleApiError, this);
  },

  // @todo rename to [subscribeTo]
  subscribeTo: function(name, optParams) {
    var connector = null;
    var resubscribeMessage = 'Channel "' + name + '" already subscribed.'
        + ' Unsubscribe then subscribe again.';

    if ( this.subscriptions.hasSubscribedAndConfirmed(name) ) {
      Logger.error(resubscribeMessage);
    } else {
      // get active connector
      connector = this.dataSourceDelegate.getActiveConnector();
      
      // Added to the connector url model
      // this._connectorsUrlModel.add('subscribe', name);
      this.fire('added:subscription', name);
      
      // Add subscription
      this.subscriptions.addSubscription(name, optParams);
      
      if ( connector.getType() == 'WebSocket' ) {
        connector.sendMessage(this.subscriptions.parameterizeForWS());
      } else if ( connector.getType() == 'XHR' ) {
        connector.sendMessage(this.subscriptions.parameterizeForXHR());
      }
    }
  },

  unsubscribeFrom: function(name) {
    this.fire('removed:subscription', name);
    // this._connectorsUrlModel.remove('subscribe');
  },

  /**
   * Adds a list of subscription channels to the subscriptions object
   * 
   * @param  {Object} list a collection of subscriptions, alongside params
   */
  prepareSubscriptionsList: function(list) {
    var subscription = null;
    for ( subscription in list ) {
      this.subscriptions.addSubscription(subscription, list[subscription]);
    }
  },





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
          this.handleMbeanMessage(itemVal);
        else if ( itemKey == 'error' ) // Add test case
          // should remove ['message:error'] trigger
          // this.fire('message:error', itemVal);
          this.fire('error:' + itemKey, itemVal);
        else
          this.fire('update:' + itemKey, itemVal);
      }
    }
  },

  handleMessage: function(data) {
    if ( 'update' in data ) {
      Logger.debug('ChannelsHandler.handleMessage, update', data);
      this.handleMessageObservers(data['update']);
      // this.handleUpdate Id(data['batchId']);
      this.fire('update:batchId', data['batchId']);
    }
    else if ( 'reconfirmation' in data ) {
      Logger.debug('ChannelsHandler.handleMessage, reconfirmation', data);
      this.handleMessageObservers(data['reconfirmation']); 
      // this.handleUpdateBatchId(data['batchId']);
      this.fire('update:batchId', data['batchId']);
    }
    else if ( 'noupdates' in data ) {
      Logger.debug('ChannelsHandler.handleNoUpdates, batchId ', this._batchId);
      // Just send the same batchId, over and over again
      // this.handleUpdateBatchId(this._batchId);
      this.fire('noupdates'); // if no param given, take the current batchId - this.batchId
    }
    else {
      Logger.error('ChannelsHandler.handleMessage, invalid data ', data);
    }
  },

  // If the subscription is incorrect, assume it will trigger an error
  handleSubscriptionConfirmation: function(confirmedList) {
    var subscription = null, subscriptionIdx = undefined;
    
    Logger.debug('%cChannelsHandler.handleSubscriptionConfirmation',
      'color:red', confirmedList);

    for ( subscription in confirmedList ) {
      Logger.debug('%cconfirmed subscription : ', 'color:red', subscription);
      this.subscriptions.confirmSubscription(confirmedList[subscription]);
    }
  },





  handleApiError: function() {
    Logger.warn('%cChannelsHandler.handleApiProtocolsError '
      + 'An api or protocol error has been triggered', 'color:red');
  }
});


return ChannelsHandler;


});