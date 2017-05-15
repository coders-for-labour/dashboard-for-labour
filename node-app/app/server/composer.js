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

const fs = require('fs');
const crypto = require('crypto');
const rest = require('restler');
const Config = require('./config');
const Logging = require('./logging');
const Canvas = require('canvas');
const Image = Canvas.Image;

let _cache = null;
let _memCache = null;

/**
 * @class Composer
 */
class Composer {
  constructor(width, height, toBuffer) {
    this._width = width;
    this._height = height;
    this._id = '';
    this._renderQueue = [];
    this._cache = _cache;
    this._noCache = false;
    this._toBuffer = toBuffer;
  }

  disableCache() {
    this._noCache = true;
  }

  params(param, value) {
    this._id += `${param},${value}`;
    this._renderQueue.push(context => {
      return new Promise((resolve, reject) => {
        Logging.log(`Setting Context: ${param} -> ${value}`, Logging.Constants.LogLevel.DEBUG);
        Logging.log(context.ctx, Logging.Constants.LogLevel.DEBUG);
        context.ctx[param] = value;
        resolve(context);
      });
    });
  }

  imageFromUrl(imgUrl, options) {
    let o = this._options(options);
    this._id += imgUrl;

    this._renderQueue.push(context => {
      return new Promise((resolve, reject) => {
        Logging.log(`Rendering Image From URL ${imgUrl}`);
        rest.get(imgUrl)
          .on('success', (data, response) => {
            Logging.logDebug(o);
            let image = new Image();
            image.dataMode = Image.MODE_IMAGE;
            image.onload = () => {
              Logging.logDebug('Loaded Image');
              context.ctx.drawImage(image, o.left, o.top, o.width, o.height);
              resolve(context);
            };
            image.src = response.raw;
          })
          .on('fail', (data, response) => {
            Logging.logWarn(`${imgUrl}:response.statusCode`);
          })
          .on('error', err => {
            Logging.logErr(err);
          });
      });
    });
  }

  imageFromFile(imgFile, options) {
    let file = options.cacheFile ? _memCache.load(imgFile) : fs.readFileSync(imgFile);
    this._id += imgFile;

    return this.__imageFromBuffer(file, options);
  }

  imageFromBuffer(imgBuffer, uid, options) {
    this._id += uid;
    return this.__imageFromBuffer(imgBuffer, options);
  }

  __imageFromBuffer(imgBuffer, options) {
    let o = this._options(options);

    this._renderQueue.push(context => {
      return new Promise((resolve, reject) => {
        Logging.log(`Rendering Image From Buffer`, Logging.Constants.LogLevel.DEBUG);
        // Logging.log(o, Logging.Constants.LogLevel.INFO);
        let image = new Image();
        image.dataMode = Image.MODE_IMAGE;
        image.onload = () => {
          Logging.log('Loaded Image', Logging.Constants.LogLevel.DEBUG);
          context.ctx.drawImage(image, o.left, o.top, o.width, o.height);
          resolve(context);
        };
        image.src = imgBuffer;
      });
    });
  }

  text(text, options) {
    let o = this._options(options);
    this._id += text;

    this._renderQueue.push(context => {
      return new Promise((resolve, reject) => {
        Logging.log(`Rendering Text`, Logging.Constants.LogLevel.DEBUG);

        Logging.log(o, Logging.Constants.LogLevel.INFO);
        Logging.log(text, Logging.Constants.LogLevel.VERBOSE);

        context.ctx.font = `bold ${options.fontSize}px Replica`;
        context.ctx.fillStyle = o.color;

        if (o.width < this._width) {
          let phrases = this._splitText(context.ctx, text, options.width);
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

  render() {
    let cachedFile = this._cache.tryLoadCachedImage(this._id);
    if (this._noCache || cachedFile === false) {
      if (this._noCache === true) {
        Logging.logWarn(`COMPOSER: FORCE NO CACHE`);
      }
      Logging.logDebug(`Rendering Fresh Image`);
      return this._doRender();
    }

    Logging.logDebug(`Image From Cache: ${cachedFile}`);
    return Promise.resolve(this._toBuffer ? fs.readFileSync(cachedFile) : fs.createReadStream(cachedFile));
  }

  _options(options) {
    options.top = options.top || 0;
    options.left = options.left || 0;
    options.width = options.width || this._width;
    options.height = options.height || this._height;
    options.width = options.width <= 1 ? this._width * options.width : options.width;
    options.height = options.height <= 1 ? this._height * options.height : options.height;
    return this._applyGravity(options);
  }

  /**
   * @return {Stream} - Readable read stream containing the image data
   * @private
   */
  _doRender() {
    let canvas = new Canvas(this._width, this._height);
    let p = Promise.resolve({canvas: canvas, ctx: canvas.getContext('2d')});

    this._renderQueue.push(context => {
      Logging.logDebug('Render');

      let buffer = canvas.toBuffer();

      let cachedFile = this._cache.addImage(buffer, this._id);
      return Promise.resolve(this._toBuffer ? fs.readFileSync(cachedFile) : fs.createReadStream(cachedFile));
    });

    return this._renderQueue.reduce((prev, curr) => {
      return prev.then(curr);
    }, p);
  }

  _splitText(ctx, text, width) {
    let wa = text.split(' ');
    let phrases = [];
    let lastPhrase = wa[0];
    let measure = 0;

    for (var i = 1; i < wa.length; i++) {
      let w = wa[i];
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

  _applyGravity(options) {
    let pos = {top: 0, left: 0};
    let topRel = options.top;
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

    let leftRel = options.left;
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
 *
 */
class Cache {
  constructor() {
    this.__cachePath = `${Config.appDataPath}/image_cache`;
  }

  tryLoadCachedImage(options) {
    let filename = this._genFilename(options);
    if (fs.existsSync(`${this.__cachePath}/${filename}`)) {
      Logging.logDebug(`Image Cache HIT: ${filename}`);
      return `${this.__cachePath}/${filename}`;
    }

    Logging.logDebug(`Image Cache MISS: ${filename}`);

    return false;
  }

  addImage(buffer, id) {
    Logging.logDebug(`Hash Input: ${id}`);
    let filename = this._genFilename(id);
    Logging.logDebug(`Hash Output: ${filename}`);
    fs.writeFileSync(`${this.__cachePath}/${filename}`, buffer);
    Logging.logDebug(`Hash Pathname: ${this.__cachePath}/${filename}`);
    return `${this.__cachePath}/${filename}`;
  }

  _genFilename(id) {
    let hash = crypto.createHash('sha1');
    return hash.update(id, 'ascii').digest('hex');
  }
}

_cache = new Cache();

/**
 * @class MemCache
 */
class MemCache {
  constructor() {
    this._cache = {};
  }

  load(filename) {
    if (this._cache[filename]) {
      return this._cache[filename];
    }

    this._cache[filename] = fs.readFileSync(filename);
    return this._cache[filename];
  }

  purge(filename) {
    delete this._cache[filename];
  }
}

_memCache = new MemCache();

module.exports = Composer;
