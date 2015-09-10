var users = require('../../app/controllers/user'),
  passport = require('passport');

module.exports = function(app) {
  app.route('/users').post(users.create).get(users.list);

  app.route('/users/:userId').get(users.read).put(users.update).delete(users.delete);

  app.param('userId', users.userByID);

  app.route('/register')
    .get(users.renderRegister)
    .post(users.register);

  app.route('/registerValidation')
    .post(users.validateUsername);
    

  app.post('/login', function(req, res, next){
    passport.authenticate('local', function(err, user, fail) {
      console.log('user--> ', user);
      console.log('fail--> ', fail);
      if (fail) { return res.send(fail); }
      return res.json(200);
    })(req, res, next);
  });


  app.get('/logout', users.logout);
  
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

