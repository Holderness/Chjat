_ = require('underscore');


var Server = function(options) {
  
	var self = this;
	self.io = options.io;
	self.users = [];


  self.init = function() {
    // Fired upon a connection
    // self.io.on("connection", function(socket) {
    //   self.handleConnection(socket);
    // });
self.io.on('connection', function(socket){
	console.log('a mothafucka is connected');

	socket
	.on('disconnect', function(){
		console.log('he gone.');
	})
	// .on('chat message', function(msg){
	// 	console.log('message: ' + msg);
	// })
	// .on('chat message', function(msg){
	// 	io.emit('chat message', msg);
	// });

  self.manageConnection(socket);

  });
};

  self.manageConnection = function(socket) {

    socket.on('login', function(username) {

      // username length validation
      var nameBad = !username || username.length < 3 || username.length > 10;
      if (nameBad) {
        socket.emit('loginNameBad', username);
        return;
      }

      // username exists validation
      var nameExists = _.some(self.users, function(user) {
        return user.username == username;
      });
      if (nameExists) {
        socket.emit("loginNameExists", username);
      } else {
        // if username does not exist, create user, passes in user name and the socket
        var newUser = new User({ username: username, socket: socket });

        //push users to user to online user array
        self.users.push(newUser);

        // calls method directly below
        self.setResponseListeners(newUser);

        // emits 'welcome' and 'userJoined' to the socketclient
        socket.emit("welcome");
        self.io.sockets.emit("userJoined", newUser.username);
      }
    });
  };
    

  self.setResponseListeners = function(user) {

    // listens for disconnect, removes user from online user array
    user.socket.on('disconnect', function() {
      self.users.splice(self.users.indexOf(user), 1);
      self.io.sockets.emit("userLeft", user.username);
    });

    // listens to the 'onlineUsers' event, updates the online users array on
    // a change from the client.
    user.socket.on("onlineUsers", function() {
      // creates new array of online usernames, stores in var users
      var users = _.map(self.users, function(user) {
        return user.username;
      });
      // emits new online usernames array to client
      user.socket.emit("onlineUsers", users);
    });

    // another recursive function, listening for a 'chat' event from client,
    // if there is a chat event, emit an object containing the username
    // and chat message to all the other sockets.
    user.socket.on("chat", function(chat) {
      if (chat) {
        self.io.sockets.emit("chat", { sender: user.username, message: chat });
      }
    });
  };
};


// User Model
var User = function(args) {
  var self = this;
  self.socket = args.socket;
  self.username = args.username;
};

// allows export to chatserver.js
module.exports = Server;
