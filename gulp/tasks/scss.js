var gulp = require('gulp'),
    config = require('../config'),
    gutil = require('gulp-util'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps');
    concat = require('gulp-concat');

gulp.task('build-css', function() {
  return gulp.src(config.scss.src)
    .pipe(sourcemaps.init())
      .pipe(concat(config.scss.filename))
      .pipe(sass())
      .pipe(sourcemaps.write())
    .pipe(gulp.dest(config.scss.dest));
});
