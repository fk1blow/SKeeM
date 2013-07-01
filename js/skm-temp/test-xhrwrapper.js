var express = require('express');
var app = express();

app.configure(function() {
  app.use(require('express-ajax'));
});

app.listen(3000, '10.0.3.98');
console.log('App listens on: 3000');

app.get('/test-xhr', function(req, res){
  var body = 'Hello World';
  console.log('Handle request');
  res.contentType('json');
  // res.header("Access-Control-Allow-Headers", "X-Requested-With");
  // res.send('blaaaah');
  console.log(req.xhr);
  // res.render('adsasd');
  res.setHeader('Content-Length', body.length);
  res.setHeader('Content-Type', 'application/json');
  res.json({ bla: 'bla'});
  res.end(body);
});

