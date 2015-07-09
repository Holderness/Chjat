var gulp = require('gulp'),
    config = require('../config'),
    concat = require('gulp-concat'),
    minifyCSS = require('gulp-minify-css');

gulp.task('css', function () {
   return gulp.src(config.css.src)
      .pipe(minifyCSS())
      .pipe(concat(config.css.filename))
      .pipe(gulp.dest(config.css.dest));
});
