
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
    'click .destroy-this-particular-chatroom': 'destroyThisParticularRoom',
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
    var roomName = this.model.get('chatroom').get('name');
    var this_ = this;
    var confirmation = swal({
      title: "Do you wish to destroy " + roomName + "?",
      text: "This kills the room.",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DEB0B0",
      confirmButtonText: "Muahaha!",
      closeOnConfirm: false,
      html: false
    }, function(){
      var roomId = this_.model.get('chatroom').id;
      var userInRoom = true;
      this_.vent.trigger('destroyRoom', { id: roomId, roomName: roomName, userInRoom: userInRoom });
    });
  },
  destroyThisParticularRoom: function(e) {
    e.preventDefault();
    var roomName = $(e.target).data("room-name");
    var this_ = this;
    var confirmation = swal({
      title: "Do you wish to destroy " + roomName + "?",
      text: "This kills the room.",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DEB0B0",
      confirmButtonText: "Muahaha!",
      closeOnConfirm: false,
      html: false
    }, function(){
      var currentRoomId = this_.model.get('chatroom').id;
      var roomId = $(e.target).data("room-id");
      var userInRoom = currentRoomId === roomId;
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
      var currentRoomId = this_.model.get('chatroom').id;
      var roomId = $(e.target).data("room-id");
      var roomName = $(e.target).data("room-name");
      var userInRoom = currentRoomId === roomId;
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
  joinRoom: function(obj) {
    console.log('crv.f.joinRoom');
     // $('#chatImageUploadContainer').data('chat-type', 'chat');
    this.currentDate = '';
    this.previousDate = '';
    this.vent.trigger('joinRoom', obj.name);
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
      this.joinRoom({id: $tar.data('room-id'), name: $tar.data('room')});
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
           else if (data._id) {
            app.ChatroomRouter.navigate('auth', { trigger: true });
            this_.vent.trigger("login", data);
           }
           else {
            console.log('oops, the else: ', data);
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
      'click .fa-power-off': 'logout',
    },

    logout: function() {
      this.vent.trigger('logout');
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

  //must be https on heroku and http on localhost
	self.hostname = 'http://' + window.location.host;

  // connects to socket, sets response listeners
	self.connect = function() {
    console.log('sc.f.connect');
		// this io might be a little confusing... where is it coming from?
		// it's coming from the static middleware on server.js bc everything
		// in the /public folder has been attached to the server, and visa
		// versa.


    // local
		self.socket = io.connect(self.hostname);

    // heroku
    // self.socket = io.connect('http://www.chjat.com/', { transports: ['websocket'] } );

    self.setResponseListeners(self.socket);
  };



///// ViewEventBus methods ////
    // methods that emit to the chatserver

// LOGIN
  self.login = function(user) {
    console.log('sc.f.login: ', user);
    self.socket.emit("login", user);
  };
  self.logout = function() {
    console.log('sc.f.logout: ');
    self.socket.emit("logout");
  };


// ROOM
  self.connectToRoom = function(roomName) {
    console.log('sc.f.connectToRoom: ', roomName);
    self.socket.emit("connectToRoom", roomName);
  };
  self.joinRoom = function(roomName) {
    self.socket.emit('joinRoom', roomName);
  };
  self.addRoom = function(roomName) {
    console.log('sc.f.addRoom: ', roomName);
    self.socket.emit("addRoom", roomName);
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
    socket.on('initUser', function(user) {
      console.log('sc.e.initUser');
      self.vent.trigger('initUser', user);
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


        socket.on('logout', function() {
      self.logout();
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
  self.viewEventBus.on("joinRoom", function(roomName) {
    self.chatClient.joinRoom(roomName);
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
  self.viewEventBus.on("logout", function() {
    self.chatClient.logout();
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



  self.appEventBus.on("initUser", function(user) {
    console.log('main.e.initUser: ', user);
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
      'auth': 'authenticated',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYXQuanMiLCJjaGF0cm9vbS1oZWFkZXIuanMiLCJjb250YWluZXIuanMiLCJsb2dpbi5qcyIsInVzZXIuanMiLCJjaGF0cm9vbS5qcyIsImludml0YXRpb24uanMiLCJyb29tLmpzIiwicHJpdmF0ZVJvb20uanMiLCJjaGF0SW1hZ2VVcGxvYWQuanMiLCJjaGF0cm9vbVNldHRpbmdzLmpzIiwiY3JlYXRlQ2hhdHJvb20uanMiLCJuYXZiYXIuanMiLCJyZWdpc3Rlci5qcyIsInNvY2tldGNsaWVudC5qcyIsIm1haW4uanMiLCJyb3V0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FKUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUlUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBRlJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FHVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FKekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBS2xrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FSL0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FTZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBUnJJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FTbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDelNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5DaGF0Q29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcbiAgICBtb2RlbDogYXBwLkNoYXRNb2RlbFxuICB9KTtcblxufSkoKTsiLCJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLkNoYXRyb29tSGVhZGVyTW9kZWwgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoe30pO1xuXG59KSgpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5Db250YWluZXJWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIGVsOiAnI3ZpZXctY29udGFpbmVyJyxcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLm1vZGVsLm9uKFwiY2hhbmdlOnZpZXdTdGF0ZVwiLCB0aGlzLnJlbmRlciwgdGhpcyk7XG4gICAgfSxcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHZpZXcgPSB0aGlzLm1vZGVsLmdldCgndmlld1N0YXRlJyk7XG4gICAgICB0aGlzLiRlbC5odG1sKHZpZXcucmVuZGVyKCkuZWwpO1xuICAgIH1cbiAgfSk7XG5cbn0pKGpRdWVyeSk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbiAgYXBwLkxvZ2luVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjbG9naW4nKS5odG1sKCkpLFxuICAgIGVycm9yVGVtcGxhdGU6IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJsb2dpbi1lcnJvclwiPjwlPSBtZXNzYWdlICU+PC9kaXY+JyksXG4gICAgZXZlbnRzOiB7XG4gICAgICAnc3VibWl0JzogJ29uTG9naW4nLFxuICAgICAgJ2tleXByZXNzJzogJ29uSGl0RW50ZXInXG4gICAgfSxcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgLy8gTG9naW5WaWV3IGdldHMgcGFzc2VkIHRoZSB2aWV3RXZlbnRCdXMgd2hlbiB0aGUgTWFpbkNvbnRyb2xsZXIgaXMgaW5pdGlhbGl6ZWRcbiAgICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcblxuICAgIC8vIFRoaXMgdGVsbHMgdGhlIHZpZXcgdG8gbGlzdGVuIHRvIGFuIGV2ZW50IG9uIGl0cyBtb2RlbCxcbiAgICAvLyBpZiB0aGVyZSdzIGFuIGVycm9yLCB0aGUgY2FsbGJhY2sgKHRoaXMucmVuZGVyKSBpcyBjYWxsZWQgd2l0aCB0aGUgIFxuICAgIC8vIHZpZXcgYXMgY29udGV4dFxuICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImNoYW5nZTplcnJvclwiLCB0aGlzLnJlbmRlciwgdGhpcyk7XG4gICAgfSxcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKHRoaXMubW9kZWwudG9KU09OKCkpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgb25Mb2dpbjogZnVuY3Rpb24oZSkge1xuICAgICAgLy8gdHJpZ2dlcnMgdGhlIGxvZ2luIGV2ZW50IGFuZCBwYXNzaW5nIHRoZSB1c2VybmFtZSBkYXRhIHRvIGpzL21haW4uanNcbiAgICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB2YXIgc2VuZERhdGEgPSB7dXNlcm5hbWU6IHRoaXMuJCgnI3VzZXJuYW1lJykudmFsKCksIHBhc3N3b3JkOiB0aGlzLiQoJyNwYXNzd29yZCcpLnZhbCgpfTtcbiAgICAkLmFqYXgoe1xuICAgICAgICB1cmw6IFwiL2xvZ2luXCIsXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBkYXRhOiBzZW5kRGF0YSxcbiAgICAgICAgc3VjY2VzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICBjb25zb2xlLmxvZygnc3VjY2VzcyBkYXRhOiAnLCBkYXRhKTtcbiAgICAgICAgICAgaWYgKGRhdGEubWVzc2FnZSkge1xuICAgICAgICAgICAgIHRoaXNfLnJlbmRlclZhbGlkYXRpb24odGhpc18uZXJyb3JUZW1wbGF0ZShkYXRhKSk7XG4gICAgICAgICAgIH1cbiAgICAgICAgICAgZWxzZSBpZiAoZGF0YS5faWQpIHtcbiAgICAgICAgICAgIGFwcC5DaGF0cm9vbVJvdXRlci5uYXZpZ2F0ZSgnYXV0aCcsIHsgdHJpZ2dlcjogdHJ1ZSB9KTtcbiAgICAgICAgICAgIHRoaXNfLnZlbnQudHJpZ2dlcihcImxvZ2luXCIsIGRhdGEpO1xuICAgICAgICAgICB9XG4gICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ29vcHMsIHRoZSBlbHNlOiAnLCBkYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdkb25lZWVlZWVlZScpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgcmVuZGVyVmFsaWRhdGlvbjogZnVuY3Rpb24od2hhdCkge1xuICAgICAgJCgnLmxvZ2luLWVycm9yLWNvbnRhaW5lcicpLmVtcHR5KCk7XG4gICAgICAkKHdoYXQpLmFwcGVuZFRvKCQoJy5sb2dpbi1lcnJvci1jb250YWluZXInKSkuaGlkZSgpLmZhZGVJbigpO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnLmxvZ2luLWVycm9yLWNvbnRhaW5lcicpLmNoaWxkcmVuKCkuZmlyc3QoKS5mYWRlT3V0KCk7XG4gICAgICB9LCAyMDAwKTtcblxuICAgIH1cbiAgICAvLyBvbkhpdEVudGVyOiBmdW5jdGlvbihlKSB7XG4gICAgLy8gICBpZihlLmtleUNvZGUgPT0gMTMpIHtcbiAgICAvLyAgICAgdGhpcy5vbkxvZ2luKCk7XG4gICAgLy8gICAgIHJldHVybiBmYWxzZTtcbiAgICAvLyAgIH1cbiAgICAvLyB9XG4gIH0pO1xuICBcbn0pKGpRdWVyeSk7IiwiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5Vc2VyQ29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHttb2RlbDogYXBwLlVzZXJNb2RlbH0pO1xuXG59KSgpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG5hcHAuQ2hhdHJvb21WaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjY2hhdHJvb20tdGVtcGxhdGUnKS5odG1sKCkpLFxuICBjaGF0VGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2NoYXRib3gtbWVzc2FnZS10ZW1wbGF0ZScpLmh0bWwoKSksXG4gIHJvb21UZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKFwiI3Jvb20tbGlzdC10ZW1wbGF0ZVwiKS5odG1sKCkpLFxuICBoZWFkZXJUZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjY2hhdHJvb20taGVhZGVyLXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgZGlyZWN0TWVzc2FnZUhlYWRlclRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNkaXJlY3QtbWVzc2FnZS1oZWFkZXItdGVtcGxhdGUnKS5odG1sKCkpLFxuICBvbmxpbmVVc2VyVGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI29ubGluZS11c2Vycy1saXN0LXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgb2ZmbGluZVVzZXJUZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjb2ZmbGluZS11c2Vycy1saXN0LXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgZGF0ZVRlbXBsYXRlOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwiZm9sbG93V3JhcFwiPjxkaXYgY2xhc3M9XCJmb2xsb3dNZUJhclwiPjxzcGFuPiA8JT0gbW9tZW50KHRpbWVzdGFtcCkuZm9ybWF0KFwiTU1NTSBEb1wiKSAlPiA8L3NwYW4+PC9kaXY+PC9kaXY+JyksXG4gIGV2ZW50czoge1xuICAgICdrZXlwcmVzcyAubWVzc2FnZS1pbnB1dCc6ICdtZXNzYWdlSW5wdXRQcmVzc2VkJyxcbiAgICAna2V5cHJlc3MgLmRpcmVjdC1tZXNzYWdlLWlucHV0JzogJ2RpcmVjdE1lc3NhZ2VJbnB1dFByZXNzZWQnLFxuICAgICdjbGljayAuY2hhdC1kaXJlY3RvcnkgLnJvb20nOiAnc2V0Um9vbScsXG4gICAgJ2tleXByZXNzICNjaGF0LXNlYXJjaC1pbnB1dCc6ICdzZWFyY2gnLFxuICAgICdjbGljayAucmVtb3ZlLWNoYXRyb29tJzogJ3JlbW92ZVJvb20nLFxuICAgICdjbGljayAuZGVzdHJveS1jaGF0cm9vbSc6ICdkZXN0cm95Um9vbScsXG4gICAgJ2NsaWNrIC5kZXN0cm95LXRoaXMtcGFydGljdWxhci1jaGF0cm9vbSc6ICdkZXN0cm95VGhpc1BhcnRpY3VsYXJSb29tJyxcbiAgICAna2V5dXAgI2NoYXRyb29tLW5hbWUtaW5wdXQnOiAnZG9lc0NoYXRyb29tRXhpc3QnLFxuICAgICdjbGljayAudXNlcic6ICdpbml0RGlyZWN0TWVzc2FnZScsXG4gIH0sXG5cblxuICBkb2VzQ2hhdHJvb21FeGlzdDogZnVuY3Rpb24oZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgIHZhciBjaGVjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCQudHJpbSgkKCcjY2hhdHJvb20tbmFtZS1pbnB1dCcpLnZhbCgpKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBjaGF0cm9vbU5hbWUgPSAkKCcjY2hhdHJvb20tbmFtZS1pbnB1dCcpLnZhbCgpO1xuICAgICAgICAgdGhpc18udmVudC50cmlnZ2VyKCdkb2VzQ2hhdHJvb21FeGlzdCcsIGNoYXRyb29tTmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgdGhpc18uJCgnI2NoYXRyb29tLW5hbWUtdmFsaWRhdGlvbi1jb250YWluZXInKS5jaGlsZHJlbigpLnJlbW92ZSgpO1xuICAgICAgICAgdGhpc18uJCgnI2NoYXRyb29tLW5hbWUtaW5wdXQnKS5yZW1vdmVDbGFzcygnaW5wdXQtdmFsaWQgaW5wdXQtaW52YWxpZCcpO1xuICAgICAgfVxuICAgIH07XG4gICAgXy5kZWJvdW5jZShjaGVjaygpLCAxNTApO1xuICB9LFxuXG4gIHJlbmRlckNoYXRyb29tQXZhaWxhYmlsaXR5OiBmdW5jdGlvbihhdmFpbGFiaWxpdHkpIHtcbiAgICB0aGlzLmNyZWF0ZUNoYXRyb29tVmlldy50cmlnZ2VyKCdjaGF0cm9vbUF2YWlsYWJpbGl0eScsIGF2YWlsYWJpbGl0eSk7XG4gIH0sXG5cblxuXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICBjb25zb2xlLmxvZygnY2hhdHJvb21WaWV3LmYuaW5pdGlhbGl6ZTogJywgb3B0aW9ucyk7XG4gICAgLy8gcGFzc2VkIHRoZSB2aWV3RXZlbnRCdXNcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xuICB9LFxuICByZW5kZXI6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlcicpO1xuICAgIHRoaXMubW9kZWwgPSBtb2RlbCB8fCB0aGlzLm1vZGVsO1xuICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzLm1vZGVsLnRvSlNPTigpKSk7XG4gICAgdGhpcy5hZnRlclJlbmRlcigpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBhZnRlclJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zZXRTdWJWaWV3cygpO1xuICAgIHRoaXMuc2V0Q2hhdExpc3RlbmVycygpO1xuICAgIHRoaXMuY2hhdHJvb21TZWFyY2hUeXBlYWhlYWQoKTtcbiAgfSxcbiAgc2V0U3ViVmlld3M6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY2hhdEltYWdlVXBsb2FkVmlldyA9IG5ldyBhcHAuQ2hhdEltYWdlVXBsb2FkVmlldygpO1xuICAgIHRoaXMuY2hhdEltYWdlVXBsb2FkVmlldy5zZXRFbGVtZW50KHRoaXMuJCgnI2NoYXRJbWFnZVVwbG9hZENvbnRhaW5lcicpKTtcbiAgICB0aGlzLmNyZWF0ZUNoYXRyb29tVmlldyA9IG5ldyBhcHAuQ3JlYXRlQ2hhdHJvb21WaWV3KHt2ZW50OiB0aGlzLnZlbnR9KTtcbiAgICB0aGlzLmNyZWF0ZUNoYXRyb29tVmlldy5zZXRFbGVtZW50KHRoaXMuJCgnI2NyZWF0ZUNoYXRyb29tQ29udGFpbmVyJykpO1xuICB9LFxuICBzZXRDaGF0TGlzdGVuZXJzOiBmdW5jdGlvbigpIHtcblxuICAgIHZhciBvbmxpbmVVc2VycyA9IHRoaXMubW9kZWwuZ2V0KCdvbmxpbmVVc2VycycpO1xuICAgIHRoaXMubGlzdGVuVG8ob25saW5lVXNlcnMsIFwiYWRkXCIsIHRoaXMucmVuZGVyVXNlciwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJyZW1vdmVcIiwgdGhpcy5yZW5kZXJVc2VycywgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJyZXNldFwiLCB0aGlzLnJlbmRlclVzZXJzLCB0aGlzKTtcblxuICAgIHZhciBvZmZsaW5lVXNlcnMgPSB0aGlzLm1vZGVsLmdldCgnb2ZmbGluZVVzZXJzJyk7XG4gICAgdGhpcy5saXN0ZW5UbyhvZmZsaW5lVXNlcnMsIFwiYWRkXCIsIHRoaXMucmVuZGVyT2ZmbGluZVVzZXIsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8ob2ZmbGluZVVzZXJzLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlck9mZmxpbmVVc2VycywgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhvZmZsaW5lVXNlcnMsIFwicmVzZXRcIiwgdGhpcy5yZW5kZXJPZmZsaW5lVXNlcnMsIHRoaXMpO1xuXG4gICAgdmFyIGNoYXRsb2cgPSB0aGlzLm1vZGVsLmdldCgnY2hhdGxvZycpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdGxvZywgXCJhZGRcIiwgdGhpcy5yZW5kZXJDaGF0LCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRsb2csIFwicmVtb3ZlXCIsIHRoaXMucmVuZGVyQ2hhdHMsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdGxvZywgXCJyZXNldFwiLCB0aGlzLnJlbmRlckNoYXRzLCB0aGlzKTtcblxuICAgIHZhciBjaGF0cm9vbXMgPSB0aGlzLm1vZGVsLmdldCgnY2hhdHJvb21zJyk7XG4gICAgdGhpcy5saXN0ZW5UbyhjaGF0cm9vbXMsIFwiYWRkXCIsIHRoaXMucmVuZGVyUm9vbSwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhjaGF0cm9vbXMsIFwicmVtb3ZlXCIsIHRoaXMucmVuZGVyUm9vbXMsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcInJlc2V0XCIsIHRoaXMucmVuZGVyUm9vbXMsIHRoaXMpO1xuXG4gICAgdmFyIHByaXZhdGVSb29tcyA9IHRoaXMubW9kZWwuZ2V0KCdwcml2YXRlUm9vbXMnKTtcbiAgICB0aGlzLmxpc3RlblRvKHByaXZhdGVSb29tcywgXCJhZGRcIiwgdGhpcy5yZW5kZXJQcml2YXRlUm9vbSwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5Ubyhwcml2YXRlUm9vbXMsIFwicmVtb3ZlXCIsIHRoaXMucmVuZGVyUHJpdmF0ZVJvb21zLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKHByaXZhdGVSb29tcywgXCJyZXNldFwiLCB0aGlzLnJlbmRlclByaXZhdGVSb29tcywgdGhpcyk7XG5cbiAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiY2hhbmdlOmNoYXRyb29tXCIsIHRoaXMucmVuZGVySGVhZGVyLCB0aGlzKTtcblxuICAgIHRoaXMubGlzdGVuVG8odGhpcy5jaGF0SW1hZ2VVcGxvYWRWaWV3LCAnY2hhdC1pbWFnZS11cGxvYWRlZCcsIHRoaXMuY2hhdFVwbG9hZEltYWdlKTtcbiAgICB0aGlzLmxpc3RlblRvKHRoaXMuY2hhdEltYWdlVXBsb2FkVmlldywgJ21lc3NhZ2UtaW1hZ2UtdXBsb2FkZWQnLCB0aGlzLm1lc3NhZ2VVcGxvYWRJbWFnZSk7XG4gICAgLy8gdGhpcy5saXN0ZW5Ubyh0aGlzLmNyZWF0ZUNoYXRyb29tVmlldywgJ2NyZWF0ZVJvb20nLCB0aGlzLmNyZWF0ZVJvb20pO1xuXG4gICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcIm1vcmVDaGF0c1wiLCB0aGlzLnJlbmRlck1vcmVDaGF0cywgdGhpcyk7XG5cbiAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwidXNlckludml0ZWRcIiwgdGhpcy51c2VySW52aXRlZCwgdGhpcyk7XG5cbiAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiY2hhdHJvb21BdmFpbGFiaWxpdHlcIiwgdGhpcy5yZW5kZXJDaGF0cm9vbUF2YWlsYWJpbGl0eSwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImhvbWVSb29tQXZhaWxhYmlsaXR5XCIsIHRoaXMucmVuZGVySG9tZVJvb21BdmFpbGFiaWxpdHksIHRoaXMpO1xuXG4gICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICB0aGlzLiQoJyNjaGF0Ym94LWNvbnRlbnQnKS5zY3JvbGwoZnVuY3Rpb24oKXtcbiAgICAgICAgLy8gY2hlY2tzIGlmIHRoZXJlJ3MgZW5vdWdoIGNoYXRzIHRvIHdhcnJhbnQgYSBnZXRNb3JlQ2hhdHMgY2FsbFxuICAgICAgaWYgKCQoJyNjaGF0Ym94LWNvbnRlbnQnKS5zY3JvbGxUb3AoKSA9PT0gMCAmJiB0aGlzXy5tb2RlbC5nZXQoJ2NoYXRsb2cnKS5sZW5ndGggPj0gMjUpIHtcbiAgICAgICAgaWYgKHRoaXNfLm1vZGVsLmdldCgnY2hhdHJvb20nKS5nZXQoJ2NoYXRUeXBlJykgPT09ICdtZXNzYWdlJykge1xuICAgICAgICAgIF8uZGVib3VuY2UodGhpc18uZ2V0TW9yZURpcmVjdE1lc3NhZ2VzKCksIDMwMDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIF8uZGVib3VuY2UodGhpc18uZ2V0TW9yZUNoYXRzKCksIDMwMDApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAgICAkKHdpbmRvdykucmVzaXplKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgd2luZG93SGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpO1xuICAgICAgICBpZiAod2luZG93SGVpZ2h0ID4gNTAwKSB7XG4gICAgICAgICAgdmFyIG5ld0hlaWdodCA9IHdpbmRvd0hlaWdodCAtIDI4NTtcbiAgICAgICAgICAkKCcjY2hhdGJveC1jb250ZW50JykuaGVpZ2h0KG5ld0hlaWdodCk7XG4gICAgICAgIH1cblxuICAgICAgIH0pO1xuICB9LFxuXG5cbiAgY2hhdHJvb21TZWFyY2hUeXBlYWhlYWQ6IGZ1bmN0aW9uKCkge1xuICAgIC8vIGludGVyZXN0aW5nIC0gdGhlICd0aGlzJyBtYWtlcyBhIGRpZmZlcmVuY2UsIGNhbid0IGZpbmQgI2NoYXQtc2VhcmNoLWlucHV0IG90aGVyd2lzZVxuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAgIHZhciBibG9vZCA9IG5ldyBCbG9vZGhvdW5kKHtcbiAgICAgICAgZGF0dW1Ub2tlbml6ZXI6IEJsb29kaG91bmQudG9rZW5pemVycy5vYmoud2hpdGVzcGFjZSgnbmFtZScpLFxuICAgICAgICBxdWVyeVRva2VuaXplcjogQmxvb2Rob3VuZC50b2tlbml6ZXJzLndoaXRlc3BhY2UsXG4gICAgICAgIHByZWZldGNoOiB7XG4gICAgICAgICAgdXJsOiAnL2FwaS9wdWJsaWNDaGF0cm9vbXMnLFxuICAgICAgICAgIGZpbHRlcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgIHJldHVybiBfLm1hcChkYXRhLCBmdW5jdGlvbihjaGF0cm9vbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IG5hbWU6IGNoYXRyb29tIH07XG4gICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICB0dGw6IDAsXG4gICAgICAgIH0sXG4gICAgICAgIHJlbW90ZToge1xuICAgICAgICAgIHVybDogJy9hcGkvc2VhcmNoQ2hhdHJvb21zP25hbWU9JVFVRVJZJyxcbiAgICAgICAgICB3aWxkY2FyZDogJyVRVUVSWScsXG4gICAgICAgICAgcmF0ZUxpbWl0V2FpdDogMzAwLFxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGJsb29kLmNsZWFyUHJlZmV0Y2hDYWNoZSgpO1xuICAgICAgYmxvb2QuaW5pdGlhbGl6ZSgpO1xuICAgICAgdmFyIHR5cGUgPSAgdGhpcy4kKCcjY2hhdC1zZWFyY2gtaW5wdXQnKS50eXBlYWhlYWQoe1xuICAgICAgICBtaW5MZW5ndGg6IDIsXG4gICAgICAgIGNsYXNzTmFtZXM6IHtcbiAgICAgICAgICBpbnB1dDogJ3R5cGVhaGVhZC1pbnB1dCcsXG4gICAgICAgICAgaGludDogJ3R5cGVhaGVhZC1oaW50JyxcbiAgICAgICAgICBzZWxlY3RhYmxlOiAndHlwZWFoZWFkLXNlbGVjdGFibGUnLFxuICAgICAgICAgIG1lbnU6ICd0eXBlYWhlYWQtbWVudScsXG4gICAgICAgICAgaGlnaGxpZ2h0OiAndHlwZWFoZWFkLWhpZ2hsaWdodCcsXG4gICAgICAgICAgZGF0YXNldDogJ3R5cGVhaGVhZC1kYXRhc2V0JyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGxpbWl0OiA1LFxuICAgICAgICBzb3VyY2U6IGJsb29kLFxuICAgICAgICBuYW1lOiAnY2hhdHJvb20tc2VhcmNoJyxcbiAgICAgICAgZGlzcGxheTogJ25hbWUnLFxuICAgICAgfSkub24oJ3R5cGVhaGVhZDpzZWxlY3QgdHlwZWFoZWFkOmF1dG9jb21wbGV0ZScsIGZ1bmN0aW9uKG9iaikge1xuXG4gICAgICB9KTtcbiAgfSxcblxuXG5cbi8vIGhlYWRlcnNcblxuICByZW5kZXJIZWFkZXI6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuJCgnI2NoYXRib3gtaGVhZGVyJykuaHRtbCh0aGlzLmhlYWRlclRlbXBsYXRlKHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbScpLnRvSlNPTigpKSk7XG4gICAgdGhpcy5jaGF0cm9vbVNldHRpbmdzVmlldyA9IG5ldyBhcHAuQ2hhdHJvb21TZXR0aW5nc1ZpZXcoe3ZlbnQ6IHRoaXMudmVudCwgbW9kZWw6IHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbScpfSk7XG4gICAgdGhpcy5jaGF0cm9vbVNldHRpbmdzVmlldy5zZXRFbGVtZW50KHRoaXMuJCgnI2NoYXRyb29tLWhlYWRlci1jb250YWluZXInKSk7XG4gICAgdGhpcy5saXN0ZW5Ubyh0aGlzLmNoYXRyb29tU2V0dGluZ3NWaWV3LCAndXBkYXRlUm9vbScsIHRoaXMudXBkYXRlUm9vbSk7XG4gIH0sXG5cbiAgcmVuZGVyRGlyZWN0TWVzc2FnZUhlYWRlcjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy4kKCcjY2hhdGJveC1oZWFkZXInKS5odG1sKHRoaXMuZGlyZWN0TWVzc2FnZUhlYWRlclRlbXBsYXRlKHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbScpLnRvSlNPTigpKSk7XG4gIH0sXG5cbiAgdXNlckludml0ZWQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB0aGlzLmNoYXRyb29tU2V0dGluZ3NWaWV3LnRyaWdnZXIoJ3VzZXJJbnZpdGVkJywgZGF0YSk7XG4gIH0sXG5cblxuXG5cbi8vIHVzZXJzXG5cbiAgcmVuZGVyVXNlcnM6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5yZW5kZXJVc2VycycpO1xuICAgIG9ubGluZVVzZXJzID0gdGhpcy5tb2RlbC5nZXQoXCJvbmxpbmVVc2Vyc1wiKTtcbiAgICBjb25zb2xlLmxvZygnVVNFUlM6ICcsIG9ubGluZVVzZXJzKTtcbiAgICB0aGlzLiQoJy5vbmxpbmUtdXNlcnMnKS5lbXB0eSgpO1xuICAgIHRoaXMubW9kZWwuZ2V0KFwib25saW5lVXNlcnNcIikuZWFjaChmdW5jdGlvbiAodXNlcikge1xuICAgICAgdGhpcy5yZW5kZXJVc2VyKHVzZXIpO1xuICAgIH0sIHRoaXMpO1xuICB9LFxuICByZW5kZXJVc2VyOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHRoaXMuJCgnLm9ubGluZS11c2VycycpLmFwcGVuZCh0aGlzLm9ubGluZVVzZXJUZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICB9LFxuICByZW5kZXJPZmZsaW5lVXNlcnM6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5yZW5kZXJPZmZsaW5lVXNlcnMnKTtcbiAgICBjb25zb2xlLmxvZygnT2ZmbGluZSBVU0VSUzogJywgdGhpcy5tb2RlbC5nZXQoXCJvZmZsaW5lVXNlcnNcIikpO1xuICAgIHRoaXMuJCgnLm9mZmxpbmUtdXNlcnMnKS5lbXB0eSgpO1xuICAgIHRoaXMubW9kZWwuZ2V0KFwib2ZmbGluZVVzZXJzXCIpLmVhY2goZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgIHRoaXMucmVuZGVyT2ZmbGluZVVzZXIodXNlcik7XG4gICAgfSwgdGhpcyk7XG4gIH0sXG4gIHJlbmRlck9mZmxpbmVVc2VyOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHRoaXMuJCgnLm9mZmxpbmUtdXNlcnMnKS5hcHBlbmQodGhpcy5vZmZsaW5lVXNlclRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gIH0sXG5cblxuXG5cblxuLy8gY2hhdGxvZ1xuXG4gIHJlbmRlckNoYXRzOiBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYucmVuZGVyQ2hhdHMnKTtcbiAgICB2YXIgY2hhdGxvZyA9IHRoaXMubW9kZWwuZ2V0KFwiY2hhdGxvZ1wiKTtcbiAgICBjb25zb2xlLmxvZygnQ0hBVExPRzogJywgY2hhdGxvZyk7XG4gICAgdGhpcy4kKCcjY2hhdGJveC1jb250ZW50JykuZW1wdHkoKTtcbiAgICBjaGF0bG9nLmVhY2goZnVuY3Rpb24oY2hhdCkge1xuICAgICAgdGhpcy5yZW5kZXJDaGF0KGNoYXQpO1xuICAgIH0sIHRoaXMpO1xuICAgIGlmICggY2hhdGxvZy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNoYXRsb2cucHVzaChuZXcgYXBwLkNoYXRNb2RlbCh7IHNlbmRlcjogJ0NoamF0JywgbWVzc2FnZTogXCLCr1xcXFxfKOODhClfL8KvXCIsIHRpbWVzdGFtcDogXy5ub3coKSwgdXJsOiAnJ30pKTtcbiAgICB9XG4gICAgdGhpcy5hZnRlckNoYXRzUmVuZGVyKCk7XG4gIH0sXG5cbiAgcmVuZGVyQ2hhdDogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB0aGlzLnJlbmRlckRhdGVEaXZpZGVycyhtb2RlbCk7XG4gICAgdmFyIGNoYXRUZW1wbGF0ZSA9ICQodGhpcy5jaGF0VGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICBjaGF0VGVtcGxhdGUuYXBwZW5kVG8odGhpcy4kKCcjY2hhdGJveC1jb250ZW50JykpLmhpZGUoKS5mYWRlSW4oKS5zbGlkZURvd24oKTtcbiAgICAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcbiAgfSxcblxuICByZW5kZXJEYXRlRGl2aWRlcnM6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdGhpcy5jdXJyZW50RGF0ZSA9IG1vbWVudChtb2RlbC5nZXQoJ3RpbWVzdGFtcCcpKS5mb3JtYXQoJ2RkZGQsIE1NTU0gRG8gWVlZWScpO1xuICAgIGlmICggdGhpcy5jdXJyZW50RGF0ZSAhPT0gdGhpcy5wcmV2aW91c0RhdGUgKSB7XG4gICAgICB2YXIgY3VycmVudERhdGUgPSAkKHRoaXMuZGF0ZVRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gICAgICBjdXJyZW50RGF0ZS5hcHBlbmRUbyh0aGlzLiQoJyNjaGF0Ym94LWNvbnRlbnQnKSkuaGlkZSgpLmZhZGVJbigpLnNsaWRlRG93bigpO1xuICAgICAgdGhpcy5wcmV2aW91c0RhdGUgPSB0aGlzLmN1cnJlbnREYXRlO1xuICAgIH1cbiAgfSxcblxuICBnZXRNb3JlQ2hhdHM6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5nZXRNb3JlQ2hhdHMnKTtcbiAgICB2YXIgY2hhdHJvb20gPSB0aGlzLm1vZGVsLmdldCgnY2hhdHJvb20nKSxcbiAgICBuYW1lID0gY2hhdHJvb20uZ2V0KCduYW1lJyksXG4gICAgbW9kZWxzTG9hZGVkU3VtID0gY2hhdHJvb20uZ2V0KCdtb2RlbHNMb2FkZWRTdW0nKTtcbiAgICB2YXIgY2hhdGxvZ0xlbmd0aCA9IGNoYXRyb29tLmdldCgnY2hhdGxvZ0xlbmd0aCcpO1xuICAgIHRoaXMudmVudC50cmlnZ2VyKCdnZXRNb3JlQ2hhdHMnLCB7IG5hbWU6IG5hbWUsIG1vZGVsc0xvYWRlZFN1bTogbW9kZWxzTG9hZGVkU3VtLCBjaGF0bG9nTGVuZ3RoOiBjaGF0bG9nTGVuZ3RofSk7XG4gICAgY2hhdHJvb20uc2V0KCdtb2RlbHNMb2FkZWRTdW0nLCAobW9kZWxzTG9hZGVkU3VtIC0gMSkpO1xuICB9LFxuXG4gIGdldE1vcmVEaXJlY3RNZXNzYWdlczogZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLmdldE1vcmVEcmllY3RNZXNzYWdlcycpO1xuICAgIHZhciBjaGF0cm9vbSA9IHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbScpLFxuICAgIGlkID0gY2hhdHJvb20uZ2V0KCdpZCcpLFxuICAgIG1vZGVsc0xvYWRlZFN1bSA9IGNoYXRyb29tLmdldCgnbW9kZWxzTG9hZGVkU3VtJyk7XG4gICAgdmFyIGNoYXRsb2dMZW5ndGggPSBjaGF0cm9vbS5nZXQoJ2NoYXRsb2dMZW5ndGgnKTtcbiAgICB0aGlzLnZlbnQudHJpZ2dlcignZ2V0TW9yZURpcmVjdE1lc3NhZ2VzJywgeyBpZDogaWQsIG1vZGVsc0xvYWRlZFN1bTogbW9kZWxzTG9hZGVkU3VtLCBjaGF0bG9nTGVuZ3RoOiBjaGF0bG9nTGVuZ3RofSk7XG4gICAgY2hhdHJvb20uc2V0KCdtb2RlbHNMb2FkZWRTdW0nLCAobW9kZWxzTG9hZGVkU3VtIC0gMSkpO1xuICB9LFxuXG4gIHJlbmRlck1vcmVDaGF0czogZnVuY3Rpb24oY2hhdHMpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYucmVuZGVyTW9yZUNoYXRzJyk7XG4gICAgLy8gdGhpcy4kKCcjY2hhdGJveC1jb250ZW50Jyk7XG4gICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICB2YXIgb3JpZ2luYWxIZWlnaHQgPSAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuICAgIHRoaXMubW9yZUNoYXRDb2xsZWN0aW9uID0gW107XG4gICAgXy5lYWNoKGNoYXRzLCBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgdGhpc18ucmVuZGVyTW9yZURhdGVEaXZpZGVycyhtb2RlbCk7XG4gICAgICB2YXIgY2hhdFRlbXBsYXRlID0gJCh0aGlzLmNoYXRUZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICAgICAgdGhpc18ubW9yZUNoYXRDb2xsZWN0aW9uLnB1c2goY2hhdFRlbXBsYXRlKTtcbiAgICAgIC8vIGNoYXRUZW1wbGF0ZS5wcmVwZW5kVG8odGhpcy4kKCcjY2hhdGJveC1jb250ZW50JykpLmhpZGUoKS5mYWRlSW4oKS5zbGlkZURvd24oKTtcbiAgICB9LCB0aGlzKTtcbiAgICBfLmVhY2godGhpcy5tb3JlQ2hhdENvbGxlY3Rpb24ucmV2ZXJzZSgpLCBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuICAgICAgdGVtcGxhdGUucHJlcGVuZFRvKHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpKTtcbiAgICB9KTtcblxuICAgICB0aGlzLmRhdGVEaXZpZGVyLmxvYWQoJChcIi5mb2xsb3dNZUJhclwiKSk7XG4gICAgICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0IC0gb3JpZ2luYWxIZWlnaHQ7XG4gICAgIFxuICB9LFxuXG4gIHJlbmRlck1vcmVEYXRlRGl2aWRlcnM6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdGhpcy5jdXJyZW50RGF0ZSA9IG1vbWVudChtb2RlbC5hdHRyaWJ1dGVzLnRpbWVzdGFtcCkuZm9ybWF0KCdkZGRkLCBNTU1NIERvIFlZWVknKTtcbiAgICBpZiAoIHRoaXMuY3VycmVudERhdGUgIT09IHRoaXMucHJldmlvdXNEYXRlICkge1xuICAgICAgdmFyIGN1cnJlbnREYXRlID0gJCh0aGlzLmRhdGVUZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICAgICAgLy8gY3VycmVudERhdGUuYXBwZW5kVG8odGhpcy4kKCcjY2hhdGJveC1jb250ZW50JykpLmhpZGUoKS5mYWRlSW4oKS5zbGlkZURvd24oKTtcbiAgICAgIHRoaXMubW9yZUNoYXRDb2xsZWN0aW9uLnB1c2goY3VycmVudERhdGUpO1xuICAgICAgdGhpcy5wcmV2aW91c0RhdGUgPSB0aGlzLmN1cnJlbnREYXRlO1xuICAgIH1cbiAgfSxcblxuICBhdXRvc2l6ZXI6IGZ1bmN0aW9uKCkge1xuICAgIGF1dG9zaXplKCQoJyNtZXNzYWdlLWlucHV0JykpO1xuICB9LFxuICBcbiAgc2Nyb2xsQm90dG9tSW5zdXJhbmNlOiBmdW5jdGlvbigpe1xuICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgdmFyIGludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKXtcbiAgICAgIHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9IHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcbiAgICB9LCA1MCk7XG4gICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICAgIH0sIDgwMCk7XG4gIH0sXG5cbiAgYWZ0ZXJDaGF0c1JlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5hdXRvc2l6ZXIoKTtcbiAgICB0aGlzLmRhdGVEaXZpZGVyLmxvYWQoJChcIi5mb2xsb3dNZUJhclwiKSk7XG4gICAgdGhpcy5zY3JvbGxCb3R0b21JbnN1cmFuY2UoKTtcbiAgfSxcblxuXG5cblxuXG5cblxuXG4vLyByb29tc1xuXG5cbiAgc2VhcmNoOiBmdW5jdGlvbihlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMgJiYgJC50cmltKCQoJyNjaGF0LXNlYXJjaC1pbnB1dCcpLnZhbCgpKS5sZW5ndGggPiAwKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB2YXIgbmFtZSA9ICQoJyNjaGF0LXNlYXJjaC1pbnB1dCcpLnZhbCgpO1xuICAgICAgdGhpcy5hZGRDaGF0cm9vbShuYW1lKTtcbiAgICAgIHRoaXMuJCgnI2NoYXQtc2VhcmNoLWlucHV0JykudmFsKCcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coJ3NlYXJjaCB0eXBpbmcnKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIGNyZWF0ZVJvb206IGZ1bmN0aW9uKGZvcm0pIHtcbiAgICB0aGlzLnZlbnQudHJpZ2dlcignY3JlYXRlUm9vbScsIGZvcm0pO1xuICB9LFxuICB1cGRhdGVSb29tOiBmdW5jdGlvbihmb3JtKSB7XG4gICAgdmFyIGlkID0gdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tJykuZ2V0KCdpZCcpO1xuICAgIGZvcm0uaWQgPSBpZDtcbiAgICB0aGlzLnZlbnQudHJpZ2dlcigndXBkYXRlUm9vbScsIGZvcm0pO1xuICB9LFxuICBkZXN0cm95Um9vbTogZnVuY3Rpb24oZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB2YXIgcm9vbU5hbWUgPSB0aGlzLm1vZGVsLmdldCgnY2hhdHJvb20nKS5nZXQoJ25hbWUnKTtcbiAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgIHZhciBjb25maXJtYXRpb24gPSBzd2FsKHtcbiAgICAgIHRpdGxlOiBcIkRvIHlvdSB3aXNoIHRvIGRlc3Ryb3kgXCIgKyByb29tTmFtZSArIFwiP1wiLFxuICAgICAgdGV4dDogXCJUaGlzIGtpbGxzIHRoZSByb29tLlwiLFxuICAgICAgdHlwZTogXCJ3YXJuaW5nXCIsXG4gICAgICBzaG93Q2FuY2VsQnV0dG9uOiB0cnVlLFxuICAgICAgY29uZmlybUJ1dHRvbkNvbG9yOiBcIiNERUIwQjBcIixcbiAgICAgIGNvbmZpcm1CdXR0b25UZXh0OiBcIk11YWhhaGEhXCIsXG4gICAgICBjbG9zZU9uQ29uZmlybTogZmFsc2UsXG4gICAgICBodG1sOiBmYWxzZVxuICAgIH0sIGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgcm9vbUlkID0gdGhpc18ubW9kZWwuZ2V0KCdjaGF0cm9vbScpLmlkO1xuICAgICAgdmFyIHVzZXJJblJvb20gPSB0cnVlO1xuICAgICAgdGhpc18udmVudC50cmlnZ2VyKCdkZXN0cm95Um9vbScsIHsgaWQ6IHJvb21JZCwgcm9vbU5hbWU6IHJvb21OYW1lLCB1c2VySW5Sb29tOiB1c2VySW5Sb29tIH0pO1xuICAgIH0pO1xuICB9LFxuICBkZXN0cm95VGhpc1BhcnRpY3VsYXJSb29tOiBmdW5jdGlvbihlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZhciByb29tTmFtZSA9ICQoZS50YXJnZXQpLmRhdGEoXCJyb29tLW5hbWVcIik7XG4gICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICB2YXIgY29uZmlybWF0aW9uID0gc3dhbCh7XG4gICAgICB0aXRsZTogXCJEbyB5b3Ugd2lzaCB0byBkZXN0cm95IFwiICsgcm9vbU5hbWUgKyBcIj9cIixcbiAgICAgIHRleHQ6IFwiVGhpcyBraWxscyB0aGUgcm9vbS5cIixcbiAgICAgIHR5cGU6IFwid2FybmluZ1wiLFxuICAgICAgc2hvd0NhbmNlbEJ1dHRvbjogdHJ1ZSxcbiAgICAgIGNvbmZpcm1CdXR0b25Db2xvcjogXCIjREVCMEIwXCIsXG4gICAgICBjb25maXJtQnV0dG9uVGV4dDogXCJNdWFoYWhhIVwiLFxuICAgICAgY2xvc2VPbkNvbmZpcm06IGZhbHNlLFxuICAgICAgaHRtbDogZmFsc2VcbiAgICB9LCBmdW5jdGlvbigpe1xuICAgICAgdmFyIGN1cnJlbnRSb29tSWQgPSB0aGlzXy5tb2RlbC5nZXQoJ2NoYXRyb29tJykuaWQ7XG4gICAgICB2YXIgcm9vbUlkID0gJChlLnRhcmdldCkuZGF0YShcInJvb20taWRcIik7XG4gICAgICB2YXIgdXNlckluUm9vbSA9IGN1cnJlbnRSb29tSWQgPT09IHJvb21JZDtcbiAgICAgIHRoaXNfLnZlbnQudHJpZ2dlcignZGVzdHJveVJvb20nLCB7IGlkOiByb29tSWQsIHJvb21OYW1lOiByb29tTmFtZSwgdXNlckluUm9vbTogdXNlckluUm9vbSB9KTtcbiAgICB9KTtcbiAgfSxcbiAgYWRkQ2hhdHJvb206IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYuYWRkQ2hhdHJvb20nKTtcbiAgICB0aGlzLnZlbnQudHJpZ2dlcignYWRkUm9vbScsIG5hbWUpO1xuICB9LFxuICByZW1vdmVSb29tOiBmdW5jdGlvbihlKSB7XG4gICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICB2YXIgY29uZmlybWF0aW9uID0gc3dhbCh7XG4gICAgICB0aXRsZTogXCJSZW1vdmUgVGhpcyBSb29tP1wiLFxuICAgICAgdGV4dDogXCJBcmUgeW91IHN1cmU/IEFyZSB5b3Ugc3VyZSB5b3UncmUgc3VyZT8gSG93IHN1cmUgY2FuIHlvdSBiZT9cIixcbiAgICAgIHR5cGU6IFwid2FybmluZ1wiLFxuICAgICAgc2hvd0NhbmNlbEJ1dHRvbjogdHJ1ZSxcbiAgICAgIGNvbmZpcm1CdXR0b25Db2xvcjogXCIjREVCMEIwXCIsXG4gICAgICBjb25maXJtQnV0dG9uVGV4dDogXCJNdWFoYWhhIVwiLFxuICAgICAgY2xvc2VPbkNvbmZpcm06IGZhbHNlLFxuICAgICAgaHRtbDogZmFsc2VcbiAgICB9LCBmdW5jdGlvbigpe1xuICAgICAgc3dhbCh7XG4gICAgICAgIHRpdGxlOiBcIlJlbW92ZWQhXCIsXG4gICAgICAgIHRleHQ6IFwiWW91IGFyZSBmcmVlIG9mIHRoaXMgY2hhdHJvb20uIEdvIG9uLCB5b3UncmUgZnJlZSBub3cuXCIsXG4gICAgICAgIHR5cGU6IFwic3VjY2Vzc1wiLFxuICAgICAgICBjb25maXJtQnV0dG9uQ29sb3I6IFwiIzc0OUNBOFwiXG4gICAgICB9KTtcbiAgICAgIHZhciBjdXJyZW50Um9vbUlkID0gdGhpc18ubW9kZWwuZ2V0KCdjaGF0cm9vbScpLmlkO1xuICAgICAgdmFyIHJvb21JZCA9ICQoZS50YXJnZXQpLmRhdGEoXCJyb29tLWlkXCIpO1xuICAgICAgdmFyIHJvb21OYW1lID0gJChlLnRhcmdldCkuZGF0YShcInJvb20tbmFtZVwiKTtcbiAgICAgIHZhciB1c2VySW5Sb29tID0gY3VycmVudFJvb21JZCA9PT0gcm9vbUlkO1xuICAgICAgdGhpc18udmVudC50cmlnZ2VyKCdyZW1vdmVSb29tJywge2lkOiByb29tSWQsIHJvb21OYW1lOiByb29tTmFtZSwgdXNlckluUm9vbTogdXNlckluUm9vbX0pO1xuICAgIH0pO1xuICB9LFxuICByZW5kZXJSb29tczogZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlclJvb21zJyk7XG4gICAgY29uc29sZS5sb2coJ0NIQVRST09NUzogJywgdGhpcy5tb2RlbC5nZXQoXCJjaGF0cm9vbXNcIikpO1xuICAgIHRoaXMuJCgnI3B1YmxpYy1yb29tcycpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tcycpLmVhY2goZnVuY3Rpb24gKHJvb20pIHtcbiAgICAgIHRoaXMucmVuZGVyUm9vbShyb29tKTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyUm9vbTogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB2YXIgbmFtZTEgPSBtb2RlbC5nZXQoJ25hbWUnKSxcbiAgICBuYW1lMiA9IHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbScpLmdldCgnbmFtZScpO1xuICAgIHRoaXMuJCgnI3B1YmxpYy1yb29tcycpLmFwcGVuZCh0aGlzLnJvb21UZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICAgIGlmIChuYW1lMSA9PT0gbmFtZTIpIHtcbiAgICAgIHRoaXMuJCgnI3B1YmxpYy1yb29tcycpLmZpbmQoJy5yb29tLW5hbWUnKS5sYXN0KCkuYWRkQ2xhc3MoJ2FjdGl2ZScpLmZhZGVJbigpO1xuICAgIH1cbiAgfSxcbiAgcmVuZGVyUHJpdmF0ZVJvb21zOiBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYucmVuZGVyUHJpdmF0ZVJvb21zJyk7XG4gICAgY29uc29sZS5sb2coJ1BSSVZBVEVST09NUzogJywgdGhpcy5tb2RlbC5nZXQoXCJwcml2YXRlUm9vbXNcIikpO1xuICAgIHRoaXMuJCgnI3ByaXZhdGUtcm9vbXMnKS5lbXB0eSgpO1xuICAgIHRoaXMubW9kZWwuZ2V0KCdwcml2YXRlUm9vbXMnKS5lYWNoKGZ1bmN0aW9uIChyb29tKSB7XG4gICAgICB0aGlzLnJlbmRlclByaXZhdGVSb29tKHJvb20pO1xuICAgIH0sIHRoaXMpO1xuICB9LFxuICByZW5kZXJQcml2YXRlUm9vbTogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB2YXIgbmFtZTEgPSBtb2RlbC5nZXQoJ25hbWUnKSxcbiAgICBuYW1lMiA9IHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbScpLmdldCgnbmFtZScpO1xuICAgIHRoaXMuJCgnI3ByaXZhdGUtcm9vbXMnKS5hcHBlbmQodGhpcy5yb29tVGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICBpZiAobmFtZTEgPT09IG5hbWUyKSB7XG4gICAgICB0aGlzLiQoJyNwcml2YXRlLXJvb21zJykuZmluZCgnLnJvb20tbmFtZScpLmxhc3QoKS5hZGRDbGFzcygnYWN0aXZlJykuZmFkZUluKCk7XG4gICAgfVxuICB9LFxuICBqb2luUm9vbTogZnVuY3Rpb24ob2JqKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLmpvaW5Sb29tJyk7XG4gICAgIC8vICQoJyNjaGF0SW1hZ2VVcGxvYWRDb250YWluZXInKS5kYXRhKCdjaGF0LXR5cGUnLCAnY2hhdCcpO1xuICAgIHRoaXMuY3VycmVudERhdGUgPSAnJztcbiAgICB0aGlzLnByZXZpb3VzRGF0ZSA9ICcnO1xuICAgIHRoaXMudmVudC50cmlnZ2VyKCdqb2luUm9vbScsIG9iai5uYW1lKTtcbiAgfSxcbi8vIGNoYW5nZSB0byAnam9pbkRpcmVjdE1lc3NhZ2UnXG4gIGluaXREaXJlY3RNZXNzYWdlOiBmdW5jdGlvbihlKSB7XG4gICAgdmFyIHJlY2lwaWVudCA9IHt9LFxuICAgICAgICAkdGFyID0gJChlLmN1cnJlbnRUYXJnZXQpO1xuICAgIHJlY2lwaWVudC51c2VybmFtZSA9ICR0YXIudGV4dCgpLnRyaW0oKTtcbiAgICByZWNpcGllbnQudXNlckltYWdlID0gJHRhci5maW5kKCdpbWcnKS5hdHRyKCdzcmMnKTtcbiAgICB0aGlzLmN1cnJlbnREYXRlID0gJyc7XG4gICAgdGhpcy5wcmV2aW91c0RhdGUgPSAnJztcbiAgICBpZiAodGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tJykuZ2V0KCdjdXJyZW50VXNlcicpICE9PSByZWNpcGllbnQudXNlcm5hbWUpIHtcbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKCdpbml0RGlyZWN0TWVzc2FnZScsIHJlY2lwaWVudCk7XG4gICAgfVxuICB9LFxuXG5cblxuXG5cbi8vIGltYWdlIHVwbG9hZFxuXG4gY2hhdFVwbG9hZEltYWdlOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgIGNvbnNvbGUubG9nKCdpbWcgdXJsOiAnLCByZXNwb25zZSk7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoXCJjaGF0XCIsIHJlc3BvbnNlKTtcbiAgICB0aGlzLnNjcm9sbEJvdHRvbUluc3VyYW5jZSgpO1xuICB9LFxuXG4gIG1lc3NhZ2VVcGxvYWRJbWFnZTogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgIGNvbnNvbGUubG9nKCdpbWcgdXJsOiAnLCByZXNwb25zZSk7XG4gICB0aGlzLnZlbnQudHJpZ2dlcihcImRpcmVjdE1lc3NhZ2VcIiwgcmVzcG9uc2UpO1xuICAgdGhpcy5zY3JvbGxCb3R0b21JbnN1cmFuY2UoKTtcbiB9LFxuXG5cblxuXG5cbiAgLy9ldmVudHNcblxuXG4gIG1lc3NhZ2VJbnB1dFByZXNzZWQ6IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMyAmJiAkLnRyaW0oJCgnLm1lc3NhZ2UtaW5wdXQnKS52YWwoKSkubGVuZ3RoID4gMCkge1xuICAgICAgLy8gZnVuIGZhY3Q6IHNlcGFyYXRlIGV2ZW50cyB3aXRoIGEgc3BhY2UgaW4gdHJpZ2dlcidzIGZpcnN0IGFyZyBhbmQgeW91XG4gICAgICAvLyBjYW4gdHJpZ2dlciBtdWx0aXBsZSBldmVudHMuXG4gICAgICB0aGlzLnZlbnQudHJpZ2dlcihcImNoYXRcIiwgeyBtZXNzYWdlOiB0aGlzLiQoJy5tZXNzYWdlLWlucHV0JykudmFsKCl9KTtcbiAgICAgIHRoaXMuJCgnLm1lc3NhZ2UtaW5wdXQnKS52YWwoJycpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnZlbnQudHJpZ2dlcihcInR5cGluZ1wiKTtcbiAgICAgIGNvbnNvbGUubG9nKCd3dXQnKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIGRpcmVjdE1lc3NhZ2VJbnB1dFByZXNzZWQ6IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMyAmJiAkLnRyaW0oJCgnLmRpcmVjdC1tZXNzYWdlLWlucHV0JykudmFsKCkpLmxlbmd0aCA+IDApIHtcbiAgICAgIC8vIGZ1biBmYWN0OiBzZXBhcmF0ZSBldmVudHMgd2l0aCBhIHNwYWNlIGluIHRyaWdnZXIncyBmaXJzdCBhcmcgYW5kIHlvdVxuICAgICAgLy8gY2FuIHRyaWdnZXIgbXVsdGlwbGUgZXZlbnRzLlxuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJkaXJlY3RNZXNzYWdlXCIsIHsgbWVzc2FnZTogdGhpcy4kKCcuZGlyZWN0LW1lc3NhZ2UtaW5wdXQnKS52YWwoKX0pO1xuICAgICAgdGhpcy4kKCcuZGlyZWN0LW1lc3NhZ2UtaW5wdXQnKS52YWwoJycpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnZlbnQudHJpZ2dlcihcInR5cGluZ1wiKTtcbiAgICAgIGNvbnNvbGUubG9nKCdodWgnKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIHNldFJvb206IGZ1bmN0aW9uKGUpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYuc2V0Um9vbScpO1xuICAgIHZhciAkdGFyID0gJChlLnRhcmdldCk7XG4gICAgaWYgKCR0YXIuaXMoJy5yb29tLW5hbWUnKSkge1xuICAgICAgdGhpcy5qb2luUm9vbSh7aWQ6ICR0YXIuZGF0YSgncm9vbS1pZCcpLCBuYW1lOiAkdGFyLmRhdGEoJ3Jvb20nKX0pO1xuICAgIH1cbiAgfSxcblxuXG4gIGRhdGVEaXZpZGVyOiAoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgJHdpbmRvdyA9ICQod2luZG93KSxcbiAgICAkc3RpY2tpZXM7XG5cbiAgICBsb2FkID0gZnVuY3Rpb24oc3RpY2tpZXMpIHtcbiAgICAgICRzdGlja2llcyA9IHN0aWNraWVzO1xuICAgICAgJCgnI2NoYXRib3gtY29udGVudCcpLnNjcm9sbChzY3JvbGxTdGlja2llc0luaXQpO1xuICAgIH07XG5cbiAgICBzY3JvbGxTdGlja2llc0luaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICQodGhpcykub2ZmKFwic2Nyb2xsLnN0aWNraWVzXCIpO1xuICAgICAgJCh0aGlzKS5vbihcInNjcm9sbC5zdGlja2llc1wiLCBfLmRlYm91bmNlKF93aGVuU2Nyb2xsaW5nLCAxNTApKTtcbiAgICB9O1xuXG4gICAgX3doZW5TY3JvbGxpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgICRzdGlja2llcy5yZW1vdmVDbGFzcygnZml4ZWQnKTtcbiAgICAgICRzdGlja2llcy5lYWNoKGZ1bmN0aW9uKGksIHN0aWNreSkge1xuICAgICAgICB2YXIgJHRoaXNTdGlja3kgPSAkKHN0aWNreSksXG4gICAgICAgICR0aGlzU3RpY2t5VG9wID0gJHRoaXNTdGlja3kub2Zmc2V0KCkudG9wO1xuICAgICAgICBpZiAoJHRoaXNTdGlja3lUb3AgPD0gMTYyKSB7XG4gICAgICAgICAgJHRoaXNTdGlja3kuYWRkQ2xhc3MoXCJmaXhlZFwiKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICBsb2FkOiBsb2FkXG4gICAgfTtcbiAgfSkoKVxuXG5cblxuXG59KTtcblxufSkoalF1ZXJ5KTsiLCJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLkludml0YXRpb25Db2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe1xuICAgIG1vZGVsOiBhcHAuSW52aXRhdGlvbk1vZGVsXG4gIH0pO1xuXG59KSgpOyIsIlxudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuQ2hhdHJvb21MaXN0ID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe1xuICAgIG1vZGVsOiBhcHAuQ2hhdHJvb21Nb2RlbCxcbiAgICB1cmw6ICcvYXBpL2NoYXRyb29tcycsXG4gIH0pO1xuXG59KSgpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLlByaXZhdGVSb29tQ29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcbiAgICBtb2RlbDogYXBwLkNoYXRyb29tTW9kZWwsXG4gIH0pO1xuXG59KSgpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cblxuKGZ1bmN0aW9uKCQpIHtcblxuICBhcHAuQ2hhdEltYWdlVXBsb2FkVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcblxuICAgIGVsOiAkKCcjY2hhdEltYWdlVXBsb2FkQ29udGFpbmVyJyksXG4gIFxuICAgIGV2ZW50czoge1xuICAgICAgJ2NoYW5nZSAjY2hhdEltYWdlVXBsb2FkJzogJ3JlbmRlclRodW1iJyxcbiAgICAgICdhdHRhY2hJbWFnZSAjY2hhdEltYWdlVXBsb2FkRm9ybSc6ICd1cGxvYWQnLFxuICAgICAgJ2NsaWNrICNhZGRDaGF0SW1hZ2VCdG4nOiAnc3VibWl0JyxcbiAgICB9LFxuXG4gICAgLy8gaW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG4gICAgLy8gICB0aGlzLmxpc3RlblRvKHRoaXMsIFwiZmlsZS1jaG9zZW5cIiwgdGhpcy5yZW5kZXJUaHVtYiwgdGhpcyk7XG4gICAgLy8gICB0aGlzLmxpc3RlblRvKHRoaXMsIFwiZmlsZS1jaG9zZW5cIiwgdGhpcy5yZW5kZXJUaHVtYiwgdGhpcyk7XG4gICAgLy8gfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnJlbmRlclRodW1iKCk7XG4gICAgfSxcblxuICAgIHJlbmRlclRodW1iOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpbnB1dCA9IHRoaXMuJCgnI2NoYXRJbWFnZVVwbG9hZCcpO1xuICAgICAgdmFyIGltZyA9IHRoaXMuJCgnI3VwbG9hZGVkQ2hhdEltYWdlJylbMF07XG4gICAgICBpZihpbnB1dC52YWwoKSAhPT0gJycpIHtcbiAgICAgICAgdmFyIHNlbGVjdGVkX2ZpbGUgPSBpbnB1dFswXS5maWxlc1swXTtcbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSAoZnVuY3Rpb24oYUltZykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBhSW1nLnNyYyA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICB9O1xuICAgICAgICB9KShpbWcpO1xuICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTCggc2VsZWN0ZWRfZmlsZSApO1xuICAgICAgfVxuXG4gICAgfSxcblxuICAgIHN1Ym1pdDogZnVuY3Rpb24oZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy4kZm9ybSA9IHRoaXMuJCgnI2NoYXRJbWFnZVVwbG9hZEZvcm0nKTtcbiAgICAgIHRoaXMuJGZvcm0udHJpZ2dlcignYXR0YWNoSW1hZ2UnKTtcbiAgICB9LFxuXG4gICAgdXBsb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSh0aGlzLiRmb3JtWzBdKTtcbiAgICAgIGlmICh0aGlzLiQoJyNjaGF0SW1hZ2VVcGxvYWQnKVswXS5maWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgIHVybDogJy9hcGkvdXBsb2FkQ2hhdEltYWdlJyxcbiAgICAgICAgICBkYXRhOiBmb3JtRGF0YSxcbiAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiggeGhyICkge1xuICAgICAgICAgICAgX3RoaXMucmVuZGVyU3RhdHVzKCdFcnJvcjogJyArIHhoci5zdGF0dXMpO1xuICAgICAgICAgICAgYWxlcnQoJ1lvdXIgaW1hZ2UgaXMgZWl0aGVyIHRvbyBsYXJnZSBvciBpdCBpcyBub3QgYSAuanBlZywgLnBuZywgb3IgLmdpZi4nKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKCByZXNwb25zZSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdpbWdVcGxvYWQgcmVzcG9uc2U6ICcsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIF90aGlzLiRlbC5kYXRhKCdjaGF0LXR5cGUnKSA9PT0gJ2NoYXQnID9cbiAgICAgICAgICAgICAgX3RoaXMudHJpZ2dlcignY2hhdC1pbWFnZS11cGxvYWRlZCcsIHJlc3BvbnNlKSA6XG4gICAgICAgICAgICAgIF90aGlzLnRyaWdnZXIoJ21lc3NhZ2UtaW1hZ2UtdXBsb2FkZWQnLCByZXNwb25zZSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnaW1nVXBsb2FkIHBhdGggJywgcmVzcG9uc2UucGF0aCk7XG4gICAgICAgICAgICAkKCcjY2hhdEltYWdlVXBsb2FkTW9kYWwnKS5tb2RhbCgnaGlkZScpO1xuICAgICAgICAgICAgX3RoaXMuY2xlYXJGaWVsZCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgIHRoaXMudHJpZ2dlcignaW1hZ2UtdXBsb2FkZWQnKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgcmVuZGVyU3RhdHVzOiBmdW5jdGlvbiggc3RhdHVzICkge1xuICAgICAgJCgnI3N0YXR1cycpLnRleHQoc3RhdHVzKTtcbiAgICB9LFxuXG4gICAgY2xlYXJGaWVsZDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiQoJyN1cGxvYWRlZENoYXRJbWFnZScpWzBdLnNyYyA9ICcnO1xuICAgICAgdGhpcy4kKCcjY2hhdEltYWdlVXBsb2FkJykudmFsKCcnKTtcbiAgICB9XG5cbiAgfSk7XG5cbn0pKGpRdWVyeSk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuXG4oZnVuY3Rpb24oJCkge1xuXG4gIGFwcC5DaGF0cm9vbVNldHRpbmdzVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcblxuICAgIGVsOiAkKCcjY2hhdHJvb20taGVhZGVyLWNvbnRhaW5lcicpLFxuICAgIHVzZXJJbnZpdGVkVGVtcGxhdGU6IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJ1c2VyLWludml0ZWQtcmVzcG9uc2Ugc3VjY2Vzc1wiPjwlPSB1c2VybmFtZSAlPiBJbnZpdGVkITwvZGl2PicpLFxuICAgIGludml0YXRpb25FcnJvclRlbXBsYXRlOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwidXNlci1pbnZpdGVkLXJlc3BvbnNlIGZhaWx1cmVcIj5GYWlsdXJlITwvZGl2PicpLFxuICAgIGV2ZW50czoge1xuICAgICAgJ2NoYW5nZSAjcHJlZmVyZW5jZXMtaW1hZ2UtdXBsb2FkJzogJ3JlbmRlclRodW1iJyxcbiAgICAgICdhdHRhY2hJbWFnZSAjcHJlZmVyZW5jZXMtZm9ybSc6ICd1cGxvYWQnLFxuICAgICAgJ2NsaWNrICNwcmVmZXJlbmNlcy1idG4nOiAnc3VibWl0JyxcbiAgICAgICdrZXl1cCAjaW52aXRlLXVzZXItaW5wdXQnOiAnaW52aXRlVXNlcicsXG4gICAgfSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcbiAgICAgIHRoaXMudXNlclNlYXJjaFR5cGVhaGVhZCgpO1xuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAgICQoXCJmb3JtXCIpLnN1Ym1pdChmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLmxpc3RlblRvKHRoaXMsIFwidXNlckludml0ZWRcIiwgdGhpcy51c2VySW52aXRlZCwgdGhpcyk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnJlbmRlclRodW1iKCk7XG4gICAgfSxcblxuICAgIHJlbmRlclRodW1iOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpbnB1dCA9IHRoaXMuJCgnI3ByZWZlcmVuY2VzLWltYWdlLXVwbG9hZCcpO1xuICAgICAgdmFyIGltZyA9IHRoaXMuJCgnI3VwbG9hZGVkLXByZWZlcmVuY2VzLWltYWdlJylbMF07XG4gICAgICBpZihpbnB1dC52YWwoKSAhPT0gJycpIHtcbiAgICAgICAgdmFyIHNlbGVjdGVkX2ZpbGUgPSBpbnB1dFswXS5maWxlc1swXTtcbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSAoZnVuY3Rpb24oYUltZykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBhSW1nLnNyYyA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICB9O1xuICAgICAgICB9KShpbWcpO1xuICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTCggc2VsZWN0ZWRfZmlsZSApO1xuICAgICAgfVxuXG4gICAgfSxcblxuICAgIHN1Ym1pdDogZnVuY3Rpb24oZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICB0aGlzLiRmb3JtID0gdGhpcy4kKCcjcHJlZmVyZW5jZXMtZm9ybScpO1xuICAgICAgdGhpcy4kZm9ybS50cmlnZ2VyKCdhdHRhY2hJbWFnZScpO1xuICAgIH0sXG5cbiAgICB1cGxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKHRoaXMuJGZvcm1bMF0pO1xuICAgICAgaWYgKHRoaXMuJCgnI3ByZWZlcmVuY2VzLWltYWdlLXVwbG9hZCcpWzBdLmZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgdXJsOiAnL2FwaS91cGxvYWRDaGF0cm9vbUltYWdlJyxcbiAgICAgICAgICBkYXRhOiBmb3JtRGF0YSxcbiAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiggeGhyICkge1xuICAgICAgICAgICAgX3RoaXMucmVuZGVyU3RhdHVzKCdFcnJvcjogJyArIHhoci5zdGF0dXMpO1xuICAgICAgICAgICAgYWxlcnQoJ1lvdXIgaW1hZ2UgaXMgZWl0aGVyIHRvbyBsYXJnZSBvciBpdCBpcyBub3QgYSAuanBlZywgLnBuZywgb3IgLmdpZi4nKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKCByZXNwb25zZSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdpbWdVcGxvYWQgcmVzcG9uc2U6ICcsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIHZhciBmb3JtID0gX3RoaXMuY3JlYXRlUm9vbUZvcm1EYXRhKCk7XG4gICAgICAgICAgICBmb3JtLnJvb21JbWFnZSA9IHJlc3BvbnNlLnJvb21JbWFnZTtcbiAgICAgICAgICAgIF90aGlzLnRyaWdnZXIoJ3VwZGF0ZVJvb20nLCBmb3JtKTtcbiAgICAgICAgICAgICQoJyNwcmVmZXJlbmNlcy1tb2RhbCcpLm1vZGFsKCdoaWRlJyk7XG4gICAgICAgICAgICBfdGhpcy5jbGVhckZpZWxkKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBmb3JtID0gdGhpcy5jcmVhdGVSb29tRm9ybURhdGEoKTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKCd1cGRhdGVSb29tJywgZm9ybSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuXG4gICAgY3JlYXRlUm9vbUZvcm1EYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBmb3JtRGF0YSA9IHt9O1xuICAgICAgdGhpcy4kKCcjcHJlZmVyZW5jZXMtZm9ybScpLmZpbmQoICdpbnB1dCcgKS5lYWNoKGZ1bmN0aW9uKGksIGVsKSB7XG4gICAgICAgIGlmICgkKGVsKS5kYXRhKCdjcmVhdGUnKSA9PT0gJ3ByaXZhY3knKSB7XG4gICAgICAgICAgdmFyIHZhbCA9ICQoZWwpLnByb3AoJ2NoZWNrZWQnKTtcbiAgICAgICAgICBmb3JtRGF0YVsncHJpdmFjeSddID0gdmFsO1xuICAgICAgICB9IGVsc2UgaWYgKCQoZWwpLnZhbCgpICE9PSAnJyAmJiAkKGVsKS52YWwoKSAhPT0gJ29uJykge1xuICAgICAgICAgIGZvcm1EYXRhWyQoZWwpLmRhdGEoJ2NyZWF0ZScpXSA9ICQoZWwpLnZhbCgpO1xuICAgICAgICAgICQoZWwpLnZhbCgnJyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgZGVsZXRlIGZvcm1EYXRhLnVuZGVmaW5lZDtcbiAgICAgIHJldHVybiBmb3JtRGF0YTtcbiAgICB9LFxuXG4gICAgcmVuZGVyU3RhdHVzOiBmdW5jdGlvbiggc3RhdHVzICkge1xuICAgICAgJCgnI3N0YXR1cycpLnRleHQoc3RhdHVzKTtcbiAgICB9LFxuXG4gICAgY2xlYXJGaWVsZDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiQoJyN1cGxvYWRlZC1wcmVmZXJlbmNlcy1pbWFnZScpWzBdLnNyYyA9ICcnO1xuICAgICAgdGhpcy4kKCcjcHJlZmVyZW5jZXMtaW1hZ2UtdXBsb2FkJykudmFsKCcnKTtcbiAgICB9LFxuXG4gICAgaW52aXRlVXNlcjogZnVuY3Rpb24oZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdmFyIHJlY2lwaWVudCA9ICQudHJpbSgkKCcjaW52aXRlLXVzZXItaW5wdXQnKS52YWwoKSk7XG4gICAgICBpZiAoZS5rZXlDb2RlID09PSAxMyAmJiByZWNpcGllbnQubGVuZ3RoID4gMCkge1xuICAgICAgICAvLyBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZhciBzZW5kZXIgPSB0aGlzLm1vZGVsLmdldCgnY3VycmVudFVzZXInKSxcbiAgICAgICAgICAgIHJvb21JZCA9IHRoaXMubW9kZWwuZ2V0KCdpZCcpLFxuICAgICAgICAgICAgcm9vbU5hbWUgPSB0aGlzLm1vZGVsLmdldCgnbmFtZScpLFxuICAgICAgICAgICAgaW52aXRhdGlvbk9iaiA9IHtzZW5kZXI6IHNlbmRlciwgcm9vbUlkOiByb29tSWQsIHJvb21OYW1lOiByb29tTmFtZSwgcmVjaXBpZW50OiByZWNpcGllbnR9O1xuICAgICAgICB0aGlzLnZlbnQudHJpZ2dlcignaW52aXRlVXNlcicsIGludml0YXRpb25PYmopO1xuICAgICAgICAkKCcjaW52aXRlLXVzZXItaW5wdXQnKS52YWwoJycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3NlYXJjaCB0eXBpbmcnKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICB1c2VyU2VhcmNoVHlwZWFoZWFkOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgICB2YXIgYmxvb2QgPSBuZXcgQmxvb2Rob3VuZCh7XG4gICAgICAgIGRhdHVtVG9rZW5pemVyOiBCbG9vZGhvdW5kLnRva2VuaXplcnMub2JqLndoaXRlc3BhY2UoJ3VzZXJuYW1lJyksXG4gICAgICAgIHF1ZXJ5VG9rZW5pemVyOiBCbG9vZGhvdW5kLnRva2VuaXplcnMud2hpdGVzcGFjZSxcbiAgICAgICAgcHJlZmV0Y2g6IHtcbiAgICAgICAgICB1cmw6ICcvYWxsVXNlcnMnLFxuICAgICAgICAgIGZpbHRlcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJy0tLS0tLWRhYWF0YWEtLS0tJywgZGF0YSk7XG4gICAgICAgICAgICAgcmV0dXJuIF8ubWFwKGRhdGEsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyB1c2VybmFtZTogdXNlciB9O1xuICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgdHRsOiAwLFxuICAgICAgICB9LFxuICAgICAgICByZW1vdGU6IHtcbiAgICAgICAgICB1cmw6ICcvc2VhcmNoVXNlcnM/dXNlcm5hbWU9JVFVRVJZJyxcbiAgICAgICAgICB3aWxkY2FyZDogJyVRVUVSWScsXG4gICAgICAgICAgcmF0ZUxpbWl0V2FpdDogMzAwLFxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGJsb29kLmNsZWFyUHJlZmV0Y2hDYWNoZSgpO1xuICAgICAgYmxvb2QuaW5pdGlhbGl6ZSgpO1xuICAgICAgJCgnI2ludml0ZS11c2VyLWlucHV0JykudHlwZWFoZWFkKHtcbiAgICAgICAgbWluTGVuZ3RoOiAyLFxuICAgICAgICBjbGFzc05hbWVzOiB7XG4gICAgICAgICAgaW5wdXQ6ICd0eXBlYWhlYWQtaW5wdXQnLFxuICAgICAgICAgIGhpbnQ6ICd0eXBlYWhlYWQtaGludCcsXG4gICAgICAgICAgc2VsZWN0YWJsZTogJ3R5cGVhaGVhZC1zZWxlY3RhYmxlJyxcbiAgICAgICAgICBtZW51OiAndHlwZWFoZWFkLW1lbnUnLFxuICAgICAgICAgIGhpZ2hsaWdodDogJ3R5cGVhaGVhZC1oaWdobGlnaHQnLFxuICAgICAgICAgIGRhdGFzZXQ6ICd0eXBlYWhlYWQtZGF0YXNldCcsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBsaW1pdDogNSxcbiAgICAgICAgc291cmNlOiBibG9vZCxcbiAgICAgICAgbmFtZTogJ3VzZXItc2VhcmNoJyxcbiAgICAgICAgZGlzcGxheTogJ3VzZXJuYW1lJyxcbiAgICAgIH0pLm9uKCd0eXBlYWhlYWQ6c2VsZWN0IHR5cGVhaGVhZDphdXRvY29tcGxldGUnLCBmdW5jdGlvbihvYmopIHtcblxuICAgICAgfSk7XG4gICAgfSxcblxuICAgIHVzZXJJbnZpdGVkOiBmdW5jdGlvbih1c2VybmFtZSkge1xuICAgICAgaWYgKHVzZXJuYW1lLmVycm9yID09PSAnZXJyb3InKSB7XG4gICAgICAgICQoJy5pbnZpdGUtdXNlci1jb250YWluZXInKS5hcHBlbmQodGhpcy5pbnZpdGF0aW9uRXJyb3JUZW1wbGF0ZSgpKTtcbiAgICAgIH1cbiAgICAgICQoJy5pbnZpdGUtdXNlci1jb250YWluZXInKS5hcHBlbmQodGhpcy51c2VySW52aXRlZFRlbXBsYXRlKHt1c2VybmFtZTogdXNlcm5hbWV9KSk7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAkKCcuaW52aXRlLXVzZXItY29udGFpbmVyIC5zdWNjZXNzJykuZmFkZU91dCgzMDAsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICQodGhpcykucmVtb3ZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKCcuaW52aXRlLXVzZXItY29udGFpbmVyIC5mYWlsdXJlJykuZmFkZU91dCgzMDAsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICQodGhpcykucmVtb3ZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSwgMTAwMCk7XG4gICAgfSxcblxuXG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cblxuKGZ1bmN0aW9uKCQpIHtcblxuICBhcHAuQ3JlYXRlQ2hhdHJvb21WaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuXG4gICAgZWw6ICQoJyNjcmVhdGVDaGF0cm9vbUNvbnRhaW5lcicpLFxuICAgIGV2ZW50czoge1xuICAgICAgJ2NoYW5nZSAjY2hhdHJvb21JbWFnZVVwbG9hZCc6ICdyZW5kZXJUaHVtYicsXG4gICAgICAnYXR0YWNoSW1hZ2UgI2NyZWF0ZUNoYXRyb29tRm9ybSc6ICd1cGxvYWQnLFxuICAgICAgJ2NsaWNrICNjcmVhdGVDaGF0cm9vbUJ0bic6ICdzdWJtaXQnLFxuICAgIH0sXG5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XG4gICAgICB0aGlzLmxpc3RlblRvKHRoaXMsIFwiY2hhdHJvb21BdmFpbGFiaWxpdHlcIiwgdGhpcy5yZW5kZXJDaGF0cm9vbUF2YWlsYWJpbGl0eSwgdGhpcyk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnJlbmRlclRodW1iKCk7XG4gICAgfSxcblxuICAgIHJlbmRlclRodW1iOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpbnB1dCA9IHRoaXMuJCgnI2NoYXRyb29tSW1hZ2VVcGxvYWQnKTtcbiAgICAgIHZhciBpbWcgPSB0aGlzLiQoJyN1cGxvYWRlZENoYXRyb29tSW1hZ2UnKVswXTtcbiAgICAgIGlmKGlucHV0LnZhbCgpICE9PSAnJykge1xuICAgICAgICB2YXIgc2VsZWN0ZWRfZmlsZSA9IGlucHV0WzBdLmZpbGVzWzBdO1xuICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IChmdW5jdGlvbihhSW1nKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGFJbWcuc3JjID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgICAgIH07XG4gICAgICAgIH0pKGltZyk7XG4gICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKCBzZWxlY3RlZF9maWxlICk7XG4gICAgICB9XG5cbiAgICB9LFxuXG4gICAgc3VibWl0OiBmdW5jdGlvbihlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBpZiAodGhpcy4kKCcjY2hhdHJvb20tbmFtZS1pbnB1dCcpLmhhc0NsYXNzKCdpbnB1dC1pbnZhbGlkJykpIHtcbiAgICAgICAgc3dhbCh7XG4gICAgICAgICAgdGl0bGU6IFwiT0ggTk8gT0ggTk8gT0ggTk9cIixcbiAgICAgICAgICB0ZXh0OiBcIkNoYXRyb29tIEFscmVhZHksIEl0IEFscmVhZHkgRXhpc3RzISBBbmQuIERvbid0IEdvIEluIFRoZXJlLiBEb24ndC4gWW91LiBZb3UgU2hvdWxkIEhhdmUuIEkgVGhyZXcgVXAgSW4gTXkgSGF0LiBUaG9zZSBQb29yIC4gLiAuIFRoZXkgV2VyZSBKdXN0ISBPSCBOTyBXSFkuIFdIWSBPSCBOTy4gT0ggTk8uXCIsXG4gICAgICAgICAgdHlwZTogXCJlcnJvclwiLFxuICAgICAgICAgIGNvbmZpcm1CdXR0b25Db2xvcjogXCIjNzQ5Q0E4XCJcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLiRmb3JtID0gdGhpcy4kKCcjY3JlYXRlQ2hhdHJvb21Gb3JtJyk7XG4gICAgICAgIHRoaXMuJGZvcm0udHJpZ2dlcignYXR0YWNoSW1hZ2UnKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgdXBsb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICB2YXIgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEodGhpcy4kZm9ybVswXSk7XG4gICAgICBpZiAodGhpcy4kKCcjY2hhdHJvb21JbWFnZVVwbG9hZCcpWzBdLmZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgdXJsOiAnL2FwaS91cGxvYWRDaGF0cm9vbUltYWdlJyxcbiAgICAgICAgICBkYXRhOiBmb3JtRGF0YSxcbiAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiggeGhyICkge1xuICAgICAgICAgICAgX3RoaXMucmVuZGVyU3RhdHVzKCdFcnJvcjogJyArIHhoci5zdGF0dXMpO1xuICAgICAgICAgICAgYWxlcnQoJ1lvdXIgaW1hZ2UgaXMgZWl0aGVyIHRvbyBsYXJnZSBvciBpdCBpcyBub3QgYSAuanBlZywgLnBuZywgb3IgLmdpZi4nKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKCByZXNwb25zZSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdpbWdVcGxvYWQgcmVzcG9uc2U6ICcsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIHZhciBmb3JtID0gX3RoaXMuY3JlYXRlUm9vbUZvcm1EYXRhKCk7XG4gICAgICAgICAgICByZXNwb25zZS5uYW1lID0gZm9ybS5uYW1lO1xuICAgICAgICAgICAgICBfdGhpcy52ZW50LnRyaWdnZXIoJ2NyZWF0ZVJvb20nLCByZXNwb25zZSk7XG4gICAgICAgICAgICAkKCcjY3JlYXRlQ2hhdHJvb21Nb2RhbCcpLm1vZGFsKCdoaWRlJyk7XG4gICAgICAgICAgICBfdGhpcy5jbGVhckZpZWxkKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBmb3JtID0gX3RoaXMuY3JlYXRlUm9vbUZvcm1EYXRhKCk7XG4gICAgICAgdGhpcy52ZW50LnRyaWdnZXIoJ2NyZWF0ZVJvb20nLCBmb3JtKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG5cbiAgICBjcmVhdGVSb29tRm9ybURhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGZvcm1EYXRhID0ge307XG4gICAgICBmb3JtRGF0YS5yb29tSW1hZ2UgPSAnL2ltZy9jaGphdC1pY29uMS5wbmcnO1xuICAgICAgdGhpcy4kKCcjY3JlYXRlQ2hhdHJvb21Gb3JtJykuZmluZCggJ2lucHV0JyApLmVhY2goZnVuY3Rpb24oaSwgZWwpIHtcbiAgICAgICAgaWYgKCQoZWwpLnByb3AoJ3R5cGUnKSA9PT0gXCJidXR0b25cIikge1xuXG4gICAgICAgIH0gZWxzZSBpZiAoJChlbCkuZGF0YSgnY3JlYXRlJykgPT09ICdwcml2YWN5Jykge1xuICAgICAgICAgIHZhciB2YWwgPSAkKGVsKS5wcm9wKCdjaGVja2VkJyk7XG4gICAgICAgICAgZm9ybURhdGFbJ3ByaXZhY3knXSA9IHZhbDtcbiAgICAgICAgfSBlbHNlIGlmICgkKGVsKS52YWwoKSAhPT0gJycpIHtcbiAgICAgICAgICBmb3JtRGF0YVskKGVsKS5kYXRhKCdjcmVhdGUnKV0gPSAkKGVsKS52YWwoKTtcbiAgICAgICAgICAkKGVsKS52YWwoJycpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBmb3JtRGF0YTtcblxuICAgIH0sXG5cbiAgICByZW5kZXJTdGF0dXM6IGZ1bmN0aW9uKCBzdGF0dXMgKSB7XG4gICAgICAkKCcjc3RhdHVzJykudGV4dChzdGF0dXMpO1xuICAgIH0sXG5cbiAgICBjbGVhckZpZWxkOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJCgnI3VwbG9hZGVkQ2hhdHJvb21JbWFnZScpWzBdLnNyYyA9ICcnO1xuICAgICAgdGhpcy4kKCcjY2hhdHJvb21JbWFnZVVwbG9hZCcpLnZhbCgnJyk7XG4gICAgfSxcblxuICAgIHJlbmRlckNoYXRyb29tQXZhaWxhYmlsaXR5OiBmdW5jdGlvbihhdmFpbGFiaWxpdHkpIHtcbiAgICAgIHRoaXMuJCgnLnJvb20tbmFtZS12YWxpZGF0aW9uJykucmVtb3ZlQ2xhc3MoJ2lucHV0LXZhbGlkIGlucHV0LWludmFsaWQnKTtcbiAgICAgIHRoaXMuJCgnLnJvb20tbmFtZS12YWxpZGF0aW9uLW1lc3NhZ2UnKS5jaGlsZHJlbigpLnJlbW92ZSgpO1xuICAgICAgaWYgKGF2YWlsYWJpbGl0eSA9PT0gdHJ1ZSkge1xuICAgICAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbicpLmFkZENsYXNzKCdpbnB1dC12YWxpZCcpO1xuICAgICAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbi1tZXNzYWdlJykuYXBwZW5kKCc8ZGl2IGlkPVwiI2NoYXRyb29tLW5hbWUtdmFsaWRhdGlvblwiIGNsYXNzPVwiZmEgZmEtY2hlY2tcIj5OYW1lIEF2YWlsYWJsZTwvZGl2PicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy4kKCcucm9vbS1uYW1lLXZhbGlkYXRpb24nKS5hZGRDbGFzcygnaW5wdXQtaW52YWxpZCBmYSBmYS10aW1lcycpO1xuICAgICAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbi1tZXNzYWdlJykuYXBwZW5kKCc8ZGl2IGlkPVwiI2NoYXRyb29tLW5hbWUtdmFsaWRhdGlvblwiIGNsYXNzPVwiZmEgZmEtdGltZXNcIj5OYW1lIFVuYXZhaWxhYmxlPC9kaXY+Jyk7XG4gICAgICB9XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbi1tZXNzYWdlJykuY2hpbGRyZW4oKS5mYWRlT3V0KDYwMCwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAkKHRoaXMpLmNoaWxkcmVuKCkucmVtb3ZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSwgMjAwMCk7XG4gICAgfVxuXG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5OYXZiYXJWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIGVsOiAnLmxvZ2luLW1lbnUnLFxuICAgIHRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNuYXZiYXItdGVtcGxhdGUnKS5odG1sKCkpLFxuICAgIGludml0YXRpb25UZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjaW52aXRhdGlvbi10ZW1wbGF0ZScpLmh0bWwoKSksXG4gICAgZXZlbnRzOiB7XG4gICAgICAnY2xpY2sgLmRlbGV0ZS1pbnZpdGF0aW9uJzogJ2RlbGV0ZUludml0YXRpb24nLFxuICAgICAgJ2NsaWNrIC5hY2NlcHQtaW52aXRhdGlvbic6ICdhY2NlcHRJbnZpdGF0aW9uJyxcbiAgICAgICdjaGFuZ2UgI3VzZXItcHJlZmVyZW5jZXMtaW1hZ2UtdXBsb2FkJzogJ3JlbmRlclRodW1iJyxcbiAgICAgICdhdHRhY2hJbWFnZSAjdXNlci1wcmVmZXJlbmNlcy1mb3JtJzogJ3VwbG9hZCcsXG4gICAgICAnY2xpY2sgI3VzZXItcHJlZmVyZW5jZXMtYnRuJzogJ3N1Ym1pdCcsXG4gICAgICAna2V5dXAgI3VzZXItcHJlZmVyZW5jZXMtaG9tZS1yb29tLWlucHV0JzogJ2RvZXNIb21lUm9vbUV4aXN0JyxcbiAgICAgIC8vICdrZXlwcmVzcyAjdXNlci1wcmVmZXJlbmNlcy1ob21lLXJvb20taW5wdXQnOiAnZG9lc0hvbWVSb29tRXhpc3QnLFxuICAgICAgJ2NsaWNrIC5mYS1wb3dlci1vZmYnOiAnbG9nb3V0JyxcbiAgICB9LFxuXG4gICAgbG9nb3V0OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKCdsb2dvdXQnKTtcbiAgICB9LFxuXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xuICAgICAgdGhpcy5tb2RlbCA9IG5ldyBhcHAuVXNlck1vZGVsKHsgdXNlcm5hbWU6ICcnLCB1c2VySW1hZ2U6ICcnLCBob21lUm9vbTogJycsIGludml0YXRpb25zOiBuZXcgYXBwLkludml0YXRpb25Db2xsZWN0aW9uKCkgfSk7XG4gICAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiY2hhbmdlXCIsIHRoaXMucmVuZGVyLCB0aGlzKTtcblxuICAgICAgdmFyIGludml0YXRpb25zID0gdGhpcy5tb2RlbC5nZXQoJ2ludml0YXRpb25zJyk7XG5cbiAgICAgIHRoaXMubGlzdGVuVG8oaW52aXRhdGlvbnMsIFwicmVzZXRcIiwgdGhpcy5yZW5kZXJJbnZpdGF0aW9ucywgdGhpcyk7XG4gICAgICB0aGlzLmxpc3RlblRvKHRoaXMsIFwiaG9tZVJvb21BdmFpbGFiaWxpdHlcIiwgdGhpcy5yZW5kZXJIb21lUm9vbUF2YWlsYWJpbGl0eSwgdGhpcyk7XG5cbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSxcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKHRoaXMubW9kZWwudG9KU09OKCkpKTtcblxuICAgICAgdGhpcy5yZW5kZXJJbnZpdGF0aW9ucygpO1xuICAgICAgdGhpcy5zZXRIb21lUm9vbVR5ZXBhaGVhZCgpO1xuXG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgcmVuZGVySW52aXRhdGlvbnM6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kKCcjaW52aXRhdGlvbnMnKS5lbXB0eSgpO1xuICAgICAgdmFyIGludml0YXRpb25zID0gdGhpcy5tb2RlbC5nZXQoJ2ludml0YXRpb25zJyk7XG4gICAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgICAgaW52aXRhdGlvbnMuZWFjaChmdW5jdGlvbihpbnZpdGUpIHtcbiAgICAgICAgdGhpc18ucmVuZGVySW52aXRhdGlvbihpbnZpdGUpO1xuICAgICAgfSwgdGhpcyk7XG4gICAgICBpZiAoaW52aXRhdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRoaXMuJCgnLnBpbmstZnV6eicpLmhpZGUoKTtcbiAgICAgICAgdGhpcy4kKCcjaW52aXRhdGlvbnMnKS5hcHBlbmQoXCI8ZGl2PllvdSd2ZSBnb3Qgbm8gaW52aXRhdGlvbnMsIGxpa2UgZGFuZzwvZGl2PlwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuJCgnLnBpbmstZnV6eicpLnNob3coKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHJlbmRlckludml0YXRpb246IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICB0aGlzLiQoJyNpbnZpdGF0aW9ucycpLmFwcGVuZCh0aGlzLmludml0YXRpb25UZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICAgIH0sXG4gICAgZGVsZXRlSW52aXRhdGlvbjogZnVuY3Rpb24oZSkge1xuICAgICAgdmFyIHJvb21JZCA9ICQoZS50YXJnZXQpLmRhdGEoJ3Jvb21pZCcpO1xuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoJ2RlbGV0ZUludml0YXRpb24nLCByb29tSWQpO1xuICAgIH0sXG4gICAgYWNjZXB0SW52aXRhdGlvbjogZnVuY3Rpb24oZSkge1xuICAgICAgdmFyIHJvb21JZCA9ICQoZS50YXJnZXQpLmRhdGEoJ3Jvb21pZCcpO1xuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoJ2FjY2VwdEludml0YXRpb24nLCByb29tSWQpO1xuICAgIH0sXG5cblxuICAgIHJlbmRlclRodW1iOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpbnB1dCA9IHRoaXMuJCgnI3VzZXItcHJlZmVyZW5jZXMtaW1hZ2UtdXBsb2FkJyk7XG4gICAgICB2YXIgaW1nID0gdGhpcy4kKCcjdXBsb2FkZWQtdXNlci1wcmVmZXJlbmNlcy1pbWFnZScpWzBdO1xuICAgICAgaWYoaW5wdXQudmFsKCkgIT09ICcnKSB7XG4gICAgICAgIHZhciBzZWxlY3RlZF9maWxlID0gaW5wdXRbMF0uZmlsZXNbMF07XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICByZWFkZXIub25sb2FkID0gKGZ1bmN0aW9uKGFJbWcpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgYUltZy5zcmMgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkoaW1nKTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoIHNlbGVjdGVkX2ZpbGUgKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgc3VibWl0OiBmdW5jdGlvbihlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBpZiAodGhpcy4kKCcjdXNlci1wcmVmZXJlbmNlcy1ob21lLXJvb20taW5wdXQnKS5oYXNDbGFzcygnaW5wdXQtaW52YWxpZCcpKSB7XG4gICAgICAgIHN3YWwoe1xuICAgICAgICAgIHRpdGxlOiBcIk9IIE5PIE9IIE5PIE9IIE5PXCIsXG4gICAgICAgICAgdGV4dDogXCJDaGF0cm9vbSBDYW4ndCwgSXQgRG9lc24ndCBFeGlzdCEgQW5kLiBJIERvbid0IEtub3cuIFNob3VsZCBJPyBTaG91bGQgWW91PyBXaG8uIEkgTWVhbiBIb3cgRE8gd2UuIEhvdyBkbz8gSG93IGRvIG5vdz9cIixcbiAgICAgICAgICB0eXBlOiBcImVycm9yXCIsXG4gICAgICAgICAgY29uZmlybUJ1dHRvbkNvbG9yOiBcIiM3NDlDQThcIlxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuJGZvcm0gPSB0aGlzLiQoJyN1c2VyLXByZWZlcmVuY2VzLWZvcm0nKTtcbiAgICAgICAgdGhpcy4kZm9ybS50cmlnZ2VyKCdhdHRhY2hJbWFnZScpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICB1cGxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAgICAgdmFyIGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKHRoaXMuJGZvcm1bMF0pO1xuICAgICAgaWYgKHRoaXMuJCgnI3VzZXItcHJlZmVyZW5jZXMtaW1hZ2UtdXBsb2FkJylbMF0uZmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICB1cmw6ICcvdXBkYXRlVXNlckltYWdlJyxcbiAgICAgICAgICBkYXRhOiBmb3JtRGF0YSxcbiAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiggeGhyICkge1xuICAgICAgICAgICAgdGhpc18ucmVuZGVyU3RhdHVzKCdFcnJvcjogJyArIHhoci5zdGF0dXMpO1xuICAgICAgICAgICAgYWxlcnQoJ1lvdXIgaW1hZ2UgaXMgZWl0aGVyIHRvbyBsYXJnZSBvciBpdCBpcyBub3QgYSAuanBlZywgLnBuZywgb3IgLmdpZi4nKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKCByZXNwb25zZSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdpbWdVcGxvYWQgcmVzcG9uc2U6ICcsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIHZhciBmb3JtID0gdGhpc18uY3JlYXRlVXNlckZvcm1EYXRhKCk7XG4gICAgICAgICAgICBmb3JtLnVzZXJJbWFnZSA9IHJlc3BvbnNlLnVzZXJJbWFnZTtcbiAgICAgICAgICAgIHRoaXNfLnZlbnQudHJpZ2dlcigndXBkYXRlVXNlcicsIGZvcm0pO1xuICAgICAgICAgICAgJCgnI3VzZXItcHJlZmVyZW5jZXMtbW9kYWwnKS5tb2RhbCgnaGlkZScpO1xuICAgICAgICAgICAgdGhpc18uY2xlYXJGaWVsZCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZm9ybSA9IHRoaXMuY3JlYXRlVXNlckZvcm1EYXRhKCk7XG4gICAgICAgIHRoaXMudmVudC50cmlnZ2VyKCd1cGRhdGVVc2VyJywgZm9ybSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIGNyZWF0ZVVzZXJGb3JtRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZm9ybURhdGEgPSB7fTtcbiAgICAgIHRoaXMuJCgnI3VzZXItcHJlZmVyZW5jZXMtZm9ybScpLmZpbmQoICdpbnB1dCcgKS5lYWNoKGZ1bmN0aW9uKGksIGVsKSB7XG4gICAgICAgIGlmICgkKGVsKS5kYXRhKCdjcmVhdGUnKSA9PT0gJ3ByaXZhY3knKSB7XG4gICAgICAgICAgdmFyIHZhbCA9ICQoZWwpLnByb3AoJ2NoZWNrZWQnKTtcbiAgICAgICAgICBmb3JtRGF0YVsncHJpdmFjeSddID0gdmFsO1xuICAgICAgICB9IGVsc2UgaWYgKCQoZWwpLnZhbCgpICE9PSAnJyAmJiAkKGVsKS52YWwoKSAhPT0gJ29uJykge1xuICAgICAgICAgIGZvcm1EYXRhWyQoZWwpLmRhdGEoJ2NyZWF0ZScpXSA9ICQoZWwpLnZhbCgpO1xuICAgICAgICAgICQoZWwpLnZhbCgnJyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgZGVsZXRlIGZvcm1EYXRhLnVuZGVmaW5lZDtcbiAgICAgIHJldHVybiBmb3JtRGF0YTtcbiAgICB9LFxuXG4gICAgY2xlYXJGaWVsZDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiQoJyN1cGxvYWRlZC11c2VyLXByZWZlcmVuY2VzLWltYWdlJylbMF0uc3JjID0gJyc7XG4gICAgICB0aGlzLiQoJyN1c2VyLXByZWZlcmVuY2VzLWltYWdlLXVwbG9hZCcpLnZhbCgnJyk7XG4gICAgfSxcblxuICAgIHNldEhvbWVSb29tVHllcGFoZWFkOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgICB2YXIgYmxvb2QgPSBuZXcgQmxvb2Rob3VuZCh7XG4gICAgICAgIGRhdHVtVG9rZW5pemVyOiBCbG9vZGhvdW5kLnRva2VuaXplcnMub2JqLndoaXRlc3BhY2UoJ25hbWUnKSxcbiAgICAgICAgcXVlcnlUb2tlbml6ZXI6IEJsb29kaG91bmQudG9rZW5pemVycy53aGl0ZXNwYWNlLFxuICAgICAgICBwcmVmZXRjaDoge1xuICAgICAgICAgIHVybDogJy9hcGkvcHVibGljQ2hhdHJvb21zJyxcbiAgICAgICAgICBmaWx0ZXI6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCctLS0tLS0tLS1ob21lUm9vbURhdGE6ICcsIGRhdGEpO1xuICAgICAgICAgICAgIHJldHVybiBfLm1hcChkYXRhLCBmdW5jdGlvbihjaGF0cm9vbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IG5hbWU6IGNoYXRyb29tIH07XG4gICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICB0dGxfbXM6IDAsXG4gICAgICAgIH0sXG4gICAgICAgIHJlbW90ZToge1xuICAgICAgICAgIHVybDogJy9hcGkvc2VhcmNoQ2hhdHJvb21zP25hbWU9JVFVRVJZJyxcbiAgICAgICAgICB3aWxkY2FyZDogJyVRVUVSWScsXG4gICAgICAgICAgcmF0ZUxpbWl0V2FpdDogMzAwLFxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGJsb29kLmNsZWFyUHJlZmV0Y2hDYWNoZSgpO1xuICAgICAgYmxvb2QuaW5pdGlhbGl6ZSgpO1xuICAgICAgdmFyIHR5cGUgPSB0aGlzLiQoJyN1c2VyLXByZWZlcmVuY2VzLWhvbWUtcm9vbS1pbnB1dCcpLnR5cGVhaGVhZCh7XG4gICAgICAgIG1pbkxlbmd0aDogMixcbiAgICAgICAgY2xhc3NOYW1lczoge1xuICAgICAgICAgIGlucHV0OiAndHlwZWFoZWFkLWlucHV0JyxcbiAgICAgICAgICBoaW50OiAndHlwZWFoZWFkLWhpbnQnLFxuICAgICAgICAgIHNlbGVjdGFibGU6ICd0eXBlYWhlYWQtc2VsZWN0YWJsZScsXG4gICAgICAgICAgbWVudTogJ3R5cGVhaGVhZC1tZW51JyxcbiAgICAgICAgICBoaWdobGlnaHQ6ICd0eXBlYWhlYWQtaGlnaGxpZ2h0JyxcbiAgICAgICAgICBkYXRhc2V0OiAndHlwZWFoZWFkLWRhdGFzZXQnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbGltaXQ6IDUsXG4gICAgICAgIHNvdXJjZTogYmxvb2QsXG4gICAgICAgIG5hbWU6ICdob21lLXJvb20tc2VhcmNoJyxcbiAgICAgICAgZGlzcGxheTogJ25hbWUnLFxuICAgICAgfSkub24oJ3R5cGVhaGVhZDpzZWxlY3QgdHlwZWFoZWFkOmF1dG9jb21wbGV0ZScsIGZ1bmN0aW9uKG9iaikge1xuICAgICAgICB0aGlzXy5kb2VzSG9tZVJvb21FeGlzdCgpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIGRvZXNIb21lUm9vbUV4aXN0OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJCgnLnJvb20tbmFtZS12YWxpZGF0aW9uJykucmVtb3ZlQ2xhc3MoJ2lucHV0LXZhbGlkIGlucHV0LWludmFsaWQnKTtcbiAgICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgICB2YXIgY2hlY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCQudHJpbSgkKCcjdXNlci1wcmVmZXJlbmNlcy1ob21lLXJvb20taW5wdXQnKS52YWwoKSkubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHZhciBjaGF0cm9vbU5hbWUgPSAkKCcjdXNlci1wcmVmZXJlbmNlcy1ob21lLXJvb20taW5wdXQnKS52YWwoKTtcbiAgICAgICAgICB0aGlzXy52ZW50LnRyaWdnZXIoJ2RvZXNIb21lUm9vbUV4aXN0JywgY2hhdHJvb21OYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgIHRoaXNfLiQoJyN1c2VyLXByZWZlcmVuY2VzLWhvbWUtcm9vbS1pbnB1dCcpLmNoaWxkcmVuKCkucmVtb3ZlKCk7XG4gICAgICAgICB0aGlzXy4kKCcjdXNlci1wcmVmZXJlbmNlcy1ob21lLXJvb20taW5wdXQnKS5yZW1vdmVDbGFzcygnaW5wdXQtdmFsaWQgaW5wdXQtaW52YWxpZCcpO1xuICAgICAgIH1cbiAgICAgfTtcbiAgICAgXy5kZWJvdW5jZShjaGVjaygpLCAzMCk7XG4gICB9LFxuXG4gICByZW5kZXJIb21lUm9vbUF2YWlsYWJpbGl0eTogZnVuY3Rpb24oYXZhaWxhYmlsaXR5KSB7XG5cbiAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbicpLnJlbW92ZUNsYXNzKCdpbnB1dC12YWxpZCBpbnB1dC1pbnZhbGlkJyk7XG4gICAgdGhpcy4kKCcucm9vbS1uYW1lLXZhbGlkYXRpb24tbWVzc2FnZScpLmNoaWxkcmVuKCkucmVtb3ZlKCk7XG4gICAgaWYgKGF2YWlsYWJpbGl0eSA9PT0gZmFsc2UpIHtcbiAgICAgIHRoaXMuJCgnLnJvb20tbmFtZS12YWxpZGF0aW9uJykuYWRkQ2xhc3MoJ2lucHV0LXZhbGlkJyk7XG4gICAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbi1tZXNzYWdlJykuYXBwZW5kKCc8ZGl2IGlkPVwiI2NoYXRyb29tLW5hbWUtdmFsaWRhdGlvblwiIGNsYXNzPVwiZmEgZmEtY2hlY2tcIj48L2Rpdj4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kKCcucm9vbS1uYW1lLXZhbGlkYXRpb24nKS5hZGRDbGFzcygnaW5wdXQtaW52YWxpZCBmYSBmYS10aW1lcycpO1xuICAgICAgdGhpcy4kKCcucm9vbS1uYW1lLXZhbGlkYXRpb24tbWVzc2FnZScpLmFwcGVuZCgnPGRpdiBpZD1cIiNjaGF0cm9vbS1uYW1lLXZhbGlkYXRpb25cIiBjbGFzcz1cImZhIGZhLXRpbWVzXCI+Q2hhdHJvb20gRG9lcyBOb3QgRXhpc3Q8L2Rpdj4nKTtcbiAgICB9XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJCgnLnJvb20tbmFtZS12YWxpZGF0aW9uLW1lc3NhZ2UnKS5jaGlsZHJlbigpLmZhZGVPdXQoNjAwLCBmdW5jdGlvbigpe1xuICAgICAgICAkKHRoaXMpLmNoaWxkcmVuKCkucmVtb3ZlKCk7XG4gICAgICB9KTtcbiAgICB9LCAyMDAwKTtcbiAgfSxcblxuICB9KTtcblxufSkoalF1ZXJ5KTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuICBhcHAuUmVnaXN0ZXJWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIHRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNyZWdpc3RlcicpLmh0bWwoKSksXG4gICAgdXNlcm5hbWVBdmFpbGFibGVUZW1wbGF0ZTogXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cInVzZXJuYW1lLWF2YWlsYWJsZSBmYSBmYS1jaGVja1wiPnVzZXJuYW1lIGF2YWlsYWJsZTwvZGl2PicpLFxuICAgIHVzZXJuYW1lVGFrZW5UZW1wbGF0ZTogXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cInVzZXJuYW1lLXRha2VuIGZhIGZhLXRpbWVzXCI+dXNlcm5hbWUgdGFrZW48L2Rpdj4nKSxcbiAgICBldmVudHM6IHtcbiAgICAgIFwiY2xpY2sgI3NpZ25VcEJ0blwiOiBcInNpZ25VcFwiLFxuICAgICAgXCJrZXl1cCAjdXNlcm5hbWVcIjogXCJ2YWxpZGF0ZVVzZXJuYW1lXCIsXG4gICAgfSxcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSgpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc2lnblVwOiBmdW5jdGlvbigpIHtcbiAgICB9LFxuICAgIHZhbGlkYXRlVXNlcm5hbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCQoJyN1c2VybmFtZScpLnZhbCgpLmxlbmd0aCA8IDUpIHsgcmV0dXJuOyB9XG4gICAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgICAgXy5kZWJvdW5jZSgkLnBvc3QoJy9yZWdpc3RlclZhbGlkYXRpb24nLCB7IHVzZXJuYW1lOiAkKCcjdXNlcm5hbWUnKS52YWwoKSB9LGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgIGRhdGEudXNlcm5hbWVBdmFpbGFibGUgP1xuICAgICAgICAgICB0aGlzXy5yZW5kZXJWYWxpZGF0aW9uKHRoaXNfLnVzZXJuYW1lQXZhaWxhYmxlVGVtcGxhdGUoKSlcbiAgICAgICAgIDpcbiAgICAgICAgICAgdGhpc18ucmVuZGVyVmFsaWRhdGlvbih0aGlzXy51c2VybmFtZVRha2VuVGVtcGxhdGUoKSk7XG4gICAgICB9KSwgMTUwKTtcbiAgICB9LFxuICAgIHJlbmRlclZhbGlkYXRpb246IGZ1bmN0aW9uKHdoYXQpIHtcbiAgICAgICQoJy5yZWdpc3Rlci1lcnJvci1jb250YWluZXInKS5lbXB0eSgpO1xuICAgICAgJCh3aGF0KS5hcHBlbmRUbygkKCcucmVnaXN0ZXItZXJyb3ItY29udGFpbmVyJykpLmhpZGUoKS5mYWRlSW4oKTtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICQoJy5yZWdpc3Rlci1lcnJvci1jb250YWluZXInKS5jaGlsZHJlbigpLmZpcnN0KCkuZmFkZU91dCgpO1xuICAgICAgfSwgMjAwMCk7XG5cbiAgICB9XG4gIH0pO1xuXG59KShqUXVlcnkpOyIsIlxuLy8gVGhlIENoYXRDbGllbnQgaXMgaW1wbGVtZW50ZWQgb24gbWFpbi5qcy5cbi8vIFRoZSBjaGF0Y2xpZW50IGlzIGEgY29uc3RydWN0b3IgZnVuY3Rpb24gb24gdGhlIE1haW5Db250cm9sbGVyLlxuLy8gSXQgYm90aCBsaXN0ZW5zIHRvIGFuZCBlbWl0cyBldmVudHMgb24gdGhlIHNvY2tldCwgZWc6XG4vLyBJdCBoYXMgaXRzIG93biBtZXRob2RzIHRoYXQsIHdoZW4gY2FsbGVkLCBlbWl0IHRvIHRoZSBzb2NrZXQgdy8gZGF0YS5cbi8vIEl0IGFsc28gc2V0cyByZXNwb25zZSBsaXN0ZW5lcnMgb24gY29ubmVjdGlvbiwgdGhlc2UgcmVzcG9uc2UgbGlzdGVuZXJzXG4vLyBsaXN0ZW4gdG8gdGhlIHNvY2tldCBhbmQgdHJpZ2dlciBldmVudHMgb24gdGhlIGFwcEV2ZW50QnVzIG9uIHRoZSBcbi8vIE1haW5Db250cm9sbGVyXG52YXIgQ2hhdENsaWVudCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0Ly8gaXMtdHlwaW5nIGhlbHBlciB2YXJpYWJsZXNcblx0dmFyIFRZUElOR19USU1FUl9MRU5HVEggPSA0MDA7IC8vIG1zXG4gIHZhciB0eXBpbmcgPSBmYWxzZTtcbiAgdmFyIGxhc3RUeXBpbmdUaW1lO1xuICBcbiAgLy8gdGhpcyB2ZW50IGhvbGRzIHRoZSBhcHBFdmVudEJ1c1xuXHRzZWxmLnZlbnQgPSBvcHRpb25zLnZlbnQ7XG5cbiAgLy9tdXN0IGJlIGh0dHBzIG9uIGhlcm9rdSBhbmQgaHR0cCBvbiBsb2NhbGhvc3Rcblx0c2VsZi5ob3N0bmFtZSA9ICdodHRwOi8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xuXG4gIC8vIGNvbm5lY3RzIHRvIHNvY2tldCwgc2V0cyByZXNwb25zZSBsaXN0ZW5lcnNcblx0c2VsZi5jb25uZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuY29ubmVjdCcpO1xuXHRcdC8vIHRoaXMgaW8gbWlnaHQgYmUgYSBsaXR0bGUgY29uZnVzaW5nLi4uIHdoZXJlIGlzIGl0IGNvbWluZyBmcm9tP1xuXHRcdC8vIGl0J3MgY29taW5nIGZyb20gdGhlIHN0YXRpYyBtaWRkbGV3YXJlIG9uIHNlcnZlci5qcyBiYyBldmVyeXRoaW5nXG5cdFx0Ly8gaW4gdGhlIC9wdWJsaWMgZm9sZGVyIGhhcyBiZWVuIGF0dGFjaGVkIHRvIHRoZSBzZXJ2ZXIsIGFuZCB2aXNhXG5cdFx0Ly8gdmVyc2EuXG5cblxuICAgIC8vIGxvY2FsXG5cdFx0c2VsZi5zb2NrZXQgPSBpby5jb25uZWN0KHNlbGYuaG9zdG5hbWUpO1xuXG4gICAgLy8gaGVyb2t1XG4gICAgLy8gc2VsZi5zb2NrZXQgPSBpby5jb25uZWN0KCdodHRwOi8vd3d3LmNoamF0LmNvbS8nLCB7IHRyYW5zcG9ydHM6IFsnd2Vic29ja2V0J10gfSApO1xuXG4gICAgc2VsZi5zZXRSZXNwb25zZUxpc3RlbmVycyhzZWxmLnNvY2tldCk7XG4gIH07XG5cblxuXG4vLy8vLyBWaWV3RXZlbnRCdXMgbWV0aG9kcyAvLy8vXG4gICAgLy8gbWV0aG9kcyB0aGF0IGVtaXQgdG8gdGhlIGNoYXRzZXJ2ZXJcblxuLy8gTE9HSU5cbiAgc2VsZi5sb2dpbiA9IGZ1bmN0aW9uKHVzZXIpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5sb2dpbjogJywgdXNlcik7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcImxvZ2luXCIsIHVzZXIpO1xuICB9O1xuICBzZWxmLmxvZ291dCA9IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmxvZ291dDogJyk7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcImxvZ291dFwiKTtcbiAgfTtcblxuXG4vLyBST09NXG4gIHNlbGYuY29ubmVjdFRvUm9vbSA9IGZ1bmN0aW9uKHJvb21OYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuY29ubmVjdFRvUm9vbTogJywgcm9vbU5hbWUpO1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJjb25uZWN0VG9Sb29tXCIsIHJvb21OYW1lKTtcbiAgfTtcbiAgc2VsZi5qb2luUm9vbSA9IGZ1bmN0aW9uKHJvb21OYW1lKSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdCgnam9pblJvb20nLCByb29tTmFtZSk7XG4gIH07XG4gIHNlbGYuYWRkUm9vbSA9IGZ1bmN0aW9uKHJvb21OYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuYWRkUm9vbTogJywgcm9vbU5hbWUpO1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJhZGRSb29tXCIsIHJvb21OYW1lKTtcbiAgfTtcbiAgc2VsZi5yZW1vdmVSb29tID0gZnVuY3Rpb24ocm9vbURhdGEpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5yZW1vdmVSb29tOiAnLCByb29tRGF0YSk7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcInJlbW92ZVJvb21cIiwgcm9vbURhdGEpO1xuICB9O1xuICBzZWxmLmNyZWF0ZVJvb20gPSBmdW5jdGlvbihmb3JtRGF0YSkge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmNyZWF0ZVJvb206ICcsIGZvcm1EYXRhKTtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwiY3JlYXRlUm9vbVwiLCBmb3JtRGF0YSk7XG4gIH07XG4gIHNlbGYudXBkYXRlUm9vbSA9IGZ1bmN0aW9uKGZvcm1EYXRhKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYudXBkYXRlUm9vbTogJywgZm9ybURhdGEpO1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJ1cGRhdGVSb29tXCIsIGZvcm1EYXRhKTtcbiAgfTtcbiAgc2VsZi5kZXN0cm95Um9vbSA9IGZ1bmN0aW9uKHJvb21JbmZvKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuZGVzdHJveVJvb206ICcsIHJvb21JbmZvKTtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwiZGVzdHJveVJvb21cIiwgcm9vbUluZm8pO1xuICB9O1xuXG5cblxuLy8gQ0hBVFxuICBzZWxmLmNoYXQgPSBmdW5jdGlvbihjaGF0KSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuY2hhdDogJywgY2hhdCk7XG5cdFx0c2VsZi5zb2NrZXQuZW1pdChcImNoYXRcIiwgY2hhdCk7XG5cdH07XG4gIHNlbGYuZ2V0TW9yZUNoYXRzID0gZnVuY3Rpb24oY2hhdFJlcSkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoJ2dldE1vcmVDaGF0cycsIGNoYXRSZXEpO1xuICB9O1xuXG5cbi8vIERJUkVDVCBNRVNTQUdFXG4gIHNlbGYuaW5pdERpcmVjdE1lc3NhZ2UgPSBmdW5jdGlvbihyZWNpcGllbnQpIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KCdpbml0RGlyZWN0TWVzc2FnZScsIHJlY2lwaWVudCk7XG4gIH07XG4gIHNlbGYuZGlyZWN0TWVzc2FnZSA9IGZ1bmN0aW9uKGRpcmVjdE1lc3NhZ2UpIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KCdkaXJlY3RNZXNzYWdlJywgZGlyZWN0TWVzc2FnZSk7XG4gIH07XG4gIHNlbGYuZ2V0TW9yZURpcmVjdE1lc3NhZ2VzID0gZnVuY3Rpb24oZGlyZWN0TWVzc2FnZVJlcSkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoJ2dldE1vcmVEaXJlY3RNZXNzYWdlcycsIGRpcmVjdE1lc3NhZ2VSZXEpO1xuICB9O1xuICBcblxuLy8gVFlQSU5HXG5cdHNlbGYuYWRkQ2hhdFR5cGluZyA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgbWVzc2FnZSA9IGRhdGEudXNlcm5hbWUgKyAnIGlzIHR5cGluZyc7XG4gICAgJCgnLnR5cGV0eXBldHlwZScpLnRleHQobWVzc2FnZSk7XG5cdH07XG5cdHNlbGYucmVtb3ZlQ2hhdFR5cGluZyA9IGZ1bmN0aW9uKCkge1xuICAgICQoJy50eXBldHlwZXR5cGUnKS5lbXB0eSgpO1xuXHR9O1xuICBzZWxmLnVwZGF0ZVR5cGluZyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChzZWxmLnNvY2tldCkge1xuICAgICAgaWYgKCF0eXBpbmcpIHtcbiAgICAgICAgdHlwaW5nID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5zb2NrZXQuZW1pdCgndHlwaW5nJyk7XG4gICAgICB9XG4gICAgICBsYXN0VHlwaW5nVGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHlwaW5nVGltZXIgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgICB2YXIgdGltZURpZmYgPSB0eXBpbmdUaW1lciAtIGxhc3RUeXBpbmdUaW1lO1xuICAgICAgICBpZiAodGltZURpZmYgPj0gVFlQSU5HX1RJTUVSX0xFTkdUSCAmJiB0eXBpbmcpIHtcbiAgICAgICAgICAgc2VsZi5zb2NrZXQuZW1pdCgnc3RvcCB0eXBpbmcnKTtcbiAgICAgICAgICAgdHlwaW5nID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0sIFRZUElOR19USU1FUl9MRU5HVEgpO1xuICAgIH1cbiAgfTtcblxuXG4vLyBJTlZJVEFUSU9OU1xuICBzZWxmLmludml0ZVVzZXIgPSBmdW5jdGlvbihpbnZpdGF0aW9uT2JqKSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcImludml0ZVVzZXJcIiwgaW52aXRhdGlvbk9iaik7XG4gIH07XG4gIHNlbGYuZGVsZXRlSW52aXRhdGlvbiA9IGZ1bmN0aW9uKHJvb21JZCkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJkZWxldGVJbnZpdGF0aW9uXCIsIHJvb21JZCk7XG4gIH07XG4gIHNlbGYuYWNjZXB0SW52aXRhdGlvbiA9IGZ1bmN0aW9uKHJvb21JZCkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJhY2NlcHRJbnZpdGF0aW9uXCIsIHJvb21JZCk7XG4gIH07XG5cbi8vIFVQREFURSBVU0VSXG4gIHNlbGYudXBkYXRlVXNlciA9IGZ1bmN0aW9uKHVzZXJPYmopIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwidXBkYXRlVXNlclwiLCB1c2VyT2JqKTtcbiAgfTtcblxuXG5cbi8vIEVSUk9SIEhBTkRMSU5HXG4gIHNlbGYuZG9lc0NoYXRyb29tRXhpc3QgPSBmdW5jdGlvbihjaGF0cm9vbVF1ZXJ5KSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdCgnZG9lc0NoYXRyb29tRXhpc3QnLCBjaGF0cm9vbVF1ZXJ5KTtcbiAgfTtcbiAgc2VsZi5kb2VzSG9tZVJvb21FeGlzdCA9IGZ1bmN0aW9uKGhvbWVSb29tUXVlcnkpIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KCdkb2VzSG9tZVJvb21FeGlzdCcsIGhvbWVSb29tUXVlcnkpO1xuICB9O1xuXG5cbiAgXG5cblxuXG5cbiAgLy8vLy8vLy8vLy8vLy8gY2hhdHNlcnZlciBsaXN0ZW5lcnMvLy8vLy8vLy8vLy8vXG5cbiAgLy8gdGhlc2UgZ3V5cyBsaXN0ZW4gdG8gdGhlIGNoYXRzZXJ2ZXIvc29ja2V0IGFuZCBlbWl0IGRhdGEgdG8gbWFpbi5qcyxcbiAgLy8gc3BlY2lmaWNhbGx5IHRvIHRoZSBhcHBFdmVudEJ1cy5cblx0c2VsZi5zZXRSZXNwb25zZUxpc3RlbmVycyA9IGZ1bmN0aW9uKHNvY2tldCkge1xuXG5cbi8vIExPR0lOXG4gICAgc29ja2V0Lm9uKCdpbml0VXNlcicsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLmluaXRVc2VyJyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcignaW5pdFVzZXInLCB1c2VyKTtcbiAgICAgIHNlbGYuY29ubmVjdFRvUm9vbSh1c2VyLmhvbWVSb29tKTtcbiAgICB9KTtcblxuXG4vLyBDSEFUXG5cdFx0c29ja2V0Lm9uKCd1c2VySm9pbmVkJywgZnVuY3Rpb24odXNlcikge1xuXHRcdFx0Y29uc29sZS5sb2coJ3NjLmUudXNlckpvaW5lZDogJywgdXNlcik7XG4gICAgICAvLyBzb2NrZXQuZW1pdChcIm9ubGluZVVzZXJzXCIpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJ1c2VySm9pbmVkXCIsIHVzZXIpO1xuXHRcdH0pO1xuXHRcdHNvY2tldC5vbigndXNlckxlZnQnLCBmdW5jdGlvbih1c2VyKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnc2MuZS51c2VyTGVmdDogJywgdXNlcik7XG4gICAgICAvLyBzb2NrZXQuZW1pdChcIm9ubGluZVVzZXJzXCIpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJ1c2VyTGVmdFwiLCB1c2VyKTtcblx0XHR9KTtcblx0XHRzb2NrZXQub24oJ2NoYXQnLCBmdW5jdGlvbihjaGF0KSB7XG5cdFx0XHRjb25zb2xlLmxvZygnc2MuZS5jaGF0OiAnLCBjaGF0KTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwiY2hhdFJlY2VpdmVkXCIsIGNoYXQpO1xuXHRcdH0pO1xuICAgIHNvY2tldC5vbignbW9yZUNoYXRzJywgZnVuY3Rpb24oY2hhdHMpIHtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwibW9yZUNoYXRzXCIsIGNoYXRzKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ25vTW9yZUNoYXRzJywgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcIm5vTW9yZUNoYXRzXCIpO1xuICAgIH0pO1xuXG5cbi8vIERJUkVDVCBNRVNTQUdFXG4gICAgc29ja2V0Lm9uKCdzZXREaXJlY3RNZXNzYWdlQ2hhdGxvZycsIGZ1bmN0aW9uKGNoYXRsb2cpIHtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0RE1jaGF0bG9nXCIsIGNoYXRsb2cpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbignc2V0RGlyZWN0TWVzc2FnZUhlYWRlcicsIGZ1bmN0aW9uKGhlYWRlcikge1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRETWhlYWRlclwiLCBoZWFkZXIpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbignZGlyZWN0TWVzc2FnZScsIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgIC8vIHNlbGYudmVudC50cmlnZ2VyKFwicmVuZGVyRGlyZWN0TWVzc2FnZVwiLCBETSk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcImRpcmVjdE1lc3NhZ2VSZWNlaXZlZFwiLCBtZXNzYWdlKTtcbiAgICB9KTtcblxuXG5cbi8vIFRZUElOR1xuICAgIHNvY2tldC5vbigndHlwaW5nJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgc2VsZi5hZGRDaGF0VHlwaW5nKGRhdGEpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbignc3RvcCB0eXBpbmcnLCBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYucmVtb3ZlQ2hhdFR5cGluZygpO1xuICAgIH0pO1xuXG5cbi8vIFNFVCBST09NXG4gICAgc29ja2V0Lm9uKCdjaGF0bG9nJywgZnVuY3Rpb24oY2hhdGxvZykge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUuY2hhdGxvZzogJywgY2hhdGxvZyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldENoYXRsb2dcIiwgY2hhdGxvZyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdjaGF0cm9vbXMnLCBmdW5jdGlvbihjaGF0cm9vbXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLmNoYXRyb29tczogICcsIGNoYXRyb29tcyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldENoYXRyb29tc1wiLCBjaGF0cm9vbXMpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbigncHJpdmF0ZVJvb21zJywgZnVuY3Rpb24ocm9vbXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLnByaXZhdGVSb29tczogICcsIHJvb21zKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0UHJpdmF0ZVJvb21zXCIsIHJvb21zKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ29ubGluZVVzZXJzJywgZnVuY3Rpb24ob25saW5lVXNlcnMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLm9ubGluZVVzZXJzOiAnLCBvbmxpbmVVc2Vycyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldE9ubGluZVVzZXJzXCIsIG9ubGluZVVzZXJzKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ29mZmxpbmVVc2VycycsIGZ1bmN0aW9uKG9mZmxpbmVVc2Vycykge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUub2ZmbGluZVVzZXJzOiAnLCBvZmZsaW5lVXNlcnMpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRPZmZsaW5lVXNlcnNcIiwgb2ZmbGluZVVzZXJzKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ2NoYXRyb29tSGVhZGVyJywgZnVuY3Rpb24oaGVhZGVyT2JqKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5jaGF0cm9vbUhlYWRlcjogJywgaGVhZGVyT2JqKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0Q2hhdHJvb21IZWFkZXJcIiwgaGVhZGVyT2JqKTtcbiAgICB9KTtcblxuXG4vLyBSRURJUkVDVCBUTyBIT01FIFJPT01cbiAgICBzb2NrZXQub24oJ3JlZGlyZWN0VG9Ib21lUm9vbScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLnJlZGlyZWN0VG9Ib21lUm9vbTogJywgZGF0YSk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInJlZGlyZWN0VG9Ib21lUm9vbVwiLCBkYXRhKTtcbiAgICB9KTtcblxuLy8gUk9PTSBBVkFJTEFCSUxJVFlcbiAgICBzb2NrZXQub24oJ2NoYXRyb29tQXZhaWxhYmlsaXR5JywgZnVuY3Rpb24oYXZhaWxhYmlsdHkpIHtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKCdjaGF0cm9vbUF2YWlsYWJpbGl0eScsIGF2YWlsYWJpbHR5KTtcbiAgICB9KTtcblxuICAgIHNvY2tldC5vbignaG9tZVJvb21BdmFpbGFiaWxpdHknLCBmdW5jdGlvbihhdmFpbGFiaWx0eSkge1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoJ2hvbWVSb29tQXZhaWxhYmlsaXR5JywgYXZhaWxhYmlsdHkpO1xuICAgIH0pO1xuXG5cbi8vIEVSUk9SIEhBTkRMSU5HXG4gICAgc29ja2V0Lm9uKCdjaGF0cm9vbUFscmVhZHlFeGlzdHMnLCBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwiY2hhdHJvb21BbHJlYWR5RXhpc3RzXCIpO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKCdkZXN0cm95Um9vbVJlc3BvbnNlJywgZnVuY3Rpb24ocmVzKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcImRlc3Ryb3lSb29tUmVzcG9uc2VcIiwgcmVzKTtcbiAgICB9KTtcblxuLy8gSU5WSVRBVElPTlNcbiAgICBzb2NrZXQub24oJ3JlZnJlc2hJbnZpdGF0aW9ucycsIGZ1bmN0aW9uKGludml0YXRpb25zKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInJlZnJlc2hJbnZpdGF0aW9uc1wiLCBpbnZpdGF0aW9ucyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCd1c2VySW52aXRlZCcsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwidXNlckludml0ZWRcIiwgdXNlcik7XG4gICAgfSk7XG5cblxuICAgICAgICBzb2NrZXQub24oJ2xvZ291dCcsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5sb2dvdXQoKTtcbiAgICB9KTtcblxuXG5cdH07XG59OyIsIlxuXG5hcHAuTWFpbkNvbnRyb2xsZXIgPSBmdW5jdGlvbigpIHtcblxuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblxuICAvL1RoZXNlIGFsbG93cyB1cyB0byBiaW5kIGFuZCB0cmlnZ2VyIG9uIHRoZSBvYmplY3QgZnJvbSBhbnl3aGVyZSBpbiB0aGUgYXBwLlxuXHRzZWxmLmFwcEV2ZW50QnVzID0gXy5leHRlbmQoe30sIEJhY2tib25lLkV2ZW50cyk7XG5cdHNlbGYudmlld0V2ZW50QnVzID0gXy5leHRlbmQoe30sIEJhY2tib25lLkV2ZW50cyk7XG5cblx0c2VsZi5pbml0ID0gZnVuY3Rpb24oKSB7XG5cbiAgICAvLyBsb2dpbk1vZGVsXG4gICAgc2VsZi5sb2dpbk1vZGVsID0gbmV3IGFwcC5Mb2dpbk1vZGVsKCk7XG4gICAgc2VsZi5sb2dpblZpZXcgPSBuZXcgYXBwLkxvZ2luVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXMsIG1vZGVsOiBzZWxmLmxvZ2luTW9kZWx9KTtcbiAgICBzZWxmLnJlZ2lzdGVyVmlldyA9IG5ldyBhcHAuUmVnaXN0ZXJWaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cyB9KTtcbiAgICBzZWxmLm5hdmJhclZpZXcgPSBuZXcgYXBwLk5hdmJhclZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzfSk7XG5cblxuICAgIC8vIFRoZSBDb250YWluZXJNb2RlbCBnZXRzIHBhc3NlZCBhIHZpZXdTdGF0ZSwgTG9naW5WaWV3LCB3aGljaFxuICAgIC8vIGlzIHRoZSBsb2dpbiBwYWdlLiBUaGF0IExvZ2luVmlldyBnZXRzIHBhc3NlZCB0aGUgdmlld0V2ZW50QnVzXG4gICAgLy8gYW5kIHRoZSBMb2dpbk1vZGVsLlxuICAgIHNlbGYuY29udGFpbmVyTW9kZWwgPSBuZXcgYXBwLkNvbnRhaW5lck1vZGVsKHsgdmlld1N0YXRlOiBzZWxmLmxvZ2luVmlld30pO1xuXG4gICAgLy8gbmV4dCwgYSBuZXcgQ29udGFpbmVyVmlldyBpcyBpbnRpYWxpemVkIHdpdGggdGhlIG5ld2x5IGNyZWF0ZWQgY29udGFpbmVyTW9kZWxcbiAgICAvLyB0aGUgbG9naW4gcGFnZSBpcyB0aGVuIHJlbmRlcmVkLlxuICAgIHNlbGYuY29udGFpbmVyVmlldyA9IG5ldyBhcHAuQ29udGFpbmVyVmlldyh7IG1vZGVsOiBzZWxmLmNvbnRhaW5lck1vZGVsIH0pO1xuICAgIHNlbGYuY29udGFpbmVyVmlldy5yZW5kZXIoKTtcblxuIFxuICAgICQoJ2Zvcm0nKS5rZXlwcmVzcyhmdW5jdGlvbihlKSB7XG4gICAgICByZXR1cm4gZS5rZXlDb2RlICE9IDEzO1xuICAgIH0pO1xuXG5cbiAgfTtcblxuXG4gIHNlbGYuYXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgY29uc29sZS5sb2coJ2YubWFpbi5hdXRoZW50aWNhdGVkJyk7XG4gICAgICAgXG4gICAgJChcImJvZHlcIikuY3NzKFwib3ZlcmZsb3dcIiwgXCJoaWRkZW5cIik7XG4gICAgJCgnZm9ybScpLmtleXByZXNzKGZ1bmN0aW9uKGUpIHtcbiAgICAgIHJldHVybiBlLmtleUNvZGUgIT0gMTM7XG4gICAgfSk7XG5cbiAgICBzZWxmLmNoYXRDbGllbnQgPSBuZXcgQ2hhdENsaWVudCh7IHZlbnQ6IHNlbGYuYXBwRXZlbnRCdXMgfSk7XG4gICAgICAgICAgY29uc29sZS5sb2coJ2h1aCcpO1xuICAgIHNlbGYuY2hhdENsaWVudC5jb25uZWN0KCk7XG5cbiAgICAvLyBuZXcgbW9kZWwgYW5kIHZpZXcgY3JlYXRlZCBmb3IgY2hhdHJvb21cbiAgICBzZWxmLmNoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoeyBuYW1lOiAnUGFybG9yJyB9KTtcbiAgICBzZWxmLmNoYXRyb29tTGlzdCA9IG5ldyBhcHAuQ2hhdHJvb21MaXN0KCk7XG4gICAgc2VsZi5wcml2YXRlUm9vbUNvbGxlY3Rpb24gPSBuZXcgYXBwLlByaXZhdGVSb29tQ29sbGVjdGlvbigpO1xuICAgIHNlbGYuY2hhdHJvb21MaXN0LmZldGNoKCkuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zZXQoJ2NoYXRyb29tcycsIHNlbGYuY2hhdHJvb21MaXN0KTtcbiAgICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zZXQoJ3ByaXZhdGVSb29tcycsIHNlbGYucHJpdmF0ZVJvb21Db2xsZWN0aW9uKTtcbiAgICAgIHNlbGYuY2hhdHJvb21WaWV3ICA9IG5ldyBhcHAuQ2hhdHJvb21WaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cywgbW9kZWw6IHNlbGYuY2hhdHJvb21Nb2RlbCB9KTtcbiAgICAgIHNlbGYuY29udGFpbmVyTW9kZWwuc2V0KCd2aWV3U3RhdGUnLCBzZWxmLmNoYXRyb29tVmlldyk7XG4gICAgICBcblxuICAgICAgLy8gc2VsZi5jb25uZWN0VG9Sb29tKCk7XG4gICAgICAvLyBzZWxmLmluaXRSb29tKCk7XG4gICAgICAgICAgIC8vIDtcbiAgICB9KTtcblxuICB9O1xuXG4gIC8vIHNlbGYuY29ubmVjdFRvUm9vbSA9IGZ1bmN0aW9uKCkge1xuICAvLyAgIGNvbnNvbGUubG9nKCdmLm1haW4uY29ubmVjdFRvUm9vbScpO1xuICAvLyAgIHNlbGYuY2hhdENsaWVudC5jb25uZWN0VG9Sb29tKFwiUGFybG9yXCIpO1xuICAvLyB9O1xuXG4gIC8vIHNlbGYuaW5pdFJvb20gPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAvLyAgIHNlbGYuY2hhdHJvb21WaWV3LmluaXRSb29tKCk7XG4gIC8vIH07XG5cblxuXG5cblxuICAvLy8vLy8vLy8vLy8gIEJ1c3NlcyAvLy8vLy8vLy8vLy9cbiAgICAvLyBUaGVzZSBCdXNzZXMgbGlzdGVuIHRvIHRoZSBzb2NrZXRjbGllbnRcbiAgIC8vICAgIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cbiAgLy8vLyB2aWV3RXZlbnRCdXMgTGlzdGVuZXJzIC8vLy8vXG4gIFxuXHRzZWxmLnZpZXdFdmVudEJ1cy5vbihcImxvZ2luXCIsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQubG9naW4odXNlcik7XG4gIH0pO1xuXHRzZWxmLnZpZXdFdmVudEJ1cy5vbihcImNoYXRcIiwgZnVuY3Rpb24oY2hhdCkge1xuICAgIHNlbGYuY2hhdENsaWVudC5jaGF0KGNoYXQpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJ0eXBpbmdcIiwgZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LnVwZGF0ZVR5cGluZygpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJqb2luUm9vbVwiLCBmdW5jdGlvbihyb29tTmFtZSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5qb2luUm9vbShyb29tTmFtZSk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImFkZFJvb21cIiwgZnVuY3Rpb24ocm9vbSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5hZGRSb29tKHJvb20pO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJyZW1vdmVSb29tXCIsIGZ1bmN0aW9uKHJvb21EYXRhKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LnJlbW92ZVJvb20ocm9vbURhdGEpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJjcmVhdGVSb29tXCIsIGZ1bmN0aW9uKGZvcm1EYXRhKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmNyZWF0ZVJvb20oZm9ybURhdGEpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJ1cGRhdGVSb29tXCIsIGZ1bmN0aW9uKGZvcm1EYXRhKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LnVwZGF0ZVJvb20oZm9ybURhdGEpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJkZXN0cm95Um9vbVwiLCBmdW5jdGlvbihyb29tSW5mbykge1xuICAgIHNlbGYuY2hhdENsaWVudC5kZXN0cm95Um9vbShyb29tSW5mbyk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImdldE1vcmVDaGF0c1wiLCBmdW5jdGlvbihjaGF0UmVxKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmdldE1vcmVDaGF0cyhjaGF0UmVxKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiZG9lc0NoYXRyb29tRXhpc3RcIiwgZnVuY3Rpb24oY2hhdHJvb21RdWVyeSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5kb2VzQ2hhdHJvb21FeGlzdChjaGF0cm9vbVF1ZXJ5KTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiZG9lc0hvbWVSb29tRXhpc3RcIiwgZnVuY3Rpb24oY2hhdHJvb21RdWVyeSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5kb2VzSG9tZVJvb21FeGlzdChjaGF0cm9vbVF1ZXJ5KTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiaW5pdERpcmVjdE1lc3NhZ2VcIiwgZnVuY3Rpb24ocmVjaXBpZW50KSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmluaXREaXJlY3RNZXNzYWdlKHJlY2lwaWVudCk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImRpcmVjdE1lc3NhZ2VcIiwgZnVuY3Rpb24oZGlyZWN0TWVzc2FnZSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5kaXJlY3RNZXNzYWdlKGRpcmVjdE1lc3NhZ2UpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJnZXRNb3JlRGlyZWN0TWVzc2FnZXNcIiwgZnVuY3Rpb24oZGlyZWN0TWVzc2FnZVJlcSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5nZXRNb3JlRGlyZWN0TWVzc2FnZXMoZGlyZWN0TWVzc2FnZVJlcSk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImludml0ZVVzZXJcIiwgZnVuY3Rpb24oaW52aXRhdGlvbk9iaikge1xuICAgIHNlbGYuY2hhdENsaWVudC5pbnZpdGVVc2VyKGludml0YXRpb25PYmopO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJkZWxldGVJbnZpdGF0aW9uXCIsIGZ1bmN0aW9uKHJvb21JZCkge1xuICAgIHNlbGYuY2hhdENsaWVudC5kZWxldGVJbnZpdGF0aW9uKHJvb21JZCk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImFjY2VwdEludml0YXRpb25cIiwgZnVuY3Rpb24ocm9vbUlkKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmFjY2VwdEludml0YXRpb24ocm9vbUlkKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwidXBkYXRlVXNlclwiLCBmdW5jdGlvbih1c2VyT2JqKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LnVwZGF0ZVVzZXIodXNlck9iaik7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImxvZ291dFwiLCBmdW5jdGlvbigpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQubG9nb3V0KCk7XG4gIH0pO1xuXG5cblxuXG5cblxuICAvLy8vIGFwcEV2ZW50QnVzIExpc3RlbmVycyAvLy8vXG5cblx0Ly8gc2VsZi5hcHBFdmVudEJ1cy5vbihcInVzZXJzSW5mb1wiLCBmdW5jdGlvbihkYXRhKSB7XG4gLy8gICAgY29uc29sZS5sb2coJ21haW4uZS51c2Vyc0luZm86ICcsIGRhdGEpO1xuIC8vICAgIC8vZGF0YSBpcyBhbiBhcnJheSBvZiB1c2VybmFtZXMsIGluY2x1ZGluZyB0aGUgbmV3IHVzZXJcblx0Ly8gXHQvLyBUaGlzIG1ldGhvZCBnZXRzIHRoZSBvbmxpbmUgdXNlcnMgY29sbGVjdGlvbiBmcm9tIGNoYXRyb29tTW9kZWwuXG5cdC8vIFx0Ly8gb25saW5lVXNlcnMgaXMgdGhlIGNvbGxlY3Rpb25cblx0Ly8gXHR2YXIgb25saW5lVXNlcnMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KFwib25saW5lVXNlcnNcIik7XG4gLy8gICAgY29uc29sZS5sb2coXCIuLi5vbmxpbmVVc2VyczogXCIsIG9ubGluZVVzZXJzKTtcblx0Ly8gXHR2YXIgdXNlcnMgPSBfLm1hcChkYXRhLCBmdW5jdGlvbihpdGVtKSB7XG5cdC8vIFx0XHRyZXR1cm4gbmV3IGFwcC5Vc2VyTW9kZWwoe3VzZXJuYW1lOiBpdGVtfSk7XG5cdC8vIFx0fSk7XG4gLy8gICAgY29uc29sZS5sb2coXCJ1c2VyczogXCIsIHVzZXJzKTtcblx0Ly8gXHRvbmxpbmVVc2Vycy5yZXNldCh1c2Vycyk7XG5cdC8vIH0pO1xuXG4gLy8gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJyb29tSW5mb1wiLCBmdW5jdGlvbihkYXRhKSB7XG4gLy8gICAgZGVidWdnZXI7XG4gLy8gICAgY29uc29sZS5sb2coJ21haW4uZS5yb29tSW5mbzogJywgZGF0YSk7XG4gLy8gICAgdmFyIHJvb21zID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldChcImNoYXRyb29tc1wiKTtcbiAvLyAgICAgY29uc29sZS5sb2coXCIuLi5yb29tczogXCIsIHJvb21zKTtcbiAvLyAgICB2YXIgdXBkYXRlZFJvb21zID0gXy5tYXAoZGF0YSwgZnVuY3Rpb24ocm9vbSkge1xuIC8vICAgICAgdmFyIG5ld0NoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoe25hbWU6IHJvb219KTtcbiAvLyAgICAgIHJldHVybiBuZXdDaGF0cm9vbU1vZGVsO1xuIC8vICAgIH0pO1xuIC8vICAgIGNvbnNvbGUubG9nKFwiLi4udXBkYXRlZHJvb21zOiBcIiwgdXBkYXRlZFJvb21zKTtcbiAvLyAgICByb29tcy5yZXNldCh1cGRhdGVkUm9vbXMpO1xuIC8vICB9KTtcblxuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcImluaXRVc2VyXCIsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICBjb25zb2xlLmxvZygnbWFpbi5lLmluaXRVc2VyOiAnLCB1c2VyKTtcbiAgICBpbnZpdGF0aW9ucyA9IHNlbGYubmF2YmFyVmlldy5tb2RlbC5nZXQoJ2ludml0YXRpb25zJyk7XG4gICAgbmV3SW52aXRhdGlvbnMgPSBfLm1hcCh1c2VyLmludml0YXRpb25zLCBmdW5jdGlvbihpbnZpdGUpIHtcbiAgICAgICB2YXIgbmV3SW52aXRhdGlvbiA9IG5ldyBhcHAuSW52aXRhdGlvbk1vZGVsKGludml0ZSk7XG4gICAgICAgcmV0dXJuIG5ld0ludml0YXRpb247XG4gICAgfSk7XG4gICAgaW52aXRhdGlvbnMucmVzZXQobmV3SW52aXRhdGlvbnMpO1xuICAgIHNlbGYubmF2YmFyVmlldy5tb2RlbC5zZXQoeyAndXNlcm5hbWUnOiB1c2VyLnVzZXJuYW1lLCAnaG9tZVJvb20nOiB1c2VyLmhvbWVSb29tLCAndXNlckltYWdlJzogdXNlci51c2VySW1hZ2UgfSk7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJyZWZyZXNoSW52aXRhdGlvbnNcIiwgZnVuY3Rpb24oaW52aXRhdGlvbnMpIHtcbiAgICBjb25zb2xlLmxvZygnbWFpbi5lLnJlZnJlc2hJbnZpdGF0aW9uczogJywgaW52aXRhdGlvbnMpO1xuICAgIG9sZEludml0YXRpb25zID0gc2VsZi5uYXZiYXJWaWV3Lm1vZGVsLmdldCgnaW52aXRhdGlvbnMnKTtcbiAgICBuZXdJbnZpdGF0aW9ucyA9IF8ubWFwKGludml0YXRpb25zLCBmdW5jdGlvbihpbnZpdGUpIHtcbiAgICAgICB2YXIgbmV3SW52aXRhdGlvbiA9IG5ldyBhcHAuSW52aXRhdGlvbk1vZGVsKGludml0ZSk7XG4gICAgICAgcmV0dXJuIG5ld0ludml0YXRpb247XG4gICAgfSk7XG4gICAgb2xkSW52aXRhdGlvbnMucmVzZXQobmV3SW52aXRhdGlvbnMpO1xuICB9KTtcblxuXG4gIC8vIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRSb29tXCIsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gIC8vICAgY29uc29sZS5sb2coJ21haW4uZS5zZXRSb29tOiAnLCBtb2RlbCk7XG5cbiAgLy8gICB2YXIgY2hhdGxvZyA9IG5ldyBhcHAuQ2hhdENvbGxlY3Rpb24obW9kZWwuY2hhdGxvZyk7XG4gIC8vICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnY2hhdGxvZycsIGNoYXRsb2cpO1xuXG4gIC8vICAgdmFyIHJvb21zID0gbmV3IGFwcC5DaGF0cm9vbUxpc3QobW9kZWwuY2hhdHJvb21zKTtcbiAgLy8gICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdjaGF0cm9vbXMnLCByb29tcyk7XG5cbiAgLy8gICB2YXIgdXNlcnMgPSBuZXcgYXBwLlVzZXJDb2xsZWN0aW9uKG1vZGVsLm9ubGluZVVzZXJzKTtcbiAgLy8gICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdvbmxpbmVVc2VycycsIHVzZXJzKTtcblxuICAvLyB9KTtcblxuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcIkNoYXRyb29tTW9kZWxcIiwgZnVuY3Rpb24obW9kZWwpIHtcbiAgICBjb25zb2xlLmxvZygnbWFpbi5lLkNoYXRyb29tTW9kZWw6ICcsIG1vZGVsKTtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoKTtcbiAgICBzZWxmLmNoYXRyb29tTGlzdCA9IG5ldyBhcHAuQ2hhdHJvb21MaXN0KCk7XG4gICAgc2VsZi5jaGF0cm9vbVZpZXcgID0gbmV3IGFwcC5DaGF0cm9vbVZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzLCBtb2RlbDogc2VsZi5jaGF0cm9vbU1vZGVsLCBjb2xsZWN0aW9uOiBzZWxmLmNoYXRyb29tTGlzdH0pO1xuICAgIHNlbGYuY29udGFpbmVyTW9kZWwuc2V0KCd2aWV3U3RhdGUnLCBzZWxmLmNoYXRyb29tVmlldyk7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLmxvYWRNb2RlbChtb2RlbCk7XG4gIH0pO1xuXG5cblxuICAvLyBhZGRzIG5ldyB1c2VyIHRvIHVzZXJzIGNvbGxlY3Rpb24sIHNlbmRzIGRlZmF1bHQgam9pbmluZyBtZXNzYWdlXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2VySm9pbmVkXCIsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ21haW4uZS51c2VySm9pbmVkOiAnLCB1c2VyKTtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkVXNlcih1c2VyKTtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkQ2hhdCh7c2VuZGVyOiBcIkJ1dHRlcnNcIiwgbWVzc2FnZTogdXNlci51c2VybmFtZSArIFwiIGpvaW5lZCByb29tLlwiIH0pO1xuXHR9KTtcblxuXHQvLyByZW1vdmVzIHVzZXIgZnJvbSB1c2VycyBjb2xsZWN0aW9uLCBzZW5kcyBkZWZhdWx0IGxlYXZpbmcgbWVzc2FnZVxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwidXNlckxlZnRcIiwgZnVuY3Rpb24odXNlcikge1xuICAgICAgICBjb25zb2xlLmxvZygnbWFpbi5lLnVzZXJMZWZ0OiAnLCB1c2VyKTtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwucmVtb3ZlVXNlcih1c2VyKTtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkQ2hhdCh7c2VuZGVyOiBcIkJ1dHRlcnNcIiwgbWVzc2FnZTogdXNlci51c2VybmFtZSArIFwiIGxlZnQgcm9vbS5cIiB9KTtcblx0fSk7XG5cblx0Ly8gY2hhdCBwYXNzZWQgZnJvbSBzb2NrZXRjbGllbnQsIGFkZHMgYSBuZXcgY2hhdCBtZXNzYWdlIHVzaW5nIGNoYXRyb29tTW9kZWwgbWV0aG9kXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJjaGF0UmVjZWl2ZWRcIiwgZnVuY3Rpb24oY2hhdCkge1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5hZGRDaGF0KGNoYXQpO1xuXHRcdCQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuXHR9KTtcblxuXG5cblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwicmVkaXJlY3RUb0hvbWVSb29tXCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuY29ubmVjdFRvUm9vbShkYXRhLmhvbWVSb29tKTtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldENoYXRyb29tSGVhZGVyXCIsIGZ1bmN0aW9uKGhlYWRlck9iaikge1xuICAgIHZhciBuZXdIZWFkZXIgPSBuZXcgYXBwLkNoYXRyb29tSGVhZGVyTW9kZWwoaGVhZGVyT2JqKTtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdjaGF0cm9vbScsIG5ld0hlYWRlcik7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRDaGF0bG9nXCIsIGZ1bmN0aW9uKGNoYXRsb2cpIHtcbiAgICB2YXIgb2xkQ2hhdGxvZyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoJ2NoYXRsb2cnKTtcbiAgICB2YXIgdXBkYXRlZENoYXRsb2cgPSBfLm1hcChjaGF0bG9nLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgICB2YXIgbmV3Q2hhdE1vZGVsID0gbmV3IGFwcC5DaGF0TW9kZWwoeyByb29tOiBjaGF0LnJvb20sIG1lc3NhZ2U6IGNoYXQubWVzc2FnZSwgc2VuZGVyOiBjaGF0LnNlbmRlciwgdGltZXN0YW1wOiBjaGF0LnRpbWVzdGFtcCwgdXJsOiBjaGF0LnVybCB9KTtcbiAgICAgIHJldHVybiBuZXdDaGF0TW9kZWw7XG4gICAgfSk7XG4gICAgb2xkQ2hhdGxvZy5yZXNldCh1cGRhdGVkQ2hhdGxvZyk7XG4gICAkKCcjbWVzc2FnZS1pbnB1dCcpLnJlbW92ZUNsYXNzKCdkaXJlY3QtbWVzc2FnZS1pbnB1dCcpLmFkZENsYXNzKCdtZXNzYWdlLWlucHV0Jyk7XG4gICAgJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJtb3JlQ2hhdHNcIiwgZnVuY3Rpb24oY2hhdGxvZykge1xuICAgIHZhciBvbGRDaGF0bG9nID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldCgnY2hhdGxvZycpO1xuICAgIHZhciBtb3JlQ2hhdGxvZyA9IF8ubWFwKGNoYXRsb2csIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICAgIHZhciBuZXdDaGF0TW9kZWwgPSBuZXcgYXBwLkNoYXRNb2RlbCh7IHJvb206IGNoYXQucm9vbSwgbWVzc2FnZTogY2hhdC5tZXNzYWdlLCBzZW5kZXI6IGNoYXQuc2VuZGVyLCB0aW1lc3RhbXA6IGNoYXQudGltZXN0YW1wLCB1cmw6IGNoYXQudXJsIH0pO1xuICAgICAgcmV0dXJuIG5ld0NoYXRNb2RlbDtcbiAgICB9KTtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwudHJpZ2dlcignbW9yZUNoYXRzJywgbW9yZUNoYXRsb2cpO1xuICB9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwibm9Nb3JlQ2hhdHNcIiwgZnVuY3Rpb24oY2hhdGxvZykge1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zdG9wTGlzdGVuaW5nKCdtb3JlQ2hhdHMnKTtcbiAgfSk7XG4gIFxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0Q2hhdHJvb21zXCIsIGZ1bmN0aW9uKHJvb21zKSB7XG4gICAgdmFyIG9sZFJvb21zID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldCgnY2hhdHJvb21zJyk7XG4gICAgdmFyIG5ld1Jvb21zID0gXy5tYXAocm9vbXMsIGZ1bmN0aW9uKHJvb20pIHtcbiAgICAgIHZhciBuZXdDaGF0cm9vbU1vZGVsID0gbmV3IGFwcC5DaGF0cm9vbU1vZGVsKHsgaWQ6IHJvb20uX2lkLCBuYW1lOiByb29tLm5hbWUsIG93bmVyOiByb29tLm93bmVyLCByb29tSW1hZ2U6IHJvb20ucm9vbUltYWdlLCBwcml2YWN5OiByb29tLnByaXZhY3l9KTtcbiAgICAgIHJldHVybiBuZXdDaGF0cm9vbU1vZGVsO1xuICAgIH0pO1xuICAgIG9sZFJvb21zLnJlc2V0KG5ld1Jvb21zKTtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldFByaXZhdGVSb29tc1wiLCBmdW5jdGlvbihyb29tcykge1xuICAgIHZhciBvbGRSb29tcyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoJ3ByaXZhdGVSb29tcycpO1xuICAgIHZhciBuZXdSb29tcyA9IF8ubWFwKHJvb21zLCBmdW5jdGlvbihyb29tKSB7XG4gICAgICB2YXIgbmV3Q2hhdHJvb21Nb2RlbCA9IG5ldyBhcHAuQ2hhdHJvb21Nb2RlbCh7IGlkOiByb29tLl9pZCwgbmFtZTogcm9vbS5uYW1lLCBvd25lcjogcm9vbS5vd25lciwgcm9vbUltYWdlOiByb29tLnJvb21JbWFnZSwgcHJpdmFjeTogcm9vbS5wcml2YWN5LCBjdXJyZW50VXNlcjogcm9vbS5jdXJyZW50VXNlcn0pO1xuICAgICAgcmV0dXJuIG5ld0NoYXRyb29tTW9kZWw7XG4gICAgfSk7XG4gICAgb2xkUm9vbXMucmVzZXQobmV3Um9vbXMpO1xuICB9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0T25saW5lVXNlcnNcIiwgZnVuY3Rpb24ob25saW5lVXNlcnMpIHtcbiAgICB2YXIgb2xkT25saW5lVXNlcnMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KCdvbmxpbmVVc2VycycpO1xuICAgIHZhciB1cGRhdGVkT25saW5lVXNlcnMgPSBfLm1hcChvbmxpbmVVc2VycywgZnVuY3Rpb24odXNlcikge1xuICAgICAgdmFyIG5ld1VzZXJNb2RlbCA9IG5ldyBhcHAuVXNlck1vZGVsKHt1c2VybmFtZTogdXNlci51c2VybmFtZSwgdXNlckltYWdlOiB1c2VyLnVzZXJJbWFnZX0pO1xuICAgICAgcmV0dXJuIG5ld1VzZXJNb2RlbDtcbiAgICB9KTtcbiAgICBvbGRPbmxpbmVVc2Vycy5yZXNldCh1cGRhdGVkT25saW5lVXNlcnMpO1xuICB9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0T2ZmbGluZVVzZXJzXCIsIGZ1bmN0aW9uKG9mZmxpbmVVc2Vycykge1xuICAgIHZhciBvbGRPZmZsaW5lVXNlcnMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KCdvZmZsaW5lVXNlcnMnKTtcbiAgICB2YXIgdXBkYXRlZE9mZmxpbmVVc2VycyA9IF8ubWFwKG9mZmxpbmVVc2VycywgZnVuY3Rpb24odXNlcikge1xuICAgICAgdmFyIG5ld1VzZXJNb2RlbCA9IG5ldyBhcHAuVXNlck1vZGVsKHt1c2VybmFtZTogdXNlci51c2VybmFtZSwgdXNlckltYWdlOiB1c2VyLnVzZXJJbWFnZX0pO1xuICAgICAgcmV0dXJuIG5ld1VzZXJNb2RlbDtcbiAgICB9KTtcbiAgICBvbGRPZmZsaW5lVXNlcnMucmVzZXQodXBkYXRlZE9mZmxpbmVVc2Vycyk7XG4gIH0pO1xuXG5cbi8vIGNoYXRyb29tIGF2YWlsYWJpbGl0eVxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJjaGF0cm9vbUF2YWlsYWJpbGl0eVwiLCBmdW5jdGlvbihhdmFpbGFiaWxpdHkpIHtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwudHJpZ2dlcignY2hhdHJvb21BdmFpbGFiaWxpdHknLCBhdmFpbGFiaWxpdHkpO1xuICB9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwiaG9tZVJvb21BdmFpbGFiaWxpdHlcIiwgZnVuY3Rpb24oYXZhaWxhYmlsaXR5KSB7XG4gICAgc2VsZi5uYXZiYXJWaWV3LnRyaWdnZXIoJ2hvbWVSb29tQXZhaWxhYmlsaXR5JywgYXZhaWxhYmlsaXR5KTtcbiAgfSk7XG5cblxuXG4vLyBlcnJvcnNcblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJjaGF0cm9vbUFscmVhZHlFeGlzdHNcIiwgZnVuY3Rpb24oKSB7XG4gICAgc3dhbCh7XG4gICAgICB0aXRsZTogXCJPSCBOTyBPSCBOTyBPSCBOT1wiLFxuICAgICAgdGV4dDogXCJDaGF0cm9vbSBBbHJlYWR5LCBJdCBBbHJlYWR5IEV4aXN0cyEgQW5kLiBEb24ndCBHbyBJbiBUaGVyZS4gRG9uJ3QuIFlvdS4gWW91IFNob3VsZCBIYXZlLiBJIFRocmV3IFVwIE9uIFRoZSBTZXJ2ZXIuIFRob3NlIFBvb3IgLiAuIC4gVGhleSBXZXJlIEp1c3QhIE9IIE5PIFdIWS4gV0hZIE9IIE5PLiBPSCBOTy5cIixcbiAgICAgIHR5cGU6IFwiZXJyb3JcIixcbiAgICAgIGNvbmZpcm1CdXR0b25Db2xvcjogXCIjNzQ5Q0E4XCJcbiAgICB9KTtcbiAgfSk7XG5cblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJkZXN0cm95Um9vbVJlc3BvbnNlXCIsIGZ1bmN0aW9uKHJlcykge1xuICAgIGlmIChyZXMuZXJyb3IpIHtcbiAgICAgIHN3YWwoe1xuICAgICAgICB0aXRsZTogXCJObyBUb3VjaHkhXCIsXG4gICAgICAgIHRleHQ6IFwiWW91IENhbid0IERlbGV0ZSBZb3VyIEhvbWUgUm9vbSwgTnVoIFVoLiBXaG8gYXJlIHlvdSwgRnJhbnogUmVpY2hlbHQ/XCIsXG4gICAgICAgIHR5cGU6IFwiZXJyb3JcIixcbiAgICAgICAgY29uZmlybUJ1dHRvbkNvbG9yOiBcIiM3NDlDQThcIixcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAocmVzLnN1Y2Nlc3MpIHtcbiAgICAgIHN3YWwoe1xuICAgICAgICB0aXRsZTogXCJFdmlzY2VyYXRlZCFcIixcbiAgICAgICAgdGV4dDogXCJZb3VyIGNoYXRyb29tIGhhcyBiZWVuIHB1cmdlZC5cIixcbiAgICAgICAgdHlwZTogXCJzdWNjZXNzXCIsXG4gICAgICAgIGNvbmZpcm1CdXR0b25Db2xvcjogXCIjNzQ5Q0E4XCIsXG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIERpcmVjdE1lc3NhZ2VcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0RE1jaGF0bG9nXCIsIGZ1bmN0aW9uKGNoYXRsb2cpIHtcbiAgICB2YXIgb2xkQ2hhdGxvZyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoJ2NoYXRsb2cnKTtcbiAgICB2YXIgdXBkYXRlZENoYXRsb2cgPSBfLm1hcChjaGF0bG9nLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgICB2YXIgbmV3Q2hhdE1vZGVsID0gbmV3IGFwcC5DaGF0TW9kZWwoeyByb29tOiBjaGF0LnJvb20sIG1lc3NhZ2U6IGNoYXQubWVzc2FnZSwgc2VuZGVyOiBjaGF0LnNlbmRlciwgdGltZXN0YW1wOiBjaGF0LnRpbWVzdGFtcCwgdXJsOiBjaGF0LnVybCB9KTtcbiAgICAgIHJldHVybiBuZXdDaGF0TW9kZWw7XG4gICAgfSk7XG4gICAgb2xkQ2hhdGxvZy5yZXNldCh1cGRhdGVkQ2hhdGxvZyk7XG5cbiAgICAkKCcjbWVzc2FnZS1pbnB1dCcpLnJlbW92ZUNsYXNzKCdtZXNzYWdlLWlucHV0JykuYWRkQ2xhc3MoJ2RpcmVjdC1tZXNzYWdlLWlucHV0Jyk7XG4gICAgJCgnI2NoYXRJbWFnZVVwbG9hZENvbnRhaW5lcicpLmRhdGEoJ2NoYXQtdHlwZScsICdtZXNzYWdlJyk7XG4gICAgJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRETWhlYWRlclwiLCBmdW5jdGlvbihoZWFkZXIpIHtcbiAgICB2YXIgbmV3SGVhZGVyID0gbmV3IGFwcC5DaGF0cm9vbUhlYWRlck1vZGVsKGhlYWRlcik7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnY2hhdHJvb20nLCBuZXdIZWFkZXIpO1xuICB9KTtcblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJkaXJlY3RNZXNzYWdlUmVjZWl2ZWRcIiwgZnVuY3Rpb24obWVzc2FnZSkge1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5hZGRDaGF0KG1lc3NhZ2UpO1xuICAgICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuICB9KTtcblxuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInVzZXJJbnZpdGVkXCIsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICBjb25zb2xlLmxvZygnbWFpbi5lLnVzZXJJbnZpdGVkOiAnLCB1c2VyKTtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwudHJpZ2dlcigndXNlckludml0ZWQnLCB1c2VyKTtcbiAgfSk7XG5cblxuXG5cblxuXG5cblxuXG59O1xuIiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICAvLyAkKHdpbmRvdykuYmluZCgnYmVmb3JldW5sb2FkJywgZnVuY3Rpb24oZXZlbnRPYmplY3QpIHtcbiAgLy8gICAkLmFqYXgoe1xuICAvLyAgICAgIHVybDogXCIvbG9nb3V0XCIsXG4gIC8vICAgfSk7XG4gIC8vIH0pO1xuXG4gIHZhciBDaGF0cm9vbVJvdXRlciA9IEJhY2tib25lLlJvdXRlci5leHRlbmQoe1xuICAgIFxuICAgIHJvdXRlczoge1xuICAgICAgJyc6ICdzdGFydCcsXG4gICAgICAnbG9nJzogJ2xvZ2luJyxcbiAgICAgICdyZWcnOiAncmVnaXN0ZXInLFxuICAgICAgJ291dCc6ICdvdXQnLFxuICAgICAgJ2F1dGgnOiAnYXV0aGVudGljYXRlZCcsXG4gICAgICAnZmFjZWJvb2snOiAnZmFjZWJvb2snLFxuICAgICAgJ3R3aXR0ZXInOiAndHdpdHRlcidcbiAgICB9LFxuXG4gICAgc3RhcnQ6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICcvIyc7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIgPSBuZXcgYXBwLk1haW5Db250cm9sbGVyKCk7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIuaW5pdCgpO1xuICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9IFxuICAgICAgLy8gZWxzZSB7XG4gICAgICAvLyAgICQuYWpheCh7XG4gICAgICAvLyAgICAgdXJsOiBcIi9sb2dvdXRcIixcbiAgICAgIC8vICAgfSk7XG4gICAgICAvLyB9XG4gICAgfSxcblxuXG4gICAgbG9naW46IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGxvZ2luTW9kZWwgPSBuZXcgYXBwLkxvZ2luTW9kZWwoKTtcbiAgICAgIHZhciBsb2dpblZpZXcgPSBuZXcgYXBwLkxvZ2luVmlldyh7dmVudDogYXBwLm1haW5Db250cm9sbGVyLnZpZXdFdmVudEJ1cywgbW9kZWw6IGxvZ2luTW9kZWx9KTtcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlci5jb250YWluZXJNb2RlbC5zZXQoXCJ2aWV3U3RhdGVcIiwgbG9naW5WaWV3KTtcbiAgICB9LFxuXG4gICAgcmVnaXN0ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHJlZ2lzdGVyVmlldyA9IG5ldyBhcHAuUmVnaXN0ZXJWaWV3KHt2ZW50OiBhcHAubWFpbkNvbnRyb2xsZXIudmlld0V2ZW50QnVzIH0pO1xuICAgICAgYXBwLm1haW5Db250cm9sbGVyLmNvbnRhaW5lck1vZGVsLnNldChcInZpZXdTdGF0ZVwiLCByZWdpc3RlclZpZXcpO1xuICAgIH0sXG5cbiAgICAvLyBvdXQ6IGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgIC8vICAgICAkLmFqYXgoe1xuICAgIC8vICAgICAgIHVybDogXCIvbG9nb3V0XCIsXG4gICAgLy8gICAgIH0pXG4gICAgLy8gfSxcblxuICAgIGF1dGhlbnRpY2F0ZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCFhcHAubWFpbkNvbnRyb2xsZXIpIHtcbiAgICAgICAgdGhpcy5zdGFydCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXBwLm1haW5Db250cm9sbGVyLmF1dGhlbnRpY2F0ZWQoKTtcbiAgICAgIH1cbiAgICAgICAgXG4gICAgfSxcbiAgICBmYWNlYm9vazogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnN0YXJ0KHRoaXMuYXV0aGVudGljYXRlZCk7XG4gICAgfSxcbiAgICB0d2l0dGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuc3RhcnQodGhpcy5hdXRoZW50aWNhdGVkKTtcbiAgICB9LFxuXG4gIH0pO1xuXG4gIGFwcC5DaGF0cm9vbVJvdXRlciA9IG5ldyBDaGF0cm9vbVJvdXRlcigpO1xuICBCYWNrYm9uZS5oaXN0b3J5LnN0YXJ0KCk7XG5cbn0pKCk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9