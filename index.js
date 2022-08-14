const pug = require('pug') // html template
const express = require('express'); // server 
const fetch = require('node-fetch'); // fetchs html
const cookieParser = require('cookie-parser') //parses cookies recived from the user
const path = require('path');
const mongoose = require('mongoose'); // database acessor

const pathFunctions = require('./mainJS/pathFunctions') // functions that handle use requests
const apiFunctions = require('./mainJS/apiFunctions') // function that handle all api requests
const loginFunctions = require('./mainJS/loginFunctions') // all fucntions that handle login and stuff
const notificationFunctions = require('./mainJS/notfications') // functions that handle notifactions


// Require dotenv for secrets
require('dotenv').config()

const webpush = require('web-push');

const publicKey = process.env.PUBLIC_KEY;
const privateKey = process.env.PRIVATE_KEY;
console.log(publicKey, privateKey);

webpush.setVapidDetails('mailto:lavishk750@gmail.com', publicKey, privateKey);



// Connect to mongodb database
const dbURI = process.env.DB_URL;
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });

// run express at port 5832
const app = express()
const port = process.env.PORT || 5832;
app.set('view engine', 'pug')
app.use(cookieParser())
app.locals.basedir = path.join(__dirname, 'views');
app.use(express.json({ extended: true, limit: "1mb" }));


// see if it is time to check for new manga
app.use(notificationFunctions.isItTime)

function setup(req,res,next){
  var cookie = req.cookies.user;
  //console.log(cookie)
  if (cookie == undefined){
    var intialCookies = {
      'loggedIn': false,
      'accessToken': false,
      'refreshToken': false,
    }
    res.cookie('user',JSON.stringify(intialCookies), {
      maxAge: 2592 * 10^6,
      secure: true,
      httpOnly: true,
      sameSite: 'lax'
    });
    // console.log('sent the cookie')
  } else {
    console.log('we already have it')
  }
  next();
}

app.get('/', (req, res) => {
  res.redirect('/manga/')
})


// index.html
app.get('/manga/', pathFunctions.indexHtml)
// read.html
app.get('/manga/read/:mangaChapter', pathFunctions.readHtml)
// bookmarks.html
app.get('/manga/bookmarks', pathFunctions.bookmarksHtml)
//manga.html
app.get('/manga/manga/:mangaName', pathFunctions.mangaHtml)
// directory.html
app.get('/manga/directory', pathFunctions.directoryHtml)
// search.html
app.get('/manga/search', pathFunctions.searchHtml)
// let user download that chpater manga
app.get('/manga/download/:chapter', async (req, res) => {
    res.send(req.params.chapter)
})

/* Api Routes are bwlow */

// quick search data
app.get('/api/manga/quickSearch', apiFunctions.getQuickSearchData)
// get all the stuff needed for the main page of the site
app.get('/api/manga/all', apiFunctions.getMainPageStuff)
// given => mangaName?One-Piece
app.get('/api/mangaName?', apiFunctions.getMangaPage)
// directory  
app.get('/api/manga/directory', apiFunctions.getDirectoryData)
// given 2 manga get there genres and then recommned a manga based on those genres
app.get('/api/manga/recommend', apiFunctions.getRecommendedManga)
// given a chapter of a manga return all the pages adn info of that manga
app.get('/api/manga/read/:chapter', apiFunctions.getMangaChapterPage)

// get the directory for search page
app.get('/api/searchPage', apiFunctions.getSearchData)
/*Login Routes are below*/

// regsiter the user
app.post('/api/login/register', loginFunctions.registerUser);
// login the user
app.post('/api/login/login', loginFunctions.loginUser)
// get user info such as bookmarks and recentread
// before giving info verify accestoken
app.post('/api/login/userInfo', loginFunctions.getUserInfo)
// all users
app.get('/api/login/allUsers', loginFunctions.allUsers);
// get a new accestoken based on the refresh token
app.post('/api/login/newAccessToken', loginFunctions.getNewToken);
// log out 
app.delete('/api/login/logout', loginFunctions.logOutUser);

/* Notifactions functions routes are below */
app.post('/notifaction/subscribe', notificationFunctions.subscribe);

app.use(express.static(path.join(__dirname, 'public')));

//The 404 Route (ALWAYS Keep this as the last route)
app.get('*', function(req, res){
  res.status(404).send('what???');
});


process.on('unhandledRejection', error => {
    // Will print "unhandledRejection err is not defined"
    console.log('unhandledRejection', error);
});

app.listen(port)
