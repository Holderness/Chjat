
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
    model: app.ChatModel
  });

})();

var app = app || {};

(function () {

  app.UserCollection = Backbone.Collection.extend({model: app.UserModel});

})();

var app = app || {};

(function () {

app.ChatroomModel = Backbone.Model.extend({
  urlRoot: '/api/chatrooms',
  defaults: {
    name: 'DOO',
    onlineUsers: new app.UserCollection(),
    chatlog: new app.ChatCollection([
      // message and sender upon entering chatroom
      new app.ChatModel({ sender: 'Butters', message: 'awwwwww hamburgers. ||):||', timestamp: _.now() })
      ]),
    chatrooms: null
  },
  events: {
     "chatrooms:change": "loadModel"
  },
  initialize: function() {
    // this.trigger('getChatroomModel', this.get('name'));
  },
  loadModel: function(model) {
    console.log('bone diddly');
    debugger;
  },
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
  parse: function( response ) {
    response.id = response._id;
    return response;
  }
});

})();

var app = app || {};

(function () {

  app.ChatroomList = Backbone.Collection.extend({
    model: app.ChatroomModel,
    url: '/api/chatrooms',
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
    var this_ = this;
    // these get the collection of onlineUsers and userChats from the chatroomModel
   

  },
  render: function(model) {
    this.model = model || this.model;
    this.$el.html(this.template());
        // this.renderChats();
    // this.setChatCollection();
    // this.renderUsers();
    this.setChatListeners();
    // this.renderRooms();

    return this;
  },
  // setChatCollection: function() {
  //     this.userChats = new app.ChatCollection([
  //       // message and sender upon entering chatroom
  //       new app.ChatModel({ sender: 'Butters', message: 'awwwwww hamburgers. ||):||', timestamp: _.now() })
  //     ]);
  // },
  setChatListeners: function() {
    this.stopListening();


    // this.listenTo(this.model, "getChatroomModel", this.getChatroomModel, this);


    // var onlineUsers = this.model.get('onlineUsers');
   // sets event listeners on the collections
    // this.listenTo(onlineUsers, "add", this.renderUser, this);
    // this.listenTo(onlineUsers, "remove", this.renderUsers, this);
    // this.listenTo(onlineUsers, "reset", this.renderUsers, this);
        // this.listenTo(onlineUsers, "change", this.renderUsers, this);

    // var chatlog = this.model.get('chatlog');
    // this.listenTo(chatlog, "add", this.renderChat, this);
    // this.listenTo(chatlog, "remove", this.renderChats, this);
    // this.listenTo(chatlog, "reset", this.renderChats, this);
    // this.listenTo(chatlog, "change", this.renderChats, this);

    // var chatrooms = this.model.get('chatrooms');

    // this.listenTo(chatrooms, "add", this.renderRoom, this);
    // this.listenTo(chatrooms, "remove", this.renderRooms, this);
    // this.listenTo(chatrooms, "reset", this.renderRooms, this);
    // this.listenTo(chatrooms, "change", this.renderRooms, this);

    this.listenTo(this.model, "change:onlineUsers", this.renderUsers, this);
    this.listenTo(this.model, "change:chatlog", this.renderChats, this);
    this.listenTo(this.model, "change:chatrooms", this.renderRooms, this);

    // this.listenTo(this.model, "gorp", this.gorp, this);
    // this.model.on('gorp', function(chat) {
    //   this.gorp(chat);
    // });




  },

  gorp: function(chat) {
    var now = _.now();

    this.userChats.add(new app.ChatModel({ sender: chat.sender, message: chat.message, timestamp: now}));
  },
  getChatroomModel: function(name) {
    this.vent.trigger('getChatroomModel', name);
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
  renderChats: function() {
    this.$('.chatbox-content').empty();
    this.model.get('chatlog').each(function(chat) {
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
    this.model.get('chatrooms').each(function (room) {
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
    // this.getChatCollection(name);
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
    template: _.template($('#login').html()),
    events: {
      'submit': 'onLogin',
      // 'keypress #nameText': 'onHitEnter'
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
      this.vent.trigger("login", {username: this.$('#username').val(), password: this.$('#password').val()});
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

  self.connectToRoom = function(name) {
    self.socket.emit("connectToRoom", name);
  };

  self.getChatroomModel = function(name) {
    self.socket.emit("getChatroomModel", name);
  };


///// ViewEventBus methods ////
    // methods that emit to the chatserver
  self.login = function(user) {
    // emits login event to chatserver
		self.socket.emit("login", user);
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

		// socket.on('loginNameExists', function(data) {
  //     // data === string of used username
		// 	console.log('loginNameExists: ', data);
		// 	self.vent.trigger("loginNameExists", data);
		// });
		// socket.on('loginNameBad', function(data) {
		// 	// data === string of bad username
		// 	console.log('loginNameBad: ', data);
		// 	self.vent.trigger("loginNameBad", data);
		// });

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
    socket.on('ChatroomModel', function(model) {
      // self.vent.trigger("ChatroomModel", model);
      self.vent.trigger("setRoom", model);
    });
    socket.on('achatrooms', function(chatrooms) {
      console.log('chatrooms:  ', chatrooms);
      self.vent.trigger("setChatrooms", chatrooms);
    });
    socket.on('aonlineUsers', function(onlineUsers) {
      console.log('online users: ', onlineUsers);
      self.vent.trigger("setOnlineUsers", onlineUsers);
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

		// self.chatClient = new ChatClient({ vent: self.appEventBus });
		// self.chatClient.connect();

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

  self.authenticated = function() {

    self.chatClient = new ChatClient({ vent: self.appEventBus });
    self.chatClient.connect();


    // new model and view created for chatroom
    self.chatroomModel = new app.ChatroomModel({ name: 'DOO' });
    self.chatroomList = new app.ChatroomList();
    self.chatroomList.fetch().done(function() {
      self.chatroomModel.set('chatrooms', self.chatroomList);
      // self.chatroomModel.loadModel();
      self.chatroomView  = new app.ChatroomView({vent: self.viewEventBus, model: self.chatroomModel });
      debugger;
      self.containerModel = new app.ContainerModel({ viewState: self.chatroomView});
      self.containerView = new app.ContainerView({ model: self.containerModel });
      debugger;
      self.containerView.render();



      // self.containerModel.set("viewState", self.chatroomView);

      autosize($('textarea.message-input'));
      $('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;

            self.chatClient.connectToRoom("DOO");

     


    });

  };



  ////////////  Busses ////////////
    // These Busses listen to the socketclient
   //    ---------------------------------


  //// viewEventBus Listeners /////
  
	self.viewEventBus.on("login", function(user) {
    // socketio login, sends name to socketclient, socketclient sends it to chatserver
    self.chatClient.login(user);
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
  self.viewEventBus.on("getChatroomModel", function(name) {
    self.chatClient.getChatroomModel(name);
  });








  //// appEventBus Listeners ////

  // after the 'welcome' event triggers on the sockeclient, the loginDone event triggers.
	// self.appEventBus.on("loginDone", function() {

	// 	// new model and view created for chatroom
	// 	self.chatroomModel = new app.ChatroomModel();
 //    self.chatroomList = new app.ChatroomList();
	// 	self.chatroomView  = new app.ChatroomView({vent: self.viewEventBus, model: self.chatroomModel, collection: self.chatroomList});

	// 	// viewstate is changed to chatroom after login.
	// 	self.containerModel.set("viewState", self.chatroomView);
 //    autosize($('textarea.message-input'));
	// 	$('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
	// });

  // error listeners
	// self.appEventBus.on("loginNameBad", function(username) {
	// 	self.loginModel.set("error", "Invalid Name");
	// });
	// self.appEventBus.on("loginNameExists", function(username) {
	// 	self.loginModel.set("error", "Name already exists");
	// });







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
    var rooms = self.chatroomModel.get("chatrooms");
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


  self.appEventBus.on("setRoom", function(model) {
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
    // self.chatClient.setRoom(room);
    
        var newList = new app.ChatCollection(model.chatlog);
    self.chatroomModel.set('chatlog', newList);


    var newList = new app.ChatroomList(model.chatrooms);
    self.chatroomModel.set('chatrooms', newList);

    var newList = new app.UserCollection(model.onlineUsers);
    self.chatroomModel.set('onlineUsers', newList);

  });


  self.appEventBus.on("ChatroomModel", function(model) {
      debugger;
    self.chatroomModel = new app.ChatroomModel();
    self.chatroomList = new app.ChatroomList();
    self.chatroomView  = new app.ChatroomView({vent: self.viewEventBus, model: self.chatroomModel, collection: self.chatroomList});
    self.containerModel.set('viewState', self.chatroomView);
    self.chatroomModel.loadModel(model);
    debugger;
    // self.chatroomModel.loadModel(model);
  });

  // adds new user to users collection, sends default joining message
	self.appEventBus.on("userJoined", function(username) {
    debugger;
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
    self.chatroomModel.set('chatlog', newList);
    debugger;
    // $('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
  });
  
  self.appEventBus.on("setChatrooms", function(chatrooms) {
    var newList = new app.ChatroomList(chatrooms);
    self.chatroomModel.set('chatrooms', newList);
    debugger;
  });

    self.appEventBus.on("setOnlineUsers", function(onlineUsers) {
    var newList = new app.UserCollection(onlineUsers);
    self.chatroomModel.set('onlineUsers', newList);
    debugger;

  });


};


var app = app || {};

(function () {

  var ChatroomRouter = Backbone.Router.extend({
    
    routes: {
      '': 'start',
      'log': 'login',
      'reg': 'register',
      'authenticated': 'authenticated'
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
      var registerView = new app.RegisterView({vent: app.mainController.viewEventBus });
      app.mainController.containerModel.set("viewState", registerView);
    },

    authenticated: function() {
      app.mainController = new app.MainController();
      app.mainController.authenticated();
    }

  });

  app.ChatroomRouter = new ChatroomRouter();
  Backbone.history.start();

})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYXQuanMiLCJjb250YWluZXIuanMiLCJsb2dpbi5qcyIsInVzZXIuanMiLCJjaGF0cm9vbS5qcyIsInJvb20uanMiLCJyZWdpc3Rlci5qcyIsInNvY2tldGNsaWVudC5qcyIsIm1haW4uanMiLCJyb3V0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUhQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBR1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QURWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FIaEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FJbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5DaGF0Q29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcbiAgICBtb2RlbDogYXBwLkNoYXRNb2RlbFxuICB9KTtcblxufSkoKTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuICBhcHAuQ29udGFpbmVyVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBlbDogJyN2aWV3LWNvbnRhaW5lcicsXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdGhpcy5tb2RlbC5vbihcImNoYW5nZTp2aWV3U3RhdGVcIiwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB2aWV3ID0gdGhpcy5tb2RlbC5nZXQoJ3ZpZXdTdGF0ZScpO1xuICAgICAgdGhpcy4kZWwuaHRtbCh2aWV3LnJlbmRlcigpLmVsKTtcbiAgICB9XG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5Mb2dpblZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2xvZ2luJykuaHRtbCgpKSxcbiAgICBldmVudHM6IHtcbiAgICAgICdzdWJtaXQnOiAnb25Mb2dpbicsXG4gICAgICAvLyAna2V5cHJlc3MgI25hbWVUZXh0JzogJ29uSGl0RW50ZXInXG4gICAgfSxcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgLy8gTG9naW5WaWV3IGdldHMgcGFzc2VkIHRoZSB2aWV3RXZlbnRCdXMgd2hlbiB0aGUgTWFpbkNvbnRyb2xsZXIgaXMgaW5pdGlhbGl6ZWRcbiAgICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcblxuICAgIC8vIFRoaXMgdGVsbHMgdGhlIHZpZXcgdG8gbGlzdGVuIHRvIGFuIGV2ZW50IG9uIGl0cyBtb2RlbCxcbiAgICAvLyBpZiB0aGVyZSdzIGFuIGVycm9yLCB0aGUgY2FsbGJhY2sgKHRoaXMucmVuZGVyKSBpcyBjYWxsZWQgd2l0aCB0aGUgIFxuICAgIC8vIHZpZXcgYXMgY29udGV4dFxuICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImNoYW5nZTplcnJvclwiLCB0aGlzLnJlbmRlciwgdGhpcyk7XG4gICAgfSxcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKHRoaXMubW9kZWwudG9KU09OKCkpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgb25Mb2dpbjogZnVuY3Rpb24oKSB7XG4gICAgICAvLyB0cmlnZ2VycyB0aGUgbG9naW4gZXZlbnQgYW5kIHBhc3NpbmcgdGhlIHVzZXJuYW1lIGRhdGEgdG8ganMvbWFpbi5qc1xuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJsb2dpblwiLCB7dXNlcm5hbWU6IHRoaXMuJCgnI3VzZXJuYW1lJykudmFsKCksIHBhc3N3b3JkOiB0aGlzLiQoJyNwYXNzd29yZCcpLnZhbCgpfSk7XG4gICAgfSxcbiAgICBvbkhpdEVudGVyOiBmdW5jdGlvbihlKSB7XG4gICAgICBpZihlLmtleUNvZGUgPT0gMTMpIHtcbiAgICAgICAgdGhpcy5vbkxvZ2luKCk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICBcbn0pKGpRdWVyeSk7IiwiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5Vc2VyQ29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHttb2RlbDogYXBwLlVzZXJNb2RlbH0pO1xuXG59KSgpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG5hcHAuQ2hhdHJvb21WaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjY2hhdHJvb20tdGVtcGxhdGUnKS5odG1sKCkpLFxuICBldmVudHM6IHtcbiAgICAna2V5cHJlc3MgLm1lc3NhZ2UtaW5wdXQnOiAnbWVzc2FnZUlucHV0UHJlc3NlZCcsXG4gICAgJ2NsaWNrIC5jaGF0LWRpcmVjdG9yeSAucm9vbSc6ICdzZXRSb29tJ1xuICB9LFxuICAvLyBpbml0aWFsaXplZCBhZnRlciB0aGUgJ2xvZ2luRG9uZScgZXZlbnRcbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIGNvbnNvbGUubG9nKG9wdGlvbnMpO1xuICAgIC8vIHBhc3NlZCB0aGUgdmlld0V2ZW50QnVzXG4gICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xuICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgLy8gdGhlc2UgZ2V0IHRoZSBjb2xsZWN0aW9uIG9mIG9ubGluZVVzZXJzIGFuZCB1c2VyQ2hhdHMgZnJvbSB0aGUgY2hhdHJvb21Nb2RlbFxuICAgXG5cbiAgfSxcbiAgcmVuZGVyOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHRoaXMubW9kZWwgPSBtb2RlbCB8fCB0aGlzLm1vZGVsO1xuICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSgpKTtcbiAgICAgICAgLy8gdGhpcy5yZW5kZXJDaGF0cygpO1xuICAgIC8vIHRoaXMuc2V0Q2hhdENvbGxlY3Rpb24oKTtcbiAgICAvLyB0aGlzLnJlbmRlclVzZXJzKCk7XG4gICAgdGhpcy5zZXRDaGF0TGlzdGVuZXJzKCk7XG4gICAgLy8gdGhpcy5yZW5kZXJSb29tcygpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8vIHNldENoYXRDb2xsZWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgLy8gICAgIHRoaXMudXNlckNoYXRzID0gbmV3IGFwcC5DaGF0Q29sbGVjdGlvbihbXG4gIC8vICAgICAgIC8vIG1lc3NhZ2UgYW5kIHNlbmRlciB1cG9uIGVudGVyaW5nIGNoYXRyb29tXG4gIC8vICAgICAgIG5ldyBhcHAuQ2hhdE1vZGVsKHsgc2VuZGVyOiAnQnV0dGVycycsIG1lc3NhZ2U6ICdhd3d3d3d3IGhhbWJ1cmdlcnMuIHx8KTp8fCcsIHRpbWVzdGFtcDogXy5ub3coKSB9KVxuICAvLyAgICAgXSk7XG4gIC8vIH0sXG4gIHNldENoYXRMaXN0ZW5lcnM6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3RvcExpc3RlbmluZygpO1xuXG5cbiAgICAvLyB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiZ2V0Q2hhdHJvb21Nb2RlbFwiLCB0aGlzLmdldENoYXRyb29tTW9kZWwsIHRoaXMpO1xuXG5cbiAgICAvLyB2YXIgb25saW5lVXNlcnMgPSB0aGlzLm1vZGVsLmdldCgnb25saW5lVXNlcnMnKTtcbiAgIC8vIHNldHMgZXZlbnQgbGlzdGVuZXJzIG9uIHRoZSBjb2xsZWN0aW9uc1xuICAgIC8vIHRoaXMubGlzdGVuVG8ob25saW5lVXNlcnMsIFwiYWRkXCIsIHRoaXMucmVuZGVyVXNlciwgdGhpcyk7XG4gICAgLy8gdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJyZW1vdmVcIiwgdGhpcy5yZW5kZXJVc2VycywgdGhpcyk7XG4gICAgLy8gdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJyZXNldFwiLCB0aGlzLnJlbmRlclVzZXJzLCB0aGlzKTtcbiAgICAgICAgLy8gdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJjaGFuZ2VcIiwgdGhpcy5yZW5kZXJVc2VycywgdGhpcyk7XG5cbiAgICAvLyB2YXIgY2hhdGxvZyA9IHRoaXMubW9kZWwuZ2V0KCdjaGF0bG9nJyk7XG4gICAgLy8gdGhpcy5saXN0ZW5UbyhjaGF0bG9nLCBcImFkZFwiLCB0aGlzLnJlbmRlckNoYXQsIHRoaXMpO1xuICAgIC8vIHRoaXMubGlzdGVuVG8oY2hhdGxvZywgXCJyZW1vdmVcIiwgdGhpcy5yZW5kZXJDaGF0cywgdGhpcyk7XG4gICAgLy8gdGhpcy5saXN0ZW5UbyhjaGF0bG9nLCBcInJlc2V0XCIsIHRoaXMucmVuZGVyQ2hhdHMsIHRoaXMpO1xuICAgIC8vIHRoaXMubGlzdGVuVG8oY2hhdGxvZywgXCJjaGFuZ2VcIiwgdGhpcy5yZW5kZXJDaGF0cywgdGhpcyk7XG5cbiAgICAvLyB2YXIgY2hhdHJvb21zID0gdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tcycpO1xuXG4gICAgLy8gdGhpcy5saXN0ZW5UbyhjaGF0cm9vbXMsIFwiYWRkXCIsIHRoaXMucmVuZGVyUm9vbSwgdGhpcyk7XG4gICAgLy8gdGhpcy5saXN0ZW5UbyhjaGF0cm9vbXMsIFwicmVtb3ZlXCIsIHRoaXMucmVuZGVyUm9vbXMsIHRoaXMpO1xuICAgIC8vIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcInJlc2V0XCIsIHRoaXMucmVuZGVyUm9vbXMsIHRoaXMpO1xuICAgIC8vIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcImNoYW5nZVwiLCB0aGlzLnJlbmRlclJvb21zLCB0aGlzKTtcblxuICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJjaGFuZ2U6b25saW5lVXNlcnNcIiwgdGhpcy5yZW5kZXJVc2VycywgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImNoYW5nZTpjaGF0bG9nXCIsIHRoaXMucmVuZGVyQ2hhdHMsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJjaGFuZ2U6Y2hhdHJvb21zXCIsIHRoaXMucmVuZGVyUm9vbXMsIHRoaXMpO1xuXG4gICAgLy8gdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImdvcnBcIiwgdGhpcy5nb3JwLCB0aGlzKTtcbiAgICAvLyB0aGlzLm1vZGVsLm9uKCdnb3JwJywgZnVuY3Rpb24oY2hhdCkge1xuICAgIC8vICAgdGhpcy5nb3JwKGNoYXQpO1xuICAgIC8vIH0pO1xuXG5cblxuXG4gIH0sXG5cbiAgZ29ycDogZnVuY3Rpb24oY2hhdCkge1xuICAgIHZhciBub3cgPSBfLm5vdygpO1xuXG4gICAgdGhpcy51c2VyQ2hhdHMuYWRkKG5ldyBhcHAuQ2hhdE1vZGVsKHsgc2VuZGVyOiBjaGF0LnNlbmRlciwgbWVzc2FnZTogY2hhdC5tZXNzYWdlLCB0aW1lc3RhbXA6IG5vd30pKTtcbiAgfSxcbiAgZ2V0Q2hhdHJvb21Nb2RlbDogZnVuY3Rpb24obmFtZSkge1xuICAgIHRoaXMudmVudC50cmlnZ2VyKCdnZXRDaGF0cm9vbU1vZGVsJywgbmFtZSk7XG4gIH0sXG4gIC8vIHJlbmRlcnMgb24gZXZlbnRzLCBjYWxsZWQganVzdCBhYm92ZVxuICByZW5kZXJVc2VyczogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy4kKCcub25saW5lLXVzZXJzJykuZW1wdHkoKTtcbiAgICB0aGlzLm1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpLmVhY2goZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgIHRoaXMucmVuZGVyVXNlcih1c2VyKTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyVXNlcjogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBfLnRlbXBsYXRlKCQoXCIjb25saW5lLXVzZXJzLWxpc3QtdGVtcGxhdGVcIikuaHRtbCgpKTtcbiAgICB0aGlzLiQoJy5vbmxpbmUtdXNlcnMnKS5hcHBlbmQodGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgfSxcbiAgcmVuZGVyQ2hhdHM6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuJCgnLmNoYXRib3gtY29udGVudCcpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoJ2NoYXRsb2cnKS5lYWNoKGZ1bmN0aW9uKGNoYXQpIHtcbiAgICAgIHRoaXMucmVuZGVyQ2hhdChjaGF0KTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyQ2hhdDogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBfLnRlbXBsYXRlKCQoJyNjaGF0Ym94LW1lc3NhZ2UtdGVtcGxhdGUnKS5odG1sKCkpO1xuICAgIHZhciBlbGVtZW50ID0gJCh0ZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICAgIGVsZW1lbnQuYXBwZW5kVG8odGhpcy4kKCcuY2hhdGJveC1jb250ZW50JykpLmhpZGUoKS5mYWRlSW4oKS5zbGlkZURvd24oKTtcbiAgICAvLyB0aGlzLiQoJy5uYW5vJykubmFub1Njcm9sbGVyKCk7XG4gICAgLy8gdGhpcy4kKCcubmFubycpLm5hbm9TY3JvbGxlcih7IHNjcm9sbDogJ2JvdHRvbScgfSk7XG4gIH0sXG5cblxuICAvLyByZW5kZXJzIG9uIGV2ZW50cywgY2FsbGVkIGp1c3QgYWJvdmVcbiAgcmVuZGVyUm9vbXM6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuJCgnLnB1YmxpYy1yb29tcy1jb250YWluZXInKS5lbXB0eSgpO1xuICAgIHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbXMnKS5lYWNoKGZ1bmN0aW9uIChyb29tKSB7XG4gICAgICB0aGlzLnJlbmRlclJvb20ocm9vbSk7XG4gICAgfSwgdGhpcyk7XG4gIH0sXG4gIHJlbmRlclJvb206IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gXy50ZW1wbGF0ZSgkKFwiI3Jvb20tbGlzdC10ZW1wbGF0ZVwiKS5odG1sKCkpO1xuICAgIHRoaXMuJCgnLnB1YmxpYy1yb29tcy1jb250YWluZXInKS5hcHBlbmQodGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICAvLyB0aGlzLiQoJy51c2VyLWNvdW50JykuaHRtbCh0aGlzLm1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpLmxlbmd0aCk7XG4gICAgLy8gdGhpcy4kKCcubmFubycpLm5hbm9TY3JvbGxlcigpO1xuICB9LFxuXG4gIGpvaW5Sb29tOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoJ2pvaW5Sb29tJywgbmFtZSk7XG4gICAgdmFyIG1vZGVsID0gdGhpcy5jb2xsZWN0aW9uLmZpbmRXaGVyZSh7bmFtZTogbmFtZX0pO1xuICAgIC8vIHRoaXMuZ2V0Q2hhdENvbGxlY3Rpb24obmFtZSk7XG4gICAgdGhpcy5yZW5kZXIobW9kZWwpO1xuICB9LFxuXG5cbiAgLy9ldmVudHNcbiAgbWVzc2FnZUlucHV0UHJlc3NlZDogZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzICYmICQudHJpbSgkKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgpKS5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBmdW4gZmFjdDogc2VwYXJhdGUgZXZlbnRzIHdpdGggYSBzcGFjZSBpbiB0cmlnZ2VyJ3MgZmlyc3QgYXJnIGFuZCB5b3VcbiAgICAgIC8vIGNhbiB0cmlnZ2VyIG11bHRpcGxlIGV2ZW50cy5cbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiY2hhdFwiLCB0aGlzLiQoJy5tZXNzYWdlLWlucHV0JykudmFsKCkpO1xuICAgICAgdGhpcy4kKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgnJyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwidHlwaW5nXCIpO1xuICAgICAgY29uc29sZS5sb2coJ3d1dCcpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgc2V0Um9vbTogZnVuY3Rpb24oZSkge1xuICAgIHZhciAkdGFyID0gJChlLnRhcmdldCk7XG4gICAgaWYgKCR0YXIuaXMoJ3AnKSkge1xuICAgICAgdGhpcy5qb2luUm9vbSgkdGFyLmRhdGEoJ3Jvb20nKSk7XG4gICAgfVxuICB9XG5cblxuXG5cbn0pO1xuXG59KShqUXVlcnkpOyIsIlxudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuQ2hhdHJvb21MaXN0ID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe1xuICAgIG1vZGVsOiBhcHAuQ2hhdHJvb21Nb2RlbCxcbiAgICB1cmw6ICcvYXBpL2NoYXRyb29tcycsXG4gIH0pO1xuXG59KSgpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5SZWdpc3RlclZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI3JlZ2lzdGVyJykuaHRtbCgpKSxcbiAgICBldmVudHM6IHtcbiAgICAgIFwiY2xpY2sgI3NpZ25VcEJ0blwiOiBcInNpZ25VcFwiXG4gICAgfSxcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSgpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc2lnblVwOiBmdW5jdGlvbigpIHtcbiAgICB9XG4gIH0pO1xuXG59KShqUXVlcnkpOyIsIlxuLy8gVGhlIENoYXRDbGllbnQgaXMgaW1wbGVtZW50ZWQgb24gbWFpbi5qcy5cbi8vIFRoZSBjaGF0Y2xpZW50IGlzIGEgY29uc3RydWN0b3IgZnVuY3Rpb24gb24gdGhlIE1haW5Db250cm9sbGVyLlxuLy8gSXQgYm90aCBsaXN0ZW5zIHRvIGFuZCBlbWl0cyBldmVudHMgb24gdGhlIHNvY2tldCwgZWc6XG4vLyBJdCBoYXMgaXRzIG93biBtZXRob2RzIHRoYXQsIHdoZW4gY2FsbGVkLCBlbWl0IHRvIHRoZSBzb2NrZXQgdy8gZGF0YS5cbi8vIEl0IGFsc28gc2V0cyByZXNwb25zZSBsaXN0ZW5lcnMgb24gY29ubmVjdGlvbiwgdGhlc2UgcmVzcG9uc2UgbGlzdGVuZXJzXG4vLyBsaXN0ZW4gdG8gdGhlIHNvY2tldCBhbmQgdHJpZ2dlciBldmVudHMgb24gdGhlIGFwcEV2ZW50QnVzIG9uIHRoZSBcbi8vIE1haW5Db250cm9sbGVyXG52YXIgQ2hhdENsaWVudCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0Ly8gaXMtdHlwaW5nIGhlbHBlciB2YXJpYWJsZXNcblx0dmFyIFRZUElOR19USU1FUl9MRU5HVEggPSA0MDA7IC8vIG1zXG4gIHZhciB0eXBpbmcgPSBmYWxzZTtcbiAgdmFyIGxhc3RUeXBpbmdUaW1lO1xuICBcbiAgLy8gdGhpcyB2ZW50IGhvbGRzIHRoZSBhcHBFdmVudEJ1c1xuXHRzZWxmLnZlbnQgPSBvcHRpb25zLnZlbnQ7XG5cblx0c2VsZi5ob3N0bmFtZSA9ICdodHRwOi8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xuXG4gIC8vIGNvbm5lY3RzIHRvIHNvY2tldCwgc2V0cyByZXNwb25zZSBsaXN0ZW5lcnNcblx0c2VsZi5jb25uZWN0ID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly8gdGhpcyBpbyBtaWdodCBiZSBhIGxpdHRsZSBjb25mdXNpbmcuLi4gd2hlcmUgaXMgaXQgY29taW5nIGZyb20/XG5cdFx0Ly8gaXQncyBjb21pbmcgZnJvbSB0aGUgc3RhdGljIG1pZGRsZXdhcmUgb24gc2VydmVyLmpzIGJjIGV2ZXJ5dGhpbmdcblx0XHQvLyBpbiB0aGUgL3B1YmxpYyBmb2xkZXIgaGFzIGJlZW4gYXR0YWNoZWQgdG8gdGhlIHNlcnZlciwgYW5kIHZpc2Fcblx0XHQvLyB2ZXJzYS5cblx0XHRzZWxmLnNvY2tldCA9IGlvLmNvbm5lY3Qoc2VsZi5ob3N0bmFtZSk7XG5cdFx0c2VsZi5zZXRSZXNwb25zZUxpc3RlbmVycyhzZWxmLnNvY2tldCk7XG5cdH07XG5cbiAgc2VsZi5jb25uZWN0VG9Sb29tID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJjb25uZWN0VG9Sb29tXCIsIG5hbWUpO1xuICB9O1xuXG4gIHNlbGYuZ2V0Q2hhdHJvb21Nb2RlbCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwiZ2V0Q2hhdHJvb21Nb2RlbFwiLCBuYW1lKTtcbiAgfTtcblxuXG4vLy8vLyBWaWV3RXZlbnRCdXMgbWV0aG9kcyAvLy8vXG4gICAgLy8gbWV0aG9kcyB0aGF0IGVtaXQgdG8gdGhlIGNoYXRzZXJ2ZXJcbiAgc2VsZi5sb2dpbiA9IGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAvLyBlbWl0cyBsb2dpbiBldmVudCB0byBjaGF0c2VydmVyXG5cdFx0c2VsZi5zb2NrZXQuZW1pdChcImxvZ2luXCIsIHVzZXIpO1xuXHR9O1xuICBzZWxmLmNoYXQgPSBmdW5jdGlvbihjaGF0KSB7XG4gICAgLy8gZW1pdHMgY2hhdCBldmVudCB0byBjaGF0c2VydmVyXG5cdFx0c2VsZi5zb2NrZXQuZW1pdChcImNoYXRcIiwgY2hhdCk7XG5cdH07XG5cblxuICAvLyBUeXBpbmcgbWV0aG9kc1xuXHRzZWxmLmFkZENoYXRUeXBpbmcgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIG1lc3NhZ2UgPSBkYXRhLnVzZXJuYW1lICsgJyBpcyB0eXBpbmcnO1xuICAgICQoJy50eXBldHlwZXR5cGUnKS50ZXh0KG1lc3NhZ2UpO1xuXHR9O1xuXHRzZWxmLnJlbW92ZUNoYXRUeXBpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAkKCcudHlwZXR5cGV0eXBlJykuZW1wdHkoKTtcblx0fTtcbiAgc2VsZi51cGRhdGVUeXBpbmcgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoc2VsZi5zb2NrZXQpIHtcbiAgICAgIGlmICghdHlwaW5nKSB7XG4gICAgICAgIHR5cGluZyA9IHRydWU7XG4gICAgICAgIHNlbGYuc29ja2V0LmVtaXQoJ3R5cGluZycpO1xuICAgICAgfVxuICAgICAgbGFzdFR5cGluZ1RpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHR5cGluZ1RpbWVyID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgICAgICAgdmFyIHRpbWVEaWZmID0gdHlwaW5nVGltZXIgLSBsYXN0VHlwaW5nVGltZTtcbiAgICAgICAgaWYgKHRpbWVEaWZmID49IFRZUElOR19USU1FUl9MRU5HVEggJiYgdHlwaW5nKSB7XG4gICAgICAgICAgIHNlbGYuc29ja2V0LmVtaXQoJ3N0b3AgdHlwaW5nJyk7XG4gICAgICAgICAgIHR5cGluZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9LCBUWVBJTkdfVElNRVJfTEVOR1RIKTtcbiAgICB9XG4gIH07XG5cblxuICAvLyBqb2luIHJvb21cbiAgc2VsZi5qb2luUm9vbSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KCdqb2luUm9vbScsIG5hbWUpO1xuICB9O1xuXG4gIC8vIHNldCByb29tXG4gIHNlbGYuc2V0Um9vbSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBpZiAobmFtZSAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5jdXJyZW50Um9vbSA9IG5hbWU7XG4gICAgfVxuICAgIC8vLz4+Pj4+Pj4gY2hhbmdldGhpc3RvIC5jaGF0LXRpdGxlXG4gICAgdmFyICRjaGF0VGl0bGUgPSAkKCcuY2hhdGJveC1oZWFkZXItdXNlcm5hbWUnKTtcbiAgICAkY2hhdFRpdGxlLnRleHQobmFtZSk7XG4gICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAkKCcuY2hhdC1kaXJlY3RvcnknKS5maW5kKCcucm9vbScpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgJHJvb20gPSAkKHRoaXMpO1xuICAgICAgJHJvb20ucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgaWYgKCRyb29tLmRhdGEoJ25hbWUnKSA9PT0gdGhpc18uY3VycmVudFJvb20pIHtcbiAgICAgICAgJHJvb20uYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuICBcblxuXG5cbiAgLy8vLy8vLy8vLy8vLy8gY2hhdHNlcnZlciBsaXN0ZW5lcnMvLy8vLy8vLy8vLy8vXG5cbiAgLy8gdGhlc2UgZ3V5cyBsaXN0ZW4gdG8gdGhlIGNoYXRzZXJ2ZXIvc29ja2V0IGFuZCBlbWl0IGRhdGEgdG8gbWFpbi5qcyxcbiAgLy8gc3BlY2lmaWNhbGx5IHRvIHRoZSBhcHBFdmVudEJ1cy5cblx0c2VsZi5zZXRSZXNwb25zZUxpc3RlbmVycyA9IGZ1bmN0aW9uKHNvY2tldCkge1xuXHRcdC8vIGNsaWVudCBsaXN0ZW5lcnMgdGhhdCBsaXN0ZW4gdG8gdGhlIGNoYXRzZXJ2ZXIgYW5kIGl0c2VsZi5cblx0XHQvLyBFYWNoIHNlcnZlciBldmVudCB0cmlnZ2VycyBhbiBhcHBFdmVudEJ1cyBldmVudCBwYWlyZWQgd2l0aCBcblx0XHQvLyByZWxldmFudCBkYXRhLlxuXHRcdHNvY2tldC5vbignd2VsY29tZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIC8vIGVtaXRzIGV2ZW50IHRvIHJlY2FsaWJyYXRlIG9ubGluZVVzZXJzIGNvbGxlY3Rpb25cbiAgICAgIHNvY2tldC5lbWl0KFwiZ2V0T25saW5lVXNlcnNcIik7XG4gICAgICBzb2NrZXQuZW1pdChcInJvb21zXCIpO1xuXHRcdFx0Y29uc29sZS5sb2coJ29ubGluZVVzZXJzMTogJywgZGF0YSk7XG4gICAgICAvLyBkYXRhIGlzIHVuZGVmaW5lZCBhdCB0aGlzIHBvaW50IGJlY2F1c2UgaXQncyB0aGUgZmlyc3QgdG9cbiAgICAgIC8vIGZpcmUgb2ZmIGFuIGV2ZW50IGNoYWluIHRoYXQgd2lsbCBhcHBlbmQgdGhlIG5ldyB1c2VyIHRvIFxuICAgICAgLy8gdGhlIG9ubGluZVVzZXIgY29sbGVjdGlvblxuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJsb2dpbkRvbmVcIiwgZGF0YSk7XG4gICAgfSk7XG5cblx0XHQvLyBzb2NrZXQub24oJ2xvZ2luTmFtZUV4aXN0cycsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgLy8gICAgIC8vIGRhdGEgPT09IHN0cmluZyBvZiB1c2VkIHVzZXJuYW1lXG5cdFx0Ly8gXHRjb25zb2xlLmxvZygnbG9naW5OYW1lRXhpc3RzOiAnLCBkYXRhKTtcblx0XHQvLyBcdHNlbGYudmVudC50cmlnZ2VyKFwibG9naW5OYW1lRXhpc3RzXCIsIGRhdGEpO1xuXHRcdC8vIH0pO1xuXHRcdC8vIHNvY2tldC5vbignbG9naW5OYW1lQmFkJywgZnVuY3Rpb24oZGF0YSkge1xuXHRcdC8vIFx0Ly8gZGF0YSA9PT0gc3RyaW5nIG9mIGJhZCB1c2VybmFtZVxuXHRcdC8vIFx0Y29uc29sZS5sb2coJ2xvZ2luTmFtZUJhZDogJywgZGF0YSk7XG5cdFx0Ly8gXHRzZWxmLnZlbnQudHJpZ2dlcihcImxvZ2luTmFtZUJhZFwiLCBkYXRhKTtcblx0XHQvLyB9KTtcblxuXHRcdC8vIHRoaXMgaXMgdGhlIHNlY29uZCBsaXN0ZW5lciB0byBvbmxpbmVVc2Vyc1xuXHRcdC8vIGJ5IHRoZSB0aW1lIHRoaXMgaXMgY2FsbGVkLCB0aGUgbmV3IHVzZXIgaGFzIGJlZW4gYWRkZWQgdG9cblx0XHQvLyB0aGUgdXNlciBjb2xsZWN0aW9uLlxuXHRcdHNvY2tldC5vbigndXNlcnNJbmZvJywgZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0Ly8gdGhpcyBkYXRhIGlzIGFuIGFycmF5IHdpdGggYWxsIHRoZSBvbmxpbmUgdXNlcidzIHVzZXJuYW1lcy5cblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwidXNlcnNJbmZvXCIsIGRhdGEpO1xuXHRcdH0pO1xuICAgIHNvY2tldC5vbigncm9vbXMnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAvLyB0aGlzIGRhdGEgaXMgYW4gYXJyYXkgd2l0aCBhbGwgdGhlIG9ubGluZSB1c2VyJ3MgdXNlcm5hbWVzLlxuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJyb29tSW5mb1wiLCBkYXRhKTtcbiAgICB9KTtcblxuXHRcdHNvY2tldC5vbigndXNlckpvaW5lZCcsIGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdC8vIGRhdGEgPT09IHVzZXJuYW1lIG9mIHVzZXIgam9pbmVkXG5cdFx0XHRjb25zb2xlLmxvZygndXNlckpvaW5lZDogJywgZGF0YSk7XG4gICAgICBzb2NrZXQuZW1pdChcImdldE9ubGluZVVzZXJzXCIpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJ1c2VySm9pbmVkXCIsIGRhdGEpO1xuXHRcdH0pO1xuXHRcdHNvY2tldC5vbigndXNlckxlZnQnLCBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHQvLyBkYXRhID09PSB1c2VybmFtZSBvZiB1c2VyIHJlbW92ZWRcblx0XHRcdGNvbnNvbGUubG9nKCd1c2VyTGVmdDogJywgZGF0YSk7XG4gICAgICBzb2NrZXQuZW1pdChcImdldE9ubGluZVVzZXJzXCIpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJ1c2VyTGVmdFwiLCBkYXRhKTtcblx0XHR9KTtcblx0XHRzb2NrZXQub24oJ2NoYXQnLCBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHQvLyBkYXRhID09PSBjaGF0IG1lc3NhZ2Ugb2JqZWN0XG5cdFx0XHRjb25zb2xlLmxvZygnY2hhdGRhdGE6ICcsIGRhdGEpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJjaGF0UmVjZWl2ZWRcIiwgZGF0YSk7XG5cdFx0fSk7XG4gICAgc29ja2V0Lm9uKCdzZXRSb29tJywgZnVuY3Rpb24obmFtZSkge1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRSb29tXCIsIG5hbWUpOyBcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ2NoYXRsb2cnLCBmdW5jdGlvbihjaGF0bG9nKSB7XG4gICAgICBjb25zb2xlLmxvZygnIHRoZWlzIGlzIGRleSBjaGF0IGxhd2c6ICcsIGNoYXRsb2cpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRDaGF0bG9nXCIsIGNoYXRsb2cpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbignQ2hhdHJvb21Nb2RlbCcsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICAvLyBzZWxmLnZlbnQudHJpZ2dlcihcIkNoYXRyb29tTW9kZWxcIiwgbW9kZWwpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRSb29tXCIsIG1vZGVsKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ2FjaGF0cm9vbXMnLCBmdW5jdGlvbihjaGF0cm9vbXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdjaGF0cm9vbXM6ICAnLCBjaGF0cm9vbXMpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRDaGF0cm9vbXNcIiwgY2hhdHJvb21zKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ2FvbmxpbmVVc2VycycsIGZ1bmN0aW9uKG9ubGluZVVzZXJzKSB7XG4gICAgICBjb25zb2xlLmxvZygnb25saW5lIHVzZXJzOiAnLCBvbmxpbmVVc2Vycyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldE9ubGluZVVzZXJzXCIsIG9ubGluZVVzZXJzKTtcbiAgICB9KTtcblxuICAgIC8vIHRoZXNlIGd1eXMgbGlzdGVuIHRvIHRoZSBzZXJ2ZXIsIFxuICAgIC8vIHRoZW4gY2FsbCBjaGF0Y2xpZW50IG1ldGhvZHMgbGlzdGVkIGFib3ZlXG4gICAgc29ja2V0Lm9uKCd0eXBpbmcnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBzZWxmLmFkZENoYXRUeXBpbmcoZGF0YSk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdzdG9wIHR5cGluZycsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5yZW1vdmVDaGF0VHlwaW5nKCk7XG4gICAgfSk7XG5cblxuXG5cdH07XG59OyIsIlxuXG5hcHAuTWFpbkNvbnRyb2xsZXIgPSBmdW5jdGlvbigpIHtcblxuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblxuICAvL1RoZXNlIGFsbG93cyB1cyB0byBiaW5kIGFuZCB0cmlnZ2VyIG9uIHRoZSBvYmplY3QgZnJvbSBhbnl3aGVyZSBpbiB0aGUgYXBwLlxuXHRzZWxmLmFwcEV2ZW50QnVzID0gXy5leHRlbmQoe30sIEJhY2tib25lLkV2ZW50cyk7XG5cdHNlbGYudmlld0V2ZW50QnVzID0gXy5leHRlbmQoe30sIEJhY2tib25lLkV2ZW50cyk7XG5cblx0c2VsZi5pbml0ID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly8gY3JlYXRlcyBDaGF0Q2xpZW50IGZyb20gc29ja2V0Y2xpZW50LmpzLCBwYXNzZXMgaW4gXG5cdFx0Ly8gYXBwRXZlbnRCdXMgYXMgdmVudCwgY29ubmVjdHNcblxuXHRcdC8vIHNlbGYuY2hhdENsaWVudCA9IG5ldyBDaGF0Q2xpZW50KHsgdmVudDogc2VsZi5hcHBFdmVudEJ1cyB9KTtcblx0XHQvLyBzZWxmLmNoYXRDbGllbnQuY29ubmVjdCgpO1xuXG4gICAgLy8gbG9naW5Nb2RlbFxuXHRcdHNlbGYubG9naW5Nb2RlbCA9IG5ldyBhcHAuTG9naW5Nb2RlbCgpO1xuICAgIHNlbGYubG9naW5WaWV3ID0gbmV3IGFwcC5Mb2dpblZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzLCBtb2RlbDogc2VsZi5sb2dpbk1vZGVsfSk7XG4gICAgc2VsZi5yZWdpc3RlclZpZXcgPSBuZXcgYXBwLlJlZ2lzdGVyVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXMgfSk7XG5cbiAgICAvLyBUaGUgQ29udGFpbmVyTW9kZWwgZ2V0cyBwYXNzZWQgYSB2aWV3U3RhdGUsIExvZ2luVmlldywgd2hpY2hcbiAgICAvLyBpcyB0aGUgbG9naW4gcGFnZS4gVGhhdCBMb2dpblZpZXcgZ2V0cyBwYXNzZWQgdGhlIHZpZXdFdmVudEJ1c1xuICAgIC8vIGFuZCB0aGUgTG9naW5Nb2RlbC5cblx0XHRzZWxmLmNvbnRhaW5lck1vZGVsID0gbmV3IGFwcC5Db250YWluZXJNb2RlbCh7IHZpZXdTdGF0ZTogc2VsZi5sb2dpblZpZXd9KTtcblxuXHRcdC8vIG5leHQsIGEgbmV3IENvbnRhaW5lclZpZXcgaXMgaW50aWFsaXplZCB3aXRoIHRoZSBuZXdseSBjcmVhdGVkIGNvbnRhaW5lck1vZGVsXG5cdFx0Ly8gdGhlIGxvZ2luIHBhZ2UgaXMgdGhlbiByZW5kZXJlZC5cblx0XHRzZWxmLmNvbnRhaW5lclZpZXcgPSBuZXcgYXBwLkNvbnRhaW5lclZpZXcoeyBtb2RlbDogc2VsZi5jb250YWluZXJNb2RlbCB9KTtcblx0XHRzZWxmLmNvbnRhaW5lclZpZXcucmVuZGVyKCk7XG5cdH07XG5cbiAgc2VsZi5hdXRoZW50aWNhdGVkID0gZnVuY3Rpb24oKSB7XG5cbiAgICBzZWxmLmNoYXRDbGllbnQgPSBuZXcgQ2hhdENsaWVudCh7IHZlbnQ6IHNlbGYuYXBwRXZlbnRCdXMgfSk7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmNvbm5lY3QoKTtcblxuXG4gICAgLy8gbmV3IG1vZGVsIGFuZCB2aWV3IGNyZWF0ZWQgZm9yIGNoYXRyb29tXG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsID0gbmV3IGFwcC5DaGF0cm9vbU1vZGVsKHsgbmFtZTogJ0RPTycgfSk7XG4gICAgc2VsZi5jaGF0cm9vbUxpc3QgPSBuZXcgYXBwLkNoYXRyb29tTGlzdCgpO1xuICAgIHNlbGYuY2hhdHJvb21MaXN0LmZldGNoKCkuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zZXQoJ2NoYXRyb29tcycsIHNlbGYuY2hhdHJvb21MaXN0KTtcbiAgICAgIC8vIHNlbGYuY2hhdHJvb21Nb2RlbC5sb2FkTW9kZWwoKTtcbiAgICAgIHNlbGYuY2hhdHJvb21WaWV3ICA9IG5ldyBhcHAuQ2hhdHJvb21WaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cywgbW9kZWw6IHNlbGYuY2hhdHJvb21Nb2RlbCB9KTtcbiAgICAgIGRlYnVnZ2VyO1xuICAgICAgc2VsZi5jb250YWluZXJNb2RlbCA9IG5ldyBhcHAuQ29udGFpbmVyTW9kZWwoeyB2aWV3U3RhdGU6IHNlbGYuY2hhdHJvb21WaWV3fSk7XG4gICAgICBzZWxmLmNvbnRhaW5lclZpZXcgPSBuZXcgYXBwLkNvbnRhaW5lclZpZXcoeyBtb2RlbDogc2VsZi5jb250YWluZXJNb2RlbCB9KTtcbiAgICAgIGRlYnVnZ2VyO1xuICAgICAgc2VsZi5jb250YWluZXJWaWV3LnJlbmRlcigpO1xuXG5cblxuICAgICAgLy8gc2VsZi5jb250YWluZXJNb2RlbC5zZXQoXCJ2aWV3U3RhdGVcIiwgc2VsZi5jaGF0cm9vbVZpZXcpO1xuXG4gICAgICBhdXRvc2l6ZSgkKCd0ZXh0YXJlYS5tZXNzYWdlLWlucHV0JykpO1xuICAgICAgJCgnLmNoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJy5jaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG5cbiAgICAgICAgICAgIHNlbGYuY2hhdENsaWVudC5jb25uZWN0VG9Sb29tKFwiRE9PXCIpO1xuXG4gICAgIFxuXG5cbiAgICB9KTtcblxuICB9O1xuXG5cblxuICAvLy8vLy8vLy8vLy8gIEJ1c3NlcyAvLy8vLy8vLy8vLy9cbiAgICAvLyBUaGVzZSBCdXNzZXMgbGlzdGVuIHRvIHRoZSBzb2NrZXRjbGllbnRcbiAgIC8vICAgIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cbiAgLy8vLyB2aWV3RXZlbnRCdXMgTGlzdGVuZXJzIC8vLy8vXG4gIFxuXHRzZWxmLnZpZXdFdmVudEJ1cy5vbihcImxvZ2luXCIsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAvLyBzb2NrZXRpbyBsb2dpbiwgc2VuZHMgbmFtZSB0byBzb2NrZXRjbGllbnQsIHNvY2tldGNsaWVudCBzZW5kcyBpdCB0byBjaGF0c2VydmVyXG4gICAgc2VsZi5jaGF0Q2xpZW50LmxvZ2luKHVzZXIpO1xuICB9KTtcblx0c2VsZi52aWV3RXZlbnRCdXMub24oXCJjaGF0XCIsIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICAvLyBzb2NrZXRpbyBjaGF0LCBzZW5kcyBjaGF0IHRvIHNvY2tldGNsaWVudCwgc29ja2V0Y2xpZW50IHRvIGNoYXRzZXJ2ZXJcbiAgICBzZWxmLmNoYXRDbGllbnQuY2hhdChjaGF0KTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwidHlwaW5nXCIsIGZ1bmN0aW9uKCkge1xuICAgIHNlbGYuY2hhdENsaWVudC51cGRhdGVUeXBpbmcoKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiam9pblJvb21cIiwgZnVuY3Rpb24ocm9vbSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5qb2luUm9vbShyb29tKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiZ2V0Q2hhdHJvb21Nb2RlbFwiLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmdldENoYXRyb29tTW9kZWwobmFtZSk7XG4gIH0pO1xuXG5cblxuXG5cblxuXG5cbiAgLy8vLyBhcHBFdmVudEJ1cyBMaXN0ZW5lcnMgLy8vL1xuXG4gIC8vIGFmdGVyIHRoZSAnd2VsY29tZScgZXZlbnQgdHJpZ2dlcnMgb24gdGhlIHNvY2tlY2xpZW50LCB0aGUgbG9naW5Eb25lIGV2ZW50IHRyaWdnZXJzLlxuXHQvLyBzZWxmLmFwcEV2ZW50QnVzLm9uKFwibG9naW5Eb25lXCIsIGZ1bmN0aW9uKCkge1xuXG5cdC8vIFx0Ly8gbmV3IG1vZGVsIGFuZCB2aWV3IGNyZWF0ZWQgZm9yIGNoYXRyb29tXG5cdC8vIFx0c2VsZi5jaGF0cm9vbU1vZGVsID0gbmV3IGFwcC5DaGF0cm9vbU1vZGVsKCk7XG4gLy8gICAgc2VsZi5jaGF0cm9vbUxpc3QgPSBuZXcgYXBwLkNoYXRyb29tTGlzdCgpO1xuXHQvLyBcdHNlbGYuY2hhdHJvb21WaWV3ICA9IG5ldyBhcHAuQ2hhdHJvb21WaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cywgbW9kZWw6IHNlbGYuY2hhdHJvb21Nb2RlbCwgY29sbGVjdGlvbjogc2VsZi5jaGF0cm9vbUxpc3R9KTtcblxuXHQvLyBcdC8vIHZpZXdzdGF0ZSBpcyBjaGFuZ2VkIHRvIGNoYXRyb29tIGFmdGVyIGxvZ2luLlxuXHQvLyBcdHNlbGYuY29udGFpbmVyTW9kZWwuc2V0KFwidmlld1N0YXRlXCIsIHNlbGYuY2hhdHJvb21WaWV3KTtcbiAvLyAgICBhdXRvc2l6ZSgkKCd0ZXh0YXJlYS5tZXNzYWdlLWlucHV0JykpO1xuXHQvLyBcdCQoJy5jaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuXHQvLyB9KTtcblxuICAvLyBlcnJvciBsaXN0ZW5lcnNcblx0Ly8gc2VsZi5hcHBFdmVudEJ1cy5vbihcImxvZ2luTmFtZUJhZFwiLCBmdW5jdGlvbih1c2VybmFtZSkge1xuXHQvLyBcdHNlbGYubG9naW5Nb2RlbC5zZXQoXCJlcnJvclwiLCBcIkludmFsaWQgTmFtZVwiKTtcblx0Ly8gfSk7XG5cdC8vIHNlbGYuYXBwRXZlbnRCdXMub24oXCJsb2dpbk5hbWVFeGlzdHNcIiwgZnVuY3Rpb24odXNlcm5hbWUpIHtcblx0Ly8gXHRzZWxmLmxvZ2luTW9kZWwuc2V0KFwiZXJyb3JcIiwgXCJOYW1lIGFscmVhZHkgZXhpc3RzXCIpO1xuXHQvLyB9KTtcblxuXG5cblxuXG5cblxuICAvLyBhZnRlciAnb25saW5lVXNlcnMnIGV2ZW50IGVtaXRzLCB0aGUgJ3VzZXJzSW5mbycgZXZlbnQgdHJpZ2dlcnNcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcInVzZXJzSW5mb1wiLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgLy9kYXRhIGlzIGFuIGFycmF5IG9mIHVzZXJuYW1lcywgaW5jbHVkaW5nIHRoZSBuZXcgdXNlclxuXHRcdC8vIFRoaXMgbWV0aG9kIGdldHMgdGhlIG9ubGluZSB1c2VycyBjb2xsZWN0aW9uIGZyb20gY2hhdHJvb21Nb2RlbC5cblx0XHQvLyBvbmxpbmVVc2VycyBpcyB0aGUgY29sbGVjdGlvblxuXHRcdHZhciBvbmxpbmVVc2VycyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoXCJvbmxpbmVVc2Vyc1wiKTtcbmNvbnNvbGUubG9nKFwib25saW5lVXNlcnM6IC0tLVwiLCBvbmxpbmVVc2Vycyk7XG4gICAvLyB1c2VycyBpcyBhcnJheSBvZiB0aGUgY3VycmVudCB1c2VyIG1vZGVsc1xuXHRcdHZhciB1c2VycyA9IF8ubWFwKGRhdGEsIGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdHJldHVybiBuZXcgYXBwLlVzZXJNb2RlbCh7dXNlcm5hbWU6IGl0ZW19KTtcblx0XHR9KTtcbmNvbnNvbGUubG9nKFwidXNlcnM6IC0tLVwiLCB1c2Vycyk7XG4gICAgLy8gdGhpcyByZXNldHMgdGhlIGNvbGxlY3Rpb24gd2l0aCB0aGUgdXBkYXRlZCBhcnJheSBvZiB1c2Vyc1xuXHRcdG9ubGluZVVzZXJzLnJlc2V0KHVzZXJzKTtcblx0fSk7XG5cblxuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInJvb21JbmZvXCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAvLyBUaGlzIG1ldGhvZCBnZXRzIHRoZSBvbmxpbmUgdXNlcnMgY29sbGVjdGlvbiBmcm9tIGNoYXRyb29tTW9kZWwuXG4gICAgLy8gb25saW5lVXNlcnMgaXMgdGhlIGNvbGxlY3Rpb25cbiAgICB2YXIgcm9vbXMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KFwiY2hhdHJvb21zXCIpO1xuICAgICBjb25zb2xlLmxvZyhcIlJPT01TOiBcIiwgcm9vbXMpO1xuXG4gICAvLyB1c2VycyBpcyBhcnJheSBvZiB0aGUgY3VycmVudCByb29tIG1vZGVsc1xuICAgIHZhciB1cGRhdGVkUm9vbXMgPSBfLm1hcChkYXRhLCBmdW5jdGlvbihyb29tKSB7XG4gICAgICB2YXIgbmV3Q2hhdHJvb21Nb2RlbCA9IG5ldyBhcHAuQ2hhdHJvb21Nb2RlbCh7bmFtZTogcm9vbS5uYW1lfSk7XG5cbiAgICAgIC8vIF8ubWFwKHJvb20uY2hhdGxvZywgZnVuY3Rpb24oY2hhdCkge1xuICAgICAgLy8gICBkZWJ1Z2dlcjtcbiAgICAgIC8vICAgc2VsZi5jaGF0cm9vbVZpZXcudXNlckNoYXRzLnB1c2goY2hhdCk7XG4gICAgICAvLyB9KTtcbiAgICAgIHJldHVybiBuZXdDaGF0cm9vbU1vZGVsO1xuICAgIH0pO1xuY29uc29sZS5sb2coXCJVUERBVEVEIFJPT01TOiBcIiwgdXBkYXRlZFJvb21zKTtcbiAgICAvLyB0aGlzIHJlc2V0cyB0aGUgY29sbGVjdGlvbiB3aXRoIHRoZSB1cGRhdGVkIGFycmF5IG9mIHJvb21zXG4gICAgcm9vbXMucmVzZXQodXBkYXRlZFJvb21zKTtcbiAgfSk7XG5cblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0Um9vbVwiLCBmdW5jdGlvbihtb2RlbCkge1xuICAvLyAgIGlmIChzZWxmLmNoYXRyb29tVmlldyAhPT0gdW5kZWZpbmVkKSB7XG4gIC8vICAgZGVidWdnZXI7XG4gIC8vICAgc2VsZi5jaGF0cm9vbVZpZXcuc3RvcExpc3RlbmluZygpO1xuICAvLyAgIHNlbGYuY2hhdHJvb21Nb2RlbCA9IG5ldyBhcHAuQ2hhdHJvb21Nb2RlbCgpO1xuICAvLyAgIHNlbGYuY2hhdHJvb21WaWV3ICA9IG5ldyBhcHAuQ2hhdHJvb21WaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cywgbW9kZWw6IHNlbGYuY2hhdHJvb21Nb2RlbCwgY29sbGVjdGlvbjogc2VsZi5jaGF0cm9vbUxpc3R9KTtcblxuICAvLyAgIC8vIHZpZXdzdGF0ZSBpcyBjaGFuZ2VkIHRvIGNoYXRyb29tIGFmdGVyIGxvZ2luLlxuICAvLyAgIHNlbGYuY29udGFpbmVyTW9kZWwuc2V0KFwidmlld1N0YXRlXCIsIHNlbGYuY2hhdHJvb21WaWV3KTtcbiAgLy8gICBhdXRvc2l6ZSgkKCd0ZXh0YXJlYS5tZXNzYWdlLWlucHV0JykpO1xuICAvLyAgICQoJy5jaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuICAvLyB9XG4gICAgLy8gc2VsZi5jaGF0Q2xpZW50LnNldFJvb20ocm9vbSk7XG4gICAgXG4gICAgICAgIHZhciBuZXdMaXN0ID0gbmV3IGFwcC5DaGF0Q29sbGVjdGlvbihtb2RlbC5jaGF0bG9nKTtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdjaGF0bG9nJywgbmV3TGlzdCk7XG5cblxuICAgIHZhciBuZXdMaXN0ID0gbmV3IGFwcC5DaGF0cm9vbUxpc3QobW9kZWwuY2hhdHJvb21zKTtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdjaGF0cm9vbXMnLCBuZXdMaXN0KTtcblxuICAgIHZhciBuZXdMaXN0ID0gbmV3IGFwcC5Vc2VyQ29sbGVjdGlvbihtb2RlbC5vbmxpbmVVc2Vycyk7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnb25saW5lVXNlcnMnLCBuZXdMaXN0KTtcblxuICB9KTtcblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJDaGF0cm9vbU1vZGVsXCIsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICBkZWJ1Z2dlcjtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoKTtcbiAgICBzZWxmLmNoYXRyb29tTGlzdCA9IG5ldyBhcHAuQ2hhdHJvb21MaXN0KCk7XG4gICAgc2VsZi5jaGF0cm9vbVZpZXcgID0gbmV3IGFwcC5DaGF0cm9vbVZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzLCBtb2RlbDogc2VsZi5jaGF0cm9vbU1vZGVsLCBjb2xsZWN0aW9uOiBzZWxmLmNoYXRyb29tTGlzdH0pO1xuICAgIHNlbGYuY29udGFpbmVyTW9kZWwuc2V0KCd2aWV3U3RhdGUnLCBzZWxmLmNoYXRyb29tVmlldyk7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLmxvYWRNb2RlbChtb2RlbCk7XG4gICAgZGVidWdnZXI7XG4gICAgLy8gc2VsZi5jaGF0cm9vbU1vZGVsLmxvYWRNb2RlbChtb2RlbCk7XG4gIH0pO1xuXG4gIC8vIGFkZHMgbmV3IHVzZXIgdG8gdXNlcnMgY29sbGVjdGlvbiwgc2VuZHMgZGVmYXVsdCBqb2luaW5nIG1lc3NhZ2Vcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcInVzZXJKb2luZWRcIiwgZnVuY3Rpb24odXNlcm5hbWUpIHtcbiAgICBkZWJ1Z2dlcjtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkVXNlcih1c2VybmFtZSk7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLmFkZENoYXQoe3NlbmRlcjogXCJCdXR0ZXJzXCIsIG1lc3NhZ2U6IHVzZXJuYW1lICsgXCIgam9pbmVkIHJvb20uXCIgfSk7XG5cdH0pO1xuXG5cdC8vIHJlbW92ZXMgdXNlciBmcm9tIHVzZXJzIGNvbGxlY3Rpb24sIHNlbmRzIGRlZmF1bHQgbGVhdmluZyBtZXNzYWdlXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2VyTGVmdFwiLCBmdW5jdGlvbih1c2VybmFtZSkge1xuXHRcdHNlbGYuY2hhdHJvb21Nb2RlbC5yZW1vdmVVc2VyKHVzZXJuYW1lKTtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkQ2hhdCh7c2VuZGVyOiBcIkJ1dHRlcnNcIiwgbWVzc2FnZTogdXNlcm5hbWUgKyBcIiBsZWZ0IHJvb20uXCIgfSk7XG5cdH0pO1xuXG5cdC8vIGNoYXQgcGFzc2VkIGZyb20gc29ja2V0Y2xpZW50LCBhZGRzIGEgbmV3IGNoYXQgbWVzc2FnZSB1c2luZyBjaGF0cm9vbU1vZGVsIG1ldGhvZFxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwiY2hhdFJlY2VpdmVkXCIsIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICBzZWxmLmNoYXRyb29tVmlldy5nb3JwKGNoYXQpO1xuXHRcdCQoJy5jaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuXHR9KTtcblxuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldENoYXRsb2dcIiwgZnVuY3Rpb24oY2hhdGxvZykge1xuICAgIHZhciBuZXdMaXN0ID0gbmV3IGFwcC5DaGF0Q29sbGVjdGlvbihjaGF0bG9nKTtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdjaGF0bG9nJywgbmV3TGlzdCk7XG4gICAgZGVidWdnZXI7XG4gICAgLy8gJCgnLmNoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJy5jaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG4gIH0pO1xuICBcbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldENoYXRyb29tc1wiLCBmdW5jdGlvbihjaGF0cm9vbXMpIHtcbiAgICB2YXIgbmV3TGlzdCA9IG5ldyBhcHAuQ2hhdHJvb21MaXN0KGNoYXRyb29tcyk7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnY2hhdHJvb21zJywgbmV3TGlzdCk7XG4gICAgZGVidWdnZXI7XG4gIH0pO1xuXG4gICAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldE9ubGluZVVzZXJzXCIsIGZ1bmN0aW9uKG9ubGluZVVzZXJzKSB7XG4gICAgdmFyIG5ld0xpc3QgPSBuZXcgYXBwLlVzZXJDb2xsZWN0aW9uKG9ubGluZVVzZXJzKTtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdvbmxpbmVVc2VycycsIG5ld0xpc3QpO1xuICAgIGRlYnVnZ2VyO1xuXG4gIH0pO1xuXG5cbn07XG5cbiIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgdmFyIENoYXRyb29tUm91dGVyID0gQmFja2JvbmUuUm91dGVyLmV4dGVuZCh7XG4gICAgXG4gICAgcm91dGVzOiB7XG4gICAgICAnJzogJ3N0YXJ0JyxcbiAgICAgICdsb2cnOiAnbG9naW4nLFxuICAgICAgJ3JlZyc6ICdyZWdpc3RlcicsXG4gICAgICAnYXV0aGVudGljYXRlZCc6ICdhdXRoZW50aWNhdGVkJ1xuICAgIH0sXG5cbiAgICBzdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIgPSBuZXcgYXBwLk1haW5Db250cm9sbGVyKCk7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIuaW5pdCgpO1xuICAgIH0sXG5cbiAgICBsb2dpbjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbG9naW5Nb2RlbCA9IG5ldyBhcHAuTG9naW5Nb2RlbCgpO1xuICAgICAgdmFyIGxvZ2luVmlldyA9IG5ldyBhcHAuTG9naW5WaWV3KHt2ZW50OiBhcHAubWFpbkNvbnRyb2xsZXIudmlld0V2ZW50QnVzLCBtb2RlbDogbG9naW5Nb2RlbH0pO1xuICAgICAgYXBwLm1haW5Db250cm9sbGVyLmNvbnRhaW5lck1vZGVsLnNldChcInZpZXdTdGF0ZVwiLCBsb2dpblZpZXcpO1xuICAgIH0sXG5cbiAgICByZWdpc3RlcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcmVnaXN0ZXJWaWV3ID0gbmV3IGFwcC5SZWdpc3RlclZpZXcoe3ZlbnQ6IGFwcC5tYWluQ29udHJvbGxlci52aWV3RXZlbnRCdXMgfSk7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIuY29udGFpbmVyTW9kZWwuc2V0KFwidmlld1N0YXRlXCIsIHJlZ2lzdGVyVmlldyk7XG4gICAgfSxcblxuICAgIGF1dGhlbnRpY2F0ZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgYXBwLm1haW5Db250cm9sbGVyID0gbmV3IGFwcC5NYWluQ29udHJvbGxlcigpO1xuICAgICAgYXBwLm1haW5Db250cm9sbGVyLmF1dGhlbnRpY2F0ZWQoKTtcbiAgICB9XG5cbiAgfSk7XG5cbiAgYXBwLkNoYXRyb29tUm91dGVyID0gbmV3IENoYXRyb29tUm91dGVyKCk7XG4gIEJhY2tib25lLmhpc3Rvcnkuc3RhcnQoKTtcblxufSkoKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=