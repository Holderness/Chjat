var mongoose = require('mongoose');
console.log('model');

var Messages = new mongoose.Schema({
  sender: String,
  message: String,
  timestamp: {
        type: Date,
        default: Date.now
    },
  url: String
});

var DirectMessage = new mongoose.Schema({
  // key: String,
  name: String,
  chatlog: [ Messages ],
  participants: [],
  created: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model( 'DirectMessage', DirectMessage );