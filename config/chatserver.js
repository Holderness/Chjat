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

    UserModel.findOne({'username': userdata.username}, function(err, userModel) {
      
      var newUser = new User({
        username: userdata.username,
        socket: socket,
        userImage: userModel.userImage,
        id: userModel._id,
      });
      console.log('----0000---: ', newUser);
      socket.emit('login', newUser.username);
      self.setResponseListeners(newUser);
    });




  };
    


  self.setResponseListeners = function(user) {

        // user.socket.on('wut', function() {
    //   user.socket.disconnect();
    // });

    user.socket.on('disconnect', function() {
      self.io.sockets.emit("userLeft", { username: user.username, userImage: user.userImage });
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
      console.log('e.removeRoom');
      console.log('removeRoom name: ', name);
      console.log('removeRoom user: ', user.username);
      self.removeUserFromRoom(user, name);
    });


    user.socket.on('createRoom', function(formData) {
      console.log('e.createRoom');
      console.log('createRoom formData: ', formData);
      console.log('createRoom user: ', user.username);
      self.createRoom(user, formData);
    });

    user.socket.on('destroyRoom', function(name) {
      console.log('e.destroyRoom');
      console.log('destroyRoom name: ', name);
      console.log('destroyRoom user: ', user.username);
      self.destroyRoom(user, name);
    });

    user.socket.on('getMoreChats', function(chatReq) {
      console.log('e.getMoreChats');
      self.getMoreChats(user, chatReq.name, chatReq.modelsLoadedSum, chatReq.chatlogLength);
    });

    user.socket.on('getMoreDirectMessages', function(directMessageReq) {
      console.log('e.getMoreDirectMessages');
      self.getMoreDirectMessages(user, directMessageReq.id, directMessageReq.modelsLoadedSum, directMessageReq.chatlogLength);
    });

    user.socket.on('doesChatroomExist', function(chatroomQuery) {
      console.log('e.doesChatroomExist');
      self.doesChatroomExist(user, chatroomQuery);
    });

    user.socket.on('initDirectMessage', function(recipient) {
      console.log('e.initDirectMessage');
      self.initDirectMessage(user, recipient);
    });

  };  // end setChatListeners


   
  self.initDirectMessage = function(user, recipient) {
    console.log('initDirectMessage');
    console.log('recipient: ', recipient);
    DirectMessageModel.findOne({'participants': {'$all': [{"username": user.username}, {"username": recipient.username}]}}, function(err, DM) {
      if (DM) {
        console.log('this is the DM', DM);
        self.connectToDirectMessage(user, DM._id);
        user.socket.emit('setDirectMessageChatlog', DM.chatlog.slice(-25));
        user.socket.emit('setDirectMessageHeader', {id: DM._id, 'name': recipient.username, 'owner': null, 'currentUser': user.username, chatlogLength: DM.chatlog.length, modelsLoadedSum: -1, chatType: 'message', roomImage: recipient.userImage});
      } else {
        var newDirectMessage = new DirectMessageModel({'participants': [{'username': user.username, 'userImage': user.userImage}, {'username': recipient.username}]});
        newDirectMessage.save(function(err, DM) {
           if (!err) {
             console.log('DM created');
             self.connectToDirectMessage(user, DM._id);
             user.socket.emit('setDirectMessageChatlog', DM.chatlog.slice(-25));
             user.socket.emit('setDirectMessageHeader', {id: DM._id, 'name': recipient.username, 'owner': null, 'currentUser': user.username, chatlogLength: DM.chatlog.length, modelsLoadedSum: -1, chatType: 'message', roomImage: recipient.userImage});
           } else {
             console.log('DM not created', err);
           }
        });
      }
    });
  };

  self.connectToDirectMessage = function(user, DMid) {
    console.log('f.connectToDirectMessage');
    console.log('DMid: ', DMid);
    user.socket.leave(user.socket.chat.room);

    self.leaveRoom(user);
    user.socket.join(DMid);
    user.socket.chat.directMessage = DMid;
  };





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
          var newChatroom = new ChatroomModel({name: formData.name, owner: user.username, roomImage: formData.roomImage});
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
      ChatroomModel.update({name: chatroomName}, { $push: {'participants': {'username': user.username, 'userImage': user.userImage } }}, function(err, raw) {
            if (!err) {
              console.log('userchatrooms', raw);
              self.getChatrooms(user, user.socket);
            } else {
              return console.log( err );
            }
      });
    };

    self.removeUserFromRoom = function(user, chatroomName) {
      ChatroomModel.update({name: chatroomName}, { $pull: { 'participants': {'username': user.username, 'userImage': user.userImage }}}, function(err, raw) {
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
      {$pull: {'onlineUsers': {username: user.username, userImage: user.userImage}}},
      function(err, raw) {
        if (err) {return console.log(err);}
        user.socket.broadcast.to(currentRoom).emit('userLeft', { username: user.username, userImage: user.userImage });
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
      {$push: {'onlineUsers': { username: user.username, userImage: user.userImage}}},
      function(err, raw){
        if (err) { return console.log(err); }
        ChatroomModel.findOne({ name: roomName }, function( err, chatroom ) {
          if (err) {return console.log(err);}
          self.getUsersAndHeader(user, roomName);
          self.getChatrooms(user, user.socket);
          var offlineUsers = _.filter(chatroom.participants, function(obj){ return !_.findWhere(chatroom.onlineUsers, obj); });
          // console.log('###################');
          //           console.log('offlineusers: ', offlineUsers);
          // console.log('onlineUsers: ', chatroom.onlineUsers);
          //           console.log('###################');

          user.socket.broadcast.to(roomName).emit('userJoined', { username: user.username, userImage: user.userImage });
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
        // console.log('participants: ', chatroom.participants);
        // console.log('oonlneinusers: ', chatroom.onlineUsers);
        // console.log('offlineusers: ', offlineUsers);
        user.socket.emit('chatlog', chatroom.chatlog.slice(-25));
        user.socket.emit('onlineUsers', chatroom.onlineUsers);
        user.socket.emit('offlineUsers', offlineUsers);
        user.socket.emit('chatroomHeader', {name: roomName, roomImage: chatroom.roomImage, owner: chatroom.owner, currentUser: user.username, chatlogLength: chatroom.chatlog.length, modelsLoadedSum: -1});
      } else {
        return console.log (err);
      }
    });
  };

  self.getMoreChats = function(user, name, modelsLoadedSum, chatlogLength) {
    var MODELS_PER_LOAD = 25,
    MODELS_SKIPPED = MODELS_PER_LOAD * (modelsLoadedSum - 1),
    MODELS_REMAINDER = MODELS_PER_LOAD + (MODELS_SKIPPED + chatlogLength),
    remainderCheck = MODELS_REMAINDER >= 1 && MODELS_REMAINDER < 25,
    items_per_load = (remainderCheck) ? MODELS_REMAINDER : MODELS_PER_LOAD;

    ChatroomModel.findOne({ name: name }, {'chatlog': { $slice: [MODELS_SKIPPED, items_per_load] }}, function( err, chatroom ) {
      console.log('chatroomLength: ', chatlogLength);
      if (chatlogLength >= (MODELS_SKIPPED * -1) || remainderCheck) {
        user.socket.emit('moreChats', chatroom.chatlog);
      } else {
        // console.log('-------------------------------');
        user.socket.emit('noMoreChats');
      }
    });
  };

  self.getMoreDirectMessages = function(user, id, modelsLoadedSum, chatlogLength) {
    var MODELS_PER_LOAD = 25,
    MODELS_SKIPPED = MODELS_PER_LOAD * (modelsLoadedSum - 1),
    MODELS_REMAINDER = MODELS_PER_LOAD + (MODELS_SKIPPED + chatlogLength),
    remainderCheck = MODELS_REMAINDER >= 1,
    items_per_load = (remainderCheck) ? MODELS_REMAINDER : MODELS_PER_LOAD;

    DirectMessageModel.findOne({ _id: id }, {'chatlog': { $slice: [MODELS_SKIPPED, items_per_load] }}, function( err, chatroom ) {
      if (chatlogLength >= (MODELS_SKIPPED * -1) || remainderCheck) {
        user.socket.emit('moreChats', chatroom.chatlog);
      } else {
        // console.log('-------------------------------');
        user.socket.emit('noMoreChats');
      }
    });
  };



  self.getChatrooms = function(user, socket) {
    console.log('f.getChatrooms');
    ChatroomModel.find({ 'participants.username': user.username}, 'name owner roomImage', function( err, chatrooms ) {
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
  self.userImage = args.userImage;
  self.id = args.id;
};

// allows export to server.js
module.exports = Server;



