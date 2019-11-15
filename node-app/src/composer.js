'use strict';

/**
 * Violet - Social tools for grassroots movements
 *
 * @file composer.js
 * @description Image tools
 * @module System
 * @author Chris Bates-Keegan
 *
 */

const Config = require('node-env-obj')('../../');

const fs = require('fs');
const crypto = require('crypto');
const rest = require('restler');
const Helpers = require('./helpers');
const Canvas = require('canvas');
const Image = Canvas.Image;
const Storage = require('@google-cloud/storage');
const storage = Storage(); // eslint-disable-line new-cap

const Logging = require('./logging');

let _cache = null;
let _memCache = null;

/**
 * @class Composer
 */
class Composer {
  /**
   * @param {int} width
   * @param {int} height
   * @param {boolean} toBuffer
   * @return {void}
   */
  constructor(width, height, toBuffer) {
    this._width = width;
    this._height = height;
    this._id = '';
    this._renderQueue = [];
    this._cache = _cache;
    this._noCache = false;
    this._toBuffer = toBuffer;
  }

  /**
   * @return {void}
   */
  disableCache() {
    this._noCache = true;
  }

  /**
   * @param {string} param
   * @param {string} value
   * @return {void}
   */
  params(param, value) {
    this._id += `${param},${value}`;
    this._renderQueue.push((context) => {
      return new Promise((resolve, reject) => {
        Logging.log(`Setting Context: ${param} -> ${value}`, Logging.Constants.LogLevel.DEBUG);
        Logging.log(context.ctx, Logging.Constants.LogLevel.DEBUG);
        context.ctx[param] = value;
        resolve(context);
      });
    });
  }

  /**
   * @param {string} imgUrl
   * @param {object} options
   * @return {void}
   */
  imageFromUrl(imgUrl, options) {
    this._id += imgUrl;

    this._renderQueue.push((context) => {
      return new Promise((resolve, reject) => {
        Logging.log(`Rendering Image From URL ${imgUrl}`);
        rest.get(imgUrl)
          .on('success', (data, response) => {
            const image = new Image();
            image.dataMode = Image.MODE_IMAGE;
            image.onload = () => {
              options.srcWidth = image.width;
              options.srcHeight = image.height;
              const o = this._options(options);

              Logging.logDebug(`Loaded Image [${image.width},${image.height}]`);
              Logging.logSilly(o);

              context.ctx.drawImage(image, o.left, o.top, o.width, o.height);
              resolve(context);
            };
            image.src = response.raw;
          })
          .on('fail', (data, response) => {
            Logging.logWarn(`${imgUrl}:response.statusCode`);
          })
          .on('error', (err) => {
            Logging.logErr(err);
          });
      });
    });
  }

  /**
   * @param {string} imgFile
   * @param {object} options
   * @return {void}
   */
  imageFromFile(imgFile, options) {
    const file = options.cacheFile ? _memCache.load(imgFile) : fs.readFileSync(imgFile);
    this._id += imgFile;

    return this.__imageFromBuffer(file, options);
  }

  /**
   * @param {string} imgBuffer
   * @param {string} uid
   * @param {object} options
   * @return {void}
   */
  imageFromBuffer(imgBuffer, uid, options) {
    this._id += uid;
    return this.__imageFromBuffer(imgBuffer, options);
  }

  /**
   * @param {string} imgBuffer
   * @param {object} options
   * @return {void}
   */
  __imageFromBuffer(imgBuffer, options) {
    this._id += options.preserveAspect;
    this._id += options.gravity;

    this._renderQueue.push((context) => {
      return new Promise((resolve, reject) => {
        Logging.logDebug(`Rendering Image From Buffer`);
        const image = new Image();
        image.dataMode = Image.MODE_IMAGE;
        image.onload = () => {
          options.srcWidth = image.width;
          options.srcHeight = image.height;
          const o = this._options(options);

          Logging.logDebug(`Loaded Image [${image.width},${image.height}]`);
          Logging.logSilly(o);

          context.ctx.drawImage(image, o.left, o.top, o.width, o.height);
          resolve(context);
        };
        image.src = imgBuffer;
      });
    });
  }

