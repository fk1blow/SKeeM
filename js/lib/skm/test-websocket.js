


require(['skm/net/WSWrapper',
				 'skm/net/XHRWrapper',
				 'skm/k/Object',
				 'skm/rtf/ConnectorManager',
				 'skm/rtf/Connector'],
  function(WSWrapper, XHRWrapper, SKMObject, RTFConnectorManager, RTFConnector)
{

console.clear();







var wsurls = ['ws://10.0.3.98:8080/testws?clientId=' + (new Date().getTime()) + '&subscribe=test',
'ws://10.0.3.98:3000']

var wsConnector = RTFConnector.WS.create({
	transport: WSWrapper.create({ url: wsurls[0], reconnectAttempts: 2, pingServer: false })
});
wsConnector.beginUpdate();

// setTimeout(function() {
//   cl('wsconnector terminates...')
//   wsConnector.terminateUpdate()
// }, 1000)

/*var xhrUrl = 'http://10.0.3.98/testajax?subscribe=test&clientId=' + (new Date).getTime()
var xhrConnector = RTFConnector.XHR.create({
	transport: XHRWrapper.Wrapper.create({ url: xhrUrl })
});

var CM = RTFConnectorManager.create();
CM.addConnector('wsconnector', wsConnector);
// CM.addConnector('xhrconnector', xhrConnector);

CM.beginUpdateUsing('wsconnector');*/









/**
 * TBD
 * @type {Int}
 */
// clientId: null,

/**
 * TBD
 * @type {Int}
 */
// batchId: null,








return;

/*var wsUrls = [
  'ws://localhost:8080/WebSocketServletTest/websk',
  'ws://10.0.3.98:3000'
];


var ws = SKMWebsocket.create({ url: wsUrls[1], pingServer: true, pingInterval: 1000 });
ws.on('received:pong', function() {
    cl('received:pong')
}).on('received:message', function(message) {
    cl('received:message : ', message)
    ws.send('message back to server')
}).on('server:disconnected', function() {
    cl('server:disconnected')
})
ws.connect();*/


});