
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
      new app.ChatModel({ sender: 'Butters', message: 'awwwwww hamburgers. ||):||', timestamp: _.now(), url: ''})
      ]),
    chatrooms: null,
    privateRooms: null,
    owner: null,
    modelsLoadedSum: 0,
  },
  loadModel: function() {
    console.log('crm.f.loadModel');
  },
  addUser: function(user) {
    console.log('crm.f.addUser');
    this.get('onlineUsers').add(new app.UserModel({ username: user.username, userImage: user.userImage }));
    console.log("--adding-user---");
  },
  removeUser: function(user) {
    console.log('crm.f.removeUser');
    var onlineUsers = this.get('onlineUsers');
    var foundUser = onlineUsers.find(function(userModel) { return userModel.get('username') == user.username; });
    if (foundUser) {
      onlineUsers.remove(foundUser);
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

  app.InvitationModel = Backbone.Model.extend({

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

(function () {

  app.PrivateRoomCollection = Backbone.Collection.extend({
    model: app.ChatroomModel,
  });

})();

var app = app || {};

(function () {

  app.InvitationCollection = Backbone.Collection.extend({
    model: app.InvitationModel
  });

})();
var app = app || {};


(function($) {

  app.ChatImageUploadView = Backbone.View.extend({

    el: $('#chatImageUploadContainer'),
  
    events: {
      'change #chatImageUpload': 'renderThumb',
      'attachImage #chatImageUploadForm': 'upload',
      'click #addChatImageBtn': 'submit',
    },

    // initialize: function() {
    //   this.listenTo(this, "file-chosen", this.renderThumb, this);
    //   this.listenTo(this, "file-chosen", this.renderThumb, this);
    // },

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
            _this.$el.data('chat-type') === 'chat' ?
              _this.trigger('chat-image-uploaded', response) :
              _this.trigger('message-image-uploaded', response);
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

app.ChatroomView = Backbone.View.extend({
  template: _.template($('#chatroom-template').html()),
  chatTemplate: _.template($('#chatbox-message-template').html()),
  roomTemplate: _.template($("#room-list-template").html()),
  headerTemplate: _.template($('#chatroom-header-template').html()),
  directMessageHeaderTemplate: _.template($('#direct-message-header-template').html()),
  onlineUserTemplate: _.template($('#online-users-list-template').html()),
  offlineUserTemplate: _.template($('#offline-users-list-template').html()),
  dateTemplate: _.template('<div class="followWrap"><div class="followMeBar"><span> <%= moment(timestamp).format("MMMM Do") %> </span></div></div>'),
  events: {
    'keypress .message-input': 'messageInputPressed',
    'keypress .direct-message-input': 'directMessageInputPressed',
    'click .chat-directory .room': 'setRoom',
    'keypress #chat-search-input': 'search',
    'click .remove-chatroom': 'removeRoom',
    'click .destroy-chatroom': 'destroyRoom',
    'keyup #chatroom-name-input': 'doesChatroomExist',
    'click .user': 'initDirectMessage',
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
    this.createChatroomView.trigger('chatroomAvailability', availability);
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
    this.chatImageUploadView.setElement(this.$('#chatImageUploadContainer'));
    this.createChatroomView = new app.CreateChatroomView({vent: this.vent});
    this.createChatroomView.setElement(this.$('#createChatroomContainer'));
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

    var privateRooms = this.model.get('privateRooms');
    this.listenTo(privateRooms, "add", this.renderPrivateRoom, this);
    this.listenTo(privateRooms, "remove", this.renderPrivateRooms, this);
    this.listenTo(privateRooms, "reset", this.renderPrivateRooms, this);

    this.listenTo(this.model, "change:chatroom", this.renderHeader, this);

    this.listenTo(this.chatImageUploadView, 'chat-image-uploaded', this.chatUploadImage);
    this.listenTo(this.chatImageUploadView, 'message-image-uploaded', this.messageUploadImage);
    // this.listenTo(this.createChatroomView, 'createRoom', this.createRoom);

    this.listenTo(this.model, "moreChats", this.renderMoreChats, this);

    this.listenTo(this.model, "userInvited", this.userInvited, this);

    this.listenTo(this.model, "chatroomAvailability", this.renderChatroomAvailability, this);
    this.listenTo(this.model, "homeRoomAvailability", this.renderHomeRoomAvailability, this);

    var this_ = this;
    this.$('#chatbox-content').scroll(function(){
        // checks if there's enough chats to warrant a getMoreChats call
      if ($('#chatbox-content').scrollTop() === 0 && this_.model.get('chatlog').length >= 25) {
        if (this_.model.get('chatroom').get('chatType') === 'message') {
          _.debounce(this_.getMoreDirectMessages(), 3000);
        } else {
          _.debounce(this_.getMoreChats(), 3000);
        }
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
      var this_ = this;
      var blood = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        prefetch: {
          url: '/api/publicChatrooms',
          filter: function(data) {
             return _.map(data, function(chatroom) {
                return { name: chatroom };
             });
          },
          ttl: 0,
        },
        remote: {
          url: '/api/searchChatrooms?name=%QUERY',
          wildcard: '%QUERY',
          rateLimitWait: 300,
        }
      });
      blood.clearPrefetchCache();
      blood.initialize();
      var type =  this.$('#chat-search-input').typeahead({
        minLength: 2,
        classNames: {
          input: 'typeahead-input',
          hint: 'typeahead-hint',
          selectable: 'typeahead-selectable',
          menu: 'typeahead-menu',
          highlight: 'typeahead-highlight',
          dataset: 'typeahead-dataset',
        },
      },
      {
        limit: 5,
        source: blood,
        name: 'chatroom-search',
        display: 'name',
      }).on('typeahead:select typeahead:autocomplete', function(obj) {

      });
  },



// headers

  renderHeader: function() {
    this.$('#chatbox-header').html(this.headerTemplate(this.model.get('chatroom').toJSON()));
    this.chatroomSettingsView = new app.ChatroomSettingsView({vent: this.vent, model: this.model.get('chatroom')});
    this.chatroomSettingsView.setElement(this.$('#chatroom-header-container'));
    this.listenTo(this.chatroomSettingsView, 'updateRoom', this.updateRoom);
  },

  renderDirectMessageHeader: function() {
    this.$('#chatbox-header').html(this.directMessageHeaderTemplate(this.model.get('chatroom').toJSON()));
  },

  userInvited: function(data) {
    this.chatroomSettingsView.trigger('userInvited', data);
  },




// users

  renderUsers: function() {
    console.log('crv.f.renderUsers');
    onlineUsers = this.model.get("onlineUsers");
    console.log('USERS: ', onlineUsers);
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
    var chatlog = this.model.get("chatlog");
    console.log('CHATLOG: ', chatlog);
    this.$('#chatbox-content').empty();
    chatlog.each(function(chat) {
      this.renderChat(chat);
    }, this);
    if ( chatlog.length === 0) {
      chatlog.push(new app.ChatModel({ sender: 'Chjat', message: "¯\\_(ツ)_/¯", timestamp: _.now(), url: ''}));
    }
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
    modelsLoadedSum = chatroom.get('modelsLoadedSum');
    var chatlogLength = chatroom.get('chatlogLength');
    this.vent.trigger('getMoreChats', { name: name, modelsLoadedSum: modelsLoadedSum, chatlogLength: chatlogLength});
    chatroom.set('modelsLoadedSum', (modelsLoadedSum - 1));
  },

  getMoreDirectMessages: function() {
    console.log('crv.f.getMoreDriectMessages');
    var chatroom = this.model.get('chatroom'),
    id = chatroom.get('id'),
    modelsLoadedSum = chatroom.get('modelsLoadedSum');
    var chatlogLength = chatroom.get('chatlogLength');
    this.vent.trigger('getMoreDirectMessages', { id: id, modelsLoadedSum: modelsLoadedSum, chatlogLength: chatlogLength});
    chatroom.set('modelsLoadedSum', (modelsLoadedSum - 1));
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
  createRoom: function(form) {
    this.vent.trigger('createRoom', form);
  },
  updateRoom: function(form) {
    var id = this.model.get('chatroom').get('id');
    form.id = id;
    this.vent.trigger('updateRoom', form);
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
      var roomId = this_.model.get('chatroom').id;
      var roomName = this_.model.get('chatroom').get('name');
      var userInRoom = true;
      this_.vent.trigger('destroyRoom', { id: roomId, roomName: roomName, userInRoom: userInRoom });
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
      var currentRoom = this_.model.get('chatroom').id;
      var roomId = $(e.target).data("room-id");
      var roomName = $(e.target).data("room-name");
      var userInRoom = currentRoom === roomId;
      this_.vent.trigger('removeRoom', {id: roomId, roomName: roomName, userInRoom: userInRoom});
    });
  },
  renderRooms: function() {
    console.log('crv.f.renderRooms');
    console.log('CHATROOMS: ', this.model.get("chatrooms"));
    this.$('#public-rooms').empty();
    this.model.get('chatrooms').each(function (room) {
      this.renderRoom(room);
    }, this);
  },
  renderRoom: function(model) {
    var name1 = model.get('name'),
    name2 = this.model.get('chatroom').get('name');
    this.$('#public-rooms').append(this.roomTemplate(model.toJSON()));
    if (name1 === name2) {
      this.$('#public-rooms').find('.room-name').last().addClass('active').fadeIn();
    }
  },
  renderPrivateRooms: function() {
    console.log('crv.f.renderPrivateRooms');
    console.log('PRIVATEROOMS: ', this.model.get("privateRooms"));
    this.$('#private-rooms').empty();
    this.model.get('privateRooms').each(function (room) {
      this.renderPrivateRoom(room);
    }, this);
  },
  renderPrivateRoom: function(model) {
    var name1 = model.get('name'),
    name2 = this.model.get('chatroom').get('name');
    this.$('#private-rooms').append(this.roomTemplate(model.toJSON()));
    if (name1 === name2) {
      this.$('#private-rooms').find('.room-name').last().addClass('active').fadeIn();
    }
  },
  joinRoom: function(name) {
    console.log('crv.f.joinRoom');
     $('#chatImageUploadContainer').data('chat-type', 'chat');
    this.currentDate = '';
    this.previousDate = '';
    this.vent.trigger('joinRoom', name);
  },
// change to 'joinDirectMessage'
  initDirectMessage: function(e) {
    var recipient = {},
        $tar = $(e.currentTarget);
    recipient.username = $tar.text().trim();
    recipient.userImage = $tar.find('img').attr('src');
    this.currentDate = '';
    this.previousDate = '';
    if (this.model.get('chatroom').get('currentUser') !== recipient.username) {
      this.vent.trigger('initDirectMessage', recipient);
    }
  },





// image upload

 chatUploadImage: function(response) {
    console.log('img url: ', response);
    this.vent.trigger("chat", response);
    this.scrollBottomInsurance();
  },

  messageUploadImage: function(response) {
   console.log('img url: ', response);
   this.vent.trigger("directMessage", response);
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
    if ($tar.is('.room-name')) {
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


(function($) {

  app.ChatroomSettingsView = Backbone.View.extend({

    el: $('#chatroom-header-container'),
    userInvitedTemplate: _.template('<div class="user-invited-response success"><%= username %> Invited!</div>'),
    invitationErrorTemplate: _.template('<div class="user-invited-response failure">Failure!</div>'),
    events: {
      'change #preferences-image-upload': 'renderThumb',
      'attachImage #preferences-form': 'upload',
      'click #preferences-btn': 'submit',
      'keyup #invite-user-input': 'inviteUser',
    },

    initialize: function(options) {
      this.vent = options.vent;
      this.userSearchTypeahead();
      var this_ = this;
      $("form").submit(function(e) {
        e.preventDefault();
      });

      this.listenTo(this, "userInvited", this.userInvited, this);
    },

    render: function() {
      this.renderThumb();
    },

    renderThumb: function() {
      var input = this.$('#preferences-image-upload');
      var img = this.$('#uploaded-preferences-image')[0];
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

      this.$form = this.$('#preferences-form');
      this.$form.trigger('attachImage');
    },

    upload: function() {
      var _this = this;
        var formData = new FormData(this.$form[0]);
      if (this.$('#preferences-image-upload')[0].files.length > 0) {
        $.ajax({
          type: 'POST',
          url: '/api/uploadChatroomImage',
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
            var form = _this.createRoomFormData();
            form.roomImage = response.roomImage;
            _this.trigger('updateRoom', form);
            $('#preferences-modal').modal('hide');
            _this.clearField();
          }
        });
      } else {
        var form = this.createRoomFormData();
        this.trigger('updateRoom', form);
      }
      return false;
    },


    createRoomFormData: function() {
      var formData = {};
      this.$('#preferences-form').find( 'input' ).each(function(i, el) {
        if ($(el).data('create') === 'privacy') {
          var val = $(el).prop('checked');
          formData['privacy'] = val;
        } else if ($(el).val() !== '' && $(el).val() !== 'on') {
          formData[$(el).data('create')] = $(el).val();
          $(el).val('');
        }
      });
      delete formData.undefined;
      return formData;
    },

    renderStatus: function( status ) {
      $('#status').text(status);
    },

    clearField: function() {
      this.$('#uploaded-preferences-image')[0].src = '';
      this.$('#preferences-image-upload').val('');
    },

    inviteUser: function(e) {
      e.preventDefault();
      var recipient = $.trim($('#invite-user-input').val());
      if (e.keyCode === 13 && recipient.length > 0) {
        // e.preventDefault();
        var sender = this.model.get('currentUser'),
            roomId = this.model.get('id'),
            roomName = this.model.get('name'),
            invitationObj = {sender: sender, roomId: roomId, roomName: roomName, recipient: recipient};
        this.vent.trigger('inviteUser', invitationObj);
        $('#invite-user-input').val('');
      } else {
        // console.log('search typing');
      }
      return this;
    },

    userSearchTypeahead: function() {
      var this_ = this;
      var blood = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('username'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        prefetch: {
          url: '/allUsers',
          filter: function(data) {
            console.log('------daaataa----', data);
             return _.map(data, function(user) {
                return { username: user };
             });
          },
          ttl: 0,
        },
        remote: {
          url: '/searchUsers?username=%QUERY',
          wildcard: '%QUERY',
          rateLimitWait: 300,
        }
      });
      blood.clearPrefetchCache();
      blood.initialize();
      $('#invite-user-input').typeahead({
        minLength: 2,
        classNames: {
          input: 'typeahead-input',
          hint: 'typeahead-hint',
          selectable: 'typeahead-selectable',
          menu: 'typeahead-menu',
          highlight: 'typeahead-highlight',
          dataset: 'typeahead-dataset',
        },
      },
      {
        limit: 5,
        source: blood,
        name: 'user-search',
        display: 'username',
      }).on('typeahead:select typeahead:autocomplete', function(obj) {

      });
    },

    userInvited: function(username) {
      if (username.error === 'error') {
        $('.invite-user-container').append(this.invitationErrorTemplate());
      }
      $('.invite-user-container').append(this.userInvitedTemplate({username: username}));
      setTimeout(function() {
        $('.invite-user-container .success').fadeOut(300, function() {
          $(this).remove();
        });
        $('.invite-user-container .failure').fadeOut(300, function() {
          $(this).remove();
        });
      }, 1000);
    },


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

  app.CreateChatroomView = Backbone.View.extend({

    el: $('#createChatroomContainer'),
    events: {
      'change #chatroomImageUpload': 'renderThumb',
      'attachImage #createChatroomForm': 'upload',
      'click #createChatroomBtn': 'submit',
    },

    initialize: function(options) {
      this.vent = options.vent;
      this.listenTo(this, "chatroomAvailability", this.renderChatroomAvailability, this);
    },

    render: function() {
      this.renderThumb();
    },

    renderThumb: function() {
      var input = this.$('#chatroomImageUpload');
      var img = this.$('#uploadedChatroomImage')[0];
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
      if (this.$('#chatroom-name-input').hasClass('input-invalid')) {
        swal({
          title: "OH NO OH NO OH NO",
          text: "Chatroom Already, It Already Exists! And. Don't Go In There. Don't. You. You Should Have. I Threw Up In My Hat. Those Poor . . . They Were Just! OH NO WHY. WHY OH NO. OH NO.",
          type: "error",
          confirmButtonColor: "#749CA8"
        });
      } else {
        this.$form = this.$('#createChatroomForm');
        this.$form.trigger('attachImage');
      }
    },

    upload: function() {
      var _this = this;
      var formData = new FormData(this.$form[0]);
      if (this.$('#chatroomImageUpload')[0].files.length > 0) {
        $.ajax({
          type: 'POST',
          url: '/api/uploadChatroomImage',
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
            var form = _this.createRoomFormData();
            response.name = form.name;
              _this.vent.trigger('createRoom', response);
            $('#createChatroomModal').modal('hide');
            _this.clearField();
          }
        });
      } else {
        var form = _this.createRoomFormData();
       this.vent.trigger('createRoom', form);
      }
      return false;
    },


    createRoomFormData: function() {
      var formData = {};
      formData.roomImage = '/img/chjat-icon1.png';
      this.$('#createChatroomForm').find( 'input' ).each(function(i, el) {
        if ($(el).prop('type') === "button") {

        } else if ($(el).data('create') === 'privacy') {
          var val = $(el).prop('checked');
          formData['privacy'] = val;
        } else if ($(el).val() !== '') {
          formData[$(el).data('create')] = $(el).val();
          $(el).val('');
        }
      });
      return formData;

    },

    renderStatus: function( status ) {
      $('#status').text(status);
    },

    clearField: function() {
      this.$('#uploadedChatroomImage')[0].src = '';
      this.$('#chatroomImageUpload').val('');
    },

    renderChatroomAvailability: function(availability) {
      this.$('.room-name-validation').removeClass('input-valid input-invalid');
      this.$('.room-name-validation-message').children().remove();
      if (availability === true) {
        this.$('.room-name-validation').addClass('input-valid');
        this.$('.room-name-validation-message').append('<div id="#chatroom-name-validation" class="fa fa-check">Name Available</div>');
      } else {
        this.$('.room-name-validation').addClass('input-invalid fa fa-times');
        this.$('.room-name-validation-message').append('<div id="#chatroom-name-validation" class="fa fa-times">Name Unavailable</div>');
      }
      setTimeout(function() {
        this.$('.room-name-validation-message').children().fadeOut(600, function(){
          $(this).children().remove();
        });
      }, 2000);
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
      var sendData = {username: this.$('#username').val(), password: this.$('#password').val()};
    $.ajax({
        url: "/login",
        method: 'POST',
        data: sendData,
        success: function(data) {
           console.log('success data: ', data);
           if (data.message) {
             this_.renderValidation(this_.errorTemplate(data));
           }
           else if (data === 200) {
            app.ChatroomRouter.navigate('authenticated', { trigger: true });

           }
           else {
            console.log('oops, the else: ', data);
          }
        }
      }).done(function() {
        console.log('doneeeeeeee');
                    this_.vent.trigger("login", sendData);
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
    template: _.template($('#navbar-template').html()),
    invitationTemplate: _.template($('#invitation-template').html()),
    events: {
      'click .delete-invitation': 'deleteInvitation',
      'click .accept-invitation': 'acceptInvitation',
      'change #user-preferences-image-upload': 'renderThumb',
      'attachImage #user-preferences-form': 'upload',
      'click #user-preferences-btn': 'submit',
      'keyup #user-preferences-home-room-input': 'doesHomeRoomExist',
      // 'keypress #user-preferences-home-room-input': 'doesHomeRoomExist',
    },

    initialize: function(options) {
      this.vent = options.vent;
      this.model = new app.UserModel({ username: '', userImage: '', homeRoom: '', invitations: new app.InvitationCollection() });
      this.listenTo(this.model, "change", this.render, this);

      var invitations = this.model.get('invitations');

      this.listenTo(invitations, "reset", this.renderInvitations, this);
      this.listenTo(this, "homeRoomAvailability", this.renderHomeRoomAvailability, this);

      this.render();
    },
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));

      this.renderInvitations();
      this.setHomeRoomTyepahead();


      return this;
    },
    renderInvitations: function() {
      this.$('#invitations').empty();
      var invitations = this.model.get('invitations');
      var this_ = this;
      invitations.each(function(invite) {
        this_.renderInvitation(invite);
      }, this);
      if (invitations.length === 0) {
        this.$('.pink-fuzz').hide();
        this.$('#invitations').append("<div>You've got no invitations, like dang</div>");
      } else {
        this.$('.pink-fuzz').show();
      }
    },
    renderInvitation: function(model) {
      this.$('#invitations').append(this.invitationTemplate(model.toJSON()));
    },
    deleteInvitation: function(e) {
      var roomId = $(e.target).data('roomid');
      this.vent.trigger('deleteInvitation', roomId);
    },
    acceptInvitation: function(e) {
      var roomId = $(e.target).data('roomid');
      this.vent.trigger('acceptInvitation', roomId);
    },


    renderThumb: function() {
      var input = this.$('#user-preferences-image-upload');
      var img = this.$('#uploaded-user-preferences-image')[0];
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
      if (this.$('#user-preferences-home-room-input').hasClass('input-invalid')) {
        swal({
          title: "OH NO OH NO OH NO",
          text: "Chatroom Can't, It Doesn't Exist! And. I Don't Know. Should I? Should You? Who. I Mean How DO we. How do? How do now?",
          type: "error",
          confirmButtonColor: "#749CA8"
        });
      } else {
        this.$form = this.$('#user-preferences-form');
        this.$form.trigger('attachImage');
      }
    },

    upload: function() {
      var this_ = this;
        var formData = new FormData(this.$form[0]);
      if (this.$('#user-preferences-image-upload')[0].files.length > 0) {
        $.ajax({
          type: 'POST',
          url: '/updateUserImage',
          data: formData,
          cache: false,
          dataType: 'json',
          processData: false,
          contentType: false,
          error: function( xhr ) {
            this_.renderStatus('Error: ' + xhr.status);
            alert('Your image is either too large or it is not a .jpeg, .png, or .gif.');
          },
          success: function( response ) {
            console.log('imgUpload response: ', response);
            var form = this_.createUserFormData();
            form.userImage = response.userImage;
            this_.vent.trigger('updateUser', form);
            $('#user-preferences-modal').modal('hide');
            this_.clearField();
          }
        });
      } else {
        var form = this.createUserFormData();
        this.vent.trigger('updateUser', form);
      }
      return false;
    },

    createUserFormData: function() {
      var formData = {};
      this.$('#user-preferences-form').find( 'input' ).each(function(i, el) {
        if ($(el).data('create') === 'privacy') {
          var val = $(el).prop('checked');
          formData['privacy'] = val;
        } else if ($(el).val() !== '' && $(el).val() !== 'on') {
          formData[$(el).data('create')] = $(el).val();
          $(el).val('');
        }
      });
      delete formData.undefined;
      return formData;
    },

    clearField: function() {
      this.$('#uploaded-user-preferences-image')[0].src = '';
      this.$('#user-preferences-image-upload').val('');
    },

    setHomeRoomTyepahead: function() {
      var this_ = this;
      var blood = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        prefetch: {
          url: '/api/publicChatrooms',
          filter: function(data) {
            console.log('---------homeRoomData: ', data);
             return _.map(data, function(chatroom) {
                return { name: chatroom };
             });
          },
          ttl_ms: 0,
        },
        remote: {
          url: '/api/searchChatrooms?name=%QUERY',
          wildcard: '%QUERY',
          rateLimitWait: 300,
        }
      });
      blood.clearPrefetchCache();
      blood.initialize();
      var type = this.$('#user-preferences-home-room-input').typeahead({
        minLength: 2,
        classNames: {
          input: 'typeahead-input',
          hint: 'typeahead-hint',
          selectable: 'typeahead-selectable',
          menu: 'typeahead-menu',
          highlight: 'typeahead-highlight',
          dataset: 'typeahead-dataset',
        },
      },
      {
        limit: 5,
        source: blood,
        name: 'home-room-search',
        display: 'name',
      }).on('typeahead:select typeahead:autocomplete', function(obj) {
        this_.doesHomeRoomExist();
      });
    },

    doesHomeRoomExist: function() {
      this.$('.room-name-validation').removeClass('input-valid input-invalid');
      var this_ = this;
      var check = function() {
        if ($.trim($('#user-preferences-home-room-input').val()).length > 0) {
          var chatroomName = $('#user-preferences-home-room-input').val();
          this_.vent.trigger('doesHomeRoomExist', chatroomName);
        } else {
         this_.$('#user-preferences-home-room-input').children().remove();
         this_.$('#user-preferences-home-room-input').removeClass('input-valid input-invalid');
       }
     };
     _.debounce(check(), 30);
   },

   renderHomeRoomAvailability: function(availability) {

    this.$('.room-name-validation').removeClass('input-valid input-invalid');
    this.$('.room-name-validation-message').children().remove();
    if (availability === false) {
      this.$('.room-name-validation').addClass('input-valid');
      this.$('.room-name-validation-message').append('<div id="#chatroom-name-validation" class="fa fa-check"></div>');
    } else {
      this.$('.room-name-validation').addClass('input-invalid fa fa-times');
      this.$('.room-name-validation-message').append('<div id="#chatroom-name-validation" class="fa fa-times">Chatroom Does Not Exist</div>');
    }
    setTimeout(function() {
      this.$('.room-name-validation-message').children().fadeOut(600, function(){
        $(this).children().remove();
      });
    }, 2000);
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



///// ViewEventBus methods ////
    // methods that emit to the chatserver

// LOGIN
  self.login = function(user) {
    console.log('sc.f.login: ', user);
    self.socket.emit("login", user);
  };


// ROOM
  self.connectToRoom = function(name) {
    console.log('sc.f.connectToRoom: ', name);
    self.socket.emit("connectToRoom", name);
  };
  self.joinRoom = function(name) {
    self.socket.emit('joinRoom', name);
  };
  self.addRoom = function(name) {
    console.log('sc.f.addRoom: ', name);
    self.socket.emit("addRoom", name);
  };
  self.removeRoom = function(roomData) {
    console.log('sc.f.removeRoom: ', roomData);
    self.socket.emit("removeRoom", roomData);
  };
  self.createRoom = function(formData) {
    console.log('sc.f.createRoom: ', formData);
    self.socket.emit("createRoom", formData);
  };
  self.updateRoom = function(formData) {
    console.log('sc.f.updateRoom: ', formData);
    self.socket.emit("updateRoom", formData);
  };
  self.destroyRoom = function(roomInfo) {
    console.log('sc.f.destroyRoom: ', roomInfo);
    self.socket.emit("destroyRoom", roomInfo);
  };



// CHAT
  self.chat = function(chat) {
    console.log('sc.f.chat: ', chat);
		self.socket.emit("chat", chat);
	};
  self.getMoreChats = function(chatReq) {
    self.socket.emit('getMoreChats', chatReq);
  };


// DIRECT MESSAGE
  self.initDirectMessage = function(recipient) {
    self.socket.emit('initDirectMessage', recipient);
  };
  self.directMessage = function(directMessage) {
    self.socket.emit('directMessage', directMessage);
  };
  self.getMoreDirectMessages = function(directMessageReq) {
    self.socket.emit('getMoreDirectMessages', directMessageReq);
  };
  

// TYPING
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


// INVITATIONS
  self.inviteUser = function(invitationObj) {
    self.socket.emit("inviteUser", invitationObj);
  };
  self.deleteInvitation = function(roomId) {
    self.socket.emit("deleteInvitation", roomId);
  };
  self.acceptInvitation = function(roomId) {
    self.socket.emit("acceptInvitation", roomId);
  };

// UPDATE USER
  self.updateUser = function(userObj) {
    self.socket.emit("updateUser", userObj);
  };



// ERROR HANDLING
  self.doesChatroomExist = function(chatroomQuery) {
    self.socket.emit('doesChatroomExist', chatroomQuery);
  };
  self.doesHomeRoomExist = function(homeRoomQuery) {
    self.socket.emit('doesHomeRoomExist', homeRoomQuery);
  };


  




  ////////////// chatserver listeners/////////////

  // these guys listen to the chatserver/socket and emit data to main.js,
  // specifically to the appEventBus.
	self.setResponseListeners = function(socket) {


// LOGIN
    socket.on('login', function(user) {
      console.log('sc.e.login');
      self.vent.trigger('loginUser', user);
      self.connectToRoom(user.homeRoom);
    });


// CHAT
		socket.on('userJoined', function(user) {
			console.log('sc.e.userJoined: ', user);
      // socket.emit("onlineUsers");
			self.vent.trigger("userJoined", user);
		});
		socket.on('userLeft', function(user) {
			console.log('sc.e.userLeft: ', user);
      // socket.emit("onlineUsers");
			self.vent.trigger("userLeft", user);
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


// DIRECT MESSAGE
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



// TYPING
    socket.on('typing', function(data) {
      self.addChatTyping(data);
    });
    socket.on('stop typing', function() {
      self.removeChatTyping();
    });


// SET ROOM
    socket.on('chatlog', function(chatlog) {
      console.log('sc.e.chatlog: ', chatlog);
      self.vent.trigger("setChatlog", chatlog);
    });
    socket.on('chatrooms', function(chatrooms) {
      console.log('sc.e.chatrooms:  ', chatrooms);
      self.vent.trigger("setChatrooms", chatrooms);
    });
    socket.on('privateRooms', function(rooms) {
      console.log('sc.e.privateRooms:  ', rooms);
      self.vent.trigger("setPrivateRooms", rooms);
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


// REDIRECT TO HOME ROOM
    socket.on('redirectToHomeRoom', function(data) {
      console.log('sc.e.redirectToHomeRoom: ', data);
      self.vent.trigger("redirectToHomeRoom", data);
    });

// ROOM AVAILABILITY
    socket.on('chatroomAvailability', function(availabilty) {
      self.vent.trigger('chatroomAvailability', availabilty);
    });

    socket.on('homeRoomAvailability', function(availabilty) {
      self.vent.trigger('homeRoomAvailability', availabilty);
    });


// ERROR HANDLING
    socket.on('chatroomAlreadyExists', function() {
      self.vent.trigger("chatroomAlreadyExists");
    });

    socket.on('destroyRoomResponse', function(res) {
      self.vent.trigger("destroyRoomResponse", res);
    });

// INVITATIONS
    socket.on('refreshInvitations', function(invitations) {
      self.vent.trigger("refreshInvitations", invitations);
    });
    socket.on('userInvited', function(user) {
      self.vent.trigger("userInvited", user);
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
    self.navbarView = new app.NavbarView({vent: self.viewEventBus});


    // The ContainerModel gets passed a viewState, LoginView, which
    // is the login page. That LoginView gets passed the viewEventBus
    // and the LoginModel.
    self.containerModel = new app.ContainerModel({ viewState: self.loginView});

    // next, a new ContainerView is intialized with the newly created containerModel
    // the login page is then rendered.
    self.containerView = new app.ContainerView({ model: self.containerModel });
    self.containerView.render();

 
    $('form').keypress(function(e) {
      return e.keyCode != 13;
    });


  };


  self.authenticated = function() {

    console.log('f.main.authenticated');
       
    $("body").css("overflow", "hidden");
    $('form').keypress(function(e) {
      return e.keyCode != 13;
    });

    debugger;
    self.chatClient = new ChatClient({ vent: self.appEventBus });
          console.log('huh');
    self.chatClient.connect();

    // new model and view created for chatroom
    self.chatroomModel = new app.ChatroomModel({ name: 'Parlor' });
    self.chatroomList = new app.ChatroomList();
    self.privateRoomCollection = new app.PrivateRoomCollection();
    self.chatroomList.fetch().done(function() {
      self.chatroomModel.set('chatrooms', self.chatroomList);
      self.chatroomModel.set('privateRooms', self.privateRoomCollection);
      self.chatroomView  = new app.ChatroomView({vent: self.viewEventBus, model: self.chatroomModel });
      self.containerModel.set('viewState', self.chatroomView);
      

      // self.connectToRoom();
      // self.initRoom();
           // ;
    });

  };

  // self.connectToRoom = function() {
  //   console.log('f.main.connectToRoom');
  //   self.chatClient.connectToRoom("Parlor");
  // };

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
  self.viewEventBus.on("removeRoom", function(roomData) {
    self.chatClient.removeRoom(roomData);
  });
  self.viewEventBus.on("createRoom", function(formData) {
    self.chatClient.createRoom(formData);
  });
  self.viewEventBus.on("updateRoom", function(formData) {
    self.chatClient.updateRoom(formData);
  });
  self.viewEventBus.on("destroyRoom", function(roomInfo) {
    self.chatClient.destroyRoom(roomInfo);
  });
  self.viewEventBus.on("getMoreChats", function(chatReq) {
    self.chatClient.getMoreChats(chatReq);
  });
  self.viewEventBus.on("doesChatroomExist", function(chatroomQuery) {
    self.chatClient.doesChatroomExist(chatroomQuery);
  });
  self.viewEventBus.on("doesHomeRoomExist", function(chatroomQuery) {
    self.chatClient.doesHomeRoomExist(chatroomQuery);
  });
  self.viewEventBus.on("initDirectMessage", function(recipient) {
    self.chatClient.initDirectMessage(recipient);
  });
  self.viewEventBus.on("directMessage", function(directMessage) {
    self.chatClient.directMessage(directMessage);
  });
  self.viewEventBus.on("getMoreDirectMessages", function(directMessageReq) {
    self.chatClient.getMoreDirectMessages(directMessageReq);
  });
  self.viewEventBus.on("inviteUser", function(invitationObj) {
    self.chatClient.inviteUser(invitationObj);
  });
  self.viewEventBus.on("deleteInvitation", function(roomId) {
    self.chatClient.deleteInvitation(roomId);
  });
  self.viewEventBus.on("acceptInvitation", function(roomId) {
    self.chatClient.acceptInvitation(roomId);
  });
  self.viewEventBus.on("updateUser", function(userObj) {
    self.chatClient.updateUser(userObj);
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



  self.appEventBus.on("loginUser", function(user) {
    console.log('main.e.loginUser: ', user);
    invitations = self.navbarView.model.get('invitations');
    newInvitations = _.map(user.invitations, function(invite) {
       var newInvitation = new app.InvitationModel(invite);
       return newInvitation;
    });
    invitations.reset(newInvitations);
    self.navbarView.model.set({ 'username': user.username, 'homeRoom': user.homeRoom, 'userImage': user.userImage });
  });

  self.appEventBus.on("refreshInvitations", function(invitations) {
    console.log('main.e.refreshInvitations: ', invitations);
    oldInvitations = self.navbarView.model.get('invitations');
    newInvitations = _.map(invitations, function(invite) {
       var newInvitation = new app.InvitationModel(invite);
       return newInvitation;
    });
    oldInvitations.reset(newInvitations);
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
	self.appEventBus.on("userJoined", function(user) {
        console.log('main.e.userJoined: ', user);
		self.chatroomModel.addUser(user);
		self.chatroomModel.addChat({sender: "Butters", message: user.username + " joined room." });
	});

	// removes user from users collection, sends default leaving message
	self.appEventBus.on("userLeft", function(user) {
        console.log('main.e.userLeft: ', user);
		self.chatroomModel.removeUser(user);
		self.chatroomModel.addChat({sender: "Butters", message: user.username + " left room." });
	});

	// chat passed from socketclient, adds a new chat message using chatroomModel method
	self.appEventBus.on("chatReceived", function(chat) {
    self.chatroomModel.addChat(chat);
		$('#chatbox-content')[0].scrollTop = $('#chatbox-content')[0].scrollHeight;
	});




  self.appEventBus.on("redirectToHomeRoom", function(data) {
    self.chatClient.connectToRoom(data.homeRoom);
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
  
  self.appEventBus.on("setChatrooms", function(rooms) {
    var oldRooms = self.chatroomModel.get('chatrooms');
    var newRooms = _.map(rooms, function(room) {
      var newChatroomModel = new app.ChatroomModel({ id: room._id, name: room.name, owner: room.owner, roomImage: room.roomImage, privacy: room.privacy});
      return newChatroomModel;
    });
    oldRooms.reset(newRooms);
  });

  self.appEventBus.on("setPrivateRooms", function(rooms) {
    var oldRooms = self.chatroomModel.get('privateRooms');
    var newRooms = _.map(rooms, function(room) {
      var newChatroomModel = new app.ChatroomModel({ id: room._id, name: room.name, owner: room.owner, roomImage: room.roomImage, privacy: room.privacy, currentUser: room.currentUser});
      return newChatroomModel;
    });
    oldRooms.reset(newRooms);
  });

  self.appEventBus.on("setOnlineUsers", function(onlineUsers) {
    var oldOnlineUsers = self.chatroomModel.get('onlineUsers');
    var updatedOnlineUsers = _.map(onlineUsers, function(user) {
      var newUserModel = new app.UserModel({username: user.username, userImage: user.userImage});
      return newUserModel;
    });
    oldOnlineUsers.reset(updatedOnlineUsers);
  });

  self.appEventBus.on("setOfflineUsers", function(offlineUsers) {
    var oldOfflineUsers = self.chatroomModel.get('offlineUsers');
    var updatedOfflineUsers = _.map(offlineUsers, function(user) {
      var newUserModel = new app.UserModel({username: user.username, userImage: user.userImage});
      return newUserModel;
    });
    oldOfflineUsers.reset(updatedOfflineUsers);
  });


// chatroom availability

  self.appEventBus.on("chatroomAvailability", function(availability) {
    self.chatroomModel.trigger('chatroomAvailability', availability);
  });

  self.appEventBus.on("homeRoomAvailability", function(availability) {
    self.navbarView.trigger('homeRoomAvailability', availability);
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



  self.appEventBus.on("destroyRoomResponse", function(res) {
    if (res.error) {
      swal({
        title: "No Touchy!",
        text: "You Can't Delete Your Home Room, Nuh Uh. Who are you, Franz Reichelt?",
        type: "error",
        confirmButtonColor: "#749CA8",
      });
    }
    if (res.success) {
      swal({
        title: "Eviscerated!",
        text: "Your chatroom has been purged.",
        type: "success",
        confirmButtonColor: "#749CA8",
      });
    }
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
    $('#chatImageUploadContainer').data('chat-type', 'message');
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



  self.appEventBus.on("userInvited", function(user) {
    console.log('main.e.userInvited: ', user);
    self.chatroomModel.trigger('userInvited', user);
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
      // else {
      //   $.ajax({
      //     url: "/logout",
      //   });
      // }
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
      if (!app.mainController) {
        this.start();
      } else {
        app.mainController.authenticated();
      }
        
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYXQuanMiLCJjaGF0cm9vbS1oZWFkZXIuanMiLCJjb250YWluZXIuanMiLCJsb2dpbi5qcyIsInVzZXIuanMiLCJjaGF0cm9vbS5qcyIsImludml0YXRpb24uanMiLCJyb29tLmpzIiwicHJpdmF0ZVJvb20uanMiLCJjaGF0SW1hZ2VVcGxvYWQuanMiLCJjaGF0cm9vbVNldHRpbmdzLmpzIiwiY3JlYXRlQ2hhdHJvb20uanMiLCJuYXZiYXIuanMiLCJyZWdpc3Rlci5qcyIsInNvY2tldGNsaWVudC5qcyIsIm1haW4uanMiLCJyb3V0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FKUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUlUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBRlJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FHVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FKekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBSzdpQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FSL0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FTZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBUnJJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FTbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25PQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3WkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuQ2hhdENvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG4gICAgbW9kZWw6IGFwcC5DaGF0TW9kZWxcbiAgfSk7XG5cbn0pKCk7IiwiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5DaGF0cm9vbUhlYWRlck1vZGVsID0gQmFja2JvbmUuTW9kZWwuZXh0ZW5kKHt9KTtcblxufSkoKTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuICBhcHAuQ29udGFpbmVyVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBlbDogJyN2aWV3LWNvbnRhaW5lcicsXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdGhpcy5tb2RlbC5vbihcImNoYW5nZTp2aWV3U3RhdGVcIiwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB2aWV3ID0gdGhpcy5tb2RlbC5nZXQoJ3ZpZXdTdGF0ZScpO1xuICAgICAgdGhpcy4kZWwuaHRtbCh2aWV3LnJlbmRlcigpLmVsKTtcbiAgICB9XG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5Mb2dpblZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2xvZ2luJykuaHRtbCgpKSxcbiAgICBlcnJvclRlbXBsYXRlOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwibG9naW4tZXJyb3JcIj48JT0gbWVzc2FnZSAlPjwvZGl2PicpLFxuICAgIGV2ZW50czoge1xuICAgICAgJ3N1Ym1pdCc6ICdvbkxvZ2luJyxcbiAgICAgICdrZXlwcmVzcyc6ICdvbkhpdEVudGVyJ1xuICAgIH0sXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIC8vIExvZ2luVmlldyBnZXRzIHBhc3NlZCB0aGUgdmlld0V2ZW50QnVzIHdoZW4gdGhlIE1haW5Db250cm9sbGVyIGlzIGluaXRpYWxpemVkXG4gICAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XG5cbiAgICAvLyBUaGlzIHRlbGxzIHRoZSB2aWV3IHRvIGxpc3RlbiB0byBhbiBldmVudCBvbiBpdHMgbW9kZWwsXG4gICAgLy8gaWYgdGhlcmUncyBhbiBlcnJvciwgdGhlIGNhbGxiYWNrICh0aGlzLnJlbmRlcikgaXMgY2FsbGVkIHdpdGggdGhlICBcbiAgICAvLyB2aWV3IGFzIGNvbnRleHRcbiAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJjaGFuZ2U6ZXJyb3JcIiwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzLm1vZGVsLnRvSlNPTigpKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIG9uTG9naW46IGZ1bmN0aW9uKGUpIHtcbiAgICAgIC8vIHRyaWdnZXJzIHRoZSBsb2dpbiBldmVudCBhbmQgcGFzc2luZyB0aGUgdXNlcm5hbWUgZGF0YSB0byBqcy9tYWluLmpzXG4gICAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdmFyIHNlbmREYXRhID0ge3VzZXJuYW1lOiB0aGlzLiQoJyN1c2VybmFtZScpLnZhbCgpLCBwYXNzd29yZDogdGhpcy4kKCcjcGFzc3dvcmQnKS52YWwoKX07XG4gICAgJC5hamF4KHtcbiAgICAgICAgdXJsOiBcIi9sb2dpblwiLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgZGF0YTogc2VuZERhdGEsXG4gICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgY29uc29sZS5sb2coJ3N1Y2Nlc3MgZGF0YTogJywgZGF0YSk7XG4gICAgICAgICAgIGlmIChkYXRhLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgICB0aGlzXy5yZW5kZXJWYWxpZGF0aW9uKHRoaXNfLmVycm9yVGVtcGxhdGUoZGF0YSkpO1xuICAgICAgICAgICB9XG4gICAgICAgICAgIGVsc2UgaWYgKGRhdGEgPT09IDIwMCkge1xuICAgICAgICAgICAgYXBwLkNoYXRyb29tUm91dGVyLm5hdmlnYXRlKCdhdXRoZW50aWNhdGVkJywgeyB0cmlnZ2VyOiB0cnVlIH0pO1xuXG4gICAgICAgICAgIH1cbiAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnb29wcywgdGhlIGVsc2U6ICcsIGRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSkuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2RvbmVlZWVlZWVlJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNfLnZlbnQudHJpZ2dlcihcImxvZ2luXCIsIHNlbmREYXRhKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgcmVuZGVyVmFsaWRhdGlvbjogZnVuY3Rpb24od2hhdCkge1xuICAgICAgJCgnLmxvZ2luLWVycm9yLWNvbnRhaW5lcicpLmVtcHR5KCk7XG4gICAgICAkKHdoYXQpLmFwcGVuZFRvKCQoJy5sb2dpbi1lcnJvci1jb250YWluZXInKSkuaGlkZSgpLmZhZGVJbigpO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnLmxvZ2luLWVycm9yLWNvbnRhaW5lcicpLmNoaWxkcmVuKCkuZmlyc3QoKS5mYWRlT3V0KCk7XG4gICAgICB9LCAyMDAwKTtcblxuICAgIH1cbiAgICAvLyBvbkhpdEVudGVyOiBmdW5jdGlvbihlKSB7XG4gICAgLy8gICBpZihlLmtleUNvZGUgPT0gMTMpIHtcbiAgICAvLyAgICAgdGhpcy5vbkxvZ2luKCk7XG4gICAgLy8gICAgIHJldHVybiBmYWxzZTtcbiAgICAvLyAgIH1cbiAgICAvLyB9XG4gIH0pO1xuICBcbn0pKGpRdWVyeSk7IiwiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5Vc2VyQ29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHttb2RlbDogYXBwLlVzZXJNb2RlbH0pO1xuXG59KSgpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG5hcHAuQ2hhdHJvb21WaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjY2hhdHJvb20tdGVtcGxhdGUnKS5odG1sKCkpLFxuICBjaGF0VGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2NoYXRib3gtbWVzc2FnZS10ZW1wbGF0ZScpLmh0bWwoKSksXG4gIHJvb21UZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKFwiI3Jvb20tbGlzdC10ZW1wbGF0ZVwiKS5odG1sKCkpLFxuICBoZWFkZXJUZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjY2hhdHJvb20taGVhZGVyLXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgZGlyZWN0TWVzc2FnZUhlYWRlclRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNkaXJlY3QtbWVzc2FnZS1oZWFkZXItdGVtcGxhdGUnKS5odG1sKCkpLFxuICBvbmxpbmVVc2VyVGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI29ubGluZS11c2Vycy1saXN0LXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgb2ZmbGluZVVzZXJUZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjb2ZmbGluZS11c2Vycy1saXN0LXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgZGF0ZVRlbXBsYXRlOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwiZm9sbG93V3JhcFwiPjxkaXYgY2xhc3M9XCJmb2xsb3dNZUJhclwiPjxzcGFuPiA8JT0gbW9tZW50KHRpbWVzdGFtcCkuZm9ybWF0KFwiTU1NTSBEb1wiKSAlPiA8L3NwYW4+PC9kaXY+PC9kaXY+JyksXG4gIGV2ZW50czoge1xuICAgICdrZXlwcmVzcyAubWVzc2FnZS1pbnB1dCc6ICdtZXNzYWdlSW5wdXRQcmVzc2VkJyxcbiAgICAna2V5cHJlc3MgLmRpcmVjdC1tZXNzYWdlLWlucHV0JzogJ2RpcmVjdE1lc3NhZ2VJbnB1dFByZXNzZWQnLFxuICAgICdjbGljayAuY2hhdC1kaXJlY3RvcnkgLnJvb20nOiAnc2V0Um9vbScsXG4gICAgJ2tleXByZXNzICNjaGF0LXNlYXJjaC1pbnB1dCc6ICdzZWFyY2gnLFxuICAgICdjbGljayAucmVtb3ZlLWNoYXRyb29tJzogJ3JlbW92ZVJvb20nLFxuICAgICdjbGljayAuZGVzdHJveS1jaGF0cm9vbSc6ICdkZXN0cm95Um9vbScsXG4gICAgJ2tleXVwICNjaGF0cm9vbS1uYW1lLWlucHV0JzogJ2RvZXNDaGF0cm9vbUV4aXN0JyxcbiAgICAnY2xpY2sgLnVzZXInOiAnaW5pdERpcmVjdE1lc3NhZ2UnLFxuICB9LFxuXG5cbiAgZG9lc0NoYXRyb29tRXhpc3Q6IGZ1bmN0aW9uKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICB2YXIgY2hlY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICgkLnRyaW0oJCgnI2NoYXRyb29tLW5hbWUtaW5wdXQnKS52YWwoKSkubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgY2hhdHJvb21OYW1lID0gJCgnI2NoYXRyb29tLW5hbWUtaW5wdXQnKS52YWwoKTtcbiAgICAgICAgIHRoaXNfLnZlbnQudHJpZ2dlcignZG9lc0NoYXRyb29tRXhpc3QnLCBjaGF0cm9vbU5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgIHRoaXNfLiQoJyNjaGF0cm9vbS1uYW1lLXZhbGlkYXRpb24tY29udGFpbmVyJykuY2hpbGRyZW4oKS5yZW1vdmUoKTtcbiAgICAgICAgIHRoaXNfLiQoJyNjaGF0cm9vbS1uYW1lLWlucHV0JykucmVtb3ZlQ2xhc3MoJ2lucHV0LXZhbGlkIGlucHV0LWludmFsaWQnKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIF8uZGVib3VuY2UoY2hlY2soKSwgMTUwKTtcbiAgfSxcblxuICByZW5kZXJDaGF0cm9vbUF2YWlsYWJpbGl0eTogZnVuY3Rpb24oYXZhaWxhYmlsaXR5KSB7XG4gICAgdGhpcy5jcmVhdGVDaGF0cm9vbVZpZXcudHJpZ2dlcignY2hhdHJvb21BdmFpbGFiaWxpdHknLCBhdmFpbGFiaWxpdHkpO1xuICB9LFxuXG5cblxuICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgY29uc29sZS5sb2coJ2NoYXRyb29tVmlldy5mLmluaXRpYWxpemU6ICcsIG9wdGlvbnMpO1xuICAgIC8vIHBhc3NlZCB0aGUgdmlld0V2ZW50QnVzXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcbiAgfSxcbiAgcmVuZGVyOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5yZW5kZXInKTtcbiAgICB0aGlzLm1vZGVsID0gbW9kZWwgfHwgdGhpcy5tb2RlbDtcbiAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUodGhpcy5tb2RlbC50b0pTT04oKSkpO1xuICAgIHRoaXMuYWZ0ZXJSZW5kZXIoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgYWZ0ZXJSZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2V0U3ViVmlld3MoKTtcbiAgICB0aGlzLnNldENoYXRMaXN0ZW5lcnMoKTtcbiAgICB0aGlzLmNoYXRyb29tU2VhcmNoVHlwZWFoZWFkKCk7XG4gIH0sXG4gIHNldFN1YlZpZXdzOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNoYXRJbWFnZVVwbG9hZFZpZXcgPSBuZXcgYXBwLkNoYXRJbWFnZVVwbG9hZFZpZXcoKTtcbiAgICB0aGlzLmNoYXRJbWFnZVVwbG9hZFZpZXcuc2V0RWxlbWVudCh0aGlzLiQoJyNjaGF0SW1hZ2VVcGxvYWRDb250YWluZXInKSk7XG4gICAgdGhpcy5jcmVhdGVDaGF0cm9vbVZpZXcgPSBuZXcgYXBwLkNyZWF0ZUNoYXRyb29tVmlldyh7dmVudDogdGhpcy52ZW50fSk7XG4gICAgdGhpcy5jcmVhdGVDaGF0cm9vbVZpZXcuc2V0RWxlbWVudCh0aGlzLiQoJyNjcmVhdGVDaGF0cm9vbUNvbnRhaW5lcicpKTtcbiAgfSxcbiAgc2V0Q2hhdExpc3RlbmVyczogZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgb25saW5lVXNlcnMgPSB0aGlzLm1vZGVsLmdldCgnb25saW5lVXNlcnMnKTtcbiAgICB0aGlzLmxpc3RlblRvKG9ubGluZVVzZXJzLCBcImFkZFwiLCB0aGlzLnJlbmRlclVzZXIsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8ob25saW5lVXNlcnMsIFwicmVtb3ZlXCIsIHRoaXMucmVuZGVyVXNlcnMsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8ob25saW5lVXNlcnMsIFwicmVzZXRcIiwgdGhpcy5yZW5kZXJVc2VycywgdGhpcyk7XG5cbiAgICB2YXIgb2ZmbGluZVVzZXJzID0gdGhpcy5tb2RlbC5nZXQoJ29mZmxpbmVVc2VycycpO1xuICAgIHRoaXMubGlzdGVuVG8ob2ZmbGluZVVzZXJzLCBcImFkZFwiLCB0aGlzLnJlbmRlck9mZmxpbmVVc2VyLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKG9mZmxpbmVVc2VycywgXCJyZW1vdmVcIiwgdGhpcy5yZW5kZXJPZmZsaW5lVXNlcnMsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8ob2ZmbGluZVVzZXJzLCBcInJlc2V0XCIsIHRoaXMucmVuZGVyT2ZmbGluZVVzZXJzLCB0aGlzKTtcblxuICAgIHZhciBjaGF0bG9nID0gdGhpcy5tb2RlbC5nZXQoJ2NoYXRsb2cnKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRsb2csIFwiYWRkXCIsIHRoaXMucmVuZGVyQ2hhdCwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhjaGF0bG9nLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlckNoYXRzLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRsb2csIFwicmVzZXRcIiwgdGhpcy5yZW5kZXJDaGF0cywgdGhpcyk7XG5cbiAgICB2YXIgY2hhdHJvb21zID0gdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tcycpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcImFkZFwiLCB0aGlzLnJlbmRlclJvb20sIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlclJvb21zLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRyb29tcywgXCJyZXNldFwiLCB0aGlzLnJlbmRlclJvb21zLCB0aGlzKTtcblxuICAgIHZhciBwcml2YXRlUm9vbXMgPSB0aGlzLm1vZGVsLmdldCgncHJpdmF0ZVJvb21zJyk7XG4gICAgdGhpcy5saXN0ZW5Ubyhwcml2YXRlUm9vbXMsIFwiYWRkXCIsIHRoaXMucmVuZGVyUHJpdmF0ZVJvb20sIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8ocHJpdmF0ZVJvb21zLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlclByaXZhdGVSb29tcywgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5Ubyhwcml2YXRlUm9vbXMsIFwicmVzZXRcIiwgdGhpcy5yZW5kZXJQcml2YXRlUm9vbXMsIHRoaXMpO1xuXG4gICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImNoYW5nZTpjaGF0cm9vbVwiLCB0aGlzLnJlbmRlckhlYWRlciwgdGhpcyk7XG5cbiAgICB0aGlzLmxpc3RlblRvKHRoaXMuY2hhdEltYWdlVXBsb2FkVmlldywgJ2NoYXQtaW1hZ2UtdXBsb2FkZWQnLCB0aGlzLmNoYXRVcGxvYWRJbWFnZSk7XG4gICAgdGhpcy5saXN0ZW5Ubyh0aGlzLmNoYXRJbWFnZVVwbG9hZFZpZXcsICdtZXNzYWdlLWltYWdlLXVwbG9hZGVkJywgdGhpcy5tZXNzYWdlVXBsb2FkSW1hZ2UpO1xuICAgIC8vIHRoaXMubGlzdGVuVG8odGhpcy5jcmVhdGVDaGF0cm9vbVZpZXcsICdjcmVhdGVSb29tJywgdGhpcy5jcmVhdGVSb29tKTtcblxuICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJtb3JlQ2hhdHNcIiwgdGhpcy5yZW5kZXJNb3JlQ2hhdHMsIHRoaXMpO1xuXG4gICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcInVzZXJJbnZpdGVkXCIsIHRoaXMudXNlckludml0ZWQsIHRoaXMpO1xuXG4gICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImNoYXRyb29tQXZhaWxhYmlsaXR5XCIsIHRoaXMucmVuZGVyQ2hhdHJvb21BdmFpbGFiaWxpdHksIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJob21lUm9vbUF2YWlsYWJpbGl0eVwiLCB0aGlzLnJlbmRlckhvbWVSb29tQXZhaWxhYmlsaXR5LCB0aGlzKTtcblxuICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgdGhpcy4kKCcjY2hhdGJveC1jb250ZW50Jykuc2Nyb2xsKGZ1bmN0aW9uKCl7XG4gICAgICAgIC8vIGNoZWNrcyBpZiB0aGVyZSdzIGVub3VnaCBjaGF0cyB0byB3YXJyYW50IGEgZ2V0TW9yZUNoYXRzIGNhbGxcbiAgICAgIGlmICgkKCcjY2hhdGJveC1jb250ZW50Jykuc2Nyb2xsVG9wKCkgPT09IDAgJiYgdGhpc18ubW9kZWwuZ2V0KCdjaGF0bG9nJykubGVuZ3RoID49IDI1KSB7XG4gICAgICAgIGlmICh0aGlzXy5tb2RlbC5nZXQoJ2NoYXRyb29tJykuZ2V0KCdjaGF0VHlwZScpID09PSAnbWVzc2FnZScpIHtcbiAgICAgICAgICBfLmRlYm91bmNlKHRoaXNfLmdldE1vcmVEaXJlY3RNZXNzYWdlcygpLCAzMDAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfLmRlYm91bmNlKHRoaXNfLmdldE1vcmVDaGF0cygpLCAzMDAwKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgICAgJCh3aW5kb3cpLnJlc2l6ZShmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHdpbmRvd0hlaWdodCA9ICQod2luZG93KS5oZWlnaHQoKTtcbiAgICAgICAgaWYgKHdpbmRvd0hlaWdodCA+IDUwMCkge1xuICAgICAgICAgIHZhciBuZXdIZWlnaHQgPSB3aW5kb3dIZWlnaHQgLSAyODU7XG4gICAgICAgICAgJCgnI2NoYXRib3gtY29udGVudCcpLmhlaWdodChuZXdIZWlnaHQpO1xuICAgICAgICB9XG5cbiAgICAgICB9KTtcbiAgfSxcblxuXG4gIGNoYXRyb29tU2VhcmNoVHlwZWFoZWFkOiBmdW5jdGlvbigpIHtcbiAgICAvLyBpbnRlcmVzdGluZyAtIHRoZSAndGhpcycgbWFrZXMgYSBkaWZmZXJlbmNlLCBjYW4ndCBmaW5kICNjaGF0LXNlYXJjaC1pbnB1dCBvdGhlcndpc2VcbiAgICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgICB2YXIgYmxvb2QgPSBuZXcgQmxvb2Rob3VuZCh7XG4gICAgICAgIGRhdHVtVG9rZW5pemVyOiBCbG9vZGhvdW5kLnRva2VuaXplcnMub2JqLndoaXRlc3BhY2UoJ25hbWUnKSxcbiAgICAgICAgcXVlcnlUb2tlbml6ZXI6IEJsb29kaG91bmQudG9rZW5pemVycy53aGl0ZXNwYWNlLFxuICAgICAgICBwcmVmZXRjaDoge1xuICAgICAgICAgIHVybDogJy9hcGkvcHVibGljQ2hhdHJvb21zJyxcbiAgICAgICAgICBmaWx0ZXI6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICByZXR1cm4gXy5tYXAoZGF0YSwgZnVuY3Rpb24oY2hhdHJvb20pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBuYW1lOiBjaGF0cm9vbSB9O1xuICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgdHRsOiAwLFxuICAgICAgICB9LFxuICAgICAgICByZW1vdGU6IHtcbiAgICAgICAgICB1cmw6ICcvYXBpL3NlYXJjaENoYXRyb29tcz9uYW1lPSVRVUVSWScsXG4gICAgICAgICAgd2lsZGNhcmQ6ICclUVVFUlknLFxuICAgICAgICAgIHJhdGVMaW1pdFdhaXQ6IDMwMCxcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBibG9vZC5jbGVhclByZWZldGNoQ2FjaGUoKTtcbiAgICAgIGJsb29kLmluaXRpYWxpemUoKTtcbiAgICAgIHZhciB0eXBlID0gIHRoaXMuJCgnI2NoYXQtc2VhcmNoLWlucHV0JykudHlwZWFoZWFkKHtcbiAgICAgICAgbWluTGVuZ3RoOiAyLFxuICAgICAgICBjbGFzc05hbWVzOiB7XG4gICAgICAgICAgaW5wdXQ6ICd0eXBlYWhlYWQtaW5wdXQnLFxuICAgICAgICAgIGhpbnQ6ICd0eXBlYWhlYWQtaGludCcsXG4gICAgICAgICAgc2VsZWN0YWJsZTogJ3R5cGVhaGVhZC1zZWxlY3RhYmxlJyxcbiAgICAgICAgICBtZW51OiAndHlwZWFoZWFkLW1lbnUnLFxuICAgICAgICAgIGhpZ2hsaWdodDogJ3R5cGVhaGVhZC1oaWdobGlnaHQnLFxuICAgICAgICAgIGRhdGFzZXQ6ICd0eXBlYWhlYWQtZGF0YXNldCcsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBsaW1pdDogNSxcbiAgICAgICAgc291cmNlOiBibG9vZCxcbiAgICAgICAgbmFtZTogJ2NoYXRyb29tLXNlYXJjaCcsXG4gICAgICAgIGRpc3BsYXk6ICduYW1lJyxcbiAgICAgIH0pLm9uKCd0eXBlYWhlYWQ6c2VsZWN0IHR5cGVhaGVhZDphdXRvY29tcGxldGUnLCBmdW5jdGlvbihvYmopIHtcblxuICAgICAgfSk7XG4gIH0sXG5cblxuXG4vLyBoZWFkZXJzXG5cbiAgcmVuZGVySGVhZGVyOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLiQoJyNjaGF0Ym94LWhlYWRlcicpLmh0bWwodGhpcy5oZWFkZXJUZW1wbGF0ZSh0aGlzLm1vZGVsLmdldCgnY2hhdHJvb20nKS50b0pTT04oKSkpO1xuICAgIHRoaXMuY2hhdHJvb21TZXR0aW5nc1ZpZXcgPSBuZXcgYXBwLkNoYXRyb29tU2V0dGluZ3NWaWV3KHt2ZW50OiB0aGlzLnZlbnQsIG1vZGVsOiB0aGlzLm1vZGVsLmdldCgnY2hhdHJvb20nKX0pO1xuICAgIHRoaXMuY2hhdHJvb21TZXR0aW5nc1ZpZXcuc2V0RWxlbWVudCh0aGlzLiQoJyNjaGF0cm9vbS1oZWFkZXItY29udGFpbmVyJykpO1xuICAgIHRoaXMubGlzdGVuVG8odGhpcy5jaGF0cm9vbVNldHRpbmdzVmlldywgJ3VwZGF0ZVJvb20nLCB0aGlzLnVwZGF0ZVJvb20pO1xuICB9LFxuXG4gIHJlbmRlckRpcmVjdE1lc3NhZ2VIZWFkZXI6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuJCgnI2NoYXRib3gtaGVhZGVyJykuaHRtbCh0aGlzLmRpcmVjdE1lc3NhZ2VIZWFkZXJUZW1wbGF0ZSh0aGlzLm1vZGVsLmdldCgnY2hhdHJvb20nKS50b0pTT04oKSkpO1xuICB9LFxuXG4gIHVzZXJJbnZpdGVkOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgdGhpcy5jaGF0cm9vbVNldHRpbmdzVmlldy50cmlnZ2VyKCd1c2VySW52aXRlZCcsIGRhdGEpO1xuICB9LFxuXG5cblxuXG4vLyB1c2Vyc1xuXG4gIHJlbmRlclVzZXJzOiBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYucmVuZGVyVXNlcnMnKTtcbiAgICBvbmxpbmVVc2VycyA9IHRoaXMubW9kZWwuZ2V0KFwib25saW5lVXNlcnNcIik7XG4gICAgY29uc29sZS5sb2coJ1VTRVJTOiAnLCBvbmxpbmVVc2Vycyk7XG4gICAgdGhpcy4kKCcub25saW5lLXVzZXJzJykuZW1wdHkoKTtcbiAgICB0aGlzLm1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpLmVhY2goZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgIHRoaXMucmVuZGVyVXNlcih1c2VyKTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyVXNlcjogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB0aGlzLiQoJy5vbmxpbmUtdXNlcnMnKS5hcHBlbmQodGhpcy5vbmxpbmVVc2VyVGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgfSxcbiAgcmVuZGVyT2ZmbGluZVVzZXJzOiBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYucmVuZGVyT2ZmbGluZVVzZXJzJyk7XG4gICAgY29uc29sZS5sb2coJ09mZmxpbmUgVVNFUlM6ICcsIHRoaXMubW9kZWwuZ2V0KFwib2ZmbGluZVVzZXJzXCIpKTtcbiAgICB0aGlzLiQoJy5vZmZsaW5lLXVzZXJzJykuZW1wdHkoKTtcbiAgICB0aGlzLm1vZGVsLmdldChcIm9mZmxpbmVVc2Vyc1wiKS5lYWNoKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICB0aGlzLnJlbmRlck9mZmxpbmVVc2VyKHVzZXIpO1xuICAgIH0sIHRoaXMpO1xuICB9LFxuICByZW5kZXJPZmZsaW5lVXNlcjogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB0aGlzLiQoJy5vZmZsaW5lLXVzZXJzJykuYXBwZW5kKHRoaXMub2ZmbGluZVVzZXJUZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICB9LFxuXG5cblxuXG5cbi8vIGNoYXRsb2dcblxuICByZW5kZXJDaGF0czogZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlckNoYXRzJyk7XG4gICAgdmFyIGNoYXRsb2cgPSB0aGlzLm1vZGVsLmdldChcImNoYXRsb2dcIik7XG4gICAgY29uc29sZS5sb2coJ0NIQVRMT0c6ICcsIGNoYXRsb2cpO1xuICAgIHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpLmVtcHR5KCk7XG4gICAgY2hhdGxvZy5lYWNoKGZ1bmN0aW9uKGNoYXQpIHtcbiAgICAgIHRoaXMucmVuZGVyQ2hhdChjaGF0KTtcbiAgICB9LCB0aGlzKTtcbiAgICBpZiAoIGNoYXRsb2cubGVuZ3RoID09PSAwKSB7XG4gICAgICBjaGF0bG9nLnB1c2gobmV3IGFwcC5DaGF0TW9kZWwoeyBzZW5kZXI6ICdDaGphdCcsIG1lc3NhZ2U6IFwiwq9cXFxcXyjjg4QpXy/Cr1wiLCB0aW1lc3RhbXA6IF8ubm93KCksIHVybDogJyd9KSk7XG4gICAgfVxuICAgIHRoaXMuYWZ0ZXJDaGF0c1JlbmRlcigpO1xuICB9LFxuXG4gIHJlbmRlckNoYXQ6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdGhpcy5yZW5kZXJEYXRlRGl2aWRlcnMobW9kZWwpO1xuICAgIHZhciBjaGF0VGVtcGxhdGUgPSAkKHRoaXMuY2hhdFRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gICAgY2hhdFRlbXBsYXRlLmFwcGVuZFRvKHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpKS5oaWRlKCkuZmFkZUluKCkuc2xpZGVEb3duKCk7XG4gICAgJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG4gIH0sXG5cbiAgcmVuZGVyRGF0ZURpdmlkZXJzOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHRoaXMuY3VycmVudERhdGUgPSBtb21lbnQobW9kZWwuZ2V0KCd0aW1lc3RhbXAnKSkuZm9ybWF0KCdkZGRkLCBNTU1NIERvIFlZWVknKTtcbiAgICBpZiAoIHRoaXMuY3VycmVudERhdGUgIT09IHRoaXMucHJldmlvdXNEYXRlICkge1xuICAgICAgdmFyIGN1cnJlbnREYXRlID0gJCh0aGlzLmRhdGVUZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICAgICAgY3VycmVudERhdGUuYXBwZW5kVG8odGhpcy4kKCcjY2hhdGJveC1jb250ZW50JykpLmhpZGUoKS5mYWRlSW4oKS5zbGlkZURvd24oKTtcbiAgICAgIHRoaXMucHJldmlvdXNEYXRlID0gdGhpcy5jdXJyZW50RGF0ZTtcbiAgICB9XG4gIH0sXG5cbiAgZ2V0TW9yZUNoYXRzOiBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYuZ2V0TW9yZUNoYXRzJyk7XG4gICAgdmFyIGNoYXRyb29tID0gdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tJyksXG4gICAgbmFtZSA9IGNoYXRyb29tLmdldCgnbmFtZScpLFxuICAgIG1vZGVsc0xvYWRlZFN1bSA9IGNoYXRyb29tLmdldCgnbW9kZWxzTG9hZGVkU3VtJyk7XG4gICAgdmFyIGNoYXRsb2dMZW5ndGggPSBjaGF0cm9vbS5nZXQoJ2NoYXRsb2dMZW5ndGgnKTtcbiAgICB0aGlzLnZlbnQudHJpZ2dlcignZ2V0TW9yZUNoYXRzJywgeyBuYW1lOiBuYW1lLCBtb2RlbHNMb2FkZWRTdW06IG1vZGVsc0xvYWRlZFN1bSwgY2hhdGxvZ0xlbmd0aDogY2hhdGxvZ0xlbmd0aH0pO1xuICAgIGNoYXRyb29tLnNldCgnbW9kZWxzTG9hZGVkU3VtJywgKG1vZGVsc0xvYWRlZFN1bSAtIDEpKTtcbiAgfSxcblxuICBnZXRNb3JlRGlyZWN0TWVzc2FnZXM6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5nZXRNb3JlRHJpZWN0TWVzc2FnZXMnKTtcbiAgICB2YXIgY2hhdHJvb20gPSB0aGlzLm1vZGVsLmdldCgnY2hhdHJvb20nKSxcbiAgICBpZCA9IGNoYXRyb29tLmdldCgnaWQnKSxcbiAgICBtb2RlbHNMb2FkZWRTdW0gPSBjaGF0cm9vbS5nZXQoJ21vZGVsc0xvYWRlZFN1bScpO1xuICAgIHZhciBjaGF0bG9nTGVuZ3RoID0gY2hhdHJvb20uZ2V0KCdjaGF0bG9nTGVuZ3RoJyk7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoJ2dldE1vcmVEaXJlY3RNZXNzYWdlcycsIHsgaWQ6IGlkLCBtb2RlbHNMb2FkZWRTdW06IG1vZGVsc0xvYWRlZFN1bSwgY2hhdGxvZ0xlbmd0aDogY2hhdGxvZ0xlbmd0aH0pO1xuICAgIGNoYXRyb29tLnNldCgnbW9kZWxzTG9hZGVkU3VtJywgKG1vZGVsc0xvYWRlZFN1bSAtIDEpKTtcbiAgfSxcblxuICByZW5kZXJNb3JlQ2hhdHM6IGZ1bmN0aW9uKGNoYXRzKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlck1vcmVDaGF0cycpO1xuICAgIC8vIHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpO1xuICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgdmFyIG9yaWdpbmFsSGVpZ2h0ID0gJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcbiAgICB0aGlzLm1vcmVDaGF0Q29sbGVjdGlvbiA9IFtdO1xuICAgIF8uZWFjaChjaGF0cywgZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIHRoaXNfLnJlbmRlck1vcmVEYXRlRGl2aWRlcnMobW9kZWwpO1xuICAgICAgdmFyIGNoYXRUZW1wbGF0ZSA9ICQodGhpcy5jaGF0VGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICAgIHRoaXNfLm1vcmVDaGF0Q29sbGVjdGlvbi5wdXNoKGNoYXRUZW1wbGF0ZSk7XG4gICAgICAvLyBjaGF0VGVtcGxhdGUucHJlcGVuZFRvKHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpKS5oaWRlKCkuZmFkZUluKCkuc2xpZGVEb3duKCk7XG4gICAgfSwgdGhpcyk7XG4gICAgXy5lYWNoKHRoaXMubW9yZUNoYXRDb2xsZWN0aW9uLnJldmVyc2UoKSwgZnVuY3Rpb24odGVtcGxhdGUpIHtcbiAgICAgIHRlbXBsYXRlLnByZXBlbmRUbyh0aGlzLiQoJyNjaGF0Ym94LWNvbnRlbnQnKSk7XG4gICAgfSk7XG5cbiAgICAgdGhpcy5kYXRlRGl2aWRlci5sb2FkKCQoXCIuZm9sbG93TWVCYXJcIikpO1xuICAgICAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodCAtIG9yaWdpbmFsSGVpZ2h0O1xuICAgICBcbiAgfSxcblxuICByZW5kZXJNb3JlRGF0ZURpdmlkZXJzOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHRoaXMuY3VycmVudERhdGUgPSBtb21lbnQobW9kZWwuYXR0cmlidXRlcy50aW1lc3RhbXApLmZvcm1hdCgnZGRkZCwgTU1NTSBEbyBZWVlZJyk7XG4gICAgaWYgKCB0aGlzLmN1cnJlbnREYXRlICE9PSB0aGlzLnByZXZpb3VzRGF0ZSApIHtcbiAgICAgIHZhciBjdXJyZW50RGF0ZSA9ICQodGhpcy5kYXRlVGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICAgIC8vIGN1cnJlbnREYXRlLmFwcGVuZFRvKHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpKS5oaWRlKCkuZmFkZUluKCkuc2xpZGVEb3duKCk7XG4gICAgICB0aGlzLm1vcmVDaGF0Q29sbGVjdGlvbi5wdXNoKGN1cnJlbnREYXRlKTtcbiAgICAgIHRoaXMucHJldmlvdXNEYXRlID0gdGhpcy5jdXJyZW50RGF0ZTtcbiAgICB9XG4gIH0sXG5cbiAgYXV0b3NpemVyOiBmdW5jdGlvbigpIHtcbiAgICBhdXRvc2l6ZSgkKCcjbWVzc2FnZS1pbnB1dCcpKTtcbiAgfSxcbiAgXG4gIHNjcm9sbEJvdHRvbUluc3VyYW5jZTogZnVuY3Rpb24oKXtcbiAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgIHZhciBpbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCl7XG4gICAgICB0aGlzLiQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSB0aGlzLiQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG4gICAgfSwgNTApO1xuICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICB9LCA4MDApO1xuICB9LFxuXG4gIGFmdGVyQ2hhdHNSZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYXV0b3NpemVyKCk7XG4gICAgdGhpcy5kYXRlRGl2aWRlci5sb2FkKCQoXCIuZm9sbG93TWVCYXJcIikpO1xuICAgIHRoaXMuc2Nyb2xsQm90dG9tSW5zdXJhbmNlKCk7XG4gIH0sXG5cblxuXG5cblxuXG5cblxuLy8gcm9vbXNcblxuXG4gIHNlYXJjaDogZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzICYmICQudHJpbSgkKCcjY2hhdC1zZWFyY2gtaW5wdXQnKS52YWwoKSkubGVuZ3RoID4gMCkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdmFyIG5hbWUgPSAkKCcjY2hhdC1zZWFyY2gtaW5wdXQnKS52YWwoKTtcbiAgICAgIHRoaXMuYWRkQ2hhdHJvb20obmFtZSk7XG4gICAgICB0aGlzLiQoJyNjaGF0LXNlYXJjaC1pbnB1dCcpLnZhbCgnJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzZWFyY2ggdHlwaW5nJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBjcmVhdGVSb29tOiBmdW5jdGlvbihmb3JtKSB7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoJ2NyZWF0ZVJvb20nLCBmb3JtKTtcbiAgfSxcbiAgdXBkYXRlUm9vbTogZnVuY3Rpb24oZm9ybSkge1xuICAgIHZhciBpZCA9IHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbScpLmdldCgnaWQnKTtcbiAgICBmb3JtLmlkID0gaWQ7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoJ3VwZGF0ZVJvb20nLCBmb3JtKTtcbiAgfSxcbiAgZGVzdHJveVJvb206IGZ1bmN0aW9uKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICB2YXIgY29uZmlybWF0aW9uID0gc3dhbCh7XG4gICAgICB0aXRsZTogXCJEbyB5b3Ugd2lzaCB0byBkZXN0cm95IHRoZSByb29tP1wiLFxuICAgICAgdGV4dDogXCJUaGlzIGtpbGxzIHRoZSByb29tLlwiLFxuICAgICAgdHlwZTogXCJ3YXJuaW5nXCIsXG4gICAgICBzaG93Q2FuY2VsQnV0dG9uOiB0cnVlLFxuICAgICAgY29uZmlybUJ1dHRvbkNvbG9yOiBcIiNERUIwQjBcIixcbiAgICAgIGNvbmZpcm1CdXR0b25UZXh0OiBcIk11YWhhaGEhXCIsXG4gICAgICBjbG9zZU9uQ29uZmlybTogZmFsc2UsXG4gICAgICBodG1sOiBmYWxzZVxuICAgIH0sIGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgcm9vbUlkID0gdGhpc18ubW9kZWwuZ2V0KCdjaGF0cm9vbScpLmlkO1xuICAgICAgdmFyIHJvb21OYW1lID0gdGhpc18ubW9kZWwuZ2V0KCdjaGF0cm9vbScpLmdldCgnbmFtZScpO1xuICAgICAgdmFyIHVzZXJJblJvb20gPSB0cnVlO1xuICAgICAgdGhpc18udmVudC50cmlnZ2VyKCdkZXN0cm95Um9vbScsIHsgaWQ6IHJvb21JZCwgcm9vbU5hbWU6IHJvb21OYW1lLCB1c2VySW5Sb29tOiB1c2VySW5Sb29tIH0pO1xuICAgIH0pO1xuICB9LFxuICBhZGRDaGF0cm9vbTogZnVuY3Rpb24obmFtZSkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5hZGRDaGF0cm9vbScpO1xuICAgIHRoaXMudmVudC50cmlnZ2VyKCdhZGRSb29tJywgbmFtZSk7XG4gIH0sXG4gIHJlbW92ZVJvb206IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgIHZhciBjb25maXJtYXRpb24gPSBzd2FsKHtcbiAgICAgIHRpdGxlOiBcIlJlbW92ZSBUaGlzIFJvb20/XCIsXG4gICAgICB0ZXh0OiBcIkFyZSB5b3Ugc3VyZT8gQXJlIHlvdSBzdXJlIHlvdSdyZSBzdXJlPyBIb3cgc3VyZSBjYW4geW91IGJlP1wiLFxuICAgICAgdHlwZTogXCJ3YXJuaW5nXCIsXG4gICAgICBzaG93Q2FuY2VsQnV0dG9uOiB0cnVlLFxuICAgICAgY29uZmlybUJ1dHRvbkNvbG9yOiBcIiNERUIwQjBcIixcbiAgICAgIGNvbmZpcm1CdXR0b25UZXh0OiBcIk11YWhhaGEhXCIsXG4gICAgICBjbG9zZU9uQ29uZmlybTogZmFsc2UsXG4gICAgICBodG1sOiBmYWxzZVxuICAgIH0sIGZ1bmN0aW9uKCl7XG4gICAgICBzd2FsKHtcbiAgICAgICAgdGl0bGU6IFwiUmVtb3ZlZCFcIixcbiAgICAgICAgdGV4dDogXCJZb3UgYXJlIGZyZWUgb2YgdGhpcyBjaGF0cm9vbS4gR28gb24sIHlvdSdyZSBmcmVlIG5vdy5cIixcbiAgICAgICAgdHlwZTogXCJzdWNjZXNzXCIsXG4gICAgICAgIGNvbmZpcm1CdXR0b25Db2xvcjogXCIjNzQ5Q0E4XCJcbiAgICAgIH0pO1xuICAgICAgdmFyIGN1cnJlbnRSb29tID0gdGhpc18ubW9kZWwuZ2V0KCdjaGF0cm9vbScpLmlkO1xuICAgICAgdmFyIHJvb21JZCA9ICQoZS50YXJnZXQpLmRhdGEoXCJyb29tLWlkXCIpO1xuICAgICAgdmFyIHJvb21OYW1lID0gJChlLnRhcmdldCkuZGF0YShcInJvb20tbmFtZVwiKTtcbiAgICAgIHZhciB1c2VySW5Sb29tID0gY3VycmVudFJvb20gPT09IHJvb21JZDtcbiAgICAgIHRoaXNfLnZlbnQudHJpZ2dlcigncmVtb3ZlUm9vbScsIHtpZDogcm9vbUlkLCByb29tTmFtZTogcm9vbU5hbWUsIHVzZXJJblJvb206IHVzZXJJblJvb219KTtcbiAgICB9KTtcbiAgfSxcbiAgcmVuZGVyUm9vbXM6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5yZW5kZXJSb29tcycpO1xuICAgIGNvbnNvbGUubG9nKCdDSEFUUk9PTVM6ICcsIHRoaXMubW9kZWwuZ2V0KFwiY2hhdHJvb21zXCIpKTtcbiAgICB0aGlzLiQoJyNwdWJsaWMtcm9vbXMnKS5lbXB0eSgpO1xuICAgIHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbXMnKS5lYWNoKGZ1bmN0aW9uIChyb29tKSB7XG4gICAgICB0aGlzLnJlbmRlclJvb20ocm9vbSk7XG4gICAgfSwgdGhpcyk7XG4gIH0sXG4gIHJlbmRlclJvb206IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdmFyIG5hbWUxID0gbW9kZWwuZ2V0KCduYW1lJyksXG4gICAgbmFtZTIgPSB0aGlzLm1vZGVsLmdldCgnY2hhdHJvb20nKS5nZXQoJ25hbWUnKTtcbiAgICB0aGlzLiQoJyNwdWJsaWMtcm9vbXMnKS5hcHBlbmQodGhpcy5yb29tVGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICBpZiAobmFtZTEgPT09IG5hbWUyKSB7XG4gICAgICB0aGlzLiQoJyNwdWJsaWMtcm9vbXMnKS5maW5kKCcucm9vbS1uYW1lJykubGFzdCgpLmFkZENsYXNzKCdhY3RpdmUnKS5mYWRlSW4oKTtcbiAgICB9XG4gIH0sXG4gIHJlbmRlclByaXZhdGVSb29tczogZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlclByaXZhdGVSb29tcycpO1xuICAgIGNvbnNvbGUubG9nKCdQUklWQVRFUk9PTVM6ICcsIHRoaXMubW9kZWwuZ2V0KFwicHJpdmF0ZVJvb21zXCIpKTtcbiAgICB0aGlzLiQoJyNwcml2YXRlLXJvb21zJykuZW1wdHkoKTtcbiAgICB0aGlzLm1vZGVsLmdldCgncHJpdmF0ZVJvb21zJykuZWFjaChmdW5jdGlvbiAocm9vbSkge1xuICAgICAgdGhpcy5yZW5kZXJQcml2YXRlUm9vbShyb29tKTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyUHJpdmF0ZVJvb206IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdmFyIG5hbWUxID0gbW9kZWwuZ2V0KCduYW1lJyksXG4gICAgbmFtZTIgPSB0aGlzLm1vZGVsLmdldCgnY2hhdHJvb20nKS5nZXQoJ25hbWUnKTtcbiAgICB0aGlzLiQoJyNwcml2YXRlLXJvb21zJykuYXBwZW5kKHRoaXMucm9vbVRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gICAgaWYgKG5hbWUxID09PSBuYW1lMikge1xuICAgICAgdGhpcy4kKCcjcHJpdmF0ZS1yb29tcycpLmZpbmQoJy5yb29tLW5hbWUnKS5sYXN0KCkuYWRkQ2xhc3MoJ2FjdGl2ZScpLmZhZGVJbigpO1xuICAgIH1cbiAgfSxcbiAgam9pblJvb206IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYuam9pblJvb20nKTtcbiAgICAgJCgnI2NoYXRJbWFnZVVwbG9hZENvbnRhaW5lcicpLmRhdGEoJ2NoYXQtdHlwZScsICdjaGF0Jyk7XG4gICAgdGhpcy5jdXJyZW50RGF0ZSA9ICcnO1xuICAgIHRoaXMucHJldmlvdXNEYXRlID0gJyc7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoJ2pvaW5Sb29tJywgbmFtZSk7XG4gIH0sXG4vLyBjaGFuZ2UgdG8gJ2pvaW5EaXJlY3RNZXNzYWdlJ1xuICBpbml0RGlyZWN0TWVzc2FnZTogZnVuY3Rpb24oZSkge1xuICAgIHZhciByZWNpcGllbnQgPSB7fSxcbiAgICAgICAgJHRhciA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcbiAgICByZWNpcGllbnQudXNlcm5hbWUgPSAkdGFyLnRleHQoKS50cmltKCk7XG4gICAgcmVjaXBpZW50LnVzZXJJbWFnZSA9ICR0YXIuZmluZCgnaW1nJykuYXR0cignc3JjJyk7XG4gICAgdGhpcy5jdXJyZW50RGF0ZSA9ICcnO1xuICAgIHRoaXMucHJldmlvdXNEYXRlID0gJyc7XG4gICAgaWYgKHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbScpLmdldCgnY3VycmVudFVzZXInKSAhPT0gcmVjaXBpZW50LnVzZXJuYW1lKSB7XG4gICAgICB0aGlzLnZlbnQudHJpZ2dlcignaW5pdERpcmVjdE1lc3NhZ2UnLCByZWNpcGllbnQpO1xuICAgIH1cbiAgfSxcblxuXG5cblxuXG4vLyBpbWFnZSB1cGxvYWRcblxuIGNoYXRVcGxvYWRJbWFnZTogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICBjb25zb2xlLmxvZygnaW1nIHVybDogJywgcmVzcG9uc2UpO1xuICAgIHRoaXMudmVudC50cmlnZ2VyKFwiY2hhdFwiLCByZXNwb25zZSk7XG4gICAgdGhpcy5zY3JvbGxCb3R0b21JbnN1cmFuY2UoKTtcbiAgfSxcblxuICBtZXNzYWdlVXBsb2FkSW1hZ2U6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICBjb25zb2xlLmxvZygnaW1nIHVybDogJywgcmVzcG9uc2UpO1xuICAgdGhpcy52ZW50LnRyaWdnZXIoXCJkaXJlY3RNZXNzYWdlXCIsIHJlc3BvbnNlKTtcbiAgIHRoaXMuc2Nyb2xsQm90dG9tSW5zdXJhbmNlKCk7XG4gfSxcblxuXG5cblxuXG4gIC8vZXZlbnRzXG5cblxuICBtZXNzYWdlSW5wdXRQcmVzc2VkOiBmdW5jdGlvbihlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMgJiYgJC50cmltKCQoJy5tZXNzYWdlLWlucHV0JykudmFsKCkpLmxlbmd0aCA+IDApIHtcbiAgICAgIC8vIGZ1biBmYWN0OiBzZXBhcmF0ZSBldmVudHMgd2l0aCBhIHNwYWNlIGluIHRyaWdnZXIncyBmaXJzdCBhcmcgYW5kIHlvdVxuICAgICAgLy8gY2FuIHRyaWdnZXIgbXVsdGlwbGUgZXZlbnRzLlxuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJjaGF0XCIsIHsgbWVzc2FnZTogdGhpcy4kKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgpfSk7XG4gICAgICB0aGlzLiQoJy5tZXNzYWdlLWlucHV0JykudmFsKCcnKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJ0eXBpbmdcIik7XG4gICAgICBjb25zb2xlLmxvZygnd3V0Jyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBkaXJlY3RNZXNzYWdlSW5wdXRQcmVzc2VkOiBmdW5jdGlvbihlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMgJiYgJC50cmltKCQoJy5kaXJlY3QtbWVzc2FnZS1pbnB1dCcpLnZhbCgpKS5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBmdW4gZmFjdDogc2VwYXJhdGUgZXZlbnRzIHdpdGggYSBzcGFjZSBpbiB0cmlnZ2VyJ3MgZmlyc3QgYXJnIGFuZCB5b3VcbiAgICAgIC8vIGNhbiB0cmlnZ2VyIG11bHRpcGxlIGV2ZW50cy5cbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiZGlyZWN0TWVzc2FnZVwiLCB7IG1lc3NhZ2U6IHRoaXMuJCgnLmRpcmVjdC1tZXNzYWdlLWlucHV0JykudmFsKCl9KTtcbiAgICAgIHRoaXMuJCgnLmRpcmVjdC1tZXNzYWdlLWlucHV0JykudmFsKCcnKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJ0eXBpbmdcIik7XG4gICAgICBjb25zb2xlLmxvZygnaHVoJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBzZXRSb29tOiBmdW5jdGlvbihlKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnNldFJvb20nKTtcbiAgICB2YXIgJHRhciA9ICQoZS50YXJnZXQpO1xuICAgIGlmICgkdGFyLmlzKCcucm9vbS1uYW1lJykpIHtcbiAgICAgIHRoaXMuam9pblJvb20oJHRhci5kYXRhKCdyb29tJykpO1xuICAgIH1cbiAgfSxcblxuXG4gIGRhdGVEaXZpZGVyOiAoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgJHdpbmRvdyA9ICQod2luZG93KSxcbiAgICAkc3RpY2tpZXM7XG5cbiAgICBsb2FkID0gZnVuY3Rpb24oc3RpY2tpZXMpIHtcbiAgICAgICRzdGlja2llcyA9IHN0aWNraWVzO1xuICAgICAgJCgnI2NoYXRib3gtY29udGVudCcpLnNjcm9sbChzY3JvbGxTdGlja2llc0luaXQpO1xuICAgIH07XG5cbiAgICBzY3JvbGxTdGlja2llc0luaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICQodGhpcykub2ZmKFwic2Nyb2xsLnN0aWNraWVzXCIpO1xuICAgICAgJCh0aGlzKS5vbihcInNjcm9sbC5zdGlja2llc1wiLCBfLmRlYm91bmNlKF93aGVuU2Nyb2xsaW5nLCAxNTApKTtcbiAgICB9O1xuXG4gICAgX3doZW5TY3JvbGxpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgICRzdGlja2llcy5yZW1vdmVDbGFzcygnZml4ZWQnKTtcbiAgICAgICRzdGlja2llcy5lYWNoKGZ1bmN0aW9uKGksIHN0aWNreSkge1xuICAgICAgICB2YXIgJHRoaXNTdGlja3kgPSAkKHN0aWNreSksXG4gICAgICAgICR0aGlzU3RpY2t5VG9wID0gJHRoaXNTdGlja3kub2Zmc2V0KCkudG9wO1xuICAgICAgICBpZiAoJHRoaXNTdGlja3lUb3AgPD0gMTYyKSB7XG4gICAgICAgICAgJHRoaXNTdGlja3kuYWRkQ2xhc3MoXCJmaXhlZFwiKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICBsb2FkOiBsb2FkXG4gICAgfTtcbiAgfSkoKVxuXG5cblxuXG59KTtcblxufSkoalF1ZXJ5KTsiLCJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLkludml0YXRpb25Db2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe1xuICAgIG1vZGVsOiBhcHAuSW52aXRhdGlvbk1vZGVsXG4gIH0pO1xuXG59KSgpOyIsIlxudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuQ2hhdHJvb21MaXN0ID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe1xuICAgIG1vZGVsOiBhcHAuQ2hhdHJvb21Nb2RlbCxcbiAgICB1cmw6ICcvYXBpL2NoYXRyb29tcycsXG4gIH0pO1xuXG59KSgpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLlByaXZhdGVSb29tQ29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcbiAgICBtb2RlbDogYXBwLkNoYXRyb29tTW9kZWwsXG4gIH0pO1xuXG59KSgpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cblxuKGZ1bmN0aW9uKCQpIHtcblxuICBhcHAuQ2hhdEltYWdlVXBsb2FkVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcblxuICAgIGVsOiAkKCcjY2hhdEltYWdlVXBsb2FkQ29udGFpbmVyJyksXG4gIFxuICAgIGV2ZW50czoge1xuICAgICAgJ2NoYW5nZSAjY2hhdEltYWdlVXBsb2FkJzogJ3JlbmRlclRodW1iJyxcbiAgICAgICdhdHRhY2hJbWFnZSAjY2hhdEltYWdlVXBsb2FkRm9ybSc6ICd1cGxvYWQnLFxuICAgICAgJ2NsaWNrICNhZGRDaGF0SW1hZ2VCdG4nOiAnc3VibWl0JyxcbiAgICB9LFxuXG4gICAgLy8gaW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG4gICAgLy8gICB0aGlzLmxpc3RlblRvKHRoaXMsIFwiZmlsZS1jaG9zZW5cIiwgdGhpcy5yZW5kZXJUaHVtYiwgdGhpcyk7XG4gICAgLy8gICB0aGlzLmxpc3RlblRvKHRoaXMsIFwiZmlsZS1jaG9zZW5cIiwgdGhpcy5yZW5kZXJUaHVtYiwgdGhpcyk7XG4gICAgLy8gfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnJlbmRlclRodW1iKCk7XG4gICAgfSxcblxuICAgIHJlbmRlclRodW1iOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpbnB1dCA9IHRoaXMuJCgnI2NoYXRJbWFnZVVwbG9hZCcpO1xuICAgICAgdmFyIGltZyA9IHRoaXMuJCgnI3VwbG9hZGVkQ2hhdEltYWdlJylbMF07XG4gICAgICBpZihpbnB1dC52YWwoKSAhPT0gJycpIHtcbiAgICAgICAgdmFyIHNlbGVjdGVkX2ZpbGUgPSBpbnB1dFswXS5maWxlc1swXTtcbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSAoZnVuY3Rpb24oYUltZykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBhSW1nLnNyYyA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICB9O1xuICAgICAgICB9KShpbWcpO1xuICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTCggc2VsZWN0ZWRfZmlsZSApO1xuICAgICAgfVxuXG4gICAgfSxcblxuICAgIHN1Ym1pdDogZnVuY3Rpb24oZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy4kZm9ybSA9IHRoaXMuJCgnI2NoYXRJbWFnZVVwbG9hZEZvcm0nKTtcbiAgICAgIHRoaXMuJGZvcm0udHJpZ2dlcignYXR0YWNoSW1hZ2UnKTtcbiAgICB9LFxuXG4gICAgdXBsb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSh0aGlzLiRmb3JtWzBdKTtcbiAgICAgIGlmICh0aGlzLiQoJyNjaGF0SW1hZ2VVcGxvYWQnKVswXS5maWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgIHVybDogJy9hcGkvdXBsb2FkQ2hhdEltYWdlJyxcbiAgICAgICAgICBkYXRhOiBmb3JtRGF0YSxcbiAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiggeGhyICkge1xuICAgICAgICAgICAgX3RoaXMucmVuZGVyU3RhdHVzKCdFcnJvcjogJyArIHhoci5zdGF0dXMpO1xuICAgICAgICAgICAgYWxlcnQoJ1lvdXIgaW1hZ2UgaXMgZWl0aGVyIHRvbyBsYXJnZSBvciBpdCBpcyBub3QgYSAuanBlZywgLnBuZywgb3IgLmdpZi4nKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKCByZXNwb25zZSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdpbWdVcGxvYWQgcmVzcG9uc2U6ICcsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIF90aGlzLiRlbC5kYXRhKCdjaGF0LXR5cGUnKSA9PT0gJ2NoYXQnID9cbiAgICAgICAgICAgICAgX3RoaXMudHJpZ2dlcignY2hhdC1pbWFnZS11cGxvYWRlZCcsIHJlc3BvbnNlKSA6XG4gICAgICAgICAgICAgIF90aGlzLnRyaWdnZXIoJ21lc3NhZ2UtaW1hZ2UtdXBsb2FkZWQnLCByZXNwb25zZSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnaW1nVXBsb2FkIHBhdGggJywgcmVzcG9uc2UucGF0aCk7XG4gICAgICAgICAgICAkKCcjY2hhdEltYWdlVXBsb2FkTW9kYWwnKS5tb2RhbCgnaGlkZScpO1xuICAgICAgICAgICAgX3RoaXMuY2xlYXJGaWVsZCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgIHRoaXMudHJpZ2dlcignaW1hZ2UtdXBsb2FkZWQnKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgcmVuZGVyU3RhdHVzOiBmdW5jdGlvbiggc3RhdHVzICkge1xuICAgICAgJCgnI3N0YXR1cycpLnRleHQoc3RhdHVzKTtcbiAgICB9LFxuXG4gICAgY2xlYXJGaWVsZDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiQoJyN1cGxvYWRlZENoYXRJbWFnZScpWzBdLnNyYyA9ICcnO1xuICAgICAgdGhpcy4kKCcjY2hhdEltYWdlVXBsb2FkJykudmFsKCcnKTtcbiAgICB9XG5cbiAgfSk7XG5cbn0pKGpRdWVyeSk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuXG4oZnVuY3Rpb24oJCkge1xuXG4gIGFwcC5DaGF0cm9vbVNldHRpbmdzVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcblxuICAgIGVsOiAkKCcjY2hhdHJvb20taGVhZGVyLWNvbnRhaW5lcicpLFxuICAgIHVzZXJJbnZpdGVkVGVtcGxhdGU6IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJ1c2VyLWludml0ZWQtcmVzcG9uc2Ugc3VjY2Vzc1wiPjwlPSB1c2VybmFtZSAlPiBJbnZpdGVkITwvZGl2PicpLFxuICAgIGludml0YXRpb25FcnJvclRlbXBsYXRlOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwidXNlci1pbnZpdGVkLXJlc3BvbnNlIGZhaWx1cmVcIj5GYWlsdXJlITwvZGl2PicpLFxuICAgIGV2ZW50czoge1xuICAgICAgJ2NoYW5nZSAjcHJlZmVyZW5jZXMtaW1hZ2UtdXBsb2FkJzogJ3JlbmRlclRodW1iJyxcbiAgICAgICdhdHRhY2hJbWFnZSAjcHJlZmVyZW5jZXMtZm9ybSc6ICd1cGxvYWQnLFxuICAgICAgJ2NsaWNrICNwcmVmZXJlbmNlcy1idG4nOiAnc3VibWl0JyxcbiAgICAgICdrZXl1cCAjaW52aXRlLXVzZXItaW5wdXQnOiAnaW52aXRlVXNlcicsXG4gICAgfSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcbiAgICAgIHRoaXMudXNlclNlYXJjaFR5cGVhaGVhZCgpO1xuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAgICQoXCJmb3JtXCIpLnN1Ym1pdChmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLmxpc3RlblRvKHRoaXMsIFwidXNlckludml0ZWRcIiwgdGhpcy51c2VySW52aXRlZCwgdGhpcyk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnJlbmRlclRodW1iKCk7XG4gICAgfSxcblxuICAgIHJlbmRlclRodW1iOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpbnB1dCA9IHRoaXMuJCgnI3ByZWZlcmVuY2VzLWltYWdlLXVwbG9hZCcpO1xuICAgICAgdmFyIGltZyA9IHRoaXMuJCgnI3VwbG9hZGVkLXByZWZlcmVuY2VzLWltYWdlJylbMF07XG4gICAgICBpZihpbnB1dC52YWwoKSAhPT0gJycpIHtcbiAgICAgICAgdmFyIHNlbGVjdGVkX2ZpbGUgPSBpbnB1dFswXS5maWxlc1swXTtcbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSAoZnVuY3Rpb24oYUltZykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBhSW1nLnNyYyA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICB9O1xuICAgICAgICB9KShpbWcpO1xuICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTCggc2VsZWN0ZWRfZmlsZSApO1xuICAgICAgfVxuXG4gICAgfSxcblxuICAgIHN1Ym1pdDogZnVuY3Rpb24oZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICB0aGlzLiRmb3JtID0gdGhpcy4kKCcjcHJlZmVyZW5jZXMtZm9ybScpO1xuICAgICAgdGhpcy4kZm9ybS50cmlnZ2VyKCdhdHRhY2hJbWFnZScpO1xuICAgIH0sXG5cbiAgICB1cGxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKHRoaXMuJGZvcm1bMF0pO1xuICAgICAgaWYgKHRoaXMuJCgnI3ByZWZlcmVuY2VzLWltYWdlLXVwbG9hZCcpWzBdLmZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgdXJsOiAnL2FwaS91cGxvYWRDaGF0cm9vbUltYWdlJyxcbiAgICAgICAgICBkYXRhOiBmb3JtRGF0YSxcbiAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiggeGhyICkge1xuICAgICAgICAgICAgX3RoaXMucmVuZGVyU3RhdHVzKCdFcnJvcjogJyArIHhoci5zdGF0dXMpO1xuICAgICAgICAgICAgYWxlcnQoJ1lvdXIgaW1hZ2UgaXMgZWl0aGVyIHRvbyBsYXJnZSBvciBpdCBpcyBub3QgYSAuanBlZywgLnBuZywgb3IgLmdpZi4nKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKCByZXNwb25zZSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdpbWdVcGxvYWQgcmVzcG9uc2U6ICcsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIHZhciBmb3JtID0gX3RoaXMuY3JlYXRlUm9vbUZvcm1EYXRhKCk7XG4gICAgICAgICAgICBmb3JtLnJvb21JbWFnZSA9IHJlc3BvbnNlLnJvb21JbWFnZTtcbiAgICAgICAgICAgIF90aGlzLnRyaWdnZXIoJ3VwZGF0ZVJvb20nLCBmb3JtKTtcbiAgICAgICAgICAgICQoJyNwcmVmZXJlbmNlcy1tb2RhbCcpLm1vZGFsKCdoaWRlJyk7XG4gICAgICAgICAgICBfdGhpcy5jbGVhckZpZWxkKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBmb3JtID0gdGhpcy5jcmVhdGVSb29tRm9ybURhdGEoKTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKCd1cGRhdGVSb29tJywgZm9ybSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuXG4gICAgY3JlYXRlUm9vbUZvcm1EYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBmb3JtRGF0YSA9IHt9O1xuICAgICAgdGhpcy4kKCcjcHJlZmVyZW5jZXMtZm9ybScpLmZpbmQoICdpbnB1dCcgKS5lYWNoKGZ1bmN0aW9uKGksIGVsKSB7XG4gICAgICAgIGlmICgkKGVsKS5kYXRhKCdjcmVhdGUnKSA9PT0gJ3ByaXZhY3knKSB7XG4gICAgICAgICAgdmFyIHZhbCA9ICQoZWwpLnByb3AoJ2NoZWNrZWQnKTtcbiAgICAgICAgICBmb3JtRGF0YVsncHJpdmFjeSddID0gdmFsO1xuICAgICAgICB9IGVsc2UgaWYgKCQoZWwpLnZhbCgpICE9PSAnJyAmJiAkKGVsKS52YWwoKSAhPT0gJ29uJykge1xuICAgICAgICAgIGZvcm1EYXRhWyQoZWwpLmRhdGEoJ2NyZWF0ZScpXSA9ICQoZWwpLnZhbCgpO1xuICAgICAgICAgICQoZWwpLnZhbCgnJyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgZGVsZXRlIGZvcm1EYXRhLnVuZGVmaW5lZDtcbiAgICAgIHJldHVybiBmb3JtRGF0YTtcbiAgICB9LFxuXG4gICAgcmVuZGVyU3RhdHVzOiBmdW5jdGlvbiggc3RhdHVzICkge1xuICAgICAgJCgnI3N0YXR1cycpLnRleHQoc3RhdHVzKTtcbiAgICB9LFxuXG4gICAgY2xlYXJGaWVsZDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiQoJyN1cGxvYWRlZC1wcmVmZXJlbmNlcy1pbWFnZScpWzBdLnNyYyA9ICcnO1xuICAgICAgdGhpcy4kKCcjcHJlZmVyZW5jZXMtaW1hZ2UtdXBsb2FkJykudmFsKCcnKTtcbiAgICB9LFxuXG4gICAgaW52aXRlVXNlcjogZnVuY3Rpb24oZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdmFyIHJlY2lwaWVudCA9ICQudHJpbSgkKCcjaW52aXRlLXVzZXItaW5wdXQnKS52YWwoKSk7XG4gICAgICBpZiAoZS5rZXlDb2RlID09PSAxMyAmJiByZWNpcGllbnQubGVuZ3RoID4gMCkge1xuICAgICAgICAvLyBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZhciBzZW5kZXIgPSB0aGlzLm1vZGVsLmdldCgnY3VycmVudFVzZXInKSxcbiAgICAgICAgICAgIHJvb21JZCA9IHRoaXMubW9kZWwuZ2V0KCdpZCcpLFxuICAgICAgICAgICAgcm9vbU5hbWUgPSB0aGlzLm1vZGVsLmdldCgnbmFtZScpLFxuICAgICAgICAgICAgaW52aXRhdGlvbk9iaiA9IHtzZW5kZXI6IHNlbmRlciwgcm9vbUlkOiByb29tSWQsIHJvb21OYW1lOiByb29tTmFtZSwgcmVjaXBpZW50OiByZWNpcGllbnR9O1xuICAgICAgICB0aGlzLnZlbnQudHJpZ2dlcignaW52aXRlVXNlcicsIGludml0YXRpb25PYmopO1xuICAgICAgICAkKCcjaW52aXRlLXVzZXItaW5wdXQnKS52YWwoJycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3NlYXJjaCB0eXBpbmcnKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICB1c2VyU2VhcmNoVHlwZWFoZWFkOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgICB2YXIgYmxvb2QgPSBuZXcgQmxvb2Rob3VuZCh7XG4gICAgICAgIGRhdHVtVG9rZW5pemVyOiBCbG9vZGhvdW5kLnRva2VuaXplcnMub2JqLndoaXRlc3BhY2UoJ3VzZXJuYW1lJyksXG4gICAgICAgIHF1ZXJ5VG9rZW5pemVyOiBCbG9vZGhvdW5kLnRva2VuaXplcnMud2hpdGVzcGFjZSxcbiAgICAgICAgcHJlZmV0Y2g6IHtcbiAgICAgICAgICB1cmw6ICcvYWxsVXNlcnMnLFxuICAgICAgICAgIGZpbHRlcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJy0tLS0tLWRhYWF0YWEtLS0tJywgZGF0YSk7XG4gICAgICAgICAgICAgcmV0dXJuIF8ubWFwKGRhdGEsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyB1c2VybmFtZTogdXNlciB9O1xuICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgdHRsOiAwLFxuICAgICAgICB9LFxuICAgICAgICByZW1vdGU6IHtcbiAgICAgICAgICB1cmw6ICcvc2VhcmNoVXNlcnM/dXNlcm5hbWU9JVFVRVJZJyxcbiAgICAgICAgICB3aWxkY2FyZDogJyVRVUVSWScsXG4gICAgICAgICAgcmF0ZUxpbWl0V2FpdDogMzAwLFxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGJsb29kLmNsZWFyUHJlZmV0Y2hDYWNoZSgpO1xuICAgICAgYmxvb2QuaW5pdGlhbGl6ZSgpO1xuICAgICAgJCgnI2ludml0ZS11c2VyLWlucHV0JykudHlwZWFoZWFkKHtcbiAgICAgICAgbWluTGVuZ3RoOiAyLFxuICAgICAgICBjbGFzc05hbWVzOiB7XG4gICAgICAgICAgaW5wdXQ6ICd0eXBlYWhlYWQtaW5wdXQnLFxuICAgICAgICAgIGhpbnQ6ICd0eXBlYWhlYWQtaGludCcsXG4gICAgICAgICAgc2VsZWN0YWJsZTogJ3R5cGVhaGVhZC1zZWxlY3RhYmxlJyxcbiAgICAgICAgICBtZW51OiAndHlwZWFoZWFkLW1lbnUnLFxuICAgICAgICAgIGhpZ2hsaWdodDogJ3R5cGVhaGVhZC1oaWdobGlnaHQnLFxuICAgICAgICAgIGRhdGFzZXQ6ICd0eXBlYWhlYWQtZGF0YXNldCcsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBsaW1pdDogNSxcbiAgICAgICAgc291cmNlOiBibG9vZCxcbiAgICAgICAgbmFtZTogJ3VzZXItc2VhcmNoJyxcbiAgICAgICAgZGlzcGxheTogJ3VzZXJuYW1lJyxcbiAgICAgIH0pLm9uKCd0eXBlYWhlYWQ6c2VsZWN0IHR5cGVhaGVhZDphdXRvY29tcGxldGUnLCBmdW5jdGlvbihvYmopIHtcblxuICAgICAgfSk7XG4gICAgfSxcblxuICAgIHVzZXJJbnZpdGVkOiBmdW5jdGlvbih1c2VybmFtZSkge1xuICAgICAgaWYgKHVzZXJuYW1lLmVycm9yID09PSAnZXJyb3InKSB7XG4gICAgICAgICQoJy5pbnZpdGUtdXNlci1jb250YWluZXInKS5hcHBlbmQodGhpcy5pbnZpdGF0aW9uRXJyb3JUZW1wbGF0ZSgpKTtcbiAgICAgIH1cbiAgICAgICQoJy5pbnZpdGUtdXNlci1jb250YWluZXInKS5hcHBlbmQodGhpcy51c2VySW52aXRlZFRlbXBsYXRlKHt1c2VybmFtZTogdXNlcm5hbWV9KSk7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAkKCcuaW52aXRlLXVzZXItY29udGFpbmVyIC5zdWNjZXNzJykuZmFkZU91dCgzMDAsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICQodGhpcykucmVtb3ZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKCcuaW52aXRlLXVzZXItY29udGFpbmVyIC5mYWlsdXJlJykuZmFkZU91dCgzMDAsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICQodGhpcykucmVtb3ZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSwgMTAwMCk7XG4gICAgfSxcblxuXG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cblxuKGZ1bmN0aW9uKCQpIHtcblxuICBhcHAuQ3JlYXRlQ2hhdHJvb21WaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuXG4gICAgZWw6ICQoJyNjcmVhdGVDaGF0cm9vbUNvbnRhaW5lcicpLFxuICAgIGV2ZW50czoge1xuICAgICAgJ2NoYW5nZSAjY2hhdHJvb21JbWFnZVVwbG9hZCc6ICdyZW5kZXJUaHVtYicsXG4gICAgICAnYXR0YWNoSW1hZ2UgI2NyZWF0ZUNoYXRyb29tRm9ybSc6ICd1cGxvYWQnLFxuICAgICAgJ2NsaWNrICNjcmVhdGVDaGF0cm9vbUJ0bic6ICdzdWJtaXQnLFxuICAgIH0sXG5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XG4gICAgICB0aGlzLmxpc3RlblRvKHRoaXMsIFwiY2hhdHJvb21BdmFpbGFiaWxpdHlcIiwgdGhpcy5yZW5kZXJDaGF0cm9vbUF2YWlsYWJpbGl0eSwgdGhpcyk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnJlbmRlclRodW1iKCk7XG4gICAgfSxcblxuICAgIHJlbmRlclRodW1iOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpbnB1dCA9IHRoaXMuJCgnI2NoYXRyb29tSW1hZ2VVcGxvYWQnKTtcbiAgICAgIHZhciBpbWcgPSB0aGlzLiQoJyN1cGxvYWRlZENoYXRyb29tSW1hZ2UnKVswXTtcbiAgICAgIGlmKGlucHV0LnZhbCgpICE9PSAnJykge1xuICAgICAgICB2YXIgc2VsZWN0ZWRfZmlsZSA9IGlucHV0WzBdLmZpbGVzWzBdO1xuICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IChmdW5jdGlvbihhSW1nKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGFJbWcuc3JjID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgICAgIH07XG4gICAgICAgIH0pKGltZyk7XG4gICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKCBzZWxlY3RlZF9maWxlICk7XG4gICAgICB9XG5cbiAgICB9LFxuXG4gICAgc3VibWl0OiBmdW5jdGlvbihlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBpZiAodGhpcy4kKCcjY2hhdHJvb20tbmFtZS1pbnB1dCcpLmhhc0NsYXNzKCdpbnB1dC1pbnZhbGlkJykpIHtcbiAgICAgICAgc3dhbCh7XG4gICAgICAgICAgdGl0bGU6IFwiT0ggTk8gT0ggTk8gT0ggTk9cIixcbiAgICAgICAgICB0ZXh0OiBcIkNoYXRyb29tIEFscmVhZHksIEl0IEFscmVhZHkgRXhpc3RzISBBbmQuIERvbid0IEdvIEluIFRoZXJlLiBEb24ndC4gWW91LiBZb3UgU2hvdWxkIEhhdmUuIEkgVGhyZXcgVXAgSW4gTXkgSGF0LiBUaG9zZSBQb29yIC4gLiAuIFRoZXkgV2VyZSBKdXN0ISBPSCBOTyBXSFkuIFdIWSBPSCBOTy4gT0ggTk8uXCIsXG4gICAgICAgICAgdHlwZTogXCJlcnJvclwiLFxuICAgICAgICAgIGNvbmZpcm1CdXR0b25Db2xvcjogXCIjNzQ5Q0E4XCJcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLiRmb3JtID0gdGhpcy4kKCcjY3JlYXRlQ2hhdHJvb21Gb3JtJyk7XG4gICAgICAgIHRoaXMuJGZvcm0udHJpZ2dlcignYXR0YWNoSW1hZ2UnKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgdXBsb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICB2YXIgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEodGhpcy4kZm9ybVswXSk7XG4gICAgICBpZiAodGhpcy4kKCcjY2hhdHJvb21JbWFnZVVwbG9hZCcpWzBdLmZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgdXJsOiAnL2FwaS91cGxvYWRDaGF0cm9vbUltYWdlJyxcbiAgICAgICAgICBkYXRhOiBmb3JtRGF0YSxcbiAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiggeGhyICkge1xuICAgICAgICAgICAgX3RoaXMucmVuZGVyU3RhdHVzKCdFcnJvcjogJyArIHhoci5zdGF0dXMpO1xuICAgICAgICAgICAgYWxlcnQoJ1lvdXIgaW1hZ2UgaXMgZWl0aGVyIHRvbyBsYXJnZSBvciBpdCBpcyBub3QgYSAuanBlZywgLnBuZywgb3IgLmdpZi4nKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKCByZXNwb25zZSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdpbWdVcGxvYWQgcmVzcG9uc2U6ICcsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIHZhciBmb3JtID0gX3RoaXMuY3JlYXRlUm9vbUZvcm1EYXRhKCk7XG4gICAgICAgICAgICByZXNwb25zZS5uYW1lID0gZm9ybS5uYW1lO1xuICAgICAgICAgICAgICBfdGhpcy52ZW50LnRyaWdnZXIoJ2NyZWF0ZVJvb20nLCByZXNwb25zZSk7XG4gICAgICAgICAgICAkKCcjY3JlYXRlQ2hhdHJvb21Nb2RhbCcpLm1vZGFsKCdoaWRlJyk7XG4gICAgICAgICAgICBfdGhpcy5jbGVhckZpZWxkKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBmb3JtID0gX3RoaXMuY3JlYXRlUm9vbUZvcm1EYXRhKCk7XG4gICAgICAgdGhpcy52ZW50LnRyaWdnZXIoJ2NyZWF0ZVJvb20nLCBmb3JtKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG5cbiAgICBjcmVhdGVSb29tRm9ybURhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGZvcm1EYXRhID0ge307XG4gICAgICBmb3JtRGF0YS5yb29tSW1hZ2UgPSAnL2ltZy9jaGphdC1pY29uMS5wbmcnO1xuICAgICAgdGhpcy4kKCcjY3JlYXRlQ2hhdHJvb21Gb3JtJykuZmluZCggJ2lucHV0JyApLmVhY2goZnVuY3Rpb24oaSwgZWwpIHtcbiAgICAgICAgaWYgKCQoZWwpLnByb3AoJ3R5cGUnKSA9PT0gXCJidXR0b25cIikge1xuXG4gICAgICAgIH0gZWxzZSBpZiAoJChlbCkuZGF0YSgnY3JlYXRlJykgPT09ICdwcml2YWN5Jykge1xuICAgICAgICAgIHZhciB2YWwgPSAkKGVsKS5wcm9wKCdjaGVja2VkJyk7XG4gICAgICAgICAgZm9ybURhdGFbJ3ByaXZhY3knXSA9IHZhbDtcbiAgICAgICAgfSBlbHNlIGlmICgkKGVsKS52YWwoKSAhPT0gJycpIHtcbiAgICAgICAgICBmb3JtRGF0YVskKGVsKS5kYXRhKCdjcmVhdGUnKV0gPSAkKGVsKS52YWwoKTtcbiAgICAgICAgICAkKGVsKS52YWwoJycpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBmb3JtRGF0YTtcblxuICAgIH0sXG5cbiAgICByZW5kZXJTdGF0dXM6IGZ1bmN0aW9uKCBzdGF0dXMgKSB7XG4gICAgICAkKCcjc3RhdHVzJykudGV4dChzdGF0dXMpO1xuICAgIH0sXG5cbiAgICBjbGVhckZpZWxkOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJCgnI3VwbG9hZGVkQ2hhdHJvb21JbWFnZScpWzBdLnNyYyA9ICcnO1xuICAgICAgdGhpcy4kKCcjY2hhdHJvb21JbWFnZVVwbG9hZCcpLnZhbCgnJyk7XG4gICAgfSxcblxuICAgIHJlbmRlckNoYXRyb29tQXZhaWxhYmlsaXR5OiBmdW5jdGlvbihhdmFpbGFiaWxpdHkpIHtcbiAgICAgIHRoaXMuJCgnLnJvb20tbmFtZS12YWxpZGF0aW9uJykucmVtb3ZlQ2xhc3MoJ2lucHV0LXZhbGlkIGlucHV0LWludmFsaWQnKTtcbiAgICAgIHRoaXMuJCgnLnJvb20tbmFtZS12YWxpZGF0aW9uLW1lc3NhZ2UnKS5jaGlsZHJlbigpLnJlbW92ZSgpO1xuICAgICAgaWYgKGF2YWlsYWJpbGl0eSA9PT0gdHJ1ZSkge1xuICAgICAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbicpLmFkZENsYXNzKCdpbnB1dC12YWxpZCcpO1xuICAgICAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbi1tZXNzYWdlJykuYXBwZW5kKCc8ZGl2IGlkPVwiI2NoYXRyb29tLW5hbWUtdmFsaWRhdGlvblwiIGNsYXNzPVwiZmEgZmEtY2hlY2tcIj5OYW1lIEF2YWlsYWJsZTwvZGl2PicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy4kKCcucm9vbS1uYW1lLXZhbGlkYXRpb24nKS5hZGRDbGFzcygnaW5wdXQtaW52YWxpZCBmYSBmYS10aW1lcycpO1xuICAgICAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbi1tZXNzYWdlJykuYXBwZW5kKCc8ZGl2IGlkPVwiI2NoYXRyb29tLW5hbWUtdmFsaWRhdGlvblwiIGNsYXNzPVwiZmEgZmEtdGltZXNcIj5OYW1lIFVuYXZhaWxhYmxlPC9kaXY+Jyk7XG4gICAgICB9XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbi1tZXNzYWdlJykuY2hpbGRyZW4oKS5mYWRlT3V0KDYwMCwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAkKHRoaXMpLmNoaWxkcmVuKCkucmVtb3ZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSwgMjAwMCk7XG4gICAgfVxuXG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5OYXZiYXJWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIGVsOiAnLmxvZ2luLW1lbnUnLFxuICAgIHRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNuYXZiYXItdGVtcGxhdGUnKS5odG1sKCkpLFxuICAgIGludml0YXRpb25UZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjaW52aXRhdGlvbi10ZW1wbGF0ZScpLmh0bWwoKSksXG4gICAgZXZlbnRzOiB7XG4gICAgICAnY2xpY2sgLmRlbGV0ZS1pbnZpdGF0aW9uJzogJ2RlbGV0ZUludml0YXRpb24nLFxuICAgICAgJ2NsaWNrIC5hY2NlcHQtaW52aXRhdGlvbic6ICdhY2NlcHRJbnZpdGF0aW9uJyxcbiAgICAgICdjaGFuZ2UgI3VzZXItcHJlZmVyZW5jZXMtaW1hZ2UtdXBsb2FkJzogJ3JlbmRlclRodW1iJyxcbiAgICAgICdhdHRhY2hJbWFnZSAjdXNlci1wcmVmZXJlbmNlcy1mb3JtJzogJ3VwbG9hZCcsXG4gICAgICAnY2xpY2sgI3VzZXItcHJlZmVyZW5jZXMtYnRuJzogJ3N1Ym1pdCcsXG4gICAgICAna2V5dXAgI3VzZXItcHJlZmVyZW5jZXMtaG9tZS1yb29tLWlucHV0JzogJ2RvZXNIb21lUm9vbUV4aXN0JyxcbiAgICAgIC8vICdrZXlwcmVzcyAjdXNlci1wcmVmZXJlbmNlcy1ob21lLXJvb20taW5wdXQnOiAnZG9lc0hvbWVSb29tRXhpc3QnLFxuICAgIH0sXG5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XG4gICAgICB0aGlzLm1vZGVsID0gbmV3IGFwcC5Vc2VyTW9kZWwoeyB1c2VybmFtZTogJycsIHVzZXJJbWFnZTogJycsIGhvbWVSb29tOiAnJywgaW52aXRhdGlvbnM6IG5ldyBhcHAuSW52aXRhdGlvbkNvbGxlY3Rpb24oKSB9KTtcbiAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJjaGFuZ2VcIiwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuXG4gICAgICB2YXIgaW52aXRhdGlvbnMgPSB0aGlzLm1vZGVsLmdldCgnaW52aXRhdGlvbnMnKTtcblxuICAgICAgdGhpcy5saXN0ZW5UbyhpbnZpdGF0aW9ucywgXCJyZXNldFwiLCB0aGlzLnJlbmRlckludml0YXRpb25zLCB0aGlzKTtcbiAgICAgIHRoaXMubGlzdGVuVG8odGhpcywgXCJob21lUm9vbUF2YWlsYWJpbGl0eVwiLCB0aGlzLnJlbmRlckhvbWVSb29tQXZhaWxhYmlsaXR5LCB0aGlzKTtcblxuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9LFxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUodGhpcy5tb2RlbC50b0pTT04oKSkpO1xuXG4gICAgICB0aGlzLnJlbmRlckludml0YXRpb25zKCk7XG4gICAgICB0aGlzLnNldEhvbWVSb29tVHllcGFoZWFkKCk7XG5cblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICByZW5kZXJJbnZpdGF0aW9uczogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiQoJyNpbnZpdGF0aW9ucycpLmVtcHR5KCk7XG4gICAgICB2YXIgaW52aXRhdGlvbnMgPSB0aGlzLm1vZGVsLmdldCgnaW52aXRhdGlvbnMnKTtcbiAgICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgICBpbnZpdGF0aW9ucy5lYWNoKGZ1bmN0aW9uKGludml0ZSkge1xuICAgICAgICB0aGlzXy5yZW5kZXJJbnZpdGF0aW9uKGludml0ZSk7XG4gICAgICB9LCB0aGlzKTtcbiAgICAgIGlmIChpbnZpdGF0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhpcy4kKCcucGluay1mdXp6JykuaGlkZSgpO1xuICAgICAgICB0aGlzLiQoJyNpbnZpdGF0aW9ucycpLmFwcGVuZChcIjxkaXY+WW91J3ZlIGdvdCBubyBpbnZpdGF0aW9ucywgbGlrZSBkYW5nPC9kaXY+XCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy4kKCcucGluay1mdXp6Jykuc2hvdygpO1xuICAgICAgfVxuICAgIH0sXG4gICAgcmVuZGVySW52aXRhdGlvbjogZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIHRoaXMuJCgnI2ludml0YXRpb25zJykuYXBwZW5kKHRoaXMuaW52aXRhdGlvblRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gICAgfSxcbiAgICBkZWxldGVJbnZpdGF0aW9uOiBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgcm9vbUlkID0gJChlLnRhcmdldCkuZGF0YSgncm9vbWlkJyk7XG4gICAgICB0aGlzLnZlbnQudHJpZ2dlcignZGVsZXRlSW52aXRhdGlvbicsIHJvb21JZCk7XG4gICAgfSxcbiAgICBhY2NlcHRJbnZpdGF0aW9uOiBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgcm9vbUlkID0gJChlLnRhcmdldCkuZGF0YSgncm9vbWlkJyk7XG4gICAgICB0aGlzLnZlbnQudHJpZ2dlcignYWNjZXB0SW52aXRhdGlvbicsIHJvb21JZCk7XG4gICAgfSxcblxuXG4gICAgcmVuZGVyVGh1bWI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGlucHV0ID0gdGhpcy4kKCcjdXNlci1wcmVmZXJlbmNlcy1pbWFnZS11cGxvYWQnKTtcbiAgICAgIHZhciBpbWcgPSB0aGlzLiQoJyN1cGxvYWRlZC11c2VyLXByZWZlcmVuY2VzLWltYWdlJylbMF07XG4gICAgICBpZihpbnB1dC52YWwoKSAhPT0gJycpIHtcbiAgICAgICAgdmFyIHNlbGVjdGVkX2ZpbGUgPSBpbnB1dFswXS5maWxlc1swXTtcbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSAoZnVuY3Rpb24oYUltZykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBhSW1nLnNyYyA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICB9O1xuICAgICAgICB9KShpbWcpO1xuICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTCggc2VsZWN0ZWRfZmlsZSApO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGlmICh0aGlzLiQoJyN1c2VyLXByZWZlcmVuY2VzLWhvbWUtcm9vbS1pbnB1dCcpLmhhc0NsYXNzKCdpbnB1dC1pbnZhbGlkJykpIHtcbiAgICAgICAgc3dhbCh7XG4gICAgICAgICAgdGl0bGU6IFwiT0ggTk8gT0ggTk8gT0ggTk9cIixcbiAgICAgICAgICB0ZXh0OiBcIkNoYXRyb29tIENhbid0LCBJdCBEb2Vzbid0IEV4aXN0ISBBbmQuIEkgRG9uJ3QgS25vdy4gU2hvdWxkIEk/IFNob3VsZCBZb3U/IFdoby4gSSBNZWFuIEhvdyBETyB3ZS4gSG93IGRvPyBIb3cgZG8gbm93P1wiLFxuICAgICAgICAgIHR5cGU6IFwiZXJyb3JcIixcbiAgICAgICAgICBjb25maXJtQnV0dG9uQ29sb3I6IFwiIzc0OUNBOFwiXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy4kZm9ybSA9IHRoaXMuJCgnI3VzZXItcHJlZmVyZW5jZXMtZm9ybScpO1xuICAgICAgICB0aGlzLiRmb3JtLnRyaWdnZXIoJ2F0dGFjaEltYWdlJyk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHVwbG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgICAgICB2YXIgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEodGhpcy4kZm9ybVswXSk7XG4gICAgICBpZiAodGhpcy4kKCcjdXNlci1wcmVmZXJlbmNlcy1pbWFnZS11cGxvYWQnKVswXS5maWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgIHVybDogJy91cGRhdGVVc2VySW1hZ2UnLFxuICAgICAgICAgIGRhdGE6IGZvcm1EYXRhLFxuICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICBjb250ZW50VHlwZTogZmFsc2UsXG4gICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKCB4aHIgKSB7XG4gICAgICAgICAgICB0aGlzXy5yZW5kZXJTdGF0dXMoJ0Vycm9yOiAnICsgeGhyLnN0YXR1cyk7XG4gICAgICAgICAgICBhbGVydCgnWW91ciBpbWFnZSBpcyBlaXRoZXIgdG9vIGxhcmdlIG9yIGl0IGlzIG5vdCBhIC5qcGVnLCAucG5nLCBvciAuZ2lmLicpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ltZ1VwbG9hZCByZXNwb25zZTogJywgcmVzcG9uc2UpO1xuICAgICAgICAgICAgdmFyIGZvcm0gPSB0aGlzXy5jcmVhdGVVc2VyRm9ybURhdGEoKTtcbiAgICAgICAgICAgIGZvcm0udXNlckltYWdlID0gcmVzcG9uc2UudXNlckltYWdlO1xuICAgICAgICAgICAgdGhpc18udmVudC50cmlnZ2VyKCd1cGRhdGVVc2VyJywgZm9ybSk7XG4gICAgICAgICAgICAkKCcjdXNlci1wcmVmZXJlbmNlcy1tb2RhbCcpLm1vZGFsKCdoaWRlJyk7XG4gICAgICAgICAgICB0aGlzXy5jbGVhckZpZWxkKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBmb3JtID0gdGhpcy5jcmVhdGVVc2VyRm9ybURhdGEoKTtcbiAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoJ3VwZGF0ZVVzZXInLCBmb3JtKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgY3JlYXRlVXNlckZvcm1EYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBmb3JtRGF0YSA9IHt9O1xuICAgICAgdGhpcy4kKCcjdXNlci1wcmVmZXJlbmNlcy1mb3JtJykuZmluZCggJ2lucHV0JyApLmVhY2goZnVuY3Rpb24oaSwgZWwpIHtcbiAgICAgICAgaWYgKCQoZWwpLmRhdGEoJ2NyZWF0ZScpID09PSAncHJpdmFjeScpIHtcbiAgICAgICAgICB2YXIgdmFsID0gJChlbCkucHJvcCgnY2hlY2tlZCcpO1xuICAgICAgICAgIGZvcm1EYXRhWydwcml2YWN5J10gPSB2YWw7XG4gICAgICAgIH0gZWxzZSBpZiAoJChlbCkudmFsKCkgIT09ICcnICYmICQoZWwpLnZhbCgpICE9PSAnb24nKSB7XG4gICAgICAgICAgZm9ybURhdGFbJChlbCkuZGF0YSgnY3JlYXRlJyldID0gJChlbCkudmFsKCk7XG4gICAgICAgICAgJChlbCkudmFsKCcnKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBkZWxldGUgZm9ybURhdGEudW5kZWZpbmVkO1xuICAgICAgcmV0dXJuIGZvcm1EYXRhO1xuICAgIH0sXG5cbiAgICBjbGVhckZpZWxkOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJCgnI3VwbG9hZGVkLXVzZXItcHJlZmVyZW5jZXMtaW1hZ2UnKVswXS5zcmMgPSAnJztcbiAgICAgIHRoaXMuJCgnI3VzZXItcHJlZmVyZW5jZXMtaW1hZ2UtdXBsb2FkJykudmFsKCcnKTtcbiAgICB9LFxuXG4gICAgc2V0SG9tZVJvb21UeWVwYWhlYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAgIHZhciBibG9vZCA9IG5ldyBCbG9vZGhvdW5kKHtcbiAgICAgICAgZGF0dW1Ub2tlbml6ZXI6IEJsb29kaG91bmQudG9rZW5pemVycy5vYmoud2hpdGVzcGFjZSgnbmFtZScpLFxuICAgICAgICBxdWVyeVRva2VuaXplcjogQmxvb2Rob3VuZC50b2tlbml6ZXJzLndoaXRlc3BhY2UsXG4gICAgICAgIHByZWZldGNoOiB7XG4gICAgICAgICAgdXJsOiAnL2FwaS9wdWJsaWNDaGF0cm9vbXMnLFxuICAgICAgICAgIGZpbHRlcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJy0tLS0tLS0tLWhvbWVSb29tRGF0YTogJywgZGF0YSk7XG4gICAgICAgICAgICAgcmV0dXJuIF8ubWFwKGRhdGEsIGZ1bmN0aW9uKGNoYXRyb29tKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgbmFtZTogY2hhdHJvb20gfTtcbiAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHR0bF9tczogMCxcbiAgICAgICAgfSxcbiAgICAgICAgcmVtb3RlOiB7XG4gICAgICAgICAgdXJsOiAnL2FwaS9zZWFyY2hDaGF0cm9vbXM/bmFtZT0lUVVFUlknLFxuICAgICAgICAgIHdpbGRjYXJkOiAnJVFVRVJZJyxcbiAgICAgICAgICByYXRlTGltaXRXYWl0OiAzMDAsXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgYmxvb2QuY2xlYXJQcmVmZXRjaENhY2hlKCk7XG4gICAgICBibG9vZC5pbml0aWFsaXplKCk7XG4gICAgICB2YXIgdHlwZSA9IHRoaXMuJCgnI3VzZXItcHJlZmVyZW5jZXMtaG9tZS1yb29tLWlucHV0JykudHlwZWFoZWFkKHtcbiAgICAgICAgbWluTGVuZ3RoOiAyLFxuICAgICAgICBjbGFzc05hbWVzOiB7XG4gICAgICAgICAgaW5wdXQ6ICd0eXBlYWhlYWQtaW5wdXQnLFxuICAgICAgICAgIGhpbnQ6ICd0eXBlYWhlYWQtaGludCcsXG4gICAgICAgICAgc2VsZWN0YWJsZTogJ3R5cGVhaGVhZC1zZWxlY3RhYmxlJyxcbiAgICAgICAgICBtZW51OiAndHlwZWFoZWFkLW1lbnUnLFxuICAgICAgICAgIGhpZ2hsaWdodDogJ3R5cGVhaGVhZC1oaWdobGlnaHQnLFxuICAgICAgICAgIGRhdGFzZXQ6ICd0eXBlYWhlYWQtZGF0YXNldCcsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBsaW1pdDogNSxcbiAgICAgICAgc291cmNlOiBibG9vZCxcbiAgICAgICAgbmFtZTogJ2hvbWUtcm9vbS1zZWFyY2gnLFxuICAgICAgICBkaXNwbGF5OiAnbmFtZScsXG4gICAgICB9KS5vbigndHlwZWFoZWFkOnNlbGVjdCB0eXBlYWhlYWQ6YXV0b2NvbXBsZXRlJywgZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIHRoaXNfLmRvZXNIb21lUm9vbUV4aXN0KCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgZG9lc0hvbWVSb29tRXhpc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kKCcucm9vbS1uYW1lLXZhbGlkYXRpb24nKS5yZW1vdmVDbGFzcygnaW5wdXQtdmFsaWQgaW5wdXQtaW52YWxpZCcpO1xuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAgIHZhciBjaGVjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoJC50cmltKCQoJyN1c2VyLXByZWZlcmVuY2VzLWhvbWUtcm9vbS1pbnB1dCcpLnZhbCgpKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdmFyIGNoYXRyb29tTmFtZSA9ICQoJyN1c2VyLXByZWZlcmVuY2VzLWhvbWUtcm9vbS1pbnB1dCcpLnZhbCgpO1xuICAgICAgICAgIHRoaXNfLnZlbnQudHJpZ2dlcignZG9lc0hvbWVSb29tRXhpc3QnLCBjaGF0cm9vbU5hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgdGhpc18uJCgnI3VzZXItcHJlZmVyZW5jZXMtaG9tZS1yb29tLWlucHV0JykuY2hpbGRyZW4oKS5yZW1vdmUoKTtcbiAgICAgICAgIHRoaXNfLiQoJyN1c2VyLXByZWZlcmVuY2VzLWhvbWUtcm9vbS1pbnB1dCcpLnJlbW92ZUNsYXNzKCdpbnB1dC12YWxpZCBpbnB1dC1pbnZhbGlkJyk7XG4gICAgICAgfVxuICAgICB9O1xuICAgICBfLmRlYm91bmNlKGNoZWNrKCksIDMwKTtcbiAgIH0sXG5cbiAgIHJlbmRlckhvbWVSb29tQXZhaWxhYmlsaXR5OiBmdW5jdGlvbihhdmFpbGFiaWxpdHkpIHtcblxuICAgIHRoaXMuJCgnLnJvb20tbmFtZS12YWxpZGF0aW9uJykucmVtb3ZlQ2xhc3MoJ2lucHV0LXZhbGlkIGlucHV0LWludmFsaWQnKTtcbiAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbi1tZXNzYWdlJykuY2hpbGRyZW4oKS5yZW1vdmUoKTtcbiAgICBpZiAoYXZhaWxhYmlsaXR5ID09PSBmYWxzZSkge1xuICAgICAgdGhpcy4kKCcucm9vbS1uYW1lLXZhbGlkYXRpb24nKS5hZGRDbGFzcygnaW5wdXQtdmFsaWQnKTtcbiAgICAgIHRoaXMuJCgnLnJvb20tbmFtZS12YWxpZGF0aW9uLW1lc3NhZ2UnKS5hcHBlbmQoJzxkaXYgaWQ9XCIjY2hhdHJvb20tbmFtZS12YWxpZGF0aW9uXCIgY2xhc3M9XCJmYSBmYS1jaGVja1wiPjwvZGl2PicpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbicpLmFkZENsYXNzKCdpbnB1dC1pbnZhbGlkIGZhIGZhLXRpbWVzJyk7XG4gICAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbi1tZXNzYWdlJykuYXBwZW5kKCc8ZGl2IGlkPVwiI2NoYXRyb29tLW5hbWUtdmFsaWRhdGlvblwiIGNsYXNzPVwiZmEgZmEtdGltZXNcIj5DaGF0cm9vbSBEb2VzIE5vdCBFeGlzdDwvZGl2PicpO1xuICAgIH1cbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kKCcucm9vbS1uYW1lLXZhbGlkYXRpb24tbWVzc2FnZScpLmNoaWxkcmVuKCkuZmFkZU91dCg2MDAsIGZ1bmN0aW9uKCl7XG4gICAgICAgICQodGhpcykuY2hpbGRyZW4oKS5yZW1vdmUoKTtcbiAgICAgIH0pO1xuICAgIH0sIDIwMDApO1xuICB9LFxuXG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5SZWdpc3RlclZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI3JlZ2lzdGVyJykuaHRtbCgpKSxcbiAgICB1c2VybmFtZUF2YWlsYWJsZVRlbXBsYXRlOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwidXNlcm5hbWUtYXZhaWxhYmxlIGZhIGZhLWNoZWNrXCI+dXNlcm5hbWUgYXZhaWxhYmxlPC9kaXY+JyksXG4gICAgdXNlcm5hbWVUYWtlblRlbXBsYXRlOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwidXNlcm5hbWUtdGFrZW4gZmEgZmEtdGltZXNcIj51c2VybmFtZSB0YWtlbjwvZGl2PicpLFxuICAgIGV2ZW50czoge1xuICAgICAgXCJjbGljayAjc2lnblVwQnRuXCI6IFwic2lnblVwXCIsXG4gICAgICBcImtleXVwICN1c2VybmFtZVwiOiBcInZhbGlkYXRlVXNlcm5hbWVcIixcbiAgICB9LFxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSxcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKCkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzaWduVXA6IGZ1bmN0aW9uKCkge1xuICAgIH0sXG4gICAgdmFsaWRhdGVVc2VybmFtZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoJCgnI3VzZXJuYW1lJykudmFsKCkubGVuZ3RoIDwgNSkgeyByZXR1cm47IH1cbiAgICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgICBfLmRlYm91bmNlKCQucG9zdCgnL3JlZ2lzdGVyVmFsaWRhdGlvbicsIHsgdXNlcm5hbWU6ICQoJyN1c2VybmFtZScpLnZhbCgpIH0sZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgZGF0YS51c2VybmFtZUF2YWlsYWJsZSA/XG4gICAgICAgICAgIHRoaXNfLnJlbmRlclZhbGlkYXRpb24odGhpc18udXNlcm5hbWVBdmFpbGFibGVUZW1wbGF0ZSgpKVxuICAgICAgICAgOlxuICAgICAgICAgICB0aGlzXy5yZW5kZXJWYWxpZGF0aW9uKHRoaXNfLnVzZXJuYW1lVGFrZW5UZW1wbGF0ZSgpKTtcbiAgICAgIH0pLCAxNTApO1xuICAgIH0sXG4gICAgcmVuZGVyVmFsaWRhdGlvbjogZnVuY3Rpb24od2hhdCkge1xuICAgICAgJCgnLnJlZ2lzdGVyLWVycm9yLWNvbnRhaW5lcicpLmVtcHR5KCk7XG4gICAgICAkKHdoYXQpLmFwcGVuZFRvKCQoJy5yZWdpc3Rlci1lcnJvci1jb250YWluZXInKSkuaGlkZSgpLmZhZGVJbigpO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnLnJlZ2lzdGVyLWVycm9yLWNvbnRhaW5lcicpLmNoaWxkcmVuKCkuZmlyc3QoKS5mYWRlT3V0KCk7XG4gICAgICB9LCAyMDAwKTtcblxuICAgIH1cbiAgfSk7XG5cbn0pKGpRdWVyeSk7IiwiXG4vLyBUaGUgQ2hhdENsaWVudCBpcyBpbXBsZW1lbnRlZCBvbiBtYWluLmpzLlxuLy8gVGhlIGNoYXRjbGllbnQgaXMgYSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBvbiB0aGUgTWFpbkNvbnRyb2xsZXIuXG4vLyBJdCBib3RoIGxpc3RlbnMgdG8gYW5kIGVtaXRzIGV2ZW50cyBvbiB0aGUgc29ja2V0LCBlZzpcbi8vIEl0IGhhcyBpdHMgb3duIG1ldGhvZHMgdGhhdCwgd2hlbiBjYWxsZWQsIGVtaXQgdG8gdGhlIHNvY2tldCB3LyBkYXRhLlxuLy8gSXQgYWxzbyBzZXRzIHJlc3BvbnNlIGxpc3RlbmVycyBvbiBjb25uZWN0aW9uLCB0aGVzZSByZXNwb25zZSBsaXN0ZW5lcnNcbi8vIGxpc3RlbiB0byB0aGUgc29ja2V0IGFuZCB0cmlnZ2VyIGV2ZW50cyBvbiB0aGUgYXBwRXZlbnRCdXMgb24gdGhlIFxuLy8gTWFpbkNvbnRyb2xsZXJcbnZhciBDaGF0Q2xpZW50ID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXG5cdHZhciBzZWxmID0gdGhpcztcblxuXHQvLyBpcy10eXBpbmcgaGVscGVyIHZhcmlhYmxlc1xuXHR2YXIgVFlQSU5HX1RJTUVSX0xFTkdUSCA9IDQwMDsgLy8gbXNcbiAgdmFyIHR5cGluZyA9IGZhbHNlO1xuICB2YXIgbGFzdFR5cGluZ1RpbWU7XG4gIFxuICAvLyB0aGlzIHZlbnQgaG9sZHMgdGhlIGFwcEV2ZW50QnVzXG5cdHNlbGYudmVudCA9IG9wdGlvbnMudmVudDtcblxuXHRzZWxmLmhvc3RuYW1lID0gJ2h0dHA6Ly8nICsgd2luZG93LmxvY2F0aW9uLmhvc3Q7XG5cbiAgLy8gY29ubmVjdHMgdG8gc29ja2V0LCBzZXRzIHJlc3BvbnNlIGxpc3RlbmVyc1xuXHRzZWxmLmNvbm5lY3QgPSBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5jb25uZWN0Jyk7XG5cdFx0Ly8gdGhpcyBpbyBtaWdodCBiZSBhIGxpdHRsZSBjb25mdXNpbmcuLi4gd2hlcmUgaXMgaXQgY29taW5nIGZyb20/XG5cdFx0Ly8gaXQncyBjb21pbmcgZnJvbSB0aGUgc3RhdGljIG1pZGRsZXdhcmUgb24gc2VydmVyLmpzIGJjIGV2ZXJ5dGhpbmdcblx0XHQvLyBpbiB0aGUgL3B1YmxpYyBmb2xkZXIgaGFzIGJlZW4gYXR0YWNoZWQgdG8gdGhlIHNlcnZlciwgYW5kIHZpc2Fcblx0XHQvLyB2ZXJzYS5cblx0XHRzZWxmLnNvY2tldCA9IGlvLmNvbm5lY3Qoc2VsZi5ob3N0bmFtZSk7XG4gICAgc2VsZi5zZXRSZXNwb25zZUxpc3RlbmVycyhzZWxmLnNvY2tldCk7XG4gIH07XG5cblxuXG4vLy8vLyBWaWV3RXZlbnRCdXMgbWV0aG9kcyAvLy8vXG4gICAgLy8gbWV0aG9kcyB0aGF0IGVtaXQgdG8gdGhlIGNoYXRzZXJ2ZXJcblxuLy8gTE9HSU5cbiAgc2VsZi5sb2dpbiA9IGZ1bmN0aW9uKHVzZXIpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5sb2dpbjogJywgdXNlcik7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcImxvZ2luXCIsIHVzZXIpO1xuICB9O1xuXG5cbi8vIFJPT01cbiAgc2VsZi5jb25uZWN0VG9Sb29tID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmNvbm5lY3RUb1Jvb206ICcsIG5hbWUpO1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJjb25uZWN0VG9Sb29tXCIsIG5hbWUpO1xuICB9O1xuICBzZWxmLmpvaW5Sb29tID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoJ2pvaW5Sb29tJywgbmFtZSk7XG4gIH07XG4gIHNlbGYuYWRkUm9vbSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5hZGRSb29tOiAnLCBuYW1lKTtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwiYWRkUm9vbVwiLCBuYW1lKTtcbiAgfTtcbiAgc2VsZi5yZW1vdmVSb29tID0gZnVuY3Rpb24ocm9vbURhdGEpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5yZW1vdmVSb29tOiAnLCByb29tRGF0YSk7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcInJlbW92ZVJvb21cIiwgcm9vbURhdGEpO1xuICB9O1xuICBzZWxmLmNyZWF0ZVJvb20gPSBmdW5jdGlvbihmb3JtRGF0YSkge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmNyZWF0ZVJvb206ICcsIGZvcm1EYXRhKTtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwiY3JlYXRlUm9vbVwiLCBmb3JtRGF0YSk7XG4gIH07XG4gIHNlbGYudXBkYXRlUm9vbSA9IGZ1bmN0aW9uKGZvcm1EYXRhKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYudXBkYXRlUm9vbTogJywgZm9ybURhdGEpO1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJ1cGRhdGVSb29tXCIsIGZvcm1EYXRhKTtcbiAgfTtcbiAgc2VsZi5kZXN0cm95Um9vbSA9IGZ1bmN0aW9uKHJvb21JbmZvKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuZGVzdHJveVJvb206ICcsIHJvb21JbmZvKTtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwiZGVzdHJveVJvb21cIiwgcm9vbUluZm8pO1xuICB9O1xuXG5cblxuLy8gQ0hBVFxuICBzZWxmLmNoYXQgPSBmdW5jdGlvbihjaGF0KSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuY2hhdDogJywgY2hhdCk7XG5cdFx0c2VsZi5zb2NrZXQuZW1pdChcImNoYXRcIiwgY2hhdCk7XG5cdH07XG4gIHNlbGYuZ2V0TW9yZUNoYXRzID0gZnVuY3Rpb24oY2hhdFJlcSkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoJ2dldE1vcmVDaGF0cycsIGNoYXRSZXEpO1xuICB9O1xuXG5cbi8vIERJUkVDVCBNRVNTQUdFXG4gIHNlbGYuaW5pdERpcmVjdE1lc3NhZ2UgPSBmdW5jdGlvbihyZWNpcGllbnQpIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KCdpbml0RGlyZWN0TWVzc2FnZScsIHJlY2lwaWVudCk7XG4gIH07XG4gIHNlbGYuZGlyZWN0TWVzc2FnZSA9IGZ1bmN0aW9uKGRpcmVjdE1lc3NhZ2UpIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KCdkaXJlY3RNZXNzYWdlJywgZGlyZWN0TWVzc2FnZSk7XG4gIH07XG4gIHNlbGYuZ2V0TW9yZURpcmVjdE1lc3NhZ2VzID0gZnVuY3Rpb24oZGlyZWN0TWVzc2FnZVJlcSkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoJ2dldE1vcmVEaXJlY3RNZXNzYWdlcycsIGRpcmVjdE1lc3NhZ2VSZXEpO1xuICB9O1xuICBcblxuLy8gVFlQSU5HXG5cdHNlbGYuYWRkQ2hhdFR5cGluZyA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgbWVzc2FnZSA9IGRhdGEudXNlcm5hbWUgKyAnIGlzIHR5cGluZyc7XG4gICAgJCgnLnR5cGV0eXBldHlwZScpLnRleHQobWVzc2FnZSk7XG5cdH07XG5cdHNlbGYucmVtb3ZlQ2hhdFR5cGluZyA9IGZ1bmN0aW9uKCkge1xuICAgICQoJy50eXBldHlwZXR5cGUnKS5lbXB0eSgpO1xuXHR9O1xuICBzZWxmLnVwZGF0ZVR5cGluZyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChzZWxmLnNvY2tldCkge1xuICAgICAgaWYgKCF0eXBpbmcpIHtcbiAgICAgICAgdHlwaW5nID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5zb2NrZXQuZW1pdCgndHlwaW5nJyk7XG4gICAgICB9XG4gICAgICBsYXN0VHlwaW5nVGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHlwaW5nVGltZXIgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgICB2YXIgdGltZURpZmYgPSB0eXBpbmdUaW1lciAtIGxhc3RUeXBpbmdUaW1lO1xuICAgICAgICBpZiAodGltZURpZmYgPj0gVFlQSU5HX1RJTUVSX0xFTkdUSCAmJiB0eXBpbmcpIHtcbiAgICAgICAgICAgc2VsZi5zb2NrZXQuZW1pdCgnc3RvcCB0eXBpbmcnKTtcbiAgICAgICAgICAgdHlwaW5nID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0sIFRZUElOR19USU1FUl9MRU5HVEgpO1xuICAgIH1cbiAgfTtcblxuXG4vLyBJTlZJVEFUSU9OU1xuICBzZWxmLmludml0ZVVzZXIgPSBmdW5jdGlvbihpbnZpdGF0aW9uT2JqKSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcImludml0ZVVzZXJcIiwgaW52aXRhdGlvbk9iaik7XG4gIH07XG4gIHNlbGYuZGVsZXRlSW52aXRhdGlvbiA9IGZ1bmN0aW9uKHJvb21JZCkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJkZWxldGVJbnZpdGF0aW9uXCIsIHJvb21JZCk7XG4gIH07XG4gIHNlbGYuYWNjZXB0SW52aXRhdGlvbiA9IGZ1bmN0aW9uKHJvb21JZCkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJhY2NlcHRJbnZpdGF0aW9uXCIsIHJvb21JZCk7XG4gIH07XG5cbi8vIFVQREFURSBVU0VSXG4gIHNlbGYudXBkYXRlVXNlciA9IGZ1bmN0aW9uKHVzZXJPYmopIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwidXBkYXRlVXNlclwiLCB1c2VyT2JqKTtcbiAgfTtcblxuXG5cbi8vIEVSUk9SIEhBTkRMSU5HXG4gIHNlbGYuZG9lc0NoYXRyb29tRXhpc3QgPSBmdW5jdGlvbihjaGF0cm9vbVF1ZXJ5KSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdCgnZG9lc0NoYXRyb29tRXhpc3QnLCBjaGF0cm9vbVF1ZXJ5KTtcbiAgfTtcbiAgc2VsZi5kb2VzSG9tZVJvb21FeGlzdCA9IGZ1bmN0aW9uKGhvbWVSb29tUXVlcnkpIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KCdkb2VzSG9tZVJvb21FeGlzdCcsIGhvbWVSb29tUXVlcnkpO1xuICB9O1xuXG5cbiAgXG5cblxuXG5cbiAgLy8vLy8vLy8vLy8vLy8gY2hhdHNlcnZlciBsaXN0ZW5lcnMvLy8vLy8vLy8vLy8vXG5cbiAgLy8gdGhlc2UgZ3V5cyBsaXN0ZW4gdG8gdGhlIGNoYXRzZXJ2ZXIvc29ja2V0IGFuZCBlbWl0IGRhdGEgdG8gbWFpbi5qcyxcbiAgLy8gc3BlY2lmaWNhbGx5IHRvIHRoZSBhcHBFdmVudEJ1cy5cblx0c2VsZi5zZXRSZXNwb25zZUxpc3RlbmVycyA9IGZ1bmN0aW9uKHNvY2tldCkge1xuXG5cbi8vIExPR0lOXG4gICAgc29ja2V0Lm9uKCdsb2dpbicsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLmxvZ2luJyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcignbG9naW5Vc2VyJywgdXNlcik7XG4gICAgICBzZWxmLmNvbm5lY3RUb1Jvb20odXNlci5ob21lUm9vbSk7XG4gICAgfSk7XG5cblxuLy8gQ0hBVFxuXHRcdHNvY2tldC5vbigndXNlckpvaW5lZCcsIGZ1bmN0aW9uKHVzZXIpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdzYy5lLnVzZXJKb2luZWQ6ICcsIHVzZXIpO1xuICAgICAgLy8gc29ja2V0LmVtaXQoXCJvbmxpbmVVc2Vyc1wiKTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwidXNlckpvaW5lZFwiLCB1c2VyKTtcblx0XHR9KTtcblx0XHRzb2NrZXQub24oJ3VzZXJMZWZ0JywgZnVuY3Rpb24odXNlcikge1xuXHRcdFx0Y29uc29sZS5sb2coJ3NjLmUudXNlckxlZnQ6ICcsIHVzZXIpO1xuICAgICAgLy8gc29ja2V0LmVtaXQoXCJvbmxpbmVVc2Vyc1wiKTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwidXNlckxlZnRcIiwgdXNlcik7XG5cdFx0fSk7XG5cdFx0c29ja2V0Lm9uKCdjaGF0JywgZnVuY3Rpb24oY2hhdCkge1xuXHRcdFx0Y29uc29sZS5sb2coJ3NjLmUuY2hhdDogJywgY2hhdCk7XG5cdFx0XHRzZWxmLnZlbnQudHJpZ2dlcihcImNoYXRSZWNlaXZlZFwiLCBjaGF0KTtcblx0XHR9KTtcbiAgICBzb2NrZXQub24oJ21vcmVDaGF0cycsIGZ1bmN0aW9uKGNoYXRzKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcIm1vcmVDaGF0c1wiLCBjaGF0cyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdub01vcmVDaGF0cycsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJub01vcmVDaGF0c1wiKTtcbiAgICB9KTtcblxuXG4vLyBESVJFQ1QgTUVTU0FHRVxuICAgIHNvY2tldC5vbignc2V0RGlyZWN0TWVzc2FnZUNoYXRsb2cnLCBmdW5jdGlvbihjaGF0bG9nKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldERNY2hhdGxvZ1wiLCBjaGF0bG9nKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ3NldERpcmVjdE1lc3NhZ2VIZWFkZXInLCBmdW5jdGlvbihoZWFkZXIpIHtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0RE1oZWFkZXJcIiwgaGVhZGVyKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ2RpcmVjdE1lc3NhZ2UnLCBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAvLyBzZWxmLnZlbnQudHJpZ2dlcihcInJlbmRlckRpcmVjdE1lc3NhZ2VcIiwgRE0pO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJkaXJlY3RNZXNzYWdlUmVjZWl2ZWRcIiwgbWVzc2FnZSk7XG4gICAgfSk7XG5cblxuXG4vLyBUWVBJTkdcbiAgICBzb2NrZXQub24oJ3R5cGluZycsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHNlbGYuYWRkQ2hhdFR5cGluZyhkYXRhKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ3N0b3AgdHlwaW5nJywgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnJlbW92ZUNoYXRUeXBpbmcoKTtcbiAgICB9KTtcblxuXG4vLyBTRVQgUk9PTVxuICAgIHNvY2tldC5vbignY2hhdGxvZycsIGZ1bmN0aW9uKGNoYXRsb2cpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLmNoYXRsb2c6ICcsIGNoYXRsb2cpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRDaGF0bG9nXCIsIGNoYXRsb2cpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbignY2hhdHJvb21zJywgZnVuY3Rpb24oY2hhdHJvb21zKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5jaGF0cm9vbXM6ICAnLCBjaGF0cm9vbXMpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRDaGF0cm9vbXNcIiwgY2hhdHJvb21zKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ3ByaXZhdGVSb29tcycsIGZ1bmN0aW9uKHJvb21zKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5wcml2YXRlUm9vbXM6ICAnLCByb29tcyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldFByaXZhdGVSb29tc1wiLCByb29tcyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdvbmxpbmVVc2VycycsIGZ1bmN0aW9uKG9ubGluZVVzZXJzKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5vbmxpbmVVc2VyczogJywgb25saW5lVXNlcnMpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRPbmxpbmVVc2Vyc1wiLCBvbmxpbmVVc2Vycyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdvZmZsaW5lVXNlcnMnLCBmdW5jdGlvbihvZmZsaW5lVXNlcnMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLm9mZmxpbmVVc2VyczogJywgb2ZmbGluZVVzZXJzKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0T2ZmbGluZVVzZXJzXCIsIG9mZmxpbmVVc2Vycyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdjaGF0cm9vbUhlYWRlcicsIGZ1bmN0aW9uKGhlYWRlck9iaikge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUuY2hhdHJvb21IZWFkZXI6ICcsIGhlYWRlck9iaik7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldENoYXRyb29tSGVhZGVyXCIsIGhlYWRlck9iaik7XG4gICAgfSk7XG5cblxuLy8gUkVESVJFQ1QgVE8gSE9NRSBST09NXG4gICAgc29ja2V0Lm9uKCdyZWRpcmVjdFRvSG9tZVJvb20nLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5yZWRpcmVjdFRvSG9tZVJvb206ICcsIGRhdGEpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJyZWRpcmVjdFRvSG9tZVJvb21cIiwgZGF0YSk7XG4gICAgfSk7XG5cbi8vIFJPT00gQVZBSUxBQklMSVRZXG4gICAgc29ja2V0Lm9uKCdjaGF0cm9vbUF2YWlsYWJpbGl0eScsIGZ1bmN0aW9uKGF2YWlsYWJpbHR5KSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcignY2hhdHJvb21BdmFpbGFiaWxpdHknLCBhdmFpbGFiaWx0eSk7XG4gICAgfSk7XG5cbiAgICBzb2NrZXQub24oJ2hvbWVSb29tQXZhaWxhYmlsaXR5JywgZnVuY3Rpb24oYXZhaWxhYmlsdHkpIHtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKCdob21lUm9vbUF2YWlsYWJpbGl0eScsIGF2YWlsYWJpbHR5KTtcbiAgICB9KTtcblxuXG4vLyBFUlJPUiBIQU5ETElOR1xuICAgIHNvY2tldC5vbignY2hhdHJvb21BbHJlYWR5RXhpc3RzJywgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcImNoYXRyb29tQWxyZWFkeUV4aXN0c1wiKTtcbiAgICB9KTtcblxuICAgIHNvY2tldC5vbignZGVzdHJveVJvb21SZXNwb25zZScsIGZ1bmN0aW9uKHJlcykge1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJkZXN0cm95Um9vbVJlc3BvbnNlXCIsIHJlcyk7XG4gICAgfSk7XG5cbi8vIElOVklUQVRJT05TXG4gICAgc29ja2V0Lm9uKCdyZWZyZXNoSW52aXRhdGlvbnMnLCBmdW5jdGlvbihpbnZpdGF0aW9ucykge1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJyZWZyZXNoSW52aXRhdGlvbnNcIiwgaW52aXRhdGlvbnMpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbigndXNlckludml0ZWQnLCBmdW5jdGlvbih1c2VyKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInVzZXJJbnZpdGVkXCIsIHVzZXIpO1xuICAgIH0pO1xuXG5cblx0fTtcbn07IiwiXG5cbmFwcC5NYWluQ29udHJvbGxlciA9IGZ1bmN0aW9uKCkge1xuXG5cdHZhciBzZWxmID0gdGhpcztcblxuXG4gIC8vVGhlc2UgYWxsb3dzIHVzIHRvIGJpbmQgYW5kIHRyaWdnZXIgb24gdGhlIG9iamVjdCBmcm9tIGFueXdoZXJlIGluIHRoZSBhcHAuXG5cdHNlbGYuYXBwRXZlbnRCdXMgPSBfLmV4dGVuZCh7fSwgQmFja2JvbmUuRXZlbnRzKTtcblx0c2VsZi52aWV3RXZlbnRCdXMgPSBfLmV4dGVuZCh7fSwgQmFja2JvbmUuRXZlbnRzKTtcblxuXHRzZWxmLmluaXQgPSBmdW5jdGlvbigpIHtcblxuICAgIC8vIGxvZ2luTW9kZWxcbiAgICBzZWxmLmxvZ2luTW9kZWwgPSBuZXcgYXBwLkxvZ2luTW9kZWwoKTtcbiAgICBzZWxmLmxvZ2luVmlldyA9IG5ldyBhcHAuTG9naW5WaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cywgbW9kZWw6IHNlbGYubG9naW5Nb2RlbH0pO1xuICAgIHNlbGYucmVnaXN0ZXJWaWV3ID0gbmV3IGFwcC5SZWdpc3RlclZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzIH0pO1xuICAgIHNlbGYubmF2YmFyVmlldyA9IG5ldyBhcHAuTmF2YmFyVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXN9KTtcblxuXG4gICAgLy8gVGhlIENvbnRhaW5lck1vZGVsIGdldHMgcGFzc2VkIGEgdmlld1N0YXRlLCBMb2dpblZpZXcsIHdoaWNoXG4gICAgLy8gaXMgdGhlIGxvZ2luIHBhZ2UuIFRoYXQgTG9naW5WaWV3IGdldHMgcGFzc2VkIHRoZSB2aWV3RXZlbnRCdXNcbiAgICAvLyBhbmQgdGhlIExvZ2luTW9kZWwuXG4gICAgc2VsZi5jb250YWluZXJNb2RlbCA9IG5ldyBhcHAuQ29udGFpbmVyTW9kZWwoeyB2aWV3U3RhdGU6IHNlbGYubG9naW5WaWV3fSk7XG5cbiAgICAvLyBuZXh0LCBhIG5ldyBDb250YWluZXJWaWV3IGlzIGludGlhbGl6ZWQgd2l0aCB0aGUgbmV3bHkgY3JlYXRlZCBjb250YWluZXJNb2RlbFxuICAgIC8vIHRoZSBsb2dpbiBwYWdlIGlzIHRoZW4gcmVuZGVyZWQuXG4gICAgc2VsZi5jb250YWluZXJWaWV3ID0gbmV3IGFwcC5Db250YWluZXJWaWV3KHsgbW9kZWw6IHNlbGYuY29udGFpbmVyTW9kZWwgfSk7XG4gICAgc2VsZi5jb250YWluZXJWaWV3LnJlbmRlcigpO1xuXG4gXG4gICAgJCgnZm9ybScpLmtleXByZXNzKGZ1bmN0aW9uKGUpIHtcbiAgICAgIHJldHVybiBlLmtleUNvZGUgIT0gMTM7XG4gICAgfSk7XG5cblxuICB9O1xuXG5cbiAgc2VsZi5hdXRoZW50aWNhdGVkID0gZnVuY3Rpb24oKSB7XG5cbiAgICBjb25zb2xlLmxvZygnZi5tYWluLmF1dGhlbnRpY2F0ZWQnKTtcbiAgICAgICBcbiAgICAkKFwiYm9keVwiKS5jc3MoXCJvdmVyZmxvd1wiLCBcImhpZGRlblwiKTtcbiAgICAkKCdmb3JtJykua2V5cHJlc3MoZnVuY3Rpb24oZSkge1xuICAgICAgcmV0dXJuIGUua2V5Q29kZSAhPSAxMztcbiAgICB9KTtcblxuICAgIGRlYnVnZ2VyO1xuICAgIHNlbGYuY2hhdENsaWVudCA9IG5ldyBDaGF0Q2xpZW50KHsgdmVudDogc2VsZi5hcHBFdmVudEJ1cyB9KTtcbiAgICAgICAgICBjb25zb2xlLmxvZygnaHVoJyk7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmNvbm5lY3QoKTtcblxuICAgIC8vIG5ldyBtb2RlbCBhbmQgdmlldyBjcmVhdGVkIGZvciBjaGF0cm9vbVxuICAgIHNlbGYuY2hhdHJvb21Nb2RlbCA9IG5ldyBhcHAuQ2hhdHJvb21Nb2RlbCh7IG5hbWU6ICdQYXJsb3InIH0pO1xuICAgIHNlbGYuY2hhdHJvb21MaXN0ID0gbmV3IGFwcC5DaGF0cm9vbUxpc3QoKTtcbiAgICBzZWxmLnByaXZhdGVSb29tQ29sbGVjdGlvbiA9IG5ldyBhcHAuUHJpdmF0ZVJvb21Db2xsZWN0aW9uKCk7XG4gICAgc2VsZi5jaGF0cm9vbUxpc3QuZmV0Y2goKS5kb25lKGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnY2hhdHJvb21zJywgc2VsZi5jaGF0cm9vbUxpc3QpO1xuICAgICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgncHJpdmF0ZVJvb21zJywgc2VsZi5wcml2YXRlUm9vbUNvbGxlY3Rpb24pO1xuICAgICAgc2VsZi5jaGF0cm9vbVZpZXcgID0gbmV3IGFwcC5DaGF0cm9vbVZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzLCBtb2RlbDogc2VsZi5jaGF0cm9vbU1vZGVsIH0pO1xuICAgICAgc2VsZi5jb250YWluZXJNb2RlbC5zZXQoJ3ZpZXdTdGF0ZScsIHNlbGYuY2hhdHJvb21WaWV3KTtcbiAgICAgIFxuXG4gICAgICAvLyBzZWxmLmNvbm5lY3RUb1Jvb20oKTtcbiAgICAgIC8vIHNlbGYuaW5pdFJvb20oKTtcbiAgICAgICAgICAgLy8gO1xuICAgIH0pO1xuXG4gIH07XG5cbiAgLy8gc2VsZi5jb25uZWN0VG9Sb29tID0gZnVuY3Rpb24oKSB7XG4gIC8vICAgY29uc29sZS5sb2coJ2YubWFpbi5jb25uZWN0VG9Sb29tJyk7XG4gIC8vICAgc2VsZi5jaGF0Q2xpZW50LmNvbm5lY3RUb1Jvb20oXCJQYXJsb3JcIik7XG4gIC8vIH07XG5cbiAgLy8gc2VsZi5pbml0Um9vbSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIC8vICAgc2VsZi5jaGF0cm9vbVZpZXcuaW5pdFJvb20oKTtcbiAgLy8gfTtcblxuXG5cblxuXG4gIC8vLy8vLy8vLy8vLyAgQnVzc2VzIC8vLy8vLy8vLy8vL1xuICAgIC8vIFRoZXNlIEJ1c3NlcyBsaXN0ZW4gdG8gdGhlIHNvY2tldGNsaWVudFxuICAgLy8gICAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblxuICAvLy8vIHZpZXdFdmVudEJ1cyBMaXN0ZW5lcnMgLy8vLy9cbiAgXG5cdHNlbGYudmlld0V2ZW50QnVzLm9uKFwibG9naW5cIiwgZnVuY3Rpb24odXNlcikge1xuICAgIHNlbGYuY2hhdENsaWVudC5sb2dpbih1c2VyKTtcbiAgfSk7XG5cdHNlbGYudmlld0V2ZW50QnVzLm9uKFwiY2hhdFwiLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmNoYXQoY2hhdCk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcInR5cGluZ1wiLCBmdW5jdGlvbigpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQudXBkYXRlVHlwaW5nKCk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImpvaW5Sb29tXCIsIGZ1bmN0aW9uKHJvb20pIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuam9pblJvb20ocm9vbSk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImFkZFJvb21cIiwgZnVuY3Rpb24ocm9vbSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5hZGRSb29tKHJvb20pO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJyZW1vdmVSb29tXCIsIGZ1bmN0aW9uKHJvb21EYXRhKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LnJlbW92ZVJvb20ocm9vbURhdGEpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJjcmVhdGVSb29tXCIsIGZ1bmN0aW9uKGZvcm1EYXRhKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmNyZWF0ZVJvb20oZm9ybURhdGEpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJ1cGRhdGVSb29tXCIsIGZ1bmN0aW9uKGZvcm1EYXRhKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LnVwZGF0ZVJvb20oZm9ybURhdGEpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJkZXN0cm95Um9vbVwiLCBmdW5jdGlvbihyb29tSW5mbykge1xuICAgIHNlbGYuY2hhdENsaWVudC5kZXN0cm95Um9vbShyb29tSW5mbyk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImdldE1vcmVDaGF0c1wiLCBmdW5jdGlvbihjaGF0UmVxKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmdldE1vcmVDaGF0cyhjaGF0UmVxKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiZG9lc0NoYXRyb29tRXhpc3RcIiwgZnVuY3Rpb24oY2hhdHJvb21RdWVyeSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5kb2VzQ2hhdHJvb21FeGlzdChjaGF0cm9vbVF1ZXJ5KTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiZG9lc0hvbWVSb29tRXhpc3RcIiwgZnVuY3Rpb24oY2hhdHJvb21RdWVyeSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5kb2VzSG9tZVJvb21FeGlzdChjaGF0cm9vbVF1ZXJ5KTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiaW5pdERpcmVjdE1lc3NhZ2VcIiwgZnVuY3Rpb24ocmVjaXBpZW50KSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmluaXREaXJlY3RNZXNzYWdlKHJlY2lwaWVudCk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImRpcmVjdE1lc3NhZ2VcIiwgZnVuY3Rpb24oZGlyZWN0TWVzc2FnZSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5kaXJlY3RNZXNzYWdlKGRpcmVjdE1lc3NhZ2UpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJnZXRNb3JlRGlyZWN0TWVzc2FnZXNcIiwgZnVuY3Rpb24oZGlyZWN0TWVzc2FnZVJlcSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5nZXRNb3JlRGlyZWN0TWVzc2FnZXMoZGlyZWN0TWVzc2FnZVJlcSk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImludml0ZVVzZXJcIiwgZnVuY3Rpb24oaW52aXRhdGlvbk9iaikge1xuICAgIHNlbGYuY2hhdENsaWVudC5pbnZpdGVVc2VyKGludml0YXRpb25PYmopO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJkZWxldGVJbnZpdGF0aW9uXCIsIGZ1bmN0aW9uKHJvb21JZCkge1xuICAgIHNlbGYuY2hhdENsaWVudC5kZWxldGVJbnZpdGF0aW9uKHJvb21JZCk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImFjY2VwdEludml0YXRpb25cIiwgZnVuY3Rpb24ocm9vbUlkKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmFjY2VwdEludml0YXRpb24ocm9vbUlkKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwidXBkYXRlVXNlclwiLCBmdW5jdGlvbih1c2VyT2JqKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LnVwZGF0ZVVzZXIodXNlck9iaik7XG4gIH0pO1xuXG5cblxuXG5cblxuICAvLy8vIGFwcEV2ZW50QnVzIExpc3RlbmVycyAvLy8vXG5cblx0Ly8gc2VsZi5hcHBFdmVudEJ1cy5vbihcInVzZXJzSW5mb1wiLCBmdW5jdGlvbihkYXRhKSB7XG4gLy8gICAgY29uc29sZS5sb2coJ21haW4uZS51c2Vyc0luZm86ICcsIGRhdGEpO1xuIC8vICAgIC8vZGF0YSBpcyBhbiBhcnJheSBvZiB1c2VybmFtZXMsIGluY2x1ZGluZyB0aGUgbmV3IHVzZXJcblx0Ly8gXHQvLyBUaGlzIG1ldGhvZCBnZXRzIHRoZSBvbmxpbmUgdXNlcnMgY29sbGVjdGlvbiBmcm9tIGNoYXRyb29tTW9kZWwuXG5cdC8vIFx0Ly8gb25saW5lVXNlcnMgaXMgdGhlIGNvbGxlY3Rpb25cblx0Ly8gXHR2YXIgb25saW5lVXNlcnMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KFwib25saW5lVXNlcnNcIik7XG4gLy8gICAgY29uc29sZS5sb2coXCIuLi5vbmxpbmVVc2VyczogXCIsIG9ubGluZVVzZXJzKTtcblx0Ly8gXHR2YXIgdXNlcnMgPSBfLm1hcChkYXRhLCBmdW5jdGlvbihpdGVtKSB7XG5cdC8vIFx0XHRyZXR1cm4gbmV3IGFwcC5Vc2VyTW9kZWwoe3VzZXJuYW1lOiBpdGVtfSk7XG5cdC8vIFx0fSk7XG4gLy8gICAgY29uc29sZS5sb2coXCJ1c2VyczogXCIsIHVzZXJzKTtcblx0Ly8gXHRvbmxpbmVVc2Vycy5yZXNldCh1c2Vycyk7XG5cdC8vIH0pO1xuXG4gLy8gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJyb29tSW5mb1wiLCBmdW5jdGlvbihkYXRhKSB7XG4gLy8gICAgZGVidWdnZXI7XG4gLy8gICAgY29uc29sZS5sb2coJ21haW4uZS5yb29tSW5mbzogJywgZGF0YSk7XG4gLy8gICAgdmFyIHJvb21zID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldChcImNoYXRyb29tc1wiKTtcbiAvLyAgICAgY29uc29sZS5sb2coXCIuLi5yb29tczogXCIsIHJvb21zKTtcbiAvLyAgICB2YXIgdXBkYXRlZFJvb21zID0gXy5tYXAoZGF0YSwgZnVuY3Rpb24ocm9vbSkge1xuIC8vICAgICAgdmFyIG5ld0NoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoe25hbWU6IHJvb219KTtcbiAvLyAgICAgIHJldHVybiBuZXdDaGF0cm9vbU1vZGVsO1xuIC8vICAgIH0pO1xuIC8vICAgIGNvbnNvbGUubG9nKFwiLi4udXBkYXRlZHJvb21zOiBcIiwgdXBkYXRlZFJvb21zKTtcbiAvLyAgICByb29tcy5yZXNldCh1cGRhdGVkUm9vbXMpO1xuIC8vICB9KTtcblxuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcImxvZ2luVXNlclwiLCBmdW5jdGlvbih1c2VyKSB7XG4gICAgY29uc29sZS5sb2coJ21haW4uZS5sb2dpblVzZXI6ICcsIHVzZXIpO1xuICAgIGludml0YXRpb25zID0gc2VsZi5uYXZiYXJWaWV3Lm1vZGVsLmdldCgnaW52aXRhdGlvbnMnKTtcbiAgICBuZXdJbnZpdGF0aW9ucyA9IF8ubWFwKHVzZXIuaW52aXRhdGlvbnMsIGZ1bmN0aW9uKGludml0ZSkge1xuICAgICAgIHZhciBuZXdJbnZpdGF0aW9uID0gbmV3IGFwcC5JbnZpdGF0aW9uTW9kZWwoaW52aXRlKTtcbiAgICAgICByZXR1cm4gbmV3SW52aXRhdGlvbjtcbiAgICB9KTtcbiAgICBpbnZpdGF0aW9ucy5yZXNldChuZXdJbnZpdGF0aW9ucyk7XG4gICAgc2VsZi5uYXZiYXJWaWV3Lm1vZGVsLnNldCh7ICd1c2VybmFtZSc6IHVzZXIudXNlcm5hbWUsICdob21lUm9vbSc6IHVzZXIuaG9tZVJvb20sICd1c2VySW1hZ2UnOiB1c2VyLnVzZXJJbWFnZSB9KTtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInJlZnJlc2hJbnZpdGF0aW9uc1wiLCBmdW5jdGlvbihpbnZpdGF0aW9ucykge1xuICAgIGNvbnNvbGUubG9nKCdtYWluLmUucmVmcmVzaEludml0YXRpb25zOiAnLCBpbnZpdGF0aW9ucyk7XG4gICAgb2xkSW52aXRhdGlvbnMgPSBzZWxmLm5hdmJhclZpZXcubW9kZWwuZ2V0KCdpbnZpdGF0aW9ucycpO1xuICAgIG5ld0ludml0YXRpb25zID0gXy5tYXAoaW52aXRhdGlvbnMsIGZ1bmN0aW9uKGludml0ZSkge1xuICAgICAgIHZhciBuZXdJbnZpdGF0aW9uID0gbmV3IGFwcC5JbnZpdGF0aW9uTW9kZWwoaW52aXRlKTtcbiAgICAgICByZXR1cm4gbmV3SW52aXRhdGlvbjtcbiAgICB9KTtcbiAgICBvbGRJbnZpdGF0aW9ucy5yZXNldChuZXdJbnZpdGF0aW9ucyk7XG4gIH0pO1xuXG5cbiAgLy8gc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldFJvb21cIiwgZnVuY3Rpb24obW9kZWwpIHtcbiAgLy8gICBjb25zb2xlLmxvZygnbWFpbi5lLnNldFJvb206ICcsIG1vZGVsKTtcblxuICAvLyAgIHZhciBjaGF0bG9nID0gbmV3IGFwcC5DaGF0Q29sbGVjdGlvbihtb2RlbC5jaGF0bG9nKTtcbiAgLy8gICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdjaGF0bG9nJywgY2hhdGxvZyk7XG5cbiAgLy8gICB2YXIgcm9vbXMgPSBuZXcgYXBwLkNoYXRyb29tTGlzdChtb2RlbC5jaGF0cm9vbXMpO1xuICAvLyAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zZXQoJ2NoYXRyb29tcycsIHJvb21zKTtcblxuICAvLyAgIHZhciB1c2VycyA9IG5ldyBhcHAuVXNlckNvbGxlY3Rpb24obW9kZWwub25saW5lVXNlcnMpO1xuICAvLyAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zZXQoJ29ubGluZVVzZXJzJywgdXNlcnMpO1xuXG4gIC8vIH0pO1xuXG5cblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwiQ2hhdHJvb21Nb2RlbFwiLCBmdW5jdGlvbihtb2RlbCkge1xuICAgIGNvbnNvbGUubG9nKCdtYWluLmUuQ2hhdHJvb21Nb2RlbDogJywgbW9kZWwpO1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbCA9IG5ldyBhcHAuQ2hhdHJvb21Nb2RlbCgpO1xuICAgIHNlbGYuY2hhdHJvb21MaXN0ID0gbmV3IGFwcC5DaGF0cm9vbUxpc3QoKTtcbiAgICBzZWxmLmNoYXRyb29tVmlldyAgPSBuZXcgYXBwLkNoYXRyb29tVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXMsIG1vZGVsOiBzZWxmLmNoYXRyb29tTW9kZWwsIGNvbGxlY3Rpb246IHNlbGYuY2hhdHJvb21MaXN0fSk7XG4gICAgc2VsZi5jb250YWluZXJNb2RlbC5zZXQoJ3ZpZXdTdGF0ZScsIHNlbGYuY2hhdHJvb21WaWV3KTtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwubG9hZE1vZGVsKG1vZGVsKTtcbiAgfSk7XG5cblxuXG4gIC8vIGFkZHMgbmV3IHVzZXIgdG8gdXNlcnMgY29sbGVjdGlvbiwgc2VuZHMgZGVmYXVsdCBqb2luaW5nIG1lc3NhZ2Vcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcInVzZXJKb2luZWRcIiwgZnVuY3Rpb24odXNlcikge1xuICAgICAgICBjb25zb2xlLmxvZygnbWFpbi5lLnVzZXJKb2luZWQ6ICcsIHVzZXIpO1xuXHRcdHNlbGYuY2hhdHJvb21Nb2RlbC5hZGRVc2VyKHVzZXIpO1xuXHRcdHNlbGYuY2hhdHJvb21Nb2RlbC5hZGRDaGF0KHtzZW5kZXI6IFwiQnV0dGVyc1wiLCBtZXNzYWdlOiB1c2VyLnVzZXJuYW1lICsgXCIgam9pbmVkIHJvb20uXCIgfSk7XG5cdH0pO1xuXG5cdC8vIHJlbW92ZXMgdXNlciBmcm9tIHVzZXJzIGNvbGxlY3Rpb24sIHNlbmRzIGRlZmF1bHQgbGVhdmluZyBtZXNzYWdlXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2VyTGVmdFwiLCBmdW5jdGlvbih1c2VyKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdtYWluLmUudXNlckxlZnQ6ICcsIHVzZXIpO1xuXHRcdHNlbGYuY2hhdHJvb21Nb2RlbC5yZW1vdmVVc2VyKHVzZXIpO1xuXHRcdHNlbGYuY2hhdHJvb21Nb2RlbC5hZGRDaGF0KHtzZW5kZXI6IFwiQnV0dGVyc1wiLCBtZXNzYWdlOiB1c2VyLnVzZXJuYW1lICsgXCIgbGVmdCByb29tLlwiIH0pO1xuXHR9KTtcblxuXHQvLyBjaGF0IHBhc3NlZCBmcm9tIHNvY2tldGNsaWVudCwgYWRkcyBhIG5ldyBjaGF0IG1lc3NhZ2UgdXNpbmcgY2hhdHJvb21Nb2RlbCBtZXRob2Rcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcImNoYXRSZWNlaXZlZFwiLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLmFkZENoYXQoY2hhdCk7XG5cdFx0JCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG5cdH0pO1xuXG5cblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJyZWRpcmVjdFRvSG9tZVJvb21cIiwgZnVuY3Rpb24oZGF0YSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5jb25uZWN0VG9Sb29tKGRhdGEuaG9tZVJvb20pO1xuICB9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0Q2hhdHJvb21IZWFkZXJcIiwgZnVuY3Rpb24oaGVhZGVyT2JqKSB7XG4gICAgdmFyIG5ld0hlYWRlciA9IG5ldyBhcHAuQ2hhdHJvb21IZWFkZXJNb2RlbChoZWFkZXJPYmopO1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zZXQoJ2NoYXRyb29tJywgbmV3SGVhZGVyKTtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldENoYXRsb2dcIiwgZnVuY3Rpb24oY2hhdGxvZykge1xuICAgIHZhciBvbGRDaGF0bG9nID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldCgnY2hhdGxvZycpO1xuICAgIHZhciB1cGRhdGVkQ2hhdGxvZyA9IF8ubWFwKGNoYXRsb2csIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICAgIHZhciBuZXdDaGF0TW9kZWwgPSBuZXcgYXBwLkNoYXRNb2RlbCh7IHJvb206IGNoYXQucm9vbSwgbWVzc2FnZTogY2hhdC5tZXNzYWdlLCBzZW5kZXI6IGNoYXQuc2VuZGVyLCB0aW1lc3RhbXA6IGNoYXQudGltZXN0YW1wLCB1cmw6IGNoYXQudXJsIH0pO1xuICAgICAgcmV0dXJuIG5ld0NoYXRNb2RlbDtcbiAgICB9KTtcbiAgICBvbGRDaGF0bG9nLnJlc2V0KHVwZGF0ZWRDaGF0bG9nKTtcbiAgICQoJyNtZXNzYWdlLWlucHV0JykucmVtb3ZlQ2xhc3MoJ2RpcmVjdC1tZXNzYWdlLWlucHV0JykuYWRkQ2xhc3MoJ21lc3NhZ2UtaW5wdXQnKTtcbiAgICAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcIm1vcmVDaGF0c1wiLCBmdW5jdGlvbihjaGF0bG9nKSB7XG4gICAgdmFyIG9sZENoYXRsb2cgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KCdjaGF0bG9nJyk7XG4gICAgdmFyIG1vcmVDaGF0bG9nID0gXy5tYXAoY2hhdGxvZywgZnVuY3Rpb24oY2hhdCkge1xuICAgICAgdmFyIG5ld0NoYXRNb2RlbCA9IG5ldyBhcHAuQ2hhdE1vZGVsKHsgcm9vbTogY2hhdC5yb29tLCBtZXNzYWdlOiBjaGF0Lm1lc3NhZ2UsIHNlbmRlcjogY2hhdC5zZW5kZXIsIHRpbWVzdGFtcDogY2hhdC50aW1lc3RhbXAsIHVybDogY2hhdC51cmwgfSk7XG4gICAgICByZXR1cm4gbmV3Q2hhdE1vZGVsO1xuICAgIH0pO1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC50cmlnZ2VyKCdtb3JlQ2hhdHMnLCBtb3JlQ2hhdGxvZyk7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJub01vcmVDaGF0c1wiLCBmdW5jdGlvbihjaGF0bG9nKSB7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLnN0b3BMaXN0ZW5pbmcoJ21vcmVDaGF0cycpO1xuICB9KTtcbiAgXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRDaGF0cm9vbXNcIiwgZnVuY3Rpb24ocm9vbXMpIHtcbiAgICB2YXIgb2xkUm9vbXMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KCdjaGF0cm9vbXMnKTtcbiAgICB2YXIgbmV3Um9vbXMgPSBfLm1hcChyb29tcywgZnVuY3Rpb24ocm9vbSkge1xuICAgICAgdmFyIG5ld0NoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoeyBpZDogcm9vbS5faWQsIG5hbWU6IHJvb20ubmFtZSwgb3duZXI6IHJvb20ub3duZXIsIHJvb21JbWFnZTogcm9vbS5yb29tSW1hZ2UsIHByaXZhY3k6IHJvb20ucHJpdmFjeX0pO1xuICAgICAgcmV0dXJuIG5ld0NoYXRyb29tTW9kZWw7XG4gICAgfSk7XG4gICAgb2xkUm9vbXMucmVzZXQobmV3Um9vbXMpO1xuICB9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0UHJpdmF0ZVJvb21zXCIsIGZ1bmN0aW9uKHJvb21zKSB7XG4gICAgdmFyIG9sZFJvb21zID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldCgncHJpdmF0ZVJvb21zJyk7XG4gICAgdmFyIG5ld1Jvb21zID0gXy5tYXAocm9vbXMsIGZ1bmN0aW9uKHJvb20pIHtcbiAgICAgIHZhciBuZXdDaGF0cm9vbU1vZGVsID0gbmV3IGFwcC5DaGF0cm9vbU1vZGVsKHsgaWQ6IHJvb20uX2lkLCBuYW1lOiByb29tLm5hbWUsIG93bmVyOiByb29tLm93bmVyLCByb29tSW1hZ2U6IHJvb20ucm9vbUltYWdlLCBwcml2YWN5OiByb29tLnByaXZhY3ksIGN1cnJlbnRVc2VyOiByb29tLmN1cnJlbnRVc2VyfSk7XG4gICAgICByZXR1cm4gbmV3Q2hhdHJvb21Nb2RlbDtcbiAgICB9KTtcbiAgICBvbGRSb29tcy5yZXNldChuZXdSb29tcyk7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRPbmxpbmVVc2Vyc1wiLCBmdW5jdGlvbihvbmxpbmVVc2Vycykge1xuICAgIHZhciBvbGRPbmxpbmVVc2VycyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoJ29ubGluZVVzZXJzJyk7XG4gICAgdmFyIHVwZGF0ZWRPbmxpbmVVc2VycyA9IF8ubWFwKG9ubGluZVVzZXJzLCBmdW5jdGlvbih1c2VyKSB7XG4gICAgICB2YXIgbmV3VXNlck1vZGVsID0gbmV3IGFwcC5Vc2VyTW9kZWwoe3VzZXJuYW1lOiB1c2VyLnVzZXJuYW1lLCB1c2VySW1hZ2U6IHVzZXIudXNlckltYWdlfSk7XG4gICAgICByZXR1cm4gbmV3VXNlck1vZGVsO1xuICAgIH0pO1xuICAgIG9sZE9ubGluZVVzZXJzLnJlc2V0KHVwZGF0ZWRPbmxpbmVVc2Vycyk7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRPZmZsaW5lVXNlcnNcIiwgZnVuY3Rpb24ob2ZmbGluZVVzZXJzKSB7XG4gICAgdmFyIG9sZE9mZmxpbmVVc2VycyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoJ29mZmxpbmVVc2VycycpO1xuICAgIHZhciB1cGRhdGVkT2ZmbGluZVVzZXJzID0gXy5tYXAob2ZmbGluZVVzZXJzLCBmdW5jdGlvbih1c2VyKSB7XG4gICAgICB2YXIgbmV3VXNlck1vZGVsID0gbmV3IGFwcC5Vc2VyTW9kZWwoe3VzZXJuYW1lOiB1c2VyLnVzZXJuYW1lLCB1c2VySW1hZ2U6IHVzZXIudXNlckltYWdlfSk7XG4gICAgICByZXR1cm4gbmV3VXNlck1vZGVsO1xuICAgIH0pO1xuICAgIG9sZE9mZmxpbmVVc2Vycy5yZXNldCh1cGRhdGVkT2ZmbGluZVVzZXJzKTtcbiAgfSk7XG5cblxuLy8gY2hhdHJvb20gYXZhaWxhYmlsaXR5XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcImNoYXRyb29tQXZhaWxhYmlsaXR5XCIsIGZ1bmN0aW9uKGF2YWlsYWJpbGl0eSkge1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC50cmlnZ2VyKCdjaGF0cm9vbUF2YWlsYWJpbGl0eScsIGF2YWlsYWJpbGl0eSk7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJob21lUm9vbUF2YWlsYWJpbGl0eVwiLCBmdW5jdGlvbihhdmFpbGFiaWxpdHkpIHtcbiAgICBzZWxmLm5hdmJhclZpZXcudHJpZ2dlcignaG9tZVJvb21BdmFpbGFiaWxpdHknLCBhdmFpbGFiaWxpdHkpO1xuICB9KTtcblxuXG4vLyBlcnJvcnNcblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJjaGF0cm9vbUFscmVhZHlFeGlzdHNcIiwgZnVuY3Rpb24oKSB7XG4gICAgc3dhbCh7XG4gICAgICB0aXRsZTogXCJPSCBOTyBPSCBOTyBPSCBOT1wiLFxuICAgICAgdGV4dDogXCJDaGF0cm9vbSBBbHJlYWR5LCBJdCBBbHJlYWR5IEV4aXN0cyEgQW5kLiBEb24ndCBHbyBJbiBUaGVyZS4gRG9uJ3QuIFlvdS4gWW91IFNob3VsZCBIYXZlLiBJIFRocmV3IFVwIE9uIFRoZSBTZXJ2ZXIuIFRob3NlIFBvb3IgLiAuIC4gVGhleSBXZXJlIEp1c3QhIE9IIE5PIFdIWS4gV0hZIE9IIE5PLiBPSCBOTy5cIixcbiAgICAgIHR5cGU6IFwiZXJyb3JcIixcbiAgICAgIGNvbmZpcm1CdXR0b25Db2xvcjogXCIjNzQ5Q0E4XCJcbiAgICB9KTtcbiAgfSk7XG5cblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJkZXN0cm95Um9vbVJlc3BvbnNlXCIsIGZ1bmN0aW9uKHJlcykge1xuICAgIGlmIChyZXMuZXJyb3IpIHtcbiAgICAgIHN3YWwoe1xuICAgICAgICB0aXRsZTogXCJObyBUb3VjaHkhXCIsXG4gICAgICAgIHRleHQ6IFwiWW91IENhbid0IERlbGV0ZSBZb3VyIEhvbWUgUm9vbSwgTnVoIFVoLiBXaG8gYXJlIHlvdSwgRnJhbnogUmVpY2hlbHQ/XCIsXG4gICAgICAgIHR5cGU6IFwiZXJyb3JcIixcbiAgICAgICAgY29uZmlybUJ1dHRvbkNvbG9yOiBcIiM3NDlDQThcIixcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAocmVzLnN1Y2Nlc3MpIHtcbiAgICAgIHN3YWwoe1xuICAgICAgICB0aXRsZTogXCJFdmlzY2VyYXRlZCFcIixcbiAgICAgICAgdGV4dDogXCJZb3VyIGNoYXRyb29tIGhhcyBiZWVuIHB1cmdlZC5cIixcbiAgICAgICAgdHlwZTogXCJzdWNjZXNzXCIsXG4gICAgICAgIGNvbmZpcm1CdXR0b25Db2xvcjogXCIjNzQ5Q0E4XCIsXG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIERpcmVjdE1lc3NhZ2VcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0RE1jaGF0bG9nXCIsIGZ1bmN0aW9uKGNoYXRsb2cpIHtcbiAgICB2YXIgb2xkQ2hhdGxvZyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoJ2NoYXRsb2cnKTtcbiAgICB2YXIgdXBkYXRlZENoYXRsb2cgPSBfLm1hcChjaGF0bG9nLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgICB2YXIgbmV3Q2hhdE1vZGVsID0gbmV3IGFwcC5DaGF0TW9kZWwoeyByb29tOiBjaGF0LnJvb20sIG1lc3NhZ2U6IGNoYXQubWVzc2FnZSwgc2VuZGVyOiBjaGF0LnNlbmRlciwgdGltZXN0YW1wOiBjaGF0LnRpbWVzdGFtcCwgdXJsOiBjaGF0LnVybCB9KTtcbiAgICAgIHJldHVybiBuZXdDaGF0TW9kZWw7XG4gICAgfSk7XG4gICAgb2xkQ2hhdGxvZy5yZXNldCh1cGRhdGVkQ2hhdGxvZyk7XG5cbiAgICAkKCcjbWVzc2FnZS1pbnB1dCcpLnJlbW92ZUNsYXNzKCdtZXNzYWdlLWlucHV0JykuYWRkQ2xhc3MoJ2RpcmVjdC1tZXNzYWdlLWlucHV0Jyk7XG4gICAgJCgnI2NoYXRJbWFnZVVwbG9hZENvbnRhaW5lcicpLmRhdGEoJ2NoYXQtdHlwZScsICdtZXNzYWdlJyk7XG4gICAgJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRETWhlYWRlclwiLCBmdW5jdGlvbihoZWFkZXIpIHtcbiAgICB2YXIgbmV3SGVhZGVyID0gbmV3IGFwcC5DaGF0cm9vbUhlYWRlck1vZGVsKGhlYWRlcik7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnY2hhdHJvb20nLCBuZXdIZWFkZXIpO1xuICB9KTtcblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJkaXJlY3RNZXNzYWdlUmVjZWl2ZWRcIiwgZnVuY3Rpb24obWVzc2FnZSkge1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5hZGRDaGF0KG1lc3NhZ2UpO1xuICAgICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuICB9KTtcblxuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInVzZXJJbnZpdGVkXCIsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICBjb25zb2xlLmxvZygnbWFpbi5lLnVzZXJJbnZpdGVkOiAnLCB1c2VyKTtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwudHJpZ2dlcigndXNlckludml0ZWQnLCB1c2VyKTtcbiAgfSk7XG5cblxuXG5cblxuXG5cblxuXG59O1xuIiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICAvLyAkKHdpbmRvdykuYmluZCgnYmVmb3JldW5sb2FkJywgZnVuY3Rpb24oZXZlbnRPYmplY3QpIHtcbiAgLy8gICAkLmFqYXgoe1xuICAvLyAgICAgIHVybDogXCIvbG9nb3V0XCIsXG4gIC8vICAgfSk7XG4gIC8vIH0pO1xuXG4gIHZhciBDaGF0cm9vbVJvdXRlciA9IEJhY2tib25lLlJvdXRlci5leHRlbmQoe1xuICAgIFxuICAgIHJvdXRlczoge1xuICAgICAgJyc6ICdzdGFydCcsXG4gICAgICAnbG9nJzogJ2xvZ2luJyxcbiAgICAgICdyZWcnOiAncmVnaXN0ZXInLFxuICAgICAgJ291dCc6ICdvdXQnLFxuICAgICAgJ2F1dGhlbnRpY2F0ZWQnOiAnYXV0aGVudGljYXRlZCcsXG4gICAgICAnZmFjZWJvb2snOiAnZmFjZWJvb2snLFxuICAgICAgJ3R3aXR0ZXInOiAndHdpdHRlcidcbiAgICB9LFxuXG4gICAgc3RhcnQ6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICcvIyc7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIgPSBuZXcgYXBwLk1haW5Db250cm9sbGVyKCk7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIuaW5pdCgpO1xuICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9IFxuICAgICAgLy8gZWxzZSB7XG4gICAgICAvLyAgICQuYWpheCh7XG4gICAgICAvLyAgICAgdXJsOiBcIi9sb2dvdXRcIixcbiAgICAgIC8vICAgfSk7XG4gICAgICAvLyB9XG4gICAgfSxcblxuXG4gICAgbG9naW46IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGxvZ2luTW9kZWwgPSBuZXcgYXBwLkxvZ2luTW9kZWwoKTtcbiAgICAgIHZhciBsb2dpblZpZXcgPSBuZXcgYXBwLkxvZ2luVmlldyh7dmVudDogYXBwLm1haW5Db250cm9sbGVyLnZpZXdFdmVudEJ1cywgbW9kZWw6IGxvZ2luTW9kZWx9KTtcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlci5jb250YWluZXJNb2RlbC5zZXQoXCJ2aWV3U3RhdGVcIiwgbG9naW5WaWV3KTtcbiAgICB9LFxuXG4gICAgcmVnaXN0ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHJlZ2lzdGVyVmlldyA9IG5ldyBhcHAuUmVnaXN0ZXJWaWV3KHt2ZW50OiBhcHAubWFpbkNvbnRyb2xsZXIudmlld0V2ZW50QnVzIH0pO1xuICAgICAgYXBwLm1haW5Db250cm9sbGVyLmNvbnRhaW5lck1vZGVsLnNldChcInZpZXdTdGF0ZVwiLCByZWdpc3RlclZpZXcpO1xuICAgIH0sXG5cbiAgICAvLyBvdXQ6IGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgIC8vICAgICAkLmFqYXgoe1xuICAgIC8vICAgICAgIHVybDogXCIvbG9nb3V0XCIsXG4gICAgLy8gICAgIH0pXG4gICAgLy8gfSxcblxuICAgIGF1dGhlbnRpY2F0ZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCFhcHAubWFpbkNvbnRyb2xsZXIpIHtcbiAgICAgICAgdGhpcy5zdGFydCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXBwLm1haW5Db250cm9sbGVyLmF1dGhlbnRpY2F0ZWQoKTtcbiAgICAgIH1cbiAgICAgICAgXG4gICAgfSxcbiAgICBmYWNlYm9vazogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnN0YXJ0KHRoaXMuYXV0aGVudGljYXRlZCk7XG4gICAgfSxcbiAgICB0d2l0dGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuc3RhcnQodGhpcy5hdXRoZW50aWNhdGVkKTtcbiAgICB9LFxuXG4gIH0pO1xuXG4gIGFwcC5DaGF0cm9vbVJvdXRlciA9IG5ldyBDaGF0cm9vbVJvdXRlcigpO1xuICBCYWNrYm9uZS5oaXN0b3J5LnN0YXJ0KCk7XG5cbn0pKCk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9