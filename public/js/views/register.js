var app = app || {};

(function ($) {

  app.RegisterView = Backbone.View.extend({
    template: _.template($('#register').html()),
    usernameAvailableTemplate: _.template('<div class="username-available fa fa-check">username available</div>'),
    usernameTakenTemplate: _.template('<div class="username-taken fa fa-times">username taken</div>'),
    errorTemplate: _.template('<div class="login-error"><%= message %></div>'),
    events: {
      "submit": "submit",
      "keyup #username": "validateUsername",
      // "focus input": 'instructions',
    },
    initialize: function(options) {
      this.render();
      this.vent = options.vent;
    },
    submit: function(e) {
      e.preventDefault();
      this.signUp();
    },
    helpers: function() {
      this.instructions();
    },
    instructions: function() {
      $('input').on('focus', function(e) {
         $(this).parent().find("label[for="+e.target.name+"]").fadeIn(400);
      });
      $('input').on('blur', function(e) {
         $(this).parent().find("label[for="+e.target.name+"]").fadeOut(400);
      });
    },
    render: function() {
      this.$el.html(this.template());
      // this.instructions();
      return this;
    },
    signUp: function() {
      var this_ = this;
      var sendData = {
        username: this.$('#username').val(),
        password: this.$('#password').val(),
        name: this.$('#name').val(),
        email: this.$('#email').val()
      };
      $.ajax({
        url: "/register",
        method: 'POST',
        data: sendData,
        success: function(data) {
           console.log('success data: ', data);
           if (data.message) {
             this_.renderValidation(this_.errorTemplate(data));
           }
           else if (data.user) {
            app.ChatroomRouter.navigate('auth', { trigger: true });
            this_.vent.trigger("login", data.user);
           }
           else {
            console.log('oops, the else: ', data);
          }
        }
      }).done(function() {
        console.log('register in');
                    
      });
    },
    validateUsername: function() {
      if ($('#username').val().length < 5) { return; }
      var this_ = this;
      _.debounce($.post('/registerValidation', { username: $('#username').val() },function(data) {
         data.usernameAvailable ?
           this_.renderValidation(this_.usernameAvailableTemplate())
         :
           this_.renderValidation(this_.usernameTakenTemplate());
      }), 150);
    },
    renderValidation: function(what) {
      $('.register-error-container').empty();
      $(what).appendTo($('.register-error-container')).hide().fadeIn();
      setTimeout(function() {
        $('.register-error-container').children().first().fadeOut();
      }, 2000);
    }

  });

})(jQuery);