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
// const Storage = require('@google-cloud/storage');
const sb = require('stream-buffers');

// const storage = Storage(); // eslint-disable-line new-cap

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
 * Timer
 *
 **************************************************************/

class Timer {
  constructor() {
    this._start = 0;
  }

  start() {
    let hrTime = process.hrtime();
    this._last = this._start = (hrTime[0] * 1000000) + (hrTime[1] / 1000);
  }

  get lapTime() {
    let hrTime = process.hrtime();
    let time = (hrTime[0] * 1000000) + (hrTime[1] / 1000);
    let lapTime = time - this._last;
    this._last = time;
    return (lapTime / 1000000);
  }
  get interval() {
    let hrTime = process.hrtime();
    let time = (hrTime[0] * 1000000) + (hrTime[1] / 1000);
    return ((time - this._start) / 1000000);
  }
}

module.exports.Timer = Timer;

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
