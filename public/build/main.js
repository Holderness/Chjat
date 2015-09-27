
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
  dateTemplate: _.template('<div class="followWrap"><div class="followMeBar"><span>-----</span><span> <%= moment(timestamp).format("MMMM Do") %> </span><span>-----</span></div></div>'),
  events: {
    'keypress .message-input': 'messageInputPressed',
    'keypress .direct-message-input': 'directMessageInputPressed',
    'click .chat-directory .room': 'setRoom',
    'keypress #chat-search-input': 'search',
    'click .remove-chatroom': 'removeRoom',
    'click #destroy-chatroom': 'destroyRoom',
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
    this.chatImageUploadView.setElement(this.$('#chatImageUploadContainer'));
    this.chatroomImageUploadView = new app.ChatroomImageUploadView();
    this.chatroomImageUploadView.setElement(this.$('#createChatroomContainer'));
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
    this.listenTo(this.chatroomImageUploadView, 'createRoom', this.createRoom);

    this.listenTo(this.model, "moreChats", this.renderMoreChats, this);

    this.listenTo(this.model, "userInvited", this.userInvited, this);

    this.listenTo(this.model, "chatroomAvailability", this.renderChatroomAvailability, this);

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

  wat: function() {
    console.log('wat');
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
        limit: 5,
        minLength: 5,
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
    this.chatroomSettingsView = new app.ChatroomSettingsView({vent: this.vent, model: this.model.get('chatroom')});
    this.chatroomSettingsView.setElement(this.$('#chatroom-header-container'));
    // debugger;
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
  renderPrivateRooms: function() {
    console.log('crv.f.renderPrivateRooms');
    console.log('PRIVATEROOMS: ', this.model.get("privateRooms"));
    this.$('#private-rooms').empty();
    this.model.get('privateRooms').each(function (room) {
      this.renderPrivateRoom(room);
    }, this);
  },
  renderPrivateRoom: function(model) {
    // var name1 = model.get('name'),
    // name2 = this.model.get('chatroom').get('name');
    this.$('#private-rooms').append(this.roomTemplate(model.toJSON()));
    // if (name1 === name2) {
    //   this.$('.room').last().find('.room-name').css('color', '#DEB0B0').fadeIn();
    // }
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

  app.ChatroomImageUploadView = Backbone.View.extend({

    el: $('#createChatroomContainer'),
    events: {
      'change #chatroomImageUpload': 'renderThumb',
      'attachImage #createChatroomForm': 'upload',
      'click #createChatroomBtn': 'submit',
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
      this.$form = this.$('#createChatroomForm');
      this.$form.trigger('attachImage');
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
              _this.trigger('createRoom', response);
            $('#createChatroomModal').modal('hide');
            _this.clearField();
          }
        });
      } else {
        var form = _this.createRoomFormData();
        debugger;
       this.trigger('createRoom', form);
      }
      return false;
    },


    createRoomFormData: function() {
      var formData = {};
      formData.roomImage = '/img/chjat-icon1.png';
      this.$('#createChatroomForm').children( 'input' ).each(function(i, el) {
        if ($(el).data('create') === 'privacy') {
          var val = $(el).prop('checked');
          formData['privacy'] = val;
          debugger;
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
    }

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
        debugger;
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
      $('#invite-user-input').typeahead({
        limit: 5,
        minLength: 5,
        onSelect: function(item) {
          console.log(item);
        },
        ajax: {
          url: '/searchUsers',
          triggerLength: 5,
          preDispatch: function (query) {
            return {
              username: query
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

    userInvited: function(username) {
      debugger;
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
    },
    initialize: function(options) {
      this.vent = options.vent;
      this.model = new app.UserModel({ username: '', userImage: '', homeRoom: '', invitations: new app.InvitationCollection() });
      this.listenTo(this.model, "change", this.render, this);

      var invitations = this.model.get('invitations');

      this.listenTo(invitations, "reset", this.renderInvitations, this);

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
        this.$('#invitations').append("<div>You've got no invitations, like dang</div>");
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

      this.$form = this.$('#user-preferences-form');
      this.$form.trigger('attachImage');
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
      this.$('#user-preferences-home-room-input').typeahead({
        onSelect: function(item) {
          console.log(item);
        },
        ajax: {
          url: '/api/searchChatrooms',
          triggerLength: 1,
          limit: 5,
          minLength: 5,
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


  self.reconnect = function() {
    self.connect();
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
  self.removeRoom = function(name) {
    console.log('sc.f.removeRoom: ', name);
    self.socket.emit("removeRoom", name);
  };
  self.createRoom = function(formData) {
    console.log('sc.f.createRoom: ', formData);
    self.socket.emit("createRoom", formData);
  };
  self.updateRoom = function(formData) {
    console.log('sc.f.updateRoom: ', formData);
    self.socket.emit("updateRoom", formData);
  };
  self.destroyRoom = function(name) {
    console.log('sc.f.destroyRoom: ', name);
    self.socket.emit("destroyRoom", name);
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


// MODIFY ROOM
    socket.on('roomDestroyed', function(name) {
      console.log('sc.e.roomDestroyed: ', name);
      self.vent.trigger("roomDestroyed", name);
    });

// CREATE ROOM
    socket.on('chatroomAvailability', function(availabilty) {
      self.vent.trigger('chatroomAvailability', availabilty);
    });

// ERROR HANDLING
    socket.on('chatroomAlreadyExists', function() {
      self.vent.trigger("chatroomAlreadyExists");
    });

// INVITATIONS
    socket.on('refreshInvitations', function(invitations) {
      self.vent.trigger("refreshInvitations", invitations);
    });
    socket.on('userInvited', function(user) {
      self.vent.trigger("userInvited", user);
    });

   socket.on('reconnect', function() {
     self.reconnect();
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

  // self.connectToRoom = function(callback) {
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
  self.viewEventBus.on("removeRoom", function(room) {
    self.chatClient.removeRoom(room);
  });
  self.viewEventBus.on("createRoom", function(formData) {
    self.chatClient.createRoom(formData);
  });
  self.viewEventBus.on("updateRoom", function(formData) {
    self.chatClient.updateRoom(formData);
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
      var newChatroomModel = new app.ChatroomModel({ name: chatroom.name, owner: chatroom.owner, roomImage: chatroom.roomImage});
      return newChatroomModel;
    });
    oldChatrooms.reset(updatedChatrooms);
  });

  self.appEventBus.on("setPrivateRooms", function(rooms) {
    var oldRooms = self.chatroomModel.get('privateRooms');
    var newRooms = _.map(rooms, function(room) {
      var newChatroomModel = new app.ChatroomModel({ name: room.name, owner: room.owner, roomImage: room.roomImage});
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
      if (!app.mainController) {
        this.start();
      }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYXQuanMiLCJjaGF0cm9vbS1oZWFkZXIuanMiLCJjb250YWluZXIuanMiLCJsb2dpbi5qcyIsInVzZXIuanMiLCJjaGF0cm9vbS5qcyIsImludml0YXRpb24uanMiLCJyb29tLmpzIiwicHJpdmF0ZVJvb20uanMiLCJjaGF0SW1hZ2VVcGxvYWQuanMiLCJjaGF0cm9vbUltYWdlVXBsb2FkLmpzIiwiY2hhdHJvb21TZXR0aW5ncy5qcyIsIm5hdmJhci5qcyIsInJlZ2lzdGVyLmpzIiwic29ja2V0Y2xpZW50LmpzIiwibWFpbi5qcyIsInJvdXRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUpQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBSVRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FGUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUdUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUp6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBS25pQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FUaExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBU25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDblJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbllBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxudmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgpIHtcblxuICBhcHAuQ2hhdENvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG4gICAgbW9kZWw6IGFwcC5DaGF0TW9kZWxcbiAgfSk7XG5cbn0pKCk7IiwiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5DaGF0cm9vbUhlYWRlck1vZGVsID0gQmFja2JvbmUuTW9kZWwuZXh0ZW5kKHt9KTtcblxufSkoKTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuICBhcHAuQ29udGFpbmVyVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBlbDogJyN2aWV3LWNvbnRhaW5lcicsXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdGhpcy5tb2RlbC5vbihcImNoYW5nZTp2aWV3U3RhdGVcIiwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB2aWV3ID0gdGhpcy5tb2RlbC5nZXQoJ3ZpZXdTdGF0ZScpO1xuICAgICAgdGhpcy4kZWwuaHRtbCh2aWV3LnJlbmRlcigpLmVsKTtcbiAgICB9XG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5Mb2dpblZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2xvZ2luJykuaHRtbCgpKSxcbiAgICBlcnJvclRlbXBsYXRlOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwibG9naW4tZXJyb3JcIj48JT0gbWVzc2FnZSAlPjwvZGl2PicpLFxuICAgIGV2ZW50czoge1xuICAgICAgJ3N1Ym1pdCc6ICdvbkxvZ2luJyxcbiAgICAgICdrZXlwcmVzcyc6ICdvbkhpdEVudGVyJ1xuICAgIH0sXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIC8vIExvZ2luVmlldyBnZXRzIHBhc3NlZCB0aGUgdmlld0V2ZW50QnVzIHdoZW4gdGhlIE1haW5Db250cm9sbGVyIGlzIGluaXRpYWxpemVkXG4gICAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XG5cbiAgICAvLyBUaGlzIHRlbGxzIHRoZSB2aWV3IHRvIGxpc3RlbiB0byBhbiBldmVudCBvbiBpdHMgbW9kZWwsXG4gICAgLy8gaWYgdGhlcmUncyBhbiBlcnJvciwgdGhlIGNhbGxiYWNrICh0aGlzLnJlbmRlcikgaXMgY2FsbGVkIHdpdGggdGhlICBcbiAgICAvLyB2aWV3IGFzIGNvbnRleHRcbiAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5tb2RlbCwgXCJjaGFuZ2U6ZXJyb3JcIiwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzLm1vZGVsLnRvSlNPTigpKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIG9uTG9naW46IGZ1bmN0aW9uKGUpIHtcbiAgICAgIC8vIHRyaWdnZXJzIHRoZSBsb2dpbiBldmVudCBhbmQgcGFzc2luZyB0aGUgdXNlcm5hbWUgZGF0YSB0byBqcy9tYWluLmpzXG4gICAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdmFyIHNlbmREYXRhID0ge3VzZXJuYW1lOiB0aGlzLiQoJyN1c2VybmFtZScpLnZhbCgpLCBwYXNzd29yZDogdGhpcy4kKCcjcGFzc3dvcmQnKS52YWwoKX07XG4gICAgJC5hamF4KHtcbiAgICAgICAgdXJsOiBcIi9sb2dpblwiLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgZGF0YTogc2VuZERhdGEsXG4gICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgY29uc29sZS5sb2coJ3N1Y2Nlc3MgZGF0YTogJywgZGF0YSk7XG4gICAgICAgICAgIGlmIChkYXRhLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgICB0aGlzXy5yZW5kZXJWYWxpZGF0aW9uKHRoaXNfLmVycm9yVGVtcGxhdGUoZGF0YSkpO1xuICAgICAgICAgICB9XG4gICAgICAgICAgIGVsc2UgaWYgKGRhdGEgPT09IDIwMCkge1xuICAgICAgICAgICAgYXBwLkNoYXRyb29tUm91dGVyLm5hdmlnYXRlKCdhdXRoZW50aWNhdGVkJywgeyB0cmlnZ2VyOiB0cnVlIH0pO1xuXG4gICAgICAgICAgIH1cbiAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnb29wcywgdGhlIGVsc2U6ICcsIGRhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSkuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2RvbmVlZWVlZWVlJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNfLnZlbnQudHJpZ2dlcihcImxvZ2luXCIsIHNlbmREYXRhKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgcmVuZGVyVmFsaWRhdGlvbjogZnVuY3Rpb24od2hhdCkge1xuICAgICAgJCgnLmxvZ2luLWVycm9yLWNvbnRhaW5lcicpLmVtcHR5KCk7XG4gICAgICAkKHdoYXQpLmFwcGVuZFRvKCQoJy5sb2dpbi1lcnJvci1jb250YWluZXInKSkuaGlkZSgpLmZhZGVJbigpO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnLmxvZ2luLWVycm9yLWNvbnRhaW5lcicpLmNoaWxkcmVuKCkuZmlyc3QoKS5mYWRlT3V0KCk7XG4gICAgICB9LCAyMDAwKTtcblxuICAgIH1cbiAgICAvLyBvbkhpdEVudGVyOiBmdW5jdGlvbihlKSB7XG4gICAgLy8gICBpZihlLmtleUNvZGUgPT0gMTMpIHtcbiAgICAvLyAgICAgdGhpcy5vbkxvZ2luKCk7XG4gICAgLy8gICAgIHJldHVybiBmYWxzZTtcbiAgICAvLyAgIH1cbiAgICAvLyB9XG4gIH0pO1xuICBcbn0pKGpRdWVyeSk7IiwiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5Vc2VyQ29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHttb2RlbDogYXBwLlVzZXJNb2RlbH0pO1xuXG59KSgpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG5hcHAuQ2hhdHJvb21WaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjY2hhdHJvb20tdGVtcGxhdGUnKS5odG1sKCkpLFxuICBjaGF0VGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI2NoYXRib3gtbWVzc2FnZS10ZW1wbGF0ZScpLmh0bWwoKSksXG4gIHJvb21UZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKFwiI3Jvb20tbGlzdC10ZW1wbGF0ZVwiKS5odG1sKCkpLFxuICBoZWFkZXJUZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjY2hhdHJvb20taGVhZGVyLXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgZGlyZWN0TWVzc2FnZUhlYWRlclRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNkaXJlY3QtbWVzc2FnZS1oZWFkZXItdGVtcGxhdGUnKS5odG1sKCkpLFxuICBvbmxpbmVVc2VyVGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI29ubGluZS11c2Vycy1saXN0LXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgb2ZmbGluZVVzZXJUZW1wbGF0ZTogXy50ZW1wbGF0ZSgkKCcjb2ZmbGluZS11c2Vycy1saXN0LXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgZGF0ZVRlbXBsYXRlOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwiZm9sbG93V3JhcFwiPjxkaXYgY2xhc3M9XCJmb2xsb3dNZUJhclwiPjxzcGFuPi0tLS0tPC9zcGFuPjxzcGFuPiA8JT0gbW9tZW50KHRpbWVzdGFtcCkuZm9ybWF0KFwiTU1NTSBEb1wiKSAlPiA8L3NwYW4+PHNwYW4+LS0tLS08L3NwYW4+PC9kaXY+PC9kaXY+JyksXG4gIGV2ZW50czoge1xuICAgICdrZXlwcmVzcyAubWVzc2FnZS1pbnB1dCc6ICdtZXNzYWdlSW5wdXRQcmVzc2VkJyxcbiAgICAna2V5cHJlc3MgLmRpcmVjdC1tZXNzYWdlLWlucHV0JzogJ2RpcmVjdE1lc3NhZ2VJbnB1dFByZXNzZWQnLFxuICAgICdjbGljayAuY2hhdC1kaXJlY3RvcnkgLnJvb20nOiAnc2V0Um9vbScsXG4gICAgJ2tleXByZXNzICNjaGF0LXNlYXJjaC1pbnB1dCc6ICdzZWFyY2gnLFxuICAgICdjbGljayAucmVtb3ZlLWNoYXRyb29tJzogJ3JlbW92ZVJvb20nLFxuICAgICdjbGljayAjZGVzdHJveS1jaGF0cm9vbSc6ICdkZXN0cm95Um9vbScsXG4gICAgJ2tleXVwICNjaGF0cm9vbS1uYW1lLWlucHV0JzogJ2RvZXNDaGF0cm9vbUV4aXN0JyxcbiAgICAnY2xpY2sgLnVzZXInOiAnaW5pdERpcmVjdE1lc3NhZ2UnLFxuICB9LFxuXG4gIGRvZXNDaGF0cm9vbUV4aXN0OiBmdW5jdGlvbihlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgdmFyIGNoZWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoJC50cmltKCQoJyNjaGF0cm9vbS1uYW1lLWlucHV0JykudmFsKCkpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIGNoYXRyb29tTmFtZSA9ICQoJyNjaGF0cm9vbS1uYW1lLWlucHV0JykudmFsKCk7XG4gICAgICAgICB0aGlzXy52ZW50LnRyaWdnZXIoJ2RvZXNDaGF0cm9vbUV4aXN0JywgY2hhdHJvb21OYW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICB0aGlzXy4kKCcjY2hhdHJvb20tbmFtZS12YWxpZGF0aW9uLWNvbnRhaW5lcicpLmNoaWxkcmVuKCkucmVtb3ZlKCk7XG4gICAgICAgICB0aGlzXy4kKCcjY2hhdHJvb20tbmFtZS1pbnB1dCcpLnJlbW92ZUNsYXNzKCdpbnB1dC12YWxpZCBpbnB1dC1pbnZhbGlkJyk7XG4gICAgICB9XG4gICAgfTtcbiAgICBfLmRlYm91bmNlKGNoZWNrKCksIDE1MCk7XG4gIH0sXG5cbiAgcmVuZGVyQ2hhdHJvb21BdmFpbGFiaWxpdHk6IGZ1bmN0aW9uKGF2YWlsYWJpbGl0eSkge1xuICAgIHRoaXMuJCgnI2NoYXRyb29tLW5hbWUtaW5wdXQnKS5yZW1vdmVDbGFzcygnaW5wdXQtdmFsaWQgaW5wdXQtaW52YWxpZCcpO1xuICAgICQoJyNjaGF0cm9vbS1uYW1lLXZhbGlkYXRpb24tY29udGFpbmVyJykuY2hpbGRyZW4oKS5yZW1vdmUoKTtcbiAgICBpZiAoYXZhaWxhYmlsaXR5ID09PSB0cnVlKSB7XG4gICAgICB0aGlzLiQoJyNjaGF0cm9vbS1uYW1lLWlucHV0JykuYWRkQ2xhc3MoJ2lucHV0LXZhbGlkJyk7XG4gICAgICB0aGlzLiQoJyNjaGF0cm9vbS1uYW1lLXZhbGlkYXRpb24tY29udGFpbmVyJykuYXBwZW5kKCc8ZGl2IGlkPVwiI2NoYXRyb29tLW5hbWUtdmFsaWRhdGlvblwiIGNsYXNzPVwiZmEgZmEtY2hlY2tcIj5OYW1lIEF2YWlsYWJsZTwvZGl2PicpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiQoJyNjaGF0cm9vbS1uYW1lLWlucHV0JykuYWRkQ2xhc3MoJ2lucHV0LWludmFsaWQgZmEgZmEtdGltZXMnKTtcbiAgICAgIHRoaXMuJCgnI2NoYXRyb29tLW5hbWUtdmFsaWRhdGlvbi1jb250YWluZXInKS5hcHBlbmQoJzxkaXYgaWQ9XCIjY2hhdHJvb20tbmFtZS12YWxpZGF0aW9uXCIgY2xhc3M9XCJmYSBmYS10aW1lc1wiPk5hbWUgVW5hdmFpbGFibGU8L2Rpdj4nKTtcbiAgICB9XG4gIH0sXG5cblxuXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICBjb25zb2xlLmxvZygnY2hhdHJvb21WaWV3LmYuaW5pdGlhbGl6ZTogJywgb3B0aW9ucyk7XG4gICAgLy8gcGFzc2VkIHRoZSB2aWV3RXZlbnRCdXNcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy52ZW50ID0gb3B0aW9ucy52ZW50O1xuICB9LFxuICByZW5kZXI6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlcicpO1xuICAgIHRoaXMubW9kZWwgPSBtb2RlbCB8fCB0aGlzLm1vZGVsO1xuICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzLm1vZGVsLnRvSlNPTigpKSk7XG4gICAgdGhpcy5hZnRlclJlbmRlcigpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBhZnRlclJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zZXRTdWJWaWV3cygpO1xuICAgIHRoaXMuc2V0Q2hhdExpc3RlbmVycygpO1xuICAgIHRoaXMuY2hhdHJvb21TZWFyY2hUeXBlYWhlYWQoKTtcbiAgfSxcbiAgc2V0U3ViVmlld3M6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY2hhdEltYWdlVXBsb2FkVmlldyA9IG5ldyBhcHAuQ2hhdEltYWdlVXBsb2FkVmlldygpO1xuICAgIHRoaXMuY2hhdEltYWdlVXBsb2FkVmlldy5zZXRFbGVtZW50KHRoaXMuJCgnI2NoYXRJbWFnZVVwbG9hZENvbnRhaW5lcicpKTtcbiAgICB0aGlzLmNoYXRyb29tSW1hZ2VVcGxvYWRWaWV3ID0gbmV3IGFwcC5DaGF0cm9vbUltYWdlVXBsb2FkVmlldygpO1xuICAgIHRoaXMuY2hhdHJvb21JbWFnZVVwbG9hZFZpZXcuc2V0RWxlbWVudCh0aGlzLiQoJyNjcmVhdGVDaGF0cm9vbUNvbnRhaW5lcicpKTtcbiAgfSxcbiAgc2V0Q2hhdExpc3RlbmVyczogZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgb25saW5lVXNlcnMgPSB0aGlzLm1vZGVsLmdldCgnb25saW5lVXNlcnMnKTtcbiAgICB0aGlzLmxpc3RlblRvKG9ubGluZVVzZXJzLCBcImFkZFwiLCB0aGlzLnJlbmRlclVzZXIsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8ob25saW5lVXNlcnMsIFwicmVtb3ZlXCIsIHRoaXMucmVuZGVyVXNlcnMsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8ob25saW5lVXNlcnMsIFwicmVzZXRcIiwgdGhpcy5yZW5kZXJVc2VycywgdGhpcyk7XG5cbiAgICB2YXIgb2ZmbGluZVVzZXJzID0gdGhpcy5tb2RlbC5nZXQoJ29mZmxpbmVVc2VycycpO1xuICAgIHRoaXMubGlzdGVuVG8ob2ZmbGluZVVzZXJzLCBcImFkZFwiLCB0aGlzLnJlbmRlck9mZmxpbmVVc2VyLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKG9mZmxpbmVVc2VycywgXCJyZW1vdmVcIiwgdGhpcy5yZW5kZXJPZmZsaW5lVXNlcnMsIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8ob2ZmbGluZVVzZXJzLCBcInJlc2V0XCIsIHRoaXMucmVuZGVyT2ZmbGluZVVzZXJzLCB0aGlzKTtcblxuICAgIHZhciBjaGF0bG9nID0gdGhpcy5tb2RlbC5nZXQoJ2NoYXRsb2cnKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRsb2csIFwiYWRkXCIsIHRoaXMucmVuZGVyQ2hhdCwgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5UbyhjaGF0bG9nLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlckNoYXRzLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRsb2csIFwicmVzZXRcIiwgdGhpcy5yZW5kZXJDaGF0cywgdGhpcyk7XG5cbiAgICB2YXIgY2hhdHJvb21zID0gdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tcycpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcImFkZFwiLCB0aGlzLnJlbmRlclJvb20sIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8oY2hhdHJvb21zLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlclJvb21zLCB0aGlzKTtcbiAgICB0aGlzLmxpc3RlblRvKGNoYXRyb29tcywgXCJyZXNldFwiLCB0aGlzLnJlbmRlclJvb21zLCB0aGlzKTtcblxuICAgIHZhciBwcml2YXRlUm9vbXMgPSB0aGlzLm1vZGVsLmdldCgncHJpdmF0ZVJvb21zJyk7XG4gICAgdGhpcy5saXN0ZW5Ubyhwcml2YXRlUm9vbXMsIFwiYWRkXCIsIHRoaXMucmVuZGVyUHJpdmF0ZVJvb20sIHRoaXMpO1xuICAgIHRoaXMubGlzdGVuVG8ocHJpdmF0ZVJvb21zLCBcInJlbW92ZVwiLCB0aGlzLnJlbmRlclByaXZhdGVSb29tcywgdGhpcyk7XG4gICAgdGhpcy5saXN0ZW5Ubyhwcml2YXRlUm9vbXMsIFwicmVzZXRcIiwgdGhpcy5yZW5kZXJQcml2YXRlUm9vbXMsIHRoaXMpO1xuXG4gICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImNoYW5nZTpjaGF0cm9vbVwiLCB0aGlzLnJlbmRlckhlYWRlciwgdGhpcyk7XG5cbiAgICB0aGlzLmxpc3RlblRvKHRoaXMuY2hhdEltYWdlVXBsb2FkVmlldywgJ2NoYXQtaW1hZ2UtdXBsb2FkZWQnLCB0aGlzLmNoYXRVcGxvYWRJbWFnZSk7XG4gICAgdGhpcy5saXN0ZW5Ubyh0aGlzLmNoYXRJbWFnZVVwbG9hZFZpZXcsICdtZXNzYWdlLWltYWdlLXVwbG9hZGVkJywgdGhpcy5tZXNzYWdlVXBsb2FkSW1hZ2UpO1xuICAgIHRoaXMubGlzdGVuVG8odGhpcy5jaGF0cm9vbUltYWdlVXBsb2FkVmlldywgJ2NyZWF0ZVJvb20nLCB0aGlzLmNyZWF0ZVJvb20pO1xuXG4gICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcIm1vcmVDaGF0c1wiLCB0aGlzLnJlbmRlck1vcmVDaGF0cywgdGhpcyk7XG5cbiAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwidXNlckludml0ZWRcIiwgdGhpcy51c2VySW52aXRlZCwgdGhpcyk7XG5cbiAgICB0aGlzLmxpc3RlblRvKHRoaXMubW9kZWwsIFwiY2hhdHJvb21BdmFpbGFiaWxpdHlcIiwgdGhpcy5yZW5kZXJDaGF0cm9vbUF2YWlsYWJpbGl0eSwgdGhpcyk7XG5cbiAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgIHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpLnNjcm9sbChmdW5jdGlvbigpe1xuICAgICAgICAvLyBjaGVja3MgaWYgdGhlcmUncyBlbm91Z2ggY2hhdHMgdG8gd2FycmFudCBhIGdldE1vcmVDaGF0cyBjYWxsXG4gICAgICBpZiAoJCgnI2NoYXRib3gtY29udGVudCcpLnNjcm9sbFRvcCgpID09PSAwICYmIHRoaXNfLm1vZGVsLmdldCgnY2hhdGxvZycpLmxlbmd0aCA+PSAyNSkge1xuICAgICAgICBpZiAodGhpc18ubW9kZWwuZ2V0KCdjaGF0cm9vbScpLmdldCgnY2hhdFR5cGUnKSA9PT0gJ21lc3NhZ2UnKSB7XG4gICAgICAgICAgXy5kZWJvdW5jZSh0aGlzXy5nZXRNb3JlRGlyZWN0TWVzc2FnZXMoKSwgMzAwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgXy5kZWJvdW5jZSh0aGlzXy5nZXRNb3JlQ2hhdHMoKSwgMzAwMCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgICAgICQod2luZG93KS5yZXNpemUoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB3aW5kb3dIZWlnaHQgPSAkKHdpbmRvdykuaGVpZ2h0KCk7XG4gICAgICAgIGlmICh3aW5kb3dIZWlnaHQgPiA1MDApIHtcbiAgICAgICAgICB2YXIgbmV3SGVpZ2h0ID0gd2luZG93SGVpZ2h0IC0gMjg1O1xuICAgICAgICAgICQoJyNjaGF0Ym94LWNvbnRlbnQnKS5oZWlnaHQobmV3SGVpZ2h0KTtcbiAgICAgICAgfVxuXG4gICAgICAgfSk7XG4gIH0sXG5cbiAgd2F0OiBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnd2F0Jyk7XG4gIH0sXG4gIGNoYXRyb29tU2VhcmNoVHlwZWFoZWFkOiBmdW5jdGlvbigpIHtcbiAgICAvLyBpbnRlcmVzdGluZyAtIHRoZSAndGhpcycgbWFrZXMgYSBkaWZmZXJlbmNlLCBjYW4ndCBmaW5kICNjaGF0LXNlYXJjaC1pbnB1dCBvdGhlcndpc2VcbiAgICB0aGlzLiQoJyNjaGF0LXNlYXJjaC1pbnB1dCcpLnR5cGVhaGVhZCh7XG4gICAgICBvblNlbGVjdDogZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICBjb25zb2xlLmxvZyhpdGVtKTtcbiAgICAgIH0sXG4gICAgICBhamF4OiB7XG4gICAgICAgIHVybDogJy9hcGkvc2VhcmNoQ2hhdHJvb21zJyxcbiAgICAgICAgdHJpZ2dlckxlbmd0aDogMSxcbiAgICAgICAgbGltaXQ6IDUsXG4gICAgICAgIG1pbkxlbmd0aDogNSxcbiAgICAgICAgcHJlRGlzcGF0Y2g6IGZ1bmN0aW9uIChxdWVyeSkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuYW1lOiBxdWVyeVxuICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHByZVByb2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICAgICAgaWYgKGRhdGEuc3VjY2VzcyA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIC8vIEhpZGUgdGhlIGxpc3QsIHRoZXJlIHdhcyBzb21lIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0pO1xuICB9LFxuXG5cblxuLy8gaGVhZGVyc1xuXG4gIHJlbmRlckhlYWRlcjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy4kKCcjY2hhdGJveC1oZWFkZXInKS5odG1sKHRoaXMuaGVhZGVyVGVtcGxhdGUodGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tJykudG9KU09OKCkpKTtcbiAgICB0aGlzLmNoYXRyb29tU2V0dGluZ3NWaWV3ID0gbmV3IGFwcC5DaGF0cm9vbVNldHRpbmdzVmlldyh7dmVudDogdGhpcy52ZW50LCBtb2RlbDogdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tJyl9KTtcbiAgICB0aGlzLmNoYXRyb29tU2V0dGluZ3NWaWV3LnNldEVsZW1lbnQodGhpcy4kKCcjY2hhdHJvb20taGVhZGVyLWNvbnRhaW5lcicpKTtcbiAgICAvLyBkZWJ1Z2dlcjtcbiAgICB0aGlzLmxpc3RlblRvKHRoaXMuY2hhdHJvb21TZXR0aW5nc1ZpZXcsICd1cGRhdGVSb29tJywgdGhpcy51cGRhdGVSb29tKTtcbiAgfSxcblxuICByZW5kZXJEaXJlY3RNZXNzYWdlSGVhZGVyOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLiQoJyNjaGF0Ym94LWhlYWRlcicpLmh0bWwodGhpcy5kaXJlY3RNZXNzYWdlSGVhZGVyVGVtcGxhdGUodGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tJykudG9KU09OKCkpKTtcbiAgfSxcblxuICB1c2VySW52aXRlZDogZnVuY3Rpb24oZGF0YSkge1xuICAgIHRoaXMuY2hhdHJvb21TZXR0aW5nc1ZpZXcudHJpZ2dlcigndXNlckludml0ZWQnLCBkYXRhKTtcbiAgfSxcblxuXG5cblxuLy8gdXNlcnNcblxuICByZW5kZXJVc2VyczogZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlclVzZXJzJyk7XG4gICAgb25saW5lVXNlcnMgPSB0aGlzLm1vZGVsLmdldChcIm9ubGluZVVzZXJzXCIpO1xuICAgIGNvbnNvbGUubG9nKCdVU0VSUzogJywgb25saW5lVXNlcnMpO1xuICAgIHRoaXMuJCgnLm9ubGluZS11c2VycycpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoXCJvbmxpbmVVc2Vyc1wiKS5lYWNoKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICB0aGlzLnJlbmRlclVzZXIodXNlcik7XG4gICAgfSwgdGhpcyk7XG4gIH0sXG4gIHJlbmRlclVzZXI6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdGhpcy4kKCcub25saW5lLXVzZXJzJykuYXBwZW5kKHRoaXMub25saW5lVXNlclRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gIH0sXG4gIHJlbmRlck9mZmxpbmVVc2VyczogZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlck9mZmxpbmVVc2VycycpO1xuICAgIGNvbnNvbGUubG9nKCdPZmZsaW5lIFVTRVJTOiAnLCB0aGlzLm1vZGVsLmdldChcIm9mZmxpbmVVc2Vyc1wiKSk7XG4gICAgdGhpcy4kKCcub2ZmbGluZS11c2VycycpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoXCJvZmZsaW5lVXNlcnNcIikuZWFjaChmdW5jdGlvbiAodXNlcikge1xuICAgICAgdGhpcy5yZW5kZXJPZmZsaW5lVXNlcih1c2VyKTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyT2ZmbGluZVVzZXI6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdGhpcy4kKCcub2ZmbGluZS11c2VycycpLmFwcGVuZCh0aGlzLm9mZmxpbmVVc2VyVGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgfSxcblxuXG5cblxuXG4vLyBjaGF0bG9nXG5cbiAgcmVuZGVyQ2hhdHM6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5yZW5kZXJDaGF0cycpO1xuICAgIGNvbnNvbGUubG9nKCdDSEFUTE9HOiAnLCB0aGlzLm1vZGVsLmdldChcImNoYXRsb2dcIikpO1xuICAgIHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoJ2NoYXRsb2cnKS5lYWNoKGZ1bmN0aW9uKGNoYXQpIHtcbiAgICAgIHRoaXMucmVuZGVyQ2hhdChjaGF0KTtcbiAgICB9LCB0aGlzKTtcblxuICAgIHRoaXMuYWZ0ZXJDaGF0c1JlbmRlcigpO1xuICB9LFxuXG4gIHJlbmRlckNoYXQ6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdGhpcy5yZW5kZXJEYXRlRGl2aWRlcnMobW9kZWwpO1xuICAgIHZhciBjaGF0VGVtcGxhdGUgPSAkKHRoaXMuY2hhdFRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gICAgY2hhdFRlbXBsYXRlLmFwcGVuZFRvKHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpKS5oaWRlKCkuZmFkZUluKCkuc2xpZGVEb3duKCk7XG4gICAgJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG4gIH0sXG5cbiAgcmVuZGVyRGF0ZURpdmlkZXJzOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHRoaXMuY3VycmVudERhdGUgPSBtb21lbnQobW9kZWwuZ2V0KCd0aW1lc3RhbXAnKSkuZm9ybWF0KCdkZGRkLCBNTU1NIERvIFlZWVknKTtcbiAgICBpZiAoIHRoaXMuY3VycmVudERhdGUgIT09IHRoaXMucHJldmlvdXNEYXRlICkge1xuICAgICAgdmFyIGN1cnJlbnREYXRlID0gJCh0aGlzLmRhdGVUZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICAgICAgY3VycmVudERhdGUuYXBwZW5kVG8odGhpcy4kKCcjY2hhdGJveC1jb250ZW50JykpLmhpZGUoKS5mYWRlSW4oKS5zbGlkZURvd24oKTtcbiAgICAgIHRoaXMucHJldmlvdXNEYXRlID0gdGhpcy5jdXJyZW50RGF0ZTtcbiAgICB9XG4gIH0sXG5cbiAgZ2V0TW9yZUNoYXRzOiBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYuZ2V0TW9yZUNoYXRzJyk7XG4gICAgdmFyIGNoYXRyb29tID0gdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tJyksXG4gICAgbmFtZSA9IGNoYXRyb29tLmdldCgnbmFtZScpLFxuICAgIG1vZGVsc0xvYWRlZFN1bSA9IGNoYXRyb29tLmdldCgnbW9kZWxzTG9hZGVkU3VtJyk7XG4gICAgdmFyIGNoYXRsb2dMZW5ndGggPSBjaGF0cm9vbS5nZXQoJ2NoYXRsb2dMZW5ndGgnKTtcbiAgICB0aGlzLnZlbnQudHJpZ2dlcignZ2V0TW9yZUNoYXRzJywgeyBuYW1lOiBuYW1lLCBtb2RlbHNMb2FkZWRTdW06IG1vZGVsc0xvYWRlZFN1bSwgY2hhdGxvZ0xlbmd0aDogY2hhdGxvZ0xlbmd0aH0pO1xuICAgIGNoYXRyb29tLnNldCgnbW9kZWxzTG9hZGVkU3VtJywgKG1vZGVsc0xvYWRlZFN1bSAtIDEpKTtcbiAgfSxcblxuICBnZXRNb3JlRGlyZWN0TWVzc2FnZXM6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5nZXRNb3JlRHJpZWN0TWVzc2FnZXMnKTtcbiAgICB2YXIgY2hhdHJvb20gPSB0aGlzLm1vZGVsLmdldCgnY2hhdHJvb20nKSxcbiAgICBpZCA9IGNoYXRyb29tLmdldCgnaWQnKSxcbiAgICBtb2RlbHNMb2FkZWRTdW0gPSBjaGF0cm9vbS5nZXQoJ21vZGVsc0xvYWRlZFN1bScpO1xuICAgIHZhciBjaGF0bG9nTGVuZ3RoID0gY2hhdHJvb20uZ2V0KCdjaGF0bG9nTGVuZ3RoJyk7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoJ2dldE1vcmVEaXJlY3RNZXNzYWdlcycsIHsgaWQ6IGlkLCBtb2RlbHNMb2FkZWRTdW06IG1vZGVsc0xvYWRlZFN1bSwgY2hhdGxvZ0xlbmd0aDogY2hhdGxvZ0xlbmd0aH0pO1xuICAgIGNoYXRyb29tLnNldCgnbW9kZWxzTG9hZGVkU3VtJywgKG1vZGVsc0xvYWRlZFN1bSAtIDEpKTtcbiAgfSxcblxuICByZW5kZXJNb3JlQ2hhdHM6IGZ1bmN0aW9uKGNoYXRzKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlck1vcmVDaGF0cycpO1xuICAgIC8vIHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpO1xuICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgdmFyIG9yaWdpbmFsSGVpZ2h0ID0gJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcbiAgICB0aGlzLm1vcmVDaGF0Q29sbGVjdGlvbiA9IFtdO1xuICAgIF8uZWFjaChjaGF0cywgZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIHRoaXNfLnJlbmRlck1vcmVEYXRlRGl2aWRlcnMobW9kZWwpO1xuICAgICAgdmFyIGNoYXRUZW1wbGF0ZSA9ICQodGhpcy5jaGF0VGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICAgIHRoaXNfLm1vcmVDaGF0Q29sbGVjdGlvbi5wdXNoKGNoYXRUZW1wbGF0ZSk7XG4gICAgICAvLyBjaGF0VGVtcGxhdGUucHJlcGVuZFRvKHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpKS5oaWRlKCkuZmFkZUluKCkuc2xpZGVEb3duKCk7XG4gICAgfSwgdGhpcyk7XG4gICAgXy5lYWNoKHRoaXMubW9yZUNoYXRDb2xsZWN0aW9uLnJldmVyc2UoKSwgZnVuY3Rpb24odGVtcGxhdGUpIHtcbiAgICAgIHRlbXBsYXRlLnByZXBlbmRUbyh0aGlzLiQoJyNjaGF0Ym94LWNvbnRlbnQnKSk7XG4gICAgfSk7XG5cbiAgICAgdGhpcy5kYXRlRGl2aWRlci5sb2FkKCQoXCIuZm9sbG93TWVCYXJcIikpO1xuICAgICAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodCAtIG9yaWdpbmFsSGVpZ2h0O1xuICAgICBcbiAgfSxcblxuICByZW5kZXJNb3JlRGF0ZURpdmlkZXJzOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHRoaXMuY3VycmVudERhdGUgPSBtb21lbnQobW9kZWwuYXR0cmlidXRlcy50aW1lc3RhbXApLmZvcm1hdCgnZGRkZCwgTU1NTSBEbyBZWVlZJyk7XG4gICAgaWYgKCB0aGlzLmN1cnJlbnREYXRlICE9PSB0aGlzLnByZXZpb3VzRGF0ZSApIHtcbiAgICAgIHZhciBjdXJyZW50RGF0ZSA9ICQodGhpcy5kYXRlVGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICAgIC8vIGN1cnJlbnREYXRlLmFwcGVuZFRvKHRoaXMuJCgnI2NoYXRib3gtY29udGVudCcpKS5oaWRlKCkuZmFkZUluKCkuc2xpZGVEb3duKCk7XG4gICAgICB0aGlzLm1vcmVDaGF0Q29sbGVjdGlvbi5wdXNoKGN1cnJlbnREYXRlKTtcbiAgICAgIHRoaXMucHJldmlvdXNEYXRlID0gdGhpcy5jdXJyZW50RGF0ZTtcbiAgICB9XG4gIH0sXG5cbiAgYXV0b3NpemVyOiBmdW5jdGlvbigpIHtcbiAgICBhdXRvc2l6ZSgkKCcjbWVzc2FnZS1pbnB1dCcpKTtcbiAgfSxcbiAgXG4gIHNjcm9sbEJvdHRvbUluc3VyYW5jZTogZnVuY3Rpb24oKXtcbiAgICB2YXIgdGhpc18gPSB0aGlzO1xuICAgIHZhciBpbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCl7XG4gICAgICB0aGlzLiQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxUb3AgPSB0aGlzLiQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG4gICAgfSwgNTApO1xuICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICB9LCA4MDApO1xuICB9LFxuXG4gIGFmdGVyQ2hhdHNSZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYXV0b3NpemVyKCk7XG4gICAgdGhpcy5kYXRlRGl2aWRlci5sb2FkKCQoXCIuZm9sbG93TWVCYXJcIikpO1xuICAgIHRoaXMuc2Nyb2xsQm90dG9tSW5zdXJhbmNlKCk7XG4gIH0sXG5cblxuXG5cblxuXG5cblxuLy8gcm9vbXNcblxuXG4gIHNlYXJjaDogZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzICYmICQudHJpbSgkKCcjY2hhdC1zZWFyY2gtaW5wdXQnKS52YWwoKSkubGVuZ3RoID4gMCkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdmFyIG5hbWUgPSAkKCcjY2hhdC1zZWFyY2gtaW5wdXQnKS52YWwoKTtcbiAgICAgIHRoaXMuYWRkQ2hhdHJvb20obmFtZSk7XG4gICAgICB0aGlzLiQoJyNjaGF0LXNlYXJjaC1pbnB1dCcpLnZhbCgnJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzZWFyY2ggdHlwaW5nJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBjcmVhdGVSb29tOiBmdW5jdGlvbihmb3JtKSB7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoJ2NyZWF0ZVJvb20nLCBmb3JtKTtcbiAgfSxcbiAgdXBkYXRlUm9vbTogZnVuY3Rpb24oZm9ybSkge1xuICAgIHZhciBpZCA9IHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbScpLmdldCgnaWQnKTtcbiAgICBmb3JtLmlkID0gaWQ7XG4gICAgdGhpcy52ZW50LnRyaWdnZXIoJ3VwZGF0ZVJvb20nLCBmb3JtKTtcbiAgfSxcbiAgZGVzdHJveVJvb206IGZ1bmN0aW9uKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICB2YXIgY29uZmlybWF0aW9uID0gc3dhbCh7XG4gICAgICB0aXRsZTogXCJEbyB5b3Ugd2lzaCB0byBkZXN0cm95IHRoZSByb29tP1wiLFxuICAgICAgdGV4dDogXCJUaGlzIGtpbGxzIHRoZSByb29tLlwiLFxuICAgICAgdHlwZTogXCJ3YXJuaW5nXCIsXG4gICAgICBzaG93Q2FuY2VsQnV0dG9uOiB0cnVlLFxuICAgICAgY29uZmlybUJ1dHRvbkNvbG9yOiBcIiNERUIwQjBcIixcbiAgICAgIGNvbmZpcm1CdXR0b25UZXh0OiBcIk11YWhhaGEhXCIsXG4gICAgICBjbG9zZU9uQ29uZmlybTogZmFsc2UsXG4gICAgICBodG1sOiBmYWxzZVxuICAgIH0sIGZ1bmN0aW9uKCl7XG4gICAgICBzd2FsKHtcbiAgICAgICAgdGl0bGU6IFwiRXZpc2NlcmF0ZWQhXCIsXG4gICAgICAgIHRleHQ6IFwiWW91ciBjaGF0cm9vbSBoYXMgYmVlbiBwdXJnZWQuXCIsXG4gICAgICAgIHR5cGU6IFwic3VjY2Vzc1wiLFxuICAgICAgICBjb25maXJtQnV0dG9uQ29sb3I6IFwiIzc0OUNBOFwiLFxuICAgICAgfSk7XG4gICAgICB0aGlzXy52ZW50LnRyaWdnZXIoJ2Rlc3Ryb3lSb29tJywgdGhpc18ubW9kZWwuZ2V0KCdjaGF0cm9vbScpLmdldCgnbmFtZScpKTtcbiAgICB9KTtcbiAgfSxcbiAgYWRkQ2hhdHJvb206IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYuYWRkQ2hhdHJvb20nKTtcbiAgICB0aGlzLnZlbnQudHJpZ2dlcignYWRkUm9vbScsIG5hbWUpO1xuICB9LFxuICByZW1vdmVSb29tOiBmdW5jdGlvbihlKSB7XG4gICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICB2YXIgY29uZmlybWF0aW9uID0gc3dhbCh7XG4gICAgICB0aXRsZTogXCJSZW1vdmUgVGhpcyBSb29tP1wiLFxuICAgICAgdGV4dDogXCJBcmUgeW91IHN1cmU/IEFyZSB5b3Ugc3VyZSB5b3UncmUgc3VyZT8gSG93IHN1cmUgY2FuIHlvdSBiZT9cIixcbiAgICAgIHR5cGU6IFwid2FybmluZ1wiLFxuICAgICAgc2hvd0NhbmNlbEJ1dHRvbjogdHJ1ZSxcbiAgICAgIGNvbmZpcm1CdXR0b25Db2xvcjogXCIjREVCMEIwXCIsXG4gICAgICBjb25maXJtQnV0dG9uVGV4dDogXCJNdWFoYWhhIVwiLFxuICAgICAgY2xvc2VPbkNvbmZpcm06IGZhbHNlLFxuICAgICAgaHRtbDogZmFsc2VcbiAgICB9LCBmdW5jdGlvbigpe1xuICAgICAgc3dhbCh7XG4gICAgICAgIHRpdGxlOiBcIlJlbW92ZWQhXCIsXG4gICAgICAgIHRleHQ6IFwiWW91IGFyZSBmcmVlIG9mIHRoaXMgY2hhdHJvb20uIEdvIG9uLCB5b3UncmUgZnJlZSBub3cuXCIsXG4gICAgICAgIHR5cGU6IFwic3VjY2Vzc1wiLFxuICAgICAgICBjb25maXJtQnV0dG9uQ29sb3I6IFwiIzc0OUNBOFwiXG4gICAgICB9KTtcbiAgICAgIHZhciBuYW1lID0gJChlLnRhcmdldCkuZGF0YShcInJvb20tbmFtZVwiKTtcbiAgICAgIHRoaXNfLnZlbnQudHJpZ2dlcigncmVtb3ZlUm9vbScsIG5hbWUpO1xuICAgIH0pO1xuICB9LFxuICByZW5kZXJSb29tczogZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLnJlbmRlclJvb21zJyk7XG4gICAgY29uc29sZS5sb2coJ0NIQVRST09NUzogJywgdGhpcy5tb2RlbC5nZXQoXCJjaGF0cm9vbXNcIikpO1xuICAgIHRoaXMuJCgnLnB1YmxpYy1yb29tcycpLmVtcHR5KCk7XG4gICAgdGhpcy5tb2RlbC5nZXQoJ2NoYXRyb29tcycpLmVhY2goZnVuY3Rpb24gKHJvb20pIHtcbiAgICAgIHRoaXMucmVuZGVyUm9vbShyb29tKTtcbiAgICB9LCB0aGlzKTtcbiAgfSxcbiAgcmVuZGVyUm9vbTogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB2YXIgbmFtZTEgPSBtb2RlbC5nZXQoJ25hbWUnKSxcbiAgICBuYW1lMiA9IHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbScpLmdldCgnbmFtZScpO1xuICAgIHRoaXMuJCgnLnB1YmxpYy1yb29tcycpLmFwcGVuZCh0aGlzLnJvb21UZW1wbGF0ZShtb2RlbC50b0pTT04oKSkpO1xuICAgIGlmIChuYW1lMSA9PT0gbmFtZTIpIHtcbiAgICAgIHRoaXMuJCgnLnJvb20nKS5sYXN0KCkuZmluZCgnLnJvb20tbmFtZScpLmNzcygnY29sb3InLCAnI0RFQjBCMCcpLmZhZGVJbigpO1xuICAgIH1cbiAgfSxcbiAgcmVuZGVyUHJpdmF0ZVJvb21zOiBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnY3J2LmYucmVuZGVyUHJpdmF0ZVJvb21zJyk7XG4gICAgY29uc29sZS5sb2coJ1BSSVZBVEVST09NUzogJywgdGhpcy5tb2RlbC5nZXQoXCJwcml2YXRlUm9vbXNcIikpO1xuICAgIHRoaXMuJCgnI3ByaXZhdGUtcm9vbXMnKS5lbXB0eSgpO1xuICAgIHRoaXMubW9kZWwuZ2V0KCdwcml2YXRlUm9vbXMnKS5lYWNoKGZ1bmN0aW9uIChyb29tKSB7XG4gICAgICB0aGlzLnJlbmRlclByaXZhdGVSb29tKHJvb20pO1xuICAgIH0sIHRoaXMpO1xuICB9LFxuICByZW5kZXJQcml2YXRlUm9vbTogZnVuY3Rpb24obW9kZWwpIHtcbiAgICAvLyB2YXIgbmFtZTEgPSBtb2RlbC5nZXQoJ25hbWUnKSxcbiAgICAvLyBuYW1lMiA9IHRoaXMubW9kZWwuZ2V0KCdjaGF0cm9vbScpLmdldCgnbmFtZScpO1xuICAgIHRoaXMuJCgnI3ByaXZhdGUtcm9vbXMnKS5hcHBlbmQodGhpcy5yb29tVGVtcGxhdGUobW9kZWwudG9KU09OKCkpKTtcbiAgICAvLyBpZiAobmFtZTEgPT09IG5hbWUyKSB7XG4gICAgLy8gICB0aGlzLiQoJy5yb29tJykubGFzdCgpLmZpbmQoJy5yb29tLW5hbWUnKS5jc3MoJ2NvbG9yJywgJyNERUIwQjAnKS5mYWRlSW4oKTtcbiAgICAvLyB9XG4gIH0sXG4gIGpvaW5Sb29tOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ2Nydi5mLmpvaW5Sb29tJyk7XG4gICAgICQoJyNjaGF0SW1hZ2VVcGxvYWRDb250YWluZXInKS5kYXRhKCdjaGF0LXR5cGUnLCAnY2hhdCcpO1xuICAgIHRoaXMuY3VycmVudERhdGUgPSAnJztcbiAgICB0aGlzLnByZXZpb3VzRGF0ZSA9ICcnO1xuICAgIHRoaXMudmVudC50cmlnZ2VyKCdqb2luUm9vbScsIG5hbWUpO1xuICB9LFxuLy8gY2hhbmdlIHRvICdqb2luRGlyZWN0TWVzc2FnZSdcbiAgaW5pdERpcmVjdE1lc3NhZ2U6IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgcmVjaXBpZW50ID0ge30sXG4gICAgICAgICR0YXIgPSAkKGUuY3VycmVudFRhcmdldCk7XG4gICAgcmVjaXBpZW50LnVzZXJuYW1lID0gJHRhci50ZXh0KCkudHJpbSgpO1xuICAgIHJlY2lwaWVudC51c2VySW1hZ2UgPSAkdGFyLmZpbmQoJ2ltZycpLmF0dHIoJ3NyYycpO1xuICAgIHRoaXMuY3VycmVudERhdGUgPSAnJztcbiAgICB0aGlzLnByZXZpb3VzRGF0ZSA9ICcnO1xuICAgIGlmICh0aGlzLm1vZGVsLmdldCgnY2hhdHJvb20nKS5nZXQoJ2N1cnJlbnRVc2VyJykgIT09IHJlY2lwaWVudC51c2VybmFtZSkge1xuICAgICAgdGhpcy52ZW50LnRyaWdnZXIoJ2luaXREaXJlY3RNZXNzYWdlJywgcmVjaXBpZW50KTtcbiAgICB9XG4gIH0sXG5cblxuXG5cblxuLy8gaW1hZ2UgdXBsb2FkXG5cbiBjaGF0VXBsb2FkSW1hZ2U6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgY29uc29sZS5sb2coJ2ltZyB1cmw6ICcsIHJlc3BvbnNlKTtcbiAgICB0aGlzLnZlbnQudHJpZ2dlcihcImNoYXRcIiwgcmVzcG9uc2UpO1xuICAgIHRoaXMuc2Nyb2xsQm90dG9tSW5zdXJhbmNlKCk7XG4gIH0sXG5cbiAgbWVzc2FnZVVwbG9hZEltYWdlOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgY29uc29sZS5sb2coJ2ltZyB1cmw6ICcsIHJlc3BvbnNlKTtcbiAgIHRoaXMudmVudC50cmlnZ2VyKFwiZGlyZWN0TWVzc2FnZVwiLCByZXNwb25zZSk7XG4gICB0aGlzLnNjcm9sbEJvdHRvbUluc3VyYW5jZSgpO1xuIH0sXG5cblxuXG5cblxuICAvL2V2ZW50c1xuXG5cbiAgbWVzc2FnZUlucHV0UHJlc3NlZDogZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzICYmICQudHJpbSgkKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgpKS5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBmdW4gZmFjdDogc2VwYXJhdGUgZXZlbnRzIHdpdGggYSBzcGFjZSBpbiB0cmlnZ2VyJ3MgZmlyc3QgYXJnIGFuZCB5b3VcbiAgICAgIC8vIGNhbiB0cmlnZ2VyIG11bHRpcGxlIGV2ZW50cy5cbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwiY2hhdFwiLCB7IG1lc3NhZ2U6IHRoaXMuJCgnLm1lc3NhZ2UtaW5wdXQnKS52YWwoKX0pO1xuICAgICAgdGhpcy4kKCcubWVzc2FnZS1pbnB1dCcpLnZhbCgnJyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwidHlwaW5nXCIpO1xuICAgICAgY29uc29sZS5sb2coJ3d1dCcpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgZGlyZWN0TWVzc2FnZUlucHV0UHJlc3NlZDogZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDEzICYmICQudHJpbSgkKCcuZGlyZWN0LW1lc3NhZ2UtaW5wdXQnKS52YWwoKSkubGVuZ3RoID4gMCkge1xuICAgICAgLy8gZnVuIGZhY3Q6IHNlcGFyYXRlIGV2ZW50cyB3aXRoIGEgc3BhY2UgaW4gdHJpZ2dlcidzIGZpcnN0IGFyZyBhbmQgeW91XG4gICAgICAvLyBjYW4gdHJpZ2dlciBtdWx0aXBsZSBldmVudHMuXG4gICAgICB0aGlzLnZlbnQudHJpZ2dlcihcImRpcmVjdE1lc3NhZ2VcIiwgeyBtZXNzYWdlOiB0aGlzLiQoJy5kaXJlY3QtbWVzc2FnZS1pbnB1dCcpLnZhbCgpfSk7XG4gICAgICB0aGlzLiQoJy5kaXJlY3QtbWVzc2FnZS1pbnB1dCcpLnZhbCgnJyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudmVudC50cmlnZ2VyKFwidHlwaW5nXCIpO1xuICAgICAgY29uc29sZS5sb2coJ2h1aCcpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgc2V0Um9vbTogZnVuY3Rpb24oZSkge1xuICAgIGNvbnNvbGUubG9nKCdjcnYuZi5zZXRSb29tJyk7XG4gICAgdmFyICR0YXIgPSAkKGUudGFyZ2V0KTtcbiAgICBpZiAoJHRhci5pcygnLnJvb20tbmFtZScpKSB7XG4gICAgICB0aGlzLmpvaW5Sb29tKCR0YXIuZGF0YSgncm9vbScpKTtcbiAgICB9XG4gIH0sXG5cblxuICBkYXRlRGl2aWRlcjogKGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyICR3aW5kb3cgPSAkKHdpbmRvdyksXG4gICAgJHN0aWNraWVzO1xuXG4gICAgbG9hZCA9IGZ1bmN0aW9uKHN0aWNraWVzKSB7XG4gICAgICAkc3RpY2tpZXMgPSBzdGlja2llcztcbiAgICAgICQoJyNjaGF0Ym94LWNvbnRlbnQnKS5zY3JvbGwoc2Nyb2xsU3RpY2tpZXNJbml0KTtcbiAgICB9O1xuXG4gICAgc2Nyb2xsU3RpY2tpZXNJbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAkKHRoaXMpLm9mZihcInNjcm9sbC5zdGlja2llc1wiKTtcbiAgICAgICQodGhpcykub24oXCJzY3JvbGwuc3RpY2tpZXNcIiwgXy5kZWJvdW5jZShfd2hlblNjcm9sbGluZywgMTUwKSk7XG4gICAgfTtcblxuICAgIF93aGVuU2Nyb2xsaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICAkc3RpY2tpZXMucmVtb3ZlQ2xhc3MoJ2ZpeGVkJyk7XG4gICAgICAkc3RpY2tpZXMuZWFjaChmdW5jdGlvbihpLCBzdGlja3kpIHtcbiAgICAgICAgdmFyICR0aGlzU3RpY2t5ID0gJChzdGlja3kpLFxuICAgICAgICAkdGhpc1N0aWNreVRvcCA9ICR0aGlzU3RpY2t5Lm9mZnNldCgpLnRvcDtcbiAgICAgICAgaWYgKCR0aGlzU3RpY2t5VG9wIDw9IDE2Mikge1xuICAgICAgICAgICR0aGlzU3RpY2t5LmFkZENsYXNzKFwiZml4ZWRcIik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgbG9hZDogbG9hZFxuICAgIH07XG4gIH0pKClcblxuXG5cblxufSk7XG5cbn0pKGpRdWVyeSk7IiwiXG52YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5JbnZpdGF0aW9uQ29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcbiAgICBtb2RlbDogYXBwLkludml0YXRpb25Nb2RlbFxuICB9KTtcblxufSkoKTsiLCJcbnZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYXBwLkNoYXRyb29tTGlzdCA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcbiAgICBtb2RlbDogYXBwLkNoYXRyb29tTW9kZWwsXG4gICAgdXJsOiAnL2FwaS9jaGF0cm9vbXMnLFxuICB9KTtcblxufSkoKTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFwcC5Qcml2YXRlUm9vbUNvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG4gICAgbW9kZWw6IGFwcC5DaGF0cm9vbU1vZGVsLFxuICB9KTtcblxufSkoKTsiLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG5cbihmdW5jdGlvbigkKSB7XG5cbiAgYXBwLkNoYXRJbWFnZVVwbG9hZFZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG5cbiAgICBlbDogJCgnI2NoYXRJbWFnZVVwbG9hZENvbnRhaW5lcicpLFxuICBcbiAgICBldmVudHM6IHtcbiAgICAgICdjaGFuZ2UgI2NoYXRJbWFnZVVwbG9hZCc6ICdyZW5kZXJUaHVtYicsXG4gICAgICAnYXR0YWNoSW1hZ2UgI2NoYXRJbWFnZVVwbG9hZEZvcm0nOiAndXBsb2FkJyxcbiAgICAgICdjbGljayAjYWRkQ2hhdEltYWdlQnRuJzogJ3N1Ym1pdCcsXG4gICAgfSxcblxuICAgIC8vIGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuICAgIC8vICAgdGhpcy5saXN0ZW5Ubyh0aGlzLCBcImZpbGUtY2hvc2VuXCIsIHRoaXMucmVuZGVyVGh1bWIsIHRoaXMpO1xuICAgIC8vICAgdGhpcy5saXN0ZW5Ubyh0aGlzLCBcImZpbGUtY2hvc2VuXCIsIHRoaXMucmVuZGVyVGh1bWIsIHRoaXMpO1xuICAgIC8vIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5yZW5kZXJUaHVtYigpO1xuICAgIH0sXG5cbiAgICByZW5kZXJUaHVtYjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaW5wdXQgPSB0aGlzLiQoJyNjaGF0SW1hZ2VVcGxvYWQnKTtcbiAgICAgIHZhciBpbWcgPSB0aGlzLiQoJyN1cGxvYWRlZENoYXRJbWFnZScpWzBdO1xuICAgICAgaWYoaW5wdXQudmFsKCkgIT09ICcnKSB7XG4gICAgICAgIHZhciBzZWxlY3RlZF9maWxlID0gaW5wdXRbMF0uZmlsZXNbMF07XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICByZWFkZXIub25sb2FkID0gKGZ1bmN0aW9uKGFJbWcpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgYUltZy5zcmMgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkoaW1nKTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoIHNlbGVjdGVkX2ZpbGUgKTtcbiAgICAgIH1cblxuICAgIH0sXG5cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMuJGZvcm0gPSB0aGlzLiQoJyNjaGF0SW1hZ2VVcGxvYWRGb3JtJyk7XG4gICAgICB0aGlzLiRmb3JtLnRyaWdnZXIoJ2F0dGFjaEltYWdlJyk7XG4gICAgfSxcblxuICAgIHVwbG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEodGhpcy4kZm9ybVswXSk7XG4gICAgICBpZiAodGhpcy4kKCcjY2hhdEltYWdlVXBsb2FkJylbMF0uZmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICB1cmw6ICcvYXBpL3VwbG9hZENoYXRJbWFnZScsXG4gICAgICAgICAgZGF0YTogZm9ybURhdGEsXG4gICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgIGNvbnRlbnRUeXBlOiBmYWxzZSxcbiAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oIHhociApIHtcbiAgICAgICAgICAgIF90aGlzLnJlbmRlclN0YXR1cygnRXJyb3I6ICcgKyB4aHIuc3RhdHVzKTtcbiAgICAgICAgICAgIGFsZXJ0KCdZb3VyIGltYWdlIGlzIGVpdGhlciB0b28gbGFyZ2Ugb3IgaXQgaXMgbm90IGEgLmpwZWcsIC5wbmcsIG9yIC5naWYuJyk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiggcmVzcG9uc2UgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnaW1nVXBsb2FkIHJlc3BvbnNlOiAnLCByZXNwb25zZSk7XG4gICAgICAgICAgICBfdGhpcy4kZWwuZGF0YSgnY2hhdC10eXBlJykgPT09ICdjaGF0JyA/XG4gICAgICAgICAgICAgIF90aGlzLnRyaWdnZXIoJ2NoYXQtaW1hZ2UtdXBsb2FkZWQnLCByZXNwb25zZSkgOlxuICAgICAgICAgICAgICBfdGhpcy50cmlnZ2VyKCdtZXNzYWdlLWltYWdlLXVwbG9hZGVkJywgcmVzcG9uc2UpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ltZ1VwbG9hZCBwYXRoICcsIHJlc3BvbnNlLnBhdGgpO1xuICAgICAgICAgICAgJCgnI2NoYXRJbWFnZVVwbG9hZE1vZGFsJykubW9kYWwoJ2hpZGUnKTtcbiAgICAgICAgICAgIF90aGlzLmNsZWFyRmllbGQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICB0aGlzLnRyaWdnZXIoJ2ltYWdlLXVwbG9hZGVkJyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIHJlbmRlclN0YXR1czogZnVuY3Rpb24oIHN0YXR1cyApIHtcbiAgICAgICQoJyNzdGF0dXMnKS50ZXh0KHN0YXR1cyk7XG4gICAgfSxcblxuICAgIGNsZWFyRmllbGQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kKCcjdXBsb2FkZWRDaGF0SW1hZ2UnKVswXS5zcmMgPSAnJztcbiAgICAgIHRoaXMuJCgnI2NoYXRJbWFnZVVwbG9hZCcpLnZhbCgnJyk7XG4gICAgfVxuXG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cblxuKGZ1bmN0aW9uKCQpIHtcblxuICBhcHAuQ2hhdHJvb21JbWFnZVVwbG9hZFZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG5cbiAgICBlbDogJCgnI2NyZWF0ZUNoYXRyb29tQ29udGFpbmVyJyksXG4gICAgZXZlbnRzOiB7XG4gICAgICAnY2hhbmdlICNjaGF0cm9vbUltYWdlVXBsb2FkJzogJ3JlbmRlclRodW1iJyxcbiAgICAgICdhdHRhY2hJbWFnZSAjY3JlYXRlQ2hhdHJvb21Gb3JtJzogJ3VwbG9hZCcsXG4gICAgICAnY2xpY2sgI2NyZWF0ZUNoYXRyb29tQnRuJzogJ3N1Ym1pdCcsXG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnJlbmRlclRodW1iKCk7XG4gICAgfSxcblxuICAgIHJlbmRlclRodW1iOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpbnB1dCA9IHRoaXMuJCgnI2NoYXRyb29tSW1hZ2VVcGxvYWQnKTtcbiAgICAgIHZhciBpbWcgPSB0aGlzLiQoJyN1cGxvYWRlZENoYXRyb29tSW1hZ2UnKVswXTtcbiAgICAgIGlmKGlucHV0LnZhbCgpICE9PSAnJykge1xuICAgICAgICB2YXIgc2VsZWN0ZWRfZmlsZSA9IGlucHV0WzBdLmZpbGVzWzBdO1xuICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IChmdW5jdGlvbihhSW1nKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGFJbWcuc3JjID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgICAgIH07XG4gICAgICAgIH0pKGltZyk7XG4gICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKCBzZWxlY3RlZF9maWxlICk7XG4gICAgICB9XG5cbiAgICB9LFxuXG4gICAgc3VibWl0OiBmdW5jdGlvbihlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLiRmb3JtID0gdGhpcy4kKCcjY3JlYXRlQ2hhdHJvb21Gb3JtJyk7XG4gICAgICB0aGlzLiRmb3JtLnRyaWdnZXIoJ2F0dGFjaEltYWdlJyk7XG4gICAgfSxcblxuICAgIHVwbG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgdmFyIGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKHRoaXMuJGZvcm1bMF0pO1xuICAgICAgaWYgKHRoaXMuJCgnI2NoYXRyb29tSW1hZ2VVcGxvYWQnKVswXS5maWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgIHVybDogJy9hcGkvdXBsb2FkQ2hhdHJvb21JbWFnZScsXG4gICAgICAgICAgZGF0YTogZm9ybURhdGEsXG4gICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgIGNvbnRlbnRUeXBlOiBmYWxzZSxcbiAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oIHhociApIHtcbiAgICAgICAgICAgIF90aGlzLnJlbmRlclN0YXR1cygnRXJyb3I6ICcgKyB4aHIuc3RhdHVzKTtcbiAgICAgICAgICAgIGFsZXJ0KCdZb3VyIGltYWdlIGlzIGVpdGhlciB0b28gbGFyZ2Ugb3IgaXQgaXMgbm90IGEgLmpwZWcsIC5wbmcsIG9yIC5naWYuJyk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiggcmVzcG9uc2UgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnaW1nVXBsb2FkIHJlc3BvbnNlOiAnLCByZXNwb25zZSk7XG4gICAgICAgICAgICB2YXIgZm9ybSA9IF90aGlzLmNyZWF0ZVJvb21Gb3JtRGF0YSgpO1xuICAgICAgICAgICAgcmVzcG9uc2UubmFtZSA9IGZvcm0ubmFtZTtcbiAgICAgICAgICAgICAgX3RoaXMudHJpZ2dlcignY3JlYXRlUm9vbScsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICQoJyNjcmVhdGVDaGF0cm9vbU1vZGFsJykubW9kYWwoJ2hpZGUnKTtcbiAgICAgICAgICAgIF90aGlzLmNsZWFyRmllbGQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGZvcm0gPSBfdGhpcy5jcmVhdGVSb29tRm9ybURhdGEoKTtcbiAgICAgICAgZGVidWdnZXI7XG4gICAgICAgdGhpcy50cmlnZ2VyKCdjcmVhdGVSb29tJywgZm9ybSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuXG4gICAgY3JlYXRlUm9vbUZvcm1EYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBmb3JtRGF0YSA9IHt9O1xuICAgICAgZm9ybURhdGEucm9vbUltYWdlID0gJy9pbWcvY2hqYXQtaWNvbjEucG5nJztcbiAgICAgIHRoaXMuJCgnI2NyZWF0ZUNoYXRyb29tRm9ybScpLmNoaWxkcmVuKCAnaW5wdXQnICkuZWFjaChmdW5jdGlvbihpLCBlbCkge1xuICAgICAgICBpZiAoJChlbCkuZGF0YSgnY3JlYXRlJykgPT09ICdwcml2YWN5Jykge1xuICAgICAgICAgIHZhciB2YWwgPSAkKGVsKS5wcm9wKCdjaGVja2VkJyk7XG4gICAgICAgICAgZm9ybURhdGFbJ3ByaXZhY3knXSA9IHZhbDtcbiAgICAgICAgICBkZWJ1Z2dlcjtcbiAgICAgICAgfSBlbHNlIGlmICgkKGVsKS52YWwoKSAhPT0gJycpIHtcbiAgICAgICAgICBmb3JtRGF0YVskKGVsKS5kYXRhKCdjcmVhdGUnKV0gPSAkKGVsKS52YWwoKTtcbiAgICAgICAgICAkKGVsKS52YWwoJycpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBmb3JtRGF0YTtcblxuICAgIH0sXG5cbiAgICByZW5kZXJTdGF0dXM6IGZ1bmN0aW9uKCBzdGF0dXMgKSB7XG4gICAgICAkKCcjc3RhdHVzJykudGV4dChzdGF0dXMpO1xuICAgIH0sXG5cbiAgICBjbGVhckZpZWxkOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJCgnI3VwbG9hZGVkQ2hhdHJvb21JbWFnZScpWzBdLnNyYyA9ICcnO1xuICAgICAgdGhpcy4kKCcjY2hhdHJvb21JbWFnZVVwbG9hZCcpLnZhbCgnJyk7XG4gICAgfVxuXG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cblxuKGZ1bmN0aW9uKCQpIHtcblxuICBhcHAuQ2hhdHJvb21TZXR0aW5nc1ZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG5cbiAgICBlbDogJCgnI2NoYXRyb29tLWhlYWRlci1jb250YWluZXInKSxcbiAgICB1c2VySW52aXRlZFRlbXBsYXRlOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwidXNlci1pbnZpdGVkLXJlc3BvbnNlIHN1Y2Nlc3NcIj48JT0gdXNlcm5hbWUgJT4gSW52aXRlZCE8L2Rpdj4nKSxcbiAgICBpbnZpdGF0aW9uRXJyb3JUZW1wbGF0ZTogXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cInVzZXItaW52aXRlZC1yZXNwb25zZSBmYWlsdXJlXCI+RmFpbHVyZSE8L2Rpdj4nKSxcbiAgICBldmVudHM6IHtcbiAgICAgICdjaGFuZ2UgI3ByZWZlcmVuY2VzLWltYWdlLXVwbG9hZCc6ICdyZW5kZXJUaHVtYicsXG4gICAgICAnYXR0YWNoSW1hZ2UgI3ByZWZlcmVuY2VzLWZvcm0nOiAndXBsb2FkJyxcbiAgICAgICdjbGljayAjcHJlZmVyZW5jZXMtYnRuJzogJ3N1Ym1pdCcsXG4gICAgICAna2V5dXAgI2ludml0ZS11c2VyLWlucHV0JzogJ2ludml0ZVVzZXInLFxuICAgIH0sXG5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB0aGlzLnZlbnQgPSBvcHRpb25zLnZlbnQ7XG4gICAgICB0aGlzLnVzZXJTZWFyY2hUeXBlYWhlYWQoKTtcbiAgICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgICAkKFwiZm9ybVwiKS5zdWJtaXQoZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLCBcInVzZXJJbnZpdGVkXCIsIHRoaXMudXNlckludml0ZWQsIHRoaXMpO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5yZW5kZXJUaHVtYigpO1xuICAgIH0sXG5cbiAgICByZW5kZXJUaHVtYjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaW5wdXQgPSB0aGlzLiQoJyNwcmVmZXJlbmNlcy1pbWFnZS11cGxvYWQnKTtcbiAgICAgIHZhciBpbWcgPSB0aGlzLiQoJyN1cGxvYWRlZC1wcmVmZXJlbmNlcy1pbWFnZScpWzBdO1xuICAgICAgaWYoaW5wdXQudmFsKCkgIT09ICcnKSB7XG4gICAgICAgIHZhciBzZWxlY3RlZF9maWxlID0gaW5wdXRbMF0uZmlsZXNbMF07XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICByZWFkZXIub25sb2FkID0gKGZ1bmN0aW9uKGFJbWcpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgYUltZy5zcmMgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkoaW1nKTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoIHNlbGVjdGVkX2ZpbGUgKTtcbiAgICAgIH1cblxuICAgIH0sXG5cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgdGhpcy4kZm9ybSA9IHRoaXMuJCgnI3ByZWZlcmVuY2VzLWZvcm0nKTtcbiAgICAgIHRoaXMuJGZvcm0udHJpZ2dlcignYXR0YWNoSW1hZ2UnKTtcbiAgICB9LFxuXG4gICAgdXBsb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSh0aGlzLiRmb3JtWzBdKTtcbiAgICAgIGlmICh0aGlzLiQoJyNwcmVmZXJlbmNlcy1pbWFnZS11cGxvYWQnKVswXS5maWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgIHVybDogJy9hcGkvdXBsb2FkQ2hhdHJvb21JbWFnZScsXG4gICAgICAgICAgZGF0YTogZm9ybURhdGEsXG4gICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgIGNvbnRlbnRUeXBlOiBmYWxzZSxcbiAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oIHhociApIHtcbiAgICAgICAgICAgIF90aGlzLnJlbmRlclN0YXR1cygnRXJyb3I6ICcgKyB4aHIuc3RhdHVzKTtcbiAgICAgICAgICAgIGFsZXJ0KCdZb3VyIGltYWdlIGlzIGVpdGhlciB0b28gbGFyZ2Ugb3IgaXQgaXMgbm90IGEgLmpwZWcsIC5wbmcsIG9yIC5naWYuJyk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiggcmVzcG9uc2UgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnaW1nVXBsb2FkIHJlc3BvbnNlOiAnLCByZXNwb25zZSk7XG4gICAgICAgICAgICB2YXIgZm9ybSA9IF90aGlzLmNyZWF0ZVJvb21Gb3JtRGF0YSgpO1xuICAgICAgICAgICAgZm9ybS5yb29tSW1hZ2UgPSByZXNwb25zZS5yb29tSW1hZ2U7XG4gICAgICAgICAgICBfdGhpcy50cmlnZ2VyKCd1cGRhdGVSb29tJywgZm9ybSk7XG4gICAgICAgICAgICAkKCcjcHJlZmVyZW5jZXMtbW9kYWwnKS5tb2RhbCgnaGlkZScpO1xuICAgICAgICAgICAgX3RoaXMuY2xlYXJGaWVsZCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZm9ybSA9IHRoaXMuY3JlYXRlUm9vbUZvcm1EYXRhKCk7XG4gICAgICAgIHRoaXMudHJpZ2dlcigndXBkYXRlUm9vbScsIGZvcm0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cblxuICAgIGNyZWF0ZVJvb21Gb3JtRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZm9ybURhdGEgPSB7fTtcbiAgICAgIHRoaXMuJCgnI3ByZWZlcmVuY2VzLWZvcm0nKS5maW5kKCAnaW5wdXQnICkuZWFjaChmdW5jdGlvbihpLCBlbCkge1xuICAgICAgICBpZiAoJChlbCkuZGF0YSgnY3JlYXRlJykgPT09ICdwcml2YWN5Jykge1xuICAgICAgICAgIHZhciB2YWwgPSAkKGVsKS5wcm9wKCdjaGVja2VkJyk7XG4gICAgICAgICAgZm9ybURhdGFbJ3ByaXZhY3knXSA9IHZhbDtcbiAgICAgICAgfSBlbHNlIGlmICgkKGVsKS52YWwoKSAhPT0gJycgJiYgJChlbCkudmFsKCkgIT09ICdvbicpIHtcbiAgICAgICAgICBmb3JtRGF0YVskKGVsKS5kYXRhKCdjcmVhdGUnKV0gPSAkKGVsKS52YWwoKTtcbiAgICAgICAgICAkKGVsKS52YWwoJycpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGRlbGV0ZSBmb3JtRGF0YS51bmRlZmluZWQ7XG4gICAgICByZXR1cm4gZm9ybURhdGE7XG4gICAgfSxcblxuICAgIHJlbmRlclN0YXR1czogZnVuY3Rpb24oIHN0YXR1cyApIHtcbiAgICAgICQoJyNzdGF0dXMnKS50ZXh0KHN0YXR1cyk7XG4gICAgfSxcblxuICAgIGNsZWFyRmllbGQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kKCcjdXBsb2FkZWQtcHJlZmVyZW5jZXMtaW1hZ2UnKVswXS5zcmMgPSAnJztcbiAgICAgIHRoaXMuJCgnI3ByZWZlcmVuY2VzLWltYWdlLXVwbG9hZCcpLnZhbCgnJyk7XG4gICAgfSxcblxuICAgIGludml0ZVVzZXI6IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHZhciByZWNpcGllbnQgPSAkLnRyaW0oJCgnI2ludml0ZS11c2VyLWlucHV0JykudmFsKCkpO1xuICAgICAgaWYgKGUua2V5Q29kZSA9PT0gMTMgJiYgcmVjaXBpZW50Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgZGVidWdnZXI7XG4gICAgICAgIC8vIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIHNlbmRlciA9IHRoaXMubW9kZWwuZ2V0KCdjdXJyZW50VXNlcicpLFxuICAgICAgICAgICAgcm9vbUlkID0gdGhpcy5tb2RlbC5nZXQoJ2lkJyksXG4gICAgICAgICAgICByb29tTmFtZSA9IHRoaXMubW9kZWwuZ2V0KCduYW1lJyksXG4gICAgICAgICAgICBpbnZpdGF0aW9uT2JqID0ge3NlbmRlcjogc2VuZGVyLCByb29tSWQ6IHJvb21JZCwgcm9vbU5hbWU6IHJvb21OYW1lLCByZWNpcGllbnQ6IHJlY2lwaWVudH07XG4gICAgICAgIHRoaXMudmVudC50cmlnZ2VyKCdpbnZpdGVVc2VyJywgaW52aXRhdGlvbk9iaik7XG4gICAgICAgICQoJyNpbnZpdGUtdXNlci1pbnB1dCcpLnZhbCgnJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnc2VhcmNoIHR5cGluZycpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIHVzZXJTZWFyY2hUeXBlYWhlYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgJCgnI2ludml0ZS11c2VyLWlucHV0JykudHlwZWFoZWFkKHtcbiAgICAgICAgbGltaXQ6IDUsXG4gICAgICAgIG1pbkxlbmd0aDogNSxcbiAgICAgICAgb25TZWxlY3Q6IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhpdGVtKTtcbiAgICAgICAgfSxcbiAgICAgICAgYWpheDoge1xuICAgICAgICAgIHVybDogJy9zZWFyY2hVc2VycycsXG4gICAgICAgICAgdHJpZ2dlckxlbmd0aDogNSxcbiAgICAgICAgICBwcmVEaXNwYXRjaDogZnVuY3Rpb24gKHF1ZXJ5KSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB1c2VybmFtZTogcXVlcnlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSxcbiAgICAgICAgICBwcmVQcm9jZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICAgICAgICBpZiAoZGF0YS5zdWNjZXNzID09PSBmYWxzZSkge1xuICAgICAgICAgICAgLy8gSGlkZSB0aGUgbGlzdCwgdGhlcmUgd2FzIHNvbWUgZXJyb3JcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfSxcblxuICAgIHVzZXJJbnZpdGVkOiBmdW5jdGlvbih1c2VybmFtZSkge1xuICAgICAgZGVidWdnZXI7XG4gICAgICBpZiAodXNlcm5hbWUuZXJyb3IgPT09ICdlcnJvcicpIHtcbiAgICAgICAgJCgnLmludml0ZS11c2VyLWNvbnRhaW5lcicpLmFwcGVuZCh0aGlzLmludml0YXRpb25FcnJvclRlbXBsYXRlKCkpO1xuICAgICAgfVxuICAgICAgJCgnLmludml0ZS11c2VyLWNvbnRhaW5lcicpLmFwcGVuZCh0aGlzLnVzZXJJbnZpdGVkVGVtcGxhdGUoe3VzZXJuYW1lOiB1c2VybmFtZX0pKTtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICQoJy5pbnZpdGUtdXNlci1jb250YWluZXIgLnN1Y2Nlc3MnKS5mYWRlT3V0KDMwMCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoJy5pbnZpdGUtdXNlci1jb250YWluZXIgLmZhaWx1cmUnKS5mYWRlT3V0KDMwMCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9LCAxMDAwKTtcbiAgICB9LFxuXG5cbiAgfSk7XG5cbn0pKGpRdWVyeSk7IiwidmFyIGFwcCA9IGFwcCB8fCB7fTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbiAgYXBwLk5hdmJhclZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgZWw6ICcubG9naW4tbWVudScsXG4gICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI25hdmJhci10ZW1wbGF0ZScpLmh0bWwoKSksXG4gICAgaW52aXRhdGlvblRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoJyNpbnZpdGF0aW9uLXRlbXBsYXRlJykuaHRtbCgpKSxcbiAgICBldmVudHM6IHtcbiAgICAgICdjbGljayAuZGVsZXRlLWludml0YXRpb24nOiAnZGVsZXRlSW52aXRhdGlvbicsXG4gICAgICAnY2xpY2sgLmFjY2VwdC1pbnZpdGF0aW9uJzogJ2FjY2VwdEludml0YXRpb24nLFxuICAgICAgJ2NoYW5nZSAjdXNlci1wcmVmZXJlbmNlcy1pbWFnZS11cGxvYWQnOiAncmVuZGVyVGh1bWInLFxuICAgICAgJ2F0dGFjaEltYWdlICN1c2VyLXByZWZlcmVuY2VzLWZvcm0nOiAndXBsb2FkJyxcbiAgICAgICdjbGljayAjdXNlci1wcmVmZXJlbmNlcy1idG4nOiAnc3VibWl0JyxcbiAgICB9LFxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMudmVudCA9IG9wdGlvbnMudmVudDtcbiAgICAgIHRoaXMubW9kZWwgPSBuZXcgYXBwLlVzZXJNb2RlbCh7IHVzZXJuYW1lOiAnJywgdXNlckltYWdlOiAnJywgaG9tZVJvb206ICcnLCBpbnZpdGF0aW9uczogbmV3IGFwcC5JbnZpdGF0aW9uQ29sbGVjdGlvbigpIH0pO1xuICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLm1vZGVsLCBcImNoYW5nZVwiLCB0aGlzLnJlbmRlciwgdGhpcyk7XG5cbiAgICAgIHZhciBpbnZpdGF0aW9ucyA9IHRoaXMubW9kZWwuZ2V0KCdpbnZpdGF0aW9ucycpO1xuXG4gICAgICB0aGlzLmxpc3RlblRvKGludml0YXRpb25zLCBcInJlc2V0XCIsIHRoaXMucmVuZGVySW52aXRhdGlvbnMsIHRoaXMpO1xuXG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzLm1vZGVsLnRvSlNPTigpKSk7XG4gICAgICB0aGlzLnJlbmRlckludml0YXRpb25zKCk7XG4gICAgICB0aGlzLnNldEhvbWVSb29tVHllcGFoZWFkKCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHJlbmRlckludml0YXRpb25zOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJCgnI2ludml0YXRpb25zJykuZW1wdHkoKTtcbiAgICAgIHZhciBpbnZpdGF0aW9ucyA9IHRoaXMubW9kZWwuZ2V0KCdpbnZpdGF0aW9ucycpO1xuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAgIGludml0YXRpb25zLmVhY2goZnVuY3Rpb24oaW52aXRlKSB7XG4gICAgICAgIHRoaXNfLnJlbmRlckludml0YXRpb24oaW52aXRlKTtcbiAgICAgIH0sIHRoaXMpO1xuICAgICAgaWYgKGludml0YXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aGlzLiQoJyNpbnZpdGF0aW9ucycpLmFwcGVuZChcIjxkaXY+WW91J3ZlIGdvdCBubyBpbnZpdGF0aW9ucywgbGlrZSBkYW5nPC9kaXY+XCIpO1xuICAgICAgfVxuICAgIH0sXG4gICAgcmVuZGVySW52aXRhdGlvbjogZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIHRoaXMuJCgnI2ludml0YXRpb25zJykuYXBwZW5kKHRoaXMuaW52aXRhdGlvblRlbXBsYXRlKG1vZGVsLnRvSlNPTigpKSk7XG4gICAgfSxcbiAgICBkZWxldGVJbnZpdGF0aW9uOiBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgcm9vbUlkID0gJChlLnRhcmdldCkuZGF0YSgncm9vbWlkJyk7XG4gICAgICB0aGlzLnZlbnQudHJpZ2dlcignZGVsZXRlSW52aXRhdGlvbicsIHJvb21JZCk7XG4gICAgfSxcbiAgICBhY2NlcHRJbnZpdGF0aW9uOiBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgcm9vbUlkID0gJChlLnRhcmdldCkuZGF0YSgncm9vbWlkJyk7XG4gICAgICB0aGlzLnZlbnQudHJpZ2dlcignYWNjZXB0SW52aXRhdGlvbicsIHJvb21JZCk7XG4gICAgfSxcblxuXG4gICAgcmVuZGVyVGh1bWI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGlucHV0ID0gdGhpcy4kKCcjdXNlci1wcmVmZXJlbmNlcy1pbWFnZS11cGxvYWQnKTtcbiAgICAgIHZhciBpbWcgPSB0aGlzLiQoJyN1cGxvYWRlZC11c2VyLXByZWZlcmVuY2VzLWltYWdlJylbMF07XG4gICAgICBpZihpbnB1dC52YWwoKSAhPT0gJycpIHtcbiAgICAgICAgdmFyIHNlbGVjdGVkX2ZpbGUgPSBpbnB1dFswXS5maWxlc1swXTtcbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSAoZnVuY3Rpb24oYUltZykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBhSW1nLnNyYyA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICB9O1xuICAgICAgICB9KShpbWcpO1xuICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTCggc2VsZWN0ZWRfZmlsZSApO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgdGhpcy4kZm9ybSA9IHRoaXMuJCgnI3VzZXItcHJlZmVyZW5jZXMtZm9ybScpO1xuICAgICAgdGhpcy4kZm9ybS50cmlnZ2VyKCdhdHRhY2hJbWFnZScpO1xuICAgIH0sXG5cbiAgICB1cGxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHRoaXNfID0gdGhpcztcbiAgICAgICAgdmFyIGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKHRoaXMuJGZvcm1bMF0pO1xuICAgICAgaWYgKHRoaXMuJCgnI3VzZXItcHJlZmVyZW5jZXMtaW1hZ2UtdXBsb2FkJylbMF0uZmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICB1cmw6ICcvdXBkYXRlVXNlckltYWdlJyxcbiAgICAgICAgICBkYXRhOiBmb3JtRGF0YSxcbiAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiggeGhyICkge1xuICAgICAgICAgICAgdGhpc18ucmVuZGVyU3RhdHVzKCdFcnJvcjogJyArIHhoci5zdGF0dXMpO1xuICAgICAgICAgICAgYWxlcnQoJ1lvdXIgaW1hZ2UgaXMgZWl0aGVyIHRvbyBsYXJnZSBvciBpdCBpcyBub3QgYSAuanBlZywgLnBuZywgb3IgLmdpZi4nKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKCByZXNwb25zZSApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdpbWdVcGxvYWQgcmVzcG9uc2U6ICcsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIHZhciBmb3JtID0gdGhpc18uY3JlYXRlVXNlckZvcm1EYXRhKCk7XG4gICAgICAgICAgICBmb3JtLnVzZXJJbWFnZSA9IHJlc3BvbnNlLnVzZXJJbWFnZTtcbiAgICAgICAgICAgIHRoaXNfLnZlbnQudHJpZ2dlcigndXBkYXRlVXNlcicsIGZvcm0pO1xuICAgICAgICAgICAgJCgnI3VzZXItcHJlZmVyZW5jZXMtbW9kYWwnKS5tb2RhbCgnaGlkZScpO1xuICAgICAgICAgICAgdGhpc18uY2xlYXJGaWVsZCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZm9ybSA9IHRoaXMuY3JlYXRlVXNlckZvcm1EYXRhKCk7XG4gICAgICAgIHRoaXMudmVudC50cmlnZ2VyKCd1cGRhdGVVc2VyJywgZm9ybSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIGNyZWF0ZVVzZXJGb3JtRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZm9ybURhdGEgPSB7fTtcbiAgICAgIHRoaXMuJCgnI3VzZXItcHJlZmVyZW5jZXMtZm9ybScpLmZpbmQoICdpbnB1dCcgKS5lYWNoKGZ1bmN0aW9uKGksIGVsKSB7XG4gICAgICAgIGlmICgkKGVsKS5kYXRhKCdjcmVhdGUnKSA9PT0gJ3ByaXZhY3knKSB7XG4gICAgICAgICAgdmFyIHZhbCA9ICQoZWwpLnByb3AoJ2NoZWNrZWQnKTtcbiAgICAgICAgICBmb3JtRGF0YVsncHJpdmFjeSddID0gdmFsO1xuICAgICAgICB9IGVsc2UgaWYgKCQoZWwpLnZhbCgpICE9PSAnJyAmJiAkKGVsKS52YWwoKSAhPT0gJ29uJykge1xuICAgICAgICAgIGZvcm1EYXRhWyQoZWwpLmRhdGEoJ2NyZWF0ZScpXSA9ICQoZWwpLnZhbCgpO1xuICAgICAgICAgICQoZWwpLnZhbCgnJyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgZGVsZXRlIGZvcm1EYXRhLnVuZGVmaW5lZDtcbiAgICAgIHJldHVybiBmb3JtRGF0YTtcbiAgICB9LFxuXG4gICAgY2xlYXJGaWVsZDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiQoJyN1cGxvYWRlZC11c2VyLXByZWZlcmVuY2VzLWltYWdlJylbMF0uc3JjID0gJyc7XG4gICAgICB0aGlzLiQoJyN1c2VyLXByZWZlcmVuY2VzLWltYWdlLXVwbG9hZCcpLnZhbCgnJyk7XG4gICAgfSxcblxuICAgIHNldEhvbWVSb29tVHllcGFoZWFkOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJCgnI3VzZXItcHJlZmVyZW5jZXMtaG9tZS1yb29tLWlucHV0JykudHlwZWFoZWFkKHtcbiAgICAgICAgb25TZWxlY3Q6IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhpdGVtKTtcbiAgICAgICAgfSxcbiAgICAgICAgYWpheDoge1xuICAgICAgICAgIHVybDogJy9hcGkvc2VhcmNoQ2hhdHJvb21zJyxcbiAgICAgICAgICB0cmlnZ2VyTGVuZ3RoOiAxLFxuICAgICAgICAgIGxpbWl0OiA1LFxuICAgICAgICAgIG1pbkxlbmd0aDogNSxcbiAgICAgICAgICBwcmVEaXNwYXRjaDogZnVuY3Rpb24gKHF1ZXJ5KSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBuYW1lOiBxdWVyeVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHByZVByb2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAgICAgICAgIGlmIChkYXRhLnN1Y2Nlc3MgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAvLyBIaWRlIHRoZSBsaXN0LCB0aGVyZSB3YXMgc29tZSBlcnJvclxuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9LFxuXG4gIH0pO1xuXG59KShqUXVlcnkpOyIsInZhciBhcHAgPSBhcHAgfHwge307XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIGFwcC5SZWdpc3RlclZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJCgnI3JlZ2lzdGVyJykuaHRtbCgpKSxcbiAgICB1c2VybmFtZUF2YWlsYWJsZVRlbXBsYXRlOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwidXNlcm5hbWUtYXZhaWxhYmxlIGZhIGZhLWNoZWNrXCI+dXNlcm5hbWUgYXZhaWxhYmxlPC9kaXY+JyksXG4gICAgdXNlcm5hbWVUYWtlblRlbXBsYXRlOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwidXNlcm5hbWUtdGFrZW4gZmEgZmEtdGltZXNcIj51c2VybmFtZSB0YWtlbjwvZGl2PicpLFxuICAgIGV2ZW50czoge1xuICAgICAgXCJjbGljayAjc2lnblVwQnRuXCI6IFwic2lnblVwXCIsXG4gICAgICBcImtleXVwICN1c2VybmFtZVwiOiBcInZhbGlkYXRlVXNlcm5hbWVcIixcbiAgICB9LFxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSxcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKCkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzaWduVXA6IGZ1bmN0aW9uKCkge1xuICAgIH0sXG4gICAgdmFsaWRhdGVVc2VybmFtZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoJCgnI3VzZXJuYW1lJykudmFsKCkubGVuZ3RoIDwgNSkgeyByZXR1cm47IH1cbiAgICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgICBfLmRlYm91bmNlKCQucG9zdCgnL3JlZ2lzdGVyVmFsaWRhdGlvbicsIHsgdXNlcm5hbWU6ICQoJyN1c2VybmFtZScpLnZhbCgpIH0sZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgZGF0YS51c2VybmFtZUF2YWlsYWJsZSA/XG4gICAgICAgICAgIHRoaXNfLnJlbmRlclZhbGlkYXRpb24odGhpc18udXNlcm5hbWVBdmFpbGFibGVUZW1wbGF0ZSgpKVxuICAgICAgICAgOlxuICAgICAgICAgICB0aGlzXy5yZW5kZXJWYWxpZGF0aW9uKHRoaXNfLnVzZXJuYW1lVGFrZW5UZW1wbGF0ZSgpKTtcbiAgICAgIH0pLCAxNTApO1xuICAgIH0sXG4gICAgcmVuZGVyVmFsaWRhdGlvbjogZnVuY3Rpb24od2hhdCkge1xuICAgICAgJCgnLnJlZ2lzdGVyLWVycm9yLWNvbnRhaW5lcicpLmVtcHR5KCk7XG4gICAgICAkKHdoYXQpLmFwcGVuZFRvKCQoJy5yZWdpc3Rlci1lcnJvci1jb250YWluZXInKSkuaGlkZSgpLmZhZGVJbigpO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnLnJlZ2lzdGVyLWVycm9yLWNvbnRhaW5lcicpLmNoaWxkcmVuKCkuZmlyc3QoKS5mYWRlT3V0KCk7XG4gICAgICB9LCAyMDAwKTtcblxuICAgIH1cbiAgfSk7XG5cbn0pKGpRdWVyeSk7IiwiXG4vLyBUaGUgQ2hhdENsaWVudCBpcyBpbXBsZW1lbnRlZCBvbiBtYWluLmpzLlxuLy8gVGhlIGNoYXRjbGllbnQgaXMgYSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBvbiB0aGUgTWFpbkNvbnRyb2xsZXIuXG4vLyBJdCBib3RoIGxpc3RlbnMgdG8gYW5kIGVtaXRzIGV2ZW50cyBvbiB0aGUgc29ja2V0LCBlZzpcbi8vIEl0IGhhcyBpdHMgb3duIG1ldGhvZHMgdGhhdCwgd2hlbiBjYWxsZWQsIGVtaXQgdG8gdGhlIHNvY2tldCB3LyBkYXRhLlxuLy8gSXQgYWxzbyBzZXRzIHJlc3BvbnNlIGxpc3RlbmVycyBvbiBjb25uZWN0aW9uLCB0aGVzZSByZXNwb25zZSBsaXN0ZW5lcnNcbi8vIGxpc3RlbiB0byB0aGUgc29ja2V0IGFuZCB0cmlnZ2VyIGV2ZW50cyBvbiB0aGUgYXBwRXZlbnRCdXMgb24gdGhlIFxuLy8gTWFpbkNvbnRyb2xsZXJcbnZhciBDaGF0Q2xpZW50ID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXG5cdHZhciBzZWxmID0gdGhpcztcblxuXHQvLyBpcy10eXBpbmcgaGVscGVyIHZhcmlhYmxlc1xuXHR2YXIgVFlQSU5HX1RJTUVSX0xFTkdUSCA9IDQwMDsgLy8gbXNcbiAgdmFyIHR5cGluZyA9IGZhbHNlO1xuICB2YXIgbGFzdFR5cGluZ1RpbWU7XG4gIFxuICAvLyB0aGlzIHZlbnQgaG9sZHMgdGhlIGFwcEV2ZW50QnVzXG5cdHNlbGYudmVudCA9IG9wdGlvbnMudmVudDtcblxuXHRzZWxmLmhvc3RuYW1lID0gJ2h0dHA6Ly8nICsgd2luZG93LmxvY2F0aW9uLmhvc3Q7XG5cbiAgLy8gY29ubmVjdHMgdG8gc29ja2V0LCBzZXRzIHJlc3BvbnNlIGxpc3RlbmVyc1xuXHRzZWxmLmNvbm5lY3QgPSBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5jb25uZWN0Jyk7XG5cdFx0Ly8gdGhpcyBpbyBtaWdodCBiZSBhIGxpdHRsZSBjb25mdXNpbmcuLi4gd2hlcmUgaXMgaXQgY29taW5nIGZyb20/XG5cdFx0Ly8gaXQncyBjb21pbmcgZnJvbSB0aGUgc3RhdGljIG1pZGRsZXdhcmUgb24gc2VydmVyLmpzIGJjIGV2ZXJ5dGhpbmdcblx0XHQvLyBpbiB0aGUgL3B1YmxpYyBmb2xkZXIgaGFzIGJlZW4gYXR0YWNoZWQgdG8gdGhlIHNlcnZlciwgYW5kIHZpc2Fcblx0XHQvLyB2ZXJzYS5cblx0XHRzZWxmLnNvY2tldCA9IGlvLmNvbm5lY3Qoc2VsZi5ob3N0bmFtZSk7XG4gICAgc2VsZi5zZXRSZXNwb25zZUxpc3RlbmVycyhzZWxmLnNvY2tldCk7XG4gIH07XG5cblxuICBzZWxmLnJlY29ubmVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIHNlbGYuY29ubmVjdCgpO1xuICB9O1xuXG5cbi8vLy8vIFZpZXdFdmVudEJ1cyBtZXRob2RzIC8vLy9cbiAgICAvLyBtZXRob2RzIHRoYXQgZW1pdCB0byB0aGUgY2hhdHNlcnZlclxuXG4vLyBMT0dJTlxuICBzZWxmLmxvZ2luID0gZnVuY3Rpb24odXNlcikge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmxvZ2luOiAnLCB1c2VyKTtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwibG9naW5cIiwgdXNlcik7XG4gIH07XG5cblxuLy8gUk9PTVxuICBzZWxmLmNvbm5lY3RUb1Jvb20gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuY29ubmVjdFRvUm9vbTogJywgbmFtZSk7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcImNvbm5lY3RUb1Jvb21cIiwgbmFtZSk7XG4gIH07XG4gIHNlbGYuam9pblJvb20gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdCgnam9pblJvb20nLCBuYW1lKTtcbiAgfTtcbiAgc2VsZi5hZGRSb29tID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmFkZFJvb206ICcsIG5hbWUpO1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJhZGRSb29tXCIsIG5hbWUpO1xuICB9O1xuICBzZWxmLnJlbW92ZVJvb20gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYucmVtb3ZlUm9vbTogJywgbmFtZSk7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcInJlbW92ZVJvb21cIiwgbmFtZSk7XG4gIH07XG4gIHNlbGYuY3JlYXRlUm9vbSA9IGZ1bmN0aW9uKGZvcm1EYXRhKSB7XG4gICAgY29uc29sZS5sb2coJ3NjLmYuY3JlYXRlUm9vbTogJywgZm9ybURhdGEpO1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJjcmVhdGVSb29tXCIsIGZvcm1EYXRhKTtcbiAgfTtcbiAgc2VsZi51cGRhdGVSb29tID0gZnVuY3Rpb24oZm9ybURhdGEpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi51cGRhdGVSb29tOiAnLCBmb3JtRGF0YSk7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcInVwZGF0ZVJvb21cIiwgZm9ybURhdGEpO1xuICB9O1xuICBzZWxmLmRlc3Ryb3lSb29tID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGNvbnNvbGUubG9nKCdzYy5mLmRlc3Ryb3lSb29tOiAnLCBuYW1lKTtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwiZGVzdHJveVJvb21cIiwgbmFtZSk7XG4gIH07XG5cblxuXG4vLyBDSEFUXG4gIHNlbGYuY2hhdCA9IGZ1bmN0aW9uKGNoYXQpIHtcbiAgICBjb25zb2xlLmxvZygnc2MuZi5jaGF0OiAnLCBjaGF0KTtcblx0XHRzZWxmLnNvY2tldC5lbWl0KFwiY2hhdFwiLCBjaGF0KTtcblx0fTtcbiAgc2VsZi5nZXRNb3JlQ2hhdHMgPSBmdW5jdGlvbihjaGF0UmVxKSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdCgnZ2V0TW9yZUNoYXRzJywgY2hhdFJlcSk7XG4gIH07XG5cblxuLy8gRElSRUNUIE1FU1NBR0VcbiAgc2VsZi5pbml0RGlyZWN0TWVzc2FnZSA9IGZ1bmN0aW9uKHJlY2lwaWVudCkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoJ2luaXREaXJlY3RNZXNzYWdlJywgcmVjaXBpZW50KTtcbiAgfTtcbiAgc2VsZi5kaXJlY3RNZXNzYWdlID0gZnVuY3Rpb24oZGlyZWN0TWVzc2FnZSkge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoJ2RpcmVjdE1lc3NhZ2UnLCBkaXJlY3RNZXNzYWdlKTtcbiAgfTtcbiAgc2VsZi5nZXRNb3JlRGlyZWN0TWVzc2FnZXMgPSBmdW5jdGlvbihkaXJlY3RNZXNzYWdlUmVxKSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdCgnZ2V0TW9yZURpcmVjdE1lc3NhZ2VzJywgZGlyZWN0TWVzc2FnZVJlcSk7XG4gIH07XG4gIFxuXG4vLyBUWVBJTkdcblx0c2VsZi5hZGRDaGF0VHlwaW5nID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciBtZXNzYWdlID0gZGF0YS51c2VybmFtZSArICcgaXMgdHlwaW5nJztcbiAgICAkKCcudHlwZXR5cGV0eXBlJykudGV4dChtZXNzYWdlKTtcblx0fTtcblx0c2VsZi5yZW1vdmVDaGF0VHlwaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgJCgnLnR5cGV0eXBldHlwZScpLmVtcHR5KCk7XG5cdH07XG4gIHNlbGYudXBkYXRlVHlwaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHNlbGYuc29ja2V0KSB7XG4gICAgICBpZiAoIXR5cGluZykge1xuICAgICAgICB0eXBpbmcgPSB0cnVlO1xuICAgICAgICBzZWxmLnNvY2tldC5lbWl0KCd0eXBpbmcnKTtcbiAgICAgIH1cbiAgICAgIGxhc3RUeXBpbmdUaW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0eXBpbmdUaW1lciA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICAgIHZhciB0aW1lRGlmZiA9IHR5cGluZ1RpbWVyIC0gbGFzdFR5cGluZ1RpbWU7XG4gICAgICAgIGlmICh0aW1lRGlmZiA+PSBUWVBJTkdfVElNRVJfTEVOR1RIICYmIHR5cGluZykge1xuICAgICAgICAgICBzZWxmLnNvY2tldC5lbWl0KCdzdG9wIHR5cGluZycpO1xuICAgICAgICAgICB0eXBpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSwgVFlQSU5HX1RJTUVSX0xFTkdUSCk7XG4gICAgfVxuICB9O1xuXG5cbi8vIElOVklUQVRJT05TXG4gIHNlbGYuaW52aXRlVXNlciA9IGZ1bmN0aW9uKGludml0YXRpb25PYmopIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KFwiaW52aXRlVXNlclwiLCBpbnZpdGF0aW9uT2JqKTtcbiAgfTtcbiAgc2VsZi5kZWxldGVJbnZpdGF0aW9uID0gZnVuY3Rpb24ocm9vbUlkKSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcImRlbGV0ZUludml0YXRpb25cIiwgcm9vbUlkKTtcbiAgfTtcbiAgc2VsZi5hY2NlcHRJbnZpdGF0aW9uID0gZnVuY3Rpb24ocm9vbUlkKSB7XG4gICAgc2VsZi5zb2NrZXQuZW1pdChcImFjY2VwdEludml0YXRpb25cIiwgcm9vbUlkKTtcbiAgfTtcblxuLy8gVVBEQVRFIFVTRVJcbiAgc2VsZi51cGRhdGVVc2VyID0gZnVuY3Rpb24odXNlck9iaikge1xuICAgIHNlbGYuc29ja2V0LmVtaXQoXCJ1cGRhdGVVc2VyXCIsIHVzZXJPYmopO1xuICB9O1xuXG5cblxuLy8gRVJST1IgSEFORExJTkdcbiAgc2VsZi5kb2VzQ2hhdHJvb21FeGlzdCA9IGZ1bmN0aW9uKGNoYXRyb29tUXVlcnkpIHtcbiAgICBzZWxmLnNvY2tldC5lbWl0KCdkb2VzQ2hhdHJvb21FeGlzdCcsIGNoYXRyb29tUXVlcnkpO1xuICB9O1xuXG5cbiAgXG5cblxuXG5cbiAgLy8vLy8vLy8vLy8vLy8gY2hhdHNlcnZlciBsaXN0ZW5lcnMvLy8vLy8vLy8vLy8vXG5cbiAgLy8gdGhlc2UgZ3V5cyBsaXN0ZW4gdG8gdGhlIGNoYXRzZXJ2ZXIvc29ja2V0IGFuZCBlbWl0IGRhdGEgdG8gbWFpbi5qcyxcbiAgLy8gc3BlY2lmaWNhbGx5IHRvIHRoZSBhcHBFdmVudEJ1cy5cblx0c2VsZi5zZXRSZXNwb25zZUxpc3RlbmVycyA9IGZ1bmN0aW9uKHNvY2tldCkge1xuXG5cbi8vIExPR0lOXG4gICAgc29ja2V0Lm9uKCdsb2dpbicsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLmxvZ2luJyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcignbG9naW5Vc2VyJywgdXNlcik7XG4gICAgICBzZWxmLmNvbm5lY3RUb1Jvb20odXNlci5ob21lUm9vbSk7XG4gICAgfSk7XG5cblxuLy8gQ0hBVFxuXHRcdHNvY2tldC5vbigndXNlckpvaW5lZCcsIGZ1bmN0aW9uKHVzZXIpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdzYy5lLnVzZXJKb2luZWQ6ICcsIHVzZXIpO1xuICAgICAgLy8gc29ja2V0LmVtaXQoXCJvbmxpbmVVc2Vyc1wiKTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwidXNlckpvaW5lZFwiLCB1c2VyKTtcblx0XHR9KTtcblx0XHRzb2NrZXQub24oJ3VzZXJMZWZ0JywgZnVuY3Rpb24odXNlcikge1xuXHRcdFx0Y29uc29sZS5sb2coJ3NjLmUudXNlckxlZnQ6ICcsIHVzZXIpO1xuICAgICAgLy8gc29ja2V0LmVtaXQoXCJvbmxpbmVVc2Vyc1wiKTtcblx0XHRcdHNlbGYudmVudC50cmlnZ2VyKFwidXNlckxlZnRcIiwgdXNlcik7XG5cdFx0fSk7XG5cdFx0c29ja2V0Lm9uKCdjaGF0JywgZnVuY3Rpb24oY2hhdCkge1xuXHRcdFx0Y29uc29sZS5sb2coJ3NjLmUuY2hhdDogJywgY2hhdCk7XG5cdFx0XHRzZWxmLnZlbnQudHJpZ2dlcihcImNoYXRSZWNlaXZlZFwiLCBjaGF0KTtcblx0XHR9KTtcbiAgICBzb2NrZXQub24oJ21vcmVDaGF0cycsIGZ1bmN0aW9uKGNoYXRzKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcIm1vcmVDaGF0c1wiLCBjaGF0cyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdub01vcmVDaGF0cycsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJub01vcmVDaGF0c1wiKTtcbiAgICB9KTtcblxuXG4vLyBESVJFQ1QgTUVTU0FHRVxuICAgIHNvY2tldC5vbignc2V0RGlyZWN0TWVzc2FnZUNoYXRsb2cnLCBmdW5jdGlvbihjaGF0bG9nKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldERNY2hhdGxvZ1wiLCBjaGF0bG9nKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ3NldERpcmVjdE1lc3NhZ2VIZWFkZXInLCBmdW5jdGlvbihoZWFkZXIpIHtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0RE1oZWFkZXJcIiwgaGVhZGVyKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ2RpcmVjdE1lc3NhZ2UnLCBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAvLyBzZWxmLnZlbnQudHJpZ2dlcihcInJlbmRlckRpcmVjdE1lc3NhZ2VcIiwgRE0pO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJkaXJlY3RNZXNzYWdlUmVjZWl2ZWRcIiwgbWVzc2FnZSk7XG4gICAgfSk7XG5cblxuXG4vLyBUWVBJTkdcbiAgICBzb2NrZXQub24oJ3R5cGluZycsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHNlbGYuYWRkQ2hhdFR5cGluZyhkYXRhKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ3N0b3AgdHlwaW5nJywgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnJlbW92ZUNoYXRUeXBpbmcoKTtcbiAgICB9KTtcblxuXG4vLyBTRVQgUk9PTVxuICAgIHNvY2tldC5vbignY2hhdGxvZycsIGZ1bmN0aW9uKGNoYXRsb2cpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLmNoYXRsb2c6ICcsIGNoYXRsb2cpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRDaGF0bG9nXCIsIGNoYXRsb2cpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbignY2hhdHJvb21zJywgZnVuY3Rpb24oY2hhdHJvb21zKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5jaGF0cm9vbXM6ICAnLCBjaGF0cm9vbXMpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRDaGF0cm9vbXNcIiwgY2hhdHJvb21zKTtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oJ3ByaXZhdGVSb29tcycsIGZ1bmN0aW9uKHJvb21zKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5wcml2YXRlUm9vbXM6ICAnLCByb29tcyk7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldFByaXZhdGVSb29tc1wiLCByb29tcyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdvbmxpbmVVc2VycycsIGZ1bmN0aW9uKG9ubGluZVVzZXJzKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5vbmxpbmVVc2VyczogJywgb25saW5lVXNlcnMpO1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJzZXRPbmxpbmVVc2Vyc1wiLCBvbmxpbmVVc2Vycyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdvZmZsaW5lVXNlcnMnLCBmdW5jdGlvbihvZmZsaW5lVXNlcnMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdzYy5lLm9mZmxpbmVVc2VyczogJywgb2ZmbGluZVVzZXJzKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwic2V0T2ZmbGluZVVzZXJzXCIsIG9mZmxpbmVVc2Vycyk7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKCdjaGF0cm9vbUhlYWRlcicsIGZ1bmN0aW9uKGhlYWRlck9iaikge1xuICAgICAgY29uc29sZS5sb2coJ3NjLmUuY2hhdHJvb21IZWFkZXI6ICcsIGhlYWRlck9iaik7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInNldENoYXRyb29tSGVhZGVyXCIsIGhlYWRlck9iaik7XG4gICAgfSk7XG5cblxuLy8gTU9ESUZZIFJPT01cbiAgICBzb2NrZXQub24oJ3Jvb21EZXN0cm95ZWQnLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgICBjb25zb2xlLmxvZygnc2MuZS5yb29tRGVzdHJveWVkOiAnLCBuYW1lKTtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKFwicm9vbURlc3Ryb3llZFwiLCBuYW1lKTtcbiAgICB9KTtcblxuLy8gQ1JFQVRFIFJPT01cbiAgICBzb2NrZXQub24oJ2NoYXRyb29tQXZhaWxhYmlsaXR5JywgZnVuY3Rpb24oYXZhaWxhYmlsdHkpIHtcbiAgICAgIHNlbGYudmVudC50cmlnZ2VyKCdjaGF0cm9vbUF2YWlsYWJpbGl0eScsIGF2YWlsYWJpbHR5KTtcbiAgICB9KTtcblxuLy8gRVJST1IgSEFORExJTkdcbiAgICBzb2NrZXQub24oJ2NoYXRyb29tQWxyZWFkeUV4aXN0cycsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJjaGF0cm9vbUFscmVhZHlFeGlzdHNcIik7XG4gICAgfSk7XG5cbi8vIElOVklUQVRJT05TXG4gICAgc29ja2V0Lm9uKCdyZWZyZXNoSW52aXRhdGlvbnMnLCBmdW5jdGlvbihpbnZpdGF0aW9ucykge1xuICAgICAgc2VsZi52ZW50LnRyaWdnZXIoXCJyZWZyZXNoSW52aXRhdGlvbnNcIiwgaW52aXRhdGlvbnMpO1xuICAgIH0pO1xuICAgIHNvY2tldC5vbigndXNlckludml0ZWQnLCBmdW5jdGlvbih1c2VyKSB7XG4gICAgICBzZWxmLnZlbnQudHJpZ2dlcihcInVzZXJJbnZpdGVkXCIsIHVzZXIpO1xuICAgIH0pO1xuXG4gICBzb2NrZXQub24oJ3JlY29ubmVjdCcsIGZ1bmN0aW9uKCkge1xuICAgICBzZWxmLnJlY29ubmVjdCgpO1xuICAgfSk7XG5cblx0fTtcbn07IiwiXG5cbmFwcC5NYWluQ29udHJvbGxlciA9IGZ1bmN0aW9uKCkge1xuXG5cdHZhciBzZWxmID0gdGhpcztcblxuXG4gIC8vVGhlc2UgYWxsb3dzIHVzIHRvIGJpbmQgYW5kIHRyaWdnZXIgb24gdGhlIG9iamVjdCBmcm9tIGFueXdoZXJlIGluIHRoZSBhcHAuXG5cdHNlbGYuYXBwRXZlbnRCdXMgPSBfLmV4dGVuZCh7fSwgQmFja2JvbmUuRXZlbnRzKTtcblx0c2VsZi52aWV3RXZlbnRCdXMgPSBfLmV4dGVuZCh7fSwgQmFja2JvbmUuRXZlbnRzKTtcblxuXHRzZWxmLmluaXQgPSBmdW5jdGlvbigpIHtcblxuICAgIC8vIGxvZ2luTW9kZWxcbiAgICBzZWxmLmxvZ2luTW9kZWwgPSBuZXcgYXBwLkxvZ2luTW9kZWwoKTtcbiAgICBzZWxmLmxvZ2luVmlldyA9IG5ldyBhcHAuTG9naW5WaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cywgbW9kZWw6IHNlbGYubG9naW5Nb2RlbH0pO1xuICAgIHNlbGYucmVnaXN0ZXJWaWV3ID0gbmV3IGFwcC5SZWdpc3RlclZpZXcoe3ZlbnQ6IHNlbGYudmlld0V2ZW50QnVzIH0pO1xuICAgIHNlbGYubmF2YmFyVmlldyA9IG5ldyBhcHAuTmF2YmFyVmlldyh7dmVudDogc2VsZi52aWV3RXZlbnRCdXN9KTtcblxuXG4gICAgLy8gVGhlIENvbnRhaW5lck1vZGVsIGdldHMgcGFzc2VkIGEgdmlld1N0YXRlLCBMb2dpblZpZXcsIHdoaWNoXG4gICAgLy8gaXMgdGhlIGxvZ2luIHBhZ2UuIFRoYXQgTG9naW5WaWV3IGdldHMgcGFzc2VkIHRoZSB2aWV3RXZlbnRCdXNcbiAgICAvLyBhbmQgdGhlIExvZ2luTW9kZWwuXG4gICAgc2VsZi5jb250YWluZXJNb2RlbCA9IG5ldyBhcHAuQ29udGFpbmVyTW9kZWwoeyB2aWV3U3RhdGU6IHNlbGYubG9naW5WaWV3fSk7XG5cbiAgICAvLyBuZXh0LCBhIG5ldyBDb250YWluZXJWaWV3IGlzIGludGlhbGl6ZWQgd2l0aCB0aGUgbmV3bHkgY3JlYXRlZCBjb250YWluZXJNb2RlbFxuICAgIC8vIHRoZSBsb2dpbiBwYWdlIGlzIHRoZW4gcmVuZGVyZWQuXG4gICAgc2VsZi5jb250YWluZXJWaWV3ID0gbmV3IGFwcC5Db250YWluZXJWaWV3KHsgbW9kZWw6IHNlbGYuY29udGFpbmVyTW9kZWwgfSk7XG4gICAgc2VsZi5jb250YWluZXJWaWV3LnJlbmRlcigpO1xuXG4gXG4gICAgJCgnZm9ybScpLmtleXByZXNzKGZ1bmN0aW9uKGUpIHtcbiAgICAgIHJldHVybiBlLmtleUNvZGUgIT0gMTM7XG4gICAgfSk7XG5cblxuICB9O1xuXG5cbiAgc2VsZi5hdXRoZW50aWNhdGVkID0gZnVuY3Rpb24oKSB7XG5cbiAgICBjb25zb2xlLmxvZygnZi5tYWluLmF1dGhlbnRpY2F0ZWQnKTtcbiAgICAgICBcbiAgICAkKFwiYm9keVwiKS5jc3MoXCJvdmVyZmxvd1wiLCBcImhpZGRlblwiKTtcbiAgICAkKCdmb3JtJykua2V5cHJlc3MoZnVuY3Rpb24oZSkge1xuICAgICAgcmV0dXJuIGUua2V5Q29kZSAhPSAxMztcbiAgICB9KTtcbiAgICBzZWxmLmNoYXRDbGllbnQgPSBuZXcgQ2hhdENsaWVudCh7IHZlbnQ6IHNlbGYuYXBwRXZlbnRCdXMgfSk7XG4gICAgICAgICAgY29uc29sZS5sb2coJ2h1aCcpO1xuICAgIHNlbGYuY2hhdENsaWVudC5jb25uZWN0KCk7XG5cbiAgICAvLyBuZXcgbW9kZWwgYW5kIHZpZXcgY3JlYXRlZCBmb3IgY2hhdHJvb21cbiAgICBzZWxmLmNoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoeyBuYW1lOiAnUGFybG9yJyB9KTtcbiAgICBzZWxmLmNoYXRyb29tTGlzdCA9IG5ldyBhcHAuQ2hhdHJvb21MaXN0KCk7XG4gICAgc2VsZi5wcml2YXRlUm9vbUNvbGxlY3Rpb24gPSBuZXcgYXBwLlByaXZhdGVSb29tQ29sbGVjdGlvbigpO1xuICAgIHNlbGYuY2hhdHJvb21MaXN0LmZldGNoKCkuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zZXQoJ2NoYXRyb29tcycsIHNlbGYuY2hhdHJvb21MaXN0KTtcbiAgICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zZXQoJ3ByaXZhdGVSb29tcycsIHNlbGYucHJpdmF0ZVJvb21Db2xsZWN0aW9uKTtcbiAgICAgIHNlbGYuY2hhdHJvb21WaWV3ICA9IG5ldyBhcHAuQ2hhdHJvb21WaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cywgbW9kZWw6IHNlbGYuY2hhdHJvb21Nb2RlbCB9KTtcbiAgICAgIHNlbGYuY29udGFpbmVyTW9kZWwuc2V0KCd2aWV3U3RhdGUnLCBzZWxmLmNoYXRyb29tVmlldyk7XG4gICAgICBcblxuICAgICAgLy8gc2VsZi5jb25uZWN0VG9Sb29tKCk7XG4gICAgICAvLyBzZWxmLmluaXRSb29tKCk7XG4gICAgICAgICAgIC8vIDtcbiAgICB9KTtcblxuICB9O1xuXG4gIC8vIHNlbGYuY29ubmVjdFRvUm9vbSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIC8vICAgY29uc29sZS5sb2coJ2YubWFpbi5jb25uZWN0VG9Sb29tJyk7XG4gIC8vICAgc2VsZi5jaGF0Q2xpZW50LmNvbm5lY3RUb1Jvb20oXCJQYXJsb3JcIik7XG4gIC8vIH07XG5cbiAgLy8gc2VsZi5pbml0Um9vbSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIC8vICAgc2VsZi5jaGF0cm9vbVZpZXcuaW5pdFJvb20oKTtcbiAgLy8gfTtcblxuXG5cblxuXG4gIC8vLy8vLy8vLy8vLyAgQnVzc2VzIC8vLy8vLy8vLy8vL1xuICAgIC8vIFRoZXNlIEJ1c3NlcyBsaXN0ZW4gdG8gdGhlIHNvY2tldGNsaWVudFxuICAgLy8gICAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblxuICAvLy8vIHZpZXdFdmVudEJ1cyBMaXN0ZW5lcnMgLy8vLy9cbiAgXG5cdHNlbGYudmlld0V2ZW50QnVzLm9uKFwibG9naW5cIiwgZnVuY3Rpb24odXNlcikge1xuICAgIHNlbGYuY2hhdENsaWVudC5sb2dpbih1c2VyKTtcbiAgfSk7XG5cdHNlbGYudmlld0V2ZW50QnVzLm9uKFwiY2hhdFwiLCBmdW5jdGlvbihjaGF0KSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmNoYXQoY2hhdCk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcInR5cGluZ1wiLCBmdW5jdGlvbigpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQudXBkYXRlVHlwaW5nKCk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImpvaW5Sb29tXCIsIGZ1bmN0aW9uKHJvb20pIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuam9pblJvb20ocm9vbSk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImFkZFJvb21cIiwgZnVuY3Rpb24ocm9vbSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5hZGRSb29tKHJvb20pO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJyZW1vdmVSb29tXCIsIGZ1bmN0aW9uKHJvb20pIHtcbiAgICBzZWxmLmNoYXRDbGllbnQucmVtb3ZlUm9vbShyb29tKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiY3JlYXRlUm9vbVwiLCBmdW5jdGlvbihmb3JtRGF0YSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5jcmVhdGVSb29tKGZvcm1EYXRhKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwidXBkYXRlUm9vbVwiLCBmdW5jdGlvbihmb3JtRGF0YSkge1xuICAgIHNlbGYuY2hhdENsaWVudC51cGRhdGVSb29tKGZvcm1EYXRhKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiZGVzdHJveVJvb21cIiwgZnVuY3Rpb24ocm9vbSkge1xuICAgIHNlbGYuY2hhdENsaWVudC5kZXN0cm95Um9vbShyb29tKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiZ2V0TW9yZUNoYXRzXCIsIGZ1bmN0aW9uKGNoYXRSZXEpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuZ2V0TW9yZUNoYXRzKGNoYXRSZXEpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJkb2VzQ2hhdHJvb21FeGlzdFwiLCBmdW5jdGlvbihjaGF0cm9vbVF1ZXJ5KSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmRvZXNDaGF0cm9vbUV4aXN0KGNoYXRyb29tUXVlcnkpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJpbml0RGlyZWN0TWVzc2FnZVwiLCBmdW5jdGlvbihyZWNpcGllbnQpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuaW5pdERpcmVjdE1lc3NhZ2UocmVjaXBpZW50KTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiZGlyZWN0TWVzc2FnZVwiLCBmdW5jdGlvbihkaXJlY3RNZXNzYWdlKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmRpcmVjdE1lc3NhZ2UoZGlyZWN0TWVzc2FnZSk7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImdldE1vcmVEaXJlY3RNZXNzYWdlc1wiLCBmdW5jdGlvbihkaXJlY3RNZXNzYWdlUmVxKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmdldE1vcmVEaXJlY3RNZXNzYWdlcyhkaXJlY3RNZXNzYWdlUmVxKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiaW52aXRlVXNlclwiLCBmdW5jdGlvbihpbnZpdGF0aW9uT2JqKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50Lmludml0ZVVzZXIoaW52aXRhdGlvbk9iaik7XG4gIH0pO1xuICBzZWxmLnZpZXdFdmVudEJ1cy5vbihcImRlbGV0ZUludml0YXRpb25cIiwgZnVuY3Rpb24ocm9vbUlkKSB7XG4gICAgc2VsZi5jaGF0Q2xpZW50LmRlbGV0ZUludml0YXRpb24ocm9vbUlkKTtcbiAgfSk7XG4gIHNlbGYudmlld0V2ZW50QnVzLm9uKFwiYWNjZXB0SW52aXRhdGlvblwiLCBmdW5jdGlvbihyb29tSWQpIHtcbiAgICBzZWxmLmNoYXRDbGllbnQuYWNjZXB0SW52aXRhdGlvbihyb29tSWQpO1xuICB9KTtcbiAgc2VsZi52aWV3RXZlbnRCdXMub24oXCJ1cGRhdGVVc2VyXCIsIGZ1bmN0aW9uKHVzZXJPYmopIHtcbiAgICBzZWxmLmNoYXRDbGllbnQudXBkYXRlVXNlcih1c2VyT2JqKTtcbiAgfSk7XG5cblxuXG5cblxuXG4gIC8vLy8gYXBwRXZlbnRCdXMgTGlzdGVuZXJzIC8vLy9cblxuXHQvLyBzZWxmLmFwcEV2ZW50QnVzLm9uKFwidXNlcnNJbmZvXCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAvLyAgICBjb25zb2xlLmxvZygnbWFpbi5lLnVzZXJzSW5mbzogJywgZGF0YSk7XG4gLy8gICAgLy9kYXRhIGlzIGFuIGFycmF5IG9mIHVzZXJuYW1lcywgaW5jbHVkaW5nIHRoZSBuZXcgdXNlclxuXHQvLyBcdC8vIFRoaXMgbWV0aG9kIGdldHMgdGhlIG9ubGluZSB1c2VycyBjb2xsZWN0aW9uIGZyb20gY2hhdHJvb21Nb2RlbC5cblx0Ly8gXHQvLyBvbmxpbmVVc2VycyBpcyB0aGUgY29sbGVjdGlvblxuXHQvLyBcdHZhciBvbmxpbmVVc2VycyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoXCJvbmxpbmVVc2Vyc1wiKTtcbiAvLyAgICBjb25zb2xlLmxvZyhcIi4uLm9ubGluZVVzZXJzOiBcIiwgb25saW5lVXNlcnMpO1xuXHQvLyBcdHZhciB1c2VycyA9IF8ubWFwKGRhdGEsIGZ1bmN0aW9uKGl0ZW0pIHtcblx0Ly8gXHRcdHJldHVybiBuZXcgYXBwLlVzZXJNb2RlbCh7dXNlcm5hbWU6IGl0ZW19KTtcblx0Ly8gXHR9KTtcbiAvLyAgICBjb25zb2xlLmxvZyhcInVzZXJzOiBcIiwgdXNlcnMpO1xuXHQvLyBcdG9ubGluZVVzZXJzLnJlc2V0KHVzZXJzKTtcblx0Ly8gfSk7XG5cbiAvLyAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInJvb21JbmZvXCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAvLyAgICBkZWJ1Z2dlcjtcbiAvLyAgICBjb25zb2xlLmxvZygnbWFpbi5lLnJvb21JbmZvOiAnLCBkYXRhKTtcbiAvLyAgICB2YXIgcm9vbXMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KFwiY2hhdHJvb21zXCIpO1xuIC8vICAgICBjb25zb2xlLmxvZyhcIi4uLnJvb21zOiBcIiwgcm9vbXMpO1xuIC8vICAgIHZhciB1cGRhdGVkUm9vbXMgPSBfLm1hcChkYXRhLCBmdW5jdGlvbihyb29tKSB7XG4gLy8gICAgICB2YXIgbmV3Q2hhdHJvb21Nb2RlbCA9IG5ldyBhcHAuQ2hhdHJvb21Nb2RlbCh7bmFtZTogcm9vbX0pO1xuIC8vICAgICAgcmV0dXJuIG5ld0NoYXRyb29tTW9kZWw7XG4gLy8gICAgfSk7XG4gLy8gICAgY29uc29sZS5sb2coXCIuLi51cGRhdGVkcm9vbXM6IFwiLCB1cGRhdGVkUm9vbXMpO1xuIC8vICAgIHJvb21zLnJlc2V0KHVwZGF0ZWRSb29tcyk7XG4gLy8gIH0pO1xuXG5cblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwibG9naW5Vc2VyXCIsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICBjb25zb2xlLmxvZygnbWFpbi5lLmxvZ2luVXNlcjogJywgdXNlcik7XG4gICAgaW52aXRhdGlvbnMgPSBzZWxmLm5hdmJhclZpZXcubW9kZWwuZ2V0KCdpbnZpdGF0aW9ucycpO1xuICAgIG5ld0ludml0YXRpb25zID0gXy5tYXAodXNlci5pbnZpdGF0aW9ucywgZnVuY3Rpb24oaW52aXRlKSB7XG4gICAgICAgdmFyIG5ld0ludml0YXRpb24gPSBuZXcgYXBwLkludml0YXRpb25Nb2RlbChpbnZpdGUpO1xuICAgICAgIHJldHVybiBuZXdJbnZpdGF0aW9uO1xuICAgIH0pO1xuICAgIGludml0YXRpb25zLnJlc2V0KG5ld0ludml0YXRpb25zKTtcbiAgICBzZWxmLm5hdmJhclZpZXcubW9kZWwuc2V0KHsgJ3VzZXJuYW1lJzogdXNlci51c2VybmFtZSwgJ2hvbWVSb29tJzogdXNlci5ob21lUm9vbSwgJ3VzZXJJbWFnZSc6IHVzZXIudXNlckltYWdlIH0pO1xuICB9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwicmVmcmVzaEludml0YXRpb25zXCIsIGZ1bmN0aW9uKGludml0YXRpb25zKSB7XG4gICAgY29uc29sZS5sb2coJ21haW4uZS5yZWZyZXNoSW52aXRhdGlvbnM6ICcsIGludml0YXRpb25zKTtcbiAgICBvbGRJbnZpdGF0aW9ucyA9IHNlbGYubmF2YmFyVmlldy5tb2RlbC5nZXQoJ2ludml0YXRpb25zJyk7XG4gICAgbmV3SW52aXRhdGlvbnMgPSBfLm1hcChpbnZpdGF0aW9ucywgZnVuY3Rpb24oaW52aXRlKSB7XG4gICAgICAgdmFyIG5ld0ludml0YXRpb24gPSBuZXcgYXBwLkludml0YXRpb25Nb2RlbChpbnZpdGUpO1xuICAgICAgIHJldHVybiBuZXdJbnZpdGF0aW9uO1xuICAgIH0pO1xuICAgIG9sZEludml0YXRpb25zLnJlc2V0KG5ld0ludml0YXRpb25zKTtcbiAgfSk7XG5cblxuICAvLyBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0Um9vbVwiLCBmdW5jdGlvbihtb2RlbCkge1xuICAvLyAgIGNvbnNvbGUubG9nKCdtYWluLmUuc2V0Um9vbTogJywgbW9kZWwpO1xuXG4gIC8vICAgdmFyIGNoYXRsb2cgPSBuZXcgYXBwLkNoYXRDb2xsZWN0aW9uKG1vZGVsLmNoYXRsb2cpO1xuICAvLyAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zZXQoJ2NoYXRsb2cnLCBjaGF0bG9nKTtcblxuICAvLyAgIHZhciByb29tcyA9IG5ldyBhcHAuQ2hhdHJvb21MaXN0KG1vZGVsLmNoYXRyb29tcyk7XG4gIC8vICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnY2hhdHJvb21zJywgcm9vbXMpO1xuXG4gIC8vICAgdmFyIHVzZXJzID0gbmV3IGFwcC5Vc2VyQ29sbGVjdGlvbihtb2RlbC5vbmxpbmVVc2Vycyk7XG4gIC8vICAgc2VsZi5jaGF0cm9vbU1vZGVsLnNldCgnb25saW5lVXNlcnMnLCB1c2Vycyk7XG5cbiAgLy8gfSk7XG5cblxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJDaGF0cm9vbU1vZGVsXCIsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgY29uc29sZS5sb2coJ21haW4uZS5DaGF0cm9vbU1vZGVsOiAnLCBtb2RlbCk7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsID0gbmV3IGFwcC5DaGF0cm9vbU1vZGVsKCk7XG4gICAgc2VsZi5jaGF0cm9vbUxpc3QgPSBuZXcgYXBwLkNoYXRyb29tTGlzdCgpO1xuICAgIHNlbGYuY2hhdHJvb21WaWV3ICA9IG5ldyBhcHAuQ2hhdHJvb21WaWV3KHt2ZW50OiBzZWxmLnZpZXdFdmVudEJ1cywgbW9kZWw6IHNlbGYuY2hhdHJvb21Nb2RlbCwgY29sbGVjdGlvbjogc2VsZi5jaGF0cm9vbUxpc3R9KTtcbiAgICBzZWxmLmNvbnRhaW5lck1vZGVsLnNldCgndmlld1N0YXRlJywgc2VsZi5jaGF0cm9vbVZpZXcpO1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5sb2FkTW9kZWwobW9kZWwpO1xuICB9KTtcblxuXG5cbiAgLy8gYWRkcyBuZXcgdXNlciB0byB1c2VycyBjb2xsZWN0aW9uLCBzZW5kcyBkZWZhdWx0IGpvaW5pbmcgbWVzc2FnZVxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwidXNlckpvaW5lZFwiLCBmdW5jdGlvbih1c2VyKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdtYWluLmUudXNlckpvaW5lZDogJywgdXNlcik7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLmFkZFVzZXIodXNlcik7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLmFkZENoYXQoe3NlbmRlcjogXCJCdXR0ZXJzXCIsIG1lc3NhZ2U6IHVzZXIudXNlcm5hbWUgKyBcIiBqb2luZWQgcm9vbS5cIiB9KTtcblx0fSk7XG5cblx0Ly8gcmVtb3ZlcyB1c2VyIGZyb20gdXNlcnMgY29sbGVjdGlvbiwgc2VuZHMgZGVmYXVsdCBsZWF2aW5nIG1lc3NhZ2Vcblx0c2VsZi5hcHBFdmVudEJ1cy5vbihcInVzZXJMZWZ0XCIsIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ21haW4uZS51c2VyTGVmdDogJywgdXNlcik7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLnJlbW92ZVVzZXIodXNlcik7XG5cdFx0c2VsZi5jaGF0cm9vbU1vZGVsLmFkZENoYXQoe3NlbmRlcjogXCJCdXR0ZXJzXCIsIG1lc3NhZ2U6IHVzZXIudXNlcm5hbWUgKyBcIiBsZWZ0IHJvb20uXCIgfSk7XG5cdH0pO1xuXG5cdC8vIGNoYXQgcGFzc2VkIGZyb20gc29ja2V0Y2xpZW50LCBhZGRzIGEgbmV3IGNoYXQgbWVzc2FnZSB1c2luZyBjaGF0cm9vbU1vZGVsIG1ldGhvZFxuXHRzZWxmLmFwcEV2ZW50QnVzLm9uKFwiY2hhdFJlY2VpdmVkXCIsIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwuYWRkQ2hhdChjaGF0KTtcblx0XHQkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcblx0fSk7XG5cblxuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInJvb21EZXN0cm95ZWRcIiwgZnVuY3Rpb24obmFtZSkge1xuICAgIHNlbGYuY29ubmVjdFRvUm9vbSgpO1xuICAgIC8vIHNlbGYuaW5pdFJvb20oKTtcbiAgICAvLyBhbGVydCgnQ2hhdHJvb20gJyArIG5hbWUgKyAnIGRlc3Ryb3llZCcpO1xuICB9KTtcblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwic2V0Q2hhdHJvb21IZWFkZXJcIiwgZnVuY3Rpb24oaGVhZGVyT2JqKSB7XG4gICAgdmFyIG5ld0hlYWRlciA9IG5ldyBhcHAuQ2hhdHJvb21IZWFkZXJNb2RlbChoZWFkZXJPYmopO1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC5zZXQoJ2NoYXRyb29tJywgbmV3SGVhZGVyKTtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldENoYXRsb2dcIiwgZnVuY3Rpb24oY2hhdGxvZykge1xuICAgIHZhciBvbGRDaGF0bG9nID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldCgnY2hhdGxvZycpO1xuICAgIHZhciB1cGRhdGVkQ2hhdGxvZyA9IF8ubWFwKGNoYXRsb2csIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICAgIHZhciBuZXdDaGF0TW9kZWwgPSBuZXcgYXBwLkNoYXRNb2RlbCh7IHJvb206IGNoYXQucm9vbSwgbWVzc2FnZTogY2hhdC5tZXNzYWdlLCBzZW5kZXI6IGNoYXQuc2VuZGVyLCB0aW1lc3RhbXA6IGNoYXQudGltZXN0YW1wLCB1cmw6IGNoYXQudXJsIH0pO1xuICAgICAgcmV0dXJuIG5ld0NoYXRNb2RlbDtcbiAgICB9KTtcbiAgICBvbGRDaGF0bG9nLnJlc2V0KHVwZGF0ZWRDaGF0bG9nKTtcbiAgICQoJyNtZXNzYWdlLWlucHV0JykucmVtb3ZlQ2xhc3MoJ2RpcmVjdC1tZXNzYWdlLWlucHV0JykuYWRkQ2xhc3MoJ21lc3NhZ2UtaW5wdXQnKTtcbiAgICAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcIm1vcmVDaGF0c1wiLCBmdW5jdGlvbihjaGF0bG9nKSB7XG4gICAgdmFyIG9sZENoYXRsb2cgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KCdjaGF0bG9nJyk7XG4gICAgdmFyIG1vcmVDaGF0bG9nID0gXy5tYXAoY2hhdGxvZywgZnVuY3Rpb24oY2hhdCkge1xuICAgICAgdmFyIG5ld0NoYXRNb2RlbCA9IG5ldyBhcHAuQ2hhdE1vZGVsKHsgcm9vbTogY2hhdC5yb29tLCBtZXNzYWdlOiBjaGF0Lm1lc3NhZ2UsIHNlbmRlcjogY2hhdC5zZW5kZXIsIHRpbWVzdGFtcDogY2hhdC50aW1lc3RhbXAsIHVybDogY2hhdC51cmwgfSk7XG4gICAgICByZXR1cm4gbmV3Q2hhdE1vZGVsO1xuICAgIH0pO1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC50cmlnZ2VyKCdtb3JlQ2hhdHMnLCBtb3JlQ2hhdGxvZyk7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJub01vcmVDaGF0c1wiLCBmdW5jdGlvbihjaGF0bG9nKSB7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLnN0b3BMaXN0ZW5pbmcoJ21vcmVDaGF0cycpO1xuICB9KTtcbiAgXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRDaGF0cm9vbXNcIiwgZnVuY3Rpb24oY2hhdHJvb21zKSB7XG4gICAgdmFyIG9sZENoYXRyb29tcyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoJ2NoYXRyb29tcycpO1xuICAgIHZhciB1cGRhdGVkQ2hhdHJvb21zID0gXy5tYXAoY2hhdHJvb21zLCBmdW5jdGlvbihjaGF0cm9vbSkge1xuICAgICAgdmFyIG5ld0NoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoeyBuYW1lOiBjaGF0cm9vbS5uYW1lLCBvd25lcjogY2hhdHJvb20ub3duZXIsIHJvb21JbWFnZTogY2hhdHJvb20ucm9vbUltYWdlfSk7XG4gICAgICByZXR1cm4gbmV3Q2hhdHJvb21Nb2RlbDtcbiAgICB9KTtcbiAgICBvbGRDaGF0cm9vbXMucmVzZXQodXBkYXRlZENoYXRyb29tcyk7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRQcml2YXRlUm9vbXNcIiwgZnVuY3Rpb24ocm9vbXMpIHtcbiAgICB2YXIgb2xkUm9vbXMgPSBzZWxmLmNoYXRyb29tTW9kZWwuZ2V0KCdwcml2YXRlUm9vbXMnKTtcbiAgICB2YXIgbmV3Um9vbXMgPSBfLm1hcChyb29tcywgZnVuY3Rpb24ocm9vbSkge1xuICAgICAgdmFyIG5ld0NoYXRyb29tTW9kZWwgPSBuZXcgYXBwLkNoYXRyb29tTW9kZWwoeyBuYW1lOiByb29tLm5hbWUsIG93bmVyOiByb29tLm93bmVyLCByb29tSW1hZ2U6IHJvb20ucm9vbUltYWdlfSk7XG4gICAgICByZXR1cm4gbmV3Q2hhdHJvb21Nb2RlbDtcbiAgICB9KTtcbiAgICBvbGRSb29tcy5yZXNldChuZXdSb29tcyk7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRPbmxpbmVVc2Vyc1wiLCBmdW5jdGlvbihvbmxpbmVVc2Vycykge1xuICAgIHZhciBvbGRPbmxpbmVVc2VycyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoJ29ubGluZVVzZXJzJyk7XG4gICAgdmFyIHVwZGF0ZWRPbmxpbmVVc2VycyA9IF8ubWFwKG9ubGluZVVzZXJzLCBmdW5jdGlvbih1c2VyKSB7XG4gICAgICB2YXIgbmV3VXNlck1vZGVsID0gbmV3IGFwcC5Vc2VyTW9kZWwoe3VzZXJuYW1lOiB1c2VyLnVzZXJuYW1lLCB1c2VySW1hZ2U6IHVzZXIudXNlckltYWdlfSk7XG4gICAgICByZXR1cm4gbmV3VXNlck1vZGVsO1xuICAgIH0pO1xuICAgIG9sZE9ubGluZVVzZXJzLnJlc2V0KHVwZGF0ZWRPbmxpbmVVc2Vycyk7XG4gIH0pO1xuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRPZmZsaW5lVXNlcnNcIiwgZnVuY3Rpb24ob2ZmbGluZVVzZXJzKSB7XG4gICAgdmFyIG9sZE9mZmxpbmVVc2VycyA9IHNlbGYuY2hhdHJvb21Nb2RlbC5nZXQoJ29mZmxpbmVVc2VycycpO1xuICAgIHZhciB1cGRhdGVkT2ZmbGluZVVzZXJzID0gXy5tYXAob2ZmbGluZVVzZXJzLCBmdW5jdGlvbih1c2VyKSB7XG4gICAgICB2YXIgbmV3VXNlck1vZGVsID0gbmV3IGFwcC5Vc2VyTW9kZWwoe3VzZXJuYW1lOiB1c2VyLnVzZXJuYW1lLCB1c2VySW1hZ2U6IHVzZXIudXNlckltYWdlfSk7XG4gICAgICByZXR1cm4gbmV3VXNlck1vZGVsO1xuICAgIH0pO1xuICAgIG9sZE9mZmxpbmVVc2Vycy5yZXNldCh1cGRhdGVkT2ZmbGluZVVzZXJzKTtcbiAgfSk7XG5cblxuLy8gY2hhdHJvb20gYXZhaWxhYmlsaXR5XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcImNoYXRyb29tQXZhaWxhYmlsaXR5XCIsIGZ1bmN0aW9uKGF2YWlsYWJpbGl0eSkge1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC50cmlnZ2VyKCdjaGF0cm9vbUF2YWlsYWJpbGl0eScsIGF2YWlsYWJpbGl0eSk7XG4gIH0pO1xuXG5cbi8vIGVycm9yc1xuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcImNoYXRyb29tQWxyZWFkeUV4aXN0c1wiLCBmdW5jdGlvbigpIHtcbiAgICBzd2FsKHtcbiAgICAgIHRpdGxlOiBcIk9IIE5PIE9IIE5PIE9IIE5PXCIsXG4gICAgICB0ZXh0OiBcIkNoYXRyb29tIEFscmVhZHksIEl0IEFscmVhZHkgRXhpc3RzISBBbmQuIERvbid0IEdvIEluIFRoZXJlLiBEb24ndC4gWW91LiBZb3UgU2hvdWxkIEhhdmUuIEkgVGhyZXcgVXAgT24gVGhlIFNlcnZlci4gVGhvc2UgUG9vciAuIC4gLiBUaGV5IFdlcmUgSnVzdCEgT0ggTk8gV0hZLiBXSFkgT0ggTk8uIE9IIE5PLlwiLFxuICAgICAgdHlwZTogXCJlcnJvclwiLFxuICAgICAgY29uZmlybUJ1dHRvbkNvbG9yOiBcIiM3NDlDQThcIlxuICAgIH0pO1xuICB9KTtcblxuXG5cbiAgLy8gRGlyZWN0TWVzc2FnZVxuXG4gIHNlbGYuYXBwRXZlbnRCdXMub24oXCJzZXRETWNoYXRsb2dcIiwgZnVuY3Rpb24oY2hhdGxvZykge1xuICAgIHZhciBvbGRDaGF0bG9nID0gc2VsZi5jaGF0cm9vbU1vZGVsLmdldCgnY2hhdGxvZycpO1xuICAgIHZhciB1cGRhdGVkQ2hhdGxvZyA9IF8ubWFwKGNoYXRsb2csIGZ1bmN0aW9uKGNoYXQpIHtcbiAgICAgIHZhciBuZXdDaGF0TW9kZWwgPSBuZXcgYXBwLkNoYXRNb2RlbCh7IHJvb206IGNoYXQucm9vbSwgbWVzc2FnZTogY2hhdC5tZXNzYWdlLCBzZW5kZXI6IGNoYXQuc2VuZGVyLCB0aW1lc3RhbXA6IGNoYXQudGltZXN0YW1wLCB1cmw6IGNoYXQudXJsIH0pO1xuICAgICAgcmV0dXJuIG5ld0NoYXRNb2RlbDtcbiAgICB9KTtcbiAgICBvbGRDaGF0bG9nLnJlc2V0KHVwZGF0ZWRDaGF0bG9nKTtcblxuICAgICQoJyNtZXNzYWdlLWlucHV0JykucmVtb3ZlQ2xhc3MoJ21lc3NhZ2UtaW5wdXQnKS5hZGRDbGFzcygnZGlyZWN0LW1lc3NhZ2UtaW5wdXQnKTtcbiAgICAkKCcjY2hhdEltYWdlVXBsb2FkQ29udGFpbmVyJykuZGF0YSgnY2hhdC10eXBlJywgJ21lc3NhZ2UnKTtcbiAgICAkKCcjY2hhdGJveC1jb250ZW50JylbMF0uc2Nyb2xsVG9wID0gJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbEhlaWdodDtcbiAgfSk7XG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcInNldERNaGVhZGVyXCIsIGZ1bmN0aW9uKGhlYWRlcikge1xuICAgIHZhciBuZXdIZWFkZXIgPSBuZXcgYXBwLkNoYXRyb29tSGVhZGVyTW9kZWwoaGVhZGVyKTtcbiAgICBzZWxmLmNoYXRyb29tTW9kZWwuc2V0KCdjaGF0cm9vbScsIG5ld0hlYWRlcik7XG4gIH0pO1xuXG5cbiAgc2VsZi5hcHBFdmVudEJ1cy5vbihcImRpcmVjdE1lc3NhZ2VSZWNlaXZlZFwiLCBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgc2VsZi5jaGF0cm9vbU1vZGVsLmFkZENoYXQobWVzc2FnZSk7XG4gICAgJCgnI2NoYXRib3gtY29udGVudCcpWzBdLnNjcm9sbFRvcCA9ICQoJyNjaGF0Ym94LWNvbnRlbnQnKVswXS5zY3JvbGxIZWlnaHQ7XG4gIH0pO1xuXG5cblxuICBzZWxmLmFwcEV2ZW50QnVzLm9uKFwidXNlckludml0ZWRcIiwgZnVuY3Rpb24odXNlcikge1xuICAgIGNvbnNvbGUubG9nKCdtYWluLmUudXNlckludml0ZWQ6ICcsIHVzZXIpO1xuICAgIHNlbGYuY2hhdHJvb21Nb2RlbC50cmlnZ2VyKCd1c2VySW52aXRlZCcsIHVzZXIpO1xuICB9KTtcblxuXG5cblxuXG5cblxuXG5cbn07XG4iLCJ2YXIgYXBwID0gYXBwIHx8IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIC8vICQod2luZG93KS5iaW5kKCdiZWZvcmV1bmxvYWQnLCBmdW5jdGlvbihldmVudE9iamVjdCkge1xuICAvLyAgICQuYWpheCh7XG4gIC8vICAgICAgdXJsOiBcIi9sb2dvdXRcIixcbiAgLy8gICB9KTtcbiAgLy8gfSk7XG5cbiAgdmFyIENoYXRyb29tUm91dGVyID0gQmFja2JvbmUuUm91dGVyLmV4dGVuZCh7XG4gICAgXG4gICAgcm91dGVzOiB7XG4gICAgICAnJzogJ3N0YXJ0JyxcbiAgICAgICdsb2cnOiAnbG9naW4nLFxuICAgICAgJ3JlZyc6ICdyZWdpc3RlcicsXG4gICAgICAnb3V0JzogJ291dCcsXG4gICAgICAnYXV0aGVudGljYXRlZCc6ICdhdXRoZW50aWNhdGVkJyxcbiAgICAgICdmYWNlYm9vayc6ICdmYWNlYm9vaycsXG4gICAgICAndHdpdHRlcic6ICd0d2l0dGVyJ1xuICAgIH0sXG5cbiAgICBzdGFydDogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJy8jJztcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlciA9IG5ldyBhcHAuTWFpbkNvbnRyb2xsZXIoKTtcbiAgICAgIGFwcC5tYWluQ29udHJvbGxlci5pbml0KCk7XG4gICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgIH0gXG4gICAgICBlbHNlIHtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICB1cmw6IFwiL2xvZ291dFwiLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LFxuXG5cbiAgICBsb2dpbjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbG9naW5Nb2RlbCA9IG5ldyBhcHAuTG9naW5Nb2RlbCgpO1xuICAgICAgdmFyIGxvZ2luVmlldyA9IG5ldyBhcHAuTG9naW5WaWV3KHt2ZW50OiBhcHAubWFpbkNvbnRyb2xsZXIudmlld0V2ZW50QnVzLCBtb2RlbDogbG9naW5Nb2RlbH0pO1xuICAgICAgYXBwLm1haW5Db250cm9sbGVyLmNvbnRhaW5lck1vZGVsLnNldChcInZpZXdTdGF0ZVwiLCBsb2dpblZpZXcpO1xuICAgIH0sXG5cbiAgICByZWdpc3RlcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcmVnaXN0ZXJWaWV3ID0gbmV3IGFwcC5SZWdpc3RlclZpZXcoe3ZlbnQ6IGFwcC5tYWluQ29udHJvbGxlci52aWV3RXZlbnRCdXMgfSk7XG4gICAgICBhcHAubWFpbkNvbnRyb2xsZXIuY29udGFpbmVyTW9kZWwuc2V0KFwidmlld1N0YXRlXCIsIHJlZ2lzdGVyVmlldyk7XG4gICAgfSxcblxuICAgIC8vIG91dDogZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgIHZhciB0aGlzXyA9IHRoaXM7XG4gICAgLy8gICAgICQuYWpheCh7XG4gICAgLy8gICAgICAgdXJsOiBcIi9sb2dvdXRcIixcbiAgICAvLyAgICAgfSlcbiAgICAvLyB9LFxuXG4gICAgYXV0aGVudGljYXRlZDogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIWFwcC5tYWluQ29udHJvbGxlcikge1xuICAgICAgICB0aGlzLnN0YXJ0KCk7XG4gICAgICB9XG4gICAgICAgIGFwcC5tYWluQ29udHJvbGxlci5hdXRoZW50aWNhdGVkKCk7XG4gICAgfSxcbiAgICBmYWNlYm9vazogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnN0YXJ0KHRoaXMuYXV0aGVudGljYXRlZCk7XG4gICAgfSxcbiAgICB0d2l0dGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuc3RhcnQodGhpcy5hdXRoZW50aWNhdGVkKTtcbiAgICB9LFxuXG4gIH0pO1xuXG4gIGFwcC5DaGF0cm9vbVJvdXRlciA9IG5ldyBDaGF0cm9vbVJvdXRlcigpO1xuICBCYWNrYm9uZS5oaXN0b3J5LnN0YXJ0KCk7XG5cbn0pKCk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9