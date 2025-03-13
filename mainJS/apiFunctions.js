const fetch = require('node-fetch'); // fetchs html
const breakCloudFlare = process.env.BREAK_CLOUDFLARE_V1 || 'https://letstrypup-dbalavishkumar.koyeb.app/?url=https://mangasee123.com';
const breakCloudFlareV2 = process.env.BREAK_CLOUDFLARE_V2 || 'https://letstrypup-dbalavishkumar.koyeb.app/v2?url=https://mangasee123.com';
const mainFunctions = require('./mainFunctions') // functions needed for important stuff
const HeaderGenerator = require('header-generator');
const fs = require('fs');
const schemas = require('../schemas/schema');
const cheerio = require('cheerio');

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

    let fetchHot = await fetch(breakCloudFlare + "hot-updates", headers);
    let respHot = await fetchHot.text();

    let fetchHotMonth = await fetch(breakCloudFlare + "hot-series?sort=monthly_views", headers);
    let respHotMonth = await fetchHotMonth.text();

    let latestArry = [];

    // Latest added manga
    for (var i = 1; i <= 5; i++) {
        let fetchLatest = await fetch(breakCloudFlare + "latest-updates/" + i, headers);
        let respLatest = await fetchLatest.text();

        mainFunctions.scrapeLatestManga(respLatest, latestArry);
    }


    var allData = {
        'adminRecd': realAdminRecd[Math.floor(Math.random() * ( realAdminRecd.length - 1))],
        'hotMangaUpdated': mainFunctions.scrapeHotManga(respHot),
        'hotMangaThisMonth': mainFunctions.scrapeHotMangaThisMonth(respHotMonth),
        'latestManga': latestArry
    }

    return res.send(allData)

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

async function getAllChapters(mangaId, mangaName) {
    let headers = headersGenerator.getHeaders();
    // Get the chapters
    var chapters = [];
    let chaptersFetch = await fetch(breakCloudFlare + 'series/' + mangaId + '/full-chapter-list', headers);
    let chaptersResp = await chaptersFetch.text();

    $ = cheerio.load(chaptersResp);
    
    $('div').each((i, div) => {
        var chapter = {
            'chapterId': $(div).find('a').attr('href').split('/chapters/')[1],
            'chapterName': $(div).find('span.grow.flex.items-center.gap-2').find('span').html(),
            'Date': mainFunctions.calcDate($(div).find('time').text()),
        };
    
        chapter['ChapterLink'] = encodeURIComponent(mangaName + '--' + chapter.chapterName.replaceAll(" ", "-").replaceAll(/-+/g,"-").toLowerCase());
        chapters.push(chapter);
    });
    return chapters;
}

