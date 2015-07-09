var gulp = require('gulp'),
    config = require('../config'),
    gutil = require('gulp-util'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps');
    concat = require('gulp-concat');


gulp.task('js', function () {
   return gulp.src(config.js.src)
      .pipe(sourcemaps.init())
        .pipe(concat(config.js.filename))
        .pipe(gutil.env.type === 'production' ? uglify() : gutil.noop())
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(config.js.dest));
});