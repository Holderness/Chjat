var gulp = require('gulp'),
    gutil = require('gulp-util'),
    concat = require('gulp-concat'),
    sourcemaps = require('gulp-sourcemaps');

gulp.task('default', ['watch', 'browsersync'], function() {
  return gutil.log('Gulp is running this bitch ass');
});
