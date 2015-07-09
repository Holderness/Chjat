gulp.task('build-css', function() {
  return gulp.src(config.scss.src)
    .pipe(sourcemaps.init())
      .pipe(concat(config.scss.filename))
      .pipe(sass())
      .pipe(sourcemaps.write())
    .pipe(gulp.dest(config.scss.dest));
});
