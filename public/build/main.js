
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
    this.renderDateDividers(model);
    var chatTemplate = $(this.chatTemplate(model.toJSON()));
    chatTemplate.appendTo(this.$('.chatbox-content')).hide().fadeIn().slideDown();

    $('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
    // this.$('.nano').nanoScroller();
    // this.$('.nano').nanoScroller({ scroll: 'bottom' });
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

      autosize($('textarea.message-input'));
      $('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
       
      console.log('authent');
      setTimeout(function(){
        self.chatClient.connectToRoom("DOO");
      }, 1500);
      setTimeout(function(){
        self.chatroomView.initRoom();
      }, 2000);
      setTimeout(function(){
        self.dateDivider.load($(".followMeBar"));
      }, 2001);
    });

  };

  // self.logout = function() {
  //   self.chatClient.logout();
  //   self.navbarView = new app.NavbarView();
  // };

  self.dateDivider = (function() {

  var $window = $(window),
      $stickies;

  load = function(stickies) {

      
    console.log('god damn it');
      $stickies = stickies.each(function() {

        var $thisSticky = $(this).wrap('<div class="followWrap row" />');
  
        $thisSticky
            .data('originalPosition', $thisSticky.offset().top)
            .data('originalHeight', $thisSticky.outerHeight())
              .parent()
              .height($thisSticky.outerHeight());
        console.log('thissticky.originalposition', $thisSticky.offset().top);
      });
      
      $('.chatbox-content').scroll(scrollStickiesInit);

  };


  scrollStickiesInit = function() {
    $(this).off("scroll.stickies");
    $(this).on("scroll.stickies", _.debounce(_whenScrolling, 50));
  };


  _whenScrolling = function() {

    $stickies.each(function(i, sticky) {

      var $thisSticky = $(sticky),
          $thisStickyTop = $thisSticky.offset().top,

          $prevSticky = $stickies.eq(i - 1),
          $prevStickyTop = $prevSticky.offset().top,
          $prevStickyPosition = $prevSticky.data('originalPosition');


      if ($thisStickyTop >= 180 && $thisStickyTop <= 210) {

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
         if ($prevStickyTop + $thisAndPrevStickyDifference > 205 && i !== 0) {

            $nextSticky.removeClass("fixed");
            $prevSticky.addClass("fixed");
         }

      // scrolling down
        if ($prevStickyTop >= 205 && $prevSticky.hasClass("fixed") && i !== 0) {
           $prevSticky.removeClass("fixed");
         }

      }

      if ($('.chatbox-content').scrollTop() === 0) {
        $stickies.removeClass('fixed');
      }

    });

  };

  return {
    load: load
  };
})();



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
    self.dateDivider.load($(".followMeBar"));
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

    // logout: function() {
    //   // $('#logout').on('click', function() {
    //             var this_ = this;
    //     $.ajax({
    //       url: "/logout",
    //     }).done(function() {

    //     });
    //       this_.login();
    //       app.mainController.logout();

    //   // });
    // },

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYXQuanMiLCJjaGF0cm9vbS1oZWFkZXIuanMiLCJjb250YWluZXIuanMiLCJsb2dpbi5qcyIsInVzZXIuanMiLCJjaGF0cm9vbS5qcyIsInJvb20uanMiLCJuYXZiYXIuanMiLCJyZWdpc3Rlci5qcyIsInNvY2tldGNsaWVudC5qcyIsIm1haW4uanMiLCJyb3V0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FKUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUlUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FEVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUgxTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUlsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3VUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuQ2hhdENvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG4gICAgbW9kZWw6IGFwcC5DaGF0TW9kZWxcbiAgfSk7XG5cbn0pKCk7IiwiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5DaGF0cm9vbUhlYWRlck1vZGVsID0gQmFja2JvbmUuTW9kZWwuZXh0ZW5kKHt9KTtcblxufSkoKTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuICBhcHAuQ29udGFpbmVyVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBlbDogJyN2aWV3LWNvbnRhaW5lcicsXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdGhpcy5tb2RlbC5vbihcImNoYW5nZTp2aWV3U3RhdGVcIiwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB2aWV3ID0gdGhpcy5tb2RlbC5nZXQoJ3ZpZXdTdGF0ZScpO1xuICAgICAgdGhpcy4kZWwuaHRtbCh2aWV3LnJlbmRlcigpLmVsKTtcbiAgICB9XG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5Mb2dpblZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2xvZ2luJykuaHRtbCgpKSxcbiAgICBldmVudHM6IHtcbiAgICAgICdzdWJtaXQnOiAnb25Mb2dpbicsXG4gICAgICAna2V5cHJlc3MnOiAnb25IaXRFbnRlcidcbiAgICB9LFxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAvLyBMb2dpblZpZXcgZ2V0cyBwYXNzZWQgdGhlIHZpZXdFdmVudEJ1cyB3aGVuIHRoZSBNYWluQ29udHJvbGxlciBpcyBpbml0aWFsaXplZFxuICAgICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xuXG4gICAgLy8gVGhpcyB0ZWxscyB0aGUgdmlldyB0byBsaXN0ZW4gdG8gYW4gZXZlbnQgb24gaXRzIG1vZGVsLFxuICAgIC8vIGlmIHRoZXJlJ3MgYW4gZXJyb3IsIHRoZSBjYWxsYmFjayAodGhpcy5yZW5kZXIpIGlzIGNhbGxlZCB3aXRoIHRoZSAgXG4gICAgLy8gdmlldyBhcyBjb250ZXh0XG4gICAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiY2hhbmdlOmVycm9yXCIsIHRoaXMucmVuZGVyLCB0aGlzKTtcbiAgICB9LFxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUodGhpcy5tb2RlbC50b0pTT04oKSkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBvbkxvZ2luOiBmdW5jdGlvbihlKSB7XG4gICAgICAvLyB0cmlnZ2VycyB0aGUgbG9naW4gZXZlbnQgYW5kIHBhc3NpbmcgdGhlIHVzZXJuYW1lIGRhdGEgdG8ganMvbWFpbi5qc1xuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAkLmFqYXgoe1xuICAgICAgICB1cmw6IFwiL2xvZ2luXCIsXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBkYXRhOiB7dXNlcm5hbWU6IHRoaXMuJCgnI3VzZXJuYW1lJykudmFsKCksIHBhc3N3b3JkOiB0aGlzLiQoJyNwYXNzd29yZCcpLnZhbCgpfSxcbiAgICAgICAgc3VjY2VzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICBjb25zb2xlLmxvZygnc3VjY2VzcyBkYXRhOiAnLCBkYXRhKTtcbiAgICAgICAgICAgaWYgKGRhdGEgPT09IDIwMCkge1xuICAgICAgICAgICAgIC8vIHRoaXNfLnZlbnQudHJpZ2dlcignYXV0aGVudGljYXRlZCcpO1xuICAgICAgICAgICAgYXBwLkNoYXRyb29tUm91dGVyLm5hdmlnYXRlKCdhdXRoZW50aWNhdGVkJywgeyB0cmlnZ2VyOiB0cnVlIH0pO1xuICAgICAgICB0aGlzXy52ZW50LnRyaWdnZXIoXCJsb2dpblwiLCB7dXNlcm5hbWU6IHRoaXNfLiQoJyN1c2VybmFtZScpLnZhbCgpLCBwYXNzd29yZDogdGhpc18uJCgnI3Bhc3N3b3JkJykudmFsKCl9KTtcbiAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KS5kb25lKGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnZG9uZWVlZWVlZWUnKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgLy8gb25IaXRFbnRlcjogZnVuY3Rpb24oZSkge1xuICAgIC8vICAgaWYoZS5rZXlDb2RlID09IDEzKSB7XG4gICAgLy8gICAgIHRoaXMub25Mb2dpbigpO1xuICAgIC8vICAgICByZXR1cm4gZmFsc2U7XG4gICAgLy8gICB9XG4gICAgLy8gfVxuICB9KTtcbiAgXG59KShqUXVlcnkpOyIsIlxudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuVXNlckNvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7bW9kZWw6IGFwcC5Vc2VyTW9kZWx9KTtcblxufSkoKTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuYXBwLkNoYXRyb29tVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2NoYXRyb29tLXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgY2hhdFRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNjaGF0Ym94LW1lc3NhZ2UtdGVtcGxhdGUnKS5odG1sKCkpLFxuICBuYW1lVGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2NoYXRyb29tLW5hbWUtdGVtcGxhdGUnKS5odG1sKCkpLFxuICBkYXRlVGVtcGxhdGU6IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJmb2xsb3dNZUJhciBjb2wteHMtMTIgY29sLXNtLTEyIGNvbC1tZC0xMlwiPjxzcGFuPi0tLS0tLS0tLS0tLS0tLS0tPC9zcGFuPjxzcGFuPiA8JT0gbW9tZW50KHRpbWVzdGFtcCkuZm9ybWF0KFwiZGRkZCwgTU1NTSBEbyBZWVlZXCIpICU+IDwvc3Bhbj48c3Bhbj4tLS0tLS0tLS0tLS0tLS0tLTwvc3Bhbj48L2Rpdj4nKSxcbiAgZXZlbnRzOiB7XG4gICAgJ2tleXByZXNzIC5tZXNzYWdlLWlucHV0JzogJ21lc3NhZ2VJbnB1dFByZXNzZWQnLFxuICAgICdjbGljayAuY2hhdC1kaXJlY3RvcnkgLnJvb20nOiAnc2V0Um9vbSdcbiAgfSxcbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIGNvbnNvbGUubG9nKCdjaGF0cm9vbVZpZXcuZi5pbml0aWFsaXplOiAnLCBvcHRpb25zKTtcbiAgICAvLyBwYXNzZWQgdGhlIHZpZXdFdmVudEJ1c1xuICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcbiAgfSxcbiAgaW5pdFJvb206IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMucmVuZGVyVXNlcnMoKTtcbiAgICB0aGlzLnJlbmRlckNoYXRzKCk7XG4gICAgdGhpcy5yZW5kZXJSb29tcygpO1xuICAgIHRoaXMucmVuZGVyTmFtZSgpO1xuICB9LFxuICByZW5kZXI6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlcicpO1xuICAgIHRoaXMubW9kZWwgPSBtb2RlbCB8fCB0aGlzLm1vZGVsO1xuICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzLm1vZGVsLnRvSlNPTigpKSk7XG4gICAgLy8gdGhpcy5zZXRDaGF0Q29sbGVjdGlvbigpO1xuICAgIHRoaXMuc2V0Q2hhdExpc3RlbmVycygpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvLyBzZXRDaGF0Q29sbGVjdGlvbjogZnVuY3Rpb24oKSB7XG4gIC8vICAgICB0aGlzLnVzZXJDaGF0cyA9IG5ldyBhcHAuQ2hhdENvbGxlY3Rpb24oW1xuICAvLyAgICAgICAvLyBtZXNzYWdlIGFuZCBzZW5kZXIgdXBvbiBlbnRlcmluZyBjaGF0cm9vbVxuICAvLyAgICAgICBuZXcgYXBwLkNoYXRNb2RlbCh7IHNlbmRlcjogJ0J1dHRlcnMnLCBtZXNzYWdlOiAnYXd3d3d3dyBoYW1idXJnZXJzLiB8fCk6fHwnLCB0aW1lc3RhbXA6IF8ubm93KCkgfSlcbiAgLy8gICAgIF0pO1xuICAvLyB9LFxuICBzZXRDaGF0TGlzdGVuZXJzOiBmdW5jdGlvbigpIHtcblxuICAgIC8vIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJnZXRDaGF0cm9vbU1vZGVsXCIsIHRoaXMuZ2V0Q2hhdHJvb21Nb2RlbCwgdGhpcyk7XG5cblxuICAgIHZhciBvbmxpbmVVc2VycyA9IHRoaXMubW9kZWwuZ2V0KCdvbmxpbmVVc2VycycpO1xuICAgIHRoaXMubGlzdGVuVG8ob25saW5lVXNlcnMsIFwiYWRkXCIsIHRoaXMucmVuZGVyVXNlciwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJyZW1vdmVcIiwgdGhpcy5yZW5kZXJVc2VycywgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJyZXNldFwiLCB0aGlzLnJlbmRlclVzZXJzLCB0aGlzKTtcblxuICAgIHZhciBjaGF0bG9nID0gdGhpcy5tb2RlbC5nZXQoJ2NoYXRsb2cnKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRsb2csIFwiYWRkXCIsIHRoaXMucmVuZGVyQ2hhdCwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhjaGF0bG9nLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlckNoYXRzLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRsb2csIFwicmVzZXRcIiwgdGhpcy5yZW5kZXJDaGF0cywgdGhpcyk7XG5cbiAgICB2YXIgY2hhdHJvb21zID0gdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tcycpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcImFkZFwiLCB0aGlzLnJlbmRlclJvb20sIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlclJvb21zLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRyb29tcywgXCJyZXNldFwiLCB0aGlzLnJlbmRlclJvb21zLCB0aGlzKTtcblxuICAgIC8vIHZhciBjaGF0cm9vbSA9IHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbScpO1xuICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJjaGFuZ2U6Y2hhdHJvb21cIiwgdGhpcy5yZW5kZXJOYW1lLCB0aGlzKTtcblxuICAgIC8vIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJjaGFuZ2U6Y2hhdHJvb21zXCIsIHRoaXMucmVuZGVyUm9vbXMsIHRoaXMpO1xuXG4gICAgLy8gdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImFkZDpvbmxpbmVVc2Vyc1wiLCB0aGlzLnJlbmRlclVzZXJzLCB0aGlzKTtcbiAgICAvLyB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiYWRkOmNoYXRsb2dcIiwgdGhpcy5yZW5kZXJDaGF0cywgdGhpcyk7XG4gICAgLy8gdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImFkZDpjaGF0cm9vbXNcIiwgdGhpcy5yZW5kZXJSb29tcywgdGhpcyk7XG5cbiAgICAvLyB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwicmVtb3ZlOm9ubGluZVVzZXJzXCIsIHRoaXMucmVuZGVyVXNlcnMsIHRoaXMpO1xuICAgIC8vIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJyZW1vdmU6Y2hhdGxvZ1wiLCB0aGlzLnJlbmRlckNoYXRzLCB0aGlzKTtcbiAgICAvLyB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwicmVtb3ZlOmNoYXRyb29tc1wiLCB0aGlzLnJlbmRlclJvb21zLCB0aGlzKTtcblxuICAgIC8vIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJyZXNldDpvbmxpbmVVc2Vyc1wiLCB0aGlzLnJlbmRlclVzZXJzLCB0aGlzKTtcbiAgICAvLyB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwicmVzZXQ6Y2hhdGxvZ1wiLCB0aGlzLnJlbmRlckNoYXRzLCB0aGlzKTtcbiAgICAvLyB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwicmVzZXQ6Y2hhdHJvb21zXCIsIHRoaXMucmVuZGVyUm9vbXMsIHRoaXMpO1xuXG4gICAgLy8gdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImdvcnBcIiwgdGhpcy5nb3JwLCB0aGlzKTtcbiAgICAvLyB0aGlzLm1vZGVsLm9uKCdnb3JwJywgZnVuY3Rpb24oY2hhdCkge1xuICAgIC8vICAgdGhpcy5nb3JwKGNoYXQpO1xuICAgIC8vIH0pO1xuXG4gIH0sXG5cblxuICAvLyBnb3JwOiBmdW5jdGlvbihjaGF0KSB7XG4gIC8vICAgY29uc29sZS5sb2coJ2Nydi5mLmdvcnAnKTtcbiAgLy8gICB2YXIgbm93ID0gXy5ub3coKTtcblxuICAvLyAgIHRoaXMudXNlckNoYXRzLmFkZChuZXcgYXBwLkNoYXRNb2RlbCh7IHNlbmRlcjogY2hhdC5zZW5kZXIsIG1lc3NhZ2U6IGNoYXQubWVzc2FnZSwgdGltZXN0YW1wOiBub3d9KSk7XG4gIC8vIH0sXG4gIGdldENoYXRyb29tTW9kZWw6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYuZ2V0Q2hhdHJvb21Nb2RlbCcpO1xuICAgIHRoaXMudmVudC50cmlnZ2VyKCdnZXRDaGF0cm9vbU1vZGVsJywgbmFtZSk7XG4gIH0sXG4gIC8vIHJlbmRlcnMgb24gZXZlbnRzLCBjYWxsZWQganVzdCBhYm92ZVxuICByZW5kZXJOYW1lOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLiQoJy5jaGF0Ym94LWhlYWRlcicpLmh0bWwodGhpcy5uYW1lVGVtcGxhdGUodGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tJykudG9KU09OKCkpKTtcbiAgfSxcbiAgcmVuZGVyVXNlcnM6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5yZW5kZXJVc2VycycpO1xuICAgIGNvbnNvbGUubG9nKCdVU0VSUzogJywgdGhpcy5tb2RlbC5nZXQoXCJvbmxpbmVVc2Vyc1wiKSk7XG4gICAgdGhpcy4kKCcub25saW5lLXVzZXJzJykuZW1wdHkoKTtcbiAgICB0aGlzLm1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpLmVhY2goZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgIHRoaXMucmVuZGVyVXNlcih1c2VyKTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyVXNlcjogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBfLnRlbXBsYXRlKCQoXCIjb25saW5lLXVzZXJzLWxpc3QtdGVtcGxhdGVcIikuaHRtbCgpKTtcbiAgICB0aGlzLiQoJy5vbmxpbmUtdXNlcnMnKS5hcHBlbmQodGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgfSxcbiAgcmVuZGVyQ2hhdHM6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5yZW5kZXJDaGF0cycpO1xuICAgIGNvbnNvbGUubG9nKCdDSEFUTE9HOiAnLCB0aGlzLm1vZGVsLmdldChcImNoYXRsb2dcIikpO1xuICAgIHRoaXMuJCgnLmNoYXRib3gtY29udGVudCcpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoJ2NoYXRsb2cnKS5lYWNoKGZ1bmN0aW9uKGNoYXQpIHtcbiAgICAgIHRoaXMucmVuZGVyQ2hhdChjaGF0KTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyQ2hhdDogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB0aGlzLnJlbmRlckRhdGVEaXZpZGVycyhtb2RlbCk7XG4gICAgdmFyIGNoYXRUZW1wbGF0ZSA9ICQodGhpcy5jaGF0VGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICBjaGF0VGVtcGxhdGUuYXBwZW5kVG8odGhpcy4kKCcuY2hhdGJveC1jb250ZW50JykpLmhpZGUoKS5mYWRlSW4oKS5zbGlkZURvd24oKTtcblxuICAgICQoJy5jaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuICAgIC8vIHRoaXMuJCgnLm5hbm8nKS5uYW5vU2Nyb2xsZXIoKTtcbiAgICAvLyB0aGlzLiQoJy5uYW5vJykubmFub1Njcm9sbGVyKHsgc2Nyb2xsOiAnYm90dG9tJyB9KTtcbiAgfSxcbiAgcmVuZGVyRGF0ZURpdmlkZXJzOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHRoaXMuY3VycmVudERhdGUgPSBtb21lbnQobW9kZWwuYXR0cmlidXRlcy50aW1lc3RhbXApLmZvcm1hdCgnZGRkZCwgTU1NTSBEbyBZWVlZJyk7XG4gICAgaWYgKCB0aGlzLmN1cnJlbnREYXRlICE9PSB0aGlzLnByZXZpb3VzRGF0ZSApIHtcbiAgICAgIHZhciBjdXJyZW50RGF0ZSA9ICQodGhpcy5kYXRlVGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICAgIGN1cnJlbnREYXRlLmFwcGVuZFRvKHRoaXMuJCgnLmNoYXRib3gtY29udGVudCcpKS5oaWRlKCkuZmFkZUluKCkuc2xpZGVEb3duKCk7XG4gICAgICB0aGlzLnByZXZpb3VzRGF0ZSA9IHRoaXMuY3VycmVudERhdGU7XG4gICAgfVxuICB9LFxuXG5cbiAgLy8gcmVuZGVycyBvbiBldmVudHMsIGNhbGxlZCBqdXN0IGFib3ZlXG4gIHJlbmRlclJvb21zOiBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYucmVuZGVyUm9vbXMnKTtcbiAgICBjb25zb2xlLmxvZygnQ0hBVFJPT01TOiAnLCB0aGlzLm1vZGVsLmdldChcImNoYXRyb29tc1wiKSk7XG4gICAgdGhpcy4kKCcucHVibGljLXJvb21zLWNvbnRhaW5lcicpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tcycpLmVhY2goZnVuY3Rpb24gKHJvb20pIHtcbiAgICAgIHRoaXMucmVuZGVyUm9vbShyb29tKTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyUm9vbTogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBfLnRlbXBsYXRlKCQoXCIjcm9vbS1saXN0LXRlbXBsYXRlXCIpLmh0bWwoKSk7XG4gICAgdGhpcy4kKCcucHVibGljLXJvb21zLWNvbnRhaW5lcicpLmFwcGVuZCh0ZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICB9LFxuXG4gIGpvaW5Sb29tOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLmpvaW5Sb29tJyk7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoJ2pvaW5Sb29tJywgbmFtZSk7XG4gICAgLy8gdmFyIG1vZGVsID0gdGhpcy5jb2xsZWN0aW9uLmZpbmRXaGVyZSh7bmFtZTogbmFtZX0pO1xuICAgIC8vIHRoaXMuZ2V0Q2hhdENvbGxlY3Rpb24obmFtZSk7XG4gICAgLy8gdGhpcy5yZW5kZXIobW9kZWwpO1xuICB9LFxuXG5cbiAgLy9ldmVudHNcbiAgbWVzc2FnZUlucHV0UHJlc3NlZDogZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzICYmICQudHJpbSgkKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgpKS5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBmdW4gZmFjdDogc2VwYXJhdGUgZXZlbnRzIHdpdGggYSBzcGFjZSBpbiB0cmlnZ2VyJ3MgZmlyc3QgYXJnIGFuZCB5b3VcbiAgICAgIC8vIGNhbiB0cmlnZ2VyIG11bHRpcGxlIGV2ZW50cy5cbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiY2hhdFwiLCB0aGlzLiQoJy5tZXNzYWdlLWlucHV0JykudmFsKCkpO1xuICAgICAgdGhpcy4kKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgnJyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwidHlwaW5nXCIpO1xuICAgICAgY29uc29sZS5sb2coJ3d1dCcpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgc2V0Um9vbTogZnVuY3Rpb24oZSkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5zZXRSb29tJyk7XG4gICAgdmFyICR0YXIgPSAkKGUudGFyZ2V0KTtcbiAgICBpZiAoJHRhci5pcygncCcpKSB7XG4gICAgICB0aGlzLmpvaW5Sb29tKCR0YXIuZGF0YSgncm9vbScpKTtcbiAgICB9XG4gIH1cblxuXG5cblxufSk7XG5cbn0pKGpRdWVyeSk7IiwiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5DaGF0cm9vbUxpc3QgPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG4gICAgbW9kZWw6IGFwcC5DaGF0cm9vbU1vZGVsLFxuICAgIHVybDogJy9hcGkvY2hhdHJvb21zJyxcbiAgfSk7XG5cbn0pKCk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbiAgYXBwLk5hdmJhclZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgZWw6ICcubG9naW4tbWVudScsXG4gICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoXCI8dWwgY2xhc3M9J25hdiBuYXZiYXItcmlnaHQnPjwlIGlmICh1c2VybmFtZSkgeyAlPjxsaT48YSBocmVmPScvJz48aSBjbGFzcz0nZmEgZmEtcG93ZXItb2ZmIHBvd2VyLW9mZi1zdHlsZSBmYS0yeCc+PC9pPjwvYT48L2xpPjwlIH0gZWxzZSB7ICU+PGxpPjxhIGhyZWY9JyNsb2cnPmxvZ2luPC9hPjwvbGk+PGxpPjxhIGhyZWY9JyNyZWcnPnJlZ2lzdGVyPC9hPjwvbGk+PCUgfSAlPjwvdWw+XCIpLFxuICAgIGV2ZW50czoge1xuICAgICAgXG4gICAgfSxcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMubW9kZWwgPSBuZXcgYXBwLlVzZXJNb2RlbCh7IHVzZXJuYW1lOiAnJyB9KTtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiY2hhbmdlXCIsIHRoaXMucmVuZGVyLCB0aGlzKTtcbiAgICB9LFxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUodGhpcy5tb2RlbC50b0pTT04oKSkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuXG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5SZWdpc3RlclZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI3JlZ2lzdGVyJykuaHRtbCgpKSxcbiAgICBldmVudHM6IHtcbiAgICAgIFwiY2xpY2sgI3NpZ25VcEJ0blwiOiBcInNpZ25VcFwiXG4gICAgfSxcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSgpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc2lnblVwOiBmdW5jdGlvbigpIHtcbiAgICB9XG4gIH0pO1xuXG59KShqUXVlcnkpOyIsIlxuLy8gVGhlIENoYXRDbGllbnQgaXMgaW1wbGVtZW50ZWQgb24gbWFpbi5qcy5cbi8vIFRoZSBjaGF0Y2xpZW50IGlzIGEgY29uc3RydWN0b3IgZnVuY3Rpb24gb24gdGhlIE1haW5Db250cm9sbGVyLlxuLy8gSXQgYm90aCBsaXN0ZW5zIHRvIGFuZCBlbWl0cyBldmVudHMgb24gdGhlIHNvY2tldCwgZWc6XG4vLyBJdCBoYXMgaXRzIG93biBtZXRob2RzIHRoYXQsIHdoZW4gY2FsbGVkLCBlbWl0IHRvIHRoZSBzb2NrZXQgdy8gZGF0YS5cbi8vIEl0IGFsc28gc2V0cyByZXNwb25zZSBsaXN0ZW5lcnMgb24gY29ubmVjdGlvbiwgdGhlc2UgcmVzcG9uc2UgbGlzdGVuZXJzXG4vLyBsaXN0ZW4gdG8gdGhlIHNvY2tldCBhbmQgdHJpZ2dlciBldmVudHMgb24gdGhlIGFwcEV2ZW50QnVzIG9uIHRoZSBcbi8vIE1haW5Db250cm9sbGVyXG52YXIgQ2hhdENsaWVudCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0Ly8gaXMtdHlwaW5nIGhlbHBlciB2YXJpYWJsZXNcblx0dmFyIFRZUElOR19USU1FUl9MRU5HVEggPSA0MDA7IC8vIG1zXG4gIHZhciB0eXBpbmcgPSBmYWxzZTtcbiAgdmFyIGxhc3RUeXBpbmdUaW1lO1xuICBcbiAgLy8gdGhpcyB2ZW50IGhvbGRzIHRoZSBhcHBFdmVudEJ1c1xuXHRzZWxmLnZlbnQgPSBvcHRpb25zLnZlbnQ7XG5cblx0c2VsZi5ob3N0bmFtZSA9ICdodHRwOi8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xuXG4gIC8vIGNvbm5lY3RzIHRvIHNvY2tldCwgc2V0cyByZXNwb25zZSBsaXN0ZW5lcnNcblx0c2VsZi5jb25uZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuY29ubmVjdCcpO1xuXHRcdC8vIHRoaXMgaW8gbWlnaHQgYmUgYSBsaXR0bGUgY29uZnVzaW5nLi4uIHdoZXJlIGlzIGl0IGNvbWluZyBmcm9tP1xuXHRcdC8vIGl0J3MgY29taW5nIGZyb20gdGhlIHN0YXRpYyBtaWRkbGV3YXJlIG9uIHNlcnZlci5qcyBiYyBldmVyeXRoaW5nXG5cdFx0Ly8gaW4gdGhlIC9wdWJsaWMgZm9sZGVyIGhhcyBiZWVuIGF0dGFjaGVkIHRvIHRoZSBzZXJ2ZXIsIGFuZCB2aXNhXG5cdFx0Ly8gdmVyc2EuXG5cdFx0c2VsZi5zb2NrZXQgPSBpby5jb25uZWN0KHNlbGYuaG9zdG5hbWUpO1xuICAgIHNlbGYuc2V0UmVzcG9uc2VMaXN0ZW5lcnMoc2VsZi5zb2NrZXQpO1xuICB9O1xuXG4gIHNlbGYuY29ubmVjdFRvUm9vbSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5jb25uZWN0VG9Sb29tOiAnLCBuYW1lKTtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwiY29ubmVjdFRvUm9vbVwiLCBuYW1lKTtcbiAgfTtcblxuICBzZWxmLmdldENoYXRyb29tTW9kZWwgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuZ2V0Q2hhdHJvb21Nb2RlbDogJywgbmFtZSk7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcImdldENoYXRyb29tTW9kZWxcIiwgbmFtZSk7XG4gIH07XG5cblxuXG4vLy8vLyBWaWV3RXZlbnRCdXMgbWV0aG9kcyAvLy8vXG4gICAgLy8gbWV0aG9kcyB0aGF0IGVtaXQgdG8gdGhlIGNoYXRzZXJ2ZXJcbiAgc2VsZi5sb2dpbiA9IGZ1bmN0aW9uKHVzZXIpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5sb2dpbjogJywgdXNlcik7XG5cdFx0c2VsZi5zb2NrZXQuZW1pdChcImxvZ2luXCIsIHVzZXIpO1xuXHR9O1xuICAvLyBzZWxmLmxvZ291dCA9IGZ1bmN0aW9uKCkge1xuICAvLyAgIHNlbGYuc29ja2V0LmVtaXQoXCJ3dXRcIik7XG4gIC8vIH07XG5cblxuXG4gIHNlbGYuY2hhdCA9IGZ1bmN0aW9uKGNoYXQpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5jaGF0OiAnLCBjaGF0KTtcblx0XHRzZWxmLnNvY2tldC5lbWl0KFwiY2hhdFwiLCBjaGF0KTtcblx0fTtcblxuXG4gIC8vIFR5cGluZyBtZXRob2RzXG5cdHNlbGYuYWRkQ2hhdFR5cGluZyA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgbWVzc2FnZSA9IGRhdGEudXNlcm5hbWUgKyAnIGlzIHR5cGluZyc7XG4gICAgJCgnLnR5cGV0eXBldHlwZScpLnRleHQobWVzc2FnZSk7XG5cdH07XG5cdHNlbGYucmVtb3ZlQ2hhdFR5cGluZyA9IGZ1bmN0aW9uKCkge1xuICAgICQoJy50eXBldHlwZXR5cGUnKS5lbXB0eSgpO1xuXHR9O1xuICBzZWxmLnVwZGF0ZVR5cGluZyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChzZWxmLnNvY2tldCkge1xuICAgICAgaWYgKCF0eXBpbmcpIHtcbiAgICAgICAgdHlwaW5nID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5zb2NrZXQuZW1pdCgndHlwaW5nJyk7XG4gICAgICB9XG4gICAgICBsYXN0VHlwaW5nVGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHlwaW5nVGltZXIgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgICB2YXIgdGltZURpZmYgPSB0eXBpbmdUaW1lciAtIGxhc3RUeXBpbmdUaW1lO1xuICAgICAgICBpZiAodGltZURpZmYgPj0gVFlQSU5HX1RJTUVSX0xFTkdUSCAmJiB0eXBpbmcpIHtcbiAgICAgICAgICAgc2VsZi5zb2NrZXQuZW1pdCgnc3RvcCB0eXBpbmcnKTtcbiAgICAgICAgICAgdHlwaW5nID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0sIFRZUElOR19USU1FUl9MRU5HVEgpO1xuICAgIH1cbiAgfTtcblxuXG4gIC8vIGpvaW4gcm9vbVxuICBzZWxmLmpvaW5Sb29tID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoJ2pvaW5Sb29tJywgbmFtZSk7XG4gIH07XG5cbiAgLy8gc2V0IHJvb21cbiAgc2VsZi5zZXRSb29tID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGlmIChuYW1lICE9PSBudWxsKSB7XG4gICAgICB0aGlzLmN1cnJlbnRSb29tID0gbmFtZTtcbiAgICB9XG4gICAgLy8vPj4+Pj4+PiBjaGFuZ2V0aGlzdG8gLmNoYXQtdGl0bGVcbiAgICB2YXIgJGNoYXRUaXRsZSA9ICQoJy5jaGF0Ym94LWhlYWRlci11c2VybmFtZScpO1xuICAgICRjaGF0VGl0bGUudGV4dChuYW1lKTtcbiAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgICQoJy5jaGF0LWRpcmVjdG9yeScpLmZpbmQoJy5yb29tJykuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgIHZhciAkcm9vbSA9ICQodGhpcyk7XG4gICAgICAkcm9vbS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgICBpZiAoJHJvb20uZGF0YSgnbmFtZScpID09PSB0aGlzXy5jdXJyZW50Um9vbSkge1xuICAgICAgICAkcm9vbS5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG4gIFxuXG5cblxuICAvLy8vLy8vLy8vLy8vLyBjaGF0c2VydmVyIGxpc3RlbmVycy8vLy8vLy8vLy8vLy9cblxuICAvLyB0aGVzZSBndXlzIGxpc3RlbiB0byB0aGUgY2hhdHNlcnZlci9zb2NrZXQgYW5kIGVtaXQgZGF0YSB0byBtYWluLmpzLFxuICAvLyBzcGVjaWZpY2FsbHkgdG8gdGhlIGFwcEV2ZW50QnVzLlxuXHRzZWxmLnNldFJlc3BvbnNlTGlzdGVuZXJzID0gZnVuY3Rpb24oc29ja2V0KSB7XG5cdFx0c29ja2V0Lm9uKCd3ZWxjb21lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgLy8gZW1pdHMgZXZlbnQgdG8gcmVjYWxpYnJhdGUgb25saW5lVXNlcnMgY29sbGVjdGlvblxuICAgICAgLy8gc29ja2V0LmVtaXQoXCJnZXRPbmxpbmVVc2Vyc1wiKTtcbiAgICAgIC8vIHNvY2tldC5lbWl0KFwicm9vbXNcIik7XG4gICAgICAvLyBkYXRhIGlzIHVuZGVmaW5lZCBhdCB0aGlzIHBvaW50IGJlY2F1c2UgaXQncyB0aGUgZmlyc3QgdG9cbiAgICAgIC8vIGZpcmUgb2ZmIGFuIGV2ZW50IGNoYWluIHRoYXQgd2lsbCBhcHBlbmQgdGhlIG5ldyB1c2VyIHRvIFxuICAgICAgLy8gdGhlIG9ubGluZVVzZXIgY29sbGVjdGlvblxuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJsb2dpbkRvbmVcIiwgZGF0YSk7XG4gICAgfSk7XG5cbiAgICBzb2NrZXQub24oJ2xvZ2luJywgZnVuY3Rpb24odXNlcm5hbWUpIHtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKCdsb2dpblVzZXInLCB1c2VybmFtZSk7XG4gICAgfSk7XG5cblxuICAgIHNvY2tldC5vbignbG9nJywgZnVuY3Rpb24oKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5sb2cnKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKCdhdXRoZW50aWNhdGVkJyk7XG4gICAgfSk7XG5cblx0XHRzb2NrZXQub24oJ3VzZXJzSW5mbycsIGZ1bmN0aW9uKHVzZXJzKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnc2MuZS51c2Vyc0luZm86ICcsIHVzZXJzKTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwidXNlcnNJbmZvXCIsIHVzZXJzKTtcblx0XHR9KTtcblxuICAgIHNvY2tldC5vbigncm9vbXMnLCBmdW5jdGlvbihjaGF0cm9vbXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLnJvb21zOiAnLCBjaGF0cm9vbXMpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJyb29tSW5mb1wiLCBjaGF0cm9vbXMpO1xuICAgIH0pO1xuXG5cblxuXHRcdHNvY2tldC5vbigndXNlckpvaW5lZCcsIGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnc2MuZS51c2VySm9pbmVkOiAnLCB1c2VybmFtZSk7XG4gICAgICAvLyBzb2NrZXQuZW1pdChcIm9ubGluZVVzZXJzXCIpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJ1c2VySm9pbmVkXCIsIHVzZXJuYW1lKTtcblx0XHR9KTtcblx0XHRzb2NrZXQub24oJ3VzZXJMZWZ0JywgZnVuY3Rpb24odXNlcm5hbWUpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdzYy5lLnVzZXJMZWZ0OiAnLCB1c2VybmFtZSk7XG4gICAgICAvLyBzb2NrZXQuZW1pdChcIm9ubGluZVVzZXJzXCIpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJ1c2VyTGVmdFwiLCB1c2VybmFtZSk7XG5cdFx0fSk7XG5cblxuXG5cdFx0c29ja2V0Lm9uKCdjaGF0JywgZnVuY3Rpb24oY2hhdCkge1xuXHRcdFx0Y29uc29sZS5sb2coJ3NjLmUuY2hhdDogJywgY2hhdCk7XG5cdFx0XHRzZWxmLnZlbnQudHJpZ2dlcihcImNoYXRSZWNlaXZlZFwiLCBjaGF0KTtcblx0XHR9KTtcbiAgICBzb2NrZXQub24oJ3NldFJvb20nLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5zZXRSb29tOiAnLCBuYW1lKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0Um9vbVwiLCBuYW1lKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ2NoYXRsb2cnLCBmdW5jdGlvbihjaGF0bG9nKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5jaGF0bG9nOiAnLCBjaGF0bG9nKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0Q2hhdGxvZ1wiLCBjaGF0bG9nKTtcbiAgICB9KTtcbiAgICAvLyBzb2NrZXQub24oJ0NoYXRyb29tTW9kZWwnLCBmdW5jdGlvbihtb2RlbCkge1xuICAgIC8vICAgLy8gc2VsZi52ZW50LnRyaWdnZXIoXCJDaGF0cm9vbU1vZGVsXCIsIG1vZGVsKTtcbiAgICAvLyAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0Um9vbVwiLCBtb2RlbCk7XG4gICAgLy8gfSk7XG4gICAgc29ja2V0Lm9uKCdjaGF0cm9vbXMnLCBmdW5jdGlvbihjaGF0cm9vbXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLmNoYXRyb29tczogICcsIGNoYXRyb29tcyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldENoYXRyb29tc1wiLCBjaGF0cm9vbXMpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbignb25saW5lVXNlcnMnLCBmdW5jdGlvbihvbmxpbmVVc2Vycykge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUub25saW5lVXNlcnM6ICcsIG9ubGluZVVzZXJzKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0T25saW5lVXNlcnNcIiwgb25saW5lVXNlcnMpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbignY2hhdHJvb21OYW1lJywgZnVuY3Rpb24obmFtZSkge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUuY2hhdHJvb21OYW1lOiAnLCBuYW1lKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0Q2hhdHJvb21OYW1lXCIsIG5hbWUpO1xuICAgIH0pO1xuXG5cblxuICAgIHNvY2tldC5vbigndHlwaW5nJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgc2VsZi5hZGRDaGF0VHlwaW5nKGRhdGEpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbignc3RvcCB0eXBpbmcnLCBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYucmVtb3ZlQ2hhdFR5cGluZygpO1xuICAgIH0pO1xuXG5cblx0fTtcbn07IiwiXG5cbmFwcC5NYWluQ29udHJvbGxlciA9IGZ1bmN0aW9uKCkge1xuXG5cdHZhciBzZWxmID0gdGhpcztcblxuXG4gIC8vVGhlc2UgYWxsb3dzIHVzIHRvIGJpbmQgYW5kIHRyaWdnZXIgb24gdGhlIG9iamVjdCBmcm9tIGFueXdoZXJlIGluIHRoZSBhcHAuXG5cdHNlbGYuYXBwRXZlbnRCdXMgPSBfLmV4dGVuZCh7fSwgQmFja2JvbmUuRXZlbnRzKTtcblx0c2VsZi52aWV3RXZlbnRCdXMgPSBfLmV4dGVuZCh7fSwgQmFja2JvbmUuRXZlbnRzKTtcblxuXHRzZWxmLmluaXQgPSBmdW5jdGlvbigpIHtcblxuICAgIC8vIGxvZ2luTW9kZWxcbiAgICBzZWxmLmxvZ2luTW9kZWwgPSBuZXcgYXBwLkxvZ2luTW9kZWwoKTtcbiAgICBzZWxmLmxvZ2luVmlldyA9IG5ldyBhcHAuTG9naW5WaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cywgbW9kZWw6IHNlbGYubG9naW5Nb2RlbH0pO1xuICAgIHNlbGYucmVnaXN0ZXJWaWV3ID0gbmV3IGFwcC5SZWdpc3RlclZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzIH0pO1xuICAgIHNlbGYubmF2YmFyVmlldyA9IG5ldyBhcHAuTmF2YmFyVmlldygpO1xuXG4gICAgLy8gVGhlIENvbnRhaW5lck1vZGVsIGdldHMgcGFzc2VkIGEgdmlld1N0YXRlLCBMb2dpblZpZXcsIHdoaWNoXG4gICAgLy8gaXMgdGhlIGxvZ2luIHBhZ2UuIFRoYXQgTG9naW5WaWV3IGdldHMgcGFzc2VkIHRoZSB2aWV3RXZlbnRCdXNcbiAgICAvLyBhbmQgdGhlIExvZ2luTW9kZWwuXG4gICAgc2VsZi5jb250YWluZXJNb2RlbCA9IG5ldyBhcHAuQ29udGFpbmVyTW9kZWwoeyB2aWV3U3RhdGU6IHNlbGYubG9naW5WaWV3fSk7XG5cbiAgICAvLyBuZXh0LCBhIG5ldyBDb250YWluZXJWaWV3IGlzIGludGlhbGl6ZWQgd2l0aCB0aGUgbmV3bHkgY3JlYXRlZCBjb250YWluZXJNb2RlbFxuICAgIC8vIHRoZSBsb2dpbiBwYWdlIGlzIHRoZW4gcmVuZGVyZWQuXG4gICAgc2VsZi5jb250YWluZXJWaWV3ID0gbmV3IGFwcC5Db250YWluZXJWaWV3KHsgbW9kZWw6IHNlbGYuY29udGFpbmVyTW9kZWwgfSk7XG4gICAgc2VsZi5jb250YWluZXJWaWV3LnJlbmRlcigpO1xuXG4gIH07XG5cblxuICBzZWxmLmF1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICBcbiAgICAkKFwiYm9keVwiKS5jc3MoXCJvdmVyZmxvd1wiLCBcImhpZGRlblwiKTtcbiAgICBzZWxmLmNoYXRDbGllbnQgPSBuZXcgQ2hhdENsaWVudCh7IHZlbnQ6IHNlbGYuYXBwRXZlbnRCdXMgfSk7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmNvbm5lY3QoKTtcblxuICAgIC8vIG5ldyBtb2RlbCBhbmQgdmlldyBjcmVhdGVkIGZvciBjaGF0cm9vbVxuICAgIHNlbGYuY2hhdHJvb21Nb2RlbCA9IG5ldyBhcHAuQ2hhdHJvb21Nb2RlbCh7IG5hbWU6ICdET08nIH0pO1xuICAgIHNlbGYuY2hhdHJvb21MaXN0ID0gbmV3IGFwcC5DaGF0cm9vbUxpc3QoKTtcbiAgICBzZWxmLmNoYXRyb29tTGlzdC5mZXRjaCgpLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdjaGF0cm9vbXMnLCBzZWxmLmNoYXRyb29tTGlzdCk7XG4gICAgICBzZWxmLmNoYXRyb29tVmlldyAgPSBuZXcgYXBwLkNoYXRyb29tVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXMsIG1vZGVsOiBzZWxmLmNoYXRyb29tTW9kZWwgfSk7XG4gICAgICBzZWxmLmNvbnRhaW5lck1vZGVsLnNldCgndmlld1N0YXRlJywgc2VsZi5jaGF0cm9vbVZpZXcpO1xuXG4gICAgICBhdXRvc2l6ZSgkKCd0ZXh0YXJlYS5tZXNzYWdlLWlucHV0JykpO1xuICAgICAgJCgnLmNoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJy5jaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG4gICAgICAgXG4gICAgICBjb25zb2xlLmxvZygnYXV0aGVudCcpO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICBzZWxmLmNoYXRDbGllbnQuY29ubmVjdFRvUm9vbShcIkRPT1wiKTtcbiAgICAgIH0sIDE1MDApO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICBzZWxmLmNoYXRyb29tVmlldy5pbml0Um9vbSgpO1xuICAgICAgfSwgMjAwMCk7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIHNlbGYuZGF0ZURpdmlkZXIubG9hZCgkKFwiLmZvbGxvd01lQmFyXCIpKTtcbiAgICAgIH0sIDIwMDEpO1xuICAgIH0pO1xuXG4gIH07XG5cbiAgLy8gc2VsZi5sb2dvdXQgPSBmdW5jdGlvbigpIHtcbiAgLy8gICBzZWxmLmNoYXRDbGllbnQubG9nb3V0KCk7XG4gIC8vICAgc2VsZi5uYXZiYXJWaWV3ID0gbmV3IGFwcC5OYXZiYXJWaWV3KCk7XG4gIC8vIH07XG5cbiAgc2VsZi5kYXRlRGl2aWRlciA9IChmdW5jdGlvbigpIHtcblxuICB2YXIgJHdpbmRvdyA9ICQod2luZG93KSxcbiAgICAgICRzdGlja2llcztcblxuICBsb2FkID0gZnVuY3Rpb24oc3RpY2tpZXMpIHtcblxuICAgICAgXG4gICAgY29uc29sZS5sb2coJ2dvZCBkYW1uIGl0Jyk7XG4gICAgICAkc3RpY2tpZXMgPSBzdGlja2llcy5lYWNoKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciAkdGhpc1N0aWNreSA9ICQodGhpcykud3JhcCgnPGRpdiBjbGFzcz1cImZvbGxvd1dyYXAgcm93XCIgLz4nKTtcbiAgXG4gICAgICAgICR0aGlzU3RpY2t5XG4gICAgICAgICAgICAuZGF0YSgnb3JpZ2luYWxQb3NpdGlvbicsICR0aGlzU3RpY2t5Lm9mZnNldCgpLnRvcClcbiAgICAgICAgICAgIC5kYXRhKCdvcmlnaW5hbEhlaWdodCcsICR0aGlzU3RpY2t5Lm91dGVySGVpZ2h0KCkpXG4gICAgICAgICAgICAgIC5wYXJlbnQoKVxuICAgICAgICAgICAgICAuaGVpZ2h0KCR0aGlzU3RpY2t5Lm91dGVySGVpZ2h0KCkpO1xuICAgICAgICBjb25zb2xlLmxvZygndGhpc3N0aWNreS5vcmlnaW5hbHBvc2l0aW9uJywgJHRoaXNTdGlja3kub2Zmc2V0KCkudG9wKTtcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAkKCcuY2hhdGJveC1jb250ZW50Jykuc2Nyb2xsKHNjcm9sbFN0aWNraWVzSW5pdCk7XG5cbiAgfTtcblxuXG4gIHNjcm9sbFN0aWNraWVzSW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICQodGhpcykub2ZmKFwic2Nyb2xsLnN0aWNraWVzXCIpO1xuICAgICQodGhpcykub24oXCJzY3JvbGwuc3RpY2tpZXNcIiwgXy5kZWJvdW5jZShfd2hlblNjcm9sbGluZywgNTApKTtcbiAgfTtcblxuXG4gIF93aGVuU2Nyb2xsaW5nID0gZnVuY3Rpb24oKSB7XG5cbiAgICAkc3RpY2tpZXMuZWFjaChmdW5jdGlvbihpLCBzdGlja3kpIHtcblxuICAgICAgdmFyICR0aGlzU3RpY2t5ID0gJChzdGlja3kpLFxuICAgICAgICAgICR0aGlzU3RpY2t5VG9wID0gJHRoaXNTdGlja3kub2Zmc2V0KCkudG9wLFxuXG4gICAgICAgICAgJHByZXZTdGlja3kgPSAkc3RpY2tpZXMuZXEoaSAtIDEpLFxuICAgICAgICAgICRwcmV2U3RpY2t5VG9wID0gJHByZXZTdGlja3kub2Zmc2V0KCkudG9wLFxuICAgICAgICAgICRwcmV2U3RpY2t5UG9zaXRpb24gPSAkcHJldlN0aWNreS5kYXRhKCdvcmlnaW5hbFBvc2l0aW9uJyk7XG5cblxuICAgICAgaWYgKCR0aGlzU3RpY2t5VG9wID49IDE4MCAmJiAkdGhpc1N0aWNreVRvcCA8PSAyMTApIHtcblxuICAgICAgICB2YXIgJG5leHRTdGlja3kgPSAkc3RpY2tpZXMuZXEoaSArIDEpIHx8IG51bGwsXG5cbiAgICAgICAgJHRoaXNTdGlja3lQb3NpdGlvbiA9ICR0aGlzU3RpY2t5LmRhdGEoJ29yaWdpbmFsUG9zaXRpb24nKSxcbiAgICAgICAgJHRoaXNBbmRQcmV2U3RpY2t5RGlmZmVyZW5jZSA9IE1hdGguYWJzKCRwcmV2U3RpY2t5UG9zaXRpb24gLSAkdGhpc1N0aWNreVBvc2l0aW9uKTtcblxuICAgICAgICAkdGhpc1N0aWNreS5hZGRDbGFzcyhcImZpeGVkXCIpO1xuXG4gICAgICAgIC8vIHZhciAkbmV4dFN0aWNreVBvc2l0aW9uID0gJG5leHRTdGlja3kuZGF0YSgnb3JpZ2luYWxQb3NpdGlvbicpO1xuICAgICAgICAvLyB2YXIgJHRoaXNBbmROZXh0U3RpY2t5RGlmZmVyZW5jZSA9IE1hdGguYWJzKCR0aGlzU3RpY2t5UG9zaXRpb24gLSAkbmV4dFN0aWNreVBvc2l0aW9uKTtcbiAgICAgICAgLy8gdmFyICRuZXh0U3RpY2t5VG9wID0gJG5leHRTdGlja3kub2Zmc2V0KCkudG9wO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLScpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygncHJldnN0aWNreW9yaWdpbnBvc2l0aW9uJywgJHByZXZTdGlja3lQb3NpdGlvbik7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdwcmV2c3RpY2t5dG9wJywgJHByZXZTdGlja3lUb3ApO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnJHRoaXNBbmRQcmV2U3RpY2t5RGlmZmVyZW5jZScsICR0aGlzQW5kUHJldlN0aWNreURpZmZlcmVuY2UpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygndGhpc1N0aWNreVRvcCcsICR0aGlzU3RpY2t5VG9wKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJyR0aGlzQW5kTmV4dFN0aWNreURpZmZlcmVuY2UnLCAkdGhpc0FuZE5leHRTdGlja3lEaWZmZXJlbmNlKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ25leHRTdGlja3lUb3AnLCAkbmV4dFN0aWNreVRvcCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCduZXh0c3RpY2t5b3JpZ2lucG9zaXRpb24nLCAkbmV4dFN0aWNreVBvc2l0aW9uKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3ByZXYnLCAkcHJldlN0aWNreSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCd0aGlzJywgJHRoaXNTdGlja3kpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnbmV4dCcsICRuZXh0U3RpY2t5KTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ25leHRzdGlja3l0b3AnLCAkbmV4dFN0aWNreVRvcCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0tJyk7XG4gICAgICAgIFxuXG4gICAgICAvL3Njcm9sbGluZyB1cFxuICAgICAgICAgaWYgKCRuZXh0U3RpY2t5Lmhhc0NsYXNzKFwiZml4ZWRcIikpIHtcbiAgICAgICAgICAgJG5leHRTdGlja3kucmVtb3ZlQ2xhc3MoXCJmaXhlZFwiKTtcbiAgICAgICAgIH1cblxuICAgICAgLy8gc2Nyb2xsaW5nIHVwIGFuZCBzdGlja2luZyB0byBwcm9wZXIgcG9zaXRpb25cbiAgICAgICAgIGlmICgkcHJldlN0aWNreVRvcCArICR0aGlzQW5kUHJldlN0aWNreURpZmZlcmVuY2UgPiAyMDUgJiYgaSAhPT0gMCkge1xuXG4gICAgICAgICAgICAkbmV4dFN0aWNreS5yZW1vdmVDbGFzcyhcImZpeGVkXCIpO1xuICAgICAgICAgICAgJHByZXZTdGlja3kuYWRkQ2xhc3MoXCJmaXhlZFwiKTtcbiAgICAgICAgIH1cblxuICAgICAgLy8gc2Nyb2xsaW5nIGRvd25cbiAgICAgICAgaWYgKCRwcmV2U3RpY2t5VG9wID49IDIwNSAmJiAkcHJldlN0aWNreS5oYXNDbGFzcyhcImZpeGVkXCIpICYmIGkgIT09IDApIHtcbiAgICAgICAgICAgJHByZXZTdGlja3kucmVtb3ZlQ2xhc3MoXCJmaXhlZFwiKTtcbiAgICAgICAgIH1cblxuICAgICAgfVxuXG4gICAgICBpZiAoJCgnLmNoYXRib3gtY29udGVudCcpLnNjcm9sbFRvcCgpID09PSAwKSB7XG4gICAgICAgICRzdGlja2llcy5yZW1vdmVDbGFzcygnZml4ZWQnKTtcbiAgICAgIH1cblxuICAgIH0pO1xuXG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBsb2FkOiBsb2FkXG4gIH07XG59KSgpO1xuXG5cblxuICAvLyBzZWxmLmFwcEV2ZW50QnVzLm9uKFwiYXV0aGVudGljYXRlZFwiLCBmdW5jdGlvbigpIHtcbiAgLy8gICBkZWJ1Z2dlcjtcbiAgLy8gICBzZWxmLmF1dGhlbnRpY2F0ZWQoKTtcbiAgLy8gfSk7XG5cblxuXG4gIC8vLy8vLy8vLy8vLyAgQnVzc2VzIC8vLy8vLy8vLy8vL1xuICAgIC8vIFRoZXNlIEJ1c3NlcyBsaXN0ZW4gdG8gdGhlIHNvY2tldGNsaWVudFxuICAgLy8gICAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblxuICAvLy8vIHZpZXdFdmVudEJ1cyBMaXN0ZW5lcnMgLy8vLy9cbiAgXG5cdHNlbGYudmlld0V2ZW50QnVzLm9uKFwibG9naW5cIiwgZnVuY3Rpb24odXNlcikge1xuICAgIHNlbGYuY2hhdENsaWVudC5sb2dpbih1c2VyKTtcbiAgfSk7XG5cdHNlbGYudmlld0V2ZW50QnVzLm9uKFwiY2hhdFwiLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmNoYXQoY2hhdCk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcInR5cGluZ1wiLCBmdW5jdGlvbigpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQudXBkYXRlVHlwaW5nKCk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImpvaW5Sb29tXCIsIGZ1bmN0aW9uKHJvb20pIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuam9pblJvb20ocm9vbSk7XG4gIH0pO1xuXG5cblxuXG5cblxuXG5cbiAgLy8vLyBhcHBFdmVudEJ1cyBMaXN0ZW5lcnMgLy8vL1xuXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2Vyc0luZm9cIiwgZnVuY3Rpb24oZGF0YSkge1xuICAgIGNvbnNvbGUubG9nKCdtYWluLmUudXNlcnNJbmZvOiAnLCBkYXRhKTtcbiAgICAvL2RhdGEgaXMgYW4gYXJyYXkgb2YgdXNlcm5hbWVzLCBpbmNsdWRpbmcgdGhlIG5ldyB1c2VyXG5cdFx0Ly8gVGhpcyBtZXRob2QgZ2V0cyB0aGUgb25saW5lIHVzZXJzIGNvbGxlY3Rpb24gZnJvbSBjaGF0cm9vbU1vZGVsLlxuXHRcdC8vIG9ubGluZVVzZXJzIGlzIHRoZSBjb2xsZWN0aW9uXG5cdFx0dmFyIG9ubGluZVVzZXJzID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiLi4ub25saW5lVXNlcnM6IFwiLCBvbmxpbmVVc2Vycyk7XG5cdFx0dmFyIHVzZXJzID0gXy5tYXAoZGF0YSwgZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0cmV0dXJuIG5ldyBhcHAuVXNlck1vZGVsKHt1c2VybmFtZTogaXRlbX0pO1xuXHRcdH0pO1xuICAgIGNvbnNvbGUubG9nKFwidXNlcnM6IFwiLCB1c2Vycyk7XG5cdFx0b25saW5lVXNlcnMucmVzZXQodXNlcnMpO1xuXHR9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwicm9vbUluZm9cIiwgZnVuY3Rpb24oZGF0YSkge1xuICAgIGNvbnNvbGUubG9nKCdtYWluLmUucm9vbUluZm86ICcsIGRhdGEpO1xuICAgIHZhciByb29tcyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoXCJjaGF0cm9vbXNcIik7XG4gICAgIGNvbnNvbGUubG9nKFwiLi4ucm9vbXM6IFwiLCByb29tcyk7XG4gICAgdmFyIHVwZGF0ZWRSb29tcyA9IF8ubWFwKGRhdGEsIGZ1bmN0aW9uKHJvb20pIHtcbiAgICAgIHZhciBuZXdDaGF0cm9vbU1vZGVsID0gbmV3IGFwcC5DaGF0cm9vbU1vZGVsKHtuYW1lOiByb29tLm5hbWV9KTtcbiAgICAgIHJldHVybiBuZXdDaGF0cm9vbU1vZGVsO1xuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKFwiLi4udXBkYXRlZHJvb21zOiBcIiwgdXBkYXRlZFJvb21zKTtcbiAgICByb29tcy5yZXNldCh1cGRhdGVkUm9vbXMpO1xuICB9KTtcblxuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcImxvZ2luVXNlclwiLCBmdW5jdGlvbih1c2VybmFtZSkge1xuICAgIGNvbnNvbGUubG9nKCdtYWluLmUubG9naW5Vc2VyOiAnLCB1c2VybmFtZSk7XG4gICAgdmFyIHVzZXIgPSBuZXcgYXBwLlVzZXJNb2RlbCh7dXNlcm5hbWU6IHVzZXJuYW1lfSk7XG4gICAgc2VsZi5uYXZiYXJWaWV3Lm1vZGVsLnNldCh1c2VyLnRvSlNPTigpKTtcbiAgfSk7XG5cblxuXG4gIC8vIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRSb29tXCIsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gIC8vICAgY29uc29sZS5sb2coJ21haW4uZS5zZXRSb29tOiAnLCBtb2RlbCk7XG5cbiAgLy8gICB2YXIgY2hhdGxvZyA9IG5ldyBhcHAuQ2hhdENvbGxlY3Rpb24obW9kZWwuY2hhdGxvZyk7XG4gIC8vICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnY2hhdGxvZycsIGNoYXRsb2cpO1xuXG4gIC8vICAgdmFyIHJvb21zID0gbmV3IGFwcC5DaGF0cm9vbUxpc3QobW9kZWwuY2hhdHJvb21zKTtcbiAgLy8gICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdjaGF0cm9vbXMnLCByb29tcyk7XG5cbiAgLy8gICB2YXIgdXNlcnMgPSBuZXcgYXBwLlVzZXJDb2xsZWN0aW9uKG1vZGVsLm9ubGluZVVzZXJzKTtcbiAgLy8gICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdvbmxpbmVVc2VycycsIHVzZXJzKTtcblxuICAvLyB9KTtcblxuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcIkNoYXRyb29tTW9kZWxcIiwgZnVuY3Rpb24obW9kZWwpIHtcbiAgICBjb25zb2xlLmxvZygnbWFpbi5lLkNoYXRyb29tTW9kZWw6ICcsIG1vZGVsKTtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoKTtcbiAgICBzZWxmLmNoYXRyb29tTGlzdCA9IG5ldyBhcHAuQ2hhdHJvb21MaXN0KCk7XG4gICAgc2VsZi5jaGF0cm9vbVZpZXcgID0gbmV3IGFwcC5DaGF0cm9vbVZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzLCBtb2RlbDogc2VsZi5jaGF0cm9vbU1vZGVsLCBjb2xsZWN0aW9uOiBzZWxmLmNoYXRyb29tTGlzdH0pO1xuICAgIHNlbGYuY29udGFpbmVyTW9kZWwuc2V0KCd2aWV3U3RhdGUnLCBzZWxmLmNoYXRyb29tVmlldyk7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLmxvYWRNb2RlbChtb2RlbCk7XG4gIH0pO1xuXG5cblxuICAvLyBhZGRzIG5ldyB1c2VyIHRvIHVzZXJzIGNvbGxlY3Rpb24sIHNlbmRzIGRlZmF1bHQgam9pbmluZyBtZXNzYWdlXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2VySm9pbmVkXCIsIGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdtYWluLmUudXNlckpvaW5lZDogJywgdXNlcm5hbWUpO1xuXHRcdHNlbGYuY2hhdHJvb21Nb2RlbC5hZGRVc2VyKHVzZXJuYW1lKTtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkQ2hhdCh7c2VuZGVyOiBcIkJ1dHRlcnNcIiwgbWVzc2FnZTogdXNlcm5hbWUgKyBcIiBqb2luZWQgcm9vbS5cIiB9KTtcblx0fSk7XG5cblx0Ly8gcmVtb3ZlcyB1c2VyIGZyb20gdXNlcnMgY29sbGVjdGlvbiwgc2VuZHMgZGVmYXVsdCBsZWF2aW5nIG1lc3NhZ2Vcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcInVzZXJMZWZ0XCIsIGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdtYWluLmUudXNlckxlZnQ6ICcsIHVzZXJuYW1lKTtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwucmVtb3ZlVXNlcih1c2VybmFtZSk7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLmFkZENoYXQoe3NlbmRlcjogXCJCdXR0ZXJzXCIsIG1lc3NhZ2U6IHVzZXJuYW1lICsgXCIgbGVmdCByb29tLlwiIH0pO1xuXHR9KTtcblxuXHQvLyBjaGF0IHBhc3NlZCBmcm9tIHNvY2tldGNsaWVudCwgYWRkcyBhIG5ldyBjaGF0IG1lc3NhZ2UgdXNpbmcgY2hhdHJvb21Nb2RlbCBtZXRob2Rcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcImNoYXRSZWNlaXZlZFwiLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLmFkZENoYXQoY2hhdCk7XG5cdFx0JCgnLmNoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJy5jaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG5cdH0pO1xuXG5cblxuXG5cblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0Q2hhdHJvb21OYW1lXCIsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgbmV3SGVhZGVyID0gbmV3IGFwcC5DaGF0cm9vbUhlYWRlck1vZGVsKHsgbmFtZTogbmFtZSB9KTtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdjaGF0cm9vbScsIG5ld0hlYWRlcik7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRDaGF0bG9nXCIsIGZ1bmN0aW9uKGNoYXRsb2cpIHtcbiAgICB2YXIgb2xkQ2hhdGxvZyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoJ2NoYXRsb2cnKTtcbiAgICB2YXIgdXBkYXRlZENoYXRsb2cgPSBfLm1hcChjaGF0bG9nLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgICB2YXIgbmV3Q2hhdE1vZGVsID0gbmV3IGFwcC5DaGF0TW9kZWwoeyByb29tOiBjaGF0LnJvb20sIG1lc3NhZ2U6IGNoYXQubWVzc2FnZSwgc2VuZGVyOiBjaGF0LnNlbmRlciwgdGltZXN0YW1wOiBjaGF0LnRpbWVzdGFtcCB9KTtcbiAgICAgIHJldHVybiBuZXdDaGF0TW9kZWw7XG4gICAgfSk7XG4gICAgb2xkQ2hhdGxvZy5yZXNldCh1cGRhdGVkQ2hhdGxvZyk7XG4gICAgc2VsZi5kYXRlRGl2aWRlci5sb2FkKCQoXCIuZm9sbG93TWVCYXJcIikpO1xuICB9KTtcbiAgXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRDaGF0cm9vbXNcIiwgZnVuY3Rpb24oY2hhdHJvb21zKSB7XG4gICAgdmFyIG9sZENoYXRyb29tcyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoJ2NoYXRyb29tcycpO1xuICAgIHZhciB1cGRhdGVkQ2hhdHJvb21zID0gXy5tYXAoY2hhdHJvb21zLCBmdW5jdGlvbihjaGF0cm9vbSkge1xuICAgICAgdmFyIG5ld0NoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoeyBuYW1lOiBjaGF0cm9vbS5uYW1lLCBvbmxpbmVVc2VyczogY2hhdHJvb20ub25saW5lVXNlcnMgfSk7XG4gICAgICByZXR1cm4gbmV3Q2hhdHJvb21Nb2RlbDtcbiAgICB9KTtcbiAgICBvbGRDaGF0cm9vbXMucmVzZXQodXBkYXRlZENoYXRyb29tcyk7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRPbmxpbmVVc2Vyc1wiLCBmdW5jdGlvbihvbmxpbmVVc2Vycykge1xuICAgIHZhciBvbGRPbmxpbmVVc2VycyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoJ29ubGluZVVzZXJzJyk7XG4gICAgdmFyIHVwZGF0ZWRPbmxpbmVVc2VycyA9IF8ubWFwKG9ubGluZVVzZXJzLCBmdW5jdGlvbih1c2VyKSB7XG4gICAgICB2YXIgbmV3VXNlck1vZGVsID0gbmV3IGFwcC5Vc2VyTW9kZWwoe3VzZXJuYW1lOiB1c2VyLnVzZXJuYW1lfSk7XG4gICAgICByZXR1cm4gbmV3VXNlck1vZGVsO1xuICAgIH0pO1xuICAgIG9sZE9ubGluZVVzZXJzLnJlc2V0KHVwZGF0ZWRPbmxpbmVVc2Vycyk7XG4gIH0pO1xuXG5cbn07XG5cbiIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgJCh3aW5kb3cpLmJpbmQoJ2JlZm9yZXVubG9hZCcsIGZ1bmN0aW9uKGV2ZW50T2JqZWN0KSB7XG4gICAgJC5hamF4KHtcbiAgICAgICB1cmw6IFwiL2xvZ291dFwiLFxuICAgIH0pO1xuICB9KTtcblxuICB2YXIgQ2hhdHJvb21Sb3V0ZXIgPSBCYWNrYm9uZS5Sb3V0ZXIuZXh0ZW5kKHtcbiAgICBcbiAgICByb3V0ZXM6IHtcbiAgICAgICcnOiAnc3RhcnQnLFxuICAgICAgJ2xvZyc6ICdsb2dpbicsXG4gICAgICAncmVnJzogJ3JlZ2lzdGVyJyxcbiAgICAgICdsb2dvdXQnOiAnbG9nb3V0JyxcbiAgICAgICdhdXRoZW50aWNhdGVkJzogJ2F1dGhlbnRpY2F0ZWQnLFxuICAgICAgJ2ZhY2Vib29rJzogJ2ZhY2Vib29rJyxcbiAgICAgICd0d2l0dGVyJzogJ3R3aXR0ZXInXG4gICAgfSxcblxuICAgIHN0YXJ0OiBmdW5jdGlvbihjYWxsYmFjaykge1xuXG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIgPSBuZXcgYXBwLk1haW5Db250cm9sbGVyKCk7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIuaW5pdCgpO1xuICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgIHVybDogXCIvbG9nb3V0XCIsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBsb2dpbjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbG9naW5Nb2RlbCA9IG5ldyBhcHAuTG9naW5Nb2RlbCgpO1xuICAgICAgdmFyIGxvZ2luVmlldyA9IG5ldyBhcHAuTG9naW5WaWV3KHt2ZW50OiBhcHAubWFpbkNvbnRyb2xsZXIudmlld0V2ZW50QnVzLCBtb2RlbDogbG9naW5Nb2RlbH0pO1xuICAgICAgYXBwLm1haW5Db250cm9sbGVyLmNvbnRhaW5lck1vZGVsLnNldChcInZpZXdTdGF0ZVwiLCBsb2dpblZpZXcpO1xuICAgIH0sXG5cbiAgICByZWdpc3RlcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcmVnaXN0ZXJWaWV3ID0gbmV3IGFwcC5SZWdpc3RlclZpZXcoe3ZlbnQ6IGFwcC5tYWluQ29udHJvbGxlci52aWV3RXZlbnRCdXMgfSk7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIuY29udGFpbmVyTW9kZWwuc2V0KFwidmlld1N0YXRlXCIsIHJlZ2lzdGVyVmlldyk7XG4gICAgfSxcblxuICAgIC8vIGxvZ291dDogZnVuY3Rpb24oKSB7XG4gICAgLy8gICAvLyAkKCcjbG9nb3V0Jykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICAgICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAvLyAgICAgJC5hamF4KHtcbiAgICAvLyAgICAgICB1cmw6IFwiL2xvZ291dFwiLFxuICAgIC8vICAgICB9KS5kb25lKGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gICAgIH0pO1xuICAgIC8vICAgICAgIHRoaXNfLmxvZ2luKCk7XG4gICAgLy8gICAgICAgYXBwLm1haW5Db250cm9sbGVyLmxvZ291dCgpO1xuXG4gICAgLy8gICAvLyB9KTtcbiAgICAvLyB9LFxuXG4gICAgYXV0aGVudGljYXRlZDogZnVuY3Rpb24oKSB7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIuYXV0aGVudGljYXRlZCgpO1xuICAgIH0sXG4gICAgZmFjZWJvb2s6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5zdGFydCh0aGlzLmF1dGhlbnRpY2F0ZWQpO1xuICAgIH0sXG4gICAgdHdpdHRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnN0YXJ0KHRoaXMuYXV0aGVudGljYXRlZCk7XG4gICAgfSxcblxuICB9KTtcblxuICBhcHAuQ2hhdHJvb21Sb3V0ZXIgPSBuZXcgQ2hhdHJvb21Sb3V0ZXIoKTtcbiAgQmFja2JvbmUuaGlzdG9yeS5zdGFydCgpO1xuXG59KSgpOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==