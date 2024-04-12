const fetch = require('node-fetch'); // fetchs html
const breakCloudFlare = process.env.BREAK_CLOUDFLARE_V1 || 'https://letstrypup-dbalavishkumar.koyeb.app/?url=https://mangasee123.com';
const breakCloudFlareV2 = process.env.BREAK_CLOUDFLARE_V2 || 'https://letstrypup-dbalavishkumar.koyeb.app/v2?url=https://mangasee123.com';
const mainFunctions = require('./mainFunctions') // functions needed for important stuff
const HeaderGenerator = require('header-generator');
const fs = require('fs');
const schemas = require('../schemas/schema');

const realAdminRecd = JSON.parse(fs.readFileSync('./json/adminRecd.json', 'utf8'));
const listOfMangaV2 = JSON.parse(fs.readFileSync('./json/listOfMangaV2.json', 'utf8'));

// Generate human like headers so site doesn't detect us
const headersGenerator = new HeaderGenerator({
    browsers: [
        { name: "firefox", minVersion: 80 },
        { name: "chrome", minVersion: 87 },
        "safari"
    ],
    devices: [
        "desktop"
    ],
    operatingSystems: [
        "windows"
    ]
});
// home page data
async function getMainPageStuff(req, res) {
    let headers = headersGenerator.getHeaders();

    let fetchAll = await fetch(breakCloudFlare, headers);
    let resp = await fetchAll.text();

    //console.log(resp)

    var allData = {
        'adminRecd': realAdminRecd[Math.floor(Math.random() * ( realAdminRecd.length - 1))],
        'hotMangaUpdated': mainFunctions.scrapeHotManga(resp),
        'hotMangaThisMonth': mainFunctions.scrapeHotMangaThisMonth(resp),
        'latestManga': mainFunctions.scrapeLatestManga(resp),
    }

    console.log(allData.adminRecd)

    res.send(allData)
}

function checkIfUseBreakCloudFlareV2(mangaName) {
    return listOfMangaV2["data"].includes(mangaName);
}

/* Implent v2check automatically and add that for getMangaPage, getMangaChapterPage and getMangaChapterPageOffline */

// check if we need to use v2 or not for that url
async function cloudFlareV2CheckMiddleware(req, res, next) {
    var mangaLink;
    // find the url of the manga
    if (req.url.includes("/read?chapter=")) {
        mangaLink = req.query.chapter.split("-chapter-")[0];
    } else {
        mangaLink = req.query.manga;
    }
    // check from the database if we need to use v2 or not
    const manga = await schemas.mangaUsingV2.findOne({'mangaLink': mangaLink});
    console.log(req.url);
    if (manga != null && manga != undefined) {
        req.query.useV2 = true;
    }

    next();
}

