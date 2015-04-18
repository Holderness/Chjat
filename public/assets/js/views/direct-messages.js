var DirectMessages = Backbone.View.extend({
	el: '.chat-directory',
	chatMessageTpl	 : _.template($('#chat-message-template').html()),
	chatboxTpl: _.template($('#chatbox-template').html()),
	events: {
		'click .find-user': 'chatbox'
	},
	initialize: function() {
		$directMessagesContainer = $('.direct-messages-container');
		moment().format();
		this.addSidebar();
	},
	addSidebarItem: function(conversation) {
		var view = new SidebarItem({model: conversation});
		$directMessagesContainer.append(view.el)
	},
	addSidebar: function() {
		var inbox = this.model.get('inbox');
		for (var i = 0; i < inbox.length; i++) {
			this.addSidebarItem(inbox[i])			
		}
		this.chatbox();
	},
	chatbox: function() {
		$('.chatbox').html(this.chatboxTpl());
		return this;
	},
});