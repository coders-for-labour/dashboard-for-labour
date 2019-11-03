'use strict';

/**
 * Dashboard for Labour
 *
 * @file logging.js
 * @description Logging helpers
 * @module System
 * @author Lighten
 *
 */

// const Config = require('node-env-obj')('../../');

// const proxyquire = require('proxyquire');
const winston = require('winston');
// proxyquire('winston-logrotate', {
//   winston: winston
// });

/**
 *
 * @type {{ERR: string, WARN: string, INFO: string, VERBOSE: string, DEBUG: string, SILLY: string, DEFAULT: string}}
 */
const LogLevel = {
  ERR: 'error',
  WARN: 'warn',
  INFO: 'info',
  VERBOSE: 'verbose',
  DEBUG: 'debug',
  SILLY: 'silly',
  DEFAULT: 'info',
};

module.exports.Constants = {
  LogLevel: LogLevel,
};

/**
 *
 */

// winston.remove(winston.transports.Console);
winston.add(new winston.transports.Console({
  level: 'debug',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.errors({stack: true}),
    winston.format.printf((info) => {
      if (info.stack) {
        return `${info.timestamp} ${info.level}: ${info.message}\n${info.stack}`;
      }

      return `${info.timestamp} ${info.level}: ${info.message}`;
    })
  ),
}));
// winston.add(new winston.transports.Rotate({
//   name: 'debug-file',
//   json: false,
//   file: `${Config.log.path}/log-debug.log`,
//   level: 'debug',
//   size: '1m',
//   keep: 2,
//   colorize: 'all',
//   timestamp: true
// }));
// winston.add(new winston.transports.Rotate({
//   name: 'error-file',
//   json: false,
//   file: `${Config.log.path}/log-err.log`,
//   level: 'err',
//   size: '1m',
//   keep: 10,
//   timestamp: true
// }));
winston.addColors({
  info: 'white',
  error: 'red',
  warn: 'yellow',
  verbose: 'white',
  debug: 'white',
});

/**
 *
 * @param {string} log - log entry
 * @param {integer} level - level to log at
 * @private
 */
function _log(log, level) {
  winston.log({
    level: level,
    message: log,
  });
}

/**
 * STANDARD LOGGING
 */

module.exports.setLogLevel = (level) => {
  winston.level = level;
};

/**
 * @param {string} log - Text to log
 * @param {integer} level - level to log at
 */
module.exports.log = (log, level) => {
  level = level || LogLevel.DEFAULT;
  _log(log, level);
};

/**
 * @param {string} log - Text to log
 */
module.exports.logInfo = (log) => {
  module.exports.log(log, LogLevel.INFO);
};

/**
 * @param {string} log - Text to log
 */
module.exports.logVerbose = (log) => {
  module.exports.log(log, LogLevel.VERBOSE);
};

/**
 * @param {string} log - Text to log
 */
module.exports.logDebug = (log) => {
  module.exports.log(log, LogLevel.DEBUG);
};

/**
 * @param {string} log - Text to log
 */
module.exports.logSilly = (log) => {
  module.exports.log(log, LogLevel.SILLY);
};

/**
 * @param {string} warn - warning to log
 */
module.exports.logWarn = (warn) => {
  module.exports.log(warn, LogLevel.ERR);
};
/**
 * @param {string} err - error object to log
 */
module.exports.logError = (err) => {
  module.exports.log(err, LogLevel.ERR);
};

/**
 * PROMISE LOGGING
 */

module.exports.Promise = {};

/**
 * @param {string} log - Text to log
 * @param {integer} level - level to log at
 * @return {function(*)} - returns a function for chaining into a promise
 */
module.exports.Promise.log = (log, level) => {
  level = level || LogLevel.DEFAULT;
  return (res) => {
    if (res instanceof Object) {
      _log(`${log}:`, level);
      _log(res, level);
    } else {
      _log(`${log}: ${res}`, level);
    }
    return res;
  };
};

/**
 * @param {string} log - Text to log
 * @param {*} val - value to test `res` against
 * @param {integer} level - level to log at
 * @return {function(*)} - returns a function for chaining into a promise
 */
module.exports.Promise.logIf = (log, val, level) => {
  level = level || LogLevel.DEFAULT;
  return (res) => {
    if (val === res) {
      _log(`${log}: ${res}`, level);
    }
    return res;
  };
};

