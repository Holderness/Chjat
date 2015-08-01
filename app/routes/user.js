var users = require('../../app/controllers/user'),
  passport = require('passport');

module.exports = function(app) {
  app.route('/users').post(users.create).get(users.list);

  app.route('/users/:userId').get(users.read).put(users.update).delete(users.delete);

  app.param('userId', users.userByID);

  app.route('/register')
    .get(users.renderRegister)
    .post(users.register);

  app.route('/login')
    .get(users.renderLogin)
    .post(passport.authenticate('local', {
      successRedirect: '/#authenticated',
      failureRedirect: '/',
      failureFlash: true
    }));

  app.get('/logout', users.logout);

  app.get('/oauth/facebook', passport.authenticate('facebook', {
    failureRedirect: '/',
    scope:['email']
  }));

  app.get('/oauth/facebook/callback', passport.authenticate('facebook', {
    failureRedirect: '/',
    successRedirect: '/#authenticated',
    scope:['email']
  }));

  app.get('/oauth/twitter', passport.authenticate('twitter', {
    failureRedirect: '/'
  }));

  app.get('/oauth/twitter/callback', passport.authenticate('twitter', {
    failureRedirect: '/',
    successRedirect: '/#authenticated'
  }));
};


// app.get('/login', function(req, res, next) {
//   passport.authenticate('local', function(err, user, info) {
//     if (err) { return next(err); }
//     if (!user) { return res.redirect('/login'); }
//     req.logIn(user, function(err) {
//       if (err) { return next(err); }
//       return res.redirect('/users/' + user.username);
//     });
//   })(req, res, next);
// });