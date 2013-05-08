
// RTF Messages handler

define(['skm/util/Logger'],
  function(SKMLogger)
{
'use strict';


var Logger = SKMLogger.create();


var EventsDelegates = {
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

  // If the subscription is incorrect, assume it will trigger an error
  handleSubscriptionConfirmation: function(confirmedList) {
    var subscription = null, state = false;

    for ( subscription in confirmedList ) {
      if ( confirmedList[subscription] === 'true' ) {
        this._getChannelsList().confirmChannel(subscription);
        Logger.debug('confirmed subscription : ', subscription);
        state = true;
      } else {
        this._getChannelsList().removeChannel(subscription);
        Logger.debug('removed subscription : ', subscription);
        state = false;
      }
      this.fire('confirmed:' + subscription, state);
    }
  },



  handleApiMessage: function(data) {
    if ( 'update' in data ) {
      Logger.debug('RTFApi.handleApiMessage, update', data);
      this.handleMessageSections(data['update']);
      this.handleUpdateBatchId(data['batchId']);
    }
    else if ( 'reconfirmation' in data ) {
      Logger.debug('RTFApi.handleApiMessage, reconfirmation', data);
      this.handleMessageSections(data['reconfirmation']);
      this.handleUpdateBatchId(data['batchId']);
    }
    else if ( 'noupdates' in data ) {
      Logger.debug('RTFApi.handleNoUpdates, batchId ', this._batchId);
      // Just send the same batchId, over and over again
      // If no param given, take the current batchId - this.batchId
      this.handleUpdateBatchId(this._batchId); 
    }
    else {
      Logger.error('RTFApi.handleApiMessage, invalid data ', data);
    }
  },

  handleApiError: function() {
    Logger.debug('%cRTFApi.handleApiError', 'color:red');
    // this.fire('disconnected');
  },



  /**
   * Handler when a connector has becom ready
   * 
   * @description usually, triggered whenever a connector
   * has become ready to send messages
   */
  handleTransportReady: function() {
    Logger.debug('%cRTFApi.handleTransportReady', 'color:red');

    var channelsList = this._getChannelsList();
    // if connector is available, send the parameterized channels list
    if ( channelsList.getCurrentList() )
      this.sendMessage(channelsList.toStringifiedJson());
    // Fire the "ready" event, signaling that the rtf,
    // can start to communicate with the server
    // this.fire('ready');
  },

  handleTransportInterrupted: function() {
    Logger.debug('%cRTFApi.handleTransportInterrupted', 'color:red');
    // this.fire('disconnected');
  },

  handleTransportClosed: function() {
    Logger.debug('%cRTFApi.handleTransportClosed', 'color:red');
    // this.fire('disconnected');
  },



  handleManagerSequenceSwitching: function() {
    Logger.debug('%cRTFApi.handleManagerSequenceSwitching', 'color:red');
  },

  handleManagerSequenceComplete: function() {
    Logger.debug('%cRTFApi.handleManagerSequenceComplete', 'color:red');
  },



  xxx_handleConnectorReady: function() {
    Logger.debug('%cRTFApi.handleConnectorReady', 'color:green');
    var channelsList = this._getChannelsList();
    // if connector is available, send the parameterized channels list
    if ( channelsList.getCurrentList() )
      this.sendMessage(channelsList.toStringifiedJson());
    // Fire the "ready" event, signaling that the rtf,
    // can start to communicate with the server
    this.fire('ready');
  },

  // @todo return something useful
  handleMbeanMessage: function(message) {
    Logger.debug('%cRTFApi.handleMbeanMessage',
      'color:red', message);
  },

  handleUpdateBatchId: function(batchId) {
    Logger.debug('RTFApi.handleUpdateBatchId', batchId);
    this.connectorsUrlParam.alter('batchId', batchId);
    // Dude, you must set the current object property too, so when you'll
    // try to reconnect you must have last batchId, not 0!! - Thanks, dude!
    this._batchId = batchId;
    // this.sendMessage('batchId:{' + batchId + '}');
    this.sendMessage('batchId:{' + batchId + '}');
  },
};


return EventsDelegates;


});