//
// Includes
//
'use strict';

const gulp = require('gulp');
const eslint = require('gulp-eslint');
const clean = require('gulp-clean');
const pug = require('gulp-pug');
const htmlPrettify = require('gulp-html-prettify');
const bowerFiles = require('main-bower-files');
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
gulp.task('js', function() {
  let content = gulp.src(Globs.SCRIPTS, {base: Paths.SOURCE})
		.pipe(eslint())
		.pipe(eslint.format());

  return environmentReplace(content)
    .pipe(babel({
      presets: ['es2015']
    }))
		.pipe(gulp.dest(Paths.DEST));
});

gulp.task('scripts', function() {
  return gulp.start(['js']);
});

//
// Markup
//
gulp.task('html', function() {
  return gulp.src(Globs.HTML, {base: Paths.SOURCE})
		.pipe(gulp.dest(Paths.DEST));
});

gulp.task('pug', function() {
  let content = gulp.src(Globs.PUG, {base: Paths.SOURCE})
		.pipe(pug())
    .pipe(htmlPrettify());

  return environmentReplace(content)
		.pipe(gulp.dest(Paths.DEST));
});

gulp.task('markup', function() {
  return gulp.start(['pug', 'html']);
});

//
// images
//
gulp.task('png', function() {
  return gulp.src(Globs.PNG)
    .pipe(imagemin())
		.pipe(gulp.dest(Paths.DEST_IMAGES));
});

gulp.task('jpg', function() {
  return gulp.src(Globs.JPG)
    .pipe(imagemin())
		.pipe(gulp.dest(Paths.DEST_IMAGES));
});

gulp.task('ico', function() {
  return gulp.src(Globs.ICO)
    .pipe(gulp.dest(Paths.DEST_IMAGES));
});

gulp.task('svg', function() {
  return gulp.src(Globs.SVG)
    .pipe(imagemin())
		.pipe(gulp.dest(Paths.DEST_IMAGES));
});

gulp.task('images', function() {
  return gulp.start(['png','jpg','ico','svg']);
});

//
// videos
//
gulp.task('mp4', function() {
  return gulp.src(Globs.MP4)
    .pipe(gulp.dest(Paths.DEST_VIDEOS));
});

gulp.task('videos', function() {
  return gulp.start(['mp4']);
});

//
// Static resources
//
gulp.task('json', function() {
  return gulp.src(Globs.JSON)
    .pipe(gulp.dest(Paths.DEST));
});

gulp.task('bower-files', function() {
  return gulp.src(bowerFiles({
    paths: {
      bowerDirectory: `${Paths.SOURCE}/bower_components`,
      bowerJson: `${Paths.SOURCE}/bower.json`
    }
  }), {
    base: `${Paths.SOURCE}/bower_components`
  }).pipe(gulp.dest(`${Paths.DEST}/bower_components`));
});

gulp.task('resources', function() {
  return gulp.start(['json', 'bower-files']);
});

//
//
//
gulp.task('clean', function() {
  return gulp.src([`${Paths.DEST}/*`], {read: false})
  .pipe(clean())
});

gulp.task('build', ['clean'], function() {
  return gulp.start(['resources', 'scripts', 'images', 'videos', 'markup']);
});

gulp.task('build-sw', function(cb){
  var swPrecache = require('sw-precache');
  var rootDir = Paths.BUNDLED;

  swPrecache.write(`${rootDir}/service-worker.js`, {
    staticFileGlobs: [
      `${Paths.BUNDLED}/manifest.json`,
      `${Paths.BUNDLED}/bower_components/webcomponentsjs/webcomponents-lite.min.js`,
      `${Paths.BUNDLED}/src/**/*`,
      `${Paths.BUNDLED}/images/**/*`,
      `${Paths.BUNDLED}/videos/**/*`
    ],
    stripPrefix: rootDir
  }, cb);
});


gulp.task('watch', ['build'], function() {
  gulp.watch(Globs.SCRIPTS, ['scripts']);
  gulp.watch(Globs.MP4, ['MP4']);
  gulp.watch(Globs.VIDEOS, ['videos']);
  gulp.watch(Globs.MARKUP, ['markup']);
  gulp.watch(Globs.BOWER_JSON, ['bower-files']);
  gulp.watch(Globs.JSON, ['json']);
});
