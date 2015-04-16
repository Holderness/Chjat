var User = Backbone.Model.extend({
	defaults: {
		username: '',
		avatar: '',
		inbox: [],
	},
});

var Conversation = Backbone.Model.extend({
	defaults: {
		users: [],
		messages: [],
	},
});