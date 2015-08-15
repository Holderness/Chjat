
var app = app || {};

(function () {

  app.ChatModel = Backbone.Model.extend({});

})();

var app = app || {};

(function () {

  app.ChatroomHeaderModel = Backbone.Model.extend({});

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
    chatroom: new app.ChatroomHeaderModel({ name: 'DOO'}),
    onlineUsers: new app.UserCollection(),
    chatlog: new app.ChatCollection([
      // message and sender upon entering chatroom
      new app.ChatModel({ sender: 'Butters', message: 'awwwwww hamburgers. ||):||', timestamp: _.now() })
      ]),
    chatrooms: null
  },
  loadModel: function() {
    console.log('crm.f.loadModel');
  },
  addUser: function(username) {
    console.log('crm.f.addUser');
    this.get('onlineUsers').add(new app.UserModel({ username: username }));
    console.log("--adding-user---");
  },
  removeUser: function(username) {
    console.log('crm.f.removeUser');
    var onlineUsers = this.get('onlineUsers');
    var user = onlineUsers.find(function(userModel) { return userModel.get('username') == username; });
    if (user) {
      onlineUsers.remove(user);
    }
  },
  addChat: function(chat) {
    console.log('crm.f.addChat');
    var now = _.now();
    this.get('chatlog').add(new app.ChatModel({ sender: chat.sender, message: chat.message, timestamp: now}));
    // this.trigger('gorp', chat);
  },
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
  nameTemplate: _.template($('#chatroom-name-template').html()),
  events: {
    'keypress .message-input': 'messageInputPressed',
    'click .chat-directory .room': 'setRoom'
  },
  initialize: function(options) {
    console.log('chatroomView.f.initialize: ', options);
    // passed the viewEventBus
    this.vent = options.vent;
  },
  initRoom: function() {
    this.renderUsers();
    this.renderChats();
    this.renderRooms();
    this.renderName();
  },
  render: function(model) {
    console.log('crv.f.render');
    this.model = model || this.model;
    this.$el.html(this.template(this.model.toJSON()));
    // this.setChatCollection();
    this.setChatListeners();
    return this;
  },
  // setChatCollection: function() {
  //     this.userChats = new app.ChatCollection([
  //       // message and sender upon entering chatroom
  //       new app.ChatModel({ sender: 'Butters', message: 'awwwwww hamburgers. ||):||', timestamp: _.now() })
  //     ]);
  // },
  setChatListeners: function() {

    // this.listenTo(this.model, "getChatroomModel", this.getChatroomModel, this);


    var onlineUsers = this.model.get('onlineUsers');
    this.listenTo(onlineUsers, "add", this.renderUser, this);
    this.listenTo(onlineUsers, "remove", this.renderUsers, this);
    this.listenTo(onlineUsers, "reset", this.renderUsers, this);

    var chatlog = this.model.get('chatlog');
    this.listenTo(chatlog, "add", this.renderChat, this);
    this.listenTo(chatlog, "remove", this.renderChats, this);
    this.listenTo(chatlog, "reset", this.renderChats, this);

    var chatrooms = this.model.get('chatrooms');
    this.listenTo(chatrooms, "add", this.renderRoom, this);
    this.listenTo(chatrooms, "remove", this.renderRooms, this);
    this.listenTo(chatrooms, "reset", this.renderRooms, this);

    // var chatroom = this.model.get('chatroom');
    this.listenTo(this.model, "change:chatroom", this.renderName, this);

    // this.listenTo(this.model, "change:chatrooms", this.renderRooms, this);

    // this.listenTo(this.model, "add:onlineUsers", this.renderUsers, this);
    // this.listenTo(this.model, "add:chatlog", this.renderChats, this);
    // this.listenTo(this.model, "add:chatrooms", this.renderRooms, this);

    // this.listenTo(this.model, "remove:onlineUsers", this.renderUsers, this);
    // this.listenTo(this.model, "remove:chatlog", this.renderChats, this);
    // this.listenTo(this.model, "remove:chatrooms", this.renderRooms, this);

    // this.listenTo(this.model, "reset:onlineUsers", this.renderUsers, this);
    // this.listenTo(this.model, "reset:chatlog", this.renderChats, this);
    // this.listenTo(this.model, "reset:chatrooms", this.renderRooms, this);

    // this.listenTo(this.model, "gorp", this.gorp, this);
    // this.model.on('gorp', function(chat) {
    //   this.gorp(chat);
    // });

  },


  // gorp: function(chat) {
  //   console.log('crv.f.gorp');
  //   var now = _.now();

  //   this.userChats.add(new app.ChatModel({ sender: chat.sender, message: chat.message, timestamp: now}));
  // },
  getChatroomModel: function(name) {
    console.log('crv.f.getChatroomModel');
    this.vent.trigger('getChatroomModel', name);
    debugger;
  },
  // renders on events, called just above
  renderName: function() {
    this.$('.chatbox-header').html(this.nameTemplate(this.model.get('chatroom').toJSON()));
  },
  renderUsers: function() {
    console.log('crv.f.renderUsers');
    console.log('USERS: ', this.model.get("onlineUsers"));
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
    console.log('crv.f.renderChats');
    console.log('CHATLOG: ', this.model.get("chatlog"));
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
    console.log('crv.f.renderRooms');
    console.log('CHATROOMS: ', this.model.get("chatrooms"));
    this.$('.public-rooms-container').empty();
    this.model.get('chatrooms').each(function (room) {
      this.renderRoom(room);
    }, this);
  },
  renderRoom: function(model) {
    var template = _.template($("#room-list-template").html());
    this.$('.public-rooms-container').append(template(model.toJSON()));
  },

  joinRoom: function(name) {
    console.log('crv.f.joinRoom');
    this.vent.trigger('joinRoom', name);
    // var model = this.collection.findWhere({name: name});
    // this.getChatCollection(name);
    // this.render(model);
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
    console.log('crv.f.setRoom');
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

  self.getChatroomModel = function(name) {
    console.log('sc.f.getChatroomModel: ', name);
    self.socket.emit("getChatroomModel", name);
  };



///// ViewEventBus methods ////
    // methods that emit to the chatserver
  self.login = function(user) {
    console.log('sc.f.login: ', user);
		self.socket.emit("login", user);
	};
  self.logout = function() {
    self.socket.emit("wut");
  };



  self.chat = function(chat) {
    console.log('sc.f.chat: ', chat);
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
		socket.on('welcome', function(data) {
      // emits event to recalibrate onlineUsers collection
      // socket.emit("getOnlineUsers");
      // socket.emit("rooms");
      // data is undefined at this point because it's the first to
      // fire off an event chain that will append the new user to 
      // the onlineUser collection
      self.vent.trigger("loginDone", data);
    });


    socket.on('log', function() {
      console.log('sc.e.log');
      self.vent.trigger('authenticated');
    });

		socket.on('usersInfo', function(users) {
			console.log('sc.e.usersInfo: ', users);
			self.vent.trigger("usersInfo", users);
		});

    socket.on('rooms', function(chatrooms) {
      console.log('sc.e.rooms: ', chatrooms);
      self.vent.trigger("roomInfo", chatrooms);
    });



		socket.on('userJoined', function(username) {
			console.log('sc.e.userJoined: ', username);
      // socket.emit("onlineUsers");
			self.vent.trigger("userJoined", username);
		});
		socket.on('userLeft', function(username) {
			console.log('sc.e.userLeft: ', username);
      // socket.emit("onlineUsers");
			self.vent.trigger("userLeft", username);
		});



		socket.on('chat', function(chat) {
			console.log('sc.e.chat: ', chat);
			self.vent.trigger("chatReceived", chat);
		});
    socket.on('setRoom', function(name) {
      console.log('sc.e.setRoom: ', name);
      self.vent.trigger("setRoom", name);
    });
    socket.on('chatlog', function(chatlog) {
      console.log('sc.e.chatlog: ', chatlog);
      self.vent.trigger("setChatlog", chatlog);
    });
    // socket.on('ChatroomModel', function(model) {
    //   // self.vent.trigger("ChatroomModel", model);
    //   self.vent.trigger("setRoom", model);
    // });
    socket.on('chatrooms', function(chatrooms) {
      console.log('sc.e.chatrooms:  ', chatrooms);
      self.vent.trigger("setChatrooms", chatrooms);
    });
    socket.on('onlineUsers', function(onlineUsers) {
      console.log('sc.e.onlineUsers: ', onlineUsers);
      self.vent.trigger("setOnlineUsers", onlineUsers);
    });
    socket.on('chatroomName', function(name) {
      console.log('sc.e.chatroomName: ', name);
      self.vent.trigger("setChatroomName", name);
    });



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
      self.chatroomView  = new app.ChatroomView({vent: self.viewEventBus, model: self.chatroomModel });
      self.containerModel.set('viewState', self.chatroomView);

      autosize($('textarea.message-input'));
      $('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
       
      console.log('authent');
      setTimeout(function(){
        self.chatClient.connectToRoom("DOO");
      }, 1500);
      setTimeout(function(){
        self.chatroomView.initRoom();
      }, 2000);
    });

  };

  self.logout = function() {
    debugger;
        self.chatClient.logout();
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
    self.chatClient.login(user);
  });
	self.viewEventBus.on("chat", function(chat) {
    self.chatClient.chat(chat);
  });
  self.viewEventBus.on("typing", function() {
    self.chatClient.updateTyping();
  });
  self.viewEventBus.on("joinRoom", function(room) {
    self.chatClient.joinRoom(room);
  });
  // self.viewEventBus.on("getChatroomModel", function(name) {
  //   debugger;
  //   self.chatClient.getChatroomModel(name);
  // });








  //// appEventBus Listeners ////

	self.appEventBus.on("usersInfo", function(data) {
    console.log('main.e.usersInfo: ', data);
    //data is an array of usernames, including the new user
		// This method gets the online users collection from chatroomModel.
		// onlineUsers is the collection
		var onlineUsers = self.chatroomModel.get("onlineUsers");
    console.log("...onlineUsers: ", onlineUsers);
		var users = _.map(data, function(item) {
			return new app.UserModel({username: item});
		});
    console.log("users: ", users);
		onlineUsers.reset(users);
	});

  self.appEventBus.on("roomInfo", function(data) {
    console.log('main.e.roomInfo: ', data);
    var rooms = self.chatroomModel.get("chatrooms");
     console.log("...rooms: ", rooms);
    var updatedRooms = _.map(data, function(room) {
      var newChatroomModel = new app.ChatroomModel({name: room.name});
      return newChatroomModel;
    });
    console.log("...updatedrooms: ", updatedRooms);
    rooms.reset(updatedRooms);
  });





  // self.appEventBus.on("setRoom", function(model) {
  //   console.log('main.e.setRoom: ', model);

  //   var chatlog = new app.ChatCollection(model.chatlog);
  //   self.chatroomModel.set('chatlog', chatlog);

  //   var rooms = new app.ChatroomList(model.chatrooms);
  //   self.chatroomModel.set('chatrooms', rooms);

  //   var users = new app.UserCollection(model.onlineUsers);
  //   self.chatroomModel.set('onlineUsers', users);

  // });



  self.appEventBus.on("ChatroomModel", function(model) {
    console.log('main.e.ChatroomModel: ', model);
    self.chatroomModel = new app.ChatroomModel();
    self.chatroomList = new app.ChatroomList();
    self.chatroomView  = new app.ChatroomView({vent: self.viewEventBus, model: self.chatroomModel, collection: self.chatroomList});
    self.containerModel.set('viewState', self.chatroomView);
    self.chatroomModel.loadModel(model);
  });



  // adds new user to users collection, sends default joining message
	self.appEventBus.on("userJoined", function(username) {
        console.log('main.e.userJoined: ', username);
		self.chatroomModel.addUser(username);
		self.chatroomModel.addChat({sender: "Butters", message: username + " joined room." });
	});

	// removes user from users collection, sends default leaving message
	self.appEventBus.on("userLeft", function(username) {
        console.log('main.e.userLeft: ', username);
		self.chatroomModel.removeUser(username);
		self.chatroomModel.addChat({sender: "Butters", message: username + " left room." });
	});

	// chat passed from socketclient, adds a new chat message using chatroomModel method
	self.appEventBus.on("chatReceived", function(chat) {
    self.chatroomModel.addChat(chat);
		$('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
	});






  self.appEventBus.on("setChatroomName", function(name) {
    var newHeader = new app.ChatroomHeaderModel({ name: name });
    self.chatroomModel.set('chatroom', newHeader);
  });

  self.appEventBus.on("setChatlog", function(chatlog) {
    var oldChatlog = self.chatroomModel.get('chatlog');
    var updatedChatlog = _.map(chatlog, function(chat) {
      var newChatModel = new app.ChatModel({ room: chat.room, message: chat.message, sender: chat.sender, timestamp: chat.timestamp });
      return newChatModel;
    });
    oldChatlog.reset(updatedChatlog);
  });
  
  self.appEventBus.on("setChatrooms", function(chatrooms) {
    var oldChatrooms = self.chatroomModel.get('chatrooms');
    var updatedChatrooms = _.map(chatrooms, function(chatroom) {
      var newChatroomModel = new app.ChatroomModel({ name: chatroom.name, onlineUsers: chatroom.onlineUsers });
      return newChatroomModel;
    });
    oldChatrooms.reset(updatedChatrooms);
  });

  self.appEventBus.on("setOnlineUsers", function(onlineUsers) {
    var oldOnlineUsers = self.chatroomModel.get('onlineUsers');
    var updatedOnlineUsers = _.map(onlineUsers, function(user) {
      var newUserModel = new app.UserModel({username: user.username});
      return newUserModel;
    });
    oldOnlineUsers.reset(updatedOnlineUsers);
  });


};


