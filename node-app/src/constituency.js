'use strict';

/**
 * Dashboard for Labour
 *
 * @file constituency.js
 * @description Constituency lookup using They Work for You API
 * @module System
 * @author Coders for Labour
 *
 */

const Config = require('node-env-obj')('../../');
const Buttress = require('buttress-js-api');

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
      if (!req.query.postcode) {
        return res.status(400).json({message: 'you must supply a postcode or a name'});
      }

      let constituency = null;
      rest.get(`${Config.auth.twfy.apiUrl}/getConstituency?postcode=${req.query.postcode}&key=${Config.auth.twfy.apiKey}`)
        .on('success', (data) => {
          data = JSON.parse(data);

          if (!data) {
            res.send(false);
          }

          return this.lookup(data.name)
            .then((_constituency) => {
              if (!_constituency) {
                throw new Error('Constituency cache isn\'t populated');
              }
              _constituency.name = data.name;
              constituency = _constituency;
            })
            .then(() => this.__checkConstituencyTopic(constituency))
            .then(() => {
              res.send({
                name: data.name,
                id: constituency.id,
                pano: constituency.pano,
                results: {
                  2015: constituency['2015'],
                  2017: constituency['2017'],
                },
              });
            })
            .catch((err) => {
              Logging.logError(err);
              return res.sendStatus(500);
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

  /**
   * Create a new topic from a Constituency object
   * @param {Object} constituency
   * @return {Object} constituency
   */
  __checkConstituencyTopic(constituency) {
    return Buttress.getCollection('topic').getAll()
      .then((topics) => topics.find((t) => t.constituencyPano == constituency.pano))
      .then((topic) => {
        if (topic) return topic;
        return this.__createConstituencyTopic(constituency);
      });
  }

  /**
   * Create a new topic from a Constituency object
   * @param {Object} constituency
   * @return {Object} constituency
   */
  __createConstituencyTopic(constituency) {
    const r17 = constituency['2017'].results;
    const mp = r17[0];
    const labourIdx = r17.findIndex((mp) => mp.party === 'Labour');
    const labour = r17[labourIdx];
    const labourBehind = r17.reduce((behind, mp, idx) => {
      if (idx >= labourIdx) return behind;
      behind += mp.ahead;
      return behind;
    }, 0);

    let description = '';
    if (labour !== mp) {
      description = `This seat is currently held by ${mp.party} with a majority of ${mp.ahead}. The MP is ${mp.name}.
      The Labour MP in the 2017 election was ${labour.name}. We need ${labourBehind} votes to win this seat.`;
    } else {
      description = `This seat is currently held by Labour with a majority of ${mp.ahead}. Your MP is ${mp.name}.`;
    }

    return Buttress.getCollection('topic').save({
      name: constituency.name,
      description: description,
      constituencyPano: constituency.pano,
      banner: `/images/cards/photo${Math.floor((Math.random() * 32) + 1)}.jpg`,
      parentId: Config.topics.constituenciesTopicId,
      editorIds: [],
      viewCount: 0,
      published: true,
    });
  }
}

module.exports = new Constituency();
