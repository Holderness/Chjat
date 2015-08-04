
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
  loadModel: function() {
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
      'keypress': 'onHitEnter'
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
    onLogin: function(e) {
      // triggers the login event and passing the username data to js/main.js
      var this_ = this;
    $.ajax({
        url: "/login",
        method: 'POST',
        data: {username: this.$('#username').val(), password: this.$('#password').val()},
        success: function(data) {
           console.log('success data: ', data);
           if (data === 200) {
             // this_.vent.trigger('authenticated');
            app.ChatroomRouter.navigate('authenticated', { trigger: true });
        this_.vent.trigger("login", {username: this_.$('#username').val(), password: this_.$('#password').val()});
           }
        }
      }).done(function() {
        console.log('doneeeeeeee');
      });
    },
    // onHitEnter: function(e) {
    //   if(e.keyCode == 13) {
    //     this.onLogin();
    //     return false;
    //   }
    // }
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
    debugger;
		// this io might be a little confusing... where is it coming from?
		// it's coming from the static middleware on server.js bc everything
		// in the /public folder has been attached to the server, and visa
		// versa.
    console.log(self.hostname);
		self.socket = io.connect(self.hostname);
    self.setResponseListeners(self.socket);
  };

  self.connectToRoom = function(name) {
    debugger;

    console.log('self.socket: ', self.socket);
    self.socket.emit("connectToRoom", name);

  };

  self.getChatroomModel = function(name) {
    self.socket.emit("getChatroomModel", name);
  };


