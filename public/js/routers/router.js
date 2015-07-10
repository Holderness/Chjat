var app = app || {};

(function () {

  var LibraryRouter = Backbone.Router.extend({
    
    routes: {
      '': 'start',
      'log': 'login2',
      'reg': 'register',
      '_=_': 'library',
      '*filter': 'mult',
    },

    login: function() {
      this.loginView = new app.LoginView({model: app.LoginModel});
      this.loginView.render();
    },

    // library: function() {
    //   app.appView = new app.LibraryView();
    //   app.appView.start();
    //   $("#dateCompleted").datepicker();
    //   $('.update-dateCompleted').datepicker();
    // },

    // // mult: function(param) {
    // //   this.setFilter(param);
    // //   debugger;
    // //   this.library();
    // // },

    // setFilter: function(param) {
    //   // debugger;

    //   app.BookFilter = param || '';

    //   app.booklist.trigger('filter');

    //   // this.library();
    // },

    start: function() {
      app.mainController = new app.MainController();
      app.mainController.init();
    },

  //   register: function() {
  //     app.appView = new app.RegisterView();
  //   }
  });

  app.LibraryRouter = new LibraryRouter();
  Backbone.history.start();

})();