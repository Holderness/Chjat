var mongoose = require('mongoose');


var Chat = new mongoose.Schema({
  users: [],
  history: [],
  created: Date,
});

module.exports = mongoose.model( 'Book', Book );