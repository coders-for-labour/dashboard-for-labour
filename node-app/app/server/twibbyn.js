'use strict';

/**
 * Dashboard for Labour
 *
 * @file twibbyn.js
 * @description
 * @module System
 * @author Lighten
 *
 */

const fs = require('fs');
const path = require('path');

const Config = require('./config');
const Logging = require('./logging');
const Helpers = require('./helpers');
const Composer = require('./composer');
const Twitter = require('./twitter');
const rest = require('restler');
const Storage = require('@google-cloud/storage');
const sb = require('stream-buffers');

const storage = Storage(); // eslint-disable-line new-cap

/* ************************************************************
 *
 * COMPOSE
 *
 **************************************************************/
const _composeTwibbyn = (rearImgBuffer, rearImgBufferUid, frontImgUrl, toBuffer) => {
  let composer = new Composer(500, 500, toBuffer);
  composer.params('antialias', 'subpixel');
  composer.params('patternQuality', 'best');
  composer.imageFromBuffer(rearImgBuffer, rearImgBufferUid, {gravity: 'mid'});
  composer.params('globalAlpha', 1);
  composer.imageFromUrl(frontImgUrl, {
    width: 1.0, height: 1.0, gravity: 'bottom'
  });

  return composer.render();
};

const _getAvatar = (filename, imgUrl) => {
  Logging.log(`Checking ${Config.cdnBucket} for backup of ${filename}`);

  const file = storage.bucket(Config.cdnBucket).file(`b/${filename}`);
  return file.exists()
    .then(exists => {
      if (exists[0]) {
        Logging.log(`Backup avatar exists. Loading that.`);
        return file.download()
          .then(contents => contents[0]);
      }

      Logging.log(`Backup avatar doesn't exist. Loading external.`);
      let rex = /\.(\w+)$/;
      let matches = rex.exec(imgUrl);
      let subType = 'jpg';
      if (matches) {
        subType = matches[1];
      }

      return new Promise((resolve, reject) => {
        rest.get(imgUrl)
          .on('success', (data, response) => {
            Helpers.GCloud.Storage.saveBuffer(file, response.raw, {
              contentType: `image/${subType}`
            }, true).then(resolve, reject);
          })
          .on('error', reject);
      });
    });
};

/* ************************************************************
 *
 * SAVE
 *
 **************************************************************/
const _hasBackup = (req, res) => {
  if (!req.user) {
    res.sendStatus(403);
    return;
  }
  // let pathname = `${Config.appDataPath}/user_data/${req.user.rhizomeId}_twibbyn_twitter_avatar_backup`;
  return res.json(false);
};

const _restoreBackup = (req, res) => {
  if (!req.user) {
    res.sendStatus(403);
    return;
  }
  // let pathname = `${Config.appDataPath}/user_data/${req.user.rhizomeId}_twibbyn_twitter_avatar_backup`;
  return res.json(false);
};

/* ************************************************************
 *
 * SAVE
 *
 **************************************************************/
const _saveTwibbyn = (req, res) => {
  if (!req.user) {
    res.sendStatus(403);
    return;
  }

  const twAuth = req.user.auth.find(a => a.app === 'twitter');
  if (!twAuth) {
    res.send(400);
    return;
  }
  Logging.logDebug(twAuth.images);

  const imgUrl = twAuth.images.profile.replace('_normal', '');
  const filename = `${req.user.id}_twibbyn_twitter_avatar_backup`;
  // const pathname = `${Config.appDataPath}/user_data/${req.user.id}_twibbyn_twitter_avatar_backup`;

  _getAvatar(filename, imgUrl)
    .then(avatarBuffer => {
      Logging.logDebug('Composing Twibbyn');
      _composeTwibbyn(avatarBuffer, imgUrl, `http://${Config.cdnUrl}/${req.body.file}`, true)
        .then(twibbyn => {
          Logging.logDebug(`Got Twibbyn: ${path.basename(twibbyn.pathName)}`);
          // res.send(Twitter.updateProfile(twAuth, twibbyn.buffer));
          res.sendStatus(200);
        });
    })
    .catch(Logging.Promise.logError());
};

/* ************************************************************
 *
 * FACEBOOK
 *
 **************************************************************/
const _getFbTwibbyn = (req, res) => {
  if (!req.user) {
    res.sendStatus(403);
    return;
  }

  const fbAuth = req.user.auth.find(a => a.app === 'facebook');
  if (!fbAuth) {
    res.send(400);
    return;
  }
  Logging.logDebug(fbAuth.images);

  const imgUrl = `https://graph.facebook.com/${fbAuth.appId}/picture?width=500`;
  const filename = `${req.user.id}_twibbyn_facebook_avatar_backup`;
  // const pathname = `${Config.appDataPath}/user_data/${req.user.id}_twibbyn_facebook_avatar_backup`;

  _getAvatar(filename, imgUrl)
    .then(avatarBuffer => {
      Logging.logDebug(`Composing Twibbyn: ${imgUrl}`);
      _composeTwibbyn(avatarBuffer, imgUrl, `http://${Config.cdnUrl}/${req.query.file}`)
        .then(twibbyn => {
          Logging.logDebug(`Got Twibbyn: ${path.basename(twibbyn.pathName)}`);
          // twibbyn.stream.pipe(res);
          res.json({file: path.basename(twibbyn.pathName)});
        });
    });
};

/* ************************************************************
 *
 * POST
 *
 **************************************************************/
const _postTwitter = (req, res) => {
  if (!req.user) {
    res.sendStatus(403);
    return;
  }

  const twAuth = req.user.auth.find(a => a.app === 'twitter');
  if (!twAuth) {
    res.send(400);
    return;
  }

  Logging.logDebug(`Tweeting: ${req.body.tweet}, http://${Config.cdnUrl}/${req.body.file}`);
  rest.get(`http://${Config.cdnUrl}/${req.body.file}`)
    .on('success', (data, response) => {
      Twitter.tweetMedia(twAuth, req.body.tweet, response.raw)
        .then(results => {
          res.send(results);
        });
    })
    .on('fail', () => res.send(false))
    .on('error', () => res.send(false));
};

module.exports.init = app => {
  Helpers.AppData.createFolder('/user_data');

  app.get('/twibbyn/facebook', _getFbTwibbyn);
  app.put('/twibbyn/twitter/save', _saveTwibbyn);
  app.put(`/twibbyn/twitter/restore`, _restoreBackup);
  app.get(`/twibbyn/twitter/hasbackup`, _hasBackup);
  app.post(`/twitter`, _postTwitter);
};
