var Chatbox = Backbone.View.extend({
	el: '.chatbox',
	chatboxTpl: _.template($('#chatbox-template').html()),
	chatMessageTpl	 : _.template($('#chatbox-message-template').html()),
	initialize: function() {
		this.render();
		$input = $('.message-input');
	},
	events: {
		'keypress .message-input' : 'send',
	},
	render: function() {
		this.$el.html(this.chatboxTpl(this.model.toJSON()));
		$('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
		this.messages(this.model.get('messages'));
		return this;
	},
	messages: function(messages) {
		for (var i = 0; i < messages.length; i++) {
			$('.chatbox-content').append(this.chatMessageTpl(messages[i]));
		}
	},
	send: function(e) {
		if (e.which === 13  && $input.val() !== '') {
			var content = $input.val();
			var user = this.model.get('users');
			var message = Object.create({
				content: content,
				sender: user[0],
				timestamp: new Date(),
			});
			$('.chatbox-content').append(this.chatMessageTpl(message));	
				var messages = this.model.get('messages');
				messages.push(message);
			$('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
	  	$input.val('');
			$input.focus();
			console.log('message', message);
			console.log('messages', messages);
  	}
	},

});