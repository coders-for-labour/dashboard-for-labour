'use strict';

/**
 * Dashboard for Labour
 *
 * @file api-queue.js
 * @description
 * @module System
 * @author Lighten
 *
 */

const Logging = require('./logging');
const Config = require('./config');
const Twitter = require('twitter');
const Sugar = require('sugar');

/**
 *
 * @type {{INTERVAL: number, App: {TWITTER: string, FACEBOOK: string}}}
 */
const Constants = {
  INTERVAL: 30000,
  App: {
    TWITTER: 'twitter',
    FACEBOOK: 'facebook'
  }
};
module.exports.Constants = Constants;

/**
 * @param {object} qi - Queue Item: All parameters necessary to execute an API call
 * @return {Promise} - resolves with the queue item (results populated)
 * @private
 */
const _twitterAPITask = qi => {
  const twitter = new Twitter({
    consumer_key: Config.auth.twitter.consumerKey, // eslint-disable-line camelcase
    consumer_secret: Config.auth.twitter.consumerSecret, // eslint-disable-line camelcase
    access_token_key: qi.token, // eslint-disable-line camelcase
    access_token_secret: qi.tokenSecret // eslint-disable-line camelcase
  });

  return new Promise((resolve, reject) => {
    const methods = {
      GET: 'get',
      POST: 'post'
    };

    twitter[methods[qi.method]](qi.api, qi.params, function(error, data, response) {
      Logging.logSilly(data);
      if (error) {
        Logging.logError(error);
        resolve(qi);
        return;
      }
      qi.completed = true;
      qi.results = data;
      resolve(qi);
    });
  });
};

const _appTasks = {
  [Constants.App.TWITTER]: _twitterAPITask,
  [Constants.App.FACEBOOK]: null
};

/**
 *
 */
class APIQueueManager {
  constructor() {
    this._rateLimiter = {};
    this._queue = [];
  }

  /**
   * @description Start processing the queue
   * @param {object} app - express instance
   */
  init(app) {
    this._flush();
  }

  /**
   * @description Add to the queue, defer execution, honor rate limits
   * @param {object} qi - contains all parameters for api call
   */
  add(qi) {
    qi.method = qi.method ? qi.method : 'GET';
    this._queue.push(qi);
  }

  /**
   * @description Immediately execute a queue Item, ignore rate limits
   * @param {object} qi - Queue Item
   * @return {Promise} - Resolves to the QI with .completed true and .results if successful
   */
  exec(qi) {
    qi.method = qi.method ? qi.method : 'GET';
    return _appTasks[qi.app](qi);
  }

  /**
   * @param {object} qi - Queue Item
   * @return {boolean} - true if rate limited
   * @private
   */
  _isRateLimited(qi) {
    const uid = `${qi.app}.${qi.token}.${qi.api}`;
    if (!this._rateLimiter[uid] || Sugar.Date.isAfter(Sugar.Date.create(), this._rateLimiter[uid].windowEnds)) {
      Logging.logDebug(`FIRST CALL IN WINDOW: ${uid}`);
      this._rateLimiter[uid] = {
        calls: 1,
        windowEnds: Sugar.Date.advance(Sugar.Date.create(), '15 minutes')
      };
      return false;
    }

    if (this._rateLimiter[uid].calls >= 15) {
      Logging.logDebug(`RATE LIMITING: ${uid}`);
      return true;
    }

    Logging.logDebug(`ADDING CALL FOR: ${uid}`);
    this._rateLimiter[uid].calls++;
    return false;
  }

  /**
   *
   * @private
   */
  _flush() {
    Logging.logSilly(`Queue Manager: ${this._queue.length}`);
    if (this._queue.length === 0) {
      setTimeout(() => this._flush(), Constants.INTERVAL);
      return;
    }

    let tasks = this._queue.filter(qi => {
      return this._isRateLimited(qi) === false;
    }).map(qi => _appTasks[qi.app](qi));

    Logging.logDebug(`Attempting ${tasks.length} Twitter`);
    Promise.all(tasks)
      .then(Logging.Promise.logProp('Twitter Called: ', 'length', Logging.Constants.LogLevel.VERBOSE))
      .then(qis => {
        this._queue = this._queue.filter(qi => qi.completed !== true);
      })
      .then(() => setTimeout(() => this._flush(), Constants.INTERVAL))
      .catch(err => Logging.log(err));
  }
}

module.exports.Manager = new APIQueueManager();
