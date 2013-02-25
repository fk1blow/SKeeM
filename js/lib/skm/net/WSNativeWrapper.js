// SKM WebSocketWrapper implementation

define(['skm/k/Object',
  'skm/util/Logger'], function(SKMObject, SKMLogger)
{
'use strict';

  
var Logger = SKMLogger.create();


var ErrorMessages = {
  UNAVAILABLE: 'WebSockets implementation is unavailable.',
  NATIVE_IMPLEMENTATION_MISSING: 'Native implementation not found.',
  MISSSING_URL: 'The url param of the WebSocket constructor is mandatory.',
  SOCKET_ALREADY_OPENED: 'Seems that another socket is already opened.'
};


var NoNativeImplementation = 'No native WebSocket implementation found;'
+ ' WebSocket not available!';


var WSNativeWrapper = SKMObject.extend({
  _nativeConstructor: null,

  _socket: null,

  initialize: function() {
    Logger.debug('%cnew WSNativeWrapper', 'color:#A2A2A2');
    this._nativeConstructor = null;
    this._socket = null;
  },

  getProperConstructor: function() {
    var c = null;
    if ('WebSocket' in window)
      c = WebSocket;
    else if ('MozWebSocket' in window)
      c = MozWebSocket;
    return c;
  },

  getNativeConstructor: function() {
    var ctor = null;
    if ( ctor = this._nativeConstructor )
      return ctor;
    ctor = this.getProperConstructor();
    if ( ctor === null ) {
      Logger.info('WSNativeWrapper.getNativeConstructor : '
        + NoNativeImplementation);
    }
    return ctor;
  },

  createSocket: function(url, protocols) {
    Logger.info('WSNativeWrapper.createSocket');
    var c = this.getNativeConstructor();
    // If no native implementation found, return null
    if ( c == null )
      return c;
    if ( !arguments.length )
      throw new TypeError(ErrorMessages.MISSSING_URL);
    this._socket = (protocols) ? new c(url, protocols) : new c(url);
    return this._socket;
  },

  destroySocket: function() {
    Logger.info('WSNativeWrapper.destroySocket');
    if ( !this._socket )
      return false;
    this._socket.close();
    this._socket = null;
    return true;
  },

  getConnectionState: function() {
    if ( this._socket )
      return this._socket.readyState;
    return null;
  },

  getSocketObject: function() {
    return this._socket;
  }
});


return WSNativeWrapper;


});
