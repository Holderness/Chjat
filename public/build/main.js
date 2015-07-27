
var app = app || {};

(function () {

  app.ChatModel = Backbone.Model.extend({});

})();

var app = app || {};

(function () {

  app.ContainerModel = Backbone.Model.extend({});

})();

var app = app || {};

(function () {

  app.LoginModel = Backbone.Model.extend({
    defaults: {
      error: ""
    }
  });


})();

var app = app || {};

(function () {

  app.UserModel = Backbone.Model.extend({});
  
})();

var app = app || {};

(function () {

  app.ChatCollection = Backbone.Collection.extend({
    model: app.ChatModel,
    url: '/api/chatroom'
  });

})();

var app = app || {};

(function () {

  app.ChatroomList = Backbone.Collection.extend({
    model: app.ChatroomModel,
    url: '/api/chatrooms'
  });

})();

var app = app || {};

(function () {

  app.UserCollection = Backbone.Collection.extend({model: app.UserModel});

})();

var app = app || {};

(function () {

app.ChatroomModel = Backbone.Model.extend({
  defaults: function() {
    return {
    name: 'DOO',
    onlineUsers: new app.UserCollection(),

    };
  },
  // userChats: new app.ChatCollection([
  //     // message and sender upon entering chatroom
  //     new app.ChatModel({ sender: 'Butters', message: 'awwwwww hamburgers. ||):||', timestamp: _.now() })
  //     ]),
  addUser: function(username) {
    this.get('onlineUsers').add(new app.UserModel({ username: username }));
    console.log("--adding-user---");
  },
  removeUser: function(username) {
    var onlineUsers = this.get('onlineUsers');
    var user = onlineUsers.find(function(userModel) { return userModel.get('username') == username; });
    if (user) {
      onlineUsers.remove(user);
    }
  },
  addChat: function(chat) {
    this.trigger('gorp', chat);
  },
});

})();
var app = app || {};

(function ($) {

app.ChatroomView = Backbone.View.extend({
  template: _.template($('#chatroom-template').html()),
  events: {
    'keypress .message-input': 'messageInputPressed',
    'click .chat-directory .room': 'setRoom'
  },
  // initialized after the 'loginDone' event
  initialize: function(options) {
    console.log(options);
    // passed the viewEventBus
    this.vent = options.vent;

    // these get the collection of onlineUsers and userChats from the chatroomModel


  },
  render: function(model) {
    this.model = model || this.model;
    this.$el.html(this.template());
    this.setChatCollection();
    this.renderUsers();
    this.setChatListeners(model);
    this.renderRooms();
    return this;
  },
  setChatCollection: function() {
      this.userChats = new app.ChatCollection([
        // message and sender upon entering chatroom
        new app.ChatModel({ sender: 'Butters', message: 'awwwwww hamburgers. ||):||', timestamp: _.now() })
      ]);
  },
  setChatListeners: function(model) {
    this.stopListening();

    var onlineUsers = this.model.get('onlineUsers');
   //sets event listeners on the collections
    this.listenTo(onlineUsers, "add", this.renderUser, this);
    this.listenTo(onlineUsers, "remove", this.renderUsers, this);
    this.listenTo(onlineUsers, "reset", this.renderUsers, this);

    var userChats = this.userChats;
    this.listenTo(userChats, "add", this.renderChat, this);
    this.listenTo(userChats, "remove", this.renderChats, this);
    this.listenTo(userChats, "reset", this.renderChats, this);

    var chatrooms = this.collection;

    this.listenTo(chatrooms, "add", this.renderRoom, this);
    this.listenTo(chatrooms, "remove", this.renderRooms, this);
    this.listenTo(chatrooms, "reset", this.renderRooms, this);

    this.listenTo(this.model, "gorp", this.gorp, this);
    // this.model.on('gorp', function(chat) {
    //   this.gorp(chat);
    // });

  },

  gorp: function(chat) {
    var now = _.now();

    this.userChats.add(new app.ChatModel({ sender: chat.sender, message: chat.message, timestamp: now}));
  },
  // renders on events, called just above
  renderUsers: function() {
    this.$('.online-users').empty();
    this.model.get("onlineUsers").each(function (user) {
      this.renderUser(user);
    }, this);
  },
  renderUser: function(model) {
    var template = _.template($("#online-users-list-template").html());
    this.$('.online-users').append(template(model.toJSON()));
  },
  renderChats: function(chats) {
    this.$('.chatbox-content').empty();
    chats = chats || this.userChats;
    chats.each(function(chat) {
      this.renderChat(chat);
    }, this);
  },
  renderChat: function(model) {
    var template = _.template($('#chatbox-message-template').html());
    var element = $(template(model.toJSON()));
    element.appendTo(this.$('.chatbox-content')).hide().fadeIn().slideDown();
    // this.$('.nano').nanoScroller();
    // this.$('.nano').nanoScroller({ scroll: 'bottom' });
  },


  // renders on events, called just above
  renderRooms: function() {
    this.$('.public-rooms-container').empty();
    this.collection.each(function (room) {
      this.renderRoom(room);
    }, this);
  },
  renderRoom: function(model) {
    var template = _.template($("#room-list-template").html());
    this.$('.public-rooms-container').append(template(model.toJSON()));
    // this.$('.user-count').html(this.model.get("onlineUsers").length);
    // this.$('.nano').nanoScroller();
  },

  joinRoom: function(name) {
    this.vent.trigger('joinRoom', name);
    var model = this.collection.findWhere({name: name});
    this.getChatCollection(name);
    this.render(model);
  },


  //events
  messageInputPressed: function(e) {
    if (e.keyCode === 13 && $.trim($('.message-input').val()).length > 0) {
      // fun fact: separate events with a space in trigger's first arg and you
      // can trigger multiple events.
      this.vent.trigger("chat", this.$('.message-input').val());
      this.$('.message-input').val('');
      return false;
    } else {
      this.vent.trigger("typing");
      console.log('wut');
    }
    return this;
  },
  setRoom: function(e) {
    var $tar = $(e.target);
    if ($tar.is('p')) {
      this.joinRoom($tar.data('room'));
    }
  }




});

})(jQuery);
var app = app || {};

(function ($) {

  app.ContainerView = Backbone.View.extend({
    el: '#view-container',
    initialize: function(options) {
      this.model.on("change:viewState", this.render, this);
    },
    render: function() {
      var view = this.model.get('viewState');
      this.$el.html(view.render().el);
    }
  });

})(jQuery);
var app = app || {};

(function ($) {

  app.LoginView = Backbone.View.extend({
    template: _.template($('#login-template').html()),
    events: {
      'click #nameBtn': 'onLogin',
      'keypress #nameText': 'onHitEnter'
    },
    initialize: function(options) {
    // LoginView gets passed the viewEventBus when the MainController is initialized
      this.vent = options.vent;

    // This tells the view to listen to an event on its model,
    // if there's an error, the callback (this.render) is called with the  
    // view as context
      this.listenTo(this.model, "change:error", this.render, this);
    },
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    },
    onLogin: function() {
      // triggers the login event and passing the username data to js/main.js
      debugger;
      this.vent.trigger("login", this.$('#nameText').val());
    },
    onHitEnter: function(e) {
      if(e.keyCode == 13) {
        this.onLogin();
        return false;
      }
    }
  });
  
})(jQuery);
var app = app || {};

(function ($) {

  app.RegisterView = Backbone.View.extend({
    template: _.template($('#register').html()),
    events: {
      "click #signUpBtn": "signUp"
    },
    initialize: function(options) {
      this.render();
    },
    render: function() {
      this.$el.html(this.template());
      return this;
    },
    signUp: function() {
    }
  });

})(jQuery);

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
		// this io might be a little confusing... where is it coming from?
		// it's coming from the static middleware on server.js bc everything
		// in the /public folder has been attached to the server, and visa
		// versa.
		self.socket = io.connect(self.hostname);
		self.setResponseListeners(self.socket);
	};


