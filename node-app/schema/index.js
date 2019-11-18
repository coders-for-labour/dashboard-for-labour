'use strict';

/**
 * Dashboard for Labour
 *
 * @file app.js
 * @description
 * @author Lighten
 *
 */

const Schema = [
  require('./people.json'),
  require('./thunderclap.json'),
  require('./topic.json'),
  require('./issue.json'),
  require('./resource.json'),
  require('./link.json'),
];

module.exports = Schema;
