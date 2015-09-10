var User = require('mongoose').model('User'),
    passport = require('passport');

var getErrorMessage = function(err) {
  var message = '';
  if (err.code) {
    switch (err.code) {
      case 11000:
      case 11001:
        message = 'Username already exists';
        break;
      default:
        message = 'Something went wrong';
    }
  }
  else {
    for (var errName in err.errors) {
      if (err.errors[errName].message)
        message = err.errors[errName].message;
    }
  }
  return message;
};


exports.renderLogin = function(req, res, next) {
    console.log('req: ', req);
  if (!req.user) {
    res.render('login', {
      title: 'Log-in Form',
      messages: req.x('error') || req.flash('info')
    });
  }
  else {
    console.log('wwwwwwuttttttuuu');
    return res.redirect('/');
  }
};

exports.login = function(req, res, next) {
    passport.authenticate('local', function(err, user, fail) {
      console.log('user--> ', user);
      console.log('fail--> ', fail);
      if (fail) { return res.send(fail); }
      return res.json(200);
    })(req, res, next);
  };

exports.renderRegister = function(req, res, next) {
  if (!req.user) {
    res.render('register', {
      title: 'Register Form',
      messages: req.flash('error')
    });
  }
  else {
    return res.redirect('/');
  }
};

exports.register = function(req, res, next) {
  User.findOne({username: req.body.username },
    function(err, user) {
      if (user) {
        // var message = "User already exists";
        // req.flash('error', message);
        return res.redirect('/');
      } else if (!user) {
        var newUser = new User(req.body);
        newUser.provider = 'local';
        newUser.save(function(err) {
          if (err) {
            var message = "something gone wrong";
            req.flash('error', message);
            return res.redirect('/');
          }
          req.login(newUser, function(err) {
            if (err) {
             return next(err);
            }
            return res.redirect('/');
          });
        });
      } else {
        return res.redirect('/');
      }
    }
  );
};

exports.validateUsername = function(req, res, next) {
  console.log('req.body: ', req.body);
  User.findOne({username: req.body.username },
    function(err, user) {
       console.log(user);
       if (user) {
         return res.send({usernameAvailable: false});
       } else if (!user) {

         return res.send({usernameAvailable: true});
       } else {
        console.log(err);
      }
    }
  );
};

exports.logout = function(req, res) {
  console.log('HELLO');
  req.session.passport = {};
  req.session.userdata = {};
  console.log('HELLOAGAIN', req.session);
  req.session.save(function (err) {
    console.log('HELLOAGAINATHIRDTIME', req.session);
    res.json(200);
  });
};

exports.saveOAuthUserProfile = function(req, profile, done) {
  User.findOne({
      provider: profile.provider,
      providerId: profile.providerId
    },
    function(err, user) {
      if (err) {
        return done(err);
      }
      else {
        if (!user) {
          console.log('PROFILLLLE', profile);
          var possibleUsername = profile.username || ((profile.email) ? profile.email.split('@')[0] : '');
          User.findUniqueUsername(possibleUsername, null, function(availableUsername) {
            profile.username = availableUsername;
            user = new User(profile);

            user.save(function(err) {
              console.log(err);
              if (err) {
                var message = _this.getErrorMessage(err);
                req.flash('error', message);
                return res.redirect('/#reg');
              }

              return done(err, user);
            });
          });
        }
        else {
          return done(err, user);
        }
      }
    }
  );
};



exports.create = function(req, res, next) {
  var user = new User(req.body);
  user.save(function(err) {
    if (err) {
      return next(err);
    }
    else {
      res.json(user);
    }
  });
};

exports.list = function(req, res, next) {
  User.find({}, function(err, users) {
    if (err) {
      return next(err);
    }
    else {
      res.json(users);
    }
  });
};

exports.read = function(req, res) {
  res.json(req.user);
};

exports.userByID = function(req, res, next, id) {
  User.findOne({
      _id: id
    },
    function(err, user) {
      if (err) {
        return next(err);
      }
      else {
        req.user = user;
        next();
      }
    }
  );
};

exports.update = function(req, res, next) {
  User.findByIdAndUpdate(req.user.id, req.body, function(err, user) {
    if (err) {
      return next(err);
    }
    else {
      res.json(user);
    }
  });
};

exports.delete = function(req, res, next) {
  req.user.remove(function(err) {
    if (err) {
      return next(err);
    }
    else {
      res.json(req.user);
    }
  })
};