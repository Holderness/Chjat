
var app = app || {};

(function () {

  app.ChatModel = Backbone.Model.extend({});

})();

app.ContainerModel = Backbone.Model.extend({});
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
// var Conversation = Backbone.Collection.extend({
// 	model: Message,
// });
// var Inbox = Backbone.Collection.extend({
// 	model: Conversation,
// });

var app = app || {};

(function () {

  app.UserCollection = Backbone.Collection.extend({model: app.UserModel});

})();



// var User = Backbone.Model.extend({
// 	defaults: {
// 		username: '',
// 		avatar: '',
// 		inbox: [],
// 	},
// });

// var Conversation = Backbone.Model.extend({
// 	defaults: {
// 		users: [],
// 		messages: [],
// 	},
// });
app.ChatroomModel = Backbone.Model.extend({
  defaults: {
    onlineUsers: new app.UserCollection(),
    userChats: new app.ChatCollection([
      // message and sender upon entering chatroom
      new app.ChatModel({ sender: 'Butters', message: 'awwwwww hamburgers. ||):||', timestamp: _.now() })
      ])
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

    //sets event listeners on the collections
		this.listenTo(onlineUsers, "add", this.renderUser, this);
		this.listenTo(onlineUsers, "remove", this.renderUsers, this);
		this.listenTo(onlineUsers, "reset", this.renderUsers, this);

		this.listenTo(userChats, "add", this.renderChat, this);
		this.listenTo(userChats, "remove", this.renderChats, this);
		this.listenTo(userChats, "reset", this.renderChats, this);
	},
	render: function() {
		var onlineUsers = this.model.get("onlineUsers");
		this.$el.html(this.template());
		this.renderUsers();
		this.renderChats();
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

$(document).ready(function() {

});


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

   // users is array of the current user models
		var users = _.map(data, function(item) {
			return new app.UserModel({username: item});
		});

    // this resets the collection with the updated array of users
		onlineUsers.reset(users);
	});

  // adds new user to users collection, sends default joining message
	self.appEventBus.on("userJoined", function(username) {
		self.chatroomModel.addUser(username);
		self.chatroomModel.addChat({sender: "Mayor McCheese", message: username + " joined room." });
	});

	// removes user from users collection, sends default leaving message
	self.appEventBus.on("userLeft", function(username) {
		self.chatroomModel.removeUser(username);
		self.chatroomModel.addChat({sender: "Grimace", message: username + " left room." });
	});

	// chat passed from socketclient, adds a new chat message using chatroomModel method
	self.appEventBus.on("chatReceived", function(chat) {
		self.chatroomModel.addChat(chat);
		$('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
	});
};






// var thomJones =
// 		{
// 			name: 'Thom Jones',
// 			avatar: 'assets/img/thom-jones.jpg',
// 			id: 1
// 		};
// var tomJones = 
// 		{
// 			name: 'Tom Jones',
// 			avatar: 'assets/img/tom-jones.jpg',
// 			id: 2
// 		};
// var ev = 
// 		{
// 			name: 'Evan Turner',
// 			avatar: 'http://evturn.com/assets/img/ev-winter-yellow.jpg',
// 			id: 3
// 		};

// var convo1 = new Conversation({				
// 					users: [tomJones, thomJones],
// 					messages:	[
// 							{
// 								timestamp: new Date(),
// 								content: 'Craig, it\'s important. I just spilled salsa all over my filas.',
// 								sender: tomJones
// 							},
// 							{
// 								timestamp: new Date(),
// 								content: 'I\m not Craig!',
// 								sender: thomJones
// 							},
// 							{
// 								timestamp: new Date(),
// 								content: 'Fuck the hell off!',
// 								sender: thomJones
// 							}
// 						]
// 					});
// var convo2 = new Conversation({
// 				users: [tomJones, thomJones],			
// 				messages:	[
// 						{
// 							timestamp: new Date(),
// 							content: 'Craig, it\'s important. I just spilled salsa all over my filas.',
// 							sender: tomJones
// 						},
// 						{
// 							timestamp: new Date(),
// 							content: 'I\m not Craig!',
// 							sender: thomJones
// 						},
// 						{
// 							timestamp: new Date(),
// 							content: 'Just ate a bisquit',
// 							sender: tomJones
// 						}
// 					]
// 				});
// var convo3 = new Conversation({
// 				users: [ev, thomJones],
// 				messages:	[
// 						{
// 							timestamp: new Date(),
// 							content: 'Craig, it\'s important. I just spilled salsa all over my filas.',
// 							sender: tomJones
// 						},
// 						{
// 							timestamp: new Date(),
// 							content: 'I\m not Craig!',
// 							sender: thomJones
// 						},
// 						{
// 							timestamp: new Date(),
// 							content: 'Please leave my wife in this',
// 							sender: ev
// 						}
// 					]});

// var u2 = new User(thomJones);

// var u1 = new User({
// 			name: 'Tom Jones',
// 			avatar: 'http://a5.files.biography.com/image/upload/c_fill,cs_srgb,dpr_1.0,g_face,h_300,q_80,w_300/MTE1ODA0OTcyMDA1Njg4ODQ1.jpg',
// 			inbox: 
// 				[
// 					convo1,
// 					convo2,
// 					convo3
// 				],	
// 			id: 1
// 		});


// new WOW(
//     { offset: 120 }
// ).init();


// new Chatbox();

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYXQuanMiLCJjb250YWluZXIuanMiLCJsb2dpbi5qcyIsInVzZXIuanMiLCJjb252ZXJzYXRpb24uanMiLCJpbmJveC5qcyIsImNoYXQtbW9kZWxzLmpzIiwiY2hhdHJvb20uanMiLCJtYWluLmpzIiwic29ja2V0Y2xpZW50LmpzIiwicm91dGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBSFBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUlQQTtBQUNBO0FBQ0E7QUNGQTtBQUNBO0FBQ0E7QUZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FHUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FEL0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUUvTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLkNoYXRDb2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe21vZGVsOiBhcHAuQ2hhdE1vZGVsfSk7XG5cbn0pKCk7IiwiXG5hcHAuQ29udGFpbmVyTW9kZWwgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoe30pOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLkxvZ2luTW9kZWwgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoe1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICBlcnJvcjogXCJcIlxuICAgIH1cbiAgfSk7XG5cblxufSkoKTsiLCJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLlVzZXJDb2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe21vZGVsOiBhcHAuVXNlck1vZGVsfSk7XG5cbn0pKCk7IiwiLy8gdmFyIENvbnZlcnNhdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcbi8vIFx0bW9kZWw6IE1lc3NhZ2UsXG4vLyB9KTsiLCIvLyB2YXIgSW5ib3ggPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG4vLyBcdG1vZGVsOiBDb252ZXJzYXRpb24sXG4vLyB9KTsiLCJcblxuXG4vLyB2YXIgVXNlciA9IEJhY2tib25lLk1vZGVsLmV4dGVuZCh7XG4vLyBcdGRlZmF1bHRzOiB7XG4vLyBcdFx0dXNlcm5hbWU6ICcnLFxuLy8gXHRcdGF2YXRhcjogJycsXG4vLyBcdFx0aW5ib3g6IFtdLFxuLy8gXHR9LFxuLy8gfSk7XG5cbi8vIHZhciBDb252ZXJzYXRpb24gPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoe1xuLy8gXHRkZWZhdWx0czoge1xuLy8gXHRcdHVzZXJzOiBbXSxcbi8vIFx0XHRtZXNzYWdlczogW10sXG4vLyBcdH0sXG4vLyB9KTsiLCJhcHAuQ2hhdHJvb21Nb2RlbCA9IEJhY2tib25lLk1vZGVsLmV4dGVuZCh7XG4gIGRlZmF1bHRzOiB7XG4gICAgb25saW5lVXNlcnM6IG5ldyBhcHAuVXNlckNvbGxlY3Rpb24oKSxcbiAgICB1c2VyQ2hhdHM6IG5ldyBhcHAuQ2hhdENvbGxlY3Rpb24oW1xuICAgICAgLy8gbWVzc2FnZSBhbmQgc2VuZGVyIHVwb24gZW50ZXJpbmcgY2hhdHJvb21cbiAgICAgIG5ldyBhcHAuQ2hhdE1vZGVsKHsgc2VuZGVyOiAnQnV0dGVycycsIG1lc3NhZ2U6ICdhd3d3d3d3IGhhbWJ1cmdlcnMuIHx8KTp8fCcsIHRpbWVzdGFtcDogXy5ub3coKSB9KVxuICAgICAgXSlcbiAgfSxcbiAgYWRkVXNlcjogZnVuY3Rpb24odXNlcm5hbWUpIHtcbiAgICB0aGlzLmdldCgnb25saW5lVXNlcnMnKS5hZGQobmV3IGFwcC5Vc2VyTW9kZWwoeyB1c2VybmFtZTogdXNlcm5hbWUgfSkpO1xuICAgIGNvbnNvbGUubG9nKFwiLS1hZGRpbmctdXNlci0tLVwiKTtcbiAgfSxcbiAgcmVtb3ZlVXNlcjogZnVuY3Rpb24odXNlcm5hbWUpIHtcbiAgICB2YXIgb25saW5lVXNlcnMgPSB0aGlzLmdldCgnb25saW5lVXNlcnMnKTtcbiAgICB2YXIgdXNlciA9IG9ubGluZVVzZXJzLmZpbmQoZnVuY3Rpb24odXNlck1vZGVsKSB7IHJldHVybiB1c2VyTW9kZWwuZ2V0KCd1c2VybmFtZScpID09IHVzZXJuYW1lOyB9KTtcbiAgICBpZiAodXNlcikge1xuICAgICAgb25saW5lVXNlcnMucmVtb3ZlKHVzZXIpO1xuICAgIH1cbiAgfSxcbiAgYWRkQ2hhdDogZnVuY3Rpb24oY2hhdCkge1xuICAgIHZhciBub3cgPSBfLm5vdygpO1xuICAgIHRoaXMuZ2V0KCd1c2VyQ2hhdHMnKS5hZGQobmV3IGFwcC5DaGF0TW9kZWwoeyBzZW5kZXI6IGNoYXQuc2VuZGVyLCBtZXNzYWdlOiBjaGF0Lm1lc3NhZ2UsIHRpbWVzdGFtcDogbm93fSkpO1xuICB9LFxufSk7IiwiXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcblxufSk7XG5cblxuYXBwLk1haW5Db250cm9sbGVyID0gZnVuY3Rpb24oKSB7XG5cblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cbiAgLy9UaGVzZSBhbGxvd3MgdXMgdG8gYmluZCBhbmQgdHJpZ2dlciBvbiB0aGUgb2JqZWN0IGZyb20gYW55d2hlcmUgaW4gdGhlIGFwcC5cblx0c2VsZi5hcHBFdmVudEJ1cyA9IF8uZXh0ZW5kKHt9LCBCYWNrYm9uZS5FdmVudHMpO1xuXHRzZWxmLnZpZXdFdmVudEJ1cyA9IF8uZXh0ZW5kKHt9LCBCYWNrYm9uZS5FdmVudHMpO1xuXG5cdHNlbGYuaW5pdCA9IGZ1bmN0aW9uKCkge1xuXHRcdC8vIGNyZWF0ZXMgQ2hhdENsaWVudCBmcm9tIHNvY2tldGNsaWVudC5qcywgcGFzc2VzIGluIFxuXHRcdC8vIGFwcEV2ZW50QnVzIGFzIHZlbnQsIGNvbm5lY3RzXG5cdFx0c2VsZi5jaGF0Q2xpZW50ID0gbmV3IENoYXRDbGllbnQoeyB2ZW50OiBzZWxmLmFwcEV2ZW50QnVzIH0pO1xuXHRcdHNlbGYuY2hhdENsaWVudC5jb25uZWN0KCk7XG5cbiAgICAvLyBsb2dpbk1vZGVsXG5cdFx0c2VsZi5sb2dpbk1vZGVsID0gbmV3IGFwcC5Mb2dpbk1vZGVsKCk7XG5cbiAgICAvLyBUaGUgQ29udGFpbmVyTW9kZWwgZ2V0cyBwYXNzZWQgYSB2aWV3U3RhdGUsIExvZ2luVmlldywgd2hpY2hcbiAgICAvLyBpcyB0aGUgbG9naW4gcGFnZS4gVGhhdCBMb2dpblZpZXcgZ2V0cyBwYXNzZWQgdGhlIHZpZXdFdmVudEJ1c1xuICAgIC8vIGFuZCB0aGUgTG9naW5Nb2RlbC5cblx0XHRzZWxmLmNvbnRhaW5lck1vZGVsID0gbmV3IGFwcC5Db250YWluZXJNb2RlbCh7IHZpZXdTdGF0ZTogbmV3IGFwcC5Mb2dpblZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzLCBtb2RlbDogc2VsZi5sb2dpbk1vZGVsfSl9KTtcblxuXHRcdC8vIG5leHQsIGEgbmV3IENvbnRhaW5lclZpZXcgaXMgaW50aWFsaXplZCB3aXRoIHRoZSBuZXdseSBjcmVhdGVkIGNvbnRhaW5lck1vZGVsXG5cdFx0Ly8gdGhlIGxvZ2luIHBhZ2UgaXMgdGhlbiByZW5kZXJlZC5cblx0XHRzZWxmLmNvbnRhaW5lclZpZXcgPSBuZXcgYXBwLkNvbnRhaW5lclZpZXcoeyBtb2RlbDogc2VsZi5jb250YWluZXJNb2RlbCB9KTtcblx0XHRzZWxmLmNvbnRhaW5lclZpZXcucmVuZGVyKCk7XG5cdH07XG5cblxuXG4gIC8vLy8vLy8vLy8vLyAgQnVzc2VzIC8vLy8vLy8vLy8vL1xuICAgIC8vIFRoZXNlIEJ1c3NlcyBsaXN0ZW4gdG8gdGhlIHNvY2tldGNsaWVudFxuICAgLy8gICAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblxuICAvLy8vIHZpZXdFdmVudEJ1cyBMaXN0ZW5lcnMgLy8vLy9cbiAgXG5cdHNlbGYudmlld0V2ZW50QnVzLm9uKFwibG9naW5cIiwgZnVuY3Rpb24odXNlcm5hbWUpIHtcbiAgICAvLyBzb2NrZXRpbyBsb2dpbiwgc2VuZHMgbmFtZSB0byBzb2NrZXRjbGllbnQsIHNvY2tldGNsaWVudCBzZW5kcyBpdCB0byBjaGF0c2VydmVyXG4gICAgc2VsZi5jaGF0Q2xpZW50LmxvZ2luKHVzZXJuYW1lKTtcbiAgfSk7XG5cdHNlbGYudmlld0V2ZW50QnVzLm9uKFwiY2hhdFwiLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgLy8gc29ja2V0aW8gY2hhdCwgc2VuZHMgY2hhdCB0byBzb2NrZXRjbGllbnQsIHNvY2tldGNsaWVudCB0byBjaGF0c2VydmVyXG4gICAgc2VsZi5jaGF0Q2xpZW50LmNoYXQoY2hhdCk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcInR5cGluZ1wiLCBmdW5jdGlvbigpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQudXBkYXRlVHlwaW5nKCk7XG4gIH0pO1xuXG5cbiAgLy8vLyBhcHBFdmVudEJ1cyBMaXN0ZW5lcnMgLy8vL1xuXG4gIC8vIGFmdGVyIHRoZSAnd2VsY29tZScgZXZlbnQgdHJpZ2dlcnMgb24gdGhlIHNvY2tlY2xpZW50LCB0aGUgbG9naW5Eb25lIGV2ZW50IHRyaWdnZXJzLlxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwibG9naW5Eb25lXCIsIGZ1bmN0aW9uKCkge1xuXG5cdFx0Ly8gbmV3IG1vZGVsIGFuZCB2aWV3IGNyZWF0ZWQgZm9yIGNoYXRyb29tXG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsID0gbmV3IGFwcC5DaGF0cm9vbU1vZGVsKCk7XG5cdFx0c2VsZi5jaGF0cm9vbVZpZXcgID0gbmV3IGFwcC5DaGF0cm9vbVZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzLCBtb2RlbDogc2VsZi5jaGF0cm9vbU1vZGVsIH0pO1xuXG5cdFx0Ly8gdmlld3N0YXRlIGlzIGNoYW5nZWQgdG8gY2hhdHJvb20gYWZ0ZXIgbG9naW4uXG5cdFx0c2VsZi5jb250YWluZXJNb2RlbC5zZXQoXCJ2aWV3U3RhdGVcIiwgc2VsZi5jaGF0cm9vbVZpZXcpO1xuICAgIGF1dG9zaXplKCQoJ3RleHRhcmVhLm1lc3NhZ2UtaW5wdXQnKSk7XG5cdFx0JCgnLmNoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJy5jaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG5cdH0pO1xuXG4gIC8vIGVycm9yIGxpc3RlbmVyc1xuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwibG9naW5OYW1lQmFkXCIsIGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG5cdFx0c2VsZi5sb2dpbk1vZGVsLnNldChcImVycm9yXCIsIFwiSW52YWxpZCBOYW1lXCIpO1xuXHR9KTtcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcImxvZ2luTmFtZUV4aXN0c1wiLCBmdW5jdGlvbih1c2VybmFtZSkge1xuXHRcdHNlbGYubG9naW5Nb2RlbC5zZXQoXCJlcnJvclwiLCBcIk5hbWUgYWxyZWFkeSBleGlzdHNcIik7XG5cdH0pO1xuXG5cbiAgLy8gYWZ0ZXIgJ29ubGluZVVzZXJzJyBldmVudCBlbWl0cywgdGhlICd1c2Vyc0luZm8nIGV2ZW50IHRyaWdnZXJzXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2Vyc0luZm9cIiwgZnVuY3Rpb24oZGF0YSkge1xuXG4gICAgLy9kYXRhIGlzIGFuIGFycmF5IG9mIHVzZXJuYW1lcywgaW5jbHVkaW5nIHRoZSBuZXcgdXNlclxuXG5cdFx0Ly8gVGhpcyBtZXRob2QgZ2V0cyB0aGUgb25saW5lIHVzZXJzIGNvbGxlY3Rpb24gZnJvbSBjaGF0cm9vbU1vZGVsLlxuXHRcdC8vIG9ubGluZVVzZXJzIGlzIHRoZSBjb2xsZWN0aW9uXG5cdFx0dmFyIG9ubGluZVVzZXJzID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpO1xuXG4gICAvLyB1c2VycyBpcyBhcnJheSBvZiB0aGUgY3VycmVudCB1c2VyIG1vZGVsc1xuXHRcdHZhciB1c2VycyA9IF8ubWFwKGRhdGEsIGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdHJldHVybiBuZXcgYXBwLlVzZXJNb2RlbCh7dXNlcm5hbWU6IGl0ZW19KTtcblx0XHR9KTtcblxuICAgIC8vIHRoaXMgcmVzZXRzIHRoZSBjb2xsZWN0aW9uIHdpdGggdGhlIHVwZGF0ZWQgYXJyYXkgb2YgdXNlcnNcblx0XHRvbmxpbmVVc2Vycy5yZXNldCh1c2Vycyk7XG5cdH0pO1xuXG4gIC8vIGFkZHMgbmV3IHVzZXIgdG8gdXNlcnMgY29sbGVjdGlvbiwgc2VuZHMgZGVmYXVsdCBqb2luaW5nIG1lc3NhZ2Vcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcInVzZXJKb2luZWRcIiwgZnVuY3Rpb24odXNlcm5hbWUpIHtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkVXNlcih1c2VybmFtZSk7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLmFkZENoYXQoe3NlbmRlcjogXCJNYXlvciBNY0NoZWVzZVwiLCBtZXNzYWdlOiB1c2VybmFtZSArIFwiIGpvaW5lZCByb29tLlwiIH0pO1xuXHR9KTtcblxuXHQvLyByZW1vdmVzIHVzZXIgZnJvbSB1c2VycyBjb2xsZWN0aW9uLCBzZW5kcyBkZWZhdWx0IGxlYXZpbmcgbWVzc2FnZVxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwidXNlckxlZnRcIiwgZnVuY3Rpb24odXNlcm5hbWUpIHtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwucmVtb3ZlVXNlcih1c2VybmFtZSk7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLmFkZENoYXQoe3NlbmRlcjogXCJHcmltYWNlXCIsIG1lc3NhZ2U6IHVzZXJuYW1lICsgXCIgbGVmdCByb29tLlwiIH0pO1xuXHR9KTtcblxuXHQvLyBjaGF0IHBhc3NlZCBmcm9tIHNvY2tldGNsaWVudCwgYWRkcyBhIG5ldyBjaGF0IG1lc3NhZ2UgdXNpbmcgY2hhdHJvb21Nb2RlbCBtZXRob2Rcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcImNoYXRSZWNlaXZlZFwiLCBmdW5jdGlvbihjaGF0KSB7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLmFkZENoYXQoY2hhdCk7XG5cdFx0JCgnLmNoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJy5jaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG5cdH0pO1xufTtcblxuXG5cblxuXG5cbi8vIHZhciB0aG9tSm9uZXMgPVxuLy8gXHRcdHtcbi8vIFx0XHRcdG5hbWU6ICdUaG9tIEpvbmVzJyxcbi8vIFx0XHRcdGF2YXRhcjogJ2Fzc2V0cy9pbWcvdGhvbS1qb25lcy5qcGcnLFxuLy8gXHRcdFx0aWQ6IDFcbi8vIFx0XHR9O1xuLy8gdmFyIHRvbUpvbmVzID0gXG4vLyBcdFx0e1xuLy8gXHRcdFx0bmFtZTogJ1RvbSBKb25lcycsXG4vLyBcdFx0XHRhdmF0YXI6ICdhc3NldHMvaW1nL3RvbS1qb25lcy5qcGcnLFxuLy8gXHRcdFx0aWQ6IDJcbi8vIFx0XHR9O1xuLy8gdmFyIGV2ID0gXG4vLyBcdFx0e1xuLy8gXHRcdFx0bmFtZTogJ0V2YW4gVHVybmVyJyxcbi8vIFx0XHRcdGF2YXRhcjogJ2h0dHA6Ly9ldnR1cm4uY29tL2Fzc2V0cy9pbWcvZXYtd2ludGVyLXllbGxvdy5qcGcnLFxuLy8gXHRcdFx0aWQ6IDNcbi8vIFx0XHR9O1xuXG4vLyB2YXIgY29udm8xID0gbmV3IENvbnZlcnNhdGlvbih7XHRcdFx0XHRcbi8vIFx0XHRcdFx0XHR1c2VyczogW3RvbUpvbmVzLCB0aG9tSm9uZXNdLFxuLy8gXHRcdFx0XHRcdG1lc3NhZ2VzOlx0W1xuLy8gXHRcdFx0XHRcdFx0XHR7XG4vLyBcdFx0XHRcdFx0XHRcdFx0dGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuLy8gXHRcdFx0XHRcdFx0XHRcdGNvbnRlbnQ6ICdDcmFpZywgaXRcXCdzIGltcG9ydGFudC4gSSBqdXN0IHNwaWxsZWQgc2Fsc2EgYWxsIG92ZXIgbXkgZmlsYXMuJyxcbi8vIFx0XHRcdFx0XHRcdFx0XHRzZW5kZXI6IHRvbUpvbmVzXG4vLyBcdFx0XHRcdFx0XHRcdH0sXG4vLyBcdFx0XHRcdFx0XHRcdHtcbi8vIFx0XHRcdFx0XHRcdFx0XHR0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4vLyBcdFx0XHRcdFx0XHRcdFx0Y29udGVudDogJ0lcXG0gbm90IENyYWlnIScsXG4vLyBcdFx0XHRcdFx0XHRcdFx0c2VuZGVyOiB0aG9tSm9uZXNcbi8vIFx0XHRcdFx0XHRcdFx0fSxcbi8vIFx0XHRcdFx0XHRcdFx0e1xuLy8gXHRcdFx0XHRcdFx0XHRcdHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbi8vIFx0XHRcdFx0XHRcdFx0XHRjb250ZW50OiAnRnVjayB0aGUgaGVsbCBvZmYhJyxcbi8vIFx0XHRcdFx0XHRcdFx0XHRzZW5kZXI6IHRob21Kb25lc1xuLy8gXHRcdFx0XHRcdFx0XHR9XG4vLyBcdFx0XHRcdFx0XHRdXG4vLyBcdFx0XHRcdFx0fSk7XG4vLyB2YXIgY29udm8yID0gbmV3IENvbnZlcnNhdGlvbih7XG4vLyBcdFx0XHRcdHVzZXJzOiBbdG9tSm9uZXMsIHRob21Kb25lc10sXHRcdFx0XG4vLyBcdFx0XHRcdG1lc3NhZ2VzOlx0W1xuLy8gXHRcdFx0XHRcdFx0e1xuLy8gXHRcdFx0XHRcdFx0XHR0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4vLyBcdFx0XHRcdFx0XHRcdGNvbnRlbnQ6ICdDcmFpZywgaXRcXCdzIGltcG9ydGFudC4gSSBqdXN0IHNwaWxsZWQgc2Fsc2EgYWxsIG92ZXIgbXkgZmlsYXMuJyxcbi8vIFx0XHRcdFx0XHRcdFx0c2VuZGVyOiB0b21Kb25lc1xuLy8gXHRcdFx0XHRcdFx0fSxcbi8vIFx0XHRcdFx0XHRcdHtcbi8vIFx0XHRcdFx0XHRcdFx0dGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuLy8gXHRcdFx0XHRcdFx0XHRjb250ZW50OiAnSVxcbSBub3QgQ3JhaWchJyxcbi8vIFx0XHRcdFx0XHRcdFx0c2VuZGVyOiB0aG9tSm9uZXNcbi8vIFx0XHRcdFx0XHRcdH0sXG4vLyBcdFx0XHRcdFx0XHR7XG4vLyBcdFx0XHRcdFx0XHRcdHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbi8vIFx0XHRcdFx0XHRcdFx0Y29udGVudDogJ0p1c3QgYXRlIGEgYmlzcXVpdCcsXG4vLyBcdFx0XHRcdFx0XHRcdHNlbmRlcjogdG9tSm9uZXNcbi8vIFx0XHRcdFx0XHRcdH1cbi8vIFx0XHRcdFx0XHRdXG4vLyBcdFx0XHRcdH0pO1xuLy8gdmFyIGNvbnZvMyA9IG5ldyBDb252ZXJzYXRpb24oe1xuLy8gXHRcdFx0XHR1c2VyczogW2V2LCB0aG9tSm9uZXNdLFxuLy8gXHRcdFx0XHRtZXNzYWdlczpcdFtcbi8vIFx0XHRcdFx0XHRcdHtcbi8vIFx0XHRcdFx0XHRcdFx0dGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuLy8gXHRcdFx0XHRcdFx0XHRjb250ZW50OiAnQ3JhaWcsIGl0XFwncyBpbXBvcnRhbnQuIEkganVzdCBzcGlsbGVkIHNhbHNhIGFsbCBvdmVyIG15IGZpbGFzLicsXG4vLyBcdFx0XHRcdFx0XHRcdHNlbmRlcjogdG9tSm9uZXNcbi8vIFx0XHRcdFx0XHRcdH0sXG4vLyBcdFx0XHRcdFx0XHR7XG4vLyBcdFx0XHRcdFx0XHRcdHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbi8vIFx0XHRcdFx0XHRcdFx0Y29udGVudDogJ0lcXG0gbm90IENyYWlnIScsXG4vLyBcdFx0XHRcdFx0XHRcdHNlbmRlcjogdGhvbUpvbmVzXG4vLyBcdFx0XHRcdFx0XHR9LFxuLy8gXHRcdFx0XHRcdFx0e1xuLy8gXHRcdFx0XHRcdFx0XHR0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4vLyBcdFx0XHRcdFx0XHRcdGNvbnRlbnQ6ICdQbGVhc2UgbGVhdmUgbXkgd2lmZSBpbiB0aGlzJyxcbi8vIFx0XHRcdFx0XHRcdFx0c2VuZGVyOiBldlxuLy8gXHRcdFx0XHRcdFx0fVxuLy8gXHRcdFx0XHRcdF19KTtcblxuLy8gdmFyIHUyID0gbmV3IFVzZXIodGhvbUpvbmVzKTtcblxuLy8gdmFyIHUxID0gbmV3IFVzZXIoe1xuLy8gXHRcdFx0bmFtZTogJ1RvbSBKb25lcycsXG4vLyBcdFx0XHRhdmF0YXI6ICdodHRwOi8vYTUuZmlsZXMuYmlvZ3JhcGh5LmNvbS9pbWFnZS91cGxvYWQvY19maWxsLGNzX3NyZ2IsZHByXzEuMCxnX2ZhY2UsaF8zMDAscV84MCx3XzMwMC9NVEUxT0RBME9UY3lNREExTmpnNE9EUTEuanBnJyxcbi8vIFx0XHRcdGluYm94OiBcbi8vIFx0XHRcdFx0W1xuLy8gXHRcdFx0XHRcdGNvbnZvMSxcbi8vIFx0XHRcdFx0XHRjb252bzIsXG4vLyBcdFx0XHRcdFx0Y29udm8zXG4vLyBcdFx0XHRcdF0sXHRcbi8vIFx0XHRcdGlkOiAxXG4vLyBcdFx0fSk7XG5cblxuLy8gbmV3IFdPVyhcbi8vICAgICB7IG9mZnNldDogMTIwIH1cbi8vICkuaW5pdCgpO1xuXG5cbi8vIG5ldyBDaGF0Ym94KCk7XG4iLCJcbi8vIFRoZSBDaGF0Q2xpZW50IGlzIGltcGxlbWVudGVkIG9uIG1haW4uanMuXG4vLyBUaGUgY2hhdGNsaWVudCBpcyBhIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIG9uIHRoZSBNYWluQ29udHJvbGxlci5cbi8vIEl0IGJvdGggbGlzdGVucyB0byBhbmQgZW1pdHMgZXZlbnRzIG9uIHRoZSBzb2NrZXQsIGVnOlxuLy8gSXQgaGFzIGl0cyBvd24gbWV0aG9kcyB0aGF0LCB3aGVuIGNhbGxlZCwgZW1pdCB0byB0aGUgc29ja2V0IHcvIGRhdGEuXG4vLyBJdCBhbHNvIHNldHMgcmVzcG9uc2UgbGlzdGVuZXJzIG9uIGNvbm5lY3Rpb24sIHRoZXNlIHJlc3BvbnNlIGxpc3RlbmVyc1xuLy8gbGlzdGVuIHRvIHRoZSBzb2NrZXQgYW5kIHRyaWdnZXIgZXZlbnRzIG9uIHRoZSBhcHBFdmVudEJ1cyBvbiB0aGUgXG4vLyBNYWluQ29udHJvbGxlclxudmFyIENoYXRDbGllbnQgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdC8vIGlzLXR5cGluZyBoZWxwZXIgdmFyaWFibGVzXG5cdHZhciBUWVBJTkdfVElNRVJfTEVOR1RIID0gNDAwOyAvLyBtc1xuICB2YXIgdHlwaW5nID0gZmFsc2U7XG4gIHZhciBsYXN0VHlwaW5nVGltZTtcbiAgXG4gIC8vIHRoaXMgdmVudCBob2xkcyB0aGUgYXBwRXZlbnRCdXNcblx0c2VsZi52ZW50ID0gb3B0aW9ucy52ZW50O1xuXG5cdHNlbGYuaG9zdG5hbWUgPSAnaHR0cDovLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdDtcblxuICAvLyBjb25uZWN0cyB0byBzb2NrZXQsIHNldHMgcmVzcG9uc2UgbGlzdGVuZXJzXG5cdHNlbGYuY29ubmVjdCA9IGZ1bmN0aW9uKCkge1xuXHRcdC8vIHRoaXMgaW8gbWlnaHQgYmUgYSBsaXR0bGUgY29uZnVzaW5nLi4uIHdoZXJlIGlzIGl0IGNvbWluZyBmcm9tP1xuXHRcdC8vIGl0J3MgY29taW5nIGZyb20gdGhlIHN0YXRpYyBtaWRkbGV3YXJlIG9uIHNlcnZlci5qcyBiYyBldmVyeXRoaW5nXG5cdFx0Ly8gaW4gdGhlIC9wdWJsaWMgZm9sZGVyIGhhcyBiZWVuIGF0dGFjaGVkIHRvIHRoZSBzZXJ2ZXIsIGFuZCB2aXNhXG5cdFx0Ly8gdmVyc2EuXG5cdFx0c2VsZi5zb2NrZXQgPSBpby5jb25uZWN0KHNlbGYuaG9zdG5hbWUpO1xuXHRcdHNlbGYuc2V0UmVzcG9uc2VMaXN0ZW5lcnMoc2VsZi5zb2NrZXQpO1xuXHR9O1xuXG4gICAgLy8vLy8gVmlld0V2ZW50QnVzIG1ldGhvZHMgLy8vL1xuICAgIC8vIG1ldGhvZHMgdGhhdCBlbWl0IHRvIHRoZSBjaGF0c2VydmVyXG5cdFx0Ly8gZW1pdHMgbG9naW4gZXZlbnQgdG8gY2hhdHNlcnZlclxuXHRzZWxmLmxvZ2luID0gZnVuY3Rpb24obmFtZSkge1xuXHRcdHNlbGYuc29ja2V0LmVtaXQoXCJsb2dpblwiLCBuYW1lKTtcblx0fTtcbiAgICAvLyBlbWl0cyBjaGF0IGV2ZW50IHRvIGNoYXRzZXJ2ZXJcblx0c2VsZi5jaGF0ID0gZnVuY3Rpb24oY2hhdCkge1xuXHRcdHNlbGYuc29ja2V0LmVtaXQoXCJjaGF0XCIsIGNoYXQpO1xuXHR9O1xuXG5cbiAgLy8gVHlwaW5nIG1ldGhvZHNcblx0c2VsZi5hZGRDaGF0VHlwaW5nID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciBtZXNzYWdlID0gZGF0YS51c2VybmFtZSArICcgaXMgdHlwaW5nJztcbiAgICAkKCcudHlwZXR5cGV0eXBlJykudGV4dChtZXNzYWdlKTtcblx0fTtcblxuXHRzZWxmLnJlbW92ZUNoYXRUeXBpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAkKCcudHlwZXR5cGV0eXBlJykuZW1wdHkoKTtcblx0fTtcblxuICBzZWxmLnVwZGF0ZVR5cGluZyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChzZWxmLnNvY2tldCkge1xuICAgICAgaWYgKCF0eXBpbmcpIHtcbiAgICAgICAgdHlwaW5nID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5zb2NrZXQuZW1pdCgndHlwaW5nJyk7XG4gICAgICB9XG4gICAgICBsYXN0VHlwaW5nVGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG5cbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0eXBpbmdUaW1lciA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICAgIHZhciB0aW1lRGlmZiA9IHR5cGluZ1RpbWVyIC0gbGFzdFR5cGluZ1RpbWU7XG4gICAgICAgIGlmICh0aW1lRGlmZiA+PSBUWVBJTkdfVElNRVJfTEVOR1RIICYmIHR5cGluZykge1xuICAgICAgICAgICBzZWxmLnNvY2tldC5lbWl0KCdzdG9wIHR5cGluZycpO1xuICAgICAgICAgICB0eXBpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSwgVFlQSU5HX1RJTUVSX0xFTkdUSCk7XG4gICAgfVxuICB9O1xuXG5cblxuICAvLyBjaGF0c2VydmVyIGxpc3RlbmVyc1xuICAvLyB0aGVzZSBndXlzIGxpc3RlbiB0byB0aGUgY2hhdHNlcnZlci9zb2NrZXQgYW5kIGVtaXQgZGF0YSB0byBtYWluLmpzLFxuICAvLyBzcGVjaWZpY2FsbHkgdG8gdGhlIGFwcEV2ZW50QnVzLlxuXHRzZWxmLnNldFJlc3BvbnNlTGlzdGVuZXJzID0gZnVuY3Rpb24oc29ja2V0KSB7XG5cdFx0Ly8gY2xpZW50IGxpc3RlbmVycyB0aGF0IGxpc3RlbiB0byB0aGUgY2hhdHNlcnZlciBhbmQgaXRzZWxmLlxuXHRcdC8vIEVhY2ggc2VydmVyIGV2ZW50IHRyaWdnZXJzIGFuIGFwcEV2ZW50QnVzIGV2ZW50IHBhaXJlZCB3aXRoIFxuXHRcdC8vIHJlbGV2YW50IGRhdGEuXG5cblx0XHRzb2NrZXQub24oJ3dlbGNvbWUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAvLyBlbWl0cyBldmVudCB0byByZWNhbGlicmF0ZSBvbmxpbmVVc2VycyBjb2xsZWN0aW9uXG4gICAgICBzb2NrZXQuZW1pdChcIm9ubGluZVVzZXJzXCIpO1xuXHRcdFx0Y29uc29sZS5sb2coJ29ubGluZVVzZXJzMTogJywgZGF0YSk7XG4gICAgICAvLyBkYXRhIGlzIHVuZGVmaW5lZCBhdCB0aGlzIHBvaW50IGJlY2F1c2UgaXQncyB0aGUgZmlyc3QgdG9cbiAgICAgIC8vIGZpcmUgb2ZmIGFuIGV2ZW50IGNoYWluIHRoYXQgd2lsbCBhcHBlbmQgdGhlIG5ldyB1c2VyIHRvIFxuICAgICAgLy8gdGhlIG9ubGluZVVzZXIgY29sbGVjdGlvblxuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJsb2dpbkRvbmVcIiwgZGF0YSk7XG4gICAgfSk7XG5cblx0XHRzb2NrZXQub24oJ2xvZ2luTmFtZUV4aXN0cycsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIC8vIGRhdGEgPT09IHN0cmluZyBvZiB1c2VkIHVzZXJuYW1lXG5cdFx0XHRjb25zb2xlLmxvZygnbG9naW5OYW1lRXhpc3RzOiAnLCBkYXRhKTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwibG9naW5OYW1lRXhpc3RzXCIsIGRhdGEpO1xuXHRcdH0pO1xuXHRcdHNvY2tldC5vbignbG9naW5OYW1lQmFkJywgZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0Ly8gZGF0YSA9PT0gc3RyaW5nIG9mIGJhZCB1c2VybmFtZVxuXHRcdFx0Y29uc29sZS5sb2coJ2xvZ2luTmFtZUJhZDogJywgZGF0YSk7XG5cdFx0XHRzZWxmLnZlbnQudHJpZ2dlcihcImxvZ2luTmFtZUJhZFwiLCBkYXRhKTtcblx0XHR9KTtcblxuXHRcdC8vIHRoaXMgaXMgdGhlIHNlY29uZCBsaXN0ZW5lciB0byBvbmxpbmVVc2Vyc1xuXHRcdC8vIGJ5IHRoZSB0aW1lIHRoaXMgaXMgY2FsbGVkLCB0aGUgbmV3IHVzZXIgaGFzIGJlZW4gYWRkZWQgdG9cblx0XHQvLyB0aGUgdXNlciBjb2xsZWN0aW9uLlxuXHRcdHNvY2tldC5vbignb25saW5lVXNlcnMnLCBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHQvLyB0aGlzIGRhdGEgaXMgYW4gYXJyYXkgd2l0aCBhbGwgdGhlIG9ubGluZSB1c2VyJ3MgdXNlcm5hbWVzLlxuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJ1c2Vyc0luZm9cIiwgZGF0YSk7XG5cdFx0fSk7XG5cblx0XHRzb2NrZXQub24oJ3VzZXJKb2luZWQnLCBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHQvLyBkYXRhID09PSB1c2VybmFtZSBvZiB1c2VyIGpvaW5lZFxuXHRcdFx0Y29uc29sZS5sb2coJ3VzZXJKb2luZWQ6ICcsIGRhdGEpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJ1c2VySm9pbmVkXCIsIGRhdGEpO1xuXHRcdH0pO1xuXHRcdHNvY2tldC5vbigndXNlckxlZnQnLCBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHQvLyBkYXRhID09PSB1c2VybmFtZSBvZiB1c2VyIHJlbW92ZWRcblx0XHRcdGNvbnNvbGUubG9nKCd1c2VyTGVmdDogJywgZGF0YSk7XG5cdFx0XHRzZWxmLnZlbnQudHJpZ2dlcihcInVzZXJMZWZ0XCIsIGRhdGEpO1xuXHRcdH0pO1xuXHRcdHNvY2tldC5vbignY2hhdCcsIGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdC8vIGRhdGEgPT09IGNoYXQgbWVzc2FnZSBvYmplY3Rcblx0XHRcdGNvbnNvbGUubG9nKCdjaGF0OiAnLCBkYXRhKTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwiY2hhdFJlY2VpdmVkXCIsIGRhdGEpO1xuXHRcdH0pO1xuXG5cbiAgICAvLyB0aGVzZSBndXlzIGxpc3RlbiB0byB0aGUgc2VydmVyLCBcbiAgICAvLyB0aGVuIGNhbGwgY2hhdGNsaWVudCBtZXRob2RzIGxpc3RlZCBhYm92ZVxuICAgIHNvY2tldC5vbigndHlwaW5nJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgc2VsZi5hZGRDaGF0VHlwaW5nKGRhdGEpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbignc3RvcCB0eXBpbmcnLCBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYucmVtb3ZlQ2hhdFR5cGluZygpO1xuICAgIH0pO1xuXG5cblxuXG5cblx0fTtcbn07IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICB2YXIgQ2hhdHJvb21Sb3V0ZXIgPSBCYWNrYm9uZS5Sb3V0ZXIuZXh0ZW5kKHtcbiAgICBcbiAgICByb3V0ZXM6IHtcbiAgICAgICcnOiAnc3RhcnQnLFxuICAgIH0sXG5cbiAgICBzdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIgPSBuZXcgYXBwLk1haW5Db250cm9sbGVyKCk7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIuaW5pdCgpO1xuICAgIH0sXG5cbiAgfSk7XG5cbiAgYXBwLkNoYXRyb29tUm91dGVyID0gbmV3IENoYXRyb29tUm91dGVyKCk7XG4gIEJhY2tib25lLmhpc3Rvcnkuc3RhcnQoKTtcblxufSkoKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=