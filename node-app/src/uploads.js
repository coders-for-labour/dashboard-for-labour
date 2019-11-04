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

const Config = require('node-env-obj')('../../');

const fs = require('fs');
const crypto = require('crypto');
const Logging = require('./logging');
const Helpers = require('./helpers');
const Storage = require('@google-cloud/storage');
const storage = Storage(); // eslint-disable-line new-cap

/* ************************************************************
 *
 * Uploads
 *
 **************************************************************/
const __initUploads = (app) => {
  app.post('/image/upload', (req, res) => {
    if (!req.user) {
      res.sendStatus(401).json(false);
      return;
    }

    const file = req.body.file;
    const rex = /^data:(\w+\/\w+);base64,(.+)$/;
    if (rex.test(file) === false) {
      res.sendStatus(400).json(false);
      return;
    }

    const matches = rex.exec(file);
    const mimeType = matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');

    const fileType = mimeType.split('/');
    if (fileType[0] !== 'image') {
      res.sendStatus(400).json(false);
      return;
    }

    const hash = crypto.createHash('sha256');
    hash.update(data);
    const digest = hash.digest('hex');

    const fname = `u/${digest}.${fileType[1]}`;
    const gfile = storage
      .bucket(Config.cdnBucket)
      .file(fname);

    gfile.exists()
      .then((exists) => {
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
  init: __initUploads,
};
