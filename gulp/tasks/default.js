var gulp = require('gulp'),
    gutil = require('gulp-util'),
    sass = require('gulp-sass'),
    concat = require('gulp-concat'),
    sourcemaps = require('gulp-sourcemaps');

gulp.task('default', ['watch', 'browsersync'], function() {
  return gutil.log('Gulp is running this bitch ass');
});