  /**
   * @param {string} text
   * @param {object} options
   * @return {void}
   */
  text(text, options) {
    const o = this._options(options);
    this._id += text;

    this._renderQueue.push((context) => {
      return new Promise((resolve, reject) => {
        Logging.log(`Rendering Text`, Logging.Constants.LogLevel.DEBUG);

        Logging.log(o, Logging.Constants.LogLevel.INFO);
        Logging.log(text, Logging.Constants.LogLevel.VERBOSE);

        context.ctx.font = `bold ${options.fontSize}px Replica`;
        context.ctx.fillStyle = o.color;

        if (o.width < this._width) {
          const phrases = this._splitText(context.ctx, text, options.width);
          let top = o.top;
          for (let x = 0; x < phrases.length; x++) {
            context.ctx.save();
            context.ctx.translate(o.left, top + o.fontSize);
            context.ctx.fillText(phrases[x], 0, 0);
            context.ctx.restore();
            top += o.fontSize;
          }
        }

        resolve(context);
      });
    });
  }

  /**
   * @return {Promise}
   */
  render() {
    return this._cache.tryLoadCachedImage(this._id)
      .then((cachedFile) => {
        if (this._noCache || cachedFile === false) {
          if (this._noCache === true) {
            Logging.logWarn(`COMPOSER: FORCE NO CACHE`);
          }
          Logging.logDebug(`Rendering Fresh Image`);
          return this._doRender();
        }

        Logging.logDebug(`Image From Cache: ${cachedFile}`);
        if (this._toBuffer) {
          return new Promise((resolve, reject) => {
            fs.readFile(cachedFile, (err, data) => {
              if (err) throw err;
              resolve({
                stream: null,
                buffer: data,
                pathName: cachedFile,
              });
            });
          });
        }

        return Promise.resolve({
          stream: fs.createReadStream(cachedFile),
          buffer: null,
          pathName: cachedFile,
        });
      });
  }

  /**
   * @param {object} options
   * @return {object}
   */
  _options(options) {
    options.top = options.top || 0;
    options.left = options.left || 0;
    options.width = options.width || this._width;
    options.height = options.height || this._height;
    options.width = options.width <= 1 ? this._width * options.width : options.width;
    options.height = options.height <= 1 ? this._height * options.height : options.height;

    if (options.preserveAspect) {
      if (options.srcWidth <= options.srcHeight) {
        const aspect = options.srcWidth / options.srcHeight;
        options.height = options.width / aspect;
      } else {
        const aspect = options.srcHeight / options.srcWidth;
        options.width = options.height / aspect;
      }
    }

    return this._applyGravity(options);
  }

  /**
   * @return {Stream} - Readable read stream containing the image data
   * @private
   */
  _doRender() {
    const canvas = new Canvas(this._width, this._height);
    const p = Promise.resolve({canvas: canvas, ctx: canvas.getContext('2d')});

    this._renderQueue.push((context) => {
      const buffer = canvas.toBuffer();
      return this._cache.addImage(buffer, this._id)
        .then((cachedFile) => {
          Logging.logDebug(`Outputting: ${cachedFile}`);
          if (this._toBuffer) {
            return new Promise((resolve, reject) => {
              fs.readFile(cachedFile, (err, data) => {
                if (err) throw err;
                resolve({
                  stream: null,
                  buffer: data,
                  pathName: cachedFile,
                });
              });
            });
          }

          return Promise.resolve({
            stream: fs.createReadStream(cachedFile),
            buffer: null,
            pathName: cachedFile,
          });
        });
    });

    return this._renderQueue.reduce((prev, curr) => {
      return prev.then(curr);
    }, p);
  }

