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