var app = app || {};

(function () {

  var ChatroomRouter = Backbone.Router.extend({
    
    routes: {
      '': 'start',
      'log': 'login',
      'reg': 'register',
      'logout': 'logout',
      'authenticated': 'authenticated',
      'facebook': 'facebook',
      'twitter': 'twitter'
    },

    start: function(callback) {
      app.mainController = new app.MainController();
      app.mainController.init();
      if (callback) {
        callback();
      }
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

    logout: function() {
      // $('#logout').on('click', function() {
                var this_ = this;
        $.ajax({
          url: "/logout",
        }).done(function() {

        });
          debugger;
          this_.login();
          app.mainController.logout();

      // });
    },

    authenticated: function() {
      app.mainController.authenticated();
    },
    facebook: function() {
      this.start(this.authenticated);
    },
    twitter: function() {
      this.start(this.authenticated);
    },

  });

  app.ChatroomRouter = new ChatroomRouter();
  Backbone.history.start();

})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYXQuanMiLCJjaGF0cm9vbS1oZWFkZXIuanMiLCJjb250YWluZXIuanMiLCJsb2dpbi5qcyIsInVzZXIuanMiLCJjaGF0cm9vbS5qcyIsInJvb20uanMiLCJyZWdpc3Rlci5qcyIsInNvY2tldGNsaWVudC5qcyIsIm1haW4uanMiLCJyb3V0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FKUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUlUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FEVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBSC9LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBSWxEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLkNoYXRDb2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe1xuICAgIG1vZGVsOiBhcHAuQ2hhdE1vZGVsXG4gIH0pO1xuXG59KSgpOyIsIlxudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuQ2hhdHJvb21IZWFkZXJNb2RlbCA9IEJhY2tib25lLk1vZGVsLmV4dGVuZCh7fSk7XG5cbn0pKCk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbiAgYXBwLkNvbnRhaW5lclZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgZWw6ICcjdmlldy1jb250YWluZXInLFxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMubW9kZWwub24oXCJjaGFuZ2U6dmlld1N0YXRlXCIsIHRoaXMucmVuZGVyLCB0aGlzKTtcbiAgICB9LFxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdmlldyA9IHRoaXMubW9kZWwuZ2V0KCd2aWV3U3RhdGUnKTtcbiAgICAgIHRoaXMuJGVsLmh0bWwodmlldy5yZW5kZXIoKS5lbCk7XG4gICAgfVxuICB9KTtcblxufSkoalF1ZXJ5KTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuICBhcHAuTG9naW5WaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIHRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNsb2dpbicpLmh0bWwoKSksXG4gICAgZXZlbnRzOiB7XG4gICAgICAnc3VibWl0JzogJ29uTG9naW4nLFxuICAgICAgJ2tleXByZXNzJzogJ29uSGl0RW50ZXInXG4gICAgfSxcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgLy8gTG9naW5WaWV3IGdldHMgcGFzc2VkIHRoZSB2aWV3RXZlbnRCdXMgd2hlbiB0aGUgTWFpbkNvbnRyb2xsZXIgaXMgaW5pdGlhbGl6ZWRcbiAgICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcblxuICAgIC8vIFRoaXMgdGVsbHMgdGhlIHZpZXcgdG8gbGlzdGVuIHRvIGFuIGV2ZW50IG9uIGl0cyBtb2RlbCxcbiAgICAvLyBpZiB0aGVyZSdzIGFuIGVycm9yLCB0aGUgY2FsbGJhY2sgKHRoaXMucmVuZGVyKSBpcyBjYWxsZWQgd2l0aCB0aGUgIFxuICAgIC8vIHZpZXcgYXMgY29udGV4dFxuICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImNoYW5nZTplcnJvclwiLCB0aGlzLnJlbmRlciwgdGhpcyk7XG4gICAgfSxcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKHRoaXMubW9kZWwudG9KU09OKCkpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgb25Mb2dpbjogZnVuY3Rpb24oZSkge1xuICAgICAgLy8gdHJpZ2dlcnMgdGhlIGxvZ2luIGV2ZW50IGFuZCBwYXNzaW5nIHRoZSB1c2VybmFtZSBkYXRhIHRvIGpzL21haW4uanNcbiAgICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgJC5hamF4KHtcbiAgICAgICAgdXJsOiBcIi9sb2dpblwiLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgZGF0YToge3VzZXJuYW1lOiB0aGlzLiQoJyN1c2VybmFtZScpLnZhbCgpLCBwYXNzd29yZDogdGhpcy4kKCcjcGFzc3dvcmQnKS52YWwoKX0sXG4gICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgY29uc29sZS5sb2coJ3N1Y2Nlc3MgZGF0YTogJywgZGF0YSk7XG4gICAgICAgICAgIGlmIChkYXRhID09PSAyMDApIHtcbiAgICAgICAgICAgICAvLyB0aGlzXy52ZW50LnRyaWdnZXIoJ2F1dGhlbnRpY2F0ZWQnKTtcbiAgICAgICAgICAgIGFwcC5DaGF0cm9vbVJvdXRlci5uYXZpZ2F0ZSgnYXV0aGVudGljYXRlZCcsIHsgdHJpZ2dlcjogdHJ1ZSB9KTtcbiAgICAgICAgdGhpc18udmVudC50cmlnZ2VyKFwibG9naW5cIiwge3VzZXJuYW1lOiB0aGlzXy4kKCcjdXNlcm5hbWUnKS52YWwoKSwgcGFzc3dvcmQ6IHRoaXNfLiQoJyNwYXNzd29yZCcpLnZhbCgpfSk7XG4gICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSkuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2RvbmVlZWVlZWVlJyk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIC8vIG9uSGl0RW50ZXI6IGZ1bmN0aW9uKGUpIHtcbiAgICAvLyAgIGlmKGUua2V5Q29kZSA9PSAxMykge1xuICAgIC8vICAgICB0aGlzLm9uTG9naW4oKTtcbiAgICAvLyAgICAgcmV0dXJuIGZhbHNlO1xuICAgIC8vICAgfVxuICAgIC8vIH1cbiAgfSk7XG4gIFxufSkoalF1ZXJ5KTsiLCJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLlVzZXJDb2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe21vZGVsOiBhcHAuVXNlck1vZGVsfSk7XG5cbn0pKCk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbmFwcC5DaGF0cm9vbVZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gIHRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNjaGF0cm9vbS10ZW1wbGF0ZScpLmh0bWwoKSksXG4gIG5hbWVUZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjY2hhdHJvb20tbmFtZS10ZW1wbGF0ZScpLmh0bWwoKSksXG4gIGV2ZW50czoge1xuICAgICdrZXlwcmVzcyAubWVzc2FnZS1pbnB1dCc6ICdtZXNzYWdlSW5wdXRQcmVzc2VkJyxcbiAgICAnY2xpY2sgLmNoYXQtZGlyZWN0b3J5IC5yb29tJzogJ3NldFJvb20nXG4gIH0sXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICBjb25zb2xlLmxvZygnY2hhdHJvb21WaWV3LmYuaW5pdGlhbGl6ZTogJywgb3B0aW9ucyk7XG4gICAgLy8gcGFzc2VkIHRoZSB2aWV3RXZlbnRCdXNcbiAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XG4gIH0sXG4gIGluaXRSb29tOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnJlbmRlclVzZXJzKCk7XG4gICAgdGhpcy5yZW5kZXJDaGF0cygpO1xuICAgIHRoaXMucmVuZGVyUm9vbXMoKTtcbiAgICB0aGlzLnJlbmRlck5hbWUoKTtcbiAgfSxcbiAgcmVuZGVyOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5yZW5kZXInKTtcbiAgICB0aGlzLm1vZGVsID0gbW9kZWwgfHwgdGhpcy5tb2RlbDtcbiAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUodGhpcy5tb2RlbC50b0pTT04oKSkpO1xuICAgIC8vIHRoaXMuc2V0Q2hhdENvbGxlY3Rpb24oKTtcbiAgICB0aGlzLnNldENoYXRMaXN0ZW5lcnMoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgLy8gc2V0Q2hhdENvbGxlY3Rpb246IGZ1bmN0aW9uKCkge1xuICAvLyAgICAgdGhpcy51c2VyQ2hhdHMgPSBuZXcgYXBwLkNoYXRDb2xsZWN0aW9uKFtcbiAgLy8gICAgICAgLy8gbWVzc2FnZSBhbmQgc2VuZGVyIHVwb24gZW50ZXJpbmcgY2hhdHJvb21cbiAgLy8gICAgICAgbmV3IGFwcC5DaGF0TW9kZWwoeyBzZW5kZXI6ICdCdXR0ZXJzJywgbWVzc2FnZTogJ2F3d3d3d3cgaGFtYnVyZ2Vycy4gfHwpOnx8JywgdGltZXN0YW1wOiBfLm5vdygpIH0pXG4gIC8vICAgICBdKTtcbiAgLy8gfSxcbiAgc2V0Q2hhdExpc3RlbmVyczogZnVuY3Rpb24oKSB7XG5cbiAgICAvLyB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiZ2V0Q2hhdHJvb21Nb2RlbFwiLCB0aGlzLmdldENoYXRyb29tTW9kZWwsIHRoaXMpO1xuXG5cbiAgICB2YXIgb25saW5lVXNlcnMgPSB0aGlzLm1vZGVsLmdldCgnb25saW5lVXNlcnMnKTtcbiAgICB0aGlzLmxpc3RlblRvKG9ubGluZVVzZXJzLCBcImFkZFwiLCB0aGlzLnJlbmRlclVzZXIsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8ob25saW5lVXNlcnMsIFwicmVtb3ZlXCIsIHRoaXMucmVuZGVyVXNlcnMsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8ob25saW5lVXNlcnMsIFwicmVzZXRcIiwgdGhpcy5yZW5kZXJVc2VycywgdGhpcyk7XG5cbiAgICB2YXIgY2hhdGxvZyA9IHRoaXMubW9kZWwuZ2V0KCdjaGF0bG9nJyk7XG4gICAgdGhpcy5saXN0ZW5UbyhjaGF0bG9nLCBcImFkZFwiLCB0aGlzLnJlbmRlckNoYXQsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdGxvZywgXCJyZW1vdmVcIiwgdGhpcy5yZW5kZXJDaGF0cywgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhjaGF0bG9nLCBcInJlc2V0XCIsIHRoaXMucmVuZGVyQ2hhdHMsIHRoaXMpO1xuXG4gICAgdmFyIGNoYXRyb29tcyA9IHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbXMnKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRyb29tcywgXCJhZGRcIiwgdGhpcy5yZW5kZXJSb29tLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRyb29tcywgXCJyZW1vdmVcIiwgdGhpcy5yZW5kZXJSb29tcywgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhjaGF0cm9vbXMsIFwicmVzZXRcIiwgdGhpcy5yZW5kZXJSb29tcywgdGhpcyk7XG5cbiAgICAvLyB2YXIgY2hhdHJvb20gPSB0aGlzLm1vZGVsLmdldCgnY2hhdHJvb20nKTtcbiAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiY2hhbmdlOmNoYXRyb29tXCIsIHRoaXMucmVuZGVyTmFtZSwgdGhpcyk7XG5cbiAgICAvLyB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiY2hhbmdlOmNoYXRyb29tc1wiLCB0aGlzLnJlbmRlclJvb21zLCB0aGlzKTtcblxuICAgIC8vIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJhZGQ6b25saW5lVXNlcnNcIiwgdGhpcy5yZW5kZXJVc2VycywgdGhpcyk7XG4gICAgLy8gdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImFkZDpjaGF0bG9nXCIsIHRoaXMucmVuZGVyQ2hhdHMsIHRoaXMpO1xuICAgIC8vIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJhZGQ6Y2hhdHJvb21zXCIsIHRoaXMucmVuZGVyUm9vbXMsIHRoaXMpO1xuXG4gICAgLy8gdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcInJlbW92ZTpvbmxpbmVVc2Vyc1wiLCB0aGlzLnJlbmRlclVzZXJzLCB0aGlzKTtcbiAgICAvLyB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwicmVtb3ZlOmNoYXRsb2dcIiwgdGhpcy5yZW5kZXJDaGF0cywgdGhpcyk7XG4gICAgLy8gdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcInJlbW92ZTpjaGF0cm9vbXNcIiwgdGhpcy5yZW5kZXJSb29tcywgdGhpcyk7XG5cbiAgICAvLyB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwicmVzZXQ6b25saW5lVXNlcnNcIiwgdGhpcy5yZW5kZXJVc2VycywgdGhpcyk7XG4gICAgLy8gdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcInJlc2V0OmNoYXRsb2dcIiwgdGhpcy5yZW5kZXJDaGF0cywgdGhpcyk7XG4gICAgLy8gdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcInJlc2V0OmNoYXRyb29tc1wiLCB0aGlzLnJlbmRlclJvb21zLCB0aGlzKTtcblxuICAgIC8vIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJnb3JwXCIsIHRoaXMuZ29ycCwgdGhpcyk7XG4gICAgLy8gdGhpcy5tb2RlbC5vbignZ29ycCcsIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICAvLyAgIHRoaXMuZ29ycChjaGF0KTtcbiAgICAvLyB9KTtcblxuICB9LFxuXG5cbiAgLy8gZ29ycDogZnVuY3Rpb24oY2hhdCkge1xuICAvLyAgIGNvbnNvbGUubG9nKCdjcnYuZi5nb3JwJyk7XG4gIC8vICAgdmFyIG5vdyA9IF8ubm93KCk7XG5cbiAgLy8gICB0aGlzLnVzZXJDaGF0cy5hZGQobmV3IGFwcC5DaGF0TW9kZWwoeyBzZW5kZXI6IGNoYXQuc2VuZGVyLCBtZXNzYWdlOiBjaGF0Lm1lc3NhZ2UsIHRpbWVzdGFtcDogbm93fSkpO1xuICAvLyB9LFxuICBnZXRDaGF0cm9vbU1vZGVsOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLmdldENoYXRyb29tTW9kZWwnKTtcbiAgICB0aGlzLnZlbnQudHJpZ2dlcignZ2V0Q2hhdHJvb21Nb2RlbCcsIG5hbWUpO1xuICAgIGRlYnVnZ2VyO1xuICB9LFxuICAvLyByZW5kZXJzIG9uIGV2ZW50cywgY2FsbGVkIGp1c3QgYWJvdmVcbiAgcmVuZGVyTmFtZTogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy4kKCcuY2hhdGJveC1oZWFkZXInKS5odG1sKHRoaXMubmFtZVRlbXBsYXRlKHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbScpLnRvSlNPTigpKSk7XG4gIH0sXG4gIHJlbmRlclVzZXJzOiBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYucmVuZGVyVXNlcnMnKTtcbiAgICBjb25zb2xlLmxvZygnVVNFUlM6ICcsIHRoaXMubW9kZWwuZ2V0KFwib25saW5lVXNlcnNcIikpO1xuICAgIHRoaXMuJCgnLm9ubGluZS11c2VycycpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoXCJvbmxpbmVVc2Vyc1wiKS5lYWNoKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICB0aGlzLnJlbmRlclVzZXIodXNlcik7XG4gICAgfSwgdGhpcyk7XG4gIH0sXG4gIHJlbmRlclVzZXI6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gXy50ZW1wbGF0ZSgkKFwiI29ubGluZS11c2Vycy1saXN0LXRlbXBsYXRlXCIpLmh0bWwoKSk7XG4gICAgdGhpcy4kKCcub25saW5lLXVzZXJzJykuYXBwZW5kKHRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gIH0sXG4gIHJlbmRlckNoYXRzOiBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYucmVuZGVyQ2hhdHMnKTtcbiAgICBjb25zb2xlLmxvZygnQ0hBVExPRzogJywgdGhpcy5tb2RlbC5nZXQoXCJjaGF0bG9nXCIpKTtcbiAgICB0aGlzLiQoJy5jaGF0Ym94LWNvbnRlbnQnKS5lbXB0eSgpO1xuICAgIHRoaXMubW9kZWwuZ2V0KCdjaGF0bG9nJykuZWFjaChmdW5jdGlvbihjaGF0KSB7XG4gICAgICB0aGlzLnJlbmRlckNoYXQoY2hhdCk7XG4gICAgfSwgdGhpcyk7XG4gIH0sXG4gIHJlbmRlckNoYXQ6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gXy50ZW1wbGF0ZSgkKCcjY2hhdGJveC1tZXNzYWdlLXRlbXBsYXRlJykuaHRtbCgpKTtcbiAgICB2YXIgZWxlbWVudCA9ICQodGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICBlbGVtZW50LmFwcGVuZFRvKHRoaXMuJCgnLmNoYXRib3gtY29udGVudCcpKS5oaWRlKCkuZmFkZUluKCkuc2xpZGVEb3duKCk7XG4gICAgLy8gdGhpcy4kKCcubmFubycpLm5hbm9TY3JvbGxlcigpO1xuICAgIC8vIHRoaXMuJCgnLm5hbm8nKS5uYW5vU2Nyb2xsZXIoeyBzY3JvbGw6ICdib3R0b20nIH0pO1xuICB9LFxuXG5cbiAgLy8gcmVuZGVycyBvbiBldmVudHMsIGNhbGxlZCBqdXN0IGFib3ZlXG4gIHJlbmRlclJvb21zOiBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYucmVuZGVyUm9vbXMnKTtcbiAgICBjb25zb2xlLmxvZygnQ0hBVFJPT01TOiAnLCB0aGlzLm1vZGVsLmdldChcImNoYXRyb29tc1wiKSk7XG4gICAgdGhpcy4kKCcucHVibGljLXJvb21zLWNvbnRhaW5lcicpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tcycpLmVhY2goZnVuY3Rpb24gKHJvb20pIHtcbiAgICAgIHRoaXMucmVuZGVyUm9vbShyb29tKTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyUm9vbTogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBfLnRlbXBsYXRlKCQoXCIjcm9vbS1saXN0LXRlbXBsYXRlXCIpLmh0bWwoKSk7XG4gICAgdGhpcy4kKCcucHVibGljLXJvb21zLWNvbnRhaW5lcicpLmFwcGVuZCh0ZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICB9LFxuXG4gIGpvaW5Sb29tOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLmpvaW5Sb29tJyk7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoJ2pvaW5Sb29tJywgbmFtZSk7XG4gICAgLy8gdmFyIG1vZGVsID0gdGhpcy5jb2xsZWN0aW9uLmZpbmRXaGVyZSh7bmFtZTogbmFtZX0pO1xuICAgIC8vIHRoaXMuZ2V0Q2hhdENvbGxlY3Rpb24obmFtZSk7XG4gICAgLy8gdGhpcy5yZW5kZXIobW9kZWwpO1xuICB9LFxuXG5cbiAgLy9ldmVudHNcbiAgbWVzc2FnZUlucHV0UHJlc3NlZDogZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzICYmICQudHJpbSgkKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgpKS5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBmdW4gZmFjdDogc2VwYXJhdGUgZXZlbnRzIHdpdGggYSBzcGFjZSBpbiB0cmlnZ2VyJ3MgZmlyc3QgYXJnIGFuZCB5b3VcbiAgICAgIC8vIGNhbiB0cmlnZ2VyIG11bHRpcGxlIGV2ZW50cy5cbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiY2hhdFwiLCB0aGlzLiQoJy5tZXNzYWdlLWlucHV0JykudmFsKCkpO1xuICAgICAgdGhpcy4kKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgnJyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwidHlwaW5nXCIpO1xuICAgICAgY29uc29sZS5sb2coJ3d1dCcpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgc2V0Um9vbTogZnVuY3Rpb24oZSkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5zZXRSb29tJyk7XG4gICAgdmFyICR0YXIgPSAkKGUudGFyZ2V0KTtcbiAgICBpZiAoJHRhci5pcygncCcpKSB7XG4gICAgICB0aGlzLmpvaW5Sb29tKCR0YXIuZGF0YSgncm9vbScpKTtcbiAgICB9XG4gIH1cblxuXG5cblxufSk7XG5cbn0pKGpRdWVyeSk7IiwiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5DaGF0cm9vbUxpc3QgPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG4gICAgbW9kZWw6IGFwcC5DaGF0cm9vbU1vZGVsLFxuICAgIHVybDogJy9hcGkvY2hhdHJvb21zJyxcbiAgfSk7XG5cbn0pKCk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbiAgYXBwLlJlZ2lzdGVyVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjcmVnaXN0ZXInKS5odG1sKCkpLFxuICAgIGV2ZW50czoge1xuICAgICAgXCJjbGljayAjc2lnblVwQnRuXCI6IFwic2lnblVwXCJcbiAgICB9LFxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSxcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKCkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzaWduVXA6IGZ1bmN0aW9uKCkge1xuICAgIH1cbiAgfSk7XG5cbn0pKGpRdWVyeSk7IiwiXG4vLyBUaGUgQ2hhdENsaWVudCBpcyBpbXBsZW1lbnRlZCBvbiBtYWluLmpzLlxuLy8gVGhlIGNoYXRjbGllbnQgaXMgYSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBvbiB0aGUgTWFpbkNvbnRyb2xsZXIuXG4vLyBJdCBib3RoIGxpc3RlbnMgdG8gYW5kIGVtaXRzIGV2ZW50cyBvbiB0aGUgc29ja2V0LCBlZzpcbi8vIEl0IGhhcyBpdHMgb3duIG1ldGhvZHMgdGhhdCwgd2hlbiBjYWxsZWQsIGVtaXQgdG8gdGhlIHNvY2tldCB3LyBkYXRhLlxuLy8gSXQgYWxzbyBzZXRzIHJlc3BvbnNlIGxpc3RlbmVycyBvbiBjb25uZWN0aW9uLCB0aGVzZSByZXNwb25zZSBsaXN0ZW5lcnNcbi8vIGxpc3RlbiB0byB0aGUgc29ja2V0IGFuZCB0cmlnZ2VyIGV2ZW50cyBvbiB0aGUgYXBwRXZlbnRCdXMgb24gdGhlIFxuLy8gTWFpbkNvbnRyb2xsZXJcbnZhciBDaGF0Q2xpZW50ID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXG5cdHZhciBzZWxmID0gdGhpcztcblxuXHQvLyBpcy10eXBpbmcgaGVscGVyIHZhcmlhYmxlc1xuXHR2YXIgVFlQSU5HX1RJTUVSX0xFTkdUSCA9IDQwMDsgLy8gbXNcbiAgdmFyIHR5cGluZyA9IGZhbHNlO1xuICB2YXIgbGFzdFR5cGluZ1RpbWU7XG4gIFxuICAvLyB0aGlzIHZlbnQgaG9sZHMgdGhlIGFwcEV2ZW50QnVzXG5cdHNlbGYudmVudCA9IG9wdGlvbnMudmVudDtcblxuXHRzZWxmLmhvc3RuYW1lID0gJ2h0dHA6Ly8nICsgd2luZG93LmxvY2F0aW9uLmhvc3Q7XG5cbiAgLy8gY29ubmVjdHMgdG8gc29ja2V0LCBzZXRzIHJlc3BvbnNlIGxpc3RlbmVyc1xuXHRzZWxmLmNvbm5lY3QgPSBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5jb25uZWN0Jyk7XG5cdFx0Ly8gdGhpcyBpbyBtaWdodCBiZSBhIGxpdHRsZSBjb25mdXNpbmcuLi4gd2hlcmUgaXMgaXQgY29taW5nIGZyb20/XG5cdFx0Ly8gaXQncyBjb21pbmcgZnJvbSB0aGUgc3RhdGljIG1pZGRsZXdhcmUgb24gc2VydmVyLmpzIGJjIGV2ZXJ5dGhpbmdcblx0XHQvLyBpbiB0aGUgL3B1YmxpYyBmb2xkZXIgaGFzIGJlZW4gYXR0YWNoZWQgdG8gdGhlIHNlcnZlciwgYW5kIHZpc2Fcblx0XHQvLyB2ZXJzYS5cblx0XHRzZWxmLnNvY2tldCA9IGlvLmNvbm5lY3Qoc2VsZi5ob3N0bmFtZSk7XG4gICAgc2VsZi5zZXRSZXNwb25zZUxpc3RlbmVycyhzZWxmLnNvY2tldCk7XG4gIH07XG5cbiAgc2VsZi5jb25uZWN0VG9Sb29tID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmNvbm5lY3RUb1Jvb206ICcsIG5hbWUpO1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJjb25uZWN0VG9Sb29tXCIsIG5hbWUpO1xuICB9O1xuXG4gIHNlbGYuZ2V0Q2hhdHJvb21Nb2RlbCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5nZXRDaGF0cm9vbU1vZGVsOiAnLCBuYW1lKTtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwiZ2V0Q2hhdHJvb21Nb2RlbFwiLCBuYW1lKTtcbiAgfTtcblxuXG5cbi8vLy8vIFZpZXdFdmVudEJ1cyBtZXRob2RzIC8vLy9cbiAgICAvLyBtZXRob2RzIHRoYXQgZW1pdCB0byB0aGUgY2hhdHNlcnZlclxuICBzZWxmLmxvZ2luID0gZnVuY3Rpb24odXNlcikge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmxvZ2luOiAnLCB1c2VyKTtcblx0XHRzZWxmLnNvY2tldC5lbWl0KFwibG9naW5cIiwgdXNlcik7XG5cdH07XG4gIHNlbGYubG9nb3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcInd1dFwiKTtcbiAgfTtcblxuXG5cbiAgc2VsZi5jaGF0ID0gZnVuY3Rpb24oY2hhdCkge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmNoYXQ6ICcsIGNoYXQpO1xuXHRcdHNlbGYuc29ja2V0LmVtaXQoXCJjaGF0XCIsIGNoYXQpO1xuXHR9O1xuXG5cbiAgLy8gVHlwaW5nIG1ldGhvZHNcblx0c2VsZi5hZGRDaGF0VHlwaW5nID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciBtZXNzYWdlID0gZGF0YS51c2VybmFtZSArICcgaXMgdHlwaW5nJztcbiAgICAkKCcudHlwZXR5cGV0eXBlJykudGV4dChtZXNzYWdlKTtcblx0fTtcblx0c2VsZi5yZW1vdmVDaGF0VHlwaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgJCgnLnR5cGV0eXBldHlwZScpLmVtcHR5KCk7XG5cdH07XG4gIHNlbGYudXBkYXRlVHlwaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHNlbGYuc29ja2V0KSB7XG4gICAgICBpZiAoIXR5cGluZykge1xuICAgICAgICB0eXBpbmcgPSB0cnVlO1xuICAgICAgICBzZWxmLnNvY2tldC5lbWl0KCd0eXBpbmcnKTtcbiAgICAgIH1cbiAgICAgIGxhc3RUeXBpbmdUaW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0eXBpbmdUaW1lciA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICAgIHZhciB0aW1lRGlmZiA9IHR5cGluZ1RpbWVyIC0gbGFzdFR5cGluZ1RpbWU7XG4gICAgICAgIGlmICh0aW1lRGlmZiA+PSBUWVBJTkdfVElNRVJfTEVOR1RIICYmIHR5cGluZykge1xuICAgICAgICAgICBzZWxmLnNvY2tldC5lbWl0KCdzdG9wIHR5cGluZycpO1xuICAgICAgICAgICB0eXBpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSwgVFlQSU5HX1RJTUVSX0xFTkdUSCk7XG4gICAgfVxuICB9O1xuXG5cbiAgLy8gam9pbiByb29tXG4gIHNlbGYuam9pblJvb20gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdCgnam9pblJvb20nLCBuYW1lKTtcbiAgfTtcblxuICAvLyBzZXQgcm9vbVxuICBzZWxmLnNldFJvb20gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgaWYgKG5hbWUgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuY3VycmVudFJvb20gPSBuYW1lO1xuICAgIH1cbiAgICAvLy8+Pj4+Pj4+IGNoYW5nZXRoaXN0byAuY2hhdC10aXRsZVxuICAgIHZhciAkY2hhdFRpdGxlID0gJCgnLmNoYXRib3gtaGVhZGVyLXVzZXJuYW1lJyk7XG4gICAgJGNoYXRUaXRsZS50ZXh0KG5hbWUpO1xuICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgJCgnLmNoYXQtZGlyZWN0b3J5JykuZmluZCgnLnJvb20nKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyICRyb29tID0gJCh0aGlzKTtcbiAgICAgICRyb29tLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAgIGlmICgkcm9vbS5kYXRhKCduYW1lJykgPT09IHRoaXNfLmN1cnJlbnRSb29tKSB7XG4gICAgICAgICRyb29tLmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbiAgXG5cblxuXG4gIC8vLy8vLy8vLy8vLy8vIGNoYXRzZXJ2ZXIgbGlzdGVuZXJzLy8vLy8vLy8vLy8vL1xuXG4gIC8vIHRoZXNlIGd1eXMgbGlzdGVuIHRvIHRoZSBjaGF0c2VydmVyL3NvY2tldCBhbmQgZW1pdCBkYXRhIHRvIG1haW4uanMsXG4gIC8vIHNwZWNpZmljYWxseSB0byB0aGUgYXBwRXZlbnRCdXMuXG5cdHNlbGYuc2V0UmVzcG9uc2VMaXN0ZW5lcnMgPSBmdW5jdGlvbihzb2NrZXQpIHtcblx0XHRzb2NrZXQub24oJ3dlbGNvbWUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAvLyBlbWl0cyBldmVudCB0byByZWNhbGlicmF0ZSBvbmxpbmVVc2VycyBjb2xsZWN0aW9uXG4gICAgICAvLyBzb2NrZXQuZW1pdChcImdldE9ubGluZVVzZXJzXCIpO1xuICAgICAgLy8gc29ja2V0LmVtaXQoXCJyb29tc1wiKTtcbiAgICAgIC8vIGRhdGEgaXMgdW5kZWZpbmVkIGF0IHRoaXMgcG9pbnQgYmVjYXVzZSBpdCdzIHRoZSBmaXJzdCB0b1xuICAgICAgLy8gZmlyZSBvZmYgYW4gZXZlbnQgY2hhaW4gdGhhdCB3aWxsIGFwcGVuZCB0aGUgbmV3IHVzZXIgdG8gXG4gICAgICAvLyB0aGUgb25saW5lVXNlciBjb2xsZWN0aW9uXG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcImxvZ2luRG9uZVwiLCBkYXRhKTtcbiAgICB9KTtcblxuXG4gICAgc29ja2V0Lm9uKCdsb2cnLCBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLmxvZycpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoJ2F1dGhlbnRpY2F0ZWQnKTtcbiAgICB9KTtcblxuXHRcdHNvY2tldC5vbigndXNlcnNJbmZvJywgZnVuY3Rpb24odXNlcnMpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdzYy5lLnVzZXJzSW5mbzogJywgdXNlcnMpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJ1c2Vyc0luZm9cIiwgdXNlcnMpO1xuXHRcdH0pO1xuXG4gICAgc29ja2V0Lm9uKCdyb29tcycsIGZ1bmN0aW9uKGNoYXRyb29tcykge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUucm9vbXM6ICcsIGNoYXRyb29tcyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInJvb21JbmZvXCIsIGNoYXRyb29tcyk7XG4gICAgfSk7XG5cblxuXG5cdFx0c29ja2V0Lm9uKCd1c2VySm9pbmVkJywgZnVuY3Rpb24odXNlcm5hbWUpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdzYy5lLnVzZXJKb2luZWQ6ICcsIHVzZXJuYW1lKTtcbiAgICAgIC8vIHNvY2tldC5lbWl0KFwib25saW5lVXNlcnNcIik7XG5cdFx0XHRzZWxmLnZlbnQudHJpZ2dlcihcInVzZXJKb2luZWRcIiwgdXNlcm5hbWUpO1xuXHRcdH0pO1xuXHRcdHNvY2tldC5vbigndXNlckxlZnQnLCBmdW5jdGlvbih1c2VybmFtZSkge1xuXHRcdFx0Y29uc29sZS5sb2coJ3NjLmUudXNlckxlZnQ6ICcsIHVzZXJuYW1lKTtcbiAgICAgIC8vIHNvY2tldC5lbWl0KFwib25saW5lVXNlcnNcIik7XG5cdFx0XHRzZWxmLnZlbnQudHJpZ2dlcihcInVzZXJMZWZ0XCIsIHVzZXJuYW1lKTtcblx0XHR9KTtcblxuXG5cblx0XHRzb2NrZXQub24oJ2NoYXQnLCBmdW5jdGlvbihjaGF0KSB7XG5cdFx0XHRjb25zb2xlLmxvZygnc2MuZS5jaGF0OiAnLCBjaGF0KTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwiY2hhdFJlY2VpdmVkXCIsIGNoYXQpO1xuXHRcdH0pO1xuICAgIHNvY2tldC5vbignc2V0Um9vbScsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLnNldFJvb206ICcsIG5hbWUpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRSb29tXCIsIG5hbWUpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbignY2hhdGxvZycsIGZ1bmN0aW9uKGNoYXRsb2cpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLmNoYXRsb2c6ICcsIGNoYXRsb2cpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRDaGF0bG9nXCIsIGNoYXRsb2cpO1xuICAgIH0pO1xuICAgIC8vIHNvY2tldC5vbignQ2hhdHJvb21Nb2RlbCcsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgLy8gICAvLyBzZWxmLnZlbnQudHJpZ2dlcihcIkNoYXRyb29tTW9kZWxcIiwgbW9kZWwpO1xuICAgIC8vICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRSb29tXCIsIG1vZGVsKTtcbiAgICAvLyB9KTtcbiAgICBzb2NrZXQub24oJ2NoYXRyb29tcycsIGZ1bmN0aW9uKGNoYXRyb29tcykge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUuY2hhdHJvb21zOiAgJywgY2hhdHJvb21zKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0Q2hhdHJvb21zXCIsIGNoYXRyb29tcyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdvbmxpbmVVc2VycycsIGZ1bmN0aW9uKG9ubGluZVVzZXJzKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5vbmxpbmVVc2VyczogJywgb25saW5lVXNlcnMpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRPbmxpbmVVc2Vyc1wiLCBvbmxpbmVVc2Vycyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdjaGF0cm9vbU5hbWUnLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5jaGF0cm9vbU5hbWU6ICcsIG5hbWUpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRDaGF0cm9vbU5hbWVcIiwgbmFtZSk7XG4gICAgfSk7XG5cblxuXG4gICAgc29ja2V0Lm9uKCd0eXBpbmcnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBzZWxmLmFkZENoYXRUeXBpbmcoZGF0YSk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdzdG9wIHR5cGluZycsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5yZW1vdmVDaGF0VHlwaW5nKCk7XG4gICAgfSk7XG5cblxuXHR9O1xufTsiLCJcblxuYXBwLk1haW5Db250cm9sbGVyID0gZnVuY3Rpb24oKSB7XG5cblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cbiAgLy9UaGVzZSBhbGxvd3MgdXMgdG8gYmluZCBhbmQgdHJpZ2dlciBvbiB0aGUgb2JqZWN0IGZyb20gYW55d2hlcmUgaW4gdGhlIGFwcC5cblx0c2VsZi5hcHBFdmVudEJ1cyA9IF8uZXh0ZW5kKHt9LCBCYWNrYm9uZS5FdmVudHMpO1xuXHRzZWxmLnZpZXdFdmVudEJ1cyA9IF8uZXh0ZW5kKHt9LCBCYWNrYm9uZS5FdmVudHMpO1xuXG5cdHNlbGYuaW5pdCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gbG9naW5Nb2RlbFxuICAgIHNlbGYubG9naW5Nb2RlbCA9IG5ldyBhcHAuTG9naW5Nb2RlbCgpO1xuICAgIHNlbGYubG9naW5WaWV3ID0gbmV3IGFwcC5Mb2dpblZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzLCBtb2RlbDogc2VsZi5sb2dpbk1vZGVsfSk7XG4gICAgc2VsZi5yZWdpc3RlclZpZXcgPSBuZXcgYXBwLlJlZ2lzdGVyVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXMgfSk7XG5cbiAgICAvLyBUaGUgQ29udGFpbmVyTW9kZWwgZ2V0cyBwYXNzZWQgYSB2aWV3U3RhdGUsIExvZ2luVmlldywgd2hpY2hcbiAgICAvLyBpcyB0aGUgbG9naW4gcGFnZS4gVGhhdCBMb2dpblZpZXcgZ2V0cyBwYXNzZWQgdGhlIHZpZXdFdmVudEJ1c1xuICAgIC8vIGFuZCB0aGUgTG9naW5Nb2RlbC5cbiAgICBzZWxmLmNvbnRhaW5lck1vZGVsID0gbmV3IGFwcC5Db250YWluZXJNb2RlbCh7IHZpZXdTdGF0ZTogc2VsZi5sb2dpblZpZXd9KTtcblxuICAgIC8vIG5leHQsIGEgbmV3IENvbnRhaW5lclZpZXcgaXMgaW50aWFsaXplZCB3aXRoIHRoZSBuZXdseSBjcmVhdGVkIGNvbnRhaW5lck1vZGVsXG4gICAgLy8gdGhlIGxvZ2luIHBhZ2UgaXMgdGhlbiByZW5kZXJlZC5cbiAgICBzZWxmLmNvbnRhaW5lclZpZXcgPSBuZXcgYXBwLkNvbnRhaW5lclZpZXcoeyBtb2RlbDogc2VsZi5jb250YWluZXJNb2RlbCB9KTtcbiAgICBzZWxmLmNvbnRhaW5lclZpZXcucmVuZGVyKCk7XG5cbiAgfTtcblxuXG4gIHNlbGYuYXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgIFxuICAgIHNlbGYuY2hhdENsaWVudCA9IG5ldyBDaGF0Q2xpZW50KHsgdmVudDogc2VsZi5hcHBFdmVudEJ1cyB9KTtcbiAgICBzZWxmLmNoYXRDbGllbnQuY29ubmVjdCgpO1xuXG4gICAgLy8gbmV3IG1vZGVsIGFuZCB2aWV3IGNyZWF0ZWQgZm9yIGNoYXRyb29tXG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsID0gbmV3IGFwcC5DaGF0cm9vbU1vZGVsKHsgbmFtZTogJ0RPTycgfSk7XG4gICAgc2VsZi5jaGF0cm9vbUxpc3QgPSBuZXcgYXBwLkNoYXRyb29tTGlzdCgpO1xuICAgIHNlbGYuY2hhdHJvb21MaXN0LmZldGNoKCkuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zZXQoJ2NoYXRyb29tcycsIHNlbGYuY2hhdHJvb21MaXN0KTtcbiAgICAgIHNlbGYuY2hhdHJvb21WaWV3ICA9IG5ldyBhcHAuQ2hhdHJvb21WaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cywgbW9kZWw6IHNlbGYuY2hhdHJvb21Nb2RlbCB9KTtcbiAgICAgIHNlbGYuY29udGFpbmVyTW9kZWwuc2V0KCd2aWV3U3RhdGUnLCBzZWxmLmNoYXRyb29tVmlldyk7XG5cbiAgICAgIGF1dG9zaXplKCQoJ3RleHRhcmVhLm1lc3NhZ2UtaW5wdXQnKSk7XG4gICAgICAkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnLmNoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcbiAgICAgICBcbiAgICAgIGNvbnNvbGUubG9nKCdhdXRoZW50Jyk7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIHNlbGYuY2hhdENsaWVudC5jb25uZWN0VG9Sb29tKFwiRE9PXCIpO1xuICAgICAgfSwgMTUwMCk7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIHNlbGYuY2hhdHJvb21WaWV3LmluaXRSb29tKCk7XG4gICAgICB9LCAyMDAwKTtcbiAgICB9KTtcblxuICB9O1xuXG4gIHNlbGYubG9nb3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgZGVidWdnZXI7XG4gICAgICAgIHNlbGYuY2hhdENsaWVudC5sb2dvdXQoKTtcbiAgfTtcblxuXG4gIC8vIHNlbGYuYXBwRXZlbnRCdXMub24oXCJhdXRoZW50aWNhdGVkXCIsIGZ1bmN0aW9uKCkge1xuICAvLyAgIGRlYnVnZ2VyO1xuICAvLyAgIHNlbGYuYXV0aGVudGljYXRlZCgpO1xuICAvLyB9KTtcblxuXG5cbiAgLy8vLy8vLy8vLy8vICBCdXNzZXMgLy8vLy8vLy8vLy8vXG4gICAgLy8gVGhlc2UgQnVzc2VzIGxpc3RlbiB0byB0aGUgc29ja2V0Y2xpZW50XG4gICAvLyAgICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXG4gIC8vLy8gdmlld0V2ZW50QnVzIExpc3RlbmVycyAvLy8vL1xuICBcblx0c2VsZi52aWV3RXZlbnRCdXMub24oXCJsb2dpblwiLCBmdW5jdGlvbih1c2VyKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmxvZ2luKHVzZXIpO1xuICB9KTtcblx0c2VsZi52aWV3RXZlbnRCdXMub24oXCJjaGF0XCIsIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuY2hhdChjaGF0KTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwidHlwaW5nXCIsIGZ1bmN0aW9uKCkge1xuICAgIHNlbGYuY2hhdENsaWVudC51cGRhdGVUeXBpbmcoKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiam9pblJvb21cIiwgZnVuY3Rpb24ocm9vbSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5qb2luUm9vbShyb29tKTtcbiAgfSk7XG4gIC8vIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiZ2V0Q2hhdHJvb21Nb2RlbFwiLCBmdW5jdGlvbihuYW1lKSB7XG4gIC8vICAgZGVidWdnZXI7XG4gIC8vICAgc2VsZi5jaGF0Q2xpZW50LmdldENoYXRyb29tTW9kZWwobmFtZSk7XG4gIC8vIH0pO1xuXG5cblxuXG5cblxuXG5cbiAgLy8vLyBhcHBFdmVudEJ1cyBMaXN0ZW5lcnMgLy8vL1xuXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2Vyc0luZm9cIiwgZnVuY3Rpb24oZGF0YSkge1xuICAgIGNvbnNvbGUubG9nKCdtYWluLmUudXNlcnNJbmZvOiAnLCBkYXRhKTtcbiAgICAvL2RhdGEgaXMgYW4gYXJyYXkgb2YgdXNlcm5hbWVzLCBpbmNsdWRpbmcgdGhlIG5ldyB1c2VyXG5cdFx0Ly8gVGhpcyBtZXRob2QgZ2V0cyB0aGUgb25saW5lIHVzZXJzIGNvbGxlY3Rpb24gZnJvbSBjaGF0cm9vbU1vZGVsLlxuXHRcdC8vIG9ubGluZVVzZXJzIGlzIHRoZSBjb2xsZWN0aW9uXG5cdFx0dmFyIG9ubGluZVVzZXJzID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiLi4ub25saW5lVXNlcnM6IFwiLCBvbmxpbmVVc2Vycyk7XG5cdFx0dmFyIHVzZXJzID0gXy5tYXAoZGF0YSwgZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0cmV0dXJuIG5ldyBhcHAuVXNlck1vZGVsKHt1c2VybmFtZTogaXRlbX0pO1xuXHRcdH0pO1xuICAgIGNvbnNvbGUubG9nKFwidXNlcnM6IFwiLCB1c2Vycyk7XG5cdFx0b25saW5lVXNlcnMucmVzZXQodXNlcnMpO1xuXHR9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwicm9vbUluZm9cIiwgZnVuY3Rpb24oZGF0YSkge1xuICAgIGNvbnNvbGUubG9nKCdtYWluLmUucm9vbUluZm86ICcsIGRhdGEpO1xuICAgIHZhciByb29tcyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoXCJjaGF0cm9vbXNcIik7XG4gICAgIGNvbnNvbGUubG9nKFwiLi4ucm9vbXM6IFwiLCByb29tcyk7XG4gICAgdmFyIHVwZGF0ZWRSb29tcyA9IF8ubWFwKGRhdGEsIGZ1bmN0aW9uKHJvb20pIHtcbiAgICAgIHZhciBuZXdDaGF0cm9vbU1vZGVsID0gbmV3IGFwcC5DaGF0cm9vbU1vZGVsKHtuYW1lOiByb29tLm5hbWV9KTtcbiAgICAgIHJldHVybiBuZXdDaGF0cm9vbU1vZGVsO1xuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKFwiLi4udXBkYXRlZHJvb21zOiBcIiwgdXBkYXRlZFJvb21zKTtcbiAgICByb29tcy5yZXNldCh1cGRhdGVkUm9vbXMpO1xuICB9KTtcblxuXG5cblxuXG4gIC8vIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRSb29tXCIsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gIC8vICAgY29uc29sZS5sb2coJ21haW4uZS5zZXRSb29tOiAnLCBtb2RlbCk7XG5cbiAgLy8gICB2YXIgY2hhdGxvZyA9IG5ldyBhcHAuQ2hhdENvbGxlY3Rpb24obW9kZWwuY2hhdGxvZyk7XG4gIC8vICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnY2hhdGxvZycsIGNoYXRsb2cpO1xuXG4gIC8vICAgdmFyIHJvb21zID0gbmV3IGFwcC5DaGF0cm9vbUxpc3QobW9kZWwuY2hhdHJvb21zKTtcbiAgLy8gICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdjaGF0cm9vbXMnLCByb29tcyk7XG5cbiAgLy8gICB2YXIgdXNlcnMgPSBuZXcgYXBwLlVzZXJDb2xsZWN0aW9uKG1vZGVsLm9ubGluZVVzZXJzKTtcbiAgLy8gICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdvbmxpbmVVc2VycycsIHVzZXJzKTtcblxuICAvLyB9KTtcblxuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcIkNoYXRyb29tTW9kZWxcIiwgZnVuY3Rpb24obW9kZWwpIHtcbiAgICBjb25zb2xlLmxvZygnbWFpbi5lLkNoYXRyb29tTW9kZWw6ICcsIG1vZGVsKTtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoKTtcbiAgICBzZWxmLmNoYXRyb29tTGlzdCA9IG5ldyBhcHAuQ2hhdHJvb21MaXN0KCk7XG4gICAgc2VsZi5jaGF0cm9vbVZpZXcgID0gbmV3IGFwcC5DaGF0cm9vbVZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzLCBtb2RlbDogc2VsZi5jaGF0cm9vbU1vZGVsLCBjb2xsZWN0aW9uOiBzZWxmLmNoYXRyb29tTGlzdH0pO1xuICAgIHNlbGYuY29udGFpbmVyTW9kZWwuc2V0KCd2aWV3U3RhdGUnLCBzZWxmLmNoYXRyb29tVmlldyk7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLmxvYWRNb2RlbChtb2RlbCk7XG4gIH0pO1xuXG5cblxuICAvLyBhZGRzIG5ldyB1c2VyIHRvIHVzZXJzIGNvbGxlY3Rpb24sIHNlbmRzIGRlZmF1bHQgam9pbmluZyBtZXNzYWdlXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2VySm9pbmVkXCIsIGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdtYWluLmUudXNlckpvaW5lZDogJywgdXNlcm5hbWUpO1xuXHRcdHNlbGYuY2hhdHJvb21Nb2RlbC5hZGRVc2VyKHVzZXJuYW1lKTtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkQ2hhdCh7c2VuZGVyOiBcIkJ1dHRlcnNcIiwgbWVzc2FnZTogdXNlcm5hbWUgKyBcIiBqb2luZWQgcm9vbS5cIiB9KTtcblx0fSk7XG5cblx0Ly8gcmVtb3ZlcyB1c2VyIGZyb20gdXNlcnMgY29sbGVjdGlvbiwgc2VuZHMgZGVmYXVsdCBsZWF2aW5nIG1lc3NhZ2Vcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcInVzZXJMZWZ0XCIsIGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdtYWluLmUudXNlckxlZnQ6ICcsIHVzZXJuYW1lKTtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwucmVtb3ZlVXNlcih1c2VybmFtZSk7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLmFkZENoYXQoe3NlbmRlcjogXCJCdXR0ZXJzXCIsIG1lc3NhZ2U6IHVzZXJuYW1lICsgXCIgbGVmdCByb29tLlwiIH0pO1xuXHR9KTtcblxuXHQvLyBjaGF0IHBhc3NlZCBmcm9tIHNvY2tldGNsaWVudCwgYWRkcyBhIG5ldyBjaGF0IG1lc3NhZ2UgdXNpbmcgY2hhdHJvb21Nb2RlbCBtZXRob2Rcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcImNoYXRSZWNlaXZlZFwiLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLmFkZENoYXQoY2hhdCk7XG5cdFx0JCgnLmNoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJy5jaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG5cdH0pO1xuXG5cblxuXG5cblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0Q2hhdHJvb21OYW1lXCIsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgbmV3SGVhZGVyID0gbmV3IGFwcC5DaGF0cm9vbUhlYWRlck1vZGVsKHsgbmFtZTogbmFtZSB9KTtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdjaGF0cm9vbScsIG5ld0hlYWRlcik7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRDaGF0bG9nXCIsIGZ1bmN0aW9uKGNoYXRsb2cpIHtcbiAgICB2YXIgb2xkQ2hhdGxvZyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoJ2NoYXRsb2cnKTtcbiAgICB2YXIgdXBkYXRlZENoYXRsb2cgPSBfLm1hcChjaGF0bG9nLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgICB2YXIgbmV3Q2hhdE1vZGVsID0gbmV3IGFwcC5DaGF0TW9kZWwoeyByb29tOiBjaGF0LnJvb20sIG1lc3NhZ2U6IGNoYXQubWVzc2FnZSwgc2VuZGVyOiBjaGF0LnNlbmRlciwgdGltZXN0YW1wOiBjaGF0LnRpbWVzdGFtcCB9KTtcbiAgICAgIHJldHVybiBuZXdDaGF0TW9kZWw7XG4gICAgfSk7XG4gICAgb2xkQ2hhdGxvZy5yZXNldCh1cGRhdGVkQ2hhdGxvZyk7XG4gIH0pO1xuICBcbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldENoYXRyb29tc1wiLCBmdW5jdGlvbihjaGF0cm9vbXMpIHtcbiAgICB2YXIgb2xkQ2hhdHJvb21zID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldCgnY2hhdHJvb21zJyk7XG4gICAgdmFyIHVwZGF0ZWRDaGF0cm9vbXMgPSBfLm1hcChjaGF0cm9vbXMsIGZ1bmN0aW9uKGNoYXRyb29tKSB7XG4gICAgICB2YXIgbmV3Q2hhdHJvb21Nb2RlbCA9IG5ldyBhcHAuQ2hhdHJvb21Nb2RlbCh7IG5hbWU6IGNoYXRyb29tLm5hbWUsIG9ubGluZVVzZXJzOiBjaGF0cm9vbS5vbmxpbmVVc2VycyB9KTtcbiAgICAgIHJldHVybiBuZXdDaGF0cm9vbU1vZGVsO1xuICAgIH0pO1xuICAgIG9sZENoYXRyb29tcy5yZXNldCh1cGRhdGVkQ2hhdHJvb21zKTtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldE9ubGluZVVzZXJzXCIsIGZ1bmN0aW9uKG9ubGluZVVzZXJzKSB7XG4gICAgdmFyIG9sZE9ubGluZVVzZXJzID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldCgnb25saW5lVXNlcnMnKTtcbiAgICB2YXIgdXBkYXRlZE9ubGluZVVzZXJzID0gXy5tYXAob25saW5lVXNlcnMsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgIHZhciBuZXdVc2VyTW9kZWwgPSBuZXcgYXBwLlVzZXJNb2RlbCh7dXNlcm5hbWU6IHVzZXIudXNlcm5hbWV9KTtcbiAgICAgIHJldHVybiBuZXdVc2VyTW9kZWw7XG4gICAgfSk7XG4gICAgb2xkT25saW5lVXNlcnMucmVzZXQodXBkYXRlZE9ubGluZVVzZXJzKTtcbiAgfSk7XG5cblxufTtcblxuIiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICB2YXIgQ2hhdHJvb21Sb3V0ZXIgPSBCYWNrYm9uZS5Sb3V0ZXIuZXh0ZW5kKHtcbiAgICBcbiAgICByb3V0ZXM6IHtcbiAgICAgICcnOiAnc3RhcnQnLFxuICAgICAgJ2xvZyc6ICdsb2dpbicsXG4gICAgICAncmVnJzogJ3JlZ2lzdGVyJyxcbiAgICAgICdsb2dvdXQnOiAnbG9nb3V0JyxcbiAgICAgICdhdXRoZW50aWNhdGVkJzogJ2F1dGhlbnRpY2F0ZWQnLFxuICAgICAgJ2ZhY2Vib29rJzogJ2ZhY2Vib29rJyxcbiAgICAgICd0d2l0dGVyJzogJ3R3aXR0ZXInXG4gICAgfSxcblxuICAgIHN0YXJ0OiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgYXBwLm1haW5Db250cm9sbGVyID0gbmV3IGFwcC5NYWluQ29udHJvbGxlcigpO1xuICAgICAgYXBwLm1haW5Db250cm9sbGVyLmluaXQoKTtcbiAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBsb2dpbjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbG9naW5Nb2RlbCA9IG5ldyBhcHAuTG9naW5Nb2RlbCgpO1xuICAgICAgdmFyIGxvZ2luVmlldyA9IG5ldyBhcHAuTG9naW5WaWV3KHt2ZW50OiBhcHAubWFpbkNvbnRyb2xsZXIudmlld0V2ZW50QnVzLCBtb2RlbDogbG9naW5Nb2RlbH0pO1xuICAgICAgYXBwLm1haW5Db250cm9sbGVyLmNvbnRhaW5lck1vZGVsLnNldChcInZpZXdTdGF0ZVwiLCBsb2dpblZpZXcpO1xuICAgIH0sXG5cbiAgICByZWdpc3RlcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcmVnaXN0ZXJWaWV3ID0gbmV3IGFwcC5SZWdpc3RlclZpZXcoe3ZlbnQ6IGFwcC5tYWluQ29udHJvbGxlci52aWV3RXZlbnRCdXMgfSk7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIuY29udGFpbmVyTW9kZWwuc2V0KFwidmlld1N0YXRlXCIsIHJlZ2lzdGVyVmlldyk7XG4gICAgfSxcblxuICAgIGxvZ291dDogZnVuY3Rpb24oKSB7XG4gICAgICAvLyAkKCcjbG9nb3V0Jykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICB1cmw6IFwiL2xvZ291dFwiLFxuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIH0pO1xuICAgICAgICAgIGRlYnVnZ2VyO1xuICAgICAgICAgIHRoaXNfLmxvZ2luKCk7XG4gICAgICAgICAgYXBwLm1haW5Db250cm9sbGVyLmxvZ291dCgpO1xuXG4gICAgICAvLyB9KTtcbiAgICB9LFxuXG4gICAgYXV0aGVudGljYXRlZDogZnVuY3Rpb24oKSB7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIuYXV0aGVudGljYXRlZCgpO1xuICAgIH0sXG4gICAgZmFjZWJvb2s6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5zdGFydCh0aGlzLmF1dGhlbnRpY2F0ZWQpO1xuICAgIH0sXG4gICAgdHdpdHRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnN0YXJ0KHRoaXMuYXV0aGVudGljYXRlZCk7XG4gICAgfSxcblxuICB9KTtcblxuICBhcHAuQ2hhdHJvb21Sb3V0ZXIgPSBuZXcgQ2hhdHJvb21Sb3V0ZXIoKTtcbiAgQmFja2JvbmUuaGlzdG9yeS5zdGFydCgpO1xuXG59KSgpOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==