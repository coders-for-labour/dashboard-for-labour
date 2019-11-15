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

const Config = require('node-env-obj')('../../');

const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const Buttress = require('buttress-js-api');
const Humanname = require('humanname');

const Cache = require('./cache');
const Logging = require('./logging');

const AppRoles = require('../schema/appRoles');

/* ************************************************************
 *
 * BUTTRESS AUTHENTICATION
 *
 **************************************************************/
const __authenticateUser = (appAuth, existingUser) => {
  const authentication = {
    unauthorised: {
      authLevel: 1,
      domains: [`${Config.app.protocol}://${Config.app.host}`],
      role: AppRoles.default,
      permissions: [
        {'route': 'app/schema', 'permission': 'read'},
        {'route': 'topic', 'permission': 'list'},
        {'route': 'issue', 'permission': 'list'},
        {'route': 'thunderclap', 'permission': 'list'},
        {'route': 'resource', 'permission': 'list'},
      ],
    },
    editor: {
      authLevel: 1,
      domains: [`${Config.app.protocol}://${Config.app.host}`],
      role: 'admin.editor',
      permissions: [
        {'route': '*', 'permission': '*'},
      ],
    },
    super: {
      authLevel: 1,
      domains: [`${Config.app.protocol}://${Config.app.host}`],
      role: 'admin.super',
      permissions: [
        {'route': '*', 'permission': '*'},
      ],
    },
  };
  let constituencies = null;
  let constituency = null;
  let authorisation = 'unauthorised';
  let user = null;
  let topic = null;

  Logging.logDebug(`AUTH: Pending ${appAuth.name} using ${appAuth.username}`);

  const tCache = Cache.Manager.getCache(Cache.Constants.Type.TEAM);
  const cCache = Cache.Manager.getCache(Cache.Constants.Type.CONSTITUENCY);
  return cCache.getData()
    .then((data) => {
      constituencies = [];
      for (const name in data) {
        if (data.hasOwnProperty(name) === false) continue;
        const c = data[name];
        c.name = name;
        constituencies.push(c);
      }
    })
    .then(() => tCache.getData())
    .then((users) => {
      const authorised = users.find((u) => appAuth.app === 'twitter' && u.twitter.toUpperCase() === appAuth.username.toUpperCase());
      if (!authorised) {
        Logging.logDebug(`AUTH: Pending ${appAuth.name} Not found in team sheet`);
        return null;
      }

      if (authorised.teamName === 'National') {
        authorisation = 'super';
        Logging.logDebug(`AUTH: Matched ${appAuth.name} as team ${authorised.teamName}`);
      } else {
        authorisation = 'editor';
        Logging.logDebug(`AUTH: Matched ${appAuth.name} as team ${authorised.teamName}`);
      }

      return authorised;
    })
    .then((authorised) => {
      if (!authorised) {
        return;
      }

      constituency = constituencies.find((c) => c.pano == authorised.teamName);
      if (!constituency) {
        return;
      }

      return Buttress.getCollection('topic').getAll();
    })
    .then((topics) => {
      if (!topics) {
        return null;
      }

      return topics.find((t) => t.constituencyPano == constituency.pano);
    })
    .then((_topic) => {
      if (_topic) return _topic;
      if (_topic === null) return;

      const r17 = constituency['2017'].results;
      const mp = r17[0];
      const labourIdx = r17.findIndex((mp) => mp.party === 'Labour');
      const labour = r17[labourIdx];
      const labourBehind = r17.reduce((behind, mp, idx) => {
        if (idx >= labourIdx) return behind;
        behind += mp.ahead;
        return behind;
      }, 0);

      let description = '';
      if (labour !== mp) {
        description = `This seat is currently held by ${mp.party} with a majority of ${mp.ahead}. The MP is ${mp.name}.
        The Labour MP in the 2017 election was ${labour.name}. We need ${labourBehind} votes to win this seat.`;
      } else {
        description = `This seat is currently held by Labour with a majority of ${mp.ahead}. Your MP is ${mp.name}.`;
      }

      return Buttress.getCollection('topic').save({
        name: constituency.name,
        description: description,
        constituencyPano: constituency.pano,
        banner: `/images/cards/photo${Math.floor((Math.random() * 32) + 1)}.jpg`,
        parentId: Config.topics.constituenciesTopicId,
        editorIds: [],
        viewCount: 0,
        published: true,
      });
    })
    .then((_topic) => topic = _topic)
    .then(() => Buttress.Auth.findOrCreateUser(appAuth, authentication[authorisation]))
    .then((_user) => {
      if (!_user) {
        Logging.logError(`AUTH: User ${appAuth.name} profile doesn\'t exist using ${appAuth.username}`);
        return cb(null, null);
      }

      user = _user;
      Logging.logDebug(`AUTH: Success ${appAuth.name} using ${user.id}`);

      if (!user.tokens || user.tokens.length < 1) {
        Logging.logDebug(`AUTH: Missing token for ${user.id}:${appAuth.name}`);
        return Buttress.Auth.createToken(user.id, authentication)
          .then((token) => {
            user.tokens.push(token);
            return user;
          });
      }
    })
    .then(() => {
      if (!user || authorisation === 'unauthorised' || !topic) {
        return;
      }

      const editorIdx = topic.editorIds.indexOf(user.id);
      if (editorIdx != -1) {
        return;
      }

      return Promise.all([
        Buttress.getCollection('topic').update(topic.id, {
          path: 'editorIds',
          value: user.id,
        }),
        Buttress.getCollection('topic').update(topic.id, {
          path: 'hasEditors',
          value: true,
        })
      ]);
    })
    .then(() => Buttress.getCollection('people').getAll())
    .then((people) => {
      const person = people.find((p) => p.authId === user.id);

      if (!person) {
        const name = Humanname.parse(appAuth.name);

        const title = name.salutation ? name.salutation + ' ' : '';
        const initials = name.initials ? name.initials + ' ' : '';

        return Buttress.getCollection('people').save({
          authId: user.id,
          title: name.salutation,
          formalName: `${title}${name.firstName} ${initials}${name.lastName}`.trim(),
          name: `${name.firstName} ${name.lastName}`.trim(),
          forename: name.firstName,
          initials: name.initials,
          surname: name.lastName,
          suffix: name.suffix,
          avatar: appAuth.profileImgUrl,
          type: 'CLIENT',
          role: 'CLIENT',
        });
      }

      return false;
    })
    .then(() => user)
    .catch((err) => {
      Logging.logError(err);
    });
};

