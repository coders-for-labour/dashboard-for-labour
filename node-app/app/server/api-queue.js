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
const _ = require('underscore');
require('sugar');

var Constants = null;
/**
 *
 * @type {{INTERVAL: number, App: {TWITTER: string, FACEBOOK: string}}}
 */
module.exports.Constants = Constants = {
  INTERVAL: 30000,
  App: {
    TWITTER: 'twitter',
    FACEBOOK: 'facebook'
  }
};

/**
 * @param {object} qi - Queue Item: All parameters necessary to execute an API call
 * @return {Promise} - resolves with the queue item (results populated)
 * @private
 */
var _twitterAPITask = qi => {
  var twitter = new Twitter({
    consumer_key: Config.D4L_TWITTER_CONSUMER_KEY,
    consumer_secret: Config.D4L_TWITTER_CONSUMER_SECRET,
    access_token_key: qi.token,
    access_token_secret: qi.tokenSecret
  });

  return new Promise((resolve, reject) => {
    var methods = {
      GET: 'get',
      POST: 'post'
    };

    twitter[methods[qi.method]](qi.api, qi.params, function(error, data, response) {
      Logging.log(data, Logging.Constants.LogLevel.SILLY);
      if (error) {
        resolve(qi);
        return;
      }
      qi.completed = true;
      qi.results = data;
      resolve(qi);
    });
  });
};

var _appTasks = {
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
    setInterval(_.bind(this._flush, this), Constants.INTERVAL);
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
    var uid = `${qi.app}.${qi.token}.${qi.api}`;
    if (!this._rateLimiter[uid] || Date.create().isAfter(this._rateLimiter[uid].windowEnds)) {
      Logging.log(`FIRST CALL IN WINDOW: ${uid}`, Logging.Constants.LogLevel.DEBUG);
      this._rateLimiter[uid] = {
        calls: 1,
        windowEnds: Date.create().advance('15 minutes')
      };
      return false;
    }

    if (this._rateLimiter[uid].calls >= 15) {
      Logging.log(`RATE LIMITING: ${uid}`, Logging.Constants.LogLevel.DEBUG);
      return true;
    }

    Logging.log(`ADDING CALL FOR: ${uid}`, Logging.Constants.LogLevel.DEBUG);
    this._rateLimiter[uid].calls++;
    return false;
  }

  /**
   *
   * @private
   */
  _flush() {
    if (this._queue.length === 0) {
      return;
    }

    var tasks = this._queue.filter(qi => {
      return this._isRateLimited(qi) === false;
    }).map(qi => _appTasks[qi.app](qi));

    Logging.log(`Attempting ${tasks.length} Twitter`, Logging.Constants.LogLevel.DEBUG);
    Promise.all(tasks)
      .then(Logging.Promise.logProp('Twitter Called: ', 'length', Logging.Constants.LogLevel.VERBOSE))
      .then(qis => {
        this._queue = this._queue.filter(qi => qi.completed !== true);
      })
      .catch(err => Logging.log(err));
  }
}

module.exports.manager = new APIQueueManager();