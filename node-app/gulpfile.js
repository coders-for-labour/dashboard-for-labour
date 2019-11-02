'use strict';

const gulp = require('gulp');
const eslint = require('gulp-eslint');
const gulpClean = require('gulp-clean');
const bump = require('gulp-bump');

//
// Scripts
//
const js = function() {
  return gulp.src('app/server/**/*.js')
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(gulp.dest('deploy'));
};
const scripts = function(done) {
	return gulp.series('js')(done);
};

//
// Static resources
//
const json = function() {
  return gulp.src('app/server/*.json')
    .pipe(gulp.dest('deploy'));
};
const resources = function(done) {
	return gulp.series('json')(done);
};

//
// Commands
//
const clean = function() {
	return gulp.src(['deploy/*'], {read: false})
		.pipe(gulpClean());
};
const build = function(done) {
	return gulp.series('clean', gulp.parallel('scripts', 'resources'))(done);
};
const watch = function(done) {
  return gulp.series('build', function() {
    gulp.watch(['app/server/**/*.js'], gulp.series('scripts'));
    gulp.watch('app/server/**/*.json', gulp.series('resources'));
  })(done);
};

const bumpMajor = () => {
	return gulp.src(['./package.json', '../README.md', './app/server/config.json'], {base: './'})
		.pipe(bump({type: 'major'}))
		.pipe(gulp.dest('./'));
};
const bumpMinor = () => {
	return gulp.src(['./package.json', '../README.md', './app/server/config.json'], {base: './'})
		.pipe(bump({type: 'minor'}))
		.pipe(gulp.dest('./'));
};
const bumpPatch = () => {
	return gulp.src(['./package.json', '../README.md', './app/server/config.json'], {base: './'})
		.pipe(bump({type: 'patch'}))
		.pipe(gulp.dest('./'));
};
const bumpPrerelease = () => {
	return gulp.src(['./package.json', '../README.md', './app/server/config.json'], {base: './'})
		.pipe(bump({type: 'prerelease'}))
		.pipe(gulp.dest('./'));
};

module.exports = {
	js,
	scripts,

	json,
	resources,

	clean,
	build,
	watch,

	bumpMajor,
	bumpMinor,
	bumpPatch,
	bumpPrerelease,
};