///// ViewEventBus methods ////
    // methods that emit to the chatserver
  self.login = function(name) {
    // emits login event to chatserver
		self.socket.emit("login", name);
	};
  self.chat = function(chat) {
    // emits chat event to chatserver
		self.socket.emit("chat", chat);
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
  self.setRoom = function(name) {
    if (name !== null) {
      this.currentRoom = name;
    }
    ///>>>>>>> changethisto .chat-title
    var $chatTitle = $('.chatbox-header-username');
    $chatTitle.text(name);
    var this_ = this;
    $('.chat-directory').find('.room').each(function() {
      var $room = $(this);
      $room.removeClass('active');
      if ($room.data('name') === this_.currentRoom) {
        $room.addClass('active');
      }
    });
  };
  



  ////////////// chatserver listeners/////////////

  // these guys listen to the chatserver/socket and emit data to main.js,
  // specifically to the appEventBus.
	self.setResponseListeners = function(socket) {
		// client listeners that listen to the chatserver and itself.
		// Each server event triggers an appEventBus event paired with 
		// relevant data.

		socket.on('welcome', function(data) {
      // emits event to recalibrate onlineUsers collection
      socket.emit("getOnlineUsers");
      socket.emit("rooms");
			console.log('onlineUsers1: ', data);
      // data is undefined at this point because it's the first to
      // fire off an event chain that will append the new user to 
      // the onlineUser collection
      self.vent.trigger("loginDone", data);
    });

		socket.on('loginNameExists', function(data) {
      // data === string of used username
			console.log('loginNameExists: ', data);
			self.vent.trigger("loginNameExists", data);
		});
		socket.on('loginNameBad', function(data) {
			// data === string of bad username
			console.log('loginNameBad: ', data);
			self.vent.trigger("loginNameBad", data);
		});

		// this is the second listener to onlineUsers
		// by the time this is called, the new user has been added to
		// the user collection.
		socket.on('usersInfo', function(data) {
			// this data is an array with all the online user's usernames.
			self.vent.trigger("usersInfo", data);
		});
    socket.on('rooms', function(data) {
      // this data is an array with all the online user's usernames.
      self.vent.trigger("roomInfo", data);
    });

		socket.on('userJoined', function(data) {
			// data === username of user joined
			console.log('userJoined: ', data);
      socket.emit("getOnlineUsers");
			self.vent.trigger("userJoined", data);
		});
		socket.on('userLeft', function(data) {
			// data === username of user removed
			console.log('userLeft: ', data);
      socket.emit("getOnlineUsers");
			self.vent.trigger("userLeft", data);
		});
		socket.on('chat', function(data) {
			// data === chat message object
			console.log('chatdata: ', data);
			self.vent.trigger("chatReceived", data);
		});
    socket.on('setRoom', function(name) {
      self.vent.trigger("setRoom", name);
    });
    socket.on('chatlog', function(chatlog) {
      console.log(' theis is dey chat lawg: ', chatlog);
      self.vent.trigger("setChatlog", chatlog);
    });


    // these guys listen to the server, 
    // then call chatclient methods listed above
    socket.on('typing', function(data) {
      self.addChatTyping(data);
    });
    socket.on('stop typing', function() {
      self.removeChatTyping();
    });



	};
};


