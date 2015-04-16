var express = require('express');
var app = express();




app.use(express.static(__dirname + '/public'));

app.set('view engine', 'html');

app.get('/test', function(req, res){
  res.render('test');
});

app.listen(3000, function(){
  console.log('listening on *:3000');
});