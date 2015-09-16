_ = require('underscore');
var express = require('express'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    bodyParser = require('body-parser');


var chatroom = require('../app/controllers/chatroom');

console.log('chatserver');

var UserModel = mongoose.model('User');
var ChatroomModel = mongoose.model('Chatroom');
var DirectMessageModel = mongoose.model('DirectMessage');


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
      socket.chat = { room: 'Parlor' };

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

        // user.socket.on('wut', function() {
    //   user.socket.disconnect();
    // });

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

    user.socket.on("connectToRoom", function(name) {
      console.log('e.connectToRoom');
      console.log('user.socket.id: ', user.socket.id);
      self.addToRoom(user, name);
    });

    user.socket.on("chat", function(chat) {
      console.log('e.chat');
      console.log("USER: ", user);
      console.log('CHAT: ', chat);
      var timestamp = _.now();
      if (chat) {
        ChatroomModel.findOne({ name: user.socket.chat.room }, function(err, chatroom) {
          if (!err) {
              console.log('1chat.url', chat.url);
              chatroom.chatlog.push( { room: user.socket.chat.name, sender: user.username, message: chat.message, url: chat.url } );
              chatroom.save(function(err) {
                if (err) { return console.log( err );}
              });
              self.io.sockets.to(user.socket.chat.room).emit("chat", { room: user.socket.chat.room, sender: user.username, message: chat.message, url: chat.url, timestamp: timestamp});
          } else {
            return console.log( err );
          }
        });
      } else {
        return console.log( err );
      }
    });

    user.socket.on("directMessage", function(message) {
      console.log('e.directMessage');
      console.log("USER: ", user);
      console.log('MESSAGE: ', message);
      var timestamp = _.now();
      if (message) {
        DirectMessageModel.findOne({ _id: user.socket.chat.directMessage }, function(err, DM) {
          if (!err) {
              console.log('message.url', message.url);
              DM.chatlog.push( { sender: user.username, message: message.message, url: message.url } );
              DM.save(function(err) {
                if (err) { return console.log( err );}
              });
              self.io.sockets.to(user.socket.chat.directMessage).emit("directMessage", { sender: user.username, message: message.message, timestamp: timestamp, url: message.url});
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
      console.log("USER: ", user.username);
      console.log('ROOMNAME: ', roomName);
      user.socket.leave(user.socket.chat.room);
      self.leaveRoom(user);
      self.addToRoom(user, roomName);
    });

    user.socket.on('addRoom', function(name) {
      console.log('addRoom name: ', name);
      console.log('addRoom user: ', user.username);
      self.addUserToRoom(user, name);
    });


    user.socket.on('removeRoom', function(name) {
      console.log('removeRoom name: ', name);
      console.log('removeRoom user: ', user.username);
      self.removeUserFromRoom(user, name);
    });


    user.socket.on('createRoom', function(formData) {
      console.log('createRoom formData: ', formData);
      console.log('createRoom user: ', user.username);
      self.createRoom(user, formData);
    });

    user.socket.on('destroyRoom', function(name) {
      console.log('destroyRoom name: ', name);
      console.log('destroyRoom user: ', user.username);
      self.destroyRoom(user, name);
    });

    user.socket.on('getMoreChats', function(chatReq) {
      self.getMoreChats(user, chatReq.name, chatReq.numberLoaded, chatReq.chatlogLength);
    });

    user.socket.on('doesChatroomExist', function(chatroomQuery) {
      self.doesChatroomExist(user, chatroomQuery);
    });

    user.socket.on('initDirectMessage', function(recipient) {
      self.initDirectMessage(user, recipient);
    });

  };  // end setChatListeners


   
  self.initDirectMessage = function(user, recipient) {
    console.log('initDirectMessage');
    console.log('recipient: ', recipient);
    DirectMessageModel.findOne({'participants': {'$all': [{"username": user.username}, {"username": recipient}]}}, function(err, DM) {
      if (DM) {
        console.log('this is the DM', DM);
        self.connectToDirectMessage(user, DM._id);
        user.socket.emit('setDirectMessageChatlog', DM.chatlog);
        user.socket.emit('setDirectMessageHeader', {'name': recipient, 'owner': null, 'currentUser': user.username});
      } else {
        var newDirectMessage = new DirectMessageModel({'participants': [{'username': user.username}, {'username': recipient}]});
        newDirectMessage.save(function(err, DM) {
           if (!err) {
             console.log('DM created');
             self.connectToDirectMessage(user, DM._id);
             user.socket.emit('setDirectMessageChatlog', DM.chatlog);
             user.socket.emit('setDirectMessageHeader', {'name': recipient, 'owner': null, 'currentUser': user.username});
           } else {
             console.log('DM not created', err);
           }
        });
      }
    });
  };

  self.connectToDirectMessage = function(user, DMid) {
    user.socket.leave(user.socket.chat.room);
    console.log('f.connectToDirectMessage');
    console.log('DMid: ', DMid);
    self.leaveRoom(user);
    user.socket.join(DMid);
    user.socket.chat.directMessage = DMid;
    // user.socket.chat.room = null;
    // DirectMessageModel.findOne({'_id': DMid}, function(err, DM) {
    //   if (!err) {

    //   } else {
    //     console.log(err);
    //   }
    // });
  };


  // self.addToRoom = function(user, roomName) {
  //   console.log("f.addToRoom: ", roomName);
  //   user.socket.join(roomName);
  //   user.socket.chat.room = roomName;
  //   console.log('user socket id: ', user.socket.id);
  //   ChatroomModel.update({ name: roomName},
  //     {$push: {'onlineUsers': { username: user.username }}},
  //     function(err, raw){
  //       if (err) { return console.log(err); }
  //       ChatroomModel.findOne({ name: roomName }, function( err, chatroom ) {
  //         if (err) {return console.log(err);}
  //         self.getUsersAndHeader(user, roomName);
  //         self.getChatrooms(user, user.socket);
  //         var offlineUsers = _.filter(chatroom.participants, function(obj){ return !_.findWhere(chatroom.onlineUsers, obj); });
  //         user.socket.broadcast.to(roomName).emit('userJoined', user.username);
  //         user.socket.broadcast.to(roomName).emit('onlineUsers', chatroom.onlineUsers);
  //         user.socket.broadcast.to(roomName).emit('offlineUsers', offlineUsers);
  //       });
  //     });
  // };





    self.doesChatroomExist = function(user, chatroomQuery) {
      console.log('chatroomQuery: ', chatroomQuery);
      ChatroomModel.findOne({ name: chatroomQuery }, function(err, chatroom) {
        if (!chatroom) {
          user.socket.emit('chatroomAvailability', true);
        } else {
          user.socket.emit('chatroomAvailability', false);
        }
      });
    };

// controller

   self.createRoom = function(user, formData) {
      ChatroomModel.findOne({ name: formData.name }, function(err, chatroom) {
        if (!chatroom) {
          var newChatroom = new ChatroomModel({name: formData.name, owner: user.username});
          newChatroom.save(function(err) {
            if (!err) {
              self.addUserToRoom(user, formData.name);
              self.leaveRoom(user);
              self.addToRoom(user, formData.name);
            } else {
              console.log(err);
            }
          });
        } else {
          user.socket.emit('chatroomAlreadyExists');
        }
      });
   };


    self.destroyRoom = function(user, chatroomName) {
      ChatroomModel.remove({name: chatroomName}, function(err) {
        if (!err) {
          user.socket.emit('roomDestroyed', chatroomName);
        } else {
          return console.log( err );
        }
      });
    };

    self.addUserToRoom = function(user, chatroomName) {
      ChatroomModel.update({name: chatroomName}, { $push: {'participants': {'username': user.username} }}, function(err, raw) {
            if (!err) {
              console.log('userchatrooms', raw);
              self.getChatrooms(user, user.socket);
            } else {
              return console.log( err );
            }
      });
    };

    self.removeUserFromRoom = function(user, chatroomName) {
      ChatroomModel.update({name: chatroomName}, { $pull: { 'participants': {'username': user.username }}}, function(err, raw) {
            if (!err) {
              console.log('userchatrooms', raw);
              self.getChatrooms(user, user.socket);
            } else {
              return console.log( err );
            }
      });
    };



  self.leaveRoom = function(user) {
    var currentRoom = user.socket.chat.room;
    console.log("f.leaveRoom: ", currentRoom);
    // console.log('--------------leavroom socket-------------', user.socket);
    console.log('user leaving: ', user.username);
    if (user.socket.chat.room) {
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
    }
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
        user.socket.emit('chatlog', chatroom.chatlog.slice(-25));
        user.socket.emit('onlineUsers', chatroom.onlineUsers);
        user.socket.emit('offlineUsers', offlineUsers);
        user.socket.emit('chatroomHeader', {name: roomName, owner: chatroom.owner, currentUser: user.username, chatlogLength: chatroom.chatlog.length, numberLoaded: -1});
      } else {
        return console.log (err);
      }
    });
  };

  self.getMoreChats = function(user, name, numberLoaded, chatlogLength) {
    var items_per_load_requested = 25,
    skip = items_per_load_requested * (numberLoaded - 1);
    skipPos = skip * -1;

    var firstCheck = skipPos - chatlogLength > 0,
    secondCheck = skipPos - chatlogLength <= items_per_load_requested,
    items_per_load = (firstCheck && secondCheck) ? (items_per_load_requested - (skipPos - chatlogLength)) : items_per_load_requested;
    console.log('firstCheck: ', firstCheck);
    console.log('secondCheck: ', secondCheck);
    console.log('items_per_load: ', items_per_load);

    console.log('name: ', name);
    console.log('skip: ', skip);
    console.log('numberloaded: ', numberLoaded);
     // if ( skipPos - chatlogLength > 0 && skipPos - chatlogLength <= items_per_load) {
     //    items_per_load = skipPos - chatlogLength;
     // }
    ChatroomModel.findOne({ name: name }, {'chatlog': { $slice: [skip, items_per_load] }}, function( err, chatroom ) {
      console.log('chatlogLength: ', chatlogLength);
      console.log('skipPos: ', skipPos);
              console.log('chatlog: ', chatroom.chatlog);
        console.log('chatroom.chatlog.length: ', chatroom.chatlog.length);
      if (chatlogLength >= skipPos) {
        user.socket.emit('moreChats', chatroom.chatlog);
      } else if (skipPos - chatlogLength <= items_per_load && skipPos - chatlogLength >= 1){
        user.socket.emit('moreChats', chatroom.chatlog);
      } else {
        console.log('-------------------------------');
        user.socket.emit('noMoreChats');
      }
    });
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



