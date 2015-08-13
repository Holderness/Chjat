_ = require('underscore');
var express = require('express'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    bodyParser = require('body-parser');


var chatroom = require('../app/controllers/chatroom');

console.log('chatserver');

var UserModel = mongoose.model('User');
var ChatroomModel = mongoose.model('Chatroom');


// the chatserver listens to the chatclient
var Server = function(options) {

  var self = this;

  self.io = options.io;

  self.init = function() {
    self.io.on('connection', function(socket){
      console.log('a mothafucka is connected', socket.handshake);
      console.log('>>>>socket', socket.handshake.sessionStore);

      self.socket = socket;
      socket.chat = {};

      socket.on("login", function(userdata) {
        console.log('e.login');
        console.log('userdata: ', userdata);
        socket.handshake.session.userdata = userdata;
        self.manageConnection(socket, userdata);
      });

      socket.on("logout", function(userdata) {
        console.log('e.logout');
        if (socket.handshake.session.userdata) {
          delete socket.handshake.session.userdata;
        }
      });
              
      if (socket.handshake.session.passport) {
        UserModel.findById(socket.handshake.session.passport.user, function(err, found) {
          return self.manageConnection(socket, found);
        });
      }

    });
  };




  self.manageConnection = function(socket, userdata) {
    console.log('f.manageConnection');
    var newUser = new User({
      username: userdata.username,
      socket: socket
    });
    self.setResponseListeners(newUser);
  };
    


  self.setResponseListeners = function(user) {

    user.socket.on('disconnect', function() {
      self.io.sockets.emit("userLeft", user.username);
      self.leaveRoom(user);
      console.log("e.disconnect: ", user.username);
      console.log('he gone.');
    });

    user.socket.on("connectToRoom", function(name) {
      console.log('e.connectToRoom');
      console.log('user.socket.id: ', user.socket.id);
      self.addToRoom(user, name);
      user.socket.emit("welcome");
    });

    user.socket.on("chat", function(chat) {
      console.log('e.chat');
      console.log("USER: ", user.username);
      console.log('CHAT: ', chat);
      console.log('user.socket.CHAT.ROOM ', user.socket.chat.room);
      // console.log('self.io.sockets.adapter.rooms: ', self.io.sockets.adapter.rooms);
      var timestamp = _.now();
      if (chat) {
        ChatroomModel.findOne({ name: user.socket.chat.room }, function(err, chatroom) {
          if (!err) {
            chatroom.chatlog.push( { room: user.socket.chat.name, sender: user.username, message: chat } );
            chatroom.save(function(err) {
              if (err) { return console.log( err );}
            });
            self.io.sockets.to(user.socket.chat.room).emit("chat", { room: user.socket.chat.room, sender: user.username, message: chat, timestamp: timestamp});
          } else {
            return console.log( err );
          }
        });
      } else {
        return console.log( err );
      }
    });

    user.socket.on("typing", function() {
      user.socket.broadcast.emit("typing", { username: user.username });
    });
    user.socket.on("stop typing", function() {
      user.socket.broadcast.emit("stop typing");
    });

    user.socket.on('joinRoom', function(roomName) {
      console.log('e.joinRoom');
      console.log('USER: ', user.username);
      console.log('JOIN ROOM: ', roomName);
      user.socket.leave(user.socket.chat.room);
      self.leaveRoom(user);
      self.addToRoom(user, roomName);
    });

    user.socket.on('getChatroomModel', function(name) {
        ChatroomModel.findOne({ name: name }, function(err, chatroom) {
          if (!err) {
            user.socket.emit("ChatroomModel", chatroom);
          } else {
            return console.log( err );
          }
        });
    });

  };



  self.leaveRoom = function(user) {
    var currentRoom = user.socket.chat.room;
    console.log("f.leaveRoom: ", currentRoom);
    console.log('user leaving: ', user.username);
    ChatroomModel.update({ name: currentRoom },
      {$pull: {'onlineUsers': {username: user.username}}},
      function(err, model) {
        ChatroomModel.find({}, function( err, chatrooms ) {
          if (!err) {
            console.log( "CHATROOOOOOOMs", chatrooms );
            // user.socket.emit("rooms", chatrooms);
            user.socket.broadcast.to(currentRoom).emit('userLeft', user.username);
          } else {
            return console.log( err );
          }
        });
        if (err) {return console.log(err);}
      });

  };


  self.addToRoom = function(user, roomName) {
    console.log("f.addToRoom: ", roomName);
    user.socket.join(roomName);
    user.socket.chat.room = roomName;
    console.log('user socket id: ', user.socket.id);
    ChatroomModel.update({ name: roomName},
      {$push: {'onlineUsers': { username: user.username }}},
      function(err, model){
        if (err) { return console.log(err); }
        // user.socket.emit('setRoom', roomName);
        self.getChatsAndUsers(user, roomName);
        console.log('model: ', model);
        self.getChatrooms(user.socket);
        user.socket.broadcast.to(roomName).emit('userJoined', user.username);
      });
  };


  self.getChatsAndUsers = function(user, roomName) {
    console.log('f.getChatsAndUsers');
    ChatroomModel.findOne({name: roomName}, function( err, chatroom ) {
      if (!err) {
        console.log('chatroom: ', chatroom);
        user.socket.emit('chatlog', chatroom.chatlog);
        user.socket.emit('onlineUsers', chatroom.onlineUsers);
        user.socket.emit('chatroomName', roomName);
      } else {
        return console.log (err);
      }
    });
  };


  self.getChatrooms = function(socket) {
    console.log('f.getChatrooms');
    ChatroomModel.find({}, function( err, chatrooms ) {
      if (!err) {
        socket.emit('chatrooms', chatrooms);
      } else {
        return console.log (err);
      }
    });
  };



};


      // var newUser = new User({ 
      //   _id: user._id,
      //   username: user.username,
      //   name: user.name,
      //   password: user.password,
      //   provider: user.provider,
      //   email: user.email,
      //   socket: socket,
      // });
      //   //pushes User model to online user array
      //   // self.users.push(newUser);

      //   // calls method below
      //   self.setResponseListeners(newUser);

      //   // joins default room
      //   self.addToRoom(newUser, socket, 'DOO');

      //   // emits 'welcome' and 'userJoined' to the chatclient
      //   socket.emit("welcome");
      //   // self.io.sockets.emit("userJoined", newUser.username);
      //   // });

// User Model
var User = function(args) {
  var self = this;
  self.socket = args.socket;
  self.username = args.username;
};

// allows export to server.js
module.exports = Server;



