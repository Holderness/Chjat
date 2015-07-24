// var express = require('express');


// var router = express.Router();

// router.route('/')
//   .get(function(req, res){
//     res.render('index');
//   });

// router.route('/test')
//   .get(function(req, res){
//   res.render('../views/test.ejs');
// });

// module.exports = router;

module.exports = function(app) {
    var index = require('../controllers/index');
    app.get('/', index.render);
};



