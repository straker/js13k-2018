const gulp = require('gulp');
const size = require('gulp-size');
const concat = require('gulp-concat');
const terser = require('gulp-terser');

gulp.task('build', function() {
  return gulp.src(['./kontra.js', 'wavesurfer.js', 'index.js'])
    .pipe(concat('dist.js'))
    .pipe(terser())
    .pipe(size({
      gzip: true
    }))
    .pipe(gulp.dest('.'))
});

gulp.task('dist', function() {
  return gulp.src(['./dist.js', 'index.html'])
    .pipe(size({
      gzip: true
    }))
})

gulp.task('watch', function() {
  gulp.watch('index.js', ['build']);
});

gulp.task('default', ['build']);