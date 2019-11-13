'use strict';

/**
 * Dashboard for Labour
 *
 * @file facebook.js
 * @description
 * @module System
 * @author Lighten
 *
 */

const Logging = require('./logging');
const Queue = require('./api-queue');

/**
 *
 * @param {object} user - Authenticated user for whom the media will be uploaded
 * @param {String} message - string representing the message
 * @param {Buffer} imgUrl - Url for the image to post
 * @return {boolean} - true if successfully executed the api call
 */
module.exports.postMedia = (user, message, imgUrl) => {
  if (!user) {
    return false;
  }

  Logging.logInfo(`Posting media for user : ${user.username}.`);

  const queueItem = {
    app: Queue.Constants.App.FACEBOOK,
    username: user.username,
    method: 'post',
    api: 'me/photos',
    params: {
      caption: message,
      url: message,
      no_story: false, // eslint-disable-line camelcase
    },
    token: user.token,
    tokenSecret: user.tokenSecret,
  };

  return Queue.Manager.exec(queueItem)
    .then((qi) => {
      if (!qi.completed) {
        return {
          err: true,
          res: qi.error,
        };
      }
      Logging.logDebug(qi.results);
      Logging.log(`Created a post: ${qi.results.id}`);
      return {
        err: false,
        res: {
          postId: qi.results.id,
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
