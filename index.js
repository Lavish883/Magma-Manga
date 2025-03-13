const pug = require('pug') // html template
const express = require('express'); // server 
const fetch = require('node-fetch'); // fetchs html
const cookieParser = require('cookie-parser') //parses cookies recived from the user
const path = require('path');
const mongoose = require('mongoose'); // database acessor
const schemas = require('./schemas/schema'); // all the schemas for the database

mongoose.set('strictQuery', false);
require('express-async-errors');

const pathFunctions = require('./mainJS/pathFunctions') // functions that handle use requests
const apiFunctions = require('./mainJS/apiFunctions') // function that handle all api requests
const loginFunctions = require('./mainJS/loginFunctions') // all fucntions that handle login and stuff
const notificationFunctions = require('./mainJS/notfications') // functions that handle notifactions
const commentFunctions = require('./mainJS/commentFunctions') // functions that handle comments
const mailFunctions = require('./mainJS/mailFunctions'); // mail functions
const animeFunctions = require('./mainJS/animeFunctionApi'); // anime functions

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

//https://letstrypup-dbalavishkumar.koyeb.app/
// see if it is time to check for new manga
app.use(notificationFunctions.isItTime)

function setup(req, res, next) {
  var cookie = req.cookies.user;
  //console.log(cookie)
  if (cookie == undefined) {
    var intialCookies = {
      'loggedIn': false,
      'accessToken': false,
      'refreshToken': false,
    }
    res.cookie('user', JSON.stringify(intialCookies), {
      maxAge: 2592 * 10 ^ 6,
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
/*
app.get('*', (req, res) => {
  return res.send("Website is currently broken. A fix is on the way. Sorry for the inconvenience.");
})
*/
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
// settings for the user
app.get('/manga/settings', pathFunctions.settingsHtml);
// forgot password.html
app.get('/manga/forgotPassword/:token', pathFunctions.forgotPasswordHtml);
// offline.html
app.get('/manga/offline', pathFunctions.offlineHtml);
app.get('/manga/offline/read', pathFunctions.offlineReadHtml);

// given a image url return the image so it can be downloaded
app.get('/api/offline/manga/downloadImage', apiFunctions.downloadImage)
app.get('/api/offline/mangaName?', apiFunctions.cloudFlareV2CheckMiddleware, apiFunctions.getMangaPage)
//req.query.chapter ==> needed
app.get('/api/offline/getMangaChapterPageOffline', apiFunctions.cloudFlareV2CheckMiddleware, apiFunctions.getMangaChapterPage)
/* Api Routes are below */

// quick search data
app.get('/api/manga/quickSearch', apiFunctions.getQuickSearchData)
// get all the stuff needed for the main page of the site
app.get('/api/manga/all', apiFunctions.getMainPageStuff)
// given => mangaName?One-Piece
app.get('/api/mangaName?', apiFunctions.cloudFlareV2CheckMiddleware, apiFunctions.getMangaPage)
// directory  
app.get('/api/manga/directory', apiFunctions.getDirectoryData)
// given 2 manga get there genres and then recommned a manga based on those genres
app.get('/api/manga/recommend', apiFunctions.getRecommendedManga)
// given a chapter of a manga return all the pages adn info of that manga
app.get('/api/manga/read', apiFunctions.cloudFlareV2CheckMiddleware, apiFunctions.getMangaChapterPage)

// get the directory for search page
app.get('/api/searchPage', apiFunctions.getSearchData)
/*Login Routes are below*/

// regsiter the user
app.post('/api/login/register', loginFunctions.registerUser);
// login the user
app.post('/api/login/login', loginFunctions.loginUser)
// get user info such as bookmarks and recentread
// before giving info verify accestoken
app.post('/api/login/userInfo', loginFunctions.loginCheck, loginFunctions.getUserInfo)
// all users
app.get('/api/login/allUsers', loginFunctions.allUsers);
// get a new accestoken based on the refresh token
app.post('/api/login/newAccessToken', loginFunctions.getNewToken);
// log out 
app.delete('/api/login/logout', loginFunctions.logOutUser);
// remove a certain manga from the users bookmarks
app.delete('/api/login/removeBookmark', loginFunctions.loginCheck , loginFunctions.removeBookmark);
// add a certain manga to the users bookmarks
app.post('/api/login/addBookmark', loginFunctions.loginCheck , loginFunctions.addBookmark);
// amke forgot password linka and send to the email
app.post('/api/login/forgotPassword', loginFunctions.makeForgotPasswordLink);
// change the password of the user
app.post('/api/login/changePassword', loginFunctions.changePassword);
// get all the user info
app.post('/api/manga/allUserInfo', loginFunctions.loginCheck, loginFunctions.getAllUserInfo);
// update the user subscribed manga list
app.post('/api/manga/updateSubscribedMangaList', loginFunctions.loginCheck , loginFunctions.updateSubscribedMangaList);
// update the user bookmarks
app.post('/api/manga/updateBookmarks', loginFunctions.loginCheck , loginFunctions.updateBookmarks);
// update the users continue reading list
app.post('/api/login/updateContinueReading', loginFunctions.loginCheck , loginFunctions.updateContinueReading);

/* Notifications functions routes are below */
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

/* Anime Routes are below */
app.get('/animeApi/typeAll', animeFunctions.getHomePageAnime);
app.get('/animeApi/category/:category', animeFunctions.getCategoryPage);
app.get('/animeApi/search/:keyword/:page', animeFunctions.getSearchPage);
app.get('/animeApi/watch/:link', animeFunctions.getWatchLink);
app.get('/animeApi/embed/link', animeFunctions.getWatchPage);

/* Pokemon Routes are below */
app.get('/pkGuess', (req, res) => {
  return res.sendFile(path.join(__dirname, 'public', 'misc', 'pkGuess.html')); 
})

app.use(express.static(path.join(__dirname, 'public')));

//The 404 Route (ALWAYS Keep this as the last route)
app.get('*', function (req, res) {
  return res.render('404.pug');
});


// Error handler
app.use(async (err, req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }
  //console.log(req)
  console.log(err.stack);
  /*
  // meaning we aren't using the right cloudflare break version with that manga, so add it to the v2 list
  if (err.name == "FetchError" && err.message.includes("invalid json response body at")) {
    await mailFunctions.sendMail(process.env.EMAIL, 'Added this manga to V2 check if this works later', req.url);
    var mangaLink;
    
    if (req.url.includes("/read/")) {
      mangaLink = req.url.split("/manga/read/")[1].split("-chapter-")[0];
    } else {
      mangaLink = req.url.split("/manga/")[1].split("manga/")[1];
    }

    console.log('mangaLink: ' + mangaLink);
    
    var manga = await schemas.mangaUsingV2.findOne({ 'mangaLink': mangaLink });
    
    if (manga) {
      return res.status(500).send("Reload the page. It should work now ?")
    }

    var mangaToAdd = new schemas.mangaUsingV2({
      'mangaLink': mangaLink
    });

    await mangaToAdd.save();
    return res.status(500).send("Reload the page. It should work now ?")
  } else if (err.name == "Page can't be found") {
    return res.status(404).send('Page you are looking for does not exist');
  }
    */
  // send email to admin
  //await mailFunctions.sendMail(process.env.EMAIL, 'An Error has occured', err.stack);
  return res.status(500).send('Something broke! Please try again later. An Email has been sent to the admin. Thank you for your patience.')
})


app.listen(port)