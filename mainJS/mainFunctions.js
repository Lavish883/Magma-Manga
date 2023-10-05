const cheerio = require('cheerio')
const moment = require('moment')
const fetch = require('node-fetch');
const fs = require('fs')

const breakCloudFlare = process.env.BREAK_CLOUDFLARE_V1 || 'https://letstrypup-dbalavishkumar.koyeb.app/?url=https://mangasee123.com'
const susManga = JSON.parse(fs.readFileSync('./json/susManga.json'));


// to chekc if manga is potientally sus
function isMangaSus(mangaName) {
    if (susManga[mangaName] == undefined) {
        return false
    }
    return true
}

// used for latest chapters index.html
function calcDate(date) {
    return moment(date).subtract(1, 'hour').fromNow();
}
// check if the chapter is new/recent
function isNew(date) {
    var timeNow = moment(date).subtract(1, "hour");
    return moment().diff(timeNow, "hours") < 24;
}
// used for manga.html screen
function calcDateForMangaChapters(Date) {
    var daysPassed = moment().diff(Date, "d");
    if (daysPassed === 0) {
        return moment(Date).fromNow()
    } else {
        return moment(Date).calendar()
    }
    return moment().diff(Date, "d");
}

function calcDateForMangaPage(e) {
    var t = moment(e).subtract(9, "hour")
    n = moment(),
        m = n.diff(t, "hours");
    return n.isSame(t, "d") ? moment(e).subtract(9, "hour").fromNow() : m < 24 ? moment(e).subtract(9, "hour").calendar() : moment(e).subtract(9, "hour").format("L");
}

function calcChapter(Chapter) {
    var ChapterNumber = parseInt(Chapter.slice(1, -1));
    var Odd = Chapter[Chapter.length - 1];
    if (Odd == 0) {
        return ChapterNumber;
    } else {
        return ChapterNumber + "." + Odd;
    }
}

// comments go here
function calcChapterUrl(ChapterString) {
    //console.log('str:' + ChapterString);
    var Index = "";
    var IndexString = ChapterString.substring(0, 1);
    if (IndexString != 1) {
        Index = "-index-" + IndexString;
    }
    var Chapter = parseInt(ChapterString.slice(1, -1));
    var Odd = "";
    var OddString = ChapterString[ChapterString.length - 1];
    if (OddString != 0) {
        Odd = "." + OddString;
    }

    return "-chapter-" + Chapter + Odd + Index;
}

function scrapeLatestManga(page) {
    //  console.log(page);
    let latestChapterJSONSplit = page.split(`vm.LatestJSON = `)[1].split(`vm.NewSeriesJSON =`)[0];
    let LatestChapterJSON = JSON.parse(latestChapterJSONSplit.split(`;`)[0]);

    for (i = 0; i < LatestChapterJSON.length; i++) {
        let manga = LatestChapterJSON[i];
        manga.Date = calcDate(manga.Date);
        manga.isSus = isMangaSus(manga.IndexName);
        manga.ChapterLink = manga.IndexName + calcChapterUrl(manga.Chapter);
        manga.Chapter = calcChapter(manga.Chapter);
    }

    return LatestChapterJSON;
}

function scrapeHotManga(page) {
    // Arry with manga that contains manga 
    let HotUpdateJSON = JSON.parse(page.split(`vm.HotUpdateJSON = `)[1].split(`;`)[0]);

    for (i = 0; i < HotUpdateJSON.length; i++) {
        let manga = HotUpdateJSON[i];
        manga.Date = calcDate(manga.Date);
        manga.isSus = isMangaSus(manga.IndexName);
        if (manga.IndexName == 'Yofukashi-no-Uta') {
            manga.isSus = true;
        }
        manga.ChapterLink = manga.IndexName + calcChapterUrl(manga.Chapter);
        manga.Chapter = calcChapter(manga.Chapter);
    }

    return HotUpdateJSON;
}

function scrapeMangaInfo(page) {
    const $ = cheerio.load(page)
    // list conatiner
    let mainUL = $(`ul.list-group , ul.list-group-flush`);

    let SeriesName = $(mainUL).children("li").children("h1")


    var mangaDetails = {
        'SeriesName': SeriesName.html(),
        'Info': []
    }


    $(mainUL).children("li").each(function (indx, element) {
        if (indx != 0 && indx != 1) {
            var type = $(element).text().split(`:`)[0]
            var info = $(element).text().split(`:`)[1]

            if (type.replace(/\r?\n|\r|\t/g, "") == 'Description') {
                info = $(element).text().split(`Description:`)[1].replace(/\r?\n|\r|\t/g, "");
            }

            // Have to fix description whitespace
            mangaDetails.Info.push({
                'type': type.replace(/\r?\n|\r|\t/g, ""),
                'info': info.replace(/\r?\n|\r|\t/g, "").split(`,`)
            })

        }
    })

    return mangaDetails;

    //return $(`ul.list-group , ul.list-group-flush`).html();


}

