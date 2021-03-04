require('dotenv').config();
var express = require('express');
const cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//handles only the authentication and holds tokens
var apiAuth = require('./apiAuthentication');
//handles all api data requests. needs token from apiAuth to work (i think)
var apiRequests = require('./apiRequests');

//handles the formatting of a user's library
var libraryFormatter = require('./formatLibrary.js');

var app = express();
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

  // Add headers
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.header('Access-Control-Allow-Origin', req.headers.origin);

  // Request methods you wish to allow
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.header('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.header('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

app.get('/login', function(req, res) {
  var { stateKey, returnedState, url } = apiAuth.getLoginURL();
  res.clearCookie();
  res.cookie(stateKey, returnedState);
  res.send({body: url});
});

app.get('/callback', async function(req, res) {
  console.log('referencing api auth...');
  let user = await apiAuth.getAuthDetails(req);
  if (user === 'state_mismatch') {
    res.redirect('/#' + 
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.send(user);
  }
});

app.get('/userinfo', function(req, res) {
  console.log('should be getting user info now')
  apiRequests.getData(apiAuth.showToken(), 'user').then(response => {
    userInfo = response;
      res.send(userInfo);
    });
});

app.get('/playlists', function(req, res) {
    apiRequests.getData(apiAuth.showToken(), 'playlists').then(response => {
      res.send(response);
    });
});

app.get('/library', async function(req, res) {
  let library = await apiRequests.getData(apiAuth.showToken(), 'library');
  let formattedLibrary = await libraryFormatter.formatLibrary(library.items);
  res.send(formattedLibrary);
});

app.post('/newplaylist', async function(req, res) {
  let trackList = req.body.trackList;
  let playlistName = req.body.playlistName;
  let userId = req.body.user;
  let answer = await apiRequests.createPlaylist(apiAuth.showToken(), playlistName, userId);
  let newPlaylist = await apiRequests.addToPlaylist(apiAuth.showToken(), answer.id, trackList);
  console.log('newPlaylist: ', newPlaylist)
});








console.log('listening on port 8888');
app.listen(8888);