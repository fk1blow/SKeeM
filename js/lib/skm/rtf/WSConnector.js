
// RTF WebSocket Connector implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable',
  'skm/rtf/BaseConnector',
  'skm/net/WSWrapper',
  'skm/util/Timer'],
  function(SKMObject, SKMLogger, Subscribable, BaseConnector, WSWrapper, SKMTimer)
{
'use strict';


var Logger = SKMLogger.create();


var ConnectorErrors = {
  INACTIVE: 'Innactive connection',
  LIST_TO_BIG: 'Confirmation Message Sent list is too big',
  READY_LIST_TO_BIG: 'Ready To send Message list is too big'
}


var EventsDelegates = {
  /**
   * Handles a message received from server api
   *
   * @description handles the server's update message
   * and passes it to the subscribers/clients of rtf api
   * 
   * @param  {Object} message JSON message send by rtf server api
   */
  handleReceivedMessage: function(message) {
    // Logger.info('WSConnector.handleReceivedMessage');
    message = JSON.parse(message);
    this.fire('api:update', message);
  },
  
  /**
   * Handles ws re/connection attempt
   *
   * @description handles the event where the WebSocket
   * is being closed after a reconnecting attempt
   * or the native implementation is missing.
   * After this, usually, the connector manager should 
   * swtich to the next available connector, if any.
   */
  handleReconnectingStopped: function() {
    Logger.info('Connector.handleReconnectingStopped');
    this.fire('transport:deactivated');
  },

  /**
   * Handles the interruption of an opened link/connection
   *
   * @description triggered when a currently opened connection
   * is interrupted, for reasons other than server close message.
   * In this case, the manager shouldn't do anything because
   * the WSWrapper will try to reconnect as per [reconnectAttempts]
   * If it's not able to connect, it will fire 
   * a reconnecting:stopped event.
   */
  handleLinkInterrupted: function() {
    Logger.info('Connector.handleLinkInterrupted'); 
  },
  
  /**
   * Handles ws link:closed
   *
   * @description if server api closes the link, it sends a message
   * describing the reason for the close.
   * Usually, the server api will close the link because of a problem
   * involving protocols or for network issues.
   * Anything else is not interpreted!
   * 
   * @param  {Object} message JSON message sent by rtf server api
   */
  hanleLinkClosed: function(message) {
    Logger.info('Connector.hanleLinkClosed');
    // if the message is string you got an exception, thats baaad!!!
    if ( message ) {
      this.fire('api:error', message);
    }
    this.fire('api:error');
  },

  /**
   * Triggered when the transport is ready
   *
   * @description when the transport is ready to send messages
   * this methods signals this by triggerring a 'api:ready'
   * @return {[type]} [description]
   */
  handleLinkOpened: function() {
    this.fire('connector:ready');
  },

  handleConnectingStopped: function() {
    var that = this;

    Logger.info('Connector.handleConnectingStopped');

    if ( this._currentAttempt <= this.maxReconnectAttempts ) {
      Logger.debug('Connector : will make attempt in', this.reconnectDelay, 'ms');

      // Try to begin update and reconnect after [this.reconnectDelay]
      setTimeout(function() {
        Logger.debug('Connector : attempt #', that._currentAttempt);

        // is reconnecting and increment current attempt
        that._isReconnecting = true;
        that._currentAttempt += 1;

        // try to re-establish connection by calling [beginUpdate]
        that.beginUpdate();
      }, this.reconnectDelay);
    } else {
      Logger.debug('Connector : maxReconnectAttempts of ' 
        + this.maxReconnectAttempts + ' reached!');
      Logger.debug('________________________________');

      // has stopped reconnecting and reset current attempt
      this._isReconnecting = false;
      this._currentAttempt = 0;
    }
  }
};


var WSConnector = BaseConnector.extend(EventsDelegates, {
  _typeName: 'WebSocket',

  _currentAttempt: 1,

  _isReconnecting: false,

  maxReconnectAttempts: 2,

  reconnectDelay: 10000,

  beginUpdate: function() {
    // ensure transport type and transport url creation
    this.ensureTransportCreated(WSWrapper).buildTransportUrl();
    Logger.info('Connector.beginUpdate \n', this.transport.url);
    // after connect, a ["connector:ready"] event will trigger
    this.transport.connect();
    return this;
  },

  endUpdate: function() {
    Logger.debug('Connector.endUpdate');
    // disconnect and remove events
    this.transport.disconnect();
    return this;
  },

  /*
    - define the list of events that a connector can trigger
    - for ex, if the link is being interrupted, make sure you notify the manager
    that an error has ocured - this error will be sent to the widget
  */
  addTransportListeners: function() {
    // connection dropped by server
    this.transport.on('link:closed', this.hanleLinkClosed, this);
    
    // connection established
    this.transport.on('link:opened', this.handleLinkOpened, this);
    
    // handles connection message event - rtf server api update
    this.transport.on('message', this.handleReceivedMessage, this);
    
    // an open link was interrupted, from various reasons
    this.transport.on('link:interrupted', this.handleLinkInterrupted, this);

    // reconnection attempt has stopped or implementation not found
    // @todo remove "reconnecting:stopped" event - reconnection will be
    // implemented through the connector
    this.transport.on('reconnecting:stopped implementation:missing',
      this.handleReconnectingStopped, this);


    // Try to reconnect when "stopped" or "timeout"
    this.transport.on('connecting:stopped connecting:timeout',
      this.handleConnectingStopped, this);

    return this;
  },


  /*
    Message senders
   */
  

  /**
   * Sends a message through/using the transport
   * 
   * @param  {String} message   the message to be sent to endpoint
   */
  sendMessage: function(message) {
    Logger.debug('%cWSConnector.sendMessage : ', 'color:red', message);
    this.transport.send(message);
  },

  xxx__beginReconnectAttempt: function() {
    Logger.info('WSConnector.beginReconnectAttempt');
     // in :',
      // this.reconnectDelay + 'ms');

    var that = this;
   
    if ( this._currentAttempt <= this.maxReconnectAttempts ) {
      Logger.debug('WSConnector : attempt : ', this._currentAttempt);
      Logger.debug('________________________________');

      this._isReconnecting = true;
      this._currentAttempt += 1;
      
      // Try to begin update and reconnect after [this.reconnectDelay]
      setTimeout(function() {
        that.beginUpdate();
      }, this.reconnectDelay);
    } else {
      Logger.debug('WSConnector : maxReconnectAttempts of ' 
        + this.maxReconnectAttempts + ' reached!');
      Logger.debug('________________________________');

      this._isReconnecting = false;
      this._currentAttempt = 0;

      // stop reconnecting
      // this.fire('reconnecting:stopped');
    }
  }
});


return WSConnector;


});