
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
  directMessageHeaderTemplate: _.template($('#direct-message-header-template').html()),
  onlineUserTemplate: _.template($('#online-users-list-template').html()),
  offlineUserTemplate: _.template($('#offline-users-list-template').html()),
  dateTemplate: _.template('<div class="followWrap"><div class="followMeBar"><span>-----</span><span> <%= moment(timestamp).format("MMMM Do") %> </span><span>-----</span></div></div>'),
  events: {
    'keypress .message-input': 'messageInputPressed',
    'keypress .direct-message-input': 'directMessageInputPressed',
    'click .chat-directory .room': 'setRoom',
    'keypress #chat-search-input': 'search',
    'click .remove-chatroom': 'removeRoom',
    'click #createChatroomBtn': 'createRoom',
    'click #destroy-chatroom': 'destroyRoom',
    'keyup #chatroom-name-input': 'doesChatroomExist',
    'click .user-username': 'initDirectMessage',
  },



  doesChatroomExist: function(e) {
    e.preventDefault();
    var this_ = this;
    var check = function() {
      if ($.trim($('#chatroom-name-input').val()).length > 0) {
        var chatroomName = $('#chatroom-name-input').val();
         this_.vent.trigger('doesChatroomExist', chatroomName);
      } else {
         this_.$('#chatroom-name-validation-container').children().remove();
         this_.$('#chatroom-name-input').removeClass('input-valid input-invalid');
      }
    };
    _.debounce(check(), 150);
  },

  renderChatroomAvailability: function(availability) {
    this.$('#chatroom-name-input').removeClass('input-valid input-invalid');
    $('#chatroom-name-validation-container').children().remove();
    if (availability === true) {
      this.$('#chatroom-name-input').addClass('input-valid');
      this.$('#chatroom-name-validation-container').append('<div id="#chatroom-name-validation" class="fa fa-check">Name Available</div>');
    } else {
      this.$('#chatroom-name-input').addClass('input-invalid fa fa-times');
      this.$('#chatroom-name-validation-container').append('<div id="#chatroom-name-validation" class="fa fa-times">Name Unavailable</div>');
    }
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

    this.listenTo(this.model, "chatroomAvailability", this.renderChatroomAvailability, this);

    var this_ = this;
    this.$('#chatbox-content').scroll(function(){
        // checks if there's enough chats to warrant a getMoreChats call
      if ($('#chatbox-content').scrollTop() === 0 && this_.model.get('chatlog').length >= 25) {
        _.debounce(this_.getMoreChats(), 3000);
      }
    });

       $(window).resize(function() {
        var windowHeight = $(window).height();
        if (windowHeight > 500) {
          var newHeight = windowHeight - 285;
          $('#chatbox-content').height(newHeight);
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



// headers

  renderHeader: function() {
    this.$('#chatbox-header').html(this.headerTemplate(this.model.get('chatroom').toJSON()));
  },

  renderDirectMessageHeader: function() {
    this.$('#chatbox-header').html(this.directMessageHeaderTemplate(this.model.get('chatroom').toJSON()));
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
    numberLoaded = chatroom.get('numberLoaded');
    var chatlogLength = chatroom.get('chatlogLength');
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
    var this_ = this;
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
      this.$('#chat-search-input').val('');
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
        $(el).val('');
      }
    });
    this.vent.trigger('createRoom', formData);
  },

  destroyRoom: function(e) {
    e.preventDefault();
    var this_ = this;
    var confirmation = swal({
      title: "Do you wish to destroy the room?",
      text: "This kills the room.",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DEB0B0",
      confirmButtonText: "Muahaha!",
      closeOnConfirm: false,
      html: false
    }, function(){
      swal({
        title: "Eviscerated!",
        text: "Your chatroom has been purged.",
        type: "success",
        confirmButtonColor: "#749CA8",
      });
      this_.vent.trigger('destroyRoom', this_.model.get('chatroom').get('name'));
    });
  },

  addChatroom: function(name) {
    console.log('crv.f.addChatroom');
    this.vent.trigger('addRoom', name);
  },

  removeRoom: function(e) {
    var this_ = this;
    var confirmation = swal({
      title: "Remove This Room?",
      text: "Are you sure? Are you sure you're sure? How sure can you be?",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DEB0B0",
      confirmButtonText: "Muahaha!",
      closeOnConfirm: false,
      html: false
    }, function(){
      swal({
        title: "Removed!",
        text: "You are free of this chatroom. Go on, you're free now.",
        type: "success",
        confirmButtonColor: "#749CA8"
      });
      var name = $(e.target).data("room-name");
      this_.vent.trigger('removeRoom', name);
    });
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
    var name1 = model.get('name'),
    name2 = this.model.get('chatroom').get('name');
    this.$('.public-rooms').append(this.roomTemplate(model.toJSON()));
    if (name1 === name2) {
      this.$('.room').last().find('.room-name').css('color', '#DEB0B0').fadeIn();
    }
  },

  joinRoom: function(name) {
    console.log('crv.f.joinRoom');
    this.currentDate = '';
    this.previousDate = '';
    this.vent.trigger('joinRoom', name);
  },

// change to 'joinDirectMessage'
  initDirectMessage: function(e) {
    var recipient = $(e.target).text().trim();
    this.currentDate = '';
    this.previousDate = '';
    this.vent.trigger('initDirectMessage', recipient);
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
  directMessageInputPressed: function(e) {
    if (e.keyCode === 13 && $.trim($('.direct-message-input').val()).length > 0) {
      // fun fact: separate events with a space in trigger's first arg and you
      // can trigger multiple events.
      this.vent.trigger("directMessage", { message: this.$('.direct-message-input').val()});
      this.$('.direct-message-input').val('');
      return false;
    } else {
      this.vent.trigger("typing");
      console.log('huh');
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
      $stickies = stickies;
      $('#chatbox-content').scroll(scrollStickiesInit);
    };

    scrollStickiesInit = function() {
      $(this).off("scroll.stickies");
      $(this).on("scroll.stickies", _.debounce(_whenScrolling, 150));
    };

    _whenScrolling = function() {
      $stickies.removeClass('fixed');
      $stickies.each(function(i, sticky) {
        var $thisSticky = $(sticky),
        $thisStickyTop = $thisSticky.offset().top;
        if ($thisStickyTop <= 162) {
          $thisSticky.addClass("fixed");
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
    errorTemplate: _.template('<div class="login-error"><%= message %></div>'),
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
      e.preventDefault();
    $.ajax({
        url: "/login",
        method: 'POST',
        data: {username: this.$('#username').val(), password: this.$('#password').val()},
        success: function(data) {
           console.log('success data: ', data);
           if (data.message) {
             this_.renderValidation(this_.errorTemplate(data));
           }
           else if (data === 200) {
            app.ChatroomRouter.navigate('authenticated', { trigger: true });
            this_.vent.trigger("login", {username: this_.$('#username').val(), password: this_.$('#password').val()});
           }
           else {
            console.log(data);
          }
        }
      }).done(function() {
        console.log('doneeeeeeee');
      });
    },
    renderValidation: function(what) {
      $('.login-error-container').empty();
      $(what).appendTo($('.login-error-container')).hide().fadeIn();
      setTimeout(function() {
        $('.login-error-container').children().first().fadeOut();
      }, 2000);

    }
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
    usernameAvailableTemplate: _.template('<div class="username-available fa fa-check">username available</div>'),
    usernameTakenTemplate: _.template('<div class="username-taken fa fa-times">username taken</div>'),
    events: {
      "click #signUpBtn": "signUp",
      "keyup #username": "validateUsername",
    },
    initialize: function(options) {
      this.render();
    },
    render: function() {
      this.$el.html(this.template());
      return this;
    },
    signUp: function() {
    },
    validateUsername: function() {
      if ($('#username').val().length < 5) { return; }
      var this_ = this;
      _.debounce($.post('/registerValidation', { username: $('#username').val() },function(data) {
         data.usernameAvailable ?
           this_.renderValidation(this_.usernameAvailableTemplate())
         :
           this_.renderValidation(this_.usernameTakenTemplate());
      }), 150);
    },
    renderValidation: function(what) {
      $('.register-error-container').empty();
      $(what).appendTo($('.register-error-container')).hide().fadeIn();
      setTimeout(function() {
        $('.register-error-container').children().first().fadeOut();
      }, 2000);

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
  self.directMessage = function(message) {
    self.socket.emit('directMessage', message);
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
  // self.setRoom = function(name) {
  //   if (name !== null) {
  //     this.currentRoom = name;
  //   }
  //   ///>>>>>>> changethisto .chat-title
  //   var $chatTitle = $('.chatbox-header-username');
  //   $chatTitle.text(name);
  //   var this_ = this;
  //   $('.chat-directory').find('.room').each(function() {
  //     var $room = $(this);
  //     $room.removeClass('active');
  //     if ($room.data('name') === this_.currentRoom) {
  //       $room.addClass('active');
  //     }
  //   });
  // };

  self.doesChatroomExist = function(chatroomQuery) {
    self.socket.emit('doesChatroomExist', chatroomQuery);
  };








  self.initDirectMessage = function(recipient) {
    self.socket.emit('initDirectMessage', recipient);
  };
  








  ////////////// chatserver listeners/////////////

  // these guys listen to the chatserver/socket and emit data to main.js,
  // specifically to the appEventBus.
	self.setResponseListeners = function(socket) {
		// socket.on('welcome', function(data) {
  //     // emits event to recalibrate onlineUsers collection
  //     // socket.emit("getOnlineUsers");
  //     // socket.emit("rooms");
  //     // data is undefined at this point because it's the first to
  //     // fire off an event chain that will append the new user to 
  //     // the onlineUser collection
  //     debugger;
  //     self.vent.trigger("loginDone", data);
  //   });


// login

    socket.on('login', function(username) {
      self.vent.trigger('loginUser', username);
    });


  //   socket.on('log', function() {
  //     debugger;
  //     console.log('sc.e.log');
  //     self.vent.trigger('authenticated');
  //   });

		// socket.on('usersInfo', function(users) {
  //     debugger;
		// 	console.log('sc.e.usersInfo: ', users);
		// 	self.vent.trigger("usersInfo", users);
		// });

//     socket.on('rooms', function(chatrooms) {
// debugger;
//       console.log('sc.e.rooms: ', chatrooms);
//       self.vent.trigger("roomInfo", chatrooms);
//     });

    // socket.on('setRoom', function(name) {
    //   debugger;
    //   console.log('sc.e.setRoom: ', name);
    //   self.vent.trigger("setRoom", name);
    // });


// chat
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
    socket.on('moreChats', function(chats) {
      self.vent.trigger("moreChats", chats);
    });
    socket.on('noMoreChats', function() {
      self.vent.trigger("noMoreChats");
    });


// chatroom

    socket.on('typing', function(data) {
      self.addChatTyping(data);
    });
    socket.on('stop typing', function() {
      self.removeChatTyping();
    });


// set chatroom
    socket.on('chatlog', function(chatlog) {
      console.log('sc.e.chatlog: ', chatlog);
      self.vent.trigger("setChatlog", chatlog);
    });
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


// modify room
    socket.on('roomDestroyed', function(name) {
      console.log('sc.e.roomDestroyed: ', name);
      self.vent.trigger("roomDestroyed", name);
    });

// create room
    socket.on('chatroomAvailability', function(availabilty) {
      self.vent.trigger('chatroomAvailability', availabilty);
    });

// errors
    socket.on('chatroomAlreadyExists', function() {
      self.vent.trigger("chatroomAlreadyExists");
    });


// DirectMessage
    socket.on('setDirectMessageChatlog', function(chatlog) {
      self.vent.trigger("setDMchatlog", chatlog);
    });

    socket.on('setDirectMessageHeader', function(header) {
      self.vent.trigger("setDMheader", header);
    });

    socket.on('directMessage', function(message) {
      // self.vent.trigger("renderDirectMessage", DM);
      self.vent.trigger("directMessageReceived", message);
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
    self.chatroomModel = new app.ChatroomModel({ name: 'Parlor' });
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
    self.chatClient.connectToRoom("Parlor");
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
  self.viewEventBus.on("doesChatroomExist", function(chatroomQuery) {
    self.chatClient.doesChatroomExist(chatroomQuery);
  });
  self.viewEventBus.on("initDirectMessage", function(recipient) {
    self.chatClient.initDirectMessage(recipient);
  });
  self.viewEventBus.on("directMessage", function(message) {
    self.chatClient.directMessage(message);
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
    // alert('Chatroom ' + name + ' destroyed');
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

   $('#message-input').removeClass('direct-message-input').addClass('message-input');
    $('#chatbox-content')[0].scrollTop = $('#chatbox-content')[0].scrollHeight;
  });

  self.appEventBus.on("moreChats", function(chatlog) {
    var oldChatlog = self.chatroomModel.get('chatlog');
    var moreChatlog = _.map(chatlog, function(chat) {
      var newChatModel = new app.ChatModel({ room: chat.room, message: chat.message, sender: chat.sender, timestamp: chat.timestamp, url: chat.url });
      return newChatModel;
    });
    self.chatroomModel.trigger('moreChats', moreChatlog);
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


// chatroom availability

  self.appEventBus.on("chatroomAvailability", function(availability) {
    self.chatroomModel.trigger('chatroomAvailability', availability);
  });


// errors


  self.appEventBus.on("chatroomAlreadyExists", function() {
    swal({
      title: "OH NO OH NO OH NO",
      text: "Chatroom Already, It Already Exists! And. Don't Go In There. Don't. You. You Should Have. I Threw Up On The Server. Those Poor . . . They Were Just! OH NO WHY. WHY OH NO. OH NO.",
      type: "error",
      confirmButtonColor: "#749CA8"
    });
  });



  // DirectMessage

  self.appEventBus.on("setDMchatlog", function(chatlog) {
    var oldChatlog = self.chatroomModel.get('chatlog');
    var updatedChatlog = _.map(chatlog, function(chat) {
      var newChatModel = new app.ChatModel({ room: chat.room, message: chat.message, sender: chat.sender, timestamp: chat.timestamp, url: chat.url });
      return newChatModel;
    });
    oldChatlog.reset(updatedChatlog);

    $('#message-input').removeClass('message-input').addClass('direct-message-input');
    $('#chatbox-content')[0].scrollTop = $('#chatbox-content')[0].scrollHeight;
  });

  self.appEventBus.on("setDMheader", function(header) {
    var newHeader = new app.ChatroomHeaderModel(header);
    self.chatroomModel.set('chatroom', newHeader);
  });


  self.appEventBus.on("directMessageReceived", function(message) {
    self.chatroomModel.addChat(message);
    $('#chatbox-content')[0].scrollTop = $('#chatbox-content')[0].scrollHeight;
  });
};


var app = app || {};

(function () {

  // $(window).bind('beforeunload', function(eventObject) {
  //   $.ajax({
  //      url: "/logout",
  //   });
  // });

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
      } 
      else {
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

    // out: function() {
    //     var this_ = this;
    //     $.ajax({
    //       url: "/logout",
    //     })
    // },

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYXQuanMiLCJjaGF0cm9vbS1oZWFkZXIuanMiLCJjb250YWluZXIuanMiLCJsb2dpbi5qcyIsInVzZXIuanMiLCJjaGF0cm9vbS5qcyIsInJvb20uanMiLCJpbWFnZVVwbG9hZC5qcyIsIm5hdmJhci5qcyIsInJlZ2lzdGVyLmpzIiwic29ja2V0Y2xpZW50LmpzIiwibWFpbi5qcyIsInJvdXRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUpQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBSVRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QURWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUg5ZUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUtmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FKbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBS2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLkNoYXRDb2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe1xuICAgIG1vZGVsOiBhcHAuQ2hhdE1vZGVsXG4gIH0pO1xuXG59KSgpOyIsIlxudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuQ2hhdHJvb21IZWFkZXJNb2RlbCA9IEJhY2tib25lLk1vZGVsLmV4dGVuZCh7fSk7XG5cbn0pKCk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbiAgYXBwLkNvbnRhaW5lclZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgZWw6ICcjdmlldy1jb250YWluZXInLFxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMubW9kZWwub24oXCJjaGFuZ2U6dmlld1N0YXRlXCIsIHRoaXMucmVuZGVyLCB0aGlzKTtcbiAgICB9LFxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdmlldyA9IHRoaXMubW9kZWwuZ2V0KCd2aWV3U3RhdGUnKTtcbiAgICAgIHRoaXMuJGVsLmh0bWwodmlldy5yZW5kZXIoKS5lbCk7XG4gICAgfVxuICB9KTtcblxufSkoalF1ZXJ5KTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuICBhcHAuTG9naW5WaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIHRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNsb2dpbicpLmh0bWwoKSksXG4gICAgZXJyb3JUZW1wbGF0ZTogXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cImxvZ2luLWVycm9yXCI+PCU9IG1lc3NhZ2UgJT48L2Rpdj4nKSxcbiAgICBldmVudHM6IHtcbiAgICAgICdzdWJtaXQnOiAnb25Mb2dpbicsXG4gICAgICAna2V5cHJlc3MnOiAnb25IaXRFbnRlcidcbiAgICB9LFxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAvLyBMb2dpblZpZXcgZ2V0cyBwYXNzZWQgdGhlIHZpZXdFdmVudEJ1cyB3aGVuIHRoZSBNYWluQ29udHJvbGxlciBpcyBpbml0aWFsaXplZFxuICAgICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xuXG4gICAgLy8gVGhpcyB0ZWxscyB0aGUgdmlldyB0byBsaXN0ZW4gdG8gYW4gZXZlbnQgb24gaXRzIG1vZGVsLFxuICAgIC8vIGlmIHRoZXJlJ3MgYW4gZXJyb3IsIHRoZSBjYWxsYmFjayAodGhpcy5yZW5kZXIpIGlzIGNhbGxlZCB3aXRoIHRoZSAgXG4gICAgLy8gdmlldyBhcyBjb250ZXh0XG4gICAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiY2hhbmdlOmVycm9yXCIsIHRoaXMucmVuZGVyLCB0aGlzKTtcbiAgICB9LFxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUodGhpcy5tb2RlbC50b0pTT04oKSkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBvbkxvZ2luOiBmdW5jdGlvbihlKSB7XG4gICAgICAvLyB0cmlnZ2VycyB0aGUgbG9naW4gZXZlbnQgYW5kIHBhc3NpbmcgdGhlIHVzZXJuYW1lIGRhdGEgdG8ganMvbWFpbi5qc1xuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAkLmFqYXgoe1xuICAgICAgICB1cmw6IFwiL2xvZ2luXCIsXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBkYXRhOiB7dXNlcm5hbWU6IHRoaXMuJCgnI3VzZXJuYW1lJykudmFsKCksIHBhc3N3b3JkOiB0aGlzLiQoJyNwYXNzd29yZCcpLnZhbCgpfSxcbiAgICAgICAgc3VjY2VzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICBjb25zb2xlLmxvZygnc3VjY2VzcyBkYXRhOiAnLCBkYXRhKTtcbiAgICAgICAgICAgaWYgKGRhdGEubWVzc2FnZSkge1xuICAgICAgICAgICAgIHRoaXNfLnJlbmRlclZhbGlkYXRpb24odGhpc18uZXJyb3JUZW1wbGF0ZShkYXRhKSk7XG4gICAgICAgICAgIH1cbiAgICAgICAgICAgZWxzZSBpZiAoZGF0YSA9PT0gMjAwKSB7XG4gICAgICAgICAgICBhcHAuQ2hhdHJvb21Sb3V0ZXIubmF2aWdhdGUoJ2F1dGhlbnRpY2F0ZWQnLCB7IHRyaWdnZXI6IHRydWUgfSk7XG4gICAgICAgICAgICB0aGlzXy52ZW50LnRyaWdnZXIoXCJsb2dpblwiLCB7dXNlcm5hbWU6IHRoaXNfLiQoJyN1c2VybmFtZScpLnZhbCgpLCBwYXNzd29yZDogdGhpc18uJCgnI3Bhc3N3b3JkJykudmFsKCl9KTtcbiAgICAgICAgICAgfVxuICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSkuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2RvbmVlZWVlZWVlJyk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHJlbmRlclZhbGlkYXRpb246IGZ1bmN0aW9uKHdoYXQpIHtcbiAgICAgICQoJy5sb2dpbi1lcnJvci1jb250YWluZXInKS5lbXB0eSgpO1xuICAgICAgJCh3aGF0KS5hcHBlbmRUbygkKCcubG9naW4tZXJyb3ItY29udGFpbmVyJykpLmhpZGUoKS5mYWRlSW4oKTtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICQoJy5sb2dpbi1lcnJvci1jb250YWluZXInKS5jaGlsZHJlbigpLmZpcnN0KCkuZmFkZU91dCgpO1xuICAgICAgfSwgMjAwMCk7XG5cbiAgICB9XG4gICAgLy8gb25IaXRFbnRlcjogZnVuY3Rpb24oZSkge1xuICAgIC8vICAgaWYoZS5rZXlDb2RlID09IDEzKSB7XG4gICAgLy8gICAgIHRoaXMub25Mb2dpbigpO1xuICAgIC8vICAgICByZXR1cm4gZmFsc2U7XG4gICAgLy8gICB9XG4gICAgLy8gfVxuICB9KTtcbiAgXG59KShqUXVlcnkpOyIsIlxudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuVXNlckNvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7bW9kZWw6IGFwcC5Vc2VyTW9kZWx9KTtcblxufSkoKTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuYXBwLkNoYXRyb29tVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2NoYXRyb29tLXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgY2hhdFRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNjaGF0Ym94LW1lc3NhZ2UtdGVtcGxhdGUnKS5odG1sKCkpLFxuICByb29tVGVtcGxhdGU6IF8udGVtcGxhdGUoJChcIiNyb29tLWxpc3QtdGVtcGxhdGVcIikuaHRtbCgpKSxcbiAgaGVhZGVyVGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2NoYXRyb29tLWhlYWRlci10ZW1wbGF0ZScpLmh0bWwoKSksXG4gIGRpcmVjdE1lc3NhZ2VIZWFkZXJUZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjZGlyZWN0LW1lc3NhZ2UtaGVhZGVyLXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgb25saW5lVXNlclRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNvbmxpbmUtdXNlcnMtbGlzdC10ZW1wbGF0ZScpLmh0bWwoKSksXG4gIG9mZmxpbmVVc2VyVGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI29mZmxpbmUtdXNlcnMtbGlzdC10ZW1wbGF0ZScpLmh0bWwoKSksXG4gIGRhdGVUZW1wbGF0ZTogXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cImZvbGxvd1dyYXBcIj48ZGl2IGNsYXNzPVwiZm9sbG93TWVCYXJcIj48c3Bhbj4tLS0tLTwvc3Bhbj48c3Bhbj4gPCU9IG1vbWVudCh0aW1lc3RhbXApLmZvcm1hdChcIk1NTU0gRG9cIikgJT4gPC9zcGFuPjxzcGFuPi0tLS0tPC9zcGFuPjwvZGl2PjwvZGl2PicpLFxuICBldmVudHM6IHtcbiAgICAna2V5cHJlc3MgLm1lc3NhZ2UtaW5wdXQnOiAnbWVzc2FnZUlucHV0UHJlc3NlZCcsXG4gICAgJ2tleXByZXNzIC5kaXJlY3QtbWVzc2FnZS1pbnB1dCc6ICdkaXJlY3RNZXNzYWdlSW5wdXRQcmVzc2VkJyxcbiAgICAnY2xpY2sgLmNoYXQtZGlyZWN0b3J5IC5yb29tJzogJ3NldFJvb20nLFxuICAgICdrZXlwcmVzcyAjY2hhdC1zZWFyY2gtaW5wdXQnOiAnc2VhcmNoJyxcbiAgICAnY2xpY2sgLnJlbW92ZS1jaGF0cm9vbSc6ICdyZW1vdmVSb29tJyxcbiAgICAnY2xpY2sgI2NyZWF0ZUNoYXRyb29tQnRuJzogJ2NyZWF0ZVJvb20nLFxuICAgICdjbGljayAjZGVzdHJveS1jaGF0cm9vbSc6ICdkZXN0cm95Um9vbScsXG4gICAgJ2tleXVwICNjaGF0cm9vbS1uYW1lLWlucHV0JzogJ2RvZXNDaGF0cm9vbUV4aXN0JyxcbiAgICAnY2xpY2sgLnVzZXItdXNlcm5hbWUnOiAnaW5pdERpcmVjdE1lc3NhZ2UnLFxuICB9LFxuXG5cblxuICBkb2VzQ2hhdHJvb21FeGlzdDogZnVuY3Rpb24oZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgIHZhciBjaGVjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCQudHJpbSgkKCcjY2hhdHJvb20tbmFtZS1pbnB1dCcpLnZhbCgpKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBjaGF0cm9vbU5hbWUgPSAkKCcjY2hhdHJvb20tbmFtZS1pbnB1dCcpLnZhbCgpO1xuICAgICAgICAgdGhpc18udmVudC50cmlnZ2VyKCdkb2VzQ2hhdHJvb21FeGlzdCcsIGNoYXRyb29tTmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgdGhpc18uJCgnI2NoYXRyb29tLW5hbWUtdmFsaWRhdGlvbi1jb250YWluZXInKS5jaGlsZHJlbigpLnJlbW92ZSgpO1xuICAgICAgICAgdGhpc18uJCgnI2NoYXRyb29tLW5hbWUtaW5wdXQnKS5yZW1vdmVDbGFzcygnaW5wdXQtdmFsaWQgaW5wdXQtaW52YWxpZCcpO1xuICAgICAgfVxuICAgIH07XG4gICAgXy5kZWJvdW5jZShjaGVjaygpLCAxNTApO1xuICB9LFxuXG4gIHJlbmRlckNoYXRyb29tQXZhaWxhYmlsaXR5OiBmdW5jdGlvbihhdmFpbGFiaWxpdHkpIHtcbiAgICB0aGlzLiQoJyNjaGF0cm9vbS1uYW1lLWlucHV0JykucmVtb3ZlQ2xhc3MoJ2lucHV0LXZhbGlkIGlucHV0LWludmFsaWQnKTtcbiAgICAkKCcjY2hhdHJvb20tbmFtZS12YWxpZGF0aW9uLWNvbnRhaW5lcicpLmNoaWxkcmVuKCkucmVtb3ZlKCk7XG4gICAgaWYgKGF2YWlsYWJpbGl0eSA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy4kKCcjY2hhdHJvb20tbmFtZS1pbnB1dCcpLmFkZENsYXNzKCdpbnB1dC12YWxpZCcpO1xuICAgICAgdGhpcy4kKCcjY2hhdHJvb20tbmFtZS12YWxpZGF0aW9uLWNvbnRhaW5lcicpLmFwcGVuZCgnPGRpdiBpZD1cIiNjaGF0cm9vbS1uYW1lLXZhbGlkYXRpb25cIiBjbGFzcz1cImZhIGZhLWNoZWNrXCI+TmFtZSBBdmFpbGFibGU8L2Rpdj4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kKCcjY2hhdHJvb20tbmFtZS1pbnB1dCcpLmFkZENsYXNzKCdpbnB1dC1pbnZhbGlkIGZhIGZhLXRpbWVzJyk7XG4gICAgICB0aGlzLiQoJyNjaGF0cm9vbS1uYW1lLXZhbGlkYXRpb24tY29udGFpbmVyJykuYXBwZW5kKCc8ZGl2IGlkPVwiI2NoYXRyb29tLW5hbWUtdmFsaWRhdGlvblwiIGNsYXNzPVwiZmEgZmEtdGltZXNcIj5OYW1lIFVuYXZhaWxhYmxlPC9kaXY+Jyk7XG4gICAgfVxuICB9LFxuXG5cblxuICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgY29uc29sZS5sb2coJ2NoYXRyb29tVmlldy5mLmluaXRpYWxpemU6ICcsIG9wdGlvbnMpO1xuICAgIC8vIHBhc3NlZCB0aGUgdmlld0V2ZW50QnVzXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcbiAgfSxcbiAgcmVuZGVyOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5yZW5kZXInKTtcbiAgICB0aGlzLm1vZGVsID0gbW9kZWwgfHwgdGhpcy5tb2RlbDtcbiAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUodGhpcy5tb2RlbC50b0pTT04oKSkpO1xuICAgIHRoaXMuYWZ0ZXJSZW5kZXIoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgYWZ0ZXJSZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2V0U3ViVmlld3MoKTtcbiAgICB0aGlzLnNldENoYXRMaXN0ZW5lcnMoKTtcbiAgICB0aGlzLmNoYXRyb29tU2VhcmNoVHlwZWFoZWFkKCk7XG4gIH0sXG4gIHNldFN1YlZpZXdzOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNoYXRJbWFnZVVwbG9hZFZpZXcgPSBuZXcgYXBwLkNoYXRJbWFnZVVwbG9hZFZpZXcoKTtcbiAgfSxcbiAgc2V0Q2hhdExpc3RlbmVyczogZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgb25saW5lVXNlcnMgPSB0aGlzLm1vZGVsLmdldCgnb25saW5lVXNlcnMnKTtcbiAgICB0aGlzLmxpc3RlblRvKG9ubGluZVVzZXJzLCBcImFkZFwiLCB0aGlzLnJlbmRlclVzZXIsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8ob25saW5lVXNlcnMsIFwicmVtb3ZlXCIsIHRoaXMucmVuZGVyVXNlcnMsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8ob25saW5lVXNlcnMsIFwicmVzZXRcIiwgdGhpcy5yZW5kZXJVc2VycywgdGhpcyk7XG5cbiAgICB2YXIgb2ZmbGluZVVzZXJzID0gdGhpcy5tb2RlbC5nZXQoJ29mZmxpbmVVc2VycycpO1xuICAgIHRoaXMubGlzdGVuVG8ob2ZmbGluZVVzZXJzLCBcImFkZFwiLCB0aGlzLnJlbmRlck9mZmxpbmVVc2VyLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKG9mZmxpbmVVc2VycywgXCJyZW1vdmVcIiwgdGhpcy5yZW5kZXJPZmZsaW5lVXNlcnMsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8ob2ZmbGluZVVzZXJzLCBcInJlc2V0XCIsIHRoaXMucmVuZGVyT2ZmbGluZVVzZXJzLCB0aGlzKTtcblxuICAgIHZhciBjaGF0bG9nID0gdGhpcy5tb2RlbC5nZXQoJ2NoYXRsb2cnKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRsb2csIFwiYWRkXCIsIHRoaXMucmVuZGVyQ2hhdCwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhjaGF0bG9nLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlckNoYXRzLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRsb2csIFwicmVzZXRcIiwgdGhpcy5yZW5kZXJDaGF0cywgdGhpcyk7XG5cbiAgICB2YXIgY2hhdHJvb21zID0gdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tcycpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcImFkZFwiLCB0aGlzLnJlbmRlclJvb20sIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlclJvb21zLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRyb29tcywgXCJyZXNldFwiLCB0aGlzLnJlbmRlclJvb21zLCB0aGlzKTtcblxuICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJjaGFuZ2U6Y2hhdHJvb21cIiwgdGhpcy5yZW5kZXJIZWFkZXIsIHRoaXMpO1xuXG4gICAgdGhpcy5saXN0ZW5Ubyh0aGlzLmNoYXRJbWFnZVVwbG9hZFZpZXcsICdpbWFnZS11cGxvYWRlZCcsIHRoaXMudXBsb2FkSW1hZ2UpO1xuXG4gICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcIm1vcmVDaGF0c1wiLCB0aGlzLnJlbmRlck1vcmVDaGF0cywgdGhpcyk7XG5cbiAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiY2hhdHJvb21BdmFpbGFiaWxpdHlcIiwgdGhpcy5yZW5kZXJDaGF0cm9vbUF2YWlsYWJpbGl0eSwgdGhpcyk7XG5cbiAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgIHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpLnNjcm9sbChmdW5jdGlvbigpe1xuICAgICAgICAvLyBjaGVja3MgaWYgdGhlcmUncyBlbm91Z2ggY2hhdHMgdG8gd2FycmFudCBhIGdldE1vcmVDaGF0cyBjYWxsXG4gICAgICBpZiAoJCgnI2NoYXRib3gtY29udGVudCcpLnNjcm9sbFRvcCgpID09PSAwICYmIHRoaXNfLm1vZGVsLmdldCgnY2hhdGxvZycpLmxlbmd0aCA+PSAyNSkge1xuICAgICAgICBfLmRlYm91bmNlKHRoaXNfLmdldE1vcmVDaGF0cygpLCAzMDAwKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgICAgICQod2luZG93KS5yZXNpemUoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB3aW5kb3dIZWlnaHQgPSAkKHdpbmRvdykuaGVpZ2h0KCk7XG4gICAgICAgIGlmICh3aW5kb3dIZWlnaHQgPiA1MDApIHtcbiAgICAgICAgICB2YXIgbmV3SGVpZ2h0ID0gd2luZG93SGVpZ2h0IC0gMjg1O1xuICAgICAgICAgICQoJyNjaGF0Ym94LWNvbnRlbnQnKS5oZWlnaHQobmV3SGVpZ2h0KTtcbiAgICAgICAgfVxuXG4gICAgICAgfSk7XG4gIH0sXG5cbiAgY2hhdHJvb21TZWFyY2hUeXBlYWhlYWQ6IGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gaW50ZXJlc3RpbmcgLSB0aGUgJ3RoaXMnIG1ha2VzIGEgZGlmZmVyZW5jZSwgY2FuJ3QgZmluZCAjY2hhdC1zZWFyY2gtaW5wdXQgb3RoZXJ3aXNlXG4gICAgdGhpcy4kKCcjY2hhdC1zZWFyY2gtaW5wdXQnKS50eXBlYWhlYWQoe1xuICAgICAgb25TZWxlY3Q6IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgY29uc29sZS5sb2coaXRlbSk7XG4gICAgICB9LFxuICAgICAgYWpheDoge1xuICAgICAgICB1cmw6ICcvYXBpL3NlYXJjaENoYXRyb29tcycsXG4gICAgICAgIHRyaWdnZXJMZW5ndGg6IDEsXG4gICAgICAgIHByZURpc3BhdGNoOiBmdW5jdGlvbiAocXVlcnkpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmFtZTogcXVlcnlcbiAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICBwcmVQcm9jZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAgICAgIGlmIChkYXRhLnN1Y2Nlc3MgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAvLyBIaWRlIHRoZSBsaXN0LCB0aGVyZSB3YXMgc29tZSBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9KTtcblxuICB9LFxuXG5cblxuLy8gaGVhZGVyc1xuXG4gIHJlbmRlckhlYWRlcjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy4kKCcjY2hhdGJveC1oZWFkZXInKS5odG1sKHRoaXMuaGVhZGVyVGVtcGxhdGUodGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tJykudG9KU09OKCkpKTtcbiAgfSxcblxuICByZW5kZXJEaXJlY3RNZXNzYWdlSGVhZGVyOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLiQoJyNjaGF0Ym94LWhlYWRlcicpLmh0bWwodGhpcy5kaXJlY3RNZXNzYWdlSGVhZGVyVGVtcGxhdGUodGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tJykudG9KU09OKCkpKTtcbiAgfSxcblxuXG5cblxuLy8gdXNlcnNcblxuICByZW5kZXJVc2VyczogZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlclVzZXJzJyk7XG4gICAgY29uc29sZS5sb2coJ1VTRVJTOiAnLCB0aGlzLm1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpKTtcbiAgICB0aGlzLiQoJy5vbmxpbmUtdXNlcnMnKS5lbXB0eSgpO1xuICAgIHRoaXMubW9kZWwuZ2V0KFwib25saW5lVXNlcnNcIikuZWFjaChmdW5jdGlvbiAodXNlcikge1xuICAgICAgdGhpcy5yZW5kZXJVc2VyKHVzZXIpO1xuICAgIH0sIHRoaXMpO1xuICB9LFxuICByZW5kZXJVc2VyOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHRoaXMuJCgnLm9ubGluZS11c2VycycpLmFwcGVuZCh0aGlzLm9ubGluZVVzZXJUZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICB9LFxuICByZW5kZXJPZmZsaW5lVXNlcnM6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5yZW5kZXJPZmZsaW5lVXNlcnMnKTtcbiAgICBjb25zb2xlLmxvZygnT2ZmbGluZSBVU0VSUzogJywgdGhpcy5tb2RlbC5nZXQoXCJvZmZsaW5lVXNlcnNcIikpO1xuICAgIHRoaXMuJCgnLm9mZmxpbmUtdXNlcnMnKS5lbXB0eSgpO1xuICAgIHRoaXMubW9kZWwuZ2V0KFwib2ZmbGluZVVzZXJzXCIpLmVhY2goZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgIHRoaXMucmVuZGVyT2ZmbGluZVVzZXIodXNlcik7XG4gICAgfSwgdGhpcyk7XG4gIH0sXG4gIHJlbmRlck9mZmxpbmVVc2VyOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHRoaXMuJCgnLm9mZmxpbmUtdXNlcnMnKS5hcHBlbmQodGhpcy5vZmZsaW5lVXNlclRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gIH0sXG5cblxuXG5cblxuLy8gY2hhdGxvZ1xuXG4gIHJlbmRlckNoYXRzOiBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYucmVuZGVyQ2hhdHMnKTtcbiAgICBjb25zb2xlLmxvZygnQ0hBVExPRzogJywgdGhpcy5tb2RlbC5nZXQoXCJjaGF0bG9nXCIpKTtcbiAgICB0aGlzLiQoJyNjaGF0Ym94LWNvbnRlbnQnKS5lbXB0eSgpO1xuICAgIHRoaXMubW9kZWwuZ2V0KCdjaGF0bG9nJykuZWFjaChmdW5jdGlvbihjaGF0KSB7XG4gICAgICB0aGlzLnJlbmRlckNoYXQoY2hhdCk7XG4gICAgfSwgdGhpcyk7XG5cbiAgICB0aGlzLmFmdGVyQ2hhdHNSZW5kZXIoKTtcbiAgfSxcblxuICByZW5kZXJDaGF0OiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHRoaXMucmVuZGVyRGF0ZURpdmlkZXJzKG1vZGVsKTtcbiAgICB2YXIgY2hhdFRlbXBsYXRlID0gJCh0aGlzLmNoYXRUZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICAgIGNoYXRUZW1wbGF0ZS5hcHBlbmRUbyh0aGlzLiQoJyNjaGF0Ym94LWNvbnRlbnQnKSkuaGlkZSgpLmZhZGVJbigpLnNsaWRlRG93bigpO1xuICAgICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuICB9LFxuXG4gIHJlbmRlckRhdGVEaXZpZGVyczogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB0aGlzLmN1cnJlbnREYXRlID0gbW9tZW50KG1vZGVsLmdldCgndGltZXN0YW1wJykpLmZvcm1hdCgnZGRkZCwgTU1NTSBEbyBZWVlZJyk7XG4gICAgaWYgKCB0aGlzLmN1cnJlbnREYXRlICE9PSB0aGlzLnByZXZpb3VzRGF0ZSApIHtcbiAgICAgIHZhciBjdXJyZW50RGF0ZSA9ICQodGhpcy5kYXRlVGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICAgIGN1cnJlbnREYXRlLmFwcGVuZFRvKHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpKS5oaWRlKCkuZmFkZUluKCkuc2xpZGVEb3duKCk7XG4gICAgICB0aGlzLnByZXZpb3VzRGF0ZSA9IHRoaXMuY3VycmVudERhdGU7XG4gICAgfVxuICB9LFxuXG4gIGdldE1vcmVDaGF0czogZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLmdldE1vcmVDaGF0cycpO1xuICAgIHZhciBjaGF0cm9vbSA9IHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbScpLFxuICAgIG5hbWUgPSBjaGF0cm9vbS5nZXQoJ25hbWUnKSxcbiAgICBudW1iZXJMb2FkZWQgPSBjaGF0cm9vbS5nZXQoJ251bWJlckxvYWRlZCcpO1xuICAgIHZhciBjaGF0bG9nTGVuZ3RoID0gY2hhdHJvb20uZ2V0KCdjaGF0bG9nTGVuZ3RoJyk7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoJ2dldE1vcmVDaGF0cycsIHsgbmFtZTogbmFtZSwgbnVtYmVyTG9hZGVkOiBudW1iZXJMb2FkZWQsIGNoYXRsb2dMZW5ndGg6IGNoYXRsb2dMZW5ndGh9KTtcbiAgICBjaGF0cm9vbS5zZXQoJ251bWJlckxvYWRlZCcsIChudW1iZXJMb2FkZWQgLSAxKSk7XG4gIH0sXG5cbiAgcmVuZGVyTW9yZUNoYXRzOiBmdW5jdGlvbihjaGF0cykge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5yZW5kZXJNb3JlQ2hhdHMnKTtcbiAgICAvLyB0aGlzLiQoJyNjaGF0Ym94LWNvbnRlbnQnKTtcbiAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgIHZhciBvcmlnaW5hbEhlaWdodCA9ICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG4gICAgdGhpcy5tb3JlQ2hhdENvbGxlY3Rpb24gPSBbXTtcbiAgICBfLmVhY2goY2hhdHMsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICB0aGlzXy5yZW5kZXJNb3JlRGF0ZURpdmlkZXJzKG1vZGVsKTtcbiAgICAgIHZhciBjaGF0VGVtcGxhdGUgPSAkKHRoaXMuY2hhdFRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gICAgICB0aGlzXy5tb3JlQ2hhdENvbGxlY3Rpb24ucHVzaChjaGF0VGVtcGxhdGUpO1xuICAgICAgLy8gY2hhdFRlbXBsYXRlLnByZXBlbmRUbyh0aGlzLiQoJyNjaGF0Ym94LWNvbnRlbnQnKSkuaGlkZSgpLmZhZGVJbigpLnNsaWRlRG93bigpO1xuICAgIH0sIHRoaXMpO1xuICAgIF8uZWFjaCh0aGlzLm1vcmVDaGF0Q29sbGVjdGlvbi5yZXZlcnNlKCksIGZ1bmN0aW9uKHRlbXBsYXRlKSB7XG4gICAgICB0ZW1wbGF0ZS5wcmVwZW5kVG8odGhpcy4kKCcjY2hhdGJveC1jb250ZW50JykpO1xuICAgIH0pO1xuXG4gICAgIHRoaXMuZGF0ZURpdmlkZXIubG9hZCgkKFwiLmZvbGxvd01lQmFyXCIpKTtcbiAgICAgJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQgLSBvcmlnaW5hbEhlaWdodDtcbiAgICAgXG4gIH0sXG5cbiAgcmVuZGVyTW9yZURhdGVEaXZpZGVyczogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB0aGlzLmN1cnJlbnREYXRlID0gbW9tZW50KG1vZGVsLmF0dHJpYnV0ZXMudGltZXN0YW1wKS5mb3JtYXQoJ2RkZGQsIE1NTU0gRG8gWVlZWScpO1xuICAgIGlmICggdGhpcy5jdXJyZW50RGF0ZSAhPT0gdGhpcy5wcmV2aW91c0RhdGUgKSB7XG4gICAgICB2YXIgY3VycmVudERhdGUgPSAkKHRoaXMuZGF0ZVRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gICAgICAvLyBjdXJyZW50RGF0ZS5hcHBlbmRUbyh0aGlzLiQoJyNjaGF0Ym94LWNvbnRlbnQnKSkuaGlkZSgpLmZhZGVJbigpLnNsaWRlRG93bigpO1xuICAgICAgdGhpcy5tb3JlQ2hhdENvbGxlY3Rpb24ucHVzaChjdXJyZW50RGF0ZSk7XG4gICAgICB0aGlzLnByZXZpb3VzRGF0ZSA9IHRoaXMuY3VycmVudERhdGU7XG4gICAgfVxuICB9LFxuXG4gIGF1dG9zaXplcjogZnVuY3Rpb24oKSB7XG4gICAgYXV0b3NpemUoJCgnI21lc3NhZ2UtaW5wdXQnKSk7XG4gIH0sXG4gIFxuICBzY3JvbGxCb3R0b21JbnN1cmFuY2U6IGZ1bmN0aW9uKCl7XG4gICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICB2YXIgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpe1xuICAgICAgdGhpcy4kKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gdGhpcy4kKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuICAgIH0sIDUwKTtcbiAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgfSwgODAwKTtcbiAgfSxcblxuICBhZnRlckNoYXRzUmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmF1dG9zaXplcigpO1xuICAgIHRoaXMuZGF0ZURpdmlkZXIubG9hZCgkKFwiLmZvbGxvd01lQmFyXCIpKTtcbiAgICB0aGlzLnNjcm9sbEJvdHRvbUluc3VyYW5jZSgpO1xuICB9LFxuXG5cblxuXG5cblxuXG5cbi8vIHJvb21zXG5cblxuICBzZWFyY2g6IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMyAmJiAkLnRyaW0oJCgnI2NoYXQtc2VhcmNoLWlucHV0JykudmFsKCkpLmxlbmd0aCA+IDApIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHZhciBuYW1lID0gJCgnI2NoYXQtc2VhcmNoLWlucHV0JykudmFsKCk7XG4gICAgICB0aGlzLmFkZENoYXRyb29tKG5hbWUpO1xuICAgICAgdGhpcy4kKCcjY2hhdC1zZWFyY2gtaW5wdXQnKS52YWwoJycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZygnc2VhcmNoIHR5cGluZycpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBjcmVhdGVSb29tOiBmdW5jdGlvbihlKSB7XG4gICAgdmFyIGZvcm1EYXRhID0ge307XG4gICAgdGhpcy4kKCcjY3JlYXRlQ2hhdHJvb21Gb3JtJykuY2hpbGRyZW4oICdpbnB1dCcgKS5lYWNoKGZ1bmN0aW9uKGksIGVsKSB7XG4gICAgICBpZiAoJChlbCkudmFsKCkgIT09ICcnKSB7XG4gICAgICAgIGZvcm1EYXRhWyQoZWwpLmRhdGEoJ2NyZWF0ZScpXSA9ICQoZWwpLnZhbCgpO1xuICAgICAgICAkKGVsKS52YWwoJycpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMudmVudC50cmlnZ2VyKCdjcmVhdGVSb29tJywgZm9ybURhdGEpO1xuICB9LFxuXG4gIGRlc3Ryb3lSb29tOiBmdW5jdGlvbihlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgdmFyIGNvbmZpcm1hdGlvbiA9IHN3YWwoe1xuICAgICAgdGl0bGU6IFwiRG8geW91IHdpc2ggdG8gZGVzdHJveSB0aGUgcm9vbT9cIixcbiAgICAgIHRleHQ6IFwiVGhpcyBraWxscyB0aGUgcm9vbS5cIixcbiAgICAgIHR5cGU6IFwid2FybmluZ1wiLFxuICAgICAgc2hvd0NhbmNlbEJ1dHRvbjogdHJ1ZSxcbiAgICAgIGNvbmZpcm1CdXR0b25Db2xvcjogXCIjREVCMEIwXCIsXG4gICAgICBjb25maXJtQnV0dG9uVGV4dDogXCJNdWFoYWhhIVwiLFxuICAgICAgY2xvc2VPbkNvbmZpcm06IGZhbHNlLFxuICAgICAgaHRtbDogZmFsc2VcbiAgICB9LCBmdW5jdGlvbigpe1xuICAgICAgc3dhbCh7XG4gICAgICAgIHRpdGxlOiBcIkV2aXNjZXJhdGVkIVwiLFxuICAgICAgICB0ZXh0OiBcIllvdXIgY2hhdHJvb20gaGFzIGJlZW4gcHVyZ2VkLlwiLFxuICAgICAgICB0eXBlOiBcInN1Y2Nlc3NcIixcbiAgICAgICAgY29uZmlybUJ1dHRvbkNvbG9yOiBcIiM3NDlDQThcIixcbiAgICAgIH0pO1xuICAgICAgdGhpc18udmVudC50cmlnZ2VyKCdkZXN0cm95Um9vbScsIHRoaXNfLm1vZGVsLmdldCgnY2hhdHJvb20nKS5nZXQoJ25hbWUnKSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgYWRkQ2hhdHJvb206IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYuYWRkQ2hhdHJvb20nKTtcbiAgICB0aGlzLnZlbnQudHJpZ2dlcignYWRkUm9vbScsIG5hbWUpO1xuICB9LFxuXG4gIHJlbW92ZVJvb206IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgIHZhciBjb25maXJtYXRpb24gPSBzd2FsKHtcbiAgICAgIHRpdGxlOiBcIlJlbW92ZSBUaGlzIFJvb20/XCIsXG4gICAgICB0ZXh0OiBcIkFyZSB5b3Ugc3VyZT8gQXJlIHlvdSBzdXJlIHlvdSdyZSBzdXJlPyBIb3cgc3VyZSBjYW4geW91IGJlP1wiLFxuICAgICAgdHlwZTogXCJ3YXJuaW5nXCIsXG4gICAgICBzaG93Q2FuY2VsQnV0dG9uOiB0cnVlLFxuICAgICAgY29uZmlybUJ1dHRvbkNvbG9yOiBcIiNERUIwQjBcIixcbiAgICAgIGNvbmZpcm1CdXR0b25UZXh0OiBcIk11YWhhaGEhXCIsXG4gICAgICBjbG9zZU9uQ29uZmlybTogZmFsc2UsXG4gICAgICBodG1sOiBmYWxzZVxuICAgIH0sIGZ1bmN0aW9uKCl7XG4gICAgICBzd2FsKHtcbiAgICAgICAgdGl0bGU6IFwiUmVtb3ZlZCFcIixcbiAgICAgICAgdGV4dDogXCJZb3UgYXJlIGZyZWUgb2YgdGhpcyBjaGF0cm9vbS4gR28gb24sIHlvdSdyZSBmcmVlIG5vdy5cIixcbiAgICAgICAgdHlwZTogXCJzdWNjZXNzXCIsXG4gICAgICAgIGNvbmZpcm1CdXR0b25Db2xvcjogXCIjNzQ5Q0E4XCJcbiAgICAgIH0pO1xuICAgICAgdmFyIG5hbWUgPSAkKGUudGFyZ2V0KS5kYXRhKFwicm9vbS1uYW1lXCIpO1xuICAgICAgdGhpc18udmVudC50cmlnZ2VyKCdyZW1vdmVSb29tJywgbmFtZSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgcmVuZGVyUm9vbXM6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5yZW5kZXJSb29tcycpO1xuICAgIGNvbnNvbGUubG9nKCdDSEFUUk9PTVM6ICcsIHRoaXMubW9kZWwuZ2V0KFwiY2hhdHJvb21zXCIpKTtcbiAgICB0aGlzLiQoJy5wdWJsaWMtcm9vbXMnKS5lbXB0eSgpO1xuICAgIHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbXMnKS5lYWNoKGZ1bmN0aW9uIChyb29tKSB7XG4gICAgICB0aGlzLnJlbmRlclJvb20ocm9vbSk7XG4gICAgfSwgdGhpcyk7XG4gIH0sXG5cbiAgcmVuZGVyUm9vbTogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB2YXIgbmFtZTEgPSBtb2RlbC5nZXQoJ25hbWUnKSxcbiAgICBuYW1lMiA9IHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbScpLmdldCgnbmFtZScpO1xuICAgIHRoaXMuJCgnLnB1YmxpYy1yb29tcycpLmFwcGVuZCh0aGlzLnJvb21UZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICAgIGlmIChuYW1lMSA9PT0gbmFtZTIpIHtcbiAgICAgIHRoaXMuJCgnLnJvb20nKS5sYXN0KCkuZmluZCgnLnJvb20tbmFtZScpLmNzcygnY29sb3InLCAnI0RFQjBCMCcpLmZhZGVJbigpO1xuICAgIH1cbiAgfSxcblxuICBqb2luUm9vbTogZnVuY3Rpb24obmFtZSkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5qb2luUm9vbScpO1xuICAgIHRoaXMuY3VycmVudERhdGUgPSAnJztcbiAgICB0aGlzLnByZXZpb3VzRGF0ZSA9ICcnO1xuICAgIHRoaXMudmVudC50cmlnZ2VyKCdqb2luUm9vbScsIG5hbWUpO1xuICB9LFxuXG4vLyBjaGFuZ2UgdG8gJ2pvaW5EaXJlY3RNZXNzYWdlJ1xuICBpbml0RGlyZWN0TWVzc2FnZTogZnVuY3Rpb24oZSkge1xuICAgIHZhciByZWNpcGllbnQgPSAkKGUudGFyZ2V0KS50ZXh0KCkudHJpbSgpO1xuICAgIHRoaXMuY3VycmVudERhdGUgPSAnJztcbiAgICB0aGlzLnByZXZpb3VzRGF0ZSA9ICcnO1xuICAgIHRoaXMudmVudC50cmlnZ2VyKCdpbml0RGlyZWN0TWVzc2FnZScsIHJlY2lwaWVudCk7XG4gIH0sXG5cblxuXG5cblxuLy8gaW1hZ2UgdXBsb2FkXG5cbiB1cGxvYWRJbWFnZTogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICBjb25zb2xlLmxvZygnaW1nIHVybDogJywgcmVzcG9uc2UpO1xuICAgIHRoaXMudmVudC50cmlnZ2VyKFwiY2hhdFwiLCByZXNwb25zZSk7XG4gICAgdGhpcy5zY3JvbGxCb3R0b21JbnN1cmFuY2UoKTtcbiAgfSxcblxuXG5cblxuXG4gIC8vZXZlbnRzXG5cblxuICBtZXNzYWdlSW5wdXRQcmVzc2VkOiBmdW5jdGlvbihlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMgJiYgJC50cmltKCQoJy5tZXNzYWdlLWlucHV0JykudmFsKCkpLmxlbmd0aCA+IDApIHtcbiAgICAgIC8vIGZ1biBmYWN0OiBzZXBhcmF0ZSBldmVudHMgd2l0aCBhIHNwYWNlIGluIHRyaWdnZXIncyBmaXJzdCBhcmcgYW5kIHlvdVxuICAgICAgLy8gY2FuIHRyaWdnZXIgbXVsdGlwbGUgZXZlbnRzLlxuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJjaGF0XCIsIHsgbWVzc2FnZTogdGhpcy4kKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgpfSk7XG4gICAgICB0aGlzLiQoJy5tZXNzYWdlLWlucHV0JykudmFsKCcnKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJ0eXBpbmdcIik7XG4gICAgICBjb25zb2xlLmxvZygnd3V0Jyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBkaXJlY3RNZXNzYWdlSW5wdXRQcmVzc2VkOiBmdW5jdGlvbihlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMgJiYgJC50cmltKCQoJy5kaXJlY3QtbWVzc2FnZS1pbnB1dCcpLnZhbCgpKS5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBmdW4gZmFjdDogc2VwYXJhdGUgZXZlbnRzIHdpdGggYSBzcGFjZSBpbiB0cmlnZ2VyJ3MgZmlyc3QgYXJnIGFuZCB5b3VcbiAgICAgIC8vIGNhbiB0cmlnZ2VyIG11bHRpcGxlIGV2ZW50cy5cbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiZGlyZWN0TWVzc2FnZVwiLCB7IG1lc3NhZ2U6IHRoaXMuJCgnLmRpcmVjdC1tZXNzYWdlLWlucHV0JykudmFsKCl9KTtcbiAgICAgIHRoaXMuJCgnLmRpcmVjdC1tZXNzYWdlLWlucHV0JykudmFsKCcnKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJ0eXBpbmdcIik7XG4gICAgICBjb25zb2xlLmxvZygnaHVoJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBzZXRSb29tOiBmdW5jdGlvbihlKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnNldFJvb20nKTtcbiAgICB2YXIgJHRhciA9ICQoZS50YXJnZXQpO1xuICAgIGlmICgkdGFyLmlzKCdwJykpIHtcbiAgICAgIHRoaXMuam9pblJvb20oJHRhci5kYXRhKCdyb29tJykpO1xuICAgIH1cbiAgfSxcblxuXG4gIGRhdGVEaXZpZGVyOiAoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgJHdpbmRvdyA9ICQod2luZG93KSxcbiAgICAkc3RpY2tpZXM7XG5cbiAgICBsb2FkID0gZnVuY3Rpb24oc3RpY2tpZXMpIHtcbiAgICAgICRzdGlja2llcyA9IHN0aWNraWVzO1xuICAgICAgJCgnI2NoYXRib3gtY29udGVudCcpLnNjcm9sbChzY3JvbGxTdGlja2llc0luaXQpO1xuICAgIH07XG5cbiAgICBzY3JvbGxTdGlja2llc0luaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICQodGhpcykub2ZmKFwic2Nyb2xsLnN0aWNraWVzXCIpO1xuICAgICAgJCh0aGlzKS5vbihcInNjcm9sbC5zdGlja2llc1wiLCBfLmRlYm91bmNlKF93aGVuU2Nyb2xsaW5nLCAxNTApKTtcbiAgICB9O1xuXG4gICAgX3doZW5TY3JvbGxpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgICRzdGlja2llcy5yZW1vdmVDbGFzcygnZml4ZWQnKTtcbiAgICAgICRzdGlja2llcy5lYWNoKGZ1bmN0aW9uKGksIHN0aWNreSkge1xuICAgICAgICB2YXIgJHRoaXNTdGlja3kgPSAkKHN0aWNreSksXG4gICAgICAgICR0aGlzU3RpY2t5VG9wID0gJHRoaXNTdGlja3kub2Zmc2V0KCkudG9wO1xuICAgICAgICBpZiAoJHRoaXNTdGlja3lUb3AgPD0gMTYyKSB7XG4gICAgICAgICAgJHRoaXNTdGlja3kuYWRkQ2xhc3MoXCJmaXhlZFwiKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICBsb2FkOiBsb2FkXG4gICAgfTtcbiAgfSkoKVxuXG5cblxuXG59KTtcblxufSkoalF1ZXJ5KTsiLCJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLkNoYXRyb29tTGlzdCA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcbiAgICBtb2RlbDogYXBwLkNoYXRyb29tTW9kZWwsXG4gICAgdXJsOiAnL2FwaS9jaGF0cm9vbXMnLFxuICB9KTtcblxufSkoKTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG5cbihmdW5jdGlvbigkKSB7XG5cbiAgYXBwLkNoYXRJbWFnZVVwbG9hZFZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG5cbiAgICBlbDogJCgnI2NoYXRJbWFnZVVwbG9hZENvbnRhaW5lcicpLFxuICBcbiAgICBldmVudHM6IHtcbiAgICAgICdjaGFuZ2UgI2NoYXRJbWFnZVVwbG9hZCc6ICdyZW5kZXJUaHVtYicsXG4gICAgICAnYXR0YWNoSW1hZ2UgI2NoYXRJbWFnZVVwbG9hZEZvcm0nOiAndXBsb2FkJyxcbiAgICAgICdjbGljayAjYWRkQ2hhdEltYWdlQnRuJzogJ3N1Ym1pdCcsXG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnJlbmRlclRodW1iKCk7XG4gICAgfSxcblxuICAgIHJlbmRlclRodW1iOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpbnB1dCA9IHRoaXMuJCgnI2NoYXRJbWFnZVVwbG9hZCcpO1xuICAgICAgdmFyIGltZyA9IHRoaXMuJCgnI3VwbG9hZGVkQ2hhdEltYWdlJylbMF07XG4gICAgICBpZihpbnB1dC52YWwoKSAhPT0gJycpIHtcbiAgICAgICAgdmFyIHNlbGVjdGVkX2ZpbGUgPSBpbnB1dFswXS5maWxlc1swXTtcbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSAoZnVuY3Rpb24oYUltZykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBhSW1nLnNyYyA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICB9O1xuICAgICAgICB9KShpbWcpO1xuICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTCggc2VsZWN0ZWRfZmlsZSApO1xuICAgICAgfVxuXG4gICAgfSxcblxuICAgIHN1Ym1pdDogZnVuY3Rpb24oZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy4kZm9ybSA9IHRoaXMuJCgnI2NoYXRJbWFnZVVwbG9hZEZvcm0nKTtcbiAgICAgIHRoaXMuJGZvcm0udHJpZ2dlcignYXR0YWNoSW1hZ2UnKTtcbiAgICB9LFxuXG4gICAgdXBsb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSh0aGlzLiRmb3JtWzBdKTtcbiAgICAgIGlmICh0aGlzLiQoJyNjaGF0SW1hZ2VVcGxvYWQnKVswXS5maWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgIHVybDogJy9hcGkvdXBsb2FkQ2hhdEltYWdlJyxcbiAgICAgICAgICBkYXRhOiBmb3JtRGF0YSxcbiAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiggeGhyICkge1xuICAgICAgICAgICAgX3RoaXMucmVuZGVyU3RhdHVzKCdFcnJvcjogJyArIHhoci5zdGF0dXMpO1xuICAgICAgICAgICAgYWxlcnQoJ1lvdXIgaW1hZ2UgaXMgZWl0aGVyIHRvbyBsYXJnZSBvciBpdCBpcyBub3QgYSAuanBlZywgLnBuZywgb3IgLmdpZi4nKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKCByZXNwb25zZSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdpbWdVcGxvYWQgcmVzcG9uc2U6ICcsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIF90aGlzLnRyaWdnZXIoJ2ltYWdlLXVwbG9hZGVkJywgcmVzcG9uc2UpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ltZ1VwbG9hZCBwYXRoICcsIHJlc3BvbnNlLnBhdGgpO1xuICAgICAgICAgICAgJCgnI2NoYXRJbWFnZVVwbG9hZE1vZGFsJykubW9kYWwoJ2hpZGUnKTtcbiAgICAgICAgICAgIF90aGlzLmNsZWFyRmllbGQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICB0aGlzLnRyaWdnZXIoJ2ltYWdlLXVwbG9hZGVkJyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIHJlbmRlclN0YXR1czogZnVuY3Rpb24oIHN0YXR1cyApIHtcbiAgICAgICQoJyNzdGF0dXMnKS50ZXh0KHN0YXR1cyk7XG4gICAgfSxcblxuICAgIGNsZWFyRmllbGQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kKCcjdXBsb2FkZWRDaGF0SW1hZ2UnKVswXS5zcmMgPSAnJztcbiAgICAgIHRoaXMuJCgnI2NoYXRJbWFnZVVwbG9hZCcpLnZhbCgnJyk7XG4gICAgfVxuXG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5OYXZiYXJWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIGVsOiAnLmxvZ2luLW1lbnUnLFxuICAgIHRlbXBsYXRlOiBfLnRlbXBsYXRlKFwiPHVsIGNsYXNzPSduYXYgbmF2YmFyLXJpZ2h0Jz48JSBpZiAodXNlcm5hbWUpIHsgJT48bGk+SGVsbG8sIDwlPSB1c2VybmFtZSAlPjwvbGk+PGxpPjxhIGhyZWY9Jy8nPjxpIGNsYXNzPSdmYSBmYS1wb3dlci1vZmYgcG93ZXItb2ZmLXN0eWxlIGZhLTJ4Jz48L2k+PC9hPjwvbGk+PCUgfSBlbHNlIHsgJT48bGk+PGEgaHJlZj0nI2xvZyc+bG9naW48L2E+PC9saT48bGk+PGEgaHJlZj0nI3JlZyc+cmVnaXN0ZXI8L2E+PC9saT48JSB9ICU+PC91bD5cIiksXG4gICAgZXZlbnRzOiB7XG4gICAgICBcbiAgICB9LFxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5tb2RlbCA9IG5ldyBhcHAuVXNlck1vZGVsKHsgdXNlcm5hbWU6ICcnIH0pO1xuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJjaGFuZ2VcIiwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzLm1vZGVsLnRvSlNPTigpKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG5cbiAgfSk7XG5cbn0pKGpRdWVyeSk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbiAgYXBwLlJlZ2lzdGVyVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjcmVnaXN0ZXInKS5odG1sKCkpLFxuICAgIHVzZXJuYW1lQXZhaWxhYmxlVGVtcGxhdGU6IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJ1c2VybmFtZS1hdmFpbGFibGUgZmEgZmEtY2hlY2tcIj51c2VybmFtZSBhdmFpbGFibGU8L2Rpdj4nKSxcbiAgICB1c2VybmFtZVRha2VuVGVtcGxhdGU6IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJ1c2VybmFtZS10YWtlbiBmYSBmYS10aW1lc1wiPnVzZXJuYW1lIHRha2VuPC9kaXY+JyksXG4gICAgZXZlbnRzOiB7XG4gICAgICBcImNsaWNrICNzaWduVXBCdG5cIjogXCJzaWduVXBcIixcbiAgICAgIFwia2V5dXAgI3VzZXJuYW1lXCI6IFwidmFsaWRhdGVVc2VybmFtZVwiLFxuICAgIH0sXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9LFxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUoKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHNpZ25VcDogZnVuY3Rpb24oKSB7XG4gICAgfSxcbiAgICB2YWxpZGF0ZVVzZXJuYW1lOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICgkKCcjdXNlcm5hbWUnKS52YWwoKS5sZW5ndGggPCA1KSB7IHJldHVybjsgfVxuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAgIF8uZGVib3VuY2UoJC5wb3N0KCcvcmVnaXN0ZXJWYWxpZGF0aW9uJywgeyB1c2VybmFtZTogJCgnI3VzZXJuYW1lJykudmFsKCkgfSxmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICBkYXRhLnVzZXJuYW1lQXZhaWxhYmxlID9cbiAgICAgICAgICAgdGhpc18ucmVuZGVyVmFsaWRhdGlvbih0aGlzXy51c2VybmFtZUF2YWlsYWJsZVRlbXBsYXRlKCkpXG4gICAgICAgICA6XG4gICAgICAgICAgIHRoaXNfLnJlbmRlclZhbGlkYXRpb24odGhpc18udXNlcm5hbWVUYWtlblRlbXBsYXRlKCkpO1xuICAgICAgfSksIDE1MCk7XG4gICAgfSxcbiAgICByZW5kZXJWYWxpZGF0aW9uOiBmdW5jdGlvbih3aGF0KSB7XG4gICAgICAkKCcucmVnaXN0ZXItZXJyb3ItY29udGFpbmVyJykuZW1wdHkoKTtcbiAgICAgICQod2hhdCkuYXBwZW5kVG8oJCgnLnJlZ2lzdGVyLWVycm9yLWNvbnRhaW5lcicpKS5oaWRlKCkuZmFkZUluKCk7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAkKCcucmVnaXN0ZXItZXJyb3ItY29udGFpbmVyJykuY2hpbGRyZW4oKS5maXJzdCgpLmZhZGVPdXQoKTtcbiAgICAgIH0sIDIwMDApO1xuXG4gICAgfVxuICB9KTtcblxufSkoalF1ZXJ5KTsiLCJcbi8vIFRoZSBDaGF0Q2xpZW50IGlzIGltcGxlbWVudGVkIG9uIG1haW4uanMuXG4vLyBUaGUgY2hhdGNsaWVudCBpcyBhIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIG9uIHRoZSBNYWluQ29udHJvbGxlci5cbi8vIEl0IGJvdGggbGlzdGVucyB0byBhbmQgZW1pdHMgZXZlbnRzIG9uIHRoZSBzb2NrZXQsIGVnOlxuLy8gSXQgaGFzIGl0cyBvd24gbWV0aG9kcyB0aGF0LCB3aGVuIGNhbGxlZCwgZW1pdCB0byB0aGUgc29ja2V0IHcvIGRhdGEuXG4vLyBJdCBhbHNvIHNldHMgcmVzcG9uc2UgbGlzdGVuZXJzIG9uIGNvbm5lY3Rpb24sIHRoZXNlIHJlc3BvbnNlIGxpc3RlbmVyc1xuLy8gbGlzdGVuIHRvIHRoZSBzb2NrZXQgYW5kIHRyaWdnZXIgZXZlbnRzIG9uIHRoZSBhcHBFdmVudEJ1cyBvbiB0aGUgXG4vLyBNYWluQ29udHJvbGxlclxudmFyIENoYXRDbGllbnQgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdC8vIGlzLXR5cGluZyBoZWxwZXIgdmFyaWFibGVzXG5cdHZhciBUWVBJTkdfVElNRVJfTEVOR1RIID0gNDAwOyAvLyBtc1xuICB2YXIgdHlwaW5nID0gZmFsc2U7XG4gIHZhciBsYXN0VHlwaW5nVGltZTtcbiAgXG4gIC8vIHRoaXMgdmVudCBob2xkcyB0aGUgYXBwRXZlbnRCdXNcblx0c2VsZi52ZW50ID0gb3B0aW9ucy52ZW50O1xuXG5cdHNlbGYuaG9zdG5hbWUgPSAnaHR0cDovLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdDtcblxuICAvLyBjb25uZWN0cyB0byBzb2NrZXQsIHNldHMgcmVzcG9uc2UgbGlzdGVuZXJzXG5cdHNlbGYuY29ubmVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmNvbm5lY3QnKTtcblx0XHQvLyB0aGlzIGlvIG1pZ2h0IGJlIGEgbGl0dGxlIGNvbmZ1c2luZy4uLiB3aGVyZSBpcyBpdCBjb21pbmcgZnJvbT9cblx0XHQvLyBpdCdzIGNvbWluZyBmcm9tIHRoZSBzdGF0aWMgbWlkZGxld2FyZSBvbiBzZXJ2ZXIuanMgYmMgZXZlcnl0aGluZ1xuXHRcdC8vIGluIHRoZSAvcHVibGljIGZvbGRlciBoYXMgYmVlbiBhdHRhY2hlZCB0byB0aGUgc2VydmVyLCBhbmQgdmlzYVxuXHRcdC8vIHZlcnNhLlxuXHRcdHNlbGYuc29ja2V0ID0gaW8uY29ubmVjdChzZWxmLmhvc3RuYW1lKTtcbiAgICBzZWxmLnNldFJlc3BvbnNlTGlzdGVuZXJzKHNlbGYuc29ja2V0KTtcbiAgfTtcblxuICBzZWxmLmNvbm5lY3RUb1Jvb20gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuY29ubmVjdFRvUm9vbTogJywgbmFtZSk7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcImNvbm5lY3RUb1Jvb21cIiwgbmFtZSk7XG4gIH07XG5cbiAgLy8gc2VsZi5nZXRDaGF0cm9vbU1vZGVsID0gZnVuY3Rpb24obmFtZSkge1xuICAvLyAgIGNvbnNvbGUubG9nKCdzYy5mLmdldENoYXRyb29tTW9kZWw6ICcsIG5hbWUpO1xuICAvLyAgIHNlbGYuc29ja2V0LmVtaXQoXCJnZXRDaGF0cm9vbU1vZGVsXCIsIG5hbWUpO1xuICAvLyB9O1xuXG4gIHNlbGYuYWRkUm9vbSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5hZGRSb29tOiAnLCBuYW1lKTtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwiYWRkUm9vbVwiLCBuYW1lKTtcbiAgfTtcblxuICBzZWxmLnJlbW92ZVJvb20gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYucmVtb3ZlUm9vbTogJywgbmFtZSk7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcInJlbW92ZVJvb21cIiwgbmFtZSk7XG4gIH07XG5cbiAgc2VsZi5jcmVhdGVSb29tID0gZnVuY3Rpb24oZm9ybURhdGEpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5jcmVhdGVSb29tOiAnLCBmb3JtRGF0YSk7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcImNyZWF0ZVJvb21cIiwgZm9ybURhdGEpO1xuICB9O1xuXG4gIHNlbGYuZGVzdHJveVJvb20gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuZGVzdHJveVJvb206ICcsIG5hbWUpO1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJkZXN0cm95Um9vbVwiLCBuYW1lKTtcbiAgfTtcblxuXG4vLy8vLyBWaWV3RXZlbnRCdXMgbWV0aG9kcyAvLy8vXG4gICAgLy8gbWV0aG9kcyB0aGF0IGVtaXQgdG8gdGhlIGNoYXRzZXJ2ZXJcbiAgc2VsZi5sb2dpbiA9IGZ1bmN0aW9uKHVzZXIpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5sb2dpbjogJywgdXNlcik7XG5cdFx0c2VsZi5zb2NrZXQuZW1pdChcImxvZ2luXCIsIHVzZXIpO1xuXHR9O1xuICAvLyBzZWxmLmxvZ291dCA9IGZ1bmN0aW9uKCkge1xuICAvLyAgIHNlbGYuc29ja2V0LmVtaXQoXCJ3dXRcIik7XG4gIC8vIH07XG5cblxuXG4gIHNlbGYuY2hhdCA9IGZ1bmN0aW9uKGNoYXQpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5jaGF0OiAnLCBjaGF0KTtcblx0XHRzZWxmLnNvY2tldC5lbWl0KFwiY2hhdFwiLCBjaGF0KTtcblx0fTtcbiAgc2VsZi5nZXRNb3JlQ2hhdHMgPSBmdW5jdGlvbihjaGF0UmVxKSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdCgnZ2V0TW9yZUNoYXRzJywgY2hhdFJlcSk7XG4gIH07XG4gIHNlbGYuZGlyZWN0TWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KCdkaXJlY3RNZXNzYWdlJywgbWVzc2FnZSk7XG4gIH07XG5cblxuXG4gIC8vIFR5cGluZyBtZXRob2RzXG5cdHNlbGYuYWRkQ2hhdFR5cGluZyA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgbWVzc2FnZSA9IGRhdGEudXNlcm5hbWUgKyAnIGlzIHR5cGluZyc7XG4gICAgJCgnLnR5cGV0eXBldHlwZScpLnRleHQobWVzc2FnZSk7XG5cdH07XG5cdHNlbGYucmVtb3ZlQ2hhdFR5cGluZyA9IGZ1bmN0aW9uKCkge1xuICAgICQoJy50eXBldHlwZXR5cGUnKS5lbXB0eSgpO1xuXHR9O1xuICBzZWxmLnVwZGF0ZVR5cGluZyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChzZWxmLnNvY2tldCkge1xuICAgICAgaWYgKCF0eXBpbmcpIHtcbiAgICAgICAgdHlwaW5nID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5zb2NrZXQuZW1pdCgndHlwaW5nJyk7XG4gICAgICB9XG4gICAgICBsYXN0VHlwaW5nVGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHlwaW5nVGltZXIgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgICB2YXIgdGltZURpZmYgPSB0eXBpbmdUaW1lciAtIGxhc3RUeXBpbmdUaW1lO1xuICAgICAgICBpZiAodGltZURpZmYgPj0gVFlQSU5HX1RJTUVSX0xFTkdUSCAmJiB0eXBpbmcpIHtcbiAgICAgICAgICAgc2VsZi5zb2NrZXQuZW1pdCgnc3RvcCB0eXBpbmcnKTtcbiAgICAgICAgICAgdHlwaW5nID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0sIFRZUElOR19USU1FUl9MRU5HVEgpO1xuICAgIH1cbiAgfTtcblxuXG4gIC8vIGpvaW4gcm9vbVxuICBzZWxmLmpvaW5Sb29tID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoJ2pvaW5Sb29tJywgbmFtZSk7XG4gIH07XG5cbiAgLy8gc2V0IHJvb21cbiAgLy8gc2VsZi5zZXRSb29tID0gZnVuY3Rpb24obmFtZSkge1xuICAvLyAgIGlmIChuYW1lICE9PSBudWxsKSB7XG4gIC8vICAgICB0aGlzLmN1cnJlbnRSb29tID0gbmFtZTtcbiAgLy8gICB9XG4gIC8vICAgLy8vPj4+Pj4+PiBjaGFuZ2V0aGlzdG8gLmNoYXQtdGl0bGVcbiAgLy8gICB2YXIgJGNoYXRUaXRsZSA9ICQoJy5jaGF0Ym94LWhlYWRlci11c2VybmFtZScpO1xuICAvLyAgICRjaGF0VGl0bGUudGV4dChuYW1lKTtcbiAgLy8gICB2YXIgdGhpc18gPSB0aGlzO1xuICAvLyAgICQoJy5jaGF0LWRpcmVjdG9yeScpLmZpbmQoJy5yb29tJykuZWFjaChmdW5jdGlvbigpIHtcbiAgLy8gICAgIHZhciAkcm9vbSA9ICQodGhpcyk7XG4gIC8vICAgICAkcm9vbS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gIC8vICAgICBpZiAoJHJvb20uZGF0YSgnbmFtZScpID09PSB0aGlzXy5jdXJyZW50Um9vbSkge1xuICAvLyAgICAgICAkcm9vbS5hZGRDbGFzcygnYWN0aXZlJyk7XG4gIC8vICAgICB9XG4gIC8vICAgfSk7XG4gIC8vIH07XG5cbiAgc2VsZi5kb2VzQ2hhdHJvb21FeGlzdCA9IGZ1bmN0aW9uKGNoYXRyb29tUXVlcnkpIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KCdkb2VzQ2hhdHJvb21FeGlzdCcsIGNoYXRyb29tUXVlcnkpO1xuICB9O1xuXG5cblxuXG5cblxuXG5cbiAgc2VsZi5pbml0RGlyZWN0TWVzc2FnZSA9IGZ1bmN0aW9uKHJlY2lwaWVudCkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoJ2luaXREaXJlY3RNZXNzYWdlJywgcmVjaXBpZW50KTtcbiAgfTtcbiAgXG5cblxuXG5cblxuXG5cblxuICAvLy8vLy8vLy8vLy8vLyBjaGF0c2VydmVyIGxpc3RlbmVycy8vLy8vLy8vLy8vLy9cblxuICAvLyB0aGVzZSBndXlzIGxpc3RlbiB0byB0aGUgY2hhdHNlcnZlci9zb2NrZXQgYW5kIGVtaXQgZGF0YSB0byBtYWluLmpzLFxuICAvLyBzcGVjaWZpY2FsbHkgdG8gdGhlIGFwcEV2ZW50QnVzLlxuXHRzZWxmLnNldFJlc3BvbnNlTGlzdGVuZXJzID0gZnVuY3Rpb24oc29ja2V0KSB7XG5cdFx0Ly8gc29ja2V0Lm9uKCd3ZWxjb21lJywgZnVuY3Rpb24oZGF0YSkge1xuICAvLyAgICAgLy8gZW1pdHMgZXZlbnQgdG8gcmVjYWxpYnJhdGUgb25saW5lVXNlcnMgY29sbGVjdGlvblxuICAvLyAgICAgLy8gc29ja2V0LmVtaXQoXCJnZXRPbmxpbmVVc2Vyc1wiKTtcbiAgLy8gICAgIC8vIHNvY2tldC5lbWl0KFwicm9vbXNcIik7XG4gIC8vICAgICAvLyBkYXRhIGlzIHVuZGVmaW5lZCBhdCB0aGlzIHBvaW50IGJlY2F1c2UgaXQncyB0aGUgZmlyc3QgdG9cbiAgLy8gICAgIC8vIGZpcmUgb2ZmIGFuIGV2ZW50IGNoYWluIHRoYXQgd2lsbCBhcHBlbmQgdGhlIG5ldyB1c2VyIHRvIFxuICAvLyAgICAgLy8gdGhlIG9ubGluZVVzZXIgY29sbGVjdGlvblxuICAvLyAgICAgZGVidWdnZXI7XG4gIC8vICAgICBzZWxmLnZlbnQudHJpZ2dlcihcImxvZ2luRG9uZVwiLCBkYXRhKTtcbiAgLy8gICB9KTtcblxuXG4vLyBsb2dpblxuXG4gICAgc29ja2V0Lm9uKCdsb2dpbicsIGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcignbG9naW5Vc2VyJywgdXNlcm5hbWUpO1xuICAgIH0pO1xuXG5cbiAgLy8gICBzb2NrZXQub24oJ2xvZycsIGZ1bmN0aW9uKCkge1xuICAvLyAgICAgZGVidWdnZXI7XG4gIC8vICAgICBjb25zb2xlLmxvZygnc2MuZS5sb2cnKTtcbiAgLy8gICAgIHNlbGYudmVudC50cmlnZ2VyKCdhdXRoZW50aWNhdGVkJyk7XG4gIC8vICAgfSk7XG5cblx0XHQvLyBzb2NrZXQub24oJ3VzZXJzSW5mbycsIGZ1bmN0aW9uKHVzZXJzKSB7XG4gIC8vICAgICBkZWJ1Z2dlcjtcblx0XHQvLyBcdGNvbnNvbGUubG9nKCdzYy5lLnVzZXJzSW5mbzogJywgdXNlcnMpO1xuXHRcdC8vIFx0c2VsZi52ZW50LnRyaWdnZXIoXCJ1c2Vyc0luZm9cIiwgdXNlcnMpO1xuXHRcdC8vIH0pO1xuXG4vLyAgICAgc29ja2V0Lm9uKCdyb29tcycsIGZ1bmN0aW9uKGNoYXRyb29tcykge1xuLy8gZGVidWdnZXI7XG4vLyAgICAgICBjb25zb2xlLmxvZygnc2MuZS5yb29tczogJywgY2hhdHJvb21zKTtcbi8vICAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwicm9vbUluZm9cIiwgY2hhdHJvb21zKTtcbi8vICAgICB9KTtcblxuICAgIC8vIHNvY2tldC5vbignc2V0Um9vbScsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAvLyAgIGRlYnVnZ2VyO1xuICAgIC8vICAgY29uc29sZS5sb2coJ3NjLmUuc2V0Um9vbTogJywgbmFtZSk7XG4gICAgLy8gICBzZWxmLnZlbnQudHJpZ2dlcihcInNldFJvb21cIiwgbmFtZSk7XG4gICAgLy8gfSk7XG5cblxuLy8gY2hhdFxuXHRcdHNvY2tldC5vbigndXNlckpvaW5lZCcsIGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnc2MuZS51c2VySm9pbmVkOiAnLCB1c2VybmFtZSk7XG4gICAgICAvLyBzb2NrZXQuZW1pdChcIm9ubGluZVVzZXJzXCIpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJ1c2VySm9pbmVkXCIsIHVzZXJuYW1lKTtcblx0XHR9KTtcblx0XHRzb2NrZXQub24oJ3VzZXJMZWZ0JywgZnVuY3Rpb24odXNlcm5hbWUpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdzYy5lLnVzZXJMZWZ0OiAnLCB1c2VybmFtZSk7XG4gICAgICAvLyBzb2NrZXQuZW1pdChcIm9ubGluZVVzZXJzXCIpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJ1c2VyTGVmdFwiLCB1c2VybmFtZSk7XG5cdFx0fSk7XG5cdFx0c29ja2V0Lm9uKCdjaGF0JywgZnVuY3Rpb24oY2hhdCkge1xuXHRcdFx0Y29uc29sZS5sb2coJ3NjLmUuY2hhdDogJywgY2hhdCk7XG5cdFx0XHRzZWxmLnZlbnQudHJpZ2dlcihcImNoYXRSZWNlaXZlZFwiLCBjaGF0KTtcblx0XHR9KTtcbiAgICBzb2NrZXQub24oJ21vcmVDaGF0cycsIGZ1bmN0aW9uKGNoYXRzKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcIm1vcmVDaGF0c1wiLCBjaGF0cyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdub01vcmVDaGF0cycsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJub01vcmVDaGF0c1wiKTtcbiAgICB9KTtcblxuXG4vLyBjaGF0cm9vbVxuXG4gICAgc29ja2V0Lm9uKCd0eXBpbmcnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBzZWxmLmFkZENoYXRUeXBpbmcoZGF0YSk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdzdG9wIHR5cGluZycsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5yZW1vdmVDaGF0VHlwaW5nKCk7XG4gICAgfSk7XG5cblxuLy8gc2V0IGNoYXRyb29tXG4gICAgc29ja2V0Lm9uKCdjaGF0bG9nJywgZnVuY3Rpb24oY2hhdGxvZykge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUuY2hhdGxvZzogJywgY2hhdGxvZyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldENoYXRsb2dcIiwgY2hhdGxvZyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdjaGF0cm9vbXMnLCBmdW5jdGlvbihjaGF0cm9vbXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLmNoYXRyb29tczogICcsIGNoYXRyb29tcyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldENoYXRyb29tc1wiLCBjaGF0cm9vbXMpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbignb25saW5lVXNlcnMnLCBmdW5jdGlvbihvbmxpbmVVc2Vycykge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUub25saW5lVXNlcnM6ICcsIG9ubGluZVVzZXJzKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0T25saW5lVXNlcnNcIiwgb25saW5lVXNlcnMpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbignb2ZmbGluZVVzZXJzJywgZnVuY3Rpb24ob2ZmbGluZVVzZXJzKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5vZmZsaW5lVXNlcnM6ICcsIG9mZmxpbmVVc2Vycyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldE9mZmxpbmVVc2Vyc1wiLCBvZmZsaW5lVXNlcnMpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbignY2hhdHJvb21IZWFkZXInLCBmdW5jdGlvbihoZWFkZXJPYmopIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLmNoYXRyb29tSGVhZGVyOiAnLCBoZWFkZXJPYmopO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRDaGF0cm9vbUhlYWRlclwiLCBoZWFkZXJPYmopO1xuICAgIH0pO1xuXG5cbi8vIG1vZGlmeSByb29tXG4gICAgc29ja2V0Lm9uKCdyb29tRGVzdHJveWVkJywgZnVuY3Rpb24obmFtZSkge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUucm9vbURlc3Ryb3llZDogJywgbmFtZSk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInJvb21EZXN0cm95ZWRcIiwgbmFtZSk7XG4gICAgfSk7XG5cbi8vIGNyZWF0ZSByb29tXG4gICAgc29ja2V0Lm9uKCdjaGF0cm9vbUF2YWlsYWJpbGl0eScsIGZ1bmN0aW9uKGF2YWlsYWJpbHR5KSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcignY2hhdHJvb21BdmFpbGFiaWxpdHknLCBhdmFpbGFiaWx0eSk7XG4gICAgfSk7XG5cbi8vIGVycm9yc1xuICAgIHNvY2tldC5vbignY2hhdHJvb21BbHJlYWR5RXhpc3RzJywgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcImNoYXRyb29tQWxyZWFkeUV4aXN0c1wiKTtcbiAgICB9KTtcblxuXG4vLyBEaXJlY3RNZXNzYWdlXG4gICAgc29ja2V0Lm9uKCdzZXREaXJlY3RNZXNzYWdlQ2hhdGxvZycsIGZ1bmN0aW9uKGNoYXRsb2cpIHtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0RE1jaGF0bG9nXCIsIGNoYXRsb2cpO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKCdzZXREaXJlY3RNZXNzYWdlSGVhZGVyJywgZnVuY3Rpb24oaGVhZGVyKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldERNaGVhZGVyXCIsIGhlYWRlcik7XG4gICAgfSk7XG5cbiAgICBzb2NrZXQub24oJ2RpcmVjdE1lc3NhZ2UnLCBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAvLyBzZWxmLnZlbnQudHJpZ2dlcihcInJlbmRlckRpcmVjdE1lc3NhZ2VcIiwgRE0pO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJkaXJlY3RNZXNzYWdlUmVjZWl2ZWRcIiwgbWVzc2FnZSk7XG4gICAgfSk7XG5cblxuXHR9O1xufTsiLCJcblxuYXBwLk1haW5Db250cm9sbGVyID0gZnVuY3Rpb24oKSB7XG5cblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cbiAgLy9UaGVzZSBhbGxvd3MgdXMgdG8gYmluZCBhbmQgdHJpZ2dlciBvbiB0aGUgb2JqZWN0IGZyb20gYW55d2hlcmUgaW4gdGhlIGFwcC5cblx0c2VsZi5hcHBFdmVudEJ1cyA9IF8uZXh0ZW5kKHt9LCBCYWNrYm9uZS5FdmVudHMpO1xuXHRzZWxmLnZpZXdFdmVudEJ1cyA9IF8uZXh0ZW5kKHt9LCBCYWNrYm9uZS5FdmVudHMpO1xuXG5cdHNlbGYuaW5pdCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gbG9naW5Nb2RlbFxuICAgIHNlbGYubG9naW5Nb2RlbCA9IG5ldyBhcHAuTG9naW5Nb2RlbCgpO1xuICAgIHNlbGYubG9naW5WaWV3ID0gbmV3IGFwcC5Mb2dpblZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzLCBtb2RlbDogc2VsZi5sb2dpbk1vZGVsfSk7XG4gICAgc2VsZi5yZWdpc3RlclZpZXcgPSBuZXcgYXBwLlJlZ2lzdGVyVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXMgfSk7XG4gICAgc2VsZi5uYXZiYXJWaWV3ID0gbmV3IGFwcC5OYXZiYXJWaWV3KCk7XG5cbiAgICAvLyBUaGUgQ29udGFpbmVyTW9kZWwgZ2V0cyBwYXNzZWQgYSB2aWV3U3RhdGUsIExvZ2luVmlldywgd2hpY2hcbiAgICAvLyBpcyB0aGUgbG9naW4gcGFnZS4gVGhhdCBMb2dpblZpZXcgZ2V0cyBwYXNzZWQgdGhlIHZpZXdFdmVudEJ1c1xuICAgIC8vIGFuZCB0aGUgTG9naW5Nb2RlbC5cbiAgICBzZWxmLmNvbnRhaW5lck1vZGVsID0gbmV3IGFwcC5Db250YWluZXJNb2RlbCh7IHZpZXdTdGF0ZTogc2VsZi5sb2dpblZpZXd9KTtcblxuICAgIC8vIG5leHQsIGEgbmV3IENvbnRhaW5lclZpZXcgaXMgaW50aWFsaXplZCB3aXRoIHRoZSBuZXdseSBjcmVhdGVkIGNvbnRhaW5lck1vZGVsXG4gICAgLy8gdGhlIGxvZ2luIHBhZ2UgaXMgdGhlbiByZW5kZXJlZC5cbiAgICBzZWxmLmNvbnRhaW5lclZpZXcgPSBuZXcgYXBwLkNvbnRhaW5lclZpZXcoeyBtb2RlbDogc2VsZi5jb250YWluZXJNb2RlbCB9KTtcbiAgICBzZWxmLmNvbnRhaW5lclZpZXcucmVuZGVyKCk7XG5cbiAgfTtcblxuXG4gIHNlbGYuYXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgIFxuICAgICQoXCJib2R5XCIpLmNzcyhcIm92ZXJmbG93XCIsIFwiaGlkZGVuXCIpO1xuICAgIHNlbGYuY2hhdENsaWVudCA9IG5ldyBDaGF0Q2xpZW50KHsgdmVudDogc2VsZi5hcHBFdmVudEJ1cyB9KTtcbiAgICBzZWxmLmNoYXRDbGllbnQuY29ubmVjdCgpO1xuXG4gICAgLy8gbmV3IG1vZGVsIGFuZCB2aWV3IGNyZWF0ZWQgZm9yIGNoYXRyb29tXG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsID0gbmV3IGFwcC5DaGF0cm9vbU1vZGVsKHsgbmFtZTogJ1BhcmxvcicgfSk7XG4gICAgc2VsZi5jaGF0cm9vbUxpc3QgPSBuZXcgYXBwLkNoYXRyb29tTGlzdCgpO1xuICAgIHNlbGYuY2hhdHJvb21MaXN0LmZldGNoKCkuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zZXQoJ2NoYXRyb29tcycsIHNlbGYuY2hhdHJvb21MaXN0KTtcbiAgICAgIHNlbGYuY2hhdHJvb21WaWV3ICA9IG5ldyBhcHAuQ2hhdHJvb21WaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cywgbW9kZWw6IHNlbGYuY2hhdHJvb21Nb2RlbCB9KTtcbiAgICAgIHNlbGYuY29udGFpbmVyTW9kZWwuc2V0KCd2aWV3U3RhdGUnLCBzZWxmLmNoYXRyb29tVmlldyk7XG5cbiAgICAgIHNlbGYuY29ubmVjdFRvUm9vbSgpO1xuICAgICAgLy8gc2VsZi5pbml0Um9vbSgpO1xuICAgICAgIFxuICAgIH0pO1xuXG4gIH07XG5cbiAgc2VsZi5jb25uZWN0VG9Sb29tID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuY29ubmVjdFRvUm9vbShcIlBhcmxvclwiKTtcbiAgfTtcblxuICAvLyBzZWxmLmluaXRSb29tID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgLy8gICBzZWxmLmNoYXRyb29tVmlldy5pbml0Um9vbSgpO1xuICAvLyB9O1xuXG4gIFxuXG5cblxuXG4gIC8vLy8vLy8vLy8vLyAgQnVzc2VzIC8vLy8vLy8vLy8vL1xuICAgIC8vIFRoZXNlIEJ1c3NlcyBsaXN0ZW4gdG8gdGhlIHNvY2tldGNsaWVudFxuICAgLy8gICAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblxuICAvLy8vIHZpZXdFdmVudEJ1cyBMaXN0ZW5lcnMgLy8vLy9cbiAgXG5cdHNlbGYudmlld0V2ZW50QnVzLm9uKFwibG9naW5cIiwgZnVuY3Rpb24odXNlcikge1xuICAgIHNlbGYuY2hhdENsaWVudC5sb2dpbih1c2VyKTtcbiAgfSk7XG5cdHNlbGYudmlld0V2ZW50QnVzLm9uKFwiY2hhdFwiLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmNoYXQoY2hhdCk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcInR5cGluZ1wiLCBmdW5jdGlvbigpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQudXBkYXRlVHlwaW5nKCk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImpvaW5Sb29tXCIsIGZ1bmN0aW9uKHJvb20pIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuam9pblJvb20ocm9vbSk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImFkZFJvb21cIiwgZnVuY3Rpb24ocm9vbSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5hZGRSb29tKHJvb20pO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJyZW1vdmVSb29tXCIsIGZ1bmN0aW9uKHJvb20pIHtcbiAgICBzZWxmLmNoYXRDbGllbnQucmVtb3ZlUm9vbShyb29tKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiY3JlYXRlUm9vbVwiLCBmdW5jdGlvbihmb3JtRGF0YSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5jcmVhdGVSb29tKGZvcm1EYXRhKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiZGVzdHJveVJvb21cIiwgZnVuY3Rpb24ocm9vbSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5kZXN0cm95Um9vbShyb29tKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiZ2V0TW9yZUNoYXRzXCIsIGZ1bmN0aW9uKGNoYXRSZXEpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuZ2V0TW9yZUNoYXRzKGNoYXRSZXEpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJkb2VzQ2hhdHJvb21FeGlzdFwiLCBmdW5jdGlvbihjaGF0cm9vbVF1ZXJ5KSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmRvZXNDaGF0cm9vbUV4aXN0KGNoYXRyb29tUXVlcnkpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJpbml0RGlyZWN0TWVzc2FnZVwiLCBmdW5jdGlvbihyZWNpcGllbnQpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuaW5pdERpcmVjdE1lc3NhZ2UocmVjaXBpZW50KTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiZGlyZWN0TWVzc2FnZVwiLCBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmRpcmVjdE1lc3NhZ2UobWVzc2FnZSk7XG4gIH0pO1xuXG5cblxuXG5cblxuXG4gIC8vLy8gYXBwRXZlbnRCdXMgTGlzdGVuZXJzIC8vLy9cblxuXHQvLyBzZWxmLmFwcEV2ZW50QnVzLm9uKFwidXNlcnNJbmZvXCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAvLyAgICBjb25zb2xlLmxvZygnbWFpbi5lLnVzZXJzSW5mbzogJywgZGF0YSk7XG4gLy8gICAgLy9kYXRhIGlzIGFuIGFycmF5IG9mIHVzZXJuYW1lcywgaW5jbHVkaW5nIHRoZSBuZXcgdXNlclxuXHQvLyBcdC8vIFRoaXMgbWV0aG9kIGdldHMgdGhlIG9ubGluZSB1c2VycyBjb2xsZWN0aW9uIGZyb20gY2hhdHJvb21Nb2RlbC5cblx0Ly8gXHQvLyBvbmxpbmVVc2VycyBpcyB0aGUgY29sbGVjdGlvblxuXHQvLyBcdHZhciBvbmxpbmVVc2VycyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoXCJvbmxpbmVVc2Vyc1wiKTtcbiAvLyAgICBjb25zb2xlLmxvZyhcIi4uLm9ubGluZVVzZXJzOiBcIiwgb25saW5lVXNlcnMpO1xuXHQvLyBcdHZhciB1c2VycyA9IF8ubWFwKGRhdGEsIGZ1bmN0aW9uKGl0ZW0pIHtcblx0Ly8gXHRcdHJldHVybiBuZXcgYXBwLlVzZXJNb2RlbCh7dXNlcm5hbWU6IGl0ZW19KTtcblx0Ly8gXHR9KTtcbiAvLyAgICBjb25zb2xlLmxvZyhcInVzZXJzOiBcIiwgdXNlcnMpO1xuXHQvLyBcdG9ubGluZVVzZXJzLnJlc2V0KHVzZXJzKTtcblx0Ly8gfSk7XG5cbiAvLyAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInJvb21JbmZvXCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAvLyAgICBkZWJ1Z2dlcjtcbiAvLyAgICBjb25zb2xlLmxvZygnbWFpbi5lLnJvb21JbmZvOiAnLCBkYXRhKTtcbiAvLyAgICB2YXIgcm9vbXMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KFwiY2hhdHJvb21zXCIpO1xuIC8vICAgICBjb25zb2xlLmxvZyhcIi4uLnJvb21zOiBcIiwgcm9vbXMpO1xuIC8vICAgIHZhciB1cGRhdGVkUm9vbXMgPSBfLm1hcChkYXRhLCBmdW5jdGlvbihyb29tKSB7XG4gLy8gICAgICB2YXIgbmV3Q2hhdHJvb21Nb2RlbCA9IG5ldyBhcHAuQ2hhdHJvb21Nb2RlbCh7bmFtZTogcm9vbX0pO1xuIC8vICAgICAgcmV0dXJuIG5ld0NoYXRyb29tTW9kZWw7XG4gLy8gICAgfSk7XG4gLy8gICAgY29uc29sZS5sb2coXCIuLi51cGRhdGVkcm9vbXM6IFwiLCB1cGRhdGVkUm9vbXMpO1xuIC8vICAgIHJvb21zLnJlc2V0KHVwZGF0ZWRSb29tcyk7XG4gLy8gIH0pO1xuXG5cblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwibG9naW5Vc2VyXCIsIGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ21haW4uZS5sb2dpblVzZXI6ICcsIHVzZXJuYW1lKTtcbiAgICB2YXIgdXNlciA9IG5ldyBhcHAuVXNlck1vZGVsKHt1c2VybmFtZTogdXNlcm5hbWV9KTtcbiAgICBzZWxmLm5hdmJhclZpZXcubW9kZWwuc2V0KHVzZXIudG9KU09OKCkpO1xuICB9KTtcblxuXG5cbiAgLy8gc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldFJvb21cIiwgZnVuY3Rpb24obW9kZWwpIHtcbiAgLy8gICBjb25zb2xlLmxvZygnbWFpbi5lLnNldFJvb206ICcsIG1vZGVsKTtcblxuICAvLyAgIHZhciBjaGF0bG9nID0gbmV3IGFwcC5DaGF0Q29sbGVjdGlvbihtb2RlbC5jaGF0bG9nKTtcbiAgLy8gICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdjaGF0bG9nJywgY2hhdGxvZyk7XG5cbiAgLy8gICB2YXIgcm9vbXMgPSBuZXcgYXBwLkNoYXRyb29tTGlzdChtb2RlbC5jaGF0cm9vbXMpO1xuICAvLyAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zZXQoJ2NoYXRyb29tcycsIHJvb21zKTtcblxuICAvLyAgIHZhciB1c2VycyA9IG5ldyBhcHAuVXNlckNvbGxlY3Rpb24obW9kZWwub25saW5lVXNlcnMpO1xuICAvLyAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zZXQoJ29ubGluZVVzZXJzJywgdXNlcnMpO1xuXG4gIC8vIH0pO1xuXG5cblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwiQ2hhdHJvb21Nb2RlbFwiLCBmdW5jdGlvbihtb2RlbCkge1xuICAgIGNvbnNvbGUubG9nKCdtYWluLmUuQ2hhdHJvb21Nb2RlbDogJywgbW9kZWwpO1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbCA9IG5ldyBhcHAuQ2hhdHJvb21Nb2RlbCgpO1xuICAgIHNlbGYuY2hhdHJvb21MaXN0ID0gbmV3IGFwcC5DaGF0cm9vbUxpc3QoKTtcbiAgICBzZWxmLmNoYXRyb29tVmlldyAgPSBuZXcgYXBwLkNoYXRyb29tVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXMsIG1vZGVsOiBzZWxmLmNoYXRyb29tTW9kZWwsIGNvbGxlY3Rpb246IHNlbGYuY2hhdHJvb21MaXN0fSk7XG4gICAgc2VsZi5jb250YWluZXJNb2RlbC5zZXQoJ3ZpZXdTdGF0ZScsIHNlbGYuY2hhdHJvb21WaWV3KTtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwubG9hZE1vZGVsKG1vZGVsKTtcbiAgfSk7XG5cblxuXG4gIC8vIGFkZHMgbmV3IHVzZXIgdG8gdXNlcnMgY29sbGVjdGlvbiwgc2VuZHMgZGVmYXVsdCBqb2luaW5nIG1lc3NhZ2Vcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcInVzZXJKb2luZWRcIiwgZnVuY3Rpb24odXNlcm5hbWUpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ21haW4uZS51c2VySm9pbmVkOiAnLCB1c2VybmFtZSk7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLmFkZFVzZXIodXNlcm5hbWUpO1xuXHRcdHNlbGYuY2hhdHJvb21Nb2RlbC5hZGRDaGF0KHtzZW5kZXI6IFwiQnV0dGVyc1wiLCBtZXNzYWdlOiB1c2VybmFtZSArIFwiIGpvaW5lZCByb29tLlwiIH0pO1xuXHR9KTtcblxuXHQvLyByZW1vdmVzIHVzZXIgZnJvbSB1c2VycyBjb2xsZWN0aW9uLCBzZW5kcyBkZWZhdWx0IGxlYXZpbmcgbWVzc2FnZVxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwidXNlckxlZnRcIiwgZnVuY3Rpb24odXNlcm5hbWUpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ21haW4uZS51c2VyTGVmdDogJywgdXNlcm5hbWUpO1xuXHRcdHNlbGYuY2hhdHJvb21Nb2RlbC5yZW1vdmVVc2VyKHVzZXJuYW1lKTtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkQ2hhdCh7c2VuZGVyOiBcIkJ1dHRlcnNcIiwgbWVzc2FnZTogdXNlcm5hbWUgKyBcIiBsZWZ0IHJvb20uXCIgfSk7XG5cdH0pO1xuXG5cdC8vIGNoYXQgcGFzc2VkIGZyb20gc29ja2V0Y2xpZW50LCBhZGRzIGEgbmV3IGNoYXQgbWVzc2FnZSB1c2luZyBjaGF0cm9vbU1vZGVsIG1ldGhvZFxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwiY2hhdFJlY2VpdmVkXCIsIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwuYWRkQ2hhdChjaGF0KTtcblx0XHQkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcblx0fSk7XG5cblxuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInJvb21EZXN0cm95ZWRcIiwgZnVuY3Rpb24obmFtZSkge1xuICAgIHNlbGYuY29ubmVjdFRvUm9vbSgpO1xuICAgIC8vIHNlbGYuaW5pdFJvb20oKTtcbiAgICAvLyBhbGVydCgnQ2hhdHJvb20gJyArIG5hbWUgKyAnIGRlc3Ryb3llZCcpO1xuICB9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0Q2hhdHJvb21IZWFkZXJcIiwgZnVuY3Rpb24oaGVhZGVyT2JqKSB7XG4gICAgdmFyIG5ld0hlYWRlciA9IG5ldyBhcHAuQ2hhdHJvb21IZWFkZXJNb2RlbChoZWFkZXJPYmopO1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zZXQoJ2NoYXRyb29tJywgbmV3SGVhZGVyKTtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldENoYXRsb2dcIiwgZnVuY3Rpb24oY2hhdGxvZykge1xuICAgIHZhciBvbGRDaGF0bG9nID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldCgnY2hhdGxvZycpO1xuICAgIHZhciB1cGRhdGVkQ2hhdGxvZyA9IF8ubWFwKGNoYXRsb2csIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICAgIHZhciBuZXdDaGF0TW9kZWwgPSBuZXcgYXBwLkNoYXRNb2RlbCh7IHJvb206IGNoYXQucm9vbSwgbWVzc2FnZTogY2hhdC5tZXNzYWdlLCBzZW5kZXI6IGNoYXQuc2VuZGVyLCB0aW1lc3RhbXA6IGNoYXQudGltZXN0YW1wLCB1cmw6IGNoYXQudXJsIH0pO1xuICAgICAgcmV0dXJuIG5ld0NoYXRNb2RlbDtcbiAgICB9KTtcbiAgICBvbGRDaGF0bG9nLnJlc2V0KHVwZGF0ZWRDaGF0bG9nKTtcblxuICAgJCgnI21lc3NhZ2UtaW5wdXQnKS5yZW1vdmVDbGFzcygnZGlyZWN0LW1lc3NhZ2UtaW5wdXQnKS5hZGRDbGFzcygnbWVzc2FnZS1pbnB1dCcpO1xuICAgICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuICB9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwibW9yZUNoYXRzXCIsIGZ1bmN0aW9uKGNoYXRsb2cpIHtcbiAgICB2YXIgb2xkQ2hhdGxvZyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoJ2NoYXRsb2cnKTtcbiAgICB2YXIgbW9yZUNoYXRsb2cgPSBfLm1hcChjaGF0bG9nLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgICB2YXIgbmV3Q2hhdE1vZGVsID0gbmV3IGFwcC5DaGF0TW9kZWwoeyByb29tOiBjaGF0LnJvb20sIG1lc3NhZ2U6IGNoYXQubWVzc2FnZSwgc2VuZGVyOiBjaGF0LnNlbmRlciwgdGltZXN0YW1wOiBjaGF0LnRpbWVzdGFtcCwgdXJsOiBjaGF0LnVybCB9KTtcbiAgICAgIHJldHVybiBuZXdDaGF0TW9kZWw7XG4gICAgfSk7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLnRyaWdnZXIoJ21vcmVDaGF0cycsIG1vcmVDaGF0bG9nKTtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcIm5vTW9yZUNoYXRzXCIsIGZ1bmN0aW9uKGNoYXRsb2cpIHtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwuc3RvcExpc3RlbmluZygnbW9yZUNoYXRzJyk7XG4gIH0pO1xuICBcbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldENoYXRyb29tc1wiLCBmdW5jdGlvbihjaGF0cm9vbXMpIHtcbiAgICB2YXIgb2xkQ2hhdHJvb21zID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldCgnY2hhdHJvb21zJyk7XG4gICAgdmFyIHVwZGF0ZWRDaGF0cm9vbXMgPSBfLm1hcChjaGF0cm9vbXMsIGZ1bmN0aW9uKGNoYXRyb29tKSB7XG4gICAgICB2YXIgbmV3Q2hhdHJvb21Nb2RlbCA9IG5ldyBhcHAuQ2hhdHJvb21Nb2RlbCh7IG5hbWU6IGNoYXRyb29tLm5hbWUsIG93bmVyOiBjaGF0cm9vbS5vd25lcn0pO1xuICAgICAgcmV0dXJuIG5ld0NoYXRyb29tTW9kZWw7XG4gICAgfSk7XG4gICAgb2xkQ2hhdHJvb21zLnJlc2V0KHVwZGF0ZWRDaGF0cm9vbXMpO1xuICB9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0T25saW5lVXNlcnNcIiwgZnVuY3Rpb24ob25saW5lVXNlcnMpIHtcbiAgICB2YXIgb2xkT25saW5lVXNlcnMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KCdvbmxpbmVVc2VycycpO1xuICAgIHZhciB1cGRhdGVkT25saW5lVXNlcnMgPSBfLm1hcChvbmxpbmVVc2VycywgZnVuY3Rpb24odXNlcikge1xuICAgICAgdmFyIG5ld1VzZXJNb2RlbCA9IG5ldyBhcHAuVXNlck1vZGVsKHt1c2VybmFtZTogdXNlci51c2VybmFtZX0pO1xuICAgICAgcmV0dXJuIG5ld1VzZXJNb2RlbDtcbiAgICB9KTtcbiAgICBvbGRPbmxpbmVVc2Vycy5yZXNldCh1cGRhdGVkT25saW5lVXNlcnMpO1xuICB9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0T2ZmbGluZVVzZXJzXCIsIGZ1bmN0aW9uKG9mZmxpbmVVc2Vycykge1xuICAgIHZhciBvbGRPZmZsaW5lVXNlcnMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KCdvZmZsaW5lVXNlcnMnKTtcbiAgICB2YXIgdXBkYXRlZE9mZmxpbmVVc2VycyA9IF8ubWFwKG9mZmxpbmVVc2VycywgZnVuY3Rpb24odXNlcikge1xuICAgICAgdmFyIG5ld1VzZXJNb2RlbCA9IG5ldyBhcHAuVXNlck1vZGVsKHt1c2VybmFtZTogdXNlci51c2VybmFtZX0pO1xuICAgICAgcmV0dXJuIG5ld1VzZXJNb2RlbDtcbiAgICB9KTtcbiAgICBvbGRPZmZsaW5lVXNlcnMucmVzZXQodXBkYXRlZE9mZmxpbmVVc2Vycyk7XG4gIH0pO1xuXG5cbi8vIGNoYXRyb29tIGF2YWlsYWJpbGl0eVxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJjaGF0cm9vbUF2YWlsYWJpbGl0eVwiLCBmdW5jdGlvbihhdmFpbGFiaWxpdHkpIHtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwudHJpZ2dlcignY2hhdHJvb21BdmFpbGFiaWxpdHknLCBhdmFpbGFiaWxpdHkpO1xuICB9KTtcblxuXG4vLyBlcnJvcnNcblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJjaGF0cm9vbUFscmVhZHlFeGlzdHNcIiwgZnVuY3Rpb24oKSB7XG4gICAgc3dhbCh7XG4gICAgICB0aXRsZTogXCJPSCBOTyBPSCBOTyBPSCBOT1wiLFxuICAgICAgdGV4dDogXCJDaGF0cm9vbSBBbHJlYWR5LCBJdCBBbHJlYWR5IEV4aXN0cyEgQW5kLiBEb24ndCBHbyBJbiBUaGVyZS4gRG9uJ3QuIFlvdS4gWW91IFNob3VsZCBIYXZlLiBJIFRocmV3IFVwIE9uIFRoZSBTZXJ2ZXIuIFRob3NlIFBvb3IgLiAuIC4gVGhleSBXZXJlIEp1c3QhIE9IIE5PIFdIWS4gV0hZIE9IIE5PLiBPSCBOTy5cIixcbiAgICAgIHR5cGU6IFwiZXJyb3JcIixcbiAgICAgIGNvbmZpcm1CdXR0b25Db2xvcjogXCIjNzQ5Q0E4XCJcbiAgICB9KTtcbiAgfSk7XG5cblxuXG4gIC8vIERpcmVjdE1lc3NhZ2VcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0RE1jaGF0bG9nXCIsIGZ1bmN0aW9uKGNoYXRsb2cpIHtcbiAgICB2YXIgb2xkQ2hhdGxvZyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoJ2NoYXRsb2cnKTtcbiAgICB2YXIgdXBkYXRlZENoYXRsb2cgPSBfLm1hcChjaGF0bG9nLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgICB2YXIgbmV3Q2hhdE1vZGVsID0gbmV3IGFwcC5DaGF0TW9kZWwoeyByb29tOiBjaGF0LnJvb20sIG1lc3NhZ2U6IGNoYXQubWVzc2FnZSwgc2VuZGVyOiBjaGF0LnNlbmRlciwgdGltZXN0YW1wOiBjaGF0LnRpbWVzdGFtcCwgdXJsOiBjaGF0LnVybCB9KTtcbiAgICAgIHJldHVybiBuZXdDaGF0TW9kZWw7XG4gICAgfSk7XG4gICAgb2xkQ2hhdGxvZy5yZXNldCh1cGRhdGVkQ2hhdGxvZyk7XG5cbiAgICAkKCcjbWVzc2FnZS1pbnB1dCcpLnJlbW92ZUNsYXNzKCdtZXNzYWdlLWlucHV0JykuYWRkQ2xhc3MoJ2RpcmVjdC1tZXNzYWdlLWlucHV0Jyk7XG4gICAgJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRETWhlYWRlclwiLCBmdW5jdGlvbihoZWFkZXIpIHtcbiAgICB2YXIgbmV3SGVhZGVyID0gbmV3IGFwcC5DaGF0cm9vbUhlYWRlck1vZGVsKGhlYWRlcik7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnY2hhdHJvb20nLCBuZXdIZWFkZXIpO1xuICB9KTtcblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJkaXJlY3RNZXNzYWdlUmVjZWl2ZWRcIiwgZnVuY3Rpb24obWVzc2FnZSkge1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5hZGRDaGF0KG1lc3NhZ2UpO1xuICAgICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuICB9KTtcbn07XG5cbiIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgLy8gJCh3aW5kb3cpLmJpbmQoJ2JlZm9yZXVubG9hZCcsIGZ1bmN0aW9uKGV2ZW50T2JqZWN0KSB7XG4gIC8vICAgJC5hamF4KHtcbiAgLy8gICAgICB1cmw6IFwiL2xvZ291dFwiLFxuICAvLyAgIH0pO1xuICAvLyB9KTtcblxuICB2YXIgQ2hhdHJvb21Sb3V0ZXIgPSBCYWNrYm9uZS5Sb3V0ZXIuZXh0ZW5kKHtcbiAgICBcbiAgICByb3V0ZXM6IHtcbiAgICAgICcnOiAnc3RhcnQnLFxuICAgICAgJ2xvZyc6ICdsb2dpbicsXG4gICAgICAncmVnJzogJ3JlZ2lzdGVyJyxcbiAgICAgICdvdXQnOiAnb3V0JyxcbiAgICAgICdhdXRoZW50aWNhdGVkJzogJ2F1dGhlbnRpY2F0ZWQnLFxuICAgICAgJ2ZhY2Vib29rJzogJ2ZhY2Vib29rJyxcbiAgICAgICd0d2l0dGVyJzogJ3R3aXR0ZXInXG4gICAgfSxcblxuICAgIHN0YXJ0OiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnLyMnO1xuICAgICAgYXBwLm1haW5Db250cm9sbGVyID0gbmV3IGFwcC5NYWluQ29udHJvbGxlcigpO1xuICAgICAgYXBwLm1haW5Db250cm9sbGVyLmluaXQoKTtcbiAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgfSBcbiAgICAgIGVsc2Uge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgIHVybDogXCIvbG9nb3V0XCIsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0sXG5cblxuICAgIGxvZ2luOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBsb2dpbk1vZGVsID0gbmV3IGFwcC5Mb2dpbk1vZGVsKCk7XG4gICAgICB2YXIgbG9naW5WaWV3ID0gbmV3IGFwcC5Mb2dpblZpZXcoe3ZlbnQ6IGFwcC5tYWluQ29udHJvbGxlci52aWV3RXZlbnRCdXMsIG1vZGVsOiBsb2dpbk1vZGVsfSk7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIuY29udGFpbmVyTW9kZWwuc2V0KFwidmlld1N0YXRlXCIsIGxvZ2luVmlldyk7XG4gICAgfSxcblxuICAgIHJlZ2lzdGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciByZWdpc3RlclZpZXcgPSBuZXcgYXBwLlJlZ2lzdGVyVmlldyh7dmVudDogYXBwLm1haW5Db250cm9sbGVyLnZpZXdFdmVudEJ1cyB9KTtcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlci5jb250YWluZXJNb2RlbC5zZXQoXCJ2aWV3U3RhdGVcIiwgcmVnaXN0ZXJWaWV3KTtcbiAgICB9LFxuXG4gICAgLy8gb3V0OiBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAvLyAgICAgJC5hamF4KHtcbiAgICAvLyAgICAgICB1cmw6IFwiL2xvZ291dFwiLFxuICAgIC8vICAgICB9KVxuICAgIC8vIH0sXG5cbiAgICBhdXRoZW50aWNhdGVkOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghYXBwLm1haW5Db250cm9sbGVyKSB7IHJldHVybiB0aGlzLnN0YXJ0KCk7IH1cbiAgICAgIGFwcC5tYWluQ29udHJvbGxlci5hdXRoZW50aWNhdGVkKCk7XG4gICAgfSxcbiAgICBmYWNlYm9vazogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnN0YXJ0KHRoaXMuYXV0aGVudGljYXRlZCk7XG4gICAgfSxcbiAgICB0d2l0dGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuc3RhcnQodGhpcy5hdXRoZW50aWNhdGVkKTtcbiAgICB9LFxuXG4gIH0pO1xuXG4gIGFwcC5DaGF0cm9vbVJvdXRlciA9IG5ldyBDaGF0cm9vbVJvdXRlcigpO1xuICBCYWNrYm9uZS5oaXN0b3J5LnN0YXJ0KCk7XG5cbn0pKCk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9