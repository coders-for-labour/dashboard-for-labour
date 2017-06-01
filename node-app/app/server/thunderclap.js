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
// const Logging = require('./logging');
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

  Rhizome.Campaign.Metadata.load(campaignId, 'thunderclapTime', '')
    .then(timeString => {
      if (!timeString) {
        timeString = Sugar.Date.create('now').toISOString();
      }

      return Queue.Manager.add({
        app: Queue.Constants.App.TWITTER,
        username: twitterAuth.username,
        method: 'POST',
        api: 'statuses/update.json',
        processAfter: timeString,
        params: {
          status: `${message} ${timeString}`,
          include_entities: false, // eslint-disable-line camelcase
          skip_statuses: true // eslint-disable-line camelcase
        },
        token: twitterAuth.token,
        tokenSecret: twitterAuth.tokenSecret
      });
    })
    .then(result => {
      if (!result) {
        res.sendStatus(400);
        return;
      }

      Rhizome.Campaign.Metadata.load(campaignId, 'userCount', 0)
        .then(count => {
          Rhizome.Campaign.Metadata.save(campaignId, 'userCount', count + 1);
        });

      res.sendStatus(200);
    });
};

module.exports.init = app => {
  Helpers.AppData.createFolder('/user_data');

  app.put('/thunderclap/twitter/subscribe', _subscribeThunderclap);
};
