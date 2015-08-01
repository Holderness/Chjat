

app.MainController = function() {

	var self = this;


  //These allows us to bind and trigger on the object from anywhere in the app.
	self.appEventBus = _.extend({}, Backbone.Events);
	self.viewEventBus = _.extend({}, Backbone.Events);

	self.init = function() {
		// creates ChatClient from socketclient.js, passes in 
		// appEventBus as vent, connects

		self.chatClient = new ChatClient({ vent: self.appEventBus });
		self.chatClient.connect();

    // loginModel
		self.loginModel = new app.LoginModel();
    self.loginView = new app.LoginView({vent: self.viewEventBus, model: self.loginModel});
    self.registerView = new app.RegisterView({vent: self.viewEventBus });

    // The ContainerModel gets passed a viewState, LoginView, which
    // is the login page. That LoginView gets passed the viewEventBus
    // and the LoginModel.
		self.containerModel = new app.ContainerModel({ viewState: self.loginView});

		// next, a new ContainerView is intialized with the newly created containerModel
		// the login page is then rendered.
		self.containerView = new app.ContainerView({ model: self.containerModel });
		self.containerView.render();
	};

  self.authenticated = function() {

    // self.chatClient = new ChatClient({ vent: self.appEventBus });
    // self.chatClient.connect();


    // new model and view created for chatroom
    self.chatroomModel = new app.ChatroomModel({ name: 'DOO' });
    self.chatroomList = new app.ChatroomList();
    self.chatroomList.fetch().done(function() {
      self.chatroomModel.set('chatrooms', self.chatroomList);
      // self.chatroomModel.loadModel();
      self.chatroomView  = new app.ChatroomView({vent: self.viewEventBus, model: self.chatroomModel });
      self.containerModel = new app.ContainerModel({ viewState: self.chatroomView});
      self.containerView = new app.ContainerView({ model: self.containerModel });
      self.containerView.render();



      // self.containerModel.set("viewState", self.chatroomView);

      autosize($('textarea.message-input'));
      $('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;

            self.chatClient.connectToRoom("DOO");

     


    });

  };



  ////////////  Busses ////////////
    // These Busses listen to the socketclient
   //    ---------------------------------


  //// viewEventBus Listeners /////
  
	self.viewEventBus.on("login", function(user) {
    // socketio login, sends name to socketclient, socketclient sends it to chatserver
    self.chatClient.login(user);
  });
	self.viewEventBus.on("chat", function(chat) {
    // socketio chat, sends chat to socketclient, socketclient to chatserver
    self.chatClient.chat(chat);
  });
  self.viewEventBus.on("typing", function() {
    self.chatClient.updateTyping();
  });
  self.viewEventBus.on("joinRoom", function(room) {
    self.chatClient.joinRoom(room);
  });
  self.viewEventBus.on("getChatroomModel", function(name) {
    self.chatClient.getChatroomModel(name);
  });








  //// appEventBus Listeners ////

  // after the 'welcome' event triggers on the sockeclient, the loginDone event triggers.
	// self.appEventBus.on("loginDone", function() {

	// 	// new model and view created for chatroom
	// 	self.chatroomModel = new app.ChatroomModel();
 //    self.chatroomList = new app.ChatroomList();
	// 	self.chatroomView  = new app.ChatroomView({vent: self.viewEventBus, model: self.chatroomModel, collection: self.chatroomList});

	// 	// viewstate is changed to chatroom after login.
	// 	self.containerModel.set("viewState", self.chatroomView);
 //    autosize($('textarea.message-input'));
	// 	$('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
	// });

  // error listeners
	// self.appEventBus.on("loginNameBad", function(username) {
	// 	self.loginModel.set("error", "Invalid Name");
	// });
	// self.appEventBus.on("loginNameExists", function(username) {
	// 	self.loginModel.set("error", "Name already exists");
	// });







  // after 'onlineUsers' event emits, the 'usersInfo' event triggers
	self.appEventBus.on("usersInfo", function(data) {
    //data is an array of usernames, including the new user
		// This method gets the online users collection from chatroomModel.
		// onlineUsers is the collection
		var onlineUsers = self.chatroomModel.get("onlineUsers");
console.log("onlineUsers: ---", onlineUsers);
   // users is array of the current user models
		var users = _.map(data, function(item) {
			return new app.UserModel({username: item});
		});
console.log("users: ---", users);
    // this resets the collection with the updated array of users
		onlineUsers.reset(users);
	});




  self.appEventBus.on("roomInfo", function(data) {
    // This method gets the online users collection from chatroomModel.
    // onlineUsers is the collection
    var rooms = self.chatroomModel.get("chatrooms");
     console.log("ROOMS: ", rooms);

   // users is array of the current room models
    var updatedRooms = _.map(data, function(room) {
      var newChatroomModel = new app.ChatroomModel({name: room.name});

      // _.map(room.chatlog, function(chat) {
      //   debugger;
      //   self.chatroomView.userChats.push(chat);
      // });
      return newChatroomModel;
    });
console.log("UPDATED ROOMS: ", updatedRooms);
    // this resets the collection with the updated array of rooms
    rooms.reset(updatedRooms);
  });


  self.appEventBus.on("setRoom", function(model) {
  //   if (self.chatroomView !== undefined) {
  //   debugger;
  //   self.chatroomView.stopListening();
  //   self.chatroomModel = new app.ChatroomModel();
  //   self.chatroomView  = new app.ChatroomView({vent: self.viewEventBus, model: self.chatroomModel, collection: self.chatroomList});

  //   // viewstate is changed to chatroom after login.
  //   self.containerModel.set("viewState", self.chatroomView);
  //   autosize($('textarea.message-input'));
  //   $('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
  // }
    // self.chatClient.setRoom(room);
    
        var newList = new app.ChatCollection(model.chatlog);
    self.chatroomModel.set('chatlog', newList);


    var newList = new app.ChatroomList(model.chatrooms);
    self.chatroomModel.set('chatrooms', newList);

    var newList = new app.UserCollection(model.onlineUsers);
    self.chatroomModel.set('onlineUsers', newList);

  });


  self.appEventBus.on("ChatroomModel", function(model) {
    self.chatroomModel = new app.ChatroomModel();
    self.chatroomList = new app.ChatroomList();
    self.chatroomView  = new app.ChatroomView({vent: self.viewEventBus, model: self.chatroomModel, collection: self.chatroomList});
    self.containerModel.set('viewState', self.chatroomView);
    self.chatroomModel.loadModel(model);
    // self.chatroomModel.loadModel(model);
  });

  // adds new user to users collection, sends default joining message
	self.appEventBus.on("userJoined", function(username) {
		self.chatroomModel.addUser(username);
		self.chatroomModel.addChat({sender: "Butters", message: username + " joined room." });
	});

	// removes user from users collection, sends default leaving message
	self.appEventBus.on("userLeft", function(username) {
    debugger;
		self.chatroomModel.removeUser(username);
		self.chatroomModel.addChat({sender: "Butters", message: username + " left room." });
	});

	// chat passed from socketclient, adds a new chat message using chatroomModel method
	self.appEventBus.on("chatReceived", function(chat) {
    self.chatroomView.gorp(chat);
		$('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
	});



  self.appEventBus.on("setChatlog", function(chatlog) {
    var newList = new app.ChatCollection(chatlog);
    self.chatroomModel.set('chatlog', newList);
    // $('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
  });
  
  self.appEventBus.on("setChatrooms", function(chatrooms) {
    var newList = new app.ChatroomList(chatrooms);
    self.chatroomModel.set('chatrooms', newList);
  });

    self.appEventBus.on("setOnlineUsers", function(onlineUsers) {
    var newList = new app.UserCollection(onlineUsers);
    self.chatroomModel.set('onlineUsers', newList);
  });


};

