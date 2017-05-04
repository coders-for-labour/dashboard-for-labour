'use strict';

/**
 * Dashboard for Labour
 *
 * @file stopt.js
 * @description Simple Time One-Time Password tool
 * @module System
 * @author Chris Bates-Keegan
 *
 */

var crypto = require('crypto');

/**
 *
 * @type {{Mode: {NUMERIC: string, ALPHANUMERIC: string, ALPHA: string}}}
 */
var Constants = module.exports.Constants = {
  Mode: {
    NUMERIC: 'numeric',
    ALPHANUMERIC: 'alphanumeric',
    ALPHA: 'alpha'
  }
};

/**
 * @type {{MODE: string, EPOCH: number, WINDOW_SIZE: number, LENGTH: number, SALT: string, TOLERANCE: number}}
 */
var Defaults = {
  MODE: Constants.Mode.NUMERIC,
  EPOCH: 1.418221717366e12,
  WINDOW_SIZE: 30,
  LENGTH: 6,
  SALT: '',
  TOLERANCE: 6
};

/**
 *
 */
class Helpers {
  static getRandomString(salt, length, numeric) {
    salt = salt || Date.now();
    length = length || Defaults.LENGTH;

    var hash = crypto.createHash('sha512');
    hash.update(`${salt}`);
    var bytes = hash.digest();

    var chars = numeric === false ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' :
                                    '0123456789012345';
    var mask = numeric === false ? 0x3d : 0x0f;
    var string = '';

    for (var byte = 0; byte < length; byte++) {
      string += chars[bytes[byte] & mask];
    }

    return string;
  }
}

/**
 * @class STOTP
 * @description Simple Time-based One Time Password
 */
class STOTP {
  constructor(options) {
    options = options || {};
    this.mode = options.mode ? options.mode : Defaults.MODE;
    this.epoch = options.epoch ? options.epoch : Defaults.EPOCH;
    this.windowSize = options.windowSize ? options.windowSize : Defaults.WINDOW_SIZE;
    this.length = options.length ? options.length : Defaults.LENGTH;
    this.salt = options.salt ? options.salt : Defaults.SALT;
    this.tolerance = options.tolerance ? options.tolerance : Defaults.TOLERANCE;
  }

  /**
   * @param {string} salt - randomised salt
   * @return {string} - return code
   */
  getCode(salt) {
    salt = salt || this.salt;
    return Helpers.getRandomString(`${salt}${this._getWindow()}`,
                                  this.length,
                                  this.mode === Constants.Mode.NUMERIC);
  }

  /**
   * @param {string} code - code to test against
   * @param {string} salt - randomised salt if you want to override the value passed in when creating the object
   * @param {numeric} tolerance - test the window +- this tolerance
   * @return {boolean} - returns true if the code matches
   */
  test(code, salt, tolerance) {
    salt = salt || this.salt;
    tolerance = tolerance || this.tolerance;
    var matches = false;
    if (!code) {
      return matches;
    }
    var window = this._getWindow() + tolerance;
    for (var x = tolerance * 2; x >= 0; x--) {
      if (Helpers.getRandomString(`${salt}${window}`,
          this.length,
          this.mode === Constants.Mode.NUMERIC) === code) {
        matches = true;
        break;
      }
      window--;
    }
    return matches;
  }

  _getWindow() {
    var interval = (Date.now() - this.epoch) / 1000;
    return Math.floor(interval / this.windowSize, 0);
  }
}

module.exports.create = options => {
  return new STOTP(options);
};
