'use strict';

/**
 * Dashboard for Labour
 *
 * @file app.js
 * @description
 * @module System
 * @author Lighten
 *
 */

const Bootstrap = require('./bootstrap');
const Config = require('node-env-obj')('../../');
const Logging = require('./logging');

/**
 *
 */
Bootstrap
  .app()
  .then(isMaster => {
    if (isMaster) {
      Logging.log(`${Config.app.title} REST Server Master v${Config.app.version} listening on port ` +
        `${Config.listenPort} in ${Config.env} mode.`);
    } else {
      Logging.log(`${Config.app.title} REST Server Worker v${Config.app.version} ` +
        `in ${Config.env} mode.`);
    }
  })
  .catch(Logging.Promise.logError());