// manga info
async function getMangaPage(req, res) {
    let headers = headersGenerator.getHeaders();
    let mangaName = req.query.manga;
    // gets manga id from the name
    let mangaId = mainFunctions.getDomainIdToIndex(mangaName);

    let mangaFetch = await fetch(breakCloudFlare + 'series/' + mangaId + '/' + mangaName, headers);
    let mangaResp = await mangaFetch.text();
    var $ = cheerio.load(mangaResp);

    var info = {};
    info['IndexName'] = mangaName;
    info['SeriesName'] = $('title').text().split(' | Weeb Central')[0];
    info['mangaId'] = mangaId;

    // Get info from the page
    $('main ul li').each((i, li) => {
        var items = [];
        $(li).children().each((i, liChild) => {
            items.push($(liChild).text().replaceAll('\n', ''));
        });
        
        if (items[0] == 'Associated Name(s)'){
            var moreItems = items[1].split(/\s{2,}/).slice(1, -1);
            items[1] = moreItems;
        }

        if (items[0] == 'Author(s): ' || items[0] == 'Tags(s): '){
            for (var i = 1; i < items.length - 1; i++) {
                items[i] = items[i].slice(0, -1);
            }
        }

        if (items.length > 2 || items[0] == 'Author(s): '){
            info[items[0]] = items.slice(1);
        } else {
            info[items[0]] = items[1];
        }
    }); 

    // Get the chapters
    
    info['AlternateNames'] = info['Associated Name(s)'];
    delete info['Associated Name(s)'];

    info['Authors'] = info['Author(s): '];
    delete info['Author(s): '];

    info['Genres'] = info['Tags(s): '];
    delete info['Tags(s): '];

    info['Type'] = info['Type: '];
    delete info['Type: '];

    info['Official_Translation'] = info['Official Translation: '];
    delete info['Official Translation: '];

    info['Released'] = info['Released: '];
    delete info['Released: '];

    info['Status'] = info['Status: '];
    delete info['Status: '];

    info['Anime_Adaptation'] = info['Anime Adaptation: '];
    delete info['Anime Adaptation: '];

    info['Adult_Content'] = info['Adult Content: '];
    delete info['Adult Content: '];

    info['Chapters'] = await getAllChapters(mangaId, mangaName);
    return res.send(info);
}
// reading a chapter info
async function getMangaChapterPage(req, res) {
    let headers = headersGenerator.getHeaders();
    // Fetch page that we need to scrape
    const mangaName = req.query.chapter.split('--')[0];
    const mangaId = mainFunctions.getDomainIdToIndex(mangaName);

    var seriesNameFetch = await fetch(breakCloudFlare + 'series/' + mangaId + '/' + mangaName, headers);
    var seriesNameResp = await seriesNameFetch.text();
    var $ = cheerio.load(seriesNameResp);

    var seriesName = $('title').text().split(' | Weeb Central')[0];

    var allChapters = await getAllChapters(mangaId, mangaName);
    var currentChapter = allChapters.find(chapter => chapter.ChapterLink == encodeURIComponent(req.query.chapter.split('-page-')[0]));

    if (currentChapter == undefined) {
        console.log('Chapter not found');
    }

    var imageURlS = [];
    let imageFetch = await fetch(breakCloudFlare + 'chapters/' + currentChapter.chapterId + '/images?is_prev=False&current_page=1&reading_style=long_strip', headers);
    let imageResp = await imageFetch.text();

    var $ = cheerio.load(imageResp);

    $('img').each((i, img) => {
        //imageURlS.push(process.env.IMG_SERVER + encodeURIComponent($(img).attr('src')));
        let addToUrl = req.query.download ? '' : '/api/offline/manga/downloadImage?url=';
        imageURlS.push(addToUrl + encodeURIComponent($(img).attr('src')));
    });
    
    currentChapter.Page = imageURlS.length;
    currentChapter.indexName = mangaName;
    currentChapter.seriesName = seriesName;
    currentChapter.mangaId = mangaId;

    var allData = {
        'chapters': allChapters,
        'currentChapter': currentChapter,
        'imageURlS': imageURlS,
        'seriesName': seriesName,
        'indexName': mangaName,
        'chapterLink': encodeURIComponent(req.query.chapter),
        'id': mangaId
    }

    return res.send(allData);
}
// get current chapter info for offline reading
async function getMangaChapterPageOffline(req, res) {
    console.log(req.query.chapter);
    // Fetch page that we need to scrape
    //let fetchUrl = req.query.useV2 ? breakCloudFlareV2 + '/read-online/' + req.query.chapter: breakCloudFlare + '/read-online/' + req.query.chapter;
    //let fetchManga = await fetch(fetchUrl);
    //let resp = await fetchManga.text();
 //
    //var currentChapter = mainFunctions.fixCurrentChapter(resp.split(`vm.CurChapter = `)[1].split(`;`)[0], req.query.chapter.split('-chapter-')[0]);
//
    //var seriesName = resp.split(`vm.SeriesName = "`)[1].split(`";`)[0];
    //var indexName = resp.split(`vm.IndexName = "`)[1].split(`";`)[0];
//
    //currentChapter.seriesName = seriesName;
    //currentChapter.indexName = indexName;

    //return res.send(currentChapter)
}

// quick search Data
async function getQuickSearchData(req, res) {
    let search = req.query.search;
    let headers = headersGenerator.getHeaders();

    let fetchQuickSearchPage = await fetch(breakCloudFlare + "search/simple?location=main", {
        "headers": {
            "content-type": "application/x-www-form-urlencoded",
            "hx-current-url": "https://weebcentral.com/",
            "hx-request": "true",
            "hx-target": "quick-search-result",
            "hx-trigger": "quick-search-input",
            "hx-trigger-name": "text",
            "sec-ch-ua": "\"Chromium\";v=\"134\", \"Not:A-Brand\";v=\"24\", \"Microsoft Edge\";v=\"134\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "Referer": "https://weebcentral.com/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": "text=" + search,
        "method": "POST"
    });
    
    let resp = await fetchQuickSearchPage.text();

    var $ = cheerio.load(resp);
    var results = [];

    $('a').each((i, a) => {
        results.push({
            'i': a.attribs.href.split('/series/')[1].split('/')[1],
            's': $(a).find('div.flex-1.overflow-hidden').text().replaceAll('\n', '').replaceAll(/\s\s+/g, ' ').slice(1, -1),
            'id': a.attribs.href.split('/series/')[1].split('/')[0]
        });
    });

    return res.send(results);
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

    return res.send(directory);
}

async function downloadImage(req, res) {
    const url = decodeURIComponent(req.query.url);
    console.log(url);
    const headers = {};
    
    if (url == undefined || url == "") {
        return res.send('url not given');
    }

    const image = await fetch(url, {
        "headers": {
            "content-type": "application/x-www-form-urlencoded",
            "hx-current-url": "https://weebcentral.com/",
            "hx-request": "true",
            "hx-target": "quick-search-result",
            "hx-trigger": "quick-search-input",
            "hx-trigger-name": "text",
            "sec-ch-ua": "\"Chromium\";v=\"134\", \"Not:A-Brand\";v=\"24\", \"Microsoft Edge\";v=\"134\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "Referer": "https://weebcentral.com/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "omit"
    });

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
