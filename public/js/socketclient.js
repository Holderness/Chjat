
// The ChatClient is implemented on main.js.
// The chatclient is a constructor function on the MainController.
// It both listens to and emits events on the socket, eg:
// It has its own methods that, when called, emit to the socket w/ data.
// It also sets response listeners on connection, these response listeners
// listen to the socket and trigger events on the appEventBus on the 
// MainController
var ChatClient = function(options) {

	var self = this;

	// is-typing helper variables
	var TYPING_TIMER_LENGTH = 400; // ms
  var typing = false;
  var lastTypingTime;
  
  // this vent holds the appEventBus
	self.vent = options.vent;

	self.hostname = 'http://' + window.location.host;

  // connects to socket, sets response listeners
  self.connect = function() {
    console.log('sc.f.connect');
    // this io might be a little confusing... where is it coming from?
    // it's coming from the static middleware on server.js bc everything
    // in the /public folder has been attached to the server, and visa
    // versa.

    // local
      // self.socket = io.connect(self.hostname);

    // heroku
      self.socket = io.connect('http://www.chjat.com/', { transports: ['websocket'] } );

    self.setResponseListeners(self.socket);
  };



///// ViewEventBus methods ////
    // methods that emit to the chatserver

// LOGIN
  self.login = function(user) {
    console.log('sc.f.login: ', user);
    self.socket.emit("login", user);
  };
  self.logout = function() {
    console.log('sc.f.logout: ');
    self.socket.emit("logout");
  };


// ROOM
  self.connectToRoom = function(roomName) {
    console.log('sc.f.connectToRoom');
    self.socket.emit("connectToRoom", roomName);
  };
  self.joinRoom = function(roomName) {
    self.socket.emit('joinRoom', roomName);
  };
  self.addRoom = function(roomName) {
    console.log('sc.f.addRoom');
    self.socket.emit("addRoom", roomName);
  };
  self.removeRoom = function(roomData) {
    console.log('sc.f.removeRoom');
    self.socket.emit("removeRoom", roomData);
  };
  self.createRoom = function(formData) {
    console.log('sc.f.createRoom');
    self.socket.emit("createRoom", formData);
  };
  self.updateRoom = function(formData) {
    console.log('sc.f.updateRoom');
    self.socket.emit("updateRoom", formData);
  };
  self.destroyRoom = function(roomInfo) {
    console.log('sc.f.destroyRoom');
    self.socket.emit("destroyRoom", roomInfo);
  };


// CHAT
  self.chat = function(chat) {
    console.log('sc.f.chat: ', chat);
		self.socket.emit("chat", chat);
	};
  self.getMoreChats = function(chatReq) {
    self.socket.emit('getMoreChats', chatReq);
  };


// DIRECT MESSAGE
  self.initDirectMessage = function(recipient) {
    self.socket.emit('initDirectMessage', recipient);
  };
  self.directMessage = function(directMessage) {
    self.socket.emit('directMessage', directMessage);
  };
  self.getMoreDirectMessages = function(directMessageReq) {
    self.socket.emit('getMoreDirectMessages', directMessageReq);
  };
  

// TYPING
	self.addChatTyping = function(data) {
    var message = data.username + ' is typing';
    $('.typetypetype').text(message);
	};
	self.removeChatTyping = function() {
    $('.typetypetype').empty();
	};
  self.updateTyping = function() {
    if (self.socket) {
      if (!typing) {
        typing = true;
        self.socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();
      setTimeout(function() {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
           self.socket.emit('stop typing');
           typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  };


// INVITATIONS
  self.inviteUser = function(invitationObj) {
    self.socket.emit("inviteUser", invitationObj);
  };
  self.deleteInvitation = function(roomId) {
    self.socket.emit("deleteInvitation", roomId);
  };
  self.acceptInvitation = function(roomId) {
    self.socket.emit("acceptInvitation", roomId);
  };

// UPDATE USER
  self.updateUser = function(userObj) {
    self.socket.emit("updateUser", userObj);
  };


// ERROR HANDLING
  self.doesChatroomExist = function(chatroomQuery) {
    self.socket.emit('doesChatroomExist', chatroomQuery);
  };
  self.doesHomeRoomExist = function(homeRoomQuery) {
    self.socket.emit('doesHomeRoomExist', homeRoomQuery);
  };
  self.doesSearchChatroomExist = function(homeRoomQuery) {
    self.socket.emit('doesSearchChatroomExist', homeRoomQuery);
  };


  




  ////////////// chatserver listeners/////////////

  // these guys listen to the chatserver/socket and emit data to main.js,
  // specifically to the appEventBus.
	self.setResponseListeners = function(socket) {


// LOGIN
    socket.on('initUser', function(user) {
      console.log('sc.e.initUser');
      self.vent.trigger('initUser', user);
      self.connectToRoom(user.homeRoom);
    });


// CHAT
		socket.on('userJoined', function(user) {
			console.log('sc.e.userJoined');
			self.vent.trigger("userJoined", user);
		});
		socket.on('userLeft', function(user) {
			console.log('sc.e.userLeft');
			self.vent.trigger("userLeft", user);
		});
		socket.on('chat', function(chat) {
			console.log('sc.e.chat');
			self.vent.trigger("chatReceived", chat);
		});
    socket.on('moreChats', function(chats) {
      self.vent.trigger("moreChats", chats);
    });
    socket.on('noMoreChats', function() {
      self.vent.trigger("noMoreChats");
    });


// DIRECT MESSAGE
    socket.on('setDirectMessageChatlog', function(chatlog) {
      self.vent.trigger("setDMchatlog", chatlog);
    });
    socket.on('setDirectMessageHeader', function(header) {
      self.vent.trigger("setDMheader", header);
    });
    socket.on('directMessage', function(message) {
      self.vent.trigger("directMessageReceived", message);
    });



// TYPING
    socket.on('typing', function(data) {
      self.addChatTyping(data);
    });
    socket.on('stop typing', function() {
      self.removeChatTyping();
    });


// SET ROOM
    socket.on('chatlog', function(chatlog) {
      console.log('sc.e.chatlog');
      self.vent.trigger("setChatlog", chatlog);
    });
    socket.on('chatrooms', function(chatrooms) {
      console.log('sc.e.chatrooms');
      self.vent.trigger("setChatrooms", chatrooms);
    });
    socket.on('privateRooms', function(rooms) {
      console.log('sc.e.privateRooms');
      self.vent.trigger("setPrivateRooms", rooms);
    });
    socket.on('onlineUsers', function(onlineUsers) {
      console.log('sc.e.onlineUsers');
      self.vent.trigger("setOnlineUsers", onlineUsers);
    });
    socket.on('offlineUsers', function(offlineUsers) {
      console.log('sc.e.offlineUsers');
      self.vent.trigger("setOfflineUsers", offlineUsers);
    });
    socket.on('chatroomHeader', function(headerObj) {
      console.log('sc.e.chatroomHeader');
      self.vent.trigger("setChatroomHeader", headerObj);
    });


// REDIRECT TO HOME ROOM
    socket.on('redirectToHomeRoom', function(data) {
      console.log('sc.e.redirectToHomeRoom');
      self.vent.trigger("redirectToHomeRoom", data);
    });

// ROOM AVAILABILITY
    socket.on('chatroomAvailability', function(availabilty) {
      self.vent.trigger('chatroomAvailability', availabilty);
    });
    socket.on('homeRoomAvailability', function(availabilty) {
      self.vent.trigger('homeRoomAvailability', availabilty);
    });
    socket.on('chatroomExists', function(availabilty) {
      self.vent.trigger('chatroomExists', availabilty);
    });

// ERROR HANDLING
    socket.on('chatroomAlreadyExists', function() {
      self.vent.trigger("chatroomAlreadyExists");
    });

    socket.on('destroyRoomResponse', function(res) {
      self.vent.trigger("destroyRoomResponse", res);
    });

// INVITATIONS
    socket.on('refreshInvitations', function(invitations) {
      self.vent.trigger("refreshInvitations", invitations);
    });
    socket.on('userInvited', function(user) {
      self.vent.trigger("userInvited", user);
    });

// LOGOUT
    socket.on('logout', function() {
      self.logout();
    });


	};
};