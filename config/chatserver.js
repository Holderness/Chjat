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

  self.app.post('/login',
    passport.authenticate('local'),
       function(req, res) {
         // console.log('by god its alive: ', req.user);
         self.user = req.user;
         res.redirect('/#authenticated');
    });


  // app.post('/login',
  // passport.authenticate('local'),
  // function(req, res) {
  //   // If this function gets called, authentication was successful.
  //   // `req.user` contains the authenticated user.
  //   res.redirect('/users/' + req.user.username);
  // });




  self.init = function() {
    // Fired upon a connection
    self.io.on('connection', function(socket){
      console.log('a mothafucka is connected');
      socket.chat = {};
      // ManageConnection handles username validations.
      // If validations pass, sets response listeners that 
      // listen to the chatclient.
      self.manageConnection(socket);
    });
  };




  self.manageConnection = function(socket) {

    // socket.on('login', function(user) {
      // username length validation

    user = self.user;
    if (user) {
                                    // console.log('by god its manageConnection: ', user);
                                    // console.log('by god its userID: ', user._id);
     
      return UserModel.findById(user._id, function(err, user) {
        if (err) { console.log(err); return; }
        // console.log("user found: ", user);
        self.setResponseListeners(user, socket);
        self.addToRoom(user, socket, 'DOO');
        socket.emit("welcome");
            console.log('----------------------vug------------------------------');
        return user;
      });
    }

      // // var newUser = new User({ 
      // //   username: user.username, 
      // //   socket: socket,
      // // });
      //   //pushes User model to online user array
      //   // self.users.push(newUser);

      //   // calls method below
      //   self.setResponseListeners(newUser);

      //   // joins default room
      //   self.addToRoom(newUser, socket, 'DOO');

      //   // emits 'welcome' and 'userJoined' to the chatclient
      //   socket.emit("welcome");
      //   // self.io.sockets.emit("userJoined", newUser.username);
    // });
  };
    


  self.setResponseListeners = function(user, socket) {

    // listens for a user socket to disconnect, removes that user
    // from the online user array
    socket.on('disconnect', function() {
      console.log('->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      // self.users.splice(self.users.indexOf(user), 1);
      self.io.sockets.emit("userLeft", user.username);
      self.leaveRoom(user, socket);
      console.log('he gone.');
    });

    // listens to the 'onlineUsers' event, updates the online users array on
    // a change from the client.
    socket.on("getOnlineUsers", function() {
      // creates new array of online usernames
      // console.log("SELF.USERS: ", self.users);


        ChatroomModel.findOne({ name: socket.chat.room }, function(err, chatroom) {
          if (!err) {
            chatroom.onlineUsers.push( user );
            chatroom.save(function(err) {
              if (err) { return console.log( err );}
            });
            // return res.send( chatroom );
            socket.emit(chatroom.name + "'s onlineUsers", chatroom.onlineUsers);
          } else {
            return console.log( err );
          }
        });

      // var users = _.map(self.users, function(user) {
      //   return user.username;
      // });
      // // emits updated online usernames array to chatclient
      // socket.emit("usersInfo", users);
    });

    socket.on("rooms", function() {
      console.log('rooms');
      ChatroomModel.find(function( err, chatrooms ) {
        if (!err) {
          socket.emit("rooms", chatrooms);
        } else {
          return console.log( err );
        }
      });
    });

    // listening for a 'chat' event from client, 
    // if there is a chat event, emit an object containing the username
    // and chat message to the collection of sockets connected to the server.
    // Basically, this does the job of 'broadcast'.
    socket.on("chat", function(chat) {
      console.log('----------------------------------------');
      console.log("USER: ", user.username);
      console.log('CHAT: ', chat);
      console.log('socket.CHAT.ROOM ', socket.chat.room);
      console.log('self.io.sockets.adapter.rooms: ', self.io.sockets.adapter.rooms);
      var timestamp = _.now();
      if (chat) {
        ChatroomModel.findOne({ name: socket.chat.room }, function(err, chatroom) {
          if (!err) {
            chatroom.chatlog.push( { room: socket.chat.name, sender: user.username, message: chat } );
            chatroom.save(function(err) {
              if (err) { return console.log( err );}
            });
            // return res.send( chatroom );
            self.io.sockets.to(socket.chat.room).emit("chat", { room: socket.chat.room, sender: user.username, message: chat, timestamp: timestamp});
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
    socket.on("typing", function() {
      socket.broadcast.emit("typing", { username: user.username });
    });
    socket.on("stop typing", function() {
      socket.broadcast.emit("stop typing");
    });

    // joins user to a room
    socket.on('joinRoom', function(roomName) {
      console.log('**********************************************************************');
      console.log('JOIN ROOM: ', roomName)
      console.log('USER: ', user)
    console.log('**********************************************************************');
      socket.leave(socket.chat.room);
      self.leaveRoom(user, socket);
      self.addToRoom(user, socket, roomName);
    });

    socket.on('getChatroomModel', function(name) {
        ChatroomModel.findOne({ name: name }, function(err, chatroom) {
          if (!err) {
            // return res.send( chatroom );
            socket.emit("ChatroomModel", chatroom);
          } else {
            return console.log( err );
          }
        });
    });

  };




  self.leaveRoom = function(user, socket) {

    console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%');
    var currentRoom = socket.chat.room;
    console.log('leaveRoom: ', currentRoom);
    // console.log("USER: ", user.username);
    ChatroomModel.update({ name: currentRoom }, {$pull: {'onlineUsers': {username: user.username}}}, function(err, model) {
    if (err) {return console.log(err);} });


    //    { $pull: { 'comments': {  _id: comment_id } } },function(err,model){
    //   if(err){
    //     console.log(err);
    //     return res.send(err);
    //     }
    //     return res.json(model);
    // });
        //   ChatroomModel.findOne({ name: roomName }, function(err, chatroom) {
        //   if (!err) {
        //     _.find(chatroom.onlineUsers, function(item) { return item.username === user.username }
        //     var index = _.indexOf(chatroom.onlineUsers, {"username": user.username});
        //     chatroom.onlineUsers.splice(index, 1);
        //     chatroom.save(function(err) {
        //       if (err) { return console.log( err );}
        //     });
        //     // return res.send( chatroom );
        //     // socket.emit(roomName + "'s onlineUsers", chatroom.onlineUsers);
        //   } else {
        //     return console.log( err );
        //   }
        // });
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
    console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$');
    console.log("ADDTOROOM!!!: ", roomName);
    socket.join(roomName);
    socket.chat.room = roomName;
    ChatroomModel.update({ name: roomName}, {$push: {'onlineUsers': user }}, function(err, model) {
    if (err) {return console.log(err);} });
      // ChatroomModel.findOne({ name: roomName }, function(err, chatroom) {
      //     if (!err) {
      //       chatroom.onlineUsers.push( user );
      //       chatroom.save(function(err) {
      //         if (err) { return console.log( err );}
      //       });
      //       // return res.send( chatroom );
      //       socket.emit(roomName + "'s onlineUsers", chatroom.onlineUsers);
      //     } else {
      //       return console.log( err );
      //     }
      //   });
    socket.emit('setRoom', roomName);
    self.getChats(socket, roomName);
    // console.log("io.sockets.adapter.rooms:  ", self.io.sockets.adapter.rooms);
    socket.broadcast.to(roomName).emit('userJoined', user.username);
  };




  self.getChats = function(socket, roomName) {
     console.log('---------------WEEEWOOOWEEEEWOOO-----------------------------------------------------------------');
    ChatroomModel.findOne({name: roomName}, function( err, chatroom ) {
      if (!err) {
        // console.log('chatroom.chatlog: ', chatroom.chatlog);
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
  self._id = args._id;
  self.provider = args.provider;
  self.email = args.email;
  self.socket = args.socket;
  self.username = args.username;
  self.name = args.name;
  self.password = args.password;
};

// allows export to server.js
module.exports = Server;





