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
// const Helpers = require('./helpers');
const Logging = require('./logging');
const Buttress = require('buttress-js-api');
// const Queue = require('./api-queue');
// const Sugar = require('sugar');

/* ************************************************************
 *
 * SUBSCRIBE
 *
 **************************************************************/

const _increaseTopicViewCount = (req, res) => {
  if (!req.body.id) {
    res.sendStatus(400);
    return;
  }

  const id = req.body.id;

  return Buttress.getCollection('topic').get(id)
    .then((topic) => Buttress.getCollection('topic').update(topic.id, {
      path: 'viewCount',
      value: topic.viewCount + 1,
    }))
    .then(() => res.json({res: true}))
    .catch((err) => {
      Logging.logError(`Topic View Failed: ${err.message}`);
      res.json({res: false, err: err.message});
    });
};

module.exports.init = (app) => {
  app.post('/api/v1/topic/view', _increaseTopicViewCount);
};
