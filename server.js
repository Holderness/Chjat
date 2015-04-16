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
  console.log('mothafucka, you connected');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});