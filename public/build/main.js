
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
    offlineUsers: new app.UserCollection(),
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
  roomTemplate: _.template($("#room-list-template").html()),
  headerTemplate: _.template($('#chatroom-header-template').html()),
  onlineUserTemplate: _.template($('#online-users-list-template').html()),
  offlineUserTemplate: _.template($('#offline-users-list-template').html()),
  dateTemplate: _.template('<div class="followMeBar col-xs-12 col-sm-12 col-md-12"><span>-----------------</span><span> <%= moment(timestamp).format("dddd, MMMM Do YYYY") %> </span><span>-----------------</span></div>'),
  events: {
    'keypress .message-input': 'messageInputPressed',
    'click .chat-directory .room': 'setRoom',
    'keypress #chat-search-input': 'search',
    'click .remove-chatroom': 'removeRoom',
    'click #createChatroomBtn': 'createRoom',
    'click #destroy-chatroom': 'destroyRoom',
  },
  initialize: function(options) {
    console.log('chatroomView.f.initialize: ', options);
    // passed the viewEventBus
    var self = this;
    this.vent = options.vent;
  },
  render: function(model) {
    console.log('crv.f.render');
    this.model = model || this.model;
    this.$el.html(this.template(this.model.toJSON()));
    this.afterRender();
    return this;
  },
  afterRender: function() {
    this.setSubViews();
    this.setChatListeners();
    this.chatroomSearchTypeahead();
  },
  setSubViews: function() {
    this.chatImageUploadView = new app.ChatImageUploadView();
  },
  setChatListeners: function() {

    var onlineUsers = this.model.get('onlineUsers');
    this.listenTo(onlineUsers, "add", this.renderUser, this);
    this.listenTo(onlineUsers, "remove", this.renderUsers, this);
    this.listenTo(onlineUsers, "reset", this.renderUsers, this);

    var offlineUsers = this.model.get('offlineUsers');
    this.listenTo(offlineUsers, "add", this.renderOfflineUser, this);
    this.listenTo(offlineUsers, "remove", this.renderOfflineUsers, this);
    this.listenTo(offlineUsers, "reset", this.renderOfflineUsers, this);

    var chatlog = this.model.get('chatlog');
    this.listenTo(chatlog, "add", this.renderChat, this);
    this.listenTo(chatlog, "remove", this.renderChats, this);
    this.listenTo(chatlog, "reset", this.renderChats, this);

    var chatrooms = this.model.get('chatrooms');
    this.listenTo(chatrooms, "add", this.renderRoom, this);
    this.listenTo(chatrooms, "remove", this.renderRooms, this);
    this.listenTo(chatrooms, "reset", this.renderRooms, this);

    this.listenTo(this.model, "change:chatroom", this.renderHeader, this);

    this.listenTo(this.chatImageUploadView, 'image-uploaded', this.uploadImage);

    this.listenTo(this.model, "moreChats", this.renderMoreChats, this);

    var this_ = this;
    this.$('#chatbox-content').scroll(function(){
        // checks if there's enough chats to warrant a getMoreChats call
      if ($('#chatbox-content').scrollTop() === 0 && this_.model.get('chatlog').length >= 25) {
        _.debounce(this_.getMoreChats(), 3000);
      }
    });

  },

  chatroomSearchTypeahead: function() {

    // interesting - the 'this' makes a difference, can't find #chat-search-input otherwise
    this.$('#chat-search-input').typeahead({
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
          return data;
        }
      },
    });

  },



// header

  renderHeader: function() {
    this.$('#chatbox-header').html(this.headerTemplate(this.model.get('chatroom').toJSON()));
  },




// users

  renderUsers: function() {
    console.log('crv.f.renderUsers');
    console.log('USERS: ', this.model.get("onlineUsers"));
    this.$('.online-users').empty();
    this.model.get("onlineUsers").each(function (user) {
      this.renderUser(user);
    }, this);
  },
  renderUser: function(model) {
    this.$('.online-users').append(this.onlineUserTemplate(model.toJSON()));
  },
  renderOfflineUsers: function() {
    console.log('crv.f.renderOfflineUsers');
    console.log('Offline USERS: ', this.model.get("offlineUsers"));
    this.$('.offline-users').empty();
    this.model.get("offlineUsers").each(function (user) {
      this.renderOfflineUser(user);
    }, this);
  },
  renderOfflineUser: function(model) {
    this.$('.offline-users').append(this.offlineUserTemplate(model.toJSON()));
  },





// chatlog

  renderChats: function() {
    console.log('crv.f.renderChats');
    console.log('CHATLOG: ', this.model.get("chatlog"));
    this.$('#chatbox-content').empty();
    this.model.get('chatlog').each(function(chat) {
      this.renderChat(chat);
    }, this);

    this.afterChatsRender();
  },

  renderChat: function(model) {
    this.renderDateDividers(model);
    var chatTemplate = $(this.chatTemplate(model.toJSON()));
    chatTemplate.appendTo(this.$('#chatbox-content')).hide().fadeIn().slideDown();
    $('#chatbox-content')[0].scrollTop = $('#chatbox-content')[0].scrollHeight;
  },

  renderDateDividers: function(model) {
    this.currentDate = moment(model.get('timestamp')).format('dddd, MMMM Do YYYY');
    if ( this.currentDate !== this.previousDate ) {
      var currentDate = $(this.dateTemplate(model.toJSON()));
      currentDate.appendTo(this.$('#chatbox-content')).hide().fadeIn().slideDown();
      this.previousDate = this.currentDate;
    }
  },

  getMoreChats: function() {
    console.log('crv.f.getMoreChats');
    var chatroom = this.model.get('chatroom'),
    name = chatroom.get('name'),
    numberLoaded = chatroom.get('numberLoaded'),
    chatlogLength = chatroom.get('chatlogLength');
    this.vent.trigger('getMoreChats', { name: name, numberLoaded: numberLoaded, chatlogLength: chatlogLength});
    chatroom.set('numberLoaded', (numberLoaded - 1));
  },

  renderMoreChats: function(chats) {
    console.log('crv.f.renderMoreChats');
    // this.$('#chatbox-content');
    var this_ = this;
    var originalHeight = $('#chatbox-content')[0].scrollHeight;
    this.moreChatCollection = [];
    _.each(chats, function(model) {
      this_.renderMoreDateDividers(model);
      var chatTemplate = $(this.chatTemplate(model.toJSON()));
      this_.moreChatCollection.push(chatTemplate);
      // chatTemplate.prependTo(this.$('#chatbox-content')).hide().fadeIn().slideDown();
    }, this);
    _.each(this.moreChatCollection.reverse(), function(template) {
      template.prependTo(this.$('#chatbox-content'));
    });

     this.dateDivider.load($(".followMeBar"));
     $('#chatbox-content')[0].scrollTop = $('#chatbox-content')[0].scrollHeight - originalHeight;
     
  },

   renderMoreDateDividers: function(model) {
    this.currentDate = moment(model.attributes.timestamp).format('dddd, MMMM Do YYYY');
    if ( this.currentDate !== this.previousDate ) {
      var currentDate = $(this.dateTemplate(model.toJSON()));
      // currentDate.appendTo(this.$('#chatbox-content')).hide().fadeIn().slideDown();
      this.moreChatCollection.push(currentDate);
      this.previousDate = this.currentDate;
    }
  },

  autosizer: function() {
    autosize($('#message-input'));
  },
  
  scrollBottomInsurance: function(){
    var interval = setInterval(function(){
      this.$('#chatbox-content')[0].scrollTop = this.$('#chatbox-content')[0].scrollHeight;
    }, 50);
    return setTimeout(function(){
      clearInterval(interval);
    }, 800);
  },

  afterChatsRender: function() {
    this.autosizer();
    this.dateDivider.load($(".followMeBar"));
    this.scrollBottomInsurance();
  },








