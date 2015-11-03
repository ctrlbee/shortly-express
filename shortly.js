var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var crypto = require('crypto');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));


app.get('/', 
function(req, res) {
  res.render('index');
});

app.get('/create', 
function(req, res) {
  res.render('index');
});

app.get('/links', 
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        Links.create({
          url: uri,
          title: title,
          base_url: req.headers.origin
        })
        .then(function(newLink) {
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/


////Signup//////
app.get('/signup', 
function(req, res) {
  res.render('signup');
});


app.post('/signup', 
function(req, res) {

  new User({username: req.body.username}).fetch().then(function(found){
  //check if username exists 
    if(found){
      //if so, return "user name taken page/view"
      console.log('this user name is taken');
      res.send(200, 'User name taken');
    //if not, write username + obfuscated pw to db
    } else {
      var hashPass = crypto.createHash('sha1'); 
      hashPass.update(req.body.password); 
      hashPass = hashPass.digest('hex'); 

      Users.create({
        username: req.body.username,
        password: hashPass
      }).then(function(){
        res.send(200, 'Successful user creation.');
      });
      //if so, create session id (helper function)
      //redirect to "/"

    }
  });

});

/////Login/////
app.get('/login', 
function(req, res) {
  //check session 
    //if logged in, show message to log out

  res.render('login');
});

app.post('/login', function (req, res){

  ///obfuscate pw 
  var hashPass = crypto.createHash('sha1'); 
  hashPass.update(req.body.password); 
  hashPass = hashPass.digest('hex'); 

  new User({
    username: req.body.username,
    password: hashPass
  }).fetch().then(function(found){
    if(found){
    //if so, create session id (helper function)
    //redirect to "/"
      console.log('The user was found');
    } else {
    //if not, return "user name/pw not found view"
      console.log('The user was not found');
    }
  });

}); 


app.post('/logout', function (req, res){
  destroySession(); 
});


var createSession = function () {
  // write auth cookies
};


//this function will be called via click handler on 'logout' button from frontpage
var destroySession = function () {
  // destroy current cookies
};

var checkUser = function (req, res) {

  //req.getCookies....

}


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits')+1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
