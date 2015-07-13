
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

// var socket = io();

// var Chatbox = Backbone.View.extend({
// 	el: '#view-container',
// 	chatroomTemplate: _.template($('#chatroom-template').html()),
// 	chatMessageTemplate: _.template($('#chatbox-message-template').html()),
// 	initialize: function() {
// 		this.render();
// 		$input = $('.message-input');
// 		socket.on('chat message', function(msg){
// 			var content = {content: msg, timestamp: new Date()};
// 			$('.chatbox-content').append(this.chatMessageTemplate(content));
// 			$('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
// 			$input.focus();
//     }.bind(this));
// 	},
// 	events: {
// 		'keypress .message-input' : 'send',
// 	},
//   render: function() {
//     this.$el.html(this.chatroomTemplate);
//     $('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
//     return this;
//   },
//   send: function(e) {
//     if (e.which === 13  && $input.val() !== '') {
// 			e.preventDefault();
// 			socket.emit('chat message', $input.val());
// 			$input.val('');
//       return false;
//     }
//   }
// });



  // <script>
  //   var socket = io();
  //   $('form').submit(function(){
  //     socket.emit('chat message', $('#message-input').val());
  //     $('#message-input').val('');
  //     return false;
  //   });
  //   socket.on('chat message', function(msg){
  //     $('#messages').append($('<li>').text(msg));
  //   });

  // </script>


	// render: function() {
	// 	this.$el.html(this.chatboxTpl(this.model.toJSON()));
	// 	$('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
	// 	this.messages(this.model.get('messages'));
	// 	return this;
	// },
	// messages: function(messages) {
	// 	for (var i = 0; i < messages.length; i++) {
	// 		$('.chatbox-content').append(this.chatMessageTpl(messages[i]));
	// 	}
	// },
	// send: function(e) {
		// if (e.which === 13  && $input.val() !== '') {
		// 	e.preventDefault();
		// 	var socket = io();
		// 	socket.emit('chat message', $input.val());
		// 	// var user = this.model.get('users');
		// 	// var message = Object.create({
		// 	// 	content: content,
		// 	// 	sender: user[0],
		// 	// 	timestamp: new Date(),
		// 	// });
		// 	socket.on('chat message', function(msg){
		// 		var content = {content: msg, timestamp: new Date()};
		// 		console.log(content);
		// 		$('.chatbox-content').append(this.chatMessageTpl(content));
		// 		console.log(content);
  //     }.bind(this));
		// 		// var messages = this.model.get('messages');
		// 		// messages.push(message);
		// 	$('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
	 //  	$input.val('');
		// 	$input.focus();
		// 	// console.log('message', message);
		// 	// console.log('messages', messages);
  //   return false;
 //  	}
	// },


    
      
    
    


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
// var DirectMessage = Backbone.View.extend({
// 	directMessageTpl: _.template($('#direct-message-template').html()),
// 	initialize: function() {
// 		this.render();
// 	},
// 	events: {
// 		'click .direct-message' : 'chatbox'
// 	},
// 	render: function() {
// 		var messages = this.model.attributes.messages;
// 		var x = messages.length - 1;
// 		var lastMessage = messages[x];
// 		this.$el.append(this.directMessageTpl(lastMessage));
// 		return this;
// 	},
// 	chatbox: function() {
// 		var view = new Chatbox({model: this.model});
// 		return this;
// 	}
// });
// var DirectMessages = Backbone.View.extend({
// 	el: '.chat-directory',
// 	chatboxTpl: _.template($('#chatbox-template').html()),
// 	events: {
// 		'click .chat-search-input': 'chatbox'
// 	},
// 	initialize: function() {
// 		$directMessagesContainer = $('.direct-messages-container');
// 		moment().format();
// 		this.addSidebar();
// 	},
// 	addSidebarItem: function(conversation) {
// 		var view = new DirectMessage({model: conversation});
// 		$directMessagesContainer.append(view.el)
// 	},
// 	addSidebar: function() {
// 		var inbox = this.model.get('inbox');
// 		for (var i = 0; i < inbox.length; i++) {
// 			this.addSidebarItem(inbox[i])			
// 		}
// 		this.chatbox();
// 	},
// 	chatbox: function() {
// 		$('.chatbox').html(this.chatboxTpl());
// 		return this;
// 	},
// });
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
// var app = app || {};

// (function ($) {

// app.ContainerView = Backbone.View.extend({
// 	el: '#view-container',
// 	initialize: function(options) {
// 		this.model.on("change:viewState", this.render, this);
// 	},
// 	render: function() {
// 		var view = this.model.get('viewState');
// 		this.$el.html(view.render().el);
// 	}
// });

// app.LoginView = Backbone.View.extend({
// 	template: _.template($('#login-template').html()),
// 	events: {
// 		'click #nameBtn': 'onLogin',
// 		'keypress #nameText': 'onHitEnter'
// 	},
// 	initialize: function(options) {
// 		// LoginView gets passed the viewEventBus when the MainController is initialized
// 		this.vent = options.vent;

// 		// This tells the view to listen to an event on its model,
// 		// if there's an error, the callback (this.render) is called with the  
// 		// view as context
// 		this.listenTo(this.model, "change:error", this.render, this);

// 	},
// 	render: function() {
// 		this.$el.html(this.template(this.model.toJSON()));
// 		return this;
// 	},
// 	onLogin: function() {
// 		// triggers the login event and passing the username data to js/main.js
// 		this.vent.trigger("login", this.$('#nameText').val());
// 	},
// 	onHitEnter: function(e) {
//     if(e.keyCode == 13) {
//       this.onLogin();
//       return false;
//     }
// 	}
// });


// app.ChatroomView = Backbone.View.extend({
// 	template: _.template($('#chatroom-template').html()),
// 	events: {
// 		'keypress .message-input': 'messageInputPressed'
// 	},
// 	// initialized after the 'loginDone' event
// 	initialize: function(options) {
// 		console.log(options);
// 		// passed the viewEventBus
// 		this.vent = options.vent;

//     // these get the collection of onlineUsers and userChats from the chatroomModel
// 		var onlineUsers = this.model.get('onlineUsers');
// 		var userChats = this.model.get('userChats');

//     //sets event listeners on the collections
// 		this.listenTo(onlineUsers, "add", this.renderUser, this);
// 		this.listenTo(onlineUsers, "remove", this.renderUsers, this);
// 		this.listenTo(onlineUsers, "reset", this.renderUsers, this);

// 		this.listenTo(userChats, "add", this.renderChat, this);
// 		this.listenTo(userChats, "remove", this.renderChats, this);
// 		this.listenTo(userChats, "reset", this.renderChats, this);
// 	},
// 	render: function() {
// 		var onlineUsers = this.model.get("onlineUsers");
// 		this.$el.html(this.template());
// 		this.renderUsers();
// 		this.renderChats();
// 		return this;
// 	},
// 	// renders on events, called just above
// 	renderUsers: function() {
// 		this.$('.online-users').empty();
// 		this.model.get("onlineUsers").each(function (user) {
// 			this.renderUser(user);
// 		}, this);
// 	},
// 	renderUser: function(model) {
// 		var template = _.template($("#online-users-list-template").html());
// 		this.$('.online-users').append(template(model.toJSON()));
// 		// this.$('.user-count').html(this.model.get("onlineUsers").length);
// 		// this.$('.nano').nanoScroller();
// 	},
// 	renderChats: function() {
// 		this.$('.chatbox-content').empty();
// 		this.model.get('userChats').each(function(chat) {
// 			this.renderChat(chat);
// 		}, this);
// 	},
// 	renderChat: function(model) {
// 		var template = _.template($('#chatbox-message-template').html());
// 		var element = $(template(model.toJSON()));
// 		element.appendTo(this.$('.chatbox-content')).hide().fadeIn().slideDown();
// 		// this.$('.nano').nanoScroller();
// 		// this.$('.nano').nanoScroller({ scroll: 'bottom' });
// 	},
// 	//events
// 	messageInputPressed: function(e) {
// 		if (e.keyCode === 13 && $.trim($('.message-input').val()).length > 0) {
// 			// fun fact: separate events with a space in trigger's first arg and you
// 			// can trigger multiple events.
// 			this.vent.trigger("chat", this.$('.message-input').val());
// 			this.$('.message-input').val('');
// 			return false;
// 		} else {
//       this.vent.trigger("typing");
//       console.log('wut');
// 		}
// 	}
// });

