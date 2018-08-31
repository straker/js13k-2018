const gulp = require('gulp');
const size = require('gulp-size');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const terser = require('gulp-terser');

gulp.task('build', function() {
  return gulp.src(['src/kontra.js', 'src/wavesurfer.js', 'src/globals.js', 'src/audio.js', 'src/drawing.js', 'src/font.js', 'src/input.js', 'src/loop.js', 'src/ui.js', 'src/scenes.js', 'src/ship.js', 'src/time.js', 'src/index.js'])
    .pipe(concat('index.js'))
    .pipe(gulp.dest('.'))
    .pipe(rename('dist.js'))
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
  gulp.watch('src/*.js', ['build']);
});

gulp.task('default', ['build']);