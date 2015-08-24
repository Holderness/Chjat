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
      messages: req.flash('error') || req.flash('info')
    });
  }
  else {
    console.log('wwwwwwuttttttuuu');
    return res.redirect('/');
  }
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
  if (!req.user) {
    var user = new User(req.body);
    var message = null;
    user.provider = 'local';
    user.save(function(err) {
      if (err) {
        var message = getErrorMessage(err);
        req.flash('error', message);
        return res.redirect('/#reg');
      } 

      req.login(user, function(err) {
        if (err) 
          return next(err);
        
        return res.redirect('/');
      });
    });
  }
  else {
    return res.redirect('/');
  }
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