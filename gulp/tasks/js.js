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

      .pipe(sourcemaps.write())
      .pipe(gulp.dest(config.js.dest));
});

gulp.task('js-vendor', function () {
   return gulp.src(config.js.vendor)
      .pipe(sourcemaps.init())
        .pipe(concat(config.js.vendorfile))
        .pipe(uglify())
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(config.js.dest));
});