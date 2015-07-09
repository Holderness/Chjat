var gulp = require('gulp'),
    gutil = require('gulp-util'),
    sass = require('gulp-sass'),
    concat = require('gulp-concat'),
    sourcemaps = require('gulp-sourcemaps');

gulp.task('default', ['watch', 'browsersync'], function() {
  return gutil.log('Gulp is running this bitch ass');
});

gulp.task('build-css', function() {
  return gulp.src(config.scss.src)
    .pipe(sourcemaps.init())
      .pipe(concat(config.scss.filename))
      .pipe(sass())
      .pipe(sourcemaps.write())
    .pipe(gulp.dest(config.scss.dest));
});

