
// var express = require('express');
// var app = express();

// var http = require('http');
// var path = require('path');

// var server = http.Server(app);
// var io = require('socket.io')(server);

// app.use(express.static(path.join(__dirname, '../public')));

// var index = require('../app/routes/index');
// app.use('/', index);

// app.set('view engine', 'ejs');

// var port = process.env.PORT || 3000;
// server.listen(port, function() {
//   console.log('listening on *:' + port);
// });

// // passes the socketio enhanced server to chatserver.js
// // initializes the chatserver along with its listeners
// var ChatServer = require('./chatserver');
// new ChatServer({ io: io }).init();