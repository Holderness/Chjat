var gulp = require('gulp'),
    config = require('../config');

gulp.task('watch', function() {
  // gulp.watch(config.css.src, ['css']);
  // gulp.watch(config.js.src, ['js']);
  gulp.watch('.public/scss/**/*.scss', ['build-css']);
});