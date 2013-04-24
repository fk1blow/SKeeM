
// RTF Messages handler

define(['skm/util/Logger',
  'skm/util/Subscribable'],
  function(SKMLogger, Subscribable)
{
'use strict';


var Logger = SKMLogger.create();


var MessagesHandler = {
  handleMessageSections: function(dataObj) {
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
        else if ( itemKey == 'error' )
          this.fire('error:' + itemKey, itemVal);
        else {
          try {
            this.fire('message:' + itemKey, itemVal);
          } catch(err) {
            Logger.error('Error when sending message' + itemKey, err);
            this.fire('message:' + itemKey, { error: 'update handler error' });
          }
        }
      }
    }
  },

  handleMessage: function(data) {
    if ( 'update' in data ) {
      Logger.debug('MessagesHandler.handleMessage, update', data);
      this.handleMessageSections(data['update']);
      this.handleUpdateBatchId(data['batchId']);
    }
    else if ( 'reconfirmation' in data ) {
      Logger.debug('MessagesHandler.handleMessage, reconfirmation', data);
      this.handleMessageSections(data['reconfirmation']);
      this.handleUpdateBatchId(data['batchId']);
    }
    else if ( 'noupdates' in data ) {
      Logger.debug('MessagesHandler.handleNoUpdates, batchId ', this._batchId);
      // Just send the same batchId, over and over again
      // If no param given, take the current batchId - this.batchId
      this.handleUpdateBatchId(this._batchId); 
    }
    else {
      Logger.error('MessagesHandler.handleMessage, invalid data ', data);
    }
  },

  // If the subscription is incorrect, assume it will trigger an error
  handleSubscriptionConfirmation: function(confirmedList) {
    var subscription = null, state;
    Logger.debug('%cMessagesHandler.handleSubscriptionConfirmation',
      'color:red', confirmedList);

      for ( subscription in confirmedList ) {
        Logger.debug('confirmed subscription : ', subscription);
        state = confirmedList[subscription];
        this.getChannelsListObject().confirmChannel(subscription, state);
        this.fire('confirmed:' + subscription, state);
      }
  },

  /**
   * Handles when a connector has been deactivated
   * 
   * @description Usually, this means the transport could not be
   * initialized or has tried to reconnect unsuccesfully
   * For the time being, just log the event
   */
  handleConnectorDeactivated: function() {
    Logger.debug('%cMessagesHandler.handleConnectorDeactivated', 'color:red');
    this.fire('deactivated:connector');
  },

  /**
   * Handler when a connector has becom ready
   * 
   * @description usually, triggered whenever a connector
   * has become ready to send messages
   */
  handleConnectorReady: function() {
    Logger.debug('%cMessagesHandler.handleConnectorReady', 'color:red');
    // if connector is available
    if ( this.getChannelsListObject().getCurrentList() )
      this.sendMessage(this.getChannelsListObject().toStringifiedJson());
  },

  // @todo return something useful
  handleMbeanMessage: function(message) {
    Logger.debug('%cMessagesHandler.handleMbeanMessage',
      'color:red', message);
  },

  handleUpdateBatchId: function(batchId) {
    Logger.debug('MessagesHandler.handleUpdateBatchId', batchId);
    this.urlModel.alter('batchId', batchId);
    // Dude, you must set the current object property too, so when you'll
    // try to reconnect you must have last batchId, not 0!! - Thanks, dude!
    this._batchId = batchId;
    // this.sendMessage('batchId:{' + batchId + '}');
    this.sendMessage('batchId:{' + batchId + '}');
  },
};


return MessagesHandler;


});