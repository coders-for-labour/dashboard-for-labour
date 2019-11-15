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
const Buttress = require('buttress-js-api');
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
  if (!req.body || !req.body.id) {
    res.sendStatus(400);
    return;
  }
  if (!req.body || !req.body.message) {
    res.sendStatus(400);
    return;
  }

  const twitterAuth = req.user.auth.find((a) => a.app === 'twitter');
  if (!twitterAuth) {
    res.send(400);
    return;
  }

  const id = req.body.id;
  const message = req.body.message;

  return Buttress.getCollection('thunderclap').get(id)
    .then((thunderclap) => {
      if (thunderclap.supporters.findIndex((id) => id == req.user.id) !== -1) {
        throw new Error('already_subscribed');
      }

      const time = Sugar.Date.create('now');
      const itemDate = Sugar.Date.create(thunderclap.scheduledExecution);
      if (!Sugar.Date.isAfter(itemDate, time)) {
        throw new Error('campaign_elapsed');
      }

      // Update supporters
      Buttress.getCollection('thunderclap').update(id, {
        path: 'supporters',
        value: req.user.id,
      });
      Buttress.getCollection('thunderclap').update(id, {
        path: 'supportersCount',
        value: thunderclap.supporters.length + 1,
      });

      return Queue.Manager.add({
        app: Queue.Constants.App.TWITTER,
        username: twitterAuth.username,
        method: 'POST',
        api: 'statuses/update.json',
        processAfter: thunderclap.scheduledExecution,
        params: {
          status: `${message}`,
          include_entities: false, // eslint-disable-line camelcase
          skip_statuses: true, // eslint-disable-line camelcase
        },
        token: twitterAuth.token,
        tokenSecret: twitterAuth.tokenSecret,
      }, Queue.Constants.Queue.API);
    })
    .then((result) => {
      if (!result) {
        throw new Error('failed_to_queue');
      }

      res.json({res: true});
    })
    .catch((err) => {
      Logging.logError(`Thunderclap Subscribe Failed: ${err.message}`);
      res.json({res: false, err: err.message});
    });
};

module.exports.init = (app) => {
  Helpers.AppData.createFolder('/user_data');

  app.put('/api/v1/thunderclap/twitter/subscribe', _subscribeThunderclap);
};
