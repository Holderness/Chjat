_ = require('underscore');
var express = require('express'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    bodyParser = require('body-parser');

var chatroom = require('../app/controllers/chatroom');

var UserModel = mongoose.model('User'),
    ChatroomModel = mongoose.model('Chatroom'),
    DirectMessageModel = mongoose.model('DirectMessage');


console.log('chatserver');
// the chatserver listens to the chatclient
var Server = function(options) {

    //   ChatroomModel.findOne({ name: 'Parlor' }, function(err, chatroom) {
    //     console.log('chatroomparlorcreateion:', chatroom);
    //   if (chatroom === null) {
    //     var Parlorr = new ChatroomModel({'name': 'Parlor'});
    //     Parlorr.save(function(err) {
    //       if (err) { return console.log( err );}
    //     });
    //     console.log('parlor created1');
    //   } else if (!err) {
    //     console.log('parlor already exists');
    //   } else {
    //     var Parlor = new ChatroomModel({'name': 'Parlor'});
    //     Parlor.save(function(err) {
    //       if (err) { return console.log( err );}
    //     });
    //     console.log('parlor created2');
    //     return console.log( err );
    //   }
    // });

  var self = this;
  self.io = options.io;



  self.init = function() {
    console.log('f.init');
    self.io.on('connection', function(socket){
      //
      // uncomment for heroku
      self.io.set('polling duration', 10);
      self.io.set('transports', ['websocket']);
      //
      //
      self.socket = socket;
      console.log('vv-----------------------------------------------vv');
      console.log('socket: ', self.socket);
      console.log('-----------------------------------------------');
      console.log('socket.handshake.session.cookie: ', socket.handshake.session.cookie);
      console.log('-----------------------------------------------');
      console.log('socket.handshake.session.userdata: ', socket.handshake.session.userdata);
      console.log('-----------------------------------------------');
      console.log('socket.handshake.session.passport: ', socket.handshake.session.passport);
      console.log('^^-----------------------------------------------^^');
      socket.chat = { room: 'Parlor' };
      socket.on("login", function(userdata) {
        console.log('e.login');
        console.log('userdata: ', userdata);
        socket.handshake.session.userdata = userdata;
        self.manageConnection(socket, userdata);
      });
      socket.on("logout1", function(userdata) {
        console.log('e.disconnect1 - userdata', socket.handshake.session.userdata);
        if (socket.handshake.session.userdata) {
          delete socket.handshake.session.userdata;
        }
        console.log('e.disconnect1 - passport', socket.handshake.session.passport);
        if (socket.handshake.session.passport) {
          delete socket.handshake.session.passport;
        }
      });
      if (socket.handshake.session.passport.user) {
        console.log('if socket.handshake.session>>>>>> ', socket.handshake.session);
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
      self.initUser(socket, userModel);
      UserModel.findOneAndUpdate({_id: userModel._id}, { '$set': {'socketId': socket.id}}, function(err, userM){});
    });
  };
  
  self.initUser = function(socket, model) {
    console.log('f.initUser');
    console.log('socketID: ', socket.id);
      var newUser = new User({
        username: model.username,
        socket: socket,
        userImage: model.userImage,
        id: model._id,
        invitations: model.invitations,
        homeRoom: model.homeRoom
      });
      var initUserClient = function() {
        socket.emit('initUser', { username: newUser.username,
                            invitations: newUser.invitations,
                               homeRoom: newUser.homeRoom,
                              userImage: newUser.userImage });
      };
      self.setResponseListeners(newUser, initUserClient);
      return newUser;
  };
    

  self.setResponseListeners = function(user, callback) {
    console.log('f.setResponseListeners: ----------------------------------');


// CONNECTION
    user.socket.on('disconnect', function() {
      self.io.sockets.emit("userLeft", { username: user.username, userImage: user.userImage });
      self.leaveRoom(user);
      user.socket.disconnect();
      user.socket.handshake.session = {};
      user.socket.trigger('logout1');
      console.log("e.disconnect: ", user.username);
      console.log('he gone.');
    });
    user.socket.on("connectToRoom", function(name) {
      console.log('e.connectToRoom');
      self.addToRoom(user, name);
    });


// CHAT
    user.socket.on("chat", function(chat) {
      console.log('e.chat');
      console.log("USER: ", user);
      console.log('CHAT: ', chat);
      if (chat) {
        self.addChat(user, chat);
      } else {
        console.log('chat error: ', chat);
      }
    });
    user.socket.on('getMoreChats', function(chatReq) {
      console.log('e.getMoreChats');
      self.getMoreChats(user, chatReq.name, chatReq.modelsLoadedSum, chatReq.chatlogLength);
    });


// DIRECT MESSAGE
    user.socket.on('initDirectMessage', function(recipient) {
      console.log('e.initDirectMessage');
      self.initDirectMessage(user, recipient);
    });
    user.socket.on("directMessage", function(message) {
      console.log('e.directMessage');
      console.log("USER: ", user);
      console.log('MESSAGE: ', message);
      if (message) {
        self.addDirectMessage(user, message);
      } else {
        console.log('something went wrong: ', message);
      }
    });
    user.socket.on('getMoreDirectMessages', function(directMessageReq) {
      console.log('e.getMoreDirectMessages');
      self.getMoreDirectMessages(user, directMessageReq.id, directMessageReq.modelsLoadedSum, directMessageReq.chatlogLength);
    });


// TYPING
    user.socket.on("typing", function() {
      user.socket.broadcast.to(user.socket.chat.room).emit("typing", { username: user.username });
    });
    user.socket.on("stop typing", function() {
      user.socket.broadcast.to(user.socket.chat.room).emit("stop typing");
    });


// ROOM
    user.socket.on('joinRoom', function(roomName) {
      console.log('e.joinRoom');
      console.log("--USER: ", user.username);
      console.log('--roomName: ', roomName);
      user.socket.leave(user.socket.chat.room);
      self.leaveRoom(user);
      self.addToRoom(user, roomName);
    });
    user.socket.on('addRoom', function(name) {
      console.log('addRoom name: ', name);
      console.log('addRoom user: ', user.username);
      self.addUserToRoom(user, name);
    });
    user.socket.on('removeRoom', function(roomData) {
      console.log('e.removeRoom');
      console.log('removeRoom roomData: ', roomData);
      console.log('removeRoom user: ', user.username);
      self.removeUserFromRoom(user, roomData);
    });
    user.socket.on('createRoom', function(formData) {
      console.log('e.createRoom');
      console.log('createRoom formData: ', formData);
      console.log('createRoom user: ', user.username);
      self.createRoom(user, formData);
    });
    user.socket.on('updateRoom', function(formData) {
      console.log('e.updateRoom');
      console.log('updateRoom formData: ', formData);
      console.log('updateRoom user: ', user.username);
      self.updateRoom(user, formData);
    });
    user.socket.on('destroyRoom', function(roomInfo) {
      console.log('e.destroyRoom');
      console.log('destroyRoom roomInfo: ', roomInfo);
      console.log('destroyRoom user: ', user.username);
      self.destroyRoom(user, roomInfo);
    });


// ERROR HANDLING
    user.socket.on('doesChatroomExist', function(chatroomQuery) {
      console.log('e.doesChatroomExist');
      self.doesChatroomExist(user, chatroomQuery);
    });
    user.socket.on('doesHomeRoomExist', function(homeRoomQuery) {
      console.log('e.doesHomeRoomExist');
      self.doesHomeRoomExist(user, homeRoomQuery);
    });


// INVITATIONS
    user.socket.on('inviteUser', function(invitationObj) {
      console.log('e.inviteUser');
      self.inviteUser(user, invitationObj);
    });
    user.socket.on('deleteInvitation', function(roomId) {
      console.log('e.deleteInvitation');
      self.deleteInvitation(user, roomId);
    });
    user.socket.on('acceptInvitation', function(roomId) {
      console.log('e.acceptInvitation');
      self.acceptInvitation(user, roomId);
    });

// UPDATE USER

    user.socket.on('updateUser', function(userObj) {
      console.log('e.updateUser');
      self.updateUser(user, userObj);
    });

    // console.log('socket-------------', user.socket);
    // console.log('io: ----------------------------------', self.io);
    // console.log('user.socket: ----------------------------------', user.socket._events);
// CALLBACK
    if (callback) {
      callback();
    }
  };  // END CHATLISTENERS




//////////////////////////////// CONTROLLER ///////////////////////////


// CHAT
  self.addChat = function(user, chat) {
    var timestamp = _.now();
    ChatroomModel.findOne({ name: user.socket.chat.room }, function(err, chatroom) {
      if (!err) {
        console.log('1chat.url', chat.url);
        chatroom.chatlog.push( { room: user.socket.chat.name, sender: user.username, message: chat.message, url: chat.url } );
        chatroom.save(function(err) {
          if (err) { return console.log( err );}
        });
        self.io.sockets.in(user.socket.chat.room).emit("chat", { room: user.socket.chat.room, sender: user.username, message: chat.message, url: chat.url, timestamp: timestamp});
      } else {
        return console.log( err );
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
      // console.log('chatroomLength: ', chatlogLength);
      if (chatlogLength >= (MODELS_SKIPPED * -1) || remainderCheck) {
        user.socket.emit('moreChats', chatroom.chatlog);
      } else {
        // console.log('-------------------------------');
        user.socket.emit('noMoreChats');
      }
    });
  };


// DIRECT MESSAGE
  self.initDirectMessage = function(user, recipient) {
    console.log('initDirectMessage');
    console.log('recipient: ', recipient);
    DirectMessageModel.findOne({'participants': {'$all': [{"username": user.username}, {"username": recipient.username}]}}, function(err, DM) {
      if (DM) {
        console.log('this is the DM', DM);
        self.connectToDirectMessage(user, DM._id);
        user.socket.emit('setDirectMessageChatlog', DM.chatlog.slice(-25));
        user.socket.emit('setDirectMessageHeader', {
          id: DM._id,
          name: recipient.username,
          privacy: false,
          blockedUsers: [],
          owner: null,
          currentUser: user.username,
          chatlogLength: DM.chatlog.length,
          modelsLoadedSum: -1,
          chatType: 'message',
          roomImage: recipient.userImage
        });
      } else {
        var newDirectMessage = new DirectMessageModel(
          {'participants': [{
            'username': user.username,
          },
          {'username': recipient.username}
          ]});
        newDirectMessage.save(function(err, DM) {
           if (!err) {
             console.log('DM created');
             self.connectToDirectMessage(user, DM._id);
             user.socket.emit('setDirectMessageChatlog', DM.chatlog.slice(-25));
             user.socket.emit('setDirectMessageHeader', {
              id: DM._id,
              name: recipient.username,
              privacy: false,
              blockedUsers: [],
              owner: null,
              currentUser: user.username,
              chatlogLength: DM.chatlog.length,
              modelsLoadedSum: -1,
              chatType: 'message',
              roomImage: recipient.userImage});
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
  self.addDirectMessage = function(user, message){
    var timestamp = _.now();
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


// ROOM
    self.createRoom = function(user, formData) {
      ChatroomModel.findOne({ name: formData.name }, function(err, chatroom) {
        if (!chatroom) {
          var newChatroom = new ChatroomModel({name: formData.name, owner: user.username, roomImage: formData.roomImage, privacy: formData.privacy });
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
    self.updateRoom = function(user, formData) {
      var id = formData.id;
      delete formData.id;
      ChatroomModel.findOneAndUpdate({ _id: id }, { '$set': formData }, function(err, oldRoom) {
        ChatroomModel.findOne({ _id: id }, function(err, chatroom) {
          self.leaveRoom(user);
          self.addToRoom(user, chatroom.name);
        });
      });
    };
    self.destroyRoom = function(user, roomInfo) {
      if (user.homeRoom === roomInfo.roomName) {
        user.socket.emit('destroyRoomResponse', {error: 'homeRoomError'});
      } else {
        ChatroomModel.remove({_id: roomInfo.id}, function(err) {
          if (!err) {
            self.getChatrooms(user);
            if (roomInfo.userInRoom === true) {
              user.socket.emit('redirectToHomeRoom', {roomLeft: roomInfo.roomName, homeRoom: user.homeRoom});
            }
          } else {
            return console.log( err );
          }
          user.socket.emit('destroyRoomResponse', {success: 'destroyed'});
        });
      }
    };
  self.leaveRoom = function(user, callback) {
    console.log("f.leaveRoom");
    var currentRoom = user.socket.chat.room;
    console.log("--user leaving: ", user.username);
    console.log("--room leaving: ", currentRoom);
    if (user.socket.chat.room) {
      ChatroomModel.update(
        { name: currentRoom },
        {$pull: {'onlineUsers': {username: user.username, userImage: user.userImage}}},
        function(err, raw) {
          if (err) {return console.log(err);}
          user.socket.broadcast.to(currentRoom).emit('userLeft', { username: user.username, userImage: user.userImage });
          ChatroomModel.findOne({ name: currentRoom }, function( err, chatroom ) {
            if (err) {return console.log(err);}
            console.log('new chatroom users: ', chatroom.onlineUsers );
          var offlineUsers = _.filter(chatroom.participants,
            function(obj) {
              return !_.find(chatroom.onlineUsers,
                function(onlineObj) {
                  if (onlineObj.id.equals(obj.id)) {
                    return onlineObj;
                  }
                });
            });
            console.log('v----leaveroom------v');
            console.log('chatroom.onlineUSers: ', chatroom.onlineUsers);
            console.log('chatroom.offlineUsers: ', offlineUsers);
            console.log('^--------------------^');
            user.socket.broadcast.to(currentRoom).emit('onlineUsers', chatroom.onlineUsers);
            user.socket.broadcast.to(currentRoom).emit('offlineUsers', offlineUsers);
            if (callback) {
              callback();
            }
          });
        }
      );
    }
  };
  self.addToRoom = function(user, roomName) {
    console.log("f.addToRoom: ", roomName);
    user.socket.join(roomName);
    user.socket.chat.room = roomName;
    ChatroomModel.update({ name: roomName},
      {$push: {'onlineUsers': { username: user.username, userImage: user.userImage, id: user.id }}},
      function(err, raw){
        if (err) { return console.log(err); }
        ChatroomModel.findOne({ name: roomName }, function( err, chatroom ) {
          if (err) {return console.log(err);}
          self.getUsersAndHeader(user, roomName);
          self.getChatrooms(user);
          var offlineUsers = _.filter(chatroom.participants,
            function(obj) {
              return !_.find(chatroom.onlineUsers,
                function(onlineObj) {
                  if (onlineObj.id.equals(obj.id)) {
                    return onlineObj;
                  }
                });
            });
            console.log('v----addToRoom------v');
            console.log('chatroom.onlineUSers: ', chatroom.onlineUsers);
            console.log('chatroom.offlineUsers: ', offlineUsers);
            console.log('^--------------------^');
          user.socket.broadcast.to(roomName).emit('userJoined', { username: user.username, userImage: user.userImage });
          user.socket.broadcast.to(roomName).emit('onlineUsers', chatroom.onlineUsers);
          user.socket.broadcast.to(roomName).emit('offlineUsers', offlineUsers);
        });
      }
    );
  };


// ROOM MANAGEMENT
    self.addUserToRoom = function(user, roomName) {
      console.log('f.addUserToRoom');
      ChatroomModel.findOne({name: roomName}, function( err, chatroom ) {
        console.log('userid: ', user.id);
        console.log('>>>>>>>>>>>>>>>>>>>>>>>participants: ', chatroom.participants);
        var filtered = _.filter(chatroom.participants, function(obj){ return user.id === obj.id; });
        if (filtered.length === 0) {
          ChatroomModel.update({_id: chatroom.id}, { $push: {'participants': {'username': user.username, 'userImage': user.userImage, 'id': user.id } }}, function(err, raw) {
            if (!err) {
              console.log('userchatrooms', raw);
              self.getChatrooms(user);
            } else {
              return console.log( err );
            }
          });
        }
      });

    };
    self.removeUserFromRoom = function(user, roomData) {
      console.log('removeUserFromRoom');
      ChatroomModel.update({_id: roomData.id}, { $pull: { 'participants': {'id': user.id }}}, function(err, raw) {
            if (!err) {
              console.log('userchatrooms', raw);
              self.getChatrooms(user);
              if (roomData.userInRoom === true) {
                user.socket.emit('redirectToHomeRoom', { roomLeft: roomData.roomName, homeRoom: user.homeRoom });
              }
            } else {
              return console.log( err );
            }
      });
    };
  self.getChatrooms = function(user) {
    console.log('f.getChatrooms');
    // use lean() for a modifiable returned object, like you see in self.getPrivateRooms();
    ChatroomModel.find({ 'participants.id': user.id }, 'name owner roomImage privacy id').lean().exec(function( err, chatrooms ) {
      if (!err) {
        var priv = self.getPrivateRooms(user, chatrooms);
        var pub = self.getPublicRooms(chatrooms);
        user.socket.emit('chatrooms', pub);
        user.socket.emit('privateRooms', priv);
      } else {
        return console.log (err);
      }
    });
  };
  self.getPrivateRooms = function(user, chatrooms) {
    var priv = _.filter(chatrooms, function(room) {
        return room.privacy === true;
    });
    var modifiedPriv = _.each(priv, function(room) {
      room.currentUser = user.username;
    });
    console.log('f.getPrivateRooms');
    return  modifiedPriv;
  };
  self.getPublicRooms = function(chatrooms) {
    var pub = _.filter(chatrooms, function(room) { return room.privacy === false; });
    console.log('f.getPublicRooms');
    return pub;
  };
  self.getUsersAndHeader = function(user, roomName) {
    console.log('f.getUsersAndHeader');
    ChatroomModel.findOne({name: roomName}, function( err, chatroom ) {
      if (!err) {
        
        console.log('chatroom: ', chatroom.name);

          var offlineUsers = _.filter(chatroom.participants,
            function(obj) {
              return !_.find(chatroom.onlineUsers,
                function(onlineObj) {
                  if (onlineObj.id.equals(obj.id)) {
                    return onlineObj;
                  }
                });
            });
        console.log('v-----getUsersAndHeader-----v');
        console.log('participants: ', chatroom.participants);
        console.log('oonlneinusers: ', chatroom.onlineUsers);
        console.log('offlineusers: ', offlineUsers);
         console.log('^--------------------------^');
        user.socket.emit('chatlog', chatroom.chatlog.slice(-25));
        user.socket.emit('onlineUsers', chatroom.onlineUsers);
        user.socket.emit('offlineUsers', offlineUsers);
        user.socket.emit('chatroomHeader', {id: chatroom._id, name: roomName, roomImage: chatroom.roomImage, privacy: chatroom.privacy, owner: chatroom.owner, currentUser: user.username, chatlogLength: chatroom.chatlog.length, modelsLoadedSum: -1});
      } else {
        return console.log (err);
      }
    });
  };


// INVITATIONS

  self.inviteUser = function(user, invitationObj){
    UserModel.update(
      { username: invitationObj.recipient },
      { $push: {'invitations': {sender: invitationObj.sender, roomName: invitationObj.roomName, roomId: invitationObj.roomId}}},
      function(err, raw) {
        if (err) { return console.log(err); }
        UserModel.findOne({ username: invitationObj.recipient }, function( err, found ) {
          if (self.io.sockets.connected[found.socketId]) {
            self.io.to(found.socketId).emit('refreshInvitations', found.invitations);
          }
          user.socket.emit('userInvited', found.username);
          if (err) {
            user.socket.emit('userInvited', { 'error': 'error'});
            return console.log(err);
          }
          // user.socket.emit('refreshInvitations', found.invitations);
        });
      }
    );
  };
  self.deleteInvitation = function(user, roomId) {
    console.log('roomId', roomId);
    UserModel.update(
      { _id: user.id },
      {$pull: {'invitations': {roomId: roomId}}},
      function(err, raw) {
        if (err) { return console.log(err); }
        UserModel.findOne({ _id: user.id }, function( err, found ) {
          console.log('found', found);
          if (err) {return console.log(err);}
          user.socket.emit('refreshInvitations', found.invitations);
        });
      }
    );
  };
  self.acceptInvitation = function(user, roomId) {
    console.log('roomId', roomId);
    ChatroomModel.update(
      {_id: roomId},
      { $push: {'participants': { 'username': user.username, 'userImage': user.userImage, 'id': user.id } }},
      function(err, raw) {
        if (!err) {
          self.deleteInvitation(user, roomId);
          self.getChatrooms(user);
        } else {
          return console.log( err );
        }
      }
    );
  };


// UPDATE USER
  self.updateUser = function(user, userObj){
    UserModel.findOneAndUpdate({ _id: user.id }, { '$set': userObj }, function(err, oldUser) {
        if (err) { return console.log(err); }
        UserModel.findOne({ _id: user.id }, function( err, updatedUser ) {
          var updateUser = function() {
            self.initUser(user.socket, updatedUser);
          };
          newEventList = _.filter(Object.keys(user.socket._events), function(eventKey) {
            return eventKey === 'login' || eventKey === 'logout';
          });
          user.socket._events = newEventList;
          user.socket.leave(user.socket.chat.room);
          self.leaveRoom(user, updateUser);
          if (err) {
            user.socket.emit('userUpdated', { 'error': 'error'});
            return console.log(err);
          }
        });
      }
    );
  };



// ERROR HANDLING
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
    self.doesHomeRoomExist = function(user, homeRoomQuery) {
      console.log('homeRoomQuery: ', homeRoomQuery);
      ChatroomModel.findOne({ name: homeRoomQuery }, function(err, chatroom) {
        if (!chatroom) {
          user.socket.emit('homeRoomAvailability', true);
        } else {
          user.socket.emit('homeRoomAvailability', false);
        }
      });
    };




};  // END CONTROLLER





// User Model
var User = function(args) {
  var self = this;
  self.socket = args.socket;
  self.username = args.username;
  self.userImage = args.userImage;
  self.id = args.id;
  self.invitations = args.invitations;
  self.homeRoom = args.homeRoom;
};

// allows export to server.js
module.exports = Server;



