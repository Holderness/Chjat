var express = require('express');

var router = express.Router();

router.route('/')
  .get(function(req, res){
    res.render('index');
  });

router.route('/test')
  .get(function(req, res){
  res.render('../views/test.ejs');
});

module.exports = router;