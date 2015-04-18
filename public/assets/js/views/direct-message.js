var DirectMessage = Backbone.View.extend({
	directMessageTpl: _.template($('#direct-message-template').html()),
	initialize: function() {
		this.render();
	},
	events: {
		'click .direct-message' : 'chatbox'
	},
	render: function() {
		var messages = this.model.attributes.messages;
		var x = messages.length - 1;
		var lastMessage = messages[x];
		this.$el.append(this.directMessageTpl(lastMessage));
		return this;
	},
	chatbox: function() {
		var view = new Chatbox({model: this.model});
		return this;
	}
});