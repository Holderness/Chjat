
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
	self.hostname = 'https://' + window.location.host;

  // connects to socket, sets response listeners
	self.connect = function() {
    console.log('sc.f.connect');
		// this io might be a little confusing... where is it coming from?
		// it's coming from the static middleware on server.js bc everything
		// in the /public folder has been attached to the server, and visa
		// versa.


    // local
		self.socket = io.connect();

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
  self.logout = function(user) {
    console.log('sc.f.logout: ', user);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYXQuanMiLCJjaGF0cm9vbS1oZWFkZXIuanMiLCJjb250YWluZXIuanMiLCJsb2dpbi5qcyIsInVzZXIuanMiLCJjaGF0cm9vbS5qcyIsImludml0YXRpb24uanMiLCJyb29tLmpzIiwicHJpdmF0ZVJvb20uanMiLCJjaGF0SW1hZ2VVcGxvYWQuanMiLCJjaGF0cm9vbVNldHRpbmdzLmpzIiwiY3JlYXRlQ2hhdHJvb20uanMiLCJuYXZiYXIuanMiLCJyZWdpc3Rlci5qcyIsInNvY2tldGNsaWVudC5qcyIsIm1haW4uanMiLCJyb3V0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FKUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUlUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBRlJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FHVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FKekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBS2xrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FSL0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FTZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBUnJJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FTbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaGFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLkNoYXRDb2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe1xuICAgIG1vZGVsOiBhcHAuQ2hhdE1vZGVsXG4gIH0pO1xuXG59KSgpOyIsIlxudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuQ2hhdHJvb21IZWFkZXJNb2RlbCA9IEJhY2tib25lLk1vZGVsLmV4dGVuZCh7fSk7XG5cbn0pKCk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbiAgYXBwLkNvbnRhaW5lclZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgZWw6ICcjdmlldy1jb250YWluZXInLFxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMubW9kZWwub24oXCJjaGFuZ2U6dmlld1N0YXRlXCIsIHRoaXMucmVuZGVyLCB0aGlzKTtcbiAgICB9LFxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdmlldyA9IHRoaXMubW9kZWwuZ2V0KCd2aWV3U3RhdGUnKTtcbiAgICAgIHRoaXMuJGVsLmh0bWwodmlldy5yZW5kZXIoKS5lbCk7XG4gICAgfVxuICB9KTtcblxufSkoalF1ZXJ5KTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuICBhcHAuTG9naW5WaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIHRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNsb2dpbicpLmh0bWwoKSksXG4gICAgZXJyb3JUZW1wbGF0ZTogXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cImxvZ2luLWVycm9yXCI+PCU9IG1lc3NhZ2UgJT48L2Rpdj4nKSxcbiAgICBldmVudHM6IHtcbiAgICAgICdzdWJtaXQnOiAnb25Mb2dpbicsXG4gICAgICAna2V5cHJlc3MnOiAnb25IaXRFbnRlcidcbiAgICB9LFxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAvLyBMb2dpblZpZXcgZ2V0cyBwYXNzZWQgdGhlIHZpZXdFdmVudEJ1cyB3aGVuIHRoZSBNYWluQ29udHJvbGxlciBpcyBpbml0aWFsaXplZFxuICAgICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xuXG4gICAgLy8gVGhpcyB0ZWxscyB0aGUgdmlldyB0byBsaXN0ZW4gdG8gYW4gZXZlbnQgb24gaXRzIG1vZGVsLFxuICAgIC8vIGlmIHRoZXJlJ3MgYW4gZXJyb3IsIHRoZSBjYWxsYmFjayAodGhpcy5yZW5kZXIpIGlzIGNhbGxlZCB3aXRoIHRoZSAgXG4gICAgLy8gdmlldyBhcyBjb250ZXh0XG4gICAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiY2hhbmdlOmVycm9yXCIsIHRoaXMucmVuZGVyLCB0aGlzKTtcbiAgICB9LFxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUodGhpcy5tb2RlbC50b0pTT04oKSkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBvbkxvZ2luOiBmdW5jdGlvbihlKSB7XG4gICAgICAvLyB0cmlnZ2VycyB0aGUgbG9naW4gZXZlbnQgYW5kIHBhc3NpbmcgdGhlIHVzZXJuYW1lIGRhdGEgdG8ganMvbWFpbi5qc1xuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHZhciBzZW5kRGF0YSA9IHt1c2VybmFtZTogdGhpcy4kKCcjdXNlcm5hbWUnKS52YWwoKSwgcGFzc3dvcmQ6IHRoaXMuJCgnI3Bhc3N3b3JkJykudmFsKCl9O1xuICAgICQuYWpheCh7XG4gICAgICAgIHVybDogXCIvbG9naW5cIixcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGRhdGE6IHNlbmREYXRhLFxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgIGNvbnNvbGUubG9nKCdzdWNjZXNzIGRhdGE6ICcsIGRhdGEpO1xuICAgICAgICAgICBpZiAoZGF0YS5tZXNzYWdlKSB7XG4gICAgICAgICAgICAgdGhpc18ucmVuZGVyVmFsaWRhdGlvbih0aGlzXy5lcnJvclRlbXBsYXRlKGRhdGEpKTtcbiAgICAgICAgICAgfVxuICAgICAgICAgICBlbHNlIGlmIChkYXRhLl9pZCkge1xuICAgICAgICAgICAgYXBwLkNoYXRyb29tUm91dGVyLm5hdmlnYXRlKCdhdXRoJywgeyB0cmlnZ2VyOiB0cnVlIH0pO1xuICAgICAgICAgICAgdGhpc18udmVudC50cmlnZ2VyKFwibG9naW5cIiwgZGF0YSk7XG4gICAgICAgICAgIH1cbiAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnb29wcywgdGhlIGVsc2U6ICcsIGRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSkuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2RvbmVlZWVlZWVlJyk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgfSk7XG4gICAgfSxcbiAgICByZW5kZXJWYWxpZGF0aW9uOiBmdW5jdGlvbih3aGF0KSB7XG4gICAgICAkKCcubG9naW4tZXJyb3ItY29udGFpbmVyJykuZW1wdHkoKTtcbiAgICAgICQod2hhdCkuYXBwZW5kVG8oJCgnLmxvZ2luLWVycm9yLWNvbnRhaW5lcicpKS5oaWRlKCkuZmFkZUluKCk7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAkKCcubG9naW4tZXJyb3ItY29udGFpbmVyJykuY2hpbGRyZW4oKS5maXJzdCgpLmZhZGVPdXQoKTtcbiAgICAgIH0sIDIwMDApO1xuXG4gICAgfVxuICAgIC8vIG9uSGl0RW50ZXI6IGZ1bmN0aW9uKGUpIHtcbiAgICAvLyAgIGlmKGUua2V5Q29kZSA9PSAxMykge1xuICAgIC8vICAgICB0aGlzLm9uTG9naW4oKTtcbiAgICAvLyAgICAgcmV0dXJuIGZhbHNlO1xuICAgIC8vICAgfVxuICAgIC8vIH1cbiAgfSk7XG4gIFxufSkoalF1ZXJ5KTsiLCJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLlVzZXJDb2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe21vZGVsOiBhcHAuVXNlck1vZGVsfSk7XG5cbn0pKCk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbmFwcC5DaGF0cm9vbVZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gIHRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNjaGF0cm9vbS10ZW1wbGF0ZScpLmh0bWwoKSksXG4gIGNoYXRUZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjY2hhdGJveC1tZXNzYWdlLXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgcm9vbVRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoXCIjcm9vbS1saXN0LXRlbXBsYXRlXCIpLmh0bWwoKSksXG4gIGhlYWRlclRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNjaGF0cm9vbS1oZWFkZXItdGVtcGxhdGUnKS5odG1sKCkpLFxuICBkaXJlY3RNZXNzYWdlSGVhZGVyVGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2RpcmVjdC1tZXNzYWdlLWhlYWRlci10ZW1wbGF0ZScpLmh0bWwoKSksXG4gIG9ubGluZVVzZXJUZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjb25saW5lLXVzZXJzLWxpc3QtdGVtcGxhdGUnKS5odG1sKCkpLFxuICBvZmZsaW5lVXNlclRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNvZmZsaW5lLXVzZXJzLWxpc3QtdGVtcGxhdGUnKS5odG1sKCkpLFxuICBkYXRlVGVtcGxhdGU6IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJmb2xsb3dXcmFwXCI+PGRpdiBjbGFzcz1cImZvbGxvd01lQmFyXCI+PHNwYW4+IDwlPSBtb21lbnQodGltZXN0YW1wKS5mb3JtYXQoXCJNTU1NIERvXCIpICU+IDwvc3Bhbj48L2Rpdj48L2Rpdj4nKSxcbiAgZXZlbnRzOiB7XG4gICAgJ2tleXByZXNzIC5tZXNzYWdlLWlucHV0JzogJ21lc3NhZ2VJbnB1dFByZXNzZWQnLFxuICAgICdrZXlwcmVzcyAuZGlyZWN0LW1lc3NhZ2UtaW5wdXQnOiAnZGlyZWN0TWVzc2FnZUlucHV0UHJlc3NlZCcsXG4gICAgJ2NsaWNrIC5jaGF0LWRpcmVjdG9yeSAucm9vbSc6ICdzZXRSb29tJyxcbiAgICAna2V5cHJlc3MgI2NoYXQtc2VhcmNoLWlucHV0JzogJ3NlYXJjaCcsXG4gICAgJ2NsaWNrIC5yZW1vdmUtY2hhdHJvb20nOiAncmVtb3ZlUm9vbScsXG4gICAgJ2NsaWNrIC5kZXN0cm95LWNoYXRyb29tJzogJ2Rlc3Ryb3lSb29tJyxcbiAgICAnY2xpY2sgLmRlc3Ryb3ktdGhpcy1wYXJ0aWN1bGFyLWNoYXRyb29tJzogJ2Rlc3Ryb3lUaGlzUGFydGljdWxhclJvb20nLFxuICAgICdrZXl1cCAjY2hhdHJvb20tbmFtZS1pbnB1dCc6ICdkb2VzQ2hhdHJvb21FeGlzdCcsXG4gICAgJ2NsaWNrIC51c2VyJzogJ2luaXREaXJlY3RNZXNzYWdlJyxcbiAgfSxcblxuXG4gIGRvZXNDaGF0cm9vbUV4aXN0OiBmdW5jdGlvbihlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgdmFyIGNoZWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoJC50cmltKCQoJyNjaGF0cm9vbS1uYW1lLWlucHV0JykudmFsKCkpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIGNoYXRyb29tTmFtZSA9ICQoJyNjaGF0cm9vbS1uYW1lLWlucHV0JykudmFsKCk7XG4gICAgICAgICB0aGlzXy52ZW50LnRyaWdnZXIoJ2RvZXNDaGF0cm9vbUV4aXN0JywgY2hhdHJvb21OYW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICB0aGlzXy4kKCcjY2hhdHJvb20tbmFtZS12YWxpZGF0aW9uLWNvbnRhaW5lcicpLmNoaWxkcmVuKCkucmVtb3ZlKCk7XG4gICAgICAgICB0aGlzXy4kKCcjY2hhdHJvb20tbmFtZS1pbnB1dCcpLnJlbW92ZUNsYXNzKCdpbnB1dC12YWxpZCBpbnB1dC1pbnZhbGlkJyk7XG4gICAgICB9XG4gICAgfTtcbiAgICBfLmRlYm91bmNlKGNoZWNrKCksIDE1MCk7XG4gIH0sXG5cbiAgcmVuZGVyQ2hhdHJvb21BdmFpbGFiaWxpdHk6IGZ1bmN0aW9uKGF2YWlsYWJpbGl0eSkge1xuICAgIHRoaXMuY3JlYXRlQ2hhdHJvb21WaWV3LnRyaWdnZXIoJ2NoYXRyb29tQXZhaWxhYmlsaXR5JywgYXZhaWxhYmlsaXR5KTtcbiAgfSxcblxuXG5cbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIGNvbnNvbGUubG9nKCdjaGF0cm9vbVZpZXcuZi5pbml0aWFsaXplOiAnLCBvcHRpb25zKTtcbiAgICAvLyBwYXNzZWQgdGhlIHZpZXdFdmVudEJ1c1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XG4gIH0sXG4gIHJlbmRlcjogZnVuY3Rpb24obW9kZWwpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYucmVuZGVyJyk7XG4gICAgdGhpcy5tb2RlbCA9IG1vZGVsIHx8IHRoaXMubW9kZWw7XG4gICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKHRoaXMubW9kZWwudG9KU09OKCkpKTtcbiAgICB0aGlzLmFmdGVyUmVuZGVyKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIGFmdGVyUmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNldFN1YlZpZXdzKCk7XG4gICAgdGhpcy5zZXRDaGF0TGlzdGVuZXJzKCk7XG4gICAgdGhpcy5jaGF0cm9vbVNlYXJjaFR5cGVhaGVhZCgpO1xuICB9LFxuICBzZXRTdWJWaWV3czogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jaGF0SW1hZ2VVcGxvYWRWaWV3ID0gbmV3IGFwcC5DaGF0SW1hZ2VVcGxvYWRWaWV3KCk7XG4gICAgdGhpcy5jaGF0SW1hZ2VVcGxvYWRWaWV3LnNldEVsZW1lbnQodGhpcy4kKCcjY2hhdEltYWdlVXBsb2FkQ29udGFpbmVyJykpO1xuICAgIHRoaXMuY3JlYXRlQ2hhdHJvb21WaWV3ID0gbmV3IGFwcC5DcmVhdGVDaGF0cm9vbVZpZXcoe3ZlbnQ6IHRoaXMudmVudH0pO1xuICAgIHRoaXMuY3JlYXRlQ2hhdHJvb21WaWV3LnNldEVsZW1lbnQodGhpcy4kKCcjY3JlYXRlQ2hhdHJvb21Db250YWluZXInKSk7XG4gIH0sXG4gIHNldENoYXRMaXN0ZW5lcnM6IGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIG9ubGluZVVzZXJzID0gdGhpcy5tb2RlbC5nZXQoJ29ubGluZVVzZXJzJyk7XG4gICAgdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJhZGRcIiwgdGhpcy5yZW5kZXJVc2VyLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKG9ubGluZVVzZXJzLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlclVzZXJzLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKG9ubGluZVVzZXJzLCBcInJlc2V0XCIsIHRoaXMucmVuZGVyVXNlcnMsIHRoaXMpO1xuXG4gICAgdmFyIG9mZmxpbmVVc2VycyA9IHRoaXMubW9kZWwuZ2V0KCdvZmZsaW5lVXNlcnMnKTtcbiAgICB0aGlzLmxpc3RlblRvKG9mZmxpbmVVc2VycywgXCJhZGRcIiwgdGhpcy5yZW5kZXJPZmZsaW5lVXNlciwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhvZmZsaW5lVXNlcnMsIFwicmVtb3ZlXCIsIHRoaXMucmVuZGVyT2ZmbGluZVVzZXJzLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKG9mZmxpbmVVc2VycywgXCJyZXNldFwiLCB0aGlzLnJlbmRlck9mZmxpbmVVc2VycywgdGhpcyk7XG5cbiAgICB2YXIgY2hhdGxvZyA9IHRoaXMubW9kZWwuZ2V0KCdjaGF0bG9nJyk7XG4gICAgdGhpcy5saXN0ZW5UbyhjaGF0bG9nLCBcImFkZFwiLCB0aGlzLnJlbmRlckNoYXQsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdGxvZywgXCJyZW1vdmVcIiwgdGhpcy5yZW5kZXJDaGF0cywgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhjaGF0bG9nLCBcInJlc2V0XCIsIHRoaXMucmVuZGVyQ2hhdHMsIHRoaXMpO1xuXG4gICAgdmFyIGNoYXRyb29tcyA9IHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbXMnKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRyb29tcywgXCJhZGRcIiwgdGhpcy5yZW5kZXJSb29tLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRyb29tcywgXCJyZW1vdmVcIiwgdGhpcy5yZW5kZXJSb29tcywgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhjaGF0cm9vbXMsIFwicmVzZXRcIiwgdGhpcy5yZW5kZXJSb29tcywgdGhpcyk7XG5cbiAgICB2YXIgcHJpdmF0ZVJvb21zID0gdGhpcy5tb2RlbC5nZXQoJ3ByaXZhdGVSb29tcycpO1xuICAgIHRoaXMubGlzdGVuVG8ocHJpdmF0ZVJvb21zLCBcImFkZFwiLCB0aGlzLnJlbmRlclByaXZhdGVSb29tLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKHByaXZhdGVSb29tcywgXCJyZW1vdmVcIiwgdGhpcy5yZW5kZXJQcml2YXRlUm9vbXMsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8ocHJpdmF0ZVJvb21zLCBcInJlc2V0XCIsIHRoaXMucmVuZGVyUHJpdmF0ZVJvb21zLCB0aGlzKTtcblxuICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJjaGFuZ2U6Y2hhdHJvb21cIiwgdGhpcy5yZW5kZXJIZWFkZXIsIHRoaXMpO1xuXG4gICAgdGhpcy5saXN0ZW5Ubyh0aGlzLmNoYXRJbWFnZVVwbG9hZFZpZXcsICdjaGF0LWltYWdlLXVwbG9hZGVkJywgdGhpcy5jaGF0VXBsb2FkSW1hZ2UpO1xuICAgIHRoaXMubGlzdGVuVG8odGhpcy5jaGF0SW1hZ2VVcGxvYWRWaWV3LCAnbWVzc2FnZS1pbWFnZS11cGxvYWRlZCcsIHRoaXMubWVzc2FnZVVwbG9hZEltYWdlKTtcbiAgICAvLyB0aGlzLmxpc3RlblRvKHRoaXMuY3JlYXRlQ2hhdHJvb21WaWV3LCAnY3JlYXRlUm9vbScsIHRoaXMuY3JlYXRlUm9vbSk7XG5cbiAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwibW9yZUNoYXRzXCIsIHRoaXMucmVuZGVyTW9yZUNoYXRzLCB0aGlzKTtcblxuICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJ1c2VySW52aXRlZFwiLCB0aGlzLnVzZXJJbnZpdGVkLCB0aGlzKTtcblxuICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJjaGF0cm9vbUF2YWlsYWJpbGl0eVwiLCB0aGlzLnJlbmRlckNoYXRyb29tQXZhaWxhYmlsaXR5LCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiaG9tZVJvb21BdmFpbGFiaWxpdHlcIiwgdGhpcy5yZW5kZXJIb21lUm9vbUF2YWlsYWJpbGl0eSwgdGhpcyk7XG5cbiAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgIHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpLnNjcm9sbChmdW5jdGlvbigpe1xuICAgICAgICAvLyBjaGVja3MgaWYgdGhlcmUncyBlbm91Z2ggY2hhdHMgdG8gd2FycmFudCBhIGdldE1vcmVDaGF0cyBjYWxsXG4gICAgICBpZiAoJCgnI2NoYXRib3gtY29udGVudCcpLnNjcm9sbFRvcCgpID09PSAwICYmIHRoaXNfLm1vZGVsLmdldCgnY2hhdGxvZycpLmxlbmd0aCA+PSAyNSkge1xuICAgICAgICBpZiAodGhpc18ubW9kZWwuZ2V0KCdjaGF0cm9vbScpLmdldCgnY2hhdFR5cGUnKSA9PT0gJ21lc3NhZ2UnKSB7XG4gICAgICAgICAgXy5kZWJvdW5jZSh0aGlzXy5nZXRNb3JlRGlyZWN0TWVzc2FnZXMoKSwgMzAwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgXy5kZWJvdW5jZSh0aGlzXy5nZXRNb3JlQ2hhdHMoKSwgMzAwMCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgICAgICQod2luZG93KS5yZXNpemUoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB3aW5kb3dIZWlnaHQgPSAkKHdpbmRvdykuaGVpZ2h0KCk7XG4gICAgICAgIGlmICh3aW5kb3dIZWlnaHQgPiA1MDApIHtcbiAgICAgICAgICB2YXIgbmV3SGVpZ2h0ID0gd2luZG93SGVpZ2h0IC0gMjg1O1xuICAgICAgICAgICQoJyNjaGF0Ym94LWNvbnRlbnQnKS5oZWlnaHQobmV3SGVpZ2h0KTtcbiAgICAgICAgfVxuXG4gICAgICAgfSk7XG4gIH0sXG5cblxuICBjaGF0cm9vbVNlYXJjaFR5cGVhaGVhZDogZnVuY3Rpb24oKSB7XG4gICAgLy8gaW50ZXJlc3RpbmcgLSB0aGUgJ3RoaXMnIG1ha2VzIGEgZGlmZmVyZW5jZSwgY2FuJ3QgZmluZCAjY2hhdC1zZWFyY2gtaW5wdXQgb3RoZXJ3aXNlXG4gICAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgICAgdmFyIGJsb29kID0gbmV3IEJsb29kaG91bmQoe1xuICAgICAgICBkYXR1bVRva2VuaXplcjogQmxvb2Rob3VuZC50b2tlbml6ZXJzLm9iai53aGl0ZXNwYWNlKCduYW1lJyksXG4gICAgICAgIHF1ZXJ5VG9rZW5pemVyOiBCbG9vZGhvdW5kLnRva2VuaXplcnMud2hpdGVzcGFjZSxcbiAgICAgICAgcHJlZmV0Y2g6IHtcbiAgICAgICAgICB1cmw6ICcvYXBpL3B1YmxpY0NoYXRyb29tcycsXG4gICAgICAgICAgZmlsdGVyOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgcmV0dXJuIF8ubWFwKGRhdGEsIGZ1bmN0aW9uKGNoYXRyb29tKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgbmFtZTogY2hhdHJvb20gfTtcbiAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHR0bDogMCxcbiAgICAgICAgfSxcbiAgICAgICAgcmVtb3RlOiB7XG4gICAgICAgICAgdXJsOiAnL2FwaS9zZWFyY2hDaGF0cm9vbXM/bmFtZT0lUVVFUlknLFxuICAgICAgICAgIHdpbGRjYXJkOiAnJVFVRVJZJyxcbiAgICAgICAgICByYXRlTGltaXRXYWl0OiAzMDAsXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgYmxvb2QuY2xlYXJQcmVmZXRjaENhY2hlKCk7XG4gICAgICBibG9vZC5pbml0aWFsaXplKCk7XG4gICAgICB2YXIgdHlwZSA9ICB0aGlzLiQoJyNjaGF0LXNlYXJjaC1pbnB1dCcpLnR5cGVhaGVhZCh7XG4gICAgICAgIG1pbkxlbmd0aDogMixcbiAgICAgICAgY2xhc3NOYW1lczoge1xuICAgICAgICAgIGlucHV0OiAndHlwZWFoZWFkLWlucHV0JyxcbiAgICAgICAgICBoaW50OiAndHlwZWFoZWFkLWhpbnQnLFxuICAgICAgICAgIHNlbGVjdGFibGU6ICd0eXBlYWhlYWQtc2VsZWN0YWJsZScsXG4gICAgICAgICAgbWVudTogJ3R5cGVhaGVhZC1tZW51JyxcbiAgICAgICAgICBoaWdobGlnaHQ6ICd0eXBlYWhlYWQtaGlnaGxpZ2h0JyxcbiAgICAgICAgICBkYXRhc2V0OiAndHlwZWFoZWFkLWRhdGFzZXQnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbGltaXQ6IDUsXG4gICAgICAgIHNvdXJjZTogYmxvb2QsXG4gICAgICAgIG5hbWU6ICdjaGF0cm9vbS1zZWFyY2gnLFxuICAgICAgICBkaXNwbGF5OiAnbmFtZScsXG4gICAgICB9KS5vbigndHlwZWFoZWFkOnNlbGVjdCB0eXBlYWhlYWQ6YXV0b2NvbXBsZXRlJywgZnVuY3Rpb24ob2JqKSB7XG5cbiAgICAgIH0pO1xuICB9LFxuXG5cblxuLy8gaGVhZGVyc1xuXG4gIHJlbmRlckhlYWRlcjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy4kKCcjY2hhdGJveC1oZWFkZXInKS5odG1sKHRoaXMuaGVhZGVyVGVtcGxhdGUodGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tJykudG9KU09OKCkpKTtcbiAgICB0aGlzLmNoYXRyb29tU2V0dGluZ3NWaWV3ID0gbmV3IGFwcC5DaGF0cm9vbVNldHRpbmdzVmlldyh7dmVudDogdGhpcy52ZW50LCBtb2RlbDogdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tJyl9KTtcbiAgICB0aGlzLmNoYXRyb29tU2V0dGluZ3NWaWV3LnNldEVsZW1lbnQodGhpcy4kKCcjY2hhdHJvb20taGVhZGVyLWNvbnRhaW5lcicpKTtcbiAgICB0aGlzLmxpc3RlblRvKHRoaXMuY2hhdHJvb21TZXR0aW5nc1ZpZXcsICd1cGRhdGVSb29tJywgdGhpcy51cGRhdGVSb29tKTtcbiAgfSxcblxuICByZW5kZXJEaXJlY3RNZXNzYWdlSGVhZGVyOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLiQoJyNjaGF0Ym94LWhlYWRlcicpLmh0bWwodGhpcy5kaXJlY3RNZXNzYWdlSGVhZGVyVGVtcGxhdGUodGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tJykudG9KU09OKCkpKTtcbiAgfSxcblxuICB1c2VySW52aXRlZDogZnVuY3Rpb24oZGF0YSkge1xuICAgIHRoaXMuY2hhdHJvb21TZXR0aW5nc1ZpZXcudHJpZ2dlcigndXNlckludml0ZWQnLCBkYXRhKTtcbiAgfSxcblxuXG5cblxuLy8gdXNlcnNcblxuICByZW5kZXJVc2VyczogZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlclVzZXJzJyk7XG4gICAgb25saW5lVXNlcnMgPSB0aGlzLm1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpO1xuICAgIGNvbnNvbGUubG9nKCdVU0VSUzogJywgb25saW5lVXNlcnMpO1xuICAgIHRoaXMuJCgnLm9ubGluZS11c2VycycpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoXCJvbmxpbmVVc2Vyc1wiKS5lYWNoKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICB0aGlzLnJlbmRlclVzZXIodXNlcik7XG4gICAgfSwgdGhpcyk7XG4gIH0sXG4gIHJlbmRlclVzZXI6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdGhpcy4kKCcub25saW5lLXVzZXJzJykuYXBwZW5kKHRoaXMub25saW5lVXNlclRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gIH0sXG4gIHJlbmRlck9mZmxpbmVVc2VyczogZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlck9mZmxpbmVVc2VycycpO1xuICAgIGNvbnNvbGUubG9nKCdPZmZsaW5lIFVTRVJTOiAnLCB0aGlzLm1vZGVsLmdldChcIm9mZmxpbmVVc2Vyc1wiKSk7XG4gICAgdGhpcy4kKCcub2ZmbGluZS11c2VycycpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoXCJvZmZsaW5lVXNlcnNcIikuZWFjaChmdW5jdGlvbiAodXNlcikge1xuICAgICAgdGhpcy5yZW5kZXJPZmZsaW5lVXNlcih1c2VyKTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyT2ZmbGluZVVzZXI6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdGhpcy4kKCcub2ZmbGluZS11c2VycycpLmFwcGVuZCh0aGlzLm9mZmxpbmVVc2VyVGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgfSxcblxuXG5cblxuXG4vLyBjaGF0bG9nXG5cbiAgcmVuZGVyQ2hhdHM6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5yZW5kZXJDaGF0cycpO1xuICAgIHZhciBjaGF0bG9nID0gdGhpcy5tb2RlbC5nZXQoXCJjaGF0bG9nXCIpO1xuICAgIGNvbnNvbGUubG9nKCdDSEFUTE9HOiAnLCBjaGF0bG9nKTtcbiAgICB0aGlzLiQoJyNjaGF0Ym94LWNvbnRlbnQnKS5lbXB0eSgpO1xuICAgIGNoYXRsb2cuZWFjaChmdW5jdGlvbihjaGF0KSB7XG4gICAgICB0aGlzLnJlbmRlckNoYXQoY2hhdCk7XG4gICAgfSwgdGhpcyk7XG4gICAgaWYgKCBjaGF0bG9nLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY2hhdGxvZy5wdXNoKG5ldyBhcHAuQ2hhdE1vZGVsKHsgc2VuZGVyOiAnQ2hqYXQnLCBtZXNzYWdlOiBcIsKvXFxcXF8o44OEKV8vwq9cIiwgdGltZXN0YW1wOiBfLm5vdygpLCB1cmw6ICcnfSkpO1xuICAgIH1cbiAgICB0aGlzLmFmdGVyQ2hhdHNSZW5kZXIoKTtcbiAgfSxcblxuICByZW5kZXJDaGF0OiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHRoaXMucmVuZGVyRGF0ZURpdmlkZXJzKG1vZGVsKTtcbiAgICB2YXIgY2hhdFRlbXBsYXRlID0gJCh0aGlzLmNoYXRUZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICAgIGNoYXRUZW1wbGF0ZS5hcHBlbmRUbyh0aGlzLiQoJyNjaGF0Ym94LWNvbnRlbnQnKSkuaGlkZSgpLmZhZGVJbigpLnNsaWRlRG93bigpO1xuICAgICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuICB9LFxuXG4gIHJlbmRlckRhdGVEaXZpZGVyczogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB0aGlzLmN1cnJlbnREYXRlID0gbW9tZW50KG1vZGVsLmdldCgndGltZXN0YW1wJykpLmZvcm1hdCgnZGRkZCwgTU1NTSBEbyBZWVlZJyk7XG4gICAgaWYgKCB0aGlzLmN1cnJlbnREYXRlICE9PSB0aGlzLnByZXZpb3VzRGF0ZSApIHtcbiAgICAgIHZhciBjdXJyZW50RGF0ZSA9ICQodGhpcy5kYXRlVGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICAgIGN1cnJlbnREYXRlLmFwcGVuZFRvKHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpKS5oaWRlKCkuZmFkZUluKCkuc2xpZGVEb3duKCk7XG4gICAgICB0aGlzLnByZXZpb3VzRGF0ZSA9IHRoaXMuY3VycmVudERhdGU7XG4gICAgfVxuICB9LFxuXG4gIGdldE1vcmVDaGF0czogZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLmdldE1vcmVDaGF0cycpO1xuICAgIHZhciBjaGF0cm9vbSA9IHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbScpLFxuICAgIG5hbWUgPSBjaGF0cm9vbS5nZXQoJ25hbWUnKSxcbiAgICBtb2RlbHNMb2FkZWRTdW0gPSBjaGF0cm9vbS5nZXQoJ21vZGVsc0xvYWRlZFN1bScpO1xuICAgIHZhciBjaGF0bG9nTGVuZ3RoID0gY2hhdHJvb20uZ2V0KCdjaGF0bG9nTGVuZ3RoJyk7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoJ2dldE1vcmVDaGF0cycsIHsgbmFtZTogbmFtZSwgbW9kZWxzTG9hZGVkU3VtOiBtb2RlbHNMb2FkZWRTdW0sIGNoYXRsb2dMZW5ndGg6IGNoYXRsb2dMZW5ndGh9KTtcbiAgICBjaGF0cm9vbS5zZXQoJ21vZGVsc0xvYWRlZFN1bScsIChtb2RlbHNMb2FkZWRTdW0gLSAxKSk7XG4gIH0sXG5cbiAgZ2V0TW9yZURpcmVjdE1lc3NhZ2VzOiBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYuZ2V0TW9yZURyaWVjdE1lc3NhZ2VzJyk7XG4gICAgdmFyIGNoYXRyb29tID0gdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tJyksXG4gICAgaWQgPSBjaGF0cm9vbS5nZXQoJ2lkJyksXG4gICAgbW9kZWxzTG9hZGVkU3VtID0gY2hhdHJvb20uZ2V0KCdtb2RlbHNMb2FkZWRTdW0nKTtcbiAgICB2YXIgY2hhdGxvZ0xlbmd0aCA9IGNoYXRyb29tLmdldCgnY2hhdGxvZ0xlbmd0aCcpO1xuICAgIHRoaXMudmVudC50cmlnZ2VyKCdnZXRNb3JlRGlyZWN0TWVzc2FnZXMnLCB7IGlkOiBpZCwgbW9kZWxzTG9hZGVkU3VtOiBtb2RlbHNMb2FkZWRTdW0sIGNoYXRsb2dMZW5ndGg6IGNoYXRsb2dMZW5ndGh9KTtcbiAgICBjaGF0cm9vbS5zZXQoJ21vZGVsc0xvYWRlZFN1bScsIChtb2RlbHNMb2FkZWRTdW0gLSAxKSk7XG4gIH0sXG5cbiAgcmVuZGVyTW9yZUNoYXRzOiBmdW5jdGlvbihjaGF0cykge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5yZW5kZXJNb3JlQ2hhdHMnKTtcbiAgICAvLyB0aGlzLiQoJyNjaGF0Ym94LWNvbnRlbnQnKTtcbiAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgIHZhciBvcmlnaW5hbEhlaWdodCA9ICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG4gICAgdGhpcy5tb3JlQ2hhdENvbGxlY3Rpb24gPSBbXTtcbiAgICBfLmVhY2goY2hhdHMsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICB0aGlzXy5yZW5kZXJNb3JlRGF0ZURpdmlkZXJzKG1vZGVsKTtcbiAgICAgIHZhciBjaGF0VGVtcGxhdGUgPSAkKHRoaXMuY2hhdFRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gICAgICB0aGlzXy5tb3JlQ2hhdENvbGxlY3Rpb24ucHVzaChjaGF0VGVtcGxhdGUpO1xuICAgICAgLy8gY2hhdFRlbXBsYXRlLnByZXBlbmRUbyh0aGlzLiQoJyNjaGF0Ym94LWNvbnRlbnQnKSkuaGlkZSgpLmZhZGVJbigpLnNsaWRlRG93bigpO1xuICAgIH0sIHRoaXMpO1xuICAgIF8uZWFjaCh0aGlzLm1vcmVDaGF0Q29sbGVjdGlvbi5yZXZlcnNlKCksIGZ1bmN0aW9uKHRlbXBsYXRlKSB7XG4gICAgICB0ZW1wbGF0ZS5wcmVwZW5kVG8odGhpcy4kKCcjY2hhdGJveC1jb250ZW50JykpO1xuICAgIH0pO1xuXG4gICAgIHRoaXMuZGF0ZURpdmlkZXIubG9hZCgkKFwiLmZvbGxvd01lQmFyXCIpKTtcbiAgICAgJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQgLSBvcmlnaW5hbEhlaWdodDtcbiAgICAgXG4gIH0sXG5cbiAgcmVuZGVyTW9yZURhdGVEaXZpZGVyczogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB0aGlzLmN1cnJlbnREYXRlID0gbW9tZW50KG1vZGVsLmF0dHJpYnV0ZXMudGltZXN0YW1wKS5mb3JtYXQoJ2RkZGQsIE1NTU0gRG8gWVlZWScpO1xuICAgIGlmICggdGhpcy5jdXJyZW50RGF0ZSAhPT0gdGhpcy5wcmV2aW91c0RhdGUgKSB7XG4gICAgICB2YXIgY3VycmVudERhdGUgPSAkKHRoaXMuZGF0ZVRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gICAgICAvLyBjdXJyZW50RGF0ZS5hcHBlbmRUbyh0aGlzLiQoJyNjaGF0Ym94LWNvbnRlbnQnKSkuaGlkZSgpLmZhZGVJbigpLnNsaWRlRG93bigpO1xuICAgICAgdGhpcy5tb3JlQ2hhdENvbGxlY3Rpb24ucHVzaChjdXJyZW50RGF0ZSk7XG4gICAgICB0aGlzLnByZXZpb3VzRGF0ZSA9IHRoaXMuY3VycmVudERhdGU7XG4gICAgfVxuICB9LFxuXG4gIGF1dG9zaXplcjogZnVuY3Rpb24oKSB7XG4gICAgYXV0b3NpemUoJCgnI21lc3NhZ2UtaW5wdXQnKSk7XG4gIH0sXG4gIFxuICBzY3JvbGxCb3R0b21JbnN1cmFuY2U6IGZ1bmN0aW9uKCl7XG4gICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICB2YXIgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpe1xuICAgICAgdGhpcy4kKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gdGhpcy4kKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuICAgIH0sIDUwKTtcbiAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgfSwgODAwKTtcbiAgfSxcblxuICBhZnRlckNoYXRzUmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmF1dG9zaXplcigpO1xuICAgIHRoaXMuZGF0ZURpdmlkZXIubG9hZCgkKFwiLmZvbGxvd01lQmFyXCIpKTtcbiAgICB0aGlzLnNjcm9sbEJvdHRvbUluc3VyYW5jZSgpO1xuICB9LFxuXG5cblxuXG5cblxuXG5cbi8vIHJvb21zXG5cblxuICBzZWFyY2g6IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMyAmJiAkLnRyaW0oJCgnI2NoYXQtc2VhcmNoLWlucHV0JykudmFsKCkpLmxlbmd0aCA+IDApIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHZhciBuYW1lID0gJCgnI2NoYXQtc2VhcmNoLWlucHV0JykudmFsKCk7XG4gICAgICB0aGlzLmFkZENoYXRyb29tKG5hbWUpO1xuICAgICAgdGhpcy4kKCcjY2hhdC1zZWFyY2gtaW5wdXQnKS52YWwoJycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZygnc2VhcmNoIHR5cGluZycpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgY3JlYXRlUm9vbTogZnVuY3Rpb24oZm9ybSkge1xuICAgIHRoaXMudmVudC50cmlnZ2VyKCdjcmVhdGVSb29tJywgZm9ybSk7XG4gIH0sXG4gIHVwZGF0ZVJvb206IGZ1bmN0aW9uKGZvcm0pIHtcbiAgICB2YXIgaWQgPSB0aGlzLm1vZGVsLmdldCgnY2hhdHJvb20nKS5nZXQoJ2lkJyk7XG4gICAgZm9ybS5pZCA9IGlkO1xuICAgIHRoaXMudmVudC50cmlnZ2VyKCd1cGRhdGVSb29tJywgZm9ybSk7XG4gIH0sXG4gIGRlc3Ryb3lSb29tOiBmdW5jdGlvbihlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZhciByb29tTmFtZSA9IHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbScpLmdldCgnbmFtZScpO1xuICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgdmFyIGNvbmZpcm1hdGlvbiA9IHN3YWwoe1xuICAgICAgdGl0bGU6IFwiRG8geW91IHdpc2ggdG8gZGVzdHJveSBcIiArIHJvb21OYW1lICsgXCI/XCIsXG4gICAgICB0ZXh0OiBcIlRoaXMga2lsbHMgdGhlIHJvb20uXCIsXG4gICAgICB0eXBlOiBcIndhcm5pbmdcIixcbiAgICAgIHNob3dDYW5jZWxCdXR0b246IHRydWUsXG4gICAgICBjb25maXJtQnV0dG9uQ29sb3I6IFwiI0RFQjBCMFwiLFxuICAgICAgY29uZmlybUJ1dHRvblRleHQ6IFwiTXVhaGFoYSFcIixcbiAgICAgIGNsb3NlT25Db25maXJtOiBmYWxzZSxcbiAgICAgIGh0bWw6IGZhbHNlXG4gICAgfSwgZnVuY3Rpb24oKXtcbiAgICAgIHZhciByb29tSWQgPSB0aGlzXy5tb2RlbC5nZXQoJ2NoYXRyb29tJykuaWQ7XG4gICAgICB2YXIgdXNlckluUm9vbSA9IHRydWU7XG4gICAgICB0aGlzXy52ZW50LnRyaWdnZXIoJ2Rlc3Ryb3lSb29tJywgeyBpZDogcm9vbUlkLCByb29tTmFtZTogcm9vbU5hbWUsIHVzZXJJblJvb206IHVzZXJJblJvb20gfSk7XG4gICAgfSk7XG4gIH0sXG4gIGRlc3Ryb3lUaGlzUGFydGljdWxhclJvb206IGZ1bmN0aW9uKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgdmFyIHJvb21OYW1lID0gJChlLnRhcmdldCkuZGF0YShcInJvb20tbmFtZVwiKTtcbiAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgIHZhciBjb25maXJtYXRpb24gPSBzd2FsKHtcbiAgICAgIHRpdGxlOiBcIkRvIHlvdSB3aXNoIHRvIGRlc3Ryb3kgXCIgKyByb29tTmFtZSArIFwiP1wiLFxuICAgICAgdGV4dDogXCJUaGlzIGtpbGxzIHRoZSByb29tLlwiLFxuICAgICAgdHlwZTogXCJ3YXJuaW5nXCIsXG4gICAgICBzaG93Q2FuY2VsQnV0dG9uOiB0cnVlLFxuICAgICAgY29uZmlybUJ1dHRvbkNvbG9yOiBcIiNERUIwQjBcIixcbiAgICAgIGNvbmZpcm1CdXR0b25UZXh0OiBcIk11YWhhaGEhXCIsXG4gICAgICBjbG9zZU9uQ29uZmlybTogZmFsc2UsXG4gICAgICBodG1sOiBmYWxzZVxuICAgIH0sIGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgY3VycmVudFJvb21JZCA9IHRoaXNfLm1vZGVsLmdldCgnY2hhdHJvb20nKS5pZDtcbiAgICAgIHZhciByb29tSWQgPSAkKGUudGFyZ2V0KS5kYXRhKFwicm9vbS1pZFwiKTtcbiAgICAgIHZhciB1c2VySW5Sb29tID0gY3VycmVudFJvb21JZCA9PT0gcm9vbUlkO1xuICAgICAgdGhpc18udmVudC50cmlnZ2VyKCdkZXN0cm95Um9vbScsIHsgaWQ6IHJvb21JZCwgcm9vbU5hbWU6IHJvb21OYW1lLCB1c2VySW5Sb29tOiB1c2VySW5Sb29tIH0pO1xuICAgIH0pO1xuICB9LFxuICBhZGRDaGF0cm9vbTogZnVuY3Rpb24obmFtZSkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5hZGRDaGF0cm9vbScpO1xuICAgIHRoaXMudmVudC50cmlnZ2VyKCdhZGRSb29tJywgbmFtZSk7XG4gIH0sXG4gIHJlbW92ZVJvb206IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgIHZhciBjb25maXJtYXRpb24gPSBzd2FsKHtcbiAgICAgIHRpdGxlOiBcIlJlbW92ZSBUaGlzIFJvb20/XCIsXG4gICAgICB0ZXh0OiBcIkFyZSB5b3Ugc3VyZT8gQXJlIHlvdSBzdXJlIHlvdSdyZSBzdXJlPyBIb3cgc3VyZSBjYW4geW91IGJlP1wiLFxuICAgICAgdHlwZTogXCJ3YXJuaW5nXCIsXG4gICAgICBzaG93Q2FuY2VsQnV0dG9uOiB0cnVlLFxuICAgICAgY29uZmlybUJ1dHRvbkNvbG9yOiBcIiNERUIwQjBcIixcbiAgICAgIGNvbmZpcm1CdXR0b25UZXh0OiBcIk11YWhhaGEhXCIsXG4gICAgICBjbG9zZU9uQ29uZmlybTogZmFsc2UsXG4gICAgICBodG1sOiBmYWxzZVxuICAgIH0sIGZ1bmN0aW9uKCl7XG4gICAgICBzd2FsKHtcbiAgICAgICAgdGl0bGU6IFwiUmVtb3ZlZCFcIixcbiAgICAgICAgdGV4dDogXCJZb3UgYXJlIGZyZWUgb2YgdGhpcyBjaGF0cm9vbS4gR28gb24sIHlvdSdyZSBmcmVlIG5vdy5cIixcbiAgICAgICAgdHlwZTogXCJzdWNjZXNzXCIsXG4gICAgICAgIGNvbmZpcm1CdXR0b25Db2xvcjogXCIjNzQ5Q0E4XCJcbiAgICAgIH0pO1xuICAgICAgdmFyIGN1cnJlbnRSb29tSWQgPSB0aGlzXy5tb2RlbC5nZXQoJ2NoYXRyb29tJykuaWQ7XG4gICAgICB2YXIgcm9vbUlkID0gJChlLnRhcmdldCkuZGF0YShcInJvb20taWRcIik7XG4gICAgICB2YXIgcm9vbU5hbWUgPSAkKGUudGFyZ2V0KS5kYXRhKFwicm9vbS1uYW1lXCIpO1xuICAgICAgdmFyIHVzZXJJblJvb20gPSBjdXJyZW50Um9vbUlkID09PSByb29tSWQ7XG4gICAgICB0aGlzXy52ZW50LnRyaWdnZXIoJ3JlbW92ZVJvb20nLCB7aWQ6IHJvb21JZCwgcm9vbU5hbWU6IHJvb21OYW1lLCB1c2VySW5Sb29tOiB1c2VySW5Sb29tfSk7XG4gICAgfSk7XG4gIH0sXG4gIHJlbmRlclJvb21zOiBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYucmVuZGVyUm9vbXMnKTtcbiAgICBjb25zb2xlLmxvZygnQ0hBVFJPT01TOiAnLCB0aGlzLm1vZGVsLmdldChcImNoYXRyb29tc1wiKSk7XG4gICAgdGhpcy4kKCcjcHVibGljLXJvb21zJykuZW1wdHkoKTtcbiAgICB0aGlzLm1vZGVsLmdldCgnY2hhdHJvb21zJykuZWFjaChmdW5jdGlvbiAocm9vbSkge1xuICAgICAgdGhpcy5yZW5kZXJSb29tKHJvb20pO1xuICAgIH0sIHRoaXMpO1xuICB9LFxuICByZW5kZXJSb29tOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHZhciBuYW1lMSA9IG1vZGVsLmdldCgnbmFtZScpLFxuICAgIG5hbWUyID0gdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tJykuZ2V0KCduYW1lJyk7XG4gICAgdGhpcy4kKCcjcHVibGljLXJvb21zJykuYXBwZW5kKHRoaXMucm9vbVRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gICAgaWYgKG5hbWUxID09PSBuYW1lMikge1xuICAgICAgdGhpcy4kKCcjcHVibGljLXJvb21zJykuZmluZCgnLnJvb20tbmFtZScpLmxhc3QoKS5hZGRDbGFzcygnYWN0aXZlJykuZmFkZUluKCk7XG4gICAgfVxuICB9LFxuICByZW5kZXJQcml2YXRlUm9vbXM6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5yZW5kZXJQcml2YXRlUm9vbXMnKTtcbiAgICBjb25zb2xlLmxvZygnUFJJVkFURVJPT01TOiAnLCB0aGlzLm1vZGVsLmdldChcInByaXZhdGVSb29tc1wiKSk7XG4gICAgdGhpcy4kKCcjcHJpdmF0ZS1yb29tcycpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoJ3ByaXZhdGVSb29tcycpLmVhY2goZnVuY3Rpb24gKHJvb20pIHtcbiAgICAgIHRoaXMucmVuZGVyUHJpdmF0ZVJvb20ocm9vbSk7XG4gICAgfSwgdGhpcyk7XG4gIH0sXG4gIHJlbmRlclByaXZhdGVSb29tOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHZhciBuYW1lMSA9IG1vZGVsLmdldCgnbmFtZScpLFxuICAgIG5hbWUyID0gdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tJykuZ2V0KCduYW1lJyk7XG4gICAgdGhpcy4kKCcjcHJpdmF0ZS1yb29tcycpLmFwcGVuZCh0aGlzLnJvb21UZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICAgIGlmIChuYW1lMSA9PT0gbmFtZTIpIHtcbiAgICAgIHRoaXMuJCgnI3ByaXZhdGUtcm9vbXMnKS5maW5kKCcucm9vbS1uYW1lJykubGFzdCgpLmFkZENsYXNzKCdhY3RpdmUnKS5mYWRlSW4oKTtcbiAgICB9XG4gIH0sXG4gIGpvaW5Sb29tOiBmdW5jdGlvbihvYmopIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYuam9pblJvb20nKTtcbiAgICAgLy8gJCgnI2NoYXRJbWFnZVVwbG9hZENvbnRhaW5lcicpLmRhdGEoJ2NoYXQtdHlwZScsICdjaGF0Jyk7XG4gICAgdGhpcy5jdXJyZW50RGF0ZSA9ICcnO1xuICAgIHRoaXMucHJldmlvdXNEYXRlID0gJyc7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoJ2pvaW5Sb29tJywgb2JqLm5hbWUpO1xuICB9LFxuLy8gY2hhbmdlIHRvICdqb2luRGlyZWN0TWVzc2FnZSdcbiAgaW5pdERpcmVjdE1lc3NhZ2U6IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgcmVjaXBpZW50ID0ge30sXG4gICAgICAgICR0YXIgPSAkKGUuY3VycmVudFRhcmdldCk7XG4gICAgcmVjaXBpZW50LnVzZXJuYW1lID0gJHRhci50ZXh0KCkudHJpbSgpO1xuICAgIHJlY2lwaWVudC51c2VySW1hZ2UgPSAkdGFyLmZpbmQoJ2ltZycpLmF0dHIoJ3NyYycpO1xuICAgIHRoaXMuY3VycmVudERhdGUgPSAnJztcbiAgICB0aGlzLnByZXZpb3VzRGF0ZSA9ICcnO1xuICAgIGlmICh0aGlzLm1vZGVsLmdldCgnY2hhdHJvb20nKS5nZXQoJ2N1cnJlbnRVc2VyJykgIT09IHJlY2lwaWVudC51c2VybmFtZSkge1xuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoJ2luaXREaXJlY3RNZXNzYWdlJywgcmVjaXBpZW50KTtcbiAgICB9XG4gIH0sXG5cblxuXG5cblxuLy8gaW1hZ2UgdXBsb2FkXG5cbiBjaGF0VXBsb2FkSW1hZ2U6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgY29uc29sZS5sb2coJ2ltZyB1cmw6ICcsIHJlc3BvbnNlKTtcbiAgICB0aGlzLnZlbnQudHJpZ2dlcihcImNoYXRcIiwgcmVzcG9uc2UpO1xuICAgIHRoaXMuc2Nyb2xsQm90dG9tSW5zdXJhbmNlKCk7XG4gIH0sXG5cbiAgbWVzc2FnZVVwbG9hZEltYWdlOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgY29uc29sZS5sb2coJ2ltZyB1cmw6ICcsIHJlc3BvbnNlKTtcbiAgIHRoaXMudmVudC50cmlnZ2VyKFwiZGlyZWN0TWVzc2FnZVwiLCByZXNwb25zZSk7XG4gICB0aGlzLnNjcm9sbEJvdHRvbUluc3VyYW5jZSgpO1xuIH0sXG5cblxuXG5cblxuICAvL2V2ZW50c1xuXG5cbiAgbWVzc2FnZUlucHV0UHJlc3NlZDogZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzICYmICQudHJpbSgkKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgpKS5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBmdW4gZmFjdDogc2VwYXJhdGUgZXZlbnRzIHdpdGggYSBzcGFjZSBpbiB0cmlnZ2VyJ3MgZmlyc3QgYXJnIGFuZCB5b3VcbiAgICAgIC8vIGNhbiB0cmlnZ2VyIG11bHRpcGxlIGV2ZW50cy5cbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiY2hhdFwiLCB7IG1lc3NhZ2U6IHRoaXMuJCgnLm1lc3NhZ2UtaW5wdXQnKS52YWwoKX0pO1xuICAgICAgdGhpcy4kKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgnJyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwidHlwaW5nXCIpO1xuICAgICAgY29uc29sZS5sb2coJ3d1dCcpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgZGlyZWN0TWVzc2FnZUlucHV0UHJlc3NlZDogZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzICYmICQudHJpbSgkKCcuZGlyZWN0LW1lc3NhZ2UtaW5wdXQnKS52YWwoKSkubGVuZ3RoID4gMCkge1xuICAgICAgLy8gZnVuIGZhY3Q6IHNlcGFyYXRlIGV2ZW50cyB3aXRoIGEgc3BhY2UgaW4gdHJpZ2dlcidzIGZpcnN0IGFyZyBhbmQgeW91XG4gICAgICAvLyBjYW4gdHJpZ2dlciBtdWx0aXBsZSBldmVudHMuXG4gICAgICB0aGlzLnZlbnQudHJpZ2dlcihcImRpcmVjdE1lc3NhZ2VcIiwgeyBtZXNzYWdlOiB0aGlzLiQoJy5kaXJlY3QtbWVzc2FnZS1pbnB1dCcpLnZhbCgpfSk7XG4gICAgICB0aGlzLiQoJy5kaXJlY3QtbWVzc2FnZS1pbnB1dCcpLnZhbCgnJyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwidHlwaW5nXCIpO1xuICAgICAgY29uc29sZS5sb2coJ2h1aCcpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgc2V0Um9vbTogZnVuY3Rpb24oZSkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5zZXRSb29tJyk7XG4gICAgdmFyICR0YXIgPSAkKGUudGFyZ2V0KTtcbiAgICBpZiAoJHRhci5pcygnLnJvb20tbmFtZScpKSB7XG4gICAgICB0aGlzLmpvaW5Sb29tKHtpZDogJHRhci5kYXRhKCdyb29tLWlkJyksIG5hbWU6ICR0YXIuZGF0YSgncm9vbScpfSk7XG4gICAgfVxuICB9LFxuXG5cbiAgZGF0ZURpdmlkZXI6IChmdW5jdGlvbigpIHtcblxuICAgIHZhciAkd2luZG93ID0gJCh3aW5kb3cpLFxuICAgICRzdGlja2llcztcblxuICAgIGxvYWQgPSBmdW5jdGlvbihzdGlja2llcykge1xuICAgICAgJHN0aWNraWVzID0gc3RpY2tpZXM7XG4gICAgICAkKCcjY2hhdGJveC1jb250ZW50Jykuc2Nyb2xsKHNjcm9sbFN0aWNraWVzSW5pdCk7XG4gICAgfTtcblxuICAgIHNjcm9sbFN0aWNraWVzSW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgJCh0aGlzKS5vZmYoXCJzY3JvbGwuc3RpY2tpZXNcIik7XG4gICAgICAkKHRoaXMpLm9uKFwic2Nyb2xsLnN0aWNraWVzXCIsIF8uZGVib3VuY2UoX3doZW5TY3JvbGxpbmcsIDE1MCkpO1xuICAgIH07XG5cbiAgICBfd2hlblNjcm9sbGluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgJHN0aWNraWVzLnJlbW92ZUNsYXNzKCdmaXhlZCcpO1xuICAgICAgJHN0aWNraWVzLmVhY2goZnVuY3Rpb24oaSwgc3RpY2t5KSB7XG4gICAgICAgIHZhciAkdGhpc1N0aWNreSA9ICQoc3RpY2t5KSxcbiAgICAgICAgJHRoaXNTdGlja3lUb3AgPSAkdGhpc1N0aWNreS5vZmZzZXQoKS50b3A7XG4gICAgICAgIGlmICgkdGhpc1N0aWNreVRvcCA8PSAxNjIpIHtcbiAgICAgICAgICAkdGhpc1N0aWNreS5hZGRDbGFzcyhcImZpeGVkXCIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGxvYWQ6IGxvYWRcbiAgICB9O1xuICB9KSgpXG5cblxuXG5cbn0pO1xuXG59KShqUXVlcnkpOyIsIlxudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuSW52aXRhdGlvbkNvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG4gICAgbW9kZWw6IGFwcC5JbnZpdGF0aW9uTW9kZWxcbiAgfSk7XG5cbn0pKCk7IiwiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5DaGF0cm9vbUxpc3QgPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG4gICAgbW9kZWw6IGFwcC5DaGF0cm9vbU1vZGVsLFxuICAgIHVybDogJy9hcGkvY2hhdHJvb21zJyxcbiAgfSk7XG5cbn0pKCk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuUHJpdmF0ZVJvb21Db2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe1xuICAgIG1vZGVsOiBhcHAuQ2hhdHJvb21Nb2RlbCxcbiAgfSk7XG5cbn0pKCk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuXG4oZnVuY3Rpb24oJCkge1xuXG4gIGFwcC5DaGF0SW1hZ2VVcGxvYWRWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuXG4gICAgZWw6ICQoJyNjaGF0SW1hZ2VVcGxvYWRDb250YWluZXInKSxcbiAgXG4gICAgZXZlbnRzOiB7XG4gICAgICAnY2hhbmdlICNjaGF0SW1hZ2VVcGxvYWQnOiAncmVuZGVyVGh1bWInLFxuICAgICAgJ2F0dGFjaEltYWdlICNjaGF0SW1hZ2VVcGxvYWRGb3JtJzogJ3VwbG9hZCcsXG4gICAgICAnY2xpY2sgI2FkZENoYXRJbWFnZUJ0bic6ICdzdWJtaXQnLFxuICAgIH0sXG5cbiAgICAvLyBpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcbiAgICAvLyAgIHRoaXMubGlzdGVuVG8odGhpcywgXCJmaWxlLWNob3NlblwiLCB0aGlzLnJlbmRlclRodW1iLCB0aGlzKTtcbiAgICAvLyAgIHRoaXMubGlzdGVuVG8odGhpcywgXCJmaWxlLWNob3NlblwiLCB0aGlzLnJlbmRlclRodW1iLCB0aGlzKTtcbiAgICAvLyB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMucmVuZGVyVGh1bWIoKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyVGh1bWI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGlucHV0ID0gdGhpcy4kKCcjY2hhdEltYWdlVXBsb2FkJyk7XG4gICAgICB2YXIgaW1nID0gdGhpcy4kKCcjdXBsb2FkZWRDaGF0SW1hZ2UnKVswXTtcbiAgICAgIGlmKGlucHV0LnZhbCgpICE9PSAnJykge1xuICAgICAgICB2YXIgc2VsZWN0ZWRfZmlsZSA9IGlucHV0WzBdLmZpbGVzWzBdO1xuICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IChmdW5jdGlvbihhSW1nKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGFJbWcuc3JjID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgICAgIH07XG4gICAgICAgIH0pKGltZyk7XG4gICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKCBzZWxlY3RlZF9maWxlICk7XG4gICAgICB9XG5cbiAgICB9LFxuXG4gICAgc3VibWl0OiBmdW5jdGlvbihlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLiRmb3JtID0gdGhpcy4kKCcjY2hhdEltYWdlVXBsb2FkRm9ybScpO1xuICAgICAgdGhpcy4kZm9ybS50cmlnZ2VyKCdhdHRhY2hJbWFnZScpO1xuICAgIH0sXG5cbiAgICB1cGxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKHRoaXMuJGZvcm1bMF0pO1xuICAgICAgaWYgKHRoaXMuJCgnI2NoYXRJbWFnZVVwbG9hZCcpWzBdLmZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgdXJsOiAnL2FwaS91cGxvYWRDaGF0SW1hZ2UnLFxuICAgICAgICAgIGRhdGE6IGZvcm1EYXRhLFxuICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICBjb250ZW50VHlwZTogZmFsc2UsXG4gICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKCB4aHIgKSB7XG4gICAgICAgICAgICBfdGhpcy5yZW5kZXJTdGF0dXMoJ0Vycm9yOiAnICsgeGhyLnN0YXR1cyk7XG4gICAgICAgICAgICBhbGVydCgnWW91ciBpbWFnZSBpcyBlaXRoZXIgdG9vIGxhcmdlIG9yIGl0IGlzIG5vdCBhIC5qcGVnLCAucG5nLCBvciAuZ2lmLicpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ltZ1VwbG9hZCByZXNwb25zZTogJywgcmVzcG9uc2UpO1xuICAgICAgICAgICAgX3RoaXMuJGVsLmRhdGEoJ2NoYXQtdHlwZScpID09PSAnY2hhdCcgP1xuICAgICAgICAgICAgICBfdGhpcy50cmlnZ2VyKCdjaGF0LWltYWdlLXVwbG9hZGVkJywgcmVzcG9uc2UpIDpcbiAgICAgICAgICAgICAgX3RoaXMudHJpZ2dlcignbWVzc2FnZS1pbWFnZS11cGxvYWRlZCcsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdpbWdVcGxvYWQgcGF0aCAnLCByZXNwb25zZS5wYXRoKTtcbiAgICAgICAgICAgICQoJyNjaGF0SW1hZ2VVcGxvYWRNb2RhbCcpLm1vZGFsKCdoaWRlJyk7XG4gICAgICAgICAgICBfdGhpcy5jbGVhckZpZWxkKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgdGhpcy50cmlnZ2VyKCdpbWFnZS11cGxvYWRlZCcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICByZW5kZXJTdGF0dXM6IGZ1bmN0aW9uKCBzdGF0dXMgKSB7XG4gICAgICAkKCcjc3RhdHVzJykudGV4dChzdGF0dXMpO1xuICAgIH0sXG5cbiAgICBjbGVhckZpZWxkOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJCgnI3VwbG9hZGVkQ2hhdEltYWdlJylbMF0uc3JjID0gJyc7XG4gICAgICB0aGlzLiQoJyNjaGF0SW1hZ2VVcGxvYWQnKS52YWwoJycpO1xuICAgIH1cblxuICB9KTtcblxufSkoalF1ZXJ5KTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG5cbihmdW5jdGlvbigkKSB7XG5cbiAgYXBwLkNoYXRyb29tU2V0dGluZ3NWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuXG4gICAgZWw6ICQoJyNjaGF0cm9vbS1oZWFkZXItY29udGFpbmVyJyksXG4gICAgdXNlckludml0ZWRUZW1wbGF0ZTogXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cInVzZXItaW52aXRlZC1yZXNwb25zZSBzdWNjZXNzXCI+PCU9IHVzZXJuYW1lICU+IEludml0ZWQhPC9kaXY+JyksXG4gICAgaW52aXRhdGlvbkVycm9yVGVtcGxhdGU6IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJ1c2VyLWludml0ZWQtcmVzcG9uc2UgZmFpbHVyZVwiPkZhaWx1cmUhPC9kaXY+JyksXG4gICAgZXZlbnRzOiB7XG4gICAgICAnY2hhbmdlICNwcmVmZXJlbmNlcy1pbWFnZS11cGxvYWQnOiAncmVuZGVyVGh1bWInLFxuICAgICAgJ2F0dGFjaEltYWdlICNwcmVmZXJlbmNlcy1mb3JtJzogJ3VwbG9hZCcsXG4gICAgICAnY2xpY2sgI3ByZWZlcmVuY2VzLWJ0bic6ICdzdWJtaXQnLFxuICAgICAgJ2tleXVwICNpbnZpdGUtdXNlci1pbnB1dCc6ICdpbnZpdGVVc2VyJyxcbiAgICB9LFxuXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xuICAgICAgdGhpcy51c2VyU2VhcmNoVHlwZWFoZWFkKCk7XG4gICAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgICAgJChcImZvcm1cIikuc3VibWl0KGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgfSk7XG5cbiAgICAgIHRoaXMubGlzdGVuVG8odGhpcywgXCJ1c2VySW52aXRlZFwiLCB0aGlzLnVzZXJJbnZpdGVkLCB0aGlzKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMucmVuZGVyVGh1bWIoKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyVGh1bWI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGlucHV0ID0gdGhpcy4kKCcjcHJlZmVyZW5jZXMtaW1hZ2UtdXBsb2FkJyk7XG4gICAgICB2YXIgaW1nID0gdGhpcy4kKCcjdXBsb2FkZWQtcHJlZmVyZW5jZXMtaW1hZ2UnKVswXTtcbiAgICAgIGlmKGlucHV0LnZhbCgpICE9PSAnJykge1xuICAgICAgICB2YXIgc2VsZWN0ZWRfZmlsZSA9IGlucHV0WzBdLmZpbGVzWzBdO1xuICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IChmdW5jdGlvbihhSW1nKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGFJbWcuc3JjID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgICAgIH07XG4gICAgICAgIH0pKGltZyk7XG4gICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKCBzZWxlY3RlZF9maWxlICk7XG4gICAgICB9XG5cbiAgICB9LFxuXG4gICAgc3VibWl0OiBmdW5jdGlvbihlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIHRoaXMuJGZvcm0gPSB0aGlzLiQoJyNwcmVmZXJlbmNlcy1mb3JtJyk7XG4gICAgICB0aGlzLiRmb3JtLnRyaWdnZXIoJ2F0dGFjaEltYWdlJyk7XG4gICAgfSxcblxuICAgIHVwbG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEodGhpcy4kZm9ybVswXSk7XG4gICAgICBpZiAodGhpcy4kKCcjcHJlZmVyZW5jZXMtaW1hZ2UtdXBsb2FkJylbMF0uZmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICB1cmw6ICcvYXBpL3VwbG9hZENoYXRyb29tSW1hZ2UnLFxuICAgICAgICAgIGRhdGE6IGZvcm1EYXRhLFxuICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICBjb250ZW50VHlwZTogZmFsc2UsXG4gICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKCB4aHIgKSB7XG4gICAgICAgICAgICBfdGhpcy5yZW5kZXJTdGF0dXMoJ0Vycm9yOiAnICsgeGhyLnN0YXR1cyk7XG4gICAgICAgICAgICBhbGVydCgnWW91ciBpbWFnZSBpcyBlaXRoZXIgdG9vIGxhcmdlIG9yIGl0IGlzIG5vdCBhIC5qcGVnLCAucG5nLCBvciAuZ2lmLicpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ltZ1VwbG9hZCByZXNwb25zZTogJywgcmVzcG9uc2UpO1xuICAgICAgICAgICAgdmFyIGZvcm0gPSBfdGhpcy5jcmVhdGVSb29tRm9ybURhdGEoKTtcbiAgICAgICAgICAgIGZvcm0ucm9vbUltYWdlID0gcmVzcG9uc2Uucm9vbUltYWdlO1xuICAgICAgICAgICAgX3RoaXMudHJpZ2dlcigndXBkYXRlUm9vbScsIGZvcm0pO1xuICAgICAgICAgICAgJCgnI3ByZWZlcmVuY2VzLW1vZGFsJykubW9kYWwoJ2hpZGUnKTtcbiAgICAgICAgICAgIF90aGlzLmNsZWFyRmllbGQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGZvcm0gPSB0aGlzLmNyZWF0ZVJvb21Gb3JtRGF0YSgpO1xuICAgICAgICB0aGlzLnRyaWdnZXIoJ3VwZGF0ZVJvb20nLCBmb3JtKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG5cbiAgICBjcmVhdGVSb29tRm9ybURhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGZvcm1EYXRhID0ge307XG4gICAgICB0aGlzLiQoJyNwcmVmZXJlbmNlcy1mb3JtJykuZmluZCggJ2lucHV0JyApLmVhY2goZnVuY3Rpb24oaSwgZWwpIHtcbiAgICAgICAgaWYgKCQoZWwpLmRhdGEoJ2NyZWF0ZScpID09PSAncHJpdmFjeScpIHtcbiAgICAgICAgICB2YXIgdmFsID0gJChlbCkucHJvcCgnY2hlY2tlZCcpO1xuICAgICAgICAgIGZvcm1EYXRhWydwcml2YWN5J10gPSB2YWw7XG4gICAgICAgIH0gZWxzZSBpZiAoJChlbCkudmFsKCkgIT09ICcnICYmICQoZWwpLnZhbCgpICE9PSAnb24nKSB7XG4gICAgICAgICAgZm9ybURhdGFbJChlbCkuZGF0YSgnY3JlYXRlJyldID0gJChlbCkudmFsKCk7XG4gICAgICAgICAgJChlbCkudmFsKCcnKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBkZWxldGUgZm9ybURhdGEudW5kZWZpbmVkO1xuICAgICAgcmV0dXJuIGZvcm1EYXRhO1xuICAgIH0sXG5cbiAgICByZW5kZXJTdGF0dXM6IGZ1bmN0aW9uKCBzdGF0dXMgKSB7XG4gICAgICAkKCcjc3RhdHVzJykudGV4dChzdGF0dXMpO1xuICAgIH0sXG5cbiAgICBjbGVhckZpZWxkOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJCgnI3VwbG9hZGVkLXByZWZlcmVuY2VzLWltYWdlJylbMF0uc3JjID0gJyc7XG4gICAgICB0aGlzLiQoJyNwcmVmZXJlbmNlcy1pbWFnZS11cGxvYWQnKS52YWwoJycpO1xuICAgIH0sXG5cbiAgICBpbnZpdGVVc2VyOiBmdW5jdGlvbihlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB2YXIgcmVjaXBpZW50ID0gJC50cmltKCQoJyNpbnZpdGUtdXNlci1pbnB1dCcpLnZhbCgpKTtcbiAgICAgIGlmIChlLmtleUNvZGUgPT09IDEzICYmIHJlY2lwaWVudC5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIHNlbmRlciA9IHRoaXMubW9kZWwuZ2V0KCdjdXJyZW50VXNlcicpLFxuICAgICAgICAgICAgcm9vbUlkID0gdGhpcy5tb2RlbC5nZXQoJ2lkJyksXG4gICAgICAgICAgICByb29tTmFtZSA9IHRoaXMubW9kZWwuZ2V0KCduYW1lJyksXG4gICAgICAgICAgICBpbnZpdGF0aW9uT2JqID0ge3NlbmRlcjogc2VuZGVyLCByb29tSWQ6IHJvb21JZCwgcm9vbU5hbWU6IHJvb21OYW1lLCByZWNpcGllbnQ6IHJlY2lwaWVudH07XG4gICAgICAgIHRoaXMudmVudC50cmlnZ2VyKCdpbnZpdGVVc2VyJywgaW52aXRhdGlvbk9iaik7XG4gICAgICAgICQoJyNpbnZpdGUtdXNlci1pbnB1dCcpLnZhbCgnJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnc2VhcmNoIHR5cGluZycpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIHVzZXJTZWFyY2hUeXBlYWhlYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAgIHZhciBibG9vZCA9IG5ldyBCbG9vZGhvdW5kKHtcbiAgICAgICAgZGF0dW1Ub2tlbml6ZXI6IEJsb29kaG91bmQudG9rZW5pemVycy5vYmoud2hpdGVzcGFjZSgndXNlcm5hbWUnKSxcbiAgICAgICAgcXVlcnlUb2tlbml6ZXI6IEJsb29kaG91bmQudG9rZW5pemVycy53aGl0ZXNwYWNlLFxuICAgICAgICBwcmVmZXRjaDoge1xuICAgICAgICAgIHVybDogJy9hbGxVc2VycycsXG4gICAgICAgICAgZmlsdGVyOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnLS0tLS0tZGFhYXRhYS0tLS0nLCBkYXRhKTtcbiAgICAgICAgICAgICByZXR1cm4gXy5tYXAoZGF0YSwgZnVuY3Rpb24odXNlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHVzZXJuYW1lOiB1c2VyIH07XG4gICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICB0dGw6IDAsXG4gICAgICAgIH0sXG4gICAgICAgIHJlbW90ZToge1xuICAgICAgICAgIHVybDogJy9zZWFyY2hVc2Vycz91c2VybmFtZT0lUVVFUlknLFxuICAgICAgICAgIHdpbGRjYXJkOiAnJVFVRVJZJyxcbiAgICAgICAgICByYXRlTGltaXRXYWl0OiAzMDAsXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgYmxvb2QuY2xlYXJQcmVmZXRjaENhY2hlKCk7XG4gICAgICBibG9vZC5pbml0aWFsaXplKCk7XG4gICAgICAkKCcjaW52aXRlLXVzZXItaW5wdXQnKS50eXBlYWhlYWQoe1xuICAgICAgICBtaW5MZW5ndGg6IDIsXG4gICAgICAgIGNsYXNzTmFtZXM6IHtcbiAgICAgICAgICBpbnB1dDogJ3R5cGVhaGVhZC1pbnB1dCcsXG4gICAgICAgICAgaGludDogJ3R5cGVhaGVhZC1oaW50JyxcbiAgICAgICAgICBzZWxlY3RhYmxlOiAndHlwZWFoZWFkLXNlbGVjdGFibGUnLFxuICAgICAgICAgIG1lbnU6ICd0eXBlYWhlYWQtbWVudScsXG4gICAgICAgICAgaGlnaGxpZ2h0OiAndHlwZWFoZWFkLWhpZ2hsaWdodCcsXG4gICAgICAgICAgZGF0YXNldDogJ3R5cGVhaGVhZC1kYXRhc2V0JyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGxpbWl0OiA1LFxuICAgICAgICBzb3VyY2U6IGJsb29kLFxuICAgICAgICBuYW1lOiAndXNlci1zZWFyY2gnLFxuICAgICAgICBkaXNwbGF5OiAndXNlcm5hbWUnLFxuICAgICAgfSkub24oJ3R5cGVhaGVhZDpzZWxlY3QgdHlwZWFoZWFkOmF1dG9jb21wbGV0ZScsIGZ1bmN0aW9uKG9iaikge1xuXG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgdXNlckludml0ZWQ6IGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG4gICAgICBpZiAodXNlcm5hbWUuZXJyb3IgPT09ICdlcnJvcicpIHtcbiAgICAgICAgJCgnLmludml0ZS11c2VyLWNvbnRhaW5lcicpLmFwcGVuZCh0aGlzLmludml0YXRpb25FcnJvclRlbXBsYXRlKCkpO1xuICAgICAgfVxuICAgICAgJCgnLmludml0ZS11c2VyLWNvbnRhaW5lcicpLmFwcGVuZCh0aGlzLnVzZXJJbnZpdGVkVGVtcGxhdGUoe3VzZXJuYW1lOiB1c2VybmFtZX0pKTtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICQoJy5pbnZpdGUtdXNlci1jb250YWluZXIgLnN1Y2Nlc3MnKS5mYWRlT3V0KDMwMCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoJy5pbnZpdGUtdXNlci1jb250YWluZXIgLmZhaWx1cmUnKS5mYWRlT3V0KDMwMCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9LCAxMDAwKTtcbiAgICB9LFxuXG5cbiAgfSk7XG5cbn0pKGpRdWVyeSk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuXG4oZnVuY3Rpb24oJCkge1xuXG4gIGFwcC5DcmVhdGVDaGF0cm9vbVZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG5cbiAgICBlbDogJCgnI2NyZWF0ZUNoYXRyb29tQ29udGFpbmVyJyksXG4gICAgZXZlbnRzOiB7XG4gICAgICAnY2hhbmdlICNjaGF0cm9vbUltYWdlVXBsb2FkJzogJ3JlbmRlclRodW1iJyxcbiAgICAgICdhdHRhY2hJbWFnZSAjY3JlYXRlQ2hhdHJvb21Gb3JtJzogJ3VwbG9hZCcsXG4gICAgICAnY2xpY2sgI2NyZWF0ZUNoYXRyb29tQnRuJzogJ3N1Ym1pdCcsXG4gICAgfSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcbiAgICAgIHRoaXMubGlzdGVuVG8odGhpcywgXCJjaGF0cm9vbUF2YWlsYWJpbGl0eVwiLCB0aGlzLnJlbmRlckNoYXRyb29tQXZhaWxhYmlsaXR5LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMucmVuZGVyVGh1bWIoKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyVGh1bWI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGlucHV0ID0gdGhpcy4kKCcjY2hhdHJvb21JbWFnZVVwbG9hZCcpO1xuICAgICAgdmFyIGltZyA9IHRoaXMuJCgnI3VwbG9hZGVkQ2hhdHJvb21JbWFnZScpWzBdO1xuICAgICAgaWYoaW5wdXQudmFsKCkgIT09ICcnKSB7XG4gICAgICAgIHZhciBzZWxlY3RlZF9maWxlID0gaW5wdXRbMF0uZmlsZXNbMF07XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICByZWFkZXIub25sb2FkID0gKGZ1bmN0aW9uKGFJbWcpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgYUltZy5zcmMgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkoaW1nKTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoIHNlbGVjdGVkX2ZpbGUgKTtcbiAgICAgIH1cblxuICAgIH0sXG5cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGlmICh0aGlzLiQoJyNjaGF0cm9vbS1uYW1lLWlucHV0JykuaGFzQ2xhc3MoJ2lucHV0LWludmFsaWQnKSkge1xuICAgICAgICBzd2FsKHtcbiAgICAgICAgICB0aXRsZTogXCJPSCBOTyBPSCBOTyBPSCBOT1wiLFxuICAgICAgICAgIHRleHQ6IFwiQ2hhdHJvb20gQWxyZWFkeSwgSXQgQWxyZWFkeSBFeGlzdHMhIEFuZC4gRG9uJ3QgR28gSW4gVGhlcmUuIERvbid0LiBZb3UuIFlvdSBTaG91bGQgSGF2ZS4gSSBUaHJldyBVcCBJbiBNeSBIYXQuIFRob3NlIFBvb3IgLiAuIC4gVGhleSBXZXJlIEp1c3QhIE9IIE5PIFdIWS4gV0hZIE9IIE5PLiBPSCBOTy5cIixcbiAgICAgICAgICB0eXBlOiBcImVycm9yXCIsXG4gICAgICAgICAgY29uZmlybUJ1dHRvbkNvbG9yOiBcIiM3NDlDQThcIlxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuJGZvcm0gPSB0aGlzLiQoJyNjcmVhdGVDaGF0cm9vbUZvcm0nKTtcbiAgICAgICAgdGhpcy4kZm9ybS50cmlnZ2VyKCdhdHRhY2hJbWFnZScpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICB1cGxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgIHZhciBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSh0aGlzLiRmb3JtWzBdKTtcbiAgICAgIGlmICh0aGlzLiQoJyNjaGF0cm9vbUltYWdlVXBsb2FkJylbMF0uZmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICB1cmw6ICcvYXBpL3VwbG9hZENoYXRyb29tSW1hZ2UnLFxuICAgICAgICAgIGRhdGE6IGZvcm1EYXRhLFxuICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICBjb250ZW50VHlwZTogZmFsc2UsXG4gICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKCB4aHIgKSB7XG4gICAgICAgICAgICBfdGhpcy5yZW5kZXJTdGF0dXMoJ0Vycm9yOiAnICsgeGhyLnN0YXR1cyk7XG4gICAgICAgICAgICBhbGVydCgnWW91ciBpbWFnZSBpcyBlaXRoZXIgdG9vIGxhcmdlIG9yIGl0IGlzIG5vdCBhIC5qcGVnLCAucG5nLCBvciAuZ2lmLicpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ltZ1VwbG9hZCByZXNwb25zZTogJywgcmVzcG9uc2UpO1xuICAgICAgICAgICAgdmFyIGZvcm0gPSBfdGhpcy5jcmVhdGVSb29tRm9ybURhdGEoKTtcbiAgICAgICAgICAgIHJlc3BvbnNlLm5hbWUgPSBmb3JtLm5hbWU7XG4gICAgICAgICAgICAgIF90aGlzLnZlbnQudHJpZ2dlcignY3JlYXRlUm9vbScsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICQoJyNjcmVhdGVDaGF0cm9vbU1vZGFsJykubW9kYWwoJ2hpZGUnKTtcbiAgICAgICAgICAgIF90aGlzLmNsZWFyRmllbGQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGZvcm0gPSBfdGhpcy5jcmVhdGVSb29tRm9ybURhdGEoKTtcbiAgICAgICB0aGlzLnZlbnQudHJpZ2dlcignY3JlYXRlUm9vbScsIGZvcm0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cblxuICAgIGNyZWF0ZVJvb21Gb3JtRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZm9ybURhdGEgPSB7fTtcbiAgICAgIGZvcm1EYXRhLnJvb21JbWFnZSA9ICcvaW1nL2NoamF0LWljb24xLnBuZyc7XG4gICAgICB0aGlzLiQoJyNjcmVhdGVDaGF0cm9vbUZvcm0nKS5maW5kKCAnaW5wdXQnICkuZWFjaChmdW5jdGlvbihpLCBlbCkge1xuICAgICAgICBpZiAoJChlbCkucHJvcCgndHlwZScpID09PSBcImJ1dHRvblwiKSB7XG5cbiAgICAgICAgfSBlbHNlIGlmICgkKGVsKS5kYXRhKCdjcmVhdGUnKSA9PT0gJ3ByaXZhY3knKSB7XG4gICAgICAgICAgdmFyIHZhbCA9ICQoZWwpLnByb3AoJ2NoZWNrZWQnKTtcbiAgICAgICAgICBmb3JtRGF0YVsncHJpdmFjeSddID0gdmFsO1xuICAgICAgICB9IGVsc2UgaWYgKCQoZWwpLnZhbCgpICE9PSAnJykge1xuICAgICAgICAgIGZvcm1EYXRhWyQoZWwpLmRhdGEoJ2NyZWF0ZScpXSA9ICQoZWwpLnZhbCgpO1xuICAgICAgICAgICQoZWwpLnZhbCgnJyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGZvcm1EYXRhO1xuXG4gICAgfSxcblxuICAgIHJlbmRlclN0YXR1czogZnVuY3Rpb24oIHN0YXR1cyApIHtcbiAgICAgICQoJyNzdGF0dXMnKS50ZXh0KHN0YXR1cyk7XG4gICAgfSxcblxuICAgIGNsZWFyRmllbGQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kKCcjdXBsb2FkZWRDaGF0cm9vbUltYWdlJylbMF0uc3JjID0gJyc7XG4gICAgICB0aGlzLiQoJyNjaGF0cm9vbUltYWdlVXBsb2FkJykudmFsKCcnKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyQ2hhdHJvb21BdmFpbGFiaWxpdHk6IGZ1bmN0aW9uKGF2YWlsYWJpbGl0eSkge1xuICAgICAgdGhpcy4kKCcucm9vbS1uYW1lLXZhbGlkYXRpb24nKS5yZW1vdmVDbGFzcygnaW5wdXQtdmFsaWQgaW5wdXQtaW52YWxpZCcpO1xuICAgICAgdGhpcy4kKCcucm9vbS1uYW1lLXZhbGlkYXRpb24tbWVzc2FnZScpLmNoaWxkcmVuKCkucmVtb3ZlKCk7XG4gICAgICBpZiAoYXZhaWxhYmlsaXR5ID09PSB0cnVlKSB7XG4gICAgICAgIHRoaXMuJCgnLnJvb20tbmFtZS12YWxpZGF0aW9uJykuYWRkQ2xhc3MoJ2lucHV0LXZhbGlkJyk7XG4gICAgICAgIHRoaXMuJCgnLnJvb20tbmFtZS12YWxpZGF0aW9uLW1lc3NhZ2UnKS5hcHBlbmQoJzxkaXYgaWQ9XCIjY2hhdHJvb20tbmFtZS12YWxpZGF0aW9uXCIgY2xhc3M9XCJmYSBmYS1jaGVja1wiPk5hbWUgQXZhaWxhYmxlPC9kaXY+Jyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbicpLmFkZENsYXNzKCdpbnB1dC1pbnZhbGlkIGZhIGZhLXRpbWVzJyk7XG4gICAgICAgIHRoaXMuJCgnLnJvb20tbmFtZS12YWxpZGF0aW9uLW1lc3NhZ2UnKS5hcHBlbmQoJzxkaXYgaWQ9XCIjY2hhdHJvb20tbmFtZS12YWxpZGF0aW9uXCIgY2xhc3M9XCJmYSBmYS10aW1lc1wiPk5hbWUgVW5hdmFpbGFibGU8L2Rpdj4nKTtcbiAgICAgIH1cbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJCgnLnJvb20tbmFtZS12YWxpZGF0aW9uLW1lc3NhZ2UnKS5jaGlsZHJlbigpLmZhZGVPdXQoNjAwLCBmdW5jdGlvbigpe1xuICAgICAgICAgICQodGhpcykuY2hpbGRyZW4oKS5yZW1vdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9LCAyMDAwKTtcbiAgICB9XG5cbiAgfSk7XG5cbn0pKGpRdWVyeSk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbiAgYXBwLk5hdmJhclZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgZWw6ICcubG9naW4tbWVudScsXG4gICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI25hdmJhci10ZW1wbGF0ZScpLmh0bWwoKSksXG4gICAgaW52aXRhdGlvblRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNpbnZpdGF0aW9uLXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgICBldmVudHM6IHtcbiAgICAgICdjbGljayAuZGVsZXRlLWludml0YXRpb24nOiAnZGVsZXRlSW52aXRhdGlvbicsXG4gICAgICAnY2xpY2sgLmFjY2VwdC1pbnZpdGF0aW9uJzogJ2FjY2VwdEludml0YXRpb24nLFxuICAgICAgJ2NoYW5nZSAjdXNlci1wcmVmZXJlbmNlcy1pbWFnZS11cGxvYWQnOiAncmVuZGVyVGh1bWInLFxuICAgICAgJ2F0dGFjaEltYWdlICN1c2VyLXByZWZlcmVuY2VzLWZvcm0nOiAndXBsb2FkJyxcbiAgICAgICdjbGljayAjdXNlci1wcmVmZXJlbmNlcy1idG4nOiAnc3VibWl0JyxcbiAgICAgICdrZXl1cCAjdXNlci1wcmVmZXJlbmNlcy1ob21lLXJvb20taW5wdXQnOiAnZG9lc0hvbWVSb29tRXhpc3QnLFxuICAgICAgLy8gJ2tleXByZXNzICN1c2VyLXByZWZlcmVuY2VzLWhvbWUtcm9vbS1pbnB1dCc6ICdkb2VzSG9tZVJvb21FeGlzdCcsXG4gICAgICAnY2xpY2sgLmZhLXBvd2VyLW9mZic6ICdsb2dvdXQnLFxuICAgIH0sXG5cbiAgICBsb2dvdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoJ2xvZ291dCcpO1xuICAgIH0sXG5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XG4gICAgICB0aGlzLm1vZGVsID0gbmV3IGFwcC5Vc2VyTW9kZWwoeyB1c2VybmFtZTogJycsIHVzZXJJbWFnZTogJycsIGhvbWVSb29tOiAnJywgaW52aXRhdGlvbnM6IG5ldyBhcHAuSW52aXRhdGlvbkNvbGxlY3Rpb24oKSB9KTtcbiAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJjaGFuZ2VcIiwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuXG4gICAgICB2YXIgaW52aXRhdGlvbnMgPSB0aGlzLm1vZGVsLmdldCgnaW52aXRhdGlvbnMnKTtcblxuICAgICAgdGhpcy5saXN0ZW5UbyhpbnZpdGF0aW9ucywgXCJyZXNldFwiLCB0aGlzLnJlbmRlckludml0YXRpb25zLCB0aGlzKTtcbiAgICAgIHRoaXMubGlzdGVuVG8odGhpcywgXCJob21lUm9vbUF2YWlsYWJpbGl0eVwiLCB0aGlzLnJlbmRlckhvbWVSb29tQXZhaWxhYmlsaXR5LCB0aGlzKTtcblxuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9LFxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUodGhpcy5tb2RlbC50b0pTT04oKSkpO1xuXG4gICAgICB0aGlzLnJlbmRlckludml0YXRpb25zKCk7XG4gICAgICB0aGlzLnNldEhvbWVSb29tVHllcGFoZWFkKCk7XG5cblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICByZW5kZXJJbnZpdGF0aW9uczogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiQoJyNpbnZpdGF0aW9ucycpLmVtcHR5KCk7XG4gICAgICB2YXIgaW52aXRhdGlvbnMgPSB0aGlzLm1vZGVsLmdldCgnaW52aXRhdGlvbnMnKTtcbiAgICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgICBpbnZpdGF0aW9ucy5lYWNoKGZ1bmN0aW9uKGludml0ZSkge1xuICAgICAgICB0aGlzXy5yZW5kZXJJbnZpdGF0aW9uKGludml0ZSk7XG4gICAgICB9LCB0aGlzKTtcbiAgICAgIGlmIChpbnZpdGF0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhpcy4kKCcucGluay1mdXp6JykuaGlkZSgpO1xuICAgICAgICB0aGlzLiQoJyNpbnZpdGF0aW9ucycpLmFwcGVuZChcIjxkaXY+WW91J3ZlIGdvdCBubyBpbnZpdGF0aW9ucywgbGlrZSBkYW5nPC9kaXY+XCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy4kKCcucGluay1mdXp6Jykuc2hvdygpO1xuICAgICAgfVxuICAgIH0sXG4gICAgcmVuZGVySW52aXRhdGlvbjogZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIHRoaXMuJCgnI2ludml0YXRpb25zJykuYXBwZW5kKHRoaXMuaW52aXRhdGlvblRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gICAgfSxcbiAgICBkZWxldGVJbnZpdGF0aW9uOiBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgcm9vbUlkID0gJChlLnRhcmdldCkuZGF0YSgncm9vbWlkJyk7XG4gICAgICB0aGlzLnZlbnQudHJpZ2dlcignZGVsZXRlSW52aXRhdGlvbicsIHJvb21JZCk7XG4gICAgfSxcbiAgICBhY2NlcHRJbnZpdGF0aW9uOiBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgcm9vbUlkID0gJChlLnRhcmdldCkuZGF0YSgncm9vbWlkJyk7XG4gICAgICB0aGlzLnZlbnQudHJpZ2dlcignYWNjZXB0SW52aXRhdGlvbicsIHJvb21JZCk7XG4gICAgfSxcblxuXG4gICAgcmVuZGVyVGh1bWI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGlucHV0ID0gdGhpcy4kKCcjdXNlci1wcmVmZXJlbmNlcy1pbWFnZS11cGxvYWQnKTtcbiAgICAgIHZhciBpbWcgPSB0aGlzLiQoJyN1cGxvYWRlZC11c2VyLXByZWZlcmVuY2VzLWltYWdlJylbMF07XG4gICAgICBpZihpbnB1dC52YWwoKSAhPT0gJycpIHtcbiAgICAgICAgdmFyIHNlbGVjdGVkX2ZpbGUgPSBpbnB1dFswXS5maWxlc1swXTtcbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSAoZnVuY3Rpb24oYUltZykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBhSW1nLnNyYyA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICB9O1xuICAgICAgICB9KShpbWcpO1xuICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTCggc2VsZWN0ZWRfZmlsZSApO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGlmICh0aGlzLiQoJyN1c2VyLXByZWZlcmVuY2VzLWhvbWUtcm9vbS1pbnB1dCcpLmhhc0NsYXNzKCdpbnB1dC1pbnZhbGlkJykpIHtcbiAgICAgICAgc3dhbCh7XG4gICAgICAgICAgdGl0bGU6IFwiT0ggTk8gT0ggTk8gT0ggTk9cIixcbiAgICAgICAgICB0ZXh0OiBcIkNoYXRyb29tIENhbid0LCBJdCBEb2Vzbid0IEV4aXN0ISBBbmQuIEkgRG9uJ3QgS25vdy4gU2hvdWxkIEk/IFNob3VsZCBZb3U/IFdoby4gSSBNZWFuIEhvdyBETyB3ZS4gSG93IGRvPyBIb3cgZG8gbm93P1wiLFxuICAgICAgICAgIHR5cGU6IFwiZXJyb3JcIixcbiAgICAgICAgICBjb25maXJtQnV0dG9uQ29sb3I6IFwiIzc0OUNBOFwiXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy4kZm9ybSA9IHRoaXMuJCgnI3VzZXItcHJlZmVyZW5jZXMtZm9ybScpO1xuICAgICAgICB0aGlzLiRmb3JtLnRyaWdnZXIoJ2F0dGFjaEltYWdlJyk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHVwbG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgICAgICB2YXIgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEodGhpcy4kZm9ybVswXSk7XG4gICAgICBpZiAodGhpcy4kKCcjdXNlci1wcmVmZXJlbmNlcy1pbWFnZS11cGxvYWQnKVswXS5maWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgIHVybDogJy91cGRhdGVVc2VySW1hZ2UnLFxuICAgICAgICAgIGRhdGE6IGZvcm1EYXRhLFxuICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICBjb250ZW50VHlwZTogZmFsc2UsXG4gICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKCB4aHIgKSB7XG4gICAgICAgICAgICB0aGlzXy5yZW5kZXJTdGF0dXMoJ0Vycm9yOiAnICsgeGhyLnN0YXR1cyk7XG4gICAgICAgICAgICBhbGVydCgnWW91ciBpbWFnZSBpcyBlaXRoZXIgdG9vIGxhcmdlIG9yIGl0IGlzIG5vdCBhIC5qcGVnLCAucG5nLCBvciAuZ2lmLicpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ltZ1VwbG9hZCByZXNwb25zZTogJywgcmVzcG9uc2UpO1xuICAgICAgICAgICAgdmFyIGZvcm0gPSB0aGlzXy5jcmVhdGVVc2VyRm9ybURhdGEoKTtcbiAgICAgICAgICAgIGZvcm0udXNlckltYWdlID0gcmVzcG9uc2UudXNlckltYWdlO1xuICAgICAgICAgICAgdGhpc18udmVudC50cmlnZ2VyKCd1cGRhdGVVc2VyJywgZm9ybSk7XG4gICAgICAgICAgICAkKCcjdXNlci1wcmVmZXJlbmNlcy1tb2RhbCcpLm1vZGFsKCdoaWRlJyk7XG4gICAgICAgICAgICB0aGlzXy5jbGVhckZpZWxkKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBmb3JtID0gdGhpcy5jcmVhdGVVc2VyRm9ybURhdGEoKTtcbiAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoJ3VwZGF0ZVVzZXInLCBmb3JtKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgY3JlYXRlVXNlckZvcm1EYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBmb3JtRGF0YSA9IHt9O1xuICAgICAgdGhpcy4kKCcjdXNlci1wcmVmZXJlbmNlcy1mb3JtJykuZmluZCggJ2lucHV0JyApLmVhY2goZnVuY3Rpb24oaSwgZWwpIHtcbiAgICAgICAgaWYgKCQoZWwpLmRhdGEoJ2NyZWF0ZScpID09PSAncHJpdmFjeScpIHtcbiAgICAgICAgICB2YXIgdmFsID0gJChlbCkucHJvcCgnY2hlY2tlZCcpO1xuICAgICAgICAgIGZvcm1EYXRhWydwcml2YWN5J10gPSB2YWw7XG4gICAgICAgIH0gZWxzZSBpZiAoJChlbCkudmFsKCkgIT09ICcnICYmICQoZWwpLnZhbCgpICE9PSAnb24nKSB7XG4gICAgICAgICAgZm9ybURhdGFbJChlbCkuZGF0YSgnY3JlYXRlJyldID0gJChlbCkudmFsKCk7XG4gICAgICAgICAgJChlbCkudmFsKCcnKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBkZWxldGUgZm9ybURhdGEudW5kZWZpbmVkO1xuICAgICAgcmV0dXJuIGZvcm1EYXRhO1xuICAgIH0sXG5cbiAgICBjbGVhckZpZWxkOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJCgnI3VwbG9hZGVkLXVzZXItcHJlZmVyZW5jZXMtaW1hZ2UnKVswXS5zcmMgPSAnJztcbiAgICAgIHRoaXMuJCgnI3VzZXItcHJlZmVyZW5jZXMtaW1hZ2UtdXBsb2FkJykudmFsKCcnKTtcbiAgICB9LFxuXG4gICAgc2V0SG9tZVJvb21UeWVwYWhlYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAgIHZhciBibG9vZCA9IG5ldyBCbG9vZGhvdW5kKHtcbiAgICAgICAgZGF0dW1Ub2tlbml6ZXI6IEJsb29kaG91bmQudG9rZW5pemVycy5vYmoud2hpdGVzcGFjZSgnbmFtZScpLFxuICAgICAgICBxdWVyeVRva2VuaXplcjogQmxvb2Rob3VuZC50b2tlbml6ZXJzLndoaXRlc3BhY2UsXG4gICAgICAgIHByZWZldGNoOiB7XG4gICAgICAgICAgdXJsOiAnL2FwaS9wdWJsaWNDaGF0cm9vbXMnLFxuICAgICAgICAgIGZpbHRlcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJy0tLS0tLS0tLWhvbWVSb29tRGF0YTogJywgZGF0YSk7XG4gICAgICAgICAgICAgcmV0dXJuIF8ubWFwKGRhdGEsIGZ1bmN0aW9uKGNoYXRyb29tKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgbmFtZTogY2hhdHJvb20gfTtcbiAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHR0bF9tczogMCxcbiAgICAgICAgfSxcbiAgICAgICAgcmVtb3RlOiB7XG4gICAgICAgICAgdXJsOiAnL2FwaS9zZWFyY2hDaGF0cm9vbXM/bmFtZT0lUVVFUlknLFxuICAgICAgICAgIHdpbGRjYXJkOiAnJVFVRVJZJyxcbiAgICAgICAgICByYXRlTGltaXRXYWl0OiAzMDAsXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgYmxvb2QuY2xlYXJQcmVmZXRjaENhY2hlKCk7XG4gICAgICBibG9vZC5pbml0aWFsaXplKCk7XG4gICAgICB2YXIgdHlwZSA9IHRoaXMuJCgnI3VzZXItcHJlZmVyZW5jZXMtaG9tZS1yb29tLWlucHV0JykudHlwZWFoZWFkKHtcbiAgICAgICAgbWluTGVuZ3RoOiAyLFxuICAgICAgICBjbGFzc05hbWVzOiB7XG4gICAgICAgICAgaW5wdXQ6ICd0eXBlYWhlYWQtaW5wdXQnLFxuICAgICAgICAgIGhpbnQ6ICd0eXBlYWhlYWQtaGludCcsXG4gICAgICAgICAgc2VsZWN0YWJsZTogJ3R5cGVhaGVhZC1zZWxlY3RhYmxlJyxcbiAgICAgICAgICBtZW51OiAndHlwZWFoZWFkLW1lbnUnLFxuICAgICAgICAgIGhpZ2hsaWdodDogJ3R5cGVhaGVhZC1oaWdobGlnaHQnLFxuICAgICAgICAgIGRhdGFzZXQ6ICd0eXBlYWhlYWQtZGF0YXNldCcsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBsaW1pdDogNSxcbiAgICAgICAgc291cmNlOiBibG9vZCxcbiAgICAgICAgbmFtZTogJ2hvbWUtcm9vbS1zZWFyY2gnLFxuICAgICAgICBkaXNwbGF5OiAnbmFtZScsXG4gICAgICB9KS5vbigndHlwZWFoZWFkOnNlbGVjdCB0eXBlYWhlYWQ6YXV0b2NvbXBsZXRlJywgZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIHRoaXNfLmRvZXNIb21lUm9vbUV4aXN0KCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgZG9lc0hvbWVSb29tRXhpc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kKCcucm9vbS1uYW1lLXZhbGlkYXRpb24nKS5yZW1vdmVDbGFzcygnaW5wdXQtdmFsaWQgaW5wdXQtaW52YWxpZCcpO1xuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAgIHZhciBjaGVjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoJC50cmltKCQoJyN1c2VyLXByZWZlcmVuY2VzLWhvbWUtcm9vbS1pbnB1dCcpLnZhbCgpKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdmFyIGNoYXRyb29tTmFtZSA9ICQoJyN1c2VyLXByZWZlcmVuY2VzLWhvbWUtcm9vbS1pbnB1dCcpLnZhbCgpO1xuICAgICAgICAgIHRoaXNfLnZlbnQudHJpZ2dlcignZG9lc0hvbWVSb29tRXhpc3QnLCBjaGF0cm9vbU5hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgdGhpc18uJCgnI3VzZXItcHJlZmVyZW5jZXMtaG9tZS1yb29tLWlucHV0JykuY2hpbGRyZW4oKS5yZW1vdmUoKTtcbiAgICAgICAgIHRoaXNfLiQoJyN1c2VyLXByZWZlcmVuY2VzLWhvbWUtcm9vbS1pbnB1dCcpLnJlbW92ZUNsYXNzKCdpbnB1dC12YWxpZCBpbnB1dC1pbnZhbGlkJyk7XG4gICAgICAgfVxuICAgICB9O1xuICAgICBfLmRlYm91bmNlKGNoZWNrKCksIDMwKTtcbiAgIH0sXG5cbiAgIHJlbmRlckhvbWVSb29tQXZhaWxhYmlsaXR5OiBmdW5jdGlvbihhdmFpbGFiaWxpdHkpIHtcblxuICAgIHRoaXMuJCgnLnJvb20tbmFtZS12YWxpZGF0aW9uJykucmVtb3ZlQ2xhc3MoJ2lucHV0LXZhbGlkIGlucHV0LWludmFsaWQnKTtcbiAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbi1tZXNzYWdlJykuY2hpbGRyZW4oKS5yZW1vdmUoKTtcbiAgICBpZiAoYXZhaWxhYmlsaXR5ID09PSBmYWxzZSkge1xuICAgICAgdGhpcy4kKCcucm9vbS1uYW1lLXZhbGlkYXRpb24nKS5hZGRDbGFzcygnaW5wdXQtdmFsaWQnKTtcbiAgICAgIHRoaXMuJCgnLnJvb20tbmFtZS12YWxpZGF0aW9uLW1lc3NhZ2UnKS5hcHBlbmQoJzxkaXYgaWQ9XCIjY2hhdHJvb20tbmFtZS12YWxpZGF0aW9uXCIgY2xhc3M9XCJmYSBmYS1jaGVja1wiPjwvZGl2PicpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbicpLmFkZENsYXNzKCdpbnB1dC1pbnZhbGlkIGZhIGZhLXRpbWVzJyk7XG4gICAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbi1tZXNzYWdlJykuYXBwZW5kKCc8ZGl2IGlkPVwiI2NoYXRyb29tLW5hbWUtdmFsaWRhdGlvblwiIGNsYXNzPVwiZmEgZmEtdGltZXNcIj5DaGF0cm9vbSBEb2VzIE5vdCBFeGlzdDwvZGl2PicpO1xuICAgIH1cbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kKCcucm9vbS1uYW1lLXZhbGlkYXRpb24tbWVzc2FnZScpLmNoaWxkcmVuKCkuZmFkZU91dCg2MDAsIGZ1bmN0aW9uKCl7XG4gICAgICAgICQodGhpcykuY2hpbGRyZW4oKS5yZW1vdmUoKTtcbiAgICAgIH0pO1xuICAgIH0sIDIwMDApO1xuICB9LFxuXG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5SZWdpc3RlclZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI3JlZ2lzdGVyJykuaHRtbCgpKSxcbiAgICB1c2VybmFtZUF2YWlsYWJsZVRlbXBsYXRlOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwidXNlcm5hbWUtYXZhaWxhYmxlIGZhIGZhLWNoZWNrXCI+dXNlcm5hbWUgYXZhaWxhYmxlPC9kaXY+JyksXG4gICAgdXNlcm5hbWVUYWtlblRlbXBsYXRlOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwidXNlcm5hbWUtdGFrZW4gZmEgZmEtdGltZXNcIj51c2VybmFtZSB0YWtlbjwvZGl2PicpLFxuICAgIGV2ZW50czoge1xuICAgICAgXCJjbGljayAjc2lnblVwQnRuXCI6IFwic2lnblVwXCIsXG4gICAgICBcImtleXVwICN1c2VybmFtZVwiOiBcInZhbGlkYXRlVXNlcm5hbWVcIixcbiAgICB9LFxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSxcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKCkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzaWduVXA6IGZ1bmN0aW9uKCkge1xuICAgIH0sXG4gICAgdmFsaWRhdGVVc2VybmFtZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoJCgnI3VzZXJuYW1lJykudmFsKCkubGVuZ3RoIDwgNSkgeyByZXR1cm47IH1cbiAgICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgICBfLmRlYm91bmNlKCQucG9zdCgnL3JlZ2lzdGVyVmFsaWRhdGlvbicsIHsgdXNlcm5hbWU6ICQoJyN1c2VybmFtZScpLnZhbCgpIH0sZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgZGF0YS51c2VybmFtZUF2YWlsYWJsZSA/XG4gICAgICAgICAgIHRoaXNfLnJlbmRlclZhbGlkYXRpb24odGhpc18udXNlcm5hbWVBdmFpbGFibGVUZW1wbGF0ZSgpKVxuICAgICAgICAgOlxuICAgICAgICAgICB0aGlzXy5yZW5kZXJWYWxpZGF0aW9uKHRoaXNfLnVzZXJuYW1lVGFrZW5UZW1wbGF0ZSgpKTtcbiAgICAgIH0pLCAxNTApO1xuICAgIH0sXG4gICAgcmVuZGVyVmFsaWRhdGlvbjogZnVuY3Rpb24od2hhdCkge1xuICAgICAgJCgnLnJlZ2lzdGVyLWVycm9yLWNvbnRhaW5lcicpLmVtcHR5KCk7XG4gICAgICAkKHdoYXQpLmFwcGVuZFRvKCQoJy5yZWdpc3Rlci1lcnJvci1jb250YWluZXInKSkuaGlkZSgpLmZhZGVJbigpO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnLnJlZ2lzdGVyLWVycm9yLWNvbnRhaW5lcicpLmNoaWxkcmVuKCkuZmlyc3QoKS5mYWRlT3V0KCk7XG4gICAgICB9LCAyMDAwKTtcblxuICAgIH1cbiAgfSk7XG5cbn0pKGpRdWVyeSk7IiwiXG4vLyBUaGUgQ2hhdENsaWVudCBpcyBpbXBsZW1lbnRlZCBvbiBtYWluLmpzLlxuLy8gVGhlIGNoYXRjbGllbnQgaXMgYSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBvbiB0aGUgTWFpbkNvbnRyb2xsZXIuXG4vLyBJdCBib3RoIGxpc3RlbnMgdG8gYW5kIGVtaXRzIGV2ZW50cyBvbiB0aGUgc29ja2V0LCBlZzpcbi8vIEl0IGhhcyBpdHMgb3duIG1ldGhvZHMgdGhhdCwgd2hlbiBjYWxsZWQsIGVtaXQgdG8gdGhlIHNvY2tldCB3LyBkYXRhLlxuLy8gSXQgYWxzbyBzZXRzIHJlc3BvbnNlIGxpc3RlbmVycyBvbiBjb25uZWN0aW9uLCB0aGVzZSByZXNwb25zZSBsaXN0ZW5lcnNcbi8vIGxpc3RlbiB0byB0aGUgc29ja2V0IGFuZCB0cmlnZ2VyIGV2ZW50cyBvbiB0aGUgYXBwRXZlbnRCdXMgb24gdGhlIFxuLy8gTWFpbkNvbnRyb2xsZXJcbnZhciBDaGF0Q2xpZW50ID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXG5cdHZhciBzZWxmID0gdGhpcztcblxuXHQvLyBpcy10eXBpbmcgaGVscGVyIHZhcmlhYmxlc1xuXHR2YXIgVFlQSU5HX1RJTUVSX0xFTkdUSCA9IDQwMDsgLy8gbXNcbiAgdmFyIHR5cGluZyA9IGZhbHNlO1xuICB2YXIgbGFzdFR5cGluZ1RpbWU7XG4gIFxuICAvLyB0aGlzIHZlbnQgaG9sZHMgdGhlIGFwcEV2ZW50QnVzXG5cdHNlbGYudmVudCA9IG9wdGlvbnMudmVudDtcblxuICAvL211c3QgYmUgaHR0cHMgb24gaGVyb2t1IGFuZCBodHRwIG9uIGxvY2FsaG9zdFxuXHRzZWxmLmhvc3RuYW1lID0gJ2h0dHBzOi8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xuXG4gIC8vIGNvbm5lY3RzIHRvIHNvY2tldCwgc2V0cyByZXNwb25zZSBsaXN0ZW5lcnNcblx0c2VsZi5jb25uZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuY29ubmVjdCcpO1xuXHRcdC8vIHRoaXMgaW8gbWlnaHQgYmUgYSBsaXR0bGUgY29uZnVzaW5nLi4uIHdoZXJlIGlzIGl0IGNvbWluZyBmcm9tP1xuXHRcdC8vIGl0J3MgY29taW5nIGZyb20gdGhlIHN0YXRpYyBtaWRkbGV3YXJlIG9uIHNlcnZlci5qcyBiYyBldmVyeXRoaW5nXG5cdFx0Ly8gaW4gdGhlIC9wdWJsaWMgZm9sZGVyIGhhcyBiZWVuIGF0dGFjaGVkIHRvIHRoZSBzZXJ2ZXIsIGFuZCB2aXNhXG5cdFx0Ly8gdmVyc2EuXG5cblxuICAgIC8vIGxvY2FsXG5cdFx0c2VsZi5zb2NrZXQgPSBpby5jb25uZWN0KCk7XG5cbiAgICAvLyBoZXJva3VcbiAgICAvLyBzZWxmLnNvY2tldCA9IGlvLmNvbm5lY3QoJ2h0dHA6Ly93d3cuY2hqYXQuY29tLycsIHsgdHJhbnNwb3J0czogWyd3ZWJzb2NrZXQnXSB9ICk7XG5cbiAgICBzZWxmLnNldFJlc3BvbnNlTGlzdGVuZXJzKHNlbGYuc29ja2V0KTtcbiAgfTtcblxuXG5cbi8vLy8vIFZpZXdFdmVudEJ1cyBtZXRob2RzIC8vLy9cbiAgICAvLyBtZXRob2RzIHRoYXQgZW1pdCB0byB0aGUgY2hhdHNlcnZlclxuXG4vLyBMT0dJTlxuICBzZWxmLmxvZ2luID0gZnVuY3Rpb24odXNlcikge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmxvZ2luOiAnLCB1c2VyKTtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwibG9naW5cIiwgdXNlcik7XG4gIH07XG4gIHNlbGYubG9nb3V0ID0gZnVuY3Rpb24odXNlcikge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmxvZ291dDogJywgdXNlcik7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcImxvZ291dFwiKTtcbiAgfTtcblxuXG4vLyBST09NXG4gIHNlbGYuY29ubmVjdFRvUm9vbSA9IGZ1bmN0aW9uKHJvb21OYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuY29ubmVjdFRvUm9vbTogJywgcm9vbU5hbWUpO1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJjb25uZWN0VG9Sb29tXCIsIHJvb21OYW1lKTtcbiAgfTtcbiAgc2VsZi5qb2luUm9vbSA9IGZ1bmN0aW9uKHJvb21OYW1lKSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdCgnam9pblJvb20nLCByb29tTmFtZSk7XG4gIH07XG4gIHNlbGYuYWRkUm9vbSA9IGZ1bmN0aW9uKHJvb21OYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuYWRkUm9vbTogJywgcm9vbU5hbWUpO1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJhZGRSb29tXCIsIHJvb21OYW1lKTtcbiAgfTtcbiAgc2VsZi5yZW1vdmVSb29tID0gZnVuY3Rpb24ocm9vbURhdGEpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5yZW1vdmVSb29tOiAnLCByb29tRGF0YSk7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcInJlbW92ZVJvb21cIiwgcm9vbURhdGEpO1xuICB9O1xuICBzZWxmLmNyZWF0ZVJvb20gPSBmdW5jdGlvbihmb3JtRGF0YSkge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmNyZWF0ZVJvb206ICcsIGZvcm1EYXRhKTtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwiY3JlYXRlUm9vbVwiLCBmb3JtRGF0YSk7XG4gIH07XG4gIHNlbGYudXBkYXRlUm9vbSA9IGZ1bmN0aW9uKGZvcm1EYXRhKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYudXBkYXRlUm9vbTogJywgZm9ybURhdGEpO1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJ1cGRhdGVSb29tXCIsIGZvcm1EYXRhKTtcbiAgfTtcbiAgc2VsZi5kZXN0cm95Um9vbSA9IGZ1bmN0aW9uKHJvb21JbmZvKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuZGVzdHJveVJvb206ICcsIHJvb21JbmZvKTtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwiZGVzdHJveVJvb21cIiwgcm9vbUluZm8pO1xuICB9O1xuXG5cblxuLy8gQ0hBVFxuICBzZWxmLmNoYXQgPSBmdW5jdGlvbihjaGF0KSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuY2hhdDogJywgY2hhdCk7XG5cdFx0c2VsZi5zb2NrZXQuZW1pdChcImNoYXRcIiwgY2hhdCk7XG5cdH07XG4gIHNlbGYuZ2V0TW9yZUNoYXRzID0gZnVuY3Rpb24oY2hhdFJlcSkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoJ2dldE1vcmVDaGF0cycsIGNoYXRSZXEpO1xuICB9O1xuXG5cbi8vIERJUkVDVCBNRVNTQUdFXG4gIHNlbGYuaW5pdERpcmVjdE1lc3NhZ2UgPSBmdW5jdGlvbihyZWNpcGllbnQpIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KCdpbml0RGlyZWN0TWVzc2FnZScsIHJlY2lwaWVudCk7XG4gIH07XG4gIHNlbGYuZGlyZWN0TWVzc2FnZSA9IGZ1bmN0aW9uKGRpcmVjdE1lc3NhZ2UpIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KCdkaXJlY3RNZXNzYWdlJywgZGlyZWN0TWVzc2FnZSk7XG4gIH07XG4gIHNlbGYuZ2V0TW9yZURpcmVjdE1lc3NhZ2VzID0gZnVuY3Rpb24oZGlyZWN0TWVzc2FnZVJlcSkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoJ2dldE1vcmVEaXJlY3RNZXNzYWdlcycsIGRpcmVjdE1lc3NhZ2VSZXEpO1xuICB9O1xuICBcblxuLy8gVFlQSU5HXG5cdHNlbGYuYWRkQ2hhdFR5cGluZyA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgbWVzc2FnZSA9IGRhdGEudXNlcm5hbWUgKyAnIGlzIHR5cGluZyc7XG4gICAgJCgnLnR5cGV0eXBldHlwZScpLnRleHQobWVzc2FnZSk7XG5cdH07XG5cdHNlbGYucmVtb3ZlQ2hhdFR5cGluZyA9IGZ1bmN0aW9uKCkge1xuICAgICQoJy50eXBldHlwZXR5cGUnKS5lbXB0eSgpO1xuXHR9O1xuICBzZWxmLnVwZGF0ZVR5cGluZyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChzZWxmLnNvY2tldCkge1xuICAgICAgaWYgKCF0eXBpbmcpIHtcbiAgICAgICAgdHlwaW5nID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5zb2NrZXQuZW1pdCgndHlwaW5nJyk7XG4gICAgICB9XG4gICAgICBsYXN0VHlwaW5nVGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdHlwaW5nVGltZXIgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgICB2YXIgdGltZURpZmYgPSB0eXBpbmdUaW1lciAtIGxhc3RUeXBpbmdUaW1lO1xuICAgICAgICBpZiAodGltZURpZmYgPj0gVFlQSU5HX1RJTUVSX0xFTkdUSCAmJiB0eXBpbmcpIHtcbiAgICAgICAgICAgc2VsZi5zb2NrZXQuZW1pdCgnc3RvcCB0eXBpbmcnKTtcbiAgICAgICAgICAgdHlwaW5nID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0sIFRZUElOR19USU1FUl9MRU5HVEgpO1xuICAgIH1cbiAgfTtcblxuXG4vLyBJTlZJVEFUSU9OU1xuICBzZWxmLmludml0ZVVzZXIgPSBmdW5jdGlvbihpbnZpdGF0aW9uT2JqKSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcImludml0ZVVzZXJcIiwgaW52aXRhdGlvbk9iaik7XG4gIH07XG4gIHNlbGYuZGVsZXRlSW52aXRhdGlvbiA9IGZ1bmN0aW9uKHJvb21JZCkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJkZWxldGVJbnZpdGF0aW9uXCIsIHJvb21JZCk7XG4gIH07XG4gIHNlbGYuYWNjZXB0SW52aXRhdGlvbiA9IGZ1bmN0aW9uKHJvb21JZCkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJhY2NlcHRJbnZpdGF0aW9uXCIsIHJvb21JZCk7XG4gIH07XG5cbi8vIFVQREFURSBVU0VSXG4gIHNlbGYudXBkYXRlVXNlciA9IGZ1bmN0aW9uKHVzZXJPYmopIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwidXBkYXRlVXNlclwiLCB1c2VyT2JqKTtcbiAgfTtcblxuXG5cbi8vIEVSUk9SIEhBTkRMSU5HXG4gIHNlbGYuZG9lc0NoYXRyb29tRXhpc3QgPSBmdW5jdGlvbihjaGF0cm9vbVF1ZXJ5KSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdCgnZG9lc0NoYXRyb29tRXhpc3QnLCBjaGF0cm9vbVF1ZXJ5KTtcbiAgfTtcbiAgc2VsZi5kb2VzSG9tZVJvb21FeGlzdCA9IGZ1bmN0aW9uKGhvbWVSb29tUXVlcnkpIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KCdkb2VzSG9tZVJvb21FeGlzdCcsIGhvbWVSb29tUXVlcnkpO1xuICB9O1xuXG5cbiAgXG5cblxuXG5cbiAgLy8vLy8vLy8vLy8vLy8gY2hhdHNlcnZlciBsaXN0ZW5lcnMvLy8vLy8vLy8vLy8vXG5cbiAgLy8gdGhlc2UgZ3V5cyBsaXN0ZW4gdG8gdGhlIGNoYXRzZXJ2ZXIvc29ja2V0IGFuZCBlbWl0IGRhdGEgdG8gbWFpbi5qcyxcbiAgLy8gc3BlY2lmaWNhbGx5IHRvIHRoZSBhcHBFdmVudEJ1cy5cblx0c2VsZi5zZXRSZXNwb25zZUxpc3RlbmVycyA9IGZ1bmN0aW9uKHNvY2tldCkge1xuXG5cbi8vIExPR0lOXG4gICAgc29ja2V0Lm9uKCdpbml0VXNlcicsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLmluaXRVc2VyJyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcignaW5pdFVzZXInLCB1c2VyKTtcbiAgICAgIHNlbGYuY29ubmVjdFRvUm9vbSh1c2VyLmhvbWVSb29tKTtcbiAgICB9KTtcblxuXG4vLyBDSEFUXG5cdFx0c29ja2V0Lm9uKCd1c2VySm9pbmVkJywgZnVuY3Rpb24odXNlcikge1xuXHRcdFx0Y29uc29sZS5sb2coJ3NjLmUudXNlckpvaW5lZDogJywgdXNlcik7XG4gICAgICAvLyBzb2NrZXQuZW1pdChcIm9ubGluZVVzZXJzXCIpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJ1c2VySm9pbmVkXCIsIHVzZXIpO1xuXHRcdH0pO1xuXHRcdHNvY2tldC5vbigndXNlckxlZnQnLCBmdW5jdGlvbih1c2VyKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnc2MuZS51c2VyTGVmdDogJywgdXNlcik7XG4gICAgICAvLyBzb2NrZXQuZW1pdChcIm9ubGluZVVzZXJzXCIpO1xuXHRcdFx0c2VsZi52ZW50LnRyaWdnZXIoXCJ1c2VyTGVmdFwiLCB1c2VyKTtcblx0XHR9KTtcblx0XHRzb2NrZXQub24oJ2NoYXQnLCBmdW5jdGlvbihjaGF0KSB7XG5cdFx0XHRjb25zb2xlLmxvZygnc2MuZS5jaGF0OiAnLCBjaGF0KTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwiY2hhdFJlY2VpdmVkXCIsIGNoYXQpO1xuXHRcdH0pO1xuICAgIHNvY2tldC5vbignbW9yZUNoYXRzJywgZnVuY3Rpb24oY2hhdHMpIHtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwibW9yZUNoYXRzXCIsIGNoYXRzKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ25vTW9yZUNoYXRzJywgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcIm5vTW9yZUNoYXRzXCIpO1xuICAgIH0pO1xuXG5cbi8vIERJUkVDVCBNRVNTQUdFXG4gICAgc29ja2V0Lm9uKCdzZXREaXJlY3RNZXNzYWdlQ2hhdGxvZycsIGZ1bmN0aW9uKGNoYXRsb2cpIHtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0RE1jaGF0bG9nXCIsIGNoYXRsb2cpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbignc2V0RGlyZWN0TWVzc2FnZUhlYWRlcicsIGZ1bmN0aW9uKGhlYWRlcikge1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRETWhlYWRlclwiLCBoZWFkZXIpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbignZGlyZWN0TWVzc2FnZScsIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgIC8vIHNlbGYudmVudC50cmlnZ2VyKFwicmVuZGVyRGlyZWN0TWVzc2FnZVwiLCBETSk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcImRpcmVjdE1lc3NhZ2VSZWNlaXZlZFwiLCBtZXNzYWdlKTtcbiAgICB9KTtcblxuXG5cbi8vIFRZUElOR1xuICAgIHNvY2tldC5vbigndHlwaW5nJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgc2VsZi5hZGRDaGF0VHlwaW5nKGRhdGEpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbignc3RvcCB0eXBpbmcnLCBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYucmVtb3ZlQ2hhdFR5cGluZygpO1xuICAgIH0pO1xuXG5cbi8vIFNFVCBST09NXG4gICAgc29ja2V0Lm9uKCdjaGF0bG9nJywgZnVuY3Rpb24oY2hhdGxvZykge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUuY2hhdGxvZzogJywgY2hhdGxvZyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldENoYXRsb2dcIiwgY2hhdGxvZyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdjaGF0cm9vbXMnLCBmdW5jdGlvbihjaGF0cm9vbXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLmNoYXRyb29tczogICcsIGNoYXRyb29tcyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldENoYXRyb29tc1wiLCBjaGF0cm9vbXMpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbigncHJpdmF0ZVJvb21zJywgZnVuY3Rpb24ocm9vbXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLnByaXZhdGVSb29tczogICcsIHJvb21zKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0UHJpdmF0ZVJvb21zXCIsIHJvb21zKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ29ubGluZVVzZXJzJywgZnVuY3Rpb24ob25saW5lVXNlcnMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLm9ubGluZVVzZXJzOiAnLCBvbmxpbmVVc2Vycyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldE9ubGluZVVzZXJzXCIsIG9ubGluZVVzZXJzKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ29mZmxpbmVVc2VycycsIGZ1bmN0aW9uKG9mZmxpbmVVc2Vycykge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUub2ZmbGluZVVzZXJzOiAnLCBvZmZsaW5lVXNlcnMpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRPZmZsaW5lVXNlcnNcIiwgb2ZmbGluZVVzZXJzKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ2NoYXRyb29tSGVhZGVyJywgZnVuY3Rpb24oaGVhZGVyT2JqKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5jaGF0cm9vbUhlYWRlcjogJywgaGVhZGVyT2JqKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0Q2hhdHJvb21IZWFkZXJcIiwgaGVhZGVyT2JqKTtcbiAgICB9KTtcblxuXG4vLyBSRURJUkVDVCBUTyBIT01FIFJPT01cbiAgICBzb2NrZXQub24oJ3JlZGlyZWN0VG9Ib21lUm9vbScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLnJlZGlyZWN0VG9Ib21lUm9vbTogJywgZGF0YSk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInJlZGlyZWN0VG9Ib21lUm9vbVwiLCBkYXRhKTtcbiAgICB9KTtcblxuLy8gUk9PTSBBVkFJTEFCSUxJVFlcbiAgICBzb2NrZXQub24oJ2NoYXRyb29tQXZhaWxhYmlsaXR5JywgZnVuY3Rpb24oYXZhaWxhYmlsdHkpIHtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKCdjaGF0cm9vbUF2YWlsYWJpbGl0eScsIGF2YWlsYWJpbHR5KTtcbiAgICB9KTtcblxuICAgIHNvY2tldC5vbignaG9tZVJvb21BdmFpbGFiaWxpdHknLCBmdW5jdGlvbihhdmFpbGFiaWx0eSkge1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoJ2hvbWVSb29tQXZhaWxhYmlsaXR5JywgYXZhaWxhYmlsdHkpO1xuICAgIH0pO1xuXG5cbi8vIEVSUk9SIEhBTkRMSU5HXG4gICAgc29ja2V0Lm9uKCdjaGF0cm9vbUFscmVhZHlFeGlzdHMnLCBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwiY2hhdHJvb21BbHJlYWR5RXhpc3RzXCIpO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKCdkZXN0cm95Um9vbVJlc3BvbnNlJywgZnVuY3Rpb24ocmVzKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcImRlc3Ryb3lSb29tUmVzcG9uc2VcIiwgcmVzKTtcbiAgICB9KTtcblxuLy8gSU5WSVRBVElPTlNcbiAgICBzb2NrZXQub24oJ3JlZnJlc2hJbnZpdGF0aW9ucycsIGZ1bmN0aW9uKGludml0YXRpb25zKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInJlZnJlc2hJbnZpdGF0aW9uc1wiLCBpbnZpdGF0aW9ucyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCd1c2VySW52aXRlZCcsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwidXNlckludml0ZWRcIiwgdXNlcik7XG4gICAgfSk7XG5cblxuXHR9O1xufTsiLCJcblxuYXBwLk1haW5Db250cm9sbGVyID0gZnVuY3Rpb24oKSB7XG5cblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cbiAgLy9UaGVzZSBhbGxvd3MgdXMgdG8gYmluZCBhbmQgdHJpZ2dlciBvbiB0aGUgb2JqZWN0IGZyb20gYW55d2hlcmUgaW4gdGhlIGFwcC5cblx0c2VsZi5hcHBFdmVudEJ1cyA9IF8uZXh0ZW5kKHt9LCBCYWNrYm9uZS5FdmVudHMpO1xuXHRzZWxmLnZpZXdFdmVudEJ1cyA9IF8uZXh0ZW5kKHt9LCBCYWNrYm9uZS5FdmVudHMpO1xuXG5cdHNlbGYuaW5pdCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gbG9naW5Nb2RlbFxuICAgIHNlbGYubG9naW5Nb2RlbCA9IG5ldyBhcHAuTG9naW5Nb2RlbCgpO1xuICAgIHNlbGYubG9naW5WaWV3ID0gbmV3IGFwcC5Mb2dpblZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzLCBtb2RlbDogc2VsZi5sb2dpbk1vZGVsfSk7XG4gICAgc2VsZi5yZWdpc3RlclZpZXcgPSBuZXcgYXBwLlJlZ2lzdGVyVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXMgfSk7XG4gICAgc2VsZi5uYXZiYXJWaWV3ID0gbmV3IGFwcC5OYXZiYXJWaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1c30pO1xuXG5cbiAgICAvLyBUaGUgQ29udGFpbmVyTW9kZWwgZ2V0cyBwYXNzZWQgYSB2aWV3U3RhdGUsIExvZ2luVmlldywgd2hpY2hcbiAgICAvLyBpcyB0aGUgbG9naW4gcGFnZS4gVGhhdCBMb2dpblZpZXcgZ2V0cyBwYXNzZWQgdGhlIHZpZXdFdmVudEJ1c1xuICAgIC8vIGFuZCB0aGUgTG9naW5Nb2RlbC5cbiAgICBzZWxmLmNvbnRhaW5lck1vZGVsID0gbmV3IGFwcC5Db250YWluZXJNb2RlbCh7IHZpZXdTdGF0ZTogc2VsZi5sb2dpblZpZXd9KTtcblxuICAgIC8vIG5leHQsIGEgbmV3IENvbnRhaW5lclZpZXcgaXMgaW50aWFsaXplZCB3aXRoIHRoZSBuZXdseSBjcmVhdGVkIGNvbnRhaW5lck1vZGVsXG4gICAgLy8gdGhlIGxvZ2luIHBhZ2UgaXMgdGhlbiByZW5kZXJlZC5cbiAgICBzZWxmLmNvbnRhaW5lclZpZXcgPSBuZXcgYXBwLkNvbnRhaW5lclZpZXcoeyBtb2RlbDogc2VsZi5jb250YWluZXJNb2RlbCB9KTtcbiAgICBzZWxmLmNvbnRhaW5lclZpZXcucmVuZGVyKCk7XG5cbiBcbiAgICAkKCdmb3JtJykua2V5cHJlc3MoZnVuY3Rpb24oZSkge1xuICAgICAgcmV0dXJuIGUua2V5Q29kZSAhPSAxMztcbiAgICB9KTtcblxuXG4gIH07XG5cblxuICBzZWxmLmF1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbigpIHtcblxuICAgIGNvbnNvbGUubG9nKCdmLm1haW4uYXV0aGVudGljYXRlZCcpO1xuICAgICAgIFxuICAgICQoXCJib2R5XCIpLmNzcyhcIm92ZXJmbG93XCIsIFwiaGlkZGVuXCIpO1xuICAgICQoJ2Zvcm0nKS5rZXlwcmVzcyhmdW5jdGlvbihlKSB7XG4gICAgICByZXR1cm4gZS5rZXlDb2RlICE9IDEzO1xuICAgIH0pO1xuXG4gICAgc2VsZi5jaGF0Q2xpZW50ID0gbmV3IENoYXRDbGllbnQoeyB2ZW50OiBzZWxmLmFwcEV2ZW50QnVzIH0pO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdodWgnKTtcbiAgICBzZWxmLmNoYXRDbGllbnQuY29ubmVjdCgpO1xuXG4gICAgLy8gbmV3IG1vZGVsIGFuZCB2aWV3IGNyZWF0ZWQgZm9yIGNoYXRyb29tXG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsID0gbmV3IGFwcC5DaGF0cm9vbU1vZGVsKHsgbmFtZTogJ1BhcmxvcicgfSk7XG4gICAgc2VsZi5jaGF0cm9vbUxpc3QgPSBuZXcgYXBwLkNoYXRyb29tTGlzdCgpO1xuICAgIHNlbGYucHJpdmF0ZVJvb21Db2xsZWN0aW9uID0gbmV3IGFwcC5Qcml2YXRlUm9vbUNvbGxlY3Rpb24oKTtcbiAgICBzZWxmLmNoYXRyb29tTGlzdC5mZXRjaCgpLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdjaGF0cm9vbXMnLCBzZWxmLmNoYXRyb29tTGlzdCk7XG4gICAgICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdwcml2YXRlUm9vbXMnLCBzZWxmLnByaXZhdGVSb29tQ29sbGVjdGlvbik7XG4gICAgICBzZWxmLmNoYXRyb29tVmlldyAgPSBuZXcgYXBwLkNoYXRyb29tVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXMsIG1vZGVsOiBzZWxmLmNoYXRyb29tTW9kZWwgfSk7XG4gICAgICBzZWxmLmNvbnRhaW5lck1vZGVsLnNldCgndmlld1N0YXRlJywgc2VsZi5jaGF0cm9vbVZpZXcpO1xuICAgICAgXG5cbiAgICAgIC8vIHNlbGYuY29ubmVjdFRvUm9vbSgpO1xuICAgICAgLy8gc2VsZi5pbml0Um9vbSgpO1xuICAgICAgICAgICAvLyA7XG4gICAgfSk7XG5cbiAgfTtcblxuICAvLyBzZWxmLmNvbm5lY3RUb1Jvb20gPSBmdW5jdGlvbigpIHtcbiAgLy8gICBjb25zb2xlLmxvZygnZi5tYWluLmNvbm5lY3RUb1Jvb20nKTtcbiAgLy8gICBzZWxmLmNoYXRDbGllbnQuY29ubmVjdFRvUm9vbShcIlBhcmxvclwiKTtcbiAgLy8gfTtcblxuICAvLyBzZWxmLmluaXRSb29tID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgLy8gICBzZWxmLmNoYXRyb29tVmlldy5pbml0Um9vbSgpO1xuICAvLyB9O1xuXG5cblxuXG5cbiAgLy8vLy8vLy8vLy8vICBCdXNzZXMgLy8vLy8vLy8vLy8vXG4gICAgLy8gVGhlc2UgQnVzc2VzIGxpc3RlbiB0byB0aGUgc29ja2V0Y2xpZW50XG4gICAvLyAgICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXG4gIC8vLy8gdmlld0V2ZW50QnVzIExpc3RlbmVycyAvLy8vL1xuICBcblx0c2VsZi52aWV3RXZlbnRCdXMub24oXCJsb2dpblwiLCBmdW5jdGlvbih1c2VyKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmxvZ2luKHVzZXIpO1xuICB9KTtcblx0c2VsZi52aWV3RXZlbnRCdXMub24oXCJjaGF0XCIsIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuY2hhdChjaGF0KTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwidHlwaW5nXCIsIGZ1bmN0aW9uKCkge1xuICAgIHNlbGYuY2hhdENsaWVudC51cGRhdGVUeXBpbmcoKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiam9pblJvb21cIiwgZnVuY3Rpb24ocm9vbU5hbWUpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuam9pblJvb20ocm9vbU5hbWUpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJhZGRSb29tXCIsIGZ1bmN0aW9uKHJvb20pIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuYWRkUm9vbShyb29tKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwicmVtb3ZlUm9vbVwiLCBmdW5jdGlvbihyb29tRGF0YSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5yZW1vdmVSb29tKHJvb21EYXRhKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiY3JlYXRlUm9vbVwiLCBmdW5jdGlvbihmb3JtRGF0YSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5jcmVhdGVSb29tKGZvcm1EYXRhKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwidXBkYXRlUm9vbVwiLCBmdW5jdGlvbihmb3JtRGF0YSkge1xuICAgIHNlbGYuY2hhdENsaWVudC51cGRhdGVSb29tKGZvcm1EYXRhKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiZGVzdHJveVJvb21cIiwgZnVuY3Rpb24ocm9vbUluZm8pIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuZGVzdHJveVJvb20ocm9vbUluZm8pO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJnZXRNb3JlQ2hhdHNcIiwgZnVuY3Rpb24oY2hhdFJlcSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5nZXRNb3JlQ2hhdHMoY2hhdFJlcSk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImRvZXNDaGF0cm9vbUV4aXN0XCIsIGZ1bmN0aW9uKGNoYXRyb29tUXVlcnkpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuZG9lc0NoYXRyb29tRXhpc3QoY2hhdHJvb21RdWVyeSk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImRvZXNIb21lUm9vbUV4aXN0XCIsIGZ1bmN0aW9uKGNoYXRyb29tUXVlcnkpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuZG9lc0hvbWVSb29tRXhpc3QoY2hhdHJvb21RdWVyeSk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImluaXREaXJlY3RNZXNzYWdlXCIsIGZ1bmN0aW9uKHJlY2lwaWVudCkge1xuICAgIHNlbGYuY2hhdENsaWVudC5pbml0RGlyZWN0TWVzc2FnZShyZWNpcGllbnQpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJkaXJlY3RNZXNzYWdlXCIsIGZ1bmN0aW9uKGRpcmVjdE1lc3NhZ2UpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuZGlyZWN0TWVzc2FnZShkaXJlY3RNZXNzYWdlKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiZ2V0TW9yZURpcmVjdE1lc3NhZ2VzXCIsIGZ1bmN0aW9uKGRpcmVjdE1lc3NhZ2VSZXEpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuZ2V0TW9yZURpcmVjdE1lc3NhZ2VzKGRpcmVjdE1lc3NhZ2VSZXEpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJpbnZpdGVVc2VyXCIsIGZ1bmN0aW9uKGludml0YXRpb25PYmopIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuaW52aXRlVXNlcihpbnZpdGF0aW9uT2JqKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiZGVsZXRlSW52aXRhdGlvblwiLCBmdW5jdGlvbihyb29tSWQpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuZGVsZXRlSW52aXRhdGlvbihyb29tSWQpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJhY2NlcHRJbnZpdGF0aW9uXCIsIGZ1bmN0aW9uKHJvb21JZCkge1xuICAgIHNlbGYuY2hhdENsaWVudC5hY2NlcHRJbnZpdGF0aW9uKHJvb21JZCk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcInVwZGF0ZVVzZXJcIiwgZnVuY3Rpb24odXNlck9iaikge1xuICAgIHNlbGYuY2hhdENsaWVudC51cGRhdGVVc2VyKHVzZXJPYmopO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJsb2dvdXRcIiwgZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmxvZ291dCgpO1xuICB9KTtcblxuXG5cblxuXG5cbiAgLy8vLyBhcHBFdmVudEJ1cyBMaXN0ZW5lcnMgLy8vL1xuXG5cdC8vIHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2Vyc0luZm9cIiwgZnVuY3Rpb24oZGF0YSkge1xuIC8vICAgIGNvbnNvbGUubG9nKCdtYWluLmUudXNlcnNJbmZvOiAnLCBkYXRhKTtcbiAvLyAgICAvL2RhdGEgaXMgYW4gYXJyYXkgb2YgdXNlcm5hbWVzLCBpbmNsdWRpbmcgdGhlIG5ldyB1c2VyXG5cdC8vIFx0Ly8gVGhpcyBtZXRob2QgZ2V0cyB0aGUgb25saW5lIHVzZXJzIGNvbGxlY3Rpb24gZnJvbSBjaGF0cm9vbU1vZGVsLlxuXHQvLyBcdC8vIG9ubGluZVVzZXJzIGlzIHRoZSBjb2xsZWN0aW9uXG5cdC8vIFx0dmFyIG9ubGluZVVzZXJzID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpO1xuIC8vICAgIGNvbnNvbGUubG9nKFwiLi4ub25saW5lVXNlcnM6IFwiLCBvbmxpbmVVc2Vycyk7XG5cdC8vIFx0dmFyIHVzZXJzID0gXy5tYXAoZGF0YSwgZnVuY3Rpb24oaXRlbSkge1xuXHQvLyBcdFx0cmV0dXJuIG5ldyBhcHAuVXNlck1vZGVsKHt1c2VybmFtZTogaXRlbX0pO1xuXHQvLyBcdH0pO1xuIC8vICAgIGNvbnNvbGUubG9nKFwidXNlcnM6IFwiLCB1c2Vycyk7XG5cdC8vIFx0b25saW5lVXNlcnMucmVzZXQodXNlcnMpO1xuXHQvLyB9KTtcblxuIC8vICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwicm9vbUluZm9cIiwgZnVuY3Rpb24oZGF0YSkge1xuIC8vICAgIGRlYnVnZ2VyO1xuIC8vICAgIGNvbnNvbGUubG9nKCdtYWluLmUucm9vbUluZm86ICcsIGRhdGEpO1xuIC8vICAgIHZhciByb29tcyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoXCJjaGF0cm9vbXNcIik7XG4gLy8gICAgIGNvbnNvbGUubG9nKFwiLi4ucm9vbXM6IFwiLCByb29tcyk7XG4gLy8gICAgdmFyIHVwZGF0ZWRSb29tcyA9IF8ubWFwKGRhdGEsIGZ1bmN0aW9uKHJvb20pIHtcbiAvLyAgICAgIHZhciBuZXdDaGF0cm9vbU1vZGVsID0gbmV3IGFwcC5DaGF0cm9vbU1vZGVsKHtuYW1lOiByb29tfSk7XG4gLy8gICAgICByZXR1cm4gbmV3Q2hhdHJvb21Nb2RlbDtcbiAvLyAgICB9KTtcbiAvLyAgICBjb25zb2xlLmxvZyhcIi4uLnVwZGF0ZWRyb29tczogXCIsIHVwZGF0ZWRSb29tcyk7XG4gLy8gICAgcm9vbXMucmVzZXQodXBkYXRlZFJvb21zKTtcbiAvLyAgfSk7XG5cblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJpbml0VXNlclwiLCBmdW5jdGlvbih1c2VyKSB7XG4gICAgY29uc29sZS5sb2coJ21haW4uZS5pbml0VXNlcjogJywgdXNlcik7XG4gICAgaW52aXRhdGlvbnMgPSBzZWxmLm5hdmJhclZpZXcubW9kZWwuZ2V0KCdpbnZpdGF0aW9ucycpO1xuICAgIG5ld0ludml0YXRpb25zID0gXy5tYXAodXNlci5pbnZpdGF0aW9ucywgZnVuY3Rpb24oaW52aXRlKSB7XG4gICAgICAgdmFyIG5ld0ludml0YXRpb24gPSBuZXcgYXBwLkludml0YXRpb25Nb2RlbChpbnZpdGUpO1xuICAgICAgIHJldHVybiBuZXdJbnZpdGF0aW9uO1xuICAgIH0pO1xuICAgIGludml0YXRpb25zLnJlc2V0KG5ld0ludml0YXRpb25zKTtcbiAgICBzZWxmLm5hdmJhclZpZXcubW9kZWwuc2V0KHsgJ3VzZXJuYW1lJzogdXNlci51c2VybmFtZSwgJ2hvbWVSb29tJzogdXNlci5ob21lUm9vbSwgJ3VzZXJJbWFnZSc6IHVzZXIudXNlckltYWdlIH0pO1xuICB9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwicmVmcmVzaEludml0YXRpb25zXCIsIGZ1bmN0aW9uKGludml0YXRpb25zKSB7XG4gICAgY29uc29sZS5sb2coJ21haW4uZS5yZWZyZXNoSW52aXRhdGlvbnM6ICcsIGludml0YXRpb25zKTtcbiAgICBvbGRJbnZpdGF0aW9ucyA9IHNlbGYubmF2YmFyVmlldy5tb2RlbC5nZXQoJ2ludml0YXRpb25zJyk7XG4gICAgbmV3SW52aXRhdGlvbnMgPSBfLm1hcChpbnZpdGF0aW9ucywgZnVuY3Rpb24oaW52aXRlKSB7XG4gICAgICAgdmFyIG5ld0ludml0YXRpb24gPSBuZXcgYXBwLkludml0YXRpb25Nb2RlbChpbnZpdGUpO1xuICAgICAgIHJldHVybiBuZXdJbnZpdGF0aW9uO1xuICAgIH0pO1xuICAgIG9sZEludml0YXRpb25zLnJlc2V0KG5ld0ludml0YXRpb25zKTtcbiAgfSk7XG5cblxuICAvLyBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0Um9vbVwiLCBmdW5jdGlvbihtb2RlbCkge1xuICAvLyAgIGNvbnNvbGUubG9nKCdtYWluLmUuc2V0Um9vbTogJywgbW9kZWwpO1xuXG4gIC8vICAgdmFyIGNoYXRsb2cgPSBuZXcgYXBwLkNoYXRDb2xsZWN0aW9uKG1vZGVsLmNoYXRsb2cpO1xuICAvLyAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zZXQoJ2NoYXRsb2cnLCBjaGF0bG9nKTtcblxuICAvLyAgIHZhciByb29tcyA9IG5ldyBhcHAuQ2hhdHJvb21MaXN0KG1vZGVsLmNoYXRyb29tcyk7XG4gIC8vICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnY2hhdHJvb21zJywgcm9vbXMpO1xuXG4gIC8vICAgdmFyIHVzZXJzID0gbmV3IGFwcC5Vc2VyQ29sbGVjdGlvbihtb2RlbC5vbmxpbmVVc2Vycyk7XG4gIC8vICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnb25saW5lVXNlcnMnLCB1c2Vycyk7XG5cbiAgLy8gfSk7XG5cblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJDaGF0cm9vbU1vZGVsXCIsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgY29uc29sZS5sb2coJ21haW4uZS5DaGF0cm9vbU1vZGVsOiAnLCBtb2RlbCk7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsID0gbmV3IGFwcC5DaGF0cm9vbU1vZGVsKCk7XG4gICAgc2VsZi5jaGF0cm9vbUxpc3QgPSBuZXcgYXBwLkNoYXRyb29tTGlzdCgpO1xuICAgIHNlbGYuY2hhdHJvb21WaWV3ICA9IG5ldyBhcHAuQ2hhdHJvb21WaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cywgbW9kZWw6IHNlbGYuY2hhdHJvb21Nb2RlbCwgY29sbGVjdGlvbjogc2VsZi5jaGF0cm9vbUxpc3R9KTtcbiAgICBzZWxmLmNvbnRhaW5lck1vZGVsLnNldCgndmlld1N0YXRlJywgc2VsZi5jaGF0cm9vbVZpZXcpO1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5sb2FkTW9kZWwobW9kZWwpO1xuICB9KTtcblxuXG5cbiAgLy8gYWRkcyBuZXcgdXNlciB0byB1c2VycyBjb2xsZWN0aW9uLCBzZW5kcyBkZWZhdWx0IGpvaW5pbmcgbWVzc2FnZVxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwidXNlckpvaW5lZFwiLCBmdW5jdGlvbih1c2VyKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdtYWluLmUudXNlckpvaW5lZDogJywgdXNlcik7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLmFkZFVzZXIodXNlcik7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLmFkZENoYXQoe3NlbmRlcjogXCJCdXR0ZXJzXCIsIG1lc3NhZ2U6IHVzZXIudXNlcm5hbWUgKyBcIiBqb2luZWQgcm9vbS5cIiB9KTtcblx0fSk7XG5cblx0Ly8gcmVtb3ZlcyB1c2VyIGZyb20gdXNlcnMgY29sbGVjdGlvbiwgc2VuZHMgZGVmYXVsdCBsZWF2aW5nIG1lc3NhZ2Vcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcInVzZXJMZWZ0XCIsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ21haW4uZS51c2VyTGVmdDogJywgdXNlcik7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLnJlbW92ZVVzZXIodXNlcik7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLmFkZENoYXQoe3NlbmRlcjogXCJCdXR0ZXJzXCIsIG1lc3NhZ2U6IHVzZXIudXNlcm5hbWUgKyBcIiBsZWZ0IHJvb20uXCIgfSk7XG5cdH0pO1xuXG5cdC8vIGNoYXQgcGFzc2VkIGZyb20gc29ja2V0Y2xpZW50LCBhZGRzIGEgbmV3IGNoYXQgbWVzc2FnZSB1c2luZyBjaGF0cm9vbU1vZGVsIG1ldGhvZFxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwiY2hhdFJlY2VpdmVkXCIsIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwuYWRkQ2hhdChjaGF0KTtcblx0XHQkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcblx0fSk7XG5cblxuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInJlZGlyZWN0VG9Ib21lUm9vbVwiLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmNvbm5lY3RUb1Jvb20oZGF0YS5ob21lUm9vbSk7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRDaGF0cm9vbUhlYWRlclwiLCBmdW5jdGlvbihoZWFkZXJPYmopIHtcbiAgICB2YXIgbmV3SGVhZGVyID0gbmV3IGFwcC5DaGF0cm9vbUhlYWRlck1vZGVsKGhlYWRlck9iaik7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnY2hhdHJvb20nLCBuZXdIZWFkZXIpO1xuICB9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0Q2hhdGxvZ1wiLCBmdW5jdGlvbihjaGF0bG9nKSB7XG4gICAgdmFyIG9sZENoYXRsb2cgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KCdjaGF0bG9nJyk7XG4gICAgdmFyIHVwZGF0ZWRDaGF0bG9nID0gXy5tYXAoY2hhdGxvZywgZnVuY3Rpb24oY2hhdCkge1xuICAgICAgdmFyIG5ld0NoYXRNb2RlbCA9IG5ldyBhcHAuQ2hhdE1vZGVsKHsgcm9vbTogY2hhdC5yb29tLCBtZXNzYWdlOiBjaGF0Lm1lc3NhZ2UsIHNlbmRlcjogY2hhdC5zZW5kZXIsIHRpbWVzdGFtcDogY2hhdC50aW1lc3RhbXAsIHVybDogY2hhdC51cmwgfSk7XG4gICAgICByZXR1cm4gbmV3Q2hhdE1vZGVsO1xuICAgIH0pO1xuICAgIG9sZENoYXRsb2cucmVzZXQodXBkYXRlZENoYXRsb2cpO1xuICAgJCgnI21lc3NhZ2UtaW5wdXQnKS5yZW1vdmVDbGFzcygnZGlyZWN0LW1lc3NhZ2UtaW5wdXQnKS5hZGRDbGFzcygnbWVzc2FnZS1pbnB1dCcpO1xuICAgICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuICB9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwibW9yZUNoYXRzXCIsIGZ1bmN0aW9uKGNoYXRsb2cpIHtcbiAgICB2YXIgb2xkQ2hhdGxvZyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoJ2NoYXRsb2cnKTtcbiAgICB2YXIgbW9yZUNoYXRsb2cgPSBfLm1hcChjaGF0bG9nLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgICB2YXIgbmV3Q2hhdE1vZGVsID0gbmV3IGFwcC5DaGF0TW9kZWwoeyByb29tOiBjaGF0LnJvb20sIG1lc3NhZ2U6IGNoYXQubWVzc2FnZSwgc2VuZGVyOiBjaGF0LnNlbmRlciwgdGltZXN0YW1wOiBjaGF0LnRpbWVzdGFtcCwgdXJsOiBjaGF0LnVybCB9KTtcbiAgICAgIHJldHVybiBuZXdDaGF0TW9kZWw7XG4gICAgfSk7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLnRyaWdnZXIoJ21vcmVDaGF0cycsIG1vcmVDaGF0bG9nKTtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcIm5vTW9yZUNoYXRzXCIsIGZ1bmN0aW9uKGNoYXRsb2cpIHtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwuc3RvcExpc3RlbmluZygnbW9yZUNoYXRzJyk7XG4gIH0pO1xuICBcbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldENoYXRyb29tc1wiLCBmdW5jdGlvbihyb29tcykge1xuICAgIHZhciBvbGRSb29tcyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoJ2NoYXRyb29tcycpO1xuICAgIHZhciBuZXdSb29tcyA9IF8ubWFwKHJvb21zLCBmdW5jdGlvbihyb29tKSB7XG4gICAgICB2YXIgbmV3Q2hhdHJvb21Nb2RlbCA9IG5ldyBhcHAuQ2hhdHJvb21Nb2RlbCh7IGlkOiByb29tLl9pZCwgbmFtZTogcm9vbS5uYW1lLCBvd25lcjogcm9vbS5vd25lciwgcm9vbUltYWdlOiByb29tLnJvb21JbWFnZSwgcHJpdmFjeTogcm9vbS5wcml2YWN5fSk7XG4gICAgICByZXR1cm4gbmV3Q2hhdHJvb21Nb2RlbDtcbiAgICB9KTtcbiAgICBvbGRSb29tcy5yZXNldChuZXdSb29tcyk7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRQcml2YXRlUm9vbXNcIiwgZnVuY3Rpb24ocm9vbXMpIHtcbiAgICB2YXIgb2xkUm9vbXMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KCdwcml2YXRlUm9vbXMnKTtcbiAgICB2YXIgbmV3Um9vbXMgPSBfLm1hcChyb29tcywgZnVuY3Rpb24ocm9vbSkge1xuICAgICAgdmFyIG5ld0NoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoeyBpZDogcm9vbS5faWQsIG5hbWU6IHJvb20ubmFtZSwgb3duZXI6IHJvb20ub3duZXIsIHJvb21JbWFnZTogcm9vbS5yb29tSW1hZ2UsIHByaXZhY3k6IHJvb20ucHJpdmFjeSwgY3VycmVudFVzZXI6IHJvb20uY3VycmVudFVzZXJ9KTtcbiAgICAgIHJldHVybiBuZXdDaGF0cm9vbU1vZGVsO1xuICAgIH0pO1xuICAgIG9sZFJvb21zLnJlc2V0KG5ld1Jvb21zKTtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldE9ubGluZVVzZXJzXCIsIGZ1bmN0aW9uKG9ubGluZVVzZXJzKSB7XG4gICAgdmFyIG9sZE9ubGluZVVzZXJzID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldCgnb25saW5lVXNlcnMnKTtcbiAgICB2YXIgdXBkYXRlZE9ubGluZVVzZXJzID0gXy5tYXAob25saW5lVXNlcnMsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgIHZhciBuZXdVc2VyTW9kZWwgPSBuZXcgYXBwLlVzZXJNb2RlbCh7dXNlcm5hbWU6IHVzZXIudXNlcm5hbWUsIHVzZXJJbWFnZTogdXNlci51c2VySW1hZ2V9KTtcbiAgICAgIHJldHVybiBuZXdVc2VyTW9kZWw7XG4gICAgfSk7XG4gICAgb2xkT25saW5lVXNlcnMucmVzZXQodXBkYXRlZE9ubGluZVVzZXJzKTtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldE9mZmxpbmVVc2Vyc1wiLCBmdW5jdGlvbihvZmZsaW5lVXNlcnMpIHtcbiAgICB2YXIgb2xkT2ZmbGluZVVzZXJzID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldCgnb2ZmbGluZVVzZXJzJyk7XG4gICAgdmFyIHVwZGF0ZWRPZmZsaW5lVXNlcnMgPSBfLm1hcChvZmZsaW5lVXNlcnMsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgIHZhciBuZXdVc2VyTW9kZWwgPSBuZXcgYXBwLlVzZXJNb2RlbCh7dXNlcm5hbWU6IHVzZXIudXNlcm5hbWUsIHVzZXJJbWFnZTogdXNlci51c2VySW1hZ2V9KTtcbiAgICAgIHJldHVybiBuZXdVc2VyTW9kZWw7XG4gICAgfSk7XG4gICAgb2xkT2ZmbGluZVVzZXJzLnJlc2V0KHVwZGF0ZWRPZmZsaW5lVXNlcnMpO1xuICB9KTtcblxuXG4vLyBjaGF0cm9vbSBhdmFpbGFiaWxpdHlcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwiY2hhdHJvb21BdmFpbGFiaWxpdHlcIiwgZnVuY3Rpb24oYXZhaWxhYmlsaXR5KSB7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLnRyaWdnZXIoJ2NoYXRyb29tQXZhaWxhYmlsaXR5JywgYXZhaWxhYmlsaXR5KTtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcImhvbWVSb29tQXZhaWxhYmlsaXR5XCIsIGZ1bmN0aW9uKGF2YWlsYWJpbGl0eSkge1xuICAgIHNlbGYubmF2YmFyVmlldy50cmlnZ2VyKCdob21lUm9vbUF2YWlsYWJpbGl0eScsIGF2YWlsYWJpbGl0eSk7XG4gIH0pO1xuXG5cblxuLy8gZXJyb3JzXG5cblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwiY2hhdHJvb21BbHJlYWR5RXhpc3RzXCIsIGZ1bmN0aW9uKCkge1xuICAgIHN3YWwoe1xuICAgICAgdGl0bGU6IFwiT0ggTk8gT0ggTk8gT0ggTk9cIixcbiAgICAgIHRleHQ6IFwiQ2hhdHJvb20gQWxyZWFkeSwgSXQgQWxyZWFkeSBFeGlzdHMhIEFuZC4gRG9uJ3QgR28gSW4gVGhlcmUuIERvbid0LiBZb3UuIFlvdSBTaG91bGQgSGF2ZS4gSSBUaHJldyBVcCBPbiBUaGUgU2VydmVyLiBUaG9zZSBQb29yIC4gLiAuIFRoZXkgV2VyZSBKdXN0ISBPSCBOTyBXSFkuIFdIWSBPSCBOTy4gT0ggTk8uXCIsXG4gICAgICB0eXBlOiBcImVycm9yXCIsXG4gICAgICBjb25maXJtQnV0dG9uQ29sb3I6IFwiIzc0OUNBOFwiXG4gICAgfSk7XG4gIH0pO1xuXG5cblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwiZGVzdHJveVJvb21SZXNwb25zZVwiLCBmdW5jdGlvbihyZXMpIHtcbiAgICBpZiAocmVzLmVycm9yKSB7XG4gICAgICBzd2FsKHtcbiAgICAgICAgdGl0bGU6IFwiTm8gVG91Y2h5IVwiLFxuICAgICAgICB0ZXh0OiBcIllvdSBDYW4ndCBEZWxldGUgWW91ciBIb21lIFJvb20sIE51aCBVaC4gV2hvIGFyZSB5b3UsIEZyYW56IFJlaWNoZWx0P1wiLFxuICAgICAgICB0eXBlOiBcImVycm9yXCIsXG4gICAgICAgIGNvbmZpcm1CdXR0b25Db2xvcjogXCIjNzQ5Q0E4XCIsXG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKHJlcy5zdWNjZXNzKSB7XG4gICAgICBzd2FsKHtcbiAgICAgICAgdGl0bGU6IFwiRXZpc2NlcmF0ZWQhXCIsXG4gICAgICAgIHRleHQ6IFwiWW91ciBjaGF0cm9vbSBoYXMgYmVlbiBwdXJnZWQuXCIsXG4gICAgICAgIHR5cGU6IFwic3VjY2Vzc1wiLFxuICAgICAgICBjb25maXJtQnV0dG9uQ29sb3I6IFwiIzc0OUNBOFwiLFxuICAgICAgfSk7XG4gICAgfVxuICB9KTtcblxuICAvLyBEaXJlY3RNZXNzYWdlXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldERNY2hhdGxvZ1wiLCBmdW5jdGlvbihjaGF0bG9nKSB7XG4gICAgdmFyIG9sZENoYXRsb2cgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KCdjaGF0bG9nJyk7XG4gICAgdmFyIHVwZGF0ZWRDaGF0bG9nID0gXy5tYXAoY2hhdGxvZywgZnVuY3Rpb24oY2hhdCkge1xuICAgICAgdmFyIG5ld0NoYXRNb2RlbCA9IG5ldyBhcHAuQ2hhdE1vZGVsKHsgcm9vbTogY2hhdC5yb29tLCBtZXNzYWdlOiBjaGF0Lm1lc3NhZ2UsIHNlbmRlcjogY2hhdC5zZW5kZXIsIHRpbWVzdGFtcDogY2hhdC50aW1lc3RhbXAsIHVybDogY2hhdC51cmwgfSk7XG4gICAgICByZXR1cm4gbmV3Q2hhdE1vZGVsO1xuICAgIH0pO1xuICAgIG9sZENoYXRsb2cucmVzZXQodXBkYXRlZENoYXRsb2cpO1xuXG4gICAgJCgnI21lc3NhZ2UtaW5wdXQnKS5yZW1vdmVDbGFzcygnbWVzc2FnZS1pbnB1dCcpLmFkZENsYXNzKCdkaXJlY3QtbWVzc2FnZS1pbnB1dCcpO1xuICAgICQoJyNjaGF0SW1hZ2VVcGxvYWRDb250YWluZXInKS5kYXRhKCdjaGF0LXR5cGUnLCAnbWVzc2FnZScpO1xuICAgICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuICB9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0RE1oZWFkZXJcIiwgZnVuY3Rpb24oaGVhZGVyKSB7XG4gICAgdmFyIG5ld0hlYWRlciA9IG5ldyBhcHAuQ2hhdHJvb21IZWFkZXJNb2RlbChoZWFkZXIpO1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zZXQoJ2NoYXRyb29tJywgbmV3SGVhZGVyKTtcbiAgfSk7XG5cblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwiZGlyZWN0TWVzc2FnZVJlY2VpdmVkXCIsIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwuYWRkQ2hhdChtZXNzYWdlKTtcbiAgICAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcbiAgfSk7XG5cblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2VySW52aXRlZFwiLCBmdW5jdGlvbih1c2VyKSB7XG4gICAgY29uc29sZS5sb2coJ21haW4uZS51c2VySW52aXRlZDogJywgdXNlcik7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLnRyaWdnZXIoJ3VzZXJJbnZpdGVkJywgdXNlcik7XG4gIH0pO1xuXG5cblxuXG5cblxuXG5cblxufTtcbiIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgLy8gJCh3aW5kb3cpLmJpbmQoJ2JlZm9yZXVubG9hZCcsIGZ1bmN0aW9uKGV2ZW50T2JqZWN0KSB7XG4gIC8vICAgJC5hamF4KHtcbiAgLy8gICAgICB1cmw6IFwiL2xvZ291dFwiLFxuICAvLyAgIH0pO1xuICAvLyB9KTtcblxuICB2YXIgQ2hhdHJvb21Sb3V0ZXIgPSBCYWNrYm9uZS5Sb3V0ZXIuZXh0ZW5kKHtcbiAgICBcbiAgICByb3V0ZXM6IHtcbiAgICAgICcnOiAnc3RhcnQnLFxuICAgICAgJ2xvZyc6ICdsb2dpbicsXG4gICAgICAncmVnJzogJ3JlZ2lzdGVyJyxcbiAgICAgICdvdXQnOiAnb3V0JyxcbiAgICAgICdhdXRoJzogJ2F1dGhlbnRpY2F0ZWQnLFxuICAgICAgJ2ZhY2Vib29rJzogJ2ZhY2Vib29rJyxcbiAgICAgICd0d2l0dGVyJzogJ3R3aXR0ZXInXG4gICAgfSxcblxuICAgIHN0YXJ0OiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnLyMnO1xuICAgICAgYXBwLm1haW5Db250cm9sbGVyID0gbmV3IGFwcC5NYWluQ29udHJvbGxlcigpO1xuICAgICAgYXBwLm1haW5Db250cm9sbGVyLmluaXQoKTtcbiAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgfSBcbiAgICAgIC8vIGVsc2Uge1xuICAgICAgLy8gICAkLmFqYXgoe1xuICAgICAgLy8gICAgIHVybDogXCIvbG9nb3V0XCIsXG4gICAgICAvLyAgIH0pO1xuICAgICAgLy8gfVxuICAgIH0sXG5cblxuICAgIGxvZ2luOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBsb2dpbk1vZGVsID0gbmV3IGFwcC5Mb2dpbk1vZGVsKCk7XG4gICAgICB2YXIgbG9naW5WaWV3ID0gbmV3IGFwcC5Mb2dpblZpZXcoe3ZlbnQ6IGFwcC5tYWluQ29udHJvbGxlci52aWV3RXZlbnRCdXMsIG1vZGVsOiBsb2dpbk1vZGVsfSk7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIuY29udGFpbmVyTW9kZWwuc2V0KFwidmlld1N0YXRlXCIsIGxvZ2luVmlldyk7XG4gICAgfSxcblxuICAgIHJlZ2lzdGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciByZWdpc3RlclZpZXcgPSBuZXcgYXBwLlJlZ2lzdGVyVmlldyh7dmVudDogYXBwLm1haW5Db250cm9sbGVyLnZpZXdFdmVudEJ1cyB9KTtcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlci5jb250YWluZXJNb2RlbC5zZXQoXCJ2aWV3U3RhdGVcIiwgcmVnaXN0ZXJWaWV3KTtcbiAgICB9LFxuXG4gICAgLy8gb3V0OiBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAvLyAgICAgJC5hamF4KHtcbiAgICAvLyAgICAgICB1cmw6IFwiL2xvZ291dFwiLFxuICAgIC8vICAgICB9KVxuICAgIC8vIH0sXG5cbiAgICBhdXRoZW50aWNhdGVkOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghYXBwLm1haW5Db250cm9sbGVyKSB7XG4gICAgICAgIHRoaXMuc3RhcnQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFwcC5tYWluQ29udHJvbGxlci5hdXRoZW50aWNhdGVkKCk7XG4gICAgICB9XG4gICAgICAgIFxuICAgIH0sXG4gICAgZmFjZWJvb2s6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5zdGFydCh0aGlzLmF1dGhlbnRpY2F0ZWQpO1xuICAgIH0sXG4gICAgdHdpdHRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnN0YXJ0KHRoaXMuYXV0aGVudGljYXRlZCk7XG4gICAgfSxcblxuICB9KTtcblxuICBhcHAuQ2hhdHJvb21Sb3V0ZXIgPSBuZXcgQ2hhdHJvb21Sb3V0ZXIoKTtcbiAgQmFja2JvbmUuaGlzdG9yeS5zdGFydCgpO1xuXG59KSgpOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==