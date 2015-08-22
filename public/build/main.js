
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
    template: _.template("<ul class='nav navbar-nav navbar-right'><% if (username) { %><li><a href='/'><i class='fa fa-power-off fa-2x'></i></a></li><% } else { %><li><a href='#log'>login</a></li><li><a href='#reg'>register</a></li><% } %></ul>"),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYXQuanMiLCJjaGF0cm9vbS1oZWFkZXIuanMiLCJjb250YWluZXIuanMiLCJsb2dpbi5qcyIsInVzZXIuanMiLCJjaGF0cm9vbS5qcyIsInJvb20uanMiLCJuYXZiYXIuanMiLCJyZWdpc3Rlci5qcyIsInNvY2tldGNsaWVudC5qcyIsIm1haW4uanMiLCJyb3V0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FKUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUlUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FEVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUgxTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUlsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3VUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuQ2hhdENvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG4gICAgbW9kZWw6IGFwcC5DaGF0TW9kZWxcbiAgfSk7XG5cbn0pKCk7IiwiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5DaGF0cm9vbUhlYWRlck1vZGVsID0gQmFja2JvbmUuTW9kZWwuZXh0ZW5kKHt9KTtcblxufSkoKTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuICBhcHAuQ29udGFpbmVyVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBlbDogJyN2aWV3LWNvbnRhaW5lcicsXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdGhpcy5tb2RlbC5vbihcImNoYW5nZTp2aWV3U3RhdGVcIiwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB2aWV3ID0gdGhpcy5tb2RlbC5nZXQoJ3ZpZXdTdGF0ZScpO1xuICAgICAgdGhpcy4kZWwuaHRtbCh2aWV3LnJlbmRlcigpLmVsKTtcbiAgICB9XG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5Mb2dpblZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2xvZ2luJykuaHRtbCgpKSxcbiAgICBldmVudHM6IHtcbiAgICAgICdzdWJtaXQnOiAnb25Mb2dpbicsXG4gICAgICAna2V5cHJlc3MnOiAnb25IaXRFbnRlcidcbiAgICB9LFxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAvLyBMb2dpblZpZXcgZ2V0cyBwYXNzZWQgdGhlIHZpZXdFdmVudEJ1cyB3aGVuIHRoZSBNYWluQ29udHJvbGxlciBpcyBpbml0aWFsaXplZFxuICAgICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xuXG4gICAgLy8gVGhpcyB0ZWxscyB0aGUgdmlldyB0byBsaXN0ZW4gdG8gYW4gZXZlbnQgb24gaXRzIG1vZGVsLFxuICAgIC8vIGlmIHRoZXJlJ3MgYW4gZXJyb3IsIHRoZSBjYWxsYmFjayAodGhpcy5yZW5kZXIpIGlzIGNhbGxlZCB3aXRoIHRoZSAgXG4gICAgLy8gdmlldyBhcyBjb250ZXh0XG4gICAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiY2hhbmdlOmVycm9yXCIsIHRoaXMucmVuZGVyLCB0aGlzKTtcbiAgICB9LFxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUodGhpcy5tb2RlbC50b0pTT04oKSkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBvbkxvZ2luOiBmdW5jdGlvbihlKSB7XG4gICAgICAvLyB0cmlnZ2VycyB0aGUgbG9naW4gZXZlbnQgYW5kIHBhc3NpbmcgdGhlIHVzZXJuYW1lIGRhdGEgdG8ganMvbWFpbi5qc1xuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAkLmFqYXgoe1xuICAgICAgICB1cmw6IFwiL2xvZ2luXCIsXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBkYXRhOiB7dXNlcm5hbWU6IHRoaXMuJCgnI3VzZXJuYW1lJykudmFsKCksIHBhc3N3b3JkOiB0aGlzLiQoJyNwYXNzd29yZCcpLnZhbCgpfSxcbiAgICAgICAgc3VjY2VzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICBjb25zb2xlLmxvZygnc3VjY2VzcyBkYXRhOiAnLCBkYXRhKTtcbiAgICAgICAgICAgaWYgKGRhdGEgPT09IDIwMCkge1xuICAgICAgICAgICAgIC8vIHRoaXNfLnZlbnQudHJpZ2dlcignYXV0aGVudGljYXRlZCcpO1xuICAgICAgICAgICAgYXBwLkNoYXRyb29tUm91dGVyLm5hdmlnYXRlKCdhdXRoZW50aWNhdGVkJywgeyB0cmlnZ2VyOiB0cnVlIH0pO1xuICAgICAgICB0aGlzXy52ZW50LnRyaWdnZXIoXCJsb2dpblwiLCB7dXNlcm5hbWU6IHRoaXNfLiQoJyN1c2VybmFtZScpLnZhbCgpLCBwYXNzd29yZDogdGhpc18uJCgnI3Bhc3N3b3JkJykudmFsKCl9KTtcbiAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KS5kb25lKGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnZG9uZWVlZWVlZWUnKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgLy8gb25IaXRFbnRlcjogZnVuY3Rpb24oZSkge1xuICAgIC8vICAgaWYoZS5rZXlDb2RlID09IDEzKSB7XG4gICAgLy8gICAgIHRoaXMub25Mb2dpbigpO1xuICAgIC8vICAgICByZXR1cm4gZmFsc2U7XG4gICAgLy8gICB9XG4gICAgLy8gfVxuICB9KTtcbiAgXG59KShqUXVlcnkpOyIsIlxudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuVXNlckNvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7bW9kZWw6IGFwcC5Vc2VyTW9kZWx9KTtcblxufSkoKTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuYXBwLkNoYXRyb29tVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2NoYXRyb29tLXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgY2hhdFRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNjaGF0Ym94LW1lc3NhZ2UtdGVtcGxhdGUnKS5odG1sKCkpLFxuICBuYW1lVGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2NoYXRyb29tLW5hbWUtdGVtcGxhdGUnKS5odG1sKCkpLFxuICBkYXRlVGVtcGxhdGU6IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJmb2xsb3dNZUJhciBjb2wteHMtMTIgY29sLXNtLTEyIGNvbC1tZC0xMlwiPjxzcGFuPi0tLS0tLS0tLS0tLS0tLS0tPC9zcGFuPjxzcGFuPiA8JT0gbW9tZW50KHRpbWVzdGFtcCkuZm9ybWF0KFwiZGRkZCwgTU1NTSBEbyBZWVlZXCIpICU+IDwvc3Bhbj48c3Bhbj4tLS0tLS0tLS0tLS0tLS0tLTwvc3Bhbj48L2Rpdj4nKSxcbiAgZXZlbnRzOiB7XG4gICAgJ2tleXByZXNzIC5tZXNzYWdlLWlucHV0JzogJ21lc3NhZ2VJbnB1dFByZXNzZWQnLFxuICAgICdjbGljayAuY2hhdC1kaXJlY3RvcnkgLnJvb20nOiAnc2V0Um9vbSdcbiAgfSxcbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIGNvbnNvbGUubG9nKCdjaGF0cm9vbVZpZXcuZi5pbml0aWFsaXplOiAnLCBvcHRpb25zKTtcbiAgICAvLyBwYXNzZWQgdGhlIHZpZXdFdmVudEJ1c1xuICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcbiAgfSxcbiAgaW5pdFJvb206IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMucmVuZGVyVXNlcnMoKTtcbiAgICB0aGlzLnJlbmRlckNoYXRzKCk7XG4gICAgdGhpcy5yZW5kZXJSb29tcygpO1xuICAgIHRoaXMucmVuZGVyTmFtZSgpO1xuICB9LFxuICByZW5kZXI6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlcicpO1xuICAgIHRoaXMubW9kZWwgPSBtb2RlbCB8fCB0aGlzLm1vZGVsO1xuICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzLm1vZGVsLnRvSlNPTigpKSk7XG4gICAgLy8gdGhpcy5zZXRDaGF0Q29sbGVjdGlvbigpO1xuICAgIHRoaXMuc2V0Q2hhdExpc3RlbmVycygpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICAvLyBzZXRDaGF0Q29sbGVjdGlvbjogZnVuY3Rpb24oKSB7XG4gIC8vICAgICB0aGlzLnVzZXJDaGF0cyA9IG5ldyBhcHAuQ2hhdENvbGxlY3Rpb24oW1xuICAvLyAgICAgICAvLyBtZXNzYWdlIGFuZCBzZW5kZXIgdXBvbiBlbnRlcmluZyBjaGF0cm9vbVxuICAvLyAgICAgICBuZXcgYXBwLkNoYXRNb2RlbCh7IHNlbmRlcjogJ0J1dHRlcnMnLCBtZXNzYWdlOiAnYXd3d3d3dyBoYW1idXJnZXJzLiB8fCk6fHwnLCB0aW1lc3RhbXA6IF8ubm93KCkgfSlcbiAgLy8gICAgIF0pO1xuICAvLyB9LFxuICBzZXRDaGF0TGlzdGVuZXJzOiBmdW5jdGlvbigpIHtcblxuICAgIC8vIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJnZXRDaGF0cm9vbU1vZGVsXCIsIHRoaXMuZ2V0Q2hhdHJvb21Nb2RlbCwgdGhpcyk7XG5cblxuICAgIHZhciBvbmxpbmVVc2VycyA9IHRoaXMubW9kZWwuZ2V0KCdvbmxpbmVVc2VycycpO1xuICAgIHRoaXMubGlzdGVuVG8ob25saW5lVXNlcnMsIFwiYWRkXCIsIHRoaXMucmVuZGVyVXNlciwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJyZW1vdmVcIiwgdGhpcy5yZW5kZXJVc2VycywgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJyZXNldFwiLCB0aGlzLnJlbmRlclVzZXJzLCB0aGlzKTtcblxuICAgIHZhciBjaGF0bG9nID0gdGhpcy5tb2RlbC5nZXQoJ2NoYXRsb2cnKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRsb2csIFwiYWRkXCIsIHRoaXMucmVuZGVyQ2hhdCwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhjaGF0bG9nLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlckNoYXRzLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRsb2csIFwicmVzZXRcIiwgdGhpcy5yZW5kZXJDaGF0cywgdGhpcyk7XG5cbiAgICB2YXIgY2hhdHJvb21zID0gdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tcycpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcImFkZFwiLCB0aGlzLnJlbmRlclJvb20sIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlclJvb21zLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRyb29tcywgXCJyZXNldFwiLCB0aGlzLnJlbmRlclJvb21zLCB0aGlzKTtcblxuICAgIC8vIHZhciBjaGF0cm9vbSA9IHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbScpO1xuICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJjaGFuZ2U6Y2hhdHJvb21cIiwgdGhpcy5yZW5kZXJOYW1lLCB0aGlzKTtcblxuICAgIC8vIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJjaGFuZ2U6Y2hhdHJvb21zXCIsIHRoaXMucmVuZGVyUm9vbXMsIHRoaXMpO1xuXG4gICAgLy8gdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImFkZDpvbmxpbmVVc2Vyc1wiLCB0aGlzLnJlbmRlclVzZXJzLCB0aGlzKTtcbiAgICAvLyB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiYWRkOmNoYXRsb2dcIiwgdGhpcy5yZW5kZXJDaGF0cywgdGhpcyk7XG4gICAgLy8gdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImFkZDpjaGF0cm9vbXNcIiwgdGhpcy5yZW5kZXJSb29tcywgdGhpcyk7XG5cbiAgICAvLyB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwicmVtb3ZlOm9ubGluZVVzZXJzXCIsIHRoaXMucmVuZGVyVXNlcnMsIHRoaXMpO1xuICAgIC8vIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJyZW1vdmU6Y2hhdGxvZ1wiLCB0aGlzLnJlbmRlckNoYXRzLCB0aGlzKTtcbiAgICAvLyB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwicmVtb3ZlOmNoYXRyb29tc1wiLCB0aGlzLnJlbmRlclJvb21zLCB0aGlzKTtcblxuICAgIC8vIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJyZXNldDpvbmxpbmVVc2Vyc1wiLCB0aGlzLnJlbmRlclVzZXJzLCB0aGlzKTtcbiAgICAvLyB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwicmVzZXQ6Y2hhdGxvZ1wiLCB0aGlzLnJlbmRlckNoYXRzLCB0aGlzKTtcbiAgICAvLyB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwicmVzZXQ6Y2hhdHJvb21zXCIsIHRoaXMucmVuZGVyUm9vbXMsIHRoaXMpO1xuXG4gICAgLy8gdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImdvcnBcIiwgdGhpcy5nb3JwLCB0aGlzKTtcbiAgICAvLyB0aGlzLm1vZGVsLm9uKCdnb3JwJywgZnVuY3Rpb24oY2hhdCkge1xuICAgIC8vICAgdGhpcy5nb3JwKGNoYXQpO1xuICAgIC8vIH0pO1xuXG4gIH0sXG5cblxuICAvLyBnb3JwOiBmdW5jdGlvbihjaGF0KSB7XG4gIC8vICAgY29uc29sZS5sb2coJ2Nydi5mLmdvcnAnKTtcbiAgLy8gICB2YXIgbm93ID0gXy5ub3coKTtcblxuICAvLyAgIHRoaXMudXNlckNoYXRzLmFkZChuZXcgYXBwLkNoYXRNb2RlbCh7IHNlbmRlcjogY2hhdC5zZW5kZXIsIG1lc3NhZ2U6IGNoYXQubWVzc2FnZSwgdGltZXN0YW1wOiBub3d9KSk7XG4gIC8vIH0sXG4gIGdldENoYXRyb29tTW9kZWw6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYuZ2V0Q2hhdHJvb21Nb2RlbCcpO1xuICAgIHRoaXMudmVudC50cmlnZ2VyKCdnZXRDaGF0cm9vbU1vZGVsJywgbmFtZSk7XG4gIH0sXG4gIC8vIHJlbmRlcnMgb24gZXZlbnRzLCBjYWxsZWQganVzdCBhYm92ZVxuICByZW5kZXJOYW1lOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLiQoJy5jaGF0Ym94LWhlYWRlcicpLmh0bWwodGhpcy5uYW1lVGVtcGxhdGUodGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tJykudG9KU09OKCkpKTtcbiAgfSxcbiAgcmVuZGVyVXNlcnM6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5yZW5kZXJVc2VycycpO1xuICAgIGNvbnNvbGUubG9nKCdVU0VSUzogJywgdGhpcy5tb2RlbC5nZXQoXCJvbmxpbmVVc2Vyc1wiKSk7XG4gICAgdGhpcy4kKCcub25saW5lLXVzZXJzJykuZW1wdHkoKTtcbiAgICB0aGlzLm1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpLmVhY2goZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgIHRoaXMucmVuZGVyVXNlcih1c2VyKTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyVXNlcjogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBfLnRlbXBsYXRlKCQoXCIjb25saW5lLXVzZXJzLWxpc3QtdGVtcGxhdGVcIikuaHRtbCgpKTtcbiAgICB0aGlzLiQoJy5vbmxpbmUtdXNlcnMnKS5hcHBlbmQodGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgfSxcbiAgcmVuZGVyQ2hhdHM6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5yZW5kZXJDaGF0cycpO1xuICAgIGNvbnNvbGUubG9nKCdDSEFUTE9HOiAnLCB0aGlzLm1vZGVsLmdldChcImNoYXRsb2dcIikpO1xuICAgIHRoaXMuJCgnLmNoYXRib3gtY29udGVudCcpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoJ2NoYXRsb2cnKS5lYWNoKGZ1bmN0aW9uKGNoYXQpIHtcbiAgICAgIHRoaXMucmVuZGVyQ2hhdChjaGF0KTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyQ2hhdDogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB0aGlzLnJlbmRlckRhdGVEaXZpZGVycyhtb2RlbCk7XG4gICAgdmFyIGNoYXRUZW1wbGF0ZSA9ICQodGhpcy5jaGF0VGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICBjaGF0VGVtcGxhdGUuYXBwZW5kVG8odGhpcy4kKCcuY2hhdGJveC1jb250ZW50JykpLmhpZGUoKS5mYWRlSW4oKS5zbGlkZURvd24oKTtcblxuICAgICQoJy5jaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuICAgIC8vIHRoaXMuJCgnLm5hbm8nKS5uYW5vU2Nyb2xsZXIoKTtcbiAgICAvLyB0aGlzLiQoJy5uYW5vJykubmFub1Njcm9sbGVyKHsgc2Nyb2xsOiAnYm90dG9tJyB9KTtcbiAgfSxcbiAgcmVuZGVyRGF0ZURpdmlkZXJzOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHRoaXMuY3VycmVudERhdGUgPSBtb21lbnQobW9kZWwuYXR0cmlidXRlcy50aW1lc3RhbXApLmZvcm1hdCgnZGRkZCwgTU1NTSBEbyBZWVlZJyk7XG4gICAgaWYgKCB0aGlzLmN1cnJlbnREYXRlICE9PSB0aGlzLnByZXZpb3VzRGF0ZSApIHtcbiAgICAgIHZhciBjdXJyZW50RGF0ZSA9ICQodGhpcy5kYXRlVGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICAgIGN1cnJlbnREYXRlLmFwcGVuZFRvKHRoaXMuJCgnLmNoYXRib3gtY29udGVudCcpKS5oaWRlKCkuZmFkZUluKCkuc2xpZGVEb3duKCk7XG4gICAgICB0aGlzLnByZXZpb3VzRGF0ZSA9IHRoaXMuY3VycmVudERhdGU7XG4gICAgfVxuICB9LFxuXG5cbiAgLy8gcmVuZGVycyBvbiBldmVudHMsIGNhbGxlZCBqdXN0IGFib3ZlXG4gIHJlbmRlclJvb21zOiBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYucmVuZGVyUm9vbXMnKTtcbiAgICBjb25zb2xlLmxvZygnQ0hBVFJPT01TOiAnLCB0aGlzLm1vZGVsLmdldChcImNoYXRyb29tc1wiKSk7XG4gICAgdGhpcy4kKCcucHVibGljLXJvb21zLWNvbnRhaW5lcicpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tcycpLmVhY2goZnVuY3Rpb24gKHJvb20pIHtcbiAgICAgIHRoaXMucmVuZGVyUm9vbShyb29tKTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyUm9vbTogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBfLnRlbXBsYXRlKCQoXCIjcm9vbS1saXN0LXRlbXBsYXRlXCIpLmh0bWwoKSk7XG4gICAgdGhpcy4kKCcucHVibGljLXJvb21zLWNvbnRhaW5lcicpLmFwcGVuZCh0ZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICB9LFxuXG4gIGpvaW5Sb29tOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLmpvaW5Sb29tJyk7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoJ2pvaW5Sb29tJywgbmFtZSk7XG4gICAgLy8gdmFyIG1vZGVsID0gdGhpcy5jb2xsZWN0aW9uLmZpbmRXaGVyZSh7bmFtZTogbmFtZX0pO1xuICAgIC8vIHRoaXMuZ2V0Q2hhdENvbGxlY3Rpb24obmFtZSk7XG4gICAgLy8gdGhpcy5yZW5kZXIobW9kZWwpO1xuICB9LFxuXG5cbiAgLy9ldmVudHNcbiAgbWVzc2FnZUlucHV0UHJlc3NlZDogZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzICYmICQudHJpbSgkKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgpKS5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBmdW4gZmFjdDogc2VwYXJhdGUgZXZlbnRzIHdpdGggYSBzcGFjZSBpbiB0cmlnZ2VyJ3MgZmlyc3QgYXJnIGFuZCB5b3VcbiAgICAgIC8vIGNhbiB0cmlnZ2VyIG11bHRpcGxlIGV2ZW50cy5cbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiY2hhdFwiLCB0aGlzLiQoJy5tZXNzYWdlLWlucHV0JykudmFsKCkpO1xuICAgICAgdGhpcy4kKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgnJyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwidHlwaW5nXCIpO1xuICAgICAgY29uc29sZS5sb2coJ3d1dCcpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgc2V0Um9vbTogZnVuY3Rpb24oZSkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5zZXRSb29tJyk7XG4gICAgdmFyICR0YXIgPSAkKGUudGFyZ2V0KTtcbiAgICBpZiAoJHRhci5pcygncCcpKSB7XG4gICAgICB0aGlzLmpvaW5Sb29tKCR0YXIuZGF0YSgncm9vbScpKTtcbiAgICB9XG4gIH1cblxuXG5cblxufSk7XG5cbn0pKGpRdWVyeSk7IiwiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5DaGF0cm9vbUxpc3QgPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG4gICAgbW9kZWw6IGFwcC5DaGF0cm9vbU1vZGVsLFxuICAgIHVybDogJy9hcGkvY2hhdHJvb21zJyxcbiAgfSk7XG5cbn0pKCk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbiAgYXBwLk5hdmJhclZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgZWw6ICcubG9naW4tbWVudScsXG4gICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoXCI8dWwgY2xhc3M9J25hdiBuYXZiYXItbmF2IG5hdmJhci1yaWdodCc+PCUgaWYgKHVzZXJuYW1lKSB7ICU+PGxpPjxhIGhyZWY9Jy8nPjxpIGNsYXNzPSdmYSBmYS1wb3dlci1vZmYgZmEtMngnPjwvaT48L2E+PC9saT48JSB9IGVsc2UgeyAlPjxsaT48YSBocmVmPScjbG9nJz5sb2dpbjwvYT48L2xpPjxsaT48YSBocmVmPScjcmVnJz5yZWdpc3RlcjwvYT48L2xpPjwlIH0gJT48L3VsPlwiKSxcbiAgICBldmVudHM6IHtcbiAgICAgIFxuICAgIH0sXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLm1vZGVsID0gbmV3IGFwcC5Vc2VyTW9kZWwoeyB1c2VybmFtZTogJycgfSk7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImNoYW5nZVwiLCB0aGlzLnJlbmRlciwgdGhpcyk7XG4gICAgfSxcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKHRoaXMubW9kZWwudG9KU09OKCkpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cblxuICB9KTtcblxufSkoalF1ZXJ5KTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuICBhcHAuUmVnaXN0ZXJWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIHRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNyZWdpc3RlcicpLmh0bWwoKSksXG4gICAgZXZlbnRzOiB7XG4gICAgICBcImNsaWNrICNzaWduVXBCdG5cIjogXCJzaWduVXBcIlxuICAgIH0sXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9LFxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUoKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNpZ25VcDogZnVuY3Rpb24oKSB7XG4gICAgfVxuICB9KTtcblxufSkoalF1ZXJ5KTsiLCJcbi8vIFRoZSBDaGF0Q2xpZW50IGlzIGltcGxlbWVudGVkIG9uIG1haW4uanMuXG4vLyBUaGUgY2hhdGNsaWVudCBpcyBhIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIG9uIHRoZSBNYWluQ29udHJvbGxlci5cbi8vIEl0IGJvdGggbGlzdGVucyB0byBhbmQgZW1pdHMgZXZlbnRzIG9uIHRoZSBzb2NrZXQsIGVnOlxuLy8gSXQgaGFzIGl0cyBvd24gbWV0aG9kcyB0aGF0LCB3aGVuIGNhbGxlZCwgZW1pdCB0byB0aGUgc29ja2V0IHcvIGRhdGEuXG4vLyBJdCBhbHNvIHNldHMgcmVzcG9uc2UgbGlzdGVuZXJzIG9uIGNvbm5lY3Rpb24sIHRoZXNlIHJlc3BvbnNlIGxpc3RlbmVyc1xuLy8gbGlzdGVuIHRvIHRoZSBzb2NrZXQgYW5kIHRyaWdnZXIgZXZlbnRzIG9uIHRoZSBhcHBFdmVudEJ1cyBvbiB0aGUgXG4vLyBNYWluQ29udHJvbGxlclxudmFyIENoYXRDbGllbnQgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdC8vIGlzLXR5cGluZyBoZWxwZXIgdmFyaWFibGVzXG5cdHZhciBUWVBJTkdfVElNRVJfTEVOR1RIID0gNDAwOyAvLyBtc1xuICB2YXIgdHlwaW5nID0gZmFsc2U7XG4gIHZhciBsYXN0VHlwaW5nVGltZTtcbiAgXG4gIC8vIHRoaXMgdmVudCBob2xkcyB0aGUgYXBwRXZlbnRCdXNcblx0c2VsZi52ZW50ID0gb3B0aW9ucy52ZW50O1xuXG5cdHNlbGYuaG9zdG5hbWUgPSAnaHR0cDovLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdDtcblxuICAvLyBjb25uZWN0cyB0byBzb2NrZXQsIHNldHMgcmVzcG9uc2UgbGlzdGVuZXJzXG5cdHNlbGYuY29ubmVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmNvbm5lY3QnKTtcblx0XHQvLyB0aGlzIGlvIG1pZ2h0IGJlIGEgbGl0dGxlIGNvbmZ1c2luZy4uLiB3aGVyZSBpcyBpdCBjb21pbmcgZnJvbT9cblx0XHQvLyBpdCdzIGNvbWluZyBmcm9tIHRoZSBzdGF0aWMgbWlkZGxld2FyZSBvbiBzZXJ2ZXIuanMgYmMgZXZlcnl0aGluZ1xuXHRcdC8vIGluIHRoZSAvcHVibGljIGZvbGRlciBoYXMgYmVlbiBhdHRhY2hlZCB0byB0aGUgc2VydmVyLCBhbmQgdmlzYVxuXHRcdC8vIHZlcnNhLlxuXHRcdHNlbGYuc29ja2V0ID0gaW8uY29ubmVjdChzZWxmLmhvc3RuYW1lKTtcbiAgICBzZWxmLnNldFJlc3BvbnNlTGlzdGVuZXJzKHNlbGYuc29ja2V0KTtcbiAgfTtcblxuICBzZWxmLmNvbm5lY3RUb1Jvb20gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuY29ubmVjdFRvUm9vbTogJywgbmFtZSk7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcImNvbm5lY3RUb1Jvb21cIiwgbmFtZSk7XG4gIH07XG5cbiAgc2VsZi5nZXRDaGF0cm9vbU1vZGVsID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmdldENoYXRyb29tTW9kZWw6ICcsIG5hbWUpO1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJnZXRDaGF0cm9vbU1vZGVsXCIsIG5hbWUpO1xuICB9O1xuXG5cblxuLy8vLy8gVmlld0V2ZW50QnVzIG1ldGhvZHMgLy8vL1xuICAgIC8vIG1ldGhvZHMgdGhhdCBlbWl0IHRvIHRoZSBjaGF0c2VydmVyXG4gIHNlbGYubG9naW4gPSBmdW5jdGlvbih1c2VyKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYubG9naW46ICcsIHVzZXIpO1xuXHRcdHNlbGYuc29ja2V0LmVtaXQoXCJsb2dpblwiLCB1c2VyKTtcblx0fTtcbiAgLy8gc2VsZi5sb2dvdXQgPSBmdW5jdGlvbigpIHtcbiAgLy8gICBzZWxmLnNvY2tldC5lbWl0KFwid3V0XCIpO1xuICAvLyB9O1xuXG5cblxuICBzZWxmLmNoYXQgPSBmdW5jdGlvbihjaGF0KSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuY2hhdDogJywgY2hhdCk7XG5cdFx0c2VsZi5zb2NrZXQuZW1pdChcImNoYXRcIiwgY2hhdCk7XG5cdH07XG5cblxuICAvLyBUeXBpbmcgbWV0aG9kc1xuXHRzZWxmLmFkZENoYXRUeXBpbmcgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIG1lc3NhZ2UgPSBkYXRhLnVzZXJuYW1lICsgJyBpcyB0eXBpbmcnO1xuICAgICQoJy50eXBldHlwZXR5cGUnKS50ZXh0KG1lc3NhZ2UpO1xuXHR9O1xuXHRzZWxmLnJlbW92ZUNoYXRUeXBpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAkKCcudHlwZXR5cGV0eXBlJykuZW1wdHkoKTtcblx0fTtcbiAgc2VsZi51cGRhdGVUeXBpbmcgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoc2VsZi5zb2NrZXQpIHtcbiAgICAgIGlmICghdHlwaW5nKSB7XG4gICAgICAgIHR5cGluZyA9IHRydWU7XG4gICAgICAgIHNlbGYuc29ja2V0LmVtaXQoJ3R5cGluZycpO1xuICAgICAgfVxuICAgICAgbGFzdFR5cGluZ1RpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHR5cGluZ1RpbWVyID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgICAgICAgdmFyIHRpbWVEaWZmID0gdHlwaW5nVGltZXIgLSBsYXN0VHlwaW5nVGltZTtcbiAgICAgICAgaWYgKHRpbWVEaWZmID49IFRZUElOR19USU1FUl9MRU5HVEggJiYgdHlwaW5nKSB7XG4gICAgICAgICAgIHNlbGYuc29ja2V0LmVtaXQoJ3N0b3AgdHlwaW5nJyk7XG4gICAgICAgICAgIHR5cGluZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9LCBUWVBJTkdfVElNRVJfTEVOR1RIKTtcbiAgICB9XG4gIH07XG5cblxuICAvLyBqb2luIHJvb21cbiAgc2VsZi5qb2luUm9vbSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KCdqb2luUm9vbScsIG5hbWUpO1xuICB9O1xuXG4gIC8vIHNldCByb29tXG4gIHNlbGYuc2V0Um9vbSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBpZiAobmFtZSAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5jdXJyZW50Um9vbSA9IG5hbWU7XG4gICAgfVxuICAgIC8vLz4+Pj4+Pj4gY2hhbmdldGhpc3RvIC5jaGF0LXRpdGxlXG4gICAgdmFyICRjaGF0VGl0bGUgPSAkKCcuY2hhdGJveC1oZWFkZXItdXNlcm5hbWUnKTtcbiAgICAkY2hhdFRpdGxlLnRleHQobmFtZSk7XG4gICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAkKCcuY2hhdC1kaXJlY3RvcnknKS5maW5kKCcucm9vbScpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgJHJvb20gPSAkKHRoaXMpO1xuICAgICAgJHJvb20ucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgaWYgKCRyb29tLmRhdGEoJ25hbWUnKSA9PT0gdGhpc18uY3VycmVudFJvb20pIHtcbiAgICAgICAgJHJvb20uYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuICBcblxuXG5cbiAgLy8vLy8vLy8vLy8vLy8gY2hhdHNlcnZlciBsaXN0ZW5lcnMvLy8vLy8vLy8vLy8vXG5cbiAgLy8gdGhlc2UgZ3V5cyBsaXN0ZW4gdG8gdGhlIGNoYXRzZXJ2ZXIvc29ja2V0IGFuZCBlbWl0IGRhdGEgdG8gbWFpbi5qcyxcbiAgLy8gc3BlY2lmaWNhbGx5IHRvIHRoZSBhcHBFdmVudEJ1cy5cblx0c2VsZi5zZXRSZXNwb25zZUxpc3RlbmVycyA9IGZ1bmN0aW9uKHNvY2tldCkge1xuXHRcdHNvY2tldC5vbignd2VsY29tZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIC8vIGVtaXRzIGV2ZW50IHRvIHJlY2FsaWJyYXRlIG9ubGluZVVzZXJzIGNvbGxlY3Rpb25cbiAgICAgIC8vIHNvY2tldC5lbWl0KFwiZ2V0T25saW5lVXNlcnNcIik7XG4gICAgICAvLyBzb2NrZXQuZW1pdChcInJvb21zXCIpO1xuICAgICAgLy8gZGF0YSBpcyB1bmRlZmluZWQgYXQgdGhpcyBwb2ludCBiZWNhdXNlIGl0J3MgdGhlIGZpcnN0IHRvXG4gICAgICAvLyBmaXJlIG9mZiBhbiBldmVudCBjaGFpbiB0aGF0IHdpbGwgYXBwZW5kIHRoZSBuZXcgdXNlciB0byBcbiAgICAgIC8vIHRoZSBvbmxpbmVVc2VyIGNvbGxlY3Rpb25cbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwibG9naW5Eb25lXCIsIGRhdGEpO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKCdsb2dpbicsIGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcignbG9naW5Vc2VyJywgdXNlcm5hbWUpO1xuICAgIH0pO1xuXG5cbiAgICBzb2NrZXQub24oJ2xvZycsIGZ1bmN0aW9uKCkge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUubG9nJyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcignYXV0aGVudGljYXRlZCcpO1xuICAgIH0pO1xuXG5cdFx0c29ja2V0Lm9uKCd1c2Vyc0luZm8nLCBmdW5jdGlvbih1c2Vycykge1xuXHRcdFx0Y29uc29sZS5sb2coJ3NjLmUudXNlcnNJbmZvOiAnLCB1c2Vycyk7XG5cdFx0XHRzZWxmLnZlbnQudHJpZ2dlcihcInVzZXJzSW5mb1wiLCB1c2Vycyk7XG5cdFx0fSk7XG5cbiAgICBzb2NrZXQub24oJ3Jvb21zJywgZnVuY3Rpb24oY2hhdHJvb21zKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5yb29tczogJywgY2hhdHJvb21zKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwicm9vbUluZm9cIiwgY2hhdHJvb21zKTtcbiAgICB9KTtcblxuXG5cblx0XHRzb2NrZXQub24oJ3VzZXJKb2luZWQnLCBmdW5jdGlvbih1c2VybmFtZSkge1xuXHRcdFx0Y29uc29sZS5sb2coJ3NjLmUudXNlckpvaW5lZDogJywgdXNlcm5hbWUpO1xuICAgICAgLy8gc29ja2V0LmVtaXQoXCJvbmxpbmVVc2Vyc1wiKTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwidXNlckpvaW5lZFwiLCB1c2VybmFtZSk7XG5cdFx0fSk7XG5cdFx0c29ja2V0Lm9uKCd1c2VyTGVmdCcsIGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnc2MuZS51c2VyTGVmdDogJywgdXNlcm5hbWUpO1xuICAgICAgLy8gc29ja2V0LmVtaXQoXCJvbmxpbmVVc2Vyc1wiKTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwidXNlckxlZnRcIiwgdXNlcm5hbWUpO1xuXHRcdH0pO1xuXG5cblxuXHRcdHNvY2tldC5vbignY2hhdCcsIGZ1bmN0aW9uKGNoYXQpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdzYy5lLmNoYXQ6ICcsIGNoYXQpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJjaGF0UmVjZWl2ZWRcIiwgY2hhdCk7XG5cdFx0fSk7XG4gICAgc29ja2V0Lm9uKCdzZXRSb29tJywgZnVuY3Rpb24obmFtZSkge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUuc2V0Um9vbTogJywgbmFtZSk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldFJvb21cIiwgbmFtZSk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdjaGF0bG9nJywgZnVuY3Rpb24oY2hhdGxvZykge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUuY2hhdGxvZzogJywgY2hhdGxvZyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldENoYXRsb2dcIiwgY2hhdGxvZyk7XG4gICAgfSk7XG4gICAgLy8gc29ja2V0Lm9uKCdDaGF0cm9vbU1vZGVsJywgZnVuY3Rpb24obW9kZWwpIHtcbiAgICAvLyAgIC8vIHNlbGYudmVudC50cmlnZ2VyKFwiQ2hhdHJvb21Nb2RlbFwiLCBtb2RlbCk7XG4gICAgLy8gICBzZWxmLnZlbnQudHJpZ2dlcihcInNldFJvb21cIiwgbW9kZWwpO1xuICAgIC8vIH0pO1xuICAgIHNvY2tldC5vbignY2hhdHJvb21zJywgZnVuY3Rpb24oY2hhdHJvb21zKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5jaGF0cm9vbXM6ICAnLCBjaGF0cm9vbXMpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRDaGF0cm9vbXNcIiwgY2hhdHJvb21zKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ29ubGluZVVzZXJzJywgZnVuY3Rpb24ob25saW5lVXNlcnMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLm9ubGluZVVzZXJzOiAnLCBvbmxpbmVVc2Vycyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldE9ubGluZVVzZXJzXCIsIG9ubGluZVVzZXJzKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ2NoYXRyb29tTmFtZScsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLmNoYXRyb29tTmFtZTogJywgbmFtZSk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldENoYXRyb29tTmFtZVwiLCBuYW1lKTtcbiAgICB9KTtcblxuXG5cbiAgICBzb2NrZXQub24oJ3R5cGluZycsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHNlbGYuYWRkQ2hhdFR5cGluZyhkYXRhKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ3N0b3AgdHlwaW5nJywgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnJlbW92ZUNoYXRUeXBpbmcoKTtcbiAgICB9KTtcblxuXG5cdH07XG59OyIsIlxuXG5hcHAuTWFpbkNvbnRyb2xsZXIgPSBmdW5jdGlvbigpIHtcblxuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblxuICAvL1RoZXNlIGFsbG93cyB1cyB0byBiaW5kIGFuZCB0cmlnZ2VyIG9uIHRoZSBvYmplY3QgZnJvbSBhbnl3aGVyZSBpbiB0aGUgYXBwLlxuXHRzZWxmLmFwcEV2ZW50QnVzID0gXy5leHRlbmQoe30sIEJhY2tib25lLkV2ZW50cyk7XG5cdHNlbGYudmlld0V2ZW50QnVzID0gXy5leHRlbmQoe30sIEJhY2tib25lLkV2ZW50cyk7XG5cblx0c2VsZi5pbml0ID0gZnVuY3Rpb24oKSB7XG5cbiAgICAvLyBsb2dpbk1vZGVsXG4gICAgc2VsZi5sb2dpbk1vZGVsID0gbmV3IGFwcC5Mb2dpbk1vZGVsKCk7XG4gICAgc2VsZi5sb2dpblZpZXcgPSBuZXcgYXBwLkxvZ2luVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXMsIG1vZGVsOiBzZWxmLmxvZ2luTW9kZWx9KTtcbiAgICBzZWxmLnJlZ2lzdGVyVmlldyA9IG5ldyBhcHAuUmVnaXN0ZXJWaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cyB9KTtcbiAgICBzZWxmLm5hdmJhclZpZXcgPSBuZXcgYXBwLk5hdmJhclZpZXcoKTtcblxuICAgIC8vIFRoZSBDb250YWluZXJNb2RlbCBnZXRzIHBhc3NlZCBhIHZpZXdTdGF0ZSwgTG9naW5WaWV3LCB3aGljaFxuICAgIC8vIGlzIHRoZSBsb2dpbiBwYWdlLiBUaGF0IExvZ2luVmlldyBnZXRzIHBhc3NlZCB0aGUgdmlld0V2ZW50QnVzXG4gICAgLy8gYW5kIHRoZSBMb2dpbk1vZGVsLlxuICAgIHNlbGYuY29udGFpbmVyTW9kZWwgPSBuZXcgYXBwLkNvbnRhaW5lck1vZGVsKHsgdmlld1N0YXRlOiBzZWxmLmxvZ2luVmlld30pO1xuXG4gICAgLy8gbmV4dCwgYSBuZXcgQ29udGFpbmVyVmlldyBpcyBpbnRpYWxpemVkIHdpdGggdGhlIG5ld2x5IGNyZWF0ZWQgY29udGFpbmVyTW9kZWxcbiAgICAvLyB0aGUgbG9naW4gcGFnZSBpcyB0aGVuIHJlbmRlcmVkLlxuICAgIHNlbGYuY29udGFpbmVyVmlldyA9IG5ldyBhcHAuQ29udGFpbmVyVmlldyh7IG1vZGVsOiBzZWxmLmNvbnRhaW5lck1vZGVsIH0pO1xuICAgIHNlbGYuY29udGFpbmVyVmlldy5yZW5kZXIoKTtcblxuICB9O1xuXG5cbiAgc2VsZi5hdXRoZW50aWNhdGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgXG4gICAgJChcImJvZHlcIikuY3NzKFwib3ZlcmZsb3dcIiwgXCJoaWRkZW5cIik7XG4gICAgc2VsZi5jaGF0Q2xpZW50ID0gbmV3IENoYXRDbGllbnQoeyB2ZW50OiBzZWxmLmFwcEV2ZW50QnVzIH0pO1xuICAgIHNlbGYuY2hhdENsaWVudC5jb25uZWN0KCk7XG5cbiAgICAvLyBuZXcgbW9kZWwgYW5kIHZpZXcgY3JlYXRlZCBmb3IgY2hhdHJvb21cbiAgICBzZWxmLmNoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoeyBuYW1lOiAnRE9PJyB9KTtcbiAgICBzZWxmLmNoYXRyb29tTGlzdCA9IG5ldyBhcHAuQ2hhdHJvb21MaXN0KCk7XG4gICAgc2VsZi5jaGF0cm9vbUxpc3QuZmV0Y2goKS5kb25lKGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnY2hhdHJvb21zJywgc2VsZi5jaGF0cm9vbUxpc3QpO1xuICAgICAgc2VsZi5jaGF0cm9vbVZpZXcgID0gbmV3IGFwcC5DaGF0cm9vbVZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzLCBtb2RlbDogc2VsZi5jaGF0cm9vbU1vZGVsIH0pO1xuICAgICAgc2VsZi5jb250YWluZXJNb2RlbC5zZXQoJ3ZpZXdTdGF0ZScsIHNlbGYuY2hhdHJvb21WaWV3KTtcblxuICAgICAgYXV0b3NpemUoJCgndGV4dGFyZWEubWVzc2FnZS1pbnB1dCcpKTtcbiAgICAgICQoJy5jaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuICAgICAgIFxuICAgICAgY29uc29sZS5sb2coJ2F1dGhlbnQnKTtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgc2VsZi5jaGF0Q2xpZW50LmNvbm5lY3RUb1Jvb20oXCJET09cIik7XG4gICAgICB9LCAxNTAwKTtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgc2VsZi5jaGF0cm9vbVZpZXcuaW5pdFJvb20oKTtcbiAgICAgIH0sIDIwMDApO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICBzZWxmLmRhdGVEaXZpZGVyLmxvYWQoJChcIi5mb2xsb3dNZUJhclwiKSk7XG4gICAgICB9LCAyMDAxKTtcbiAgICB9KTtcblxuICB9O1xuXG4gIC8vIHNlbGYubG9nb3V0ID0gZnVuY3Rpb24oKSB7XG4gIC8vICAgc2VsZi5jaGF0Q2xpZW50LmxvZ291dCgpO1xuICAvLyAgIHNlbGYubmF2YmFyVmlldyA9IG5ldyBhcHAuTmF2YmFyVmlldygpO1xuICAvLyB9O1xuXG4gIHNlbGYuZGF0ZURpdmlkZXIgPSAoZnVuY3Rpb24oKSB7XG5cbiAgdmFyICR3aW5kb3cgPSAkKHdpbmRvdyksXG4gICAgICAkc3RpY2tpZXM7XG5cbiAgbG9hZCA9IGZ1bmN0aW9uKHN0aWNraWVzKSB7XG5cbiAgICAgIFxuICAgIGNvbnNvbGUubG9nKCdnb2QgZGFtbiBpdCcpO1xuICAgICAgJHN0aWNraWVzID0gc3RpY2tpZXMuZWFjaChmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgJHRoaXNTdGlja3kgPSAkKHRoaXMpLndyYXAoJzxkaXYgY2xhc3M9XCJmb2xsb3dXcmFwIHJvd1wiIC8+Jyk7XG4gIFxuICAgICAgICAkdGhpc1N0aWNreVxuICAgICAgICAgICAgLmRhdGEoJ29yaWdpbmFsUG9zaXRpb24nLCAkdGhpc1N0aWNreS5vZmZzZXQoKS50b3ApXG4gICAgICAgICAgICAuZGF0YSgnb3JpZ2luYWxIZWlnaHQnLCAkdGhpc1N0aWNreS5vdXRlckhlaWdodCgpKVxuICAgICAgICAgICAgICAucGFyZW50KClcbiAgICAgICAgICAgICAgLmhlaWdodCgkdGhpc1N0aWNreS5vdXRlckhlaWdodCgpKTtcbiAgICAgICAgY29uc29sZS5sb2coJ3RoaXNzdGlja3kub3JpZ2luYWxwb3NpdGlvbicsICR0aGlzU3RpY2t5Lm9mZnNldCgpLnRvcCk7XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgJCgnLmNoYXRib3gtY29udGVudCcpLnNjcm9sbChzY3JvbGxTdGlja2llc0luaXQpO1xuXG4gIH07XG5cblxuICBzY3JvbGxTdGlja2llc0luaXQgPSBmdW5jdGlvbigpIHtcbiAgICAkKHRoaXMpLm9mZihcInNjcm9sbC5zdGlja2llc1wiKTtcbiAgICAkKHRoaXMpLm9uKFwic2Nyb2xsLnN0aWNraWVzXCIsIF8uZGVib3VuY2UoX3doZW5TY3JvbGxpbmcsIDUwKSk7XG4gIH07XG5cblxuICBfd2hlblNjcm9sbGluZyA9IGZ1bmN0aW9uKCkge1xuXG4gICAgJHN0aWNraWVzLmVhY2goZnVuY3Rpb24oaSwgc3RpY2t5KSB7XG5cbiAgICAgIHZhciAkdGhpc1N0aWNreSA9ICQoc3RpY2t5KSxcbiAgICAgICAgICAkdGhpc1N0aWNreVRvcCA9ICR0aGlzU3RpY2t5Lm9mZnNldCgpLnRvcCxcblxuICAgICAgICAgICRwcmV2U3RpY2t5ID0gJHN0aWNraWVzLmVxKGkgLSAxKSxcbiAgICAgICAgICAkcHJldlN0aWNreVRvcCA9ICRwcmV2U3RpY2t5Lm9mZnNldCgpLnRvcCxcbiAgICAgICAgICAkcHJldlN0aWNreVBvc2l0aW9uID0gJHByZXZTdGlja3kuZGF0YSgnb3JpZ2luYWxQb3NpdGlvbicpO1xuXG5cbiAgICAgIGlmICgkdGhpc1N0aWNreVRvcCA+PSAxODAgJiYgJHRoaXNTdGlja3lUb3AgPD0gMjEwKSB7XG5cbiAgICAgICAgdmFyICRuZXh0U3RpY2t5ID0gJHN0aWNraWVzLmVxKGkgKyAxKSB8fCBudWxsLFxuXG4gICAgICAgICR0aGlzU3RpY2t5UG9zaXRpb24gPSAkdGhpc1N0aWNreS5kYXRhKCdvcmlnaW5hbFBvc2l0aW9uJyksXG4gICAgICAgICR0aGlzQW5kUHJldlN0aWNreURpZmZlcmVuY2UgPSBNYXRoLmFicygkcHJldlN0aWNreVBvc2l0aW9uIC0gJHRoaXNTdGlja3lQb3NpdGlvbik7XG5cbiAgICAgICAgJHRoaXNTdGlja3kuYWRkQ2xhc3MoXCJmaXhlZFwiKTtcblxuICAgICAgICAvLyB2YXIgJG5leHRTdGlja3lQb3NpdGlvbiA9ICRuZXh0U3RpY2t5LmRhdGEoJ29yaWdpbmFsUG9zaXRpb24nKTtcbiAgICAgICAgLy8gdmFyICR0aGlzQW5kTmV4dFN0aWNreURpZmZlcmVuY2UgPSBNYXRoLmFicygkdGhpc1N0aWNreVBvc2l0aW9uIC0gJG5leHRTdGlja3lQb3NpdGlvbik7XG4gICAgICAgIC8vIHZhciAkbmV4dFN0aWNreVRvcCA9ICRuZXh0U3RpY2t5Lm9mZnNldCgpLnRvcDtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJy0tLS0tLS0tLS0tLS0nKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3ByZXZzdGlja3lvcmlnaW5wb3NpdGlvbicsICRwcmV2U3RpY2t5UG9zaXRpb24pO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygncHJldnN0aWNreXRvcCcsICRwcmV2U3RpY2t5VG9wKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJyR0aGlzQW5kUHJldlN0aWNreURpZmZlcmVuY2UnLCAkdGhpc0FuZFByZXZTdGlja3lEaWZmZXJlbmNlKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3RoaXNTdGlja3lUb3AnLCAkdGhpc1N0aWNreVRvcCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCckdGhpc0FuZE5leHRTdGlja3lEaWZmZXJlbmNlJywgJHRoaXNBbmROZXh0U3RpY2t5RGlmZmVyZW5jZSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCduZXh0U3RpY2t5VG9wJywgJG5leHRTdGlja3lUb3ApO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnbmV4dHN0aWNreW9yaWdpbnBvc2l0aW9uJywgJG5leHRTdGlja3lQb3NpdGlvbik7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdwcmV2JywgJHByZXZTdGlja3kpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygndGhpcycsICR0aGlzU3RpY2t5KTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ25leHQnLCAkbmV4dFN0aWNreSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCduZXh0c3RpY2t5dG9wJywgJG5leHRTdGlja3lUb3ApO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLScpO1xuICAgICAgICBcblxuICAgICAgLy9zY3JvbGxpbmcgdXBcbiAgICAgICAgIGlmICgkbmV4dFN0aWNreS5oYXNDbGFzcyhcImZpeGVkXCIpKSB7XG4gICAgICAgICAgICRuZXh0U3RpY2t5LnJlbW92ZUNsYXNzKFwiZml4ZWRcIik7XG4gICAgICAgICB9XG5cbiAgICAgIC8vIHNjcm9sbGluZyB1cCBhbmQgc3RpY2tpbmcgdG8gcHJvcGVyIHBvc2l0aW9uXG4gICAgICAgICBpZiAoJHByZXZTdGlja3lUb3AgKyAkdGhpc0FuZFByZXZTdGlja3lEaWZmZXJlbmNlID4gMjA1ICYmIGkgIT09IDApIHtcblxuICAgICAgICAgICAgJG5leHRTdGlja3kucmVtb3ZlQ2xhc3MoXCJmaXhlZFwiKTtcbiAgICAgICAgICAgICRwcmV2U3RpY2t5LmFkZENsYXNzKFwiZml4ZWRcIik7XG4gICAgICAgICB9XG5cbiAgICAgIC8vIHNjcm9sbGluZyBkb3duXG4gICAgICAgIGlmICgkcHJldlN0aWNreVRvcCA+PSAyMDUgJiYgJHByZXZTdGlja3kuaGFzQ2xhc3MoXCJmaXhlZFwiKSAmJiBpICE9PSAwKSB7XG4gICAgICAgICAgICRwcmV2U3RpY2t5LnJlbW92ZUNsYXNzKFwiZml4ZWRcIik7XG4gICAgICAgICB9XG5cbiAgICAgIH1cblxuICAgICAgaWYgKCQoJy5jaGF0Ym94LWNvbnRlbnQnKS5zY3JvbGxUb3AoKSA9PT0gMCkge1xuICAgICAgICAkc3RpY2tpZXMucmVtb3ZlQ2xhc3MoJ2ZpeGVkJyk7XG4gICAgICB9XG5cbiAgICB9KTtcblxuICB9O1xuXG4gIHJldHVybiB7XG4gICAgbG9hZDogbG9hZFxuICB9O1xufSkoKTtcblxuXG5cbiAgLy8gc2VsZi5hcHBFdmVudEJ1cy5vbihcImF1dGhlbnRpY2F0ZWRcIiwgZnVuY3Rpb24oKSB7XG4gIC8vICAgZGVidWdnZXI7XG4gIC8vICAgc2VsZi5hdXRoZW50aWNhdGVkKCk7XG4gIC8vIH0pO1xuXG5cblxuICAvLy8vLy8vLy8vLy8gIEJ1c3NlcyAvLy8vLy8vLy8vLy9cbiAgICAvLyBUaGVzZSBCdXNzZXMgbGlzdGVuIHRvIHRoZSBzb2NrZXRjbGllbnRcbiAgIC8vICAgIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cbiAgLy8vLyB2aWV3RXZlbnRCdXMgTGlzdGVuZXJzIC8vLy8vXG4gIFxuXHRzZWxmLnZpZXdFdmVudEJ1cy5vbihcImxvZ2luXCIsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQubG9naW4odXNlcik7XG4gIH0pO1xuXHRzZWxmLnZpZXdFdmVudEJ1cy5vbihcImNoYXRcIiwgZnVuY3Rpb24oY2hhdCkge1xuICAgIHNlbGYuY2hhdENsaWVudC5jaGF0KGNoYXQpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJ0eXBpbmdcIiwgZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LnVwZGF0ZVR5cGluZygpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJqb2luUm9vbVwiLCBmdW5jdGlvbihyb29tKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmpvaW5Sb29tKHJvb20pO1xuICB9KTtcblxuXG5cblxuXG5cblxuXG4gIC8vLy8gYXBwRXZlbnRCdXMgTGlzdGVuZXJzIC8vLy9cblxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwidXNlcnNJbmZvXCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICBjb25zb2xlLmxvZygnbWFpbi5lLnVzZXJzSW5mbzogJywgZGF0YSk7XG4gICAgLy9kYXRhIGlzIGFuIGFycmF5IG9mIHVzZXJuYW1lcywgaW5jbHVkaW5nIHRoZSBuZXcgdXNlclxuXHRcdC8vIFRoaXMgbWV0aG9kIGdldHMgdGhlIG9ubGluZSB1c2VycyBjb2xsZWN0aW9uIGZyb20gY2hhdHJvb21Nb2RlbC5cblx0XHQvLyBvbmxpbmVVc2VycyBpcyB0aGUgY29sbGVjdGlvblxuXHRcdHZhciBvbmxpbmVVc2VycyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoXCJvbmxpbmVVc2Vyc1wiKTtcbiAgICBjb25zb2xlLmxvZyhcIi4uLm9ubGluZVVzZXJzOiBcIiwgb25saW5lVXNlcnMpO1xuXHRcdHZhciB1c2VycyA9IF8ubWFwKGRhdGEsIGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdHJldHVybiBuZXcgYXBwLlVzZXJNb2RlbCh7dXNlcm5hbWU6IGl0ZW19KTtcblx0XHR9KTtcbiAgICBjb25zb2xlLmxvZyhcInVzZXJzOiBcIiwgdXNlcnMpO1xuXHRcdG9ubGluZVVzZXJzLnJlc2V0KHVzZXJzKTtcblx0fSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInJvb21JbmZvXCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICBjb25zb2xlLmxvZygnbWFpbi5lLnJvb21JbmZvOiAnLCBkYXRhKTtcbiAgICB2YXIgcm9vbXMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KFwiY2hhdHJvb21zXCIpO1xuICAgICBjb25zb2xlLmxvZyhcIi4uLnJvb21zOiBcIiwgcm9vbXMpO1xuICAgIHZhciB1cGRhdGVkUm9vbXMgPSBfLm1hcChkYXRhLCBmdW5jdGlvbihyb29tKSB7XG4gICAgICB2YXIgbmV3Q2hhdHJvb21Nb2RlbCA9IG5ldyBhcHAuQ2hhdHJvb21Nb2RlbCh7bmFtZTogcm9vbS5uYW1lfSk7XG4gICAgICByZXR1cm4gbmV3Q2hhdHJvb21Nb2RlbDtcbiAgICB9KTtcbiAgICBjb25zb2xlLmxvZyhcIi4uLnVwZGF0ZWRyb29tczogXCIsIHVwZGF0ZWRSb29tcyk7XG4gICAgcm9vbXMucmVzZXQodXBkYXRlZFJvb21zKTtcbiAgfSk7XG5cblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJsb2dpblVzZXJcIiwgZnVuY3Rpb24odXNlcm5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnbWFpbi5lLmxvZ2luVXNlcjogJywgdXNlcm5hbWUpO1xuICAgIHZhciB1c2VyID0gbmV3IGFwcC5Vc2VyTW9kZWwoe3VzZXJuYW1lOiB1c2VybmFtZX0pO1xuICAgIHNlbGYubmF2YmFyVmlldy5tb2RlbC5zZXQodXNlci50b0pTT04oKSk7XG4gIH0pO1xuXG5cblxuICAvLyBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0Um9vbVwiLCBmdW5jdGlvbihtb2RlbCkge1xuICAvLyAgIGNvbnNvbGUubG9nKCdtYWluLmUuc2V0Um9vbTogJywgbW9kZWwpO1xuXG4gIC8vICAgdmFyIGNoYXRsb2cgPSBuZXcgYXBwLkNoYXRDb2xsZWN0aW9uKG1vZGVsLmNoYXRsb2cpO1xuICAvLyAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zZXQoJ2NoYXRsb2cnLCBjaGF0bG9nKTtcblxuICAvLyAgIHZhciByb29tcyA9IG5ldyBhcHAuQ2hhdHJvb21MaXN0KG1vZGVsLmNoYXRyb29tcyk7XG4gIC8vICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnY2hhdHJvb21zJywgcm9vbXMpO1xuXG4gIC8vICAgdmFyIHVzZXJzID0gbmV3IGFwcC5Vc2VyQ29sbGVjdGlvbihtb2RlbC5vbmxpbmVVc2Vycyk7XG4gIC8vICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnb25saW5lVXNlcnMnLCB1c2Vycyk7XG5cbiAgLy8gfSk7XG5cblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJDaGF0cm9vbU1vZGVsXCIsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgY29uc29sZS5sb2coJ21haW4uZS5DaGF0cm9vbU1vZGVsOiAnLCBtb2RlbCk7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsID0gbmV3IGFwcC5DaGF0cm9vbU1vZGVsKCk7XG4gICAgc2VsZi5jaGF0cm9vbUxpc3QgPSBuZXcgYXBwLkNoYXRyb29tTGlzdCgpO1xuICAgIHNlbGYuY2hhdHJvb21WaWV3ICA9IG5ldyBhcHAuQ2hhdHJvb21WaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cywgbW9kZWw6IHNlbGYuY2hhdHJvb21Nb2RlbCwgY29sbGVjdGlvbjogc2VsZi5jaGF0cm9vbUxpc3R9KTtcbiAgICBzZWxmLmNvbnRhaW5lck1vZGVsLnNldCgndmlld1N0YXRlJywgc2VsZi5jaGF0cm9vbVZpZXcpO1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5sb2FkTW9kZWwobW9kZWwpO1xuICB9KTtcblxuXG5cbiAgLy8gYWRkcyBuZXcgdXNlciB0byB1c2VycyBjb2xsZWN0aW9uLCBzZW5kcyBkZWZhdWx0IGpvaW5pbmcgbWVzc2FnZVxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwidXNlckpvaW5lZFwiLCBmdW5jdGlvbih1c2VybmFtZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnbWFpbi5lLnVzZXJKb2luZWQ6ICcsIHVzZXJuYW1lKTtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkVXNlcih1c2VybmFtZSk7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLmFkZENoYXQoe3NlbmRlcjogXCJCdXR0ZXJzXCIsIG1lc3NhZ2U6IHVzZXJuYW1lICsgXCIgam9pbmVkIHJvb20uXCIgfSk7XG5cdH0pO1xuXG5cdC8vIHJlbW92ZXMgdXNlciBmcm9tIHVzZXJzIGNvbGxlY3Rpb24sIHNlbmRzIGRlZmF1bHQgbGVhdmluZyBtZXNzYWdlXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2VyTGVmdFwiLCBmdW5jdGlvbih1c2VybmFtZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnbWFpbi5lLnVzZXJMZWZ0OiAnLCB1c2VybmFtZSk7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLnJlbW92ZVVzZXIodXNlcm5hbWUpO1xuXHRcdHNlbGYuY2hhdHJvb21Nb2RlbC5hZGRDaGF0KHtzZW5kZXI6IFwiQnV0dGVyc1wiLCBtZXNzYWdlOiB1c2VybmFtZSArIFwiIGxlZnQgcm9vbS5cIiB9KTtcblx0fSk7XG5cblx0Ly8gY2hhdCBwYXNzZWQgZnJvbSBzb2NrZXRjbGllbnQsIGFkZHMgYSBuZXcgY2hhdCBtZXNzYWdlIHVzaW5nIGNoYXRyb29tTW9kZWwgbWV0aG9kXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJjaGF0UmVjZWl2ZWRcIiwgZnVuY3Rpb24oY2hhdCkge1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5hZGRDaGF0KGNoYXQpO1xuXHRcdCQoJy5jaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcuY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuXHR9KTtcblxuXG5cblxuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldENoYXRyb29tTmFtZVwiLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG5ld0hlYWRlciA9IG5ldyBhcHAuQ2hhdHJvb21IZWFkZXJNb2RlbCh7IG5hbWU6IG5hbWUgfSk7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnY2hhdHJvb20nLCBuZXdIZWFkZXIpO1xuICB9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0Q2hhdGxvZ1wiLCBmdW5jdGlvbihjaGF0bG9nKSB7XG4gICAgdmFyIG9sZENoYXRsb2cgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KCdjaGF0bG9nJyk7XG4gICAgdmFyIHVwZGF0ZWRDaGF0bG9nID0gXy5tYXAoY2hhdGxvZywgZnVuY3Rpb24oY2hhdCkge1xuICAgICAgdmFyIG5ld0NoYXRNb2RlbCA9IG5ldyBhcHAuQ2hhdE1vZGVsKHsgcm9vbTogY2hhdC5yb29tLCBtZXNzYWdlOiBjaGF0Lm1lc3NhZ2UsIHNlbmRlcjogY2hhdC5zZW5kZXIsIHRpbWVzdGFtcDogY2hhdC50aW1lc3RhbXAgfSk7XG4gICAgICByZXR1cm4gbmV3Q2hhdE1vZGVsO1xuICAgIH0pO1xuICAgIG9sZENoYXRsb2cucmVzZXQodXBkYXRlZENoYXRsb2cpO1xuICAgIHNlbGYuZGF0ZURpdmlkZXIubG9hZCgkKFwiLmZvbGxvd01lQmFyXCIpKTtcbiAgfSk7XG4gIFxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0Q2hhdHJvb21zXCIsIGZ1bmN0aW9uKGNoYXRyb29tcykge1xuICAgIHZhciBvbGRDaGF0cm9vbXMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KCdjaGF0cm9vbXMnKTtcbiAgICB2YXIgdXBkYXRlZENoYXRyb29tcyA9IF8ubWFwKGNoYXRyb29tcywgZnVuY3Rpb24oY2hhdHJvb20pIHtcbiAgICAgIHZhciBuZXdDaGF0cm9vbU1vZGVsID0gbmV3IGFwcC5DaGF0cm9vbU1vZGVsKHsgbmFtZTogY2hhdHJvb20ubmFtZSwgb25saW5lVXNlcnM6IGNoYXRyb29tLm9ubGluZVVzZXJzIH0pO1xuICAgICAgcmV0dXJuIG5ld0NoYXRyb29tTW9kZWw7XG4gICAgfSk7XG4gICAgb2xkQ2hhdHJvb21zLnJlc2V0KHVwZGF0ZWRDaGF0cm9vbXMpO1xuICB9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0T25saW5lVXNlcnNcIiwgZnVuY3Rpb24ob25saW5lVXNlcnMpIHtcbiAgICB2YXIgb2xkT25saW5lVXNlcnMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KCdvbmxpbmVVc2VycycpO1xuICAgIHZhciB1cGRhdGVkT25saW5lVXNlcnMgPSBfLm1hcChvbmxpbmVVc2VycywgZnVuY3Rpb24odXNlcikge1xuICAgICAgdmFyIG5ld1VzZXJNb2RlbCA9IG5ldyBhcHAuVXNlck1vZGVsKHt1c2VybmFtZTogdXNlci51c2VybmFtZX0pO1xuICAgICAgcmV0dXJuIG5ld1VzZXJNb2RlbDtcbiAgICB9KTtcbiAgICBvbGRPbmxpbmVVc2Vycy5yZXNldCh1cGRhdGVkT25saW5lVXNlcnMpO1xuICB9KTtcblxuXG59O1xuXG4iLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gICQod2luZG93KS5iaW5kKCdiZWZvcmV1bmxvYWQnLCBmdW5jdGlvbihldmVudE9iamVjdCkge1xuICAgICQuYWpheCh7XG4gICAgICAgdXJsOiBcIi9sb2dvdXRcIixcbiAgICB9KTtcbiAgfSk7XG5cbiAgdmFyIENoYXRyb29tUm91dGVyID0gQmFja2JvbmUuUm91dGVyLmV4dGVuZCh7XG4gICAgXG4gICAgcm91dGVzOiB7XG4gICAgICAnJzogJ3N0YXJ0JyxcbiAgICAgICdsb2cnOiAnbG9naW4nLFxuICAgICAgJ3JlZyc6ICdyZWdpc3RlcicsXG4gICAgICAnbG9nb3V0JzogJ2xvZ291dCcsXG4gICAgICAnYXV0aGVudGljYXRlZCc6ICdhdXRoZW50aWNhdGVkJyxcbiAgICAgICdmYWNlYm9vayc6ICdmYWNlYm9vaycsXG4gICAgICAndHdpdHRlcic6ICd0d2l0dGVyJ1xuICAgIH0sXG5cbiAgICBzdGFydDogZnVuY3Rpb24oY2FsbGJhY2spIHtcblxuICAgICAgYXBwLm1haW5Db250cm9sbGVyID0gbmV3IGFwcC5NYWluQ29udHJvbGxlcigpO1xuICAgICAgYXBwLm1haW5Db250cm9sbGVyLmluaXQoKTtcbiAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICB1cmw6IFwiL2xvZ291dFwiLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgbG9naW46IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGxvZ2luTW9kZWwgPSBuZXcgYXBwLkxvZ2luTW9kZWwoKTtcbiAgICAgIHZhciBsb2dpblZpZXcgPSBuZXcgYXBwLkxvZ2luVmlldyh7dmVudDogYXBwLm1haW5Db250cm9sbGVyLnZpZXdFdmVudEJ1cywgbW9kZWw6IGxvZ2luTW9kZWx9KTtcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlci5jb250YWluZXJNb2RlbC5zZXQoXCJ2aWV3U3RhdGVcIiwgbG9naW5WaWV3KTtcbiAgICB9LFxuXG4gICAgcmVnaXN0ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHJlZ2lzdGVyVmlldyA9IG5ldyBhcHAuUmVnaXN0ZXJWaWV3KHt2ZW50OiBhcHAubWFpbkNvbnRyb2xsZXIudmlld0V2ZW50QnVzIH0pO1xuICAgICAgYXBwLm1haW5Db250cm9sbGVyLmNvbnRhaW5lck1vZGVsLnNldChcInZpZXdTdGF0ZVwiLCByZWdpc3RlclZpZXcpO1xuICAgIH0sXG5cbiAgICAvLyBsb2dvdXQ6IGZ1bmN0aW9uKCkge1xuICAgIC8vICAgLy8gJCgnI2xvZ291dCcpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICAgICAgICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgLy8gICAgICQuYWpheCh7XG4gICAgLy8gICAgICAgdXJsOiBcIi9sb2dvdXRcIixcbiAgICAvLyAgICAgfSkuZG9uZShmdW5jdGlvbigpIHtcblxuICAgIC8vICAgICB9KTtcbiAgICAvLyAgICAgICB0aGlzXy5sb2dpbigpO1xuICAgIC8vICAgICAgIGFwcC5tYWluQ29udHJvbGxlci5sb2dvdXQoKTtcblxuICAgIC8vICAgLy8gfSk7XG4gICAgLy8gfSxcblxuICAgIGF1dGhlbnRpY2F0ZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgYXBwLm1haW5Db250cm9sbGVyLmF1dGhlbnRpY2F0ZWQoKTtcbiAgICB9LFxuICAgIGZhY2Vib29rOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuc3RhcnQodGhpcy5hdXRoZW50aWNhdGVkKTtcbiAgICB9LFxuICAgIHR3aXR0ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5zdGFydCh0aGlzLmF1dGhlbnRpY2F0ZWQpO1xuICAgIH0sXG5cbiAgfSk7XG5cbiAgYXBwLkNoYXRyb29tUm91dGVyID0gbmV3IENoYXRyb29tUm91dGVyKCk7XG4gIEJhY2tib25lLmhpc3Rvcnkuc3RhcnQoKTtcblxufSkoKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=