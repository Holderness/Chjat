if (!process.env.PORT) {
  env = require('node-env-file');
  env('.env');
}


var port = process.env.PORT || 3000;
var db = process.env.MONGOLAB_URI || 'mongodb://localhost/chat_database';
var fbCallback = port === 3000 ?
      'http://localhost:'+ port +'/oauth/facebook/callback' :
      'http://www.chjat.com/oauth/facebook/callback';
var twCallback = port === 3000 ?
      'http://localhost:'+ port + '/oauth/twitter/callback' :
      'http://www.chjat.com/oauth/twitter/callback';

module.exports = {
  port: port,
  db: db,
  facebook: {
        clientID: process.env.fbClientID,
        clientSecret: process.env.fbClientSecret,
        callbackURL: fbCallback
  },
  twitter: {
    clientID: process.env.twClientID,
    clientSecret: process.env.twClientSecret,
    callbackURL: twCallback
  }
};