app.MainController = function() {

	var self = this;


  //These allows us to bind and trigger on the object from anywhere in the app.
	self.appEventBus = _.extend({}, Backbone.Events);
	self.viewEventBus = _.extend({}, Backbone.Events);

	self.init = function() {
		// creates ChatClient from socketclient.js, passes in 
		// appEventBus as vent, connects
		self.chatClient = new ChatClient({ vent: self.appEventBus });
		self.chatClient.connect();

    // loginModel
		self.loginModel = new app.LoginModel();
    self.loginView = new app.LoginView({vent: self.viewEventBus, model: self.loginModel});
    self.registerView = new app.RegisterView({vent: self.viewEventBus });

    // The ContainerModel gets passed a viewState, LoginView, which
    // is the login page. That LoginView gets passed the viewEventBus
    // and the LoginModel.
		self.containerModel = new app.ContainerModel({ viewState: self.loginView});

		// next, a new ContainerView is intialized with the newly created containerModel
		// the login page is then rendered.
		self.containerView = new app.ContainerView({ model: self.containerModel });
		self.containerView.render();
	};



  ////////////  Busses ////////////
    // These Busses listen to the socketclient
   //    ---------------------------------


  //// viewEventBus Listeners /////
  
	self.viewEventBus.on("login", function(username) {
    // socketio login, sends name to socketclient, socketclient sends it to chatserver
    self.chatClient.login(username);
  });
	self.viewEventBus.on("chat", function(chat) {
    // socketio chat, sends chat to socketclient, socketclient to chatserver
    self.chatClient.chat(chat);
  });
  self.viewEventBus.on("typing", function() {
    self.chatClient.updateTyping();
  });
  self.viewEventBus.on("joinRoom", function(room) {
    self.chatClient.joinRoom(room);
  });








  //// appEventBus Listeners ////

  // after the 'welcome' event triggers on the sockeclient, the loginDone event triggers.
	self.appEventBus.on("loginDone", function() {

		// new model and view created for chatroom
		self.chatroomModel = new app.ChatroomModel();
    self.chatroomList = new app.ChatroomList();
		self.chatroomView  = new app.ChatroomView({vent: self.viewEventBus, model: self.chatroomModel, collection: self.chatroomList});

		// viewstate is changed to chatroom after login.
		self.containerModel.set("viewState", self.chatroomView);
    autosize($('textarea.message-input'));
		$('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
	});

  // error listeners
	self.appEventBus.on("loginNameBad", function(username) {
		self.loginModel.set("error", "Invalid Name");
	});
	self.appEventBus.on("loginNameExists", function(username) {
		self.loginModel.set("error", "Name already exists");
	});




  self.appEventBus.on("gotoLogin", function() {
    self.containerModel.set("viewState", self.loginView);
  });

  self.appEventBus.on("gotoRegister", function() {
    self.containerModel.set("viewState", self.registerView);
  });





  // after 'onlineUsers' event emits, the 'usersInfo' event triggers
	self.appEventBus.on("usersInfo", function(data) {
    //data is an array of usernames, including the new user
		// This method gets the online users collection from chatroomModel.
		// onlineUsers is the collection
		var onlineUsers = self.chatroomModel.get("onlineUsers");
console.log("onlineUsers: ---", onlineUsers);
   // users is array of the current user models
		var users = _.map(data, function(item) {
			return new app.UserModel({username: item});
		});
console.log("users: ---", users);
    // this resets the collection with the updated array of users
		onlineUsers.reset(users);
	});




  self.appEventBus.on("roomInfo", function(data) {
    // This method gets the online users collection from chatroomModel.
    // onlineUsers is the collection
    var rooms = self.chatroomList;
     console.log("ROOMS: ", rooms);

   // users is array of the current room models
    var updatedRooms = _.map(data, function(room) {
      var newChatroomModel = new app.ChatroomModel({name: room.name});
      // _.map(room.chatlog, function(chat) {
      //   debugger;
      //   self.chatroomView.userChats.push(chat);
      // });
      return newChatroomModel;
    });
console.log("UPDATED ROOMS: ", updatedRooms);
    // this resets the collection with the updated array of rooms
    rooms.reset(updatedRooms);
  });


  self.appEventBus.on("setRoom", function(room) {
  //   if (self.chatroomView !== undefined) {
  //   debugger;
  //   self.chatroomView.stopListening();
  //   self.chatroomModel = new app.ChatroomModel();
  //   self.chatroomView  = new app.ChatroomView({vent: self.viewEventBus, model: self.chatroomModel, collection: self.chatroomList});

  //   // viewstate is changed to chatroom after login.
  //   self.containerModel.set("viewState", self.chatroomView);
  //   autosize($('textarea.message-input'));
  //   $('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
  // }
    self.chatClient.setRoom(room);
  });





  // adds new user to users collection, sends default joining message
	self.appEventBus.on("userJoined", function(username) {
		self.chatroomModel.addUser(username);
		self.chatroomModel.addChat({sender: "Butters", message: username + " joined room." });
	});

	// removes user from users collection, sends default leaving message
	self.appEventBus.on("userLeft", function(username) {
		self.chatroomModel.removeUser(username);
		self.chatroomModel.addChat({sender: "Butters", message: username + " left room." });
	});

	// chat passed from socketclient, adds a new chat message using chatroomModel method
	self.appEventBus.on("chatReceived", function(chat) {
    self.chatroomView.gorp(chat);
		$('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
	});

  self.appEventBus.on("setChatlog", function(chatlog) {
    var newList = new app.ChatCollection(chatlog);
    self.chatroomView.renderChats(newList);
    $('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
  });
};


var app = app || {};

(function () {

  var ChatroomRouter = Backbone.Router.extend({
    
    routes: {
      '': 'start',
      'log': 'login',
      'reg': 'register',
    },

    start: function() {
      app.mainController = new app.MainController();
      app.mainController.init();
    },

    login: function() {
      var loginModel = new app.LoginModel();
      var loginView = new app.LoginView({vent: app.mainController.viewEventBus, model: loginModel});
      app.mainController.containerModel.set("viewState", loginView);
    },

    register: function() {
      var registerView = new app.RegisterView({vent: self.viewEventBus });
      app.mainController.containerModel.set("viewState", registerView);
    }

  });

  app.ChatroomRouter = new ChatroomRouter();
  Backbone.history.start();

})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYXQuanMiLCJjb250YWluZXIuanMiLCJsb2dpbi5qcyIsInVzZXIuanMiLCJyb29tLmpzIiwiY2hhdHJvb20uanMiLCJyZWdpc3Rlci5qcyIsInNvY2tldGNsaWVudC5qcyIsIm1haW4uanMiLCJyb3V0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUhQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FJVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBRFZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUVQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQWpDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FKOUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUlwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25MQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLkNoYXRDb2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe1xuICAgIG1vZGVsOiBhcHAuQ2hhdE1vZGVsLFxuICAgIHVybDogJy9hcGkvY2hhdHJvb20nXG4gIH0pO1xuXG59KSgpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5Db250YWluZXJWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIGVsOiAnI3ZpZXctY29udGFpbmVyJyxcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLm1vZGVsLm9uKFwiY2hhbmdlOnZpZXdTdGF0ZVwiLCB0aGlzLnJlbmRlciwgdGhpcyk7XG4gICAgfSxcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHZpZXcgPSB0aGlzLm1vZGVsLmdldCgndmlld1N0YXRlJyk7XG4gICAgICB0aGlzLiRlbC5odG1sKHZpZXcucmVuZGVyKCkuZWwpO1xuICAgIH1cbiAgfSk7XG5cbn0pKGpRdWVyeSk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbiAgYXBwLkxvZ2luVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjbG9naW4tdGVtcGxhdGUnKS5odG1sKCkpLFxuICAgIGV2ZW50czoge1xuICAgICAgJ2NsaWNrICNuYW1lQnRuJzogJ29uTG9naW4nLFxuICAgICAgJ2tleXByZXNzICNuYW1lVGV4dCc6ICdvbkhpdEVudGVyJ1xuICAgIH0sXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIC8vIExvZ2luVmlldyBnZXRzIHBhc3NlZCB0aGUgdmlld0V2ZW50QnVzIHdoZW4gdGhlIE1haW5Db250cm9sbGVyIGlzIGluaXRpYWxpemVkXG4gICAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XG5cbiAgICAvLyBUaGlzIHRlbGxzIHRoZSB2aWV3IHRvIGxpc3RlbiB0byBhbiBldmVudCBvbiBpdHMgbW9kZWwsXG4gICAgLy8gaWYgdGhlcmUncyBhbiBlcnJvciwgdGhlIGNhbGxiYWNrICh0aGlzLnJlbmRlcikgaXMgY2FsbGVkIHdpdGggdGhlICBcbiAgICAvLyB2aWV3IGFzIGNvbnRleHRcbiAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJjaGFuZ2U6ZXJyb3JcIiwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzLm1vZGVsLnRvSlNPTigpKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIG9uTG9naW46IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gdHJpZ2dlcnMgdGhlIGxvZ2luIGV2ZW50IGFuZCBwYXNzaW5nIHRoZSB1c2VybmFtZSBkYXRhIHRvIGpzL21haW4uanNcbiAgICAgIGRlYnVnZ2VyO1xuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJsb2dpblwiLCB0aGlzLiQoJyNuYW1lVGV4dCcpLnZhbCgpKTtcbiAgICB9LFxuICAgIG9uSGl0RW50ZXI6IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmKGUua2V5Q29kZSA9PSAxMykge1xuICAgICAgICB0aGlzLm9uTG9naW4oKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIFxufSkoalF1ZXJ5KTsiLCJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLlVzZXJDb2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe21vZGVsOiBhcHAuVXNlck1vZGVsfSk7XG5cbn0pKCk7IiwiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5DaGF0cm9vbUxpc3QgPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG4gICAgbW9kZWw6IGFwcC5DaGF0cm9vbU1vZGVsLFxuICAgIHVybDogJy9hcGkvY2hhdHJvb21zJ1xuICB9KTtcblxufSkoKTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuYXBwLkNoYXRyb29tVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2NoYXRyb29tLXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgZXZlbnRzOiB7XG4gICAgJ2tleXByZXNzIC5tZXNzYWdlLWlucHV0JzogJ21lc3NhZ2VJbnB1dFByZXNzZWQnLFxuICAgICdjbGljayAuY2hhdC1kaXJlY3RvcnkgLnJvb20nOiAnc2V0Um9vbSdcbiAgfSxcbiAgLy8gaW5pdGlhbGl6ZWQgYWZ0ZXIgdGhlICdsb2dpbkRvbmUnIGV2ZW50XG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICBjb25zb2xlLmxvZyhvcHRpb25zKTtcbiAgICAvLyBwYXNzZWQgdGhlIHZpZXdFdmVudEJ1c1xuICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcblxuICAgIC8vIHRoZXNlIGdldCB0aGUgY29sbGVjdGlvbiBvZiBvbmxpbmVVc2VycyBhbmQgdXNlckNoYXRzIGZyb20gdGhlIGNoYXRyb29tTW9kZWxcblxuXG4gIH0sXG4gIHJlbmRlcjogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB0aGlzLm1vZGVsID0gbW9kZWwgfHwgdGhpcy5tb2RlbDtcbiAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUoKSk7XG4gICAgdGhpcy5zZXRDaGF0Q29sbGVjdGlvbigpO1xuICAgIHRoaXMucmVuZGVyVXNlcnMoKTtcbiAgICB0aGlzLnNldENoYXRMaXN0ZW5lcnMobW9kZWwpO1xuICAgIHRoaXMucmVuZGVyUm9vbXMoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgc2V0Q2hhdENvbGxlY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy51c2VyQ2hhdHMgPSBuZXcgYXBwLkNoYXRDb2xsZWN0aW9uKFtcbiAgICAgICAgLy8gbWVzc2FnZSBhbmQgc2VuZGVyIHVwb24gZW50ZXJpbmcgY2hhdHJvb21cbiAgICAgICAgbmV3IGFwcC5DaGF0TW9kZWwoeyBzZW5kZXI6ICdCdXR0ZXJzJywgbWVzc2FnZTogJ2F3d3d3d3cgaGFtYnVyZ2Vycy4gfHwpOnx8JywgdGltZXN0YW1wOiBfLm5vdygpIH0pXG4gICAgICBdKTtcbiAgfSxcbiAgc2V0Q2hhdExpc3RlbmVyczogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB0aGlzLnN0b3BMaXN0ZW5pbmcoKTtcblxuICAgIHZhciBvbmxpbmVVc2VycyA9IHRoaXMubW9kZWwuZ2V0KCdvbmxpbmVVc2VycycpO1xuICAgLy9zZXRzIGV2ZW50IGxpc3RlbmVycyBvbiB0aGUgY29sbGVjdGlvbnNcbiAgICB0aGlzLmxpc3RlblRvKG9ubGluZVVzZXJzLCBcImFkZFwiLCB0aGlzLnJlbmRlclVzZXIsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8ob25saW5lVXNlcnMsIFwicmVtb3ZlXCIsIHRoaXMucmVuZGVyVXNlcnMsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8ob25saW5lVXNlcnMsIFwicmVzZXRcIiwgdGhpcy5yZW5kZXJVc2VycywgdGhpcyk7XG5cbiAgICB2YXIgdXNlckNoYXRzID0gdGhpcy51c2VyQ2hhdHM7XG4gICAgdGhpcy5saXN0ZW5Ubyh1c2VyQ2hhdHMsIFwiYWRkXCIsIHRoaXMucmVuZGVyQ2hhdCwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5Ubyh1c2VyQ2hhdHMsIFwicmVtb3ZlXCIsIHRoaXMucmVuZGVyQ2hhdHMsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8odXNlckNoYXRzLCBcInJlc2V0XCIsIHRoaXMucmVuZGVyQ2hhdHMsIHRoaXMpO1xuXG4gICAgdmFyIGNoYXRyb29tcyA9IHRoaXMuY29sbGVjdGlvbjtcblxuICAgIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcImFkZFwiLCB0aGlzLnJlbmRlclJvb20sIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlclJvb21zLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRyb29tcywgXCJyZXNldFwiLCB0aGlzLnJlbmRlclJvb21zLCB0aGlzKTtcblxuICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJnb3JwXCIsIHRoaXMuZ29ycCwgdGhpcyk7XG4gICAgLy8gdGhpcy5tb2RlbC5vbignZ29ycCcsIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICAvLyAgIHRoaXMuZ29ycChjaGF0KTtcbiAgICAvLyB9KTtcblxuICB9LFxuXG4gIGdvcnA6IGZ1bmN0aW9uKGNoYXQpIHtcbiAgICB2YXIgbm93ID0gXy5ub3coKTtcblxuICAgIHRoaXMudXNlckNoYXRzLmFkZChuZXcgYXBwLkNoYXRNb2RlbCh7IHNlbmRlcjogY2hhdC5zZW5kZXIsIG1lc3NhZ2U6IGNoYXQubWVzc2FnZSwgdGltZXN0YW1wOiBub3d9KSk7XG4gIH0sXG4gIC8vIHJlbmRlcnMgb24gZXZlbnRzLCBjYWxsZWQganVzdCBhYm92ZVxuICByZW5kZXJVc2VyczogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy4kKCcub25saW5lLXVzZXJzJykuZW1wdHkoKTtcbiAgICB0aGlzLm1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpLmVhY2goZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgIHRoaXMucmVuZGVyVXNlcih1c2VyKTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyVXNlcjogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBfLnRlbXBsYXRlKCQoXCIjb25saW5lLXVzZXJzLWxpc3QtdGVtcGxhdGVcIikuaHRtbCgpKTtcbiAgICB0aGlzLiQoJy5vbmxpbmUtdXNlcnMnKS5hcHBlbmQodGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgfSxcbiAgcmVuZGVyQ2hhdHM6IGZ1bmN0aW9uKGNoYXRzKSB7XG4gICAgdGhpcy4kKCcuY2hhdGJveC1jb250ZW50JykuZW1wdHkoKTtcbiAgICBjaGF0cyA9IGNoYXRzIHx8IHRoaXMudXNlckNoYXRzO1xuICAgIGNoYXRzLmVhY2goZnVuY3Rpb24oY2hhdCkge1xuICAgICAgdGhpcy5yZW5kZXJDaGF0KGNoYXQpO1xuICAgIH0sIHRoaXMpO1xuICB9LFxuICByZW5kZXJDaGF0OiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHZhciB0ZW1wbGF0ZSA9IF8udGVtcGxhdGUoJCgnI2NoYXRib3gtbWVzc2FnZS10ZW1wbGF0ZScpLmh0bWwoKSk7XG4gICAgdmFyIGVsZW1lbnQgPSAkKHRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gICAgZWxlbWVudC5hcHBlbmRUbyh0aGlzLiQoJy5jaGF0Ym94LWNvbnRlbnQnKSkuaGlkZSgpLmZhZGVJbigpLnNsaWRlRG93bigpO1xuICAgIC8vIHRoaXMuJCgnLm5hbm8nKS5uYW5vU2Nyb2xsZXIoKTtcbiAgICAvLyB0aGlzLiQoJy5uYW5vJykubmFub1Njcm9sbGVyKHsgc2Nyb2xsOiAnYm90dG9tJyB9KTtcbiAgfSxcblxuXG4gIC8vIHJlbmRlcnMgb24gZXZlbnRzLCBjYWxsZWQganVzdCBhYm92ZVxuICByZW5kZXJSb29tczogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy4kKCcucHVibGljLXJvb21zLWNvbnRhaW5lcicpLmVtcHR5KCk7XG4gICAgdGhpcy5jb2xsZWN0aW9uLmVhY2goZnVuY3Rpb24gKHJvb20pIHtcbiAgICAgIHRoaXMucmVuZGVyUm9vbShyb29tKTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyUm9vbTogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBfLnRlbXBsYXRlKCQoXCIjcm9vbS1saXN0LXRlbXBsYXRlXCIpLmh0bWwoKSk7XG4gICAgdGhpcy4kKCcucHVibGljLXJvb21zLWNvbnRhaW5lcicpLmFwcGVuZCh0ZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICAgIC8vIHRoaXMuJCgnLnVzZXItY291bnQnKS5odG1sKHRoaXMubW9kZWwuZ2V0KFwib25saW5lVXNlcnNcIikubGVuZ3RoKTtcbiAgICAvLyB0aGlzLiQoJy5uYW5vJykubmFub1Njcm9sbGVyKCk7XG4gIH0sXG5cbiAgam9pblJvb206IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB0aGlzLnZlbnQudHJpZ2dlcignam9pblJvb20nLCBuYW1lKTtcbiAgICB2YXIgbW9kZWwgPSB0aGlzLmNvbGxlY3Rpb24uZmluZFdoZXJlKHtuYW1lOiBuYW1lfSk7XG4gICAgdGhpcy5nZXRDaGF0Q29sbGVjdGlvbihuYW1lKTtcbiAgICB0aGlzLnJlbmRlcihtb2RlbCk7XG4gIH0sXG5cblxuICAvL2V2ZW50c1xuICBtZXNzYWdlSW5wdXRQcmVzc2VkOiBmdW5jdGlvbihlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMgJiYgJC50cmltKCQoJy5tZXNzYWdlLWlucHV0JykudmFsKCkpLmxlbmd0aCA+IDApIHtcbiAgICAgIC8vIGZ1biBmYWN0OiBzZXBhcmF0ZSBldmVudHMgd2l0aCBhIHNwYWNlIGluIHRyaWdnZXIncyBmaXJzdCBhcmcgYW5kIHlvdVxuICAgICAgLy8gY2FuIHRyaWdnZXIgbXVsdGlwbGUgZXZlbnRzLlxuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJjaGF0XCIsIHRoaXMuJCgnLm1lc3NhZ2UtaW5wdXQnKS52YWwoKSk7XG4gICAgICB0aGlzLiQoJy5tZXNzYWdlLWlucHV0JykudmFsKCcnKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJ0eXBpbmdcIik7XG4gICAgICBjb25zb2xlLmxvZygnd3V0Jyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBzZXRSb29tOiBmdW5jdGlvbihlKSB7XG4gICAgdmFyICR0YXIgPSAkKGUudGFyZ2V0KTtcbiAgICBpZiAoJHRhci5pcygncCcpKSB7XG4gICAgICB0aGlzLmpvaW5Sb29tKCR0YXIuZGF0YSgncm9vbScpKTtcbiAgICB9XG4gIH1cblxuXG5cblxufSk7XG5cbn0pKGpRdWVyeSk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbiAgYXBwLlJlZ2lzdGVyVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjcmVnaXN0ZXInKS5odG1sKCkpLFxuICAgIGV2ZW50czoge1xuICAgICAgXCJjbGljayAjc2lnblVwQnRuXCI6IFwic2lnblVwXCJcbiAgICB9LFxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSxcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKCkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzaWduVXA6IGZ1bmN0aW9uKCkge1xuICAgIH1cbiAgfSk7XG5cbn0pKGpRdWVyeSk7IiwiXG4vLyBUaGUgQ2hhdENsaWVudCBpcyBpbXBsZW1lbnRlZCBvbiBtYWluLmpzLlxuLy8gVGhlIGNoYXRjbGllbnQgaXMgYSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBvbiB0aGUgTWFpbkNvbnRyb2xsZXIuXG4vLyBJdCBib3RoIGxpc3RlbnMgdG8gYW5kIGVtaXRzIGV2ZW50cyBvbiB0aGUgc29ja2V0LCBlZzpcbi8vIEl0IGhhcyBpdHMgb3duIG1ldGhvZHMgdGhhdCwgd2hlbiBjYWxsZWQsIGVtaXQgdG8gdGhlIHNvY2tldCB3LyBkYXRhLlxuLy8gSXQgYWxzbyBzZXRzIHJlc3BvbnNlIGxpc3RlbmVycyBvbiBjb25uZWN0aW9uLCB0aGVzZSByZXNwb25zZSBsaXN0ZW5lcnNcbi8vIGxpc3RlbiB0byB0aGUgc29ja2V0IGFuZCB0cmlnZ2VyIGV2ZW50cyBvbiB0aGUgYXBwRXZlbnRCdXMgb24gdGhlIFxuLy8gTWFpbkNvbnRyb2xsZXJcbnZhciBDaGF0Q2xpZW50ID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXG5cdHZhciBzZWxmID0gdGhpcztcblxuXHQvLyBpcy10eXBpbmcgaGVscGVyIHZhcmlhYmxlc1xuXHR2YXIgVFlQSU5HX1RJTUVSX0xFTkdUSCA9IDQwMDsgLy8gbXNcbiAgdmFyIHR5cGluZyA9IGZhbHNlO1xuICB2YXIgbGFzdFR5cGluZ1RpbWU7XG4gIFxuICAvLyB0aGlzIHZlbnQgaG9sZHMgdGhlIGFwcEV2ZW50QnVzXG5cdHNlbGYudmVudCA9IG9wdGlvbnMudmVudDtcblxuXHRzZWxmLmhvc3RuYW1lID0gJ2h0dHA6Ly8nICsgd2luZG93LmxvY2F0aW9uLmhvc3Q7XG5cbiAgLy8gY29ubmVjdHMgdG8gc29ja2V0LCBzZXRzIHJlc3BvbnNlIGxpc3RlbmVyc1xuXHRzZWxmLmNvbm5lY3QgPSBmdW5jdGlvbigpIHtcblx0XHQvLyB0aGlzIGlvIG1pZ2h0IGJlIGEgbGl0dGxlIGNvbmZ1c2luZy4uLiB3aGVyZSBpcyBpdCBjb21pbmcgZnJvbT9cblx0XHQvLyBpdCdzIGNvbWluZyBmcm9tIHRoZSBzdGF0aWMgbWlkZGxld2FyZSBvbiBzZXJ2ZXIuanMgYmMgZXZlcnl0aGluZ1xuXHRcdC8vIGluIHRoZSAvcHVibGljIGZvbGRlciBoYXMgYmVlbiBhdHRhY2hlZCB0byB0aGUgc2VydmVyLCBhbmQgdmlzYVxuXHRcdC8vIHZlcnNhLlxuXHRcdHNlbGYuc29ja2V0ID0gaW8uY29ubmVjdChzZWxmLmhvc3RuYW1lKTtcblx0XHRzZWxmLnNldFJlc3BvbnNlTGlzdGVuZXJzKHNlbGYuc29ja2V0KTtcblx0fTtcblxuXG4vLy8vLyBWaWV3RXZlbnRCdXMgbWV0aG9kcyAvLy8vXG4gICAgLy8gbWV0aG9kcyB0aGF0IGVtaXQgdG8gdGhlIGNoYXRzZXJ2ZXJcbiAgc2VsZi5sb2dpbiA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAvLyBlbWl0cyBsb2dpbiBldmVudCB0byBjaGF0c2VydmVyXG5cdFx0c2VsZi5zb2NrZXQuZW1pdChcImxvZ2luXCIsIG5hbWUpO1xuXHR9O1xuICBzZWxmLmNoYXQgPSBmdW5jdGlvbihjaGF0KSB7XG4gICAgLy8gZW1pdHMgY2hhdCBldmVudCB0byBjaGF0c2VydmVyXG5cdFx0c2VsZi5zb2NrZXQuZW1pdChcImNoYXRcIiwgY2hhdCk7XG5cdH07XG5cblxuICAvLyBUeXBpbmcgbWV0aG9kc1xuXHRzZWxmLmFkZENoYXRUeXBpbmcgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIG1lc3NhZ2UgPSBkYXRhLnVzZXJuYW1lICsgJyBpcyB0eXBpbmcnO1xuICAgICQoJy50eXBldHlwZXR5cGUnKS50ZXh0KG1lc3NhZ2UpO1xuXHR9O1xuXHRzZWxmLnJlbW92ZUNoYXRUeXBpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAkKCcudHlwZXR5cGV0eXBlJykuZW1wdHkoKTtcblx0fTtcbiAgc2VsZi51cGRhdGVUeXBpbmcgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoc2VsZi5zb2NrZXQpIHtcbiAgICAgIGlmICghdHlwaW5nKSB7XG4gICAgICAgIHR5cGluZyA9IHRydWU7XG4gICAgICAgIHNlbGYuc29ja2V0LmVtaXQoJ3R5cGluZycpO1xuICAgICAgfVxuICAgICAgbGFzdFR5cGluZ1RpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHR5cGluZ1RpbWVyID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgICAgICAgdmFyIHRpbWVEaWZmID0gdHlwaW5nVGltZXIgLSBsYXN0VHlwaW5nVGltZTtcbiAgICAgICAgaWYgKHRpbWVEaWZmID49IFRZUElOR19USU1FUl9MRU5HVEggJiYgdHlwaW5nKSB7XG4gICAgICAgICAgIHNlbGYuc29ja2V0LmVtaXQoJ3N0b3AgdHlwaW5nJyk7XG4gICAgICAgICAgIHR5cGluZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9LCBUWVBJTkdfVElNRVJfTEVOR1RIKTtcbiAgICB9XG4gIH07XG5cblxuICAvLyBqb2luIHJvb21cbiAgc2VsZi5qb2luUm9vbSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KCdqb2luUm9vbScsIG5hbWUpO1xuICB9O1xuXG4gIC8vIHNldCByb29tXG4gIHNlbGYuc2V0Um9vbSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBpZiAobmFtZSAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5jdXJyZW50Um9vbSA9IG5hbWU7XG4gICAgfVxuICAgIC8vLz4+Pj4+Pj4gY2hhbmdldGhpc3RvIC5jaGF0LXRpdGxlXG4gICAgdmFyICRjaGF0VGl0bGUgPSAkKCcuY2hhdGJveC1oZWFkZXItdXNlcm5hbWUnKTtcbiAgICAkY2hhdFRpdGxlLnRleHQobmFtZSk7XG4gICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAkKCcuY2hhdC1kaXJlY3RvcnknKS5maW5kKCcucm9vbScpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgJHJvb20gPSAkKHRoaXMpO1xuICAgICAgJHJvb20ucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgaWYgKCRyb29tLmRhdGEoJ25hbWUnKSA9PT0gdGhpc18uY3VycmVudFJvb20pIHtcbiAgICAgICAgJHJvb20uYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuICBcblxuXG5cbiAgLy8vLy8vLy8vLy8vLy8gY2hhdHNlcnZlciBsaXN0ZW5lcnMvLy8vLy8vLy8vLy8vXG5cbiAgLy8gdGhlc2UgZ3V5cyBsaXN0ZW4gdG8gdGhlIGNoYXRzZXJ2ZXIvc29ja2V0IGFuZCBlbWl0IGRhdGEgdG8gbWFpbi5qcyxcbiAgLy8gc3BlY2lmaWNhbGx5IHRvIHRoZSBhcHBFdmVudEJ1cy5cblx0c2VsZi5zZXRSZXNwb25zZUxpc3RlbmVycyA9IGZ1bmN0aW9uKHNvY2tldCkge1xuXHRcdC8vIGNsaWVudCBsaXN0ZW5lcnMgdGhhdCBsaXN0ZW4gdG8gdGhlIGNoYXRzZXJ2ZXIgYW5kIGl0c2VsZi5cblx0XHQvLyBFYWNoIHNlcnZlciBldmVudCB0cmlnZ2VycyBhbiBhcHBFdmVudEJ1cyBldmVudCBwYWlyZWQgd2l0aCBcblx0XHQvLyByZWxldmFudCBkYXRhLlxuXG5cdFx0c29ja2V0Lm9uKCd3ZWxjb21lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgLy8gZW1pdHMgZXZlbnQgdG8gcmVjYWxpYnJhdGUgb25saW5lVXNlcnMgY29sbGVjdGlvblxuICAgICAgc29ja2V0LmVtaXQoXCJnZXRPbmxpbmVVc2Vyc1wiKTtcbiAgICAgIHNvY2tldC5lbWl0KFwicm9vbXNcIik7XG5cdFx0XHRjb25zb2xlLmxvZygnb25saW5lVXNlcnMxOiAnLCBkYXRhKTtcbiAgICAgIC8vIGRhdGEgaXMgdW5kZWZpbmVkIGF0IHRoaXMgcG9pbnQgYmVjYXVzZSBpdCdzIHRoZSBmaXJzdCB0b1xuICAgICAgLy8gZmlyZSBvZmYgYW4gZXZlbnQgY2hhaW4gdGhhdCB3aWxsIGFwcGVuZCB0aGUgbmV3IHVzZXIgdG8gXG4gICAgICAvLyB0aGUgb25saW5lVXNlciBjb2xsZWN0aW9uXG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcImxvZ2luRG9uZVwiLCBkYXRhKTtcbiAgICB9KTtcblxuXHRcdHNvY2tldC5vbignbG9naW5OYW1lRXhpc3RzJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgLy8gZGF0YSA9PT0gc3RyaW5nIG9mIHVzZWQgdXNlcm5hbWVcblx0XHRcdGNvbnNvbGUubG9nKCdsb2dpbk5hbWVFeGlzdHM6ICcsIGRhdGEpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJsb2dpbk5hbWVFeGlzdHNcIiwgZGF0YSk7XG5cdFx0fSk7XG5cdFx0c29ja2V0Lm9uKCdsb2dpbk5hbWVCYWQnLCBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHQvLyBkYXRhID09PSBzdHJpbmcgb2YgYmFkIHVzZXJuYW1lXG5cdFx0XHRjb25zb2xlLmxvZygnbG9naW5OYW1lQmFkOiAnLCBkYXRhKTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwibG9naW5OYW1lQmFkXCIsIGRhdGEpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gdGhpcyBpcyB0aGUgc2Vjb25kIGxpc3RlbmVyIHRvIG9ubGluZVVzZXJzXG5cdFx0Ly8gYnkgdGhlIHRpbWUgdGhpcyBpcyBjYWxsZWQsIHRoZSBuZXcgdXNlciBoYXMgYmVlbiBhZGRlZCB0b1xuXHRcdC8vIHRoZSB1c2VyIGNvbGxlY3Rpb24uXG5cdFx0c29ja2V0Lm9uKCd1c2Vyc0luZm8nLCBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHQvLyB0aGlzIGRhdGEgaXMgYW4gYXJyYXkgd2l0aCBhbGwgdGhlIG9ubGluZSB1c2VyJ3MgdXNlcm5hbWVzLlxuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJ1c2Vyc0luZm9cIiwgZGF0YSk7XG5cdFx0fSk7XG4gICAgc29ja2V0Lm9uKCdyb29tcycsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIC8vIHRoaXMgZGF0YSBpcyBhbiBhcnJheSB3aXRoIGFsbCB0aGUgb25saW5lIHVzZXIncyB1c2VybmFtZXMuXG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInJvb21JbmZvXCIsIGRhdGEpO1xuICAgIH0pO1xuXG5cdFx0c29ja2V0Lm9uKCd1c2VySm9pbmVkJywgZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0Ly8gZGF0YSA9PT0gdXNlcm5hbWUgb2YgdXNlciBqb2luZWRcblx0XHRcdGNvbnNvbGUubG9nKCd1c2VySm9pbmVkOiAnLCBkYXRhKTtcbiAgICAgIHNvY2tldC5lbWl0KFwiZ2V0T25saW5lVXNlcnNcIik7XG5cdFx0XHRzZWxmLnZlbnQudHJpZ2dlcihcInVzZXJKb2luZWRcIiwgZGF0YSk7XG5cdFx0fSk7XG5cdFx0c29ja2V0Lm9uKCd1c2VyTGVmdCcsIGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdC8vIGRhdGEgPT09IHVzZXJuYW1lIG9mIHVzZXIgcmVtb3ZlZFxuXHRcdFx0Y29uc29sZS5sb2coJ3VzZXJMZWZ0OiAnLCBkYXRhKTtcbiAgICAgIHNvY2tldC5lbWl0KFwiZ2V0T25saW5lVXNlcnNcIik7XG5cdFx0XHRzZWxmLnZlbnQudHJpZ2dlcihcInVzZXJMZWZ0XCIsIGRhdGEpO1xuXHRcdH0pO1xuXHRcdHNvY2tldC5vbignY2hhdCcsIGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdC8vIGRhdGEgPT09IGNoYXQgbWVzc2FnZSBvYmplY3Rcblx0XHRcdGNvbnNvbGUubG9nKCdjaGF0ZGF0YTogJywgZGF0YSk7XG5cdFx0XHRzZWxmLnZlbnQudHJpZ2dlcihcImNoYXRSZWNlaXZlZFwiLCBkYXRhKTtcblx0XHR9KTtcbiAgICBzb2NrZXQub24oJ3NldFJvb20nLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldFJvb21cIiwgbmFtZSk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdjaGF0bG9nJywgZnVuY3Rpb24oY2hhdGxvZykge1xuICAgICAgY29uc29sZS5sb2coJyB0aGVpcyBpcyBkZXkgY2hhdCBsYXdnOiAnLCBjaGF0bG9nKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0Q2hhdGxvZ1wiLCBjaGF0bG9nKTtcbiAgICB9KTtcblxuXG4gICAgLy8gdGhlc2UgZ3V5cyBsaXN0ZW4gdG8gdGhlIHNlcnZlciwgXG4gICAgLy8gdGhlbiBjYWxsIGNoYXRjbGllbnQgbWV0aG9kcyBsaXN0ZWQgYWJvdmVcbiAgICBzb2NrZXQub24oJ3R5cGluZycsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHNlbGYuYWRkQ2hhdFR5cGluZyhkYXRhKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ3N0b3AgdHlwaW5nJywgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnJlbW92ZUNoYXRUeXBpbmcoKTtcbiAgICB9KTtcblxuXG5cblx0fTtcbn07IiwiXG5cbmFwcC5NYWluQ29udHJvbGxlciA9IGZ1bmN0aW9uKCkge1xuXG5cdHZhciBzZWxmID0gdGhpcztcblxuXG4gIC8vVGhlc2UgYWxsb3dzIHVzIHRvIGJpbmQgYW5kIHRyaWdnZXIgb24gdGhlIG9iamVjdCBmcm9tIGFueXdoZXJlIGluIHRoZSBhcHAuXG5cdHNlbGYuYXBwRXZlbnRCdXMgPSBfLmV4dGVuZCh7fSwgQmFja2JvbmUuRXZlbnRzKTtcblx0c2VsZi52aWV3RXZlbnRCdXMgPSBfLmV4dGVuZCh7fSwgQmFja2JvbmUuRXZlbnRzKTtcblxuXHRzZWxmLmluaXQgPSBmdW5jdGlvbigpIHtcblx0XHQvLyBjcmVhdGVzIENoYXRDbGllbnQgZnJvbSBzb2NrZXRjbGllbnQuanMsIHBhc3NlcyBpbiBcblx0XHQvLyBhcHBFdmVudEJ1cyBhcyB2ZW50LCBjb25uZWN0c1xuXHRcdHNlbGYuY2hhdENsaWVudCA9IG5ldyBDaGF0Q2xpZW50KHsgdmVudDogc2VsZi5hcHBFdmVudEJ1cyB9KTtcblx0XHRzZWxmLmNoYXRDbGllbnQuY29ubmVjdCgpO1xuXG4gICAgLy8gbG9naW5Nb2RlbFxuXHRcdHNlbGYubG9naW5Nb2RlbCA9IG5ldyBhcHAuTG9naW5Nb2RlbCgpO1xuICAgIHNlbGYubG9naW5WaWV3ID0gbmV3IGFwcC5Mb2dpblZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzLCBtb2RlbDogc2VsZi5sb2dpbk1vZGVsfSk7XG4gICAgc2VsZi5yZWdpc3RlclZpZXcgPSBuZXcgYXBwLlJlZ2lzdGVyVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXMgfSk7XG5cbiAgICAvLyBUaGUgQ29udGFpbmVyTW9kZWwgZ2V0cyBwYXNzZWQgYSB2aWV3U3RhdGUsIExvZ2luVmlldywgd2hpY2hcbiAgICAvLyBpcyB0aGUgbG9naW4gcGFnZS4gVGhhdCBMb2dpblZpZXcgZ2V0cyBwYXNzZWQgdGhlIHZpZXdFdmVudEJ1c1xuICAgIC8vIGFuZCB0aGUgTG9naW5Nb2RlbC5cblx0XHRzZWxmLmNvbnRhaW5lck1vZGVsID0gbmV3IGFwcC5Db250YWluZXJNb2RlbCh7IHZpZXdTdGF0ZTogc2VsZi5sb2dpblZpZXd9KTtcblxuXHRcdC8vIG5leHQsIGEgbmV3IENvbnRhaW5lclZpZXcgaXMgaW50aWFsaXplZCB3aXRoIHRoZSBuZXdseSBjcmVhdGVkIGNvbnRhaW5lck1vZGVsXG5cdFx0Ly8gdGhlIGxvZ2luIHBhZ2UgaXMgdGhlbiByZW5kZXJlZC5cblx0XHRzZWxmLmNvbnRhaW5lclZpZXcgPSBuZXcgYXBwLkNvbnRhaW5lclZpZXcoeyBtb2RlbDogc2VsZi5jb250YWluZXJNb2RlbCB9KTtcblx0XHRzZWxmLmNvbnRhaW5lclZpZXcucmVuZGVyKCk7XG5cdH07XG5cblxuXG4gIC8vLy8vLy8vLy8vLyAgQnVzc2VzIC8vLy8vLy8vLy8vL1xuICAgIC8vIFRoZXNlIEJ1c3NlcyBsaXN0ZW4gdG8gdGhlIHNvY2tldGNsaWVudFxuICAgLy8gICAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblxuICAvLy8vIHZpZXdFdmVudEJ1cyBMaXN0ZW5lcnMgLy8vLy9cbiAgXG5cdHNlbGYudmlld0V2ZW50QnVzLm9uKFwibG9naW5cIiwgZnVuY3Rpb24odXNlcm5hbWUpIHtcbiAgICAvLyBzb2NrZXRpbyBsb2dpbiwgc2VuZHMgbmFtZSB0byBzb2NrZXRjbGllbnQsIHNvY2tldGNsaWVudCBzZW5kcyBpdCB0byBjaGF0c2VydmVyXG4gICAgc2VsZi5jaGF0Q2xpZW50LmxvZ2luKHVzZXJuYW1lKTtcbiAgfSk7XG5cdHNlbGYudmlld0V2ZW50QnVzLm9uKFwiY2hhdFwiLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgLy8gc29ja2V0aW8gY2hhdCwgc2VuZHMgY2hhdCB0byBzb2NrZXRjbGllbnQsIHNvY2tldGNsaWVudCB0byBjaGF0c2VydmVyXG4gICAgc2VsZi5jaGF0Q2xpZW50LmNoYXQoY2hhdCk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcInR5cGluZ1wiLCBmdW5jdGlvbigpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQudXBkYXRlVHlwaW5nKCk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImpvaW5Sb29tXCIsIGZ1bmN0aW9uKHJvb20pIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuam9pblJvb20ocm9vbSk7XG4gIH0pO1xuXG5cblxuXG5cblxuXG5cbiAgLy8vLyBhcHBFdmVudEJ1cyBMaXN0ZW5lcnMgLy8vL1xuXG4gIC8vIGFmdGVyIHRoZSAnd2VsY29tZScgZXZlbnQgdHJpZ2dlcnMgb24gdGhlIHNvY2tlY2xpZW50LCB0aGUgbG9naW5Eb25lIGV2ZW50IHRyaWdnZXJzLlxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwibG9naW5Eb25lXCIsIGZ1bmN0aW9uKCkge1xuXG5cdFx0Ly8gbmV3IG1vZGVsIGFuZCB2aWV3IGNyZWF0ZWQgZm9yIGNoYXRyb29tXG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsID0gbmV3IGFwcC5DaGF0cm9vbU1vZGVsKCk7XG4gICAgc2VsZi5jaGF0cm9vbUxpc3QgPSBuZXcgYXBwLkNoYXRyb29tTGlzdCgpO1xuXHRcdHNlbGYuY2hhdHJvb21WaWV3ICA9IG5ldyBhcHAuQ2hhdHJvb21WaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cywgbW9kZWw6IHNlbGYuY2hhdHJvb21Nb2RlbCwgY29sbGVjdGlvbjogc2VsZi5jaGF0cm9vbUxpc3R9KTtcblxuXHRcdC8vIHZpZXdzdGF0ZSBpcyBjaGFuZ2VkIHRvIGNoYXRyb29tIGFmdGVyIGxvZ2luLlxuXHRcdHNlbGYuY29udGFpbmVyTW9kZWwuc2V0KFwidmlld1N0YXRlXCIsIHNlbGYuY2hhdHJvb21WaWV3KTtcbiAgICBhdXRvc2l6ZSgkKCd0ZXh0YXJlYS5tZXNzYWdlLWlucHV0JykpO1xuXHRcdCQoJy5jaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuXHR9KTtcblxuICAvLyBlcnJvciBsaXN0ZW5lcnNcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcImxvZ2luTmFtZUJhZFwiLCBmdW5jdGlvbih1c2VybmFtZSkge1xuXHRcdHNlbGYubG9naW5Nb2RlbC5zZXQoXCJlcnJvclwiLCBcIkludmFsaWQgTmFtZVwiKTtcblx0fSk7XG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJsb2dpbk5hbWVFeGlzdHNcIiwgZnVuY3Rpb24odXNlcm5hbWUpIHtcblx0XHRzZWxmLmxvZ2luTW9kZWwuc2V0KFwiZXJyb3JcIiwgXCJOYW1lIGFscmVhZHkgZXhpc3RzXCIpO1xuXHR9KTtcblxuXG5cblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwiZ290b0xvZ2luXCIsIGZ1bmN0aW9uKCkge1xuICAgIHNlbGYuY29udGFpbmVyTW9kZWwuc2V0KFwidmlld1N0YXRlXCIsIHNlbGYubG9naW5WaWV3KTtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcImdvdG9SZWdpc3RlclwiLCBmdW5jdGlvbigpIHtcbiAgICBzZWxmLmNvbnRhaW5lck1vZGVsLnNldChcInZpZXdTdGF0ZVwiLCBzZWxmLnJlZ2lzdGVyVmlldyk7XG4gIH0pO1xuXG5cblxuXG5cbiAgLy8gYWZ0ZXIgJ29ubGluZVVzZXJzJyBldmVudCBlbWl0cywgdGhlICd1c2Vyc0luZm8nIGV2ZW50IHRyaWdnZXJzXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2Vyc0luZm9cIiwgZnVuY3Rpb24oZGF0YSkge1xuICAgIC8vZGF0YSBpcyBhbiBhcnJheSBvZiB1c2VybmFtZXMsIGluY2x1ZGluZyB0aGUgbmV3IHVzZXJcblx0XHQvLyBUaGlzIG1ldGhvZCBnZXRzIHRoZSBvbmxpbmUgdXNlcnMgY29sbGVjdGlvbiBmcm9tIGNoYXRyb29tTW9kZWwuXG5cdFx0Ly8gb25saW5lVXNlcnMgaXMgdGhlIGNvbGxlY3Rpb25cblx0XHR2YXIgb25saW5lVXNlcnMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KFwib25saW5lVXNlcnNcIik7XG5jb25zb2xlLmxvZyhcIm9ubGluZVVzZXJzOiAtLS1cIiwgb25saW5lVXNlcnMpO1xuICAgLy8gdXNlcnMgaXMgYXJyYXkgb2YgdGhlIGN1cnJlbnQgdXNlciBtb2RlbHNcblx0XHR2YXIgdXNlcnMgPSBfLm1hcChkYXRhLCBmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRyZXR1cm4gbmV3IGFwcC5Vc2VyTW9kZWwoe3VzZXJuYW1lOiBpdGVtfSk7XG5cdFx0fSk7XG5jb25zb2xlLmxvZyhcInVzZXJzOiAtLS1cIiwgdXNlcnMpO1xuICAgIC8vIHRoaXMgcmVzZXRzIHRoZSBjb2xsZWN0aW9uIHdpdGggdGhlIHVwZGF0ZWQgYXJyYXkgb2YgdXNlcnNcblx0XHRvbmxpbmVVc2Vycy5yZXNldCh1c2Vycyk7XG5cdH0pO1xuXG5cblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJyb29tSW5mb1wiLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgLy8gVGhpcyBtZXRob2QgZ2V0cyB0aGUgb25saW5lIHVzZXJzIGNvbGxlY3Rpb24gZnJvbSBjaGF0cm9vbU1vZGVsLlxuICAgIC8vIG9ubGluZVVzZXJzIGlzIHRoZSBjb2xsZWN0aW9uXG4gICAgdmFyIHJvb21zID0gc2VsZi5jaGF0cm9vbUxpc3Q7XG4gICAgIGNvbnNvbGUubG9nKFwiUk9PTVM6IFwiLCByb29tcyk7XG5cbiAgIC8vIHVzZXJzIGlzIGFycmF5IG9mIHRoZSBjdXJyZW50IHJvb20gbW9kZWxzXG4gICAgdmFyIHVwZGF0ZWRSb29tcyA9IF8ubWFwKGRhdGEsIGZ1bmN0aW9uKHJvb20pIHtcbiAgICAgIHZhciBuZXdDaGF0cm9vbU1vZGVsID0gbmV3IGFwcC5DaGF0cm9vbU1vZGVsKHtuYW1lOiByb29tLm5hbWV9KTtcbiAgICAgIC8vIF8ubWFwKHJvb20uY2hhdGxvZywgZnVuY3Rpb24oY2hhdCkge1xuICAgICAgLy8gICBkZWJ1Z2dlcjtcbiAgICAgIC8vICAgc2VsZi5jaGF0cm9vbVZpZXcudXNlckNoYXRzLnB1c2goY2hhdCk7XG4gICAgICAvLyB9KTtcbiAgICAgIHJldHVybiBuZXdDaGF0cm9vbU1vZGVsO1xuICAgIH0pO1xuY29uc29sZS5sb2coXCJVUERBVEVEIFJPT01TOiBcIiwgdXBkYXRlZFJvb21zKTtcbiAgICAvLyB0aGlzIHJlc2V0cyB0aGUgY29sbGVjdGlvbiB3aXRoIHRoZSB1cGRhdGVkIGFycmF5IG9mIHJvb21zXG4gICAgcm9vbXMucmVzZXQodXBkYXRlZFJvb21zKTtcbiAgfSk7XG5cblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0Um9vbVwiLCBmdW5jdGlvbihyb29tKSB7XG4gIC8vICAgaWYgKHNlbGYuY2hhdHJvb21WaWV3ICE9PSB1bmRlZmluZWQpIHtcbiAgLy8gICBkZWJ1Z2dlcjtcbiAgLy8gICBzZWxmLmNoYXRyb29tVmlldy5zdG9wTGlzdGVuaW5nKCk7XG4gIC8vICAgc2VsZi5jaGF0cm9vbU1vZGVsID0gbmV3IGFwcC5DaGF0cm9vbU1vZGVsKCk7XG4gIC8vICAgc2VsZi5jaGF0cm9vbVZpZXcgID0gbmV3IGFwcC5DaGF0cm9vbVZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzLCBtb2RlbDogc2VsZi5jaGF0cm9vbU1vZGVsLCBjb2xsZWN0aW9uOiBzZWxmLmNoYXRyb29tTGlzdH0pO1xuXG4gIC8vICAgLy8gdmlld3N0YXRlIGlzIGNoYW5nZWQgdG8gY2hhdHJvb20gYWZ0ZXIgbG9naW4uXG4gIC8vICAgc2VsZi5jb250YWluZXJNb2RlbC5zZXQoXCJ2aWV3U3RhdGVcIiwgc2VsZi5jaGF0cm9vbVZpZXcpO1xuICAvLyAgIGF1dG9zaXplKCQoJ3RleHRhcmVhLm1lc3NhZ2UtaW5wdXQnKSk7XG4gIC8vICAgJCgnLmNoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJy5jaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG4gIC8vIH1cbiAgICBzZWxmLmNoYXRDbGllbnQuc2V0Um9vbShyb29tKTtcbiAgfSk7XG5cblxuXG5cblxuICAvLyBhZGRzIG5ldyB1c2VyIHRvIHVzZXJzIGNvbGxlY3Rpb24sIHNlbmRzIGRlZmF1bHQgam9pbmluZyBtZXNzYWdlXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2VySm9pbmVkXCIsIGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLmFkZFVzZXIodXNlcm5hbWUpO1xuXHRcdHNlbGYuY2hhdHJvb21Nb2RlbC5hZGRDaGF0KHtzZW5kZXI6IFwiQnV0dGVyc1wiLCBtZXNzYWdlOiB1c2VybmFtZSArIFwiIGpvaW5lZCByb29tLlwiIH0pO1xuXHR9KTtcblxuXHQvLyByZW1vdmVzIHVzZXIgZnJvbSB1c2VycyBjb2xsZWN0aW9uLCBzZW5kcyBkZWZhdWx0IGxlYXZpbmcgbWVzc2FnZVxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwidXNlckxlZnRcIiwgZnVuY3Rpb24odXNlcm5hbWUpIHtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwucmVtb3ZlVXNlcih1c2VybmFtZSk7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLmFkZENoYXQoe3NlbmRlcjogXCJCdXR0ZXJzXCIsIG1lc3NhZ2U6IHVzZXJuYW1lICsgXCIgbGVmdCByb29tLlwiIH0pO1xuXHR9KTtcblxuXHQvLyBjaGF0IHBhc3NlZCBmcm9tIHNvY2tldGNsaWVudCwgYWRkcyBhIG5ldyBjaGF0IG1lc3NhZ2UgdXNpbmcgY2hhdHJvb21Nb2RlbCBtZXRob2Rcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcImNoYXRSZWNlaXZlZFwiLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgc2VsZi5jaGF0cm9vbVZpZXcuZ29ycChjaGF0KTtcblx0XHQkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnLmNoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcblx0fSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldENoYXRsb2dcIiwgZnVuY3Rpb24oY2hhdGxvZykge1xuICAgIHZhciBuZXdMaXN0ID0gbmV3IGFwcC5DaGF0Q29sbGVjdGlvbihjaGF0bG9nKTtcbiAgICBzZWxmLmNoYXRyb29tVmlldy5yZW5kZXJDaGF0cyhuZXdMaXN0KTtcbiAgICAkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnLmNoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcbiAgfSk7XG59O1xuXG4iLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIHZhciBDaGF0cm9vbVJvdXRlciA9IEJhY2tib25lLlJvdXRlci5leHRlbmQoe1xuICAgIFxuICAgIHJvdXRlczoge1xuICAgICAgJyc6ICdzdGFydCcsXG4gICAgICAnbG9nJzogJ2xvZ2luJyxcbiAgICAgICdyZWcnOiAncmVnaXN0ZXInLFxuICAgIH0sXG5cbiAgICBzdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIgPSBuZXcgYXBwLk1haW5Db250cm9sbGVyKCk7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIuaW5pdCgpO1xuICAgIH0sXG5cbiAgICBsb2dpbjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbG9naW5Nb2RlbCA9IG5ldyBhcHAuTG9naW5Nb2RlbCgpO1xuICAgICAgdmFyIGxvZ2luVmlldyA9IG5ldyBhcHAuTG9naW5WaWV3KHt2ZW50OiBhcHAubWFpbkNvbnRyb2xsZXIudmlld0V2ZW50QnVzLCBtb2RlbDogbG9naW5Nb2RlbH0pO1xuICAgICAgYXBwLm1haW5Db250cm9sbGVyLmNvbnRhaW5lck1vZGVsLnNldChcInZpZXdTdGF0ZVwiLCBsb2dpblZpZXcpO1xuICAgIH0sXG5cbiAgICByZWdpc3RlcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcmVnaXN0ZXJWaWV3ID0gbmV3IGFwcC5SZWdpc3RlclZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzIH0pO1xuICAgICAgYXBwLm1haW5Db250cm9sbGVyLmNvbnRhaW5lck1vZGVsLnNldChcInZpZXdTdGF0ZVwiLCByZWdpc3RlclZpZXcpO1xuICAgIH1cblxuICB9KTtcblxuICBhcHAuQ2hhdHJvb21Sb3V0ZXIgPSBuZXcgQ2hhdHJvb21Sb3V0ZXIoKTtcbiAgQmFja2JvbmUuaGlzdG9yeS5zdGFydCgpO1xuXG59KSgpOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==