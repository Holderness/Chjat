var app = app || {};

(function () {


app.ContainerModel = Backbone.Model.extend({});

app.UserModel = Backbone.Model.extend({});
app.UserCollection = Backbone.Collection.extend({model: app.UserModel});

app.ChatModel = Backbone.Model.extend({});
app.ChatCollection = Backbone.Collection.extend({model: app.ChatModel});

app.ChatroomModel = Backbone.Model.extend({
  defaults: {
    onlineUsers: new app.UserCollection(),
    userChats: new app.ChatCollection([
      // message and sender upon entering chatroom
      new app.ChatModel({ sender: 'Butters', message: 'awwwwww hamburgers. ||):||', timestamp: _.now() })
      ])
  },
  addUser: function(username) {
    this.get('onlineUsers').add(new app.UserModel({ username: username }));
    console.log("--adding-user---");
  },
  removeUser: function(username) {
    var onlineUsers = this.get('onlineUsers');
    var user = onlineUsers.find(function(userModel) { return userModel.get('username') == username; });
    if (user) {
      onlineUsers.remove(user);
    }
  },
  addChat: function(chat) {
    var now = _.now();
    this.get('userChats').add(new app.ChatModel({ sender: chat.sender, message: chat.message, timestamp: now}));
  },
});


// LoginModel
app.LoginModel = Backbone.Model.extend({
  defaults: {
    error: ""
  }
});


})();


// var User = Backbone.Model.extend({
// 	defaults: {
// 		username: '',
// 		avatar: '',
// 		inbox: [],
// 	},
// });

// var Conversation = Backbone.Model.extend({
// 	defaults: {
// 		users: [],
// 		messages: [],
// 	},
// });