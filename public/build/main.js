
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
    chatroomHeader: null,
    onlineUsers: new app.UserCollection(),
    chatlog: new app.ChatCollection([
      // message and sender upon entering chatroom
      new app.ChatModel({ sender: 'Butters', message: 'awwwwww hamburgers. ||):||', timestamp: _.now() })
      ]),
    chatrooms: null,
    owner: null,
    numberLoaded: 0,
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
    this.get('chatlog').add(new app.ChatModel({ sender: chat.sender, message: chat.message, timestamp: now, url: chat.url}));
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
  headerTemplate: _.template($('#chatroom-header-template').html()),
  dateTemplate: _.template('<div class="followMeBar col-xs-12 col-sm-12 col-md-12"><span>-----------------</span><span> <%= moment(timestamp).format("dddd, MMMM Do YYYY") %> </span><span>-----------------</span></div>'),
  events: {
    'keypress .message-input': 'messageInputPressed',
    'click .chat-directory .room': 'setRoom',
    'keypress #chat-search-input': 'search',
    'click .remove-chatroom': 'removeRoom',
    // 'click #create-chatroom': 'createRoom',
    'click #createChatroomBtn': 'createRoom',
    'click #destroy-chatroom': 'destroyRoom',
  },
  initialize: function(options) {
    console.log('chatroomView.f.initialize: ', options);
    // passed the viewEventBus
    var self = this;
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
    // this.chatImageViewView.setElement(this.$('#chatImageUploadContainer')).render();
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


    this.chatImageView = new app.ChatImageView();
    this.listenTo(this.chatImageView, 'image-uploaded', this.updateInput);
    this.listenTo(this.model, "change:chatroom", this.renderName, this);



    // setTimeout(function() {
    //     $("#chatImageUpload").change(function(){
    //        console.log('burn daddy burn');
    //      });
    //     // $('#chatbox-content')[0].scrollTop = $('#chatbox-content')[0].scrollHeight;
    // }, 2000);

      var this_ = this;
// figure this out, put somewhere else. no setTimeout
    setTimeout(function() {
      $('#chat-search-input').typeahead({
      onSelect: function(item) {
        console.log(item);
      },
      ajax: {
        url: '/api/searchChatrooms',
        triggerLength: 1,
        preDispatch: function (query) {
            return {
                name: query
            };
        },
        preProcess: function (data) {
          console.log(data);
            if (data.success === false) {
                // Hide the list, there was some error
                return false;
            }
            // We good!
            return data;
        }
      },
    });

    setTimeout(function() {
      $('#chatbox-content').scroll(function(){
        if ($(this).scrollTop() === 0) {
           this_.getMoreChats();
        }
      });
    }, 1000);

        $('#chatbox-content')[0].scrollTop = $('#chatbox-content')[0].scrollHeight;
    }, 1000);

  },

  getMoreChats: function() {
    console.log('bbuts');
    var chatroom = this.model.get('chatroom'),
    name = chatroom.get('name'),
    numberLoaded = chatroom.get('numberLoaded');

    debugger;

    chatroom.set('numberloaded', numberLoaded++);

    this.vent.trigger('getMoreChats', { name: name, numberLoaded: numberLoaded });
  },

  destroyRoom: function(e) {
    confirm("As the owner of this room, you may destroy the room. Do you wish to destroy the room?");
    e.preventDefault();
    this.vent.trigger('destroyRoom', this.model.get('chatroom').get('name'));
  },

  createRoom: function(e) {
    var formData = {};
    this.$('#createChatroomForm').children( 'input' ).each(function(i, el) {
      if ($(el).val() !== '') {
        formData[$(el).data('create')] = $(el).val();
      }
    });
    this.vent.trigger('createRoom', formData);
  },

  removeRoom: function(e) {
    confirm('Are you sure you want to remove this chatroom?');
    var name = $(e.target).data("room-name");
    this.vent.trigger('removeRoom', name);
  },

  search: function(e) {
    if (e.keyCode === 13 && $.trim($('#chat-search-input').val()).length > 0) {
      // fun fact: separate events with a space in trigger's first arg and you
      // can trigger multiple events.
      // this.vent.trigger("chat", { message: this.$('.message-input').val()});
      // this.$('.message-input').val('');
      // $.post( "/api/searchChatrooms", function( data ) {
      //   $( ".result" ).html( data );
      // });
      // return false;
      e.preventDefault();
      var name = $('#chat-search-input').val();
      this.addChatroom(name);
    } else {
      console.log('yay');
    }
    return this;
  },

  addChatroom: function(name) {
    console.log('crv.f.addChatroom');
    this.vent.trigger('addRoom', name);
  },

  // getChatroomModel: function(name) {
  //   console.log('crv.f.getChatroomModel');
  //   this.vent.trigger('getChatroomModel', name);
  // },
  // renders on events, called just above
  renderName: function() {
    this.$('.chatbox-header').html(this.headerTemplate(this.model.get('chatroomHeader').toJSON()));
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
    this.$('#chatbox-content').empty();
    this.model.get('chatlog').each(function(chat) {
      this.renderChat(chat);
    }, this);

// these things should not be here
    autosize($('textarea.message-input'));
    this.dateDivider.load(this, $(".followMeBar"));
  },
  renderChat: function(model) {

    // delete in production
    if (model.attributes.url === '' || model.attributes.url === null || model.attributes.url === undefined) {
      model.attributes.url = '';
    }

    this.renderDateDividers(model);
    var chatTemplate = $(this.chatTemplate(model.toJSON()));
    chatTemplate.appendTo(this.$('#chatbox-content')).hide().fadeIn().slideDown();
    $('#chatbox-content')[0].scrollTop = $('#chatbox-content')[0].scrollHeight;
  },
  renderDateDividers: function(model) {
    this.currentDate = moment(model.attributes.timestamp).format('dddd, MMMM Do YYYY');
    if ( this.currentDate !== this.previousDate ) {
      var currentDate = $(this.dateTemplate(model.toJSON()));
      currentDate.appendTo(this.$('#chatbox-content')).hide().fadeIn().slideDown();
      this.previousDate = this.currentDate;
    }
            this.chatImageView.setElement($('#chatImageUploadContainer'));
  },




