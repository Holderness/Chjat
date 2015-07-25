_ = require('underscore');
var express = require('express'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    bodyParser = require('body-parser');


console.log('chatserver');

var UserModel = mongoose.model('User');
var ChatroomModel = mongoose.model('Chatroom');


// the chatserver listens to the chatclient
var Server = function(options) {

  // Server
  var self = this;
  // io from server.js
  self.io = options.io;

  // server's online user list
  self.users = [];

  // server's room list
  // self.rooms = [];


  self.init = function() {
    // Fired upon a connection
    self.io.on('connection', function(socket){
     console.log('a mothafucka is connected');
     socket.chat = {};
     // ManageConnection handles username validations.
     // If validations pass, sets response listeners that 
     // listen to the chatclient.
     self.manageConnection(socket);
  //    var chatroom =  new ChatroomModel({
  //   name: "DOO",
  //   chatlog: [{room: "DOO", sender: "harumphtr", message: "harootr"}],
  // });
  // chatroom.save( function( err ) {
  //   if (!err) {
  //     return console.log('chatroom created');
  //   } else {
  //     return console.log( err );
  //   }
  // });

  // var varys = ChatroomModel.find({}, function( err, chatroom ) {
  //   if (!err) {
  //     console.log( chatroom );
  //   } else {
  //     return console.log( err );
  //   }
  // });

  // ChatroomModel.find( {name: "ATAT"} , function( err, chatroom ) {
  //   return chatroom.remove( function( err ) {
  //     if (!err) {
  //      console.log( 'Chatroom removed' );
  //    } else {
  //      console.log( err );
  //    }
  //  });
  // });

   });
};

  self.manageConnection = function(socket) {

    socket.on('login', function(username) {

      // username length validation
      var nameBad = !username || username.length < 3 || username.length > 10;
      if (nameBad) {
        socket.emit('loginNameBad', username);
        return;
      }

      // username exists validation
      var nameExists = _.some(self.users, function(user) {
        return user.username == username;
      });
      if (nameExists) {
        socket.emit("loginNameExists", username);
      } else {
        // if username does not exist, create user, passes in user name and the socket
        // keep in mind this model is not a backbone UserModel, it's a server User model
        // defined at the bottom of this page
        var newUser = new User({ username: username, socket: socket });

        //pushes User model to online user array
        self.users.push(newUser);

        // calls method below
        self.setResponseListeners(newUser);

        // joins default room
        self.addToRoom(newUser, socket, 'DOO');

        // emits 'welcome' and 'userJoined' to the chatclient
        socket.emit("welcome");
        // self.io.sockets.emit("userJoined", newUser.username);
      }
    });
  };
    

  self.setResponseListeners = function(user) {

    // listens for a user socket to disconnect, removes that user
    // from the online user array
    user.socket.on('disconnect', function() {
      self.users.splice(self.users.indexOf(user), 1);
      self.io.sockets.emit("userLeft", user.username);
      self.leaveRoom(user, user.socket);
      console.log('he gone.');
    });

    // listens to the 'onlineUsers' event, updates the online users array on
    // a change from the client.
    user.socket.on("onlineUsers", function() {
      // creates new array of online usernames
console.log("chatserver - self.users: ", self.users);
      var users = _.map(self.users, function(user) {
        return user.username;
      });
      // emits updated online usernames array to chatclient
      user.socket.emit("onlineUsers", users);
    });

    user.socket.on("rooms", function() {
      console.log('rooms');
      ChatroomModel.find(function( err, chatrooms ) {
        if (!err) {
          user.socket.emit("rooms", chatrooms);
        } else {
          return console.log( err );
        }
      });
    });



    // listening for a 'chat' event from client, 
    // if there is a chat event, emit an object containing the username
    // and chat message to the collection of sockets connected to the server.
    // Basically, this does the job of 'broadcast'.
    user.socket.on("chat", function(chat) {
      console.log('----------------------------------------');
console.log("USER: ", user.username);
console.log('CHAT: ', chat);
console.log('USER.SOCKET.CHAT.ROOM ', user.socket.chat.room);
console.log('self.io.sockets.adapter.rooms: ', self.io.sockets.adapter.rooms);
      var timestamp = _.now();
      if (chat) {
        ChatroomModel.findOne({ name: user.socket.chat.room }, function(err, chatroom) {
          if (!err) {
            console.log('CHATROOM: ', chatroom);
            chatroom.chatlog.push( { room: user.socket.chat.name, sender: user.username, message: chat } );
            chatroom.save(function(err) {
              if (err) { return console.log( err );}
            });
          // return res.send( chatroom );
            self.io.sockets.to(user.socket.chat.room).emit("chat", { room: user.socket.chat.room, sender: user.username, message: chat, timestamp: timestamp});
          } else {
            return console.log( err );
          }
        });
      } else {
        return console.log( err );
      }
    });



    // these are listening for their respective chatclient events,
    // then the user socket broadcasts an event to all the other connected sockets.
    user.socket.on("typing", function() {
      user.socket.broadcast.emit("typing", { username: user.username });
    });
    user.socket.on("stop typing", function() {
      user.socket.broadcast.emit("stop typing");
    });

    // joins user to a room
    user.socket.on('joinRoom', function(roomName) {
      console.log('joinRoom');
      user.socket.leave(user.socket.chat.room);
      self.leaveRoom(user, user.socket);
      self.addToRoom(user, user.socket, roomName);
    });

  };

  self.leaveRoom = function(user, socket) {
    var currentRoom = user.socket.chat.room;
console.log('leaveRoom');
console.log("CURRENTROOM: ", currentRoom);
console.log("USER: ", user.username);
    ChatroomModel.find({}, function( err, chatrooms ) {
      if (!err) {
        console.log( "CHATROOOOOOOMs", chatrooms );
        // emits updated online usernames array to chatclient
        socket.emit("rooms", chatrooms);
         socket.broadcast.to(currentRoom).emit('userLeft', user.username);
      } else {
        return console.log( err );
      }
    });
  };

  self.addToRoom = function(user, socket, roomName) {
console.log("ADDTOROOM!!!: ", roomName);
    socket.join(roomName);
    socket.chat.room = roomName;
    socket.emit('setRoom', roomName);
    self.getChats(socket, roomName);
console.log("io.sockets.adapter.rooms:  ", self.io.sockets.adapter.rooms);
    socket.broadcast.to(roomName).emit('userJoined', user.username);
  };


  self.getChats = function(socket, roomName) {
     console.log('---------------WEEEWOOOWEEEEWOOO-----------------------------------------------------------------');
    ChatroomModel.findOne({name: roomName}, function( err, chatroom ) {
      if (!err) {
        console.log('chatroom.chatlog: ', chatroom.chatlog);
        socket.emit('chatlog', chatroom.chatlog);
      } else {
        return console.log (err);
      }
    });
  };


};


// User Model
var User = function(args) {
  var self = this;
  self.socket = args.socket;
  self.username = args.username;
};

// allows export to server.js
module.exports = Server;

