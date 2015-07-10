var mongoose = require('mongoose'),
    bcrypt = require('bcrypt-nodejs');


var UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  username: {
    type: String,
    trim: true,
    unique: true,
    required: true
  },
  password: {
    type: String
  },
  provider: String,
  providerId: String,
  providerData: {}
});


// schema pre
//executes before each user.save() call
UserSchema.pre('save', function(callback) {
  var user = this;

  // Break out if the password hasn't changed
  if (!user.isModified('password')) return callback();
  
  // Password changed so we need to hash it
  bcrypt.genSalt(5, function(err, salt) {
    if (err) return callback(err);

    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) return callback(err);
      user.password = hash;
      callback();
    });
  });
});

// Schema Methods
UserSchema.methods.authenticate = function(password, cb) {
  bcrypt.compare(password, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

UserSchema.statics.findUniqueUsername = function(username, suffix, callback) {
  var _this = this;
  var possibleUsername = username + (suffix || '');

  _this.findOne(
    {username: possibleUsername},
    function(err, user) {
      if (!err) {
        if (!user) {
          callback(possibleUsername);
        }
        else {
          return _this.findUniqueUsername(username, (suffix || 0) + 1, callback);
        }
      }
      else {
        callback(null);
      }
    }
  );
};


module.exports = mongoose.model('User', UserSchema);