
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
            swal({
              title: "OH NO OH NO OH NO",
              text: "Your image. It uh, won't fit. 'Too big' the computer monkeys say. Either that, or it's not a .jpeg, .png, or .gif. But what do I know, I'm just the guy staring at the computer screen behind you.",
              type: "error",
              imageUrl: '/img/scuba-pig.png',
              confirmButtonColor: "#749CA8",
            });
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
    'keyup #chat-search-input': 'searchValidation',
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

    this.listenTo(this.model, "chatroomExists", this.chatroomExists, this);
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
         var chatroomName = $('#chat-search-input').val();
         this_.vent.trigger('doesSearchChatroomExist', chatroomName);
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


  searchRoom: function() {
      var name = $('#chat-search-input').val();
      this.addChatroom(name);
      this.$('#chat-search-input').val('');
  },
  searchValidation: function(e) {
    if (e.keyCode === 13 && $.trim($('#chat-search-input').val()).length > 0 && $('#chat-search-input').hasClass('input-valid')) {
      this.searchRoom();
    } else if ($('#chat-search-input').val() === '') {
      $('#chat-search-input').removeClass('input-valid input-invalid');
    } else {
      this.vent.trigger('doesSearchChatroomExist', $('#chat-search-input').val());
    }
    return this;
  },
  chatroomExists: function(availability) {
    $('#chat-search-input').removeClass('input-valid input-invalid');
    if (availability === false) {
      $('#chat-search-input').addClass('input-valid');
    } else {
      $('#chat-search-input').addClass('input-invalid');
    }
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
    if (this.model.get('chatrooms').length === 0 && this.model.get("privateRooms").length === 0) {
      // this.$('#public-rooms').append('<div class="no-rooms">Welcome to the Parlor. To start, join this room by searching and pressing enter. The room will be saved to your list of rooms.</div><div class="no-rooms">Search or create chatrooms yonder <i class="fa fa-long-arrow-up"></i></div>');
      swal({
        title: "Welcome to Chjat",
        text: "To start, join the Chjat room by searching and pressing enter. The room will be saved to your list of rooms. Or, if you're feeling adventurous, search for a public room, join it, create your own, invite your friends, enemies, awkward acquaintinces, make your room private, get down and dirty, you know what I mean, discuss dirty things, you know? Root vegetables.",
        // type: "info",
        // showCancelButton: true,
        confirmButtonColor: "#749CA8",
        confirmButtonText: "Boop",
        // closeOnConfirm: false,
        // html: false
        imageUrl: "/img/fly-pig-serious-icon.png",
      });
    }
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
            swal({
              title: "OH NO OH NO OH NO",
              text: "Your image. It uh, won't fit. 'Too big' the computer monkeys say. Either that, or it's not a .jpeg, .png, or .gif. But what do I know, I'm just the guy staring at the computer screen behind you.",
              imageUrl: '/img/scuba-pig.png',
              confirmButtonColor: "#749CA8"
            });
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
          imageUrl: '/img/scuba-pig.png',
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
            swal({
              title: "OH NO OH NO OH NO",
              text: "Your image. It uh, won't fit. 'Too big' the computer monkeys say. Either that, or it's not a .jpeg, .png, or .gif. But what do I know, I'm just the guy staring at the computer screen behind you.",
              imageUrl: '/img/scuba-pig.png',
              confirmButtonColor: "#749CA8"
            });
          },
          success: function( response ) {
            console.log('imgUpload response: ', response);
            var form = _this.createRoomFormData();
            response.name = form.name;
            response.privacy = form.privacy;
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
      'submit': 'submit',
      'keyup': 'onHitEnter'
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
    submit: function(e) {
      e.preventDefault();
      this.onLogin();
    },
    onHitEnter: function(e) {
      if(e.keyCode == 13) {
        this.onLogin();
        return false;
      }
    },
    onLogin: function() {
      // triggers the login event and passing the username data to js/main.js
      var this_ = this;
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
        console.log('logged in');
                    
      });
    },
    renderValidation: function(what) {
      $('.login-error-container').empty();
      $(what).appendTo($('.login-error-container')).hide().fadeIn();
      setTimeout(function() {
        $('.login-error-container').children().first().fadeOut();
      }, 2000);

    },

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
       $.ajax({
          type: 'POST',
          url: '/logout',
          processData: false,
          contentType: false,
          error: function( xhr ) {
            console.log('error: ', xhr );
          }
        });
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
          imageUrl: '/img/scuba-pig.png',
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
            swal({
              title: "OH NO OH NO OH NO",
              text: "Your image. It uh, won't fit. 'Too big' the computer monkeys say. Either that, or it's not a .jpeg, .png, or .gif. But what do I know, I'm just the guy staring at the computer screen behind you.",
              imageUrl: '/img/scuba-pig.png',
              confirmButtonColor: "#749CA8"
            });
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
    errorTemplate: _.template('<div class="login-error"><%= message %></div>'),
    events: {
      "submit": "submit",
      "keyup #username": "validateUsername",
    },
    initialize: function(options) {
      this.render();
      this.vent = options.vent;
    },
    submit: function(e) {
      e.preventDefault();
      this.signUp();
    },
    render: function() {
      this.$el.html(this.template());
      return this;
    },
    signUp: function() {
      var this_ = this;
      var sendData = {
        username: this.$('#username').val(),
        password: this.$('#password').val(),
        name: this.$('#name').val(),
        email: this.$('#email').val()
      };
      $.ajax({
        url: "/register",
        method: 'POST',
        data: sendData,
        success: function(data) {
           console.log('success data: ', data);
           if (data.message) {
             this_.renderValidation(this_.errorTemplate(data));
           }
           else if (data.user) {
            app.ChatroomRouter.navigate('auth', { trigger: true });
            this_.vent.trigger("login", data.user);
           }
           else {
            console.log('oops, the else: ', data);
          }
        }
      }).done(function() {
        console.log('register in');
                    
      });
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


    if (self.hostname === 'http://localhost:3001' || self.hostname === 'http://localhost:3000') {
    // local
      self.socket = io.connect(self.hostname);
    } else {
    // heroku
      self.socket = io.connect('http://www.chjat.com/', { transports: ['websocket'] } );
    }
    


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
  self.doesSearchChatroomExist = function(homeRoomQuery) {
    self.socket.emit('doesSearchChatroomExist', homeRoomQuery);
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
    socket.on('chatroomExists', function(availabilty) {
      self.vent.trigger('chatroomExists', availabilty);
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
    self.chatroomModel = new app.ChatroomModel({ name: 'Chjat' });
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
  //   self.chatClient.connectToRoom("Chjat");
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


// ERROR HANDLING
  self.viewEventBus.on("doesChatroomExist", function(chatroomQuery) {
    self.chatClient.doesChatroomExist(chatroomQuery);
  });
  self.viewEventBus.on("doesHomeRoomExist", function(chatroomQuery) {
    self.chatClient.doesHomeRoomExist(chatroomQuery);
  });
  self.viewEventBus.on("doesSearchChatroomExist", function(chatroomQuery) {
    self.chatClient.doesSearchChatroomExist(chatroomQuery);
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
		self.chatroomModel.addChat({sender: "Chatroom Pig", message: user.username + " joined room." });
	});

	// removes user from users collection, sends default leaving message
	self.appEventBus.on("userLeft", function(user) {
        console.log('main.e.userLeft: ', user);
		self.chatroomModel.removeUser(user);
		self.chatroomModel.addChat({sender: "Chatroom Pig", message: user.username + " left room." });
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
  self.appEventBus.on("chatroomExists", function(availability) {
    self.chatroomModel.trigger('chatroomExists', availability);
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
      this.initMainController();
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
      if (!app.mainController) {
        this.initMainController();
      }
      var loginModel = new app.LoginModel();
      var loginView = new app.LoginView({vent: app.mainController.viewEventBus, model: loginModel});
      app.mainController.containerModel.set("viewState", loginView);
    },

    register: function() {
      if (!app.mainController) {
        this.initMainController();
      }
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

    initMainController: function() {
      app.mainController = new app.MainController();
      app.mainController.init();
    },

  });

  app.ChatroomRouter = new ChatroomRouter();
  Backbone.history.start();

})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYXQuanMiLCJjaGF0cm9vbS1oZWFkZXIuanMiLCJjb250YWluZXIuanMiLCJsb2dpbi5qcyIsInVzZXIuanMiLCJjaGF0cm9vbS5qcyIsImludml0YXRpb24uanMiLCJyb29tLmpzIiwicHJpdmF0ZVJvb20uanMiLCJjaGF0SW1hZ2VVcGxvYWQuanMiLCJjaGF0cm9vbVNldHRpbmdzLmpzIiwiY3JlYXRlQ2hhdHJvb20uanMiLCJuYXZiYXIuanMiLCJyZWdpc3Rlci5qcyIsInNvY2tldGNsaWVudC5qcyIsIm1haW4uanMiLCJyb3V0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FKUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUlUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBRlJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FHVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBSjNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBSzlsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QVJoTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QVNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QVJ0SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FTdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDalRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcGFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuQ2hhdENvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG4gICAgbW9kZWw6IGFwcC5DaGF0TW9kZWxcbiAgfSk7XG5cbn0pKCk7IiwiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5DaGF0cm9vbUhlYWRlck1vZGVsID0gQmFja2JvbmUuTW9kZWwuZXh0ZW5kKHt9KTtcblxufSkoKTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuICBhcHAuQ29udGFpbmVyVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBlbDogJyN2aWV3LWNvbnRhaW5lcicsXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdGhpcy5tb2RlbC5vbihcImNoYW5nZTp2aWV3U3RhdGVcIiwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB2aWV3ID0gdGhpcy5tb2RlbC5nZXQoJ3ZpZXdTdGF0ZScpO1xuICAgICAgdGhpcy4kZWwuaHRtbCh2aWV3LnJlbmRlcigpLmVsKTtcbiAgICB9XG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5Mb2dpblZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2xvZ2luJykuaHRtbCgpKSxcbiAgICBlcnJvclRlbXBsYXRlOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwibG9naW4tZXJyb3JcIj48JT0gbWVzc2FnZSAlPjwvZGl2PicpLFxuICAgIGV2ZW50czoge1xuICAgICAgJ3N1Ym1pdCc6ICdzdWJtaXQnLFxuICAgICAgJ2tleXVwJzogJ29uSGl0RW50ZXInXG4gICAgfSxcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgLy8gTG9naW5WaWV3IGdldHMgcGFzc2VkIHRoZSB2aWV3RXZlbnRCdXMgd2hlbiB0aGUgTWFpbkNvbnRyb2xsZXIgaXMgaW5pdGlhbGl6ZWRcbiAgICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcblxuICAgIC8vIFRoaXMgdGVsbHMgdGhlIHZpZXcgdG8gbGlzdGVuIHRvIGFuIGV2ZW50IG9uIGl0cyBtb2RlbCxcbiAgICAvLyBpZiB0aGVyZSdzIGFuIGVycm9yLCB0aGUgY2FsbGJhY2sgKHRoaXMucmVuZGVyKSBpcyBjYWxsZWQgd2l0aCB0aGUgIFxuICAgIC8vIHZpZXcgYXMgY29udGV4dFxuICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImNoYW5nZTplcnJvclwiLCB0aGlzLnJlbmRlciwgdGhpcyk7XG4gICAgfSxcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKHRoaXMubW9kZWwudG9KU09OKCkpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc3VibWl0OiBmdW5jdGlvbihlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLm9uTG9naW4oKTtcbiAgICB9LFxuICAgIG9uSGl0RW50ZXI6IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmKGUua2V5Q29kZSA9PSAxMykge1xuICAgICAgICB0aGlzLm9uTG9naW4oKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0sXG4gICAgb25Mb2dpbjogZnVuY3Rpb24oKSB7XG4gICAgICAvLyB0cmlnZ2VycyB0aGUgbG9naW4gZXZlbnQgYW5kIHBhc3NpbmcgdGhlIHVzZXJuYW1lIGRhdGEgdG8ganMvbWFpbi5qc1xuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAgIHZhciBzZW5kRGF0YSA9IHt1c2VybmFtZTogdGhpcy4kKCcjdXNlcm5hbWUnKS52YWwoKSwgcGFzc3dvcmQ6IHRoaXMuJCgnI3Bhc3N3b3JkJykudmFsKCl9O1xuICAgICQuYWpheCh7XG4gICAgICAgIHVybDogXCIvbG9naW5cIixcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGRhdGE6IHNlbmREYXRhLFxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgIGNvbnNvbGUubG9nKCdzdWNjZXNzIGRhdGE6ICcsIGRhdGEpO1xuICAgICAgICAgICBpZiAoZGF0YS5tZXNzYWdlKSB7XG4gICAgICAgICAgICAgdGhpc18ucmVuZGVyVmFsaWRhdGlvbih0aGlzXy5lcnJvclRlbXBsYXRlKGRhdGEpKTtcbiAgICAgICAgICAgfVxuICAgICAgICAgICBlbHNlIGlmIChkYXRhLl9pZCkge1xuICAgICAgICAgICAgYXBwLkNoYXRyb29tUm91dGVyLm5hdmlnYXRlKCdhdXRoJywgeyB0cmlnZ2VyOiB0cnVlIH0pO1xuICAgICAgICAgICAgdGhpc18udmVudC50cmlnZ2VyKFwibG9naW5cIiwgZGF0YSk7XG4gICAgICAgICAgIH1cbiAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnb29wcywgdGhlIGVsc2U6ICcsIGRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSkuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2xvZ2dlZCBpbicpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgcmVuZGVyVmFsaWRhdGlvbjogZnVuY3Rpb24od2hhdCkge1xuICAgICAgJCgnLmxvZ2luLWVycm9yLWNvbnRhaW5lcicpLmVtcHR5KCk7XG4gICAgICAkKHdoYXQpLmFwcGVuZFRvKCQoJy5sb2dpbi1lcnJvci1jb250YWluZXInKSkuaGlkZSgpLmZhZGVJbigpO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnLmxvZ2luLWVycm9yLWNvbnRhaW5lcicpLmNoaWxkcmVuKCkuZmlyc3QoKS5mYWRlT3V0KCk7XG4gICAgICB9LCAyMDAwKTtcblxuICAgIH0sXG5cbiAgfSk7XG4gIFxufSkoalF1ZXJ5KTsiLCJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLlVzZXJDb2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe21vZGVsOiBhcHAuVXNlck1vZGVsfSk7XG5cbn0pKCk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbmFwcC5DaGF0cm9vbVZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gIHRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNjaGF0cm9vbS10ZW1wbGF0ZScpLmh0bWwoKSksXG4gIGNoYXRUZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjY2hhdGJveC1tZXNzYWdlLXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgcm9vbVRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoXCIjcm9vbS1saXN0LXRlbXBsYXRlXCIpLmh0bWwoKSksXG4gIGhlYWRlclRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNjaGF0cm9vbS1oZWFkZXItdGVtcGxhdGUnKS5odG1sKCkpLFxuICBkaXJlY3RNZXNzYWdlSGVhZGVyVGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2RpcmVjdC1tZXNzYWdlLWhlYWRlci10ZW1wbGF0ZScpLmh0bWwoKSksXG4gIG9ubGluZVVzZXJUZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjb25saW5lLXVzZXJzLWxpc3QtdGVtcGxhdGUnKS5odG1sKCkpLFxuICBvZmZsaW5lVXNlclRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNvZmZsaW5lLXVzZXJzLWxpc3QtdGVtcGxhdGUnKS5odG1sKCkpLFxuICBkYXRlVGVtcGxhdGU6IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJmb2xsb3dXcmFwXCI+PGRpdiBjbGFzcz1cImZvbGxvd01lQmFyXCI+PHNwYW4+IDwlPSBtb21lbnQodGltZXN0YW1wKS5mb3JtYXQoXCJNTU1NIERvXCIpICU+IDwvc3Bhbj48L2Rpdj48L2Rpdj4nKSxcbiAgZXZlbnRzOiB7XG4gICAgJ2tleXByZXNzIC5tZXNzYWdlLWlucHV0JzogJ21lc3NhZ2VJbnB1dFByZXNzZWQnLFxuICAgICdrZXlwcmVzcyAuZGlyZWN0LW1lc3NhZ2UtaW5wdXQnOiAnZGlyZWN0TWVzc2FnZUlucHV0UHJlc3NlZCcsXG4gICAgJ2NsaWNrIC5jaGF0LWRpcmVjdG9yeSAucm9vbSc6ICdzZXRSb29tJyxcbiAgICAna2V5dXAgI2NoYXQtc2VhcmNoLWlucHV0JzogJ3NlYXJjaFZhbGlkYXRpb24nLFxuICAgICdjbGljayAucmVtb3ZlLWNoYXRyb29tJzogJ3JlbW92ZVJvb20nLFxuICAgICdjbGljayAuZGVzdHJveS1jaGF0cm9vbSc6ICdkZXN0cm95Um9vbScsXG4gICAgJ2NsaWNrIC5kZXN0cm95LXRoaXMtcGFydGljdWxhci1jaGF0cm9vbSc6ICdkZXN0cm95VGhpc1BhcnRpY3VsYXJSb29tJyxcbiAgICAna2V5dXAgI2NoYXRyb29tLW5hbWUtaW5wdXQnOiAnZG9lc0NoYXRyb29tRXhpc3QnLFxuICAgICdjbGljayAudXNlcic6ICdpbml0RGlyZWN0TWVzc2FnZScsXG4gIH0sXG5cblxuICBkb2VzQ2hhdHJvb21FeGlzdDogZnVuY3Rpb24oZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgIHZhciBjaGVjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCQudHJpbSgkKCcjY2hhdHJvb20tbmFtZS1pbnB1dCcpLnZhbCgpKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBjaGF0cm9vbU5hbWUgPSAkKCcjY2hhdHJvb20tbmFtZS1pbnB1dCcpLnZhbCgpO1xuICAgICAgICAgdGhpc18udmVudC50cmlnZ2VyKCdkb2VzQ2hhdHJvb21FeGlzdCcsIGNoYXRyb29tTmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgdGhpc18uJCgnI2NoYXRyb29tLW5hbWUtdmFsaWRhdGlvbi1jb250YWluZXInKS5jaGlsZHJlbigpLnJlbW92ZSgpO1xuICAgICAgICAgdGhpc18uJCgnI2NoYXRyb29tLW5hbWUtaW5wdXQnKS5yZW1vdmVDbGFzcygnaW5wdXQtdmFsaWQgaW5wdXQtaW52YWxpZCcpO1xuICAgICAgfVxuICAgIH07XG4gICAgXy5kZWJvdW5jZShjaGVjaygpLCAxNTApO1xuICB9LFxuXG4gIHJlbmRlckNoYXRyb29tQXZhaWxhYmlsaXR5OiBmdW5jdGlvbihhdmFpbGFiaWxpdHkpIHtcbiAgICB0aGlzLmNyZWF0ZUNoYXRyb29tVmlldy50cmlnZ2VyKCdjaGF0cm9vbUF2YWlsYWJpbGl0eScsIGF2YWlsYWJpbGl0eSk7XG4gIH0sXG5cblxuXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICBjb25zb2xlLmxvZygnY2hhdHJvb21WaWV3LmYuaW5pdGlhbGl6ZTogJywgb3B0aW9ucyk7XG4gICAgLy8gcGFzc2VkIHRoZSB2aWV3RXZlbnRCdXNcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xuICB9LFxuICByZW5kZXI6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlcicpO1xuICAgIHRoaXMubW9kZWwgPSBtb2RlbCB8fCB0aGlzLm1vZGVsO1xuICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzLm1vZGVsLnRvSlNPTigpKSk7XG4gICAgdGhpcy5hZnRlclJlbmRlcigpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBhZnRlclJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zZXRTdWJWaWV3cygpO1xuICAgIHRoaXMuc2V0Q2hhdExpc3RlbmVycygpO1xuICAgIHRoaXMuY2hhdHJvb21TZWFyY2hUeXBlYWhlYWQoKTtcbiAgfSxcbiAgc2V0U3ViVmlld3M6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY2hhdEltYWdlVXBsb2FkVmlldyA9IG5ldyBhcHAuQ2hhdEltYWdlVXBsb2FkVmlldygpO1xuICAgIHRoaXMuY2hhdEltYWdlVXBsb2FkVmlldy5zZXRFbGVtZW50KHRoaXMuJCgnI2NoYXRJbWFnZVVwbG9hZENvbnRhaW5lcicpKTtcbiAgICB0aGlzLmNyZWF0ZUNoYXRyb29tVmlldyA9IG5ldyBhcHAuQ3JlYXRlQ2hhdHJvb21WaWV3KHt2ZW50OiB0aGlzLnZlbnR9KTtcbiAgICB0aGlzLmNyZWF0ZUNoYXRyb29tVmlldy5zZXRFbGVtZW50KHRoaXMuJCgnI2NyZWF0ZUNoYXRyb29tQ29udGFpbmVyJykpO1xuICB9LFxuICBzZXRDaGF0TGlzdGVuZXJzOiBmdW5jdGlvbigpIHtcblxuICAgIHZhciBvbmxpbmVVc2VycyA9IHRoaXMubW9kZWwuZ2V0KCdvbmxpbmVVc2VycycpO1xuICAgIHRoaXMubGlzdGVuVG8ob25saW5lVXNlcnMsIFwiYWRkXCIsIHRoaXMucmVuZGVyVXNlciwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJyZW1vdmVcIiwgdGhpcy5yZW5kZXJVc2VycywgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhvbmxpbmVVc2VycywgXCJyZXNldFwiLCB0aGlzLnJlbmRlclVzZXJzLCB0aGlzKTtcblxuICAgIHZhciBvZmZsaW5lVXNlcnMgPSB0aGlzLm1vZGVsLmdldCgnb2ZmbGluZVVzZXJzJyk7XG4gICAgdGhpcy5saXN0ZW5UbyhvZmZsaW5lVXNlcnMsIFwiYWRkXCIsIHRoaXMucmVuZGVyT2ZmbGluZVVzZXIsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8ob2ZmbGluZVVzZXJzLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlck9mZmxpbmVVc2VycywgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhvZmZsaW5lVXNlcnMsIFwicmVzZXRcIiwgdGhpcy5yZW5kZXJPZmZsaW5lVXNlcnMsIHRoaXMpO1xuXG4gICAgdmFyIGNoYXRsb2cgPSB0aGlzLm1vZGVsLmdldCgnY2hhdGxvZycpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdGxvZywgXCJhZGRcIiwgdGhpcy5yZW5kZXJDaGF0LCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRsb2csIFwicmVtb3ZlXCIsIHRoaXMucmVuZGVyQ2hhdHMsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdGxvZywgXCJyZXNldFwiLCB0aGlzLnJlbmRlckNoYXRzLCB0aGlzKTtcblxuICAgIHZhciBjaGF0cm9vbXMgPSB0aGlzLm1vZGVsLmdldCgnY2hhdHJvb21zJyk7XG4gICAgdGhpcy5saXN0ZW5UbyhjaGF0cm9vbXMsIFwiYWRkXCIsIHRoaXMucmVuZGVyUm9vbSwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhjaGF0cm9vbXMsIFwicmVtb3ZlXCIsIHRoaXMucmVuZGVyUm9vbXMsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcInJlc2V0XCIsIHRoaXMucmVuZGVyUm9vbXMsIHRoaXMpO1xuXG4gICAgdmFyIHByaXZhdGVSb29tcyA9IHRoaXMubW9kZWwuZ2V0KCdwcml2YXRlUm9vbXMnKTtcbiAgICB0aGlzLmxpc3RlblRvKHByaXZhdGVSb29tcywgXCJhZGRcIiwgdGhpcy5yZW5kZXJQcml2YXRlUm9vbSwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5Ubyhwcml2YXRlUm9vbXMsIFwicmVtb3ZlXCIsIHRoaXMucmVuZGVyUHJpdmF0ZVJvb21zLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKHByaXZhdGVSb29tcywgXCJyZXNldFwiLCB0aGlzLnJlbmRlclByaXZhdGVSb29tcywgdGhpcyk7XG5cbiAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiY2hhbmdlOmNoYXRyb29tXCIsIHRoaXMucmVuZGVySGVhZGVyLCB0aGlzKTtcblxuICAgIHRoaXMubGlzdGVuVG8odGhpcy5jaGF0SW1hZ2VVcGxvYWRWaWV3LCAnY2hhdC1pbWFnZS11cGxvYWRlZCcsIHRoaXMuY2hhdFVwbG9hZEltYWdlKTtcbiAgICB0aGlzLmxpc3RlblRvKHRoaXMuY2hhdEltYWdlVXBsb2FkVmlldywgJ21lc3NhZ2UtaW1hZ2UtdXBsb2FkZWQnLCB0aGlzLm1lc3NhZ2VVcGxvYWRJbWFnZSk7XG4gICAgLy8gdGhpcy5saXN0ZW5Ubyh0aGlzLmNyZWF0ZUNoYXRyb29tVmlldywgJ2NyZWF0ZVJvb20nLCB0aGlzLmNyZWF0ZVJvb20pO1xuXG4gICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcIm1vcmVDaGF0c1wiLCB0aGlzLnJlbmRlck1vcmVDaGF0cywgdGhpcyk7XG5cbiAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwidXNlckludml0ZWRcIiwgdGhpcy51c2VySW52aXRlZCwgdGhpcyk7XG5cbiAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiY2hhdHJvb21FeGlzdHNcIiwgdGhpcy5jaGF0cm9vbUV4aXN0cywgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImNoYXRyb29tQXZhaWxhYmlsaXR5XCIsIHRoaXMucmVuZGVyQ2hhdHJvb21BdmFpbGFiaWxpdHksIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJob21lUm9vbUF2YWlsYWJpbGl0eVwiLCB0aGlzLnJlbmRlckhvbWVSb29tQXZhaWxhYmlsaXR5LCB0aGlzKTtcblxuICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgdGhpcy4kKCcjY2hhdGJveC1jb250ZW50Jykuc2Nyb2xsKGZ1bmN0aW9uKCl7XG4gICAgICAgIC8vIGNoZWNrcyBpZiB0aGVyZSdzIGVub3VnaCBjaGF0cyB0byB3YXJyYW50IGEgZ2V0TW9yZUNoYXRzIGNhbGxcbiAgICAgIGlmICgkKCcjY2hhdGJveC1jb250ZW50Jykuc2Nyb2xsVG9wKCkgPT09IDAgJiYgdGhpc18ubW9kZWwuZ2V0KCdjaGF0bG9nJykubGVuZ3RoID49IDI1KSB7XG4gICAgICAgIGlmICh0aGlzXy5tb2RlbC5nZXQoJ2NoYXRyb29tJykuZ2V0KCdjaGF0VHlwZScpID09PSAnbWVzc2FnZScpIHtcbiAgICAgICAgICBfLmRlYm91bmNlKHRoaXNfLmdldE1vcmVEaXJlY3RNZXNzYWdlcygpLCAzMDAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfLmRlYm91bmNlKHRoaXNfLmdldE1vcmVDaGF0cygpLCAzMDAwKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgICAgJCh3aW5kb3cpLnJlc2l6ZShmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHdpbmRvd0hlaWdodCA9ICQod2luZG93KS5oZWlnaHQoKTtcbiAgICAgICAgaWYgKHdpbmRvd0hlaWdodCA+IDUwMCkge1xuICAgICAgICAgIHZhciBuZXdIZWlnaHQgPSB3aW5kb3dIZWlnaHQgLSAyODU7XG4gICAgICAgICAgJCgnI2NoYXRib3gtY29udGVudCcpLmhlaWdodChuZXdIZWlnaHQpO1xuICAgICAgICB9XG5cbiAgICAgICB9KTtcbiAgfSxcblxuXG4gIGNoYXRyb29tU2VhcmNoVHlwZWFoZWFkOiBmdW5jdGlvbigpIHtcbiAgICAvLyBpbnRlcmVzdGluZyAtIHRoZSAndGhpcycgbWFrZXMgYSBkaWZmZXJlbmNlLCBjYW4ndCBmaW5kICNjaGF0LXNlYXJjaC1pbnB1dCBvdGhlcndpc2VcbiAgICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgICB2YXIgYmxvb2QgPSBuZXcgQmxvb2Rob3VuZCh7XG4gICAgICAgIGRhdHVtVG9rZW5pemVyOiBCbG9vZGhvdW5kLnRva2VuaXplcnMub2JqLndoaXRlc3BhY2UoJ25hbWUnKSxcbiAgICAgICAgcXVlcnlUb2tlbml6ZXI6IEJsb29kaG91bmQudG9rZW5pemVycy53aGl0ZXNwYWNlLFxuICAgICAgICBwcmVmZXRjaDoge1xuICAgICAgICAgIHVybDogJy9hcGkvcHVibGljQ2hhdHJvb21zJyxcbiAgICAgICAgICBmaWx0ZXI6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICByZXR1cm4gXy5tYXAoZGF0YSwgZnVuY3Rpb24oY2hhdHJvb20pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBuYW1lOiBjaGF0cm9vbSB9O1xuICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgdHRsOiAwLFxuICAgICAgICB9LFxuICAgICAgICByZW1vdGU6IHtcbiAgICAgICAgICB1cmw6ICcvYXBpL3NlYXJjaENoYXRyb29tcz9uYW1lPSVRVUVSWScsXG4gICAgICAgICAgd2lsZGNhcmQ6ICclUVVFUlknLFxuICAgICAgICAgIHJhdGVMaW1pdFdhaXQ6IDMwMCxcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBibG9vZC5jbGVhclByZWZldGNoQ2FjaGUoKTtcbiAgICAgIGJsb29kLmluaXRpYWxpemUoKTtcbiAgICAgIHZhciB0eXBlID0gIHRoaXMuJCgnI2NoYXQtc2VhcmNoLWlucHV0JykudHlwZWFoZWFkKHtcbiAgICAgICAgbWluTGVuZ3RoOiAyLFxuICAgICAgICBjbGFzc05hbWVzOiB7XG4gICAgICAgICAgaW5wdXQ6ICd0eXBlYWhlYWQtaW5wdXQnLFxuICAgICAgICAgIGhpbnQ6ICd0eXBlYWhlYWQtaGludCcsXG4gICAgICAgICAgc2VsZWN0YWJsZTogJ3R5cGVhaGVhZC1zZWxlY3RhYmxlJyxcbiAgICAgICAgICBtZW51OiAndHlwZWFoZWFkLW1lbnUnLFxuICAgICAgICAgIGhpZ2hsaWdodDogJ3R5cGVhaGVhZC1oaWdobGlnaHQnLFxuICAgICAgICAgIGRhdGFzZXQ6ICd0eXBlYWhlYWQtZGF0YXNldCcsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBsaW1pdDogNSxcbiAgICAgICAgc291cmNlOiBibG9vZCxcbiAgICAgICAgbmFtZTogJ2NoYXRyb29tLXNlYXJjaCcsXG4gICAgICAgIGRpc3BsYXk6ICduYW1lJyxcbiAgICAgIH0pLm9uKCd0eXBlYWhlYWQ6c2VsZWN0IHR5cGVhaGVhZDphdXRvY29tcGxldGUnLCBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgIHZhciBjaGF0cm9vbU5hbWUgPSAkKCcjY2hhdC1zZWFyY2gtaW5wdXQnKS52YWwoKTtcbiAgICAgICAgIHRoaXNfLnZlbnQudHJpZ2dlcignZG9lc1NlYXJjaENoYXRyb29tRXhpc3QnLCBjaGF0cm9vbU5hbWUpO1xuICAgICAgfSk7XG4gIH0sXG5cblxuXG4vLyBoZWFkZXJzXG5cbiAgcmVuZGVySGVhZGVyOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLiQoJyNjaGF0Ym94LWhlYWRlcicpLmh0bWwodGhpcy5oZWFkZXJUZW1wbGF0ZSh0aGlzLm1vZGVsLmdldCgnY2hhdHJvb20nKS50b0pTT04oKSkpO1xuICAgIHRoaXMuY2hhdHJvb21TZXR0aW5nc1ZpZXcgPSBuZXcgYXBwLkNoYXRyb29tU2V0dGluZ3NWaWV3KHt2ZW50OiB0aGlzLnZlbnQsIG1vZGVsOiB0aGlzLm1vZGVsLmdldCgnY2hhdHJvb20nKX0pO1xuICAgIHRoaXMuY2hhdHJvb21TZXR0aW5nc1ZpZXcuc2V0RWxlbWVudCh0aGlzLiQoJyNjaGF0cm9vbS1oZWFkZXItY29udGFpbmVyJykpO1xuICAgIHRoaXMubGlzdGVuVG8odGhpcy5jaGF0cm9vbVNldHRpbmdzVmlldywgJ3VwZGF0ZVJvb20nLCB0aGlzLnVwZGF0ZVJvb20pO1xuICB9LFxuXG4gIHJlbmRlckRpcmVjdE1lc3NhZ2VIZWFkZXI6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuJCgnI2NoYXRib3gtaGVhZGVyJykuaHRtbCh0aGlzLmRpcmVjdE1lc3NhZ2VIZWFkZXJUZW1wbGF0ZSh0aGlzLm1vZGVsLmdldCgnY2hhdHJvb20nKS50b0pTT04oKSkpO1xuICB9LFxuXG4gIHVzZXJJbnZpdGVkOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgdGhpcy5jaGF0cm9vbVNldHRpbmdzVmlldy50cmlnZ2VyKCd1c2VySW52aXRlZCcsIGRhdGEpO1xuICB9LFxuXG5cblxuXG4vLyB1c2Vyc1xuXG4gIHJlbmRlclVzZXJzOiBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYucmVuZGVyVXNlcnMnKTtcbiAgICBvbmxpbmVVc2VycyA9IHRoaXMubW9kZWwuZ2V0KFwib25saW5lVXNlcnNcIik7XG4gICAgY29uc29sZS5sb2coJ1VTRVJTOiAnLCBvbmxpbmVVc2Vycyk7XG4gICAgdGhpcy4kKCcub25saW5lLXVzZXJzJykuZW1wdHkoKTtcbiAgICB0aGlzLm1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpLmVhY2goZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgIHRoaXMucmVuZGVyVXNlcih1c2VyKTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyVXNlcjogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB0aGlzLiQoJy5vbmxpbmUtdXNlcnMnKS5hcHBlbmQodGhpcy5vbmxpbmVVc2VyVGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgfSxcbiAgcmVuZGVyT2ZmbGluZVVzZXJzOiBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYucmVuZGVyT2ZmbGluZVVzZXJzJyk7XG4gICAgY29uc29sZS5sb2coJ09mZmxpbmUgVVNFUlM6ICcsIHRoaXMubW9kZWwuZ2V0KFwib2ZmbGluZVVzZXJzXCIpKTtcbiAgICB0aGlzLiQoJy5vZmZsaW5lLXVzZXJzJykuZW1wdHkoKTtcbiAgICB0aGlzLm1vZGVsLmdldChcIm9mZmxpbmVVc2Vyc1wiKS5lYWNoKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICB0aGlzLnJlbmRlck9mZmxpbmVVc2VyKHVzZXIpO1xuICAgIH0sIHRoaXMpO1xuICB9LFxuICByZW5kZXJPZmZsaW5lVXNlcjogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB0aGlzLiQoJy5vZmZsaW5lLXVzZXJzJykuYXBwZW5kKHRoaXMub2ZmbGluZVVzZXJUZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICB9LFxuXG5cblxuXG5cbi8vIGNoYXRsb2dcblxuICByZW5kZXJDaGF0czogZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlckNoYXRzJyk7XG4gICAgdmFyIGNoYXRsb2cgPSB0aGlzLm1vZGVsLmdldChcImNoYXRsb2dcIik7XG4gICAgY29uc29sZS5sb2coJ0NIQVRMT0c6ICcsIGNoYXRsb2cpO1xuICAgIHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpLmVtcHR5KCk7XG4gICAgY2hhdGxvZy5lYWNoKGZ1bmN0aW9uKGNoYXQpIHtcbiAgICAgIHRoaXMucmVuZGVyQ2hhdChjaGF0KTtcbiAgICB9LCB0aGlzKTtcbiAgICBpZiAoIGNoYXRsb2cubGVuZ3RoID09PSAwKSB7XG4gICAgICBjaGF0bG9nLnB1c2gobmV3IGFwcC5DaGF0TW9kZWwoeyBzZW5kZXI6ICdDaGphdCcsIG1lc3NhZ2U6IFwiwq9cXFxcXyjjg4QpXy/Cr1wiLCB0aW1lc3RhbXA6IF8ubm93KCksIHVybDogJyd9KSk7XG4gICAgfVxuICAgIHRoaXMuYWZ0ZXJDaGF0c1JlbmRlcigpO1xuICB9LFxuXG4gIHJlbmRlckNoYXQ6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdGhpcy5yZW5kZXJEYXRlRGl2aWRlcnMobW9kZWwpO1xuICAgIHZhciBjaGF0VGVtcGxhdGUgPSAkKHRoaXMuY2hhdFRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gICAgY2hhdFRlbXBsYXRlLmFwcGVuZFRvKHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpKS5oaWRlKCkuZmFkZUluKCkuc2xpZGVEb3duKCk7XG4gICAgJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG4gIH0sXG5cbiAgcmVuZGVyRGF0ZURpdmlkZXJzOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHRoaXMuY3VycmVudERhdGUgPSBtb21lbnQobW9kZWwuZ2V0KCd0aW1lc3RhbXAnKSkuZm9ybWF0KCdkZGRkLCBNTU1NIERvIFlZWVknKTtcbiAgICBpZiAoIHRoaXMuY3VycmVudERhdGUgIT09IHRoaXMucHJldmlvdXNEYXRlICkge1xuICAgICAgdmFyIGN1cnJlbnREYXRlID0gJCh0aGlzLmRhdGVUZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICAgICAgY3VycmVudERhdGUuYXBwZW5kVG8odGhpcy4kKCcjY2hhdGJveC1jb250ZW50JykpLmhpZGUoKS5mYWRlSW4oKS5zbGlkZURvd24oKTtcbiAgICAgIHRoaXMucHJldmlvdXNEYXRlID0gdGhpcy5jdXJyZW50RGF0ZTtcbiAgICB9XG4gIH0sXG5cbiAgZ2V0TW9yZUNoYXRzOiBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYuZ2V0TW9yZUNoYXRzJyk7XG4gICAgdmFyIGNoYXRyb29tID0gdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tJyksXG4gICAgbmFtZSA9IGNoYXRyb29tLmdldCgnbmFtZScpLFxuICAgIG1vZGVsc0xvYWRlZFN1bSA9IGNoYXRyb29tLmdldCgnbW9kZWxzTG9hZGVkU3VtJyk7XG4gICAgdmFyIGNoYXRsb2dMZW5ndGggPSBjaGF0cm9vbS5nZXQoJ2NoYXRsb2dMZW5ndGgnKTtcbiAgICB0aGlzLnZlbnQudHJpZ2dlcignZ2V0TW9yZUNoYXRzJywgeyBuYW1lOiBuYW1lLCBtb2RlbHNMb2FkZWRTdW06IG1vZGVsc0xvYWRlZFN1bSwgY2hhdGxvZ0xlbmd0aDogY2hhdGxvZ0xlbmd0aH0pO1xuICAgIGNoYXRyb29tLnNldCgnbW9kZWxzTG9hZGVkU3VtJywgKG1vZGVsc0xvYWRlZFN1bSAtIDEpKTtcbiAgfSxcblxuICBnZXRNb3JlRGlyZWN0TWVzc2FnZXM6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5nZXRNb3JlRHJpZWN0TWVzc2FnZXMnKTtcbiAgICB2YXIgY2hhdHJvb20gPSB0aGlzLm1vZGVsLmdldCgnY2hhdHJvb20nKSxcbiAgICBpZCA9IGNoYXRyb29tLmdldCgnaWQnKSxcbiAgICBtb2RlbHNMb2FkZWRTdW0gPSBjaGF0cm9vbS5nZXQoJ21vZGVsc0xvYWRlZFN1bScpO1xuICAgIHZhciBjaGF0bG9nTGVuZ3RoID0gY2hhdHJvb20uZ2V0KCdjaGF0bG9nTGVuZ3RoJyk7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoJ2dldE1vcmVEaXJlY3RNZXNzYWdlcycsIHsgaWQ6IGlkLCBtb2RlbHNMb2FkZWRTdW06IG1vZGVsc0xvYWRlZFN1bSwgY2hhdGxvZ0xlbmd0aDogY2hhdGxvZ0xlbmd0aH0pO1xuICAgIGNoYXRyb29tLnNldCgnbW9kZWxzTG9hZGVkU3VtJywgKG1vZGVsc0xvYWRlZFN1bSAtIDEpKTtcbiAgfSxcblxuICByZW5kZXJNb3JlQ2hhdHM6IGZ1bmN0aW9uKGNoYXRzKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlck1vcmVDaGF0cycpO1xuICAgIC8vIHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpO1xuICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgdmFyIG9yaWdpbmFsSGVpZ2h0ID0gJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcbiAgICB0aGlzLm1vcmVDaGF0Q29sbGVjdGlvbiA9IFtdO1xuICAgIF8uZWFjaChjaGF0cywgZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIHRoaXNfLnJlbmRlck1vcmVEYXRlRGl2aWRlcnMobW9kZWwpO1xuICAgICAgdmFyIGNoYXRUZW1wbGF0ZSA9ICQodGhpcy5jaGF0VGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICAgIHRoaXNfLm1vcmVDaGF0Q29sbGVjdGlvbi5wdXNoKGNoYXRUZW1wbGF0ZSk7XG4gICAgICAvLyBjaGF0VGVtcGxhdGUucHJlcGVuZFRvKHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpKS5oaWRlKCkuZmFkZUluKCkuc2xpZGVEb3duKCk7XG4gICAgfSwgdGhpcyk7XG4gICAgXy5lYWNoKHRoaXMubW9yZUNoYXRDb2xsZWN0aW9uLnJldmVyc2UoKSwgZnVuY3Rpb24odGVtcGxhdGUpIHtcbiAgICAgIHRlbXBsYXRlLnByZXBlbmRUbyh0aGlzLiQoJyNjaGF0Ym94LWNvbnRlbnQnKSk7XG4gICAgfSk7XG5cbiAgICAgdGhpcy5kYXRlRGl2aWRlci5sb2FkKCQoXCIuZm9sbG93TWVCYXJcIikpO1xuICAgICAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodCAtIG9yaWdpbmFsSGVpZ2h0O1xuICAgICBcbiAgfSxcblxuICByZW5kZXJNb3JlRGF0ZURpdmlkZXJzOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHRoaXMuY3VycmVudERhdGUgPSBtb21lbnQobW9kZWwuYXR0cmlidXRlcy50aW1lc3RhbXApLmZvcm1hdCgnZGRkZCwgTU1NTSBEbyBZWVlZJyk7XG4gICAgaWYgKCB0aGlzLmN1cnJlbnREYXRlICE9PSB0aGlzLnByZXZpb3VzRGF0ZSApIHtcbiAgICAgIHZhciBjdXJyZW50RGF0ZSA9ICQodGhpcy5kYXRlVGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICAgIC8vIGN1cnJlbnREYXRlLmFwcGVuZFRvKHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpKS5oaWRlKCkuZmFkZUluKCkuc2xpZGVEb3duKCk7XG4gICAgICB0aGlzLm1vcmVDaGF0Q29sbGVjdGlvbi5wdXNoKGN1cnJlbnREYXRlKTtcbiAgICAgIHRoaXMucHJldmlvdXNEYXRlID0gdGhpcy5jdXJyZW50RGF0ZTtcbiAgICB9XG4gIH0sXG5cbiAgYXV0b3NpemVyOiBmdW5jdGlvbigpIHtcbiAgICBhdXRvc2l6ZSgkKCcjbWVzc2FnZS1pbnB1dCcpKTtcbiAgfSxcbiAgXG4gIHNjcm9sbEJvdHRvbUluc3VyYW5jZTogZnVuY3Rpb24oKXtcbiAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgIHZhciBpbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCl7XG4gICAgICB0aGlzLiQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSB0aGlzLiQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG4gICAgfSwgNTApO1xuICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICB9LCA4MDApO1xuICB9LFxuXG4gIGFmdGVyQ2hhdHNSZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYXV0b3NpemVyKCk7XG4gICAgdGhpcy5kYXRlRGl2aWRlci5sb2FkKCQoXCIuZm9sbG93TWVCYXJcIikpO1xuICAgIHRoaXMuc2Nyb2xsQm90dG9tSW5zdXJhbmNlKCk7XG4gIH0sXG5cblxuXG5cblxuXG5cblxuLy8gcm9vbXNcblxuXG4gIHNlYXJjaFJvb206IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG5hbWUgPSAkKCcjY2hhdC1zZWFyY2gtaW5wdXQnKS52YWwoKTtcbiAgICAgIHRoaXMuYWRkQ2hhdHJvb20obmFtZSk7XG4gICAgICB0aGlzLiQoJyNjaGF0LXNlYXJjaC1pbnB1dCcpLnZhbCgnJyk7XG4gIH0sXG4gIHNlYXJjaFZhbGlkYXRpb246IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAxMyAmJiAkLnRyaW0oJCgnI2NoYXQtc2VhcmNoLWlucHV0JykudmFsKCkpLmxlbmd0aCA+IDAgJiYgJCgnI2NoYXQtc2VhcmNoLWlucHV0JykuaGFzQ2xhc3MoJ2lucHV0LXZhbGlkJykpIHtcbiAgICAgIHRoaXMuc2VhcmNoUm9vbSgpO1xuICAgIH0gZWxzZSBpZiAoJCgnI2NoYXQtc2VhcmNoLWlucHV0JykudmFsKCkgPT09ICcnKSB7XG4gICAgICAkKCcjY2hhdC1zZWFyY2gtaW5wdXQnKS5yZW1vdmVDbGFzcygnaW5wdXQtdmFsaWQgaW5wdXQtaW52YWxpZCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnZlbnQudHJpZ2dlcignZG9lc1NlYXJjaENoYXRyb29tRXhpc3QnLCAkKCcjY2hhdC1zZWFyY2gtaW5wdXQnKS52YWwoKSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBjaGF0cm9vbUV4aXN0czogZnVuY3Rpb24oYXZhaWxhYmlsaXR5KSB7XG4gICAgJCgnI2NoYXQtc2VhcmNoLWlucHV0JykucmVtb3ZlQ2xhc3MoJ2lucHV0LXZhbGlkIGlucHV0LWludmFsaWQnKTtcbiAgICBpZiAoYXZhaWxhYmlsaXR5ID09PSBmYWxzZSkge1xuICAgICAgJCgnI2NoYXQtc2VhcmNoLWlucHV0JykuYWRkQ2xhc3MoJ2lucHV0LXZhbGlkJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICQoJyNjaGF0LXNlYXJjaC1pbnB1dCcpLmFkZENsYXNzKCdpbnB1dC1pbnZhbGlkJyk7XG4gICAgfVxuICB9LFxuICBjcmVhdGVSb29tOiBmdW5jdGlvbihmb3JtKSB7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoJ2NyZWF0ZVJvb20nLCBmb3JtKTtcbiAgfSxcbiAgdXBkYXRlUm9vbTogZnVuY3Rpb24oZm9ybSkge1xuICAgIHZhciBpZCA9IHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbScpLmdldCgnaWQnKTtcbiAgICBmb3JtLmlkID0gaWQ7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoJ3VwZGF0ZVJvb20nLCBmb3JtKTtcbiAgfSxcbiAgZGVzdHJveVJvb206IGZ1bmN0aW9uKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgdmFyIHJvb21OYW1lID0gdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tJykuZ2V0KCduYW1lJyk7XG4gICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICB2YXIgY29uZmlybWF0aW9uID0gc3dhbCh7XG4gICAgICB0aXRsZTogXCJEbyB5b3Ugd2lzaCB0byBkZXN0cm95IFwiICsgcm9vbU5hbWUgKyBcIj9cIixcbiAgICAgIHRleHQ6IFwiVGhpcyBraWxscyB0aGUgcm9vbS5cIixcbiAgICAgIHR5cGU6IFwid2FybmluZ1wiLFxuICAgICAgc2hvd0NhbmNlbEJ1dHRvbjogdHJ1ZSxcbiAgICAgIGNvbmZpcm1CdXR0b25Db2xvcjogXCIjREVCMEIwXCIsXG4gICAgICBjb25maXJtQnV0dG9uVGV4dDogXCJNdWFoYWhhIVwiLFxuICAgICAgY2xvc2VPbkNvbmZpcm06IGZhbHNlLFxuICAgICAgaHRtbDogZmFsc2VcbiAgICB9LCBmdW5jdGlvbigpe1xuICAgICAgdmFyIHJvb21JZCA9IHRoaXNfLm1vZGVsLmdldCgnY2hhdHJvb20nKS5pZDtcbiAgICAgIHZhciB1c2VySW5Sb29tID0gdHJ1ZTtcbiAgICAgIHRoaXNfLnZlbnQudHJpZ2dlcignZGVzdHJveVJvb20nLCB7IGlkOiByb29tSWQsIHJvb21OYW1lOiByb29tTmFtZSwgdXNlckluUm9vbTogdXNlckluUm9vbSB9KTtcbiAgICB9KTtcbiAgfSxcbiAgZGVzdHJveVRoaXNQYXJ0aWN1bGFyUm9vbTogZnVuY3Rpb24oZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB2YXIgcm9vbU5hbWUgPSAkKGUudGFyZ2V0KS5kYXRhKFwicm9vbS1uYW1lXCIpO1xuICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgdmFyIGNvbmZpcm1hdGlvbiA9IHN3YWwoe1xuICAgICAgdGl0bGU6IFwiRG8geW91IHdpc2ggdG8gZGVzdHJveSBcIiArIHJvb21OYW1lICsgXCI/XCIsXG4gICAgICB0ZXh0OiBcIlRoaXMga2lsbHMgdGhlIHJvb20uXCIsXG4gICAgICB0eXBlOiBcIndhcm5pbmdcIixcbiAgICAgIHNob3dDYW5jZWxCdXR0b246IHRydWUsXG4gICAgICBjb25maXJtQnV0dG9uQ29sb3I6IFwiI0RFQjBCMFwiLFxuICAgICAgY29uZmlybUJ1dHRvblRleHQ6IFwiTXVhaGFoYSFcIixcbiAgICAgIGNsb3NlT25Db25maXJtOiBmYWxzZSxcbiAgICAgIGh0bWw6IGZhbHNlXG4gICAgfSwgZnVuY3Rpb24oKXtcbiAgICAgIHZhciBjdXJyZW50Um9vbUlkID0gdGhpc18ubW9kZWwuZ2V0KCdjaGF0cm9vbScpLmlkO1xuICAgICAgdmFyIHJvb21JZCA9ICQoZS50YXJnZXQpLmRhdGEoXCJyb29tLWlkXCIpO1xuICAgICAgdmFyIHVzZXJJblJvb20gPSBjdXJyZW50Um9vbUlkID09PSByb29tSWQ7XG4gICAgICB0aGlzXy52ZW50LnRyaWdnZXIoJ2Rlc3Ryb3lSb29tJywgeyBpZDogcm9vbUlkLCByb29tTmFtZTogcm9vbU5hbWUsIHVzZXJJblJvb206IHVzZXJJblJvb20gfSk7XG4gICAgfSk7XG4gIH0sXG4gIGFkZENoYXRyb29tOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLmFkZENoYXRyb29tJyk7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoJ2FkZFJvb20nLCBuYW1lKTtcbiAgfSxcbiAgcmVtb3ZlUm9vbTogZnVuY3Rpb24oZSkge1xuICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgdmFyIGNvbmZpcm1hdGlvbiA9IHN3YWwoe1xuICAgICAgdGl0bGU6IFwiUmVtb3ZlIFRoaXMgUm9vbT9cIixcbiAgICAgIHRleHQ6IFwiQXJlIHlvdSBzdXJlPyBBcmUgeW91IHN1cmUgeW91J3JlIHN1cmU/IEhvdyBzdXJlIGNhbiB5b3UgYmU/XCIsXG4gICAgICB0eXBlOiBcIndhcm5pbmdcIixcbiAgICAgIHNob3dDYW5jZWxCdXR0b246IHRydWUsXG4gICAgICBjb25maXJtQnV0dG9uQ29sb3I6IFwiI0RFQjBCMFwiLFxuICAgICAgY29uZmlybUJ1dHRvblRleHQ6IFwiTXVhaGFoYSFcIixcbiAgICAgIGNsb3NlT25Db25maXJtOiBmYWxzZSxcbiAgICAgIGh0bWw6IGZhbHNlXG4gICAgfSwgZnVuY3Rpb24oKXtcbiAgICAgIHN3YWwoe1xuICAgICAgICB0aXRsZTogXCJSZW1vdmVkIVwiLFxuICAgICAgICB0ZXh0OiBcIllvdSBhcmUgZnJlZSBvZiB0aGlzIGNoYXRyb29tLiBHbyBvbiwgeW91J3JlIGZyZWUgbm93LlwiLFxuICAgICAgICB0eXBlOiBcInN1Y2Nlc3NcIixcbiAgICAgICAgY29uZmlybUJ1dHRvbkNvbG9yOiBcIiM3NDlDQThcIlxuICAgICAgfSk7XG4gICAgICB2YXIgY3VycmVudFJvb21JZCA9IHRoaXNfLm1vZGVsLmdldCgnY2hhdHJvb20nKS5pZDtcbiAgICAgIHZhciByb29tSWQgPSAkKGUudGFyZ2V0KS5kYXRhKFwicm9vbS1pZFwiKTtcbiAgICAgIHZhciByb29tTmFtZSA9ICQoZS50YXJnZXQpLmRhdGEoXCJyb29tLW5hbWVcIik7XG4gICAgICB2YXIgdXNlckluUm9vbSA9IGN1cnJlbnRSb29tSWQgPT09IHJvb21JZDtcbiAgICAgIHRoaXNfLnZlbnQudHJpZ2dlcigncmVtb3ZlUm9vbScsIHtpZDogcm9vbUlkLCByb29tTmFtZTogcm9vbU5hbWUsIHVzZXJJblJvb206IHVzZXJJblJvb219KTtcbiAgICB9KTtcbiAgfSxcbiAgcmVuZGVyUm9vbXM6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5yZW5kZXJSb29tcycpO1xuICAgIGNvbnNvbGUubG9nKCdDSEFUUk9PTVM6ICcsIHRoaXMubW9kZWwuZ2V0KFwiY2hhdHJvb21zXCIpKTtcbiAgICB0aGlzLiQoJyNwdWJsaWMtcm9vbXMnKS5lbXB0eSgpO1xuICAgIHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbXMnKS5lYWNoKGZ1bmN0aW9uIChyb29tKSB7XG4gICAgICB0aGlzLnJlbmRlclJvb20ocm9vbSk7XG4gICAgfSwgdGhpcyk7XG4gICAgaWYgKHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbXMnKS5sZW5ndGggPT09IDAgJiYgdGhpcy5tb2RlbC5nZXQoXCJwcml2YXRlUm9vbXNcIikubGVuZ3RoID09PSAwKSB7XG4gICAgICAvLyB0aGlzLiQoJyNwdWJsaWMtcm9vbXMnKS5hcHBlbmQoJzxkaXYgY2xhc3M9XCJuby1yb29tc1wiPldlbGNvbWUgdG8gdGhlIFBhcmxvci4gVG8gc3RhcnQsIGpvaW4gdGhpcyByb29tIGJ5IHNlYXJjaGluZyBhbmQgcHJlc3NpbmcgZW50ZXIuIFRoZSByb29tIHdpbGwgYmUgc2F2ZWQgdG8geW91ciBsaXN0IG9mIHJvb21zLjwvZGl2PjxkaXYgY2xhc3M9XCJuby1yb29tc1wiPlNlYXJjaCBvciBjcmVhdGUgY2hhdHJvb21zIHlvbmRlciA8aSBjbGFzcz1cImZhIGZhLWxvbmctYXJyb3ctdXBcIj48L2k+PC9kaXY+Jyk7XG4gICAgICBzd2FsKHtcbiAgICAgICAgdGl0bGU6IFwiV2VsY29tZSB0byBDaGphdFwiLFxuICAgICAgICB0ZXh0OiBcIlRvIHN0YXJ0LCBqb2luIHRoZSBDaGphdCByb29tIGJ5IHNlYXJjaGluZyBhbmQgcHJlc3NpbmcgZW50ZXIuIFRoZSByb29tIHdpbGwgYmUgc2F2ZWQgdG8geW91ciBsaXN0IG9mIHJvb21zLiBPciwgaWYgeW91J3JlIGZlZWxpbmcgYWR2ZW50dXJvdXMsIHNlYXJjaCBmb3IgYSBwdWJsaWMgcm9vbSwgam9pbiBpdCwgY3JlYXRlIHlvdXIgb3duLCBpbnZpdGUgeW91ciBmcmllbmRzLCBlbmVtaWVzLCBhd2t3YXJkIGFjcXVhaW50aW5jZXMsIG1ha2UgeW91ciByb29tIHByaXZhdGUsIGdldCBkb3duIGFuZCBkaXJ0eSwgeW91IGtub3cgd2hhdCBJIG1lYW4sIGRpc2N1c3MgZGlydHkgdGhpbmdzLCB5b3Uga25vdz8gUm9vdCB2ZWdldGFibGVzLlwiLFxuICAgICAgICAvLyB0eXBlOiBcImluZm9cIixcbiAgICAgICAgLy8gc2hvd0NhbmNlbEJ1dHRvbjogdHJ1ZSxcbiAgICAgICAgY29uZmlybUJ1dHRvbkNvbG9yOiBcIiM3NDlDQThcIixcbiAgICAgICAgY29uZmlybUJ1dHRvblRleHQ6IFwiQm9vcFwiLFxuICAgICAgICAvLyBjbG9zZU9uQ29uZmlybTogZmFsc2UsXG4gICAgICAgIC8vIGh0bWw6IGZhbHNlXG4gICAgICAgIGltYWdlVXJsOiBcIi9pbWcvZmx5LXBpZy1zZXJpb3VzLWljb24ucG5nXCIsXG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG4gIHJlbmRlclJvb206IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdmFyIG5hbWUxID0gbW9kZWwuZ2V0KCduYW1lJyksXG4gICAgbmFtZTIgPSB0aGlzLm1vZGVsLmdldCgnY2hhdHJvb20nKS5nZXQoJ25hbWUnKTtcbiAgICB0aGlzLiQoJyNwdWJsaWMtcm9vbXMnKS5hcHBlbmQodGhpcy5yb29tVGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICBpZiAobmFtZTEgPT09IG5hbWUyKSB7XG4gICAgICB0aGlzLiQoJyNwdWJsaWMtcm9vbXMnKS5maW5kKCcucm9vbS1uYW1lJykubGFzdCgpLmFkZENsYXNzKCdhY3RpdmUnKS5mYWRlSW4oKTtcbiAgICB9XG4gIH0sXG4gIHJlbmRlclByaXZhdGVSb29tczogZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlclByaXZhdGVSb29tcycpO1xuICAgIGNvbnNvbGUubG9nKCdQUklWQVRFUk9PTVM6ICcsIHRoaXMubW9kZWwuZ2V0KFwicHJpdmF0ZVJvb21zXCIpKTtcbiAgICB0aGlzLiQoJyNwcml2YXRlLXJvb21zJykuZW1wdHkoKTtcbiAgICB0aGlzLm1vZGVsLmdldCgncHJpdmF0ZVJvb21zJykuZWFjaChmdW5jdGlvbiAocm9vbSkge1xuICAgICAgdGhpcy5yZW5kZXJQcml2YXRlUm9vbShyb29tKTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyUHJpdmF0ZVJvb206IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdmFyIG5hbWUxID0gbW9kZWwuZ2V0KCduYW1lJyksXG4gICAgbmFtZTIgPSB0aGlzLm1vZGVsLmdldCgnY2hhdHJvb20nKS5nZXQoJ25hbWUnKTtcbiAgICB0aGlzLiQoJyNwcml2YXRlLXJvb21zJykuYXBwZW5kKHRoaXMucm9vbVRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gICAgaWYgKG5hbWUxID09PSBuYW1lMikge1xuICAgICAgdGhpcy4kKCcjcHJpdmF0ZS1yb29tcycpLmZpbmQoJy5yb29tLW5hbWUnKS5sYXN0KCkuYWRkQ2xhc3MoJ2FjdGl2ZScpLmZhZGVJbigpO1xuICAgIH1cbiAgfSxcbiAgam9pblJvb206IGZ1bmN0aW9uKG9iaikge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5qb2luUm9vbScpO1xuICAgICAvLyAkKCcjY2hhdEltYWdlVXBsb2FkQ29udGFpbmVyJykuZGF0YSgnY2hhdC10eXBlJywgJ2NoYXQnKTtcbiAgICB0aGlzLmN1cnJlbnREYXRlID0gJyc7XG4gICAgdGhpcy5wcmV2aW91c0RhdGUgPSAnJztcbiAgICB0aGlzLnZlbnQudHJpZ2dlcignam9pblJvb20nLCBvYmoubmFtZSk7XG4gIH0sXG4vLyBjaGFuZ2UgdG8gJ2pvaW5EaXJlY3RNZXNzYWdlJ1xuICBpbml0RGlyZWN0TWVzc2FnZTogZnVuY3Rpb24oZSkge1xuICAgIHZhciByZWNpcGllbnQgPSB7fSxcbiAgICAgICAgJHRhciA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcbiAgICByZWNpcGllbnQudXNlcm5hbWUgPSAkdGFyLnRleHQoKS50cmltKCk7XG4gICAgcmVjaXBpZW50LnVzZXJJbWFnZSA9ICR0YXIuZmluZCgnaW1nJykuYXR0cignc3JjJyk7XG4gICAgdGhpcy5jdXJyZW50RGF0ZSA9ICcnO1xuICAgIHRoaXMucHJldmlvdXNEYXRlID0gJyc7XG4gICAgaWYgKHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbScpLmdldCgnY3VycmVudFVzZXInKSAhPT0gcmVjaXBpZW50LnVzZXJuYW1lKSB7XG4gICAgICB0aGlzLnZlbnQudHJpZ2dlcignaW5pdERpcmVjdE1lc3NhZ2UnLCByZWNpcGllbnQpO1xuICAgIH1cbiAgfSxcblxuXG5cblxuXG4vLyBpbWFnZSB1cGxvYWRcblxuIGNoYXRVcGxvYWRJbWFnZTogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICBjb25zb2xlLmxvZygnaW1nIHVybDogJywgcmVzcG9uc2UpO1xuICAgIHRoaXMudmVudC50cmlnZ2VyKFwiY2hhdFwiLCByZXNwb25zZSk7XG4gICAgdGhpcy5zY3JvbGxCb3R0b21JbnN1cmFuY2UoKTtcbiAgfSxcblxuICBtZXNzYWdlVXBsb2FkSW1hZ2U6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICBjb25zb2xlLmxvZygnaW1nIHVybDogJywgcmVzcG9uc2UpO1xuICAgdGhpcy52ZW50LnRyaWdnZXIoXCJkaXJlY3RNZXNzYWdlXCIsIHJlc3BvbnNlKTtcbiAgIHRoaXMuc2Nyb2xsQm90dG9tSW5zdXJhbmNlKCk7XG4gfSxcblxuXG5cblxuXG4gIC8vZXZlbnRzXG5cblxuICBtZXNzYWdlSW5wdXRQcmVzc2VkOiBmdW5jdGlvbihlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMgJiYgJC50cmltKCQoJy5tZXNzYWdlLWlucHV0JykudmFsKCkpLmxlbmd0aCA+IDApIHtcbiAgICAgIC8vIGZ1biBmYWN0OiBzZXBhcmF0ZSBldmVudHMgd2l0aCBhIHNwYWNlIGluIHRyaWdnZXIncyBmaXJzdCBhcmcgYW5kIHlvdVxuICAgICAgLy8gY2FuIHRyaWdnZXIgbXVsdGlwbGUgZXZlbnRzLlxuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJjaGF0XCIsIHsgbWVzc2FnZTogdGhpcy4kKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgpfSk7XG4gICAgICB0aGlzLiQoJy5tZXNzYWdlLWlucHV0JykudmFsKCcnKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJ0eXBpbmdcIik7XG4gICAgICBjb25zb2xlLmxvZygnd3V0Jyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBkaXJlY3RNZXNzYWdlSW5wdXRQcmVzc2VkOiBmdW5jdGlvbihlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTMgJiYgJC50cmltKCQoJy5kaXJlY3QtbWVzc2FnZS1pbnB1dCcpLnZhbCgpKS5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBmdW4gZmFjdDogc2VwYXJhdGUgZXZlbnRzIHdpdGggYSBzcGFjZSBpbiB0cmlnZ2VyJ3MgZmlyc3QgYXJnIGFuZCB5b3VcbiAgICAgIC8vIGNhbiB0cmlnZ2VyIG11bHRpcGxlIGV2ZW50cy5cbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiZGlyZWN0TWVzc2FnZVwiLCB7IG1lc3NhZ2U6IHRoaXMuJCgnLmRpcmVjdC1tZXNzYWdlLWlucHV0JykudmFsKCl9KTtcbiAgICAgIHRoaXMuJCgnLmRpcmVjdC1tZXNzYWdlLWlucHV0JykudmFsKCcnKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoXCJ0eXBpbmdcIik7XG4gICAgICBjb25zb2xlLmxvZygnaHVoJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBzZXRSb29tOiBmdW5jdGlvbihlKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnNldFJvb20nKTtcbiAgICB2YXIgJHRhciA9ICQoZS50YXJnZXQpO1xuICAgIGlmICgkdGFyLmlzKCcucm9vbS1uYW1lJykpIHtcbiAgICAgIHRoaXMuam9pblJvb20oe2lkOiAkdGFyLmRhdGEoJ3Jvb20taWQnKSwgbmFtZTogJHRhci5kYXRhKCdyb29tJyl9KTtcbiAgICB9XG4gIH0sXG5cblxuICBkYXRlRGl2aWRlcjogKGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyICR3aW5kb3cgPSAkKHdpbmRvdyksXG4gICAgJHN0aWNraWVzO1xuXG4gICAgbG9hZCA9IGZ1bmN0aW9uKHN0aWNraWVzKSB7XG4gICAgICAkc3RpY2tpZXMgPSBzdGlja2llcztcbiAgICAgICQoJyNjaGF0Ym94LWNvbnRlbnQnKS5zY3JvbGwoc2Nyb2xsU3RpY2tpZXNJbml0KTtcbiAgICB9O1xuXG4gICAgc2Nyb2xsU3RpY2tpZXNJbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAkKHRoaXMpLm9mZihcInNjcm9sbC5zdGlja2llc1wiKTtcbiAgICAgICQodGhpcykub24oXCJzY3JvbGwuc3RpY2tpZXNcIiwgXy5kZWJvdW5jZShfd2hlblNjcm9sbGluZywgMTUwKSk7XG4gICAgfTtcblxuICAgIF93aGVuU2Nyb2xsaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICAkc3RpY2tpZXMucmVtb3ZlQ2xhc3MoJ2ZpeGVkJyk7XG4gICAgICAkc3RpY2tpZXMuZWFjaChmdW5jdGlvbihpLCBzdGlja3kpIHtcbiAgICAgICAgdmFyICR0aGlzU3RpY2t5ID0gJChzdGlja3kpLFxuICAgICAgICAkdGhpc1N0aWNreVRvcCA9ICR0aGlzU3RpY2t5Lm9mZnNldCgpLnRvcDtcbiAgICAgICAgaWYgKCR0aGlzU3RpY2t5VG9wIDw9IDE2Mikge1xuICAgICAgICAgICR0aGlzU3RpY2t5LmFkZENsYXNzKFwiZml4ZWRcIik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgbG9hZDogbG9hZFxuICAgIH07XG4gIH0pKClcblxuXG5cblxufSk7XG5cbn0pKGpRdWVyeSk7IiwiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5JbnZpdGF0aW9uQ29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcbiAgICBtb2RlbDogYXBwLkludml0YXRpb25Nb2RlbFxuICB9KTtcblxufSkoKTsiLCJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLkNoYXRyb29tTGlzdCA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcbiAgICBtb2RlbDogYXBwLkNoYXRyb29tTW9kZWwsXG4gICAgdXJsOiAnL2FwaS9jaGF0cm9vbXMnLFxuICB9KTtcblxufSkoKTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5Qcml2YXRlUm9vbUNvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG4gICAgbW9kZWw6IGFwcC5DaGF0cm9vbU1vZGVsLFxuICB9KTtcblxufSkoKTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG5cbihmdW5jdGlvbigkKSB7XG5cbiAgYXBwLkNoYXRJbWFnZVVwbG9hZFZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG5cbiAgICBlbDogJCgnI2NoYXRJbWFnZVVwbG9hZENvbnRhaW5lcicpLFxuICBcbiAgICBldmVudHM6IHtcbiAgICAgICdjaGFuZ2UgI2NoYXRJbWFnZVVwbG9hZCc6ICdyZW5kZXJUaHVtYicsXG4gICAgICAnYXR0YWNoSW1hZ2UgI2NoYXRJbWFnZVVwbG9hZEZvcm0nOiAndXBsb2FkJyxcbiAgICAgICdjbGljayAjYWRkQ2hhdEltYWdlQnRuJzogJ3N1Ym1pdCcsXG4gICAgfSxcblxuICAgIC8vIGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuICAgIC8vICAgdGhpcy5saXN0ZW5Ubyh0aGlzLCBcImZpbGUtY2hvc2VuXCIsIHRoaXMucmVuZGVyVGh1bWIsIHRoaXMpO1xuICAgIC8vICAgdGhpcy5saXN0ZW5Ubyh0aGlzLCBcImZpbGUtY2hvc2VuXCIsIHRoaXMucmVuZGVyVGh1bWIsIHRoaXMpO1xuICAgIC8vIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5yZW5kZXJUaHVtYigpO1xuICAgIH0sXG5cbiAgICByZW5kZXJUaHVtYjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaW5wdXQgPSB0aGlzLiQoJyNjaGF0SW1hZ2VVcGxvYWQnKTtcbiAgICAgIHZhciBpbWcgPSB0aGlzLiQoJyN1cGxvYWRlZENoYXRJbWFnZScpWzBdO1xuICAgICAgaWYoaW5wdXQudmFsKCkgIT09ICcnKSB7XG4gICAgICAgIHZhciBzZWxlY3RlZF9maWxlID0gaW5wdXRbMF0uZmlsZXNbMF07XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICByZWFkZXIub25sb2FkID0gKGZ1bmN0aW9uKGFJbWcpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgYUltZy5zcmMgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkoaW1nKTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoIHNlbGVjdGVkX2ZpbGUgKTtcbiAgICAgIH1cblxuICAgIH0sXG5cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMuJGZvcm0gPSB0aGlzLiQoJyNjaGF0SW1hZ2VVcGxvYWRGb3JtJyk7XG4gICAgICB0aGlzLiRmb3JtLnRyaWdnZXIoJ2F0dGFjaEltYWdlJyk7XG4gICAgfSxcblxuICAgIHVwbG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEodGhpcy4kZm9ybVswXSk7XG4gICAgICBpZiAodGhpcy4kKCcjY2hhdEltYWdlVXBsb2FkJylbMF0uZmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICB1cmw6ICcvYXBpL3VwbG9hZENoYXRJbWFnZScsXG4gICAgICAgICAgZGF0YTogZm9ybURhdGEsXG4gICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgIGNvbnRlbnRUeXBlOiBmYWxzZSxcbiAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oIHhociApIHtcbiAgICAgICAgICAgIHN3YWwoe1xuICAgICAgICAgICAgICB0aXRsZTogXCJPSCBOTyBPSCBOTyBPSCBOT1wiLFxuICAgICAgICAgICAgICB0ZXh0OiBcIllvdXIgaW1hZ2UuIEl0IHVoLCB3b24ndCBmaXQuICdUb28gYmlnJyB0aGUgY29tcHV0ZXIgbW9ua2V5cyBzYXkuIEVpdGhlciB0aGF0LCBvciBpdCdzIG5vdCBhIC5qcGVnLCAucG5nLCBvciAuZ2lmLiBCdXQgd2hhdCBkbyBJIGtub3csIEknbSBqdXN0IHRoZSBndXkgc3RhcmluZyBhdCB0aGUgY29tcHV0ZXIgc2NyZWVuIGJlaGluZCB5b3UuXCIsXG4gICAgICAgICAgICAgIHR5cGU6IFwiZXJyb3JcIixcbiAgICAgICAgICAgICAgaW1hZ2VVcmw6ICcvaW1nL3NjdWJhLXBpZy5wbmcnLFxuICAgICAgICAgICAgICBjb25maXJtQnV0dG9uQ29sb3I6IFwiIzc0OUNBOFwiLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiggcmVzcG9uc2UgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnaW1nVXBsb2FkIHJlc3BvbnNlOiAnLCByZXNwb25zZSk7XG4gICAgICAgICAgICBfdGhpcy4kZWwuZGF0YSgnY2hhdC10eXBlJykgPT09ICdjaGF0JyA/XG4gICAgICAgICAgICAgIF90aGlzLnRyaWdnZXIoJ2NoYXQtaW1hZ2UtdXBsb2FkZWQnLCByZXNwb25zZSkgOlxuICAgICAgICAgICAgICBfdGhpcy50cmlnZ2VyKCdtZXNzYWdlLWltYWdlLXVwbG9hZGVkJywgcmVzcG9uc2UpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ltZ1VwbG9hZCBwYXRoICcsIHJlc3BvbnNlLnBhdGgpO1xuICAgICAgICAgICAgJCgnI2NoYXRJbWFnZVVwbG9hZE1vZGFsJykubW9kYWwoJ2hpZGUnKTtcbiAgICAgICAgICAgIF90aGlzLmNsZWFyRmllbGQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICB0aGlzLnRyaWdnZXIoJ2ltYWdlLXVwbG9hZGVkJyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuXG4gICAgY2xlYXJGaWVsZDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiQoJyN1cGxvYWRlZENoYXRJbWFnZScpWzBdLnNyYyA9ICcnO1xuICAgICAgdGhpcy4kKCcjY2hhdEltYWdlVXBsb2FkJykudmFsKCcnKTtcbiAgICB9XG5cbiAgfSk7XG5cbn0pKGpRdWVyeSk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuXG4oZnVuY3Rpb24oJCkge1xuXG4gIGFwcC5DaGF0cm9vbVNldHRpbmdzVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcblxuICAgIGVsOiAkKCcjY2hhdHJvb20taGVhZGVyLWNvbnRhaW5lcicpLFxuICAgIHVzZXJJbnZpdGVkVGVtcGxhdGU6IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJ1c2VyLWludml0ZWQtcmVzcG9uc2Ugc3VjY2Vzc1wiPjwlPSB1c2VybmFtZSAlPiBJbnZpdGVkITwvZGl2PicpLFxuICAgIGludml0YXRpb25FcnJvclRlbXBsYXRlOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwidXNlci1pbnZpdGVkLXJlc3BvbnNlIGZhaWx1cmVcIj5GYWlsdXJlITwvZGl2PicpLFxuICAgIGV2ZW50czoge1xuICAgICAgJ2NoYW5nZSAjcHJlZmVyZW5jZXMtaW1hZ2UtdXBsb2FkJzogJ3JlbmRlclRodW1iJyxcbiAgICAgICdhdHRhY2hJbWFnZSAjcHJlZmVyZW5jZXMtZm9ybSc6ICd1cGxvYWQnLFxuICAgICAgJ2NsaWNrICNwcmVmZXJlbmNlcy1idG4nOiAnc3VibWl0JyxcbiAgICAgICdrZXl1cCAjaW52aXRlLXVzZXItaW5wdXQnOiAnaW52aXRlVXNlcicsXG4gICAgfSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcbiAgICAgIHRoaXMudXNlclNlYXJjaFR5cGVhaGVhZCgpO1xuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAgICQoXCJmb3JtXCIpLnN1Ym1pdChmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLmxpc3RlblRvKHRoaXMsIFwidXNlckludml0ZWRcIiwgdGhpcy51c2VySW52aXRlZCwgdGhpcyk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnJlbmRlclRodW1iKCk7XG4gICAgfSxcblxuICAgIHJlbmRlclRodW1iOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpbnB1dCA9IHRoaXMuJCgnI3ByZWZlcmVuY2VzLWltYWdlLXVwbG9hZCcpO1xuICAgICAgdmFyIGltZyA9IHRoaXMuJCgnI3VwbG9hZGVkLXByZWZlcmVuY2VzLWltYWdlJylbMF07XG4gICAgICBpZihpbnB1dC52YWwoKSAhPT0gJycpIHtcbiAgICAgICAgdmFyIHNlbGVjdGVkX2ZpbGUgPSBpbnB1dFswXS5maWxlc1swXTtcbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSAoZnVuY3Rpb24oYUltZykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBhSW1nLnNyYyA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICB9O1xuICAgICAgICB9KShpbWcpO1xuICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTCggc2VsZWN0ZWRfZmlsZSApO1xuICAgICAgfVxuXG4gICAgfSxcblxuICAgIHN1Ym1pdDogZnVuY3Rpb24oZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICB0aGlzLiRmb3JtID0gdGhpcy4kKCcjcHJlZmVyZW5jZXMtZm9ybScpO1xuICAgICAgdGhpcy4kZm9ybS50cmlnZ2VyKCdhdHRhY2hJbWFnZScpO1xuICAgIH0sXG5cbiAgICB1cGxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKHRoaXMuJGZvcm1bMF0pO1xuICAgICAgaWYgKHRoaXMuJCgnI3ByZWZlcmVuY2VzLWltYWdlLXVwbG9hZCcpWzBdLmZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgdXJsOiAnL2FwaS91cGxvYWRDaGF0cm9vbUltYWdlJyxcbiAgICAgICAgICBkYXRhOiBmb3JtRGF0YSxcbiAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiggeGhyICkge1xuICAgICAgICAgICAgc3dhbCh7XG4gICAgICAgICAgICAgIHRpdGxlOiBcIk9IIE5PIE9IIE5PIE9IIE5PXCIsXG4gICAgICAgICAgICAgIHRleHQ6IFwiWW91ciBpbWFnZS4gSXQgdWgsIHdvbid0IGZpdC4gJ1RvbyBiaWcnIHRoZSBjb21wdXRlciBtb25rZXlzIHNheS4gRWl0aGVyIHRoYXQsIG9yIGl0J3Mgbm90IGEgLmpwZWcsIC5wbmcsIG9yIC5naWYuIEJ1dCB3aGF0IGRvIEkga25vdywgSSdtIGp1c3QgdGhlIGd1eSBzdGFyaW5nIGF0IHRoZSBjb21wdXRlciBzY3JlZW4gYmVoaW5kIHlvdS5cIixcbiAgICAgICAgICAgICAgaW1hZ2VVcmw6ICcvaW1nL3NjdWJhLXBpZy5wbmcnLFxuICAgICAgICAgICAgICBjb25maXJtQnV0dG9uQ29sb3I6IFwiIzc0OUNBOFwiXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKCByZXNwb25zZSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdpbWdVcGxvYWQgcmVzcG9uc2U6ICcsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIHZhciBmb3JtID0gX3RoaXMuY3JlYXRlUm9vbUZvcm1EYXRhKCk7XG4gICAgICAgICAgICBmb3JtLnJvb21JbWFnZSA9IHJlc3BvbnNlLnJvb21JbWFnZTtcbiAgICAgICAgICAgIF90aGlzLnRyaWdnZXIoJ3VwZGF0ZVJvb20nLCBmb3JtKTtcbiAgICAgICAgICAgICQoJyNwcmVmZXJlbmNlcy1tb2RhbCcpLm1vZGFsKCdoaWRlJyk7XG4gICAgICAgICAgICBfdGhpcy5jbGVhckZpZWxkKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBmb3JtID0gdGhpcy5jcmVhdGVSb29tRm9ybURhdGEoKTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKCd1cGRhdGVSb29tJywgZm9ybSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuXG4gICAgY3JlYXRlUm9vbUZvcm1EYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBmb3JtRGF0YSA9IHt9O1xuICAgICAgdGhpcy4kKCcjcHJlZmVyZW5jZXMtZm9ybScpLmZpbmQoICdpbnB1dCcgKS5lYWNoKGZ1bmN0aW9uKGksIGVsKSB7XG4gICAgICAgIGlmICgkKGVsKS5kYXRhKCdjcmVhdGUnKSA9PT0gJ3ByaXZhY3knKSB7XG4gICAgICAgICAgdmFyIHZhbCA9ICQoZWwpLnByb3AoJ2NoZWNrZWQnKTtcbiAgICAgICAgICBmb3JtRGF0YVsncHJpdmFjeSddID0gdmFsO1xuICAgICAgICB9IGVsc2UgaWYgKCQoZWwpLnZhbCgpICE9PSAnJyAmJiAkKGVsKS52YWwoKSAhPT0gJ29uJykge1xuICAgICAgICAgIGZvcm1EYXRhWyQoZWwpLmRhdGEoJ2NyZWF0ZScpXSA9ICQoZWwpLnZhbCgpO1xuICAgICAgICAgICQoZWwpLnZhbCgnJyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgZGVsZXRlIGZvcm1EYXRhLnVuZGVmaW5lZDtcbiAgICAgIHJldHVybiBmb3JtRGF0YTtcbiAgICB9LFxuXG5cbiAgICBjbGVhckZpZWxkOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJCgnI3VwbG9hZGVkLXByZWZlcmVuY2VzLWltYWdlJylbMF0uc3JjID0gJyc7XG4gICAgICB0aGlzLiQoJyNwcmVmZXJlbmNlcy1pbWFnZS11cGxvYWQnKS52YWwoJycpO1xuICAgIH0sXG5cbiAgICBpbnZpdGVVc2VyOiBmdW5jdGlvbihlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB2YXIgcmVjaXBpZW50ID0gJC50cmltKCQoJyNpbnZpdGUtdXNlci1pbnB1dCcpLnZhbCgpKTtcbiAgICAgIGlmIChlLmtleUNvZGUgPT09IDEzICYmIHJlY2lwaWVudC5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIHNlbmRlciA9IHRoaXMubW9kZWwuZ2V0KCdjdXJyZW50VXNlcicpLFxuICAgICAgICAgICAgcm9vbUlkID0gdGhpcy5tb2RlbC5nZXQoJ2lkJyksXG4gICAgICAgICAgICByb29tTmFtZSA9IHRoaXMubW9kZWwuZ2V0KCduYW1lJyksXG4gICAgICAgICAgICBpbnZpdGF0aW9uT2JqID0ge3NlbmRlcjogc2VuZGVyLCByb29tSWQ6IHJvb21JZCwgcm9vbU5hbWU6IHJvb21OYW1lLCByZWNpcGllbnQ6IHJlY2lwaWVudH07XG4gICAgICAgIHRoaXMudmVudC50cmlnZ2VyKCdpbnZpdGVVc2VyJywgaW52aXRhdGlvbk9iaik7XG4gICAgICAgICQoJyNpbnZpdGUtdXNlci1pbnB1dCcpLnZhbCgnJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnc2VhcmNoIHR5cGluZycpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIHVzZXJTZWFyY2hUeXBlYWhlYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAgIHZhciBibG9vZCA9IG5ldyBCbG9vZGhvdW5kKHtcbiAgICAgICAgZGF0dW1Ub2tlbml6ZXI6IEJsb29kaG91bmQudG9rZW5pemVycy5vYmoud2hpdGVzcGFjZSgndXNlcm5hbWUnKSxcbiAgICAgICAgcXVlcnlUb2tlbml6ZXI6IEJsb29kaG91bmQudG9rZW5pemVycy53aGl0ZXNwYWNlLFxuICAgICAgICBwcmVmZXRjaDoge1xuICAgICAgICAgIHVybDogJy9hbGxVc2VycycsXG4gICAgICAgICAgZmlsdGVyOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnLS0tLS0tZGFhYXRhYS0tLS0nLCBkYXRhKTtcbiAgICAgICAgICAgICByZXR1cm4gXy5tYXAoZGF0YSwgZnVuY3Rpb24odXNlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHVzZXJuYW1lOiB1c2VyIH07XG4gICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICB0dGw6IDAsXG4gICAgICAgIH0sXG4gICAgICAgIHJlbW90ZToge1xuICAgICAgICAgIHVybDogJy9zZWFyY2hVc2Vycz91c2VybmFtZT0lUVVFUlknLFxuICAgICAgICAgIHdpbGRjYXJkOiAnJVFVRVJZJyxcbiAgICAgICAgICByYXRlTGltaXRXYWl0OiAzMDAsXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgYmxvb2QuY2xlYXJQcmVmZXRjaENhY2hlKCk7XG4gICAgICBibG9vZC5pbml0aWFsaXplKCk7XG4gICAgICAkKCcjaW52aXRlLXVzZXItaW5wdXQnKS50eXBlYWhlYWQoe1xuICAgICAgICBtaW5MZW5ndGg6IDIsXG4gICAgICAgIGNsYXNzTmFtZXM6IHtcbiAgICAgICAgICBpbnB1dDogJ3R5cGVhaGVhZC1pbnB1dCcsXG4gICAgICAgICAgaGludDogJ3R5cGVhaGVhZC1oaW50JyxcbiAgICAgICAgICBzZWxlY3RhYmxlOiAndHlwZWFoZWFkLXNlbGVjdGFibGUnLFxuICAgICAgICAgIG1lbnU6ICd0eXBlYWhlYWQtbWVudScsXG4gICAgICAgICAgaGlnaGxpZ2h0OiAndHlwZWFoZWFkLWhpZ2hsaWdodCcsXG4gICAgICAgICAgZGF0YXNldDogJ3R5cGVhaGVhZC1kYXRhc2V0JyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGxpbWl0OiA1LFxuICAgICAgICBzb3VyY2U6IGJsb29kLFxuICAgICAgICBuYW1lOiAndXNlci1zZWFyY2gnLFxuICAgICAgICBkaXNwbGF5OiAndXNlcm5hbWUnLFxuICAgICAgfSkub24oJ3R5cGVhaGVhZDpzZWxlY3QgdHlwZWFoZWFkOmF1dG9jb21wbGV0ZScsIGZ1bmN0aW9uKG9iaikge1xuXG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgdXNlckludml0ZWQ6IGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG4gICAgICBpZiAodXNlcm5hbWUuZXJyb3IgPT09ICdlcnJvcicpIHtcbiAgICAgICAgJCgnLmludml0ZS11c2VyLWNvbnRhaW5lcicpLmFwcGVuZCh0aGlzLmludml0YXRpb25FcnJvclRlbXBsYXRlKCkpO1xuICAgICAgfVxuICAgICAgJCgnLmludml0ZS11c2VyLWNvbnRhaW5lcicpLmFwcGVuZCh0aGlzLnVzZXJJbnZpdGVkVGVtcGxhdGUoe3VzZXJuYW1lOiB1c2VybmFtZX0pKTtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICQoJy5pbnZpdGUtdXNlci1jb250YWluZXIgLnN1Y2Nlc3MnKS5mYWRlT3V0KDMwMCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoJy5pbnZpdGUtdXNlci1jb250YWluZXIgLmZhaWx1cmUnKS5mYWRlT3V0KDMwMCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9LCAxMDAwKTtcbiAgICB9LFxuXG5cbiAgfSk7XG5cbn0pKGpRdWVyeSk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuXG4oZnVuY3Rpb24oJCkge1xuXG4gIGFwcC5DcmVhdGVDaGF0cm9vbVZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG5cbiAgICBlbDogJCgnI2NyZWF0ZUNoYXRyb29tQ29udGFpbmVyJyksXG4gICAgZXZlbnRzOiB7XG4gICAgICAnY2hhbmdlICNjaGF0cm9vbUltYWdlVXBsb2FkJzogJ3JlbmRlclRodW1iJyxcbiAgICAgICdhdHRhY2hJbWFnZSAjY3JlYXRlQ2hhdHJvb21Gb3JtJzogJ3VwbG9hZCcsXG4gICAgICAnY2xpY2sgI2NyZWF0ZUNoYXRyb29tQnRuJzogJ3N1Ym1pdCcsXG4gICAgfSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcbiAgICAgIHRoaXMubGlzdGVuVG8odGhpcywgXCJjaGF0cm9vbUF2YWlsYWJpbGl0eVwiLCB0aGlzLnJlbmRlckNoYXRyb29tQXZhaWxhYmlsaXR5LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMucmVuZGVyVGh1bWIoKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyVGh1bWI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGlucHV0ID0gdGhpcy4kKCcjY2hhdHJvb21JbWFnZVVwbG9hZCcpO1xuICAgICAgdmFyIGltZyA9IHRoaXMuJCgnI3VwbG9hZGVkQ2hhdHJvb21JbWFnZScpWzBdO1xuICAgICAgaWYoaW5wdXQudmFsKCkgIT09ICcnKSB7XG4gICAgICAgIHZhciBzZWxlY3RlZF9maWxlID0gaW5wdXRbMF0uZmlsZXNbMF07XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICByZWFkZXIub25sb2FkID0gKGZ1bmN0aW9uKGFJbWcpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgYUltZy5zcmMgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkoaW1nKTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoIHNlbGVjdGVkX2ZpbGUgKTtcbiAgICAgIH1cblxuICAgIH0sXG5cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGlmICh0aGlzLiQoJyNjaGF0cm9vbS1uYW1lLWlucHV0JykuaGFzQ2xhc3MoJ2lucHV0LWludmFsaWQnKSkge1xuICAgICAgICBzd2FsKHtcbiAgICAgICAgICB0aXRsZTogXCJPSCBOTyBPSCBOTyBPSCBOT1wiLFxuICAgICAgICAgIHRleHQ6IFwiQ2hhdHJvb20gQWxyZWFkeSwgSXQgQWxyZWFkeSBFeGlzdHMhIEFuZC4gRG9uJ3QgR28gSW4gVGhlcmUuIERvbid0LiBZb3UuIFlvdSBTaG91bGQgSGF2ZS4gSSBUaHJldyBVcCBJbiBNeSBIYXQuIFRob3NlIFBvb3IgLiAuIC4gVGhleSBXZXJlIEp1c3QhIE9IIE5PIFdIWS4gV0hZIE9IIE5PLiBPSCBOTy5cIixcbiAgICAgICAgICBpbWFnZVVybDogJy9pbWcvc2N1YmEtcGlnLnBuZycsXG4gICAgICAgICAgY29uZmlybUJ1dHRvbkNvbG9yOiBcIiM3NDlDQThcIlxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuJGZvcm0gPSB0aGlzLiQoJyNjcmVhdGVDaGF0cm9vbUZvcm0nKTtcbiAgICAgICAgdGhpcy4kZm9ybS50cmlnZ2VyKCdhdHRhY2hJbWFnZScpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICB1cGxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgIHZhciBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSh0aGlzLiRmb3JtWzBdKTtcbiAgICAgIGlmICh0aGlzLiQoJyNjaGF0cm9vbUltYWdlVXBsb2FkJylbMF0uZmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICB1cmw6ICcvYXBpL3VwbG9hZENoYXRyb29tSW1hZ2UnLFxuICAgICAgICAgIGRhdGE6IGZvcm1EYXRhLFxuICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICBjb250ZW50VHlwZTogZmFsc2UsXG4gICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKCB4aHIgKSB7XG4gICAgICAgICAgICBzd2FsKHtcbiAgICAgICAgICAgICAgdGl0bGU6IFwiT0ggTk8gT0ggTk8gT0ggTk9cIixcbiAgICAgICAgICAgICAgdGV4dDogXCJZb3VyIGltYWdlLiBJdCB1aCwgd29uJ3QgZml0LiAnVG9vIGJpZycgdGhlIGNvbXB1dGVyIG1vbmtleXMgc2F5LiBFaXRoZXIgdGhhdCwgb3IgaXQncyBub3QgYSAuanBlZywgLnBuZywgb3IgLmdpZi4gQnV0IHdoYXQgZG8gSSBrbm93LCBJJ20ganVzdCB0aGUgZ3V5IHN0YXJpbmcgYXQgdGhlIGNvbXB1dGVyIHNjcmVlbiBiZWhpbmQgeW91LlwiLFxuICAgICAgICAgICAgICBpbWFnZVVybDogJy9pbWcvc2N1YmEtcGlnLnBuZycsXG4gICAgICAgICAgICAgIGNvbmZpcm1CdXR0b25Db2xvcjogXCIjNzQ5Q0E4XCJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ltZ1VwbG9hZCByZXNwb25zZTogJywgcmVzcG9uc2UpO1xuICAgICAgICAgICAgdmFyIGZvcm0gPSBfdGhpcy5jcmVhdGVSb29tRm9ybURhdGEoKTtcbiAgICAgICAgICAgIHJlc3BvbnNlLm5hbWUgPSBmb3JtLm5hbWU7XG4gICAgICAgICAgICByZXNwb25zZS5wcml2YWN5ID0gZm9ybS5wcml2YWN5O1xuICAgICAgICAgICAgICBfdGhpcy52ZW50LnRyaWdnZXIoJ2NyZWF0ZVJvb20nLCByZXNwb25zZSk7XG4gICAgICAgICAgICAkKCcjY3JlYXRlQ2hhdHJvb21Nb2RhbCcpLm1vZGFsKCdoaWRlJyk7XG4gICAgICAgICAgICBfdGhpcy5jbGVhckZpZWxkKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBmb3JtID0gX3RoaXMuY3JlYXRlUm9vbUZvcm1EYXRhKCk7XG4gICAgICAgdGhpcy52ZW50LnRyaWdnZXIoJ2NyZWF0ZVJvb20nLCBmb3JtKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG5cbiAgICBjcmVhdGVSb29tRm9ybURhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGZvcm1EYXRhID0ge307XG4gICAgICBmb3JtRGF0YS5yb29tSW1hZ2UgPSAnL2ltZy9jaGphdC1pY29uMS5wbmcnO1xuICAgICAgdGhpcy4kKCcjY3JlYXRlQ2hhdHJvb21Gb3JtJykuZmluZCggJ2lucHV0JyApLmVhY2goZnVuY3Rpb24oaSwgZWwpIHtcbiAgICAgICAgaWYgKCQoZWwpLnByb3AoJ3R5cGUnKSA9PT0gXCJidXR0b25cIikge1xuXG4gICAgICAgIH0gZWxzZSBpZiAoJChlbCkuZGF0YSgnY3JlYXRlJykgPT09ICdwcml2YWN5Jykge1xuICAgICAgICAgIHZhciB2YWwgPSAkKGVsKS5wcm9wKCdjaGVja2VkJyk7XG4gICAgICAgICAgZm9ybURhdGFbJ3ByaXZhY3knXSA9IHZhbDtcbiAgICAgICAgfSBlbHNlIGlmICgkKGVsKS52YWwoKSAhPT0gJycpIHtcbiAgICAgICAgICBmb3JtRGF0YVskKGVsKS5kYXRhKCdjcmVhdGUnKV0gPSAkKGVsKS52YWwoKTtcbiAgICAgICAgICAkKGVsKS52YWwoJycpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBmb3JtRGF0YTtcblxuICAgIH0sXG5cbiAgICBjbGVhckZpZWxkOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJCgnI3VwbG9hZGVkQ2hhdHJvb21JbWFnZScpWzBdLnNyYyA9ICcnO1xuICAgICAgdGhpcy4kKCcjY2hhdHJvb21JbWFnZVVwbG9hZCcpLnZhbCgnJyk7XG4gICAgfSxcblxuICAgIHJlbmRlckNoYXRyb29tQXZhaWxhYmlsaXR5OiBmdW5jdGlvbihhdmFpbGFiaWxpdHkpIHtcbiAgICAgIHRoaXMuJCgnLnJvb20tbmFtZS12YWxpZGF0aW9uJykucmVtb3ZlQ2xhc3MoJ2lucHV0LXZhbGlkIGlucHV0LWludmFsaWQnKTtcbiAgICAgIHRoaXMuJCgnLnJvb20tbmFtZS12YWxpZGF0aW9uLW1lc3NhZ2UnKS5jaGlsZHJlbigpLnJlbW92ZSgpO1xuICAgICAgaWYgKGF2YWlsYWJpbGl0eSA9PT0gdHJ1ZSkge1xuICAgICAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbicpLmFkZENsYXNzKCdpbnB1dC12YWxpZCcpO1xuICAgICAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbi1tZXNzYWdlJykuYXBwZW5kKCc8ZGl2IGlkPVwiI2NoYXRyb29tLW5hbWUtdmFsaWRhdGlvblwiIGNsYXNzPVwiZmEgZmEtY2hlY2tcIj5OYW1lIEF2YWlsYWJsZTwvZGl2PicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy4kKCcucm9vbS1uYW1lLXZhbGlkYXRpb24nKS5hZGRDbGFzcygnaW5wdXQtaW52YWxpZCBmYSBmYS10aW1lcycpO1xuICAgICAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbi1tZXNzYWdlJykuYXBwZW5kKCc8ZGl2IGlkPVwiI2NoYXRyb29tLW5hbWUtdmFsaWRhdGlvblwiIGNsYXNzPVwiZmEgZmEtdGltZXNcIj5OYW1lIFVuYXZhaWxhYmxlPC9kaXY+Jyk7XG4gICAgICB9XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbi1tZXNzYWdlJykuY2hpbGRyZW4oKS5mYWRlT3V0KDYwMCwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAkKHRoaXMpLmNoaWxkcmVuKCkucmVtb3ZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSwgMjAwMCk7XG4gICAgfVxuXG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5OYXZiYXJWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIGVsOiAnLmxvZ2luLW1lbnUnLFxuICAgIHRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNuYXZiYXItdGVtcGxhdGUnKS5odG1sKCkpLFxuICAgIGludml0YXRpb25UZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjaW52aXRhdGlvbi10ZW1wbGF0ZScpLmh0bWwoKSksXG4gICAgZXZlbnRzOiB7XG4gICAgICAnY2xpY2sgLmRlbGV0ZS1pbnZpdGF0aW9uJzogJ2RlbGV0ZUludml0YXRpb24nLFxuICAgICAgJ2NsaWNrIC5hY2NlcHQtaW52aXRhdGlvbic6ICdhY2NlcHRJbnZpdGF0aW9uJyxcbiAgICAgICdjaGFuZ2UgI3VzZXItcHJlZmVyZW5jZXMtaW1hZ2UtdXBsb2FkJzogJ3JlbmRlclRodW1iJyxcbiAgICAgICdhdHRhY2hJbWFnZSAjdXNlci1wcmVmZXJlbmNlcy1mb3JtJzogJ3VwbG9hZCcsXG4gICAgICAnY2xpY2sgI3VzZXItcHJlZmVyZW5jZXMtYnRuJzogJ3N1Ym1pdCcsXG4gICAgICAna2V5dXAgI3VzZXItcHJlZmVyZW5jZXMtaG9tZS1yb29tLWlucHV0JzogJ2RvZXNIb21lUm9vbUV4aXN0JyxcbiAgICAgIC8vICdrZXlwcmVzcyAjdXNlci1wcmVmZXJlbmNlcy1ob21lLXJvb20taW5wdXQnOiAnZG9lc0hvbWVSb29tRXhpc3QnLFxuICAgICAgJ2NsaWNrIC5mYS1wb3dlci1vZmYnOiAnbG9nb3V0JyxcbiAgICB9LFxuXG4gICAgbG9nb3V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAkLmFqYXgoe1xuICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICB1cmw6ICcvbG9nb3V0JyxcbiAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiggeGhyICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2Vycm9yOiAnLCB4aHIgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XG4gICAgICB0aGlzLm1vZGVsID0gbmV3IGFwcC5Vc2VyTW9kZWwoeyB1c2VybmFtZTogJycsIHVzZXJJbWFnZTogJycsIGhvbWVSb29tOiAnJywgaW52aXRhdGlvbnM6IG5ldyBhcHAuSW52aXRhdGlvbkNvbGxlY3Rpb24oKSB9KTtcbiAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJjaGFuZ2VcIiwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuXG4gICAgICB2YXIgaW52aXRhdGlvbnMgPSB0aGlzLm1vZGVsLmdldCgnaW52aXRhdGlvbnMnKTtcblxuICAgICAgdGhpcy5saXN0ZW5UbyhpbnZpdGF0aW9ucywgXCJyZXNldFwiLCB0aGlzLnJlbmRlckludml0YXRpb25zLCB0aGlzKTtcbiAgICAgIHRoaXMubGlzdGVuVG8odGhpcywgXCJob21lUm9vbUF2YWlsYWJpbGl0eVwiLCB0aGlzLnJlbmRlckhvbWVSb29tQXZhaWxhYmlsaXR5LCB0aGlzKTtcblxuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9LFxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUodGhpcy5tb2RlbC50b0pTT04oKSkpO1xuXG4gICAgICB0aGlzLnJlbmRlckludml0YXRpb25zKCk7XG4gICAgICB0aGlzLnNldEhvbWVSb29tVHllcGFoZWFkKCk7XG5cblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICByZW5kZXJJbnZpdGF0aW9uczogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiQoJyNpbnZpdGF0aW9ucycpLmVtcHR5KCk7XG4gICAgICB2YXIgaW52aXRhdGlvbnMgPSB0aGlzLm1vZGVsLmdldCgnaW52aXRhdGlvbnMnKTtcbiAgICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgICBpbnZpdGF0aW9ucy5lYWNoKGZ1bmN0aW9uKGludml0ZSkge1xuICAgICAgICB0aGlzXy5yZW5kZXJJbnZpdGF0aW9uKGludml0ZSk7XG4gICAgICB9LCB0aGlzKTtcbiAgICAgIGlmIChpbnZpdGF0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhpcy4kKCcucGluay1mdXp6JykuaGlkZSgpO1xuICAgICAgICB0aGlzLiQoJyNpbnZpdGF0aW9ucycpLmFwcGVuZChcIjxkaXY+WW91J3ZlIGdvdCBubyBpbnZpdGF0aW9ucywgbGlrZSBkYW5nPC9kaXY+XCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy4kKCcucGluay1mdXp6Jykuc2hvdygpO1xuICAgICAgfVxuICAgIH0sXG4gICAgcmVuZGVySW52aXRhdGlvbjogZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIHRoaXMuJCgnI2ludml0YXRpb25zJykuYXBwZW5kKHRoaXMuaW52aXRhdGlvblRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gICAgfSxcbiAgICBkZWxldGVJbnZpdGF0aW9uOiBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgcm9vbUlkID0gJChlLnRhcmdldCkuZGF0YSgncm9vbWlkJyk7XG4gICAgICB0aGlzLnZlbnQudHJpZ2dlcignZGVsZXRlSW52aXRhdGlvbicsIHJvb21JZCk7XG4gICAgfSxcbiAgICBhY2NlcHRJbnZpdGF0aW9uOiBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgcm9vbUlkID0gJChlLnRhcmdldCkuZGF0YSgncm9vbWlkJyk7XG4gICAgICB0aGlzLnZlbnQudHJpZ2dlcignYWNjZXB0SW52aXRhdGlvbicsIHJvb21JZCk7XG4gICAgfSxcblxuXG4gICAgcmVuZGVyVGh1bWI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGlucHV0ID0gdGhpcy4kKCcjdXNlci1wcmVmZXJlbmNlcy1pbWFnZS11cGxvYWQnKTtcbiAgICAgIHZhciBpbWcgPSB0aGlzLiQoJyN1cGxvYWRlZC11c2VyLXByZWZlcmVuY2VzLWltYWdlJylbMF07XG4gICAgICBpZihpbnB1dC52YWwoKSAhPT0gJycpIHtcbiAgICAgICAgdmFyIHNlbGVjdGVkX2ZpbGUgPSBpbnB1dFswXS5maWxlc1swXTtcbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSAoZnVuY3Rpb24oYUltZykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBhSW1nLnNyYyA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICB9O1xuICAgICAgICB9KShpbWcpO1xuICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTCggc2VsZWN0ZWRfZmlsZSApO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGlmICh0aGlzLiQoJyN1c2VyLXByZWZlcmVuY2VzLWhvbWUtcm9vbS1pbnB1dCcpLmhhc0NsYXNzKCdpbnB1dC1pbnZhbGlkJykpIHtcbiAgICAgICAgc3dhbCh7XG4gICAgICAgICAgdGl0bGU6IFwiT0ggTk8gT0ggTk8gT0ggTk9cIixcbiAgICAgICAgICB0ZXh0OiBcIkNoYXRyb29tIENhbid0LCBJdCBEb2Vzbid0IEV4aXN0ISBBbmQuIEkgRG9uJ3QgS25vdy4gU2hvdWxkIEk/IFNob3VsZCBZb3U/IFdoby4gSSBNZWFuIEhvdyBETyB3ZS4gSG93IGRvPyBIb3cgZG8gbm93P1wiLFxuICAgICAgICAgIGltYWdlVXJsOiAnL2ltZy9zY3ViYS1waWcucG5nJyxcbiAgICAgICAgICBjb25maXJtQnV0dG9uQ29sb3I6IFwiIzc0OUNBOFwiXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy4kZm9ybSA9IHRoaXMuJCgnI3VzZXItcHJlZmVyZW5jZXMtZm9ybScpO1xuICAgICAgICB0aGlzLiRmb3JtLnRyaWdnZXIoJ2F0dGFjaEltYWdlJyk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHVwbG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgICAgICB2YXIgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEodGhpcy4kZm9ybVswXSk7XG4gICAgICBpZiAodGhpcy4kKCcjdXNlci1wcmVmZXJlbmNlcy1pbWFnZS11cGxvYWQnKVswXS5maWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgIHVybDogJy91cGRhdGVVc2VySW1hZ2UnLFxuICAgICAgICAgIGRhdGE6IGZvcm1EYXRhLFxuICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICBjb250ZW50VHlwZTogZmFsc2UsXG4gICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKCB4aHIgKSB7XG4gICAgICAgICAgICBzd2FsKHtcbiAgICAgICAgICAgICAgdGl0bGU6IFwiT0ggTk8gT0ggTk8gT0ggTk9cIixcbiAgICAgICAgICAgICAgdGV4dDogXCJZb3VyIGltYWdlLiBJdCB1aCwgd29uJ3QgZml0LiAnVG9vIGJpZycgdGhlIGNvbXB1dGVyIG1vbmtleXMgc2F5LiBFaXRoZXIgdGhhdCwgb3IgaXQncyBub3QgYSAuanBlZywgLnBuZywgb3IgLmdpZi4gQnV0IHdoYXQgZG8gSSBrbm93LCBJJ20ganVzdCB0aGUgZ3V5IHN0YXJpbmcgYXQgdGhlIGNvbXB1dGVyIHNjcmVlbiBiZWhpbmQgeW91LlwiLFxuICAgICAgICAgICAgICBpbWFnZVVybDogJy9pbWcvc2N1YmEtcGlnLnBuZycsXG4gICAgICAgICAgICAgIGNvbmZpcm1CdXR0b25Db2xvcjogXCIjNzQ5Q0E4XCJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ltZ1VwbG9hZCByZXNwb25zZTogJywgcmVzcG9uc2UpO1xuICAgICAgICAgICAgdmFyIGZvcm0gPSB0aGlzXy5jcmVhdGVVc2VyRm9ybURhdGEoKTtcbiAgICAgICAgICAgIGZvcm0udXNlckltYWdlID0gcmVzcG9uc2UudXNlckltYWdlO1xuICAgICAgICAgICAgdGhpc18udmVudC50cmlnZ2VyKCd1cGRhdGVVc2VyJywgZm9ybSk7XG4gICAgICAgICAgICAkKCcjdXNlci1wcmVmZXJlbmNlcy1tb2RhbCcpLm1vZGFsKCdoaWRlJyk7XG4gICAgICAgICAgICB0aGlzXy5jbGVhckZpZWxkKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBmb3JtID0gdGhpcy5jcmVhdGVVc2VyRm9ybURhdGEoKTtcbiAgICAgICAgdGhpcy52ZW50LnRyaWdnZXIoJ3VwZGF0ZVVzZXInLCBmb3JtKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgY3JlYXRlVXNlckZvcm1EYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBmb3JtRGF0YSA9IHt9O1xuICAgICAgdGhpcy4kKCcjdXNlci1wcmVmZXJlbmNlcy1mb3JtJykuZmluZCggJ2lucHV0JyApLmVhY2goZnVuY3Rpb24oaSwgZWwpIHtcbiAgICAgICAgaWYgKCQoZWwpLmRhdGEoJ2NyZWF0ZScpID09PSAncHJpdmFjeScpIHtcbiAgICAgICAgICB2YXIgdmFsID0gJChlbCkucHJvcCgnY2hlY2tlZCcpO1xuICAgICAgICAgIGZvcm1EYXRhWydwcml2YWN5J10gPSB2YWw7XG4gICAgICAgIH0gZWxzZSBpZiAoJChlbCkudmFsKCkgIT09ICcnICYmICQoZWwpLnZhbCgpICE9PSAnb24nKSB7XG4gICAgICAgICAgZm9ybURhdGFbJChlbCkuZGF0YSgnY3JlYXRlJyldID0gJChlbCkudmFsKCk7XG4gICAgICAgICAgJChlbCkudmFsKCcnKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBkZWxldGUgZm9ybURhdGEudW5kZWZpbmVkO1xuICAgICAgcmV0dXJuIGZvcm1EYXRhO1xuICAgIH0sXG5cbiAgICBjbGVhckZpZWxkOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJCgnI3VwbG9hZGVkLXVzZXItcHJlZmVyZW5jZXMtaW1hZ2UnKVswXS5zcmMgPSAnJztcbiAgICAgIHRoaXMuJCgnI3VzZXItcHJlZmVyZW5jZXMtaW1hZ2UtdXBsb2FkJykudmFsKCcnKTtcbiAgICB9LFxuXG4gICAgc2V0SG9tZVJvb21UeWVwYWhlYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAgIHZhciBibG9vZCA9IG5ldyBCbG9vZGhvdW5kKHtcbiAgICAgICAgZGF0dW1Ub2tlbml6ZXI6IEJsb29kaG91bmQudG9rZW5pemVycy5vYmoud2hpdGVzcGFjZSgnbmFtZScpLFxuICAgICAgICBxdWVyeVRva2VuaXplcjogQmxvb2Rob3VuZC50b2tlbml6ZXJzLndoaXRlc3BhY2UsXG4gICAgICAgIHByZWZldGNoOiB7XG4gICAgICAgICAgdXJsOiAnL2FwaS9wdWJsaWNDaGF0cm9vbXMnLFxuICAgICAgICAgIGZpbHRlcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJy0tLS0tLS0tLWhvbWVSb29tRGF0YTogJywgZGF0YSk7XG4gICAgICAgICAgICAgcmV0dXJuIF8ubWFwKGRhdGEsIGZ1bmN0aW9uKGNoYXRyb29tKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgbmFtZTogY2hhdHJvb20gfTtcbiAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHR0bF9tczogMCxcbiAgICAgICAgfSxcbiAgICAgICAgcmVtb3RlOiB7XG4gICAgICAgICAgdXJsOiAnL2FwaS9zZWFyY2hDaGF0cm9vbXM/bmFtZT0lUVVFUlknLFxuICAgICAgICAgIHdpbGRjYXJkOiAnJVFVRVJZJyxcbiAgICAgICAgICByYXRlTGltaXRXYWl0OiAzMDAsXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgYmxvb2QuY2xlYXJQcmVmZXRjaENhY2hlKCk7XG4gICAgICBibG9vZC5pbml0aWFsaXplKCk7XG4gICAgICB2YXIgdHlwZSA9IHRoaXMuJCgnI3VzZXItcHJlZmVyZW5jZXMtaG9tZS1yb29tLWlucHV0JykudHlwZWFoZWFkKHtcbiAgICAgICAgbWluTGVuZ3RoOiAyLFxuICAgICAgICBjbGFzc05hbWVzOiB7XG4gICAgICAgICAgaW5wdXQ6ICd0eXBlYWhlYWQtaW5wdXQnLFxuICAgICAgICAgIGhpbnQ6ICd0eXBlYWhlYWQtaGludCcsXG4gICAgICAgICAgc2VsZWN0YWJsZTogJ3R5cGVhaGVhZC1zZWxlY3RhYmxlJyxcbiAgICAgICAgICBtZW51OiAndHlwZWFoZWFkLW1lbnUnLFxuICAgICAgICAgIGhpZ2hsaWdodDogJ3R5cGVhaGVhZC1oaWdobGlnaHQnLFxuICAgICAgICAgIGRhdGFzZXQ6ICd0eXBlYWhlYWQtZGF0YXNldCcsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBsaW1pdDogNSxcbiAgICAgICAgc291cmNlOiBibG9vZCxcbiAgICAgICAgbmFtZTogJ2hvbWUtcm9vbS1zZWFyY2gnLFxuICAgICAgICBkaXNwbGF5OiAnbmFtZScsXG4gICAgICB9KS5vbigndHlwZWFoZWFkOnNlbGVjdCB0eXBlYWhlYWQ6YXV0b2NvbXBsZXRlJywgZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIHRoaXNfLmRvZXNIb21lUm9vbUV4aXN0KCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgZG9lc0hvbWVSb29tRXhpc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kKCcucm9vbS1uYW1lLXZhbGlkYXRpb24nKS5yZW1vdmVDbGFzcygnaW5wdXQtdmFsaWQgaW5wdXQtaW52YWxpZCcpO1xuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAgIHZhciBjaGVjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoJC50cmltKCQoJyN1c2VyLXByZWZlcmVuY2VzLWhvbWUtcm9vbS1pbnB1dCcpLnZhbCgpKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdmFyIGNoYXRyb29tTmFtZSA9ICQoJyN1c2VyLXByZWZlcmVuY2VzLWhvbWUtcm9vbS1pbnB1dCcpLnZhbCgpO1xuICAgICAgICAgIHRoaXNfLnZlbnQudHJpZ2dlcignZG9lc0hvbWVSb29tRXhpc3QnLCBjaGF0cm9vbU5hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgdGhpc18uJCgnI3VzZXItcHJlZmVyZW5jZXMtaG9tZS1yb29tLWlucHV0JykuY2hpbGRyZW4oKS5yZW1vdmUoKTtcbiAgICAgICAgIHRoaXNfLiQoJyN1c2VyLXByZWZlcmVuY2VzLWhvbWUtcm9vbS1pbnB1dCcpLnJlbW92ZUNsYXNzKCdpbnB1dC12YWxpZCBpbnB1dC1pbnZhbGlkJyk7XG4gICAgICAgfVxuICAgICB9O1xuICAgICBfLmRlYm91bmNlKGNoZWNrKCksIDMwKTtcbiAgIH0sXG5cbiAgIHJlbmRlckhvbWVSb29tQXZhaWxhYmlsaXR5OiBmdW5jdGlvbihhdmFpbGFiaWxpdHkpIHtcblxuICAgIHRoaXMuJCgnLnJvb20tbmFtZS12YWxpZGF0aW9uJykucmVtb3ZlQ2xhc3MoJ2lucHV0LXZhbGlkIGlucHV0LWludmFsaWQnKTtcbiAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbi1tZXNzYWdlJykuY2hpbGRyZW4oKS5yZW1vdmUoKTtcbiAgICBpZiAoYXZhaWxhYmlsaXR5ID09PSBmYWxzZSkge1xuICAgICAgdGhpcy4kKCcucm9vbS1uYW1lLXZhbGlkYXRpb24nKS5hZGRDbGFzcygnaW5wdXQtdmFsaWQnKTtcbiAgICAgIHRoaXMuJCgnLnJvb20tbmFtZS12YWxpZGF0aW9uLW1lc3NhZ2UnKS5hcHBlbmQoJzxkaXYgaWQ9XCIjY2hhdHJvb20tbmFtZS12YWxpZGF0aW9uXCIgY2xhc3M9XCJmYSBmYS1jaGVja1wiPjwvZGl2PicpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbicpLmFkZENsYXNzKCdpbnB1dC1pbnZhbGlkIGZhIGZhLXRpbWVzJyk7XG4gICAgICB0aGlzLiQoJy5yb29tLW5hbWUtdmFsaWRhdGlvbi1tZXNzYWdlJykuYXBwZW5kKCc8ZGl2IGlkPVwiI2NoYXRyb29tLW5hbWUtdmFsaWRhdGlvblwiIGNsYXNzPVwiZmEgZmEtdGltZXNcIj5DaGF0cm9vbSBEb2VzIE5vdCBFeGlzdDwvZGl2PicpO1xuICAgIH1cbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kKCcucm9vbS1uYW1lLXZhbGlkYXRpb24tbWVzc2FnZScpLmNoaWxkcmVuKCkuZmFkZU91dCg2MDAsIGZ1bmN0aW9uKCl7XG4gICAgICAgICQodGhpcykuY2hpbGRyZW4oKS5yZW1vdmUoKTtcbiAgICAgIH0pO1xuICAgIH0sIDIwMDApO1xuICB9LFxuXG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5SZWdpc3RlclZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI3JlZ2lzdGVyJykuaHRtbCgpKSxcbiAgICB1c2VybmFtZUF2YWlsYWJsZVRlbXBsYXRlOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwidXNlcm5hbWUtYXZhaWxhYmxlIGZhIGZhLWNoZWNrXCI+dXNlcm5hbWUgYXZhaWxhYmxlPC9kaXY+JyksXG4gICAgdXNlcm5hbWVUYWtlblRlbXBsYXRlOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwidXNlcm5hbWUtdGFrZW4gZmEgZmEtdGltZXNcIj51c2VybmFtZSB0YWtlbjwvZGl2PicpLFxuICAgIGVycm9yVGVtcGxhdGU6IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJsb2dpbi1lcnJvclwiPjwlPSBtZXNzYWdlICU+PC9kaXY+JyksXG4gICAgZXZlbnRzOiB7XG4gICAgICBcInN1Ym1pdFwiOiBcInN1Ym1pdFwiLFxuICAgICAgXCJrZXl1cCAjdXNlcm5hbWVcIjogXCJ2YWxpZGF0ZVVzZXJuYW1lXCIsXG4gICAgfSxcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xuICAgIH0sXG4gICAgc3VibWl0OiBmdW5jdGlvbihlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLnNpZ25VcCgpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSgpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc2lnblVwOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgICB2YXIgc2VuZERhdGEgPSB7XG4gICAgICAgIHVzZXJuYW1lOiB0aGlzLiQoJyN1c2VybmFtZScpLnZhbCgpLFxuICAgICAgICBwYXNzd29yZDogdGhpcy4kKCcjcGFzc3dvcmQnKS52YWwoKSxcbiAgICAgICAgbmFtZTogdGhpcy4kKCcjbmFtZScpLnZhbCgpLFxuICAgICAgICBlbWFpbDogdGhpcy4kKCcjZW1haWwnKS52YWwoKVxuICAgICAgfTtcbiAgICAgICQuYWpheCh7XG4gICAgICAgIHVybDogXCIvcmVnaXN0ZXJcIixcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGRhdGE6IHNlbmREYXRhLFxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgIGNvbnNvbGUubG9nKCdzdWNjZXNzIGRhdGE6ICcsIGRhdGEpO1xuICAgICAgICAgICBpZiAoZGF0YS5tZXNzYWdlKSB7XG4gICAgICAgICAgICAgdGhpc18ucmVuZGVyVmFsaWRhdGlvbih0aGlzXy5lcnJvclRlbXBsYXRlKGRhdGEpKTtcbiAgICAgICAgICAgfVxuICAgICAgICAgICBlbHNlIGlmIChkYXRhLnVzZXIpIHtcbiAgICAgICAgICAgIGFwcC5DaGF0cm9vbVJvdXRlci5uYXZpZ2F0ZSgnYXV0aCcsIHsgdHJpZ2dlcjogdHJ1ZSB9KTtcbiAgICAgICAgICAgIHRoaXNfLnZlbnQudHJpZ2dlcihcImxvZ2luXCIsIGRhdGEudXNlcik7XG4gICAgICAgICAgIH1cbiAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnb29wcywgdGhlIGVsc2U6ICcsIGRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSkuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ3JlZ2lzdGVyIGluJyk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgfSk7XG4gICAgfSxcbiAgICB2YWxpZGF0ZVVzZXJuYW1lOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICgkKCcjdXNlcm5hbWUnKS52YWwoKS5sZW5ndGggPCA1KSB7IHJldHVybjsgfVxuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAgIF8uZGVib3VuY2UoJC5wb3N0KCcvcmVnaXN0ZXJWYWxpZGF0aW9uJywgeyB1c2VybmFtZTogJCgnI3VzZXJuYW1lJykudmFsKCkgfSxmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICBkYXRhLnVzZXJuYW1lQXZhaWxhYmxlID9cbiAgICAgICAgICAgdGhpc18ucmVuZGVyVmFsaWRhdGlvbih0aGlzXy51c2VybmFtZUF2YWlsYWJsZVRlbXBsYXRlKCkpXG4gICAgICAgICA6XG4gICAgICAgICAgIHRoaXNfLnJlbmRlclZhbGlkYXRpb24odGhpc18udXNlcm5hbWVUYWtlblRlbXBsYXRlKCkpO1xuICAgICAgfSksIDE1MCk7XG4gICAgfSxcbiAgICByZW5kZXJWYWxpZGF0aW9uOiBmdW5jdGlvbih3aGF0KSB7XG4gICAgICAkKCcucmVnaXN0ZXItZXJyb3ItY29udGFpbmVyJykuZW1wdHkoKTtcbiAgICAgICQod2hhdCkuYXBwZW5kVG8oJCgnLnJlZ2lzdGVyLWVycm9yLWNvbnRhaW5lcicpKS5oaWRlKCkuZmFkZUluKCk7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAkKCcucmVnaXN0ZXItZXJyb3ItY29udGFpbmVyJykuY2hpbGRyZW4oKS5maXJzdCgpLmZhZGVPdXQoKTtcbiAgICAgIH0sIDIwMDApO1xuICAgIH1cblxuICB9KTtcblxufSkoalF1ZXJ5KTsiLCJcbi8vIFRoZSBDaGF0Q2xpZW50IGlzIGltcGxlbWVudGVkIG9uIG1haW4uanMuXG4vLyBUaGUgY2hhdGNsaWVudCBpcyBhIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIG9uIHRoZSBNYWluQ29udHJvbGxlci5cbi8vIEl0IGJvdGggbGlzdGVucyB0byBhbmQgZW1pdHMgZXZlbnRzIG9uIHRoZSBzb2NrZXQsIGVnOlxuLy8gSXQgaGFzIGl0cyBvd24gbWV0aG9kcyB0aGF0LCB3aGVuIGNhbGxlZCwgZW1pdCB0byB0aGUgc29ja2V0IHcvIGRhdGEuXG4vLyBJdCBhbHNvIHNldHMgcmVzcG9uc2UgbGlzdGVuZXJzIG9uIGNvbm5lY3Rpb24sIHRoZXNlIHJlc3BvbnNlIGxpc3RlbmVyc1xuLy8gbGlzdGVuIHRvIHRoZSBzb2NrZXQgYW5kIHRyaWdnZXIgZXZlbnRzIG9uIHRoZSBhcHBFdmVudEJ1cyBvbiB0aGUgXG4vLyBNYWluQ29udHJvbGxlclxudmFyIENoYXRDbGllbnQgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdC8vIGlzLXR5cGluZyBoZWxwZXIgdmFyaWFibGVzXG5cdHZhciBUWVBJTkdfVElNRVJfTEVOR1RIID0gNDAwOyAvLyBtc1xuICB2YXIgdHlwaW5nID0gZmFsc2U7XG4gIHZhciBsYXN0VHlwaW5nVGltZTtcbiAgXG4gIC8vIHRoaXMgdmVudCBob2xkcyB0aGUgYXBwRXZlbnRCdXNcblx0c2VsZi52ZW50ID0gb3B0aW9ucy52ZW50O1xuXG4gIC8vbXVzdCBiZSBodHRwcyBvbiBoZXJva3UgYW5kIGh0dHAgb24gbG9jYWxob3N0XG5cdHNlbGYuaG9zdG5hbWUgPSAnaHR0cDovLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdDtcblxuICAvLyBjb25uZWN0cyB0byBzb2NrZXQsIHNldHMgcmVzcG9uc2UgbGlzdGVuZXJzXG5cdHNlbGYuY29ubmVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmNvbm5lY3QnKTtcblx0XHQvLyB0aGlzIGlvIG1pZ2h0IGJlIGEgbGl0dGxlIGNvbmZ1c2luZy4uLiB3aGVyZSBpcyBpdCBjb21pbmcgZnJvbT9cblx0XHQvLyBpdCdzIGNvbWluZyBmcm9tIHRoZSBzdGF0aWMgbWlkZGxld2FyZSBvbiBzZXJ2ZXIuanMgYmMgZXZlcnl0aGluZ1xuXHRcdC8vIGluIHRoZSAvcHVibGljIGZvbGRlciBoYXMgYmVlbiBhdHRhY2hlZCB0byB0aGUgc2VydmVyLCBhbmQgdmlzYVxuXHRcdC8vIHZlcnNhLlxuXG5cbiAgICBpZiAoc2VsZi5ob3N0bmFtZSA9PT0gJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMScgfHwgc2VsZi5ob3N0bmFtZSA9PT0gJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCcpIHtcbiAgICAvLyBsb2NhbFxuICAgICAgc2VsZi5zb2NrZXQgPSBpby5jb25uZWN0KHNlbGYuaG9zdG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgLy8gaGVyb2t1XG4gICAgICBzZWxmLnNvY2tldCA9IGlvLmNvbm5lY3QoJ2h0dHA6Ly93d3cuY2hqYXQuY29tLycsIHsgdHJhbnNwb3J0czogWyd3ZWJzb2NrZXQnXSB9ICk7XG4gICAgfVxuICAgIFxuXG5cbiAgICBzZWxmLnNldFJlc3BvbnNlTGlzdGVuZXJzKHNlbGYuc29ja2V0KTtcbiAgfTtcblxuXG5cbi8vLy8vIFZpZXdFdmVudEJ1cyBtZXRob2RzIC8vLy9cbiAgICAvLyBtZXRob2RzIHRoYXQgZW1pdCB0byB0aGUgY2hhdHNlcnZlclxuXG4vLyBMT0dJTlxuICBzZWxmLmxvZ2luID0gZnVuY3Rpb24odXNlcikge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmxvZ2luOiAnLCB1c2VyKTtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwibG9naW5cIiwgdXNlcik7XG4gIH07XG4gIHNlbGYubG9nb3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYubG9nb3V0OiAnKTtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwibG9nb3V0XCIpO1xuICB9O1xuXG5cbi8vIFJPT01cbiAgc2VsZi5jb25uZWN0VG9Sb29tID0gZnVuY3Rpb24ocm9vbU5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5jb25uZWN0VG9Sb29tOiAnLCByb29tTmFtZSk7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcImNvbm5lY3RUb1Jvb21cIiwgcm9vbU5hbWUpO1xuICB9O1xuICBzZWxmLmpvaW5Sb29tID0gZnVuY3Rpb24ocm9vbU5hbWUpIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KCdqb2luUm9vbScsIHJvb21OYW1lKTtcbiAgfTtcbiAgc2VsZi5hZGRSb29tID0gZnVuY3Rpb24ocm9vbU5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5hZGRSb29tOiAnLCByb29tTmFtZSk7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcImFkZFJvb21cIiwgcm9vbU5hbWUpO1xuICB9O1xuICBzZWxmLnJlbW92ZVJvb20gPSBmdW5jdGlvbihyb29tRGF0YSkge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLnJlbW92ZVJvb206ICcsIHJvb21EYXRhKTtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwicmVtb3ZlUm9vbVwiLCByb29tRGF0YSk7XG4gIH07XG4gIHNlbGYuY3JlYXRlUm9vbSA9IGZ1bmN0aW9uKGZvcm1EYXRhKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuY3JlYXRlUm9vbTogJywgZm9ybURhdGEpO1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJjcmVhdGVSb29tXCIsIGZvcm1EYXRhKTtcbiAgfTtcbiAgc2VsZi51cGRhdGVSb29tID0gZnVuY3Rpb24oZm9ybURhdGEpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi51cGRhdGVSb29tOiAnLCBmb3JtRGF0YSk7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcInVwZGF0ZVJvb21cIiwgZm9ybURhdGEpO1xuICB9O1xuICBzZWxmLmRlc3Ryb3lSb29tID0gZnVuY3Rpb24ocm9vbUluZm8pIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5kZXN0cm95Um9vbTogJywgcm9vbUluZm8pO1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJkZXN0cm95Um9vbVwiLCByb29tSW5mbyk7XG4gIH07XG5cblxuXG4vLyBDSEFUXG4gIHNlbGYuY2hhdCA9IGZ1bmN0aW9uKGNoYXQpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5jaGF0OiAnLCBjaGF0KTtcblx0XHRzZWxmLnNvY2tldC5lbWl0KFwiY2hhdFwiLCBjaGF0KTtcblx0fTtcbiAgc2VsZi5nZXRNb3JlQ2hhdHMgPSBmdW5jdGlvbihjaGF0UmVxKSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdCgnZ2V0TW9yZUNoYXRzJywgY2hhdFJlcSk7XG4gIH07XG5cblxuLy8gRElSRUNUIE1FU1NBR0VcbiAgc2VsZi5pbml0RGlyZWN0TWVzc2FnZSA9IGZ1bmN0aW9uKHJlY2lwaWVudCkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoJ2luaXREaXJlY3RNZXNzYWdlJywgcmVjaXBpZW50KTtcbiAgfTtcbiAgc2VsZi5kaXJlY3RNZXNzYWdlID0gZnVuY3Rpb24oZGlyZWN0TWVzc2FnZSkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoJ2RpcmVjdE1lc3NhZ2UnLCBkaXJlY3RNZXNzYWdlKTtcbiAgfTtcbiAgc2VsZi5nZXRNb3JlRGlyZWN0TWVzc2FnZXMgPSBmdW5jdGlvbihkaXJlY3RNZXNzYWdlUmVxKSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdCgnZ2V0TW9yZURpcmVjdE1lc3NhZ2VzJywgZGlyZWN0TWVzc2FnZVJlcSk7XG4gIH07XG4gIFxuXG4vLyBUWVBJTkdcblx0c2VsZi5hZGRDaGF0VHlwaW5nID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciBtZXNzYWdlID0gZGF0YS51c2VybmFtZSArICcgaXMgdHlwaW5nJztcbiAgICAkKCcudHlwZXR5cGV0eXBlJykudGV4dChtZXNzYWdlKTtcblx0fTtcblx0c2VsZi5yZW1vdmVDaGF0VHlwaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgJCgnLnR5cGV0eXBldHlwZScpLmVtcHR5KCk7XG5cdH07XG4gIHNlbGYudXBkYXRlVHlwaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHNlbGYuc29ja2V0KSB7XG4gICAgICBpZiAoIXR5cGluZykge1xuICAgICAgICB0eXBpbmcgPSB0cnVlO1xuICAgICAgICBzZWxmLnNvY2tldC5lbWl0KCd0eXBpbmcnKTtcbiAgICAgIH1cbiAgICAgIGxhc3RUeXBpbmdUaW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0eXBpbmdUaW1lciA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICAgIHZhciB0aW1lRGlmZiA9IHR5cGluZ1RpbWVyIC0gbGFzdFR5cGluZ1RpbWU7XG4gICAgICAgIGlmICh0aW1lRGlmZiA+PSBUWVBJTkdfVElNRVJfTEVOR1RIICYmIHR5cGluZykge1xuICAgICAgICAgICBzZWxmLnNvY2tldC5lbWl0KCdzdG9wIHR5cGluZycpO1xuICAgICAgICAgICB0eXBpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSwgVFlQSU5HX1RJTUVSX0xFTkdUSCk7XG4gICAgfVxuICB9O1xuXG5cbi8vIElOVklUQVRJT05TXG4gIHNlbGYuaW52aXRlVXNlciA9IGZ1bmN0aW9uKGludml0YXRpb25PYmopIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwiaW52aXRlVXNlclwiLCBpbnZpdGF0aW9uT2JqKTtcbiAgfTtcbiAgc2VsZi5kZWxldGVJbnZpdGF0aW9uID0gZnVuY3Rpb24ocm9vbUlkKSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcImRlbGV0ZUludml0YXRpb25cIiwgcm9vbUlkKTtcbiAgfTtcbiAgc2VsZi5hY2NlcHRJbnZpdGF0aW9uID0gZnVuY3Rpb24ocm9vbUlkKSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcImFjY2VwdEludml0YXRpb25cIiwgcm9vbUlkKTtcbiAgfTtcblxuLy8gVVBEQVRFIFVTRVJcbiAgc2VsZi51cGRhdGVVc2VyID0gZnVuY3Rpb24odXNlck9iaikge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJ1cGRhdGVVc2VyXCIsIHVzZXJPYmopO1xuICB9O1xuXG5cblxuLy8gRVJST1IgSEFORExJTkdcbiAgc2VsZi5kb2VzQ2hhdHJvb21FeGlzdCA9IGZ1bmN0aW9uKGNoYXRyb29tUXVlcnkpIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KCdkb2VzQ2hhdHJvb21FeGlzdCcsIGNoYXRyb29tUXVlcnkpO1xuICB9O1xuICBzZWxmLmRvZXNIb21lUm9vbUV4aXN0ID0gZnVuY3Rpb24oaG9tZVJvb21RdWVyeSkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoJ2RvZXNIb21lUm9vbUV4aXN0JywgaG9tZVJvb21RdWVyeSk7XG4gIH07XG4gIHNlbGYuZG9lc1NlYXJjaENoYXRyb29tRXhpc3QgPSBmdW5jdGlvbihob21lUm9vbVF1ZXJ5KSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdCgnZG9lc1NlYXJjaENoYXRyb29tRXhpc3QnLCBob21lUm9vbVF1ZXJ5KTtcbiAgfTtcblxuXG4gIFxuXG5cblxuXG4gIC8vLy8vLy8vLy8vLy8vIGNoYXRzZXJ2ZXIgbGlzdGVuZXJzLy8vLy8vLy8vLy8vL1xuXG4gIC8vIHRoZXNlIGd1eXMgbGlzdGVuIHRvIHRoZSBjaGF0c2VydmVyL3NvY2tldCBhbmQgZW1pdCBkYXRhIHRvIG1haW4uanMsXG4gIC8vIHNwZWNpZmljYWxseSB0byB0aGUgYXBwRXZlbnRCdXMuXG5cdHNlbGYuc2V0UmVzcG9uc2VMaXN0ZW5lcnMgPSBmdW5jdGlvbihzb2NrZXQpIHtcblxuXG4vLyBMT0dJTlxuICAgIHNvY2tldC5vbignaW5pdFVzZXInLCBmdW5jdGlvbih1c2VyKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5pbml0VXNlcicpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoJ2luaXRVc2VyJywgdXNlcik7XG4gICAgICBzZWxmLmNvbm5lY3RUb1Jvb20odXNlci5ob21lUm9vbSk7XG4gICAgfSk7XG5cblxuLy8gQ0hBVFxuXHRcdHNvY2tldC5vbigndXNlckpvaW5lZCcsIGZ1bmN0aW9uKHVzZXIpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdzYy5lLnVzZXJKb2luZWQ6ICcsIHVzZXIpO1xuICAgICAgLy8gc29ja2V0LmVtaXQoXCJvbmxpbmVVc2Vyc1wiKTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwidXNlckpvaW5lZFwiLCB1c2VyKTtcblx0XHR9KTtcblx0XHRzb2NrZXQub24oJ3VzZXJMZWZ0JywgZnVuY3Rpb24odXNlcikge1xuXHRcdFx0Y29uc29sZS5sb2coJ3NjLmUudXNlckxlZnQ6ICcsIHVzZXIpO1xuICAgICAgLy8gc29ja2V0LmVtaXQoXCJvbmxpbmVVc2Vyc1wiKTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwidXNlckxlZnRcIiwgdXNlcik7XG5cdFx0fSk7XG5cdFx0c29ja2V0Lm9uKCdjaGF0JywgZnVuY3Rpb24oY2hhdCkge1xuXHRcdFx0Y29uc29sZS5sb2coJ3NjLmUuY2hhdDogJywgY2hhdCk7XG5cdFx0XHRzZWxmLnZlbnQudHJpZ2dlcihcImNoYXRSZWNlaXZlZFwiLCBjaGF0KTtcblx0XHR9KTtcbiAgICBzb2NrZXQub24oJ21vcmVDaGF0cycsIGZ1bmN0aW9uKGNoYXRzKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcIm1vcmVDaGF0c1wiLCBjaGF0cyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdub01vcmVDaGF0cycsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJub01vcmVDaGF0c1wiKTtcbiAgICB9KTtcblxuXG4vLyBESVJFQ1QgTUVTU0FHRVxuICAgIHNvY2tldC5vbignc2V0RGlyZWN0TWVzc2FnZUNoYXRsb2cnLCBmdW5jdGlvbihjaGF0bG9nKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldERNY2hhdGxvZ1wiLCBjaGF0bG9nKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ3NldERpcmVjdE1lc3NhZ2VIZWFkZXInLCBmdW5jdGlvbihoZWFkZXIpIHtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0RE1oZWFkZXJcIiwgaGVhZGVyKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ2RpcmVjdE1lc3NhZ2UnLCBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAvLyBzZWxmLnZlbnQudHJpZ2dlcihcInJlbmRlckRpcmVjdE1lc3NhZ2VcIiwgRE0pO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJkaXJlY3RNZXNzYWdlUmVjZWl2ZWRcIiwgbWVzc2FnZSk7XG4gICAgfSk7XG5cblxuXG4vLyBUWVBJTkdcbiAgICBzb2NrZXQub24oJ3R5cGluZycsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHNlbGYuYWRkQ2hhdFR5cGluZyhkYXRhKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ3N0b3AgdHlwaW5nJywgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnJlbW92ZUNoYXRUeXBpbmcoKTtcbiAgICB9KTtcblxuXG4vLyBTRVQgUk9PTVxuICAgIHNvY2tldC5vbignY2hhdGxvZycsIGZ1bmN0aW9uKGNoYXRsb2cpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLmNoYXRsb2c6ICcsIGNoYXRsb2cpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRDaGF0bG9nXCIsIGNoYXRsb2cpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbignY2hhdHJvb21zJywgZnVuY3Rpb24oY2hhdHJvb21zKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5jaGF0cm9vbXM6ICAnLCBjaGF0cm9vbXMpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRDaGF0cm9vbXNcIiwgY2hhdHJvb21zKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ3ByaXZhdGVSb29tcycsIGZ1bmN0aW9uKHJvb21zKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5wcml2YXRlUm9vbXM6ICAnLCByb29tcyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldFByaXZhdGVSb29tc1wiLCByb29tcyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdvbmxpbmVVc2VycycsIGZ1bmN0aW9uKG9ubGluZVVzZXJzKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5vbmxpbmVVc2VyczogJywgb25saW5lVXNlcnMpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRPbmxpbmVVc2Vyc1wiLCBvbmxpbmVVc2Vycyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdvZmZsaW5lVXNlcnMnLCBmdW5jdGlvbihvZmZsaW5lVXNlcnMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLm9mZmxpbmVVc2VyczogJywgb2ZmbGluZVVzZXJzKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0T2ZmbGluZVVzZXJzXCIsIG9mZmxpbmVVc2Vycyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdjaGF0cm9vbUhlYWRlcicsIGZ1bmN0aW9uKGhlYWRlck9iaikge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUuY2hhdHJvb21IZWFkZXI6ICcsIGhlYWRlck9iaik7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldENoYXRyb29tSGVhZGVyXCIsIGhlYWRlck9iaik7XG4gICAgfSk7XG5cblxuLy8gUkVESVJFQ1QgVE8gSE9NRSBST09NXG4gICAgc29ja2V0Lm9uKCdyZWRpcmVjdFRvSG9tZVJvb20nLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5yZWRpcmVjdFRvSG9tZVJvb206ICcsIGRhdGEpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJyZWRpcmVjdFRvSG9tZVJvb21cIiwgZGF0YSk7XG4gICAgfSk7XG5cbi8vIFJPT00gQVZBSUxBQklMSVRZXG4gICAgc29ja2V0Lm9uKCdjaGF0cm9vbUF2YWlsYWJpbGl0eScsIGZ1bmN0aW9uKGF2YWlsYWJpbHR5KSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcignY2hhdHJvb21BdmFpbGFiaWxpdHknLCBhdmFpbGFiaWx0eSk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdob21lUm9vbUF2YWlsYWJpbGl0eScsIGZ1bmN0aW9uKGF2YWlsYWJpbHR5KSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcignaG9tZVJvb21BdmFpbGFiaWxpdHknLCBhdmFpbGFiaWx0eSk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdjaGF0cm9vbUV4aXN0cycsIGZ1bmN0aW9uKGF2YWlsYWJpbHR5KSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcignY2hhdHJvb21FeGlzdHMnLCBhdmFpbGFiaWx0eSk7XG4gICAgfSk7XG5cbi8vIEVSUk9SIEhBTkRMSU5HXG4gICAgc29ja2V0Lm9uKCdjaGF0cm9vbUFscmVhZHlFeGlzdHMnLCBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwiY2hhdHJvb21BbHJlYWR5RXhpc3RzXCIpO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKCdkZXN0cm95Um9vbVJlc3BvbnNlJywgZnVuY3Rpb24ocmVzKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcImRlc3Ryb3lSb29tUmVzcG9uc2VcIiwgcmVzKTtcbiAgICB9KTtcblxuLy8gSU5WSVRBVElPTlNcbiAgICBzb2NrZXQub24oJ3JlZnJlc2hJbnZpdGF0aW9ucycsIGZ1bmN0aW9uKGludml0YXRpb25zKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInJlZnJlc2hJbnZpdGF0aW9uc1wiLCBpbnZpdGF0aW9ucyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCd1c2VySW52aXRlZCcsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwidXNlckludml0ZWRcIiwgdXNlcik7XG4gICAgfSk7XG5cblxuICAgICAgICBzb2NrZXQub24oJ2xvZ291dCcsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5sb2dvdXQoKTtcbiAgICB9KTtcblxuXG5cdH07XG59OyIsIlxuXG5hcHAuTWFpbkNvbnRyb2xsZXIgPSBmdW5jdGlvbigpIHtcblxuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblxuICAvL1RoZXNlIGFsbG93cyB1cyB0byBiaW5kIGFuZCB0cmlnZ2VyIG9uIHRoZSBvYmplY3QgZnJvbSBhbnl3aGVyZSBpbiB0aGUgYXBwLlxuXHRzZWxmLmFwcEV2ZW50QnVzID0gXy5leHRlbmQoe30sIEJhY2tib25lLkV2ZW50cyk7XG5cdHNlbGYudmlld0V2ZW50QnVzID0gXy5leHRlbmQoe30sIEJhY2tib25lLkV2ZW50cyk7XG5cblx0c2VsZi5pbml0ID0gZnVuY3Rpb24oKSB7XG5cbiAgICAvLyBsb2dpbk1vZGVsXG4gICAgc2VsZi5sb2dpbk1vZGVsID0gbmV3IGFwcC5Mb2dpbk1vZGVsKCk7XG4gICAgc2VsZi5sb2dpblZpZXcgPSBuZXcgYXBwLkxvZ2luVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXMsIG1vZGVsOiBzZWxmLmxvZ2luTW9kZWx9KTtcbiAgICBzZWxmLnJlZ2lzdGVyVmlldyA9IG5ldyBhcHAuUmVnaXN0ZXJWaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cyB9KTtcbiAgICBzZWxmLm5hdmJhclZpZXcgPSBuZXcgYXBwLk5hdmJhclZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzfSk7XG5cblxuICAgIC8vIFRoZSBDb250YWluZXJNb2RlbCBnZXRzIHBhc3NlZCBhIHZpZXdTdGF0ZSwgTG9naW5WaWV3LCB3aGljaFxuICAgIC8vIGlzIHRoZSBsb2dpbiBwYWdlLiBUaGF0IExvZ2luVmlldyBnZXRzIHBhc3NlZCB0aGUgdmlld0V2ZW50QnVzXG4gICAgLy8gYW5kIHRoZSBMb2dpbk1vZGVsLlxuICAgIHNlbGYuY29udGFpbmVyTW9kZWwgPSBuZXcgYXBwLkNvbnRhaW5lck1vZGVsKHsgdmlld1N0YXRlOiBzZWxmLmxvZ2luVmlld30pO1xuXG4gICAgLy8gbmV4dCwgYSBuZXcgQ29udGFpbmVyVmlldyBpcyBpbnRpYWxpemVkIHdpdGggdGhlIG5ld2x5IGNyZWF0ZWQgY29udGFpbmVyTW9kZWxcbiAgICAvLyB0aGUgbG9naW4gcGFnZSBpcyB0aGVuIHJlbmRlcmVkLlxuICAgIHNlbGYuY29udGFpbmVyVmlldyA9IG5ldyBhcHAuQ29udGFpbmVyVmlldyh7IG1vZGVsOiBzZWxmLmNvbnRhaW5lck1vZGVsIH0pO1xuICAgIHNlbGYuY29udGFpbmVyVmlldy5yZW5kZXIoKTtcblxuIFxuICAgICQoJ2Zvcm0nKS5rZXlwcmVzcyhmdW5jdGlvbihlKSB7XG4gICAgICByZXR1cm4gZS5rZXlDb2RlICE9IDEzO1xuICAgIH0pO1xuXG5cbiAgfTtcblxuXG4gIHNlbGYuYXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgY29uc29sZS5sb2coJ2YubWFpbi5hdXRoZW50aWNhdGVkJyk7XG4gICAgICAgXG4gICAgJChcImJvZHlcIikuY3NzKFwib3ZlcmZsb3dcIiwgXCJoaWRkZW5cIik7XG4gICAgJCgnZm9ybScpLmtleXByZXNzKGZ1bmN0aW9uKGUpIHtcbiAgICAgIHJldHVybiBlLmtleUNvZGUgIT0gMTM7XG4gICAgfSk7XG5cbiAgICBzZWxmLmNoYXRDbGllbnQgPSBuZXcgQ2hhdENsaWVudCh7IHZlbnQ6IHNlbGYuYXBwRXZlbnRCdXMgfSk7XG4gICAgICAgICAgY29uc29sZS5sb2coJ2h1aCcpO1xuICAgIHNlbGYuY2hhdENsaWVudC5jb25uZWN0KCk7XG5cbiAgICAvLyBuZXcgbW9kZWwgYW5kIHZpZXcgY3JlYXRlZCBmb3IgY2hhdHJvb21cbiAgICBzZWxmLmNoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoeyBuYW1lOiAnQ2hqYXQnIH0pO1xuICAgIHNlbGYuY2hhdHJvb21MaXN0ID0gbmV3IGFwcC5DaGF0cm9vbUxpc3QoKTtcbiAgICBzZWxmLnByaXZhdGVSb29tQ29sbGVjdGlvbiA9IG5ldyBhcHAuUHJpdmF0ZVJvb21Db2xsZWN0aW9uKCk7XG4gICAgc2VsZi5jaGF0cm9vbUxpc3QuZmV0Y2goKS5kb25lKGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnY2hhdHJvb21zJywgc2VsZi5jaGF0cm9vbUxpc3QpO1xuICAgICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgncHJpdmF0ZVJvb21zJywgc2VsZi5wcml2YXRlUm9vbUNvbGxlY3Rpb24pO1xuICAgICAgc2VsZi5jaGF0cm9vbVZpZXcgID0gbmV3IGFwcC5DaGF0cm9vbVZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzLCBtb2RlbDogc2VsZi5jaGF0cm9vbU1vZGVsIH0pO1xuICAgICAgc2VsZi5jb250YWluZXJNb2RlbC5zZXQoJ3ZpZXdTdGF0ZScsIHNlbGYuY2hhdHJvb21WaWV3KTtcbiAgICAgIFxuXG4gICAgICAvLyBzZWxmLmNvbm5lY3RUb1Jvb20oKTtcbiAgICAgIC8vIHNlbGYuaW5pdFJvb20oKTtcbiAgICAgICAgICAgLy8gO1xuICAgIH0pO1xuXG4gIH07XG5cbiAgLy8gc2VsZi5jb25uZWN0VG9Sb29tID0gZnVuY3Rpb24oKSB7XG4gIC8vICAgY29uc29sZS5sb2coJ2YubWFpbi5jb25uZWN0VG9Sb29tJyk7XG4gIC8vICAgc2VsZi5jaGF0Q2xpZW50LmNvbm5lY3RUb1Jvb20oXCJDaGphdFwiKTtcbiAgLy8gfTtcblxuICAvLyBzZWxmLmluaXRSb29tID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgLy8gICBzZWxmLmNoYXRyb29tVmlldy5pbml0Um9vbSgpO1xuICAvLyB9O1xuXG5cblxuXG5cbiAgLy8vLy8vLy8vLy8vICBCdXNzZXMgLy8vLy8vLy8vLy8vXG4gICAgLy8gVGhlc2UgQnVzc2VzIGxpc3RlbiB0byB0aGUgc29ja2V0Y2xpZW50XG4gICAvLyAgICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXG4gIC8vLy8gdmlld0V2ZW50QnVzIExpc3RlbmVycyAvLy8vL1xuICBcblx0c2VsZi52aWV3RXZlbnRCdXMub24oXCJsb2dpblwiLCBmdW5jdGlvbih1c2VyKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmxvZ2luKHVzZXIpO1xuICB9KTtcblx0c2VsZi52aWV3RXZlbnRCdXMub24oXCJjaGF0XCIsIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuY2hhdChjaGF0KTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwidHlwaW5nXCIsIGZ1bmN0aW9uKCkge1xuICAgIHNlbGYuY2hhdENsaWVudC51cGRhdGVUeXBpbmcoKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiam9pblJvb21cIiwgZnVuY3Rpb24ocm9vbU5hbWUpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuam9pblJvb20ocm9vbU5hbWUpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJhZGRSb29tXCIsIGZ1bmN0aW9uKHJvb20pIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuYWRkUm9vbShyb29tKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwicmVtb3ZlUm9vbVwiLCBmdW5jdGlvbihyb29tRGF0YSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5yZW1vdmVSb29tKHJvb21EYXRhKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiY3JlYXRlUm9vbVwiLCBmdW5jdGlvbihmb3JtRGF0YSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5jcmVhdGVSb29tKGZvcm1EYXRhKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwidXBkYXRlUm9vbVwiLCBmdW5jdGlvbihmb3JtRGF0YSkge1xuICAgIHNlbGYuY2hhdENsaWVudC51cGRhdGVSb29tKGZvcm1EYXRhKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiZGVzdHJveVJvb21cIiwgZnVuY3Rpb24ocm9vbUluZm8pIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuZGVzdHJveVJvb20ocm9vbUluZm8pO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJnZXRNb3JlQ2hhdHNcIiwgZnVuY3Rpb24oY2hhdFJlcSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5nZXRNb3JlQ2hhdHMoY2hhdFJlcSk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImluaXREaXJlY3RNZXNzYWdlXCIsIGZ1bmN0aW9uKHJlY2lwaWVudCkge1xuICAgIHNlbGYuY2hhdENsaWVudC5pbml0RGlyZWN0TWVzc2FnZShyZWNpcGllbnQpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJkaXJlY3RNZXNzYWdlXCIsIGZ1bmN0aW9uKGRpcmVjdE1lc3NhZ2UpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuZGlyZWN0TWVzc2FnZShkaXJlY3RNZXNzYWdlKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiZ2V0TW9yZURpcmVjdE1lc3NhZ2VzXCIsIGZ1bmN0aW9uKGRpcmVjdE1lc3NhZ2VSZXEpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuZ2V0TW9yZURpcmVjdE1lc3NhZ2VzKGRpcmVjdE1lc3NhZ2VSZXEpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJpbnZpdGVVc2VyXCIsIGZ1bmN0aW9uKGludml0YXRpb25PYmopIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuaW52aXRlVXNlcihpbnZpdGF0aW9uT2JqKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiZGVsZXRlSW52aXRhdGlvblwiLCBmdW5jdGlvbihyb29tSWQpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuZGVsZXRlSW52aXRhdGlvbihyb29tSWQpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJhY2NlcHRJbnZpdGF0aW9uXCIsIGZ1bmN0aW9uKHJvb21JZCkge1xuICAgIHNlbGYuY2hhdENsaWVudC5hY2NlcHRJbnZpdGF0aW9uKHJvb21JZCk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcInVwZGF0ZVVzZXJcIiwgZnVuY3Rpb24odXNlck9iaikge1xuICAgIHNlbGYuY2hhdENsaWVudC51cGRhdGVVc2VyKHVzZXJPYmopO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJsb2dvdXRcIiwgZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmxvZ291dCgpO1xuICB9KTtcblxuXG4vLyBFUlJPUiBIQU5ETElOR1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImRvZXNDaGF0cm9vbUV4aXN0XCIsIGZ1bmN0aW9uKGNoYXRyb29tUXVlcnkpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuZG9lc0NoYXRyb29tRXhpc3QoY2hhdHJvb21RdWVyeSk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImRvZXNIb21lUm9vbUV4aXN0XCIsIGZ1bmN0aW9uKGNoYXRyb29tUXVlcnkpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuZG9lc0hvbWVSb29tRXhpc3QoY2hhdHJvb21RdWVyeSk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImRvZXNTZWFyY2hDaGF0cm9vbUV4aXN0XCIsIGZ1bmN0aW9uKGNoYXRyb29tUXVlcnkpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuZG9lc1NlYXJjaENoYXRyb29tRXhpc3QoY2hhdHJvb21RdWVyeSk7XG4gIH0pO1xuXG5cblxuICAvLy8vIGFwcEV2ZW50QnVzIExpc3RlbmVycyAvLy8vXG5cblx0Ly8gc2VsZi5hcHBFdmVudEJ1cy5vbihcInVzZXJzSW5mb1wiLCBmdW5jdGlvbihkYXRhKSB7XG4gLy8gICAgY29uc29sZS5sb2coJ21haW4uZS51c2Vyc0luZm86ICcsIGRhdGEpO1xuIC8vICAgIC8vZGF0YSBpcyBhbiBhcnJheSBvZiB1c2VybmFtZXMsIGluY2x1ZGluZyB0aGUgbmV3IHVzZXJcblx0Ly8gXHQvLyBUaGlzIG1ldGhvZCBnZXRzIHRoZSBvbmxpbmUgdXNlcnMgY29sbGVjdGlvbiBmcm9tIGNoYXRyb29tTW9kZWwuXG5cdC8vIFx0Ly8gb25saW5lVXNlcnMgaXMgdGhlIGNvbGxlY3Rpb25cblx0Ly8gXHR2YXIgb25saW5lVXNlcnMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KFwib25saW5lVXNlcnNcIik7XG4gLy8gICAgY29uc29sZS5sb2coXCIuLi5vbmxpbmVVc2VyczogXCIsIG9ubGluZVVzZXJzKTtcblx0Ly8gXHR2YXIgdXNlcnMgPSBfLm1hcChkYXRhLCBmdW5jdGlvbihpdGVtKSB7XG5cdC8vIFx0XHRyZXR1cm4gbmV3IGFwcC5Vc2VyTW9kZWwoe3VzZXJuYW1lOiBpdGVtfSk7XG5cdC8vIFx0fSk7XG4gLy8gICAgY29uc29sZS5sb2coXCJ1c2VyczogXCIsIHVzZXJzKTtcblx0Ly8gXHRvbmxpbmVVc2Vycy5yZXNldCh1c2Vycyk7XG5cdC8vIH0pO1xuXG4gLy8gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJyb29tSW5mb1wiLCBmdW5jdGlvbihkYXRhKSB7XG4gLy8gICAgZGVidWdnZXI7XG4gLy8gICAgY29uc29sZS5sb2coJ21haW4uZS5yb29tSW5mbzogJywgZGF0YSk7XG4gLy8gICAgdmFyIHJvb21zID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldChcImNoYXRyb29tc1wiKTtcbiAvLyAgICAgY29uc29sZS5sb2coXCIuLi5yb29tczogXCIsIHJvb21zKTtcbiAvLyAgICB2YXIgdXBkYXRlZFJvb21zID0gXy5tYXAoZGF0YSwgZnVuY3Rpb24ocm9vbSkge1xuIC8vICAgICAgdmFyIG5ld0NoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoe25hbWU6IHJvb219KTtcbiAvLyAgICAgIHJldHVybiBuZXdDaGF0cm9vbU1vZGVsO1xuIC8vICAgIH0pO1xuIC8vICAgIGNvbnNvbGUubG9nKFwiLi4udXBkYXRlZHJvb21zOiBcIiwgdXBkYXRlZFJvb21zKTtcbiAvLyAgICByb29tcy5yZXNldCh1cGRhdGVkUm9vbXMpO1xuIC8vICB9KTtcblxuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcImluaXRVc2VyXCIsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICBjb25zb2xlLmxvZygnbWFpbi5lLmluaXRVc2VyOiAnLCB1c2VyKTtcbiAgICBpbnZpdGF0aW9ucyA9IHNlbGYubmF2YmFyVmlldy5tb2RlbC5nZXQoJ2ludml0YXRpb25zJyk7XG4gICAgbmV3SW52aXRhdGlvbnMgPSBfLm1hcCh1c2VyLmludml0YXRpb25zLCBmdW5jdGlvbihpbnZpdGUpIHtcbiAgICAgICB2YXIgbmV3SW52aXRhdGlvbiA9IG5ldyBhcHAuSW52aXRhdGlvbk1vZGVsKGludml0ZSk7XG4gICAgICAgcmV0dXJuIG5ld0ludml0YXRpb247XG4gICAgfSk7XG4gICAgaW52aXRhdGlvbnMucmVzZXQobmV3SW52aXRhdGlvbnMpO1xuICAgIHNlbGYubmF2YmFyVmlldy5tb2RlbC5zZXQoeyAndXNlcm5hbWUnOiB1c2VyLnVzZXJuYW1lLCAnaG9tZVJvb20nOiB1c2VyLmhvbWVSb29tLCAndXNlckltYWdlJzogdXNlci51c2VySW1hZ2UgfSk7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJyZWZyZXNoSW52aXRhdGlvbnNcIiwgZnVuY3Rpb24oaW52aXRhdGlvbnMpIHtcbiAgICBjb25zb2xlLmxvZygnbWFpbi5lLnJlZnJlc2hJbnZpdGF0aW9uczogJywgaW52aXRhdGlvbnMpO1xuICAgIG9sZEludml0YXRpb25zID0gc2VsZi5uYXZiYXJWaWV3Lm1vZGVsLmdldCgnaW52aXRhdGlvbnMnKTtcbiAgICBuZXdJbnZpdGF0aW9ucyA9IF8ubWFwKGludml0YXRpb25zLCBmdW5jdGlvbihpbnZpdGUpIHtcbiAgICAgICB2YXIgbmV3SW52aXRhdGlvbiA9IG5ldyBhcHAuSW52aXRhdGlvbk1vZGVsKGludml0ZSk7XG4gICAgICAgcmV0dXJuIG5ld0ludml0YXRpb247XG4gICAgfSk7XG4gICAgb2xkSW52aXRhdGlvbnMucmVzZXQobmV3SW52aXRhdGlvbnMpO1xuICB9KTtcblxuXG4gIC8vIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRSb29tXCIsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gIC8vICAgY29uc29sZS5sb2coJ21haW4uZS5zZXRSb29tOiAnLCBtb2RlbCk7XG5cbiAgLy8gICB2YXIgY2hhdGxvZyA9IG5ldyBhcHAuQ2hhdENvbGxlY3Rpb24obW9kZWwuY2hhdGxvZyk7XG4gIC8vICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnY2hhdGxvZycsIGNoYXRsb2cpO1xuXG4gIC8vICAgdmFyIHJvb21zID0gbmV3IGFwcC5DaGF0cm9vbUxpc3QobW9kZWwuY2hhdHJvb21zKTtcbiAgLy8gICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdjaGF0cm9vbXMnLCByb29tcyk7XG5cbiAgLy8gICB2YXIgdXNlcnMgPSBuZXcgYXBwLlVzZXJDb2xsZWN0aW9uKG1vZGVsLm9ubGluZVVzZXJzKTtcbiAgLy8gICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdvbmxpbmVVc2VycycsIHVzZXJzKTtcblxuICAvLyB9KTtcblxuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcIkNoYXRyb29tTW9kZWxcIiwgZnVuY3Rpb24obW9kZWwpIHtcbiAgICBjb25zb2xlLmxvZygnbWFpbi5lLkNoYXRyb29tTW9kZWw6ICcsIG1vZGVsKTtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoKTtcbiAgICBzZWxmLmNoYXRyb29tTGlzdCA9IG5ldyBhcHAuQ2hhdHJvb21MaXN0KCk7XG4gICAgc2VsZi5jaGF0cm9vbVZpZXcgID0gbmV3IGFwcC5DaGF0cm9vbVZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzLCBtb2RlbDogc2VsZi5jaGF0cm9vbU1vZGVsLCBjb2xsZWN0aW9uOiBzZWxmLmNoYXRyb29tTGlzdH0pO1xuICAgIHNlbGYuY29udGFpbmVyTW9kZWwuc2V0KCd2aWV3U3RhdGUnLCBzZWxmLmNoYXRyb29tVmlldyk7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLmxvYWRNb2RlbChtb2RlbCk7XG4gIH0pO1xuXG5cblxuICAvLyBhZGRzIG5ldyB1c2VyIHRvIHVzZXJzIGNvbGxlY3Rpb24sIHNlbmRzIGRlZmF1bHQgam9pbmluZyBtZXNzYWdlXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2VySm9pbmVkXCIsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ21haW4uZS51c2VySm9pbmVkOiAnLCB1c2VyKTtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkVXNlcih1c2VyKTtcblx0XHRzZWxmLmNoYXRyb29tTW9kZWwuYWRkQ2hhdCh7c2VuZGVyOiBcIkNoYXRyb29tIFBpZ1wiLCBtZXNzYWdlOiB1c2VyLnVzZXJuYW1lICsgXCIgam9pbmVkIHJvb20uXCIgfSk7XG5cdH0pO1xuXG5cdC8vIHJlbW92ZXMgdXNlciBmcm9tIHVzZXJzIGNvbGxlY3Rpb24sIHNlbmRzIGRlZmF1bHQgbGVhdmluZyBtZXNzYWdlXG5cdHNlbGYuYXBwRXZlbnRCdXMub24oXCJ1c2VyTGVmdFwiLCBmdW5jdGlvbih1c2VyKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdtYWluLmUudXNlckxlZnQ6ICcsIHVzZXIpO1xuXHRcdHNlbGYuY2hhdHJvb21Nb2RlbC5yZW1vdmVVc2VyKHVzZXIpO1xuXHRcdHNlbGYuY2hhdHJvb21Nb2RlbC5hZGRDaGF0KHtzZW5kZXI6IFwiQ2hhdHJvb20gUGlnXCIsIG1lc3NhZ2U6IHVzZXIudXNlcm5hbWUgKyBcIiBsZWZ0IHJvb20uXCIgfSk7XG5cdH0pO1xuXG5cdC8vIGNoYXQgcGFzc2VkIGZyb20gc29ja2V0Y2xpZW50LCBhZGRzIGEgbmV3IGNoYXQgbWVzc2FnZSB1c2luZyBjaGF0cm9vbU1vZGVsIG1ldGhvZFxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwiY2hhdFJlY2VpdmVkXCIsIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwuYWRkQ2hhdChjaGF0KTtcblx0XHQkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcblx0fSk7XG5cblxuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInJlZGlyZWN0VG9Ib21lUm9vbVwiLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmNvbm5lY3RUb1Jvb20oZGF0YS5ob21lUm9vbSk7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRDaGF0cm9vbUhlYWRlclwiLCBmdW5jdGlvbihoZWFkZXJPYmopIHtcbiAgICB2YXIgbmV3SGVhZGVyID0gbmV3IGFwcC5DaGF0cm9vbUhlYWRlck1vZGVsKGhlYWRlck9iaik7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnY2hhdHJvb20nLCBuZXdIZWFkZXIpO1xuICB9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0Q2hhdGxvZ1wiLCBmdW5jdGlvbihjaGF0bG9nKSB7XG4gICAgdmFyIG9sZENoYXRsb2cgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KCdjaGF0bG9nJyk7XG4gICAgdmFyIHVwZGF0ZWRDaGF0bG9nID0gXy5tYXAoY2hhdGxvZywgZnVuY3Rpb24oY2hhdCkge1xuICAgICAgdmFyIG5ld0NoYXRNb2RlbCA9IG5ldyBhcHAuQ2hhdE1vZGVsKHsgcm9vbTogY2hhdC5yb29tLCBtZXNzYWdlOiBjaGF0Lm1lc3NhZ2UsIHNlbmRlcjogY2hhdC5zZW5kZXIsIHRpbWVzdGFtcDogY2hhdC50aW1lc3RhbXAsIHVybDogY2hhdC51cmwgfSk7XG4gICAgICByZXR1cm4gbmV3Q2hhdE1vZGVsO1xuICAgIH0pO1xuICAgIG9sZENoYXRsb2cucmVzZXQodXBkYXRlZENoYXRsb2cpO1xuICAgJCgnI21lc3NhZ2UtaW5wdXQnKS5yZW1vdmVDbGFzcygnZGlyZWN0LW1lc3NhZ2UtaW5wdXQnKS5hZGRDbGFzcygnbWVzc2FnZS1pbnB1dCcpO1xuICAgICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsSGVpZ2h0O1xuICB9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwibW9yZUNoYXRzXCIsIGZ1bmN0aW9uKGNoYXRsb2cpIHtcbiAgICB2YXIgb2xkQ2hhdGxvZyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoJ2NoYXRsb2cnKTtcbiAgICB2YXIgbW9yZUNoYXRsb2cgPSBfLm1hcChjaGF0bG9nLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgICB2YXIgbmV3Q2hhdE1vZGVsID0gbmV3IGFwcC5DaGF0TW9kZWwoeyByb29tOiBjaGF0LnJvb20sIG1lc3NhZ2U6IGNoYXQubWVzc2FnZSwgc2VuZGVyOiBjaGF0LnNlbmRlciwgdGltZXN0YW1wOiBjaGF0LnRpbWVzdGFtcCwgdXJsOiBjaGF0LnVybCB9KTtcbiAgICAgIHJldHVybiBuZXdDaGF0TW9kZWw7XG4gICAgfSk7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLnRyaWdnZXIoJ21vcmVDaGF0cycsIG1vcmVDaGF0bG9nKTtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcIm5vTW9yZUNoYXRzXCIsIGZ1bmN0aW9uKGNoYXRsb2cpIHtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwuc3RvcExpc3RlbmluZygnbW9yZUNoYXRzJyk7XG4gIH0pO1xuICBcbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldENoYXRyb29tc1wiLCBmdW5jdGlvbihyb29tcykge1xuICAgIHZhciBvbGRSb29tcyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoJ2NoYXRyb29tcycpO1xuICAgIHZhciBuZXdSb29tcyA9IF8ubWFwKHJvb21zLCBmdW5jdGlvbihyb29tKSB7XG4gICAgICB2YXIgbmV3Q2hhdHJvb21Nb2RlbCA9IG5ldyBhcHAuQ2hhdHJvb21Nb2RlbCh7IGlkOiByb29tLl9pZCwgbmFtZTogcm9vbS5uYW1lLCBvd25lcjogcm9vbS5vd25lciwgcm9vbUltYWdlOiByb29tLnJvb21JbWFnZSwgcHJpdmFjeTogcm9vbS5wcml2YWN5fSk7XG4gICAgICByZXR1cm4gbmV3Q2hhdHJvb21Nb2RlbDtcbiAgICB9KTtcbiAgICBvbGRSb29tcy5yZXNldChuZXdSb29tcyk7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRQcml2YXRlUm9vbXNcIiwgZnVuY3Rpb24ocm9vbXMpIHtcbiAgICB2YXIgb2xkUm9vbXMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KCdwcml2YXRlUm9vbXMnKTtcbiAgICB2YXIgbmV3Um9vbXMgPSBfLm1hcChyb29tcywgZnVuY3Rpb24ocm9vbSkge1xuICAgICAgdmFyIG5ld0NoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoeyBpZDogcm9vbS5faWQsIG5hbWU6IHJvb20ubmFtZSwgb3duZXI6IHJvb20ub3duZXIsIHJvb21JbWFnZTogcm9vbS5yb29tSW1hZ2UsIHByaXZhY3k6IHJvb20ucHJpdmFjeSwgY3VycmVudFVzZXI6IHJvb20uY3VycmVudFVzZXJ9KTtcbiAgICAgIHJldHVybiBuZXdDaGF0cm9vbU1vZGVsO1xuICAgIH0pO1xuICAgIG9sZFJvb21zLnJlc2V0KG5ld1Jvb21zKTtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldE9ubGluZVVzZXJzXCIsIGZ1bmN0aW9uKG9ubGluZVVzZXJzKSB7XG4gICAgdmFyIG9sZE9ubGluZVVzZXJzID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldCgnb25saW5lVXNlcnMnKTtcbiAgICB2YXIgdXBkYXRlZE9ubGluZVVzZXJzID0gXy5tYXAob25saW5lVXNlcnMsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgIHZhciBuZXdVc2VyTW9kZWwgPSBuZXcgYXBwLlVzZXJNb2RlbCh7dXNlcm5hbWU6IHVzZXIudXNlcm5hbWUsIHVzZXJJbWFnZTogdXNlci51c2VySW1hZ2V9KTtcbiAgICAgIHJldHVybiBuZXdVc2VyTW9kZWw7XG4gICAgfSk7XG4gICAgb2xkT25saW5lVXNlcnMucmVzZXQodXBkYXRlZE9ubGluZVVzZXJzKTtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldE9mZmxpbmVVc2Vyc1wiLCBmdW5jdGlvbihvZmZsaW5lVXNlcnMpIHtcbiAgICB2YXIgb2xkT2ZmbGluZVVzZXJzID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldCgnb2ZmbGluZVVzZXJzJyk7XG4gICAgdmFyIHVwZGF0ZWRPZmZsaW5lVXNlcnMgPSBfLm1hcChvZmZsaW5lVXNlcnMsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgIHZhciBuZXdVc2VyTW9kZWwgPSBuZXcgYXBwLlVzZXJNb2RlbCh7dXNlcm5hbWU6IHVzZXIudXNlcm5hbWUsIHVzZXJJbWFnZTogdXNlci51c2VySW1hZ2V9KTtcbiAgICAgIHJldHVybiBuZXdVc2VyTW9kZWw7XG4gICAgfSk7XG4gICAgb2xkT2ZmbGluZVVzZXJzLnJlc2V0KHVwZGF0ZWRPZmZsaW5lVXNlcnMpO1xuICB9KTtcblxuXG4vLyBjaGF0cm9vbSBhdmFpbGFiaWxpdHlcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwiY2hhdHJvb21BdmFpbGFiaWxpdHlcIiwgZnVuY3Rpb24oYXZhaWxhYmlsaXR5KSB7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLnRyaWdnZXIoJ2NoYXRyb29tQXZhaWxhYmlsaXR5JywgYXZhaWxhYmlsaXR5KTtcbiAgfSk7XG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJob21lUm9vbUF2YWlsYWJpbGl0eVwiLCBmdW5jdGlvbihhdmFpbGFiaWxpdHkpIHtcbiAgICBzZWxmLm5hdmJhclZpZXcudHJpZ2dlcignaG9tZVJvb21BdmFpbGFiaWxpdHknLCBhdmFpbGFiaWxpdHkpO1xuICB9KTtcbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcImNoYXRyb29tRXhpc3RzXCIsIGZ1bmN0aW9uKGF2YWlsYWJpbGl0eSkge1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC50cmlnZ2VyKCdjaGF0cm9vbUV4aXN0cycsIGF2YWlsYWJpbGl0eSk7XG4gIH0pO1xuXG5cbi8vIGVycm9yc1xuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcImNoYXRyb29tQWxyZWFkeUV4aXN0c1wiLCBmdW5jdGlvbigpIHtcbiAgICBzd2FsKHtcbiAgICAgIHRpdGxlOiBcIk9IIE5PIE9IIE5PIE9IIE5PXCIsXG4gICAgICB0ZXh0OiBcIkNoYXRyb29tIEFscmVhZHksIEl0IEFscmVhZHkgRXhpc3RzISBBbmQuIERvbid0IEdvIEluIFRoZXJlLiBEb24ndC4gWW91LiBZb3UgU2hvdWxkIEhhdmUuIEkgVGhyZXcgVXAgT24gVGhlIFNlcnZlci4gVGhvc2UgUG9vciAuIC4gLiBUaGV5IFdlcmUgSnVzdCEgT0ggTk8gV0hZLiBXSFkgT0ggTk8uIE9IIE5PLlwiLFxuICAgICAgdHlwZTogXCJlcnJvclwiLFxuICAgICAgY29uZmlybUJ1dHRvbkNvbG9yOiBcIiM3NDlDQThcIlxuICAgIH0pO1xuICB9KTtcblxuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcImRlc3Ryb3lSb29tUmVzcG9uc2VcIiwgZnVuY3Rpb24ocmVzKSB7XG4gICAgaWYgKHJlcy5lcnJvcikge1xuICAgICAgc3dhbCh7XG4gICAgICAgIHRpdGxlOiBcIk5vIFRvdWNoeSFcIixcbiAgICAgICAgdGV4dDogXCJZb3UgQ2FuJ3QgRGVsZXRlIFlvdXIgSG9tZSBSb29tLCBOdWggVWguIFdobyBhcmUgeW91LCBGcmFueiBSZWljaGVsdD9cIixcbiAgICAgICAgdHlwZTogXCJlcnJvclwiLFxuICAgICAgICBjb25maXJtQnV0dG9uQ29sb3I6IFwiIzc0OUNBOFwiLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChyZXMuc3VjY2Vzcykge1xuICAgICAgc3dhbCh7XG4gICAgICAgIHRpdGxlOiBcIkV2aXNjZXJhdGVkIVwiLFxuICAgICAgICB0ZXh0OiBcIllvdXIgY2hhdHJvb20gaGFzIGJlZW4gcHVyZ2VkLlwiLFxuICAgICAgICB0eXBlOiBcInN1Y2Nlc3NcIixcbiAgICAgICAgY29uZmlybUJ1dHRvbkNvbG9yOiBcIiM3NDlDQThcIixcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gRGlyZWN0TWVzc2FnZVxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRETWNoYXRsb2dcIiwgZnVuY3Rpb24oY2hhdGxvZykge1xuICAgIHZhciBvbGRDaGF0bG9nID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldCgnY2hhdGxvZycpO1xuICAgIHZhciB1cGRhdGVkQ2hhdGxvZyA9IF8ubWFwKGNoYXRsb2csIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICAgIHZhciBuZXdDaGF0TW9kZWwgPSBuZXcgYXBwLkNoYXRNb2RlbCh7IHJvb206IGNoYXQucm9vbSwgbWVzc2FnZTogY2hhdC5tZXNzYWdlLCBzZW5kZXI6IGNoYXQuc2VuZGVyLCB0aW1lc3RhbXA6IGNoYXQudGltZXN0YW1wLCB1cmw6IGNoYXQudXJsIH0pO1xuICAgICAgcmV0dXJuIG5ld0NoYXRNb2RlbDtcbiAgICB9KTtcbiAgICBvbGRDaGF0bG9nLnJlc2V0KHVwZGF0ZWRDaGF0bG9nKTtcblxuICAgICQoJyNtZXNzYWdlLWlucHV0JykucmVtb3ZlQ2xhc3MoJ21lc3NhZ2UtaW5wdXQnKS5hZGRDbGFzcygnZGlyZWN0LW1lc3NhZ2UtaW5wdXQnKTtcbiAgICAkKCcjY2hhdEltYWdlVXBsb2FkQ29udGFpbmVyJykuZGF0YSgnY2hhdC10eXBlJywgJ21lc3NhZ2UnKTtcbiAgICAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldERNaGVhZGVyXCIsIGZ1bmN0aW9uKGhlYWRlcikge1xuICAgIHZhciBuZXdIZWFkZXIgPSBuZXcgYXBwLkNoYXRyb29tSGVhZGVyTW9kZWwoaGVhZGVyKTtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdjaGF0cm9vbScsIG5ld0hlYWRlcik7XG4gIH0pO1xuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcImRpcmVjdE1lc3NhZ2VSZWNlaXZlZFwiLCBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLmFkZENoYXQobWVzc2FnZSk7XG4gICAgJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG4gIH0pO1xuXG5cblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwidXNlckludml0ZWRcIiwgZnVuY3Rpb24odXNlcikge1xuICAgIGNvbnNvbGUubG9nKCdtYWluLmUudXNlckludml0ZWQ6ICcsIHVzZXIpO1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC50cmlnZ2VyKCd1c2VySW52aXRlZCcsIHVzZXIpO1xuICB9KTtcblxuXG5cblxuXG5cblxuXG5cbn07XG4iLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIC8vICQod2luZG93KS5iaW5kKCdiZWZvcmV1bmxvYWQnLCBmdW5jdGlvbihldmVudE9iamVjdCkge1xuICAvLyAgICQuYWpheCh7XG4gIC8vICAgICAgdXJsOiBcIi9sb2dvdXRcIixcbiAgLy8gICB9KTtcbiAgLy8gfSk7XG5cbiAgdmFyIENoYXRyb29tUm91dGVyID0gQmFja2JvbmUuUm91dGVyLmV4dGVuZCh7XG4gICAgXG4gICAgcm91dGVzOiB7XG4gICAgICAnJzogJ3N0YXJ0JyxcbiAgICAgICdsb2cnOiAnbG9naW4nLFxuICAgICAgJ3JlZyc6ICdyZWdpc3RlcicsXG4gICAgICAnb3V0JzogJ291dCcsXG4gICAgICAnYXV0aCc6ICdhdXRoZW50aWNhdGVkJyxcbiAgICAgICdmYWNlYm9vayc6ICdmYWNlYm9vaycsXG4gICAgICAndHdpdHRlcic6ICd0d2l0dGVyJ1xuICAgIH0sXG5cbiAgICBzdGFydDogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJy8jJztcbiAgICAgIHRoaXMuaW5pdE1haW5Db250cm9sbGVyKCk7XG4gICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgIH0gXG4gICAgICAvLyBlbHNlIHtcbiAgICAgIC8vICAgJC5hamF4KHtcbiAgICAgIC8vICAgICB1cmw6IFwiL2xvZ291dFwiLFxuICAgICAgLy8gICB9KTtcbiAgICAgIC8vIH1cbiAgICB9LFxuXG5cbiAgICBsb2dpbjogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIWFwcC5tYWluQ29udHJvbGxlcikge1xuICAgICAgICB0aGlzLmluaXRNYWluQ29udHJvbGxlcigpO1xuICAgICAgfVxuICAgICAgdmFyIGxvZ2luTW9kZWwgPSBuZXcgYXBwLkxvZ2luTW9kZWwoKTtcbiAgICAgIHZhciBsb2dpblZpZXcgPSBuZXcgYXBwLkxvZ2luVmlldyh7dmVudDogYXBwLm1haW5Db250cm9sbGVyLnZpZXdFdmVudEJ1cywgbW9kZWw6IGxvZ2luTW9kZWx9KTtcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlci5jb250YWluZXJNb2RlbC5zZXQoXCJ2aWV3U3RhdGVcIiwgbG9naW5WaWV3KTtcbiAgICB9LFxuXG4gICAgcmVnaXN0ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCFhcHAubWFpbkNvbnRyb2xsZXIpIHtcbiAgICAgICAgdGhpcy5pbml0TWFpbkNvbnRyb2xsZXIoKTtcbiAgICAgIH1cbiAgICAgIHZhciByZWdpc3RlclZpZXcgPSBuZXcgYXBwLlJlZ2lzdGVyVmlldyh7dmVudDogYXBwLm1haW5Db250cm9sbGVyLnZpZXdFdmVudEJ1cyB9KTtcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlci5jb250YWluZXJNb2RlbC5zZXQoXCJ2aWV3U3RhdGVcIiwgcmVnaXN0ZXJWaWV3KTtcbiAgICB9LFxuXG4gICAgLy8gb3V0OiBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAvLyAgICAgJC5hamF4KHtcbiAgICAvLyAgICAgICB1cmw6IFwiL2xvZ291dFwiLFxuICAgIC8vICAgICB9KVxuICAgIC8vIH0sXG5cbiAgICBhdXRoZW50aWNhdGVkOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghYXBwLm1haW5Db250cm9sbGVyKSB7XG4gICAgICAgIHRoaXMuc3RhcnQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFwcC5tYWluQ29udHJvbGxlci5hdXRoZW50aWNhdGVkKCk7XG4gICAgICB9XG4gICAgICAgIFxuICAgIH0sXG4gICAgZmFjZWJvb2s6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5zdGFydCh0aGlzLmF1dGhlbnRpY2F0ZWQpO1xuICAgIH0sXG4gICAgdHdpdHRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnN0YXJ0KHRoaXMuYXV0aGVudGljYXRlZCk7XG4gICAgfSxcblxuICAgIGluaXRNYWluQ29udHJvbGxlcjogZnVuY3Rpb24oKSB7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIgPSBuZXcgYXBwLk1haW5Db250cm9sbGVyKCk7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIuaW5pdCgpO1xuICAgIH0sXG5cbiAgfSk7XG5cbiAgYXBwLkNoYXRyb29tUm91dGVyID0gbmV3IENoYXRyb29tUm91dGVyKCk7XG4gIEJhY2tib25lLmhpc3Rvcnkuc3RhcnQoKTtcblxufSkoKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=