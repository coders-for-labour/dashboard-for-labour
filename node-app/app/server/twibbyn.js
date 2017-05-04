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

// const fs = require('fs');
const path = require('path');

const Logging = require('./logging');
// const Config = require('./config');
const Composer = require('./composer');
// const Twitter = require('./twitter');

var _twibbons = [
  `${__dirname}/static/images/twibbyn/twibbyn1.png`,
  `${__dirname}/static/images/twibbyn/twibbyn2.png`,
  `${__dirname}/static/images/twibbyn/twibbyn3.png`,
  `${__dirname}/static/images/twibbyn/twibbyn4.png`,
  `${__dirname}/static/images/twibbyn/twibbyn5.png`,
  `${__dirname}/static/images/twibbyn/twibbyn6.png`
];

var _composeTwibbyn = (user, choice, toBuffer) => {
  Logging.logDebug(`User Profile: ${user.profileImgUrl}`);
  var imgUrl = user.profileImgUrl.replace('_normal', '');

  var composer = new Composer(500, 500, toBuffer);
  composer.params('antialias', 'subpixel');
  composer.params('patternQuality', 'best');
  composer.imageFromUrl(imgUrl, {gravity: 'mid'});
  composer.params('globalAlpha', 1);
  composer.imageFromFile(_twibbons[choice - 1], {
    width: 1.0, height: 1.0, gravity: 'bottom', cacheFile: true
  });

  return composer.render();
};

// var _saveTwibbyn = (req, res) => {
//   if (!req.user) {
//     res.sendStatus(403);
//     return;
//   }
//   var imgUrl = req.user.profileImgUrl.replace('_normal', '');
//   rest.get(imgUrl)
//     .on('success', (data, response) => {
//       var pathname = `${Config.userDataPath}/twibbyn/${req.user.rhizomeId}_avatar_backup`;
//       fs.writeFileSync(`${Config.userDataPath}/twibbyn/${_genPathname(pathname)}`, response.raw);
//     })
//     .on('error', err => {
//       Logging.log(err, Logging.Constants.LogLevel.ERR);
//     });
//
//   Logging.log('Saving Twibbyn', Logging.Constants.LogLevel.DEBUG);
//
//   _composeTwibbyn(req.user, req.params.choice, true)
//     .then(imageBuffer => {
//       Logging.log('Got Twibbyn', Logging.Constants.LogLevel.DEBUG);
//       res.send(Twitter.updateProfile(req.user, imageBuffer));
//       res.sendStatus(200);
//     });
// };

module.exports.init = app => {
  app.get(`/twibbyn/:choice([1-${_twibbons.length}])`, (req, res) => {
    _composeTwibbyn(req.user, req.params.choice)
      .then(readStream => {
        res.type('png');
        readStream.pipe(res);
      });
  });

  app.get('/twibbyn/overlay', (req, res) => {
    res.json(_twibbons.map(t => path.basename(t)));
  });

  // app.post(`/twibbyn/save/:choice([1-${_twibbons.length}])`, _saveTwibbyn);
};
