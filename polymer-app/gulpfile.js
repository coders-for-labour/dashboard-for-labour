//
// Includes
//
'use strict';

const gulp = require('gulp');
const eslint = require('gulp-eslint');
const gulpClean = require('gulp-clean');
const gulpPug = require('gulp-pug');
const mainBowerFiles = require('main-bower-files');
const imagemin = require('gulp-imagemin');
const babel = require('gulp-babel');
const replace = require('gulp-replace');

const Paths = {
  SOURCE: 'app/edit',
  DEST: 'app/serve',
  BUNDLED: 'build/bundled/app/serve',
  DEST_SRC: 'app/serve/src',
  DEST_IMAGES: 'app/serve/images',
  DEST_VIDEOS: 'app/serve/videos'
};

const Globs = {
  SCRIPTS: [`${Paths.SOURCE}/*.js`, `${Paths.SOURCE}/src/*.js`, `${Paths.SOURCE}/src/**/*.js`],
  HTML: [`${Paths.SOURCE}/src/**/*.html`,`${Paths.SOURCE}/*.html`],
  PUG: [`${Paths.SOURCE}/*.pug`,`${Paths.SOURCE}/src/**/*.pug`],
  MARKUP: [`${Paths.SOURCE}/src/**/*.html`,`${Paths.SOURCE}/*.html`,`${Paths.SOURCE}/*.pug`,`${Paths.SOURCE}/src/**/*.pug`],
  BOWER_JSON: [`${Paths.SOURCE}/bower.json`],
  JSON: [`${Paths.SOURCE}/*.json`],
  MP4: [`${Paths.SOURCE}/videos/**/*.mp4`],
  PNG: [`${Paths.SOURCE}/images/**/*.png`],
  JPG: [`${Paths.SOURCE}/images/**/*.jpg`],
  SVG: [`${Paths.SOURCE}/images/**/*.svg`],
  ICO: [`${Paths.SOURCE}/images/**/*.ico`],
  IMAGES: [`${Paths.SOURCE}/images/**/*.png`,`${Paths.SOURCE}/images/**/*.jpg`,`${Paths.SOURCE}/images/**/*.svg`,`${Paths.SOURCE}/images/**/*.gif`,`${Paths.SOURCE}/images/**/*.ico`]
};

let Environment = {
  NODE_ENV: '',
  D4L_CDN_DEV_URL: '',
  D4L_CDN_PROD_URL: '',
  D4L_RHIZOME_DEV_URL: '',
  D4L_RHIZOME_PROD_URL: '',
  D4L_RHIZOME_TEST_URL: '',
  D4L_FB_APP_ID: ''
};

for (let variable in Environment) {
  if (!process.env[variable]) {
    throw new Error(`You must specify the ${variable} environment variable`);
  }
  if (process.env[variable]) {
    Environment[variable] = process.env[variable];
  }
}

function environmentReplace(stream) {
  let outStr = null;
  switch (Environment.NODE_ENV) {
    case 'production':
      outStr = stream.pipe(replace('%{D4L_CDN_URL}%', Environment.D4L_CDN_PROD_URL))
        .pipe(replace('%{D4L_RHIZOME_URL}%', Environment.D4L_RHIZOME_PROD_URL))
        .pipe(replace('%{D4L_FACEBOOK_APP_ID}%', Environment.D4L_FB_APP_ID));
      break;
    case 'development':
      outStr = stream.pipe(replace('%{D4L_CDN_URL}%', Environment.D4L_CDN_DEV_URL))
        .pipe(replace('%{D4L_RHIZOME_URL}%', Environment.D4L_RHIZOME_DEV_URL))
        .pipe(replace('%{D4L_FACEBOOK_APP_ID}%', Environment.D4L_FB_APP_ID));
      break;
    case 'test':
      outStr = stream.pipe(replace('%{D4L_RHIZOME_URL}%', Environment.D4L_RHIZOME_DEV_URL));
      break;
  }

  return outStr;
}

//
// Scripts
//
const js = function() {
  let content = gulp.src(Globs.SCRIPTS, {base: Paths.SOURCE})
    .pipe(eslint())
    .pipe(eslint.format());

  return environmentReplace(content)
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(gulp.dest(Paths.DEST));
};
const scripts = function(done) {
	return gulp.series('js')(done);
};

//
// Markup
//
const html = function() {
  return gulp.src(Globs.HTML, {base: Paths.SOURCE})
		.pipe(gulp.dest(Paths.DEST));
};
const pug = function() {
  let content = gulp.src(Globs.PUG, {base: Paths.SOURCE})
    .pipe(gulpPug());

  return environmentReplace(content)
    .pipe(gulp.dest(Paths.DEST));
};
const markup = function(done) {
	return gulp.series('html', 'pug')(done);
};

//
// images
//
const png = function() {
  return gulp.src(Globs.PNG)
    .pipe(imagemin())
    .pipe(gulp.dest(Paths.DEST_IMAGES));
};
const jpg = function() {
  return gulp.src(Globs.JPG)
    .pipe(imagemin())
    .pipe(gulp.dest(Paths.DEST_IMAGES));
};
const ico = function() {
  return gulp.src(Globs.ICO)
    .pipe(gulp.dest(Paths.DEST_IMAGES));
};
const svg = function() {
  return gulp.src(Globs.SVG)
    .pipe(imagemin())
    .pipe(gulp.dest(Paths.DEST_IMAGES));
};
const images = function(done) {
	return gulp.series('png','jpg','ico','svg')(done);
};

//
// videos
//
const mp4 = function() {
  return gulp.src(Globs.MP4)
    .pipe(gulp.dest(Paths.DEST_VIDEOS));
};
const videos = function(done) {
	return gulp.series('mp4')(done);
};

//
// Static resources
//
const json = function() {
  return gulp.src(Globs.JSON)
    .pipe(gulp.dest(Paths.DEST));
};
const bowerFiles = function() {
  return gulp.src(mainBowerFiles({
    paths: {
      bowerDirectory: `${Paths.SOURCE}/bower_components`,
      bowerJson: `${Paths.SOURCE}/bower.json`
    }
  }), {
    base: `${Paths.SOURCE}/bower_components`
  }).pipe(gulp.dest(`${Paths.DEST}/bower_components`));
};
const resources = function(done) {
	return gulp.series('json', 'bowerFiles')(done);
};

//
//
//
const clean = function() {
	return gulp.src([`${Paths.DEST}/*`], {read: false})
		.pipe(gulpClean());
};
const build = function(done) {
	return gulp.series('clean', gulp.parallel('resources', 'scripts', 'images', 'videos', 'markup'))(done);
};
const watch = function(done) {
  return gulp.series('build', function() {
    gulp.watch(['src/**/*.js'], gulp.series('scripts'));
    gulp.watch('src/**/*.json', gulp.series('resources'));
    gulp.watch(Globs.SCRIPTS, gulp.series('scripts'));
    gulp.watch(Globs.MP4, gulp.series('mp4'));
    gulp.watch(Globs.MARKUP, gulp.series('markup'));
    gulp.watch(Globs.BOWER_JSON, gulp.series('bowerFiles'));
    gulp.watch(Globs.JSON, gulp.series('json'));
  })(done);
};

module.exports = {
	js,
	scripts,

	html,
  pug,
  markup,

  png,
  jpg,
  ico,
  svg,
  images,

  mp4,
  videos,

  json,
  bowerFiles,
  resources,

	clean,
	build,
	watch
};