
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


var Config = (function(){
  var transportsURLs = {
    ws: 'ws://localhost:8080/testws',
    xhr: 'http://localhost:8080/testajax'
  };

  var defaultURLs = {
    ws: 'ws://localhost:8080/testws',
    xhr: 'http://localhost:8080/testajax'
  };

  var connectorSequence = ['WebSocket', 'XHR'];

  var wsReconnectAttempts = 1;

  return {
    getSequence: function() {
      return connectorSequence;
    },

    setSequence: function(sequence) {
      connectorSequence = sequence;
    },

    getWSReconnectAttempts: function() {
      return wsReconnectAttempts;
    },

    setWSReconnectAttempts: function(attempts) {
      wsReconnectAttempts = attempts;
    },

    getWSUrl: function() {
      var url = null;
      if ( ! (url = transportsURLs.ws) ) {
        url = defaultURLs.ws;
        Logger.info('%cConfig.getWSUrl : ws url is null - '
          + ' returning default url', 'color:red');
      }
      return transportsURLs.ws;
    },

    setWSUrl: function(url) {
      transportsURLs.ws = url;
    },

    getXHRUrl: function() {
      var url = null;
      if ( ! (url = transportsURLs.xhr) ) {
        url = defaultURLs.xhr;
        Logger.info('%cConfig.getXHRUrl : xhr url is null - '
          + ' returning default url', 'color:red');
      }
      return transportsURLs.xhr;
    },

    setXHRUrl: function(url) {
      transportsURLs.xhr = url;
    }
  }
}());


/*
  Subscriptions and Param lists
 */


var Subscription = SKMObject.extend(Subscribable, {
  name: undefined,

  initialize: function() {
    Logger.debug('%cnew Subscription', 'color:#A2A2A2', this.name);
  },

  handleUpdate: function(message) {
    this.fire('update', message);
  },

  destroy: function() {
    this.fire('destroy');
  }
});


