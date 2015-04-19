
var socket = io();

var Chatbox = Backbone.View.extend({
	el: '.chatbox',
	chatboxTpl: _.template($('#chatbox-template').html()),
	chatMessageTpl	 : _.template($('#chatbox-message-template').html()),
	initialize: function() {
		this.render();
		$input = $('.message-input');
		socket.on('chat message', function(msg){
			var content = {content: msg, timestamp: new Date()};
			$('.chatbox-content').append(this.chatMessageTpl(content));
			$('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
			$input.focus();
    }.bind(this));
	},
	events: {
		'keypress .message-input' : 'send',
	},
  render: function() {
    this.$el.html(this.chatboxTpl());
    $('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
    return this;
  },
  send: function(e) {
    if (e.which === 13  && $input.val() !== '') {
			e.preventDefault();
			socket.emit('chat message', $input.val());
			$input.val('');
      return false;
    }
  }
});



  // <script>
  //   var socket = io();
  //   $('form').submit(function(){
  //     socket.emit('chat message', $('#message-input').val());
  //     $('#message-input').val('');
  //     return false;
  //   });
  //   socket.on('chat message', function(msg){
  //     $('#messages').append($('<li>').text(msg));
  //   });

  // </script>


	// render: function() {
	// 	this.$el.html(this.chatboxTpl(this.model.toJSON()));
	// 	$('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
	// 	this.messages(this.model.get('messages'));
	// 	return this;
	// },
	// messages: function(messages) {
	// 	for (var i = 0; i < messages.length; i++) {
	// 		$('.chatbox-content').append(this.chatMessageTpl(messages[i]));
	// 	}
	// },
	// send: function(e) {
		// if (e.which === 13  && $input.val() !== '') {
		// 	e.preventDefault();
		// 	var socket = io();
		// 	socket.emit('chat message', $input.val());
		// 	// var user = this.model.get('users');
		// 	// var message = Object.create({
		// 	// 	content: content,
		// 	// 	sender: user[0],
		// 	// 	timestamp: new Date(),
		// 	// });
		// 	socket.on('chat message', function(msg){
		// 		var content = {content: msg, timestamp: new Date()};
		// 		console.log(content);
		// 		$('.chatbox-content').append(this.chatMessageTpl(content));
		// 		console.log(content);
  //     }.bind(this));
		// 		// var messages = this.model.get('messages');
		// 		// messages.push(message);
		// 	$('.chatbox-content')[0].scrollTop = $('.chatbox-content')[0].scrollHeight;
	 //  	$input.val('');
		// 	$input.focus();
		// 	// console.log('message', message);
		// 	// console.log('messages', messages);
  //   return false;
 //  	}
	// },


    
      
    
    

