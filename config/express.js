var config = require('./config'),
    express = require('express'),
    ejs = require('ejs'),
    path = require('path'),
    bodyParser = require('body-parser'),
    multer = require('multer'),
    bcrypt = require('bcrypt-nodejs'),
    passport = require('passport'),
    path = require('path'),
    session = require('express-session');


module.exports = function() {

  var app = express();

  ejs.delimiter = '$';

  // parses request body and populates request.body
  app.use( bodyParser.urlencoded({ extended: true }) );
  app.use( bodyParser.json() );

  app.use(session({
    saveUninitialized: true,
    resave: true,
    secret: process.env.SESSION_SECRET
  }));

  // app.set('views', './public');
  // app.set('view engine', 'ejs');

  // app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(express.static(path.join(__dirname, '../public')));

  app.set('view engine', 'ejs');


//routes
  // var index = require('../app/routes/index');
  // app.use('/', index);
  // what the routes will look like...
  require('../app/routes/index.js')(app);
  // require('../app/routes/users.js')(app);
  require('../app/routes/chatroom.js')(app);





  return app;

};