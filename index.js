const pug = require('pug') // html template
const express = require('express'); // server 
const fetch = require('node-fetch'); // fetchs html
const cookieParser = require('cookie-parser') //parses cookies recived from the user
const path = require('path');

const mainFunctions = require('./mainFunctions') // functions needed for important stuff
const pathFunctions = require('./pathFunctions') // functions that handle use requests
const apiFunctions = require('./apiFunctions') // function that handle all api requests

// note to self -
  // use cookies for prefs, and login
  // while local storage for recentRead and bookmarks, easier to handle client side

var isPupServerLoaded = false;
const serverName = process.env['SERVERNAME'] || 'http://localhost:5832/';
const breakCloudFlare = 'https://letstrypupagain.herokuapp.com/?url=https://mangasee123.com'




// run express at port 5832
const app = express()
const port = process.env.PORT || 5832;
app.set('view engine', 'pug')
app.use(cookieParser())
app.locals.basedir = path.join(__dirname, 'views');

// set intial cookies fro user when they comes to the website for the first time
app.use(setup)

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
// quick search data
app.get('/api/manga/quickSearch', apiFunctions.getQuickSearchData)
// get all the stuff needed for the main page of the site
app.get('/api/manga/all', apiFunctions.getMainPageStuff)
// given => mangaName?One-Piece
app.get('/api/mangaName?', apiFunctions.getMangaPage)
// directory  
app.get('/api/manga/directory', apiFunctions.getDirectoryData)
// given => type as hot (popular) and latest
app.get('/api/manga/main/:type', async (req, res) => {
  let headers = headersGenerator.getHeaders();
  let fetchHot = await fetch(breakCloudFlare, headers);
  let resp = await fetchHot.text();
  
  if (req.params.type == 'hot'){
    return res.send(mainFunctions.scrapeHotManga(resp))
  } else if (req.params.type = 'latest'){
    return res.send(mainFunctions.scrapeLatestManga(resp))
  } 
  
  return res.send('not valid')
})
// given 2 manga get there genres and then recommned a manga based on those genres
app.get('/api/manga/recommend', async (req,res) => {
  let headers = headersGenerator.getHeaders();

  let manga1 = req.query.manga1;
  let manga2 = req.query.manga2;

  let manga1Genres = await mainFunctions.getGenres(manga1, headers);
  let manga2Genres = await mainFunctions.getGenres(manga2, headers);
  
  let allGenres = [...new Set([...manga1Genres,  ...manga2Genres])]

  let similarManga = await mainFunctions.getSimilarManga(allGenres)
  
  return res.send(similarManga)
  
})
// given a chapter of a manga return all the pages adn info of that manga
app.get('/api/manga/read/:chapter', apiFunctions.getMangaChapterPage)
// let user download that chpater manga
app.get('/manga/download/:chapter', async(req,res) => {
  res.send(req.params.chapter)
})

app.use(express.static(path.join(__dirname, 'public')));
//The 404 Route (ALWAYS Keep this as the last route)
app.get('*', function(req, res){
  res.status(404).send('what???');
});
app.listen(port)