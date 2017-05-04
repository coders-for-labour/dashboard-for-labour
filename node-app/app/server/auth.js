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
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const Rhizome = require('rhizome-api-js');
const Cache = require('./cache');

module.exports.init = app => {
  passport.use(new GoogleStrategy({
    clientID: Config.auth.google.clientId,
    clientSecret: Config.auth.google.clientSecret,
    callbackURL: `/auth/google/callback`
  }, (accessToken, refreshToken, profile, cb) => {
    const user = {
      app: 'google',
      id: profile.id,
      token: accessToken,
      name: profile.displayName,
      email: profile.emails[0].value,
      profileUrl: profile._json.url,
      profileImgUrl: profile._json.image.url,
      bannerImgUrl: profile._json.cover ? profile._json.cover.coverPhoto.url : ''
    };

    Logging.logSilly(user);

    let cache = Cache.Manager.getCache(Cache.Constants.Type.TEAM);
    cache.getData()
      .then(users => {
        let authenticated = users.find(u => u.email === user.email);
        let authentication;
        if (authenticated) {
          Logging.logSilly(authenticated);
          authentication = {
            authLevel: authenticated.authLevel,
            domains: ["http://dashboard.forlabour.com"],
            permissions: [
              {route: "user/*", permission: "*"},
              {route: "person/*", permission: "*"},
              {route: "post/*", permission: "*"}
            ]
          };
          user.orgRole = authenticated.orgRole;
          user.teamName = authenticated.teamName;
          user.teamRole = authenticated.teamRole;
        } else {
          Logging.logError(new Error(`Unknown User: ${user.email}`));
          cb(new Error(`Unknown User: ${user.email}`), null);
          return;
        }

        Logging.logSilly(authentication);

        Rhizome.Auth
          .findOrCreateUser(user, authentication)
          .then(Logging.Promise.logSilly("RhizomeUser"))
          .then(rhizomeUser => {
            cb(null, rhizomeUser);
          })
          .catch(Logging.Promise.logError());
      });
  }));

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
            orgRole: user.orgRole,
            teamName: user.teamName,
            teamRole: user.teamRole,
            profiles: req.user.auth.map(function(a) {
              return {
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

  const AUTH_SCOPE = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ];
  app.get('/auth/google', passport.authenticate(
    'google', {
      scope: AUTH_SCOPE.join(' ')
    }
  ));
  app.get('/auth/google/callback', passport.authenticate('google', {successRedirect: '/', failureRedirect: '/'}));
};
