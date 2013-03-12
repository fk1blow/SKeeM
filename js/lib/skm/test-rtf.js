


require(['skm/k/Object',
         'skm/net/WSWrapper',
				 'skm/net/XHRWrapper',
         'skm/rtf/ConnectorManager',
         'skm/rtf/XHRConnector',
         'skm/rtf/WSConnector',
         'skm/rtf/RTFApi'],
  function(SKMObject, WSWrapper, XHRWrapper, ConnectorManager, XHRConnector, WSConnector, RTF)
{


console.log('________________________________________________________________')


window.RTFApi = RTF.Api;

RTF.Api.setClientId((new Date).getTime());

RTF.Api.addSubscription('test');
// RTF.Api.addSubscription('detail');

RTF.Api.startUpdates();


// setTimeout(function() {
  // RTF.Api.switchToNextConnector();
  // RTF.Api.addSubscription('detail');
// }, 15000);



// setTimeout(function() {
//   cl('switch to next connector')
//   RTF.Api.switchToNextConnector();

//   // cl('add detail sub')
//   // RTF.Api.addSubscription('detail');
  
//   // setTimeout(function() {
//     // cl('stop rtf')
//     // RTF.Api.stopUpdates();
    
//     // setTimeout(function() {
//     //   cl('restart api')
//     //   RTF.Api.startUpdates();
//     // }, 10000)
//   // }, 10000);
// }, 10000);



















/*var wsurls = [
  'ws://10.0.3.98:8080/testws?clientId=' + (new Date().getTime()) + '&subscribe=test&batchId=1',
  'ws://10.0.3.98:3000'
];
var xhrUrl = 'http://10.0.3.98/testajax?subscribe=test&clientId=' + ((new Date).getTime());

var cm = ConnectorManager.create({
  // sequence: [ 'WebSocket', 'XHR' ]
  sequence: [ 'XHR', 'WebSocket' ]
});


//cm.setConnectorParameters({
  // subscribeId: 'nextMatchesWidget',
  // clientId: (new Date().getTime())// similar cu session id
//});


cm.registerConnector('WebSocket', WSConnector.create({
  transport: WSWrapper.create({ url: wsurls[0], reconnectAttempts: 0 })
}));


cm.registerConnector('XHR', XHRConnector.create({
  transport: XHRWrapper.create({ url: xhrUrl })
}));

cm.startConnectors();*/










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

/*var xhrUrl = 'http://10.0.3.98/testajax?subscribe=test&clientId=' + (new Date).getTime();

var xhrConnUpdate = XHRConnector.create({
  transport: XHRWrapper.create({ url: xhrUrl })
});

xhrConnUpdate.on('params:error', function() {
  cl('params:error', arguments)
})
.on('connector:deactivated', function() {
  cl('connector:deactivated', arguments)
});

xhrConnUpdate.beginUpdate();*/














// return;

/*var wsUrls = [
  'ws://localhost:8080/WebSocketServletTest/websk',
  'ws://10.0.3.98:3000'
];


var ws = WSWrapper.create({
  url: wsUrls[1],
//   reconnectDelay: 3000,
//   pingServer: false,
//   pingInterval: 1000,
  reconnectAttempts: 0,
//   timeout: 1000
});

ws.on('link:closed', function() {
  cl('link:closed')
});
ws.on('reconnecting:stopped', function() {
  cl('reconnecting:stopped')
});

ws.connect();*/


});