




var chatroom = require('../../app/controllers/chatroom');

module.exports = function(app) {
  app.route('/api').get();

  app.route('/api/chatrooms').get(chatroom.findAllChatrooms).post(chatroom.addChatroom);

  // app.route('/api/search/').get(chatroom.findBy);

  app.route('/api/chatrooms/:name').get(chatroom.findBy)
  // .put(chatroom.update).delete(book.remove)
  ;

  app.route('/api/message').post(chatroom.addMessage);

};