///// ViewEventBus methods ////
    // methods that emit to the chatserver
  self.login = function(user) {
    // emits login event to chatserver
    debugger;
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
         debugger;


		socket.on('welcome', function(data) {
      // emits event to recalibrate onlineUsers collection
      // socket.emit("getOnlineUsers");
      // socket.emit("rooms");
      debugger;
			console.log('onlineUsers1: ', data);
      // data is undefined at this point because it's the first to
      // fire off an event chain that will append the new user to 
      // the onlineUser collection
 
      self.vent.trigger("loginDone", data);
    });


    socket.on('log', function() {
      debugger;
      self.vent.trigger('authenticated');
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
      debugger;
      self.vent.trigger("setRoom", name);
    });
    socket.on('chatlog', function(chatlog) {
      debugger;
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
      debugger;
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

    // $(window).on('beforeunload', function(){
    //   socket.close();
    // });

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
    
  //   if (!self.chatClient) {
  //     debugger;
		// self.chatClient = new ChatClient({ vent: self.appEventBus });
		// self.chatClient.connect();

  //   }

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
      self.containerModel.set('viewState', self.chatroomView);
      // = new app.ContainerModel({ viewState: self.chatroomView});
      // self.containerView = new app.ContainerView({ model: self.containerModel });
      // self.containerView.render();



      // self.containerModel.set("viewState", self.chatroomView);

      autosize($('textarea.message-input'));
      $('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
       
       // self.chatClient = new ChatClient({ vent: self.appEventBus });
       console.log('self.chatClient.socket', self.chatClient.socket);
      console.log('authent');
      setTimeout(function(){
        self.chatClient.connectToRoom("DOO");
      }, 7000);



    });

  };


  // self.appEventBus.on("authenticated", function() {
  //   debugger;
  //   self.authenticated();
  // });



  ////////////  Busses ////////////
    // These Busses listen to the socketclient
   //    ---------------------------------


  //// viewEventBus Listeners /////
  
	self.viewEventBus.on("login", function(user) {
    // socketio login, sends name to socketclient, socketclient sends it to chatserver
    debugger;
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
    debugger;
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
      debugger;
        var newList = new app.ChatCollection(model.chatlog);
    self.chatroomModel.set('chatlog', newList);


    var newList = new app.ChatroomList(model.chatrooms);
    self.chatroomModel.set('chatrooms', newList);

    var newList = new app.UserCollection(model.onlineUsers);
    self.chatroomModel.set('onlineUsers', newList);

  });


  self.appEventBus.on("ChatroomModel", function(model) {
    self.chatroomModel = new app.ChatroomModel();
    self.chatroomList = new app.ChatroomList();
    self.chatroomView  = new app.ChatroomView({vent: self.viewEventBus, model: self.chatroomModel, collection: self.chatroomList});
    self.containerModel.set('viewState', self.chatroomView);
    self.chatroomModel.loadModel(model);
    // self.chatroomModel.loadModel(model);
  });

  // adds new user to users collection, sends default joining message
	self.appEventBus.on("userJoined", function(username) {
		self.chatroomModel.addUser(username);
		self.chatroomModel.addChat({sender: "Butters", message: username + " joined room." });
	});

	// removes user from users collection, sends default leaving message
	self.appEventBus.on("userLeft", function(username) {
    debugger;
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
    // $('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
  });
  
  self.appEventBus.on("setChatrooms", function(chatrooms) {
    var newList = new app.ChatroomList(chatrooms);
    self.chatroomModel.set('chatrooms', newList);
  });

    self.appEventBus.on("setOnlineUsers", function(onlineUsers) {
    var newList = new app.UserCollection(onlineUsers);
    self.chatroomModel.set('onlineUsers', newList);
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
      // app.mainController = new app.MainController();
      app.mainController.authenticated();
    }

  });

  app.ChatroomRouter = new ChatroomRouter();
  Backbone.history.start();

})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYXQuanMiLCJjb250YWluZXIuanMiLCJsb2dpbi5qcyIsInVzZXIuanMiLCJjaGF0cm9vbS5qcyIsInJvb20uanMiLCJyZWdpc3Rlci5qcyIsInNvY2tldGNsaWVudC5qcyIsIm1haW4uanMiLCJyb3V0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUhQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBR1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QURWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FIaEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FJbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNU5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM1FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLkNoYXRDb2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe1xuICAgIG1vZGVsOiBhcHAuQ2hhdE1vZGVsXG4gIH0pO1xuXG59KSgpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5Db250YWluZXJWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIGVsOiAnI3ZpZXctY29udGFpbmVyJyxcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLm1vZGVsLm9uKFwiY2hhbmdlOnZpZXdTdGF0ZVwiLCB0aGlzLnJlbmRlciwgdGhpcyk7XG4gICAgfSxcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHZpZXcgPSB0aGlzLm1vZGVsLmdldCgndmlld1N0YXRlJyk7XG4gICAgICB0aGlzLiRlbC5odG1sKHZpZXcucmVuZGVyKCkuZWwpO1xuICAgIH1cbiAgfSk7XG5cbn0pKGpRdWVyeSk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbiAgYXBwLkxvZ2luVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjbG9naW4nKS5odG1sKCkpLFxuICAgIGV2ZW50czoge1xuICAgICAgJ3N1Ym1pdCc6ICdvbkxvZ2luJyxcbiAgICAgICdrZXlwcmVzcyc6ICdvbkhpdEVudGVyJ1xuICAgIH0sXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIC8vIExvZ2luVmlldyBnZXRzIHBhc3NlZCB0aGUgdmlld0V2ZW50QnVzIHdoZW4gdGhlIE1haW5Db250cm9sbGVyIGlzIGluaXRpYWxpemVkXG4gICAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XG5cbiAgICAvLyBUaGlzIHRlbGxzIHRoZSB2aWV3IHRvIGxpc3RlbiB0byBhbiBldmVudCBvbiBpdHMgbW9kZWwsXG4gICAgLy8gaWYgdGhlcmUncyBhbiBlcnJvciwgdGhlIGNhbGxiYWNrICh0aGlzLnJlbmRlcikgaXMgY2FsbGVkIHdpdGggdGhlICBcbiAgICAvLyB2aWV3IGFzIGNvbnRleHRcbiAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJjaGFuZ2U6ZXJyb3JcIiwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzLm1vZGVsLnRvSlNPTigpKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIG9uTG9naW46IGZ1bmN0aW9uKGUpIHtcbiAgICAgIC8vIHRyaWdnZXJzIHRoZSBsb2dpbiBldmVudCBhbmQgcGFzc2luZyB0aGUgdXNlcm5hbWUgZGF0YSB0byBqcy9tYWluLmpzXG4gICAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgICQuYWpheCh7XG4gICAgICAgIHVybDogXCIvbG9naW5cIixcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGRhdGE6IHt1c2VybmFtZTogdGhpcy4kKCcjdXNlcm5hbWUnKS52YWwoKSwgcGFzc3dvcmQ6IHRoaXMuJCgnI3Bhc3N3b3JkJykudmFsKCl9LFxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgIGNvbnNvbGUubG9nKCdzdWNjZXNzIGRhdGE6ICcsIGRhdGEpO1xuICAgICAgICAgICBpZiAoZGF0YSA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgLy8gdGhpc18udmVudC50cmlnZ2VyKCdhdXRoZW50aWNhdGVkJyk7XG4gICAgICAgICAgICBhcHAuQ2hhdHJvb21Sb3V0ZXIubmF2aWdhdGUoJ2F1dGhlbnRpY2F0ZWQnLCB7IHRyaWdnZXI6IHRydWUgfSk7XG4gICAgICAgIHRoaXNfLnZlbnQudHJpZ2dlcihcImxvZ2luXCIsIHt1c2VybmFtZTogdGhpc18uJCgnI3VzZXJuYW1lJykudmFsKCksIHBhc3N3b3JkOiB0aGlzXy4kKCcjcGFzc3dvcmQnKS52YWwoKX0pO1xuICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdkb25lZWVlZWVlZScpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICAvLyBvbkhpdEVudGVyOiBmdW5jdGlvbihlKSB7XG4gICAgLy8gICBpZihlLmtleUNvZGUgPT0gMTMpIHtcbiAgICAvLyAgICAgdGhpcy5vbkxvZ2luKCk7XG4gICAgLy8gICAgIHJldHVybiBmYWxzZTtcbiAgICAvLyAgIH1cbiAgICAvLyB9XG4gIH0pO1xuICBcbn0pKGpRdWVyeSk7IiwiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5Vc2VyQ29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHttb2RlbDogYXBwLlVzZXJNb2RlbH0pO1xuXG59KSgpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG5hcHAuQ2hhdHJvb21WaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjY2hhdHJvb20tdGVtcGxhdGUnKS5odG1sKCkpLFxuICBldmVudHM6IHtcbiAgICAna2V5cHJlc3MgLm1lc3NhZ2UtaW5wdXQnOiAnbWVzc2FnZUlucHV0UHJlc3NlZCcsXG4gICAgJ2NsaWNrIC5jaGF0LWRpcmVjdG9yeSAucm9vbSc6ICdzZXRSb29tJ1xuICB9LFxuICAvLyBpbml0aWFsaXplZCBhZnRlciB0aGUgJ2xvZ2luRG9uZScgZXZlbnRcbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIGNvbnNvbGUubG9nKG9wdGlvbnMpO1xuICAgIC8vIHBhc3NlZCB0aGUgdmlld0V2ZW50QnVzXG4gICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xuICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgLy8gdGhlc2UgZ2V0IHRoZSBjb2xsZWN0aW9uIG9mIG9ubGluZVVzZXJzIGFuZCB1c2VyQ2hhdHMgZnJvbSB0aGUgY2hhdHJvb21Nb2RlbFxuICAgXG5cbiAgfSxcbiAgcmVuZGVyOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHRoaXMubW9kZWwgPSBtb2RlbCB8fCB0aGlzLm1vZGVsO1xuICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSgpKTtcbiAgICAgICAgLy8gdGhpcy5yZW5kZXJDaGF0cygpO1xuICAgIC8vIHRoaXMuc2V0Q2hhdENvbGxlY3Rpb24oKTtcbiAgICAvLyB0aGlzLnJlbmRlclVzZXJzKCk7XG4gICAgdGhpcy5zZXRDaGF0TGlzdGVuZXJzKCk7XG4gICAgLy8gdGhpcy5yZW5kZXJSb29tcygpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIC8vIHNldENoYXRDb2xsZWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgLy8gICAgIHRoaXMudXNlckNoYXRzID0gbmV3IGFwcC5DaGF0Q29sbGVjdGlvbihbXG4gIC8vICAgICAgIC8vIG1lc3NhZ2UgYW5kIHNlbmRlciB1cG9uIGVudGVyaW5nIGNoYXRyb29tXG4gIC8vICAgICAgIG5ldyBhcHAuQ2hhdE1vZGVsKHsgc2VuZGVyOiAnQnV0dGVycycsIG1lc3NhZ2U6ICdhd3d3d3d3IGhhbWJ1cmdlcnMuIHx8KTp8fCcsIHRpbWVzdGFtcDogXy5ub3coKSB9KVxuICAvLyAgICAgXSk7XG4gIC8vIH0sXG4gIHNldENoYXRMaXN0ZW5lcnM6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3RvcExpc3RlbmluZygpO1xuXG5cbiAgICAvLyB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiZ2V0Q2hhdHJvb21Nb2RlbFwiLCB0aGlzLmdldENoYXRyb29tTW9kZWwsIHRoaXMpO1xuXG5cbiAgICAvLyB2YXIgb25saW5lVXNlcnMgPSB0aGlzLm1vZGVsLmdldCgnb25saW5lVXNlcnMnKTtcbiAgIC8vIHNldHMgZXZlbnQgbGlzdGVuZXJzIG9uIHRoZSBjb2xsZWN0aW9uc1xuICAgIC8vIHRoaXMubGlzdGVuVG8ob25saW5lVXNlcnMsIFwiYWRkXCIsIHRoaXMucmVuZGVyVXNlciwgdGhpcyk7XG4gICAgLy8gdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJyZW1vdmVcIiwgdGhpcy5yZW5kZXJVc2VycywgdGhpcyk7XG4gICAgLy8gdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJyZXNldFwiLCB0aGlzLnJlbmRlclVzZXJzLCB0aGlzKTtcbiAgICAgICAgLy8gdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJjaGFuZ2VcIiwgdGhpcy5yZW5kZXJVc2VycywgdGhpcyk7XG5cbiAgICAvLyB2YXIgY2hhdGxvZyA9IHRoaXMubW9kZWwuZ2V0KCdjaGF0bG9nJyk7XG4gICAgLy8gdGhpcy5saXN0ZW5UbyhjaGF0bG9nLCBcImFkZFwiLCB0aGlzLnJlbmRlckNoYXQsIHRoaXMpO1xuICAgIC8vIHRoaXMubGlzdGVuVG8oY2hhdGxvZywgXCJyZW1vdmVcIiwgdGhpcy5yZW5kZXJDaGF0cywgdGhpcyk7XG4gICAgLy8gdGhpcy5saXN0ZW5UbyhjaGF0bG9nLCBcInJlc2V0XCIsIHRoaXMucmVuZGVyQ2hhdHMsIHRoaXMpO1xuICAgIC8vIHRoaXMubGlzdGVuVG8oY2hhdGxvZywgXCJjaGFuZ2VcIiwgdGhpcy5yZW5kZXJDaGF0cywgdGhpcyk7XG5cbiAgICAvLyB2YXIgY2hhdHJvb21zID0gdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tcycpO1xuXG4gICAgLy8gdGhpcy5saXN0ZW5UbyhjaGF0cm9vbXMsIFwiYWRkXCIsIHRoaXMucmVuZGVyUm9vbSwgdGhpcyk7XG4gICAgLy8gdGhpcy5saXN0ZW5UbyhjaGF0cm9vbXMsIFwicmVtb3ZlXCIsIHRoaXMucmVuZGVyUm9vbXMsIHRoaXMpO1xuICAgIC8vIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcInJlc2V0XCIsIHRoaXMucmVuZGVyUm9vbXMsIHRoaXMpO1xuICAgIC8vIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcImNoYW5nZVwiLCB0aGlzLnJlbmRlclJvb21zLCB0aGlzKTtcblxuICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJjaGFuZ2U6b25saW5lVXNlcnNcIiwgdGhpcy5yZW5kZXJVc2VycywgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImNoYW5nZTpjaGF0bG9nXCIsIHRoaXMucmVuZGVyQ2hhdHMsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJjaGFuZ2U6Y2hhdHJvb21zXCIsIHRoaXMucmVuZGVyUm9vbXMsIHRoaXMpO1xuXG4gICAgLy8gdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImdvcnBcIiwgdGhpcy5nb3JwLCB0aGlzKTtcbiAgICAvLyB0aGlzLm1vZGVsLm9uKCdnb3JwJywgZnVuY3Rpb24oY2hhdCkge1xuICAgIC8vICAgdGhpcy5nb3JwKGNoYXQpO1xuICAgIC8vIH0pO1xuXG5cblxuXG4gIH0sXG5cbiAgZ29ycDogZnVuY3Rpb24oY2hhdCkge1xuICAgIHZhciBub3cgPSBfLm5vdygpO1xuXG4gICAgdGhpcy51c2VyQ2hhdHMuYWRkKG5ldyBhcHAuQ2hhdE1vZGVsKHsgc2VuZGVyOiBjaGF0LnNlbmRlciwgbWVzc2FnZTogY2hhdC5tZXNzYWdlLCB0aW1lc3RhbXA6IG5vd30pKTtcbiAgfSxcbiAgZ2V0Q2hhdHJvb21Nb2RlbDogZnVuY3Rpb24obmFtZSkge1xuICAgIHRoaXMudmVudC50cmlnZ2VyKCdnZXRDaGF0cm9vbU1vZGVsJywgbmFtZSk7XG4gIH0sXG4gIC8vIHJlbmRlcnMgb24gZXZlbnRzLCBjYWxsZWQganVzdCBhYm92ZVxuICByZW5kZXJVc2VyczogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy4kKCcub25saW5lLXVzZXJzJykuZW1wdHkoKTtcbiAgICB0aGlzLm1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpLmVhY2goZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgIHRoaXMucmVuZGVyVXNlcih1c2VyKTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyVXNlcjogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBfLnRlbXBsYXRlKCQoXCIjb25saW5lLXVzZXJzLWxpc3QtdGVtcGxhdGVcIikuaHRtbCgpKTtcbiAgICB0aGlzLiQoJy5vbmxpbmUtdXNlcnMnKS5hcHBlbmQodGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgfSxcbiAgcmVuZGVyQ2hhdHM6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuJCgnLmNoYXRib3gtY29udGVudCcpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoJ2NoYXRsb2cnKS5lYWNoKGZ1bmN0aW9uKGNoYXQpIHtcbiAgICAgIHRoaXMucmVuZGVyQ2hhdChjaGF0KTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyQ2hhdDogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBfLnRlbXBsYXRlKCQoJyNjaGF0Ym94LW1lc3NhZ2UtdGVtcGxhdGUnKS5odG1sKCkpO1xuICAgIHZhciBlbGVtZW50ID0gJCh0ZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICAgIGVsZW1lbnQuYXBwZW5kVG8odGhpcy4kKCcuY2hhdGJveC1jb250ZW50JykpLmhpZGUoKS5mYWRlSW4oKS5zbGlkZURvd24oKTtcbiAgICAvLyB0aGlzLiQoJy5uYW5vJykubmFub1Njcm9sbGVyKCk7XG4gICAgLy8gdGhpcy4kKCcubmFubycpLm5hbm9TY3JvbGxlcih7IHNjcm9sbDogJ2JvdHRvbScgfSk7XG4gIH0sXG5cblxuICAvLyByZW5kZXJzIG9uIGV2ZW50cywgY2FsbGVkIGp1c3QgYWJvdmVcbiAgcmVuZGVyUm9vbXM6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuJCgnLnB1YmxpYy1yb29tcy1jb250YWluZXInKS5lbXB0eSgpO1xuICAgIHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbXMnKS5lYWNoKGZ1bmN0aW9uIChyb29tKSB7XG4gICAgICB0aGlzLnJlbmRlclJvb20ocm9vbSk7XG4gICAgfSwgdGhpcyk7XG4gIH0sXG4gIHJlbmRlclJvb206IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gXy50ZW1wbGF0ZSgkKFwiI3Jvb20tbGlzdC10ZW1wbGF0ZVwiKS5odG1sKCkpO1xuICAgIHRoaXMuJCgnLnB1YmxpYy1yb29tcy1jb250YWluZXInKS5hcHBlbmQodGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICAvLyB0aGlzLiQoJy51c2VyLWNvdW50JykuaHRtbCh0aGlzLm1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpLmxlbmd0aCk7XG4gICAgLy8gdGhpcy4kKCcubmFubycpLm5hbm9TY3JvbGxlcigpO1xuICB9LFxuXG4gIGpvaW5Sb29tOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoJ2pvaW5Sb29tJywgbmFtZSk7XG4gICAgdmFyIG1vZGVsID0gdGhpcy5jb2xsZWN0aW9uLmZpbmRXaGVyZSh7bmFtZTogbmFtZX0pO1xuICAgIC8vIHRoaXMuZ2V0Q2hhdENvbGxlY3Rpb24obmFtZSk7XG4gICAgdGhpcy5yZW5kZXIobW9kZWwpO1xuICB9LFxuXG5cbiAgLy9ldmVudHNcbiAgbWVzc2FnZUlucHV0UHJlc3NlZDogZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzICYmICQudHJpbSgkKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgpKS5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBmdW4gZmFjdDogc2VwYXJhdGUgZXZlbnRzIHdpdGggYSBzcGFjZSBpbiB0cmlnZ2VyJ3MgZmlyc3QgYXJnIGFuZCB5b3VcbiAgICAgIC8vIGNhbiB0cmlnZ2VyIG11bHRpcGxlIGV2ZW50cy5cbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiY2hhdFwiLCB0aGlzLiQoJy5tZXNzYWdlLWlucHV0JykudmFsKCkpO1xuICAgICAgdGhpcy4kKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgnJyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwidHlwaW5nXCIpO1xuICAgICAgY29uc29sZS5sb2coJ3d1dCcpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgc2V0Um9vbTogZnVuY3Rpb24oZSkge1xuICAgIHZhciAkdGFyID0gJChlLnRhcmdldCk7XG4gICAgaWYgKCR0YXIuaXMoJ3AnKSkge1xuICAgICAgdGhpcy5qb2luUm9vbSgkdGFyLmRhdGEoJ3Jvb20nKSk7XG4gICAgfVxuICB9XG5cblxuXG5cbn0pO1xuXG59KShqUXVlcnkpOyIsIlxudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuQ2hhdHJvb21MaXN0ID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe1xuICAgIG1vZGVsOiBhcHAuQ2hhdHJvb21Nb2RlbCxcbiAgICB1cmw6ICcvYXBpL2NoYXRyb29tcycsXG4gIH0pO1xuXG59KSgpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5SZWdpc3RlclZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI3JlZ2lzdGVyJykuaHRtbCgpKSxcbiAgICBldmVudHM6IHtcbiAgICAgIFwiY2xpY2sgI3NpZ25VcEJ0blwiOiBcInNpZ25VcFwiXG4gICAgfSxcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSgpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc2lnblVwOiBmdW5jdGlvbigpIHtcbiAgICB9XG4gIH0pO1xuXG59KShqUXVlcnkpOyIsIlxuLy8gVGhlIENoYXRDbGllbnQgaXMgaW1wbGVtZW50ZWQgb24gbWFpbi5qcy5cbi8vIFRoZSBjaGF0Y2xpZW50IGlzIGEgY29uc3RydWN0b3IgZnVuY3Rpb24gb24gdGhlIE1haW5Db250cm9sbGVyLlxuLy8gSXQgYm90aCBsaXN0ZW5zIHRvIGFuZCBlbWl0cyBldmVudHMgb24gdGhlIHNvY2tldCwgZWc6XG4vLyBJdCBoYXMgaXRzIG93biBtZXRob2RzIHRoYXQsIHdoZW4gY2FsbGVkLCBlbWl0IHRvIHRoZSBzb2NrZXQgdy8gZGF0YS5cbi8vIEl0IGFsc28gc2V0cyByZXNwb25zZSBsaXN0ZW5lcnMgb24gY29ubmVjdGlvbiwgdGhlc2UgcmVzcG9uc2UgbGlzdGVuZXJzXG4vLyBsaXN0ZW4gdG8gdGhlIHNvY2tldCBhbmQgdHJpZ2dlciBldmVudHMgb24gdGhlIGFwcEV2ZW50QnVzIG9uIHRoZSBcbi8vIE1haW5Db250cm9sbGVyXG52YXIgQ2hhdENsaWVudCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0Ly8gaXMtdHlwaW5nIGhlbHBlciB2YXJpYWJsZXNcblx0dmFyIFRZUElOR19USU1FUl9MRU5HVEggPSA0MDA7IC8vIG1zXG4gIHZhciB0eXBpbmcgPSBmYWxzZTtcbiAgdmFyIGxhc3RUeXBpbmdUaW1lO1xuICBcbiAgLy8gdGhpcyB2ZW50IGhvbGRzIHRoZSBhcHBFdmVudEJ1c1xuXHRzZWxmLnZlbnQgPSBvcHRpb25zLnZlbnQ7XG5cblx0c2VsZi5ob3N0bmFtZSA9ICdodHRwOi8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xuXG4gIC8vIGNvbm5lY3RzIHRvIHNvY2tldCwgc2V0cyByZXNwb25zZSBsaXN0ZW5lcnNcblx0c2VsZi5jb25uZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgZGVidWdnZXI7XG5cdFx0Ly8gdGhpcyBpbyBtaWdodCBiZSBhIGxpdHRsZSBjb25mdXNpbmcuLi4gd2hlcmUgaXMgaXQgY29taW5nIGZyb20/XG5cdFx0Ly8gaXQncyBjb21pbmcgZnJvbSB0aGUgc3RhdGljIG1pZGRsZXdhcmUgb24gc2VydmVyLmpzIGJjIGV2ZXJ5dGhpbmdcblx0XHQvLyBpbiB0aGUgL3B1YmxpYyBmb2xkZXIgaGFzIGJlZW4gYXR0YWNoZWQgdG8gdGhlIHNlcnZlciwgYW5kIHZpc2Fcblx0XHQvLyB2ZXJzYS5cbiAgICBjb25zb2xlLmxvZyhzZWxmLmhvc3RuYW1lKTtcblx0XHRzZWxmLnNvY2tldCA9IGlvLmNvbm5lY3Qoc2VsZi5ob3N0bmFtZSk7XG4gICAgc2VsZi5zZXRSZXNwb25zZUxpc3RlbmVycyhzZWxmLnNvY2tldCk7XG4gIH07XG5cbiAgc2VsZi5jb25uZWN0VG9Sb29tID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGRlYnVnZ2VyO1xuXG4gICAgY29uc29sZS5sb2coJ3NlbGYuc29ja2V0OiAnLCBzZWxmLnNvY2tldCk7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcImNvbm5lY3RUb1Jvb21cIiwgbmFtZSk7XG5cbiAgfTtcblxuICBzZWxmLmdldENoYXRyb29tTW9kZWwgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcImdldENoYXRyb29tTW9kZWxcIiwgbmFtZSk7XG4gIH07XG5cblxuLy8vLy8gVmlld0V2ZW50QnVzIG1ldGhvZHMgLy8vL1xuICAgIC8vIG1ldGhvZHMgdGhhdCBlbWl0IHRvIHRoZSBjaGF0c2VydmVyXG4gIHNlbGYubG9naW4gPSBmdW5jdGlvbih1c2VyKSB7XG4gICAgLy8gZW1pdHMgbG9naW4gZXZlbnQgdG8gY2hhdHNlcnZlclxuICAgIGRlYnVnZ2VyO1xuXHRcdHNlbGYuc29ja2V0LmVtaXQoXCJsb2dpblwiLCB1c2VyKTtcblx0fTtcbiAgc2VsZi5jaGF0ID0gZnVuY3Rpb24oY2hhdCkge1xuICAgIC8vIGVtaXRzIGNoYXQgZXZlbnQgdG8gY2hhdHNlcnZlclxuXHRcdHNlbGYuc29ja2V0LmVtaXQoXCJjaGF0XCIsIGNoYXQpO1xuXHR9O1xuXG5cbiAgLy8gVHlwaW5nIG1ldGhvZHNcblx0c2VsZi5hZGRDaGF0VHlwaW5nID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciBtZXNzYWdlID0gZGF0YS51c2VybmFtZSArICcgaXMgdHlwaW5nJztcbiAgICAkKCcudHlwZXR5cGV0eXBlJykudGV4dChtZXNzYWdlKTtcblx0fTtcblx0c2VsZi5yZW1vdmVDaGF0VHlwaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgJCgnLnR5cGV0eXBldHlwZScpLmVtcHR5KCk7XG5cdH07XG4gIHNlbGYudXBkYXRlVHlwaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHNlbGYuc29ja2V0KSB7XG4gICAgICBpZiAoIXR5cGluZykge1xuICAgICAgICB0eXBpbmcgPSB0cnVlO1xuICAgICAgICBzZWxmLnNvY2tldC5lbWl0KCd0eXBpbmcnKTtcbiAgICAgIH1cbiAgICAgIGxhc3RUeXBpbmdUaW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0eXBpbmdUaW1lciA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICAgIHZhciB0aW1lRGlmZiA9IHR5cGluZ1RpbWVyIC0gbGFzdFR5cGluZ1RpbWU7XG4gICAgICAgIGlmICh0aW1lRGlmZiA+PSBUWVBJTkdfVElNRVJfTEVOR1RIICYmIHR5cGluZykge1xuICAgICAgICAgICBzZWxmLnNvY2tldC5lbWl0KCdzdG9wIHR5cGluZycpO1xuICAgICAgICAgICB0eXBpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSwgVFlQSU5HX1RJTUVSX0xFTkdUSCk7XG4gICAgfVxuICB9O1xuXG5cbiAgLy8gam9pbiByb29tXG4gIHNlbGYuam9pblJvb20gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdCgnam9pblJvb20nLCBuYW1lKTtcbiAgfTtcblxuICAvLyBzZXQgcm9vbVxuICBzZWxmLnNldFJvb20gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgaWYgKG5hbWUgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuY3VycmVudFJvb20gPSBuYW1lO1xuICAgIH1cbiAgICAvLy8+Pj4+Pj4+IGNoYW5nZXRoaXN0byAuY2hhdC10aXRsZVxuICAgIHZhciAkY2hhdFRpdGxlID0gJCgnLmNoYXRib3gtaGVhZGVyLXVzZXJuYW1lJyk7XG4gICAgJGNoYXRUaXRsZS50ZXh0KG5hbWUpO1xuICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgJCgnLmNoYXQtZGlyZWN0b3J5JykuZmluZCgnLnJvb20nKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyICRyb29tID0gJCh0aGlzKTtcbiAgICAgICRyb29tLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAgIGlmICgkcm9vbS5kYXRhKCduYW1lJykgPT09IHRoaXNfLmN1cnJlbnRSb29tKSB7XG4gICAgICAgICRyb29tLmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbiAgXG5cblxuXG4gIC8vLy8vLy8vLy8vLy8vIGNoYXRzZXJ2ZXIgbGlzdGVuZXJzLy8vLy8vLy8vLy8vL1xuXG4gIC8vIHRoZXNlIGd1eXMgbGlzdGVuIHRvIHRoZSBjaGF0c2VydmVyL3NvY2tldCBhbmQgZW1pdCBkYXRhIHRvIG1haW4uanMsXG4gIC8vIHNwZWNpZmljYWxseSB0byB0aGUgYXBwRXZlbnRCdXMuXG5cdHNlbGYuc2V0UmVzcG9uc2VMaXN0ZW5lcnMgPSBmdW5jdGlvbihzb2NrZXQpIHtcblx0XHQvLyBjbGllbnQgbGlzdGVuZXJzIHRoYXQgbGlzdGVuIHRvIHRoZSBjaGF0c2VydmVyIGFuZCBpdHNlbGYuXG5cdFx0Ly8gRWFjaCBzZXJ2ZXIgZXZlbnQgdHJpZ2dlcnMgYW4gYXBwRXZlbnRCdXMgZXZlbnQgcGFpcmVkIHdpdGggXG5cdFx0Ly8gcmVsZXZhbnQgZGF0YS5cbiAgICAgICAgIGRlYnVnZ2VyO1xuXG5cblx0XHRzb2NrZXQub24oJ3dlbGNvbWUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAvLyBlbWl0cyBldmVudCB0byByZWNhbGlicmF0ZSBvbmxpbmVVc2VycyBjb2xsZWN0aW9uXG4gICAgICAvLyBzb2NrZXQuZW1pdChcImdldE9ubGluZVVzZXJzXCIpO1xuICAgICAgLy8gc29ja2V0LmVtaXQoXCJyb29tc1wiKTtcbiAgICAgIGRlYnVnZ2VyO1xuXHRcdFx0Y29uc29sZS5sb2coJ29ubGluZVVzZXJzMTogJywgZGF0YSk7XG4gICAgICAvLyBkYXRhIGlzIHVuZGVmaW5lZCBhdCB0aGlzIHBvaW50IGJlY2F1c2UgaXQncyB0aGUgZmlyc3QgdG9cbiAgICAgIC8vIGZpcmUgb2ZmIGFuIGV2ZW50IGNoYWluIHRoYXQgd2lsbCBhcHBlbmQgdGhlIG5ldyB1c2VyIHRvIFxuICAgICAgLy8gdGhlIG9ubGluZVVzZXIgY29sbGVjdGlvblxuIFxuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJsb2dpbkRvbmVcIiwgZGF0YSk7XG4gICAgfSk7XG5cblxuICAgIHNvY2tldC5vbignbG9nJywgZnVuY3Rpb24oKSB7XG4gICAgICBkZWJ1Z2dlcjtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKCdhdXRoZW50aWNhdGVkJyk7XG4gICAgfSk7XG5cblx0XHQvLyBzb2NrZXQub24oJ2xvZ2luTmFtZUV4aXN0cycsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgLy8gICAgIC8vIGRhdGEgPT09IHN0cmluZyBvZiB1c2VkIHVzZXJuYW1lXG5cdFx0Ly8gXHRjb25zb2xlLmxvZygnbG9naW5OYW1lRXhpc3RzOiAnLCBkYXRhKTtcblx0XHQvLyBcdHNlbGYudmVudC50cmlnZ2VyKFwibG9naW5OYW1lRXhpc3RzXCIsIGRhdGEpO1xuXHRcdC8vIH0pO1xuXHRcdC8vIHNvY2tldC5vbignbG9naW5OYW1lQmFkJywgZnVuY3Rpb24oZGF0YSkge1xuXHRcdC8vIFx0Ly8gZGF0YSA9PT0gc3RyaW5nIG9mIGJhZCB1c2VybmFtZVxuXHRcdC8vIFx0Y29uc29sZS5sb2coJ2xvZ2luTmFtZUJhZDogJywgZGF0YSk7XG5cdFx0Ly8gXHRzZWxmLnZlbnQudHJpZ2dlcihcImxvZ2luTmFtZUJhZFwiLCBkYXRhKTtcblx0XHQvLyB9KTtcblxuXHRcdC8vIHRoaXMgaXMgdGhlIHNlY29uZCBsaXN0ZW5lciB0byBvbmxpbmVVc2Vyc1xuXHRcdC8vIGJ5IHRoZSB0aW1lIHRoaXMgaXMgY2FsbGVkLCB0aGUgbmV3IHVzZXIgaGFzIGJlZW4gYWRkZWQgdG9cblx0XHQvLyB0aGUgdXNlciBjb2xsZWN0aW9uLlxuXHRcdHNvY2tldC5vbigndXNlcnNJbmZvJywgZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0Ly8gdGhpcyBkYXRhIGlzIGFuIGFycmF5IHdpdGggYWxsIHRoZSBvbmxpbmUgdXNlcidzIHVzZXJuYW1lcy5cblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwidXNlcnNJbmZvXCIsIGRhdGEpO1xuXHRcdH0pO1xuICAgIHNvY2tldC5vbigncm9vbXMnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAvLyB0aGlzIGRhdGEgaXMgYW4gYXJyYXkgd2l0aCBhbGwgdGhlIG9ubGluZSB1c2VyJ3MgdXNlcm5hbWVzLlxuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJyb29tSW5mb1wiLCBkYXRhKTtcbiAgICB9KTtcblxuXHRcdHNvY2tldC5vbigndXNlckpvaW5lZCcsIGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdC8vIGRhdGEgPT09IHVzZXJuYW1lIG9mIHVzZXIgam9pbmVkXG5cdFx0XHRjb25zb2xlLmxvZygndXNlckpvaW5lZDogJywgZGF0YSk7XG4gICAgICBzb2NrZXQuZW1pdChcImdldE9ubGluZVVzZXJzXCIpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJ1c2VySm9pbmVkXCIsIGRhdGEpO1xuXHRcdH0pO1xuXHRcdHNvY2tldC5vbigndXNlckxlZnQnLCBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHQvLyBkYXRhID09PSB1c2VybmFtZSBvZiB1c2VyIHJlbW92ZWRcblx0XHRcdGNvbnNvbGUubG9nKCd1c2VyTGVmdDogJywgZGF0YSk7XG4gICAgICBzb2NrZXQuZW1pdChcImdldE9ubGluZVVzZXJzXCIpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJ1c2VyTGVmdFwiLCBkYXRhKTtcblx0XHR9KTtcblx0XHRzb2NrZXQub24oJ2NoYXQnLCBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHQvLyBkYXRhID09PSBjaGF0IG1lc3NhZ2Ugb2JqZWN0XG5cdFx0XHRjb25zb2xlLmxvZygnY2hhdGRhdGE6ICcsIGRhdGEpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJjaGF0UmVjZWl2ZWRcIiwgZGF0YSk7XG5cdFx0fSk7XG4gICAgc29ja2V0Lm9uKCdzZXRSb29tJywgZnVuY3Rpb24obmFtZSkge1xuICAgICAgZGVidWdnZXI7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldFJvb21cIiwgbmFtZSk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdjaGF0bG9nJywgZnVuY3Rpb24oY2hhdGxvZykge1xuICAgICAgZGVidWdnZXI7XG4gICAgICBjb25zb2xlLmxvZygnIHRoZWlzIGlzIGRleSBjaGF0IGxhd2c6ICcsIGNoYXRsb2cpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRDaGF0bG9nXCIsIGNoYXRsb2cpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbignQ2hhdHJvb21Nb2RlbCcsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICAvLyBzZWxmLnZlbnQudHJpZ2dlcihcIkNoYXRyb29tTW9kZWxcIiwgbW9kZWwpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRSb29tXCIsIG1vZGVsKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ2FjaGF0cm9vbXMnLCBmdW5jdGlvbihjaGF0cm9vbXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdjaGF0cm9vbXM6ICAnLCBjaGF0cm9vbXMpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRDaGF0cm9vbXNcIiwgY2hhdHJvb21zKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ2FvbmxpbmVVc2VycycsIGZ1bmN0aW9uKG9ubGluZVVzZXJzKSB7XG4gICAgICBkZWJ1Z2dlcjtcbiAgICAgIGNvbnNvbGUubG9nKCdvbmxpbmUgdXNlcnM6ICcsIG9ubGluZVVzZXJzKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0T25saW5lVXNlcnNcIiwgb25saW5lVXNlcnMpO1xuICAgIH0pO1xuXG4gICAgLy8gdGhlc2UgZ3V5cyBsaXN0ZW4gdG8gdGhlIHNlcnZlciwgXG4gICAgLy8gdGhlbiBjYWxsIGNoYXRjbGllbnQgbWV0aG9kcyBsaXN0ZWQgYWJvdmVcbiAgICBzb2NrZXQub24oJ3R5cGluZycsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHNlbGYuYWRkQ2hhdFR5cGluZyhkYXRhKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ3N0b3AgdHlwaW5nJywgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnJlbW92ZUNoYXRUeXBpbmcoKTtcbiAgICB9KTtcblxuICAgIC8vICQod2luZG93KS5vbignYmVmb3JldW5sb2FkJywgZnVuY3Rpb24oKXtcbiAgICAvLyAgIHNvY2tldC5jbG9zZSgpO1xuICAgIC8vIH0pO1xuXG5cdH07XG59OyIsIlxuXG5hcHAuTWFpbkNvbnRyb2xsZXIgPSBmdW5jdGlvbigpIHtcblxuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblxuICAvL1RoZXNlIGFsbG93cyB1cyB0byBiaW5kIGFuZCB0cmlnZ2VyIG9uIHRoZSBvYmplY3QgZnJvbSBhbnl3aGVyZSBpbiB0aGUgYXBwLlxuXHRzZWxmLmFwcEV2ZW50QnVzID0gXy5leHRlbmQoe30sIEJhY2tib25lLkV2ZW50cyk7XG5cdHNlbGYudmlld0V2ZW50QnVzID0gXy5leHRlbmQoe30sIEJhY2tib25lLkV2ZW50cyk7XG5cblx0c2VsZi5pbml0ID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly8gY3JlYXRlcyBDaGF0Q2xpZW50IGZyb20gc29ja2V0Y2xpZW50LmpzLCBwYXNzZXMgaW4gXG5cdFx0Ly8gYXBwRXZlbnRCdXMgYXMgdmVudCwgY29ubmVjdHNcbiAgICBcbiAgLy8gICBpZiAoIXNlbGYuY2hhdENsaWVudCkge1xuICAvLyAgICAgZGVidWdnZXI7XG5cdFx0Ly8gc2VsZi5jaGF0Q2xpZW50ID0gbmV3IENoYXRDbGllbnQoeyB2ZW50OiBzZWxmLmFwcEV2ZW50QnVzIH0pO1xuXHRcdC8vIHNlbGYuY2hhdENsaWVudC5jb25uZWN0KCk7XG5cbiAgLy8gICB9XG5cbiAgICAvLyBsb2dpbk1vZGVsXG4gICAgc2VsZi5sb2dpbk1vZGVsID0gbmV3IGFwcC5Mb2dpbk1vZGVsKCk7XG4gICAgc2VsZi5sb2dpblZpZXcgPSBuZXcgYXBwLkxvZ2luVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXMsIG1vZGVsOiBzZWxmLmxvZ2luTW9kZWx9KTtcbiAgICBzZWxmLnJlZ2lzdGVyVmlldyA9IG5ldyBhcHAuUmVnaXN0ZXJWaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cyB9KTtcblxuICAgIC8vIFRoZSBDb250YWluZXJNb2RlbCBnZXRzIHBhc3NlZCBhIHZpZXdTdGF0ZSwgTG9naW5WaWV3LCB3aGljaFxuICAgIC8vIGlzIHRoZSBsb2dpbiBwYWdlLiBUaGF0IExvZ2luVmlldyBnZXRzIHBhc3NlZCB0aGUgdmlld0V2ZW50QnVzXG4gICAgLy8gYW5kIHRoZSBMb2dpbk1vZGVsLlxuICAgIHNlbGYuY29udGFpbmVyTW9kZWwgPSBuZXcgYXBwLkNvbnRhaW5lck1vZGVsKHsgdmlld1N0YXRlOiBzZWxmLmxvZ2luVmlld30pO1xuXG4gICAgLy8gbmV4dCwgYSBuZXcgQ29udGFpbmVyVmlldyBpcyBpbnRpYWxpemVkIHdpdGggdGhlIG5ld2x5IGNyZWF0ZWQgY29udGFpbmVyTW9kZWxcbiAgICAvLyB0aGUgbG9naW4gcGFnZSBpcyB0aGVuIHJlbmRlcmVkLlxuICAgIHNlbGYuY29udGFpbmVyVmlldyA9IG5ldyBhcHAuQ29udGFpbmVyVmlldyh7IG1vZGVsOiBzZWxmLmNvbnRhaW5lck1vZGVsIH0pO1xuICAgIHNlbGYuY29udGFpbmVyVmlldy5yZW5kZXIoKTtcblxuXG4gIH07XG5cbiAgc2VsZi5hdXRoZW50aWNhdGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgXG5cbiAgICBzZWxmLmNoYXRDbGllbnQgPSBuZXcgQ2hhdENsaWVudCh7IHZlbnQ6IHNlbGYuYXBwRXZlbnRCdXMgfSk7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmNvbm5lY3QoKTtcblxuICAgIC8vIG5ldyBtb2RlbCBhbmQgdmlldyBjcmVhdGVkIGZvciBjaGF0cm9vbVxuICAgIHNlbGYuY2hhdHJvb21Nb2RlbCA9IG5ldyBhcHAuQ2hhdHJvb21Nb2RlbCh7IG5hbWU6ICdET08nIH0pO1xuICAgIHNlbGYuY2hhdHJvb21MaXN0ID0gbmV3IGFwcC5DaGF0cm9vbUxpc3QoKTtcbiAgICBzZWxmLmNoYXRyb29tTGlzdC5mZXRjaCgpLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdjaGF0cm9vbXMnLCBzZWxmLmNoYXRyb29tTGlzdCk7XG4gICAgICAvLyBzZWxmLmNoYXRyb29tTW9kZWwubG9hZE1vZGVsKCk7XG4gICAgICBzZWxmLmNoYXRyb29tVmlldyAgPSBuZXcgYXBwLkNoYXRyb29tVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXMsIG1vZGVsOiBzZWxmLmNoYXRyb29tTW9kZWwgfSk7XG4gICAgICBzZWxmLmNvbnRhaW5lck1vZGVsLnNldCgndmlld1N0YXRlJywgc2VsZi5jaGF0cm9vbVZpZXcpO1xuICAgICAgLy8gPSBuZXcgYXBwLkNvbnRhaW5lck1vZGVsKHsgdmlld1N0YXRlOiBzZWxmLmNoYXRyb29tVmlld30pO1xuICAgICAgLy8gc2VsZi5jb250YWluZXJWaWV3ID0gbmV3IGFwcC5Db250YWluZXJWaWV3KHsgbW9kZWw6IHNlbGYuY29udGFpbmVyTW9kZWwgfSk7XG4gICAgICAvLyBzZWxmLmNvbnRhaW5lclZpZXcucmVuZGVyKCk7XG5cblxuXG4gICAgICAvLyBzZWxmLmNvbnRhaW5lck1vZGVsLnNldChcInZpZXdTdGF0ZVwiLCBzZWxmLmNoYXRyb29tVmlldyk7XG5cbiAgICAgIGF1dG9zaXplKCQoJ3RleHRhcmVhLm1lc3NhZ2UtaW5wdXQnKSk7XG4gICAgICAkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnLmNoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcbiAgICAgICBcbiAgICAgICAvLyBzZWxmLmNoYXRDbGllbnQgPSBuZXcgQ2hhdENsaWVudCh7IHZlbnQ6IHNlbGYuYXBwRXZlbnRCdXMgfSk7XG4gICAgICAgY29uc29sZS5sb2coJ3NlbGYuY2hhdENsaWVudC5zb2NrZXQnLCBzZWxmLmNoYXRDbGllbnQuc29ja2V0KTtcbiAgICAgIGNvbnNvbGUubG9nKCdhdXRoZW50Jyk7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIHNlbGYuY2hhdENsaWVudC5jb25uZWN0VG9Sb29tKFwiRE9PXCIpO1xuICAgICAgfSwgNzAwMCk7XG5cblxuXG4gICAgfSk7XG5cbiAgfTtcblxuXG4gIC8vIHNlbGYuYXBwRXZlbnRCdXMub24oXCJhdXRoZW50aWNhdGVkXCIsIGZ1bmN0aW9uKCkge1xuICAvLyAgIGRlYnVnZ2VyO1xuICAvLyAgIHNlbGYuYXV0aGVudGljYXRlZCgpO1xuICAvLyB9KTtcblxuXG5cbiAgLy8vLy8vLy8vLy8vICBCdXNzZXMgLy8vLy8vLy8vLy8vXG4gICAgLy8gVGhlc2UgQnVzc2VzIGxpc3RlbiB0byB0aGUgc29ja2V0Y2xpZW50XG4gICAvLyAgICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXG4gIC8vLy8gdmlld0V2ZW50QnVzIExpc3RlbmVycyAvLy8vL1xuICBcblx0c2VsZi52aWV3RXZlbnRCdXMub24oXCJsb2dpblwiLCBmdW5jdGlvbih1c2VyKSB7XG4gICAgLy8gc29ja2V0aW8gbG9naW4sIHNlbmRzIG5hbWUgdG8gc29ja2V0Y2xpZW50LCBzb2NrZXRjbGllbnQgc2VuZHMgaXQgdG8gY2hhdHNlcnZlclxuICAgIGRlYnVnZ2VyO1xuICAgIHNlbGYuY2hhdENsaWVudC5sb2dpbih1c2VyKTtcbiAgfSk7XG5cdHNlbGYudmlld0V2ZW50QnVzLm9uKFwiY2hhdFwiLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgLy8gc29ja2V0aW8gY2hhdCwgc2VuZHMgY2hhdCB0byBzb2NrZXRjbGllbnQsIHNvY2tldGNsaWVudCB0byBjaGF0c2VydmVyXG4gICAgc2VsZi5jaGF0Q2xpZW50LmNoYXQoY2hhdCk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcInR5cGluZ1wiLCBmdW5jdGlvbigpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQudXBkYXRlVHlwaW5nKCk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImpvaW5Sb29tXCIsIGZ1bmN0aW9uKHJvb20pIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuam9pblJvb20ocm9vbSk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImdldENoYXRyb29tTW9kZWxcIiwgZnVuY3Rpb24obmFtZSkge1xuICAgIGRlYnVnZ2VyO1xuICAgIHNlbGYuY2hhdENsaWVudC5nZXRDaGF0cm9vbU1vZGVsKG5hbWUpO1xuICB9KTtcblxuXG5cblxuXG5cblxuXG4gIC8vLy8gYXBwRXZlbnRCdXMgTGlzdGVuZXJzIC8vLy9cblxuICAvLyBhZnRlciB0aGUgJ3dlbGNvbWUnIGV2ZW50IHRyaWdnZXJzIG9uIHRoZSBzb2NrZWNsaWVudCwgdGhlIGxvZ2luRG9uZSBldmVudCB0cmlnZ2Vycy5cblx0Ly8gc2VsZi5hcHBFdmVudEJ1cy5vbihcImxvZ2luRG9uZVwiLCBmdW5jdGlvbigpIHtcblxuXHQvLyBcdC8vIG5ldyBtb2RlbCBhbmQgdmlldyBjcmVhdGVkIGZvciBjaGF0cm9vbVxuXHQvLyBcdHNlbGYuY2hhdHJvb21Nb2RlbCA9IG5ldyBhcHAuQ2hhdHJvb21Nb2RlbCgpO1xuIC8vICAgIHNlbGYuY2hhdHJvb21MaXN0ID0gbmV3IGFwcC5DaGF0cm9vbUxpc3QoKTtcblx0Ly8gXHRzZWxmLmNoYXRyb29tVmlldyAgPSBuZXcgYXBwLkNoYXRyb29tVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXMsIG1vZGVsOiBzZWxmLmNoYXRyb29tTW9kZWwsIGNvbGxlY3Rpb246IHNlbGYuY2hhdHJvb21MaXN0fSk7XG5cblx0Ly8gXHQvLyB2aWV3c3RhdGUgaXMgY2hhbmdlZCB0byBjaGF0cm9vbSBhZnRlciBsb2dpbi5cblx0Ly8gXHRzZWxmLmNvbnRhaW5lck1vZGVsLnNldChcInZpZXdTdGF0ZVwiLCBzZWxmLmNoYXRyb29tVmlldyk7XG4gLy8gICAgYXV0b3NpemUoJCgndGV4dGFyZWEubWVzc2FnZS1pbnB1dCcpKTtcblx0Ly8gXHQkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnLmNoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcblx0Ly8gfSk7XG5cbiAgLy8gZXJyb3IgbGlzdGVuZXJzXG5cdC8vIHNlbGYuYXBwRXZlbnRCdXMub24oXCJsb2dpbk5hbWVCYWRcIiwgZnVuY3Rpb24odXNlcm5hbWUpIHtcblx0Ly8gXHRzZWxmLmxvZ2luTW9kZWwuc2V0KFwiZXJyb3JcIiwgXCJJbnZhbGlkIE5hbWVcIik7XG5cdC8vIH0pO1xuXHQvLyBzZWxmLmFwcEV2ZW50QnVzLm9uKFwibG9naW5OYW1lRXhpc3RzXCIsIGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG5cdC8vIFx0c2VsZi5sb2dpbk1vZGVsLnNldChcImVycm9yXCIsIFwiTmFtZSBhbHJlYWR5IGV4aXN0c1wiKTtcblx0Ly8gfSk7XG5cblxuXG5cblxuXG5cbiAgLy8gYWZ0ZXIgJ29ubGluZVVzZXJzJyBldmVudCBlbWl0cywgdGhlICd1c2Vyc0luZm8nIGV2ZW50IHRyaWdnZXJzXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2Vyc0luZm9cIiwgZnVuY3Rpb24oZGF0YSkge1xuICAgIC8vZGF0YSBpcyBhbiBhcnJheSBvZiB1c2VybmFtZXMsIGluY2x1ZGluZyB0aGUgbmV3IHVzZXJcblx0XHQvLyBUaGlzIG1ldGhvZCBnZXRzIHRoZSBvbmxpbmUgdXNlcnMgY29sbGVjdGlvbiBmcm9tIGNoYXRyb29tTW9kZWwuXG5cdFx0Ly8gb25saW5lVXNlcnMgaXMgdGhlIGNvbGxlY3Rpb25cblx0XHR2YXIgb25saW5lVXNlcnMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KFwib25saW5lVXNlcnNcIik7XG5jb25zb2xlLmxvZyhcIm9ubGluZVVzZXJzOiAtLS1cIiwgb25saW5lVXNlcnMpO1xuICAgLy8gdXNlcnMgaXMgYXJyYXkgb2YgdGhlIGN1cnJlbnQgdXNlciBtb2RlbHNcblx0XHR2YXIgdXNlcnMgPSBfLm1hcChkYXRhLCBmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRyZXR1cm4gbmV3IGFwcC5Vc2VyTW9kZWwoe3VzZXJuYW1lOiBpdGVtfSk7XG5cdFx0fSk7XG5jb25zb2xlLmxvZyhcInVzZXJzOiAtLS1cIiwgdXNlcnMpO1xuICAgIC8vIHRoaXMgcmVzZXRzIHRoZSBjb2xsZWN0aW9uIHdpdGggdGhlIHVwZGF0ZWQgYXJyYXkgb2YgdXNlcnNcblx0XHRvbmxpbmVVc2Vycy5yZXNldCh1c2Vycyk7XG5cdH0pO1xuXG5cblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJyb29tSW5mb1wiLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgLy8gVGhpcyBtZXRob2QgZ2V0cyB0aGUgb25saW5lIHVzZXJzIGNvbGxlY3Rpb24gZnJvbSBjaGF0cm9vbU1vZGVsLlxuICAgIC8vIG9ubGluZVVzZXJzIGlzIHRoZSBjb2xsZWN0aW9uXG4gICAgdmFyIHJvb21zID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldChcImNoYXRyb29tc1wiKTtcbiAgICAgY29uc29sZS5sb2coXCJST09NUzogXCIsIHJvb21zKTtcblxuICAgLy8gdXNlcnMgaXMgYXJyYXkgb2YgdGhlIGN1cnJlbnQgcm9vbSBtb2RlbHNcbiAgICB2YXIgdXBkYXRlZFJvb21zID0gXy5tYXAoZGF0YSwgZnVuY3Rpb24ocm9vbSkge1xuICAgICAgdmFyIG5ld0NoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoe25hbWU6IHJvb20ubmFtZX0pO1xuXG4gICAgICAvLyBfLm1hcChyb29tLmNoYXRsb2csIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICAgIC8vICAgZGVidWdnZXI7XG4gICAgICAvLyAgIHNlbGYuY2hhdHJvb21WaWV3LnVzZXJDaGF0cy5wdXNoKGNoYXQpO1xuICAgICAgLy8gfSk7XG4gICAgICByZXR1cm4gbmV3Q2hhdHJvb21Nb2RlbDtcbiAgICB9KTtcbmNvbnNvbGUubG9nKFwiVVBEQVRFRCBST09NUzogXCIsIHVwZGF0ZWRSb29tcyk7XG4gICAgLy8gdGhpcyByZXNldHMgdGhlIGNvbGxlY3Rpb24gd2l0aCB0aGUgdXBkYXRlZCBhcnJheSBvZiByb29tc1xuICAgIHJvb21zLnJlc2V0KHVwZGF0ZWRSb29tcyk7XG4gIH0pO1xuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldFJvb21cIiwgZnVuY3Rpb24obW9kZWwpIHtcbiAgLy8gICBpZiAoc2VsZi5jaGF0cm9vbVZpZXcgIT09IHVuZGVmaW5lZCkge1xuICAvLyAgIGRlYnVnZ2VyO1xuICAvLyAgIHNlbGYuY2hhdHJvb21WaWV3LnN0b3BMaXN0ZW5pbmcoKTtcbiAgLy8gICBzZWxmLmNoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoKTtcbiAgLy8gICBzZWxmLmNoYXRyb29tVmlldyAgPSBuZXcgYXBwLkNoYXRyb29tVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXMsIG1vZGVsOiBzZWxmLmNoYXRyb29tTW9kZWwsIGNvbGxlY3Rpb246IHNlbGYuY2hhdHJvb21MaXN0fSk7XG5cbiAgLy8gICAvLyB2aWV3c3RhdGUgaXMgY2hhbmdlZCB0byBjaGF0cm9vbSBhZnRlciBsb2dpbi5cbiAgLy8gICBzZWxmLmNvbnRhaW5lck1vZGVsLnNldChcInZpZXdTdGF0ZVwiLCBzZWxmLmNoYXRyb29tVmlldyk7XG4gIC8vICAgYXV0b3NpemUoJCgndGV4dGFyZWEubWVzc2FnZS1pbnB1dCcpKTtcbiAgLy8gICAkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnLmNoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcbiAgLy8gfVxuICAgIC8vIHNlbGYuY2hhdENsaWVudC5zZXRSb29tKHJvb20pO1xuICAgICAgZGVidWdnZXI7XG4gICAgICAgIHZhciBuZXdMaXN0ID0gbmV3IGFwcC5DaGF0Q29sbGVjdGlvbihtb2RlbC5jaGF0bG9nKTtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdjaGF0bG9nJywgbmV3TGlzdCk7XG5cblxuICAgIHZhciBuZXdMaXN0ID0gbmV3IGFwcC5DaGF0cm9vbUxpc3QobW9kZWwuY2hhdHJvb21zKTtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdjaGF0cm9vbXMnLCBuZXdMaXN0KTtcblxuICAgIHZhciBuZXdMaXN0ID0gbmV3IGFwcC5Vc2VyQ29sbGVjdGlvbihtb2RlbC5vbmxpbmVVc2Vycyk7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnb25saW5lVXNlcnMnLCBuZXdMaXN0KTtcblxuICB9KTtcblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJDaGF0cm9vbU1vZGVsXCIsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsID0gbmV3IGFwcC5DaGF0cm9vbU1vZGVsKCk7XG4gICAgc2VsZi5jaGF0cm9vbUxpc3QgPSBuZXcgYXBwLkNoYXRyb29tTGlzdCgpO1xuICAgIHNlbGYuY2hhdHJvb21WaWV3ICA9IG5ldyBhcHAuQ2hhdHJvb21WaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cywgbW9kZWw6IHNlbGYuY2hhdHJvb21Nb2RlbCwgY29sbGVjdGlvbjogc2VsZi5jaGF0cm9vbUxpc3R9KTtcbiAgICBzZWxmLmNvbnRhaW5lck1vZGVsLnNldCgndmlld1N0YXRlJywgc2VsZi5jaGF0cm9vbVZpZXcpO1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5sb2FkTW9kZWwobW9kZWwpO1xuICAgIC8vIHNlbGYuY2hhdHJvb21Nb2RlbC5sb2FkTW9kZWwobW9kZWwpO1xuICB9KTtcblxuICAvLyBhZGRzIG5ldyB1c2VyIHRvIHVzZXJzIGNvbGxlY3Rpb24sIHNlbmRzIGRlZmF1bHQgam9pbmluZyBtZXNzYWdlXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2VySm9pbmVkXCIsIGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLmFkZFVzZXIodXNlcm5hbWUpO1xuXHRcdHNlbGYuY2hhdHJvb21Nb2RlbC5hZGRDaGF0KHtzZW5kZXI6IFwiQnV0dGVyc1wiLCBtZXNzYWdlOiB1c2VybmFtZSArIFwiIGpvaW5lZCByb29tLlwiIH0pO1xuXHR9KTtcblxuXHQvLyByZW1vdmVzIHVzZXIgZnJvbSB1c2VycyBjb2xsZWN0aW9uLCBzZW5kcyBkZWZhdWx0IGxlYXZpbmcgbWVzc2FnZVxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwidXNlckxlZnRcIiwgZnVuY3Rpb24odXNlcm5hbWUpIHtcbiAgICBkZWJ1Z2dlcjtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwucmVtb3ZlVXNlcih1c2VybmFtZSk7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLmFkZENoYXQoe3NlbmRlcjogXCJCdXR0ZXJzXCIsIG1lc3NhZ2U6IHVzZXJuYW1lICsgXCIgbGVmdCByb29tLlwiIH0pO1xuXHR9KTtcblxuXHQvLyBjaGF0IHBhc3NlZCBmcm9tIHNvY2tldGNsaWVudCwgYWRkcyBhIG5ldyBjaGF0IG1lc3NhZ2UgdXNpbmcgY2hhdHJvb21Nb2RlbCBtZXRob2Rcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcImNoYXRSZWNlaXZlZFwiLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgc2VsZi5jaGF0cm9vbVZpZXcuZ29ycChjaGF0KTtcblx0XHQkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnLmNoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcblx0fSk7XG5cblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRDaGF0bG9nXCIsIGZ1bmN0aW9uKGNoYXRsb2cpIHtcbiAgICB2YXIgbmV3TGlzdCA9IG5ldyBhcHAuQ2hhdENvbGxlY3Rpb24oY2hhdGxvZyk7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnY2hhdGxvZycsIG5ld0xpc3QpO1xuICAgIC8vICQoJy5jaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuICB9KTtcbiAgXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRDaGF0cm9vbXNcIiwgZnVuY3Rpb24oY2hhdHJvb21zKSB7XG4gICAgdmFyIG5ld0xpc3QgPSBuZXcgYXBwLkNoYXRyb29tTGlzdChjaGF0cm9vbXMpO1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zZXQoJ2NoYXRyb29tcycsIG5ld0xpc3QpO1xuICB9KTtcblxuICAgIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRPbmxpbmVVc2Vyc1wiLCBmdW5jdGlvbihvbmxpbmVVc2Vycykge1xuICAgIHZhciBuZXdMaXN0ID0gbmV3IGFwcC5Vc2VyQ29sbGVjdGlvbihvbmxpbmVVc2Vycyk7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnb25saW5lVXNlcnMnLCBuZXdMaXN0KTtcbiAgfSk7XG5cblxufTtcblxuIiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICB2YXIgQ2hhdHJvb21Sb3V0ZXIgPSBCYWNrYm9uZS5Sb3V0ZXIuZXh0ZW5kKHtcbiAgICBcbiAgICByb3V0ZXM6IHtcbiAgICAgICcnOiAnc3RhcnQnLFxuICAgICAgJ2xvZyc6ICdsb2dpbicsXG4gICAgICAncmVnJzogJ3JlZ2lzdGVyJyxcbiAgICAgICdhdXRoZW50aWNhdGVkJzogJ2F1dGhlbnRpY2F0ZWQnXG4gICAgfSxcblxuICAgIHN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlciA9IG5ldyBhcHAuTWFpbkNvbnRyb2xsZXIoKTtcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlci5pbml0KCk7XG4gICAgfSxcblxuICAgIGxvZ2luOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBsb2dpbk1vZGVsID0gbmV3IGFwcC5Mb2dpbk1vZGVsKCk7XG4gICAgICB2YXIgbG9naW5WaWV3ID0gbmV3IGFwcC5Mb2dpblZpZXcoe3ZlbnQ6IGFwcC5tYWluQ29udHJvbGxlci52aWV3RXZlbnRCdXMsIG1vZGVsOiBsb2dpbk1vZGVsfSk7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIuY29udGFpbmVyTW9kZWwuc2V0KFwidmlld1N0YXRlXCIsIGxvZ2luVmlldyk7XG4gICAgfSxcblxuICAgIHJlZ2lzdGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciByZWdpc3RlclZpZXcgPSBuZXcgYXBwLlJlZ2lzdGVyVmlldyh7dmVudDogYXBwLm1haW5Db250cm9sbGVyLnZpZXdFdmVudEJ1cyB9KTtcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlci5jb250YWluZXJNb2RlbC5zZXQoXCJ2aWV3U3RhdGVcIiwgcmVnaXN0ZXJWaWV3KTtcbiAgICB9LFxuXG4gICAgYXV0aGVudGljYXRlZDogZnVuY3Rpb24oKSB7XG4gICAgICAvLyBhcHAubWFpbkNvbnRyb2xsZXIgPSBuZXcgYXBwLk1haW5Db250cm9sbGVyKCk7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIuYXV0aGVudGljYXRlZCgpO1xuICAgIH1cblxuICB9KTtcblxuICBhcHAuQ2hhdHJvb21Sb3V0ZXIgPSBuZXcgQ2hhdHJvb21Sb3V0ZXIoKTtcbiAgQmFja2JvbmUuaGlzdG9yeS5zdGFydCgpO1xuXG59KSgpOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==