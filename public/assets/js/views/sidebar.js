var Sidebar = Backbone.View.extend({
	el: '#sidebar',
	chatMessageTpl	 : _.template($('#chat-message-template').html()),
	chatboxTpl: _.template($('#chatbox-template').html()),
	events: {
		'click .find-user': 'chatbox'
	},
	initialize: function() {
		$sidebar = $('#sidebar-items');
		moment().format();
		this.addSidebar();
	},
	addSidebarItem: function(conversation) {
		var view = new SidebarItem({model: conversation});
		$sidebar.append(view.el)
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