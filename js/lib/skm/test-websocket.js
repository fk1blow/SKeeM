


require(['skm/net/WSWrapper',
				 'skm/net/XHRWrapper',
				 'skm/k/Object',
				 'skm/rtf/ConnectorManager',
				 'skm/rtf/XHRConnector'],
  function(WSWrapper, XHRWrapper, SKMObject, RTFConnectorManager, XHRConnector)
{


console.log('--------------------------------------------------------------------------------------')


/**
 * WebSocket Connector
 * -------------------
 */


/*
var wsurls = [
  'ws://10.0.3.98:8080/testws?clientId=' + (new Date().getTime()) + '&subscribe=test&batchId=1',
  'ws://10.0.3.98:3000'
];

var ws = WSWrapper.create({ url: wsurls[1] });
ws.connect();

var wsConnector = RTFConnector.WS.create({ transport: ws });

wsConnector.on('connector:switch', function(state) {
  cl('wsConnector connector:switch');
}).on('server:params:error', function() {
  cl('wsConnector server:params:error : widget should resend parameters(subscriptionId, matchId, etc)');
});

wsConnector.beginUpdate();
*/







/**
 * XHR Connector
 * -------------
 */


/*var xhrUrl = 'http://10.0.3.98/testajax?subscribe=test&clientId=' + (new Date).getTime();

var xhrTransport = XHRWrapper.Wrapper.create({ url: xhrUrl });
var xhrConnector = XHRConnector.create({ transport: xhrTransport });

xhrConnector.on('params:error', function() {
  cl('params:error', arguments)
}).on('connection:error', function() {
  cl('connection:error', arguments)
})

xhrConnector.beginUpdate();*/











// return;

/*var wsUrls = [
  'ws://localhost:8080/WebSocketServletTest/websk',
  'ws://10.0.3.98:3000'
];


var ws = WSWrapper.create({
  url: wsUrls[1],
  reconnectDelay: 3000,
  pingServer: false,
  pingInterval: 1000,
  reconnectAttempts: 5,
  timeout: 1000
});

ws.connect();*/


});