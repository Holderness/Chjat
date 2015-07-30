
var app = app || {};

(function () {

app.ChatroomModel = Backbone.Model.extend({
  urlRoot: '/api/chatrooms',
  defaults: {
    name: 'DOO',
    onlineUsers: new app.UserCollection(),
    chatlog: new app.ChatCollection([
      // message and sender upon entering chatroom
      new app.ChatModel({ sender: 'Butters', message: 'awwwwww hamburgers. ||):||', timestamp: _.now() })
      ]),
    chatrooms: null
  },
  events: {
     "chatrooms:change": "loadModel"
  },
  initialize: function() {
    // this.trigger('getChatroomModel', this.get('name'));
  },
  loadModel: function(model) {
    console.log('bone diddly');
    debugger;
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
    this.trigger('gorp', chat);
  },
  parse: function( response ) {
    response.id = response._id;
    return response;
  }
});

})();