// rooms


  search: function(e) {
    if (e.keyCode === 13 && $.trim($('#chat-search-input').val()).length > 0) {
      e.preventDefault();
      var name = $('#chat-search-input').val();
      this.addChatroom(name);
    } else {
      console.log('search typing');
    }
    return this;
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

  destroyRoom: function(e) {
    confirm("As the owner of this room, you may destroy the room. Do you wish to destroy the room?");
    e.preventDefault();
    this.vent.trigger('destroyRoom', this.model.get('chatroom').get('name'));
  },

  addChatroom: function(name) {
    console.log('crv.f.addChatroom');
    this.vent.trigger('addRoom', name);
  },

  removeRoom: function(e) {
    confirm('Are you sure you want to remove this chatroom?');
    var name = $(e.target).data("room-name");
    this.vent.trigger('removeRoom', name);
  },

  renderRooms: function() {
    console.log('crv.f.renderRooms');
    console.log('CHATROOMS: ', this.model.get("chatrooms"));
    this.$('.public-rooms').empty();
    this.model.get('chatrooms').each(function (room) {
      this.renderRoom(room);
    }, this);
  },

  renderRoom: function(model) {
    this.$('.public-rooms').append(this.roomTemplate(model.toJSON()));
  },

  joinRoom: function(name) {
    console.log('crv.f.joinRoom');
    this.currentDate = '';
    this.previousDate = '';
    this.vent.trigger('joinRoom', name);
  },




// image upload

 uploadImage: function(response) {
    console.log('img url: ', response);
    this.vent.trigger("chat", response);
    this.scrollBottomInsurance();
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
        $thisStickyPosition = $thisSticky.data('originalPosition'),

        $prevSticky = $stickies.eq(i - 1),
        $prevStickyTop = $prevSticky.offset().top,
        $prevStickyPosition = $prevSticky.data('originalPosition'),

        $thisAndPrevStickyDifference = Math.abs($prevStickyPosition - $thisStickyPosition);

        if ($thisStickyTop <= 157) {

          var $nextSticky = $stickies.eq(i + 1);
          // debugger;

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

          //           if ($prevSticky.hasClass("fixed")) {
          //   $prevSticky.removeClass("fixed");
          // }

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

  app.ChatImageUploadView = Backbone.View.extend({

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
    socket.on('offlineUsers', function(offlineUsers) {
      console.log('sc.e.offlineUsers: ', offlineUsers);
      self.vent.trigger("setOfflineUsers", offlineUsers);
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
    socket.on('noMoreChats', function() {
      self.vent.trigger("noMoreChats");
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
      // self.initRoom();
       
    });

  };

  self.connectToRoom = function(callback) {
    self.chatClient.connectToRoom("DOO");
  };

  // self.initRoom = function(callback) {
  //   self.chatroomView.initRoom();
  // };

  




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

	// self.appEventBus.on("usersInfo", function(data) {
 //    console.log('main.e.usersInfo: ', data);
 //    //data is an array of usernames, including the new user
	// 	// This method gets the online users collection from chatroomModel.
	// 	// onlineUsers is the collection
	// 	var onlineUsers = self.chatroomModel.get("onlineUsers");
 //    console.log("...onlineUsers: ", onlineUsers);
	// 	var users = _.map(data, function(item) {
	// 		return new app.UserModel({username: item});
	// 	});
 //    console.log("users: ", users);
	// 	onlineUsers.reset(users);
	// });

 //  self.appEventBus.on("roomInfo", function(data) {
 //    debugger;
 //    console.log('main.e.roomInfo: ', data);
 //    var rooms = self.chatroomModel.get("chatrooms");
 //     console.log("...rooms: ", rooms);
 //    var updatedRooms = _.map(data, function(room) {
 //      var newChatroomModel = new app.ChatroomModel({name: room});
 //      return newChatroomModel;
 //    });
 //    console.log("...updatedrooms: ", updatedRooms);
 //    rooms.reset(updatedRooms);
 //  });



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
    // self.initRoom();
    alert('Chatroom ' + name + ' destroyed');
  });

  self.appEventBus.on("setChatroomHeader", function(headerObj) {
    var newHeader = new app.ChatroomHeaderModel(headerObj);
    self.chatroomModel.set('chatroom', newHeader);
  });

  self.appEventBus.on("setChatlog", function(chatlog) {
    var oldChatlog = self.chatroomModel.get('chatlog');
    var updatedChatlog = _.map(chatlog, function(chat) {
      var newChatModel = new app.ChatModel({ room: chat.room, message: chat.message, sender: chat.sender, timestamp: chat.timestamp, url: chat.url });
      return newChatModel;
    });
    oldChatlog.reset(updatedChatlog);


    $('#chatbox-content')[0].scrollTop = $('#chatbox-content')[0].scrollHeight;
  });

  self.appEventBus.on("moreChats", function(chatlog) {
    var oldChatlog = self.chatroomModel.get('chatlog');
    var moreChatlog = _.map(chatlog, function(chat) {
      var newChatModel = new app.ChatModel({ room: chat.room, message: chat.message, sender: chat.sender, timestamp: chat.timestamp, url: chat.url });
      return newChatModel;
    });
    //
    //
    //
    //
    //
    self.chatroomModel.trigger('moreChats', moreChatlog);
    // oldChatlog.push(moreChatlog);
  });

  self.appEventBus.on("noMoreChats", function(chatlog) {
    self.chatroomModel.stopListening('moreChats');
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

  self.appEventBus.on("setOfflineUsers", function(offlineUsers) {
    var oldOfflineUsers = self.chatroomModel.get('offlineUsers');
    var updatedOfflineUsers = _.map(offlineUsers, function(user) {
      var newUserModel = new app.UserModel({username: user.username});
      return newUserModel;
    });
    oldOfflineUsers.reset(updatedOfflineUsers);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYXQuanMiLCJjaGF0cm9vbS1oZWFkZXIuanMiLCJjb250YWluZXIuanMiLCJsb2dpbi5qcyIsInVzZXIuanMiLCJjaGF0cm9vbS5qcyIsInJvb20uanMiLCJpbWFnZVVwbG9hZC5qcyIsIm5hdmJhci5qcyIsInJlZ2lzdGVyLmpzIiwic29ja2V0Y2xpZW50LmpzIiwibWFpbi5qcyIsInJvdXRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUpQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBSVRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QURWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBSHhjQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBS2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUpsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FLbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN1FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuQ2hhdENvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG4gICAgbW9kZWw6IGFwcC5DaGF0TW9kZWxcbiAgfSk7XG5cbn0pKCk7IiwiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5DaGF0cm9vbUhlYWRlck1vZGVsID0gQmFja2JvbmUuTW9kZWwuZXh0ZW5kKHt9KTtcblxufSkoKTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuICBhcHAuQ29udGFpbmVyVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBlbDogJyN2aWV3LWNvbnRhaW5lcicsXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdGhpcy5tb2RlbC5vbihcImNoYW5nZTp2aWV3U3RhdGVcIiwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB2aWV3ID0gdGhpcy5tb2RlbC5nZXQoJ3ZpZXdTdGF0ZScpO1xuICAgICAgdGhpcy4kZWwuaHRtbCh2aWV3LnJlbmRlcigpLmVsKTtcbiAgICB9XG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5Mb2dpblZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2xvZ2luJykuaHRtbCgpKSxcbiAgICBldmVudHM6IHtcbiAgICAgICdzdWJtaXQnOiAnb25Mb2dpbicsXG4gICAgICAna2V5cHJlc3MnOiAnb25IaXRFbnRlcidcbiAgICB9LFxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAvLyBMb2dpblZpZXcgZ2V0cyBwYXNzZWQgdGhlIHZpZXdFdmVudEJ1cyB3aGVuIHRoZSBNYWluQ29udHJvbGxlciBpcyBpbml0aWFsaXplZFxuICAgICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xuXG4gICAgLy8gVGhpcyB0ZWxscyB0aGUgdmlldyB0byBsaXN0ZW4gdG8gYW4gZXZlbnQgb24gaXRzIG1vZGVsLFxuICAgIC8vIGlmIHRoZXJlJ3MgYW4gZXJyb3IsIHRoZSBjYWxsYmFjayAodGhpcy5yZW5kZXIpIGlzIGNhbGxlZCB3aXRoIHRoZSAgXG4gICAgLy8gdmlldyBhcyBjb250ZXh0XG4gICAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiY2hhbmdlOmVycm9yXCIsIHRoaXMucmVuZGVyLCB0aGlzKTtcbiAgICB9LFxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUodGhpcy5tb2RlbC50b0pTT04oKSkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBvbkxvZ2luOiBmdW5jdGlvbihlKSB7XG4gICAgICAvLyB0cmlnZ2VycyB0aGUgbG9naW4gZXZlbnQgYW5kIHBhc3NpbmcgdGhlIHVzZXJuYW1lIGRhdGEgdG8ganMvbWFpbi5qc1xuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAkLmFqYXgoe1xuICAgICAgICB1cmw6IFwiL2xvZ2luXCIsXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBkYXRhOiB7dXNlcm5hbWU6IHRoaXMuJCgnI3VzZXJuYW1lJykudmFsKCksIHBhc3N3b3JkOiB0aGlzLiQoJyNwYXNzd29yZCcpLnZhbCgpfSxcbiAgICAgICAgc3VjY2VzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICBjb25zb2xlLmxvZygnc3VjY2VzcyBkYXRhOiAnLCBkYXRhKTtcbiAgICAgICAgICAgaWYgKGRhdGEgPT09IDIwMCkge1xuICAgICAgICAgICAgIC8vIHRoaXNfLnZlbnQudHJpZ2dlcignYXV0aGVudGljYXRlZCcpO1xuICAgICAgICAgICAgYXBwLkNoYXRyb29tUm91dGVyLm5hdmlnYXRlKCdhdXRoZW50aWNhdGVkJywgeyB0cmlnZ2VyOiB0cnVlIH0pO1xuICAgICAgICAgICAgdGhpc18udmVudC50cmlnZ2VyKFwibG9naW5cIiwge3VzZXJuYW1lOiB0aGlzXy4kKCcjdXNlcm5hbWUnKS52YWwoKSwgcGFzc3dvcmQ6IHRoaXNfLiQoJyNwYXNzd29yZCcpLnZhbCgpfSk7XG4gICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSkuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2RvbmVlZWVlZWVlJyk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIC8vIG9uSGl0RW50ZXI6IGZ1bmN0aW9uKGUpIHtcbiAgICAvLyAgIGlmKGUua2V5Q29kZSA9PSAxMykge1xuICAgIC8vICAgICB0aGlzLm9uTG9naW4oKTtcbiAgICAvLyAgICAgcmV0dXJuIGZhbHNlO1xuICAgIC8vICAgfVxuICAgIC8vIH1cbiAgfSk7XG4gIFxufSkoalF1ZXJ5KTsiLCJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLlVzZXJDb2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe21vZGVsOiBhcHAuVXNlck1vZGVsfSk7XG5cbn0pKCk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbmFwcC5DaGF0cm9vbVZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gIHRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNjaGF0cm9vbS10ZW1wbGF0ZScpLmh0bWwoKSksXG4gIGNoYXRUZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjY2hhdGJveC1tZXNzYWdlLXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgcm9vbVRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoXCIjcm9vbS1saXN0LXRlbXBsYXRlXCIpLmh0bWwoKSksXG4gIGhlYWRlclRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNjaGF0cm9vbS1oZWFkZXItdGVtcGxhdGUnKS5odG1sKCkpLFxuICBvbmxpbmVVc2VyVGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI29ubGluZS11c2Vycy1saXN0LXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgb2ZmbGluZVVzZXJUZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjb2ZmbGluZS11c2Vycy1saXN0LXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgZGF0ZVRlbXBsYXRlOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwiZm9sbG93TWVCYXIgY29sLXhzLTEyIGNvbC1zbS0xMiBjb2wtbWQtMTJcIj48c3Bhbj4tLS0tLS0tLS0tLS0tLS0tLTwvc3Bhbj48c3Bhbj4gPCU9IG1vbWVudCh0aW1lc3RhbXApLmZvcm1hdChcImRkZGQsIE1NTU0gRG8gWVlZWVwiKSAlPiA8L3NwYW4+PHNwYW4+LS0tLS0tLS0tLS0tLS0tLS08L3NwYW4+PC9kaXY+JyksXG4gIGV2ZW50czoge1xuICAgICdrZXlwcmVzcyAubWVzc2FnZS1pbnB1dCc6ICdtZXNzYWdlSW5wdXRQcmVzc2VkJyxcbiAgICAnY2xpY2sgLmNoYXQtZGlyZWN0b3J5IC5yb29tJzogJ3NldFJvb20nLFxuICAgICdrZXlwcmVzcyAjY2hhdC1zZWFyY2gtaW5wdXQnOiAnc2VhcmNoJyxcbiAgICAnY2xpY2sgLnJlbW92ZS1jaGF0cm9vbSc6ICdyZW1vdmVSb29tJyxcbiAgICAnY2xpY2sgI2NyZWF0ZUNoYXRyb29tQnRuJzogJ2NyZWF0ZVJvb20nLFxuICAgICdjbGljayAjZGVzdHJveS1jaGF0cm9vbSc6ICdkZXN0cm95Um9vbScsXG4gIH0sXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICBjb25zb2xlLmxvZygnY2hhdHJvb21WaWV3LmYuaW5pdGlhbGl6ZTogJywgb3B0aW9ucyk7XG4gICAgLy8gcGFzc2VkIHRoZSB2aWV3RXZlbnRCdXNcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xuICB9LFxuICByZW5kZXI6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlcicpO1xuICAgIHRoaXMubW9kZWwgPSBtb2RlbCB8fCB0aGlzLm1vZGVsO1xuICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzLm1vZGVsLnRvSlNPTigpKSk7XG4gICAgdGhpcy5hZnRlclJlbmRlcigpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBhZnRlclJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zZXRTdWJWaWV3cygpO1xuICAgIHRoaXMuc2V0Q2hhdExpc3RlbmVycygpO1xuICAgIHRoaXMuY2hhdHJvb21TZWFyY2hUeXBlYWhlYWQoKTtcbiAgfSxcbiAgc2V0U3ViVmlld3M6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY2hhdEltYWdlVXBsb2FkVmlldyA9IG5ldyBhcHAuQ2hhdEltYWdlVXBsb2FkVmlldygpO1xuICB9LFxuICBzZXRDaGF0TGlzdGVuZXJzOiBmdW5jdGlvbigpIHtcblxuICAgIHZhciBvbmxpbmVVc2VycyA9IHRoaXMubW9kZWwuZ2V0KCdvbmxpbmVVc2VycycpO1xuICAgIHRoaXMubGlzdGVuVG8ob25saW5lVXNlcnMsIFwiYWRkXCIsIHRoaXMucmVuZGVyVXNlciwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJyZW1vdmVcIiwgdGhpcy5yZW5kZXJVc2VycywgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJyZXNldFwiLCB0aGlzLnJlbmRlclVzZXJzLCB0aGlzKTtcblxuICAgIHZhciBvZmZsaW5lVXNlcnMgPSB0aGlzLm1vZGVsLmdldCgnb2ZmbGluZVVzZXJzJyk7XG4gICAgdGhpcy5saXN0ZW5UbyhvZmZsaW5lVXNlcnMsIFwiYWRkXCIsIHRoaXMucmVuZGVyT2ZmbGluZVVzZXIsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8ob2ZmbGluZVVzZXJzLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlck9mZmxpbmVVc2VycywgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhvZmZsaW5lVXNlcnMsIFwicmVzZXRcIiwgdGhpcy5yZW5kZXJPZmZsaW5lVXNlcnMsIHRoaXMpO1xuXG4gICAgdmFyIGNoYXRsb2cgPSB0aGlzLm1vZGVsLmdldCgnY2hhdGxvZycpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdGxvZywgXCJhZGRcIiwgdGhpcy5yZW5kZXJDaGF0LCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRsb2csIFwicmVtb3ZlXCIsIHRoaXMucmVuZGVyQ2hhdHMsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdGxvZywgXCJyZXNldFwiLCB0aGlzLnJlbmRlckNoYXRzLCB0aGlzKTtcblxuICAgIHZhciBjaGF0cm9vbXMgPSB0aGlzLm1vZGVsLmdldCgnY2hhdHJvb21zJyk7XG4gICAgdGhpcy5saXN0ZW5UbyhjaGF0cm9vbXMsIFwiYWRkXCIsIHRoaXMucmVuZGVyUm9vbSwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhjaGF0cm9vbXMsIFwicmVtb3ZlXCIsIHRoaXMucmVuZGVyUm9vbXMsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcInJlc2V0XCIsIHRoaXMucmVuZGVyUm9vbXMsIHRoaXMpO1xuXG4gICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImNoYW5nZTpjaGF0cm9vbVwiLCB0aGlzLnJlbmRlckhlYWRlciwgdGhpcyk7XG5cbiAgICB0aGlzLmxpc3RlblRvKHRoaXMuY2hhdEltYWdlVXBsb2FkVmlldywgJ2ltYWdlLXVwbG9hZGVkJywgdGhpcy51cGxvYWRJbWFnZSk7XG5cbiAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwibW9yZUNoYXRzXCIsIHRoaXMucmVuZGVyTW9yZUNoYXRzLCB0aGlzKTtcblxuICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgdGhpcy4kKCcjY2hhdGJveC1jb250ZW50Jykuc2Nyb2xsKGZ1bmN0aW9uKCl7XG4gICAgICAgIC8vIGNoZWNrcyBpZiB0aGVyZSdzIGVub3VnaCBjaGF0cyB0byB3YXJyYW50IGEgZ2V0TW9yZUNoYXRzIGNhbGxcbiAgICAgIGlmICgkKCcjY2hhdGJveC1jb250ZW50Jykuc2Nyb2xsVG9wKCkgPT09IDAgJiYgdGhpc18ubW9kZWwuZ2V0KCdjaGF0bG9nJykubGVuZ3RoID49IDI1KSB7XG4gICAgICAgIF8uZGVib3VuY2UodGhpc18uZ2V0TW9yZUNoYXRzKCksIDMwMDApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gIH0sXG5cbiAgY2hhdHJvb21TZWFyY2hUeXBlYWhlYWQ6IGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gaW50ZXJlc3RpbmcgLSB0aGUgJ3RoaXMnIG1ha2VzIGEgZGlmZmVyZW5jZSwgY2FuJ3QgZmluZCAjY2hhdC1zZWFyY2gtaW5wdXQgb3RoZXJ3aXNlXG4gICAgdGhpcy4kKCcjY2hhdC1zZWFyY2gtaW5wdXQnKS50eXBlYWhlYWQoe1xuICAgICAgb25TZWxlY3Q6IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgY29uc29sZS5sb2coaXRlbSk7XG4gICAgICB9LFxuICAgICAgYWpheDoge1xuICAgICAgICB1cmw6ICcvYXBpL3NlYXJjaENoYXRyb29tcycsXG4gICAgICAgIHRyaWdnZXJMZW5ndGg6IDEsXG4gICAgICAgIHByZURpc3BhdGNoOiBmdW5jdGlvbiAocXVlcnkpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmFtZTogcXVlcnlcbiAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICBwcmVQcm9jZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAgICAgIGlmIChkYXRhLnN1Y2Nlc3MgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAvLyBIaWRlIHRoZSBsaXN0LCB0aGVyZSB3YXMgc29tZSBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9KTtcblxuICB9LFxuXG5cblxuLy8gaGVhZGVyXG5cbiAgcmVuZGVySGVhZGVyOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLiQoJyNjaGF0Ym94LWhlYWRlcicpLmh0bWwodGhpcy5oZWFkZXJUZW1wbGF0ZSh0aGlzLm1vZGVsLmdldCgnY2hhdHJvb20nKS50b0pTT04oKSkpO1xuICB9LFxuXG5cblxuXG4vLyB1c2Vyc1xuXG4gIHJlbmRlclVzZXJzOiBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYucmVuZGVyVXNlcnMnKTtcbiAgICBjb25zb2xlLmxvZygnVVNFUlM6ICcsIHRoaXMubW9kZWwuZ2V0KFwib25saW5lVXNlcnNcIikpO1xuICAgIHRoaXMuJCgnLm9ubGluZS11c2VycycpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoXCJvbmxpbmVVc2Vyc1wiKS5lYWNoKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICB0aGlzLnJlbmRlclVzZXIodXNlcik7XG4gICAgfSwgdGhpcyk7XG4gIH0sXG4gIHJlbmRlclVzZXI6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdGhpcy4kKCcub25saW5lLXVzZXJzJykuYXBwZW5kKHRoaXMub25saW5lVXNlclRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gIH0sXG4gIHJlbmRlck9mZmxpbmVVc2VyczogZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlck9mZmxpbmVVc2VycycpO1xuICAgIGNvbnNvbGUubG9nKCdPZmZsaW5lIFVTRVJTOiAnLCB0aGlzLm1vZGVsLmdldChcIm9mZmxpbmVVc2Vyc1wiKSk7XG4gICAgdGhpcy4kKCcub2ZmbGluZS11c2VycycpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoXCJvZmZsaW5lVXNlcnNcIikuZWFjaChmdW5jdGlvbiAodXNlcikge1xuICAgICAgdGhpcy5yZW5kZXJPZmZsaW5lVXNlcih1c2VyKTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyT2ZmbGluZVVzZXI6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdGhpcy4kKCcub2ZmbGluZS11c2VycycpLmFwcGVuZCh0aGlzLm9mZmxpbmVVc2VyVGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgfSxcblxuXG5cblxuXG4vLyBjaGF0bG9nXG5cbiAgcmVuZGVyQ2hhdHM6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5yZW5kZXJDaGF0cycpO1xuICAgIGNvbnNvbGUubG9nKCdDSEFUTE9HOiAnLCB0aGlzLm1vZGVsLmdldChcImNoYXRsb2dcIikpO1xuICAgIHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoJ2NoYXRsb2cnKS5lYWNoKGZ1bmN0aW9uKGNoYXQpIHtcbiAgICAgIHRoaXMucmVuZGVyQ2hhdChjaGF0KTtcbiAgICB9LCB0aGlzKTtcblxuICAgIHRoaXMuYWZ0ZXJDaGF0c1JlbmRlcigpO1xuICB9LFxuXG4gIHJlbmRlckNoYXQ6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdGhpcy5yZW5kZXJEYXRlRGl2aWRlcnMobW9kZWwpO1xuICAgIHZhciBjaGF0VGVtcGxhdGUgPSAkKHRoaXMuY2hhdFRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gICAgY2hhdFRlbXBsYXRlLmFwcGVuZFRvKHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpKS5oaWRlKCkuZmFkZUluKCkuc2xpZGVEb3duKCk7XG4gICAgJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG4gIH0sXG5cbiAgcmVuZGVyRGF0ZURpdmlkZXJzOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHRoaXMuY3VycmVudERhdGUgPSBtb21lbnQobW9kZWwuZ2V0KCd0aW1lc3RhbXAnKSkuZm9ybWF0KCdkZGRkLCBNTU1NIERvIFlZWVknKTtcbiAgICBpZiAoIHRoaXMuY3VycmVudERhdGUgIT09IHRoaXMucHJldmlvdXNEYXRlICkge1xuICAgICAgdmFyIGN1cnJlbnREYXRlID0gJCh0aGlzLmRhdGVUZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICAgICAgY3VycmVudERhdGUuYXBwZW5kVG8odGhpcy4kKCcjY2hhdGJveC1jb250ZW50JykpLmhpZGUoKS5mYWRlSW4oKS5zbGlkZURvd24oKTtcbiAgICAgIHRoaXMucHJldmlvdXNEYXRlID0gdGhpcy5jdXJyZW50RGF0ZTtcbiAgICB9XG4gIH0sXG5cbiAgZ2V0TW9yZUNoYXRzOiBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYuZ2V0TW9yZUNoYXRzJyk7XG4gICAgdmFyIGNoYXRyb29tID0gdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tJyksXG4gICAgbmFtZSA9IGNoYXRyb29tLmdldCgnbmFtZScpLFxuICAgIG51bWJlckxvYWRlZCA9IGNoYXRyb29tLmdldCgnbnVtYmVyTG9hZGVkJyksXG4gICAgY2hhdGxvZ0xlbmd0aCA9IGNoYXRyb29tLmdldCgnY2hhdGxvZ0xlbmd0aCcpO1xuICAgIHRoaXMudmVudC50cmlnZ2VyKCdnZXRNb3JlQ2hhdHMnLCB7IG5hbWU6IG5hbWUsIG51bWJlckxvYWRlZDogbnVtYmVyTG9hZGVkLCBjaGF0bG9nTGVuZ3RoOiBjaGF0bG9nTGVuZ3RofSk7XG4gICAgY2hhdHJvb20uc2V0KCdudW1iZXJMb2FkZWQnLCAobnVtYmVyTG9hZGVkIC0gMSkpO1xuICB9LFxuXG4gIHJlbmRlck1vcmVDaGF0czogZnVuY3Rpb24oY2hhdHMpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYucmVuZGVyTW9yZUNoYXRzJyk7XG4gICAgLy8gdGhpcy4kKCcjY2hhdGJveC1jb250ZW50Jyk7XG4gICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICB2YXIgb3JpZ2luYWxIZWlnaHQgPSAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuICAgIHRoaXMubW9yZUNoYXRDb2xsZWN0aW9uID0gW107XG4gICAgXy5lYWNoKGNoYXRzLCBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgdGhpc18ucmVuZGVyTW9yZURhdGVEaXZpZGVycyhtb2RlbCk7XG4gICAgICB2YXIgY2hhdFRlbXBsYXRlID0gJCh0aGlzLmNoYXRUZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICAgICAgdGhpc18ubW9yZUNoYXRDb2xsZWN0aW9uLnB1c2goY2hhdFRlbXBsYXRlKTtcbiAgICAgIC8vIGNoYXRUZW1wbGF0ZS5wcmVwZW5kVG8odGhpcy4kKCcjY2hhdGJveC1jb250ZW50JykpLmhpZGUoKS5mYWRlSW4oKS5zbGlkZURvd24oKTtcbiAgICB9LCB0aGlzKTtcbiAgICBfLmVhY2godGhpcy5tb3JlQ2hhdENvbGxlY3Rpb24ucmV2ZXJzZSgpLCBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuICAgICAgdGVtcGxhdGUucHJlcGVuZFRvKHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpKTtcbiAgICB9KTtcblxuICAgICB0aGlzLmRhdGVEaXZpZGVyLmxvYWQoJChcIi5mb2xsb3dNZUJhclwiKSk7XG4gICAgICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0IC0gb3JpZ2luYWxIZWlnaHQ7XG4gICAgIFxuICB9LFxuXG4gICByZW5kZXJNb3JlRGF0ZURpdmlkZXJzOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHRoaXMuY3VycmVudERhdGUgPSBtb21lbnQobW9kZWwuYXR0cmlidXRlcy50aW1lc3RhbXApLmZvcm1hdCgnZGRkZCwgTU1NTSBEbyBZWVlZJyk7XG4gICAgaWYgKCB0aGlzLmN1cnJlbnREYXRlICE9PSB0aGlzLnByZXZpb3VzRGF0ZSApIHtcbiAgICAgIHZhciBjdXJyZW50RGF0ZSA9ICQodGhpcy5kYXRlVGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICAgIC8vIGN1cnJlbnREYXRlLmFwcGVuZFRvKHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpKS5oaWRlKCkuZmFkZUluKCkuc2xpZGVEb3duKCk7XG4gICAgICB0aGlzLm1vcmVDaGF0Q29sbGVjdGlvbi5wdXNoKGN1cnJlbnREYXRlKTtcbiAgICAgIHRoaXMucHJldmlvdXNEYXRlID0gdGhpcy5jdXJyZW50RGF0ZTtcbiAgICB9XG4gIH0sXG5cbiAgYXV0b3NpemVyOiBmdW5jdGlvbigpIHtcbiAgICBhdXRvc2l6ZSgkKCcjbWVzc2FnZS1pbnB1dCcpKTtcbiAgfSxcbiAgXG4gIHNjcm9sbEJvdHRvbUluc3VyYW5jZTogZnVuY3Rpb24oKXtcbiAgICB2YXIgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpe1xuICAgICAgdGhpcy4kKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gdGhpcy4kKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuICAgIH0sIDUwKTtcbiAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgfSwgODAwKTtcbiAgfSxcblxuICBhZnRlckNoYXRzUmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmF1dG9zaXplcigpO1xuICAgIHRoaXMuZGF0ZURpdmlkZXIubG9hZCgkKFwiLmZvbGxvd01lQmFyXCIpKTtcbiAgICB0aGlzLnNjcm9sbEJvdHRvbUluc3VyYW5jZSgpO1xuICB9LFxuXG5cblxuXG5cblxuXG5cbi8vIHJvb21zXG5cblxuICBzZWFyY2g6IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMyAmJiAkLnRyaW0oJCgnI2NoYXQtc2VhcmNoLWlucHV0JykudmFsKCkpLmxlbmd0aCA+IDApIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHZhciBuYW1lID0gJCgnI2NoYXQtc2VhcmNoLWlucHV0JykudmFsKCk7XG4gICAgICB0aGlzLmFkZENoYXRyb29tKG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZygnc2VhcmNoIHR5cGluZycpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBjcmVhdGVSb29tOiBmdW5jdGlvbihlKSB7XG4gICAgdmFyIGZvcm1EYXRhID0ge307XG4gICAgdGhpcy4kKCcjY3JlYXRlQ2hhdHJvb21Gb3JtJykuY2hpbGRyZW4oICdpbnB1dCcgKS5lYWNoKGZ1bmN0aW9uKGksIGVsKSB7XG4gICAgICBpZiAoJChlbCkudmFsKCkgIT09ICcnKSB7XG4gICAgICAgIGZvcm1EYXRhWyQoZWwpLmRhdGEoJ2NyZWF0ZScpXSA9ICQoZWwpLnZhbCgpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMudmVudC50cmlnZ2VyKCdjcmVhdGVSb29tJywgZm9ybURhdGEpO1xuICB9LFxuXG4gIGRlc3Ryb3lSb29tOiBmdW5jdGlvbihlKSB7XG4gICAgY29uZmlybShcIkFzIHRoZSBvd25lciBvZiB0aGlzIHJvb20sIHlvdSBtYXkgZGVzdHJveSB0aGUgcm9vbS4gRG8geW91IHdpc2ggdG8gZGVzdHJveSB0aGUgcm9vbT9cIik7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHRoaXMudmVudC50cmlnZ2VyKCdkZXN0cm95Um9vbScsIHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbScpLmdldCgnbmFtZScpKTtcbiAgfSxcblxuICBhZGRDaGF0cm9vbTogZnVuY3Rpb24obmFtZSkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5hZGRDaGF0cm9vbScpO1xuICAgIHRoaXMudmVudC50cmlnZ2VyKCdhZGRSb29tJywgbmFtZSk7XG4gIH0sXG5cbiAgcmVtb3ZlUm9vbTogZnVuY3Rpb24oZSkge1xuICAgIGNvbmZpcm0oJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byByZW1vdmUgdGhpcyBjaGF0cm9vbT8nKTtcbiAgICB2YXIgbmFtZSA9ICQoZS50YXJnZXQpLmRhdGEoXCJyb29tLW5hbWVcIik7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoJ3JlbW92ZVJvb20nLCBuYW1lKTtcbiAgfSxcblxuICByZW5kZXJSb29tczogZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlclJvb21zJyk7XG4gICAgY29uc29sZS5sb2coJ0NIQVRST09NUzogJywgdGhpcy5tb2RlbC5nZXQoXCJjaGF0cm9vbXNcIikpO1xuICAgIHRoaXMuJCgnLnB1YmxpYy1yb29tcycpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tcycpLmVhY2goZnVuY3Rpb24gKHJvb20pIHtcbiAgICAgIHRoaXMucmVuZGVyUm9vbShyb29tKTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcblxuICByZW5kZXJSb29tOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHRoaXMuJCgnLnB1YmxpYy1yb29tcycpLmFwcGVuZCh0aGlzLnJvb21UZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICB9LFxuXG4gIGpvaW5Sb29tOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLmpvaW5Sb29tJyk7XG4gICAgdGhpcy5jdXJyZW50RGF0ZSA9ICcnO1xuICAgIHRoaXMucHJldmlvdXNEYXRlID0gJyc7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoJ2pvaW5Sb29tJywgbmFtZSk7XG4gIH0sXG5cblxuXG5cbi8vIGltYWdlIHVwbG9hZFxuXG4gdXBsb2FkSW1hZ2U6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgY29uc29sZS5sb2coJ2ltZyB1cmw6ICcsIHJlc3BvbnNlKTtcbiAgICB0aGlzLnZlbnQudHJpZ2dlcihcImNoYXRcIiwgcmVzcG9uc2UpO1xuICAgIHRoaXMuc2Nyb2xsQm90dG9tSW5zdXJhbmNlKCk7XG4gIH0sXG5cblxuXG5cblxuICAvL2V2ZW50c1xuXG5cbiAgbWVzc2FnZUlucHV0UHJlc3NlZDogZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzICYmICQudHJpbSgkKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgpKS5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBmdW4gZmFjdDogc2VwYXJhdGUgZXZlbnRzIHdpdGggYSBzcGFjZSBpbiB0cmlnZ2VyJ3MgZmlyc3QgYXJnIGFuZCB5b3VcbiAgICAgIC8vIGNhbiB0cmlnZ2VyIG11bHRpcGxlIGV2ZW50cy5cbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiY2hhdFwiLCB7IG1lc3NhZ2U6IHRoaXMuJCgnLm1lc3NhZ2UtaW5wdXQnKS52YWwoKX0pO1xuICAgICAgdGhpcy4kKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgnJyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwidHlwaW5nXCIpO1xuICAgICAgY29uc29sZS5sb2coJ3d1dCcpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgc2V0Um9vbTogZnVuY3Rpb24oZSkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5zZXRSb29tJyk7XG4gICAgdmFyICR0YXIgPSAkKGUudGFyZ2V0KTtcbiAgICBpZiAoJHRhci5pcygncCcpKSB7XG4gICAgICB0aGlzLmpvaW5Sb29tKCR0YXIuZGF0YSgncm9vbScpKTtcbiAgICB9XG4gIH0sXG5cblxuICBkYXRlRGl2aWRlcjogKGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyICR3aW5kb3cgPSAkKHdpbmRvdyksXG4gICAgJHN0aWNraWVzO1xuXG4gICAgbG9hZCA9IGZ1bmN0aW9uKHN0aWNraWVzKSB7XG5cbiAgICAgICRzdGlja2llcyA9IHN0aWNraWVzLmVhY2goZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyICR0aGlzU3RpY2t5ID0gJCh0aGlzKS53cmFwKCc8ZGl2IGNsYXNzPVwiZm9sbG93V3JhcCByb3dcIiAvPicpO1xuXG4gICAgICAgICR0aGlzU3RpY2t5XG4gICAgICAgIC5kYXRhKCdvcmlnaW5hbFBvc2l0aW9uJywgJHRoaXNTdGlja3kub2Zmc2V0KCkudG9wKVxuICAgICAgICAuZGF0YSgnb3JpZ2luYWxIZWlnaHQnLCAkdGhpc1N0aWNreS5vdXRlckhlaWdodCgpKVxuICAgICAgICAucGFyZW50KClcbiAgICAgICAgLmhlaWdodCgkdGhpc1N0aWNreS5vdXRlckhlaWdodCgpKTtcbiAgICAgICAgY29uc29sZS5sb2coJ3RoaXNzdGlja3kub3JpZ2luYWxwb3NpdGlvbicsICR0aGlzU3RpY2t5Lm9mZnNldCgpLnRvcCk7XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgJCgnI2NoYXRib3gtY29udGVudCcpLnNjcm9sbChzY3JvbGxTdGlja2llc0luaXQpO1xuXG4gICAgfTtcblxuXG4gICAgc2Nyb2xsU3RpY2tpZXNJbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAkKHRoaXMpLm9mZihcInNjcm9sbC5zdGlja2llc1wiKTtcbiAgICAgICQodGhpcykub24oXCJzY3JvbGwuc3RpY2tpZXNcIiwgXy5kZWJvdW5jZShfd2hlblNjcm9sbGluZywgMTUwKSk7XG4gICAgfTtcblxuXG4gICAgX3doZW5TY3JvbGxpbmcgPSBmdW5jdGlvbigpIHtcblxuICAgICAgJHN0aWNraWVzLmVhY2goZnVuY3Rpb24oaSwgc3RpY2t5KSB7XG5cbiAgICAgICAgdmFyICR0aGlzU3RpY2t5ID0gJChzdGlja3kpLFxuICAgICAgICAkdGhpc1N0aWNreVRvcCA9ICR0aGlzU3RpY2t5Lm9mZnNldCgpLnRvcCxcbiAgICAgICAgJHRoaXNTdGlja3lQb3NpdGlvbiA9ICR0aGlzU3RpY2t5LmRhdGEoJ29yaWdpbmFsUG9zaXRpb24nKSxcblxuICAgICAgICAkcHJldlN0aWNreSA9ICRzdGlja2llcy5lcShpIC0gMSksXG4gICAgICAgICRwcmV2U3RpY2t5VG9wID0gJHByZXZTdGlja3kub2Zmc2V0KCkudG9wLFxuICAgICAgICAkcHJldlN0aWNreVBvc2l0aW9uID0gJHByZXZTdGlja3kuZGF0YSgnb3JpZ2luYWxQb3NpdGlvbicpLFxuXG4gICAgICAgICR0aGlzQW5kUHJldlN0aWNreURpZmZlcmVuY2UgPSBNYXRoLmFicygkcHJldlN0aWNreVBvc2l0aW9uIC0gJHRoaXNTdGlja3lQb3NpdGlvbik7XG5cbiAgICAgICAgaWYgKCR0aGlzU3RpY2t5VG9wIDw9IDE1Nykge1xuXG4gICAgICAgICAgdmFyICRuZXh0U3RpY2t5ID0gJHN0aWNraWVzLmVxKGkgKyAxKTtcbiAgICAgICAgICAvLyBkZWJ1Z2dlcjtcblxuICAgICAgICAgICR0aGlzU3RpY2t5LmFkZENsYXNzKFwiZml4ZWRcIik7XG5cbiAgICAgICAgICAvLyB2YXIgJG5leHRTdGlja3lQb3NpdGlvbiA9ICRuZXh0U3RpY2t5LmRhdGEoJ29yaWdpbmFsUG9zaXRpb24nKTtcbiAgICAgICAgICAvLyB2YXIgJHRoaXNBbmROZXh0U3RpY2t5RGlmZmVyZW5jZSA9IE1hdGguYWJzKCR0aGlzU3RpY2t5UG9zaXRpb24gLSAkbmV4dFN0aWNreVBvc2l0aW9uKTtcbiAgICAgICAgICAvLyB2YXIgJG5leHRTdGlja3lUb3AgPSAkbmV4dFN0aWNreS5vZmZzZXQoKS50b3A7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJy0tLS0tLS0tLS0tLS0nKTtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZygncHJldnN0aWNreW9yaWdpbnBvc2l0aW9uJywgJHN0aWNraWVzLmVxKGkgLSAxKS5kYXRhKCdvcmlnaW5hbFBvc2l0aW9uJykpO1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdwcmV2c3RpY2t5dG9wJywgJHN0aWNraWVzLmVxKGkgLSAxKS5vZmZzZXQoKS50b3ApO1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCckdGhpc0FuZFByZXZTdGlja3lEaWZmZXJlbmNlJywgTWF0aC5hYnMoJHRoaXNTdGlja3lQb3NpdGlvbiAtICRzdGlja2llcy5lcShpIC0gMSkuZGF0YSgnb3JpZ2luYWxQb3NpdGlvbicpKSk7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJ3RoaXNTdGlja3lUb3AnLCAkdGhpc1N0aWNreS5vZmZzZXQoKS50b3ApO1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCckdGhpc0FuZE5leHRTdGlja3lEaWZmZXJlbmNlJywgTWF0aC5hYnMoJHRoaXNTdGlja3lQb3NpdGlvbiAtICRuZXh0U3RpY2t5UG9zaXRpb24pKTtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZygnbmV4dFN0aWNreVRvcCcsICRuZXh0U3RpY2t5Lm9mZnNldCgpLnRvcCk7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJ25leHRzdGlja3lvcmlnaW5wb3NpdGlvbicsICRuZXh0U3RpY2t5LmRhdGEoJ29yaWdpbmFsUG9zaXRpb24nKSk7XG4gICAgICAgICAgLy8gLy8gY29uc29sZS5sb2coJ3ByZXYnLCAkcHJldlN0aWNreSk7XG4gICAgICAgICAgLy8gLy8gY29uc29sZS5sb2coJ3RoaXMnLCAkdGhpc1N0aWNreSk7XG4gICAgICAgICAgLy8gLy8gY29uc29sZS5sb2coJ25leHQnLCAkbmV4dFN0aWNreSk7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJy0tLS0tLS0tLS0tLS0nKTtcbiAgICAgICAgXG4gICAgICAgICAgLy9zY3JvbGxpbmcgdXBcbiAgICAgICAgICBpZiAoJG5leHRTdGlja3kuaGFzQ2xhc3MoXCJmaXhlZFwiKSkge1xuICAgICAgICAgICAgJG5leHRTdGlja3kucmVtb3ZlQ2xhc3MoXCJmaXhlZFwiKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyAgICAgICAgICAgaWYgKCRwcmV2U3RpY2t5Lmhhc0NsYXNzKFwiZml4ZWRcIikpIHtcbiAgICAgICAgICAvLyAgICRwcmV2U3RpY2t5LnJlbW92ZUNsYXNzKFwiZml4ZWRcIik7XG4gICAgICAgICAgLy8gfVxuXG4gICAgICAgICAvLyBzY3JvbGxpbmcgdXAgYW5kIHN0aWNraW5nIHRvIHByb3BlciBwb3NpdGlvblxuICAgICAgICAgIGlmICgkcHJldlN0aWNreVRvcCArICR0aGlzQW5kUHJldlN0aWNreURpZmZlcmVuY2UgPiAxNTcgJiYgaSAhPT0gMCkge1xuICAgICAgICAgICAgJG5leHRTdGlja3kucmVtb3ZlQ2xhc3MoXCJmaXhlZFwiKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoJHByZXZTdGlja3lUb3AgPj0gMTU3ICYmICRwcmV2U3RpY2t5Lmhhc0NsYXNzKFwiZml4ZWRcIikgJiYgaSAhPT0gMCkge1xuICAgICAgICAgICAgJHByZXZTdGlja3kucmVtb3ZlQ2xhc3MoXCJmaXhlZFwiKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBzY3JvbGxpbmcgZG93blxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgaWYgKCRwcmV2U3RpY2t5VG9wID49IDE1NyAmJiAkcHJldlN0aWNreS5oYXNDbGFzcyhcImZpeGVkXCIpICYmIGkgIT09IDApIHtcbiAgICAgICAgICAgICR0aGlzU3RpY2t5LnJlbW92ZUNsYXNzKFwiZml4ZWRcIik7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoJCgnI2NoYXRib3gtY29udGVudCcpLnNjcm9sbFRvcCgpID09PSAwKSB7XG4gICAgICAgICAgJHN0aWNraWVzLnJlbW92ZUNsYXNzKCdmaXhlZCcpO1xuICAgICAgICB9XG5cbiAgICAgIH0pO1xuXG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICBsb2FkOiBsb2FkXG4gICAgfTtcbiAgfSkoKVxuXG5cblxuXG59KTtcblxufSkoalF1ZXJ5KTsiLCJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLkNoYXRyb29tTGlzdCA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcbiAgICBtb2RlbDogYXBwLkNoYXRyb29tTW9kZWwsXG4gICAgdXJsOiAnL2FwaS9jaGF0cm9vbXMnLFxuICB9KTtcblxufSkoKTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG5cbihmdW5jdGlvbigkKSB7XG5cbiAgYXBwLkNoYXRJbWFnZVVwbG9hZFZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG5cbiAgICBlbDogJCgnI2NoYXRJbWFnZVVwbG9hZENvbnRhaW5lcicpLFxuICBcbiAgICBldmVudHM6IHtcbiAgICAgICdjaGFuZ2UgI2NoYXRJbWFnZVVwbG9hZCc6ICdyZW5kZXJUaHVtYicsXG4gICAgICAnYXR0YWNoSW1hZ2UgI2NoYXRJbWFnZVVwbG9hZEZvcm0nOiAndXBsb2FkJyxcbiAgICAgICdjbGljayAjYWRkQ2hhdEltYWdlQnRuJzogJ3N1Ym1pdCcsXG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnJlbmRlclRodW1iKCk7XG4gICAgfSxcblxuICAgIHJlbmRlclRodW1iOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpbnB1dCA9IHRoaXMuJCgnI2NoYXRJbWFnZVVwbG9hZCcpO1xuICAgICAgdmFyIGltZyA9IHRoaXMuJCgnI3VwbG9hZGVkQ2hhdEltYWdlJylbMF07XG4gICAgICBpZihpbnB1dC52YWwoKSAhPT0gJycpIHtcbiAgICAgICAgdmFyIHNlbGVjdGVkX2ZpbGUgPSBpbnB1dFswXS5maWxlc1swXTtcbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSAoZnVuY3Rpb24oYUltZykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBhSW1nLnNyYyA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICB9O1xuICAgICAgICB9KShpbWcpO1xuICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTCggc2VsZWN0ZWRfZmlsZSApO1xuICAgICAgfVxuXG4gICAgfSxcblxuICAgIHN1Ym1pdDogZnVuY3Rpb24oZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy4kZm9ybSA9IHRoaXMuJCgnI2NoYXRJbWFnZVVwbG9hZEZvcm0nKTtcbiAgICAgIHRoaXMuJGZvcm0udHJpZ2dlcignYXR0YWNoSW1hZ2UnKTtcbiAgICB9LFxuXG4gICAgdXBsb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSh0aGlzLiRmb3JtWzBdKTtcbiAgICAgIGlmICh0aGlzLiQoJyNjaGF0SW1hZ2VVcGxvYWQnKVswXS5maWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgIHVybDogJy9hcGkvdXBsb2FkQ2hhdEltYWdlJyxcbiAgICAgICAgICBkYXRhOiBmb3JtRGF0YSxcbiAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiggeGhyICkge1xuICAgICAgICAgICAgX3RoaXMucmVuZGVyU3RhdHVzKCdFcnJvcjogJyArIHhoci5zdGF0dXMpO1xuICAgICAgICAgICAgYWxlcnQoJ1lvdXIgaW1hZ2UgaXMgZWl0aGVyIHRvbyBsYXJnZSBvciBpdCBpcyBub3QgYSAuanBlZywgLnBuZywgb3IgLmdpZi4nKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKCByZXNwb25zZSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdpbWdVcGxvYWQgcmVzcG9uc2U6ICcsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIF90aGlzLnRyaWdnZXIoJ2ltYWdlLXVwbG9hZGVkJywgcmVzcG9uc2UpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ltZ1VwbG9hZCBwYXRoICcsIHJlc3BvbnNlLnBhdGgpO1xuICAgICAgICAgICAgJCgnI2NoYXRJbWFnZVVwbG9hZE1vZGFsJykubW9kYWwoJ2hpZGUnKTtcbiAgICAgICAgICAgIF90aGlzLmNsZWFyRmllbGQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICB0aGlzLnRyaWdnZXIoJ2ltYWdlLXVwbG9hZGVkJyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIHJlbmRlclN0YXR1czogZnVuY3Rpb24oIHN0YXR1cyApIHtcbiAgICAgICQoJyNzdGF0dXMnKS50ZXh0KHN0YXR1cyk7XG4gICAgfSxcblxuICAgIGNsZWFyRmllbGQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kKCcjdXBsb2FkZWRDaGF0SW1hZ2UnKVswXS5zcmMgPSAnJztcbiAgICAgIHRoaXMuJCgnI2NoYXRJbWFnZVVwbG9hZCcpLnZhbCgnJyk7XG4gICAgfVxuXG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5OYXZiYXJWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIGVsOiAnLmxvZ2luLW1lbnUnLFxuICAgIHRlbXBsYXRlOiBfLnRlbXBsYXRlKFwiPHVsIGNsYXNzPSduYXYgbmF2YmFyLXJpZ2h0Jz48JSBpZiAodXNlcm5hbWUpIHsgJT48bGk+SGVsbG8sIDwlPSB1c2VybmFtZSAlPjwvbGk+PGxpPjxhIGhyZWY9Jy8nPjxpIGNsYXNzPSdmYSBmYS1wb3dlci1vZmYgcG93ZXItb2ZmLXN0eWxlIGZhLTJ4Jz48L2k+PC9hPjwvbGk+PCUgfSBlbHNlIHsgJT48bGk+PGEgaHJlZj0nI2xvZyc+bG9naW48L2E+PC9saT48bGk+PGEgaHJlZj0nI3JlZyc+cmVnaXN0ZXI8L2E+PC9saT48JSB9ICU+PC91bD5cIiksXG4gICAgZXZlbnRzOiB7XG4gICAgICBcbiAgICB9LFxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5tb2RlbCA9IG5ldyBhcHAuVXNlck1vZGVsKHsgdXNlcm5hbWU6ICcnIH0pO1xuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJjaGFuZ2VcIiwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzLm1vZGVsLnRvSlNPTigpKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG5cbiAgfSk7XG5cbn0pKGpRdWVyeSk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbiAgYXBwLlJlZ2lzdGVyVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjcmVnaXN0ZXInKS5odG1sKCkpLFxuICAgIGV2ZW50czoge1xuICAgICAgXCJjbGljayAjc2lnblVwQnRuXCI6IFwic2lnblVwXCJcbiAgICB9LFxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSxcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKCkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzaWduVXA6IGZ1bmN0aW9uKCkge1xuICAgIH1cbiAgfSk7XG5cbn0pKGpRdWVyeSk7IiwiXG4vLyBUaGUgQ2hhdENsaWVudCBpcyBpbXBsZW1lbnRlZCBvbiBtYWluLmpzLlxuLy8gVGhlIGNoYXRjbGllbnQgaXMgYSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBvbiB0aGUgTWFpbkNvbnRyb2xsZXIuXG4vLyBJdCBib3RoIGxpc3RlbnMgdG8gYW5kIGVtaXRzIGV2ZW50cyBvbiB0aGUgc29ja2V0LCBlZzpcbi8vIEl0IGhhcyBpdHMgb3duIG1ldGhvZHMgdGhhdCwgd2hlbiBjYWxsZWQsIGVtaXQgdG8gdGhlIHNvY2tldCB3LyBkYXRhLlxuLy8gSXQgYWxzbyBzZXRzIHJlc3BvbnNlIGxpc3RlbmVycyBvbiBjb25uZWN0aW9uLCB0aGVzZSByZXNwb25zZSBsaXN0ZW5lcnNcbi8vIGxpc3RlbiB0byB0aGUgc29ja2V0IGFuZCB0cmlnZ2VyIGV2ZW50cyBvbiB0aGUgYXBwRXZlbnRCdXMgb24gdGhlIFxuLy8gTWFpbkNvbnRyb2xsZXJcbnZhciBDaGF0Q2xpZW50ID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXG5cdHZhciBzZWxmID0gdGhpcztcblxuXHQvLyBpcy10eXBpbmcgaGVscGVyIHZhcmlhYmxlc1xuXHR2YXIgVFlQSU5HX1RJTUVSX0xFTkdUSCA9IDQwMDsgLy8gbXNcbiAgdmFyIHR5cGluZyA9IGZhbHNlO1xuICB2YXIgbGFzdFR5cGluZ1RpbWU7XG4gIFxuICAvLyB0aGlzIHZlbnQgaG9sZHMgdGhlIGFwcEV2ZW50QnVzXG5cdHNlbGYudmVudCA9IG9wdGlvbnMudmVudDtcblxuXHRzZWxmLmhvc3RuYW1lID0gJ2h0dHA6Ly8nICsgd2luZG93LmxvY2F0aW9uLmhvc3Q7XG5cbiAgLy8gY29ubmVjdHMgdG8gc29ja2V0LCBzZXRzIHJlc3BvbnNlIGxpc3RlbmVyc1xuXHRzZWxmLmNvbm5lY3QgPSBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5jb25uZWN0Jyk7XG5cdFx0Ly8gdGhpcyBpbyBtaWdodCBiZSBhIGxpdHRsZSBjb25mdXNpbmcuLi4gd2hlcmUgaXMgaXQgY29taW5nIGZyb20/XG5cdFx0Ly8gaXQncyBjb21pbmcgZnJvbSB0aGUgc3RhdGljIG1pZGRsZXdhcmUgb24gc2VydmVyLmpzIGJjIGV2ZXJ5dGhpbmdcblx0XHQvLyBpbiB0aGUgL3B1YmxpYyBmb2xkZXIgaGFzIGJlZW4gYXR0YWNoZWQgdG8gdGhlIHNlcnZlciwgYW5kIHZpc2Fcblx0XHQvLyB2ZXJzYS5cblx0XHRzZWxmLnNvY2tldCA9IGlvLmNvbm5lY3Qoc2VsZi5ob3N0bmFtZSk7XG4gICAgc2VsZi5zZXRSZXNwb25zZUxpc3RlbmVycyhzZWxmLnNvY2tldCk7XG4gIH07XG5cbiAgc2VsZi5jb25uZWN0VG9Sb29tID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmNvbm5lY3RUb1Jvb206ICcsIG5hbWUpO1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJjb25uZWN0VG9Sb29tXCIsIG5hbWUpO1xuICB9O1xuXG4gIC8vIHNlbGYuZ2V0Q2hhdHJvb21Nb2RlbCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgLy8gICBjb25zb2xlLmxvZygnc2MuZi5nZXRDaGF0cm9vbU1vZGVsOiAnLCBuYW1lKTtcbiAgLy8gICBzZWxmLnNvY2tldC5lbWl0KFwiZ2V0Q2hhdHJvb21Nb2RlbFwiLCBuYW1lKTtcbiAgLy8gfTtcblxuICBzZWxmLmFkZFJvb20gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuYWRkUm9vbTogJywgbmFtZSk7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcImFkZFJvb21cIiwgbmFtZSk7XG4gIH07XG5cbiAgc2VsZi5yZW1vdmVSb29tID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLnJlbW92ZVJvb206ICcsIG5hbWUpO1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJyZW1vdmVSb29tXCIsIG5hbWUpO1xuICB9O1xuXG4gIHNlbGYuY3JlYXRlUm9vbSA9IGZ1bmN0aW9uKGZvcm1EYXRhKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuY3JlYXRlUm9vbTogJywgZm9ybURhdGEpO1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJjcmVhdGVSb29tXCIsIGZvcm1EYXRhKTtcbiAgfTtcblxuICBzZWxmLmRlc3Ryb3lSb29tID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmRlc3Ryb3lSb29tOiAnLCBuYW1lKTtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwiZGVzdHJveVJvb21cIiwgbmFtZSk7XG4gIH07XG5cblxuLy8vLy8gVmlld0V2ZW50QnVzIG1ldGhvZHMgLy8vL1xuICAgIC8vIG1ldGhvZHMgdGhhdCBlbWl0IHRvIHRoZSBjaGF0c2VydmVyXG4gIHNlbGYubG9naW4gPSBmdW5jdGlvbih1c2VyKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYubG9naW46ICcsIHVzZXIpO1xuXHRcdHNlbGYuc29ja2V0LmVtaXQoXCJsb2dpblwiLCB1c2VyKTtcblx0fTtcbiAgLy8gc2VsZi5sb2dvdXQgPSBmdW5jdGlvbigpIHtcbiAgLy8gICBzZWxmLnNvY2tldC5lbWl0KFwid3V0XCIpO1xuICAvLyB9O1xuXG5cblxuICBzZWxmLmNoYXQgPSBmdW5jdGlvbihjaGF0KSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuY2hhdDogJywgY2hhdCk7XG5cdFx0c2VsZi5zb2NrZXQuZW1pdChcImNoYXRcIiwgY2hhdCk7XG5cdH07XG4gIHNlbGYuZ2V0TW9yZUNoYXRzID0gZnVuY3Rpb24oY2hhdFJlcSkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoJ2dldE1vcmVDaGF0cycsIGNoYXRSZXEpO1xuICB9O1xuXG5cbiAgLy8gVHlwaW5nIG1ldGhvZHNcblx0c2VsZi5hZGRDaGF0VHlwaW5nID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciBtZXNzYWdlID0gZGF0YS51c2VybmFtZSArICcgaXMgdHlwaW5nJztcbiAgICAkKCcudHlwZXR5cGV0eXBlJykudGV4dChtZXNzYWdlKTtcblx0fTtcblx0c2VsZi5yZW1vdmVDaGF0VHlwaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgJCgnLnR5cGV0eXBldHlwZScpLmVtcHR5KCk7XG5cdH07XG4gIHNlbGYudXBkYXRlVHlwaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHNlbGYuc29ja2V0KSB7XG4gICAgICBpZiAoIXR5cGluZykge1xuICAgICAgICB0eXBpbmcgPSB0cnVlO1xuICAgICAgICBzZWxmLnNvY2tldC5lbWl0KCd0eXBpbmcnKTtcbiAgICAgIH1cbiAgICAgIGxhc3RUeXBpbmdUaW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0eXBpbmdUaW1lciA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICAgIHZhciB0aW1lRGlmZiA9IHR5cGluZ1RpbWVyIC0gbGFzdFR5cGluZ1RpbWU7XG4gICAgICAgIGlmICh0aW1lRGlmZiA+PSBUWVBJTkdfVElNRVJfTEVOR1RIICYmIHR5cGluZykge1xuICAgICAgICAgICBzZWxmLnNvY2tldC5lbWl0KCdzdG9wIHR5cGluZycpO1xuICAgICAgICAgICB0eXBpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSwgVFlQSU5HX1RJTUVSX0xFTkdUSCk7XG4gICAgfVxuICB9O1xuXG5cbiAgLy8gam9pbiByb29tXG4gIHNlbGYuam9pblJvb20gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdCgnam9pblJvb20nLCBuYW1lKTtcbiAgfTtcblxuICAvLyBzZXQgcm9vbVxuICBzZWxmLnNldFJvb20gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgaWYgKG5hbWUgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuY3VycmVudFJvb20gPSBuYW1lO1xuICAgIH1cbiAgICAvLy8+Pj4+Pj4+IGNoYW5nZXRoaXN0byAuY2hhdC10aXRsZVxuICAgIHZhciAkY2hhdFRpdGxlID0gJCgnLmNoYXRib3gtaGVhZGVyLXVzZXJuYW1lJyk7XG4gICAgJGNoYXRUaXRsZS50ZXh0KG5hbWUpO1xuICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgJCgnLmNoYXQtZGlyZWN0b3J5JykuZmluZCgnLnJvb20nKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyICRyb29tID0gJCh0aGlzKTtcbiAgICAgICRyb29tLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAgIGlmICgkcm9vbS5kYXRhKCduYW1lJykgPT09IHRoaXNfLmN1cnJlbnRSb29tKSB7XG4gICAgICAgICRyb29tLmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbiAgXG5cblxuXG4gIC8vLy8vLy8vLy8vLy8vIGNoYXRzZXJ2ZXIgbGlzdGVuZXJzLy8vLy8vLy8vLy8vL1xuXG4gIC8vIHRoZXNlIGd1eXMgbGlzdGVuIHRvIHRoZSBjaGF0c2VydmVyL3NvY2tldCBhbmQgZW1pdCBkYXRhIHRvIG1haW4uanMsXG4gIC8vIHNwZWNpZmljYWxseSB0byB0aGUgYXBwRXZlbnRCdXMuXG5cdHNlbGYuc2V0UmVzcG9uc2VMaXN0ZW5lcnMgPSBmdW5jdGlvbihzb2NrZXQpIHtcblx0XHRzb2NrZXQub24oJ3dlbGNvbWUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAvLyBlbWl0cyBldmVudCB0byByZWNhbGlicmF0ZSBvbmxpbmVVc2VycyBjb2xsZWN0aW9uXG4gICAgICAvLyBzb2NrZXQuZW1pdChcImdldE9ubGluZVVzZXJzXCIpO1xuICAgICAgLy8gc29ja2V0LmVtaXQoXCJyb29tc1wiKTtcbiAgICAgIC8vIGRhdGEgaXMgdW5kZWZpbmVkIGF0IHRoaXMgcG9pbnQgYmVjYXVzZSBpdCdzIHRoZSBmaXJzdCB0b1xuICAgICAgLy8gZmlyZSBvZmYgYW4gZXZlbnQgY2hhaW4gdGhhdCB3aWxsIGFwcGVuZCB0aGUgbmV3IHVzZXIgdG8gXG4gICAgICAvLyB0aGUgb25saW5lVXNlciBjb2xsZWN0aW9uXG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcImxvZ2luRG9uZVwiLCBkYXRhKTtcbiAgICB9KTtcblxuICAgIHNvY2tldC5vbignbG9naW4nLCBmdW5jdGlvbih1c2VybmFtZSkge1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoJ2xvZ2luVXNlcicsIHVzZXJuYW1lKTtcbiAgICB9KTtcblxuXG4gICAgc29ja2V0Lm9uKCdsb2cnLCBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLmxvZycpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoJ2F1dGhlbnRpY2F0ZWQnKTtcbiAgICB9KTtcblxuXHRcdHNvY2tldC5vbigndXNlcnNJbmZvJywgZnVuY3Rpb24odXNlcnMpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdzYy5lLnVzZXJzSW5mbzogJywgdXNlcnMpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJ1c2Vyc0luZm9cIiwgdXNlcnMpO1xuXHRcdH0pO1xuXG4gICAgc29ja2V0Lm9uKCdyb29tcycsIGZ1bmN0aW9uKGNoYXRyb29tcykge1xuZGVidWdnZXI7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5yb29tczogJywgY2hhdHJvb21zKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwicm9vbUluZm9cIiwgY2hhdHJvb21zKTtcbiAgICB9KTtcblxuXG5cblx0XHRzb2NrZXQub24oJ3VzZXJKb2luZWQnLCBmdW5jdGlvbih1c2VybmFtZSkge1xuXHRcdFx0Y29uc29sZS5sb2coJ3NjLmUudXNlckpvaW5lZDogJywgdXNlcm5hbWUpO1xuICAgICAgLy8gc29ja2V0LmVtaXQoXCJvbmxpbmVVc2Vyc1wiKTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwidXNlckpvaW5lZFwiLCB1c2VybmFtZSk7XG5cdFx0fSk7XG5cdFx0c29ja2V0Lm9uKCd1c2VyTGVmdCcsIGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnc2MuZS51c2VyTGVmdDogJywgdXNlcm5hbWUpO1xuICAgICAgLy8gc29ja2V0LmVtaXQoXCJvbmxpbmVVc2Vyc1wiKTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwidXNlckxlZnRcIiwgdXNlcm5hbWUpO1xuXHRcdH0pO1xuXG5cblxuXHRcdHNvY2tldC5vbignY2hhdCcsIGZ1bmN0aW9uKGNoYXQpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdzYy5lLmNoYXQ6ICcsIGNoYXQpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJjaGF0UmVjZWl2ZWRcIiwgY2hhdCk7XG5cdFx0fSk7XG4gICAgc29ja2V0Lm9uKCdzZXRSb29tJywgZnVuY3Rpb24obmFtZSkge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUuc2V0Um9vbTogJywgbmFtZSk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldFJvb21cIiwgbmFtZSk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdjaGF0bG9nJywgZnVuY3Rpb24oY2hhdGxvZykge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUuY2hhdGxvZzogJywgY2hhdGxvZyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldENoYXRsb2dcIiwgY2hhdGxvZyk7XG4gICAgfSk7XG4gICAgLy8gc29ja2V0Lm9uKCdDaGF0cm9vbU1vZGVsJywgZnVuY3Rpb24obW9kZWwpIHtcbiAgICAvLyAgIC8vIHNlbGYudmVudC50cmlnZ2VyKFwiQ2hhdHJvb21Nb2RlbFwiLCBtb2RlbCk7XG4gICAgLy8gICBzZWxmLnZlbnQudHJpZ2dlcihcInNldFJvb21cIiwgbW9kZWwpO1xuICAgIC8vIH0pO1xuICAgIHNvY2tldC5vbignY2hhdHJvb21zJywgZnVuY3Rpb24oY2hhdHJvb21zKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5jaGF0cm9vbXM6ICAnLCBjaGF0cm9vbXMpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRDaGF0cm9vbXNcIiwgY2hhdHJvb21zKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ29ubGluZVVzZXJzJywgZnVuY3Rpb24ob25saW5lVXNlcnMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLm9ubGluZVVzZXJzOiAnLCBvbmxpbmVVc2Vycyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldE9ubGluZVVzZXJzXCIsIG9ubGluZVVzZXJzKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ29mZmxpbmVVc2VycycsIGZ1bmN0aW9uKG9mZmxpbmVVc2Vycykge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUub2ZmbGluZVVzZXJzOiAnLCBvZmZsaW5lVXNlcnMpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRPZmZsaW5lVXNlcnNcIiwgb2ZmbGluZVVzZXJzKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ2NoYXRyb29tSGVhZGVyJywgZnVuY3Rpb24oaGVhZGVyT2JqKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5jaGF0cm9vbUhlYWRlcjogJywgaGVhZGVyT2JqKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0Q2hhdHJvb21IZWFkZXJcIiwgaGVhZGVyT2JqKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ3Jvb21EZXN0cm95ZWQnLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5yb29tRGVzdHJveWVkOiAnLCBuYW1lKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwicm9vbURlc3Ryb3llZFwiLCBuYW1lKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ21vcmVDaGF0cycsIGZ1bmN0aW9uKGNoYXRzKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcIm1vcmVDaGF0c1wiLCBjaGF0cyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdub01vcmVDaGF0cycsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJub01vcmVDaGF0c1wiKTtcbiAgICB9KTtcblxuXG5cbiAgICBzb2NrZXQub24oJ3R5cGluZycsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHNlbGYuYWRkQ2hhdFR5cGluZyhkYXRhKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ3N0b3AgdHlwaW5nJywgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnJlbW92ZUNoYXRUeXBpbmcoKTtcbiAgICB9KTtcblxuXG5cdH07XG59OyIsIlxuXG5hcHAuTWFpbkNvbnRyb2xsZXIgPSBmdW5jdGlvbigpIHtcblxuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblxuICAvL1RoZXNlIGFsbG93cyB1cyB0byBiaW5kIGFuZCB0cmlnZ2VyIG9uIHRoZSBvYmplY3QgZnJvbSBhbnl3aGVyZSBpbiB0aGUgYXBwLlxuXHRzZWxmLmFwcEV2ZW50QnVzID0gXy5leHRlbmQoe30sIEJhY2tib25lLkV2ZW50cyk7XG5cdHNlbGYudmlld0V2ZW50QnVzID0gXy5leHRlbmQoe30sIEJhY2tib25lLkV2ZW50cyk7XG5cblx0c2VsZi5pbml0ID0gZnVuY3Rpb24oKSB7XG5cbiAgICAvLyBsb2dpbk1vZGVsXG4gICAgc2VsZi5sb2dpbk1vZGVsID0gbmV3IGFwcC5Mb2dpbk1vZGVsKCk7XG4gICAgc2VsZi5sb2dpblZpZXcgPSBuZXcgYXBwLkxvZ2luVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXMsIG1vZGVsOiBzZWxmLmxvZ2luTW9kZWx9KTtcbiAgICBzZWxmLnJlZ2lzdGVyVmlldyA9IG5ldyBhcHAuUmVnaXN0ZXJWaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cyB9KTtcbiAgICBzZWxmLm5hdmJhclZpZXcgPSBuZXcgYXBwLk5hdmJhclZpZXcoKTtcblxuICAgIC8vIFRoZSBDb250YWluZXJNb2RlbCBnZXRzIHBhc3NlZCBhIHZpZXdTdGF0ZSwgTG9naW5WaWV3LCB3aGljaFxuICAgIC8vIGlzIHRoZSBsb2dpbiBwYWdlLiBUaGF0IExvZ2luVmlldyBnZXRzIHBhc3NlZCB0aGUgdmlld0V2ZW50QnVzXG4gICAgLy8gYW5kIHRoZSBMb2dpbk1vZGVsLlxuICAgIHNlbGYuY29udGFpbmVyTW9kZWwgPSBuZXcgYXBwLkNvbnRhaW5lck1vZGVsKHsgdmlld1N0YXRlOiBzZWxmLmxvZ2luVmlld30pO1xuXG4gICAgLy8gbmV4dCwgYSBuZXcgQ29udGFpbmVyVmlldyBpcyBpbnRpYWxpemVkIHdpdGggdGhlIG5ld2x5IGNyZWF0ZWQgY29udGFpbmVyTW9kZWxcbiAgICAvLyB0aGUgbG9naW4gcGFnZSBpcyB0aGVuIHJlbmRlcmVkLlxuICAgIHNlbGYuY29udGFpbmVyVmlldyA9IG5ldyBhcHAuQ29udGFpbmVyVmlldyh7IG1vZGVsOiBzZWxmLmNvbnRhaW5lck1vZGVsIH0pO1xuICAgIHNlbGYuY29udGFpbmVyVmlldy5yZW5kZXIoKTtcblxuICB9O1xuXG5cbiAgc2VsZi5hdXRoZW50aWNhdGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgXG4gICAgJChcImJvZHlcIikuY3NzKFwib3ZlcmZsb3dcIiwgXCJoaWRkZW5cIik7XG4gICAgc2VsZi5jaGF0Q2xpZW50ID0gbmV3IENoYXRDbGllbnQoeyB2ZW50OiBzZWxmLmFwcEV2ZW50QnVzIH0pO1xuICAgIHNlbGYuY2hhdENsaWVudC5jb25uZWN0KCk7XG5cbiAgICAvLyBuZXcgbW9kZWwgYW5kIHZpZXcgY3JlYXRlZCBmb3IgY2hhdHJvb21cbiAgICBzZWxmLmNoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoeyBuYW1lOiAnRE9PJyB9KTtcbiAgICBzZWxmLmNoYXRyb29tTGlzdCA9IG5ldyBhcHAuQ2hhdHJvb21MaXN0KCk7XG4gICAgc2VsZi5jaGF0cm9vbUxpc3QuZmV0Y2goKS5kb25lKGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnY2hhdHJvb21zJywgc2VsZi5jaGF0cm9vbUxpc3QpO1xuICAgICAgc2VsZi5jaGF0cm9vbVZpZXcgID0gbmV3IGFwcC5DaGF0cm9vbVZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzLCBtb2RlbDogc2VsZi5jaGF0cm9vbU1vZGVsIH0pO1xuICAgICAgc2VsZi5jb250YWluZXJNb2RlbC5zZXQoJ3ZpZXdTdGF0ZScsIHNlbGYuY2hhdHJvb21WaWV3KTtcblxuICAgICAgc2VsZi5jb25uZWN0VG9Sb29tKCk7XG4gICAgICAvLyBzZWxmLmluaXRSb29tKCk7XG4gICAgICAgXG4gICAgfSk7XG5cbiAgfTtcblxuICBzZWxmLmNvbm5lY3RUb1Jvb20gPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgIHNlbGYuY2hhdENsaWVudC5jb25uZWN0VG9Sb29tKFwiRE9PXCIpO1xuICB9O1xuXG4gIC8vIHNlbGYuaW5pdFJvb20gPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAvLyAgIHNlbGYuY2hhdHJvb21WaWV3LmluaXRSb29tKCk7XG4gIC8vIH07XG5cbiAgXG5cblxuXG5cbiAgLy8vLy8vLy8vLy8vICBCdXNzZXMgLy8vLy8vLy8vLy8vXG4gICAgLy8gVGhlc2UgQnVzc2VzIGxpc3RlbiB0byB0aGUgc29ja2V0Y2xpZW50XG4gICAvLyAgICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXG4gIC8vLy8gdmlld0V2ZW50QnVzIExpc3RlbmVycyAvLy8vL1xuICBcblx0c2VsZi52aWV3RXZlbnRCdXMub24oXCJsb2dpblwiLCBmdW5jdGlvbih1c2VyKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmxvZ2luKHVzZXIpO1xuICB9KTtcblx0c2VsZi52aWV3RXZlbnRCdXMub24oXCJjaGF0XCIsIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuY2hhdChjaGF0KTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwidHlwaW5nXCIsIGZ1bmN0aW9uKCkge1xuICAgIHNlbGYuY2hhdENsaWVudC51cGRhdGVUeXBpbmcoKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiam9pblJvb21cIiwgZnVuY3Rpb24ocm9vbSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5qb2luUm9vbShyb29tKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiYWRkUm9vbVwiLCBmdW5jdGlvbihyb29tKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmFkZFJvb20ocm9vbSk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcInJlbW92ZVJvb21cIiwgZnVuY3Rpb24ocm9vbSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5yZW1vdmVSb29tKHJvb20pO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJjcmVhdGVSb29tXCIsIGZ1bmN0aW9uKGZvcm1EYXRhKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmNyZWF0ZVJvb20oZm9ybURhdGEpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJkZXN0cm95Um9vbVwiLCBmdW5jdGlvbihyb29tKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmRlc3Ryb3lSb29tKHJvb20pO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJnZXRNb3JlQ2hhdHNcIiwgZnVuY3Rpb24oY2hhdFJlcSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5nZXRNb3JlQ2hhdHMoY2hhdFJlcSk7XG4gIH0pO1xuXG5cblxuXG5cblxuXG5cbiAgLy8vLyBhcHBFdmVudEJ1cyBMaXN0ZW5lcnMgLy8vL1xuXG5cdC8vIHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2Vyc0luZm9cIiwgZnVuY3Rpb24oZGF0YSkge1xuIC8vICAgIGNvbnNvbGUubG9nKCdtYWluLmUudXNlcnNJbmZvOiAnLCBkYXRhKTtcbiAvLyAgICAvL2RhdGEgaXMgYW4gYXJyYXkgb2YgdXNlcm5hbWVzLCBpbmNsdWRpbmcgdGhlIG5ldyB1c2VyXG5cdC8vIFx0Ly8gVGhpcyBtZXRob2QgZ2V0cyB0aGUgb25saW5lIHVzZXJzIGNvbGxlY3Rpb24gZnJvbSBjaGF0cm9vbU1vZGVsLlxuXHQvLyBcdC8vIG9ubGluZVVzZXJzIGlzIHRoZSBjb2xsZWN0aW9uXG5cdC8vIFx0dmFyIG9ubGluZVVzZXJzID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpO1xuIC8vICAgIGNvbnNvbGUubG9nKFwiLi4ub25saW5lVXNlcnM6IFwiLCBvbmxpbmVVc2Vycyk7XG5cdC8vIFx0dmFyIHVzZXJzID0gXy5tYXAoZGF0YSwgZnVuY3Rpb24oaXRlbSkge1xuXHQvLyBcdFx0cmV0dXJuIG5ldyBhcHAuVXNlck1vZGVsKHt1c2VybmFtZTogaXRlbX0pO1xuXHQvLyBcdH0pO1xuIC8vICAgIGNvbnNvbGUubG9nKFwidXNlcnM6IFwiLCB1c2Vycyk7XG5cdC8vIFx0b25saW5lVXNlcnMucmVzZXQodXNlcnMpO1xuXHQvLyB9KTtcblxuIC8vICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwicm9vbUluZm9cIiwgZnVuY3Rpb24oZGF0YSkge1xuIC8vICAgIGRlYnVnZ2VyO1xuIC8vICAgIGNvbnNvbGUubG9nKCdtYWluLmUucm9vbUluZm86ICcsIGRhdGEpO1xuIC8vICAgIHZhciByb29tcyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoXCJjaGF0cm9vbXNcIik7XG4gLy8gICAgIGNvbnNvbGUubG9nKFwiLi4ucm9vbXM6IFwiLCByb29tcyk7XG4gLy8gICAgdmFyIHVwZGF0ZWRSb29tcyA9IF8ubWFwKGRhdGEsIGZ1bmN0aW9uKHJvb20pIHtcbiAvLyAgICAgIHZhciBuZXdDaGF0cm9vbU1vZGVsID0gbmV3IGFwcC5DaGF0cm9vbU1vZGVsKHtuYW1lOiByb29tfSk7XG4gLy8gICAgICByZXR1cm4gbmV3Q2hhdHJvb21Nb2RlbDtcbiAvLyAgICB9KTtcbiAvLyAgICBjb25zb2xlLmxvZyhcIi4uLnVwZGF0ZWRyb29tczogXCIsIHVwZGF0ZWRSb29tcyk7XG4gLy8gICAgcm9vbXMucmVzZXQodXBkYXRlZFJvb21zKTtcbiAvLyAgfSk7XG5cblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJsb2dpblVzZXJcIiwgZnVuY3Rpb24odXNlcm5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnbWFpbi5lLmxvZ2luVXNlcjogJywgdXNlcm5hbWUpO1xuICAgIHZhciB1c2VyID0gbmV3IGFwcC5Vc2VyTW9kZWwoe3VzZXJuYW1lOiB1c2VybmFtZX0pO1xuICAgIHNlbGYubmF2YmFyVmlldy5tb2RlbC5zZXQodXNlci50b0pTT04oKSk7XG4gIH0pO1xuXG5cblxuICAvLyBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0Um9vbVwiLCBmdW5jdGlvbihtb2RlbCkge1xuICAvLyAgIGNvbnNvbGUubG9nKCdtYWluLmUuc2V0Um9vbTogJywgbW9kZWwpO1xuXG4gIC8vICAgdmFyIGNoYXRsb2cgPSBuZXcgYXBwLkNoYXRDb2xsZWN0aW9uKG1vZGVsLmNoYXRsb2cpO1xuICAvLyAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zZXQoJ2NoYXRsb2cnLCBjaGF0bG9nKTtcblxuICAvLyAgIHZhciByb29tcyA9IG5ldyBhcHAuQ2hhdHJvb21MaXN0KG1vZGVsLmNoYXRyb29tcyk7XG4gIC8vICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnY2hhdHJvb21zJywgcm9vbXMpO1xuXG4gIC8vICAgdmFyIHVzZXJzID0gbmV3IGFwcC5Vc2VyQ29sbGVjdGlvbihtb2RlbC5vbmxpbmVVc2Vycyk7XG4gIC8vICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnb25saW5lVXNlcnMnLCB1c2Vycyk7XG5cbiAgLy8gfSk7XG5cblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJDaGF0cm9vbU1vZGVsXCIsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgY29uc29sZS5sb2coJ21haW4uZS5DaGF0cm9vbU1vZGVsOiAnLCBtb2RlbCk7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsID0gbmV3IGFwcC5DaGF0cm9vbU1vZGVsKCk7XG4gICAgc2VsZi5jaGF0cm9vbUxpc3QgPSBuZXcgYXBwLkNoYXRyb29tTGlzdCgpO1xuICAgIHNlbGYuY2hhdHJvb21WaWV3ICA9IG5ldyBhcHAuQ2hhdHJvb21WaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cywgbW9kZWw6IHNlbGYuY2hhdHJvb21Nb2RlbCwgY29sbGVjdGlvbjogc2VsZi5jaGF0cm9vbUxpc3R9KTtcbiAgICBzZWxmLmNvbnRhaW5lck1vZGVsLnNldCgndmlld1N0YXRlJywgc2VsZi5jaGF0cm9vbVZpZXcpO1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5sb2FkTW9kZWwobW9kZWwpO1xuICB9KTtcblxuXG5cbiAgLy8gYWRkcyBuZXcgdXNlciB0byB1c2VycyBjb2xsZWN0aW9uLCBzZW5kcyBkZWZhdWx0IGpvaW5pbmcgbWVzc2FnZVxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwidXNlckpvaW5lZFwiLCBmdW5jdGlvbih1c2VybmFtZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnbWFpbi5lLnVzZXJKb2luZWQ6ICcsIHVzZXJuYW1lKTtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkVXNlcih1c2VybmFtZSk7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLmFkZENoYXQoe3NlbmRlcjogXCJCdXR0ZXJzXCIsIG1lc3NhZ2U6IHVzZXJuYW1lICsgXCIgam9pbmVkIHJvb20uXCIgfSk7XG5cdH0pO1xuXG5cdC8vIHJlbW92ZXMgdXNlciBmcm9tIHVzZXJzIGNvbGxlY3Rpb24sIHNlbmRzIGRlZmF1bHQgbGVhdmluZyBtZXNzYWdlXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2VyTGVmdFwiLCBmdW5jdGlvbih1c2VybmFtZSkge1xuICAgICAgICBjb25zb2xlLmxvZygnbWFpbi5lLnVzZXJMZWZ0OiAnLCB1c2VybmFtZSk7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLnJlbW92ZVVzZXIodXNlcm5hbWUpO1xuXHRcdHNlbGYuY2hhdHJvb21Nb2RlbC5hZGRDaGF0KHtzZW5kZXI6IFwiQnV0dGVyc1wiLCBtZXNzYWdlOiB1c2VybmFtZSArIFwiIGxlZnQgcm9vbS5cIiB9KTtcblx0fSk7XG5cblx0Ly8gY2hhdCBwYXNzZWQgZnJvbSBzb2NrZXRjbGllbnQsIGFkZHMgYSBuZXcgY2hhdCBtZXNzYWdlIHVzaW5nIGNoYXRyb29tTW9kZWwgbWV0aG9kXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJjaGF0UmVjZWl2ZWRcIiwgZnVuY3Rpb24oY2hhdCkge1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5hZGRDaGF0KGNoYXQpO1xuXHRcdCQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuXHR9KTtcblxuXG5cblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwicm9vbURlc3Ryb3llZFwiLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgc2VsZi5jb25uZWN0VG9Sb29tKCk7XG4gICAgLy8gc2VsZi5pbml0Um9vbSgpO1xuICAgIGFsZXJ0KCdDaGF0cm9vbSAnICsgbmFtZSArICcgZGVzdHJveWVkJyk7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRDaGF0cm9vbUhlYWRlclwiLCBmdW5jdGlvbihoZWFkZXJPYmopIHtcbiAgICB2YXIgbmV3SGVhZGVyID0gbmV3IGFwcC5DaGF0cm9vbUhlYWRlck1vZGVsKGhlYWRlck9iaik7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnY2hhdHJvb20nLCBuZXdIZWFkZXIpO1xuICB9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0Q2hhdGxvZ1wiLCBmdW5jdGlvbihjaGF0bG9nKSB7XG4gICAgdmFyIG9sZENoYXRsb2cgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KCdjaGF0bG9nJyk7XG4gICAgdmFyIHVwZGF0ZWRDaGF0bG9nID0gXy5tYXAoY2hhdGxvZywgZnVuY3Rpb24oY2hhdCkge1xuICAgICAgdmFyIG5ld0NoYXRNb2RlbCA9IG5ldyBhcHAuQ2hhdE1vZGVsKHsgcm9vbTogY2hhdC5yb29tLCBtZXNzYWdlOiBjaGF0Lm1lc3NhZ2UsIHNlbmRlcjogY2hhdC5zZW5kZXIsIHRpbWVzdGFtcDogY2hhdC50aW1lc3RhbXAsIHVybDogY2hhdC51cmwgfSk7XG4gICAgICByZXR1cm4gbmV3Q2hhdE1vZGVsO1xuICAgIH0pO1xuICAgIG9sZENoYXRsb2cucmVzZXQodXBkYXRlZENoYXRsb2cpO1xuXG5cbiAgICAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcIm1vcmVDaGF0c1wiLCBmdW5jdGlvbihjaGF0bG9nKSB7XG4gICAgdmFyIG9sZENoYXRsb2cgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KCdjaGF0bG9nJyk7XG4gICAgdmFyIG1vcmVDaGF0bG9nID0gXy5tYXAoY2hhdGxvZywgZnVuY3Rpb24oY2hhdCkge1xuICAgICAgdmFyIG5ld0NoYXRNb2RlbCA9IG5ldyBhcHAuQ2hhdE1vZGVsKHsgcm9vbTogY2hhdC5yb29tLCBtZXNzYWdlOiBjaGF0Lm1lc3NhZ2UsIHNlbmRlcjogY2hhdC5zZW5kZXIsIHRpbWVzdGFtcDogY2hhdC50aW1lc3RhbXAsIHVybDogY2hhdC51cmwgfSk7XG4gICAgICByZXR1cm4gbmV3Q2hhdE1vZGVsO1xuICAgIH0pO1xuICAgIC8vXG4gICAgLy9cbiAgICAvL1xuICAgIC8vXG4gICAgLy9cbiAgICBzZWxmLmNoYXRyb29tTW9kZWwudHJpZ2dlcignbW9yZUNoYXRzJywgbW9yZUNoYXRsb2cpO1xuICAgIC8vIG9sZENoYXRsb2cucHVzaChtb3JlQ2hhdGxvZyk7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJub01vcmVDaGF0c1wiLCBmdW5jdGlvbihjaGF0bG9nKSB7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLnN0b3BMaXN0ZW5pbmcoJ21vcmVDaGF0cycpO1xuICB9KTtcbiAgXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRDaGF0cm9vbXNcIiwgZnVuY3Rpb24oY2hhdHJvb21zKSB7XG4gICAgdmFyIG9sZENoYXRyb29tcyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoJ2NoYXRyb29tcycpO1xuICAgIHZhciB1cGRhdGVkQ2hhdHJvb21zID0gXy5tYXAoY2hhdHJvb21zLCBmdW5jdGlvbihjaGF0cm9vbSkge1xuICAgICAgdmFyIG5ld0NoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoeyBuYW1lOiBjaGF0cm9vbS5uYW1lLCBvd25lcjogY2hhdHJvb20ub3duZXJ9KTtcbiAgICAgIHJldHVybiBuZXdDaGF0cm9vbU1vZGVsO1xuICAgIH0pO1xuICAgIG9sZENoYXRyb29tcy5yZXNldCh1cGRhdGVkQ2hhdHJvb21zKTtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldE9ubGluZVVzZXJzXCIsIGZ1bmN0aW9uKG9ubGluZVVzZXJzKSB7XG4gICAgdmFyIG9sZE9ubGluZVVzZXJzID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldCgnb25saW5lVXNlcnMnKTtcbiAgICB2YXIgdXBkYXRlZE9ubGluZVVzZXJzID0gXy5tYXAob25saW5lVXNlcnMsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgIHZhciBuZXdVc2VyTW9kZWwgPSBuZXcgYXBwLlVzZXJNb2RlbCh7dXNlcm5hbWU6IHVzZXIudXNlcm5hbWV9KTtcbiAgICAgIHJldHVybiBuZXdVc2VyTW9kZWw7XG4gICAgfSk7XG4gICAgb2xkT25saW5lVXNlcnMucmVzZXQodXBkYXRlZE9ubGluZVVzZXJzKTtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldE9mZmxpbmVVc2Vyc1wiLCBmdW5jdGlvbihvZmZsaW5lVXNlcnMpIHtcbiAgICB2YXIgb2xkT2ZmbGluZVVzZXJzID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldCgnb2ZmbGluZVVzZXJzJyk7XG4gICAgdmFyIHVwZGF0ZWRPZmZsaW5lVXNlcnMgPSBfLm1hcChvZmZsaW5lVXNlcnMsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgIHZhciBuZXdVc2VyTW9kZWwgPSBuZXcgYXBwLlVzZXJNb2RlbCh7dXNlcm5hbWU6IHVzZXIudXNlcm5hbWV9KTtcbiAgICAgIHJldHVybiBuZXdVc2VyTW9kZWw7XG4gICAgfSk7XG4gICAgb2xkT2ZmbGluZVVzZXJzLnJlc2V0KHVwZGF0ZWRPZmZsaW5lVXNlcnMpO1xuICB9KTtcblxuXG59O1xuXG4iLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gICQod2luZG93KS5iaW5kKCdiZWZvcmV1bmxvYWQnLCBmdW5jdGlvbihldmVudE9iamVjdCkge1xuICAgICQuYWpheCh7XG4gICAgICAgdXJsOiBcIi9sb2dvdXRcIixcbiAgICB9KTtcbiAgfSk7XG5cbiAgdmFyIENoYXRyb29tUm91dGVyID0gQmFja2JvbmUuUm91dGVyLmV4dGVuZCh7XG4gICAgXG4gICAgcm91dGVzOiB7XG4gICAgICAnJzogJ3N0YXJ0JyxcbiAgICAgICdsb2cnOiAnbG9naW4nLFxuICAgICAgJ3JlZyc6ICdyZWdpc3RlcicsXG4gICAgICAnb3V0JzogJ291dCcsXG4gICAgICAnYXV0aGVudGljYXRlZCc6ICdhdXRoZW50aWNhdGVkJyxcbiAgICAgICdmYWNlYm9vayc6ICdmYWNlYm9vaycsXG4gICAgICAndHdpdHRlcic6ICd0d2l0dGVyJ1xuICAgIH0sXG5cbiAgICBzdGFydDogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJy8jJztcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlciA9IG5ldyBhcHAuTWFpbkNvbnRyb2xsZXIoKTtcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlci5pbml0KCk7XG4gICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgdXJsOiBcIi9sb2dvdXRcIixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSxcblxuXG4gICAgbG9naW46IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGxvZ2luTW9kZWwgPSBuZXcgYXBwLkxvZ2luTW9kZWwoKTtcbiAgICAgIHZhciBsb2dpblZpZXcgPSBuZXcgYXBwLkxvZ2luVmlldyh7dmVudDogYXBwLm1haW5Db250cm9sbGVyLnZpZXdFdmVudEJ1cywgbW9kZWw6IGxvZ2luTW9kZWx9KTtcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlci5jb250YWluZXJNb2RlbC5zZXQoXCJ2aWV3U3RhdGVcIiwgbG9naW5WaWV3KTtcbiAgICB9LFxuXG4gICAgcmVnaXN0ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHJlZ2lzdGVyVmlldyA9IG5ldyBhcHAuUmVnaXN0ZXJWaWV3KHt2ZW50OiBhcHAubWFpbkNvbnRyb2xsZXIudmlld0V2ZW50QnVzIH0pO1xuICAgICAgYXBwLm1haW5Db250cm9sbGVyLmNvbnRhaW5lck1vZGVsLnNldChcInZpZXdTdGF0ZVwiLCByZWdpc3RlclZpZXcpO1xuICAgIH0sXG5cbiAgICBvdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgIHVybDogXCIvbG9nb3V0XCIsXG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIGF1dGhlbnRpY2F0ZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCFhcHAubWFpbkNvbnRyb2xsZXIpIHsgcmV0dXJuIHRoaXMuc3RhcnQoKTsgfVxuICAgICAgYXBwLm1haW5Db250cm9sbGVyLmF1dGhlbnRpY2F0ZWQoKTtcbiAgICB9LFxuICAgIGZhY2Vib29rOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuc3RhcnQodGhpcy5hdXRoZW50aWNhdGVkKTtcbiAgICB9LFxuICAgIHR3aXR0ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5zdGFydCh0aGlzLmF1dGhlbnRpY2F0ZWQpO1xuICAgIH0sXG5cbiAgfSk7XG5cbiAgYXBwLkNoYXRyb29tUm91dGVyID0gbmV3IENoYXRyb29tUm91dGVyKCk7XG4gIEJhY2tib25lLmhpc3Rvcnkuc3RhcnQoKTtcblxufSkoKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=