async function getGenres(manga, headers) {
    let fetchManga = await fetch(breakCloudFlare + '/manga/' + manga, headers);
    let resp = await fetchManga.text();

    var allGenres = [];
    var aLinks = resp.split(`<span class="mlabel">Genre(s):</span>`)[1].split(`</i>`)[0].split(`"</a>`)[0];
    var aLinks2 = aLinks.split(`</a>`)

    // return only 2 manga 
    for (var i = aLinks2.length - 2; i > aLinks2.length - 4; i--) {
        allGenres.push(aLinks2[i].split(`>`)[1])
    }

    return allGenres;

}

function genresComparer(listOfManga, genres) {
    let FilteredResults = [];

    for (var i = 0; i < listOfManga.length; i++) {
        if (genres.every(item => listOfManga[i].g.includes(item))) {
            FilteredResults.push(listOfManga[i]);
        }
    }

    FilteredResults.sort(function (a, b) {
        return b.vm - a.vm;
    })

    if (FilteredResults.length > 10) {
        FilteredResults.length = 10
    }

    return FilteredResults
}

function getMangaGenres(manga, Directory) {
    for (var i = 0; i < Directory.length; i++) {
        if (Directory[i].i == manga) {
            return Directory[i].g;
        }
    }
}


async function getSimilarManga(manga1, manga2) {
    let link = breakCloudFlare + '/search/?sort=vm&desc=true&genre=';
    let fetchSearch = await fetch(link);
    let resp = await fetchSearch.text();
    // Directory which contains all the manga with genres and stuff
    var DirectoryBackup = JSON.parse(resp.split(`vm.Directory = `)[1].split(`;`).splice(0, 15).join(','));
    // get genres by using the directory
    let manga1Genres = await getMangaGenres(manga1, DirectoryBackup);
    let manga2Genres = await getMangaGenres(manga2, DirectoryBackup);

    let allGenres = [...new Set([...manga1Genres, ...manga2Genres])]
    
    var allManaga = [];
    var i = 0;
    // do it in chunks of 3, to get even more and better results
    while (i < allGenres.length) {
        let sliceTo = i + 3;
        if (sliceTo > allGenres.length) {
            sliceTo = allGenres.length;
        }

        let FilteredResults = genresComparer(DirectoryBackup, allGenres.slice(i, sliceTo));
        //console.log(FilteredResults)
        
        allManaga.push(...FilteredResults)
        i += 3;
    }

    if (allManaga.length != 0) {
        return allManaga;
    }

    DirectoryBackup.sort(function (a, b) {
        return b.vm - a.vm;
    })

    
    console.log('no genres found, returning top 12')

    DirectoryBackup.length = 12;
    return DirectoryBackup
}

function scrapeAdminRecd(html) {
    let admin_Recom = html.split(`vm.TopTenJSON = `);
    let admin_Recom2 = admin_Recom[1].split(`vm.RecommendationJSON = `);
    let admin_Recom3 = admin_Recom2[1].split(`;`)
    let admin_Recom_Arry = JSON.parse(admin_Recom3[0]);

    var mangaChosen = admin_Recom_Arry[Math.floor(Math.random() * admin_Recom_Arry.length)]
    mangaChosen.isSus = isMangaSus(mangaChosen.IndexName)
    console.log(mangaChosen)
    return mangaChosen;
}

function scrapeHotMangaThisMonth(html) {
    let hotMonth = html.split(`vm.TopTenJSON = `);
    let hotMonth1 = hotMonth[1].split(`;`)
    let hotMonth2 = JSON.parse(hotMonth1[0]);

    return hotMonth2
}

