'use strict';

/**
 * Dashboard for Labour
 *
 * @file auth.js
 * @description
 * @module System
 * @author Lighten
 *
 */

const Logging = require('./logging');
const Config = require('./config');
const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const Rhizome = require('rhizome-api-js');

/* ************************************************************
 *
 * RHIZOME AUTHENTICATION
 *
 **************************************************************/
const __authenticateRihzomeUser = (appAuth, existingUser) => {
  let authentication = {
    authLevel: 1,
    domains: [`${Config.app.subdomain}.${Config.app.domain}`],
    permissions: [
      {route: "user", permission: "list"},
      {route: "user/me/metadata/:key", permission: "add"},
      {route: "user/me/metadata/:key", permission: "write"},
      {route: "user/me/metadata/:key?", permission: "read"},
      {route: "campaign", permission: "list"},
      {route: "campaign/:id/metadata/:key?", permission: "read"},
      {route: "post", permission: "list"},
      {route: "post", permission: "read"},
      {route: "post", permission: "add"},
      {route: "post", permission: "write"}
    ]
  };

  if (existingUser) {
    Logging.logDebug(`Adding App (${appAuth.app}) To User: ${existingUser.id}`);
    return Rhizome.Auth.addAuthToUser(existingUser.id, appAuth);
  }

  Logging.logDebug(`Authenticating User`);
  return Rhizome.Auth.findOrCreateUser(appAuth, authentication);
};

module.exports.init = app => {
  /* ************************************************************
   *
   * TWITTER
   *
   **************************************************************/
  passport.use(new TwitterStrategy({
    consumerKey: Config.auth.twitter.consumerKey,
    consumerSecret: Config.auth.twitter.consumerSecret,
    callbackURL: `/auth/twitter/callback`
  }, (token, tokenSecret, profile, cb) => {
    Logging.logSilly('AUTHENTICATE: Strategy');

    const user = {
      app: 'twitter',
      id: profile.id,
      token: token,
      tokenSecret: tokenSecret,
      name: profile.displayName,
      username: profile.username,
      profileUrl: `https://twitter.com/${profile.username}`,
      profileImgUrl: profile.photos[0].value,
      bannerImgUrl: profile._json.profile_background_image_url ? profile._json.profile_background_image_url : ''
    };

    cb(null, user);
  }));

  /* ************************************************************
   *
   * FACEBOOK
   *
   **************************************************************/
  passport.use(new FacebookStrategy({
    clientID: Config.auth.facebook.appId,
    clientSecret: Config.auth.facebook.appSecret,
    callbackURL: '/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'name', 'cover', 'picture', 'email']
  }, (token, refreshToken, profile, cb) => {
    const p = profile._json;
    const user = {
      app: 'facebook',
      id: p.id,
      token: token,
      name: p.name,
      email: p.email,
      profileImgUrl: p.picture.data.url,
      bannerImgUrl: p.cover.source
    };

    Logging.logSilly(user);
    cb(null, user);
  }));

  /* ************************************************************
   *
   * SERIALISE / DESERIALISE
   *
   **************************************************************/
  passport.serializeUser((user, done) => {
    Logging.logVerbose('Auth Serialise User');
    Logging.logSilly(user);
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    Logging.logVerbose('Auth Deserialise User');
    Logging.logSilly(user);
    done(null, user);
  });

  /* ************************************************************
   *
   * AUTHENTICATED
   *
   **************************************************************/
  app.get('/authenticated', (req, res) => {
    if (!req.user) {
      res.json(null);
      return;
    }

    Logging.logSilly(req.user);

    Rhizome.User.load(req.user.rhizomeId)
      .then(user => {
        res.json({
          user: {
            id: req.user.rhizomeId,
            profiles: user.auth.map(function(a) {
              return {
                id: a.appId,
                app: a.app,
                email: a.email,
                url: a.profileUrl,
                images: a.images
              };
            }),
            person: {
              title: req.user.person.title,
              forename: req.user.person.forename,
              initials: req.user.person.initials,
              surname: req.user.person.surname,
              formalName: req.user.person.formalName
            },
            authToken: req.user.rhizomeAuthToken
          }
        });
      });
  });

  app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });

  /* ************************************************************
   *
   * ROUTES
   *
   **************************************************************/
  const TW_AUTH_SCOPE = [
  ];
  app.get('/auth/twitter', (req, res, next) => {
    Logging.logSilly("AUTHENTICATE: /auth/twitter");

    req.session.returnPath = req.get('Referer');
    Logging.logSilly(req.session.returnPath);

    passport.authenticate(
      'twitter', {
        scope: TW_AUTH_SCOPE.join(' ')
      }
    )(req, res, next);
  });
  app.get('/auth/twitter/callback', (req, res, next) => {
    Logging.logSilly("AUTHENTICATE: /auth/twitter/callback");

    passport.authenticate('twitter', (err, appAuth, info) => {
      Logging.logSilly("AUTHENTICATE: Authenticated");
      if (err) throw err;

      __authenticateRihzomeUser(appAuth, req.user)
        .then(user => {
          Logging.logDebug(user);
          req.login(user, err => {
            if (err) throw err;
            let rp = req.session.returnPath;
            req.session.returnPath = '';
            res.redirect(rp ? rp : '/');
          });
        })
        .catch(Logging.Promise.logError());
    })(req, res, next);
  });

  const FB_AUTH_SCOPE = [
    'public_profile', 'email', 'publish_actions'
  ];
  app.get('/auth/facebook', (req, res, next) => {
    req.session.returnPath = req.get('Referer');
    Logging.logSilly(req.session.returnPath);

    passport.authenticate(
      'facebook', {
        scope: FB_AUTH_SCOPE
      }
    )(req, res, next);
  });
  app.get('/auth/facebook/callback', (req, res, next) => {
    passport.authenticate('facebook', (err, appAuth, info) => {
      if (err) throw err;

      __authenticateRihzomeUser(appAuth, req.user)
        .then(user => {
          Logging.logSilly(user);
          req.login(user, err => {
            if (err) throw err;
            let rp = req.session.returnPath;
            req.session.returnPath = '';
            res.redirect(rp ? rp : '/');
          });
        })
        .catch(Logging.Promise.logError());
    })(req, res, next);
  });
};
