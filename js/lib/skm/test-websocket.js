


require(['skm/net/WSWrapper',
				 'skm/net/XHRWrapper',
				 'skm/k/Object',
         'skm/rtf/ConnectorManager',
         'skm/rtf/XHRConnector',
         'skm/rtf/WSConnector'],
  function(WSWrapper, XHRWrapper, SKMObject, RTFManager, XHRConnector, WSConnector)
{


console.log('--------------------------------------------------------------------------------------')




var ws = WSWrapper.create({ url: 'ws://10.0.3.98:3000', reconnectAttempts: 3 });

var wsconnector = WSConnector.create();
wsconnector.addTransport(ws);
wsconnector.beginUpdate();

// wsconnector.transport.on('all', function() {
//   cl('-> transpot all : ', arguments)
// })


// ws.on('all', function() {
//   cl(arguments)
// })

// ws.connect()

// cl(ws)



/**
 * WebSocket Connector
 * -------------------
 */



/*var wsurls = [
  'ws://10.0.3.98:8080/testws?clientId=' + (new Date().getTime()) + '&subscribe=test&batchId=1',
  'ws://10.0.3.98:3000'
];

var ws = WSWrapper.create({ url: wsurls[0] });

var wsConnector = WSConnector.create({ transport: ws });

// wsConnector.on('connector:deactivated', function(state) {
//   cl('wsConnector connector:deactivated');
// })
// .on('params:error', function() {
//   cl('wsConnector params:error : widget should resend parameters(subscriptionId, matchId, etc)');
// });

wsConnector.beginUpdate();*/









/**
 * XHR Connector
 * -------------
 */

/*var sub = 1361797970194;
var sub2 = (new Date).getTime();
var xhrUrl = 'http://10.0.3.98/testajax?subscribe=test&clientId=' + (new Date).getTime();

var xhr = XHRWrapper.Wrapper.create({ url: xhrUrl });
var xhrConnector = XHRConnector.create({ transport: xhr });

xhrConnector.on('params:error', function() {
  cl('params:error', arguments)
})
.on('connector:deactivated', function() {
  cl('connector:deactivated', arguments)
})

xhrConnector.beginUpdate();*/














// return;

// var wsUrls = [
//   'ws://localhost:8080/WebSocketServletTest/websk',
//   'ws://10.0.3.98:3000'
// ];


// var ws = WSWrapper.create({
//   url: wsUrls[1],
//   reconnectDelay: 3000,
//   pingServer: false,
//   pingInterval: 1000,
//   // reconnectAttempts: 5,
//   timeout: 1000
// });

// ws.connect();


});