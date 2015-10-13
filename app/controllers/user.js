var User = require('mongoose').model('User'),
    passport = require('passport'),
    multer = require('multer'),
    fs = require('fs'),
    AWS = require('aws-sdk');





//////////// AWS
var AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY,
    AWS_SECRET_KEY = process.env.AWS_SECRET_KEY,
    S3_BUCKET = process.env.S3_BUCKET;

AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_KEY
});

s3 = new AWS.S3({params: {Bucket: S3_BUCKET }});

var uploadToS3 = function(file, destFileName, callback) {
  s3
    .upload({
      ACL: 'public-read',
      Body: fs.createReadStream(file.path),
      Key: destFileName.toString()
    })
    .send(callback);
};

exports.multerRestrictions = multer({limits: {fileSize:1024*1024}});

exports.updateUserImage = function (req, res, next) {

  console.log('req: ', req);
  console.log('----------------------------------------------------------------');
  console.log('req.files.userImageUpload: ', req.files.userImageUpload);

  if (!req.files || !req.files.userImageUpload) {
    return res.status(403).send('expect 1 file upload named userImageUpload').end();
  }
  var userImageUpload = req.files.userImageUpload;

  // this is mainly for user friendliness. this field can be tampered by attacker.
  if (!/^image\/(jpe?g|png|gif)$/i.test(userImageUpload.mimetype)) {
    return res.status(403).send('expect image file').end();
  }

  uploadToS3(userImageUpload, userImageUpload.name, function (err, data) {
    if (err) {
      console.error(err);
      return res.status(500)
        .send('failed to upload to s3')
        .end();
    }
      // console.log('data: ', data);
    res.status(200)
      .send({ userImage: data.Location, ETag: data.ETag, timestamp: _.now()})
      .end();
  });
};

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
  console.log('login');
    passport.authenticate('local', function(err, user, fail) {
      console.log('user--> ', user);
      console.log('fail--> ', fail);
      if (fail) { return res.send(fail); }
      return res.json(user);
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
  console.log('register');
  User.findOne({username: req.body.username },
    function(err, user) {
      if (user) {
        // var message = "User already exists";
        // req.flash('error', message);
        return res.redirect('/');

      } else if (!req.body.username.match(/^[a-zA-Z0-9.\-_$@*!]{5,20}$/)) {
        return res.send({message: 'username invalid'});
      } else if (!user) {
        console.log('no user!');
        var newUser = new User(req.body);
        newUser.provider = 'local';
        newUser.save(function(err) {
          if (err) {
            var message = "something gone wrong";
            req.flash('error', message);
            return res.redirect('/');
          }
          // req.login(newUser, function(err) {
          //   if (err) {
          //    return next(err);
          //   }
            
          // });
        });
        return res.send({user: newUser});
      } else {
        console.log('register else');
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

exports.validateEmail = function(req, res, next) {
  console.log('req.body: ', req.body);
  User.findOne({email: req.body.email },
    function(err, user) {
       console.log(user);
       if (user) {
         return res.send({emailAvailable: false});
       } else if (!user) {
         return res.send({emailAvailable: true});
       } else {
        console.log(err);
      }
    }
  );
};

exports.logout = function(req, res) {
  console.log('controller - logout - session destroy');
  req.session.passport = {};
  req.session.userdata = {};
  req.session.destroy();
  res.json(200);
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
    } else {
      res.send(users);
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

exports.findBy = function(req, res, next) {
  console.log( '----------userfindBy---------------req: ', req.query);
  return User.find({ username: new RegExp(req.query.username, "i")}, function( err, users ) {
    if (!err) {
      console.log('userfindBy!');
      var usernames = [];
      for (i = 0; i < users.length; i++) {
        usernames.push(users[i].username);
      }
      console.log(usernames);
      return res.send( usernames );
    } else {
      return console.log( err );
    }
  });
};

exports.allUsers = function(req, res, next) {
  User.find({}, function(err, users) {
    if (err) {
      return next(err);
    } else {
      var usernames = [];
      for (i = 0; i < users.length; i++) {
       // console.log(users[i]);
      usernames.push(users[i].username);
    }
      res.send(usernames);
    }
  });
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