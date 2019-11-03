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

const Config = require('node-env-obj')('../../');
const Logging = require('./logging');
const Helpers = require('./helpers');
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
  },
  Queue: {
    API: 'api-queue',
    ERROR: 'api-queue-error'
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
        qi.error = error;
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
    this._queueTimeout = null;
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

  /* *
   * @description Add to the queue, defer execution, honor rate limits
   * @param {object} qi - contains all parameters for api call
   * @return {Promise} - Resolves with result from redis
   */
  add(qi, key) {
    qi.id = UUID.v1();
    qi.method = qi.method ? qi.method : 'GET';

    let score = 0;
    if (qi.processAfter) {
      const date = Sugar.Date.create(qi.processAfter);
      score = Sugar.Date.format(date, '{X}');
    }

    return this._addQueueItem(key, score, qi);
  }

  /* *
   * @description Immediately execute a queue Item, ignore rate limits
   * @param {object} qi - Queue Item
   * @return {Promise} - Resolves to the QI with .completed true and .results if successful
   */
  exec(qi) {
    qi.method = qi.method ? qi.method : 'GET';
    return _appTasks[qi.app](qi);
  }

  /* *
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

  /* *
   * @description Fetch the length of the api-queue
   * @return {Promise} - Resolves with the length of the redis api-queue
   * @private
   */
  _queueLength(key) {
    const now = Sugar.Date.create('now');
    const nowEpoch = Sugar.Date.format(now, '{X}');
    return new Promise(resolve => {
      redisClient.zcount(key, -1, nowEpoch, (err, result) => {
        if (err) {
          Logging.logError(err);
          return;
        }
        resolve(result);
      });
    });
  }

  /* *
   * @description Push a queue item into the redis queue, returns a promise
   * @param {object} item - contains all parameters for api call
   * @return {Promise} - Resolves with result from redis
   * @private
   */
  _fetchQueue(key) {
    const now = Sugar.Date.create('now');
    const nowEpoch = Sugar.Date.format(now, '{X}');
    const limit = 1000;

    return new Promise(resolve => {
      redisClient.zrangebyscore(key, -1, nowEpoch, 'LIMIT', 0, limit, (err, result) => {
        if (err) {
          Logging.logError(err);
          return;
        }
        resolve(result);
      });
    });
  }

  /* *
   * @description Push a queue item into the redis queue, returns a promise
   * @param {object} item - contains all parameters for api call
   * @return {Promise} - Resolves with result from redis
   * @private
   */
  _addQueueItem(key, score, item) {
    return new Promise(resolve => {
      redisClient.zadd(key, score, JSON.stringify(item), (err, result) => {
        if (err) {
          Logging.logError(err);
          return;
        }
        resolve(result);
      });
    });
  }

  /**
   * @description Remove an item from the redis api-queue using itemId
   * @param {object} key - redis list key
   * @param {object} jsonItem - json object
   * @return {Promise} - Resolves with result from redis
   * @private
   */
  _deleteQueueItem(key, jsonItem) {
    return new Promise(resolve => {
      redisClient.zrem(key, jsonItem, (err, result) => {
        if (err) {
          Logging.logError(err);
          return;
        }
        resolve(result);
      });
    });
  }

  _recallQueueTimeout() {
    if (!this._queueTimeout) {
      this._queueTimeout = setTimeout(() => this._flush(), Constants.INTERVAL);
    }
  }

  /**
   *
   * @private
   */
  _flush() {
    const timer = new Helpers.Timer();
    this._queueTimeout = null;

    this._queueLength(Constants.Queue.API)
      .then(queueLength => {
        timer.start();
        if (queueLength === 0) {
          return false;
        }
        return this._fetchQueue(Constants.Queue.API);
      })
      .then(queue => {
        let tasks = [];
        if (queue) {
          Logging.logDebug(`FETCHED QUEUE: ${queue.length} - ${timer.interval}`);

          tasks = queue.reduce((arr, jsonItem) => {
            let item = JSON.parse(jsonItem);
            item.queueState = JSON.stringify(item);
            arr.push(item);
            return arr;
          }, []).filter(qi => {
            // if (qi.error) {
            //   return false;
            // }
            if (qi.processAfter) {
              const time = Sugar.Date.create('now');
              const itemDate = Sugar.Date.create(qi.processAfter);

              if (!Sugar.Date.isAfter(time, itemDate)) {
                return false;
              }
            }
            return this._isRateLimited(qi) === false;
          }).map(qi => _appTasks[qi.app](qi));
          Logging.logInfo(`PROCESSED QUEUE: ${tasks.length} - ${timer.interval}`);
        }

        return tasks;
      })
      .then(tasks => {
        if (!tasks || !tasks.length) {
          return false;
        }

        Logging.logDebug(`CALLING TASKS: ${tasks.length}`);
        return Promise.all(tasks);
      })
      .then(Logging.Promise.logTimer('CALLED TASKS', timer))
      .then((qis) => {
        if (!qis) {
          return;
        }

        Logging.logDebug(`CALLED TASKS: ${qis.length} - ${timer.lapTime}`);

        qis.forEach(item => {
          if (item.error) {
            this._deleteQueueItem(Constants.Queue.API, item.queueState);
            delete item.queueState;
            this.add(item, Constants.Queue.ERROR);
          }
          if (item.completed) {
            this._deleteQueueItem(Constants.Queue.API, item.queueState);
          }
        });
        return qis;
      })
      .then(() => this._recallQueueTimeout())
      .catch(err => {
        Logging.logError(err);
        this._recallQueueTimeout();
      });
  }
}

module.exports.Manager = new APIQueueManager();
