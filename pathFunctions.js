const fetch = require('node-fetch'); // fetchs html
const serverName = process.env['SERVERNAME'] || 'http://localhost:5832/';
var isPupServerLoaded = false;

async function indexHtml(req, res){
  
  if (!isPupServerLoaded){
    isPupServerLoaded = true;
    return res.render('loading')
  }
  
  let fetchAllData = await fetch(serverName + 'api/manga/all')
  let resp = await fetchAllData.json();
  
  return res.render('index', resp)
}

async function readHtml (req,res){
  
  if (!isPupServerLoaded){
    isPupServerLoaded = true;
    return res.render('loading')
  }
  // get the chapter details
  let fetchAllData = await fetch(serverName + 'api/manga/read/' + req.params.mangaChapter)
  let resp = await fetchAllData.json();
  
  // still got do the spefic page 
  if (req.params.mangaChapter.includes('-page-')){
    resp.title = resp.seriesName + ' Chapter ' + resp.currentChapter.Chapter + ' Page ' + '1'
  } else {
    resp.title = resp.seriesName + ' Chapter ' + resp.currentChapter.Chapter 
  }
  
  return res.render('read', resp)
}

function bookmarksHtml(req, res){
  return res.render('bookmarks')
}

async function mangaHtml(req , res){
  if (!isPupServerLoaded){
    isPupServerLoaded = true;
    return res.render('loading')
  }

  // get the manga details
  let fetchAllData = await fetch(serverName + 'api/mangaName?manga=' + req.params.mangaName);
  let resp = await fetchAllData.json();

  return res.render('manga', resp)
}

async function directoryHtml(req, res){
  
}

module.exports = {
  indexHtml,
  readHtml,
  bookmarksHtml,
  mangaHtml,
  directoryHtml
}