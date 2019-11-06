'use strict';

/**
 * Dashboard for Labour
 *
 * @file bootstrap.js
 * @description
 * @module System
 * @author Coders for Labour
 *
 */

const Config = require('node-env-obj')('../../');
const Buttress = require('buttress-js-api');

// const os = require('os');
const cluster = require('cluster');
const Helpers = require('./helpers');

const Schema = require('../schema');
const AppRoles = require('../schema/appRoles.json');

const Auth = require('./auth');
const Thunderclap = require('./thunderclap');
const Queue = require('./api-queue');
const Cache = require('./cache');
// const Uploads = require('./uploads');
const Constituency = require('./constituency');
const Logging = require('./logging');

const express = require('express');
const session = require('express-session');
// const redis = require('redis');
const RedisStore = require('connect-redis')(session);
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const passport = require('passport');

// const redisClient = redis.createClient(Config.redis);
// const redisClient = redis.createClient(Config.redis.port, Config.redis.host);

// redisClient.on('error', err => console.log(err));

/* ********************************************************************************
 *
 *
 *
 **********************************************************************************/
// const processes = os.cpus().length;
const processes = 1;
const _workers = [];

/* ********************************************************************************
 *
 * WORKERS
 *
 **********************************************************************************/
const __spawnWorkers = () => {
  Logging.log(`Spawning ${processes} REST Workers`);

  const __spawn = (idx) => {
    _workers[idx] = cluster.fork();
  };

  for (let x = 0; x < processes; x++) {
    __spawn(x);
  }
};

/* ********************************************************************************
 *
 * WORKER
 *
 **********************************************************************************/
const __initWorker = () => {
  const app = express();
  app.enable('trust proxy', 1);
  app.use(morgan(`:date[iso] [${cluster.worker.id}] :method :status :url :res[content-length] - :response-time ms - :remote-addr`));
  app.use(bodyParser.json({limit: '5mb'}));
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(methodOverride());
  app.use(session({
    saveUninitialized: false,
    resave: false,
    secret: Config.auth.sessionSecret,
    store: new RedisStore({
      logErrors: true,
    }),
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.listen(Config.app.port);

  Auth.init(app);
  // Twibbyn.init(app);
  Thunderclap.init(app);
  // Queue.Manager.init(app);
  Cache.Manager.create(Cache.Constants.Type.CONSTITUENCY);
  Cache.Manager.create(Cache.Constants.Type.TEAM);
  Constituency.init(app);
  // Uploads.init(app);

  const tasks = [
    Helpers.AppData.createFolder('/'),
    Helpers.AppData.createFolder('/image_cache'),
    Helpers.AppData.createFolder('/uploads'),
  ];

  return Promise.all(tasks);
};

/* ********************************************************************************
 *
 * MASTER
 *
 **********************************************************************************/
const __initMaster = () => {
  const isPrimary = Config.cluster.app === 'primary';

  return Buttress.initSchema()
    .then(Logging.logInfo(`Uploaded ${Schema.length} schema(s) & app role(s) to Buttress`))
    .then(() => {
      Queue.Manager.init(isPrimary);
      __spawnWorkers();
    });
};

/* ************************************************************
 *
 * BOOTSTRAP
 *
 **************************************************************/
const _installApp = () => {
  let processInit = null;

  Logging.logDebug(`Attempting to connect to Buttress using: ${Config.buttress.url}`);

  if (cluster.isMaster) {
    processInit = () => __initMaster();
  } else {
    processInit = () => __initWorker();
  }

  return Buttress.init({
    buttressUrl: Config.buttress.url,
    appToken: Config.buttress.token,
    schema: Schema,
    roles: AppRoles,
    apiPath: Config.buttress.apiPath,
    version: Config.buttress.apiVersion,
  })
    .then(processInit)
    .then(() => cluster.isMaster)
    .catch(Logging.logError);
};

module.exports = {
  app: _installApp,
};

