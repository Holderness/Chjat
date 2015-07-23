var config = require('./config'),
    mongoose = require('mongoose');

module.exports = function() {
  var db = mongoose.connect(config.db);

  require('../app/models/user');
  require('../app/models/chatroom');

  return db;
};