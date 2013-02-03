var http = require('http');
var sockjs = require('sockjs');
// var node_static = require('node-static');

// 1. Echo sockjs server
var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.3.min.js"};

var sockjs_echo = sockjs.createServer(sockjs_opts);
sockjs_echo.on('connection', function(conn) {
    conn.on('data', function(message) {
        conn.write(message);
    });
});

// 2. Static files server
// var static_directory = new node_static.Server(__dirname);

// 3. Usual http stuff
var server = http.createServer();
server.addListener('request', function(req, res) {
    // static_directory.serve(req, res);
});
server.addListener('upgrade', function(req,res){
    res.end();
});

sockjs_echo.installHandlers(server, {prefix:'/echo'});

console.log(' [*] Listening on 0.0.0.0:3000' );
server.listen(3000, '0.0.0.0');





// var WebSocketServer = require('websocket').server;
// var http = require('http');
// var port = 3000;

// var server = http.createServer(function(request, response) {
//     console.log((new Date()) + ' Received request for ' + request.url);
//     response.writeHead(404);
//     response.end();
// });
// server.listen(port, function() {
//     console.log((new Date()) + ' Server is listening on port ' + port);
// });

// wsServer = new WebSocketServer({
//     httpServer: server,
//     // You should not use autoAcceptConnections for production
//     // applications, as it defeats all standard cross-origin protection
//     // facilities built into the protocol and the browser.  You should
//     // *always* verify the connection's origin and decide whether or not
//     // to accept it.
//     autoAcceptConnections: false
// });

// function originIsAllowed(origin) {
//   // put logic here to detect whether the specified origin is allowed.
//   return true;
// }


// var counter = 0;

// wsServer.on('request', function(request) {
//     if (!originIsAllowed(request.origin)) {
//       // Make sure we only accept requests from an allowed origin
//       request.reject();
//       console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
//       return;
//     }

//     var connection = request.accept('', request.origin);
//     console.log((new Date()) + ' Connection accepted.');
//     console.log('Connection origin: ', request.origin);
//     connection.on('message', function(message) {
//         if (message.type === 'utf8') {
//             console.log('Received Message: ' + message.utf8Data + ' from origin: ' + request.origin);
//             // connection.sendUTF(message.utf8Data);
//         }
//         else if (message.type === 'binary') {
//             console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
//             // connection.sendBytes(message.binaryData);
//         }
//     });
    
//     var intervalPing = setInterval(function() {
//         connection.send('pong');
//     }, 3000);

//     var intervalMessage = setInterval(function() {
//         connection.send('a normal message sent...' + (new Date()));
//     }, 3000);

//     // setTimeout(function() {
//     //     connection.send('will disconnect now!');
//     //     connection.send('close');
//     // }, 10000);
    
//     connection.on('close', function(reasonCode, description) {
//         console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
//     });
// });