function fixChaptersArry(chapters, indexName, mangaPage = false) {
    chapters = JSON.parse(chapters);
    for (var i = 0; i < chapters.length; i++) {
        chapters[i].ChapterLink = indexName + calcChapterUrl(chapters[i].Chapter)
        chapters[i].Chapter = calcChapter(chapters[i].Chapter);
        if (mangaPage) {
            chapters[i].isNew = isNew(chapters[i].Date)
            chapters[i].Date = calcDateForMangaPage(chapters[i].Date);
        } else {
            chapters[i].Date = calcDateForMangaChapters(chapters[i].Date);
        }
    }
    return chapters.reverse();
}

function fixCurrentChapter(chapter, indexName) {
    chapter = JSON.parse(chapter);
    chapter.ChapterLink = indexName + calcChapterUrl(chapter.Chapter);
    chapter.Chapter = calcChapter(chapter.Chapter);
    chapter.Date = calcDateForMangaChapters(chapter.Date);
    return chapter
}
// for the image url it calcs the chapter 
// for ex.) => if given 160 => 0160, 15 => 0015
function ChapterImage(ImageChapterToString) {
    if (ImageChapterToString.includes('.')) {
        if (ImageChapterToString.length === 5) {
            ImageChapterToString = '0' + ImageChapterToString
        } else if (ImageChapterToString.length === 4) {
            ImageChapterToString = '00' + ImageChapterToString
        } else if (ImageChapterToString.length === 3) {
            ImageChapterToString = '000' + ImageChapterToString
        }
    } else {
        if (ImageChapterToString.length === 3) {
            ImageChapterToString = '0' + ImageChapterToString
        } else if (ImageChapterToString.length === 2) {
            ImageChapterToString = '00' + ImageChapterToString
        } else if (ImageChapterToString.length === 1) {
            ImageChapterToString = '000' + ImageChapterToString
        }
    }
    return ImageChapterToString
}
// for the image url calcs the corresponding page
// for ex.) => if 5 => 005, 15 => 015
function PageImage(PageString) {
    var s = "000" + PageString;
    return s.substr(s.length - 3);
}

function chapterImgURLS(currentChapter, imageDirectoryURL, indexName) {
    var imgURLS = [];
    var chapterNumber = ChapterImage(currentChapter.Chapter.toString());
    var directory = currentChapter.Directory === '' ? '/' : '/' + currentChapter.Directory + '/'

    console.log(imageDirectoryURL)
    for (var i = 1; i < parseInt(currentChapter.Page) + 1; i++) {
        let imagePage = PageImage(i.toString());
        if (process.env['SERVERNAME'] == 'https://mangaapi.lavishkumar1.repl.co/') {
            var imageURL = '//axiostrailbaby.lavishkumar1.repl.co/sendImage/' + (imageDirectoryURL + '/manga/' + indexName + directory + chapterNumber + '-' + imagePage + '.png').replaceAll('/', ' ')
        } else {
            var imageURL = '//' + imageDirectoryURL + '/manga/' + indexName + directory + chapterNumber + '-' + imagePage + '.png'
        }
        imgURLS.push(imageURL);
    }

    return imgURLS;
}

function fixRecdArry(arry) {
    for (var i = 0; i < arry.length; i++) {
        //console.log(arry[i].l, arry[i].i, i)
        arry[i].chapterLink = arry[i].i + calcChapterUrl(arry[i].l)
        arry[i].l = calcChapter(arry[i].l)
    }
    return arry
}

// fixes the chapter and date values for search results
function fixSearchArry(arry) {
    for (var i = 0; i < arry.length; i++) {
        let manga = arry[i];

        manga.indexName = manga.i;
        delete manga.i;

        manga.seriesName = manga.s;
        delete manga.s;

        manga.authors = manga.a;
        delete manga.a;

        manga.latestScan = moment(manga.latestScan).subtract(1, "hour").format("MM/DD/YYYY");
        delete manga.ls;

        manga.latestChapter = calcChapter(manga.l);

        manga.chapterUrl = '/manga/read/' + manga.indexName + calcChapterUrl(manga.l);
        delete manga.l;

        manga.alternateNames = manga.al;
        delete manga.al;

        manga.genres = manga.g;
        delete manga.g;

        manga.isHot = manga.h;
        delete manga.h;

        manga.offical = manga.o;
        delete manga.o;

    }
    return arry;
}

module.exports = {
    chapterImgURLS,
    fixCurrentChapter,
    scrapeHotManga,
    fixChaptersArry,
    scrapeHotMangaThisMonth,
    scrapeAdminRecd,
    scrapeLatestManga,
    scrapeMangaInfo,
    getGenres,
    getSimilarManga,
    fixRecdArry,
    isMangaSus,
    fixSearchArry
}
