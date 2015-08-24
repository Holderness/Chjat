
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
  chatTemplate: _.template($('#chatbox-message-template').html()),
  nameTemplate: _.template($('#chatroom-name-template').html()),
  dateTemplate: _.template('<div class="followMeBar col-xs-12 col-sm-12 col-md-12"><span>-----------------</span><span> <%= moment(timestamp).format("dddd, MMMM Do YYYY") %> </span><span>-----------------</span></div>'),
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
  setChatListeners: function() {

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

    this.listenTo(this.model, "change:chatroom", this.renderName, this);

  },

  getChatroomModel: function(name) {
    console.log('crv.f.getChatroomModel');
    this.vent.trigger('getChatroomModel', name);
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
    autosize($('textarea.message-input'));
    this.dateDivider.load($(".followMeBar"));
  },
  renderChat: function(model) {
    this.renderDateDividers(model);
    var chatTemplate = $(this.chatTemplate(model.toJSON()));
    chatTemplate.appendTo(this.$('.chatbox-content')).hide().fadeIn().slideDown();
    $('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
  },
  renderDateDividers: function(model) {
    this.currentDate = moment(model.attributes.timestamp).format('dddd, MMMM Do YYYY');
    if ( this.currentDate !== this.previousDate ) {
      var currentDate = $(this.dateTemplate(model.toJSON()));
      currentDate.appendTo(this.$('.chatbox-content')).hide().fadeIn().slideDown();
      this.previousDate = this.currentDate;
    }
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
  },


  dateDivider: (function() {

  var $window = $(window),
      $stickies;

  load = function(stickies) {

      $stickies = stickies.each(function() {

        var $thisSticky = $(this).wrap('<div class="followWrap row" />');
  
        $thisSticky
            .data('originalPosition', $thisSticky.offset().top)
            .data('originalHeight', $thisSticky.outerHeight())
              .parent()
              .height($thisSticky.outerHeight());
        console.log('thissticky.originalposition', $thisSticky.offset().top);
      });
      
      $('#chatbox-content').scroll(scrollStickiesInit);

  };


  scrollStickiesInit = function() {
    $(this).off("scroll.stickies");
    $(this).on("scroll.stickies", _.debounce(_whenScrolling, 150));
  };


  _whenScrolling = function() {

    $stickies.each(function(i, sticky) {

      var $thisSticky = $(sticky),
          $thisStickyTop = $thisSticky.offset().top,

          $prevSticky = $stickies.eq(i - 1),
          $prevStickyTop = $prevSticky.offset().top,
          $prevStickyPosition = $prevSticky.data('originalPosition');


      if ($thisStickyTop >= 140 && $thisStickyTop <= 180) {

        var $nextSticky = $stickies.eq(i + 1) || null,

        $thisStickyPosition = $thisSticky.data('originalPosition'),
        $thisAndPrevStickyDifference = Math.abs($prevStickyPosition - $thisStickyPosition);

        $thisSticky.addClass("fixed");

        // var $nextStickyPosition = $nextSticky.data('originalPosition');
        // var $thisAndNextStickyDifference = Math.abs($thisStickyPosition - $nextStickyPosition);
        // var $nextStickyTop = $nextSticky.offset().top;
        // console.log('-------------');
        // console.log('prevstickyoriginposition', $prevStickyPosition);
        // console.log('prevstickytop', $prevStickyTop);
        // console.log('$thisAndPrevStickyDifference', $thisAndPrevStickyDifference);
        // console.log('thisStickyTop', $thisStickyTop);
        // console.log('$thisAndNextStickyDifference', $thisAndNextStickyDifference);
        // console.log('nextStickyTop', $nextStickyTop);
        // console.log('nextstickyoriginposition', $nextStickyPosition);
        // console.log('prev', $prevSticky);
        // console.log('this', $thisSticky);
        // console.log('next', $nextSticky);
        // console.log('nextstickytop', $nextStickyTop);
        // console.log('-------------');
        

      //scrolling up
         if ($nextSticky.hasClass("fixed")) {
           $nextSticky.removeClass("fixed");
         }

      // scrolling up and sticking to proper position
         if ($prevStickyTop + $thisAndPrevStickyDifference > 157 && i !== 0) {

            $nextSticky.removeClass("fixed");
            $prevSticky.addClass("fixed");
         }

      // scrolling down
        if ($prevStickyTop >= 157 && $prevSticky.hasClass("fixed") && i !== 0) {
           $prevSticky.removeClass("fixed");
         }

      }

      if ($('#chatbox-content').scrollTop() === 0) {
        $stickies.removeClass('fixed');
      }

    });

  };

  return {
    load: load
  };
})()




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

  app.NavbarView = Backbone.View.extend({
    el: '.login-menu',
    template: _.template("<ul class='nav navbar-right'><% if (username) { %><li><a href='/'><i class='fa fa-power-off power-off-style fa-2x'></i></a></li><% } else { %><li><a href='#log'>login</a></li><li><a href='#reg'>register</a></li><% } %></ul>"),
    events: {
      
    },
    initialize: function() {
      this.model = new app.UserModel({ username: '' });
      this.render();
      this.listenTo(this.model, "change", this.render, this);
    },
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    },


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
  // self.logout = function() {
  //   self.socket.emit("wut");
  // };



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

    socket.on('login', function(username) {
      self.vent.trigger('loginUser', username);
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
    self.navbarView = new app.NavbarView();

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
       
    $("body").css("overflow", "hidden");
    self.chatClient = new ChatClient({ vent: self.appEventBus });
    self.chatClient.connect();

    // new model and view created for chatroom
    self.chatroomModel = new app.ChatroomModel({ name: 'DOO' });
    self.chatroomList = new app.ChatroomList();
    self.chatroomList.fetch().done(function() {
      self.chatroomModel.set('chatrooms', self.chatroomList);
      self.chatroomView  = new app.ChatroomView({vent: self.viewEventBus, model: self.chatroomModel });
      self.containerModel.set('viewState', self.chatroomView);

      self.connectToRoom();
      self.initRoom();
       
      // console.log('authent');
      // setTimeout(function(){
      //   self.chatClient.connectToRoom("DOO");
      // }, 1500);
      // setTimeout(function(){
      //   self.chatroomView.initRoom();
      // }, 2000);
      // setTimeout(function(){
      //   self.dateDivider.load($(".followMeBar"));
      // }, 2001);
    });

  };

  self.connectToRoom = function(callback) {
    self.chatClient.connectToRoom("DOO");
  };

  self.initRoom = function(callback) {
    self.chatroomView.initRoom();
  };

  self.setDateDivider = function() {
    self.dateDivider.load($(".followMeBar"));
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



  self.appEventBus.on("loginUser", function(username) {
    console.log('main.e.loginUser: ', username);
    var user = new app.UserModel({username: username});
    self.navbarView.model.set(user.toJSON());
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
		$('#chatbox-content')[0].scrollTop = $('#chatbox-content')[0].scrollHeight;
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

  $(window).bind('beforeunload', function(eventObject) {
    $.ajax({
       url: "/logout",
    });
  });

  var ChatroomRouter = Backbone.Router.extend({
    
    routes: {
      '': 'start',
      'log': 'login',
      'reg': 'register',
      'out': 'out',
      'authenticated': 'authenticated',
      'facebook': 'facebook',
      'twitter': 'twitter'
    },

    start: function(callback) {
      window.location.href = '/#';
      app.mainController = new app.MainController();
      app.mainController.init();
      if (callback) {
        callback();
      } else {
        $.ajax({
          url: "/logout",
        });
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

    out: function() {
        var this_ = this;
        $.ajax({
          url: "/logout",
        })
    },

    authenticated: function() {
      if (!app.mainController) { return this.start(); }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYXQuanMiLCJjaGF0cm9vbS1oZWFkZXIuanMiLCJjb250YWluZXIuanMiLCJsb2dpbi5qcyIsInVzZXIuanMiLCJjaGF0cm9vbS5qcyIsInJvb20uanMiLCJuYXZiYXIuanMiLCJyZWdpc3Rlci5qcyIsInNvY2tldGNsaWVudC5qcyIsIm1haW4uanMiLCJyb3V0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FKUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUlUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FEVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FIclBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FJbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5DaGF0Q29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcbiAgICBtb2RlbDogYXBwLkNoYXRNb2RlbFxuICB9KTtcblxufSkoKTsiLCJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLkNoYXRyb29tSGVhZGVyTW9kZWwgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoe30pO1xuXG59KSgpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5Db250YWluZXJWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIGVsOiAnI3ZpZXctY29udGFpbmVyJyxcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLm1vZGVsLm9uKFwiY2hhbmdlOnZpZXdTdGF0ZVwiLCB0aGlzLnJlbmRlciwgdGhpcyk7XG4gICAgfSxcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHZpZXcgPSB0aGlzLm1vZGVsLmdldCgndmlld1N0YXRlJyk7XG4gICAgICB0aGlzLiRlbC5odG1sKHZpZXcucmVuZGVyKCkuZWwpO1xuICAgIH1cbiAgfSk7XG5cbn0pKGpRdWVyeSk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbiAgYXBwLkxvZ2luVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjbG9naW4nKS5odG1sKCkpLFxuICAgIGV2ZW50czoge1xuICAgICAgJ3N1Ym1pdCc6ICdvbkxvZ2luJyxcbiAgICAgICdrZXlwcmVzcyc6ICdvbkhpdEVudGVyJ1xuICAgIH0sXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIC8vIExvZ2luVmlldyBnZXRzIHBhc3NlZCB0aGUgdmlld0V2ZW50QnVzIHdoZW4gdGhlIE1haW5Db250cm9sbGVyIGlzIGluaXRpYWxpemVkXG4gICAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XG5cbiAgICAvLyBUaGlzIHRlbGxzIHRoZSB2aWV3IHRvIGxpc3RlbiB0byBhbiBldmVudCBvbiBpdHMgbW9kZWwsXG4gICAgLy8gaWYgdGhlcmUncyBhbiBlcnJvciwgdGhlIGNhbGxiYWNrICh0aGlzLnJlbmRlcikgaXMgY2FsbGVkIHdpdGggdGhlICBcbiAgICAvLyB2aWV3IGFzIGNvbnRleHRcbiAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJjaGFuZ2U6ZXJyb3JcIiwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzLm1vZGVsLnRvSlNPTigpKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIG9uTG9naW46IGZ1bmN0aW9uKGUpIHtcbiAgICAgIC8vIHRyaWdnZXJzIHRoZSBsb2dpbiBldmVudCBhbmQgcGFzc2luZyB0aGUgdXNlcm5hbWUgZGF0YSB0byBqcy9tYWluLmpzXG4gICAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgICQuYWpheCh7XG4gICAgICAgIHVybDogXCIvbG9naW5cIixcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGRhdGE6IHt1c2VybmFtZTogdGhpcy4kKCcjdXNlcm5hbWUnKS52YWwoKSwgcGFzc3dvcmQ6IHRoaXMuJCgnI3Bhc3N3b3JkJykudmFsKCl9LFxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgIGNvbnNvbGUubG9nKCdzdWNjZXNzIGRhdGE6ICcsIGRhdGEpO1xuICAgICAgICAgICBpZiAoZGF0YSA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgLy8gdGhpc18udmVudC50cmlnZ2VyKCdhdXRoZW50aWNhdGVkJyk7XG4gICAgICAgICAgICBhcHAuQ2hhdHJvb21Sb3V0ZXIubmF2aWdhdGUoJ2F1dGhlbnRpY2F0ZWQnLCB7IHRyaWdnZXI6IHRydWUgfSk7XG4gICAgICAgICAgICB0aGlzXy52ZW50LnRyaWdnZXIoXCJsb2dpblwiLCB7dXNlcm5hbWU6IHRoaXNfLiQoJyN1c2VybmFtZScpLnZhbCgpLCBwYXNzd29yZDogdGhpc18uJCgnI3Bhc3N3b3JkJykudmFsKCl9KTtcbiAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KS5kb25lKGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnZG9uZWVlZWVlZWUnKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgLy8gb25IaXRFbnRlcjogZnVuY3Rpb24oZSkge1xuICAgIC8vICAgaWYoZS5rZXlDb2RlID09IDEzKSB7XG4gICAgLy8gICAgIHRoaXMub25Mb2dpbigpO1xuICAgIC8vICAgICByZXR1cm4gZmFsc2U7XG4gICAgLy8gICB9XG4gICAgLy8gfVxuICB9KTtcbiAgXG59KShqUXVlcnkpOyIsIlxudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuVXNlckNvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7bW9kZWw6IGFwcC5Vc2VyTW9kZWx9KTtcblxufSkoKTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuYXBwLkNoYXRyb29tVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2NoYXRyb29tLXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgY2hhdFRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNjaGF0Ym94LW1lc3NhZ2UtdGVtcGxhdGUnKS5odG1sKCkpLFxuICBuYW1lVGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2NoYXRyb29tLW5hbWUtdGVtcGxhdGUnKS5odG1sKCkpLFxuICBkYXRlVGVtcGxhdGU6IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJmb2xsb3dNZUJhciBjb2wteHMtMTIgY29sLXNtLTEyIGNvbC1tZC0xMlwiPjxzcGFuPi0tLS0tLS0tLS0tLS0tLS0tPC9zcGFuPjxzcGFuPiA8JT0gbW9tZW50KHRpbWVzdGFtcCkuZm9ybWF0KFwiZGRkZCwgTU1NTSBEbyBZWVlZXCIpICU+IDwvc3Bhbj48c3Bhbj4tLS0tLS0tLS0tLS0tLS0tLTwvc3Bhbj48L2Rpdj4nKSxcbiAgZXZlbnRzOiB7XG4gICAgJ2tleXByZXNzIC5tZXNzYWdlLWlucHV0JzogJ21lc3NhZ2VJbnB1dFByZXNzZWQnLFxuICAgICdjbGljayAuY2hhdC1kaXJlY3RvcnkgLnJvb20nOiAnc2V0Um9vbSdcbiAgfSxcbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIGNvbnNvbGUubG9nKCdjaGF0cm9vbVZpZXcuZi5pbml0aWFsaXplOiAnLCBvcHRpb25zKTtcbiAgICAvLyBwYXNzZWQgdGhlIHZpZXdFdmVudEJ1c1xuICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcbiAgfSxcbiAgaW5pdFJvb206IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMucmVuZGVyTmFtZSgpO1xuICB9LFxuICByZW5kZXI6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlcicpO1xuICAgIHRoaXMubW9kZWwgPSBtb2RlbCB8fCB0aGlzLm1vZGVsO1xuICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzLm1vZGVsLnRvSlNPTigpKSk7XG4gICAgLy8gdGhpcy5zZXRDaGF0Q29sbGVjdGlvbigpO1xuICAgIHRoaXMuc2V0Q2hhdExpc3RlbmVycygpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBzZXRDaGF0TGlzdGVuZXJzOiBmdW5jdGlvbigpIHtcblxuICAgIHZhciBvbmxpbmVVc2VycyA9IHRoaXMubW9kZWwuZ2V0KCdvbmxpbmVVc2VycycpO1xuICAgIHRoaXMubGlzdGVuVG8ob25saW5lVXNlcnMsIFwiYWRkXCIsIHRoaXMucmVuZGVyVXNlciwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJyZW1vdmVcIiwgdGhpcy5yZW5kZXJVc2VycywgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJyZXNldFwiLCB0aGlzLnJlbmRlclVzZXJzLCB0aGlzKTtcblxuICAgIHZhciBjaGF0bG9nID0gdGhpcy5tb2RlbC5nZXQoJ2NoYXRsb2cnKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRsb2csIFwiYWRkXCIsIHRoaXMucmVuZGVyQ2hhdCwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhjaGF0bG9nLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlckNoYXRzLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRsb2csIFwicmVzZXRcIiwgdGhpcy5yZW5kZXJDaGF0cywgdGhpcyk7XG5cbiAgICB2YXIgY2hhdHJvb21zID0gdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tcycpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcImFkZFwiLCB0aGlzLnJlbmRlclJvb20sIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlclJvb21zLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRyb29tcywgXCJyZXNldFwiLCB0aGlzLnJlbmRlclJvb21zLCB0aGlzKTtcblxuICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJjaGFuZ2U6Y2hhdHJvb21cIiwgdGhpcy5yZW5kZXJOYW1lLCB0aGlzKTtcblxuICB9LFxuXG4gIGdldENoYXRyb29tTW9kZWw6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYuZ2V0Q2hhdHJvb21Nb2RlbCcpO1xuICAgIHRoaXMudmVudC50cmlnZ2VyKCdnZXRDaGF0cm9vbU1vZGVsJywgbmFtZSk7XG4gIH0sXG4gIC8vIHJlbmRlcnMgb24gZXZlbnRzLCBjYWxsZWQganVzdCBhYm92ZVxuICByZW5kZXJOYW1lOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLiQoJy5jaGF0Ym94LWhlYWRlcicpLmh0bWwodGhpcy5uYW1lVGVtcGxhdGUodGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tJykudG9KU09OKCkpKTtcbiAgfSxcbiAgcmVuZGVyVXNlcnM6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5yZW5kZXJVc2VycycpO1xuICAgIGNvbnNvbGUubG9nKCdVU0VSUzogJywgdGhpcy5tb2RlbC5nZXQoXCJvbmxpbmVVc2Vyc1wiKSk7XG4gICAgdGhpcy4kKCcub25saW5lLXVzZXJzJykuZW1wdHkoKTtcbiAgICB0aGlzLm1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpLmVhY2goZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgIHRoaXMucmVuZGVyVXNlcih1c2VyKTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyVXNlcjogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBfLnRlbXBsYXRlKCQoXCIjb25saW5lLXVzZXJzLWxpc3QtdGVtcGxhdGVcIikuaHRtbCgpKTtcbiAgICB0aGlzLiQoJy5vbmxpbmUtdXNlcnMnKS5hcHBlbmQodGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgfSxcbiAgcmVuZGVyQ2hhdHM6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5yZW5kZXJDaGF0cycpO1xuICAgIGNvbnNvbGUubG9nKCdDSEFUTE9HOiAnLCB0aGlzLm1vZGVsLmdldChcImNoYXRsb2dcIikpO1xuICAgIHRoaXMuJCgnLmNoYXRib3gtY29udGVudCcpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoJ2NoYXRsb2cnKS5lYWNoKGZ1bmN0aW9uKGNoYXQpIHtcbiAgICAgIHRoaXMucmVuZGVyQ2hhdChjaGF0KTtcbiAgICB9LCB0aGlzKTtcbiAgICBhdXRvc2l6ZSgkKCd0ZXh0YXJlYS5tZXNzYWdlLWlucHV0JykpO1xuICAgIHRoaXMuZGF0ZURpdmlkZXIubG9hZCgkKFwiLmZvbGxvd01lQmFyXCIpKTtcbiAgfSxcbiAgcmVuZGVyQ2hhdDogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB0aGlzLnJlbmRlckRhdGVEaXZpZGVycyhtb2RlbCk7XG4gICAgdmFyIGNoYXRUZW1wbGF0ZSA9ICQodGhpcy5jaGF0VGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICBjaGF0VGVtcGxhdGUuYXBwZW5kVG8odGhpcy4kKCcuY2hhdGJveC1jb250ZW50JykpLmhpZGUoKS5mYWRlSW4oKS5zbGlkZURvd24oKTtcbiAgICAkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnLmNoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcbiAgfSxcbiAgcmVuZGVyRGF0ZURpdmlkZXJzOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHRoaXMuY3VycmVudERhdGUgPSBtb21lbnQobW9kZWwuYXR0cmlidXRlcy50aW1lc3RhbXApLmZvcm1hdCgnZGRkZCwgTU1NTSBEbyBZWVlZJyk7XG4gICAgaWYgKCB0aGlzLmN1cnJlbnREYXRlICE9PSB0aGlzLnByZXZpb3VzRGF0ZSApIHtcbiAgICAgIHZhciBjdXJyZW50RGF0ZSA9ICQodGhpcy5kYXRlVGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICAgIGN1cnJlbnREYXRlLmFwcGVuZFRvKHRoaXMuJCgnLmNoYXRib3gtY29udGVudCcpKS5oaWRlKCkuZmFkZUluKCkuc2xpZGVEb3duKCk7XG4gICAgICB0aGlzLnByZXZpb3VzRGF0ZSA9IHRoaXMuY3VycmVudERhdGU7XG4gICAgfVxuICB9LFxuXG5cbiAgLy8gcmVuZGVycyBvbiBldmVudHMsIGNhbGxlZCBqdXN0IGFib3ZlXG4gIHJlbmRlclJvb21zOiBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYucmVuZGVyUm9vbXMnKTtcbiAgICBjb25zb2xlLmxvZygnQ0hBVFJPT01TOiAnLCB0aGlzLm1vZGVsLmdldChcImNoYXRyb29tc1wiKSk7XG4gICAgdGhpcy4kKCcucHVibGljLXJvb21zLWNvbnRhaW5lcicpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tcycpLmVhY2goZnVuY3Rpb24gKHJvb20pIHtcbiAgICAgIHRoaXMucmVuZGVyUm9vbShyb29tKTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyUm9vbTogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBfLnRlbXBsYXRlKCQoXCIjcm9vbS1saXN0LXRlbXBsYXRlXCIpLmh0bWwoKSk7XG4gICAgdGhpcy4kKCcucHVibGljLXJvb21zLWNvbnRhaW5lcicpLmFwcGVuZCh0ZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICB9LFxuXG4gIGpvaW5Sb29tOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLmpvaW5Sb29tJyk7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoJ2pvaW5Sb29tJywgbmFtZSk7XG4gIH0sXG5cblxuICAvL2V2ZW50c1xuICBtZXNzYWdlSW5wdXRQcmVzc2VkOiBmdW5jdGlvbihlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMgJiYgJC50cmltKCQoJy5tZXNzYWdlLWlucHV0JykudmFsKCkpLmxlbmd0aCA+IDApIHtcbiAgICAgIC8vIGZ1biBmYWN0OiBzZXBhcmF0ZSBldmVudHMgd2l0aCBhIHNwYWNlIGluIHRyaWdnZXIncyBmaXJzdCBhcmcgYW5kIHlvdVxuICAgICAgLy8gY2FuIHRyaWdnZXIgbXVsdGlwbGUgZXZlbnRzLlxuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJjaGF0XCIsIHRoaXMuJCgnLm1lc3NhZ2UtaW5wdXQnKS52YWwoKSk7XG4gICAgICB0aGlzLiQoJy5tZXNzYWdlLWlucHV0JykudmFsKCcnKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJ0eXBpbmdcIik7XG4gICAgICBjb25zb2xlLmxvZygnd3V0Jyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBzZXRSb29tOiBmdW5jdGlvbihlKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnNldFJvb20nKTtcbiAgICB2YXIgJHRhciA9ICQoZS50YXJnZXQpO1xuICAgIGlmICgkdGFyLmlzKCdwJykpIHtcbiAgICAgIHRoaXMuam9pblJvb20oJHRhci5kYXRhKCdyb29tJykpO1xuICAgIH1cbiAgfSxcblxuXG4gIGRhdGVEaXZpZGVyOiAoZnVuY3Rpb24oKSB7XG5cbiAgdmFyICR3aW5kb3cgPSAkKHdpbmRvdyksXG4gICAgICAkc3RpY2tpZXM7XG5cbiAgbG9hZCA9IGZ1bmN0aW9uKHN0aWNraWVzKSB7XG5cbiAgICAgICRzdGlja2llcyA9IHN0aWNraWVzLmVhY2goZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyICR0aGlzU3RpY2t5ID0gJCh0aGlzKS53cmFwKCc8ZGl2IGNsYXNzPVwiZm9sbG93V3JhcCByb3dcIiAvPicpO1xuICBcbiAgICAgICAgJHRoaXNTdGlja3lcbiAgICAgICAgICAgIC5kYXRhKCdvcmlnaW5hbFBvc2l0aW9uJywgJHRoaXNTdGlja3kub2Zmc2V0KCkudG9wKVxuICAgICAgICAgICAgLmRhdGEoJ29yaWdpbmFsSGVpZ2h0JywgJHRoaXNTdGlja3kub3V0ZXJIZWlnaHQoKSlcbiAgICAgICAgICAgICAgLnBhcmVudCgpXG4gICAgICAgICAgICAgIC5oZWlnaHQoJHRoaXNTdGlja3kub3V0ZXJIZWlnaHQoKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKCd0aGlzc3RpY2t5Lm9yaWdpbmFscG9zaXRpb24nLCAkdGhpc1N0aWNreS5vZmZzZXQoKS50b3ApO1xuICAgICAgfSk7XG4gICAgICBcbiAgICAgICQoJyNjaGF0Ym94LWNvbnRlbnQnKS5zY3JvbGwoc2Nyb2xsU3RpY2tpZXNJbml0KTtcblxuICB9O1xuXG5cbiAgc2Nyb2xsU3RpY2tpZXNJbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgJCh0aGlzKS5vZmYoXCJzY3JvbGwuc3RpY2tpZXNcIik7XG4gICAgJCh0aGlzKS5vbihcInNjcm9sbC5zdGlja2llc1wiLCBfLmRlYm91bmNlKF93aGVuU2Nyb2xsaW5nLCAxNTApKTtcbiAgfTtcblxuXG4gIF93aGVuU2Nyb2xsaW5nID0gZnVuY3Rpb24oKSB7XG5cbiAgICAkc3RpY2tpZXMuZWFjaChmdW5jdGlvbihpLCBzdGlja3kpIHtcblxuICAgICAgdmFyICR0aGlzU3RpY2t5ID0gJChzdGlja3kpLFxuICAgICAgICAgICR0aGlzU3RpY2t5VG9wID0gJHRoaXNTdGlja3kub2Zmc2V0KCkudG9wLFxuXG4gICAgICAgICAgJHByZXZTdGlja3kgPSAkc3RpY2tpZXMuZXEoaSAtIDEpLFxuICAgICAgICAgICRwcmV2U3RpY2t5VG9wID0gJHByZXZTdGlja3kub2Zmc2V0KCkudG9wLFxuICAgICAgICAgICRwcmV2U3RpY2t5UG9zaXRpb24gPSAkcHJldlN0aWNreS5kYXRhKCdvcmlnaW5hbFBvc2l0aW9uJyk7XG5cblxuICAgICAgaWYgKCR0aGlzU3RpY2t5VG9wID49IDE0MCAmJiAkdGhpc1N0aWNreVRvcCA8PSAxODApIHtcblxuICAgICAgICB2YXIgJG5leHRTdGlja3kgPSAkc3RpY2tpZXMuZXEoaSArIDEpIHx8IG51bGwsXG5cbiAgICAgICAgJHRoaXNTdGlja3lQb3NpdGlvbiA9ICR0aGlzU3RpY2t5LmRhdGEoJ29yaWdpbmFsUG9zaXRpb24nKSxcbiAgICAgICAgJHRoaXNBbmRQcmV2U3RpY2t5RGlmZmVyZW5jZSA9IE1hdGguYWJzKCRwcmV2U3RpY2t5UG9zaXRpb24gLSAkdGhpc1N0aWNreVBvc2l0aW9uKTtcblxuICAgICAgICAkdGhpc1N0aWNreS5hZGRDbGFzcyhcImZpeGVkXCIpO1xuXG4gICAgICAgIC8vIHZhciAkbmV4dFN0aWNreVBvc2l0aW9uID0gJG5leHRTdGlja3kuZGF0YSgnb3JpZ2luYWxQb3NpdGlvbicpO1xuICAgICAgICAvLyB2YXIgJHRoaXNBbmROZXh0U3RpY2t5RGlmZmVyZW5jZSA9IE1hdGguYWJzKCR0aGlzU3RpY2t5UG9zaXRpb24gLSAkbmV4dFN0aWNreVBvc2l0aW9uKTtcbiAgICAgICAgLy8gdmFyICRuZXh0U3RpY2t5VG9wID0gJG5leHRTdGlja3kub2Zmc2V0KCkudG9wO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLScpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygncHJldnN0aWNreW9yaWdpbnBvc2l0aW9uJywgJHByZXZTdGlja3lQb3NpdGlvbik7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdwcmV2c3RpY2t5dG9wJywgJHByZXZTdGlja3lUb3ApO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnJHRoaXNBbmRQcmV2U3RpY2t5RGlmZmVyZW5jZScsICR0aGlzQW5kUHJldlN0aWNreURpZmZlcmVuY2UpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygndGhpc1N0aWNreVRvcCcsICR0aGlzU3RpY2t5VG9wKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJyR0aGlzQW5kTmV4dFN0aWNreURpZmZlcmVuY2UnLCAkdGhpc0FuZE5leHRTdGlja3lEaWZmZXJlbmNlKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ25leHRTdGlja3lUb3AnLCAkbmV4dFN0aWNreVRvcCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCduZXh0c3RpY2t5b3JpZ2lucG9zaXRpb24nLCAkbmV4dFN0aWNreVBvc2l0aW9uKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3ByZXYnLCAkcHJldlN0aWNreSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCd0aGlzJywgJHRoaXNTdGlja3kpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnbmV4dCcsICRuZXh0U3RpY2t5KTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ25leHRzdGlja3l0b3AnLCAkbmV4dFN0aWNreVRvcCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0tJyk7XG4gICAgICAgIFxuXG4gICAgICAvL3Njcm9sbGluZyB1cFxuICAgICAgICAgaWYgKCRuZXh0U3RpY2t5Lmhhc0NsYXNzKFwiZml4ZWRcIikpIHtcbiAgICAgICAgICAgJG5leHRTdGlja3kucmVtb3ZlQ2xhc3MoXCJmaXhlZFwiKTtcbiAgICAgICAgIH1cblxuICAgICAgLy8gc2Nyb2xsaW5nIHVwIGFuZCBzdGlja2luZyB0byBwcm9wZXIgcG9zaXRpb25cbiAgICAgICAgIGlmICgkcHJldlN0aWNreVRvcCArICR0aGlzQW5kUHJldlN0aWNreURpZmZlcmVuY2UgPiAxNTcgJiYgaSAhPT0gMCkge1xuXG4gICAgICAgICAgICAkbmV4dFN0aWNreS5yZW1vdmVDbGFzcyhcImZpeGVkXCIpO1xuICAgICAgICAgICAgJHByZXZTdGlja3kuYWRkQ2xhc3MoXCJmaXhlZFwiKTtcbiAgICAgICAgIH1cblxuICAgICAgLy8gc2Nyb2xsaW5nIGRvd25cbiAgICAgICAgaWYgKCRwcmV2U3RpY2t5VG9wID49IDE1NyAmJiAkcHJldlN0aWNreS5oYXNDbGFzcyhcImZpeGVkXCIpICYmIGkgIT09IDApIHtcbiAgICAgICAgICAgJHByZXZTdGlja3kucmVtb3ZlQ2xhc3MoXCJmaXhlZFwiKTtcbiAgICAgICAgIH1cblxuICAgICAgfVxuXG4gICAgICBpZiAoJCgnI2NoYXRib3gtY29udGVudCcpLnNjcm9sbFRvcCgpID09PSAwKSB7XG4gICAgICAgICRzdGlja2llcy5yZW1vdmVDbGFzcygnZml4ZWQnKTtcbiAgICAgIH1cblxuICAgIH0pO1xuXG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBsb2FkOiBsb2FkXG4gIH07XG59KSgpXG5cblxuXG5cbn0pO1xuXG59KShqUXVlcnkpOyIsIlxudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuQ2hhdHJvb21MaXN0ID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe1xuICAgIG1vZGVsOiBhcHAuQ2hhdHJvb21Nb2RlbCxcbiAgICB1cmw6ICcvYXBpL2NoYXRyb29tcycsXG4gIH0pO1xuXG59KSgpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5OYXZiYXJWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIGVsOiAnLmxvZ2luLW1lbnUnLFxuICAgIHRlbXBsYXRlOiBfLnRlbXBsYXRlKFwiPHVsIGNsYXNzPSduYXYgbmF2YmFyLXJpZ2h0Jz48JSBpZiAodXNlcm5hbWUpIHsgJT48bGk+PGEgaHJlZj0nLyc+PGkgY2xhc3M9J2ZhIGZhLXBvd2VyLW9mZiBwb3dlci1vZmYtc3R5bGUgZmEtMngnPjwvaT48L2E+PC9saT48JSB9IGVsc2UgeyAlPjxsaT48YSBocmVmPScjbG9nJz5sb2dpbjwvYT48L2xpPjxsaT48YSBocmVmPScjcmVnJz5yZWdpc3RlcjwvYT48L2xpPjwlIH0gJT48L3VsPlwiKSxcbiAgICBldmVudHM6IHtcbiAgICAgIFxuICAgIH0sXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLm1vZGVsID0gbmV3IGFwcC5Vc2VyTW9kZWwoeyB1c2VybmFtZTogJycgfSk7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImNoYW5nZVwiLCB0aGlzLnJlbmRlciwgdGhpcyk7XG4gICAgfSxcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKHRoaXMubW9kZWwudG9KU09OKCkpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cblxuICB9KTtcblxufSkoalF1ZXJ5KTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuICBhcHAuUmVnaXN0ZXJWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIHRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNyZWdpc3RlcicpLmh0bWwoKSksXG4gICAgZXZlbnRzOiB7XG4gICAgICBcImNsaWNrICNzaWduVXBCdG5cIjogXCJzaWduVXBcIlxuICAgIH0sXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9LFxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUoKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNpZ25VcDogZnVuY3Rpb24oKSB7XG4gICAgfVxuICB9KTtcblxufSkoalF1ZXJ5KTsiLCJcbi8vIFRoZSBDaGF0Q2xpZW50IGlzIGltcGxlbWVudGVkIG9uIG1haW4uanMuXG4vLyBUaGUgY2hhdGNsaWVudCBpcyBhIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIG9uIHRoZSBNYWluQ29udHJvbGxlci5cbi8vIEl0IGJvdGggbGlzdGVucyB0byBhbmQgZW1pdHMgZXZlbnRzIG9uIHRoZSBzb2NrZXQsIGVnOlxuLy8gSXQgaGFzIGl0cyBvd24gbWV0aG9kcyB0aGF0LCB3aGVuIGNhbGxlZCwgZW1pdCB0byB0aGUgc29ja2V0IHcvIGRhdGEuXG4vLyBJdCBhbHNvIHNldHMgcmVzcG9uc2UgbGlzdGVuZXJzIG9uIGNvbm5lY3Rpb24sIHRoZXNlIHJlc3BvbnNlIGxpc3RlbmVyc1xuLy8gbGlzdGVuIHRvIHRoZSBzb2NrZXQgYW5kIHRyaWdnZXIgZXZlbnRzIG9uIHRoZSBhcHBFdmVudEJ1cyBvbiB0aGUgXG4vLyBNYWluQ29udHJvbGxlclxudmFyIENoYXRDbGllbnQgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdC8vIGlzLXR5cGluZyBoZWxwZXIgdmFyaWFibGVzXG5cdHZhciBUWVBJTkdfVElNRVJfTEVOR1RIID0gNDAwOyAvLyBtc1xuICB2YXIgdHlwaW5nID0gZmFsc2U7XG4gIHZhciBsYXN0VHlwaW5nVGltZTtcbiAgXG4gIC8vIHRoaXMgdmVudCBob2xkcyB0aGUgYXBwRXZlbnRCdXNcblx0c2VsZi52ZW50ID0gb3B0aW9ucy52ZW50O1xuXG5cdHNlbGYuaG9zdG5hbWUgPSAnaHR0cDovLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdDtcblxuICAvLyBjb25uZWN0cyB0byBzb2NrZXQsIHNldHMgcmVzcG9uc2UgbGlzdGVuZXJzXG5cdHNlbGYuY29ubmVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmNvbm5lY3QnKTtcblx0XHQvLyB0aGlzIGlvIG1pZ2h0IGJlIGEgbGl0dGxlIGNvbmZ1c2luZy4uLiB3aGVyZSBpcyBpdCBjb21pbmcgZnJvbT9cblx0XHQvLyBpdCdzIGNvbWluZyBmcm9tIHRoZSBzdGF0aWMgbWlkZGxld2FyZSBvbiBzZXJ2ZXIuanMgYmMgZXZlcnl0aGluZ1xuXHRcdC8vIGluIHRoZSAvcHVibGljIGZvbGRlciBoYXMgYmVlbiBhdHRhY2hlZCB0byB0aGUgc2VydmVyLCBhbmQgdmlzYVxuXHRcdC8vIHZlcnNhLlxuXHRcdHNlbGYuc29ja2V0ID0gaW8uY29ubmVjdChzZWxmLmhvc3RuYW1lKTtcbiAgICBzZWxmLnNldFJlc3BvbnNlTGlzdGVuZXJzKHNlbGYuc29ja2V0KTtcbiAgfTtcblxuICBzZWxmLmNvbm5lY3RUb1Jvb20gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuY29ubmVjdFRvUm9vbTogJywgbmFtZSk7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcImNvbm5lY3RUb1Jvb21cIiwgbmFtZSk7XG4gIH07XG5cbiAgc2VsZi5nZXRDaGF0cm9vbU1vZGVsID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmdldENoYXRyb29tTW9kZWw6ICcsIG5hbWUpO1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJnZXRDaGF0cm9vbU1vZGVsXCIsIG5hbWUpO1xuICB9O1xuXG5cblxuLy8vLy8gVmlld0V2ZW50QnVzIG1ldGhvZHMgLy8vL1xuICAgIC8vIG1ldGhvZHMgdGhhdCBlbWl0IHRvIHRoZSBjaGF0c2VydmVyXG4gIHNlbGYubG9naW4gPSBmdW5jdGlvbih1c2VyKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYubG9naW46ICcsIHVzZXIpO1xuXHRcdHNlbGYuc29ja2V0LmVtaXQoXCJsb2dpblwiLCB1c2VyKTtcblx0fTtcbiAgLy8gc2VsZi5sb2dvdXQgPSBmdW5jdGlvbigpIHtcbiAgLy8gICBzZWxmLnNvY2tldC5lbWl0KFwid3V0XCIpO1xuICAvLyB9O1xuXG5cblxuICBzZWxmLmNoYXQgPSBmdW5jdGlvbihjaGF0KSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuY2hhdDogJywgY2hhdCk7XG5cdFx0c2VsZi5zb2NrZXQuZW1pdChcImNoYXRcIiwgY2hhdCk7XG5cdH07XG5cblxuICAvLyBUeXBpbmcgbWV0aG9kc1xuXHRzZWxmLmFkZENoYXRUeXBpbmcgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIG1lc3NhZ2UgPSBkYXRhLnVzZXJuYW1lICsgJyBpcyB0eXBpbmcnO1xuICAgICQoJy50eXBldHlwZXR5cGUnKS50ZXh0KG1lc3NhZ2UpO1xuXHR9O1xuXHRzZWxmLnJlbW92ZUNoYXRUeXBpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAkKCcudHlwZXR5cGV0eXBlJykuZW1wdHkoKTtcblx0fTtcbiAgc2VsZi51cGRhdGVUeXBpbmcgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoc2VsZi5zb2NrZXQpIHtcbiAgICAgIGlmICghdHlwaW5nKSB7XG4gICAgICAgIHR5cGluZyA9IHRydWU7XG4gICAgICAgIHNlbGYuc29ja2V0LmVtaXQoJ3R5cGluZycpO1xuICAgICAgfVxuICAgICAgbGFzdFR5cGluZ1RpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHR5cGluZ1RpbWVyID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgICAgICAgdmFyIHRpbWVEaWZmID0gdHlwaW5nVGltZXIgLSBsYXN0VHlwaW5nVGltZTtcbiAgICAgICAgaWYgKHRpbWVEaWZmID49IFRZUElOR19USU1FUl9MRU5HVEggJiYgdHlwaW5nKSB7XG4gICAgICAgICAgIHNlbGYuc29ja2V0LmVtaXQoJ3N0b3AgdHlwaW5nJyk7XG4gICAgICAgICAgIHR5cGluZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9LCBUWVBJTkdfVElNRVJfTEVOR1RIKTtcbiAgICB9XG4gIH07XG5cblxuICAvLyBqb2luIHJvb21cbiAgc2VsZi5qb2luUm9vbSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KCdqb2luUm9vbScsIG5hbWUpO1xuICB9O1xuXG4gIC8vIHNldCByb29tXG4gIHNlbGYuc2V0Um9vbSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBpZiAobmFtZSAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5jdXJyZW50Um9vbSA9IG5hbWU7XG4gICAgfVxuICAgIC8vLz4+Pj4+Pj4gY2hhbmdldGhpc3RvIC5jaGF0LXRpdGxlXG4gICAgdmFyICRjaGF0VGl0bGUgPSAkKCcuY2hhdGJveC1oZWFkZXItdXNlcm5hbWUnKTtcbiAgICAkY2hhdFRpdGxlLnRleHQobmFtZSk7XG4gICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAkKCcuY2hhdC1kaXJlY3RvcnknKS5maW5kKCcucm9vbScpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgJHJvb20gPSAkKHRoaXMpO1xuICAgICAgJHJvb20ucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgaWYgKCRyb29tLmRhdGEoJ25hbWUnKSA9PT0gdGhpc18uY3VycmVudFJvb20pIHtcbiAgICAgICAgJHJvb20uYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuICBcblxuXG5cbiAgLy8vLy8vLy8vLy8vLy8gY2hhdHNlcnZlciBsaXN0ZW5lcnMvLy8vLy8vLy8vLy8vXG5cbiAgLy8gdGhlc2UgZ3V5cyBsaXN0ZW4gdG8gdGhlIGNoYXRzZXJ2ZXIvc29ja2V0IGFuZCBlbWl0IGRhdGEgdG8gbWFpbi5qcyxcbiAgLy8gc3BlY2lmaWNhbGx5IHRvIHRoZSBhcHBFdmVudEJ1cy5cblx0c2VsZi5zZXRSZXNwb25zZUxpc3RlbmVycyA9IGZ1bmN0aW9uKHNvY2tldCkge1xuXHRcdHNvY2tldC5vbignd2VsY29tZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIC8vIGVtaXRzIGV2ZW50IHRvIHJlY2FsaWJyYXRlIG9ubGluZVVzZXJzIGNvbGxlY3Rpb25cbiAgICAgIC8vIHNvY2tldC5lbWl0KFwiZ2V0T25saW5lVXNlcnNcIik7XG4gICAgICAvLyBzb2NrZXQuZW1pdChcInJvb21zXCIpO1xuICAgICAgLy8gZGF0YSBpcyB1bmRlZmluZWQgYXQgdGhpcyBwb2ludCBiZWNhdXNlIGl0J3MgdGhlIGZpcnN0IHRvXG4gICAgICAvLyBmaXJlIG9mZiBhbiBldmVudCBjaGFpbiB0aGF0IHdpbGwgYXBwZW5kIHRoZSBuZXcgdXNlciB0byBcbiAgICAgIC8vIHRoZSBvbmxpbmVVc2VyIGNvbGxlY3Rpb25cbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwibG9naW5Eb25lXCIsIGRhdGEpO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKCdsb2dpbicsIGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcignbG9naW5Vc2VyJywgdXNlcm5hbWUpO1xuICAgIH0pO1xuXG5cbiAgICBzb2NrZXQub24oJ2xvZycsIGZ1bmN0aW9uKCkge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUubG9nJyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcignYXV0aGVudGljYXRlZCcpO1xuICAgIH0pO1xuXG5cdFx0c29ja2V0Lm9uKCd1c2Vyc0luZm8nLCBmdW5jdGlvbih1c2Vycykge1xuXHRcdFx0Y29uc29sZS5sb2coJ3NjLmUudXNlcnNJbmZvOiAnLCB1c2Vycyk7XG5cdFx0XHRzZWxmLnZlbnQudHJpZ2dlcihcInVzZXJzSW5mb1wiLCB1c2Vycyk7XG5cdFx0fSk7XG5cbiAgICBzb2NrZXQub24oJ3Jvb21zJywgZnVuY3Rpb24oY2hhdHJvb21zKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5yb29tczogJywgY2hhdHJvb21zKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwicm9vbUluZm9cIiwgY2hhdHJvb21zKTtcbiAgICB9KTtcblxuXG5cblx0XHRzb2NrZXQub24oJ3VzZXJKb2luZWQnLCBmdW5jdGlvbih1c2VybmFtZSkge1xuXHRcdFx0Y29uc29sZS5sb2coJ3NjLmUudXNlckpvaW5lZDogJywgdXNlcm5hbWUpO1xuICAgICAgLy8gc29ja2V0LmVtaXQoXCJvbmxpbmVVc2Vyc1wiKTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwidXNlckpvaW5lZFwiLCB1c2VybmFtZSk7XG5cdFx0fSk7XG5cdFx0c29ja2V0Lm9uKCd1c2VyTGVmdCcsIGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnc2MuZS51c2VyTGVmdDogJywgdXNlcm5hbWUpO1xuICAgICAgLy8gc29ja2V0LmVtaXQoXCJvbmxpbmVVc2Vyc1wiKTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwidXNlckxlZnRcIiwgdXNlcm5hbWUpO1xuXHRcdH0pO1xuXG5cblxuXHRcdHNvY2tldC5vbignY2hhdCcsIGZ1bmN0aW9uKGNoYXQpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdzYy5lLmNoYXQ6ICcsIGNoYXQpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJjaGF0UmVjZWl2ZWRcIiwgY2hhdCk7XG5cdFx0fSk7XG4gICAgc29ja2V0Lm9uKCdzZXRSb29tJywgZnVuY3Rpb24obmFtZSkge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUuc2V0Um9vbTogJywgbmFtZSk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldFJvb21cIiwgbmFtZSk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdjaGF0bG9nJywgZnVuY3Rpb24oY2hhdGxvZykge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUuY2hhdGxvZzogJywgY2hhdGxvZyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldENoYXRsb2dcIiwgY2hhdGxvZyk7XG4gICAgfSk7XG4gICAgLy8gc29ja2V0Lm9uKCdDaGF0cm9vbU1vZGVsJywgZnVuY3Rpb24obW9kZWwpIHtcbiAgICAvLyAgIC8vIHNlbGYudmVudC50cmlnZ2VyKFwiQ2hhdHJvb21Nb2RlbFwiLCBtb2RlbCk7XG4gICAgLy8gICBzZWxmLnZlbnQudHJpZ2dlcihcInNldFJvb21cIiwgbW9kZWwpO1xuICAgIC8vIH0pO1xuICAgIHNvY2tldC5vbignY2hhdHJvb21zJywgZnVuY3Rpb24oY2hhdHJvb21zKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5jaGF0cm9vbXM6ICAnLCBjaGF0cm9vbXMpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRDaGF0cm9vbXNcIiwgY2hhdHJvb21zKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ29ubGluZVVzZXJzJywgZnVuY3Rpb24ob25saW5lVXNlcnMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLm9ubGluZVVzZXJzOiAnLCBvbmxpbmVVc2Vycyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldE9ubGluZVVzZXJzXCIsIG9ubGluZVVzZXJzKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ2NoYXRyb29tTmFtZScsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLmNoYXRyb29tTmFtZTogJywgbmFtZSk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldENoYXRyb29tTmFtZVwiLCBuYW1lKTtcbiAgICB9KTtcblxuXG5cbiAgICBzb2NrZXQub24oJ3R5cGluZycsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHNlbGYuYWRkQ2hhdFR5cGluZyhkYXRhKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ3N0b3AgdHlwaW5nJywgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnJlbW92ZUNoYXRUeXBpbmcoKTtcbiAgICB9KTtcblxuXG5cdH07XG59OyIsIlxuXG5hcHAuTWFpbkNvbnRyb2xsZXIgPSBmdW5jdGlvbigpIHtcblxuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblxuICAvL1RoZXNlIGFsbG93cyB1cyB0byBiaW5kIGFuZCB0cmlnZ2VyIG9uIHRoZSBvYmplY3QgZnJvbSBhbnl3aGVyZSBpbiB0aGUgYXBwLlxuXHRzZWxmLmFwcEV2ZW50QnVzID0gXy5leHRlbmQoe30sIEJhY2tib25lLkV2ZW50cyk7XG5cdHNlbGYudmlld0V2ZW50QnVzID0gXy5leHRlbmQoe30sIEJhY2tib25lLkV2ZW50cyk7XG5cblx0c2VsZi5pbml0ID0gZnVuY3Rpb24oKSB7XG5cbiAgICAvLyBsb2dpbk1vZGVsXG4gICAgc2VsZi5sb2dpbk1vZGVsID0gbmV3IGFwcC5Mb2dpbk1vZGVsKCk7XG4gICAgc2VsZi5sb2dpblZpZXcgPSBuZXcgYXBwLkxvZ2luVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXMsIG1vZGVsOiBzZWxmLmxvZ2luTW9kZWx9KTtcbiAgICBzZWxmLnJlZ2lzdGVyVmlldyA9IG5ldyBhcHAuUmVnaXN0ZXJWaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cyB9KTtcbiAgICBzZWxmLm5hdmJhclZpZXcgPSBuZXcgYXBwLk5hdmJhclZpZXcoKTtcblxuICAgIC8vIFRoZSBDb250YWluZXJNb2RlbCBnZXRzIHBhc3NlZCBhIHZpZXdTdGF0ZSwgTG9naW5WaWV3LCB3aGljaFxuICAgIC8vIGlzIHRoZSBsb2dpbiBwYWdlLiBUaGF0IExvZ2luVmlldyBnZXRzIHBhc3NlZCB0aGUgdmlld0V2ZW50QnVzXG4gICAgLy8gYW5kIHRoZSBMb2dpbk1vZGVsLlxuICAgIHNlbGYuY29udGFpbmVyTW9kZWwgPSBuZXcgYXBwLkNvbnRhaW5lck1vZGVsKHsgdmlld1N0YXRlOiBzZWxmLmxvZ2luVmlld30pO1xuXG4gICAgLy8gbmV4dCwgYSBuZXcgQ29udGFpbmVyVmlldyBpcyBpbnRpYWxpemVkIHdpdGggdGhlIG5ld2x5IGNyZWF0ZWQgY29udGFpbmVyTW9kZWxcbiAgICAvLyB0aGUgbG9naW4gcGFnZSBpcyB0aGVuIHJlbmRlcmVkLlxuICAgIHNlbGYuY29udGFpbmVyVmlldyA9IG5ldyBhcHAuQ29udGFpbmVyVmlldyh7IG1vZGVsOiBzZWxmLmNvbnRhaW5lck1vZGVsIH0pO1xuICAgIHNlbGYuY29udGFpbmVyVmlldy5yZW5kZXIoKTtcblxuICB9O1xuXG5cbiAgc2VsZi5hdXRoZW50aWNhdGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgXG4gICAgJChcImJvZHlcIikuY3NzKFwib3ZlcmZsb3dcIiwgXCJoaWRkZW5cIik7XG4gICAgc2VsZi5jaGF0Q2xpZW50ID0gbmV3IENoYXRDbGllbnQoeyB2ZW50OiBzZWxmLmFwcEV2ZW50QnVzIH0pO1xuICAgIHNlbGYuY2hhdENsaWVudC5jb25uZWN0KCk7XG5cbiAgICAvLyBuZXcgbW9kZWwgYW5kIHZpZXcgY3JlYXRlZCBmb3IgY2hhdHJvb21cbiAgICBzZWxmLmNoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoeyBuYW1lOiAnRE9PJyB9KTtcbiAgICBzZWxmLmNoYXRyb29tTGlzdCA9IG5ldyBhcHAuQ2hhdHJvb21MaXN0KCk7XG4gICAgc2VsZi5jaGF0cm9vbUxpc3QuZmV0Y2goKS5kb25lKGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnY2hhdHJvb21zJywgc2VsZi5jaGF0cm9vbUxpc3QpO1xuICAgICAgc2VsZi5jaGF0cm9vbVZpZXcgID0gbmV3IGFwcC5DaGF0cm9vbVZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzLCBtb2RlbDogc2VsZi5jaGF0cm9vbU1vZGVsIH0pO1xuICAgICAgc2VsZi5jb250YWluZXJNb2RlbC5zZXQoJ3ZpZXdTdGF0ZScsIHNlbGYuY2hhdHJvb21WaWV3KTtcblxuICAgICAgc2VsZi5jb25uZWN0VG9Sb29tKCk7XG4gICAgICBzZWxmLmluaXRSb29tKCk7XG4gICAgICAgXG4gICAgICAvLyBjb25zb2xlLmxvZygnYXV0aGVudCcpO1xuICAgICAgLy8gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgLy8gICBzZWxmLmNoYXRDbGllbnQuY29ubmVjdFRvUm9vbShcIkRPT1wiKTtcbiAgICAgIC8vIH0sIDE1MDApO1xuICAgICAgLy8gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgLy8gICBzZWxmLmNoYXRyb29tVmlldy5pbml0Um9vbSgpO1xuICAgICAgLy8gfSwgMjAwMCk7XG4gICAgICAvLyBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAvLyAgIHNlbGYuZGF0ZURpdmlkZXIubG9hZCgkKFwiLmZvbGxvd01lQmFyXCIpKTtcbiAgICAgIC8vIH0sIDIwMDEpO1xuICAgIH0pO1xuXG4gIH07XG5cbiAgc2VsZi5jb25uZWN0VG9Sb29tID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuY29ubmVjdFRvUm9vbShcIkRPT1wiKTtcbiAgfTtcblxuICBzZWxmLmluaXRSb29tID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICBzZWxmLmNoYXRyb29tVmlldy5pbml0Um9vbSgpO1xuICB9O1xuXG4gIHNlbGYuc2V0RGF0ZURpdmlkZXIgPSBmdW5jdGlvbigpIHtcbiAgICBzZWxmLmRhdGVEaXZpZGVyLmxvYWQoJChcIi5mb2xsb3dNZUJhclwiKSk7XG4gIH07XG5cbiAgXG5cblxuXG4gIC8vIHNlbGYuYXBwRXZlbnRCdXMub24oXCJhdXRoZW50aWNhdGVkXCIsIGZ1bmN0aW9uKCkge1xuICAvLyAgIGRlYnVnZ2VyO1xuICAvLyAgIHNlbGYuYXV0aGVudGljYXRlZCgpO1xuICAvLyB9KTtcblxuXG5cbiAgLy8vLy8vLy8vLy8vICBCdXNzZXMgLy8vLy8vLy8vLy8vXG4gICAgLy8gVGhlc2UgQnVzc2VzIGxpc3RlbiB0byB0aGUgc29ja2V0Y2xpZW50XG4gICAvLyAgICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXG4gIC8vLy8gdmlld0V2ZW50QnVzIExpc3RlbmVycyAvLy8vL1xuICBcblx0c2VsZi52aWV3RXZlbnRCdXMub24oXCJsb2dpblwiLCBmdW5jdGlvbih1c2VyKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmxvZ2luKHVzZXIpO1xuICB9KTtcblx0c2VsZi52aWV3RXZlbnRCdXMub24oXCJjaGF0XCIsIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuY2hhdChjaGF0KTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwidHlwaW5nXCIsIGZ1bmN0aW9uKCkge1xuICAgIHNlbGYuY2hhdENsaWVudC51cGRhdGVUeXBpbmcoKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiam9pblJvb21cIiwgZnVuY3Rpb24ocm9vbSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5qb2luUm9vbShyb29tKTtcbiAgfSk7XG5cblxuXG5cblxuXG5cblxuICAvLy8vIGFwcEV2ZW50QnVzIExpc3RlbmVycyAvLy8vXG5cblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcInVzZXJzSW5mb1wiLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgY29uc29sZS5sb2coJ21haW4uZS51c2Vyc0luZm86ICcsIGRhdGEpO1xuICAgIC8vZGF0YSBpcyBhbiBhcnJheSBvZiB1c2VybmFtZXMsIGluY2x1ZGluZyB0aGUgbmV3IHVzZXJcblx0XHQvLyBUaGlzIG1ldGhvZCBnZXRzIHRoZSBvbmxpbmUgdXNlcnMgY29sbGVjdGlvbiBmcm9tIGNoYXRyb29tTW9kZWwuXG5cdFx0Ly8gb25saW5lVXNlcnMgaXMgdGhlIGNvbGxlY3Rpb25cblx0XHR2YXIgb25saW5lVXNlcnMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KFwib25saW5lVXNlcnNcIik7XG4gICAgY29uc29sZS5sb2coXCIuLi5vbmxpbmVVc2VyczogXCIsIG9ubGluZVVzZXJzKTtcblx0XHR2YXIgdXNlcnMgPSBfLm1hcChkYXRhLCBmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRyZXR1cm4gbmV3IGFwcC5Vc2VyTW9kZWwoe3VzZXJuYW1lOiBpdGVtfSk7XG5cdFx0fSk7XG4gICAgY29uc29sZS5sb2coXCJ1c2VyczogXCIsIHVzZXJzKTtcblx0XHRvbmxpbmVVc2Vycy5yZXNldCh1c2Vycyk7XG5cdH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJyb29tSW5mb1wiLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgY29uc29sZS5sb2coJ21haW4uZS5yb29tSW5mbzogJywgZGF0YSk7XG4gICAgdmFyIHJvb21zID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldChcImNoYXRyb29tc1wiKTtcbiAgICAgY29uc29sZS5sb2coXCIuLi5yb29tczogXCIsIHJvb21zKTtcbiAgICB2YXIgdXBkYXRlZFJvb21zID0gXy5tYXAoZGF0YSwgZnVuY3Rpb24ocm9vbSkge1xuICAgICAgdmFyIG5ld0NoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoe25hbWU6IHJvb20ubmFtZX0pO1xuICAgICAgcmV0dXJuIG5ld0NoYXRyb29tTW9kZWw7XG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coXCIuLi51cGRhdGVkcm9vbXM6IFwiLCB1cGRhdGVkUm9vbXMpO1xuICAgIHJvb21zLnJlc2V0KHVwZGF0ZWRSb29tcyk7XG4gIH0pO1xuXG5cblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwibG9naW5Vc2VyXCIsIGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ21haW4uZS5sb2dpblVzZXI6ICcsIHVzZXJuYW1lKTtcbiAgICB2YXIgdXNlciA9IG5ldyBhcHAuVXNlck1vZGVsKHt1c2VybmFtZTogdXNlcm5hbWV9KTtcbiAgICBzZWxmLm5hdmJhclZpZXcubW9kZWwuc2V0KHVzZXIudG9KU09OKCkpO1xuICB9KTtcblxuXG5cbiAgLy8gc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldFJvb21cIiwgZnVuY3Rpb24obW9kZWwpIHtcbiAgLy8gICBjb25zb2xlLmxvZygnbWFpbi5lLnNldFJvb206ICcsIG1vZGVsKTtcblxuICAvLyAgIHZhciBjaGF0bG9nID0gbmV3IGFwcC5DaGF0Q29sbGVjdGlvbihtb2RlbC5jaGF0bG9nKTtcbiAgLy8gICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdjaGF0bG9nJywgY2hhdGxvZyk7XG5cbiAgLy8gICB2YXIgcm9vbXMgPSBuZXcgYXBwLkNoYXRyb29tTGlzdChtb2RlbC5jaGF0cm9vbXMpO1xuICAvLyAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zZXQoJ2NoYXRyb29tcycsIHJvb21zKTtcblxuICAvLyAgIHZhciB1c2VycyA9IG5ldyBhcHAuVXNlckNvbGxlY3Rpb24obW9kZWwub25saW5lVXNlcnMpO1xuICAvLyAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zZXQoJ29ubGluZVVzZXJzJywgdXNlcnMpO1xuXG4gIC8vIH0pO1xuXG5cblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwiQ2hhdHJvb21Nb2RlbFwiLCBmdW5jdGlvbihtb2RlbCkge1xuICAgIGNvbnNvbGUubG9nKCdtYWluLmUuQ2hhdHJvb21Nb2RlbDogJywgbW9kZWwpO1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbCA9IG5ldyBhcHAuQ2hhdHJvb21Nb2RlbCgpO1xuICAgIHNlbGYuY2hhdHJvb21MaXN0ID0gbmV3IGFwcC5DaGF0cm9vbUxpc3QoKTtcbiAgICBzZWxmLmNoYXRyb29tVmlldyAgPSBuZXcgYXBwLkNoYXRyb29tVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXMsIG1vZGVsOiBzZWxmLmNoYXRyb29tTW9kZWwsIGNvbGxlY3Rpb246IHNlbGYuY2hhdHJvb21MaXN0fSk7XG4gICAgc2VsZi5jb250YWluZXJNb2RlbC5zZXQoJ3ZpZXdTdGF0ZScsIHNlbGYuY2hhdHJvb21WaWV3KTtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwubG9hZE1vZGVsKG1vZGVsKTtcbiAgfSk7XG5cblxuXG4gIC8vIGFkZHMgbmV3IHVzZXIgdG8gdXNlcnMgY29sbGVjdGlvbiwgc2VuZHMgZGVmYXVsdCBqb2luaW5nIG1lc3NhZ2Vcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcInVzZXJKb2luZWRcIiwgZnVuY3Rpb24odXNlcm5hbWUpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ21haW4uZS51c2VySm9pbmVkOiAnLCB1c2VybmFtZSk7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLmFkZFVzZXIodXNlcm5hbWUpO1xuXHRcdHNlbGYuY2hhdHJvb21Nb2RlbC5hZGRDaGF0KHtzZW5kZXI6IFwiQnV0dGVyc1wiLCBtZXNzYWdlOiB1c2VybmFtZSArIFwiIGpvaW5lZCByb29tLlwiIH0pO1xuXHR9KTtcblxuXHQvLyByZW1vdmVzIHVzZXIgZnJvbSB1c2VycyBjb2xsZWN0aW9uLCBzZW5kcyBkZWZhdWx0IGxlYXZpbmcgbWVzc2FnZVxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwidXNlckxlZnRcIiwgZnVuY3Rpb24odXNlcm5hbWUpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ21haW4uZS51c2VyTGVmdDogJywgdXNlcm5hbWUpO1xuXHRcdHNlbGYuY2hhdHJvb21Nb2RlbC5yZW1vdmVVc2VyKHVzZXJuYW1lKTtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkQ2hhdCh7c2VuZGVyOiBcIkJ1dHRlcnNcIiwgbWVzc2FnZTogdXNlcm5hbWUgKyBcIiBsZWZ0IHJvb20uXCIgfSk7XG5cdH0pO1xuXG5cdC8vIGNoYXQgcGFzc2VkIGZyb20gc29ja2V0Y2xpZW50LCBhZGRzIGEgbmV3IGNoYXQgbWVzc2FnZSB1c2luZyBjaGF0cm9vbU1vZGVsIG1ldGhvZFxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwiY2hhdFJlY2VpdmVkXCIsIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwuYWRkQ2hhdChjaGF0KTtcblx0XHQkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcblx0fSk7XG5cblxuXG5cblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRDaGF0cm9vbU5hbWVcIiwgZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBuZXdIZWFkZXIgPSBuZXcgYXBwLkNoYXRyb29tSGVhZGVyTW9kZWwoeyBuYW1lOiBuYW1lIH0pO1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zZXQoJ2NoYXRyb29tJywgbmV3SGVhZGVyKTtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldENoYXRsb2dcIiwgZnVuY3Rpb24oY2hhdGxvZykge1xuICAgIHZhciBvbGRDaGF0bG9nID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldCgnY2hhdGxvZycpO1xuICAgIHZhciB1cGRhdGVkQ2hhdGxvZyA9IF8ubWFwKGNoYXRsb2csIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICAgIHZhciBuZXdDaGF0TW9kZWwgPSBuZXcgYXBwLkNoYXRNb2RlbCh7IHJvb206IGNoYXQucm9vbSwgbWVzc2FnZTogY2hhdC5tZXNzYWdlLCBzZW5kZXI6IGNoYXQuc2VuZGVyLCB0aW1lc3RhbXA6IGNoYXQudGltZXN0YW1wIH0pO1xuICAgICAgcmV0dXJuIG5ld0NoYXRNb2RlbDtcbiAgICB9KTtcbiAgICBvbGRDaGF0bG9nLnJlc2V0KHVwZGF0ZWRDaGF0bG9nKTtcbiAgfSk7XG4gIFxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0Q2hhdHJvb21zXCIsIGZ1bmN0aW9uKGNoYXRyb29tcykge1xuICAgIHZhciBvbGRDaGF0cm9vbXMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KCdjaGF0cm9vbXMnKTtcbiAgICB2YXIgdXBkYXRlZENoYXRyb29tcyA9IF8ubWFwKGNoYXRyb29tcywgZnVuY3Rpb24oY2hhdHJvb20pIHtcbiAgICAgIHZhciBuZXdDaGF0cm9vbU1vZGVsID0gbmV3IGFwcC5DaGF0cm9vbU1vZGVsKHsgbmFtZTogY2hhdHJvb20ubmFtZSwgb25saW5lVXNlcnM6IGNoYXRyb29tLm9ubGluZVVzZXJzIH0pO1xuICAgICAgcmV0dXJuIG5ld0NoYXRyb29tTW9kZWw7XG4gICAgfSk7XG4gICAgb2xkQ2hhdHJvb21zLnJlc2V0KHVwZGF0ZWRDaGF0cm9vbXMpO1xuICB9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0T25saW5lVXNlcnNcIiwgZnVuY3Rpb24ob25saW5lVXNlcnMpIHtcbiAgICB2YXIgb2xkT25saW5lVXNlcnMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KCdvbmxpbmVVc2VycycpO1xuICAgIHZhciB1cGRhdGVkT25saW5lVXNlcnMgPSBfLm1hcChvbmxpbmVVc2VycywgZnVuY3Rpb24odXNlcikge1xuICAgICAgdmFyIG5ld1VzZXJNb2RlbCA9IG5ldyBhcHAuVXNlck1vZGVsKHt1c2VybmFtZTogdXNlci51c2VybmFtZX0pO1xuICAgICAgcmV0dXJuIG5ld1VzZXJNb2RlbDtcbiAgICB9KTtcbiAgICBvbGRPbmxpbmVVc2Vycy5yZXNldCh1cGRhdGVkT25saW5lVXNlcnMpO1xuICB9KTtcblxuXG59O1xuXG4iLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gICQod2luZG93KS5iaW5kKCdiZWZvcmV1bmxvYWQnLCBmdW5jdGlvbihldmVudE9iamVjdCkge1xuICAgICQuYWpheCh7XG4gICAgICAgdXJsOiBcIi9sb2dvdXRcIixcbiAgICB9KTtcbiAgfSk7XG5cbiAgdmFyIENoYXRyb29tUm91dGVyID0gQmFja2JvbmUuUm91dGVyLmV4dGVuZCh7XG4gICAgXG4gICAgcm91dGVzOiB7XG4gICAgICAnJzogJ3N0YXJ0JyxcbiAgICAgICdsb2cnOiAnbG9naW4nLFxuICAgICAgJ3JlZyc6ICdyZWdpc3RlcicsXG4gICAgICAnb3V0JzogJ291dCcsXG4gICAgICAnYXV0aGVudGljYXRlZCc6ICdhdXRoZW50aWNhdGVkJyxcbiAgICAgICdmYWNlYm9vayc6ICdmYWNlYm9vaycsXG4gICAgICAndHdpdHRlcic6ICd0d2l0dGVyJ1xuICAgIH0sXG5cbiAgICBzdGFydDogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJy8jJztcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlciA9IG5ldyBhcHAuTWFpbkNvbnRyb2xsZXIoKTtcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlci5pbml0KCk7XG4gICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgdXJsOiBcIi9sb2dvdXRcIixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSxcblxuXG4gICAgbG9naW46IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGxvZ2luTW9kZWwgPSBuZXcgYXBwLkxvZ2luTW9kZWwoKTtcbiAgICAgIHZhciBsb2dpblZpZXcgPSBuZXcgYXBwLkxvZ2luVmlldyh7dmVudDogYXBwLm1haW5Db250cm9sbGVyLnZpZXdFdmVudEJ1cywgbW9kZWw6IGxvZ2luTW9kZWx9KTtcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlci5jb250YWluZXJNb2RlbC5zZXQoXCJ2aWV3U3RhdGVcIiwgbG9naW5WaWV3KTtcbiAgICB9LFxuXG4gICAgcmVnaXN0ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHJlZ2lzdGVyVmlldyA9IG5ldyBhcHAuUmVnaXN0ZXJWaWV3KHt2ZW50OiBhcHAubWFpbkNvbnRyb2xsZXIudmlld0V2ZW50QnVzIH0pO1xuICAgICAgYXBwLm1haW5Db250cm9sbGVyLmNvbnRhaW5lck1vZGVsLnNldChcInZpZXdTdGF0ZVwiLCByZWdpc3RlclZpZXcpO1xuICAgIH0sXG5cbiAgICBvdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgIHVybDogXCIvbG9nb3V0XCIsXG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIGF1dGhlbnRpY2F0ZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCFhcHAubWFpbkNvbnRyb2xsZXIpIHsgcmV0dXJuIHRoaXMuc3RhcnQoKTsgfVxuICAgICAgYXBwLm1haW5Db250cm9sbGVyLmF1dGhlbnRpY2F0ZWQoKTtcbiAgICB9LFxuICAgIGZhY2Vib29rOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuc3RhcnQodGhpcy5hdXRoZW50aWNhdGVkKTtcbiAgICB9LFxuICAgIHR3aXR0ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5zdGFydCh0aGlzLmF1dGhlbnRpY2F0ZWQpO1xuICAgIH0sXG5cbiAgfSk7XG5cbiAgYXBwLkNoYXRyb29tUm91dGVyID0gbmV3IENoYXRyb29tUm91dGVyKCk7XG4gIEJhY2tib25lLmhpc3Rvcnkuc3RhcnQoKTtcblxufSkoKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=