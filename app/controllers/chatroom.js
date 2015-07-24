var express = require('express'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    bodyParser = require('body-parser');



var ChatroomModel = mongoose.model('Chatroom');

exports.findAllChatrooms = function(req, res, next) {
  return ChatroomModel.find().exec(function(err, chatrooms) {
    if (!err) {
      return res.send( chatrooms );
    } else {
      return console.log( err );
    }
  });
};

exports.addChatroom = function(req, res, next) {
  var chatroom = new ChatroomModel({
    name: req.body.name,
    chatlog: req.body.chatlog,
    created: req.body.created
  });
  chatroom.save( function( err ) {
    if (!err) {
      return console.log('chatroom created');
    } else {
      return console.log( err );
    }
  });
};

exports.findBy = function(req, res, next) {
  return ChatroomModel.find({ name: req.room.name }, function( err, chatroom ) {
    if (!err) {
      console.log( chatroom );
      return res.send( chatroom );
    } else {
      return console.log( err );
    }
  });
};


exports.findAllChatroomMessagess = function(req, res, next) {
  return ChatroomModel.find( { name: req.body.chatroom.name }, function( err, chatroom) {
    if (!err) {
      return res.send( chatroom.chatlog );
    } else {
      return console.log( err );
    }
  });
};


exports.addMessage = function(req, res, next) {
  return ChatroomModel.find({ name: req.body.message.room }, function(err, chatroom) {
    if (!err) {
      chatroom.chatlog.push( req.body.message );
      chatroom.save(function(err) {
        if (!err) {
          return console.log( err );
        }
      });
      return res.send( chatroom );
    } else {
      return console.log( err );
    }
  });
};