module.exports.init = (app) => {
  /* ************************************************************
   *
   * TWITTER
   *
   **************************************************************/
  passport.use(new TwitterStrategy({
    consumerKey: Config.auth.twitter.consumerKey,
    consumerSecret: Config.auth.twitter.consumerSecret,
    callbackURL: `/auth/twitter/callback`,
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
      bannerImgUrl: profile._json.profile_background_image_url ? profile._json.profile_background_image_url : '',
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
    profileFields: ['id', 'displayName', 'name', 'cover', 'picture', 'email'],
  }, (token, refreshToken, profile, cb) => {
    const p = profile._json;
    const user = {
      app: 'facebook',
      id: p.id,
      token: token,
      name: p.name,
      email: p.email,
      profileImgUrl: p.picture.data.url,
      bannerImgUrl: p.cover ? p.cover.source : '',
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

    let _user = null;
    return Buttress.App.getSchema()
      .then(() => Buttress.User.get(req.user.id))
      .then((user) => {
        if (!user) {
          throw new Error(`Unable to find user ${req.user.id}`);
        }

        _user = user;
      })
      .then(() => Buttress.getCollection('people').getAll())
      .then((people) => {
        const person = people.find((p) => p.authId === _user.id);
        if (!person) {
          throw new Error(`AUTH: No profile found for user id: ${_user.id}`);
        }

        _user.person = person;

        return res.json({
          user: _user,
        });
      })
      .catch((err) => {
        if (err instanceof Error) {
          Logging.logError(err);
          res.status(503).end();
        } else {
          res.json(null).end();
          return null;
        }
      });

    Buttress.User.load(req.user.id)
      .then((user) => {
        res.json({
          user: {
            id: req.user.id,
            profiles: user.auth.map(function(a) {
              return {
                id: a.appId,
                app: a.app,
                email: a.email,
                url: a.profileUrl,
                images: a.images,
              };
            }),
            person: {
              title: req.user.person.title,
              forename: req.user.person.forename,
              initials: req.user.person.initials,
              surname: req.user.person.surname,
              formalName: req.user.person.formalName,
            },
            authToken: req.user.token,
          },
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
    Logging.logSilly('AUTHENTICATE: /auth/twitter');

    req.session.returnPath = req.get('Referer');
    Logging.logSilly(req.session.returnPath);

    passport.authenticate(
      'twitter', {
        scope: TW_AUTH_SCOPE.join(' '),
      }
    )(req, res, next);
  });
  app.get('/auth/twitter/callback', (req, res, next) => {
    const rp = req.session.returnPath;
    Logging.logSilly('AUTHENTICATE: /auth/twitter/callback');

    // Check to see if user is already auth'd, if they are
    // the return them to the app.
    if (req.user) {
      Logging.logInfo('AUTHENTICATE: Redirecting already authed user from /auth/twitter/callback');
      req.session.returnPath = '';
      res.redirect(rp ? rp : '/');
      return next();
    }

    passport.authenticate('twitter', (err, appAuth, info) => {
      Logging.logSilly('AUTHENTICATE: Authenticated');
      if (err) throw err;

      return __authenticateUser(appAuth, req.user)
        .then((user) => {
          Logging.logDebug(user);
          req.login(user, (err) => {
            if (err) throw err;
            req.session.returnPath = '';
            res.redirect(rp ? rp : '/');
          });
        })
        .catch(Logging.Promise.logError());
    })(req, res, next);
  });

  const FB_AUTH_SCOPE = [
    'public_profile', 'email', 'publish_actions',
  ];
  app.get('/auth/facebook', (req, res, next) => {
    req.session.returnPath = req.get('Referer');
    Logging.logSilly(req.session.returnPath);

    passport.authenticate(
      'facebook', {
        scope: FB_AUTH_SCOPE,
      }
    )(req, res, next);
  });
  app.get('/auth/facebook/callback', (req, res, next) => {
    passport.authenticate('facebook', (err, appAuth, info) => {
      if (err) throw err;

      __authenticateUser(appAuth, req.user)
        .then((user) => {
          Logging.logSilly(user);
          req.login(user, (err) => {
            if (err) throw err;
            const rp = req.session.returnPath;
            req.session.returnPath = '';
            res.redirect(rp ? rp : '/');
          });
        })
        .catch(Logging.Promise.logError());
    })(req, res, next);
  });
};
