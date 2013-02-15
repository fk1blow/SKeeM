


require(['skm/net/ws/WSWrapper', 'skm/k/Object', 'skm/util/Timer'],
  function(SKMWebsocket, SKMObject, SKMTimer)
{

// console.clear();

// window.SKMTimer = SKMTimer;

// window.SKMWebsocket = SKMWebsocket;


var wsUrls = [
  'ws://localhost:8080/WebSocketServletTest/websk',
  'ws://10.0.3.98:3000'
];


var ws = SKMWebsocket.create({ url: wsUrls[1], pingServer: true, pingInterval: 2000 });
ws.on('received:pong', function() {
    cl('received:pong')
}).on('received:message', function(message) {
    cl('received:message : ', message)
    ws.send('message back to server')
}).on('server:disconnected', function() {
    cl('server:disconnected')
})
ws.connect();

// setInterval(function() {
//   ws.send('kk')
// }, 1000)


});