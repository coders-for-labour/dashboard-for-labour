'use strict';

/**
 * Dashboard for Labour
 *
 * @file helpers.js
 * @description Helpers
 * @module System
 * @author Lighten
 *
 */

const fs = require('fs');
const Config = require('./config');
const sb = require('stream-buffers');

/* ************************************************************
 *
 * PROMISE
 *
 **************************************************************/

module.exports.Promise = {
  prop: prop => (val => val[prop]),
  func: func => (val => val[func]()),
  nop: () => (() => null),
  inject: value => (() => value)
};

/* ************************************************************
 *
 * GOOGLE CLOUD PLATFORM
 *
 **************************************************************/
module.exports.GCloud = {
  Storage: {
    saveBuffer: (file, buffer, metadata, isPrivate) => {
      const isPublic = isPrivate !== true;

      return new Promise((resolve, reject) => {
        let sbuffer = new sb.ReadableStreamBuffer();
        sbuffer.put(buffer);
        sbuffer.stop();

        sbuffer.pipe(file.createWriteStream({
          public: isPublic,
          metadata: metadata
        }))
          .on('finish', resolve)
          .on('err', reject);
      });
    }
  }
};

/* ************************************************************
 *
 * APP_DATA
 *
 **************************************************************/
module.exports.AppData = {
  createFolder: folderName => {
    return new Promise((resolve, reject) => {
      fs.mkdir(`${Config.appDataPath}`, err => {
        if (err && err.code !== 'EEXIST') {
          throw err;
        }

        fs.mkdir(`${Config.appDataPath}${folderName}`, err => {
          if (err && err.code !== 'EEXIST') {
            throw err;
          }
          resolve();
        });
      });
    });
  }
};
