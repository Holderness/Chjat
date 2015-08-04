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
    io = require('socket.io')(server);

  var session = session({
    saveUninitialized: true,
    resave: true,
    secret: process.env.SESSION_SECRET
  });



  app.use(session);
  io.use(sharedsession(session, {
    autoSave: true
  }));

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