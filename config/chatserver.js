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

  // Server
  var self = this;

  // io from server.js
  self.io = options.io;

  self.app = options.app;

  // server's online user list
  self.users = [];



  // self.app.post('/login',
  //   passport.authenticate('local'),
  //      function(req, res) {
  //        // console.log('by god its alive: ', req.user);
  //        self.user = req.user;
  //        res.redirect('/#authenticated');
  //   });




  self.init = function() {
    // Fired upon a connection
    self.io.on('connection', function(socket){
      console.log('a mothafucka is connected');
      self.socket = socket;
      socket.chat = {};
      socket.send('pong');
      console.log('socketTTT', socket.id);
      // socket.emit('welcome');
      // socket.emit('log');
          // Accept a login event with user's data
    socket.on("login", function(userdata) {
      console.log('>>>>>userdata: ', userdata);
      socket.handshake.session.userdata = userdata;
      self.manageConnection(socket, userdata);
      
    });
    socket.on("logout", function(userdata) {
        if (socket.handshake.session.userdata) {
            delete socket.handshake.session.userdata;
        }
    });


      // ManageConnection handles username validations.
      // If validations pass, sets response listeners that 
      // listen to the chatclient.

    });
  };




  self.manageConnection = function(socket, userdata) {

     var newUser = new User({
        username: userdata.username,
        socket: socket
      });

     console.log('new user socketid: --------------- ', socket.id);

      self.setResponseListeners(newUser);

    console.log('socket.handshake.session:', socket.handshake.session);
    // // socket.on('login', function(user) {
    //   // username length validation
    // console.log('socket.handshake.session.userdata----', socket.handshake.session.userdata);
    // user = self.user;
    // if (user) {
    //                                 // console.log('by god its manageConnection: ', user);
    //                                 // console.log('by god its userID: ', user._id);
    //   // var newUser = new User({ 
    //   //   _id: user._id,
    //   //   username: user.username,
    //   //   name: user.name,
    //   //   password: user.password,
    //   //   provider: user.provider,
    //   //   email: user.email,
    //   //   socket: socket,
    //   // });

    //  console.log('user . . . ', user);
    //   return UserModel.findById(user._id, function(err, user) {
    //     if (err) { console.log(err); return; }
    //     console.log("user found: ", user);
    //     self.setResponseListeners(user, socket);
    //         console.log('----------------------vug------------------------------');
    //     return user;
    //   });
    // }




  };
    


  self.setResponseListeners = function(user) {

    // listens for a user socket to disconnect, removes that user
    // from the online user array
    user.socket.on('disconnect', function() {
      console.log('->>>>>>>>>>>>>>>>>>>>DISCONNECTING>>>>>>>>>>>>>>>>>>>>>>>>');
      // self.users.splice(self.users.indexOf(user), 1);
      self.io.sockets.emit("userLeft", user.username);
      self.leaveRoom(user);
      console.log("user leaving: ", user.username);
      console.log('he gone.');
    });

    // listens to the 'onlineUsers' event, updates the online users array on
    // a change from the client.
    // user.socket.on("getOnlineUsers", function() {
    //   // creates new array of online usernames
    //   // console.log("SELF.USERS: ", self.users);


    //     ChatroomModel.findOne({ name: user.socket.chat.room }, function(err, chatroom) {
    //       if (!err) {
    //         chatroom.onlineUsers.push( user );
    //         chatroom.save(function(err) {
    //           if (err) { return console.log( err );}
    //         });
    //         // return res.send( chatroom );
    //         user.socket.emit(chatroom.name + "'s onlineUsers", chatroom.onlineUsers);
    //       } else {
    //         return console.log( err );
    //       }
    //     });

    //   // var users = _.map(self.users, function(user) {
    //   //   return user.username;
    //   // });
    //   // // emits updated online usernames array to chatclient
    //   // socket.emit("usersInfo", users);
    // });

    // user.socket.on("rooms", function() {
    //   console.log('rooms');
    //   ChatroomModel.find(function( err, chatrooms ) {
    //     if (!err) {
    //       user.socket.emit("rooms", chatrooms);
    //     } else {
    //       return console.log( err );
    //     }
    //   });
    // });

    user.socket.on("connectToRoom", function(name) {
      console.log('>>>>>>>>>>>>user sockeeeeeee: ', user.socket.id);
      self.addToRoom(user, name);
      console.log('-------------------CONNECT TO ROOM -----------------------');
      user.socket.emit("welcome");
    });

    // listening for a 'chat' event from client, 
    // if there is a chat event, emit an object containing the username
    // and chat message to the collection of sockets connected to the server.
    // Basically, this does the job of 'broadcast'.
    user.socket.on("chat", function(chat) {
      console.log('----------------------------------------');
      console.log("USER: ", user.username);
      console.log('CHAT: ', chat);
      console.log('user.socket.CHAT.ROOM ', user.socket.chat.room);
      console.log('self.io.sockets.adapter.rooms: ', self.io.sockets.adapter.rooms);
      var timestamp = _.now();
      if (chat) {
        ChatroomModel.findOne({ name: user.socket.chat.room }, function(err, chatroom) {
          if (!err) {
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
      console.log('**********************************************************************');
      console.log('JOIN ROOM: ', roomName);
      console.log('USER: ', user);
      console.log('**********************************************************************');
      user.socket.leave(user.socket.chat.room);
      self.leaveRoom(user);
      self.addToRoom(user, roomName);
    });

    user.socket.on('getChatroomModel', function(name) {
        ChatroomModel.findOne({ name: name }, function(err, chatroom) {
          if (!err) {
            // return res.send( chatroom );
            user.socket.emit("ChatroomModel", chatroom);
          } else {
            return console.log( err );
          }
        });
    });

  };




  self.leaveRoom = function(user) {

    console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%');
    var currentRoom = user.socket.chat.room;
    console.log("user leaving: ", user.username);
    console.log('leaveRoom: ', currentRoom);
    // console.log("USER: ", user.username);
    ChatroomModel.update({ name: currentRoom },
      {$pull: {'onlineUsers': {username: user.username}}},
      function(err, model) {
        ChatroomModel.find({}, function( err, chatrooms ) {
          if (!err) {
            console.log( "CHATROOOOOOOMs", chatrooms );
             // emits updated online usernames array to chatclient
            user.socket.emit("rooms", chatrooms);
            user.socket.broadcast.to(currentRoom).emit('userLeft', user.username);
          } else {
            return console.log( err );
          }
        });
        if (err) {return console.log(err);}
      });

  };





  self.addToRoom = function(user, roomName) {
    console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$');
    console.log("ADDTOROOM!!!: ", roomName);
    console.log('usersocketid: ', user.socket.id);
    user.socket.join(roomName);
    user.socket.chat.room = roomName;
    ChatroomModel.update({ name: roomName}, {$push: {'onlineUsers': user.username }}, function(err, model){
      if (err) { return console.log(err); }
    });
    user.socket.emit('setRoom', roomName);
    self.getChatsAndUsers(user, roomName);
    self.getChatrooms(user.socket);
    // console.log("io.sockets.adapter.rooms:  ", self.io.sockets.adapter.rooms);
    user.socket.broadcast.to(roomName).emit('userJoined', user.username);
  };




  self.getChatsAndUsers = function(user, roomName) {
     console.log('--------------getChatsAndUsers-------------------------------------------------------------');

    ChatroomModel.findOne({name: roomName}, function( err, chatroom ) {
      if (!err) {
        console.log('socketid: ', user.socket.id);
        console.log('chatroom: ', chatroom);
        console.log('user: ', user.username);
        user.socket.emit('chatlog', chatroom.chatlog);
        user.socket.emit('aonlineUsers', chatroom.onlineUsers);
      } else {
        return console.log (err);
      }
    });
  };
  self.getChatrooms = function(socket) {
     console.log('--------------getChatrooms------------------------------------------------------------');
    ChatroomModel.find({}, function( err, chatrooms ) {
      if (!err) {
        // console.log('chatroom.chatlog: ', chatroom.chatlog);
        socket.emit('achatrooms', chatrooms);
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



