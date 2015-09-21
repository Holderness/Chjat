var app = app || {};

(function () {

  app.PrivateRoomCollection = Backbone.Collection.extend({
    model: app.ChatroomModel,
  });

})();