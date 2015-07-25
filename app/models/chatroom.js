var mongoose = require('mongoose');
console.log('model');

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
  created: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model( 'Chatroom', Chatroom );