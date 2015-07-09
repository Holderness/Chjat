var gulp = require('gulp'),
    browserSync = require('browser-sync').create();
    config = require('../config');

// Static server
gulp.task('browsersync', function() {
    browserSync.init(null, {
      open: true,
      port: 3000,
      proxy: 'localhost:3000',
    });
    gulp.watch("*.html").on("change", browserSync.reload);
    gulp.watch(config.css.src, ['css-watch']);
    gulp.watch(config.js.src, ['js-watch']);
    gulp.watch(config.scss.src, ['sass-watch']);
});

gulp.task('js-watch', ['js'], function() {
  browserSync.reload();
});

gulp.task('css-watch', ['css'], function() {
  browserSync.reload();
});

gulp.task('sass-watch', ['build-css'], function() {
  browserSync.reload();
});