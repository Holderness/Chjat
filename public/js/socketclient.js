
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
		self.socket = io.connect(self.hostname);
    self.setResponseListeners(self.socket);
  };

  self.connectToRoom = function(name) {
    console.log('sc.f.connectToRoom: ', name);
    self.socket.emit("connectToRoom", name);
  };

  // self.getChatroomModel = function(name) {
  //   console.log('sc.f.getChatroomModel: ', name);
  //   self.socket.emit("getChatroomModel", name);
  // };

  self.addRoom = function(name) {
    console.log('sc.f.addRoom: ', name);
    self.socket.emit("addRoom", name);
  };

  self.removeRoom = function(name) {
    console.log('sc.f.removeRoom: ', name);
    self.socket.emit("removeRoom", name);
  };

  self.createRoom = function(formData) {
    console.log('sc.f.createRoom: ', formData);
    self.socket.emit("createRoom", formData);
  };

  self.updateRoom = function(formData) {
    console.log('sc.f.updateRoom: ', formData);
    self.socket.emit("updateRoom", formData);
  };

  self.destroyRoom = function(name) {
    console.log('sc.f.destroyRoom: ', name);
    self.socket.emit("destroyRoom", name);
  };


///// ViewEventBus methods ////
    // methods that emit to the chatserver
  self.login = function(user) {
    console.log('sc.f.login: ', user);
		self.socket.emit("login", user);
	};
  // self.logout = function() {
  //   self.socket.emit("wut");
  // };



  self.chat = function(chat) {
    console.log('sc.f.chat: ', chat);
		self.socket.emit("chat", chat);
	};
  self.getMoreChats = function(chatReq) {
    self.socket.emit('getMoreChats', chatReq);
  };
  self.directMessage = function(directMessage) {
    self.socket.emit('directMessage', directMessage);
  };
  self.getMoreDirectMessages = function(directMessageReq) {
    self.socket.emit('getMoreDirectMessages', directMessageReq);
  };
  

  // Typing methods
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


  // join room
  self.joinRoom = function(name) {
    self.socket.emit('joinRoom', name);
  };

  // set room
  // self.setRoom = function(name) {
  //   if (name !== null) {
  //     this.currentRoom = name;
  //   }
  //   ///>>>>>>> changethisto .chat-title
  //   var $chatTitle = $('.chatbox-header-username');
  //   $chatTitle.text(name);
  //   var this_ = this;
  //   $('.chat-directory').find('.room').each(function() {
  //     var $room = $(this);
  //     $room.removeClass('active');
  //     if ($room.data('name') === this_.currentRoom) {
  //       $room.addClass('active');
  //     }
  //   });
  // };

  self.doesChatroomExist = function(chatroomQuery) {
    self.socket.emit('doesChatroomExist', chatroomQuery);
  };








  self.initDirectMessage = function(recipient) {
    self.socket.emit('initDirectMessage', recipient);
  };
  








  ////////////// chatserver listeners/////////////

  // these guys listen to the chatserver/socket and emit data to main.js,
  // specifically to the appEventBus.
	self.setResponseListeners = function(socket) {
		// socket.on('welcome', function(data) {
  //     // emits event to recalibrate onlineUsers collection
  //     // socket.emit("getOnlineUsers");
  //     // socket.emit("rooms");
  //     // data is undefined at this point because it's the first to
  //     // fire off an event chain that will append the new user to 
  //     // the onlineUser collection
  //     debugger;
  //     self.vent.trigger("loginDone", data);
  //   });


// login

    socket.on('login', function(username) {
      self.vent.trigger('loginUser', username);
    });


  //   socket.on('log', function() {
  //     debugger;
  //     console.log('sc.e.log');
  //     self.vent.trigger('authenticated');
  //   });

		// socket.on('usersInfo', function(users) {
  //     debugger;
		// 	console.log('sc.e.usersInfo: ', users);
		// 	self.vent.trigger("usersInfo", users);
		// });

//     socket.on('rooms', function(chatrooms) {
// debugger;
//       console.log('sc.e.rooms: ', chatrooms);
//       self.vent.trigger("roomInfo", chatrooms);
//     });

    // socket.on('setRoom', function(name) {
    //   debugger;
    //   console.log('sc.e.setRoom: ', name);
    //   self.vent.trigger("setRoom", name);
    // });


// chat
		socket.on('userJoined', function(user) {
			console.log('sc.e.userJoined: ', user);
      // socket.emit("onlineUsers");
			self.vent.trigger("userJoined", user);
		});
		socket.on('userLeft', function(user) {
			console.log('sc.e.userLeft: ', user);
      // socket.emit("onlineUsers");
			self.vent.trigger("userLeft", user);
		});
		socket.on('chat', function(chat) {
			console.log('sc.e.chat: ', chat);
			self.vent.trigger("chatReceived", chat);
		});
    socket.on('moreChats', function(chats) {
      self.vent.trigger("moreChats", chats);
    });
    socket.on('noMoreChats', function() {
      self.vent.trigger("noMoreChats");
    });


// chatroom

    socket.on('typing', function(data) {
      self.addChatTyping(data);
    });
    socket.on('stop typing', function() {
      self.removeChatTyping();
    });


// set chatroom
    socket.on('chatlog', function(chatlog) {
      console.log('sc.e.chatlog: ', chatlog);
      self.vent.trigger("setChatlog", chatlog);
    });
    socket.on('chatrooms', function(chatrooms) {
      console.log('sc.e.chatrooms:  ', chatrooms);
      self.vent.trigger("setChatrooms", chatrooms);
    });
    socket.on('onlineUsers', function(onlineUsers) {
      console.log('sc.e.onlineUsers: ', onlineUsers);
      self.vent.trigger("setOnlineUsers", onlineUsers);
    });
    socket.on('offlineUsers', function(offlineUsers) {
      console.log('sc.e.offlineUsers: ', offlineUsers);
      self.vent.trigger("setOfflineUsers", offlineUsers);
    });
    socket.on('chatroomHeader', function(headerObj) {
      console.log('sc.e.chatroomHeader: ', headerObj);
      self.vent.trigger("setChatroomHeader", headerObj);
    });


// modify room
    socket.on('roomDestroyed', function(name) {
      console.log('sc.e.roomDestroyed: ', name);
      self.vent.trigger("roomDestroyed", name);
    });

// create room
    socket.on('chatroomAvailability', function(availabilty) {
      self.vent.trigger('chatroomAvailability', availabilty);
    });

// errors
    socket.on('chatroomAlreadyExists', function() {
      self.vent.trigger("chatroomAlreadyExists");
    });


// DirectMessage
    socket.on('setDirectMessageChatlog', function(chatlog) {
      self.vent.trigger("setDMchatlog", chatlog);
    });

    socket.on('setDirectMessageHeader', function(header) {
      self.vent.trigger("setDMheader", header);
    });

    socket.on('directMessage', function(message) {
      // self.vent.trigger("renderDirectMessage", DM);
      self.vent.trigger("directMessageReceived", message);
    });


	};
};