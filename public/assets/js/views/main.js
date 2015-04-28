var ContainerView = Backbone.View.extend({
	el: '#container',
	initialize: function(options) {
		this.model.on("change:viewState", this.render, this);
	},
	render: function() {
		var view = this.model.get('viewState');
		this.$el.html(view.render().el);
	}
});



var HomeView = Backbone.View.extend({
	template: _.template($("#home-template").html()),
	events: {
		'keypress #chatInput': 'chatInputPressed'
	},
	// initialized after the 'loginDone' event
	initialize: function(options) {
		console.log(options);
		// passed the viewEventBus
		this.vent = options.vent;

    // requests to the socketclient
		var onlineUsers = this.model.get('onlineUsers');
		var userChats = this.model.get('userChats');

    //sets event listeners on the collections
		this.listenTo(onlineUsers, "add", this.renderUser, this);
		this.listenTo(onlineUsers, "remove", this.renderUsers, this);
		this.listenTo(onlineUsers, "reset", this.renderUsers, this);

		this.listenTo(userChats, "add", this.renderChat, this);
		this.listenTo(userChats, "remove", this.renderChats, this);
		this.listenTo(userChats, "reset", this.renderChats, this);
	},
	// render
	render: function() {
		var onlineUsers = this.model.get("onlineUsers");
		this.$el.html(this.template());
		this.renderUsers();
		this.renderChats();
		return this;
	},
	// renders on events, called just above
	renderUsers: function() {
		this.$('#userList').empty();
		this.model.get("onlineUsers").each(function (user) {
			this.renderUser(user);
		}, this);
	},
	renderUser: function(model) {
		var template = _.template("<a class='list-group-item'><%= name %></a>");
		this.$('#userList').append(template(model.toJSON()));
		this.$('#userCount').html(this.model.get("onlineUsers").length);
		this.$('.nano').nanoScroller();
	},
	renderChats: function() {
		this.$('#chatList').empty();
		this.model.get('userChats').each(function(chat) {
			this.renderChat(chat);
		}, this);
	},
	renderChat: function(model) {
		var template = _.template("<a class='list-group-item'><span class='text-info'><%= sender %></span>:<%= message %></a>");
		var element = $(template(model.toJSON()));
		element.appendTo(this.$('#chatList')).hide().fadeIn().slideDown();
		this.$('.nano').nanoScroller();
		this.$('.nano').nanoScroller({ scroll: 'bottom' });
	},
	//events
	chatInputPressed: function(evt) {
		if (evt.keyCode == 13) {
			this.vent.trigger("chat", this.$('#chatInput').val());
			this.$('#chatInput').val('');
			return false;
		}
	}
});