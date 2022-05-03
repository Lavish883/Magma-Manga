const pug = require('pug') // html template
const express = require('express'); // server 
const fetch = require('node-fetch'); // fetchs html
const mainFunctions = require('./mainFunctions') // functions needed for important stuff
const cookieParser = require('cookie-parser') //parses cookies recived from the user
// note -
  // use cookies for prefs, and login
  // while local storage for recentRead and BookMarks
const path = require('path');
var isPupServerLoaded = true;

const serverName = process.env.SERVERNAME || 'http://localhost:5832/';

const breakCloudFlare = 'https://letstrypupagain.herokuapp.com/?url=https://mangasee123.com'
// Generate human like headers so site doesn't detect us
const HeaderGenerator = require('header-generator');
const headersGenerator = new HeaderGenerator({
  browsers: [
    {name: "firefox", minVersion: 80},
    {name: "chrome", minVersion: 87},
      "safari"
    ],
    devices: [
      "desktop"
    ],
    operatingSystems: [
      "windows"
    ]
});

// run express at port 8190
const app = express()
const port = process.env.PORT || 5832;
app.set('view engine', 'pug')
app.use(cookieParser())
app.locals.basedir = path.join(__dirname, 'views');

// set intial cookies fro user when they comes to the website for the first time
app.use(function (req,res, next){
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
//    console.log('sent the cookie')
  } else {
  //  console.log('we already have it')
  }
  next();
})

// index.html
app.get('/manga/', async (req, res) => {
    if (isPupServerLoaded) {
        let fetchAllData = await fetch(serverName + 'api/manga/all')
        let resp = await fetchAllData.json();
        res.render('index', resp)
    } else {
        res.render('loading')
        isPupServerLoaded = true;
    }
})
// read.html
app.get('/manga/read/:mangaChapter', async (req, res) => {
    let fetchAllData = await fetch(serverName + 'api/manga/read/' + req.params.mangaChapter)
    let resp = await fetchAllData.json();
    // still got do the spefic page 
    if(req.params.mangaChapter.includes('-page-')){
      resp.title = resp.seriesName + ' Chapter ' + resp.currentChapter.Chapter + ' Page ' + '1'
    } else {
      resp.title = resp.seriesName + ' Chapter ' + resp.currentChapter.Chapter 
    }
    res.render('read', resp)
    
})

// get all the stuff needed for the main page of the site
app.get('/api/manga/all', async (req, res) => {
    let headers = headersGenerator.getHeaders();
    let fetchAll = await fetch(breakCloudFlare, headers);
    let resp = await fetchAll.text();
    var allData = {
        'adminRecd': mainFunctions.scrapeAdminRecd(resp),
        'hotMangaUpdated': mainFunctions.scrapeHotManga(resp),
        'hotMangaThisMonth': mainFunctions.scrapeHotMangaThisMonth(resp),
        'latestManga': mainFunctions.scrapeLatestManga(resp),
    }
    res.send(allData)
})
// given => mangaName?One-Piece
app.get('/api/mangaName?', async (req, res) => {
  let headers = headersGenerator.getHeaders();
  let mangaName =  req.query.manga;

  if (typeof mangaName === 'undefined'){
    return res.send('not valid')
  }

  let link = breakCloudFlare + '/manga/' + mangaName;  
  let fetchManga = await fetch(link, headers);
  let resp = await fetchManga.text();
  
  return res.send(mainFunctions.scrapeManga(resp))
})
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
app.get('/api/manga/read/:chapter', async (req, res) => {
    let headers = headersGenerator.getHeaders();
    let fetchManga = await fetch(breakCloudFlare + /read-online/ + req.params.chapter, headers)
    let resp = await fetchManga.text();
    console.log(req.params.chapter)
    var seriesName = resp.split(`vm.SeriesName = "`)[1].split(`";`)[0];
    var indexName = resp.split(`vm.IndexName = "`)[1].split(`";`)[0];

    var chapters = mainFunctions.fixChaptersArry(resp.split(`vm.CHAPTERS = `)[1].split(`;`)[0], indexName);
    var currentChapter = mainFunctions.fixCurrentChapter(resp.split(`vm.CurChapter = `)[1].split(`;`)[0]);

    var imageDirectoryURL = resp.split(`vm.CurPathName = "`)[1].split(`";`)[0];
    var imageURlS = mainFunctions.chapterImgURLS(currentChapter, imageDirectoryURL, indexName);

    var allData = {
        'chapters':  chapters,
        'currentChapter': currentChapter,
        'imageURlS': imageURlS,
        'seriesName': seriesName,
        'indexName': indexName, 
        'chapterLink': req.params.chapter
    }
    return res.send(allData)
})
// let user download that chpater manga
app.get('/manga/download/:chapter', async(req,res) => {
  res.send(req.params.chapter)
})
app.use(express.static(path.join(__dirname, 'public')));
app.listen(port)