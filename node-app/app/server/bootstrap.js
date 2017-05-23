'use strict';

/**
 * Dashboard for Labour
 *
 * @file bootstrap.js
 * @description
 * @module System
 * @author Coders for Labour
 *
 */

const Config = require('./config');
const Helpers = require('./helpers');
const Rhizome = require('rhizome-api-js');
const Auth = require('./auth');
const Twibbyn = require('./twibbyn');
const Queue = require('./api-queue');
const Cache = require('./cache');
const Constituency = require('./constituency');
// const Logging = require('./logging');

/* ************************************************************
 *
 * BOOTSTRAP
 *
 **************************************************************/

const _installApp = app => {
  Rhizome.init({
    rhizomeUrl: Config.auth.rhizome.url,
    appToken: Config.auth.rhizome.appToken
  });

  Auth.init(app);
  Twibbyn.init(app);
  Queue.Manager.init(app);
  Cache.Manager.create(Cache.Constants.Type.CONSTITUENCY);
  Constituency.init(app);

  const tasks = [
    Helpers.AppData.createFolder('/image_cache')
  ];

  return Promise.all(tasks);
};

module.exports = {
  app: _installApp
};