/**
 * @param {string} log - Text to log
 * @param {*} val - value to test `res` against
 * @param {integer} level - level to log at
 * @return {function(*)} - returns a function for chaining into a promise
 */
module.exports.Promise.logIfNot = (log, val, level) => {
  level = level || LogLevel.DEFAULT;
  return (res) => {
    if (val !== res) {
      _log(`${log}: ${res}`, level);
    }
    return res;
  };
};

/**
 * PROPERTY LOGGING
 */

/**
 * @param {string} log - Text to log
 * @param {string} prop - Name of the `res` property to log
 * @param {integer} level - level to log at
 * @return {function(*)} - returns a function for chaining into a promise
 */
module.exports.Promise.logProp = (log, prop, level) => {
  level = level || LogLevel.DEFAULT;
  return (res) => {
    _log(`${log}: ${res[prop]}`, level);
    return res;
  };
};

/**
 * @param {string} log - Text to log
 * @param {string} prop - Name of the `res` property to log
 * @param {*} val - value to test `res` against
 * @param {integer} level - level to log at
 * @return {function(*)} - returns a function for chaining into a promise
 */
module.exports.Promise.logPropIf = (log, prop, val, level) => {
  level = level || LogLevel.DEFAULT;
  return (res) => {
    if (val === res[prop]) {
      _log(`${log}: ${res[prop]}`, level);
    }
    return res;
  };
};

/**
 * @param {string} log - Text to log
 * @param {string} prop - Name of the `res` property to log
 * @param {*} val - value to test `res` against
 * @param {integer} level - level to log at
 * @return {function(*)} - returns a function for chaining into a promise
 */
module.exports.Promise.logPropIfNot = (log, prop, val, level) => {
  level = level || LogLevel.DEFAULT;
  return (res) => {
    if (val !== res[prop]) {
      _log(`${log}: ${res[prop]}`, level);
    }
    return res;
  };
};

/**
 * ARRAY LOGGING
 */

/**
 * @param {string} log - Text to log
 * @param {integer} level - level to log at
 * @return {function(*)} - returns a function for chaining into a promise
 */
module.exports.Promise.logArray = (log, level) => {
  level = level || LogLevel.DEFAULT;
  return (res) => {
    _log(`${log}: ${res.length}`, level);
    res.forEach((r) => {
      _log(r);
    });
    return res;
  };
};

/**
 * @param {string} log - Text to log
 * @param {string} prop - Name of the `res[]` property to log
 * @param {integer} level - level to log at
 * @return {function(*)} - returns a function for chaining into a promise
 */
module.exports.Promise.logArrayProp = (log, prop, level) => {
  level = level || LogLevel.DEFAULT;
  return (res) => {
    _log(`${log}: ${res.length}`, level);
    res.forEach((r) => {
      _log(r[prop]);
    });
    return res;
  };
};

/**
 * @param {string} log - Text to log
 * @return {function(*)} - returns a function for chaining into a promise
 */
module.exports.Promise.logVerbose = (log) => {
  const level = LogLevel.VERBOSE;
  return (res) => {
    _log(log, level);
    _log(res, level);
    return res;
  };
};

/**
 * @param {string} log - Text to log
 * @return {function(*)} - returns a function for chaining into a promise
 */
module.exports.Promise.logDebug = (log) => {
  const level = LogLevel.DEBUG;
  return (res) => {
    _log(log, level);
    _log(res, level);
    return res;
  };
};
/**
 * @param {string} log - Text to log
 * @return {function(*)} - returns a function for chaining into a promise
 */
module.exports.Promise.logSilly = (log) => {
  const level = LogLevel.SILLY;
  return (res) => {
    _log(log, level);
    _log(res, level);
    return res;
  };
};
/**
 * @return {function(*)} - returns a function for chaining into a promise
 */
module.exports.Promise.logError = () => {
  const level = LogLevel.ERR;
  return (err) => {
    _log(err, level);
    return err;
  };
};

/**
 * @param {string} log - Text to log
 * @param {Object} timer - Object with an 'interval' property
 * @param {string} level - level to log at
 * @return {function(*)} - returns a function for chaining into a promise
 */
module.exports.Promise.logTimer = (log, timer, level) => {
  level = level || LogLevel.INFO;
  return res => {
    _log(`${log} [${timer.lapTime.toFixed(6)}s] [${timer.interval.toFixed(6)}s]`, level);
    return res;
  };
};

