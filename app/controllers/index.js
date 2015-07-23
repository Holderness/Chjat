
exports.render = function(req, res) {
  res.render('index', {
    title: 'Cheeseburger',
    user: req.user ? req.user.username : ''
  });
};