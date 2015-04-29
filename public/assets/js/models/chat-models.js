var ContainerModel = Backbone.Model.extend({});

var UserModel = Backbone.Model.extend({});
var UserCollection = Backbone.Collection.extend({model: UserModel});

var ChatModel = Backbone.Model.extend({});
var ChatCollection = Backbone.Collection.extend({model: ChatModel});

var ChatroomModel = Backbone.Model.extend({
  defaults: {
    onlineUsers: new UserCollection(),
    userChats: new ChatCollection([
      new ChatModel({ sender: 'Hamburgler', message: 'awwwwww hamburgers. ||):||' })
      ])
  },
  addUser: function(username) {
    this.get('onlineUsers').add(new UserModel({ username: username }));
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
    this.get('userChats').add(new ChatModel({ sender: chat.sender, message: chat.message }));
  },
});


// LoginModel
var LoginModel = Backbone.Model.extend({
  defaults: {
    error: ""
  }
});



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