var app = app || {};

(function ($) {

app.ChatroomView = Backbone.View.extend({
  template: _.template($('#chatroom-template').html()),
  events: {
    'keypress .message-input': 'messageInputPressed',
    'click .chat-directory .room': 'setRoom'
  },
  // initialized after the 'loginDone' event
  initialize: function(options) {
    console.log(options);
    // passed the viewEventBus
    this.vent = options.vent;
    var this_ = this;
    // these get the collection of onlineUsers and userChats from the chatroomModel
   

  },
  render: function(model) {
    this.model = model || this.model;
    this.$el.html(this.template());
        // this.renderChats();
    // this.setChatCollection();
    // this.renderUsers();
    this.setChatListeners();
    // this.renderRooms();

    return this;
  },
  // setChatCollection: function() {
  //     this.userChats = new app.ChatCollection([
  //       // message and sender upon entering chatroom
  //       new app.ChatModel({ sender: 'Butters', message: 'awwwwww hamburgers. ||):||', timestamp: _.now() })
  //     ]);
  // },
  setChatListeners: function() {
    this.stopListening();


    // this.listenTo(this.model, "getChatroomModel", this.getChatroomModel, this);


    // var onlineUsers = this.model.get('onlineUsers');
   // sets event listeners on the collections
    // this.listenTo(onlineUsers, "add", this.renderUser, this);
    // this.listenTo(onlineUsers, "remove", this.renderUsers, this);
    // this.listenTo(onlineUsers, "reset", this.renderUsers, this);
        // this.listenTo(onlineUsers, "change", this.renderUsers, this);

    // var chatlog = this.model.get('chatlog');
    // this.listenTo(chatlog, "add", this.renderChat, this);
    // this.listenTo(chatlog, "remove", this.renderChats, this);
    // this.listenTo(chatlog, "reset", this.renderChats, this);
    // this.listenTo(chatlog, "change", this.renderChats, this);

    // var chatrooms = this.model.get('chatrooms');

    // this.listenTo(chatrooms, "add", this.renderRoom, this);
    // this.listenTo(chatrooms, "remove", this.renderRooms, this);
    // this.listenTo(chatrooms, "reset", this.renderRooms, this);
    // this.listenTo(chatrooms, "change", this.renderRooms, this);

    this.listenTo(this.model, "change:onlineUsers", this.renderUsers, this);
    this.listenTo(this.model, "change:chatlog", this.renderChats, this);
    this.listenTo(this.model, "change:chatrooms", this.renderRooms, this);

    // this.listenTo(this.model, "gorp", this.gorp, this);
    // this.model.on('gorp', function(chat) {
    //   this.gorp(chat);
    // });




  },

  gorp: function(chat) {
    var now = _.now();

    this.userChats.add(new app.ChatModel({ sender: chat.sender, message: chat.message, timestamp: now}));
  },
  getChatroomModel: function(name) {
    this.vent.trigger('getChatroomModel', name);
  },
  // renders on events, called just above
  renderUsers: function() {
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
    this.$('.chatbox-content').empty();
    this.model.get('chatlog').each(function(chat) {
      this.renderChat(chat);
    }, this);
  },
  renderChat: function(model) {
    var template = _.template($('#chatbox-message-template').html());
    var element = $(template(model.toJSON()));
    element.appendTo(this.$('.chatbox-content')).hide().fadeIn().slideDown();
    // this.$('.nano').nanoScroller();
    // this.$('.nano').nanoScroller({ scroll: 'bottom' });
  },


  // renders on events, called just above
  renderRooms: function() {
    this.$('.public-rooms-container').empty();
    this.model.get('chatrooms').each(function (room) {
      this.renderRoom(room);
    }, this);
  },
  renderRoom: function(model) {
    var template = _.template($("#room-list-template").html());
    this.$('.public-rooms-container').append(template(model.toJSON()));
    // this.$('.user-count').html(this.model.get("onlineUsers").length);
    // this.$('.nano').nanoScroller();
  },

  joinRoom: function(name) {
    this.vent.trigger('joinRoom', name);
    var model = this.collection.findWhere({name: name});
    // this.getChatCollection(name);
    this.render(model);
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
    var $tar = $(e.target);
    if ($tar.is('p')) {
      this.joinRoom($tar.data('room'));
    }
  }




});

})(jQuery);