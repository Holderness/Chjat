var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// app.use(express.static(__dirname + '/public'));

// app.set('view engine', 'html');

// app.get('/', function(req, res){
//   res.render('index');
// });


app.get('/', function(req, res){
  res.sendfile('test.html');
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


http.listen(3000, function(){
  console.log('listening on *:3000');
});