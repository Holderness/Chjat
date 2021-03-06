var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    User = require('mongoose').model('User');

module.exports = function() {
  passport.use(new LocalStrategy(function(username, password, done) {
    User.findOne(
      {username: username},
      function(err, user) {
        console.log('strategies/user', user);
        console.log('strategies/user, password', password);
        if (err) { return done(err); }
        console.log('username---->: ', username);
        if (!user) {
          User.findOne(
            {email: username},
            function(err, user) {
              if (err) { return done(err); }
              if (!user) { return done(null, false, {message: 'Unknown User'}); }
              user.authenticate(password, function(err, isMatch) {
                if (err) { return done(err); }
                // Password did not match
                if (!isMatch) { return done(null, false, {message: 'Invalid Email/Username or Password'}); }
                // Success
                return done(null, user);
              });
            }
          );
        } else {
          user.authenticate(password, function(err, isMatch) {
            if (err) { return done(err); }
            // Password did not match
            if (!isMatch) { return done(null, false, {message: 'Invalid Email/Username or Password'}); }
            // Success
            return done(null, user);
          });
        }
      }
    );
  }));
};

