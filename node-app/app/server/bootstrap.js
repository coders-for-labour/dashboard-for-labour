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
const Rhizome = require('rhizome-api-js');
const Auth = require('./auth');
const Cache = require('./cache');
const Logging = require('./logging');

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

  Cache.Manager.create(Cache.Constants.Type.TEAM);
  Auth.init(app);

  const tasks = [
    Rhizome.User.getAll().then(Logging.Promise.logDebug('Users'))
  ];

  return Promise.all(tasks);
};

module.exports = {
  app: _installApp
};
