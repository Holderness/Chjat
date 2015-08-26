var app = app || {};


(function($) {

  app.ChatImageView = Backbone.View.extend({
  
    events: {
      'change #chatImageUpload': 'renderThumb',
      'attachImage #chatImageUploadForm': 'upload',
      'click #addChatImageBtn': 'submit',
    },

    render: function() {
      this.renderThumb();
    },

    renderThumb: function() {
      var input = this.$('#chatImageUpload');
      var img = this.$('#uploadedChatImage')[0];
      if(input.val() !== '') {
        var selected_file = input[0].files[0];
        var reader = new FileReader();
        reader.onload = (function(aImg) {
          return function(e) {
            aImg.src = e.target.result;
          };
        })(img);
        reader.readAsDataURL( selected_file );
      }
    },

    console: function() {
        console.log('this is the console.');
        console.log('this is the console.');
        console.log('this is the console.');
        console.log('this is the console.');
        console.log('this is the console.');
        console.log('this is the console.');
        console.log('this is the console.');
        console.log('this is the console.');
        console.log('this is the console.');
        console.log('this is the console.');
        console.log('this is the console.');
    },

    submit: function(e) {
      e.preventDefault();
      debugger;
      this.$form = this.$('#chatImageUploadForm');
      this.$form.trigger('attachImage');
    },

    upload: function() {
      var _this = this;
        debugger;
      if (this.$('#chatImageUpload')[0].files.length > 0) {
        $.ajax({
          method: 'POST',
          url: '/api/uploadChatImage',
          files: _this.$('#chatImageUpload')[0].files,
          error: function( xhr ) {
            _this.renderStatus('Error: ' + xhr.status);
            alert('Your image is either too large or it is not a .jpeg, .png, or .gif.');
          },
          success: function( response ) {
            console.log('imgUpload response: ', response);
            _this.trigger('image-uploaded', [response.url]);
            console.log('imgUpload path ', response.path);

            _this.clearField();
          }
        });
      } else {
       this.trigger('image-uploaded');
      }
      return false;
    },

    renderStatus: function( status ) {
      $('#status').text(status);
    },

    clearField: function() {
      this.$('#uploadedChatImage')[0].src = '';
      this.$('#chatImageUpload').val('');
    }

  });

})(jQuery);