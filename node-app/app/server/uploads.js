'use strict';

/**
 * Dashboard for Labour
 *
 * @file uploads.js
 * @description
 * @module System
 * @author Coders for Labour
 *
 */

// const fs = require('fs');
const crypto = require('crypto');
const Config = require('./config');
const Logging = require('./logging');
const Helpers = require('./helpers');
const Storage = require('@google-cloud/storage');
// const sb = require('stream-buffers');

const storage = Storage(); // eslint-disable-line new-cap

/* ************************************************************
 *
 * Uploads
 *
 **************************************************************/
const __initUploads = app => {
  app.post('/image/upload', (req, res) => {
    if (!req.user) {
      res.sendStatus(401).json(false);
      return;
    }

    let file = req.body.file;
    let rex = /^data:(\w+\/\w+);base64,(.+)$/;
    if (rex.test(file) === false) {
      res.sendStatus(400).json(false);
      return;
    }

    let matches = rex.exec(file);
    let mimeType = matches[1];
    let data = matches[2];
    let buffer = Buffer.from(data, 'base64');

    let fileType = mimeType.split('/');
    if (fileType[0] !== 'image') {
      res.sendStatus(400).json(false);
      return;
    }

    let hash = crypto.createHash('sha256');
    hash.update(data);
    let digest = hash.digest('hex');

    let fname = `u/${digest}.${fileType[1]}`;
    let gfile = storage
      .bucket(Config.cdnBucket)
      .file(fname);

    gfile.exists()
      .then(exists => {
        console.log(exists);
        if (exists[0]) {
          Logging.log(`File ${fname} already exists.`);
          return;
        }

        return Helpers.GCloud.Storage.saveBuffer(gfile, buffer, {contentType: `images/${fileType[1]}`});
      })
      .then(() => res.json(`${digest}.${fileType[1]}`))
      .catch(Logging.Promise.logError());
  });
};

module.exports = {
  init: __initUploads
};
