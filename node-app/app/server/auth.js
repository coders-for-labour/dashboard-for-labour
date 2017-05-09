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
// const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const Rhizome = require('rhizome-api-js');
// const Cache = require('./cache');

module.exports.init = app => {
  passport.use(new TwitterStrategy({
    consumerKey: Config.auth.twitter.consumerKey,
    consumerSecret: Config.auth.twitter.consumerSecret,
    callbackURL: `/auth/twitter/callback`
  }, (token, tokenSecret, profile, cb) => {
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

    Logging.log(user);

    let authentication = {
      authLevel: 1,
      domains: [`${Config.app.protocol}://${Config.app.subdomain}.${Config.app.domain}`],
      permissions: [
        {route: "user/simplified", permission: "list"},
        {route: "campaign", permission: "list"},
        {route: "campaign/:id/metadata/:key?", permission: "read"},
        {route: "post", permission: "list"},
        {route: "post", permission: "read"},
        {route: "post", permission: "add"},
        {route: "post", permission: "write"}
      ]
    };

    Logging.logSilly(authentication);

    Rhizome.Auth
      .findOrCreateUser(user, authentication)
      .then(Logging.Promise.logSilly("RhizomeUser"))
      .then(rhizomeUser => {
        cb(null, rhizomeUser);
      })
      .catch(Logging.Promise.logError());
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
  ];
  app.get('/auth/twitter', passport.authenticate(
    'twitter', {
      scope: AUTH_SCOPE.join(' ')
    }
  ));
  app.get('/auth/twitter/callback', passport.authenticate('twitter', {successRedirect: '/', failureRedirect: '/'}));
};
