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

// const Config = require('node-env-obj')('../../');

const Logging = require('./logging');
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

  Logging.logInfo(`Scheduling Profile Update task for user : ${user.username}.`);

  Queue.Manager.add({
    app: Queue.Constants.App.TWITTER,
    username: user.username,
    method: 'POST',
    api: 'account/update_profile_image.json',
    params: {
      image: imgBuffer.toString('base64'),
      include_entities: false, // eslint-disable-line camelcase
      skip_statuses: true, // eslint-disable-line camelcase
    },
    token: user.token,
    tokenSecret: user.tokenSecret,
  }, Queue.Constants.Queue.API);

  Logging.logDebug(imgBuffer);

  return true;
};

/**
 *
 * @param {object} user - Authenticated user for whom the media will be uploaded
 * @param {String} tweet - string representing the message
 * @param {Buffer} imgBuffer - Buffer containing image data for the media
 * @return {boolean} - true if successfully queued the api call
 */
module.exports.tweet = (user, tweet) => {
  if (!user) {
    return false;
  }

  Logging.logInfo(`Tweeting media for user : ${user.username}.`);

  return Queue.Manager.exec({
    app: Queue.Constants.App.TWITTER,
    username: user.username,
    method: 'POST',
    api: 'statuses/update.json',
    params: {
      status: tweet,
      include_entities: false, // eslint-disable-line camelcase
      skip_statuses: true, // eslint-disable-line camelcase
    },
    token: user.token,
    tokenSecret: user.tokenSecret,
  })
    .then((qi) => {
      if (!qi.completed) {
        return {
          err: true,
          res: qi.error,
        };
      }
      Logging.log(`Created a tweet: ${qi.results.id}`);
      return {
        err: false,
        res: {
          tweetId: qi.results.id_str,
        },
      };
    })
    .catch(Logging.Promise.logError());
};

/**
 *
 * @param {object} user - Authenticated user for whom the media will be uploaded
 * @param {String} tweet - string representing the message
 * @param {Buffer} imgBuffer - Buffer containing image data for the media
 * @return {boolean} - true if successfully queued the api call
 */
module.exports.tweetMedia = (user, tweet, imgBuffer) => {
  if (!user) {
    return false;
  }

  Logging.logInfo(`Tweeting media for user : ${user.username}.`);

  return Queue.Manager.exec({
    app: Queue.Constants.App.TWITTER,
    username: user.username,
    method: 'POST',
    api: 'media/upload.json',
    params: {
      media: imgBuffer,
    },
    token: user.token,
    tokenSecret: user.tokenSecret,
  })
    .then((qi) => {
      const mediaId = qi.results.media_id_string;
      Logging.logDebug(`Media ID: ${mediaId} [${qi.results.image.image_type}], Expires: ${qi.results.expires_after_secs}`);
      return Queue.Manager.exec({
        app: Queue.Constants.App.TWITTER,
        username: user.username,
        method: 'POST',
        api: 'statuses/update.json',
        params: {
          status: tweet,
          media_ids: mediaId, // eslint-disable-line camelcase
          include_entities: false, // eslint-disable-line camelcase
          skip_statuses: true, // eslint-disable-line camelcase
        },
        token: user.token,
        tokenSecret: user.tokenSecret,
      });
    })
    .then((qi) => {
      if (!qi.completed) {
        return {
          err: true,
          res: qi.error,
        };
      }
      Logging.log(`Created a tweet: ${qi.results.id}`);
      return {
        err: false,
        res: {
          tweetId: qi.results.id_str,
        },
      };
    })
    .catch(Logging.Promise.logError());
};

/**
 * @param {Object} app - ExpressJS app object
 */
module.exports.init = (app) => {

};
