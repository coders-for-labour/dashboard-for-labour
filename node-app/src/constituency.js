'use strict';

/**
 * Dashboard for Labour
 *
 * @file constituency.js
 * @description Constituency lookup using They Work for You API
 * @module System
 * @author Chris Bates-Keegan
 *
 */

const Config = require('node-env-obj')('../../');

const rest = require('restler');

const Logging = require('./logging');
const Cache = require('./cache');

/**
 * Constituency class
 * @class
 */
class Constituency {
  /**
   * Init REST Api
   * @param {Object} app
   */
  init(app) {
    app.get('/api/v1/constituency', (req, res) => {
      if (!req.user) {
        return res.status(403).json({message: 'sign in first'});
      }
      if (!req.query.postcode && !req.query.name) {
        return res.status(400).json({message: 'you must supply a postcode or a name'});
      }

      if (req.query.name) {
        this.lookup(req.query.name)
          .then((constituency) => {
            if (!constituency) {
              res.send(null);
              return;
            }
            res.send({
              name: req.query.name,
              id: constituency.id,
              pano: constituency.pano,
              results: {
                2015: constituency['2015'],
                2017: constituency['2017'],
              },
            });
          });
        return;
      }

      rest.get(`${Config.auth.twfy.apiUrl}/getConstituency?postcode=${req.query.postcode}&key=${Config.auth.twfy.apiKey}`)
        .on('success', (data) => {
          data = JSON.parse(data);
          this.lookup(data.name)
            .then((constituency) => {
              if (!constituency) {
                res.send(null);
                return;
              }
              res.send({
                name: data.name,
                id: constituency.id,
                pano: constituency.pano,
                results: {
                  2015: constituency['2015'],
                  2017: constituency['2017'],
                },
              });
            });
        })
        .on('fail', (response, data) => {
          res.send(false);
        })
        .on('error', (response, data) => {
          res.send(false);
        });
    });
  }

  /**
   * Lookup a constituency from the data cache
   * @param {String} name
   * @return {Object} constituency
   */
  lookup(name) {
    return Cache.Manager.getData(Cache.Constants.Type.CONSTITUENCY)
      .then((constituencies) => {
        const constituency = constituencies[name];
        if (!constituency) {
          Logging.logError(`FAILED TO LOOK UP CONSTITUENCY: ${name}`);
          return false;
        }
        return constituency;
      });
  }
}

module.exports = new Constituency();