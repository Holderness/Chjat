var ChatClient = function(options) {

	var self = this;

	self.vent = options.vent;

	self.hostname = 'http://' + window.location.host;

  // connects to socket, sets response listeners
	self.connect = function() {
		self.socket = io.connect(self.hostname);
		self.setResponseListeners(self.socket);
	};

		// emits login event to chatserver
	self.login = function(name) {
		self.socket.emit("login", name);
	};

    // emits chat event to chatserver
	self.chat = function(chat) {
		self.socket.emit("chat", chat);
	};


	self.setResponseListeners = function(socket) {

		// client listeners that listen to the chatserver and itself.
		// Each server event triggers an appEventBus event paired with 
		// relevant data.

		socket.on('welcome', function(data) {
      // emits event to recalibrate onlineUsers collection
      socket.emit("onlineUsers");
			console.log('onlineUsers1: ');
			console.log(data);
      // data is undefined at this point because it's the first to
      // fire off an event chain that will append the new user to 
      // the onlineUser collection
      // appEventBus listens on main.js
      self.vent.trigger("loginDone", data);
    });


		socket.on('loginNameExists', function(data) {
      // data === string of used username
			console.log('loginNameExists: ');
			console.log(data);
			self.vent.trigger("loginNameExists", data);
		});
		socket.on('loginNameBad', function(data) {
			// data === string of bad username
			console.log('loginNameBad: ');
			console.log(data);
			self.vent.trigger("loginNameBad", data);
		});

		// this is the second listener to onlineUsers
		// by the time this is called, the new user has been added to
		// the user collection.
		socket.on('onlineUsers', function(data) {
			// this data is an array with all the online user's usernames.
			console.log('onlineUsers2: ');
			console.log(data);
			self.vent.trigger("usersInfo", data);
		});

		socket.on('userJoined', function(data) {
			// data === username of user joined
			console.log('userJoined: ');
			console.log(data);
			self.vent.trigger("userJoined", data);
		});
		socket.on('userLeft', function(data) {
			// data === username of user removed
			console.log('userLeft: ');
			console.log(data);
			self.vent.trigger("userLeft", data);
		});
		socket.on('chat', function(data) {
			// data === chat message object
			console.log('chat: ');
			console.log(data);
			self.vent.trigger("chatReceived", data);
		});
	};
};