'use strict';

/**
 * Dashboard for Labour
 *
 * @file twitter.js
 * @description
 * @module System
 * @author Lighten
 *
 */

const Logging = require('./logging');
// const Config = require('./config');

const Queue = require('./api-queue');

/**
 *
 * @param {object} user - Authenticated user for whom the profile image will be updated
 * @param {Buffer} imgBuffer - Buffer containing image data for the profile
 * @return {boolean} - true if successfully queued the api call
 */
module.exports.updateProfile = (user, imgBuffer) => {
  if (!user) {
    return false;
  }

  Logging.logInfo(`Scheduling Profile Update task for user : ${user.id}.`);

  Queue.manager.add({
    app: Queue.Constants.App.TWITTER,
    username: user.username,
    method: 'POST',
    api: 'account/update_profile_image.json',
    params: {
      image: imgBuffer.toString('base64'),
      include_entities: false,
      skip_statuses: true
    },
    token: user.token
  });

  Logging.logDebug(imgBuffer);

  return true;
};

/**
 * @param {Object} app - ExpressJS app object
 */
module.exports.init = app => {

};
