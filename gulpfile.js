var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    jshint = require('gulp-jshint'),
    concat = require('gulp-concat');

gulp.task('default', function() {
  // place code for your default task here
});

gulp.task('minify', function () {
   gulp.src('public/js/main.js')
      .pipe(uglify())
      .pipe(gulp.dest('public/build'));
});

gulp.task('js', function () {
   return gulp.src([
      'public/js/lib/jquery.js',
      'public/js/lib/autosize.min.js',
      'public/js/lib/underscore.js',
      'public/js/lib/backbone.js',
      'public/js/lib/bootstrap.js',
      'public/js/lib/moment.js',
      'public/js/lib/livestamp.js',
      'public/js/lib/wow.js',
      'public/js/lib/progressbar.js',
      'public/js/models/chat-models.js',
      'public/js/views/main.js',
      'public/js/socketclient.js',
      'public/js/main.js',
      'public/js/**/*.js',
    ])
      .pipe(jshint())
      .pipe(jshint.reporter('default'))
      .pipe(uglify())
      .pipe(concat('main.js'))
      .pipe(gulp.dest('public/build'));
});