var rtfSubscriptionList = {
  _subscriptions: null,

  add: function(name, subscription) {
    if ( ! this._subscriptions )
      this._subscriptions = {};
    return this._subscriptions[name] = subscription;
  },

  remove: function(name) {
    if ( name in this._subscriptions )
      delete this._subscriptions[name];
    return true;
  },

  get: function(name) {
    this._subscriptions = this._subscriptions || {};
    return this._subscriptions[name];
  },

  eachSubscription: function(callback, context) {
    var subscription, list = this._subscriptions;
    for ( subscription in list ) {
      callback.call(context || this, list[subscription]);
    }
  },

  getList: function() {
    return this._subscriptions;
  },

  has: function(subscription) {
    return this._subscriptions && (subscription in this._subscriptions);
  },

  isNullOrEmpty: function() {
    var counter = 0, sub;
    if ( this._subscriptions !== null ) {
      for (sub in this._subscriptions) {
        counter++;
      }
      if (counter > 0)
        return false;
    }
    return true;
  }
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

  addByKeyAndValue: function(paramObject) {
    //
  },

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


var rtfParamList = ParamsModel.create();


/**
 * RTFApi handlers delegate
 */
var ApiDelegates = {
  handleMessage: function(data) {
    var batchId = this._batchId;
    if ( 'message' in data ) {
      Logger.debug('ApiDelegates.handleMessage :: message', data);
    } else if ( 'reconfirmation' in data ) {
      Logger.debug('ApiDelegates.handleMessage :: reconfirmation', data);
    } else if ( 'noupdates' in data ) {
      return this.handleNoUpdates(data);
    } else {
      return this.handleInvalidData(data);
    }
    // get batchId sent by server
    batchId = data['batchId'];
    // update it in params list
    rtfParamList.alter('batchId', batchId);
    // send message
    this.sendMessage('batchId{' + batchId + '}');
  },

  handleNoUpdates: function() {
    Logger.debug('ApiDelegates.handleNoUpdates :: batchId ', this._batchId);
    this.sendMessage('batchId{' + this._batchId + '}');
  },

  handleInvalidData: function(data) {
    Logger.error('ApiDelegates.handleInvalidData :: invalid data', data);
  },

  // notify all subscriptions that an error has occured
  handleManagerSequenceStopped: function() {
    Logger.debug('ApiDelegates.handleManagerSequenceStopped');
  },

  // notify all subscriptions that sequence has been deactivated
  handleManagerSequenceDeactivated: function() {
    Logger.warn('ApiDelegates.handleManagerSequenceDeactivated');
  },

  handleResetThenAddSubscribes: function() {
    rtfParamList.reset('subscribe');
    // Re-add the subscriptions to the params list
    rtfSubscriptionList.eachSubscription(function(subscription) {
      rtfParamList.add('subscribe', subscription.name);
    });
  },

  handleRemoveSubscribes: function() {
    rtfParamList.remove('subscribe');
  }
}


/**
 * API constructor
 */
var RTFApi = SKMObject.extend(ApiDelegates, {
  _clientId:  null,
  
  _sessionId:  null,

  _batchId: 1,

  _connectorManager: null,

  initialize: function() {
    Logger.debug('%cnew RTFApi', 'color:#A2A2A2');
    
    // Prepare batchId and add it to the parameterizer
    rtfParamList.add('batchId', this._batchId);
    
    // creates the connector manager
    this._createConnectorManager();

    // Resends a confirmation back to server api
    this._connectorManager.on('update',
      this.handleMessage, this);

    // Handle when manager has stopped - something wrong happened
    this._connectorManager.on('stopped',
      this.handleManagerSequenceStopped, this);

    // Handle when manager has been deactivated - next/sequence switch
    this._connectorManager.on('deactivated',
      this.handleManagerSequenceDeactivated, this);

    // re-add subscriptions to the param list before connector began update
    this._connectorManager.on('before:nextSequence',
      this.handleResetThenAddSubscribes, this);

    // remove subscribe after every connector has began update
    this._connectorManager.on('after:startConnector',
      this.handleRemoveSubscribes, this);
  },

  startUpdates: function() {
    Logger.debug('%cRTFApi.startUpdates', 'color:green');
    // check clientId, subscription list
    this._checkEssentialFields();
    // Start the connectors, if any available.
    this._connectorManager.startConnectors();
  },

  stopUpdates: function() {
    Logger.debug('%cRTFApi.stopUpdates', 'color:green');
    this._connectorManager.stopConnectors();
  },

  switchToNextConnector: function() {
    Logger.debug('%cRTFApi.switchToNextConnector', 'color:green');
    this._connectorManager.switchToNextConnector();
  },

  sendMessage: function(message) {
    if ( ! message )
      Logger.warn('RTFApi.sendMessage : unable to send an empty message');
    this._connectorManager.sendMessage(message);
  },

  
  /**
   * @todo
   * Refactor params list create/update
   */


  /**
   * Sets the clientId of the rtf client
   *
   * @description same as session id though can be left out
   * and the value implicitly retrieved/set by server api
   * @param {String} id cliend/sessions id string
   */
  setClientId: function(id) {
    var cid = this._clientId;
    if ( cid !== null ) {
      throw new Error('RTFApi.setClientId : clientId already set!');
    }
    rtfParamList.add('clientId', this._clientId = id);
  },
  
  /**
   * @todo create a [addParam] method that takes an object as argument
   * { paramKey: value } and sends it to the [rtfParamList]
   */
  setSessionId: function(key,value) {
    var cid = this._sessionId;
    if ( cid !== null ) {
      throw new Error('RTFApi.setSessionId : ' + key + ' already set!');
    }
    rtfParamList.add(key, value);
  },

  /**
   * Returns a subscription
   * 
   * @param  {String} name the name identifier of the subscription
   */
  getSubscription: function(name) {
    return rtfSubscriptionList.get(name);
  },

  /**
   * Adds a new subscription
   *
   * @description creates a new Subscription object
   * and ties it to the connector's "api:update" event
   * @param {String} name subscription name
   * @param {Object} optParams the optional parameters object to be
   * sendt alongside subscription name
   */
  addSubscription: function(name, optParams) {
    var subscription, message;
    if ( rtfSubscriptionList.has(name) ) {
      Logger.info('RTFApi.addSubscription :: ' + name +
        ' subscription already registered!'); 
    }
    message = 'subscribe{' + name + '}';

    // Create the new subscription and add it to the list
    subscription = rtfSubscriptionList.add( name,
      Subscription.create({ name: name }) );
    
    // Tie the subscription to the manager's updates
    this._connectorManager.on('update', subscription.handleUpdate, subscription);

    // Add it to the rtfParamList
    rtfParamList.add('subscribe', name);

    // if params are sent, concatenate to message string
    if ( optParams ) {
      var  newParams = {};
      newParams[name]=optParams;

      var strParams = JSON.stringify(newParams).replace(/\"|\'/g, '');
      // this._connectorManager += ('params{' + name + ':{' + strParams + '}');
      this.sendMessage({ params: strParams });
    } else {
      this.sendMessage({ message: message });
    }

    // message = optParams;

    // Tell the connector to notify server api
    // this.sendMessage(message, { params: optParams });

    

    return subscription;
  },

  /**
   * Removes a subscription
   *
   * @description destroys the instance and
   * removes the callbacks on connector "api:update" event
   * @param  {String} name subscription name
   */
  removeSubscription: function(name) {
    var subscription = rtfSubscriptionList.get(name);

    // Dettach update event
    this._connectorManager.off('update', subscription.handleUpdate, subscription);
    
    // Remove from subscription list
    rtfSubscriptionList.remove(name);

    // Destroy subscription
    subscription.destroy();
    
    // rtfParamList.remove('subscribe');
    rtfParamList.remove('subscribe');
  },


  /*
    Privates
   */
  

  _createConnectorManager: function() {
    var manager = this._connectorManager = ConnectorManager.create({
      sequence: Config.getSequence()
    });

    manager.registerConnector('WebSocket', WSConnector.create({
      urlBase: Config.getWSUrl(),
      urlParamModel: rtfParamList
    })).addTransport(WSWrapper.create({
      reconnectAttempts: Config.getWSReconnectAttempts()
    }));

    manager.registerConnector('XHR', XHRConnector.create({
      urlBase: Config.getXHRUrl(),
      urlParamModel: rtfParamList
    })).addTransport(XHRWrapper.create());
  },

  _getIncrementedBatchId: function() {
    var bid = this._batchId++
    return bid;
  },

  _checkEssentialFields: function() {
    // Checks clientId presence
    if ( !this._clientId )
      Logger.warn('RTFApi.startUpdates :: no clientId set!');
    // Checks the presence of subscriptions
    if ( rtfSubscriptionList.isNullOrEmpty() )
      Logger.warn('RTFApi.startUpdates :: subscription list is empty!');
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


// end module
});