process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var config = require('./config/config'),
    mongoose = require('./config/mongoose'),
    express = require('./config/express'),
    passport = require('./config/passport'),
    errorHandler = require('errorhandler'),
    session = require('express-session'),
    sharedsession = require("express-socket.io-session"),
    flash = require('connect-flash'),
    http = require('http');

var db = mongoose(),
    app = express(),
    passport = passport(),
    server = http.Server(app),
    io = require('socket.io')(server, {
      'transports': ['websocket', 'polling']
    });

  // var session = session({
  //   saveUninitialized: true,
  //   resave: true,
  //   secret: process.env.SESSION_SECRET,
  //   store: new sessionStore({ db: config.db})
  // });

  // app.use(session);

  io.configure(function () { 
    io.set("transports", ["xhr-polling"]); 
    io.set("polling duration", 10); 
}); 

  io.use(sharedsession(app.sessionStore, {
    autoSave: true
  }));

  // io.use(function(req, res, next) {
  //   console.log('>>>>>>>>>>>>>>>>>>>>>REQ<<<<<<<<<<<<', req.handshake);
  //   console.log('>>>>>>>>>>>>>>>>>>>>>RES<<<<<<<<<<<<', res);
  //   cookieParser(req, null, function(err){ if (err) {console.log( err);} });
  //   // console.log('scoketttthandddshake',socket.handshake);
  //   // console.log('socket.request.res', socket.request.res);
  //   // console.log('socket.request', socket.request);
  //   // session(socket.conn.request, socket.conn.request.res, next);
  //   // console.log('sockettttttttt', socket);
  // });

  // io.use(sharedsession(session, function(socket, next){
  //   console.log('sockettttttttt', socket);
  //   cookieParser( socket, null, function(err) {

  //   }  
  // }));
// 

// we need to use the same secret for Socket.IO and Express

// io.set('authorization', function(handshake, callback) {
//   if (handshake.headers.cookie) {
//     // pass a req, res, and next as if it were middleware
//     cookieParser(handshake, null, function(err) {
//       handshake.sessionID = handshake.signedCookies['connect.sid'];
//       // or if you don't have signed cookies
//       handshake.sessionID = handshake.cookies['connect.sid'];

//       sessionStore.get(handshake.sessionID, function (err, session) {
//         console.log('>>>>>>',session);
//         if (err || !session) {
//           // if we cannot grab a session, turn down the connection
//           callback('Session not found.', false);
//         } else {
//           // save the session data and accept the connection
//           handshake.session = session;
//           callback(null, true);
//         }
//       });
//     });
//   } else {
//     return callback('No session.', false);
//   }
//   callback(null, true);
// });


ChatServer = require('./config/chatserver'),

// passes the socketio enhanced server to chatserver.js
// initializes the chatserver along with its listeners
  new ChatServer({ io: io, app: app }).init();



if (app.settings.env === 'development') {
  app.use( errorHandler({ dumpExceptions: true, showStack: true }) );
}

server.listen( config.port, function() {
  console.log( 'Express server listening on port %d in %s mode',
    config.port, app.settings.env );
});



module.exports = app;