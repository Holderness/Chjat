var mongoose = require('mongoose');

var Messages = new mongoose.Schema({
  room: String,
  sender: String,
  message: String,
  timestamp: {
        type: Date,
        default: Date.now
    }
});

var Chatroom = new mongoose.Schema({
  // key: String,
  name: String,
  // users: [],
  chatlog: [ Messages ],
  created: Date,
});

module.exports = mongoose.model( 'Chatroom', Chatroom );
module.exports = mongoose.model( 'Messages', Messages );