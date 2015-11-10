




var chatroom = require('../../app/controllers/chatroom');
var multer = require('multer');
var imgSizeFilter = multer({limits: {fileSize:1024*1024}});

module.exports = function(app) {
  app.route('/api').get();

  app.route('/api/chatrooms').get(chatroom.findAllChatrooms).post(chatroom.addChatroom);

  app.route('/api/uploadChatImage').post(imgSizeFilter, chatroom.uploadChatImage);

  app.route('/api/uploadChatroomImage').post(imgSizeFilter, chatroom.uploadChatroomImage);

  app.route('/api/searchChatrooms').get(chatroom.findBy);
  app.route('/api/publicChatrooms').get(chatroom.publicChatrooms)
  // .put(chatroom.update).delete(chatroom.remove)
  ;

  app.route('/api/message').post(chatroom.addMessage);

};