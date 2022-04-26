const pug = require('pug') // html template
const express = require('express');
const fetch = require('node-fetch');
const mainFunctions = require('./mainFunctions')
const path = require('path');
var isPupServerLoaded = true;

const serverName = process.env.SERVERNAME || 'https://mangaapi.lavishkumar1.repl.co/';

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
app.use(express.static(path.join(__dirname, 'public')));
app.locals.basedir = path.join(__dirname, 'views');

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

    var seriesName = resp.split(`vm.SeriesName = "`)[1].split(`";`)[0];
    var indexName = resp.split(`vm.IndexName = "`)[1].split(`";`)[0];

    var chapters = mainFunctions.fixChaptersArry(resp.split(`vm.CHAPTERS = `)[1].split(`;`)[0]);
    var currentChapter = mainFunctions.fixCurrentChapter(resp.split(`vm.CurChapter = `)[1].split(`;`)[0]);

    var imageDirectoryURL = resp.split(`vm.CurPathName = "`)[1].split(`";`)[0];
    var imageURlS = mainFunctions.chapterImgURLS(currentChapter, imageDirectoryURL, indexName);

    var allData = {
        'chapters': chapters,
        'currentChapter': currentChapter,
        'imageURlS': imageURlS,
        'seriesName': seriesName,
        'indexName': indexName
    }
    return res.send(allData)
})


app.listen(port)