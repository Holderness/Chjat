var mongoose = require('mongoose');


var Chat = new mongoose.Schema({
  key: String,
  name: String,
  users: [],
  history: [],
  created: Date,
});

module.exports = mongoose.model( 'Book', Book );