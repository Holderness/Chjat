var config = require('./config'),
    mongoose = require('mongoose');

module.exports = function() {
  var db = mongoose.connect(config.db, function(err, db) {
           console.log("test");
           if (!err) {
                   console.log("test");
           }
           else {
                   console.dir(err);
           throw err;
           }
   //  db.close();
   });

  require('../app/models/user');
  require('../app/models/chatroom');
  require('../app/models/direct-message');

  return db;
};