var express = require('express');
var app = express();
var http = require('http');
var server = http.Server(app);
var io = require('socket.io')(server);

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'html');

app.get('/', function(req, res){
  res.render('index');
});

app.get('/test', function(req, res){
  res.render('test');
});


io.on('connection', function(socket){
  console.log('a mothafucka is connected');
  socket
    .on('disconnect', function(){
      console.log('he gone.');
    })
    .on('chat message', function(msg){
      console.log('message: ' + msg);
    })
    .on('chat message', function(msg){
      io.emit('chat message', msg);
    });
});

// A: not sure if we'll be using heroku, but set up the env.port anyway
var port = process.env.PORT || 3000;
server.listen(port, function() {
  console.log('listening on *:' + port);
});