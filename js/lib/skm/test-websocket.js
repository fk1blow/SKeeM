


require(['skm/net/WebSocket', 'skm/k/Object', 'skm/util/Timer'],
  function(SKMWebsocket, SKMObject, SKMTimer)
{

// console.clear();

// window.SKMTimer = SKMTimer;

// window.SKMWebsocket = SKMWebsocket;


var wsUrls = [
  'ws://localhost:8080/WebSocketServletTest/websk',
  'ws://10.0.3.98:3000'
];

var ws = SKMWebsocket.create({ url: wsUrls[0], pingServer: false });
ws.on('received:pong', function() {
    cl('received:pong')
}).on('received:message', function() {
    cl('received:message')
    ws.send('message back to server')
}).on('server:disconnected', function() {
    cl('server:disconnected')
})
// ws.connect();




// var MyMixin = SKMMixin.create({
//   doA: function() {
//     cl('doA')
//   },
//   doB: function() {
//     cl('doB')
//   }
// });


// var A = SKMObject.extend(MyMixin, {
// // var A = Ember.Object.extend(MyMixin, {
//   a: 'a',
//   b: 'b',
//   initialize: function() {
//     // cl('A.initialize')
//   }
// });


// var B = A.extend({
//   a: 'ab'
// });

// var b = B.create();

// cl(b)

// cl(A.prototype)

// var a = A.create({ a: 'a1' });
// var a = A.create();
// cl('a : ', a)

// cl(A.prototype)



// console.time('someFunction');
// // var a  = new Date().getTime();
// for(var i = 0; i <= 10000; i++) {
//     A.create();
// }
// // var b  = new Date().getTime() - a;
// // alert(b)
// console.timeEnd('someFunction');



// var B = SKMObject.extend({
//   a1: 'a1',
//   b: 'b1'
// });

// var a = A.create({
//   d: 'd',
//   e: 'e'
// });

// var b = A.create({
//   initialize: function() {
//     cl('B.initialize')
//   }
// });




// var ws = SKM.net.WebSocket.create({ url: testUrls.Local, subprotocols: ['RTF_MATCH_UPDATE'] });
// ws.connect();
// var ws = new WebSocket(testUrls.Radu);

// ws.bind('open', function() {
//   cl('socket opened and ready')
//   ws.send('test 123')
// });

// ws.bind('reconnecting', function() {
//   cl('socket trying to reconnect')
// });

// ws.bind('unexpectedClose', function() {
//   cl('pffff, unexpectedClose!')
// });

// ws.bind('message', function(event) {
//   cl('message received : ', event.data)
// }); 

// ws.bind('unexpectedClose', function(event) {
// 	cl('unexpected close', event)
// })

// ws.bind('error', function(error) {
//   cl('error received : ', error.data)
// });

// ws.bind('close', function() {
//   cl('closed received')
// })





/*var connArr = [];
var aabb = setInterval(function() {
    connArr.push(new WebSocket('ws://localhost:8080'))
    cl('x')
}, 1000)

clearTimeout(aabb)

var item;
while(item = connArr.shift()) {
    cl(item.readyState)
    item.close()
}

for(var i = 0; i < connArr.length; i++) {
    cl(connArr[i].readyState)
}*/





/*var ws = null;

var wsarr = [];

for(var i = 0; i < 10; i++) {
   var ws = SKM.net.WebSocket.create({ url: 'ws://localhost:8080' });
   ws.connect();
   wsarr.push(ws);
}
ws._socket.close()*/


});