const fetch = require('node-fetch'); // fetchs html
const breakCloudFlare = 'https://letstrypupagain.herokuapp.com/?url=https://mangasee123.com'
const mainFunctions = require('./mainFunctions') // functions needed for important stuff
const HeaderGenerator = require('header-generator');

// Generate human like headers so site doesn't detect us
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

async function getMainPageStuff(req, res){
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
}

async function getMangaPage(req, res){
  let headers = headersGenerator.getHeaders();
  let mangaName =  req.query.manga;

  if (typeof mangaName === 'undefined'){
    return res.send('not valid')
  }

  let link = breakCloudFlare + '/manga/' + mangaName;  
  let fetchManga = await fetch(link, headers);
  let resp = await fetchManga.text();
  
  return res.send(mainFunctions.scrapeManga(resp))
}

async function getMangaChapterPage(req, res){
  let headers = headersGenerator.getHeaders();
  // Fetch page that we need to scrape
  let fetchManga = await fetch(breakCloudFlare + /read-online/ + req.params.chapter, headers)
  let resp = await fetchManga.text();

  var seriesName = resp.split(`vm.SeriesName = "`)[1].split(`";`)[0];
  var indexName = resp.split(`vm.IndexName = "`)[1].split(`";`)[0];

  var chapters = mainFunctions.fixChaptersArry(resp.split(`vm.CHAPTERS = `)[1].split(`;`)[0], indexName);
  var currentChapter = mainFunctions.fixCurrentChapter(resp.split(`vm.CurChapter = `)[1].split(`;`)[0]);

  var imageDirectoryURL = resp.split(`vm.CurPathName = "`)[1].split(`";`)[0];
  var imageURlS = mainFunctions.chapterImgURLS(currentChapter, imageDirectoryURL, indexName);

  currentChapter.seriesName = seriesName;
  currentChapter.indexName = indexName;
  
  var allData = {
      'chapters':  chapters,
      'currentChapter': currentChapter,
      'imageURlS': imageURlS,
      'seriesName': seriesName,
      'indexName': indexName, 
      'chapterLink': req.params.chapter
  }
  
  return res.send(allData)
}

async function getQuickSearchData(req,res){
  let headers = headersGenerator.getHeaders();
  
  let fetchQuickSearchPage = await fetch(breakCloudFlare + "/_search.php", headers);
  let resp = await fetchQuickSearchPage.text();
  
  return res.send(resp);
}

module.exports = {
  getMainPageStuff,
  getMangaPage,
  getMangaChapterPage,
  getQuickSearchData
}