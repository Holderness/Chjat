var passport = require('passport'),
  url = require('url'),
  FacebookStrategy = require('passport-facebook').Strategy,
  config = require('../config'),
  users = require('../../app/controllers/user');

module.exports = function() {
  passport.use(new FacebookStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret,
    callbackURL: config.facebook.callbackURL,
    profileFields: ['id', 'birthday', 'email', 'first_name', 'gender', 'last_name'],
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, done) {
    var providerData = profile._json;
    providerData.accessToken = accessToken;
    providerData.refreshToken = refreshToken;

    console.log('profile: ', profile);

    var providerUserProfile = {
      name: profile.name.givenName,
      email: profile.emails[0].value,
      username: profile.username,
      provider: 'facebook',
      userImage: "http://graph.facebook.com/" + profile.id + "/picture?type=square",
      providerId: profile.id,
      providerData: providerData
    };
    
    console.log('----------------------------------------------');
    req.sessionStore.user = providerUserProfile;
    console.log(req.sessionStore);
    // req.session.store.session = req.session;
    // req.session.store.save(function(err) {
    //   if (err) { return err; }
    // });
    // console.log('reqqqqq: ', req.session.sessionStore.user);
    // console.log('reqqqqqq: ', req.session);
    users.saveOAuthUserProfile(req, providerUserProfile, done);
  }));
};