// manga info
async function getMangaPage(req, res) {
    let headers = headersGenerator.getHeaders();
    let mangaName = req.query.manga;

    if (typeof mangaName === 'undefined') {
        return res.send('manga name not given or given incorrectly')
    }
    
    let link = req.query.useV2 ? breakCloudFlareV2 + '/manga/' + mangaName: breakCloudFlare + '/manga/' + mangaName;
    let fetchManga = await fetch(link, headers);
    let resp = await fetchManga.text();

    var allData = mainFunctions.scrapeMangaInfo(resp)
    try {
        var chapters = resp.split(`vm.Chapters = `)[1].split(`;`)[0];
    } catch (err) {
        console.log(link);
        console.log(err);
        return res.status(500).send('Page is not valid');
    }
    allData.IndexName = req.query.manga;
    allData.Chapters = mainFunctions.fixChaptersArry(chapters, allData.IndexName, true);
    allData.Chapters = allData.Chapters.reverse();

    return res.send(allData)
}
// reading a chapter info
async function getMangaChapterPage(req, res) {
    let headers = headersGenerator.getHeaders();
    // Fetch page that we need to scrape
    let fetchUrl = req.query.useV2 ? breakCloudFlareV2 + '/read-online/' + req.query.chapter : breakCloudFlare + '/read-online/' + req.query.chapter;
    console.log('fetch thi shit ' + fetchUrl);
    let fetchManga = await fetch(fetchUrl, headers)
    let resp = await fetchManga.text();
    
    if (resp.includes("<title>404 Page Not Found</title>")){
        return res.status(404).send("Page could not be found");
    }

    var seriesName = resp.split(`vm.SeriesName = "`)[1].split(`";`)[0];
    var indexName = resp.split(`vm.IndexName = "`)[1].split(`";`)[0];

    var chapters = mainFunctions.fixChaptersArry(resp.split(`vm.CHAPTERS = `)[1].split(`;`)[0], indexName);
    var currentChapter = mainFunctions.fixCurrentChapter(resp.split(`vm.CurChapter = `)[1].split(`;`)[0], indexName);

    var imageDirectoryURL = resp.split(`vm.CurPathName = "`)[1].split(`";`)[0];
    var imageURlS = mainFunctions.chapterImgURLS(currentChapter, imageDirectoryURL, indexName);

    currentChapter.seriesName = seriesName;
    currentChapter.indexName = indexName;

    var allData = {
        'chapters': chapters,
        'currentChapter': currentChapter,
        'imageURlS': imageURlS,
        'seriesName': seriesName,
        'indexName': indexName,
        'chapterLink': req.query.chapter
    }

    return res.send(allData)
}
// get current chapter info for offline reading
async function getMangaChapterPageOffline(req, res) {
    // Fetch page that we need to scrape
    let fetchUrl = req.query.useV2 ? breakCloudFlareV2 + '/read-online/' + req.query.chapter: breakCloudFlare + '/read-online/' + req.query.chapter;
    let fetchManga = await fetch(fetchUrl);
    let resp = await fetchManga.text();
 
    var currentChapter = mainFunctions.fixCurrentChapter(resp.split(`vm.CurChapter = `)[1].split(`;`)[0], req.query.chapter.split('-chapter-')[0]);

    var seriesName = resp.split(`vm.SeriesName = "`)[1].split(`";`)[0];
    var indexName = resp.split(`vm.IndexName = "`)[1].split(`";`)[0];

    currentChapter.seriesName = seriesName;
    currentChapter.indexName = indexName;

    return res.send(currentChapter)
}

// quick search Data
async function getQuickSearchData(req, res) {
    let headers = headersGenerator.getHeaders();

    let fetchQuickSearchPage = await fetch("https://letstrypup-dbalavishkumar.koyeb.app/?url=https://mangasee123.com/_search.php", headers);
    let resp = await fetchQuickSearchPage.text();
    
    resp = resp.split(`<body>`)[1].split(`</body>`)[0];

    return res.send(resp);
}
// directory data
async function getDirectoryData(req, res) {
    let headers = headersGenerator.getHeaders();

    let fetchDirectoryData = await fetch(breakCloudFlare + "/directory/", headers);
    let resp = await fetchDirectoryData.text();

    let directoryData = JSON.parse(resp.split(`vm.FullDirectory = `)[1].split(';').splice(0, 8).join(''))

    return res.send(directoryData)
}
// recomended calculations
async function getRecommendedManga(req, res) {
    let manga1 = req.query.manga1;
    let manga2 = req.query.manga2;

    let similarManga = await mainFunctions.getSimilarManga(manga1, manga2)
    
    // get rid of duplicates
    for (var i = similarManga.length - 1; i >= 0; i--) {
        for (var j = i - 1; j >= 0; j--) {
            if (similarManga[i].i === similarManga[j].i) {
                similarManga.splice(i, 1);
                break;
            }
        }
    }

    let fixedManga = mainFunctions.fixRecdArry(similarManga);
    // shuffle array
    fixedManga = fixedManga.sort(() => Math.random() - 0.5);
    fixedManga.length = 12;
    return res.send(fixedManga)
}
// get search data
async function getSearchData(req, res) {
    let headers = headersGenerator.getHeaders();
    // fetch search page
    let fetchSearchPage = await fetch(breakCloudFlare + '/search/', headers);
    let resp = await fetchSearchPage.text();
    // extract directory from that
    var directory = resp.split(`vm.Directory = `)[1].split(`;`);
    directory = directory.splice(0, 15).join('');
    directory = JSON.parse(directory);
    directory = mainFunctions.fixSearchArry(directory);

    return res.send(directory)


}

async function downloadImage(req, res) {
    const url = req.query.url;
    if (url == undefined || url == "") {
        return res.send('url not given');
    }
    const image = await fetch(url);
    const buffer = await image.buffer();
    res.set('Content-Type', 'image/png');
    return res.send(buffer);
}

module.exports = {
    getMainPageStuff,
    getMangaPage,
    getMangaChapterPage,
    getQuickSearchData,
    getDirectoryData,
    getRecommendedManga,
    getSearchData,
    downloadImage,
    getMangaChapterPageOffline,
    cloudFlareV2CheckMiddleware
}
