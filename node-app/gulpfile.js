//
// Includes
//

const gulp = require('gulp');
const eslint = require('gulp-eslint');
const clean = require('gulp-clean');
const bump = require('gulp-bump');

//
// Scripts
//

gulp.task('js', function() {
  return gulp.src('app/server/**/*.js')
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(gulp.dest('deploy'));
});

gulp.task('scripts', function() {
  return gulp.start(['js']);
});

//
// Static resources
//
gulp.task('json', function() {
  return gulp.src('app/server/*.json')
    .pipe(gulp.dest('deploy'));
});

gulp.task('resources', function() {
  return gulp.start(['json']);
});

//
// Commands
//

gulp.task('watch', ['clean'], function() {
  gulp.start('scripts', 'resources');

  gulp.watch(['app/server/**/*.js'], ['scripts']);
  gulp.watch('app/server/**/*.json', ['resources']);
});

gulp.task('clean', function() {
  return gulp.src(['deploy/*'], {read: false})
  .pipe(clean());
});

gulp.task('build', ['clean'], function() {
  return gulp.start('scripts', 'resources');
});

gulp.task('bump-major', function() {
  return gulp.src(['./bower.json', './package.json', './README.md', 'app/server/config.json'])
    .pipe(bump({type: 'major'}))
    .pipe(gulp.dest('./'));
});

gulp.task('bump-minor', function() {
  return gulp.src(['./bower.json', './package.json', './README.md', 'app/server/config.json'])
    .pipe(bump({type: 'minor'}))
    .pipe(gulp.dest('./'));
});

gulp.task('bump-patch', function() {
  return gulp.src(['./bower.json', './package.json', './README.md', 'app/server/config.json'])
    .pipe(bump({type: 'patch'}))
    .pipe(gulp.dest('./'));
});

gulp.task('bump-prerelease', function() {
  return gulp.src(['./bower.json', './package.json', './README.md', 'app/server/config.json'])
    .pipe(bump({type: 'prerelease'}))
    .pipe(gulp.dest('./'));
});

