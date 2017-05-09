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
// const path = require('path');

const Config = require('./config');
const Logging = require('./logging');
const Helpers = require('./helpers');
const Composer = require('./composer');
const Twitter = require('./twitter');
const rest = require('restler');

const Constants = {
  CDN_URL: 'http://cdn.forlabour.com'
};

/* ************************************************************
 *
 * COMPOSE
 *
 **************************************************************/
const _composeTwibbyn = (rearImgBuffer, frontImgUrl, toBuffer) => {
  let composer = new Composer(500, 500, toBuffer);
  composer.params('antialias', 'subpixel');
  composer.params('patternQuality', 'best');
  composer.imageFromBuffer(rearImgBuffer, {gravity: 'mid'});
  composer.params('globalAlpha', 1);
  composer.imageFromUrl(frontImgUrl, {
    width: 1.0, height: 1.0, gravity: 'bottom'
  });

  return composer.render();
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

  let imgUrl = twAuth.images.profile.replace('_normal', '');
  rest.get(imgUrl)
    .on('success', (data, response) => {
      let pathname = `${Config.appDataPath}/user_data/${req.user.id}_twibbyn_twitter_avatar_backup`;
      fs.writeFile(pathname, response.raw, err => {
        if (err) {
          throw err;
        }
        Logging.logDebug('Saving Twibbyn');
        Logging.logDebug(req.body);

        _composeTwibbyn(response.raw, `${Constants.CDN_URL}/${req.body.file}`, true)
          .then(imageBuffer => {
            Logging.logDebug('Got Twibbyn');
            res.send(Twitter.updateProfile(twAuth, imageBuffer));
            res.sendStatus(200);
          });
      });
    })
    .on('error', err => {
      Logging.log(err, Logging.Constants.LogLevel.ERR);
    });
};

module.exports.init = app => {
  Helpers.AppData.createFolder('/user_data');

  app.put('/twibbyn/twitter/save', _saveTwibbyn);
  app.put(`/twibbyn/twitter/restore`, _restoreBackup);
  app.get(`/twibbyn/twitter/hasbackup`, _hasBackup);
};