  /**
   * @param {object} ctx
   * @param {string} text
   * @param {int} width
   * @return {array} phrases
   */
  _splitText(ctx, text, width) {
    const wa = text.split(' ');
    const phrases = [];
    let lastPhrase = wa[0];
    let measure = 0;

    for (let i = 1; i < wa.length; i++) {
      const w = wa[i];
      measure = ctx.measureText(lastPhrase + w).width;
      if (measure < width) {
        lastPhrase += ' ' + w;
      } else {
        phrases.push(lastPhrase);
        lastPhrase = w;
      }
    }

    phrases.push(lastPhrase);

    return phrases;
  }

  /**
   * @param {object} options
   * @return {object}
   */
  _applyGravity(options) {
    const pos = {top: 0, left: 0};
    const topRel = options.top;
    if (/top|bottom/.test(options.gravity)) {
      if (/top/.test(options.gravity) === true) {
        pos.top = 0;
      } else if (/bottom/.test(options.gravity) === true) {
        pos.top = this._height - options.height;
      }
    } else {
      pos.top = (this._height - options.height) / 2;
    }
    pos.top = Math.ceil(pos.top);
    pos.top += topRel;

    const leftRel = options.left;
    if (/left|right/.test(options.gravity)) {
      if (/left/.test(options.gravity) === true) {
        pos.left = 0;
      } else if (/right/.test(options.gravity) === true) {
        pos.left = this._width - options.width;
      }
    } else {
      pos.left = (this._width - options.width) / 2;
    }
    pos.left = Math.ceil(pos.left);
    pos.left += leftRel;

    return Object.assign(options, pos);
  }
}

/**
 * @class Cache
 */
class Cache {
  /**
   * @return {void}
   */
  constructor() {
    this.__cachePath = `${Config.data.path}/image_cache`;
  }

  /**
   * @param {Object} options
   * @return {Promise}
   */
  tryLoadCachedImage(options) {
    const filename = this._genFilename(options);

    return new Promise((resolve, reject) => {
      fs.access(`${this.__cachePath}/${filename}`, 'r', (err) => {
        if (err) {
          if (err.code !== 'ENOENT') {
            Logging.logDebug(`Image Cache MISS: ${filename}`);
            reject(err);
            return;
          }

          resolve(false);
          return;
        }
        Logging.logDebug(`Image Cache HIT: ${filename}`);
        resolve(`${this.__cachePath}/${filename}`);
      });
    });
  }

  /**
   * @param {Buffer} buffer
   * @param {String} id
   * @return {Promise}
   */
  addImage(buffer, id) {
    return new Promise((resolve, reject) => {
      Logging.logSilly(`Hash Input: ${id}`);
      const filename = this._genFilename(id);
      Logging.logSilly(`Hash Output: ${filename}`);
      fs.writeFile(`${this.__cachePath}/${filename}`, buffer, (err) => {
        if (err) throw err;
        Logging.logSilly(`Hash Pathname: ${this.__cachePath}/${filename}`);

        const gfile = storage.bucket(Config.cdnBucket).file(`c/${filename}`);
        Helpers.GCloud.Storage.saveBuffer(gfile, buffer, {
          contentType: `image/png`,
        }).then(() => {
          resolve(`${this.__cachePath}/${filename}`);
        });
      });
    });
  }

  /**
   * @param {String} id
   * @return {String} digest
   */
  _genFilename(id) {
    const hash = crypto.createHash('sha1');
    return hash.update(id, 'ascii').digest('hex');
  }
}

_cache = new Cache();

/**
 * @class MemCache
 */
class MemCache {
  /**
   * @return {void}
   */
  constructor() {
    this._cache = {};
  }

  /**
   * @param {String} filename
   * @return {Objet} cache
   */
  load(filename) {
    if (this._cache[filename]) {
      return this._cache[filename];
    }

    this._cache[filename] = fs.readFileSync(filename);
    return this._cache[filename];
  }

  /**
   * @param {String} filename
   * @return {void}
   */
  purge(filename) {
    delete this._cache[filename];
  }
}

_memCache = new MemCache();

module.exports = Composer;