// rename
  updateInput: function(response) {
    debugger;
    var chatImage = new app.ChatModel(response);
    console.log('img url: ', response);
    this.vent.trigger("chat", response);
    // this.renderChat(chatImage);
    // $('#chatImageUpload').val(response.url);
    // this.createData();
    setTimeout(function() {
      $('#chatbox-content')[0].scrollTop = $('#chatbox-content')[0].scrollHeight;
    }, 1000);
  },





  // renders on events, called just above
  renderRooms: function() {
    console.log('crv.f.renderRooms');
    console.log('CHATROOMS: ', this.model.get("chatrooms"));
    this.$('.public-rooms').empty();
    this.model.get('chatrooms').each(function (room) {
      this.renderRoom(room);
    }, this);
  },
  renderRoom: function(model) {
    var template = _.template($("#room-list-template").html());
    this.$('.public-rooms').append(template(model.toJSON()));
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
      this.vent.trigger("chat", { message: this.$('.message-input').val()});
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
    $stickies,
    $view;

    load = function(view, stickies) {

      $view = view;

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
        $thisStickyPosition = $thisSticky.data('originalPosition'),

        $prevSticky = $stickies.eq(i - 1),
        $prevStickyTop = $prevSticky.offset().top,
        $prevStickyPosition = $prevSticky.data('originalPosition');


        if ($thisStickyTop <= 157) {

          var $nextSticky = $stickies.eq(i + 1),

          $thisStickyPosition = $thisSticky.data('originalPosition'),
          $thisAndPrevStickyDifference = Math.abs($prevStickyPosition - $thisStickyPosition);

          $thisSticky.addClass("fixed");

          // var $nextStickyPosition = $nextSticky.data('originalPosition');
          // var $thisAndNextStickyDifference = Math.abs($thisStickyPosition - $nextStickyPosition);
          // var $nextStickyTop = $nextSticky.offset().top;
          // console.log('-------------');
          // console.log('prevstickyoriginposition', $stickies.eq(i - 1).data('originalPosition'));
          // console.log('prevstickytop', $stickies.eq(i - 1).offset().top);
          // console.log('$thisAndPrevStickyDifference', Math.abs($thisStickyPosition - $stickies.eq(i - 1).data('originalPosition')));
          // console.log('thisStickyTop', $thisSticky.offset().top);
          // console.log('$thisAndNextStickyDifference', Math.abs($thisStickyPosition - $nextStickyPosition));
          // console.log('nextStickyTop', $nextSticky.offset().top);
          // console.log('nextstickyoriginposition', $nextSticky.data('originalPosition'));
          // // console.log('prev', $prevSticky);
          // // console.log('this', $thisSticky);
          // // console.log('next', $nextSticky);
          // console.log('-------------');
        
          //scrolling up
          if ($nextSticky.hasClass("fixed")) {
            $nextSticky.removeClass("fixed");
          }

         // scrolling up and sticking to proper position
          if ($prevStickyTop + $thisAndPrevStickyDifference > 157 && i !== 0) {
            $nextSticky.removeClass("fixed");
          }

          if ($prevStickyTop >= 157 && $prevSticky.hasClass("fixed") && i !== 0) {
            $prevSticky.removeClass("fixed");
          }

          // scrolling down
        } else {

          if ($prevStickyTop >= 157 && $prevSticky.hasClass("fixed") && i !== 0) {
            $thisSticky.removeClass("fixed");
          }

        }

        if ($('#chatbox-content').scrollTop() === 0) {
          // $view.getMoreChats();
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


(function($) {

  app.ChatImageView = Backbone.View.extend({

    el: $('#chatImageUploadContainer'),
  
    events: {
      'change #chatImageUpload': 'renderThumb',
      'attachImage #chatImageUploadForm': 'upload',
      'click #addChatImageBtn': 'submit',
    },

    render: function() {
      this.renderThumb();
    },

    renderThumb: function() {
      var input = this.$('#chatImageUpload');
      var img = this.$('#uploadedChatImage')[0];
      if(input.val() !== '') {
        var selected_file = input[0].files[0];
        var reader = new FileReader();
        reader.onload = (function(aImg) {
          return function(e) {
            aImg.src = e.target.result;
          };
        })(img);
        reader.readAsDataURL( selected_file );
      }

    },

    submit: function(e) {
      e.preventDefault();
      this.$form = this.$('#chatImageUploadForm');
      this.$form.trigger('attachImage');
    },

    upload: function() {
      var _this = this;
        var formData = new FormData(this.$form[0]);
      if (this.$('#chatImageUpload')[0].files.length > 0) {
        $.ajax({
          type: 'POST',
          url: '/api/uploadChatImage',
          data: formData,
          cache: false,
          dataType: 'json',
          processData: false,
          contentType: false,
          error: function( xhr ) {
            _this.renderStatus('Error: ' + xhr.status);
            alert('Your image is either too large or it is not a .jpeg, .png, or .gif.');
          },
          success: function( response ) {
            console.log('imgUpload response: ', response);
            _this.trigger('image-uploaded', response);
            console.log('imgUpload path ', response.path);
            $('#chatImageUploadModal').modal('hide');
            _this.clearField();
          }
        });
      } else {
       this.trigger('image-uploaded');
      }
      return false;
    },

    renderStatus: function( status ) {
      $('#status').text(status);
    },

    clearField: function() {
      this.$('#uploadedChatImage')[0].src = '';
      this.$('#chatImageUpload').val('');
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
    template: _.template("<ul class='nav navbar-right'><% if (username) { %><li>Hello, <%= username %></li><li><a href='/'><i class='fa fa-power-off power-off-style fa-2x'></i></a></li><% } else { %><li><a href='#log'>login</a></li><li><a href='#reg'>register</a></li><% } %></ul>"),
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

  // self.getChatroomModel = function(name) {
  //   console.log('sc.f.getChatroomModel: ', name);
  //   self.socket.emit("getChatroomModel", name);
  // };

  self.addRoom = function(name) {
    console.log('sc.f.addRoom: ', name);
    self.socket.emit("addRoom", name);
  };

  self.removeRoom = function(name) {
    console.log('sc.f.removeRoom: ', name);
    self.socket.emit("removeRoom", name);
  };

  self.createRoom = function(formData) {
    console.log('sc.f.createRoom: ', formData);
    self.socket.emit("createRoom", formData);
  };

  self.destroyRoom = function(name) {
    console.log('sc.f.destroyRoom: ', name);
    self.socket.emit("destroyRoom", name);
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
  self.getMoreChats = function(chatReq) {
    self.socket.emit('getMoreChats', chatReq);
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
      debugger;
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
    socket.on('chatroomHeader', function(headerObj) {
      console.log('sc.e.chatroomHeader: ', headerObj);
      self.vent.trigger("setChatroomHeader", headerObj);
    });
    socket.on('roomDestroyed', function(name) {
      console.log('sc.e.roomDestroyed: ', name);
      self.vent.trigger("roomDestroyed", name);
    });
    socket.on('moreChats', function(chats) {
      self.vent.trigger("moreChats", chats);
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
       
    });

  };

  self.connectToRoom = function(callback) {
    self.chatClient.connectToRoom("DOO");
  };

  self.initRoom = function(callback) {
    self.chatroomView.initRoom();
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
  self.viewEventBus.on("addRoom", function(room) {
    self.chatClient.addRoom(room);
  });
  self.viewEventBus.on("removeRoom", function(room) {
    self.chatClient.removeRoom(room);
  });
  self.viewEventBus.on("createRoom", function(formData) {
    self.chatClient.createRoom(formData);
  });
  self.viewEventBus.on("destroyRoom", function(room) {
    self.chatClient.destroyRoom(room);
  });
  self.viewEventBus.on("getMoreChats", function(chatReq) {
    self.chatClient.getMoreChats(chatReq);
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
    debugger;
    console.log('main.e.roomInfo: ', data);
    var rooms = self.chatroomModel.get("chatrooms");
     console.log("...rooms: ", rooms);
    var updatedRooms = _.map(data, function(room) {
      var newChatroomModel = new app.ChatroomModel({name: room});
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




  self.appEventBus.on("roomDestroyed", function(name) {
    self.connectToRoom();
    self.initRoom();
    alert('Chatroom ' + name + ' destroyed');
  });

  self.appEventBus.on("setChatroomHeader", function(headerObj) {
    var newHeader = new app.ChatroomHeaderModel(headerObj);
    self.chatroomModel.set('chatroomHeader', newHeader);
  });

  self.appEventBus.on("setChatlog", function(chatlog) {
    var oldChatlog = self.chatroomModel.get('chatlog');
    var updatedChatlog = _.map(chatlog, function(chat) {
      var newChatModel = new app.ChatModel({ room: chat.room, message: chat.message, sender: chat.sender, timestamp: chat.timestamp, url: chat.url });
      return newChatModel;
    });
    oldChatlog.reset(updatedChatlog);
  });

  self.appEventBus.on("moreChats", function(chatlog) {
    var oldChatlog = self.chatroomModel.get('chatlog');
    debugger;
    var moreChatlog = _.map(chatlog, function(chat) {
      var newChatModel = new app.ChatModel({ room: chat.room, message: chat.message, sender: chat.sender, timestamp: chat.timestamp, url: chat.url });
      return newChatModel;
    });
    debugger;
    oldChatlog.push(moreChatlog);
  });
  
  self.appEventBus.on("setChatrooms", function(chatrooms) {
    var oldChatrooms = self.chatroomModel.get('chatrooms');
    var updatedChatrooms = _.map(chatrooms, function(chatroom) {
      var newChatroomModel = new app.ChatroomModel({ name: chatroom.name, owner: chatroom.owner});
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYXQuanMiLCJjaGF0cm9vbS1oZWFkZXIuanMiLCJjb250YWluZXIuanMiLCJsb2dpbi5qcyIsInVzZXIuanMiLCJjaGF0cm9vbS5qcyIsInJvb20uanMiLCJpbWFnZVVwbG9hZC5qcyIsIm5hdmJhci5qcyIsInJlZ2lzdGVyLmpzIiwic29ja2V0Y2xpZW50LmpzIiwibWFpbi5qcyIsInJvdXRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUpQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBSVRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QURWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBSGxaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBS2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUpsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FLbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNU9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuQ2hhdENvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG4gICAgbW9kZWw6IGFwcC5DaGF0TW9kZWxcbiAgfSk7XG5cbn0pKCk7IiwiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5DaGF0cm9vbUhlYWRlck1vZGVsID0gQmFja2JvbmUuTW9kZWwuZXh0ZW5kKHt9KTtcblxufSkoKTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuICBhcHAuQ29udGFpbmVyVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBlbDogJyN2aWV3LWNvbnRhaW5lcicsXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdGhpcy5tb2RlbC5vbihcImNoYW5nZTp2aWV3U3RhdGVcIiwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB2aWV3ID0gdGhpcy5tb2RlbC5nZXQoJ3ZpZXdTdGF0ZScpO1xuICAgICAgdGhpcy4kZWwuaHRtbCh2aWV3LnJlbmRlcigpLmVsKTtcbiAgICB9XG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5Mb2dpblZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2xvZ2luJykuaHRtbCgpKSxcbiAgICBldmVudHM6IHtcbiAgICAgICdzdWJtaXQnOiAnb25Mb2dpbicsXG4gICAgICAna2V5cHJlc3MnOiAnb25IaXRFbnRlcidcbiAgICB9LFxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAvLyBMb2dpblZpZXcgZ2V0cyBwYXNzZWQgdGhlIHZpZXdFdmVudEJ1cyB3aGVuIHRoZSBNYWluQ29udHJvbGxlciBpcyBpbml0aWFsaXplZFxuICAgICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xuXG4gICAgLy8gVGhpcyB0ZWxscyB0aGUgdmlldyB0byBsaXN0ZW4gdG8gYW4gZXZlbnQgb24gaXRzIG1vZGVsLFxuICAgIC8vIGlmIHRoZXJlJ3MgYW4gZXJyb3IsIHRoZSBjYWxsYmFjayAodGhpcy5yZW5kZXIpIGlzIGNhbGxlZCB3aXRoIHRoZSAgXG4gICAgLy8gdmlldyBhcyBjb250ZXh0XG4gICAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiY2hhbmdlOmVycm9yXCIsIHRoaXMucmVuZGVyLCB0aGlzKTtcbiAgICB9LFxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUodGhpcy5tb2RlbC50b0pTT04oKSkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBvbkxvZ2luOiBmdW5jdGlvbihlKSB7XG4gICAgICAvLyB0cmlnZ2VycyB0aGUgbG9naW4gZXZlbnQgYW5kIHBhc3NpbmcgdGhlIHVzZXJuYW1lIGRhdGEgdG8ganMvbWFpbi5qc1xuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAkLmFqYXgoe1xuICAgICAgICB1cmw6IFwiL2xvZ2luXCIsXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBkYXRhOiB7dXNlcm5hbWU6IHRoaXMuJCgnI3VzZXJuYW1lJykudmFsKCksIHBhc3N3b3JkOiB0aGlzLiQoJyNwYXNzd29yZCcpLnZhbCgpfSxcbiAgICAgICAgc3VjY2VzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICBjb25zb2xlLmxvZygnc3VjY2VzcyBkYXRhOiAnLCBkYXRhKTtcbiAgICAgICAgICAgaWYgKGRhdGEgPT09IDIwMCkge1xuICAgICAgICAgICAgIC8vIHRoaXNfLnZlbnQudHJpZ2dlcignYXV0aGVudGljYXRlZCcpO1xuICAgICAgICAgICAgYXBwLkNoYXRyb29tUm91dGVyLm5hdmlnYXRlKCdhdXRoZW50aWNhdGVkJywgeyB0cmlnZ2VyOiB0cnVlIH0pO1xuICAgICAgICAgICAgdGhpc18udmVudC50cmlnZ2VyKFwibG9naW5cIiwge3VzZXJuYW1lOiB0aGlzXy4kKCcjdXNlcm5hbWUnKS52YWwoKSwgcGFzc3dvcmQ6IHRoaXNfLiQoJyNwYXNzd29yZCcpLnZhbCgpfSk7XG4gICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSkuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2RvbmVlZWVlZWVlJyk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIC8vIG9uSGl0RW50ZXI6IGZ1bmN0aW9uKGUpIHtcbiAgICAvLyAgIGlmKGUua2V5Q29kZSA9PSAxMykge1xuICAgIC8vICAgICB0aGlzLm9uTG9naW4oKTtcbiAgICAvLyAgICAgcmV0dXJuIGZhbHNlO1xuICAgIC8vICAgfVxuICAgIC8vIH1cbiAgfSk7XG4gIFxufSkoalF1ZXJ5KTsiLCJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLlVzZXJDb2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe21vZGVsOiBhcHAuVXNlck1vZGVsfSk7XG5cbn0pKCk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbmFwcC5DaGF0cm9vbVZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gIHRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNjaGF0cm9vbS10ZW1wbGF0ZScpLmh0bWwoKSksXG4gIGNoYXRUZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjY2hhdGJveC1tZXNzYWdlLXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgaGVhZGVyVGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2NoYXRyb29tLWhlYWRlci10ZW1wbGF0ZScpLmh0bWwoKSksXG4gIGRhdGVUZW1wbGF0ZTogXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cImZvbGxvd01lQmFyIGNvbC14cy0xMiBjb2wtc20tMTIgY29sLW1kLTEyXCI+PHNwYW4+LS0tLS0tLS0tLS0tLS0tLS08L3NwYW4+PHNwYW4+IDwlPSBtb21lbnQodGltZXN0YW1wKS5mb3JtYXQoXCJkZGRkLCBNTU1NIERvIFlZWVlcIikgJT4gPC9zcGFuPjxzcGFuPi0tLS0tLS0tLS0tLS0tLS0tPC9zcGFuPjwvZGl2PicpLFxuICBldmVudHM6IHtcbiAgICAna2V5cHJlc3MgLm1lc3NhZ2UtaW5wdXQnOiAnbWVzc2FnZUlucHV0UHJlc3NlZCcsXG4gICAgJ2NsaWNrIC5jaGF0LWRpcmVjdG9yeSAucm9vbSc6ICdzZXRSb29tJyxcbiAgICAna2V5cHJlc3MgI2NoYXQtc2VhcmNoLWlucHV0JzogJ3NlYXJjaCcsXG4gICAgJ2NsaWNrIC5yZW1vdmUtY2hhdHJvb20nOiAncmVtb3ZlUm9vbScsXG4gICAgLy8gJ2NsaWNrICNjcmVhdGUtY2hhdHJvb20nOiAnY3JlYXRlUm9vbScsXG4gICAgJ2NsaWNrICNjcmVhdGVDaGF0cm9vbUJ0bic6ICdjcmVhdGVSb29tJyxcbiAgICAnY2xpY2sgI2Rlc3Ryb3ktY2hhdHJvb20nOiAnZGVzdHJveVJvb20nLFxuICB9LFxuICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgY29uc29sZS5sb2coJ2NoYXRyb29tVmlldy5mLmluaXRpYWxpemU6ICcsIG9wdGlvbnMpO1xuICAgIC8vIHBhc3NlZCB0aGUgdmlld0V2ZW50QnVzXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcbiAgfSxcbiAgaW5pdFJvb206IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMucmVuZGVyTmFtZSgpO1xuICB9LFxuICByZW5kZXI6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlcicpO1xuICAgIHRoaXMubW9kZWwgPSBtb2RlbCB8fCB0aGlzLm1vZGVsO1xuICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzLm1vZGVsLnRvSlNPTigpKSk7XG4gICAgLy8gdGhpcy5zZXRDaGF0Q29sbGVjdGlvbigpO1xuICAgIC8vIHRoaXMuY2hhdEltYWdlVmlld1ZpZXcuc2V0RWxlbWVudCh0aGlzLiQoJyNjaGF0SW1hZ2VVcGxvYWRDb250YWluZXInKSkucmVuZGVyKCk7XG4gICAgdGhpcy5zZXRDaGF0TGlzdGVuZXJzKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIHNldENoYXRMaXN0ZW5lcnM6IGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIG9ubGluZVVzZXJzID0gdGhpcy5tb2RlbC5nZXQoJ29ubGluZVVzZXJzJyk7XG4gICAgdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJhZGRcIiwgdGhpcy5yZW5kZXJVc2VyLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKG9ubGluZVVzZXJzLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlclVzZXJzLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKG9ubGluZVVzZXJzLCBcInJlc2V0XCIsIHRoaXMucmVuZGVyVXNlcnMsIHRoaXMpO1xuXG4gICAgdmFyIGNoYXRsb2cgPSB0aGlzLm1vZGVsLmdldCgnY2hhdGxvZycpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdGxvZywgXCJhZGRcIiwgdGhpcy5yZW5kZXJDaGF0LCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRsb2csIFwicmVtb3ZlXCIsIHRoaXMucmVuZGVyQ2hhdHMsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdGxvZywgXCJyZXNldFwiLCB0aGlzLnJlbmRlckNoYXRzLCB0aGlzKTtcblxuICAgIHZhciBjaGF0cm9vbXMgPSB0aGlzLm1vZGVsLmdldCgnY2hhdHJvb21zJyk7XG4gICAgdGhpcy5saXN0ZW5UbyhjaGF0cm9vbXMsIFwiYWRkXCIsIHRoaXMucmVuZGVyUm9vbSwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhjaGF0cm9vbXMsIFwicmVtb3ZlXCIsIHRoaXMucmVuZGVyUm9vbXMsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcInJlc2V0XCIsIHRoaXMucmVuZGVyUm9vbXMsIHRoaXMpO1xuXG5cbiAgICB0aGlzLmNoYXRJbWFnZVZpZXcgPSBuZXcgYXBwLkNoYXRJbWFnZVZpZXcoKTtcbiAgICB0aGlzLmxpc3RlblRvKHRoaXMuY2hhdEltYWdlVmlldywgJ2ltYWdlLXVwbG9hZGVkJywgdGhpcy51cGRhdGVJbnB1dCk7XG4gICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImNoYW5nZTpjaGF0cm9vbVwiLCB0aGlzLnJlbmRlck5hbWUsIHRoaXMpO1xuXG5cblxuICAgIC8vIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICQoXCIjY2hhdEltYWdlVXBsb2FkXCIpLmNoYW5nZShmdW5jdGlvbigpe1xuICAgIC8vICAgICAgICBjb25zb2xlLmxvZygnYnVybiBkYWRkeSBidXJuJyk7XG4gICAgLy8gICAgICB9KTtcbiAgICAvLyAgICAgLy8gJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG4gICAgLy8gfSwgMjAwMCk7XG5cbiAgICAgIHZhciB0aGlzXyA9IHRoaXM7XG4vLyBmaWd1cmUgdGhpcyBvdXQsIHB1dCBzb21ld2hlcmUgZWxzZS4gbm8gc2V0VGltZW91dFxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAkKCcjY2hhdC1zZWFyY2gtaW5wdXQnKS50eXBlYWhlYWQoe1xuICAgICAgb25TZWxlY3Q6IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgY29uc29sZS5sb2coaXRlbSk7XG4gICAgICB9LFxuICAgICAgYWpheDoge1xuICAgICAgICB1cmw6ICcvYXBpL3NlYXJjaENoYXRyb29tcycsXG4gICAgICAgIHRyaWdnZXJMZW5ndGg6IDEsXG4gICAgICAgIHByZURpc3BhdGNoOiBmdW5jdGlvbiAocXVlcnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogcXVlcnlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHByZVByb2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICAgICAgICBpZiAoZGF0YS5zdWNjZXNzID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIC8vIEhpZGUgdGhlIGxpc3QsIHRoZXJlIHdhcyBzb21lIGVycm9yXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gV2UgZ29vZCFcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICQoJyNjaGF0Ym94LWNvbnRlbnQnKS5zY3JvbGwoZnVuY3Rpb24oKXtcbiAgICAgICAgaWYgKCQodGhpcykuc2Nyb2xsVG9wKCkgPT09IDApIHtcbiAgICAgICAgICAgdGhpc18uZ2V0TW9yZUNoYXRzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sIDEwMDApO1xuXG4gICAgICAgICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuICAgIH0sIDEwMDApO1xuXG4gIH0sXG5cbiAgZ2V0TW9yZUNoYXRzOiBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnYmJ1dHMnKTtcbiAgICB2YXIgY2hhdHJvb20gPSB0aGlzLm1vZGVsLmdldCgnY2hhdHJvb20nKSxcbiAgICBuYW1lID0gY2hhdHJvb20uZ2V0KCduYW1lJyksXG4gICAgbnVtYmVyTG9hZGVkID0gY2hhdHJvb20uZ2V0KCdudW1iZXJMb2FkZWQnKTtcblxuICAgIGRlYnVnZ2VyO1xuXG4gICAgY2hhdHJvb20uc2V0KCdudW1iZXJsb2FkZWQnLCBudW1iZXJMb2FkZWQrKyk7XG5cbiAgICB0aGlzLnZlbnQudHJpZ2dlcignZ2V0TW9yZUNoYXRzJywgeyBuYW1lOiBuYW1lLCBudW1iZXJMb2FkZWQ6IG51bWJlckxvYWRlZCB9KTtcbiAgfSxcblxuICBkZXN0cm95Um9vbTogZnVuY3Rpb24oZSkge1xuICAgIGNvbmZpcm0oXCJBcyB0aGUgb3duZXIgb2YgdGhpcyByb29tLCB5b3UgbWF5IGRlc3Ryb3kgdGhlIHJvb20uIERvIHlvdSB3aXNoIHRvIGRlc3Ryb3kgdGhlIHJvb20/XCIpO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB0aGlzLnZlbnQudHJpZ2dlcignZGVzdHJveVJvb20nLCB0aGlzLm1vZGVsLmdldCgnY2hhdHJvb20nKS5nZXQoJ25hbWUnKSk7XG4gIH0sXG5cbiAgY3JlYXRlUm9vbTogZnVuY3Rpb24oZSkge1xuICAgIHZhciBmb3JtRGF0YSA9IHt9O1xuICAgIHRoaXMuJCgnI2NyZWF0ZUNoYXRyb29tRm9ybScpLmNoaWxkcmVuKCAnaW5wdXQnICkuZWFjaChmdW5jdGlvbihpLCBlbCkge1xuICAgICAgaWYgKCQoZWwpLnZhbCgpICE9PSAnJykge1xuICAgICAgICBmb3JtRGF0YVskKGVsKS5kYXRhKCdjcmVhdGUnKV0gPSAkKGVsKS52YWwoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLnZlbnQudHJpZ2dlcignY3JlYXRlUm9vbScsIGZvcm1EYXRhKTtcbiAgfSxcblxuICByZW1vdmVSb29tOiBmdW5jdGlvbihlKSB7XG4gICAgY29uZmlybSgnQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIHJlbW92ZSB0aGlzIGNoYXRyb29tPycpO1xuICAgIHZhciBuYW1lID0gJChlLnRhcmdldCkuZGF0YShcInJvb20tbmFtZVwiKTtcbiAgICB0aGlzLnZlbnQudHJpZ2dlcigncmVtb3ZlUm9vbScsIG5hbWUpO1xuICB9LFxuXG4gIHNlYXJjaDogZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzICYmICQudHJpbSgkKCcjY2hhdC1zZWFyY2gtaW5wdXQnKS52YWwoKSkubGVuZ3RoID4gMCkge1xuICAgICAgLy8gZnVuIGZhY3Q6IHNlcGFyYXRlIGV2ZW50cyB3aXRoIGEgc3BhY2UgaW4gdHJpZ2dlcidzIGZpcnN0IGFyZyBhbmQgeW91XG4gICAgICAvLyBjYW4gdHJpZ2dlciBtdWx0aXBsZSBldmVudHMuXG4gICAgICAvLyB0aGlzLnZlbnQudHJpZ2dlcihcImNoYXRcIiwgeyBtZXNzYWdlOiB0aGlzLiQoJy5tZXNzYWdlLWlucHV0JykudmFsKCl9KTtcbiAgICAgIC8vIHRoaXMuJCgnLm1lc3NhZ2UtaW5wdXQnKS52YWwoJycpO1xuICAgICAgLy8gJC5wb3N0KCBcIi9hcGkvc2VhcmNoQ2hhdHJvb21zXCIsIGZ1bmN0aW9uKCBkYXRhICkge1xuICAgICAgLy8gICAkKCBcIi5yZXN1bHRcIiApLmh0bWwoIGRhdGEgKTtcbiAgICAgIC8vIH0pO1xuICAgICAgLy8gcmV0dXJuIGZhbHNlO1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdmFyIG5hbWUgPSAkKCcjY2hhdC1zZWFyY2gtaW5wdXQnKS52YWwoKTtcbiAgICAgIHRoaXMuYWRkQ2hhdHJvb20obmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCd5YXknKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgYWRkQ2hhdHJvb206IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYuYWRkQ2hhdHJvb20nKTtcbiAgICB0aGlzLnZlbnQudHJpZ2dlcignYWRkUm9vbScsIG5hbWUpO1xuICB9LFxuXG4gIC8vIGdldENoYXRyb29tTW9kZWw6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgLy8gICBjb25zb2xlLmxvZygnY3J2LmYuZ2V0Q2hhdHJvb21Nb2RlbCcpO1xuICAvLyAgIHRoaXMudmVudC50cmlnZ2VyKCdnZXRDaGF0cm9vbU1vZGVsJywgbmFtZSk7XG4gIC8vIH0sXG4gIC8vIHJlbmRlcnMgb24gZXZlbnRzLCBjYWxsZWQganVzdCBhYm92ZVxuICByZW5kZXJOYW1lOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLiQoJy5jaGF0Ym94LWhlYWRlcicpLmh0bWwodGhpcy5oZWFkZXJUZW1wbGF0ZSh0aGlzLm1vZGVsLmdldCgnY2hhdHJvb21IZWFkZXInKS50b0pTT04oKSkpO1xuICB9LFxuICByZW5kZXJVc2VyczogZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlclVzZXJzJyk7XG4gICAgY29uc29sZS5sb2coJ1VTRVJTOiAnLCB0aGlzLm1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpKTtcbiAgICB0aGlzLiQoJy5vbmxpbmUtdXNlcnMnKS5lbXB0eSgpO1xuICAgIHRoaXMubW9kZWwuZ2V0KFwib25saW5lVXNlcnNcIikuZWFjaChmdW5jdGlvbiAodXNlcikge1xuICAgICAgdGhpcy5yZW5kZXJVc2VyKHVzZXIpO1xuICAgIH0sIHRoaXMpO1xuICB9LFxuICByZW5kZXJVc2VyOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHZhciB0ZW1wbGF0ZSA9IF8udGVtcGxhdGUoJChcIiNvbmxpbmUtdXNlcnMtbGlzdC10ZW1wbGF0ZVwiKS5odG1sKCkpO1xuICAgIHRoaXMuJCgnLm9ubGluZS11c2VycycpLmFwcGVuZCh0ZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICB9LFxuICByZW5kZXJDaGF0czogZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlckNoYXRzJyk7XG4gICAgY29uc29sZS5sb2coJ0NIQVRMT0c6ICcsIHRoaXMubW9kZWwuZ2V0KFwiY2hhdGxvZ1wiKSk7XG4gICAgdGhpcy4kKCcjY2hhdGJveC1jb250ZW50JykuZW1wdHkoKTtcbiAgICB0aGlzLm1vZGVsLmdldCgnY2hhdGxvZycpLmVhY2goZnVuY3Rpb24oY2hhdCkge1xuICAgICAgdGhpcy5yZW5kZXJDaGF0KGNoYXQpO1xuICAgIH0sIHRoaXMpO1xuXG4vLyB0aGVzZSB0aGluZ3Mgc2hvdWxkIG5vdCBiZSBoZXJlXG4gICAgYXV0b3NpemUoJCgndGV4dGFyZWEubWVzc2FnZS1pbnB1dCcpKTtcbiAgICB0aGlzLmRhdGVEaXZpZGVyLmxvYWQodGhpcywgJChcIi5mb2xsb3dNZUJhclwiKSk7XG4gIH0sXG4gIHJlbmRlckNoYXQ6IGZ1bmN0aW9uKG1vZGVsKSB7XG5cbiAgICAvLyBkZWxldGUgaW4gcHJvZHVjdGlvblxuICAgIGlmIChtb2RlbC5hdHRyaWJ1dGVzLnVybCA9PT0gJycgfHwgbW9kZWwuYXR0cmlidXRlcy51cmwgPT09IG51bGwgfHwgbW9kZWwuYXR0cmlidXRlcy51cmwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgbW9kZWwuYXR0cmlidXRlcy51cmwgPSAnJztcbiAgICB9XG5cbiAgICB0aGlzLnJlbmRlckRhdGVEaXZpZGVycyhtb2RlbCk7XG4gICAgdmFyIGNoYXRUZW1wbGF0ZSA9ICQodGhpcy5jaGF0VGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICBjaGF0VGVtcGxhdGUuYXBwZW5kVG8odGhpcy4kKCcjY2hhdGJveC1jb250ZW50JykpLmhpZGUoKS5mYWRlSW4oKS5zbGlkZURvd24oKTtcbiAgICAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcbiAgfSxcbiAgcmVuZGVyRGF0ZURpdmlkZXJzOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHRoaXMuY3VycmVudERhdGUgPSBtb21lbnQobW9kZWwuYXR0cmlidXRlcy50aW1lc3RhbXApLmZvcm1hdCgnZGRkZCwgTU1NTSBEbyBZWVlZJyk7XG4gICAgaWYgKCB0aGlzLmN1cnJlbnREYXRlICE9PSB0aGlzLnByZXZpb3VzRGF0ZSApIHtcbiAgICAgIHZhciBjdXJyZW50RGF0ZSA9ICQodGhpcy5kYXRlVGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICAgIGN1cnJlbnREYXRlLmFwcGVuZFRvKHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpKS5oaWRlKCkuZmFkZUluKCkuc2xpZGVEb3duKCk7XG4gICAgICB0aGlzLnByZXZpb3VzRGF0ZSA9IHRoaXMuY3VycmVudERhdGU7XG4gICAgfVxuICAgICAgICAgICAgdGhpcy5jaGF0SW1hZ2VWaWV3LnNldEVsZW1lbnQoJCgnI2NoYXRJbWFnZVVwbG9hZENvbnRhaW5lcicpKTtcbiAgfSxcblxuXG5cblxuLy8gcmVuYW1lXG4gIHVwZGF0ZUlucHV0OiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgIGRlYnVnZ2VyO1xuICAgIHZhciBjaGF0SW1hZ2UgPSBuZXcgYXBwLkNoYXRNb2RlbChyZXNwb25zZSk7XG4gICAgY29uc29sZS5sb2coJ2ltZyB1cmw6ICcsIHJlc3BvbnNlKTtcbiAgICB0aGlzLnZlbnQudHJpZ2dlcihcImNoYXRcIiwgcmVzcG9uc2UpO1xuICAgIC8vIHRoaXMucmVuZGVyQ2hhdChjaGF0SW1hZ2UpO1xuICAgIC8vICQoJyNjaGF0SW1hZ2VVcGxvYWQnKS52YWwocmVzcG9uc2UudXJsKTtcbiAgICAvLyB0aGlzLmNyZWF0ZURhdGEoKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG4gICAgfSwgMTAwMCk7XG4gIH0sXG5cblxuXG5cblxuICAvLyByZW5kZXJzIG9uIGV2ZW50cywgY2FsbGVkIGp1c3QgYWJvdmVcbiAgcmVuZGVyUm9vbXM6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5yZW5kZXJSb29tcycpO1xuICAgIGNvbnNvbGUubG9nKCdDSEFUUk9PTVM6ICcsIHRoaXMubW9kZWwuZ2V0KFwiY2hhdHJvb21zXCIpKTtcbiAgICB0aGlzLiQoJy5wdWJsaWMtcm9vbXMnKS5lbXB0eSgpO1xuICAgIHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbXMnKS5lYWNoKGZ1bmN0aW9uIChyb29tKSB7XG4gICAgICB0aGlzLnJlbmRlclJvb20ocm9vbSk7XG4gICAgfSwgdGhpcyk7XG4gIH0sXG4gIHJlbmRlclJvb206IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gXy50ZW1wbGF0ZSgkKFwiI3Jvb20tbGlzdC10ZW1wbGF0ZVwiKS5odG1sKCkpO1xuICAgIHRoaXMuJCgnLnB1YmxpYy1yb29tcycpLmFwcGVuZCh0ZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICB9LFxuXG4gIGpvaW5Sb29tOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLmpvaW5Sb29tJyk7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoJ2pvaW5Sb29tJywgbmFtZSk7XG4gIH0sXG5cblxuXG5cblxuXG5cbiAgLy9ldmVudHNcbiAgbWVzc2FnZUlucHV0UHJlc3NlZDogZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzICYmICQudHJpbSgkKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgpKS5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBmdW4gZmFjdDogc2VwYXJhdGUgZXZlbnRzIHdpdGggYSBzcGFjZSBpbiB0cmlnZ2VyJ3MgZmlyc3QgYXJnIGFuZCB5b3VcbiAgICAgIC8vIGNhbiB0cmlnZ2VyIG11bHRpcGxlIGV2ZW50cy5cbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiY2hhdFwiLCB7IG1lc3NhZ2U6IHRoaXMuJCgnLm1lc3NhZ2UtaW5wdXQnKS52YWwoKX0pO1xuICAgICAgdGhpcy4kKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgnJyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwidHlwaW5nXCIpO1xuICAgICAgY29uc29sZS5sb2coJ3d1dCcpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgc2V0Um9vbTogZnVuY3Rpb24oZSkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5zZXRSb29tJyk7XG4gICAgdmFyICR0YXIgPSAkKGUudGFyZ2V0KTtcbiAgICBpZiAoJHRhci5pcygncCcpKSB7XG4gICAgICB0aGlzLmpvaW5Sb29tKCR0YXIuZGF0YSgncm9vbScpKTtcbiAgICB9XG4gIH0sXG5cblxuICBkYXRlRGl2aWRlcjogKGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyICR3aW5kb3cgPSAkKHdpbmRvdyksXG4gICAgJHN0aWNraWVzLFxuICAgICR2aWV3O1xuXG4gICAgbG9hZCA9IGZ1bmN0aW9uKHZpZXcsIHN0aWNraWVzKSB7XG5cbiAgICAgICR2aWV3ID0gdmlldztcblxuICAgICAgJHN0aWNraWVzID0gc3RpY2tpZXMuZWFjaChmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgJHRoaXNTdGlja3kgPSAkKHRoaXMpLndyYXAoJzxkaXYgY2xhc3M9XCJmb2xsb3dXcmFwIHJvd1wiIC8+Jyk7XG5cbiAgICAgICAgJHRoaXNTdGlja3lcbiAgICAgICAgLmRhdGEoJ29yaWdpbmFsUG9zaXRpb24nLCAkdGhpc1N0aWNreS5vZmZzZXQoKS50b3ApXG4gICAgICAgIC5kYXRhKCdvcmlnaW5hbEhlaWdodCcsICR0aGlzU3RpY2t5Lm91dGVySGVpZ2h0KCkpXG4gICAgICAgIC5wYXJlbnQoKVxuICAgICAgICAuaGVpZ2h0KCR0aGlzU3RpY2t5Lm91dGVySGVpZ2h0KCkpO1xuICAgICAgICBjb25zb2xlLmxvZygndGhpc3N0aWNreS5vcmlnaW5hbHBvc2l0aW9uJywgJHRoaXNTdGlja3kub2Zmc2V0KCkudG9wKTtcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAkKCcjY2hhdGJveC1jb250ZW50Jykuc2Nyb2xsKHNjcm9sbFN0aWNraWVzSW5pdCk7XG5cbiAgICB9O1xuXG5cbiAgICBzY3JvbGxTdGlja2llc0luaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICQodGhpcykub2ZmKFwic2Nyb2xsLnN0aWNraWVzXCIpO1xuICAgICAgJCh0aGlzKS5vbihcInNjcm9sbC5zdGlja2llc1wiLCBfLmRlYm91bmNlKF93aGVuU2Nyb2xsaW5nLCAxNTApKTtcbiAgICB9O1xuXG5cbiAgICBfd2hlblNjcm9sbGluZyA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAkc3RpY2tpZXMuZWFjaChmdW5jdGlvbihpLCBzdGlja3kpIHtcblxuICAgICAgICB2YXIgJHRoaXNTdGlja3kgPSAkKHN0aWNreSksXG4gICAgICAgICR0aGlzU3RpY2t5VG9wID0gJHRoaXNTdGlja3kub2Zmc2V0KCkudG9wLFxuICAgICAgICAkdGhpc1N0aWNreVBvc2l0aW9uID0gJHRoaXNTdGlja3kuZGF0YSgnb3JpZ2luYWxQb3NpdGlvbicpLFxuXG4gICAgICAgICRwcmV2U3RpY2t5ID0gJHN0aWNraWVzLmVxKGkgLSAxKSxcbiAgICAgICAgJHByZXZTdGlja3lUb3AgPSAkcHJldlN0aWNreS5vZmZzZXQoKS50b3AsXG4gICAgICAgICRwcmV2U3RpY2t5UG9zaXRpb24gPSAkcHJldlN0aWNreS5kYXRhKCdvcmlnaW5hbFBvc2l0aW9uJyk7XG5cblxuICAgICAgICBpZiAoJHRoaXNTdGlja3lUb3AgPD0gMTU3KSB7XG5cbiAgICAgICAgICB2YXIgJG5leHRTdGlja3kgPSAkc3RpY2tpZXMuZXEoaSArIDEpLFxuXG4gICAgICAgICAgJHRoaXNTdGlja3lQb3NpdGlvbiA9ICR0aGlzU3RpY2t5LmRhdGEoJ29yaWdpbmFsUG9zaXRpb24nKSxcbiAgICAgICAgICAkdGhpc0FuZFByZXZTdGlja3lEaWZmZXJlbmNlID0gTWF0aC5hYnMoJHByZXZTdGlja3lQb3NpdGlvbiAtICR0aGlzU3RpY2t5UG9zaXRpb24pO1xuXG4gICAgICAgICAgJHRoaXNTdGlja3kuYWRkQ2xhc3MoXCJmaXhlZFwiKTtcblxuICAgICAgICAgIC8vIHZhciAkbmV4dFN0aWNreVBvc2l0aW9uID0gJG5leHRTdGlja3kuZGF0YSgnb3JpZ2luYWxQb3NpdGlvbicpO1xuICAgICAgICAgIC8vIHZhciAkdGhpc0FuZE5leHRTdGlja3lEaWZmZXJlbmNlID0gTWF0aC5hYnMoJHRoaXNTdGlja3lQb3NpdGlvbiAtICRuZXh0U3RpY2t5UG9zaXRpb24pO1xuICAgICAgICAgIC8vIHZhciAkbmV4dFN0aWNreVRvcCA9ICRuZXh0U3RpY2t5Lm9mZnNldCgpLnRvcDtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLScpO1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdwcmV2c3RpY2t5b3JpZ2lucG9zaXRpb24nLCAkc3RpY2tpZXMuZXEoaSAtIDEpLmRhdGEoJ29yaWdpbmFsUG9zaXRpb24nKSk7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJ3ByZXZzdGlja3l0b3AnLCAkc3RpY2tpZXMuZXEoaSAtIDEpLm9mZnNldCgpLnRvcCk7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJyR0aGlzQW5kUHJldlN0aWNreURpZmZlcmVuY2UnLCBNYXRoLmFicygkdGhpc1N0aWNreVBvc2l0aW9uIC0gJHN0aWNraWVzLmVxKGkgLSAxKS5kYXRhKCdvcmlnaW5hbFBvc2l0aW9uJykpKTtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZygndGhpc1N0aWNreVRvcCcsICR0aGlzU3RpY2t5Lm9mZnNldCgpLnRvcCk7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJyR0aGlzQW5kTmV4dFN0aWNreURpZmZlcmVuY2UnLCBNYXRoLmFicygkdGhpc1N0aWNreVBvc2l0aW9uIC0gJG5leHRTdGlja3lQb3NpdGlvbikpO1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCduZXh0U3RpY2t5VG9wJywgJG5leHRTdGlja3kub2Zmc2V0KCkudG9wKTtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZygnbmV4dHN0aWNreW9yaWdpbnBvc2l0aW9uJywgJG5leHRTdGlja3kuZGF0YSgnb3JpZ2luYWxQb3NpdGlvbicpKTtcbiAgICAgICAgICAvLyAvLyBjb25zb2xlLmxvZygncHJldicsICRwcmV2U3RpY2t5KTtcbiAgICAgICAgICAvLyAvLyBjb25zb2xlLmxvZygndGhpcycsICR0aGlzU3RpY2t5KTtcbiAgICAgICAgICAvLyAvLyBjb25zb2xlLmxvZygnbmV4dCcsICRuZXh0U3RpY2t5KTtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLScpO1xuICAgICAgICBcbiAgICAgICAgICAvL3Njcm9sbGluZyB1cFxuICAgICAgICAgIGlmICgkbmV4dFN0aWNreS5oYXNDbGFzcyhcImZpeGVkXCIpKSB7XG4gICAgICAgICAgICAkbmV4dFN0aWNreS5yZW1vdmVDbGFzcyhcImZpeGVkXCIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgLy8gc2Nyb2xsaW5nIHVwIGFuZCBzdGlja2luZyB0byBwcm9wZXIgcG9zaXRpb25cbiAgICAgICAgICBpZiAoJHByZXZTdGlja3lUb3AgKyAkdGhpc0FuZFByZXZTdGlja3lEaWZmZXJlbmNlID4gMTU3ICYmIGkgIT09IDApIHtcbiAgICAgICAgICAgICRuZXh0U3RpY2t5LnJlbW92ZUNsYXNzKFwiZml4ZWRcIik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCRwcmV2U3RpY2t5VG9wID49IDE1NyAmJiAkcHJldlN0aWNreS5oYXNDbGFzcyhcImZpeGVkXCIpICYmIGkgIT09IDApIHtcbiAgICAgICAgICAgICRwcmV2U3RpY2t5LnJlbW92ZUNsYXNzKFwiZml4ZWRcIik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gc2Nyb2xsaW5nIGRvd25cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgIGlmICgkcHJldlN0aWNreVRvcCA+PSAxNTcgJiYgJHByZXZTdGlja3kuaGFzQ2xhc3MoXCJmaXhlZFwiKSAmJiBpICE9PSAwKSB7XG4gICAgICAgICAgICAkdGhpc1N0aWNreS5yZW1vdmVDbGFzcyhcImZpeGVkXCIpO1xuICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCQoJyNjaGF0Ym94LWNvbnRlbnQnKS5zY3JvbGxUb3AoKSA9PT0gMCkge1xuICAgICAgICAgIC8vICR2aWV3LmdldE1vcmVDaGF0cygpO1xuICAgICAgICAgICRzdGlja2llcy5yZW1vdmVDbGFzcygnZml4ZWQnKTtcbiAgICAgICAgfVxuXG4gICAgICB9KTtcblxuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgbG9hZDogbG9hZFxuICAgIH07XG4gIH0pKClcblxuXG5cblxufSk7XG5cbn0pKGpRdWVyeSk7IiwiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5DaGF0cm9vbUxpc3QgPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG4gICAgbW9kZWw6IGFwcC5DaGF0cm9vbU1vZGVsLFxuICAgIHVybDogJy9hcGkvY2hhdHJvb21zJyxcbiAgfSk7XG5cbn0pKCk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuXG4oZnVuY3Rpb24oJCkge1xuXG4gIGFwcC5DaGF0SW1hZ2VWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuXG4gICAgZWw6ICQoJyNjaGF0SW1hZ2VVcGxvYWRDb250YWluZXInKSxcbiAgXG4gICAgZXZlbnRzOiB7XG4gICAgICAnY2hhbmdlICNjaGF0SW1hZ2VVcGxvYWQnOiAncmVuZGVyVGh1bWInLFxuICAgICAgJ2F0dGFjaEltYWdlICNjaGF0SW1hZ2VVcGxvYWRGb3JtJzogJ3VwbG9hZCcsXG4gICAgICAnY2xpY2sgI2FkZENoYXRJbWFnZUJ0bic6ICdzdWJtaXQnLFxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5yZW5kZXJUaHVtYigpO1xuICAgIH0sXG5cbiAgICByZW5kZXJUaHVtYjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaW5wdXQgPSB0aGlzLiQoJyNjaGF0SW1hZ2VVcGxvYWQnKTtcbiAgICAgIHZhciBpbWcgPSB0aGlzLiQoJyN1cGxvYWRlZENoYXRJbWFnZScpWzBdO1xuICAgICAgaWYoaW5wdXQudmFsKCkgIT09ICcnKSB7XG4gICAgICAgIHZhciBzZWxlY3RlZF9maWxlID0gaW5wdXRbMF0uZmlsZXNbMF07XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICByZWFkZXIub25sb2FkID0gKGZ1bmN0aW9uKGFJbWcpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgYUltZy5zcmMgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkoaW1nKTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoIHNlbGVjdGVkX2ZpbGUgKTtcbiAgICAgIH1cblxuICAgIH0sXG5cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMuJGZvcm0gPSB0aGlzLiQoJyNjaGF0SW1hZ2VVcGxvYWRGb3JtJyk7XG4gICAgICB0aGlzLiRmb3JtLnRyaWdnZXIoJ2F0dGFjaEltYWdlJyk7XG4gICAgfSxcblxuICAgIHVwbG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEodGhpcy4kZm9ybVswXSk7XG4gICAgICBpZiAodGhpcy4kKCcjY2hhdEltYWdlVXBsb2FkJylbMF0uZmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICB1cmw6ICcvYXBpL3VwbG9hZENoYXRJbWFnZScsXG4gICAgICAgICAgZGF0YTogZm9ybURhdGEsXG4gICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgIGNvbnRlbnRUeXBlOiBmYWxzZSxcbiAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oIHhociApIHtcbiAgICAgICAgICAgIF90aGlzLnJlbmRlclN0YXR1cygnRXJyb3I6ICcgKyB4aHIuc3RhdHVzKTtcbiAgICAgICAgICAgIGFsZXJ0KCdZb3VyIGltYWdlIGlzIGVpdGhlciB0b28gbGFyZ2Ugb3IgaXQgaXMgbm90IGEgLmpwZWcsIC5wbmcsIG9yIC5naWYuJyk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiggcmVzcG9uc2UgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnaW1nVXBsb2FkIHJlc3BvbnNlOiAnLCByZXNwb25zZSk7XG4gICAgICAgICAgICBfdGhpcy50cmlnZ2VyKCdpbWFnZS11cGxvYWRlZCcsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdpbWdVcGxvYWQgcGF0aCAnLCByZXNwb25zZS5wYXRoKTtcbiAgICAgICAgICAgICQoJyNjaGF0SW1hZ2VVcGxvYWRNb2RhbCcpLm1vZGFsKCdoaWRlJyk7XG4gICAgICAgICAgICBfdGhpcy5jbGVhckZpZWxkKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgdGhpcy50cmlnZ2VyKCdpbWFnZS11cGxvYWRlZCcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICByZW5kZXJTdGF0dXM6IGZ1bmN0aW9uKCBzdGF0dXMgKSB7XG4gICAgICAkKCcjc3RhdHVzJykudGV4dChzdGF0dXMpO1xuICAgIH0sXG5cbiAgICBjbGVhckZpZWxkOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJCgnI3VwbG9hZGVkQ2hhdEltYWdlJylbMF0uc3JjID0gJyc7XG4gICAgICB0aGlzLiQoJyNjaGF0SW1hZ2VVcGxvYWQnKS52YWwoJycpO1xuICAgIH1cblxuICB9KTtcblxufSkoalF1ZXJ5KTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuICBhcHAuTmF2YmFyVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBlbDogJy5sb2dpbi1tZW51JyxcbiAgICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZShcIjx1bCBjbGFzcz0nbmF2IG5hdmJhci1yaWdodCc+PCUgaWYgKHVzZXJuYW1lKSB7ICU+PGxpPkhlbGxvLCA8JT0gdXNlcm5hbWUgJT48L2xpPjxsaT48YSBocmVmPScvJz48aSBjbGFzcz0nZmEgZmEtcG93ZXItb2ZmIHBvd2VyLW9mZi1zdHlsZSBmYS0yeCc+PC9pPjwvYT48L2xpPjwlIH0gZWxzZSB7ICU+PGxpPjxhIGhyZWY9JyNsb2cnPmxvZ2luPC9hPjwvbGk+PGxpPjxhIGhyZWY9JyNyZWcnPnJlZ2lzdGVyPC9hPjwvbGk+PCUgfSAlPjwvdWw+XCIpLFxuICAgIGV2ZW50czoge1xuICAgICAgXG4gICAgfSxcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMubW9kZWwgPSBuZXcgYXBwLlVzZXJNb2RlbCh7IHVzZXJuYW1lOiAnJyB9KTtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiY2hhbmdlXCIsIHRoaXMucmVuZGVyLCB0aGlzKTtcbiAgICB9LFxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUodGhpcy5tb2RlbC50b0pTT04oKSkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuXG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5SZWdpc3RlclZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI3JlZ2lzdGVyJykuaHRtbCgpKSxcbiAgICBldmVudHM6IHtcbiAgICAgIFwiY2xpY2sgI3NpZ25VcEJ0blwiOiBcInNpZ25VcFwiXG4gICAgfSxcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSgpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc2lnblVwOiBmdW5jdGlvbigpIHtcbiAgICB9XG4gIH0pO1xuXG59KShqUXVlcnkpOyIsIlxuLy8gVGhlIENoYXRDbGllbnQgaXMgaW1wbGVtZW50ZWQgb24gbWFpbi5qcy5cbi8vIFRoZSBjaGF0Y2xpZW50IGlzIGEgY29uc3RydWN0b3IgZnVuY3Rpb24gb24gdGhlIE1haW5Db250cm9sbGVyLlxuLy8gSXQgYm90aCBsaXN0ZW5zIHRvIGFuZCBlbWl0cyBldmVudHMgb24gdGhlIHNvY2tldCwgZWc6XG4vLyBJdCBoYXMgaXRzIG93biBtZXRob2RzIHRoYXQsIHdoZW4gY2FsbGVkLCBlbWl0IHRvIHRoZSBzb2NrZXQgdy8gZGF0YS5cbi8vIEl0IGFsc28gc2V0cyByZXNwb25zZSBsaXN0ZW5lcnMgb24gY29ubmVjdGlvbiwgdGhlc2UgcmVzcG9uc2UgbGlzdGVuZXJzXG4vLyBsaXN0ZW4gdG8gdGhlIHNvY2tldCBhbmQgdHJpZ2dlciBldmVudHMgb24gdGhlIGFwcEV2ZW50QnVzIG9uIHRoZSBcbi8vIE1haW5Db250cm9sbGVyXG52YXIgQ2hhdENsaWVudCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0Ly8gaXMtdHlwaW5nIGhlbHBlciB2YXJpYWJsZXNcblx0dmFyIFRZUElOR19USU1FUl9MRU5HVEggPSA0MDA7IC8vIG1zXG4gIHZhciB0eXBpbmcgPSBmYWxzZTtcbiAgdmFyIGxhc3RUeXBpbmdUaW1lO1xuICBcbiAgLy8gdGhpcyB2ZW50IGhvbGRzIHRoZSBhcHBFdmVudEJ1c1xuXHRzZWxmLnZlbnQgPSBvcHRpb25zLnZlbnQ7XG5cblx0c2VsZi5ob3N0bmFtZSA9ICdodHRwOi8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xuXG4gIC8vIGNvbm5lY3RzIHRvIHNvY2tldCwgc2V0cyByZXNwb25zZSBsaXN0ZW5lcnNcblx0c2VsZi5jb25uZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuY29ubmVjdCcpO1xuXHRcdC8vIHRoaXMgaW8gbWlnaHQgYmUgYSBsaXR0bGUgY29uZnVzaW5nLi4uIHdoZXJlIGlzIGl0IGNvbWluZyBmcm9tP1xuXHRcdC8vIGl0J3MgY29taW5nIGZyb20gdGhlIHN0YXRpYyBtaWRkbGV3YXJlIG9uIHNlcnZlci5qcyBiYyBldmVyeXRoaW5nXG5cdFx0Ly8gaW4gdGhlIC9wdWJsaWMgZm9sZGVyIGhhcyBiZWVuIGF0dGFjaGVkIHRvIHRoZSBzZXJ2ZXIsIGFuZCB2aXNhXG5cdFx0Ly8gdmVyc2EuXG5cdFx0c2VsZi5zb2NrZXQgPSBpby5jb25uZWN0KHNlbGYuaG9zdG5hbWUpO1xuICAgIHNlbGYuc2V0UmVzcG9uc2VMaXN0ZW5lcnMoc2VsZi5zb2NrZXQpO1xuICB9O1xuXG4gIHNlbGYuY29ubmVjdFRvUm9vbSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5jb25uZWN0VG9Sb29tOiAnLCBuYW1lKTtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwiY29ubmVjdFRvUm9vbVwiLCBuYW1lKTtcbiAgfTtcblxuICAvLyBzZWxmLmdldENoYXRyb29tTW9kZWwgPSBmdW5jdGlvbihuYW1lKSB7XG4gIC8vICAgY29uc29sZS5sb2coJ3NjLmYuZ2V0Q2hhdHJvb21Nb2RlbDogJywgbmFtZSk7XG4gIC8vICAgc2VsZi5zb2NrZXQuZW1pdChcImdldENoYXRyb29tTW9kZWxcIiwgbmFtZSk7XG4gIC8vIH07XG5cbiAgc2VsZi5hZGRSb29tID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmFkZFJvb206ICcsIG5hbWUpO1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJhZGRSb29tXCIsIG5hbWUpO1xuICB9O1xuXG4gIHNlbGYucmVtb3ZlUm9vbSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5yZW1vdmVSb29tOiAnLCBuYW1lKTtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwicmVtb3ZlUm9vbVwiLCBuYW1lKTtcbiAgfTtcblxuICBzZWxmLmNyZWF0ZVJvb20gPSBmdW5jdGlvbihmb3JtRGF0YSkge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmNyZWF0ZVJvb206ICcsIGZvcm1EYXRhKTtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwiY3JlYXRlUm9vbVwiLCBmb3JtRGF0YSk7XG4gIH07XG5cbiAgc2VsZi5kZXN0cm95Um9vbSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5kZXN0cm95Um9vbTogJywgbmFtZSk7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcImRlc3Ryb3lSb29tXCIsIG5hbWUpO1xuICB9O1xuXG5cbi8vLy8vIFZpZXdFdmVudEJ1cyBtZXRob2RzIC8vLy9cbiAgICAvLyBtZXRob2RzIHRoYXQgZW1pdCB0byB0aGUgY2hhdHNlcnZlclxuICBzZWxmLmxvZ2luID0gZnVuY3Rpb24odXNlcikge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmxvZ2luOiAnLCB1c2VyKTtcblx0XHRzZWxmLnNvY2tldC5lbWl0KFwibG9naW5cIiwgdXNlcik7XG5cdH07XG4gIC8vIHNlbGYubG9nb3V0ID0gZnVuY3Rpb24oKSB7XG4gIC8vICAgc2VsZi5zb2NrZXQuZW1pdChcInd1dFwiKTtcbiAgLy8gfTtcblxuXG5cbiAgc2VsZi5jaGF0ID0gZnVuY3Rpb24oY2hhdCkge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmNoYXQ6ICcsIGNoYXQpO1xuXHRcdHNlbGYuc29ja2V0LmVtaXQoXCJjaGF0XCIsIGNoYXQpO1xuXHR9O1xuICBzZWxmLmdldE1vcmVDaGF0cyA9IGZ1bmN0aW9uKGNoYXRSZXEpIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KCdnZXRNb3JlQ2hhdHMnLCBjaGF0UmVxKTtcbiAgfTtcblxuXG4gIC8vIFR5cGluZyBtZXRob2RzXG5cdHNlbGYuYWRkQ2hhdFR5cGluZyA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgbWVzc2FnZSA9IGRhdGEudXNlcm5hbWUgKyAnIGlzIHR5cGluZyc7XG4gICAgJCgnLnR5cGV0eXBldHlwZScpLnRleHQobWVzc2FnZSk7XG5cdH07XG5cdHNlbGYucmVtb3ZlQ2hhdFR5cGluZyA9IGZ1bmN0aW9uKCkge1xuICAgICQoJy50eXBldHlwZXR5cGUnKS5lbXB0eSgpO1xuXHR9O1xuICBzZWxmLnVwZGF0ZVR5cGluZyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChzZWxmLnNvY2tldCkge1xuICAgICAgaWYgKCF0eXBpbmcpIHtcbiAgICAgICAgdHlwaW5nID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5zb2NrZXQuZW1pdCgndHlwaW5nJyk7XG4gICAgICB9XG4gICAgICBsYXN0VHlwaW5nVGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHlwaW5nVGltZXIgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgICB2YXIgdGltZURpZmYgPSB0eXBpbmdUaW1lciAtIGxhc3RUeXBpbmdUaW1lO1xuICAgICAgICBpZiAodGltZURpZmYgPj0gVFlQSU5HX1RJTUVSX0xFTkdUSCAmJiB0eXBpbmcpIHtcbiAgICAgICAgICAgc2VsZi5zb2NrZXQuZW1pdCgnc3RvcCB0eXBpbmcnKTtcbiAgICAgICAgICAgdHlwaW5nID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0sIFRZUElOR19USU1FUl9MRU5HVEgpO1xuICAgIH1cbiAgfTtcblxuXG4gIC8vIGpvaW4gcm9vbVxuICBzZWxmLmpvaW5Sb29tID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoJ2pvaW5Sb29tJywgbmFtZSk7XG4gIH07XG5cbiAgLy8gc2V0IHJvb21cbiAgc2VsZi5zZXRSb29tID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGlmIChuYW1lICE9PSBudWxsKSB7XG4gICAgICB0aGlzLmN1cnJlbnRSb29tID0gbmFtZTtcbiAgICB9XG4gICAgLy8vPj4+Pj4+PiBjaGFuZ2V0aGlzdG8gLmNoYXQtdGl0bGVcbiAgICB2YXIgJGNoYXRUaXRsZSA9ICQoJy5jaGF0Ym94LWhlYWRlci11c2VybmFtZScpO1xuICAgICRjaGF0VGl0bGUudGV4dChuYW1lKTtcbiAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgICQoJy5jaGF0LWRpcmVjdG9yeScpLmZpbmQoJy5yb29tJykuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgIHZhciAkcm9vbSA9ICQodGhpcyk7XG4gICAgICAkcm9vbS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgICBpZiAoJHJvb20uZGF0YSgnbmFtZScpID09PSB0aGlzXy5jdXJyZW50Um9vbSkge1xuICAgICAgICAkcm9vbS5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG4gIFxuXG5cblxuICAvLy8vLy8vLy8vLy8vLyBjaGF0c2VydmVyIGxpc3RlbmVycy8vLy8vLy8vLy8vLy9cblxuICAvLyB0aGVzZSBndXlzIGxpc3RlbiB0byB0aGUgY2hhdHNlcnZlci9zb2NrZXQgYW5kIGVtaXQgZGF0YSB0byBtYWluLmpzLFxuICAvLyBzcGVjaWZpY2FsbHkgdG8gdGhlIGFwcEV2ZW50QnVzLlxuXHRzZWxmLnNldFJlc3BvbnNlTGlzdGVuZXJzID0gZnVuY3Rpb24oc29ja2V0KSB7XG5cdFx0c29ja2V0Lm9uKCd3ZWxjb21lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgLy8gZW1pdHMgZXZlbnQgdG8gcmVjYWxpYnJhdGUgb25saW5lVXNlcnMgY29sbGVjdGlvblxuICAgICAgLy8gc29ja2V0LmVtaXQoXCJnZXRPbmxpbmVVc2Vyc1wiKTtcbiAgICAgIC8vIHNvY2tldC5lbWl0KFwicm9vbXNcIik7XG4gICAgICAvLyBkYXRhIGlzIHVuZGVmaW5lZCBhdCB0aGlzIHBvaW50IGJlY2F1c2UgaXQncyB0aGUgZmlyc3QgdG9cbiAgICAgIC8vIGZpcmUgb2ZmIGFuIGV2ZW50IGNoYWluIHRoYXQgd2lsbCBhcHBlbmQgdGhlIG5ldyB1c2VyIHRvIFxuICAgICAgLy8gdGhlIG9ubGluZVVzZXIgY29sbGVjdGlvblxuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJsb2dpbkRvbmVcIiwgZGF0YSk7XG4gICAgfSk7XG5cbiAgICBzb2NrZXQub24oJ2xvZ2luJywgZnVuY3Rpb24odXNlcm5hbWUpIHtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKCdsb2dpblVzZXInLCB1c2VybmFtZSk7XG4gICAgfSk7XG5cblxuICAgIHNvY2tldC5vbignbG9nJywgZnVuY3Rpb24oKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5sb2cnKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKCdhdXRoZW50aWNhdGVkJyk7XG4gICAgfSk7XG5cblx0XHRzb2NrZXQub24oJ3VzZXJzSW5mbycsIGZ1bmN0aW9uKHVzZXJzKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnc2MuZS51c2Vyc0luZm86ICcsIHVzZXJzKTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwidXNlcnNJbmZvXCIsIHVzZXJzKTtcblx0XHR9KTtcblxuICAgIHNvY2tldC5vbigncm9vbXMnLCBmdW5jdGlvbihjaGF0cm9vbXMpIHtcbiAgICAgIGRlYnVnZ2VyO1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUucm9vbXM6ICcsIGNoYXRyb29tcyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInJvb21JbmZvXCIsIGNoYXRyb29tcyk7XG4gICAgfSk7XG5cblxuXG5cdFx0c29ja2V0Lm9uKCd1c2VySm9pbmVkJywgZnVuY3Rpb24odXNlcm5hbWUpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdzYy5lLnVzZXJKb2luZWQ6ICcsIHVzZXJuYW1lKTtcbiAgICAgIC8vIHNvY2tldC5lbWl0KFwib25saW5lVXNlcnNcIik7XG5cdFx0XHRzZWxmLnZlbnQudHJpZ2dlcihcInVzZXJKb2luZWRcIiwgdXNlcm5hbWUpO1xuXHRcdH0pO1xuXHRcdHNvY2tldC5vbigndXNlckxlZnQnLCBmdW5jdGlvbih1c2VybmFtZSkge1xuXHRcdFx0Y29uc29sZS5sb2coJ3NjLmUudXNlckxlZnQ6ICcsIHVzZXJuYW1lKTtcbiAgICAgIC8vIHNvY2tldC5lbWl0KFwib25saW5lVXNlcnNcIik7XG5cdFx0XHRzZWxmLnZlbnQudHJpZ2dlcihcInVzZXJMZWZ0XCIsIHVzZXJuYW1lKTtcblx0XHR9KTtcblxuXG5cblx0XHRzb2NrZXQub24oJ2NoYXQnLCBmdW5jdGlvbihjaGF0KSB7XG5cdFx0XHRjb25zb2xlLmxvZygnc2MuZS5jaGF0OiAnLCBjaGF0KTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwiY2hhdFJlY2VpdmVkXCIsIGNoYXQpO1xuXHRcdH0pO1xuICAgIHNvY2tldC5vbignc2V0Um9vbScsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLnNldFJvb206ICcsIG5hbWUpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRSb29tXCIsIG5hbWUpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbignY2hhdGxvZycsIGZ1bmN0aW9uKGNoYXRsb2cpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLmNoYXRsb2c6ICcsIGNoYXRsb2cpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRDaGF0bG9nXCIsIGNoYXRsb2cpO1xuICAgIH0pO1xuICAgIC8vIHNvY2tldC5vbignQ2hhdHJvb21Nb2RlbCcsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgLy8gICAvLyBzZWxmLnZlbnQudHJpZ2dlcihcIkNoYXRyb29tTW9kZWxcIiwgbW9kZWwpO1xuICAgIC8vICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRSb29tXCIsIG1vZGVsKTtcbiAgICAvLyB9KTtcbiAgICBzb2NrZXQub24oJ2NoYXRyb29tcycsIGZ1bmN0aW9uKGNoYXRyb29tcykge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUuY2hhdHJvb21zOiAgJywgY2hhdHJvb21zKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0Q2hhdHJvb21zXCIsIGNoYXRyb29tcyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdvbmxpbmVVc2VycycsIGZ1bmN0aW9uKG9ubGluZVVzZXJzKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5vbmxpbmVVc2VyczogJywgb25saW5lVXNlcnMpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRPbmxpbmVVc2Vyc1wiLCBvbmxpbmVVc2Vycyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdjaGF0cm9vbUhlYWRlcicsIGZ1bmN0aW9uKGhlYWRlck9iaikge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUuY2hhdHJvb21IZWFkZXI6ICcsIGhlYWRlck9iaik7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldENoYXRyb29tSGVhZGVyXCIsIGhlYWRlck9iaik7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdyb29tRGVzdHJveWVkJywgZnVuY3Rpb24obmFtZSkge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUucm9vbURlc3Ryb3llZDogJywgbmFtZSk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInJvb21EZXN0cm95ZWRcIiwgbmFtZSk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdtb3JlQ2hhdHMnLCBmdW5jdGlvbihjaGF0cykge1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJtb3JlQ2hhdHNcIiwgY2hhdHMpO1xuICAgIH0pO1xuXG5cblxuICAgIHNvY2tldC5vbigndHlwaW5nJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgc2VsZi5hZGRDaGF0VHlwaW5nKGRhdGEpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbignc3RvcCB0eXBpbmcnLCBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYucmVtb3ZlQ2hhdFR5cGluZygpO1xuICAgIH0pO1xuXG5cblx0fTtcbn07IiwiXG5cbmFwcC5NYWluQ29udHJvbGxlciA9IGZ1bmN0aW9uKCkge1xuXG5cdHZhciBzZWxmID0gdGhpcztcblxuXG4gIC8vVGhlc2UgYWxsb3dzIHVzIHRvIGJpbmQgYW5kIHRyaWdnZXIgb24gdGhlIG9iamVjdCBmcm9tIGFueXdoZXJlIGluIHRoZSBhcHAuXG5cdHNlbGYuYXBwRXZlbnRCdXMgPSBfLmV4dGVuZCh7fSwgQmFja2JvbmUuRXZlbnRzKTtcblx0c2VsZi52aWV3RXZlbnRCdXMgPSBfLmV4dGVuZCh7fSwgQmFja2JvbmUuRXZlbnRzKTtcblxuXHRzZWxmLmluaXQgPSBmdW5jdGlvbigpIHtcblxuICAgIC8vIGxvZ2luTW9kZWxcbiAgICBzZWxmLmxvZ2luTW9kZWwgPSBuZXcgYXBwLkxvZ2luTW9kZWwoKTtcbiAgICBzZWxmLmxvZ2luVmlldyA9IG5ldyBhcHAuTG9naW5WaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cywgbW9kZWw6IHNlbGYubG9naW5Nb2RlbH0pO1xuICAgIHNlbGYucmVnaXN0ZXJWaWV3ID0gbmV3IGFwcC5SZWdpc3RlclZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzIH0pO1xuICAgIHNlbGYubmF2YmFyVmlldyA9IG5ldyBhcHAuTmF2YmFyVmlldygpO1xuXG4gICAgLy8gVGhlIENvbnRhaW5lck1vZGVsIGdldHMgcGFzc2VkIGEgdmlld1N0YXRlLCBMb2dpblZpZXcsIHdoaWNoXG4gICAgLy8gaXMgdGhlIGxvZ2luIHBhZ2UuIFRoYXQgTG9naW5WaWV3IGdldHMgcGFzc2VkIHRoZSB2aWV3RXZlbnRCdXNcbiAgICAvLyBhbmQgdGhlIExvZ2luTW9kZWwuXG4gICAgc2VsZi5jb250YWluZXJNb2RlbCA9IG5ldyBhcHAuQ29udGFpbmVyTW9kZWwoeyB2aWV3U3RhdGU6IHNlbGYubG9naW5WaWV3fSk7XG5cbiAgICAvLyBuZXh0LCBhIG5ldyBDb250YWluZXJWaWV3IGlzIGludGlhbGl6ZWQgd2l0aCB0aGUgbmV3bHkgY3JlYXRlZCBjb250YWluZXJNb2RlbFxuICAgIC8vIHRoZSBsb2dpbiBwYWdlIGlzIHRoZW4gcmVuZGVyZWQuXG4gICAgc2VsZi5jb250YWluZXJWaWV3ID0gbmV3IGFwcC5Db250YWluZXJWaWV3KHsgbW9kZWw6IHNlbGYuY29udGFpbmVyTW9kZWwgfSk7XG4gICAgc2VsZi5jb250YWluZXJWaWV3LnJlbmRlcigpO1xuXG4gIH07XG5cblxuICBzZWxmLmF1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICBcbiAgICAkKFwiYm9keVwiKS5jc3MoXCJvdmVyZmxvd1wiLCBcImhpZGRlblwiKTtcbiAgICBzZWxmLmNoYXRDbGllbnQgPSBuZXcgQ2hhdENsaWVudCh7IHZlbnQ6IHNlbGYuYXBwRXZlbnRCdXMgfSk7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmNvbm5lY3QoKTtcblxuICAgIC8vIG5ldyBtb2RlbCBhbmQgdmlldyBjcmVhdGVkIGZvciBjaGF0cm9vbVxuICAgIHNlbGYuY2hhdHJvb21Nb2RlbCA9IG5ldyBhcHAuQ2hhdHJvb21Nb2RlbCh7IG5hbWU6ICdET08nIH0pO1xuICAgIHNlbGYuY2hhdHJvb21MaXN0ID0gbmV3IGFwcC5DaGF0cm9vbUxpc3QoKTtcbiAgICBzZWxmLmNoYXRyb29tTGlzdC5mZXRjaCgpLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdjaGF0cm9vbXMnLCBzZWxmLmNoYXRyb29tTGlzdCk7XG4gICAgICBzZWxmLmNoYXRyb29tVmlldyAgPSBuZXcgYXBwLkNoYXRyb29tVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXMsIG1vZGVsOiBzZWxmLmNoYXRyb29tTW9kZWwgfSk7XG4gICAgICBzZWxmLmNvbnRhaW5lck1vZGVsLnNldCgndmlld1N0YXRlJywgc2VsZi5jaGF0cm9vbVZpZXcpO1xuXG4gICAgICBzZWxmLmNvbm5lY3RUb1Jvb20oKTtcbiAgICAgIHNlbGYuaW5pdFJvb20oKTtcbiAgICAgICBcbiAgICB9KTtcblxuICB9O1xuXG4gIHNlbGYuY29ubmVjdFRvUm9vbSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmNvbm5lY3RUb1Jvb20oXCJET09cIik7XG4gIH07XG5cbiAgc2VsZi5pbml0Um9vbSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgc2VsZi5jaGF0cm9vbVZpZXcuaW5pdFJvb20oKTtcbiAgfTtcblxuICBcblxuXG5cbiAgLy8gc2VsZi5hcHBFdmVudEJ1cy5vbihcImF1dGhlbnRpY2F0ZWRcIiwgZnVuY3Rpb24oKSB7XG4gIC8vICAgZGVidWdnZXI7XG4gIC8vICAgc2VsZi5hdXRoZW50aWNhdGVkKCk7XG4gIC8vIH0pO1xuXG5cblxuICAvLy8vLy8vLy8vLy8gIEJ1c3NlcyAvLy8vLy8vLy8vLy9cbiAgICAvLyBUaGVzZSBCdXNzZXMgbGlzdGVuIHRvIHRoZSBzb2NrZXRjbGllbnRcbiAgIC8vICAgIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cbiAgLy8vLyB2aWV3RXZlbnRCdXMgTGlzdGVuZXJzIC8vLy8vXG4gIFxuXHRzZWxmLnZpZXdFdmVudEJ1cy5vbihcImxvZ2luXCIsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQubG9naW4odXNlcik7XG4gIH0pO1xuXHRzZWxmLnZpZXdFdmVudEJ1cy5vbihcImNoYXRcIiwgZnVuY3Rpb24oY2hhdCkge1xuICAgIHNlbGYuY2hhdENsaWVudC5jaGF0KGNoYXQpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJ0eXBpbmdcIiwgZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LnVwZGF0ZVR5cGluZygpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJqb2luUm9vbVwiLCBmdW5jdGlvbihyb29tKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmpvaW5Sb29tKHJvb20pO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJhZGRSb29tXCIsIGZ1bmN0aW9uKHJvb20pIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuYWRkUm9vbShyb29tKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwicmVtb3ZlUm9vbVwiLCBmdW5jdGlvbihyb29tKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LnJlbW92ZVJvb20ocm9vbSk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImNyZWF0ZVJvb21cIiwgZnVuY3Rpb24oZm9ybURhdGEpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuY3JlYXRlUm9vbShmb3JtRGF0YSk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImRlc3Ryb3lSb29tXCIsIGZ1bmN0aW9uKHJvb20pIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuZGVzdHJveVJvb20ocm9vbSk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImdldE1vcmVDaGF0c1wiLCBmdW5jdGlvbihjaGF0UmVxKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmdldE1vcmVDaGF0cyhjaGF0UmVxKTtcbiAgfSk7XG5cblxuXG5cblxuXG5cblxuICAvLy8vIGFwcEV2ZW50QnVzIExpc3RlbmVycyAvLy8vXG5cblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcInVzZXJzSW5mb1wiLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgY29uc29sZS5sb2coJ21haW4uZS51c2Vyc0luZm86ICcsIGRhdGEpO1xuICAgIC8vZGF0YSBpcyBhbiBhcnJheSBvZiB1c2VybmFtZXMsIGluY2x1ZGluZyB0aGUgbmV3IHVzZXJcblx0XHQvLyBUaGlzIG1ldGhvZCBnZXRzIHRoZSBvbmxpbmUgdXNlcnMgY29sbGVjdGlvbiBmcm9tIGNoYXRyb29tTW9kZWwuXG5cdFx0Ly8gb25saW5lVXNlcnMgaXMgdGhlIGNvbGxlY3Rpb25cblx0XHR2YXIgb25saW5lVXNlcnMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KFwib25saW5lVXNlcnNcIik7XG4gICAgY29uc29sZS5sb2coXCIuLi5vbmxpbmVVc2VyczogXCIsIG9ubGluZVVzZXJzKTtcblx0XHR2YXIgdXNlcnMgPSBfLm1hcChkYXRhLCBmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRyZXR1cm4gbmV3IGFwcC5Vc2VyTW9kZWwoe3VzZXJuYW1lOiBpdGVtfSk7XG5cdFx0fSk7XG4gICAgY29uc29sZS5sb2coXCJ1c2VyczogXCIsIHVzZXJzKTtcblx0XHRvbmxpbmVVc2Vycy5yZXNldCh1c2Vycyk7XG5cdH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJyb29tSW5mb1wiLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgZGVidWdnZXI7XG4gICAgY29uc29sZS5sb2coJ21haW4uZS5yb29tSW5mbzogJywgZGF0YSk7XG4gICAgdmFyIHJvb21zID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldChcImNoYXRyb29tc1wiKTtcbiAgICAgY29uc29sZS5sb2coXCIuLi5yb29tczogXCIsIHJvb21zKTtcbiAgICB2YXIgdXBkYXRlZFJvb21zID0gXy5tYXAoZGF0YSwgZnVuY3Rpb24ocm9vbSkge1xuICAgICAgdmFyIG5ld0NoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoe25hbWU6IHJvb219KTtcbiAgICAgIHJldHVybiBuZXdDaGF0cm9vbU1vZGVsO1xuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKFwiLi4udXBkYXRlZHJvb21zOiBcIiwgdXBkYXRlZFJvb21zKTtcbiAgICByb29tcy5yZXNldCh1cGRhdGVkUm9vbXMpO1xuICB9KTtcblxuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcImxvZ2luVXNlclwiLCBmdW5jdGlvbih1c2VybmFtZSkge1xuICAgIGNvbnNvbGUubG9nKCdtYWluLmUubG9naW5Vc2VyOiAnLCB1c2VybmFtZSk7XG4gICAgdmFyIHVzZXIgPSBuZXcgYXBwLlVzZXJNb2RlbCh7dXNlcm5hbWU6IHVzZXJuYW1lfSk7XG4gICAgc2VsZi5uYXZiYXJWaWV3Lm1vZGVsLnNldCh1c2VyLnRvSlNPTigpKTtcbiAgfSk7XG5cblxuXG4gIC8vIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRSb29tXCIsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gIC8vICAgY29uc29sZS5sb2coJ21haW4uZS5zZXRSb29tOiAnLCBtb2RlbCk7XG5cbiAgLy8gICB2YXIgY2hhdGxvZyA9IG5ldyBhcHAuQ2hhdENvbGxlY3Rpb24obW9kZWwuY2hhdGxvZyk7XG4gIC8vICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnY2hhdGxvZycsIGNoYXRsb2cpO1xuXG4gIC8vICAgdmFyIHJvb21zID0gbmV3IGFwcC5DaGF0cm9vbUxpc3QobW9kZWwuY2hhdHJvb21zKTtcbiAgLy8gICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdjaGF0cm9vbXMnLCByb29tcyk7XG5cbiAgLy8gICB2YXIgdXNlcnMgPSBuZXcgYXBwLlVzZXJDb2xsZWN0aW9uKG1vZGVsLm9ubGluZVVzZXJzKTtcbiAgLy8gICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdvbmxpbmVVc2VycycsIHVzZXJzKTtcblxuICAvLyB9KTtcblxuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcIkNoYXRyb29tTW9kZWxcIiwgZnVuY3Rpb24obW9kZWwpIHtcbiAgICBjb25zb2xlLmxvZygnbWFpbi5lLkNoYXRyb29tTW9kZWw6ICcsIG1vZGVsKTtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoKTtcbiAgICBzZWxmLmNoYXRyb29tTGlzdCA9IG5ldyBhcHAuQ2hhdHJvb21MaXN0KCk7XG4gICAgc2VsZi5jaGF0cm9vbVZpZXcgID0gbmV3IGFwcC5DaGF0cm9vbVZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzLCBtb2RlbDogc2VsZi5jaGF0cm9vbU1vZGVsLCBjb2xsZWN0aW9uOiBzZWxmLmNoYXRyb29tTGlzdH0pO1xuICAgIHNlbGYuY29udGFpbmVyTW9kZWwuc2V0KCd2aWV3U3RhdGUnLCBzZWxmLmNoYXRyb29tVmlldyk7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLmxvYWRNb2RlbChtb2RlbCk7XG4gIH0pO1xuXG5cblxuICAvLyBhZGRzIG5ldyB1c2VyIHRvIHVzZXJzIGNvbGxlY3Rpb24sIHNlbmRzIGRlZmF1bHQgam9pbmluZyBtZXNzYWdlXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2VySm9pbmVkXCIsIGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdtYWluLmUudXNlckpvaW5lZDogJywgdXNlcm5hbWUpO1xuXHRcdHNlbGYuY2hhdHJvb21Nb2RlbC5hZGRVc2VyKHVzZXJuYW1lKTtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkQ2hhdCh7c2VuZGVyOiBcIkJ1dHRlcnNcIiwgbWVzc2FnZTogdXNlcm5hbWUgKyBcIiBqb2luZWQgcm9vbS5cIiB9KTtcblx0fSk7XG5cblx0Ly8gcmVtb3ZlcyB1c2VyIGZyb20gdXNlcnMgY29sbGVjdGlvbiwgc2VuZHMgZGVmYXVsdCBsZWF2aW5nIG1lc3NhZ2Vcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcInVzZXJMZWZ0XCIsIGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdtYWluLmUudXNlckxlZnQ6ICcsIHVzZXJuYW1lKTtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwucmVtb3ZlVXNlcih1c2VybmFtZSk7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLmFkZENoYXQoe3NlbmRlcjogXCJCdXR0ZXJzXCIsIG1lc3NhZ2U6IHVzZXJuYW1lICsgXCIgbGVmdCByb29tLlwiIH0pO1xuXHR9KTtcblxuXHQvLyBjaGF0IHBhc3NlZCBmcm9tIHNvY2tldGNsaWVudCwgYWRkcyBhIG5ldyBjaGF0IG1lc3NhZ2UgdXNpbmcgY2hhdHJvb21Nb2RlbCBtZXRob2Rcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcImNoYXRSZWNlaXZlZFwiLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLmFkZENoYXQoY2hhdCk7XG5cdFx0JCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG5cdH0pO1xuXG5cblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJyb29tRGVzdHJveWVkXCIsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBzZWxmLmNvbm5lY3RUb1Jvb20oKTtcbiAgICBzZWxmLmluaXRSb29tKCk7XG4gICAgYWxlcnQoJ0NoYXRyb29tICcgKyBuYW1lICsgJyBkZXN0cm95ZWQnKTtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldENoYXRyb29tSGVhZGVyXCIsIGZ1bmN0aW9uKGhlYWRlck9iaikge1xuICAgIHZhciBuZXdIZWFkZXIgPSBuZXcgYXBwLkNoYXRyb29tSGVhZGVyTW9kZWwoaGVhZGVyT2JqKTtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdjaGF0cm9vbUhlYWRlcicsIG5ld0hlYWRlcik7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRDaGF0bG9nXCIsIGZ1bmN0aW9uKGNoYXRsb2cpIHtcbiAgICB2YXIgb2xkQ2hhdGxvZyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoJ2NoYXRsb2cnKTtcbiAgICB2YXIgdXBkYXRlZENoYXRsb2cgPSBfLm1hcChjaGF0bG9nLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgICB2YXIgbmV3Q2hhdE1vZGVsID0gbmV3IGFwcC5DaGF0TW9kZWwoeyByb29tOiBjaGF0LnJvb20sIG1lc3NhZ2U6IGNoYXQubWVzc2FnZSwgc2VuZGVyOiBjaGF0LnNlbmRlciwgdGltZXN0YW1wOiBjaGF0LnRpbWVzdGFtcCwgdXJsOiBjaGF0LnVybCB9KTtcbiAgICAgIHJldHVybiBuZXdDaGF0TW9kZWw7XG4gICAgfSk7XG4gICAgb2xkQ2hhdGxvZy5yZXNldCh1cGRhdGVkQ2hhdGxvZyk7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJtb3JlQ2hhdHNcIiwgZnVuY3Rpb24oY2hhdGxvZykge1xuICAgIHZhciBvbGRDaGF0bG9nID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldCgnY2hhdGxvZycpO1xuICAgIGRlYnVnZ2VyO1xuICAgIHZhciBtb3JlQ2hhdGxvZyA9IF8ubWFwKGNoYXRsb2csIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICAgIHZhciBuZXdDaGF0TW9kZWwgPSBuZXcgYXBwLkNoYXRNb2RlbCh7IHJvb206IGNoYXQucm9vbSwgbWVzc2FnZTogY2hhdC5tZXNzYWdlLCBzZW5kZXI6IGNoYXQuc2VuZGVyLCB0aW1lc3RhbXA6IGNoYXQudGltZXN0YW1wLCB1cmw6IGNoYXQudXJsIH0pO1xuICAgICAgcmV0dXJuIG5ld0NoYXRNb2RlbDtcbiAgICB9KTtcbiAgICBkZWJ1Z2dlcjtcbiAgICBvbGRDaGF0bG9nLnB1c2gobW9yZUNoYXRsb2cpO1xuICB9KTtcbiAgXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRDaGF0cm9vbXNcIiwgZnVuY3Rpb24oY2hhdHJvb21zKSB7XG4gICAgdmFyIG9sZENoYXRyb29tcyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoJ2NoYXRyb29tcycpO1xuICAgIHZhciB1cGRhdGVkQ2hhdHJvb21zID0gXy5tYXAoY2hhdHJvb21zLCBmdW5jdGlvbihjaGF0cm9vbSkge1xuICAgICAgdmFyIG5ld0NoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoeyBuYW1lOiBjaGF0cm9vbS5uYW1lLCBvd25lcjogY2hhdHJvb20ub3duZXJ9KTtcbiAgICAgIHJldHVybiBuZXdDaGF0cm9vbU1vZGVsO1xuICAgIH0pO1xuICAgIG9sZENoYXRyb29tcy5yZXNldCh1cGRhdGVkQ2hhdHJvb21zKTtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldE9ubGluZVVzZXJzXCIsIGZ1bmN0aW9uKG9ubGluZVVzZXJzKSB7XG4gICAgdmFyIG9sZE9ubGluZVVzZXJzID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldCgnb25saW5lVXNlcnMnKTtcbiAgICB2YXIgdXBkYXRlZE9ubGluZVVzZXJzID0gXy5tYXAob25saW5lVXNlcnMsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgIHZhciBuZXdVc2VyTW9kZWwgPSBuZXcgYXBwLlVzZXJNb2RlbCh7dXNlcm5hbWU6IHVzZXIudXNlcm5hbWV9KTtcbiAgICAgIHJldHVybiBuZXdVc2VyTW9kZWw7XG4gICAgfSk7XG4gICAgb2xkT25saW5lVXNlcnMucmVzZXQodXBkYXRlZE9ubGluZVVzZXJzKTtcbiAgfSk7XG5cblxufTtcblxuIiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICAkKHdpbmRvdykuYmluZCgnYmVmb3JldW5sb2FkJywgZnVuY3Rpb24oZXZlbnRPYmplY3QpIHtcbiAgICAkLmFqYXgoe1xuICAgICAgIHVybDogXCIvbG9nb3V0XCIsXG4gICAgfSk7XG4gIH0pO1xuXG4gIHZhciBDaGF0cm9vbVJvdXRlciA9IEJhY2tib25lLlJvdXRlci5leHRlbmQoe1xuICAgIFxuICAgIHJvdXRlczoge1xuICAgICAgJyc6ICdzdGFydCcsXG4gICAgICAnbG9nJzogJ2xvZ2luJyxcbiAgICAgICdyZWcnOiAncmVnaXN0ZXInLFxuICAgICAgJ291dCc6ICdvdXQnLFxuICAgICAgJ2F1dGhlbnRpY2F0ZWQnOiAnYXV0aGVudGljYXRlZCcsXG4gICAgICAnZmFjZWJvb2snOiAnZmFjZWJvb2snLFxuICAgICAgJ3R3aXR0ZXInOiAndHdpdHRlcidcbiAgICB9LFxuXG4gICAgc3RhcnQ6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICcvIyc7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIgPSBuZXcgYXBwLk1haW5Db250cm9sbGVyKCk7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIuaW5pdCgpO1xuICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgIHVybDogXCIvbG9nb3V0XCIsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0sXG5cblxuICAgIGxvZ2luOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBsb2dpbk1vZGVsID0gbmV3IGFwcC5Mb2dpbk1vZGVsKCk7XG4gICAgICB2YXIgbG9naW5WaWV3ID0gbmV3IGFwcC5Mb2dpblZpZXcoe3ZlbnQ6IGFwcC5tYWluQ29udHJvbGxlci52aWV3RXZlbnRCdXMsIG1vZGVsOiBsb2dpbk1vZGVsfSk7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIuY29udGFpbmVyTW9kZWwuc2V0KFwidmlld1N0YXRlXCIsIGxvZ2luVmlldyk7XG4gICAgfSxcblxuICAgIHJlZ2lzdGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciByZWdpc3RlclZpZXcgPSBuZXcgYXBwLlJlZ2lzdGVyVmlldyh7dmVudDogYXBwLm1haW5Db250cm9sbGVyLnZpZXdFdmVudEJ1cyB9KTtcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlci5jb250YWluZXJNb2RlbC5zZXQoXCJ2aWV3U3RhdGVcIiwgcmVnaXN0ZXJWaWV3KTtcbiAgICB9LFxuXG4gICAgb3V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICB1cmw6IFwiL2xvZ291dFwiLFxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICBhdXRoZW50aWNhdGVkOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghYXBwLm1haW5Db250cm9sbGVyKSB7IHJldHVybiB0aGlzLnN0YXJ0KCk7IH1cbiAgICAgIGFwcC5tYWluQ29udHJvbGxlci5hdXRoZW50aWNhdGVkKCk7XG4gICAgfSxcbiAgICBmYWNlYm9vazogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnN0YXJ0KHRoaXMuYXV0aGVudGljYXRlZCk7XG4gICAgfSxcbiAgICB0d2l0dGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuc3RhcnQodGhpcy5hdXRoZW50aWNhdGVkKTtcbiAgICB9LFxuXG4gIH0pO1xuXG4gIGFwcC5DaGF0cm9vbVJvdXRlciA9IG5ldyBDaGF0cm9vbVJvdXRlcigpO1xuICBCYWNrYm9uZS5oaXN0b3J5LnN0YXJ0KCk7XG5cbn0pKCk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9