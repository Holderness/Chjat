var gulp = require('gulp'),
    config = require('../config'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat');


gulp.task('js', function () {
   return gulp.src(config.js.src)
      .pipe(uglify())
      .pipe(concat(config.js.filename))
      .pipe(gulp.dest(config.js.dest));
});