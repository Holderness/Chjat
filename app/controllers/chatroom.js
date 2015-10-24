var express = require('express'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    bodyParser = require('body-parser'),
    multer = require('multer'),
    fs = require('fs'),
    AWS = require('aws-sdk');


console.log('chatroom controller');
var UserModel = require('mongoose').model('User'),
    ChatroomModel = mongoose.model('Chatroom');


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

maxImageSize = 500 * 1000;

exports.multerRestrictions = multer({
    onFileUploadStart: function(file, req, res){
      console.log("req>>>>>", req);
      console.log("file>>>>>", file);
      if(file.size < maxImageSize) {
        return res.status(403).send('image too big').end();
      }
    }
});

exports.uploadChatImage = function (req, res, next) {

  console.log('req: ', req);
  console.log('----------------------------------------------------------------');
  console.log('req.files.chatImageUpload: ', req.files.chatImageUpload);

  if (!req.files || !req.files.chatImageUpload) {
    return res.status(403).send('expect 1 file upload named chatImageUpload').end();
  }
  var chatImageUpload = req.files.chatImageUpload;

  // this is mainly for user friendliness. this field can be tampered by attacker.
  if (!/^image\/(jpe?g|png|gif)$/i.test(chatImageUpload.mimetype)) {
    return res.status(403).send('expect image file').end();
  }

  uploadToS3(chatImageUpload, chatImageUpload.name, function (err, data) {
    if (err) {
      console.error(err);
      return res.status(500)
        .send('failed to upload to s3')
        .end();
    }
      // console.log('data: ', data);
    res.status(200)
      .send({ url: data.Location, ETag: data.ETag, message: '', timestamp: _.now()})
      .end();
  });
};

exports.uploadChatroomImage = function (req, res, next) {

  console.log('req: ', req);
  console.log('----------------------------------------------------------------');
  console.log('req.files.chatroomImageUpload: ', req.files.chatroomImageUpload);

  if (!req.files || !req.files.chatroomImageUpload) {
    return res.status(403).send('expect 1 file upload named chatImageUpload').end();
  }
  var chatroomImageUpload = req.files.chatroomImageUpload;

  // this is mainly for user friendliness. this field can be tampered by attacker.
  if (!/^image\/(jpe?g|png|gif)$/i.test(chatroomImageUpload.mimetype)) {
    return res.status(403).send('expect image file').end();
  }

  uploadToS3(chatroomImageUpload, chatroomImageUpload.name, function (err, data) {
    console.log('data-----------------:', data);
    if (err) {
      console.error(err);
      return res.status(500)
        .send('failed to upload to s3')
        .end();
    }
      // console.log('data: ', data);
    res.status(200)
      .send({ roomImage: data.Location, ETag: data.ETag, name: '', timestamp: _.now()})
      .end();
  });
};



exports.findAllChatrooms = function(req, res, next) {
  return ChatroomModel.find().exec(function(err, chatrooms) {
    if (!err) {
            console.log('findAllChatrooms!');
      return res.send( chatrooms );
    } else {
      return console.log( err );
    }
  });
};

exports.addChatroom = function(req, res, next) {
  var chatroom = new ChatroomModel({
    name: req.body.name,
    chatlog: req.body.chatlog,
    created: req.body.created
  });
  chatroom.save( function( err ) {
    if (!err) {
      return console.log('chatroom created');
    } else {
      return console.log( err );
    }
  });
};

exports.findBy = function(req, res, next) {
  // console.log( '-------------------------req: ', req);
  return ChatroomModel.find({ name: new RegExp(req.query.name, "i"), privacy: false }, function( err, chatrooms ) {
    if (!err) {
      console.log('findBy!');
      // console.log( chatrooms );
    var chatroomNames = [];
    for (i = 0; i < chatrooms.length; i++) {
      // console.log(chatrooms[i]);
        chatroomNames.push(chatrooms[i].name);
    }
    console.log(chatroomNames);
      return res.send( chatroomNames );
    } else {
      return console.log( err );
    }
  });
};

exports.publicChatrooms = function(req, res, next) {
  // console.log( '-------------------------req: ', req);
  return ChatroomModel.find({ privacy: false }, function( err, chatrooms ) {
    if (!err) {
      console.log('publicRooms!');
    var chatroomNames = [];
    for (i = 0; i < chatrooms.length; i++) {
      // console.log(chatrooms[i]);
        chatroomNames.push(chatrooms[i].name);
    }
    console.log(chatroomNames);
      return res.send( chatroomNames );
    } else {
      return console.log( err );
    }
  });
};

exports.findAllChatroomMessagess = function(req, res, next) {
  return ChatroomModel.find( { name: req.body.chatroom.name }, function( err, chatroom) {
    if (!err) {
      return res.send( chatroom.chatlog );
    } else {
      return console.log( err );
    }
  });
};


exports.addMessage = function(req, res, next) {
  return ChatroomModel.find({ name: req.body.message.room }, function(err, chatroom) {
    if (!err) {
      chatroom.chatlog.push( req.body.message );
      chatroom.save(function(err) {
        if (!err) {
          return console.log( err );
        }
      });
      return res.send( chatroom );
    } else {
      return console.log( err );
    }
  });
};

