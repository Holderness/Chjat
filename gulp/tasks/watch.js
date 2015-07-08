var gulp = require('gulp'),
    config = require('../config');

gulp.task('watch', ['browsersync'], function() {
  gulp.watch(config.css.src, ['css', 'css-watch']);
  gulp.watch(config.js.src, ['js']);
});