// })(jQuery);

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYXQuanMiLCJjb250YWluZXIuanMiLCJsb2dpbi5qcyIsInVzZXIuanMiLCJjb252ZXJzYXRpb24uanMiLCJpbmJveC5qcyIsImNoYXQtbW9kZWxzLmpzIiwiY2hhdHJvb20uanMiLCJjaGF0Ym94LmpzIiwiZGlyZWN0LW1lc3NhZ2UuanMiLCJkaXJlY3QtbWVzc2FnZXMuanMiLCJtYWluLmpzIiwic29ja2V0Y2xpZW50LmpzIiwicm91dGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBSFBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUlQQTtBQUNBO0FBQ0E7QUNGQTtBQUNBO0FBQ0E7QUZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FHUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QURoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBTjVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBUWZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FSMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBU25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUQvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUUzTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLkNoYXRDb2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe21vZGVsOiBhcHAuQ2hhdE1vZGVsfSk7XG5cbn0pKCk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbiAgYXBwLkNvbnRhaW5lclZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgZWw6ICcjdmlldy1jb250YWluZXInLFxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMubW9kZWwub24oXCJjaGFuZ2U6dmlld1N0YXRlXCIsIHRoaXMucmVuZGVyLCB0aGlzKTtcbiAgICB9LFxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdmlldyA9IHRoaXMubW9kZWwuZ2V0KCd2aWV3U3RhdGUnKTtcbiAgICAgIHRoaXMuJGVsLmh0bWwodmlldy5yZW5kZXIoKS5lbCk7XG4gICAgfVxuICB9KTtcblxufSkoalF1ZXJ5KTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuICBhcHAuTG9naW5WaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIHRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNsb2dpbi10ZW1wbGF0ZScpLmh0bWwoKSksXG4gICAgZXZlbnRzOiB7XG4gICAgICAnY2xpY2sgI25hbWVCdG4nOiAnb25Mb2dpbicsXG4gICAgICAna2V5cHJlc3MgI25hbWVUZXh0JzogJ29uSGl0RW50ZXInXG4gICAgfSxcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgLy8gTG9naW5WaWV3IGdldHMgcGFzc2VkIHRoZSB2aWV3RXZlbnRCdXMgd2hlbiB0aGUgTWFpbkNvbnRyb2xsZXIgaXMgaW5pdGlhbGl6ZWRcbiAgICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcblxuICAgIC8vIFRoaXMgdGVsbHMgdGhlIHZpZXcgdG8gbGlzdGVuIHRvIGFuIGV2ZW50IG9uIGl0cyBtb2RlbCxcbiAgICAvLyBpZiB0aGVyZSdzIGFuIGVycm9yLCB0aGUgY2FsbGJhY2sgKHRoaXMucmVuZGVyKSBpcyBjYWxsZWQgd2l0aCB0aGUgIFxuICAgIC8vIHZpZXcgYXMgY29udGV4dFxuICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImNoYW5nZTplcnJvclwiLCB0aGlzLnJlbmRlciwgdGhpcyk7XG4gICAgfSxcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKHRoaXMubW9kZWwudG9KU09OKCkpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgb25Mb2dpbjogZnVuY3Rpb24oKSB7XG4gICAgICAvLyB0cmlnZ2VycyB0aGUgbG9naW4gZXZlbnQgYW5kIHBhc3NpbmcgdGhlIHVzZXJuYW1lIGRhdGEgdG8ganMvbWFpbi5qc1xuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJsb2dpblwiLCB0aGlzLiQoJyNuYW1lVGV4dCcpLnZhbCgpKTtcbiAgICB9LFxuICAgIG9uSGl0RW50ZXI6IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmKGUua2V5Q29kZSA9PSAxMykge1xuICAgICAgICB0aGlzLm9uTG9naW4oKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIFxufSkoalF1ZXJ5KTsiLCJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLlVzZXJDb2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe21vZGVsOiBhcHAuVXNlck1vZGVsfSk7XG5cbn0pKCk7IiwiLy8gdmFyIENvbnZlcnNhdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcbi8vIFx0bW9kZWw6IE1lc3NhZ2UsXG4vLyB9KTsiLCIvLyB2YXIgSW5ib3ggPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG4vLyBcdG1vZGVsOiBDb252ZXJzYXRpb24sXG4vLyB9KTsiLCJcblxuXG4vLyB2YXIgVXNlciA9IEJhY2tib25lLk1vZGVsLmV4dGVuZCh7XG4vLyBcdGRlZmF1bHRzOiB7XG4vLyBcdFx0dXNlcm5hbWU6ICcnLFxuLy8gXHRcdGF2YXRhcjogJycsXG4vLyBcdFx0aW5ib3g6IFtdLFxuLy8gXHR9LFxuLy8gfSk7XG5cbi8vIHZhciBDb252ZXJzYXRpb24gPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoe1xuLy8gXHRkZWZhdWx0czoge1xuLy8gXHRcdHVzZXJzOiBbXSxcbi8vIFx0XHRtZXNzYWdlczogW10sXG4vLyBcdH0sXG4vLyB9KTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuYXBwLkNoYXRyb29tVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2NoYXRyb29tLXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgZXZlbnRzOiB7XG4gICAgJ2tleXByZXNzIC5tZXNzYWdlLWlucHV0JzogJ21lc3NhZ2VJbnB1dFByZXNzZWQnXG4gIH0sXG4gIC8vIGluaXRpYWxpemVkIGFmdGVyIHRoZSAnbG9naW5Eb25lJyBldmVudFxuICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgY29uc29sZS5sb2cob3B0aW9ucyk7XG4gICAgLy8gcGFzc2VkIHRoZSB2aWV3RXZlbnRCdXNcbiAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XG5cbiAgICAvLyB0aGVzZSBnZXQgdGhlIGNvbGxlY3Rpb24gb2Ygb25saW5lVXNlcnMgYW5kIHVzZXJDaGF0cyBmcm9tIHRoZSBjaGF0cm9vbU1vZGVsXG4gICAgdmFyIG9ubGluZVVzZXJzID0gdGhpcy5tb2RlbC5nZXQoJ29ubGluZVVzZXJzJyk7XG4gICAgdmFyIHVzZXJDaGF0cyA9IHRoaXMubW9kZWwuZ2V0KCd1c2VyQ2hhdHMnKTtcblxuICAgIC8vc2V0cyBldmVudCBsaXN0ZW5lcnMgb24gdGhlIGNvbGxlY3Rpb25zXG4gICAgdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJhZGRcIiwgdGhpcy5yZW5kZXJVc2VyLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKG9ubGluZVVzZXJzLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlclVzZXJzLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKG9ubGluZVVzZXJzLCBcInJlc2V0XCIsIHRoaXMucmVuZGVyVXNlcnMsIHRoaXMpO1xuXG4gICAgdGhpcy5saXN0ZW5Ubyh1c2VyQ2hhdHMsIFwiYWRkXCIsIHRoaXMucmVuZGVyQ2hhdCwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5Ubyh1c2VyQ2hhdHMsIFwicmVtb3ZlXCIsIHRoaXMucmVuZGVyQ2hhdHMsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8odXNlckNoYXRzLCBcInJlc2V0XCIsIHRoaXMucmVuZGVyQ2hhdHMsIHRoaXMpO1xuICB9LFxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvbmxpbmVVc2VycyA9IHRoaXMubW9kZWwuZ2V0KFwib25saW5lVXNlcnNcIik7XG4gICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKCkpO1xuICAgIHRoaXMucmVuZGVyVXNlcnMoKTtcbiAgICB0aGlzLnJlbmRlckNoYXRzKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8vIHJlbmRlcnMgb24gZXZlbnRzLCBjYWxsZWQganVzdCBhYm92ZVxuICByZW5kZXJVc2VyczogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy4kKCcub25saW5lLXVzZXJzJykuZW1wdHkoKTtcbiAgICB0aGlzLm1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpLmVhY2goZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgIHRoaXMucmVuZGVyVXNlcih1c2VyKTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyVXNlcjogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBfLnRlbXBsYXRlKCQoXCIjb25saW5lLXVzZXJzLWxpc3QtdGVtcGxhdGVcIikuaHRtbCgpKTtcbiAgICB0aGlzLiQoJy5vbmxpbmUtdXNlcnMnKS5hcHBlbmQodGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICAvLyB0aGlzLiQoJy51c2VyLWNvdW50JykuaHRtbCh0aGlzLm1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpLmxlbmd0aCk7XG4gICAgLy8gdGhpcy4kKCcubmFubycpLm5hbm9TY3JvbGxlcigpO1xuICB9LFxuICByZW5kZXJDaGF0czogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy4kKCcuY2hhdGJveC1jb250ZW50JykuZW1wdHkoKTtcbiAgICB0aGlzLm1vZGVsLmdldCgndXNlckNoYXRzJykuZWFjaChmdW5jdGlvbihjaGF0KSB7XG4gICAgICB0aGlzLnJlbmRlckNoYXQoY2hhdCk7XG4gICAgfSwgdGhpcyk7XG4gIH0sXG4gIHJlbmRlckNoYXQ6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gXy50ZW1wbGF0ZSgkKCcjY2hhdGJveC1tZXNzYWdlLXRlbXBsYXRlJykuaHRtbCgpKTtcbiAgICB2YXIgZWxlbWVudCA9ICQodGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICBlbGVtZW50LmFwcGVuZFRvKHRoaXMuJCgnLmNoYXRib3gtY29udGVudCcpKS5oaWRlKCkuZmFkZUluKCkuc2xpZGVEb3duKCk7XG4gICAgLy8gdGhpcy4kKCcubmFubycpLm5hbm9TY3JvbGxlcigpO1xuICAgIC8vIHRoaXMuJCgnLm5hbm8nKS5uYW5vU2Nyb2xsZXIoeyBzY3JvbGw6ICdib3R0b20nIH0pO1xuICB9LFxuICAvL2V2ZW50c1xuICBtZXNzYWdlSW5wdXRQcmVzc2VkOiBmdW5jdGlvbihlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMgJiYgJC50cmltKCQoJy5tZXNzYWdlLWlucHV0JykudmFsKCkpLmxlbmd0aCA+IDApIHtcbiAgICAgIC8vIGZ1biBmYWN0OiBzZXBhcmF0ZSBldmVudHMgd2l0aCBhIHNwYWNlIGluIHRyaWdnZXIncyBmaXJzdCBhcmcgYW5kIHlvdVxuICAgICAgLy8gY2FuIHRyaWdnZXIgbXVsdGlwbGUgZXZlbnRzLlxuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJjaGF0XCIsIHRoaXMuJCgnLm1lc3NhZ2UtaW5wdXQnKS52YWwoKSk7XG4gICAgICB0aGlzLiQoJy5tZXNzYWdlLWlucHV0JykudmFsKCcnKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJ0eXBpbmdcIik7XG4gICAgICBjb25zb2xlLmxvZygnd3V0Jyk7XG4gICAgfVxuICB9XG59KTtcblxufSkoalF1ZXJ5KTsiLCJcbi8vIHZhciBzb2NrZXQgPSBpbygpO1xuXG4vLyB2YXIgQ2hhdGJveCA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbi8vIFx0ZWw6ICcjdmlldy1jb250YWluZXInLFxuLy8gXHRjaGF0cm9vbVRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNjaGF0cm9vbS10ZW1wbGF0ZScpLmh0bWwoKSksXG4vLyBcdGNoYXRNZXNzYWdlVGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2NoYXRib3gtbWVzc2FnZS10ZW1wbGF0ZScpLmh0bWwoKSksXG4vLyBcdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuLy8gXHRcdHRoaXMucmVuZGVyKCk7XG4vLyBcdFx0JGlucHV0ID0gJCgnLm1lc3NhZ2UtaW5wdXQnKTtcbi8vIFx0XHRzb2NrZXQub24oJ2NoYXQgbWVzc2FnZScsIGZ1bmN0aW9uKG1zZyl7XG4vLyBcdFx0XHR2YXIgY29udGVudCA9IHtjb250ZW50OiBtc2csIHRpbWVzdGFtcDogbmV3IERhdGUoKX07XG4vLyBcdFx0XHQkKCcuY2hhdGJveC1jb250ZW50JykuYXBwZW5kKHRoaXMuY2hhdE1lc3NhZ2VUZW1wbGF0ZShjb250ZW50KSk7XG4vLyBcdFx0XHQkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnLmNoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcbi8vIFx0XHRcdCRpbnB1dC5mb2N1cygpO1xuLy8gICAgIH0uYmluZCh0aGlzKSk7XG4vLyBcdH0sXG4vLyBcdGV2ZW50czoge1xuLy8gXHRcdCdrZXlwcmVzcyAubWVzc2FnZS1pbnB1dCcgOiAnc2VuZCcsXG4vLyBcdH0sXG4vLyAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4vLyAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLmNoYXRyb29tVGVtcGxhdGUpO1xuLy8gICAgICQoJy5jaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuLy8gICAgIHJldHVybiB0aGlzO1xuLy8gICB9LFxuLy8gICBzZW5kOiBmdW5jdGlvbihlKSB7XG4vLyAgICAgaWYgKGUud2hpY2ggPT09IDEzICAmJiAkaW5wdXQudmFsKCkgIT09ICcnKSB7XG4vLyBcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG4vLyBcdFx0XHRzb2NrZXQuZW1pdCgnY2hhdCBtZXNzYWdlJywgJGlucHV0LnZhbCgpKTtcbi8vIFx0XHRcdCRpbnB1dC52YWwoJycpO1xuLy8gICAgICAgcmV0dXJuIGZhbHNlO1xuLy8gICAgIH1cbi8vICAgfVxuLy8gfSk7XG5cblxuXG4gIC8vIDxzY3JpcHQ+XG4gIC8vICAgdmFyIHNvY2tldCA9IGlvKCk7XG4gIC8vICAgJCgnZm9ybScpLnN1Ym1pdChmdW5jdGlvbigpe1xuICAvLyAgICAgc29ja2V0LmVtaXQoJ2NoYXQgbWVzc2FnZScsICQoJyNtZXNzYWdlLWlucHV0JykudmFsKCkpO1xuICAvLyAgICAgJCgnI21lc3NhZ2UtaW5wdXQnKS52YWwoJycpO1xuICAvLyAgICAgcmV0dXJuIGZhbHNlO1xuICAvLyAgIH0pO1xuICAvLyAgIHNvY2tldC5vbignY2hhdCBtZXNzYWdlJywgZnVuY3Rpb24obXNnKXtcbiAgLy8gICAgICQoJyNtZXNzYWdlcycpLmFwcGVuZCgkKCc8bGk+JykudGV4dChtc2cpKTtcbiAgLy8gICB9KTtcblxuICAvLyA8L3NjcmlwdD5cblxuXG5cdC8vIHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdC8vIFx0dGhpcy4kZWwuaHRtbCh0aGlzLmNoYXRib3hUcGwodGhpcy5tb2RlbC50b0pTT04oKSkpO1xuXHQvLyBcdCQoJy5jaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuXHQvLyBcdHRoaXMubWVzc2FnZXModGhpcy5tb2RlbC5nZXQoJ21lc3NhZ2VzJykpO1xuXHQvLyBcdHJldHVybiB0aGlzO1xuXHQvLyB9LFxuXHQvLyBtZXNzYWdlczogZnVuY3Rpb24obWVzc2FnZXMpIHtcblx0Ly8gXHRmb3IgKHZhciBpID0gMDsgaSA8IG1lc3NhZ2VzLmxlbmd0aDsgaSsrKSB7XG5cdC8vIFx0XHQkKCcuY2hhdGJveC1jb250ZW50JykuYXBwZW5kKHRoaXMuY2hhdE1lc3NhZ2VUcGwobWVzc2FnZXNbaV0pKTtcblx0Ly8gXHR9XG5cdC8vIH0sXG5cdC8vIHNlbmQ6IGZ1bmN0aW9uKGUpIHtcblx0XHQvLyBpZiAoZS53aGljaCA9PT0gMTMgICYmICRpbnB1dC52YWwoKSAhPT0gJycpIHtcblx0XHQvLyBcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHQvLyBcdHZhciBzb2NrZXQgPSBpbygpO1xuXHRcdC8vIFx0c29ja2V0LmVtaXQoJ2NoYXQgbWVzc2FnZScsICRpbnB1dC52YWwoKSk7XG5cdFx0Ly8gXHQvLyB2YXIgdXNlciA9IHRoaXMubW9kZWwuZ2V0KCd1c2VycycpO1xuXHRcdC8vIFx0Ly8gdmFyIG1lc3NhZ2UgPSBPYmplY3QuY3JlYXRlKHtcblx0XHQvLyBcdC8vIFx0Y29udGVudDogY29udGVudCxcblx0XHQvLyBcdC8vIFx0c2VuZGVyOiB1c2VyWzBdLFxuXHRcdC8vIFx0Ly8gXHR0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG5cdFx0Ly8gXHQvLyB9KTtcblx0XHQvLyBcdHNvY2tldC5vbignY2hhdCBtZXNzYWdlJywgZnVuY3Rpb24obXNnKXtcblx0XHQvLyBcdFx0dmFyIGNvbnRlbnQgPSB7Y29udGVudDogbXNnLCB0aW1lc3RhbXA6IG5ldyBEYXRlKCl9O1xuXHRcdC8vIFx0XHRjb25zb2xlLmxvZyhjb250ZW50KTtcblx0XHQvLyBcdFx0JCgnLmNoYXRib3gtY29udGVudCcpLmFwcGVuZCh0aGlzLmNoYXRNZXNzYWdlVHBsKGNvbnRlbnQpKTtcblx0XHQvLyBcdFx0Y29uc29sZS5sb2coY29udGVudCk7XG4gIC8vICAgICB9LmJpbmQodGhpcykpO1xuXHRcdC8vIFx0XHQvLyB2YXIgbWVzc2FnZXMgPSB0aGlzLm1vZGVsLmdldCgnbWVzc2FnZXMnKTtcblx0XHQvLyBcdFx0Ly8gbWVzc2FnZXMucHVzaChtZXNzYWdlKTtcblx0XHQvLyBcdCQoJy5jaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuXHQgLy8gIFx0JGlucHV0LnZhbCgnJyk7XG5cdFx0Ly8gXHQkaW5wdXQuZm9jdXMoKTtcblx0XHQvLyBcdC8vIGNvbnNvbGUubG9nKCdtZXNzYWdlJywgbWVzc2FnZSk7XG5cdFx0Ly8gXHQvLyBjb25zb2xlLmxvZygnbWVzc2FnZXMnLCBtZXNzYWdlcyk7XG4gIC8vICAgcmV0dXJuIGZhbHNlO1xuIC8vICBcdH1cblx0Ly8gfSxcblxuXG4gICAgXG4gICAgICBcbiAgICBcbiAgICBcblxuIiwiLy8gdmFyIERpcmVjdE1lc3NhZ2UgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4vLyBcdGRpcmVjdE1lc3NhZ2VUcGw6IF8udGVtcGxhdGUoJCgnI2RpcmVjdC1tZXNzYWdlLXRlbXBsYXRlJykuaHRtbCgpKSxcbi8vIFx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG4vLyBcdFx0dGhpcy5yZW5kZXIoKTtcbi8vIFx0fSxcbi8vIFx0ZXZlbnRzOiB7XG4vLyBcdFx0J2NsaWNrIC5kaXJlY3QtbWVzc2FnZScgOiAnY2hhdGJveCdcbi8vIFx0fSxcbi8vIFx0cmVuZGVyOiBmdW5jdGlvbigpIHtcbi8vIFx0XHR2YXIgbWVzc2FnZXMgPSB0aGlzLm1vZGVsLmF0dHJpYnV0ZXMubWVzc2FnZXM7XG4vLyBcdFx0dmFyIHggPSBtZXNzYWdlcy5sZW5ndGggLSAxO1xuLy8gXHRcdHZhciBsYXN0TWVzc2FnZSA9IG1lc3NhZ2VzW3hdO1xuLy8gXHRcdHRoaXMuJGVsLmFwcGVuZCh0aGlzLmRpcmVjdE1lc3NhZ2VUcGwobGFzdE1lc3NhZ2UpKTtcbi8vIFx0XHRyZXR1cm4gdGhpcztcbi8vIFx0fSxcbi8vIFx0Y2hhdGJveDogZnVuY3Rpb24oKSB7XG4vLyBcdFx0dmFyIHZpZXcgPSBuZXcgQ2hhdGJveCh7bW9kZWw6IHRoaXMubW9kZWx9KTtcbi8vIFx0XHRyZXR1cm4gdGhpcztcbi8vIFx0fVxuLy8gfSk7IiwiLy8gdmFyIERpcmVjdE1lc3NhZ2VzID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuLy8gXHRlbDogJy5jaGF0LWRpcmVjdG9yeScsXG4vLyBcdGNoYXRib3hUcGw6IF8udGVtcGxhdGUoJCgnI2NoYXRib3gtdGVtcGxhdGUnKS5odG1sKCkpLFxuLy8gXHRldmVudHM6IHtcbi8vIFx0XHQnY2xpY2sgLmNoYXQtc2VhcmNoLWlucHV0JzogJ2NoYXRib3gnXG4vLyBcdH0sXG4vLyBcdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuLy8gXHRcdCRkaXJlY3RNZXNzYWdlc0NvbnRhaW5lciA9ICQoJy5kaXJlY3QtbWVzc2FnZXMtY29udGFpbmVyJyk7XG4vLyBcdFx0bW9tZW50KCkuZm9ybWF0KCk7XG4vLyBcdFx0dGhpcy5hZGRTaWRlYmFyKCk7XG4vLyBcdH0sXG4vLyBcdGFkZFNpZGViYXJJdGVtOiBmdW5jdGlvbihjb252ZXJzYXRpb24pIHtcbi8vIFx0XHR2YXIgdmlldyA9IG5ldyBEaXJlY3RNZXNzYWdlKHttb2RlbDogY29udmVyc2F0aW9ufSk7XG4vLyBcdFx0JGRpcmVjdE1lc3NhZ2VzQ29udGFpbmVyLmFwcGVuZCh2aWV3LmVsKVxuLy8gXHR9LFxuLy8gXHRhZGRTaWRlYmFyOiBmdW5jdGlvbigpIHtcbi8vIFx0XHR2YXIgaW5ib3ggPSB0aGlzLm1vZGVsLmdldCgnaW5ib3gnKTtcbi8vIFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGluYm94Lmxlbmd0aDsgaSsrKSB7XG4vLyBcdFx0XHR0aGlzLmFkZFNpZGViYXJJdGVtKGluYm94W2ldKVx0XHRcdFxuLy8gXHRcdH1cbi8vIFx0XHR0aGlzLmNoYXRib3goKTtcbi8vIFx0fSxcbi8vIFx0Y2hhdGJveDogZnVuY3Rpb24oKSB7XG4vLyBcdFx0JCgnLmNoYXRib3gnKS5odG1sKHRoaXMuY2hhdGJveFRwbCgpKTtcbi8vIFx0XHRyZXR1cm4gdGhpcztcbi8vIFx0fSxcbi8vIH0pOyIsIlxuXG5hcHAuTWFpbkNvbnRyb2xsZXIgPSBmdW5jdGlvbigpIHtcblxuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblxuICAvL1RoZXNlIGFsbG93cyB1cyB0byBiaW5kIGFuZCB0cmlnZ2VyIG9uIHRoZSBvYmplY3QgZnJvbSBhbnl3aGVyZSBpbiB0aGUgYXBwLlxuXHRzZWxmLmFwcEV2ZW50QnVzID0gXy5leHRlbmQoe30sIEJhY2tib25lLkV2ZW50cyk7XG5cdHNlbGYudmlld0V2ZW50QnVzID0gXy5leHRlbmQoe30sIEJhY2tib25lLkV2ZW50cyk7XG5cblx0c2VsZi5pbml0ID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly8gY3JlYXRlcyBDaGF0Q2xpZW50IGZyb20gc29ja2V0Y2xpZW50LmpzLCBwYXNzZXMgaW4gXG5cdFx0Ly8gYXBwRXZlbnRCdXMgYXMgdmVudCwgY29ubmVjdHNcblx0XHRzZWxmLmNoYXRDbGllbnQgPSBuZXcgQ2hhdENsaWVudCh7IHZlbnQ6IHNlbGYuYXBwRXZlbnRCdXMgfSk7XG5cdFx0c2VsZi5jaGF0Q2xpZW50LmNvbm5lY3QoKTtcblxuICAgIC8vIGxvZ2luTW9kZWxcblx0XHRzZWxmLmxvZ2luTW9kZWwgPSBuZXcgYXBwLkxvZ2luTW9kZWwoKTtcblxuICAgIC8vIFRoZSBDb250YWluZXJNb2RlbCBnZXRzIHBhc3NlZCBhIHZpZXdTdGF0ZSwgTG9naW5WaWV3LCB3aGljaFxuICAgIC8vIGlzIHRoZSBsb2dpbiBwYWdlLiBUaGF0IExvZ2luVmlldyBnZXRzIHBhc3NlZCB0aGUgdmlld0V2ZW50QnVzXG4gICAgLy8gYW5kIHRoZSBMb2dpbk1vZGVsLlxuXHRcdHNlbGYuY29udGFpbmVyTW9kZWwgPSBuZXcgYXBwLkNvbnRhaW5lck1vZGVsKHsgdmlld1N0YXRlOiBuZXcgYXBwLkxvZ2luVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXMsIG1vZGVsOiBzZWxmLmxvZ2luTW9kZWx9KX0pO1xuXG5cdFx0Ly8gbmV4dCwgYSBuZXcgQ29udGFpbmVyVmlldyBpcyBpbnRpYWxpemVkIHdpdGggdGhlIG5ld2x5IGNyZWF0ZWQgY29udGFpbmVyTW9kZWxcblx0XHQvLyB0aGUgbG9naW4gcGFnZSBpcyB0aGVuIHJlbmRlcmVkLlxuXHRcdHNlbGYuY29udGFpbmVyVmlldyA9IG5ldyBhcHAuQ29udGFpbmVyVmlldyh7IG1vZGVsOiBzZWxmLmNvbnRhaW5lck1vZGVsIH0pO1xuXHRcdHNlbGYuY29udGFpbmVyVmlldy5yZW5kZXIoKTtcblx0fTtcblxuXG5cbiAgLy8vLy8vLy8vLy8vICBCdXNzZXMgLy8vLy8vLy8vLy8vXG4gICAgLy8gVGhlc2UgQnVzc2VzIGxpc3RlbiB0byB0aGUgc29ja2V0Y2xpZW50XG4gICAvLyAgICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXG4gIC8vLy8gdmlld0V2ZW50QnVzIExpc3RlbmVycyAvLy8vL1xuICBcblx0c2VsZi52aWV3RXZlbnRCdXMub24oXCJsb2dpblwiLCBmdW5jdGlvbih1c2VybmFtZSkge1xuICAgIC8vIHNvY2tldGlvIGxvZ2luLCBzZW5kcyBuYW1lIHRvIHNvY2tldGNsaWVudCwgc29ja2V0Y2xpZW50IHNlbmRzIGl0IHRvIGNoYXRzZXJ2ZXJcbiAgICBzZWxmLmNoYXRDbGllbnQubG9naW4odXNlcm5hbWUpO1xuICB9KTtcblx0c2VsZi52aWV3RXZlbnRCdXMub24oXCJjaGF0XCIsIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICAvLyBzb2NrZXRpbyBjaGF0LCBzZW5kcyBjaGF0IHRvIHNvY2tldGNsaWVudCwgc29ja2V0Y2xpZW50IHRvIGNoYXRzZXJ2ZXJcbiAgICBzZWxmLmNoYXRDbGllbnQuY2hhdChjaGF0KTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwidHlwaW5nXCIsIGZ1bmN0aW9uKCkge1xuICAgIHNlbGYuY2hhdENsaWVudC51cGRhdGVUeXBpbmcoKTtcbiAgfSk7XG5cblxuICAvLy8vIGFwcEV2ZW50QnVzIExpc3RlbmVycyAvLy8vXG5cbiAgLy8gYWZ0ZXIgdGhlICd3ZWxjb21lJyBldmVudCB0cmlnZ2VycyBvbiB0aGUgc29ja2VjbGllbnQsIHRoZSBsb2dpbkRvbmUgZXZlbnQgdHJpZ2dlcnMuXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJsb2dpbkRvbmVcIiwgZnVuY3Rpb24oKSB7XG5cblx0XHQvLyBuZXcgbW9kZWwgYW5kIHZpZXcgY3JlYXRlZCBmb3IgY2hhdHJvb21cblx0XHRzZWxmLmNoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoKTtcblx0XHRzZWxmLmNoYXRyb29tVmlldyAgPSBuZXcgYXBwLkNoYXRyb29tVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXMsIG1vZGVsOiBzZWxmLmNoYXRyb29tTW9kZWwgfSk7XG5cblx0XHQvLyB2aWV3c3RhdGUgaXMgY2hhbmdlZCB0byBjaGF0cm9vbSBhZnRlciBsb2dpbi5cblx0XHRzZWxmLmNvbnRhaW5lck1vZGVsLnNldChcInZpZXdTdGF0ZVwiLCBzZWxmLmNoYXRyb29tVmlldyk7XG4gICAgYXV0b3NpemUoJCgndGV4dGFyZWEubWVzc2FnZS1pbnB1dCcpKTtcblx0XHQkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnLmNoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcblx0fSk7XG5cbiAgLy8gZXJyb3IgbGlzdGVuZXJzXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJsb2dpbk5hbWVCYWRcIiwgZnVuY3Rpb24odXNlcm5hbWUpIHtcblx0XHRzZWxmLmxvZ2luTW9kZWwuc2V0KFwiZXJyb3JcIiwgXCJJbnZhbGlkIE5hbWVcIik7XG5cdH0pO1xuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwibG9naW5OYW1lRXhpc3RzXCIsIGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG5cdFx0c2VsZi5sb2dpbk1vZGVsLnNldChcImVycm9yXCIsIFwiTmFtZSBhbHJlYWR5IGV4aXN0c1wiKTtcblx0fSk7XG5cblxuICAvLyBhZnRlciAnb25saW5lVXNlcnMnIGV2ZW50IGVtaXRzLCB0aGUgJ3VzZXJzSW5mbycgZXZlbnQgdHJpZ2dlcnNcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcInVzZXJzSW5mb1wiLCBmdW5jdGlvbihkYXRhKSB7XG5cbiAgICAvL2RhdGEgaXMgYW4gYXJyYXkgb2YgdXNlcm5hbWVzLCBpbmNsdWRpbmcgdGhlIG5ldyB1c2VyXG5cblx0XHQvLyBUaGlzIG1ldGhvZCBnZXRzIHRoZSBvbmxpbmUgdXNlcnMgY29sbGVjdGlvbiBmcm9tIGNoYXRyb29tTW9kZWwuXG5cdFx0Ly8gb25saW5lVXNlcnMgaXMgdGhlIGNvbGxlY3Rpb25cblx0XHR2YXIgb25saW5lVXNlcnMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KFwib25saW5lVXNlcnNcIik7XG5cbiAgIC8vIHVzZXJzIGlzIGFycmF5IG9mIHRoZSBjdXJyZW50IHVzZXIgbW9kZWxzXG5cdFx0dmFyIHVzZXJzID0gXy5tYXAoZGF0YSwgZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0cmV0dXJuIG5ldyBhcHAuVXNlck1vZGVsKHt1c2VybmFtZTogaXRlbX0pO1xuXHRcdH0pO1xuXG4gICAgLy8gdGhpcyByZXNldHMgdGhlIGNvbGxlY3Rpb24gd2l0aCB0aGUgdXBkYXRlZCBhcnJheSBvZiB1c2Vyc1xuXHRcdG9ubGluZVVzZXJzLnJlc2V0KHVzZXJzKTtcblx0fSk7XG5cbiAgLy8gYWRkcyBuZXcgdXNlciB0byB1c2VycyBjb2xsZWN0aW9uLCBzZW5kcyBkZWZhdWx0IGpvaW5pbmcgbWVzc2FnZVxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwidXNlckpvaW5lZFwiLCBmdW5jdGlvbih1c2VybmFtZSkge1xuXHRcdHNlbGYuY2hhdHJvb21Nb2RlbC5hZGRVc2VyKHVzZXJuYW1lKTtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkQ2hhdCh7c2VuZGVyOiBcIk1heW9yIE1jQ2hlZXNlXCIsIG1lc3NhZ2U6IHVzZXJuYW1lICsgXCIgam9pbmVkIHJvb20uXCIgfSk7XG5cdH0pO1xuXG5cdC8vIHJlbW92ZXMgdXNlciBmcm9tIHVzZXJzIGNvbGxlY3Rpb24sIHNlbmRzIGRlZmF1bHQgbGVhdmluZyBtZXNzYWdlXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2VyTGVmdFwiLCBmdW5jdGlvbih1c2VybmFtZSkge1xuXHRcdHNlbGYuY2hhdHJvb21Nb2RlbC5yZW1vdmVVc2VyKHVzZXJuYW1lKTtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkQ2hhdCh7c2VuZGVyOiBcIkdyaW1hY2VcIiwgbWVzc2FnZTogdXNlcm5hbWUgKyBcIiBsZWZ0IHJvb20uXCIgfSk7XG5cdH0pO1xuXG5cdC8vIGNoYXQgcGFzc2VkIGZyb20gc29ja2V0Y2xpZW50LCBhZGRzIGEgbmV3IGNoYXQgbWVzc2FnZSB1c2luZyBjaGF0cm9vbU1vZGVsIG1ldGhvZFxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwiY2hhdFJlY2VpdmVkXCIsIGZ1bmN0aW9uKGNoYXQpIHtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkQ2hhdChjaGF0KTtcblx0XHQkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnLmNoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcblx0fSk7XG59O1xuXG5cblxuXG5cblxuLy8gdmFyIHRob21Kb25lcyA9XG4vLyBcdFx0e1xuLy8gXHRcdFx0bmFtZTogJ1Rob20gSm9uZXMnLFxuLy8gXHRcdFx0YXZhdGFyOiAnYXNzZXRzL2ltZy90aG9tLWpvbmVzLmpwZycsXG4vLyBcdFx0XHRpZDogMVxuLy8gXHRcdH07XG4vLyB2YXIgdG9tSm9uZXMgPSBcbi8vIFx0XHR7XG4vLyBcdFx0XHRuYW1lOiAnVG9tIEpvbmVzJyxcbi8vIFx0XHRcdGF2YXRhcjogJ2Fzc2V0cy9pbWcvdG9tLWpvbmVzLmpwZycsXG4vLyBcdFx0XHRpZDogMlxuLy8gXHRcdH07XG4vLyB2YXIgZXYgPSBcbi8vIFx0XHR7XG4vLyBcdFx0XHRuYW1lOiAnRXZhbiBUdXJuZXInLFxuLy8gXHRcdFx0YXZhdGFyOiAnaHR0cDovL2V2dHVybi5jb20vYXNzZXRzL2ltZy9ldi13aW50ZXIteWVsbG93LmpwZycsXG4vLyBcdFx0XHRpZDogM1xuLy8gXHRcdH07XG5cbi8vIHZhciBjb252bzEgPSBuZXcgQ29udmVyc2F0aW9uKHtcdFx0XHRcdFxuLy8gXHRcdFx0XHRcdHVzZXJzOiBbdG9tSm9uZXMsIHRob21Kb25lc10sXG4vLyBcdFx0XHRcdFx0bWVzc2FnZXM6XHRbXG4vLyBcdFx0XHRcdFx0XHRcdHtcbi8vIFx0XHRcdFx0XHRcdFx0XHR0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4vLyBcdFx0XHRcdFx0XHRcdFx0Y29udGVudDogJ0NyYWlnLCBpdFxcJ3MgaW1wb3J0YW50LiBJIGp1c3Qgc3BpbGxlZCBzYWxzYSBhbGwgb3ZlciBteSBmaWxhcy4nLFxuLy8gXHRcdFx0XHRcdFx0XHRcdHNlbmRlcjogdG9tSm9uZXNcbi8vIFx0XHRcdFx0XHRcdFx0fSxcbi8vIFx0XHRcdFx0XHRcdFx0e1xuLy8gXHRcdFx0XHRcdFx0XHRcdHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbi8vIFx0XHRcdFx0XHRcdFx0XHRjb250ZW50OiAnSVxcbSBub3QgQ3JhaWchJyxcbi8vIFx0XHRcdFx0XHRcdFx0XHRzZW5kZXI6IHRob21Kb25lc1xuLy8gXHRcdFx0XHRcdFx0XHR9LFxuLy8gXHRcdFx0XHRcdFx0XHR7XG4vLyBcdFx0XHRcdFx0XHRcdFx0dGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuLy8gXHRcdFx0XHRcdFx0XHRcdGNvbnRlbnQ6ICdGdWNrIHRoZSBoZWxsIG9mZiEnLFxuLy8gXHRcdFx0XHRcdFx0XHRcdHNlbmRlcjogdGhvbUpvbmVzXG4vLyBcdFx0XHRcdFx0XHRcdH1cbi8vIFx0XHRcdFx0XHRcdF1cbi8vIFx0XHRcdFx0XHR9KTtcbi8vIHZhciBjb252bzIgPSBuZXcgQ29udmVyc2F0aW9uKHtcbi8vIFx0XHRcdFx0dXNlcnM6IFt0b21Kb25lcywgdGhvbUpvbmVzXSxcdFx0XHRcbi8vIFx0XHRcdFx0bWVzc2FnZXM6XHRbXG4vLyBcdFx0XHRcdFx0XHR7XG4vLyBcdFx0XHRcdFx0XHRcdHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbi8vIFx0XHRcdFx0XHRcdFx0Y29udGVudDogJ0NyYWlnLCBpdFxcJ3MgaW1wb3J0YW50LiBJIGp1c3Qgc3BpbGxlZCBzYWxzYSBhbGwgb3ZlciBteSBmaWxhcy4nLFxuLy8gXHRcdFx0XHRcdFx0XHRzZW5kZXI6IHRvbUpvbmVzXG4vLyBcdFx0XHRcdFx0XHR9LFxuLy8gXHRcdFx0XHRcdFx0e1xuLy8gXHRcdFx0XHRcdFx0XHR0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4vLyBcdFx0XHRcdFx0XHRcdGNvbnRlbnQ6ICdJXFxtIG5vdCBDcmFpZyEnLFxuLy8gXHRcdFx0XHRcdFx0XHRzZW5kZXI6IHRob21Kb25lc1xuLy8gXHRcdFx0XHRcdFx0fSxcbi8vIFx0XHRcdFx0XHRcdHtcbi8vIFx0XHRcdFx0XHRcdFx0dGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuLy8gXHRcdFx0XHRcdFx0XHRjb250ZW50OiAnSnVzdCBhdGUgYSBiaXNxdWl0Jyxcbi8vIFx0XHRcdFx0XHRcdFx0c2VuZGVyOiB0b21Kb25lc1xuLy8gXHRcdFx0XHRcdFx0fVxuLy8gXHRcdFx0XHRcdF1cbi8vIFx0XHRcdFx0fSk7XG4vLyB2YXIgY29udm8zID0gbmV3IENvbnZlcnNhdGlvbih7XG4vLyBcdFx0XHRcdHVzZXJzOiBbZXYsIHRob21Kb25lc10sXG4vLyBcdFx0XHRcdG1lc3NhZ2VzOlx0W1xuLy8gXHRcdFx0XHRcdFx0e1xuLy8gXHRcdFx0XHRcdFx0XHR0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4vLyBcdFx0XHRcdFx0XHRcdGNvbnRlbnQ6ICdDcmFpZywgaXRcXCdzIGltcG9ydGFudC4gSSBqdXN0IHNwaWxsZWQgc2Fsc2EgYWxsIG92ZXIgbXkgZmlsYXMuJyxcbi8vIFx0XHRcdFx0XHRcdFx0c2VuZGVyOiB0b21Kb25lc1xuLy8gXHRcdFx0XHRcdFx0fSxcbi8vIFx0XHRcdFx0XHRcdHtcbi8vIFx0XHRcdFx0XHRcdFx0dGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuLy8gXHRcdFx0XHRcdFx0XHRjb250ZW50OiAnSVxcbSBub3QgQ3JhaWchJyxcbi8vIFx0XHRcdFx0XHRcdFx0c2VuZGVyOiB0aG9tSm9uZXNcbi8vIFx0XHRcdFx0XHRcdH0sXG4vLyBcdFx0XHRcdFx0XHR7XG4vLyBcdFx0XHRcdFx0XHRcdHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbi8vIFx0XHRcdFx0XHRcdFx0Y29udGVudDogJ1BsZWFzZSBsZWF2ZSBteSB3aWZlIGluIHRoaXMnLFxuLy8gXHRcdFx0XHRcdFx0XHRzZW5kZXI6IGV2XG4vLyBcdFx0XHRcdFx0XHR9XG4vLyBcdFx0XHRcdFx0XX0pO1xuXG4vLyB2YXIgdTIgPSBuZXcgVXNlcih0aG9tSm9uZXMpO1xuXG4vLyB2YXIgdTEgPSBuZXcgVXNlcih7XG4vLyBcdFx0XHRuYW1lOiAnVG9tIEpvbmVzJyxcbi8vIFx0XHRcdGF2YXRhcjogJ2h0dHA6Ly9hNS5maWxlcy5iaW9ncmFwaHkuY29tL2ltYWdlL3VwbG9hZC9jX2ZpbGwsY3Nfc3JnYixkcHJfMS4wLGdfZmFjZSxoXzMwMCxxXzgwLHdfMzAwL01URTFPREEwT1RjeU1EQTFOamc0T0RRMS5qcGcnLFxuLy8gXHRcdFx0aW5ib3g6IFxuLy8gXHRcdFx0XHRbXG4vLyBcdFx0XHRcdFx0Y29udm8xLFxuLy8gXHRcdFx0XHRcdGNvbnZvMixcbi8vIFx0XHRcdFx0XHRjb252bzNcbi8vIFx0XHRcdFx0XSxcdFxuLy8gXHRcdFx0aWQ6IDFcbi8vIFx0XHR9KTtcblxuXG4vLyBuZXcgV09XKFxuLy8gICAgIHsgb2Zmc2V0OiAxMjAgfVxuLy8gKS5pbml0KCk7XG5cblxuLy8gbmV3IENoYXRib3goKTtcbiIsIlxuLy8gVGhlIENoYXRDbGllbnQgaXMgaW1wbGVtZW50ZWQgb24gbWFpbi5qcy5cbi8vIFRoZSBjaGF0Y2xpZW50IGlzIGEgY29uc3RydWN0b3IgZnVuY3Rpb24gb24gdGhlIE1haW5Db250cm9sbGVyLlxuLy8gSXQgYm90aCBsaXN0ZW5zIHRvIGFuZCBlbWl0cyBldmVudHMgb24gdGhlIHNvY2tldCwgZWc6XG4vLyBJdCBoYXMgaXRzIG93biBtZXRob2RzIHRoYXQsIHdoZW4gY2FsbGVkLCBlbWl0IHRvIHRoZSBzb2NrZXQgdy8gZGF0YS5cbi8vIEl0IGFsc28gc2V0cyByZXNwb25zZSBsaXN0ZW5lcnMgb24gY29ubmVjdGlvbiwgdGhlc2UgcmVzcG9uc2UgbGlzdGVuZXJzXG4vLyBsaXN0ZW4gdG8gdGhlIHNvY2tldCBhbmQgdHJpZ2dlciBldmVudHMgb24gdGhlIGFwcEV2ZW50QnVzIG9uIHRoZSBcbi8vIE1haW5Db250cm9sbGVyXG52YXIgQ2hhdENsaWVudCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0Ly8gaXMtdHlwaW5nIGhlbHBlciB2YXJpYWJsZXNcblx0dmFyIFRZUElOR19USU1FUl9MRU5HVEggPSA0MDA7IC8vIG1zXG4gIHZhciB0eXBpbmcgPSBmYWxzZTtcbiAgdmFyIGxhc3RUeXBpbmdUaW1lO1xuICBcbiAgLy8gdGhpcyB2ZW50IGhvbGRzIHRoZSBhcHBFdmVudEJ1c1xuXHRzZWxmLnZlbnQgPSBvcHRpb25zLnZlbnQ7XG5cblx0c2VsZi5ob3N0bmFtZSA9ICdodHRwOi8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xuXG4gIC8vIGNvbm5lY3RzIHRvIHNvY2tldCwgc2V0cyByZXNwb25zZSBsaXN0ZW5lcnNcblx0c2VsZi5jb25uZWN0ID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly8gdGhpcyBpbyBtaWdodCBiZSBhIGxpdHRsZSBjb25mdXNpbmcuLi4gd2hlcmUgaXMgaXQgY29taW5nIGZyb20/XG5cdFx0Ly8gaXQncyBjb21pbmcgZnJvbSB0aGUgc3RhdGljIG1pZGRsZXdhcmUgb24gc2VydmVyLmpzIGJjIGV2ZXJ5dGhpbmdcblx0XHQvLyBpbiB0aGUgL3B1YmxpYyBmb2xkZXIgaGFzIGJlZW4gYXR0YWNoZWQgdG8gdGhlIHNlcnZlciwgYW5kIHZpc2Fcblx0XHQvLyB2ZXJzYS5cblx0XHRzZWxmLnNvY2tldCA9IGlvLmNvbm5lY3Qoc2VsZi5ob3N0bmFtZSk7XG5cdFx0c2VsZi5zZXRSZXNwb25zZUxpc3RlbmVycyhzZWxmLnNvY2tldCk7XG5cdH07XG5cbiAgICAvLy8vLyBWaWV3RXZlbnRCdXMgbWV0aG9kcyAvLy8vXG4gICAgLy8gbWV0aG9kcyB0aGF0IGVtaXQgdG8gdGhlIGNoYXRzZXJ2ZXJcblx0XHQvLyBlbWl0cyBsb2dpbiBldmVudCB0byBjaGF0c2VydmVyXG5cdHNlbGYubG9naW4gPSBmdW5jdGlvbihuYW1lKSB7XG5cdFx0c2VsZi5zb2NrZXQuZW1pdChcImxvZ2luXCIsIG5hbWUpO1xuXHR9O1xuICAgIC8vIGVtaXRzIGNoYXQgZXZlbnQgdG8gY2hhdHNlcnZlclxuXHRzZWxmLmNoYXQgPSBmdW5jdGlvbihjaGF0KSB7XG5cdFx0c2VsZi5zb2NrZXQuZW1pdChcImNoYXRcIiwgY2hhdCk7XG5cdH07XG5cblxuICAvLyBUeXBpbmcgbWV0aG9kc1xuXHRzZWxmLmFkZENoYXRUeXBpbmcgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIG1lc3NhZ2UgPSBkYXRhLnVzZXJuYW1lICsgJyBpcyB0eXBpbmcnO1xuICAgICQoJy50eXBldHlwZXR5cGUnKS50ZXh0KG1lc3NhZ2UpO1xuXHR9O1xuXG5cdHNlbGYucmVtb3ZlQ2hhdFR5cGluZyA9IGZ1bmN0aW9uKCkge1xuICAgICQoJy50eXBldHlwZXR5cGUnKS5lbXB0eSgpO1xuXHR9O1xuXG4gIHNlbGYudXBkYXRlVHlwaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHNlbGYuc29ja2V0KSB7XG4gICAgICBpZiAoIXR5cGluZykge1xuICAgICAgICB0eXBpbmcgPSB0cnVlO1xuICAgICAgICBzZWxmLnNvY2tldC5lbWl0KCd0eXBpbmcnKTtcbiAgICAgIH1cbiAgICAgIGxhc3RUeXBpbmdUaW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcblxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHR5cGluZ1RpbWVyID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgICAgICAgdmFyIHRpbWVEaWZmID0gdHlwaW5nVGltZXIgLSBsYXN0VHlwaW5nVGltZTtcbiAgICAgICAgaWYgKHRpbWVEaWZmID49IFRZUElOR19USU1FUl9MRU5HVEggJiYgdHlwaW5nKSB7XG4gICAgICAgICAgIHNlbGYuc29ja2V0LmVtaXQoJ3N0b3AgdHlwaW5nJyk7XG4gICAgICAgICAgIHR5cGluZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9LCBUWVBJTkdfVElNRVJfTEVOR1RIKTtcbiAgICB9XG4gIH07XG5cblxuXG4gIC8vIGNoYXRzZXJ2ZXIgbGlzdGVuZXJzXG4gIC8vIHRoZXNlIGd1eXMgbGlzdGVuIHRvIHRoZSBjaGF0c2VydmVyL3NvY2tldCBhbmQgZW1pdCBkYXRhIHRvIG1haW4uanMsXG4gIC8vIHNwZWNpZmljYWxseSB0byB0aGUgYXBwRXZlbnRCdXMuXG5cdHNlbGYuc2V0UmVzcG9uc2VMaXN0ZW5lcnMgPSBmdW5jdGlvbihzb2NrZXQpIHtcblx0XHQvLyBjbGllbnQgbGlzdGVuZXJzIHRoYXQgbGlzdGVuIHRvIHRoZSBjaGF0c2VydmVyIGFuZCBpdHNlbGYuXG5cdFx0Ly8gRWFjaCBzZXJ2ZXIgZXZlbnQgdHJpZ2dlcnMgYW4gYXBwRXZlbnRCdXMgZXZlbnQgcGFpcmVkIHdpdGggXG5cdFx0Ly8gcmVsZXZhbnQgZGF0YS5cblxuXHRcdHNvY2tldC5vbignd2VsY29tZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIC8vIGVtaXRzIGV2ZW50IHRvIHJlY2FsaWJyYXRlIG9ubGluZVVzZXJzIGNvbGxlY3Rpb25cbiAgICAgIHNvY2tldC5lbWl0KFwib25saW5lVXNlcnNcIik7XG5cdFx0XHRjb25zb2xlLmxvZygnb25saW5lVXNlcnMxOiAnLCBkYXRhKTtcbiAgICAgIC8vIGRhdGEgaXMgdW5kZWZpbmVkIGF0IHRoaXMgcG9pbnQgYmVjYXVzZSBpdCdzIHRoZSBmaXJzdCB0b1xuICAgICAgLy8gZmlyZSBvZmYgYW4gZXZlbnQgY2hhaW4gdGhhdCB3aWxsIGFwcGVuZCB0aGUgbmV3IHVzZXIgdG8gXG4gICAgICAvLyB0aGUgb25saW5lVXNlciBjb2xsZWN0aW9uXG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcImxvZ2luRG9uZVwiLCBkYXRhKTtcbiAgICB9KTtcblxuXHRcdHNvY2tldC5vbignbG9naW5OYW1lRXhpc3RzJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgLy8gZGF0YSA9PT0gc3RyaW5nIG9mIHVzZWQgdXNlcm5hbWVcblx0XHRcdGNvbnNvbGUubG9nKCdsb2dpbk5hbWVFeGlzdHM6ICcsIGRhdGEpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJsb2dpbk5hbWVFeGlzdHNcIiwgZGF0YSk7XG5cdFx0fSk7XG5cdFx0c29ja2V0Lm9uKCdsb2dpbk5hbWVCYWQnLCBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHQvLyBkYXRhID09PSBzdHJpbmcgb2YgYmFkIHVzZXJuYW1lXG5cdFx0XHRjb25zb2xlLmxvZygnbG9naW5OYW1lQmFkOiAnLCBkYXRhKTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwibG9naW5OYW1lQmFkXCIsIGRhdGEpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gdGhpcyBpcyB0aGUgc2Vjb25kIGxpc3RlbmVyIHRvIG9ubGluZVVzZXJzXG5cdFx0Ly8gYnkgdGhlIHRpbWUgdGhpcyBpcyBjYWxsZWQsIHRoZSBuZXcgdXNlciBoYXMgYmVlbiBhZGRlZCB0b1xuXHRcdC8vIHRoZSB1c2VyIGNvbGxlY3Rpb24uXG5cdFx0c29ja2V0Lm9uKCdvbmxpbmVVc2VycycsIGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdC8vIHRoaXMgZGF0YSBpcyBhbiBhcnJheSB3aXRoIGFsbCB0aGUgb25saW5lIHVzZXIncyB1c2VybmFtZXMuXG5cdFx0XHRzZWxmLnZlbnQudHJpZ2dlcihcInVzZXJzSW5mb1wiLCBkYXRhKTtcblx0XHR9KTtcblxuXHRcdHNvY2tldC5vbigndXNlckpvaW5lZCcsIGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdC8vIGRhdGEgPT09IHVzZXJuYW1lIG9mIHVzZXIgam9pbmVkXG5cdFx0XHRjb25zb2xlLmxvZygndXNlckpvaW5lZDogJywgZGF0YSk7XG5cdFx0XHRzZWxmLnZlbnQudHJpZ2dlcihcInVzZXJKb2luZWRcIiwgZGF0YSk7XG5cdFx0fSk7XG5cdFx0c29ja2V0Lm9uKCd1c2VyTGVmdCcsIGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdC8vIGRhdGEgPT09IHVzZXJuYW1lIG9mIHVzZXIgcmVtb3ZlZFxuXHRcdFx0Y29uc29sZS5sb2coJ3VzZXJMZWZ0OiAnLCBkYXRhKTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwidXNlckxlZnRcIiwgZGF0YSk7XG5cdFx0fSk7XG5cdFx0c29ja2V0Lm9uKCdjaGF0JywgZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0Ly8gZGF0YSA9PT0gY2hhdCBtZXNzYWdlIG9iamVjdFxuXHRcdFx0Y29uc29sZS5sb2coJ2NoYXQ6ICcsIGRhdGEpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJjaGF0UmVjZWl2ZWRcIiwgZGF0YSk7XG5cdFx0fSk7XG5cblxuICAgIC8vIHRoZXNlIGd1eXMgbGlzdGVuIHRvIHRoZSBzZXJ2ZXIsIFxuICAgIC8vIHRoZW4gY2FsbCBjaGF0Y2xpZW50IG1ldGhvZHMgbGlzdGVkIGFib3ZlXG4gICAgc29ja2V0Lm9uKCd0eXBpbmcnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBzZWxmLmFkZENoYXRUeXBpbmcoZGF0YSk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdzdG9wIHR5cGluZycsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5yZW1vdmVDaGF0VHlwaW5nKCk7XG4gICAgfSk7XG5cblxuXG5cblxuXHR9O1xufTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIHZhciBDaGF0cm9vbVJvdXRlciA9IEJhY2tib25lLlJvdXRlci5leHRlbmQoe1xuICAgIFxuICAgIHJvdXRlczoge1xuICAgICAgJyc6ICdzdGFydCcsXG4gICAgfSxcblxuICAgIHN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlciA9IG5ldyBhcHAuTWFpbkNvbnRyb2xsZXIoKTtcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlci5pbml0KCk7XG4gICAgfSxcblxuICB9KTtcblxuICBhcHAuQ2hhdHJvb21Sb3V0ZXIgPSBuZXcgQ2hhdHJvb21Sb3V0ZXIoKTtcbiAgQmFja2JvbmUuaGlzdG9yeS5zdGFydCgpO1xuXG59KSgpOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==