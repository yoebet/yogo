let gulp = require('gulp');
let browserify = require('browserify');
let source = require('vinyl-source-stream');
let buffer = require('vinyl-buffer');
let concat = require('gulp-concat');
let uglify = require('gulp-uglify-es').default;
let sourcemaps = require('gulp-sourcemaps');
let rename = require('gulp-rename');
let del = require('del');
let gutil = require('gulp-util');
let jasmineBrowser = require('gulp-jasmine-browser');

const paths = {
  scripts: ['src/**/*.js']
};

gulp.task('clean', function() {
  return del(['dist']);
});

gulp.task('scripts', ['clean'], function() {
  const b = browserify({
    entries: 'src/game_model/sgf_parser.js'
  });
  return b.bundle()
    .pipe(source('yogo.js'))
    .pipe(buffer())
    .pipe(gulp.dest('dist/'))
    .pipe(rename({ extname: '.min.js' }))
    .pipe(sourcemaps.init())
    .pipe(uglify())
    //.pipe(concat('all.min.js'))
    .on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dist/'));
});

gulp.task('watch', function() {
  gulp.watch(paths.scripts, ['scripts']);
});

gulp.task('jasmine', function() {
  return gulp.src(['dist/yogo.js', 'spec/**/*.spec.js'])
    .pipe(jasmineBrowser.specRunner())
    .pipe(jasmineBrowser.server({port: 8888}));
});

gulp.task('default', ['watch', 'scripts']);
