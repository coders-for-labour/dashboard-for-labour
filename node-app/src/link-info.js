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
          if (!link) {
            res.status(400).json({message: `invalid link id: ${linkId}`});
            return;
          }
          if (!link.uri) {
            res.status(400).json({message: `missing required link uri: ${link.uri}`});
            return;
          }

          Logging.log(`SCRAPER: ${link.uri}`);

          const options = {
            url: link.uri,
          };
          return scrape(options);
        })
        .then((results) => {
          const og = {
            site: results.data.ogSiteName ? results.data.ogSiteName : 'Not Specified',
            title: results.data.ogTitle,
            description: results.data.ogDescription,
            image: {
              uri: results.data.ogImage.url,
            },
          };

          // console.log(og);

          return Buttress.getCollection('link').update(linkId, [
            {
              path: 'type',
              value: 'article',
            },
            {
              path: 'og.site',
              value: og.site, // @todo: Use the domain if no site is specified
            },
            {
              path: 'og.title',
              value: og.title,
            },
            {
              path: 'og.description',
              value: og.description,
            },
            {
              path: 'og.image.uri',
              value: og.image.uri,
            },
          ]);
        })
        .then(() => res.sendStatus(200))
        .catch((err) => {
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
          console.log(err);
          res.sendStatus(500);
        });
    });
  }
}

module.exports = new Link();
