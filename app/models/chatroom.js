var mongoose = require('mongoose');
console.log('model');

var Messages = new mongoose.Schema({
  room: String,
  sender: String,
  message: String,
  timestamp: {
        type: Date,
        default: Date.now
    },
  url: String
});

var Chatroom = new mongoose.Schema({
  // key: String,
  name: String,
  // users: [],
  owner: String,
  chatlog: [ Messages ],
  onlineUsers: [],
  participants: [],
  created: {
        type: Date,
        default: Date.now
    },
  roomImage: String,
});

module.exports = mongoose.model( 'Chatroom', Chatroom );