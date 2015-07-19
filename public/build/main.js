
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

  app.ChatCollection = Backbone.Collection.extend({model: app.ChatModel});

})();

var app = app || {};

(function () {

  app.RoomCollection = Backbone.Collection.extend({model: app.ChatroomModel});

})();

var app = app || {};

(function () {

  app.UserCollection = Backbone.Collection.extend({model: app.UserModel});

})();
app.ChatroomModel = Backbone.Model.extend({
  defaults: {
    onlineUsers: new app.UserCollection(),
    userChats: new app.ChatCollection([
      // message and sender upon entering chatroom
      new app.ChatModel({ sender: 'Butters', message: 'awwwwww hamburgers. ||):||', timestamp: _.now() })
      ]),
    rooms: new app.RoomCollection(),
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
    var now = _.now();
    this.get('userChats').add(new app.ChatModel({ sender: chat.sender, message: chat.message, timestamp: now}));
  },
});
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
    var onlineUsers = this.model.get('onlineUsers');
    var userChats = this.model.get('userChats');
    var chatrooms = this.model.get('rooms');

    //sets event listeners on the collections
    this.listenTo(onlineUsers, "add", this.renderUser, this);
    this.listenTo(onlineUsers, "remove", this.renderUsers, this);
    this.listenTo(onlineUsers, "reset", this.renderUsers, this);

    this.listenTo(userChats, "add", this.renderChat, this);
    this.listenTo(userChats, "remove", this.renderChats, this);
    this.listenTo(userChats, "reset", this.renderChats, this);

    this.listenTo(chatrooms, "add", this.renderRoom, this);
    this.listenTo(chatrooms, "remove", this.renderRooms, this);
    this.listenTo(chatrooms, "reset", this.renderRooms, this);
  },
  render: function() {
    var onlineUsers = this.model.get("onlineUsers");
    this.$el.html(this.template());
    this.renderUsers();
    this.renderChats();
    this.renderRooms();
    return this;
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
    // this.$('.user-count').html(this.model.get("onlineUsers").length);
    // this.$('.nano').nanoScroller();
  },
  renderChats: function() {
    this.$('.chatbox-content').empty();
    this.model.get('userChats').each(function(chat) {
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
    this.model.get("rooms").each(function (room) {
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
		// emits login event to chatserver
	self.login = function(name) {
		self.socket.emit("login", name);
	};
    // emits chat event to chatserver
	self.chat = function(chat) {
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


    var self = this;
    $('.chat-directory').find('.room').each(function() {
      var $room = $(this);
      $room.removeClass('active');
      if ($room.data('name') === self.currentRoom) {
        $room.addClass('active');
      }
    });
  };
  



  // chatserver listeners
  // these guys listen to the chatserver/socket and emit data to main.js,
  // specifically to the appEventBus.
	self.setResponseListeners = function(socket) {
		// client listeners that listen to the chatserver and itself.
		// Each server event triggers an appEventBus event paired with 
		// relevant data.

		socket.on('welcome', function(data) {
      // emits event to recalibrate onlineUsers collection
      socket.emit("onlineUsers");
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
		socket.on('onlineUsers', function(data) {
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
			self.vent.trigger("userJoined", data);
		});
		socket.on('userLeft', function(data) {
			// data === username of user removed
			console.log('userLeft: ', data);
			self.vent.trigger("userLeft", data);
		});
		socket.on('chat', function(data) {
			// data === chat message object
			console.log('chat: ', data);
			self.vent.trigger("chatReceived", data);
		});
    socket.on('setRoom', function(name) {
      debugger;
      self.vent.trigger("setRoom", name);
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

    // The ContainerModel gets passed a viewState, LoginView, which
    // is the login page. That LoginView gets passed the viewEventBus
    // and the LoginModel.
		self.containerModel = new app.ContainerModel({ viewState: new app.LoginView({vent: self.viewEventBus, model: self.loginModel})});

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
    debugger;
    self.chatClient.joinRoom(room);
  });








  //// appEventBus Listeners ////

  // after the 'welcome' event triggers on the sockeclient, the loginDone event triggers.
	self.appEventBus.on("loginDone", function() {

		// new model and view created for chatroom
		self.chatroomModel = new app.ChatroomModel();
		self.chatroomView  = new app.ChatroomView({vent: self.viewEventBus, model: self.chatroomModel });

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
    var rooms = self.chatroomModel.get("rooms");
   // users is array of the current user models
    var updatedRooms = _.map(data, function(room) {
      return new app.ChatroomModel({name: room.name});
    });
    console.log("updatedrooms: ---", updatedRooms);

    // this resets the collection with the updated array of users
    rooms.reset(updatedRooms);
  });


  self.appEventBus.on("setRoom", function(room) {
    debugger;
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
		self.chatroomModel.addChat(chat);
		$('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
	});
};


var app = app || {};

(function () {

  var ChatroomRouter = Backbone.Router.extend({
    
    routes: {
      '': 'start',
    },

    start: function() {
      app.mainController = new app.MainController();
      app.mainController.init();
    },

  });

  app.ChatroomRouter = new ChatroomRouter();
  Backbone.history.start();

})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYXQuanMiLCJjb250YWluZXIuanMiLCJsb2dpbi5qcyIsInVzZXIuanMiLCJyb29tLmpzIiwiY2hhdHJvb20uanMiLCJzb2NrZXRjbGllbnQuanMiLCJtYWluLmpzIiwicm91dGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FIUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBSVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QURQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FFUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUF4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FKakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FJbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5DaGF0Q29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHttb2RlbDogYXBwLkNoYXRNb2RlbH0pO1xuXG59KSgpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5Db250YWluZXJWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIGVsOiAnI3ZpZXctY29udGFpbmVyJyxcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLm1vZGVsLm9uKFwiY2hhbmdlOnZpZXdTdGF0ZVwiLCB0aGlzLnJlbmRlciwgdGhpcyk7XG4gICAgfSxcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHZpZXcgPSB0aGlzLm1vZGVsLmdldCgndmlld1N0YXRlJyk7XG4gICAgICB0aGlzLiRlbC5odG1sKHZpZXcucmVuZGVyKCkuZWwpO1xuICAgIH1cbiAgfSk7XG5cbn0pKGpRdWVyeSk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbiAgYXBwLkxvZ2luVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjbG9naW4tdGVtcGxhdGUnKS5odG1sKCkpLFxuICAgIGV2ZW50czoge1xuICAgICAgJ2NsaWNrICNuYW1lQnRuJzogJ29uTG9naW4nLFxuICAgICAgJ2tleXByZXNzICNuYW1lVGV4dCc6ICdvbkhpdEVudGVyJ1xuICAgIH0sXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIC8vIExvZ2luVmlldyBnZXRzIHBhc3NlZCB0aGUgdmlld0V2ZW50QnVzIHdoZW4gdGhlIE1haW5Db250cm9sbGVyIGlzIGluaXRpYWxpemVkXG4gICAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XG5cbiAgICAvLyBUaGlzIHRlbGxzIHRoZSB2aWV3IHRvIGxpc3RlbiB0byBhbiBldmVudCBvbiBpdHMgbW9kZWwsXG4gICAgLy8gaWYgdGhlcmUncyBhbiBlcnJvciwgdGhlIGNhbGxiYWNrICh0aGlzLnJlbmRlcikgaXMgY2FsbGVkIHdpdGggdGhlICBcbiAgICAvLyB2aWV3IGFzIGNvbnRleHRcbiAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJjaGFuZ2U6ZXJyb3JcIiwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzLm1vZGVsLnRvSlNPTigpKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIG9uTG9naW46IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gdHJpZ2dlcnMgdGhlIGxvZ2luIGV2ZW50IGFuZCBwYXNzaW5nIHRoZSB1c2VybmFtZSBkYXRhIHRvIGpzL21haW4uanNcbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwibG9naW5cIiwgdGhpcy4kKCcjbmFtZVRleHQnKS52YWwoKSk7XG4gICAgfSxcbiAgICBvbkhpdEVudGVyOiBmdW5jdGlvbihlKSB7XG4gICAgICBpZihlLmtleUNvZGUgPT0gMTMpIHtcbiAgICAgICAgdGhpcy5vbkxvZ2luKCk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICBcbn0pKGpRdWVyeSk7IiwiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5Vc2VyQ29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHttb2RlbDogYXBwLlVzZXJNb2RlbH0pO1xuXG59KSgpOyIsIlxudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuUm9vbUNvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7bW9kZWw6IGFwcC5DaGF0cm9vbU1vZGVsfSk7XG5cbn0pKCk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbmFwcC5DaGF0cm9vbVZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gIHRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNjaGF0cm9vbS10ZW1wbGF0ZScpLmh0bWwoKSksXG4gIGV2ZW50czoge1xuICAgICdrZXlwcmVzcyAubWVzc2FnZS1pbnB1dCc6ICdtZXNzYWdlSW5wdXRQcmVzc2VkJyxcbiAgICAnY2xpY2sgLmNoYXQtZGlyZWN0b3J5IC5yb29tJzogJ3NldFJvb20nXG4gIH0sXG4gIC8vIGluaXRpYWxpemVkIGFmdGVyIHRoZSAnbG9naW5Eb25lJyBldmVudFxuICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgY29uc29sZS5sb2cob3B0aW9ucyk7XG4gICAgLy8gcGFzc2VkIHRoZSB2aWV3RXZlbnRCdXNcbiAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XG5cbiAgICAvLyB0aGVzZSBnZXQgdGhlIGNvbGxlY3Rpb24gb2Ygb25saW5lVXNlcnMgYW5kIHVzZXJDaGF0cyBmcm9tIHRoZSBjaGF0cm9vbU1vZGVsXG4gICAgdmFyIG9ubGluZVVzZXJzID0gdGhpcy5tb2RlbC5nZXQoJ29ubGluZVVzZXJzJyk7XG4gICAgdmFyIHVzZXJDaGF0cyA9IHRoaXMubW9kZWwuZ2V0KCd1c2VyQ2hhdHMnKTtcbiAgICB2YXIgY2hhdHJvb21zID0gdGhpcy5tb2RlbC5nZXQoJ3Jvb21zJyk7XG5cbiAgICAvL3NldHMgZXZlbnQgbGlzdGVuZXJzIG9uIHRoZSBjb2xsZWN0aW9uc1xuICAgIHRoaXMubGlzdGVuVG8ob25saW5lVXNlcnMsIFwiYWRkXCIsIHRoaXMucmVuZGVyVXNlciwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJyZW1vdmVcIiwgdGhpcy5yZW5kZXJVc2VycywgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJyZXNldFwiLCB0aGlzLnJlbmRlclVzZXJzLCB0aGlzKTtcblxuICAgIHRoaXMubGlzdGVuVG8odXNlckNoYXRzLCBcImFkZFwiLCB0aGlzLnJlbmRlckNoYXQsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8odXNlckNoYXRzLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlckNoYXRzLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKHVzZXJDaGF0cywgXCJyZXNldFwiLCB0aGlzLnJlbmRlckNoYXRzLCB0aGlzKTtcblxuICAgIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcImFkZFwiLCB0aGlzLnJlbmRlclJvb20sIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlclJvb21zLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRyb29tcywgXCJyZXNldFwiLCB0aGlzLnJlbmRlclJvb21zLCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgb25saW5lVXNlcnMgPSB0aGlzLm1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpO1xuICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSgpKTtcbiAgICB0aGlzLnJlbmRlclVzZXJzKCk7XG4gICAgdGhpcy5yZW5kZXJDaGF0cygpO1xuICAgIHRoaXMucmVuZGVyUm9vbXMoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLy8gcmVuZGVycyBvbiBldmVudHMsIGNhbGxlZCBqdXN0IGFib3ZlXG4gIHJlbmRlclVzZXJzOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLiQoJy5vbmxpbmUtdXNlcnMnKS5lbXB0eSgpO1xuICAgIHRoaXMubW9kZWwuZ2V0KFwib25saW5lVXNlcnNcIikuZWFjaChmdW5jdGlvbiAodXNlcikge1xuICAgICAgdGhpcy5yZW5kZXJVc2VyKHVzZXIpO1xuICAgIH0sIHRoaXMpO1xuICB9LFxuICByZW5kZXJVc2VyOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHZhciB0ZW1wbGF0ZSA9IF8udGVtcGxhdGUoJChcIiNvbmxpbmUtdXNlcnMtbGlzdC10ZW1wbGF0ZVwiKS5odG1sKCkpO1xuICAgIHRoaXMuJCgnLm9ubGluZS11c2VycycpLmFwcGVuZCh0ZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICAgIC8vIHRoaXMuJCgnLnVzZXItY291bnQnKS5odG1sKHRoaXMubW9kZWwuZ2V0KFwib25saW5lVXNlcnNcIikubGVuZ3RoKTtcbiAgICAvLyB0aGlzLiQoJy5uYW5vJykubmFub1Njcm9sbGVyKCk7XG4gIH0sXG4gIHJlbmRlckNoYXRzOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLiQoJy5jaGF0Ym94LWNvbnRlbnQnKS5lbXB0eSgpO1xuICAgIHRoaXMubW9kZWwuZ2V0KCd1c2VyQ2hhdHMnKS5lYWNoKGZ1bmN0aW9uKGNoYXQpIHtcbiAgICAgIHRoaXMucmVuZGVyQ2hhdChjaGF0KTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyQ2hhdDogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBfLnRlbXBsYXRlKCQoJyNjaGF0Ym94LW1lc3NhZ2UtdGVtcGxhdGUnKS5odG1sKCkpO1xuICAgIHZhciBlbGVtZW50ID0gJCh0ZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICAgIGVsZW1lbnQuYXBwZW5kVG8odGhpcy4kKCcuY2hhdGJveC1jb250ZW50JykpLmhpZGUoKS5mYWRlSW4oKS5zbGlkZURvd24oKTtcbiAgICAvLyB0aGlzLiQoJy5uYW5vJykubmFub1Njcm9sbGVyKCk7XG4gICAgLy8gdGhpcy4kKCcubmFubycpLm5hbm9TY3JvbGxlcih7IHNjcm9sbDogJ2JvdHRvbScgfSk7XG4gIH0sXG5cblxuICAvLyByZW5kZXJzIG9uIGV2ZW50cywgY2FsbGVkIGp1c3QgYWJvdmVcbiAgcmVuZGVyUm9vbXM6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuJCgnLnB1YmxpYy1yb29tcy1jb250YWluZXInKS5lbXB0eSgpO1xuICAgIHRoaXMubW9kZWwuZ2V0KFwicm9vbXNcIikuZWFjaChmdW5jdGlvbiAocm9vbSkge1xuICAgICAgdGhpcy5yZW5kZXJSb29tKHJvb20pO1xuICAgIH0sIHRoaXMpO1xuICB9LFxuICByZW5kZXJSb29tOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHZhciB0ZW1wbGF0ZSA9IF8udGVtcGxhdGUoJChcIiNyb29tLWxpc3QtdGVtcGxhdGVcIikuaHRtbCgpKTtcbiAgICB0aGlzLiQoJy5wdWJsaWMtcm9vbXMtY29udGFpbmVyJykuYXBwZW5kKHRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gICAgLy8gdGhpcy4kKCcudXNlci1jb3VudCcpLmh0bWwodGhpcy5tb2RlbC5nZXQoXCJvbmxpbmVVc2Vyc1wiKS5sZW5ndGgpO1xuICAgIC8vIHRoaXMuJCgnLm5hbm8nKS5uYW5vU2Nyb2xsZXIoKTtcbiAgfSxcblxuICBqb2luUm9vbTogZnVuY3Rpb24obmFtZSkge1xuICAgIHRoaXMudmVudC50cmlnZ2VyKCdqb2luUm9vbScsIG5hbWUpO1xuICB9LFxuXG5cbiAgLy9ldmVudHNcbiAgbWVzc2FnZUlucHV0UHJlc3NlZDogZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzICYmICQudHJpbSgkKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgpKS5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBmdW4gZmFjdDogc2VwYXJhdGUgZXZlbnRzIHdpdGggYSBzcGFjZSBpbiB0cmlnZ2VyJ3MgZmlyc3QgYXJnIGFuZCB5b3VcbiAgICAgIC8vIGNhbiB0cmlnZ2VyIG11bHRpcGxlIGV2ZW50cy5cbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiY2hhdFwiLCB0aGlzLiQoJy5tZXNzYWdlLWlucHV0JykudmFsKCkpO1xuICAgICAgdGhpcy4kKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgnJyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwidHlwaW5nXCIpO1xuICAgICAgY29uc29sZS5sb2coJ3d1dCcpO1xuICAgIH1cbiAgfSxcbiAgc2V0Um9vbTogZnVuY3Rpb24oZSkge1xuICAgIHZhciAkdGFyID0gJChlLnRhcmdldCk7XG4gICAgaWYgKCR0YXIuaXMoJ3AnKSkge1xuICAgICAgdGhpcy5qb2luUm9vbSgkdGFyLmRhdGEoJ3Jvb20nKSk7XG4gICAgfVxuICB9XG5cblxuXG59KTtcblxufSkoalF1ZXJ5KTsiLCJcbi8vIFRoZSBDaGF0Q2xpZW50IGlzIGltcGxlbWVudGVkIG9uIG1haW4uanMuXG4vLyBUaGUgY2hhdGNsaWVudCBpcyBhIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIG9uIHRoZSBNYWluQ29udHJvbGxlci5cbi8vIEl0IGJvdGggbGlzdGVucyB0byBhbmQgZW1pdHMgZXZlbnRzIG9uIHRoZSBzb2NrZXQsIGVnOlxuLy8gSXQgaGFzIGl0cyBvd24gbWV0aG9kcyB0aGF0LCB3aGVuIGNhbGxlZCwgZW1pdCB0byB0aGUgc29ja2V0IHcvIGRhdGEuXG4vLyBJdCBhbHNvIHNldHMgcmVzcG9uc2UgbGlzdGVuZXJzIG9uIGNvbm5lY3Rpb24sIHRoZXNlIHJlc3BvbnNlIGxpc3RlbmVyc1xuLy8gbGlzdGVuIHRvIHRoZSBzb2NrZXQgYW5kIHRyaWdnZXIgZXZlbnRzIG9uIHRoZSBhcHBFdmVudEJ1cyBvbiB0aGUgXG4vLyBNYWluQ29udHJvbGxlclxudmFyIENoYXRDbGllbnQgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdC8vIGlzLXR5cGluZyBoZWxwZXIgdmFyaWFibGVzXG5cdHZhciBUWVBJTkdfVElNRVJfTEVOR1RIID0gNDAwOyAvLyBtc1xuICB2YXIgdHlwaW5nID0gZmFsc2U7XG4gIHZhciBsYXN0VHlwaW5nVGltZTtcbiAgXG4gIC8vIHRoaXMgdmVudCBob2xkcyB0aGUgYXBwRXZlbnRCdXNcblx0c2VsZi52ZW50ID0gb3B0aW9ucy52ZW50O1xuXG5cdHNlbGYuaG9zdG5hbWUgPSAnaHR0cDovLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdDtcblxuICAvLyBjb25uZWN0cyB0byBzb2NrZXQsIHNldHMgcmVzcG9uc2UgbGlzdGVuZXJzXG5cdHNlbGYuY29ubmVjdCA9IGZ1bmN0aW9uKCkge1xuXHRcdC8vIHRoaXMgaW8gbWlnaHQgYmUgYSBsaXR0bGUgY29uZnVzaW5nLi4uIHdoZXJlIGlzIGl0IGNvbWluZyBmcm9tP1xuXHRcdC8vIGl0J3MgY29taW5nIGZyb20gdGhlIHN0YXRpYyBtaWRkbGV3YXJlIG9uIHNlcnZlci5qcyBiYyBldmVyeXRoaW5nXG5cdFx0Ly8gaW4gdGhlIC9wdWJsaWMgZm9sZGVyIGhhcyBiZWVuIGF0dGFjaGVkIHRvIHRoZSBzZXJ2ZXIsIGFuZCB2aXNhXG5cdFx0Ly8gdmVyc2EuXG5cdFx0c2VsZi5zb2NrZXQgPSBpby5jb25uZWN0KHNlbGYuaG9zdG5hbWUpO1xuXHRcdHNlbGYuc2V0UmVzcG9uc2VMaXN0ZW5lcnMoc2VsZi5zb2NrZXQpO1xuXHR9O1xuXG4gICAgLy8vLy8gVmlld0V2ZW50QnVzIG1ldGhvZHMgLy8vL1xuICAgIC8vIG1ldGhvZHMgdGhhdCBlbWl0IHRvIHRoZSBjaGF0c2VydmVyXG5cdFx0Ly8gZW1pdHMgbG9naW4gZXZlbnQgdG8gY2hhdHNlcnZlclxuXHRzZWxmLmxvZ2luID0gZnVuY3Rpb24obmFtZSkge1xuXHRcdHNlbGYuc29ja2V0LmVtaXQoXCJsb2dpblwiLCBuYW1lKTtcblx0fTtcbiAgICAvLyBlbWl0cyBjaGF0IGV2ZW50IHRvIGNoYXRzZXJ2ZXJcblx0c2VsZi5jaGF0ID0gZnVuY3Rpb24oY2hhdCkge1xuXHRcdHNlbGYuc29ja2V0LmVtaXQoXCJjaGF0XCIsIGNoYXQpO1xuXHR9O1xuXG5cbiAgLy8gVHlwaW5nIG1ldGhvZHNcblx0c2VsZi5hZGRDaGF0VHlwaW5nID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciBtZXNzYWdlID0gZGF0YS51c2VybmFtZSArICcgaXMgdHlwaW5nJztcbiAgICAkKCcudHlwZXR5cGV0eXBlJykudGV4dChtZXNzYWdlKTtcblx0fTtcblxuXHRzZWxmLnJlbW92ZUNoYXRUeXBpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAkKCcudHlwZXR5cGV0eXBlJykuZW1wdHkoKTtcblx0fTtcblxuICBzZWxmLnVwZGF0ZVR5cGluZyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChzZWxmLnNvY2tldCkge1xuICAgICAgaWYgKCF0eXBpbmcpIHtcbiAgICAgICAgdHlwaW5nID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5zb2NrZXQuZW1pdCgndHlwaW5nJyk7XG4gICAgICB9XG4gICAgICBsYXN0VHlwaW5nVGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG5cbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0eXBpbmdUaW1lciA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICAgIHZhciB0aW1lRGlmZiA9IHR5cGluZ1RpbWVyIC0gbGFzdFR5cGluZ1RpbWU7XG4gICAgICAgIGlmICh0aW1lRGlmZiA+PSBUWVBJTkdfVElNRVJfTEVOR1RIICYmIHR5cGluZykge1xuICAgICAgICAgICBzZWxmLnNvY2tldC5lbWl0KCdzdG9wIHR5cGluZycpO1xuICAgICAgICAgICB0eXBpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSwgVFlQSU5HX1RJTUVSX0xFTkdUSCk7XG4gICAgfVxuICB9O1xuXG4gIC8vIGpvaW4gcm9vbVxuICBzZWxmLmpvaW5Sb29tID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoJ2pvaW5Sb29tJywgbmFtZSk7XG4gIH07XG5cbi8vIHNldCByb29tXG4gIHNlbGYuc2V0Um9vbSA9IGZ1bmN0aW9uKG5hbWUpIHtcblxuICAgIGlmIChuYW1lICE9PSBudWxsKSB7XG4gICAgICB0aGlzLmN1cnJlbnRSb29tID0gbmFtZTtcbiAgICB9XG5cbi8vLz4+Pj4+Pj4gY2hhbmdldGhpc3RvIC5jaGF0LXRpdGxlXG4gICAgdmFyICRjaGF0VGl0bGUgPSAkKCcuY2hhdGJveC1oZWFkZXItdXNlcm5hbWUnKTtcbiAgICAkY2hhdFRpdGxlLnRleHQobmFtZSk7XG5cblxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAkKCcuY2hhdC1kaXJlY3RvcnknKS5maW5kKCcucm9vbScpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgJHJvb20gPSAkKHRoaXMpO1xuICAgICAgJHJvb20ucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgaWYgKCRyb29tLmRhdGEoJ25hbWUnKSA9PT0gc2VsZi5jdXJyZW50Um9vbSkge1xuICAgICAgICAkcm9vbS5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG4gIFxuXG5cblxuICAvLyBjaGF0c2VydmVyIGxpc3RlbmVyc1xuICAvLyB0aGVzZSBndXlzIGxpc3RlbiB0byB0aGUgY2hhdHNlcnZlci9zb2NrZXQgYW5kIGVtaXQgZGF0YSB0byBtYWluLmpzLFxuICAvLyBzcGVjaWZpY2FsbHkgdG8gdGhlIGFwcEV2ZW50QnVzLlxuXHRzZWxmLnNldFJlc3BvbnNlTGlzdGVuZXJzID0gZnVuY3Rpb24oc29ja2V0KSB7XG5cdFx0Ly8gY2xpZW50IGxpc3RlbmVycyB0aGF0IGxpc3RlbiB0byB0aGUgY2hhdHNlcnZlciBhbmQgaXRzZWxmLlxuXHRcdC8vIEVhY2ggc2VydmVyIGV2ZW50IHRyaWdnZXJzIGFuIGFwcEV2ZW50QnVzIGV2ZW50IHBhaXJlZCB3aXRoIFxuXHRcdC8vIHJlbGV2YW50IGRhdGEuXG5cblx0XHRzb2NrZXQub24oJ3dlbGNvbWUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAvLyBlbWl0cyBldmVudCB0byByZWNhbGlicmF0ZSBvbmxpbmVVc2VycyBjb2xsZWN0aW9uXG4gICAgICBzb2NrZXQuZW1pdChcIm9ubGluZVVzZXJzXCIpO1xuICAgICAgc29ja2V0LmVtaXQoXCJyb29tc1wiKTtcblx0XHRcdGNvbnNvbGUubG9nKCdvbmxpbmVVc2VyczE6ICcsIGRhdGEpO1xuICAgICAgLy8gZGF0YSBpcyB1bmRlZmluZWQgYXQgdGhpcyBwb2ludCBiZWNhdXNlIGl0J3MgdGhlIGZpcnN0IHRvXG4gICAgICAvLyBmaXJlIG9mZiBhbiBldmVudCBjaGFpbiB0aGF0IHdpbGwgYXBwZW5kIHRoZSBuZXcgdXNlciB0byBcbiAgICAgIC8vIHRoZSBvbmxpbmVVc2VyIGNvbGxlY3Rpb25cbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwibG9naW5Eb25lXCIsIGRhdGEpO1xuICAgIH0pO1xuXG5cdFx0c29ja2V0Lm9uKCdsb2dpbk5hbWVFeGlzdHMnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAvLyBkYXRhID09PSBzdHJpbmcgb2YgdXNlZCB1c2VybmFtZVxuXHRcdFx0Y29uc29sZS5sb2coJ2xvZ2luTmFtZUV4aXN0czogJywgZGF0YSk7XG5cdFx0XHRzZWxmLnZlbnQudHJpZ2dlcihcImxvZ2luTmFtZUV4aXN0c1wiLCBkYXRhKTtcblx0XHR9KTtcblx0XHRzb2NrZXQub24oJ2xvZ2luTmFtZUJhZCcsIGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdC8vIGRhdGEgPT09IHN0cmluZyBvZiBiYWQgdXNlcm5hbWVcblx0XHRcdGNvbnNvbGUubG9nKCdsb2dpbk5hbWVCYWQ6ICcsIGRhdGEpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJsb2dpbk5hbWVCYWRcIiwgZGF0YSk7XG5cdFx0fSk7XG5cblx0XHQvLyB0aGlzIGlzIHRoZSBzZWNvbmQgbGlzdGVuZXIgdG8gb25saW5lVXNlcnNcblx0XHQvLyBieSB0aGUgdGltZSB0aGlzIGlzIGNhbGxlZCwgdGhlIG5ldyB1c2VyIGhhcyBiZWVuIGFkZGVkIHRvXG5cdFx0Ly8gdGhlIHVzZXIgY29sbGVjdGlvbi5cblx0XHRzb2NrZXQub24oJ29ubGluZVVzZXJzJywgZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0Ly8gdGhpcyBkYXRhIGlzIGFuIGFycmF5IHdpdGggYWxsIHRoZSBvbmxpbmUgdXNlcidzIHVzZXJuYW1lcy5cblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwidXNlcnNJbmZvXCIsIGRhdGEpO1xuXHRcdH0pO1xuXG5cblxuICAgIHNvY2tldC5vbigncm9vbXMnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAvLyB0aGlzIGRhdGEgaXMgYW4gYXJyYXkgd2l0aCBhbGwgdGhlIG9ubGluZSB1c2VyJ3MgdXNlcm5hbWVzLlxuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJyb29tSW5mb1wiLCBkYXRhKTtcbiAgICB9KTtcblxuXG5cblx0XHRzb2NrZXQub24oJ3VzZXJKb2luZWQnLCBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHQvLyBkYXRhID09PSB1c2VybmFtZSBvZiB1c2VyIGpvaW5lZFxuXHRcdFx0Y29uc29sZS5sb2coJ3VzZXJKb2luZWQ6ICcsIGRhdGEpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJ1c2VySm9pbmVkXCIsIGRhdGEpO1xuXHRcdH0pO1xuXHRcdHNvY2tldC5vbigndXNlckxlZnQnLCBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHQvLyBkYXRhID09PSB1c2VybmFtZSBvZiB1c2VyIHJlbW92ZWRcblx0XHRcdGNvbnNvbGUubG9nKCd1c2VyTGVmdDogJywgZGF0YSk7XG5cdFx0XHRzZWxmLnZlbnQudHJpZ2dlcihcInVzZXJMZWZ0XCIsIGRhdGEpO1xuXHRcdH0pO1xuXHRcdHNvY2tldC5vbignY2hhdCcsIGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdC8vIGRhdGEgPT09IGNoYXQgbWVzc2FnZSBvYmplY3Rcblx0XHRcdGNvbnNvbGUubG9nKCdjaGF0OiAnLCBkYXRhKTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwiY2hhdFJlY2VpdmVkXCIsIGRhdGEpO1xuXHRcdH0pO1xuICAgIHNvY2tldC5vbignc2V0Um9vbScsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIGRlYnVnZ2VyO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRSb29tXCIsIG5hbWUpO1xuICAgIH0pO1xuXG5cbiAgICAvLyB0aGVzZSBndXlzIGxpc3RlbiB0byB0aGUgc2VydmVyLCBcbiAgICAvLyB0aGVuIGNhbGwgY2hhdGNsaWVudCBtZXRob2RzIGxpc3RlZCBhYm92ZVxuICAgIHNvY2tldC5vbigndHlwaW5nJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgc2VsZi5hZGRDaGF0VHlwaW5nKGRhdGEpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbignc3RvcCB0eXBpbmcnLCBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYucmVtb3ZlQ2hhdFR5cGluZygpO1xuICAgIH0pO1xuXG5cblxuXHR9O1xufTsiLCJcblxuYXBwLk1haW5Db250cm9sbGVyID0gZnVuY3Rpb24oKSB7XG5cblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cbiAgLy9UaGVzZSBhbGxvd3MgdXMgdG8gYmluZCBhbmQgdHJpZ2dlciBvbiB0aGUgb2JqZWN0IGZyb20gYW55d2hlcmUgaW4gdGhlIGFwcC5cblx0c2VsZi5hcHBFdmVudEJ1cyA9IF8uZXh0ZW5kKHt9LCBCYWNrYm9uZS5FdmVudHMpO1xuXHRzZWxmLnZpZXdFdmVudEJ1cyA9IF8uZXh0ZW5kKHt9LCBCYWNrYm9uZS5FdmVudHMpO1xuXG5cdHNlbGYuaW5pdCA9IGZ1bmN0aW9uKCkge1xuXHRcdC8vIGNyZWF0ZXMgQ2hhdENsaWVudCBmcm9tIHNvY2tldGNsaWVudC5qcywgcGFzc2VzIGluIFxuXHRcdC8vIGFwcEV2ZW50QnVzIGFzIHZlbnQsIGNvbm5lY3RzXG5cdFx0c2VsZi5jaGF0Q2xpZW50ID0gbmV3IENoYXRDbGllbnQoeyB2ZW50OiBzZWxmLmFwcEV2ZW50QnVzIH0pO1xuXHRcdHNlbGYuY2hhdENsaWVudC5jb25uZWN0KCk7XG5cbiAgICAvLyBsb2dpbk1vZGVsXG5cdFx0c2VsZi5sb2dpbk1vZGVsID0gbmV3IGFwcC5Mb2dpbk1vZGVsKCk7XG5cbiAgICAvLyBUaGUgQ29udGFpbmVyTW9kZWwgZ2V0cyBwYXNzZWQgYSB2aWV3U3RhdGUsIExvZ2luVmlldywgd2hpY2hcbiAgICAvLyBpcyB0aGUgbG9naW4gcGFnZS4gVGhhdCBMb2dpblZpZXcgZ2V0cyBwYXNzZWQgdGhlIHZpZXdFdmVudEJ1c1xuICAgIC8vIGFuZCB0aGUgTG9naW5Nb2RlbC5cblx0XHRzZWxmLmNvbnRhaW5lck1vZGVsID0gbmV3IGFwcC5Db250YWluZXJNb2RlbCh7IHZpZXdTdGF0ZTogbmV3IGFwcC5Mb2dpblZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzLCBtb2RlbDogc2VsZi5sb2dpbk1vZGVsfSl9KTtcblxuXHRcdC8vIG5leHQsIGEgbmV3IENvbnRhaW5lclZpZXcgaXMgaW50aWFsaXplZCB3aXRoIHRoZSBuZXdseSBjcmVhdGVkIGNvbnRhaW5lck1vZGVsXG5cdFx0Ly8gdGhlIGxvZ2luIHBhZ2UgaXMgdGhlbiByZW5kZXJlZC5cblx0XHRzZWxmLmNvbnRhaW5lclZpZXcgPSBuZXcgYXBwLkNvbnRhaW5lclZpZXcoeyBtb2RlbDogc2VsZi5jb250YWluZXJNb2RlbCB9KTtcblx0XHRzZWxmLmNvbnRhaW5lclZpZXcucmVuZGVyKCk7XG5cdH07XG5cblxuXG4gIC8vLy8vLy8vLy8vLyAgQnVzc2VzIC8vLy8vLy8vLy8vL1xuICAgIC8vIFRoZXNlIEJ1c3NlcyBsaXN0ZW4gdG8gdGhlIHNvY2tldGNsaWVudFxuICAgLy8gICAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblxuICAvLy8vIHZpZXdFdmVudEJ1cyBMaXN0ZW5lcnMgLy8vLy9cbiAgXG5cdHNlbGYudmlld0V2ZW50QnVzLm9uKFwibG9naW5cIiwgZnVuY3Rpb24odXNlcm5hbWUpIHtcbiAgICAvLyBzb2NrZXRpbyBsb2dpbiwgc2VuZHMgbmFtZSB0byBzb2NrZXRjbGllbnQsIHNvY2tldGNsaWVudCBzZW5kcyBpdCB0byBjaGF0c2VydmVyXG4gICAgc2VsZi5jaGF0Q2xpZW50LmxvZ2luKHVzZXJuYW1lKTtcbiAgfSk7XG5cdHNlbGYudmlld0V2ZW50QnVzLm9uKFwiY2hhdFwiLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgLy8gc29ja2V0aW8gY2hhdCwgc2VuZHMgY2hhdCB0byBzb2NrZXRjbGllbnQsIHNvY2tldGNsaWVudCB0byBjaGF0c2VydmVyXG4gICAgc2VsZi5jaGF0Q2xpZW50LmNoYXQoY2hhdCk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcInR5cGluZ1wiLCBmdW5jdGlvbigpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQudXBkYXRlVHlwaW5nKCk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImpvaW5Sb29tXCIsIGZ1bmN0aW9uKHJvb20pIHtcbiAgICBkZWJ1Z2dlcjtcbiAgICBzZWxmLmNoYXRDbGllbnQuam9pblJvb20ocm9vbSk7XG4gIH0pO1xuXG5cblxuXG5cblxuXG5cbiAgLy8vLyBhcHBFdmVudEJ1cyBMaXN0ZW5lcnMgLy8vL1xuXG4gIC8vIGFmdGVyIHRoZSAnd2VsY29tZScgZXZlbnQgdHJpZ2dlcnMgb24gdGhlIHNvY2tlY2xpZW50LCB0aGUgbG9naW5Eb25lIGV2ZW50IHRyaWdnZXJzLlxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwibG9naW5Eb25lXCIsIGZ1bmN0aW9uKCkge1xuXG5cdFx0Ly8gbmV3IG1vZGVsIGFuZCB2aWV3IGNyZWF0ZWQgZm9yIGNoYXRyb29tXG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsID0gbmV3IGFwcC5DaGF0cm9vbU1vZGVsKCk7XG5cdFx0c2VsZi5jaGF0cm9vbVZpZXcgID0gbmV3IGFwcC5DaGF0cm9vbVZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzLCBtb2RlbDogc2VsZi5jaGF0cm9vbU1vZGVsIH0pO1xuXG5cdFx0Ly8gdmlld3N0YXRlIGlzIGNoYW5nZWQgdG8gY2hhdHJvb20gYWZ0ZXIgbG9naW4uXG5cdFx0c2VsZi5jb250YWluZXJNb2RlbC5zZXQoXCJ2aWV3U3RhdGVcIiwgc2VsZi5jaGF0cm9vbVZpZXcpO1xuICAgIGF1dG9zaXplKCQoJ3RleHRhcmVhLm1lc3NhZ2UtaW5wdXQnKSk7XG5cdFx0JCgnLmNoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJy5jaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG5cdH0pO1xuXG4gIC8vIGVycm9yIGxpc3RlbmVyc1xuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwibG9naW5OYW1lQmFkXCIsIGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG5cdFx0c2VsZi5sb2dpbk1vZGVsLnNldChcImVycm9yXCIsIFwiSW52YWxpZCBOYW1lXCIpO1xuXHR9KTtcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcImxvZ2luTmFtZUV4aXN0c1wiLCBmdW5jdGlvbih1c2VybmFtZSkge1xuXHRcdHNlbGYubG9naW5Nb2RlbC5zZXQoXCJlcnJvclwiLCBcIk5hbWUgYWxyZWFkeSBleGlzdHNcIik7XG5cdH0pO1xuXG5cbiAgLy8gYWZ0ZXIgJ29ubGluZVVzZXJzJyBldmVudCBlbWl0cywgdGhlICd1c2Vyc0luZm8nIGV2ZW50IHRyaWdnZXJzXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2Vyc0luZm9cIiwgZnVuY3Rpb24oZGF0YSkge1xuXG4gICAgLy9kYXRhIGlzIGFuIGFycmF5IG9mIHVzZXJuYW1lcywgaW5jbHVkaW5nIHRoZSBuZXcgdXNlclxuXG5cdFx0Ly8gVGhpcyBtZXRob2QgZ2V0cyB0aGUgb25saW5lIHVzZXJzIGNvbGxlY3Rpb24gZnJvbSBjaGF0cm9vbU1vZGVsLlxuXHRcdC8vIG9ubGluZVVzZXJzIGlzIHRoZSBjb2xsZWN0aW9uXG5cdFx0dmFyIG9ubGluZVVzZXJzID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKFwib25saW5lVXNlcnM6IC0tLVwiLCBvbmxpbmVVc2Vycyk7XG5cbiAgIC8vIHVzZXJzIGlzIGFycmF5IG9mIHRoZSBjdXJyZW50IHVzZXIgbW9kZWxzXG5cdFx0dmFyIHVzZXJzID0gXy5tYXAoZGF0YSwgZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0cmV0dXJuIG5ldyBhcHAuVXNlck1vZGVsKHt1c2VybmFtZTogaXRlbX0pO1xuXHRcdH0pO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKFwidXNlcnM6IC0tLVwiLCB1c2Vycyk7XG5cbiAgICAvLyB0aGlzIHJlc2V0cyB0aGUgY29sbGVjdGlvbiB3aXRoIHRoZSB1cGRhdGVkIGFycmF5IG9mIHVzZXJzXG5cdFx0b25saW5lVXNlcnMucmVzZXQodXNlcnMpO1xuXHR9KTtcblxuXG5cblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwicm9vbUluZm9cIiwgZnVuY3Rpb24oZGF0YSkge1xuXG4gICAgLy8gVGhpcyBtZXRob2QgZ2V0cyB0aGUgb25saW5lIHVzZXJzIGNvbGxlY3Rpb24gZnJvbSBjaGF0cm9vbU1vZGVsLlxuICAgIC8vIG9ubGluZVVzZXJzIGlzIHRoZSBjb2xsZWN0aW9uXG4gICAgdmFyIHJvb21zID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldChcInJvb21zXCIpO1xuICAgLy8gdXNlcnMgaXMgYXJyYXkgb2YgdGhlIGN1cnJlbnQgdXNlciBtb2RlbHNcbiAgICB2YXIgdXBkYXRlZFJvb21zID0gXy5tYXAoZGF0YSwgZnVuY3Rpb24ocm9vbSkge1xuICAgICAgcmV0dXJuIG5ldyBhcHAuQ2hhdHJvb21Nb2RlbCh7bmFtZTogcm9vbS5uYW1lfSk7XG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coXCJ1cGRhdGVkcm9vbXM6IC0tLVwiLCB1cGRhdGVkUm9vbXMpO1xuXG4gICAgLy8gdGhpcyByZXNldHMgdGhlIGNvbGxlY3Rpb24gd2l0aCB0aGUgdXBkYXRlZCBhcnJheSBvZiB1c2Vyc1xuICAgIHJvb21zLnJlc2V0KHVwZGF0ZWRSb29tcyk7XG4gIH0pO1xuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldFJvb21cIiwgZnVuY3Rpb24ocm9vbSkge1xuICAgIGRlYnVnZ2VyO1xuICAgIHNlbGYuY2hhdENsaWVudC5zZXRSb29tKHJvb20pO1xuICB9KTtcblxuXG5cblxuXG4gIC8vIGFkZHMgbmV3IHVzZXIgdG8gdXNlcnMgY29sbGVjdGlvbiwgc2VuZHMgZGVmYXVsdCBqb2luaW5nIG1lc3NhZ2Vcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcInVzZXJKb2luZWRcIiwgZnVuY3Rpb24odXNlcm5hbWUpIHtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkVXNlcih1c2VybmFtZSk7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLmFkZENoYXQoe3NlbmRlcjogXCJCdXR0ZXJzXCIsIG1lc3NhZ2U6IHVzZXJuYW1lICsgXCIgam9pbmVkIHJvb20uXCIgfSk7XG5cdH0pO1xuXG5cdC8vIHJlbW92ZXMgdXNlciBmcm9tIHVzZXJzIGNvbGxlY3Rpb24sIHNlbmRzIGRlZmF1bHQgbGVhdmluZyBtZXNzYWdlXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2VyTGVmdFwiLCBmdW5jdGlvbih1c2VybmFtZSkge1xuXHRcdHNlbGYuY2hhdHJvb21Nb2RlbC5yZW1vdmVVc2VyKHVzZXJuYW1lKTtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkQ2hhdCh7c2VuZGVyOiBcIkJ1dHRlcnNcIiwgbWVzc2FnZTogdXNlcm5hbWUgKyBcIiBsZWZ0IHJvb20uXCIgfSk7XG5cdH0pO1xuXG5cdC8vIGNoYXQgcGFzc2VkIGZyb20gc29ja2V0Y2xpZW50LCBhZGRzIGEgbmV3IGNoYXQgbWVzc2FnZSB1c2luZyBjaGF0cm9vbU1vZGVsIG1ldGhvZFxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwiY2hhdFJlY2VpdmVkXCIsIGZ1bmN0aW9uKGNoYXQpIHtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkQ2hhdChjaGF0KTtcblx0XHQkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnLmNoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcblx0fSk7XG59O1xuXG4iLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIHZhciBDaGF0cm9vbVJvdXRlciA9IEJhY2tib25lLlJvdXRlci5leHRlbmQoe1xuICAgIFxuICAgIHJvdXRlczoge1xuICAgICAgJyc6ICdzdGFydCcsXG4gICAgfSxcblxuICAgIHN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlciA9IG5ldyBhcHAuTWFpbkNvbnRyb2xsZXIoKTtcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlci5pbml0KCk7XG4gICAgfSxcblxuICB9KTtcblxuICBhcHAuQ2hhdHJvb21Sb3V0ZXIgPSBuZXcgQ2hhdHJvb21Sb3V0ZXIoKTtcbiAgQmFja2JvbmUuaGlzdG9yeS5zdGFydCgpO1xuXG59KSgpOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==