const pug = require('pug') // html template
const express = require('express'); // server 
const fetch = require('node-fetch'); // fetchs html
const cookieParser = require('cookie-parser') //parses cookies recived from the user
const path = require('path');
const mongoose = require('mongoose'); // database acessor

mongoose.set('strictQuery', false);
require('express-async-errors');

const pathFunctions = require('./mainJS/pathFunctions') // functions that handle use requests
const apiFunctions = require('./mainJS/apiFunctions') // function that handle all api requests
const loginFunctions = require('./mainJS/loginFunctions') // all fucntions that handle login and stuff
const notificationFunctions = require('./mainJS/notfications') // functions that handle notifactions
const commentFunctions = require('./mainJS/commentFunctions') // functions that handle comments
const mailFunctions = require('./mainJS/mailFunctions'); // mail functions

// Require dotenv for secrets
require('dotenv').config()

const webpush = require('web-push');

const publicKey = process.env.PUBLIC_KEY;
const privateKey = process.env.PRIVATE_KEY;

webpush.setVapidDetails('mailto:lavishk750@gmail.com', publicKey, privateKey);



// Connect to mongodb database
const dbURI = process.env.DB_URL;
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });

// run express at port 5832
const app = express()
const port = process.env.PORT || 5832;
app.set('view engine', 'pug')
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
  return res.redirect('/manga/')
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
// recentChapters.html
app.get('/manga/recentChapters', pathFunctions.recentChaptersHtml)
// let user download that chpater manga
app.get('/manga/download/:chapter', async (req, res) => {
    res.send(req.params.chapter)
})
// forgot password.html
app.get('/manga/forgotPassword/:token', pathFunctions.forgotPasswordHtml);
// offline.html
app.get('/manga/offline', pathFunctions.offlineHtml);
app.get('/manga/offline/read', pathFunctions.offlineReadHtml);

// given a image url return the image so it can be downloaded
app.get('/api/offline/manga/downloadImage', apiFunctions.downloadImage)
app.get('/api/offline/mangaName?', apiFunctions.getMangaPage)
//req.query.chapter ==> needed
app.get('/api/offline/getMangaChapterPageOffline', apiFunctions.getMangaChapterPageOffline)
/* Api Routes are below */

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
// remove a certain manga from the users bookmarks
app.delete('/api/login/removeBookmark', loginFunctions.removeBookmark);
// amke forgot password linka and send to the email
app.post('/api/login/forgotPassword', loginFunctions.makeForgotPasswordLink);
// change the password of the user
app.post('/api/login/changePassword', loginFunctions.changePassword);

/* Notifactions functions routes are below */
app.post('/notification/subscribe', notificationFunctions.subscribe);
app.post('/notification/updateSubscribe', notificationFunctions.updateSubscription);

/* Comment Routes are below */
app.post('/api/comments/postComment', commentFunctions.postComment);
app.post('/api/comments/getComments', commentFunctions.getComments);
app.delete('/api/comments/deleteComment', commentFunctions.deleteComment);
app.get('/api/comments/getGifs', commentFunctions.getGifs);
app.post('/api/comments/likeComment', commentFunctions.likeComment);
app.post('/api/comments/dislikeComment', commentFunctions.dislikeComment);
app.post('/api/comments/replyToComment', commentFunctions.replyToComment);
app.post('/api/comments/editComment', commentFunctions.editComment);
app.delete('/api/comments/deleteComment', commentFunctions.deleteComment);

app.use(express.static(path.join(__dirname, 'public')));

//The 404 Route (ALWAYS Keep this as the last route)
app.get('*', function(req, res){
  res.status(404).send('page does not exist 404');
});


// Error handler
app.use(async (err, req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }
  // send email to admin
  await mailFunctions.sendMail(process.env.EMAIL, 'An Error has occured', err.stack);
  return res.status(500).send('Something broke! Please try again later. An Email has been sent to the admin. Thank you for your patience.')
})


app.listen(port)