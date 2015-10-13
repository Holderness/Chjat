var app = app || {};

(function ($) {

  app.RegisterView = Backbone.View.extend({
    template: _.template($('#register').html()),
    invalidTemplate: _.template('<div class="user-info-invalid fa fa-times"><%= message %></div>'),
    validTemplate: _.template('<div class="user-info-valid fa fa-check"><%= message %></div>'),
    events: {
      "submit": "submit",
      "keyup #username": "validateUsername",
      "keyup #email": "validateEmail",
      "keyup #retypePassword": "validatePassword",
    },
    initialize: function(options) {
      this.render();
      this.vent = options.vent;
    },
    submit: function(e) {
      e.preventDefault();
      var passwordValidation = this.validatePassword();
      if (passwordValidation) {
        this.signUp();
      } else {

      }
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
      _.debounce($.post('/usernameValidation', { username: $('#username').val() },function(data) {
         data.usernameAvailable ?
           this_.renderValidation(this_.validTemplate({message: ' username available'}))
         :
           this_.renderValidation(this_.invalidTemplate({message: ' username taken'}));
      }), 150);
    },
    validateEmail: function() {
      if (!$('#email').val().match(/^\S+@\S+\.\S+$/)) { return; }
      var this_ = this;
      _.debounce($.post('/emailValidation', { email: $('#email').val() },function(data) {
         data.emailAvailable ?
           this_.renderValidation(this_.validTemplate({message: ' email available'}))
         :
           this_.renderValidation(this_.invalidTemplate({message: ' email taken'}));
      }), 150);
    },
    renderValidation: function(what) {
      $('.register-error-container').empty();
      $(what).appendTo($('.register-error-container')).hide().fadeIn();
      this.validationtimout = null;
      clearTimeout(this.validationTimeout);
      this.validationTimeout = setTimeout(function() {
        $('.register-error-container').children().first().fadeOut();
      }, 2000);
    },
    validatePassword: function() {
      if ($('#retypePassword').val().length > 5) {
        if ($('#password').val() !== $('#retypePassword').val()) {
          this.renderValidation(this.invalidTemplate({message: ' password does not match'}));
          return false;
        } else {
          this.renderValidation(this.validTemplate({message: ' password match'}));
          return true;
        }
      }
    },

  });

})(jQuery);