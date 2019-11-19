'use strict';

/**
 * Dashboard for Labour
 *
 * @file link-info.js
 * @description Constituency lookup using They Work for You API
 * @module System
 * @author Coders for Labour
 *
 */

const Buttress = require('buttress-js-api');
const Logging = require('./logging');
const scrape = require('open-graph-scraper');
const mime = require('mime-types');


/**
 * LinkError class
 * @class
 */
class LinkError extends Error {
  /**
   * [constructor description]
   * @param  {Number}    statusCode
   * @param  {...[type]} params
s   */
  constructor(statusCode = 400, ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LinkError);
    }

    // this.name = 'LinkError';
    // Custom debugging information
    this.statusCode = statusCode;
  }
}

/**
 * Link class
 * @class
 */
class Link {
  /**
   * Init REST Api
   * @param {Object} app
   */
  init(app) {
    app.get('/api/v1/link', (req, res) => {
      if (!req.query.linkId) {
        return res.status(400).json({message: 'you must supply a link id.'});
      }

      const linkId = req.query.linkId;
      Buttress.getCollection('link').get(linkId)
        .then((link) => {
          let url = null;
          let linkMime = null;
          if (!link) {
            throw new LinkError(400, `invalid link id: ${linkId}`);
          }
          if (!link.uri) {
            throw new LinkError(400, `missing required link uri: ${link.uri}`);
          }
          try {
            url = new URL(link.uri);
            linkMime = mime.lookup(url.pathname);
          } catch (e) {
            throw new LinkError(400, `badly formed uri: ${link.uri}`);
          }

          Logging.log(`SCRAPER: ${url.toString()} - ${linkMime}`);

          const fileTypes = ['application/pdf', 'image/png', 'image/jpg', 'image/jpeg', 'image/gif'];
          if (fileTypes.indexOf(linkMime) !== -1) {
            return {
              type: /^image\//.test(linkMime) ? 'image' : 'document',
            };
          }

          const options = {
            url: link.uri,
          };
          return scrape(options);
        })
        .then((results) => {
          if (!results.data || !results.success) {
            return results;
          }
          const urlString = (results.data.ogUrl) ? results.data.ogUrl : results.requestUrl;
          const url = new URL(urlString);

          let imgUrl = null;
          let imgMime = null;
          try {
            imgUrl = new URL(results.data.ogImage.url);
            imgMime = mime.lookup(imgUrl.pathname);
          } catch (e) {
            Logging.logWarn(`NO IMAGE URL: '${results.data.ogImage.url}'`);
          }
          Logging.log(`SCRAPER: ${imgUrl} - ${imgMime}`);

          return {
            type: 'article',
            og: {
              canonical: url.toString(),
              site: results.data.ogSiteName ? results.data.ogSiteName : url.hostname,
              title: results.data.ogTitle,
              description: results.data.ogDescription,
              image: {
                uri: imgUrl ? imgUrl.toString() : '',
                type: imgMime ? imgMime : '',
              },
            },
          };
        })
        .then((meta) => {
          const updates = [
            {
              path: 'type',
              value: meta.type,
            },
          ];

          if (meta.og) {
            if (meta.og.canonical) {
              updates.push({
                path: 'og.canonical',
                value: meta.og.canonical,
              });
            }
            if (meta.og.site) {
              updates.push({
                path: 'og.site',
                value: meta.og.site,
              });
            }
            if (meta.og.title) {
              updates.push({
                path: 'og.title',
                value: meta.og.title,
              });
            }
            if (meta.og.description) {
              updates.push({
                path: 'og.description',
                value: meta.og.description,
              });
            }
            if (meta.og.image.uri) {
              updates.push({
                path: 'og.image.uri',
                value: meta.og.image.uri,
              });
            }
            if (meta.og.image.type) {
              updates.push({
                path: 'og.image.mimeType',
                value: meta.og.image.type,
              });
            }
          }
          return Buttress.getCollection('link').update(linkId, updates);
        })
        .then(() => res.sendStatus(200))
        .catch((err) => {
          console.log(err);
          if (err instanceof LinkError) {
            res.status(err.statusCode).json(err.message);
            return;
          }

          if (err.success === false && err.error === 'Must scrape an HTML page') {
            Logging.log(`SCRAPER: Not an HTML page. Setting link.type to 'download'.`);
            Buttress.getCollection('link').update(linkId, [
              {
                path: 'type',
                value: 'download',
              },
            ]);
            res.sendStatus(200);
            return;
          }

          res.sendStatus(500);
        });
    });
  }
}

module.exports = new Link();
