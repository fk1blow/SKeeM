


require(['skm/net/WSWrapper',
				 'skm/net/XHRWrapper',
				 'skm/k/Object',
				 'skm/rtf/ConnectorManager',
				 'skm/rtf/Connector'],
  function(WSWrapper, XHRWrapper, SKMObject, RTFConnectorManager, RTFConnector)
{

console.clear();







/*var wsurls = ['ws://10.0.3.98:8080/testws?clientId=' + (new Date().getTime()) + '&subscribe=test',
'ws://10.0.3.98:3000']

var wsConnector = RTFConnector.WS.create({
	transport: WSWrapper.create({ url: wsurls[0], reconnectAttempts: 2, pingServer: false })
});
wsConnector.beginUpdate();*/

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







// return;

var wsUrls = [
  'ws://localhost:8080/WebSocketServletTest/websk',
  'ws://10.0.3.98:3000'
];


var ws = WSWrapper.create({ url: wsUrls[1], pingServer: true, pingInterval: 1000, reconnectAttempts: 1 });

ws.on('connected', function() {
    cl('ws.connected')
}).on('disconnected', function() {
    cl('ws.disconnected')
})

ws.connect();


});