// var gulp = require('gulp'),
//     browserify = require('browserify'),
//     uglify = require('gulp-uglify'),
//     source = require('vinyl-source-stream'),
//     buffer = require('vinyl-buffer'),
//     sourcemaps = require('gulp-sourcemaps'),
//     gutil = require('gulp-util');

// gulp.task('browserify', function () {
//   var browserified = transform(function(filename) {
//     var b = browserify(filename);
//     return b.bundle();
//   });
  
//   return gulp.src(['./public/js/**/*.js'])
//     .pipe(browserified)
//     .pipe(uglify())
//     .pipe(gulp.dest('./TEST-BUILD'));
// });


// gulp.task('browserify', function () {
//   var b = browserify({
//     entries: './public/js/main.js',
//     debug: true
//   });

//   return b.bundle()
//     .pipe(source('app.js'))
//     .pipe(buffer())
//     .pipe(sourcemaps.init({loadMaps: true}))
//         // Add transformation tasks to the pipeline here.
//         .pipe(uglify())
//         .on('error', gutil.log)
//     .pipe(sourcemaps.write('./'))
//     .pipe(gulp.dest('./dist/js/'));
// });

