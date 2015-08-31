




var chatroom = require('../../app/controllers/chatroom');

module.exports = function(app) {
  app.route('/api').get();

  app.route('/api/chatrooms').get(chatroom.findAllChatrooms).post(chatroom.addChatroom);

  app.route('/api/uploadChatImage').post(chatroom.multerRestrictions, chatroom.uploadChatImage);

  app.route('/api/searchChatrooms').get(chatroom.findBy)
  // .put(chatroom.update).delete(chatroom.remove)
  ;

  app.route('/api/message').post(chatroom.addMessage);

};