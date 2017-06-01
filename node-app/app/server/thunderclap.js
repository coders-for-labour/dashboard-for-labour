'use strict';

/**
 * Dashboard for Labour
 *
 * @file twibbyn.js
 * @description
 * @module System
 * @author Lighten
 *
 */

// const path = require('path');
const Helpers = require('./helpers');
const Logging = require('./logging');
const Rhizome = require('rhizome-api-js');
const Queue = require('./api-queue');
const Sugar = require('sugar');

/* ************************************************************
 *
 * SUBSCRIBE
 *
 **************************************************************/

const _subscribeThunderclap = (req, res) => {
  if (!req.user) {
    res.sendStatus(403);
    return;
  }
  if (!req.body || !req.body.campaignId) {
    res.sendStatus(400);
    return;
  }
  if (!req.body || !req.body.message) {
    res.sendStatus(400);
    return;
  }

  const twitterAuth = req.user.auth.find(a => a.app === 'twitter');
  if (!twitterAuth) {
    res.send(400);
    return;
  }

  const campaignId = req.body.campaignId;
  const message = req.body.message;
  let supporters = [];

  Rhizome.Campaign.Metadata.load(campaignId, 'supporters', [])
    .then(s => {
      Logging.logDebug(req.user.id);
      Logging.logDebug(s);
      if (s.findIndex(id => id == req.user.id) !== -1) { // eslint-disable-line eqeqeq
        throw new Error('already_subscribed');
      }
      supporters = s;
      supporters.push(req.user.id);
      Rhizome.Campaign.Metadata.save(campaignId, 'supporters', supporters);

      return Rhizome.Campaign.Metadata.load(campaignId, 'thunderclapTime', '');
    })
    .then(timeString => {
      if (!timeString) {
        throw new Error('invalid_timestamp');
      }

      const time = Sugar.Date.create('now');
      const itemDate = Sugar.Date.create(timeString);
      if (!Sugar.Date.isAfter(time, itemDate)) {
        throw new Error('campaign_elapsed');
      }

      return Queue.Manager.add({
        app: Queue.Constants.App.TWITTER,
        username: twitterAuth.username,
        method: 'POST',
        api: 'statuses/update.json',
        processAfter: timeString,
        params: {
          status: `${message}`,
          include_entities: false, // eslint-disable-line camelcase
          skip_statuses: true // eslint-disable-line camelcase
        },
        token: twitterAuth.token,
        tokenSecret: twitterAuth.tokenSecret
      });
    })
    .then(result => {
      if (!result) {
        throw new Error('failed_to_queue');
      }

      res.json({res: true});
    })
    .catch(err => {
      Logging.log(`Thunderclap Subscribe Failed: ${err.message}`);
      res.json({res: false, err: err.message});
    });
};

module.exports.init = app => {
  Helpers.AppData.createFolder('/user_data');

  app.put('/thunderclap/twitter/subscribe', _subscribeThunderclap);
};
