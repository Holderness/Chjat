var users = require('../../app/controllers/user'),
  passport = require('passport');

module.exports = function(app) {
  app.route('/users').post(users.create).get(users.list);

  app.route('/users/:userId').get(users.read).put(users.update).delete(users.delete);

  app.param('userId', users.userByID);

  app.route('/register')
    .get(users.renderRegister)
    .post(users.register);

  // app.route('/login')
  //   .get(users.renderLogin);

  app.post('/login', function(req, res, next){
    passport.authenticate('local', function(err, user) {
      // console.log('req.socket--> ', req.socket);
      if (user === false) { return res.redirect('/'); }
      return res.json(200);
    })(req, res, next);
  });

    // .post(passport.authenticate('local', {
    //    successRedirect: '/#authenticated',
    //    failureRedirect: '/'
    //  }));

  //     function(err, user, info) {
  //   if (err) { return next(err); }
  //   if (!user) { return res.redirect('/'); }
  //   console.log('user--> ', user);
  //   return res.redirect('/#authenticated');
  //   // req.logIn(user, function(err) {
  //   //   if (err) { return next(err); }
  //   //   return res.redirect('/users/' + user.username);
  //   // });
  // }));

  app.get('/logout', users.logout);

  // app.get('/oauth/facebook', function(req, res, next) {
  //   passport.authenticate('facebook')(req, res, next);
  // });
  
  app.get('/oauth/facebook', passport.authenticate('facebook', {
    failureRedirect: '/', scope:['email'] }),
    function(req, res) {
    console.log('req: ', req);
    console.log('res: ', res);
    });


  app.get('/oauth/facebook/callback', passport.authenticate('facebook', {
    failureRedirect: '/',
    successRedirect: '/#facebook',
    scope:['email']
  }));

  app.get('/oauth/twitter', passport.authenticate('twitter', {
    failureRedirect: '/'
  }));

  app.get('/oauth/twitter/callback', passport.authenticate('twitter', {
    failureRedirect: '/',
    successRedirect: '/#twitter'
  }));

  app.get('/#authenticated', passport.authenticate('twitter', {
    failureRedirect: '/',
    successRedirect: '/#twitter'
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