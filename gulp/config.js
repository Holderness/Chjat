var dest = "./public/build";

module.exports = {
  js: {
    vendor: [
      'public/js/lib/jquery.js',
      'public/js/lib/autosize.min.js',
      'public/js/lib/underscore.js',
      'public/js/lib/backbone.js',
      'public/js/lib/bootstrap.js',
      'public/js/lib/moment.js',
      'public/js/lib/livestamp.js',
      'public/js/lib/wow.js',
      'public/js/lib/progressbar.js',
    ],
    src: [
      'https://cdn.socket.io/socket.io-1.2.0.js',
      'public/js/models/chat-models.js',
      'public/js/views/main.js',
      'public/js/socketclient.js',
      'public/js/main.js',
      'public/js/*.js',
    ],
    dest: dest,
    vendorfile: "vendor.js",
    filename: "main.js"
  },
  css: {
    src: [
      'public/css/lib/bootstrap.css',
      'public/css/lib/bootstrap-theme.css',
      'public/css/lib/animate.css',
      'public/css/lib/font-awesome.css',
      'public/css/chat.style.css',
      'http://fonts.googleapis.com/css?family=Source+Sans+Pro'
    ],
    dest: dest,
    filename: "main.css"
  },
  scss: {
    src: [
    'public/scss/style.scss',
    'public/scss/**/*.scss'
    ],
    dest: dest,
    filename: "sass.css"
  },
  browserSync: {
    server: {
      baseDir: dest
    }
  }

};