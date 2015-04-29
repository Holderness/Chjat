
var express = require('express');
var app = express();

var http = require('http');
var path = require('path');

var server = http.Server(app);
var io = require('socket.io')(server);


app.use(express.static(path.join(__dirname, '../public')));

app.set('view engine', 'ejs');

var index = require('../routes/index');
app.use('/', index);


// io.on('connection', function(socket){
//   console.log('a mothafucka is connected');
//   socket
//     .on('disconnect', function(){
//       console.log('he gone.');
//     })
//     .on('chat message', function(msg){
//       console.log('message: ' + msg);
//     })
//     .on('chat message', function(msg){
//       io.emit('chat message', msg);
//     });
// });

var port = process.env.PORT || 3000;
server.listen(port, function() {
  console.log('listening on *:' + port);
});


var ChatServer = require('./chatserver');

new ChatServer({ io: io }).init();