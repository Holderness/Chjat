var app = app || {};

(function () {

  var ChatroomRouter = Backbone.Router.extend({
    
    routes: {
      '': 'start',
    },

    start: function() {
      app.mainController = new app.MainController();
      app.mainController.init();
    },

  });

  app.ChatroomRouter = new ChatroomRouter();
  Backbone.history.start();

})();