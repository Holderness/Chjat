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
      // console.log('a mothafucka is connected', socket.handshake);
      // console.log('>>>>socket', socket.handshake.sessionStore);

      self.socket = socket;
      // console.log('SOCKET:            ', socket);
      socket.chat = { room: 'DOO' };

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

      console.log('LLLLLLLLLLLL > socket.handshake.session', socket.handshake.session);

              
      if (socket.handshake.session.passport.user) {
        console.log(socket.handshake.session);
        UserModel.findById(socket.handshake.session.passport.user, function(err, found) {
          socket.handshake.session.userdata = { username: found.username };
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
    socket.emit('login', newUser.username);
    self.setResponseListeners(newUser);
  };
    


  self.setResponseListeners = function(user) {

    user.socket.on('disconnect', function() {
      self.io.sockets.emit("userLeft", user.username);
      self.leaveRoom(user);

      // if (user.socket.handshake.session) {
      //     user.socket.handshake.session.passport = {};
      //     user.socket.handshake.session.userdata = {};
      //   }
        // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', self.io.sockets);
      // if (self.io.sockets.sockets[user.socket.id]) {
      //    self.io.sockets.sockets[user.socket.id].disconnect();
      // }
      // console.log('user.SOCKET-SRL:            ', user.socket);
      console.log("e.disconnect: ", user.username);
      console.log('he gone.');
    });

    // user.socket.on('wut', function() {
    //   user.socket.disconnect();
    // });

    user.socket.on("connectToRoom", function(name) {
      console.log('e.connectToRoom');
      console.log('user.socket.id: ', user.socket.id);
      self.addToRoom(user, name);
      user.socket.emit("welcome");
    });

    user.socket.on("chat", function(chat) {
      console.log('e.chat');
      console.log("USER: ", user);
      console.log('CHAT: ', chat);
      // console.log('user.socket.CHAT.ROOM ', user.socket.chat.room);
      // console.log('self.io.sockets.adapter.rooms: ', self.io.sockets.adapter.rooms);
      var timestamp = _.now();
      if (chat) {
        ChatroomModel.findOne({ name: user.socket.chat.room }, function(err, chatroom) {
          if (!err) {
            if (chat.url !== undefined && chat.url.length > 0) {
              console.log('1chat.url', chat.url);
              chatroom.chatlog.push( { room: user.socket.chat.name, sender: user.username, message: chat.message, url: chat.url } );
              chatroom.save(function(err) {
                if (err) { return console.log( err );}
              });
              self.io.sockets.to(user.socket.chat.room).emit("chat", { room: user.socket.chat.room, sender: user.username, message: chat.message, url: chat.url, timestamp: timestamp});
            } else {
              console.log('2chat.url', chat.url);
              chatroom.chatlog.push( { room: user.socket.chat.name, sender: user.username, message: chat.message, url: null } );
              chatroom.save(function(err) {
                if (err) { return console.log( err );}
              });
              self.io.sockets.to(user.socket.chat.room).emit("chat", { room: user.socket.chat.room, sender: user.username, message: chat.message, timestamp: timestamp, url: null});
            }
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
      console.log('>>>>>>>>>>>>>>>>>>>user<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
      console.log("USER: ", user.username);
      console.log('>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<<<<<<');
      console.log('JOIN ROOM: ', roomName);
      user.socket.leave(user.socket.chat.room);
      self.leaveRoom(user);
      self.addToRoom(user, roomName);
    });

    user.socket.on('addRoom', function(name) {
      console.log('addRoom name: ', name);
      console.log('addRoom user: ', user.username);
      ChatroomModel.update({name: name}, { $push: {'participants.username': user.username }}, function(err, raw) {
            if (!err) {
              console.log('userchatrooms', raw);
              self.getChatrooms(user, user.socket);
            } else {
              return console.log( err );
            }
      });
    });


    user.socket.on('removeRoom', function(name) {
      console.log('removeRoom name: ', name);
      console.log('removeRoom user: ', user.username);
      ChatroomModel.update({name: name}, { $pull: { 'participants.username': user.username }}, function(err, raw) {
            if (!err) {
              console.log('userchatrooms', raw);
              self.getChatrooms(user, user.socket);
            } else {
              return console.log( err );
            }
      });
    });



    user.socket.on('createRoom', function(formData) {
      console.log('createRoom formData: ', formData);
      console.log('createRoom user: ', user.username);
      var newChatroom = new ChatroomModel({name: formData.name, owner: user.username});
      newChatroom.save(function(err) {
        if (!err) {
            ChatroomModel.update({name: formData.name}, {$push: {'participants.username': user.username }}, function(err, raw) {
              if (!err) {
                console.log('userchatrooms', raw);
                self.getChatrooms(user, user.socket);
              } else {
                return console.log( err );
              }
            });
        } else {
          console.log(err);
        }
      });
    });

    user.socket.on('destroyRoom', function(name) {
      console.log('destroyRoom name: ', name);
      console.log('destroyRoom user: ', user.username);
      ChatroomModel.remove({name: name}, function(err) {
            if (!err) {
              user.socket.emit('roomDestroyed', name);
            } else {
              return console.log( err );
            }
      });
    });

    user.socket.on('getMoreChats', function(chatReq) {
      self.getMoreChats(user, chatReq.name, chatReq.numberLoaded, chatReq.chatlogLength);
    });

  };



  self.leaveRoom = function(user) {
    var currentRoom = user.socket.chat.room;
    console.log("f.leaveRoom: ", currentRoom);
    // console.log('--------------leavroom socket-------------', user.socket);
    console.log('user leaving: ', user.username);
    ChatroomModel.update({ name: currentRoom },
      {$pull: {'onlineUsers': {username: user.username}}},
      function(err, raw) {
        if (err) {return console.log(err);}
        user.socket.broadcast.to(currentRoom).emit('userLeft', user.username);
        ChatroomModel.findOne({ name: currentRoom }, function( err, chatroom ) {
          if (err) {return console.log(err);}
          console.log('new chatroom users: ', chatroom.onlineUsers );
          var offlineUsers = _.filter(chatroom.participants, function(obj){ return !_.findWhere(chatroom.onlineUsers, obj); });
          user.socket.broadcast.to(currentRoom).emit('onlineUsers', chatroom.onlineUsers);
          user.socket.broadcast.to(currentRoom).emit('offlineUsers', offlineUsers);
        });
      });

  };


  self.addToRoom = function(user, roomName) {
    console.log("f.addToRoom: ", roomName);
    user.socket.join(roomName);
    user.socket.chat.room = roomName;
    console.log('user socket id: ', user.socket.id);
    ChatroomModel.update({ name: roomName},
      {$push: {'onlineUsers': { username: user.username }}},
      function(err, raw){
        if (err) { return console.log(err); }
        ChatroomModel.findOne({ name: roomName }, function( err, chatroom ) {
          if (err) {return console.log(err);}
          self.getUsersAndHeader(user, roomName);
          self.getChatrooms(user, user.socket);
          var offlineUsers = _.filter(chatroom.participants, function(obj){ return !_.findWhere(chatroom.onlineUsers, obj); });
          user.socket.broadcast.to(roomName).emit('userJoined', user.username);
          user.socket.broadcast.to(roomName).emit('onlineUsers', chatroom.onlineUsers);
          user.socket.broadcast.to(roomName).emit('offlineUsers', offlineUsers);
        });
      });
  };


  self.getUsersAndHeader = function(user, roomName) {
    console.log('f.getChatsAndUsers');
    ChatroomModel.findOne({name: roomName}, function( err, chatroom ) {
      if (!err) {
        // console.log('chatroom: ', chatroom);
        var offlineUsers = _.filter(chatroom.participants, function(obj){ return !_.findWhere(chatroom.onlineUsers, obj); });
        console.log('participants: ', chatroom.participants);
        console.log('oonlneinusers: ', chatroom.onlineUsers);
        console.log('offlineusers: ', offlineUsers);
        user.socket.emit('chatlog', chatroom.chatlog.slice(-10));
        user.socket.emit('onlineUsers', chatroom.onlineUsers);
        user.socket.emit('offlineUsers', offlineUsers);
        user.socket.emit('chatroomHeader', {name: roomName, owner: chatroom.owner, currentUser: user.username, chatlogLength: chatroom.chatlog.length, numberLoaded: -1});
      } else {
        return console.log (err);
      }
    });
  };

  self.getMoreChats = function(user, name, numberLoaded, chatlogLength) {
    var items_per_load = 10,
    skip = items_per_load * (numberLoaded - 1);
    console.log('skip: ', skip);
     console.log('numberloaded: ', numberLoaded);
    // ChatroomModel.findOne({name: name}, 'chatlog', function(err, chatroom) {
    //   chatroom.chatlog.length
    // })
    ChatroomModel.findOne({ name: name }, {'chatlog': { $slice: [skip, items_per_load] }}, function( err, chatroom ) {
      console.log('chatlogLength: ', chatlogLength);
      console.log('skip math: ', (skip * -1));
      if (chatlogLength >= (skip * (-1))) {
        var moreChats = chatroom.chatlog;
        console.log('getMoreChats: ', chatroom.chatlog);
        user.socket.emit('moreChats', moreChats);
      } else {
        console.log('-------------------------------');
        user.socket.emit('noMoreChats');
      }
    });
    // ChatroomModel.aggregate([
    //   {$match: { name: name }},
    //   {$sort: {'chatlog.timestamp':   1}}], function( err, chatroom ) {
    //   console.log('getMoreChats: ', chatroom[0].chatlog);
    //   // user.socket.emit('moreChats', chatroom);
    // });
  };


  self.getChatrooms = function(user, socket) {
    console.log('f.getChatrooms');
    ChatroomModel.find({ 'participants.username': user.username}, 'name owner', function( err, chatrooms ) {
      if (!err) {
        console.log('chatrooms', chatrooms);
        socket.emit('chatrooms', chatrooms);
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



