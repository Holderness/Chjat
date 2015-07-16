
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
    'keypress .message-input': 'messageInputPressed'
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
    console.log("rooms: ---", rooms);
   // users is array of the current user models
    var updatedRooms = _.map(data, function(name) {
      return new app.ChatroomModel({name: name});
    });
    console.log("updatedrooms: ---", updatedRooms);

    // this resets the collection with the updated array of users
    rooms.reset(updatedRooms);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYXQuanMiLCJjb250YWluZXIuanMiLCJsb2dpbi5qcyIsInVzZXIuanMiLCJyb29tLmpzIiwiY2hhdHJvb20uanMiLCJzb2NrZXRjbGllbnQuanMiLCJtYWluLmpzIiwicm91dGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FIUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBSVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QURQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FFUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUF4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUpuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUluQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuQ2hhdENvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7bW9kZWw6IGFwcC5DaGF0TW9kZWx9KTtcblxufSkoKTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuICBhcHAuQ29udGFpbmVyVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBlbDogJyN2aWV3LWNvbnRhaW5lcicsXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdGhpcy5tb2RlbC5vbihcImNoYW5nZTp2aWV3U3RhdGVcIiwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB2aWV3ID0gdGhpcy5tb2RlbC5nZXQoJ3ZpZXdTdGF0ZScpO1xuICAgICAgdGhpcy4kZWwuaHRtbCh2aWV3LnJlbmRlcigpLmVsKTtcbiAgICB9XG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5Mb2dpblZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2xvZ2luLXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgICBldmVudHM6IHtcbiAgICAgICdjbGljayAjbmFtZUJ0bic6ICdvbkxvZ2luJyxcbiAgICAgICdrZXlwcmVzcyAjbmFtZVRleHQnOiAnb25IaXRFbnRlcidcbiAgICB9LFxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAvLyBMb2dpblZpZXcgZ2V0cyBwYXNzZWQgdGhlIHZpZXdFdmVudEJ1cyB3aGVuIHRoZSBNYWluQ29udHJvbGxlciBpcyBpbml0aWFsaXplZFxuICAgICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xuXG4gICAgLy8gVGhpcyB0ZWxscyB0aGUgdmlldyB0byBsaXN0ZW4gdG8gYW4gZXZlbnQgb24gaXRzIG1vZGVsLFxuICAgIC8vIGlmIHRoZXJlJ3MgYW4gZXJyb3IsIHRoZSBjYWxsYmFjayAodGhpcy5yZW5kZXIpIGlzIGNhbGxlZCB3aXRoIHRoZSAgXG4gICAgLy8gdmlldyBhcyBjb250ZXh0XG4gICAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiY2hhbmdlOmVycm9yXCIsIHRoaXMucmVuZGVyLCB0aGlzKTtcbiAgICB9LFxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUodGhpcy5tb2RlbC50b0pTT04oKSkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBvbkxvZ2luOiBmdW5jdGlvbigpIHtcbiAgICAgIC8vIHRyaWdnZXJzIHRoZSBsb2dpbiBldmVudCBhbmQgcGFzc2luZyB0aGUgdXNlcm5hbWUgZGF0YSB0byBqcy9tYWluLmpzXG4gICAgICB0aGlzLnZlbnQudHJpZ2dlcihcImxvZ2luXCIsIHRoaXMuJCgnI25hbWVUZXh0JykudmFsKCkpO1xuICAgIH0sXG4gICAgb25IaXRFbnRlcjogZnVuY3Rpb24oZSkge1xuICAgICAgaWYoZS5rZXlDb2RlID09IDEzKSB7XG4gICAgICAgIHRoaXMub25Mb2dpbigpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgXG59KShqUXVlcnkpOyIsIlxudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuVXNlckNvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7bW9kZWw6IGFwcC5Vc2VyTW9kZWx9KTtcblxufSkoKTsiLCJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLlJvb21Db2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe21vZGVsOiBhcHAuQ2hhdHJvb21Nb2RlbH0pO1xuXG59KSgpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG5hcHAuQ2hhdHJvb21WaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjY2hhdHJvb20tdGVtcGxhdGUnKS5odG1sKCkpLFxuICBldmVudHM6IHtcbiAgICAna2V5cHJlc3MgLm1lc3NhZ2UtaW5wdXQnOiAnbWVzc2FnZUlucHV0UHJlc3NlZCdcbiAgfSxcbiAgLy8gaW5pdGlhbGl6ZWQgYWZ0ZXIgdGhlICdsb2dpbkRvbmUnIGV2ZW50XG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICBjb25zb2xlLmxvZyhvcHRpb25zKTtcbiAgICAvLyBwYXNzZWQgdGhlIHZpZXdFdmVudEJ1c1xuICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcblxuICAgIC8vIHRoZXNlIGdldCB0aGUgY29sbGVjdGlvbiBvZiBvbmxpbmVVc2VycyBhbmQgdXNlckNoYXRzIGZyb20gdGhlIGNoYXRyb29tTW9kZWxcbiAgICB2YXIgb25saW5lVXNlcnMgPSB0aGlzLm1vZGVsLmdldCgnb25saW5lVXNlcnMnKTtcbiAgICB2YXIgdXNlckNoYXRzID0gdGhpcy5tb2RlbC5nZXQoJ3VzZXJDaGF0cycpO1xuICAgIHZhciBjaGF0cm9vbXMgPSB0aGlzLm1vZGVsLmdldCgncm9vbXMnKTtcblxuICAgIC8vc2V0cyBldmVudCBsaXN0ZW5lcnMgb24gdGhlIGNvbGxlY3Rpb25zXG4gICAgdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJhZGRcIiwgdGhpcy5yZW5kZXJVc2VyLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKG9ubGluZVVzZXJzLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlclVzZXJzLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKG9ubGluZVVzZXJzLCBcInJlc2V0XCIsIHRoaXMucmVuZGVyVXNlcnMsIHRoaXMpO1xuXG4gICAgdGhpcy5saXN0ZW5Ubyh1c2VyQ2hhdHMsIFwiYWRkXCIsIHRoaXMucmVuZGVyQ2hhdCwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5Ubyh1c2VyQ2hhdHMsIFwicmVtb3ZlXCIsIHRoaXMucmVuZGVyQ2hhdHMsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8odXNlckNoYXRzLCBcInJlc2V0XCIsIHRoaXMucmVuZGVyQ2hhdHMsIHRoaXMpO1xuXG4gICAgdGhpcy5saXN0ZW5UbyhjaGF0cm9vbXMsIFwiYWRkXCIsIHRoaXMucmVuZGVyUm9vbSwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhjaGF0cm9vbXMsIFwicmVtb3ZlXCIsIHRoaXMucmVuZGVyUm9vbXMsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcInJlc2V0XCIsIHRoaXMucmVuZGVyUm9vbXMsIHRoaXMpO1xuICB9LFxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvbmxpbmVVc2VycyA9IHRoaXMubW9kZWwuZ2V0KFwib25saW5lVXNlcnNcIik7XG4gICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKCkpO1xuICAgIHRoaXMucmVuZGVyVXNlcnMoKTtcbiAgICB0aGlzLnJlbmRlckNoYXRzKCk7XG4gICAgdGhpcy5yZW5kZXJSb29tcygpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvLyByZW5kZXJzIG9uIGV2ZW50cywgY2FsbGVkIGp1c3QgYWJvdmVcbiAgcmVuZGVyVXNlcnM6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuJCgnLm9ubGluZS11c2VycycpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoXCJvbmxpbmVVc2Vyc1wiKS5lYWNoKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICB0aGlzLnJlbmRlclVzZXIodXNlcik7XG4gICAgfSwgdGhpcyk7XG4gIH0sXG4gIHJlbmRlclVzZXI6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gXy50ZW1wbGF0ZSgkKFwiI29ubGluZS11c2Vycy1saXN0LXRlbXBsYXRlXCIpLmh0bWwoKSk7XG4gICAgdGhpcy4kKCcub25saW5lLXVzZXJzJykuYXBwZW5kKHRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gICAgLy8gdGhpcy4kKCcudXNlci1jb3VudCcpLmh0bWwodGhpcy5tb2RlbC5nZXQoXCJvbmxpbmVVc2Vyc1wiKS5sZW5ndGgpO1xuICAgIC8vIHRoaXMuJCgnLm5hbm8nKS5uYW5vU2Nyb2xsZXIoKTtcbiAgfSxcbiAgcmVuZGVyQ2hhdHM6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuJCgnLmNoYXRib3gtY29udGVudCcpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoJ3VzZXJDaGF0cycpLmVhY2goZnVuY3Rpb24oY2hhdCkge1xuICAgICAgdGhpcy5yZW5kZXJDaGF0KGNoYXQpO1xuICAgIH0sIHRoaXMpO1xuICB9LFxuICByZW5kZXJDaGF0OiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHZhciB0ZW1wbGF0ZSA9IF8udGVtcGxhdGUoJCgnI2NoYXRib3gtbWVzc2FnZS10ZW1wbGF0ZScpLmh0bWwoKSk7XG4gICAgdmFyIGVsZW1lbnQgPSAkKHRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gICAgZWxlbWVudC5hcHBlbmRUbyh0aGlzLiQoJy5jaGF0Ym94LWNvbnRlbnQnKSkuaGlkZSgpLmZhZGVJbigpLnNsaWRlRG93bigpO1xuICAgIC8vIHRoaXMuJCgnLm5hbm8nKS5uYW5vU2Nyb2xsZXIoKTtcbiAgICAvLyB0aGlzLiQoJy5uYW5vJykubmFub1Njcm9sbGVyKHsgc2Nyb2xsOiAnYm90dG9tJyB9KTtcbiAgfSxcblxuXG4gIC8vIHJlbmRlcnMgb24gZXZlbnRzLCBjYWxsZWQganVzdCBhYm92ZVxuICByZW5kZXJSb29tczogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy4kKCcucHVibGljLXJvb21zLWNvbnRhaW5lcicpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoXCJyb29tc1wiKS5lYWNoKGZ1bmN0aW9uIChyb29tKSB7XG4gICAgICB0aGlzLnJlbmRlclJvb20ocm9vbSk7XG4gICAgfSwgdGhpcyk7XG4gIH0sXG4gIHJlbmRlclJvb206IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gXy50ZW1wbGF0ZSgkKFwiI3Jvb20tbGlzdC10ZW1wbGF0ZVwiKS5odG1sKCkpO1xuICAgIHRoaXMuJCgnLnB1YmxpYy1yb29tcy1jb250YWluZXInKS5hcHBlbmQodGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICAvLyB0aGlzLiQoJy51c2VyLWNvdW50JykuaHRtbCh0aGlzLm1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpLmxlbmd0aCk7XG4gICAgLy8gdGhpcy4kKCcubmFubycpLm5hbm9TY3JvbGxlcigpO1xuICB9LFxuXG5cbiAgLy9ldmVudHNcbiAgbWVzc2FnZUlucHV0UHJlc3NlZDogZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzICYmICQudHJpbSgkKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgpKS5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBmdW4gZmFjdDogc2VwYXJhdGUgZXZlbnRzIHdpdGggYSBzcGFjZSBpbiB0cmlnZ2VyJ3MgZmlyc3QgYXJnIGFuZCB5b3VcbiAgICAgIC8vIGNhbiB0cmlnZ2VyIG11bHRpcGxlIGV2ZW50cy5cbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiY2hhdFwiLCB0aGlzLiQoJy5tZXNzYWdlLWlucHV0JykudmFsKCkpO1xuICAgICAgdGhpcy4kKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgnJyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwidHlwaW5nXCIpO1xuICAgICAgY29uc29sZS5sb2coJ3d1dCcpO1xuICAgIH1cbiAgfVxufSk7XG5cbn0pKGpRdWVyeSk7IiwiXG4vLyBUaGUgQ2hhdENsaWVudCBpcyBpbXBsZW1lbnRlZCBvbiBtYWluLmpzLlxuLy8gVGhlIGNoYXRjbGllbnQgaXMgYSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBvbiB0aGUgTWFpbkNvbnRyb2xsZXIuXG4vLyBJdCBib3RoIGxpc3RlbnMgdG8gYW5kIGVtaXRzIGV2ZW50cyBvbiB0aGUgc29ja2V0LCBlZzpcbi8vIEl0IGhhcyBpdHMgb3duIG1ldGhvZHMgdGhhdCwgd2hlbiBjYWxsZWQsIGVtaXQgdG8gdGhlIHNvY2tldCB3LyBkYXRhLlxuLy8gSXQgYWxzbyBzZXRzIHJlc3BvbnNlIGxpc3RlbmVycyBvbiBjb25uZWN0aW9uLCB0aGVzZSByZXNwb25zZSBsaXN0ZW5lcnNcbi8vIGxpc3RlbiB0byB0aGUgc29ja2V0IGFuZCB0cmlnZ2VyIGV2ZW50cyBvbiB0aGUgYXBwRXZlbnRCdXMgb24gdGhlIFxuLy8gTWFpbkNvbnRyb2xsZXJcbnZhciBDaGF0Q2xpZW50ID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXG5cdHZhciBzZWxmID0gdGhpcztcblxuXHQvLyBpcy10eXBpbmcgaGVscGVyIHZhcmlhYmxlc1xuXHR2YXIgVFlQSU5HX1RJTUVSX0xFTkdUSCA9IDQwMDsgLy8gbXNcbiAgdmFyIHR5cGluZyA9IGZhbHNlO1xuICB2YXIgbGFzdFR5cGluZ1RpbWU7XG4gIFxuICAvLyB0aGlzIHZlbnQgaG9sZHMgdGhlIGFwcEV2ZW50QnVzXG5cdHNlbGYudmVudCA9IG9wdGlvbnMudmVudDtcblxuXHRzZWxmLmhvc3RuYW1lID0gJ2h0dHA6Ly8nICsgd2luZG93LmxvY2F0aW9uLmhvc3Q7XG5cbiAgLy8gY29ubmVjdHMgdG8gc29ja2V0LCBzZXRzIHJlc3BvbnNlIGxpc3RlbmVyc1xuXHRzZWxmLmNvbm5lY3QgPSBmdW5jdGlvbigpIHtcblx0XHQvLyB0aGlzIGlvIG1pZ2h0IGJlIGEgbGl0dGxlIGNvbmZ1c2luZy4uLiB3aGVyZSBpcyBpdCBjb21pbmcgZnJvbT9cblx0XHQvLyBpdCdzIGNvbWluZyBmcm9tIHRoZSBzdGF0aWMgbWlkZGxld2FyZSBvbiBzZXJ2ZXIuanMgYmMgZXZlcnl0aGluZ1xuXHRcdC8vIGluIHRoZSAvcHVibGljIGZvbGRlciBoYXMgYmVlbiBhdHRhY2hlZCB0byB0aGUgc2VydmVyLCBhbmQgdmlzYVxuXHRcdC8vIHZlcnNhLlxuXHRcdHNlbGYuc29ja2V0ID0gaW8uY29ubmVjdChzZWxmLmhvc3RuYW1lKTtcblx0XHRzZWxmLnNldFJlc3BvbnNlTGlzdGVuZXJzKHNlbGYuc29ja2V0KTtcblx0fTtcblxuICAgIC8vLy8vIFZpZXdFdmVudEJ1cyBtZXRob2RzIC8vLy9cbiAgICAvLyBtZXRob2RzIHRoYXQgZW1pdCB0byB0aGUgY2hhdHNlcnZlclxuXHRcdC8vIGVtaXRzIGxvZ2luIGV2ZW50IHRvIGNoYXRzZXJ2ZXJcblx0c2VsZi5sb2dpbiA9IGZ1bmN0aW9uKG5hbWUpIHtcblx0XHRzZWxmLnNvY2tldC5lbWl0KFwibG9naW5cIiwgbmFtZSk7XG5cdH07XG4gICAgLy8gZW1pdHMgY2hhdCBldmVudCB0byBjaGF0c2VydmVyXG5cdHNlbGYuY2hhdCA9IGZ1bmN0aW9uKGNoYXQpIHtcblx0XHRzZWxmLnNvY2tldC5lbWl0KFwiY2hhdFwiLCBjaGF0KTtcblx0fTtcblxuXG4gIC8vIFR5cGluZyBtZXRob2RzXG5cdHNlbGYuYWRkQ2hhdFR5cGluZyA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgbWVzc2FnZSA9IGRhdGEudXNlcm5hbWUgKyAnIGlzIHR5cGluZyc7XG4gICAgJCgnLnR5cGV0eXBldHlwZScpLnRleHQobWVzc2FnZSk7XG5cdH07XG5cblx0c2VsZi5yZW1vdmVDaGF0VHlwaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgJCgnLnR5cGV0eXBldHlwZScpLmVtcHR5KCk7XG5cdH07XG5cbiAgc2VsZi51cGRhdGVUeXBpbmcgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoc2VsZi5zb2NrZXQpIHtcbiAgICAgIGlmICghdHlwaW5nKSB7XG4gICAgICAgIHR5cGluZyA9IHRydWU7XG4gICAgICAgIHNlbGYuc29ja2V0LmVtaXQoJ3R5cGluZycpO1xuICAgICAgfVxuICAgICAgbGFzdFR5cGluZ1RpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHlwaW5nVGltZXIgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgICB2YXIgdGltZURpZmYgPSB0eXBpbmdUaW1lciAtIGxhc3RUeXBpbmdUaW1lO1xuICAgICAgICBpZiAodGltZURpZmYgPj0gVFlQSU5HX1RJTUVSX0xFTkdUSCAmJiB0eXBpbmcpIHtcbiAgICAgICAgICAgc2VsZi5zb2NrZXQuZW1pdCgnc3RvcCB0eXBpbmcnKTtcbiAgICAgICAgICAgdHlwaW5nID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0sIFRZUElOR19USU1FUl9MRU5HVEgpO1xuICAgIH1cbiAgfTtcblxuXG5cbiAgLy8gY2hhdHNlcnZlciBsaXN0ZW5lcnNcbiAgLy8gdGhlc2UgZ3V5cyBsaXN0ZW4gdG8gdGhlIGNoYXRzZXJ2ZXIvc29ja2V0IGFuZCBlbWl0IGRhdGEgdG8gbWFpbi5qcyxcbiAgLy8gc3BlY2lmaWNhbGx5IHRvIHRoZSBhcHBFdmVudEJ1cy5cblx0c2VsZi5zZXRSZXNwb25zZUxpc3RlbmVycyA9IGZ1bmN0aW9uKHNvY2tldCkge1xuXHRcdC8vIGNsaWVudCBsaXN0ZW5lcnMgdGhhdCBsaXN0ZW4gdG8gdGhlIGNoYXRzZXJ2ZXIgYW5kIGl0c2VsZi5cblx0XHQvLyBFYWNoIHNlcnZlciBldmVudCB0cmlnZ2VycyBhbiBhcHBFdmVudEJ1cyBldmVudCBwYWlyZWQgd2l0aCBcblx0XHQvLyByZWxldmFudCBkYXRhLlxuXG5cdFx0c29ja2V0Lm9uKCd3ZWxjb21lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgLy8gZW1pdHMgZXZlbnQgdG8gcmVjYWxpYnJhdGUgb25saW5lVXNlcnMgY29sbGVjdGlvblxuICAgICAgc29ja2V0LmVtaXQoXCJvbmxpbmVVc2Vyc1wiKTtcbiAgICAgIHNvY2tldC5lbWl0KFwicm9vbXNcIik7XG5cdFx0XHRjb25zb2xlLmxvZygnb25saW5lVXNlcnMxOiAnLCBkYXRhKTtcbiAgICAgIC8vIGRhdGEgaXMgdW5kZWZpbmVkIGF0IHRoaXMgcG9pbnQgYmVjYXVzZSBpdCdzIHRoZSBmaXJzdCB0b1xuICAgICAgLy8gZmlyZSBvZmYgYW4gZXZlbnQgY2hhaW4gdGhhdCB3aWxsIGFwcGVuZCB0aGUgbmV3IHVzZXIgdG8gXG4gICAgICAvLyB0aGUgb25saW5lVXNlciBjb2xsZWN0aW9uXG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcImxvZ2luRG9uZVwiLCBkYXRhKTtcbiAgICB9KTtcblxuXHRcdHNvY2tldC5vbignbG9naW5OYW1lRXhpc3RzJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgLy8gZGF0YSA9PT0gc3RyaW5nIG9mIHVzZWQgdXNlcm5hbWVcblx0XHRcdGNvbnNvbGUubG9nKCdsb2dpbk5hbWVFeGlzdHM6ICcsIGRhdGEpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJsb2dpbk5hbWVFeGlzdHNcIiwgZGF0YSk7XG5cdFx0fSk7XG5cdFx0c29ja2V0Lm9uKCdsb2dpbk5hbWVCYWQnLCBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHQvLyBkYXRhID09PSBzdHJpbmcgb2YgYmFkIHVzZXJuYW1lXG5cdFx0XHRjb25zb2xlLmxvZygnbG9naW5OYW1lQmFkOiAnLCBkYXRhKTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwibG9naW5OYW1lQmFkXCIsIGRhdGEpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gdGhpcyBpcyB0aGUgc2Vjb25kIGxpc3RlbmVyIHRvIG9ubGluZVVzZXJzXG5cdFx0Ly8gYnkgdGhlIHRpbWUgdGhpcyBpcyBjYWxsZWQsIHRoZSBuZXcgdXNlciBoYXMgYmVlbiBhZGRlZCB0b1xuXHRcdC8vIHRoZSB1c2VyIGNvbGxlY3Rpb24uXG5cdFx0c29ja2V0Lm9uKCdvbmxpbmVVc2VycycsIGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdC8vIHRoaXMgZGF0YSBpcyBhbiBhcnJheSB3aXRoIGFsbCB0aGUgb25saW5lIHVzZXIncyB1c2VybmFtZXMuXG5cdFx0XHRzZWxmLnZlbnQudHJpZ2dlcihcInVzZXJzSW5mb1wiLCBkYXRhKTtcblx0XHR9KTtcblxuXG5cbiAgICBzb2NrZXQub24oJ3Jvb21zJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgLy8gdGhpcyBkYXRhIGlzIGFuIGFycmF5IHdpdGggYWxsIHRoZSBvbmxpbmUgdXNlcidzIHVzZXJuYW1lcy5cbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwicm9vbUluZm9cIiwgZGF0YSk7XG4gICAgfSk7XG5cblxuXG5cdFx0c29ja2V0Lm9uKCd1c2VySm9pbmVkJywgZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0Ly8gZGF0YSA9PT0gdXNlcm5hbWUgb2YgdXNlciBqb2luZWRcblx0XHRcdGNvbnNvbGUubG9nKCd1c2VySm9pbmVkOiAnLCBkYXRhKTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwidXNlckpvaW5lZFwiLCBkYXRhKTtcblx0XHR9KTtcblx0XHRzb2NrZXQub24oJ3VzZXJMZWZ0JywgZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0Ly8gZGF0YSA9PT0gdXNlcm5hbWUgb2YgdXNlciByZW1vdmVkXG5cdFx0XHRjb25zb2xlLmxvZygndXNlckxlZnQ6ICcsIGRhdGEpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJ1c2VyTGVmdFwiLCBkYXRhKTtcblx0XHR9KTtcblx0XHRzb2NrZXQub24oJ2NoYXQnLCBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHQvLyBkYXRhID09PSBjaGF0IG1lc3NhZ2Ugb2JqZWN0XG5cdFx0XHRjb25zb2xlLmxvZygnY2hhdDogJywgZGF0YSk7XG5cdFx0XHRzZWxmLnZlbnQudHJpZ2dlcihcImNoYXRSZWNlaXZlZFwiLCBkYXRhKTtcblx0XHR9KTtcblxuXG4gICAgLy8gdGhlc2UgZ3V5cyBsaXN0ZW4gdG8gdGhlIHNlcnZlciwgXG4gICAgLy8gdGhlbiBjYWxsIGNoYXRjbGllbnQgbWV0aG9kcyBsaXN0ZWQgYWJvdmVcbiAgICBzb2NrZXQub24oJ3R5cGluZycsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHNlbGYuYWRkQ2hhdFR5cGluZyhkYXRhKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ3N0b3AgdHlwaW5nJywgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnJlbW92ZUNoYXRUeXBpbmcoKTtcbiAgICB9KTtcblxuXG5cblx0fTtcbn07IiwiXG5cbmFwcC5NYWluQ29udHJvbGxlciA9IGZ1bmN0aW9uKCkge1xuXG5cdHZhciBzZWxmID0gdGhpcztcblxuXG4gIC8vVGhlc2UgYWxsb3dzIHVzIHRvIGJpbmQgYW5kIHRyaWdnZXIgb24gdGhlIG9iamVjdCBmcm9tIGFueXdoZXJlIGluIHRoZSBhcHAuXG5cdHNlbGYuYXBwRXZlbnRCdXMgPSBfLmV4dGVuZCh7fSwgQmFja2JvbmUuRXZlbnRzKTtcblx0c2VsZi52aWV3RXZlbnRCdXMgPSBfLmV4dGVuZCh7fSwgQmFja2JvbmUuRXZlbnRzKTtcblxuXHRzZWxmLmluaXQgPSBmdW5jdGlvbigpIHtcblx0XHQvLyBjcmVhdGVzIENoYXRDbGllbnQgZnJvbSBzb2NrZXRjbGllbnQuanMsIHBhc3NlcyBpbiBcblx0XHQvLyBhcHBFdmVudEJ1cyBhcyB2ZW50LCBjb25uZWN0c1xuXHRcdHNlbGYuY2hhdENsaWVudCA9IG5ldyBDaGF0Q2xpZW50KHsgdmVudDogc2VsZi5hcHBFdmVudEJ1cyB9KTtcblx0XHRzZWxmLmNoYXRDbGllbnQuY29ubmVjdCgpO1xuXG4gICAgLy8gbG9naW5Nb2RlbFxuXHRcdHNlbGYubG9naW5Nb2RlbCA9IG5ldyBhcHAuTG9naW5Nb2RlbCgpO1xuXG4gICAgLy8gVGhlIENvbnRhaW5lck1vZGVsIGdldHMgcGFzc2VkIGEgdmlld1N0YXRlLCBMb2dpblZpZXcsIHdoaWNoXG4gICAgLy8gaXMgdGhlIGxvZ2luIHBhZ2UuIFRoYXQgTG9naW5WaWV3IGdldHMgcGFzc2VkIHRoZSB2aWV3RXZlbnRCdXNcbiAgICAvLyBhbmQgdGhlIExvZ2luTW9kZWwuXG5cdFx0c2VsZi5jb250YWluZXJNb2RlbCA9IG5ldyBhcHAuQ29udGFpbmVyTW9kZWwoeyB2aWV3U3RhdGU6IG5ldyBhcHAuTG9naW5WaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cywgbW9kZWw6IHNlbGYubG9naW5Nb2RlbH0pfSk7XG5cblx0XHQvLyBuZXh0LCBhIG5ldyBDb250YWluZXJWaWV3IGlzIGludGlhbGl6ZWQgd2l0aCB0aGUgbmV3bHkgY3JlYXRlZCBjb250YWluZXJNb2RlbFxuXHRcdC8vIHRoZSBsb2dpbiBwYWdlIGlzIHRoZW4gcmVuZGVyZWQuXG5cdFx0c2VsZi5jb250YWluZXJWaWV3ID0gbmV3IGFwcC5Db250YWluZXJWaWV3KHsgbW9kZWw6IHNlbGYuY29udGFpbmVyTW9kZWwgfSk7XG5cdFx0c2VsZi5jb250YWluZXJWaWV3LnJlbmRlcigpO1xuXHR9O1xuXG5cblxuICAvLy8vLy8vLy8vLy8gIEJ1c3NlcyAvLy8vLy8vLy8vLy9cbiAgICAvLyBUaGVzZSBCdXNzZXMgbGlzdGVuIHRvIHRoZSBzb2NrZXRjbGllbnRcbiAgIC8vICAgIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cbiAgLy8vLyB2aWV3RXZlbnRCdXMgTGlzdGVuZXJzIC8vLy8vXG4gIFxuXHRzZWxmLnZpZXdFdmVudEJ1cy5vbihcImxvZ2luXCIsIGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG4gICAgLy8gc29ja2V0aW8gbG9naW4sIHNlbmRzIG5hbWUgdG8gc29ja2V0Y2xpZW50LCBzb2NrZXRjbGllbnQgc2VuZHMgaXQgdG8gY2hhdHNlcnZlclxuICAgIHNlbGYuY2hhdENsaWVudC5sb2dpbih1c2VybmFtZSk7XG4gIH0pO1xuXHRzZWxmLnZpZXdFdmVudEJ1cy5vbihcImNoYXRcIiwgZnVuY3Rpb24oY2hhdCkge1xuICAgIC8vIHNvY2tldGlvIGNoYXQsIHNlbmRzIGNoYXQgdG8gc29ja2V0Y2xpZW50LCBzb2NrZXRjbGllbnQgdG8gY2hhdHNlcnZlclxuICAgIHNlbGYuY2hhdENsaWVudC5jaGF0KGNoYXQpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJ0eXBpbmdcIiwgZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LnVwZGF0ZVR5cGluZygpO1xuICB9KTtcblxuXG4gIC8vLy8gYXBwRXZlbnRCdXMgTGlzdGVuZXJzIC8vLy9cblxuICAvLyBhZnRlciB0aGUgJ3dlbGNvbWUnIGV2ZW50IHRyaWdnZXJzIG9uIHRoZSBzb2NrZWNsaWVudCwgdGhlIGxvZ2luRG9uZSBldmVudCB0cmlnZ2Vycy5cblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcImxvZ2luRG9uZVwiLCBmdW5jdGlvbigpIHtcblxuXHRcdC8vIG5ldyBtb2RlbCBhbmQgdmlldyBjcmVhdGVkIGZvciBjaGF0cm9vbVxuXHRcdHNlbGYuY2hhdHJvb21Nb2RlbCA9IG5ldyBhcHAuQ2hhdHJvb21Nb2RlbCgpO1xuXHRcdHNlbGYuY2hhdHJvb21WaWV3ICA9IG5ldyBhcHAuQ2hhdHJvb21WaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cywgbW9kZWw6IHNlbGYuY2hhdHJvb21Nb2RlbCB9KTtcblxuXHRcdC8vIHZpZXdzdGF0ZSBpcyBjaGFuZ2VkIHRvIGNoYXRyb29tIGFmdGVyIGxvZ2luLlxuXHRcdHNlbGYuY29udGFpbmVyTW9kZWwuc2V0KFwidmlld1N0YXRlXCIsIHNlbGYuY2hhdHJvb21WaWV3KTtcbiAgICBhdXRvc2l6ZSgkKCd0ZXh0YXJlYS5tZXNzYWdlLWlucHV0JykpO1xuXHRcdCQoJy5jaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuXHR9KTtcblxuICAvLyBlcnJvciBsaXN0ZW5lcnNcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcImxvZ2luTmFtZUJhZFwiLCBmdW5jdGlvbih1c2VybmFtZSkge1xuXHRcdHNlbGYubG9naW5Nb2RlbC5zZXQoXCJlcnJvclwiLCBcIkludmFsaWQgTmFtZVwiKTtcblx0fSk7XG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJsb2dpbk5hbWVFeGlzdHNcIiwgZnVuY3Rpb24odXNlcm5hbWUpIHtcblx0XHRzZWxmLmxvZ2luTW9kZWwuc2V0KFwiZXJyb3JcIiwgXCJOYW1lIGFscmVhZHkgZXhpc3RzXCIpO1xuXHR9KTtcblxuXG4gIC8vIGFmdGVyICdvbmxpbmVVc2VycycgZXZlbnQgZW1pdHMsIHRoZSAndXNlcnNJbmZvJyBldmVudCB0cmlnZ2Vyc1xuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwidXNlcnNJbmZvXCIsIGZ1bmN0aW9uKGRhdGEpIHtcblxuICAgIC8vZGF0YSBpcyBhbiBhcnJheSBvZiB1c2VybmFtZXMsIGluY2x1ZGluZyB0aGUgbmV3IHVzZXJcblxuXHRcdC8vIFRoaXMgbWV0aG9kIGdldHMgdGhlIG9ubGluZSB1c2VycyBjb2xsZWN0aW9uIGZyb20gY2hhdHJvb21Nb2RlbC5cblx0XHQvLyBvbmxpbmVVc2VycyBpcyB0aGUgY29sbGVjdGlvblxuXHRcdHZhciBvbmxpbmVVc2VycyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoXCJvbmxpbmVVc2Vyc1wiKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhcIm9ubGluZVVzZXJzOiAtLS1cIiwgb25saW5lVXNlcnMpO1xuXG4gICAvLyB1c2VycyBpcyBhcnJheSBvZiB0aGUgY3VycmVudCB1c2VyIG1vZGVsc1xuXHRcdHZhciB1c2VycyA9IF8ubWFwKGRhdGEsIGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdHJldHVybiBuZXcgYXBwLlVzZXJNb2RlbCh7dXNlcm5hbWU6IGl0ZW19KTtcblx0XHR9KTtcblxuICAgICAgICBjb25zb2xlLmxvZyhcInVzZXJzOiAtLS1cIiwgdXNlcnMpO1xuXG4gICAgLy8gdGhpcyByZXNldHMgdGhlIGNvbGxlY3Rpb24gd2l0aCB0aGUgdXBkYXRlZCBhcnJheSBvZiB1c2Vyc1xuXHRcdG9ubGluZVVzZXJzLnJlc2V0KHVzZXJzKTtcblx0fSk7XG5cblxuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInJvb21JbmZvXCIsIGZ1bmN0aW9uKGRhdGEpIHtcblxuICAgIC8vIFRoaXMgbWV0aG9kIGdldHMgdGhlIG9ubGluZSB1c2VycyBjb2xsZWN0aW9uIGZyb20gY2hhdHJvb21Nb2RlbC5cbiAgICAvLyBvbmxpbmVVc2VycyBpcyB0aGUgY29sbGVjdGlvblxuICAgIHZhciByb29tcyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoXCJyb29tc1wiKTtcbiAgICBjb25zb2xlLmxvZyhcInJvb21zOiAtLS1cIiwgcm9vbXMpO1xuICAgLy8gdXNlcnMgaXMgYXJyYXkgb2YgdGhlIGN1cnJlbnQgdXNlciBtb2RlbHNcbiAgICB2YXIgdXBkYXRlZFJvb21zID0gXy5tYXAoZGF0YSwgZnVuY3Rpb24obmFtZSkge1xuICAgICAgcmV0dXJuIG5ldyBhcHAuQ2hhdHJvb21Nb2RlbCh7bmFtZTogbmFtZX0pO1xuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKFwidXBkYXRlZHJvb21zOiAtLS1cIiwgdXBkYXRlZFJvb21zKTtcblxuICAgIC8vIHRoaXMgcmVzZXRzIHRoZSBjb2xsZWN0aW9uIHdpdGggdGhlIHVwZGF0ZWQgYXJyYXkgb2YgdXNlcnNcbiAgICByb29tcy5yZXNldCh1cGRhdGVkUm9vbXMpO1xuICB9KTtcblxuXG5cblxuXG4gIC8vIGFkZHMgbmV3IHVzZXIgdG8gdXNlcnMgY29sbGVjdGlvbiwgc2VuZHMgZGVmYXVsdCBqb2luaW5nIG1lc3NhZ2Vcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcInVzZXJKb2luZWRcIiwgZnVuY3Rpb24odXNlcm5hbWUpIHtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkVXNlcih1c2VybmFtZSk7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLmFkZENoYXQoe3NlbmRlcjogXCJCdXR0ZXJzXCIsIG1lc3NhZ2U6IHVzZXJuYW1lICsgXCIgam9pbmVkIHJvb20uXCIgfSk7XG5cdH0pO1xuXG5cdC8vIHJlbW92ZXMgdXNlciBmcm9tIHVzZXJzIGNvbGxlY3Rpb24sIHNlbmRzIGRlZmF1bHQgbGVhdmluZyBtZXNzYWdlXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2VyTGVmdFwiLCBmdW5jdGlvbih1c2VybmFtZSkge1xuXHRcdHNlbGYuY2hhdHJvb21Nb2RlbC5yZW1vdmVVc2VyKHVzZXJuYW1lKTtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkQ2hhdCh7c2VuZGVyOiBcIkJ1dHRlcnNcIiwgbWVzc2FnZTogdXNlcm5hbWUgKyBcIiBsZWZ0IHJvb20uXCIgfSk7XG5cdH0pO1xuXG5cdC8vIGNoYXQgcGFzc2VkIGZyb20gc29ja2V0Y2xpZW50LCBhZGRzIGEgbmV3IGNoYXQgbWVzc2FnZSB1c2luZyBjaGF0cm9vbU1vZGVsIG1ldGhvZFxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwiY2hhdFJlY2VpdmVkXCIsIGZ1bmN0aW9uKGNoYXQpIHtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkQ2hhdChjaGF0KTtcblx0XHQkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnLmNoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcblx0fSk7XG59O1xuXG4iLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIHZhciBDaGF0cm9vbVJvdXRlciA9IEJhY2tib25lLlJvdXRlci5leHRlbmQoe1xuICAgIFxuICAgIHJvdXRlczoge1xuICAgICAgJyc6ICdzdGFydCcsXG4gICAgfSxcblxuICAgIHN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlciA9IG5ldyBhcHAuTWFpbkNvbnRyb2xsZXIoKTtcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlci5pbml0KCk7XG4gICAgfSxcblxuICB9KTtcblxuICBhcHAuQ2hhdHJvb21Sb3V0ZXIgPSBuZXcgQ2hhdHJvb21Sb3V0ZXIoKTtcbiAgQmFja2JvbmUuaGlzdG9yeS5zdGFydCgpO1xuXG59KSgpOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==