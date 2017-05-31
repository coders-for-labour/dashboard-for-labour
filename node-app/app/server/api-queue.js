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
const redis = require('redis');
const UUID = require('uuid');

const redisClient = redis.createClient(Config.redis);
// redisClient.on('error', err => console.log(err));

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
    // this._queue = [];
  }

  /**
   * @description Start processing the queue
   * @param {boolean} isPrimary - is primary cluster instance
   */
  init(isPrimary) {
    if (isPrimary) {
      this._flush();
    }
  }

  /**
   * @description Add to the queue, defer execution, honor rate limits
   * @param {object} qi - contains all parameters for api call
   */
  add(qi) {
    qi.id = UUID.v1();
    qi.method = qi.method ? qi.method : 'GET';
    redisClient.rpush(['api-queue', JSON.stringify(qi)], (err, reply) => {
      if (err) {
        Logging.logError(err);
        return;
      }
    });
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

  _queueLength() {
    return new Promise(resolve => {
      redisClient.llen('api-queue', (err, result) => {
        if (err) {
          Logging.logError(err);
          return;
        }
        resolve(result);
      });
    });
  }

  _fetchQueue() {
    return new Promise(resolve => {
      redisClient.lrange('api-queue', 0, -1, (err, result) => {
        if (err) {
          Logging.logError(err);
          return;
        }
        resolve(result);
      });
    });
  }

  _deleteQueueItem(itemId) {
    return this._fetchQueue()
      .then(results => {
        for (let key in results) {
          if (results[key].includes(itemId)) {
            Logging.log(`Removing index ${key} from api-queue`);
            redisClient.lrem('api-queue', 0, results[key]);
            return key;
          }
        }
      });
  }

  /**
   *
   * @private
   */
  _flush() {
    this._queueLength()
      .then(queueLength => {
        Logging.logDebug(`Queue Manager: ${queueLength}`);
        if (queueLength === 0) {
          setTimeout(() => this._flush(), Constants.INTERVAL);
          return false;
        }
        return this._fetchQueue();
      })
      .then(queue => {
        let tasks = [];

        if (queue) {
          tasks = queue.reduce((arr, item) => {
            arr.push(JSON.parse(item));
            return arr;
          }, []).filter(qi => {
            return this._isRateLimited(qi) === false;
          }).map(qi => _appTasks[qi.app](qi));
        }

        return tasks;
      })
      .then(tasks => {
        if (tasks && tasks.length > 0) {
          Logging.logDebug(`Attempting ${tasks.length} Twitter`);
          Promise.all(tasks)
            .then(Logging.Promise.logProp('Twitter Called: ', 'length', Logging.Constants.LogLevel.VERBOSE))
            .then(qis => {
              qis.forEach(item => {
                if (item.completed) {
                  this._deleteQueueItem(item.id);
                }
              });
            })
            .then(() => setTimeout(() => this._flush(), Constants.INTERVAL))
            .catch(err => Logging.log(err));
        }
      });
  }
}

module.exports.Manager = new APIQueueManager();
