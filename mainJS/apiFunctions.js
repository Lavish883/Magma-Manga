const fetch = require('node-fetch'); // fetchs html
const breakCloudFlare = 'https://letstrypup-dbalavishkumar.koyeb.app/?url=https://mangasee123.com'
const mainFunctions = require('./mainFunctions') // functions needed for important stuff
const HeaderGenerator = require('header-generator');

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
        'adminRecd': mainFunctions.scrapeAdminRecd(resp),
        'hotMangaUpdated': mainFunctions.scrapeHotManga(resp),
        'hotMangaThisMonth': mainFunctions.scrapeHotMangaThisMonth(resp),
        'latestManga': mainFunctions.scrapeLatestManga(resp),
    }

    res.send(allData)
}
// manga info
async function getMangaPage(req, res) {
    let headers = headersGenerator.getHeaders();
    let mangaName = req.query.manga;

    if (typeof mangaName === 'undefined') {
        return res.send('manga name not given or given incorrectly')
    }

    let link = breakCloudFlare + '/manga/' + mangaName;
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
    let fetchManga = await fetch(breakCloudFlare + /read-online/ + req.params.chapter, headers)
    let resp = await fetchManga.text();

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
        'chapterLink': req.params.chapter
    }

    return res.send(allData)
}
// get current chapter info for offline reading
async function getMangaChapterPageOffline(req, res) {
    // Fetch page that we need to scrape
    let fetchManga = await fetch(breakCloudFlare + "/read-online/" + req.query.chapter)
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

    let fetchQuickSearchPage = await fetch(breakCloudFlare + "/_search.php", headers);
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
    getMangaChapterPageOffline
}
