var config = require('./config'),
    mongoose = require('mongoose');

module.exports = function() {
  var db = mongoose.connect(config.db, function(err, db) {
      if (!err) {
         console.log("mongoose is kickin");
      } else {
         console.error(err);
         throw err;
      }
   });

  require('../app/models/user');
  require('../app/models/chatroom');
  require('../app/models/direct-message');

  return db;
};