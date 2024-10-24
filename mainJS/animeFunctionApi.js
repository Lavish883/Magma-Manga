const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { get } = require('mongoose');

function extractItems(data) {
    // Using Cheerio
    const $ = cheerio.load(data);
    // Al Li Items in Ul
    let items = $('.items').children("li");
    const animeList = [];
    // All items To Put in Array
    items.each((indx, e) => {
        let catLink;
        let img = $(e).children("div").children("a").children("img").attr("src");
        let title = $(e).children("div").children("a").attr("title");
        let link = $(e).children("div").children("a").attr("href").replace('/', '');
        let released = $(e).children(".released").text().split(`Released: `)[1];
        if (typeof (released) !== "undefined") {
            released = released.replace(/ /g, '');
        }
        if (link.includes('category/')) {
            //console.log(link);
            catLink = link.replace('category/', '');
            link = null;
        } else {
            link = link.replace('/category', '');
            catLink = link.split('-episode-')[0].replace('/', '')
        }
        let epNumber = $(e).children(".episode").html();
        const anime = { "img": img, "title": title, "link": link, "epNumber": epNumber, "catLink": catLink, "released": released };
        animeList.push(anime)
    })
    return animeList;
}

function extractPopularItems(data) {
    // Using Cheerio
    const $ = cheerio.load(data);
    // Al Li Items in Ul
    let items = $('.added_series_body').children("ul").children("li");
    const animeList = [];
    // All items To Put in Array
    items.each((indx, e) => {
        let img = $(e).children('a').html().split(`background: url('`)[1].split(`')`)[0]
        let title = $(e).children('a').attr("title")
        let link = $(e).children("a").attr("href")
        let epNumber = $(e).html().split(`</a>`);
        let epNumber2 = epNumber[epNumber.length - 2].split(`>`)[3]
        let genres = $(e).children(".genres").children("a")
        let genresArry = [];
        genres.each((indx, t) => {
            let genre = $(t).attr("title");
            genresArry.push(genre);
        })
        const anime = { "img": img, "title": title, "link": null, "epNumber": epNumber2, "genres": genresArry, "catLink": link.replace('/category/', '') };
        animeList.push(anime)
    })
    return animeList;
}

async function getHomePageAnime(req, res) {
    var ArryToReturn = [];
    const urlToAdd = "https://ajax.gogocdn.net/ajax/page-recent-release.html?page=1&type=";
    const gogoAnimeVc = 'https://gogoanime.vc/';
    const subData = await fetch(urlToAdd + "1");
    const subData2 = await subData.text();
    const toRespondSub = await extractItems(subData2);
    ArryToReturn.push(toRespondSub)
    const dubData = await fetch(urlToAdd + "2");
    const dubData2 = await dubData.text();
    const toRespondDub = await extractItems(dubData2);
    ArryToReturn.push(toRespondDub)
    const chineseData = await fetch(urlToAdd + "3");
    const chineseData2 = await chineseData.text();
    const toRespondChinese = await extractItems(chineseData2);
    ArryToReturn.push(toRespondChinese)
    const newData = await fetch(gogoAnimeVc + 'new-season.html');
    const newData2 = await newData.text();
    const toRespondNew = await extractItems(newData2);
    ArryToReturn.push(toRespondNew)
    const movieData = await fetch(gogoAnimeVc + 'anime-movies.html');
    const movieData2 = await movieData.text();
    const toRespondMovie = await extractItems(movieData2);
    ArryToReturn.push(toRespondMovie);
    const newPopularData = await fetch('https://ajax.gogocdn.net/ajax/page-recent-release-ongoing.html')
    const newPopularData2 = await newPopularData.text();
    const toRespondPopular = await extractPopularItems(newPopularData2)
    ArryToReturn.push(toRespondPopular);
    return res.json(ArryToReturn);
}

async function extractEpisodes(data) {
    // Using cheerio
    const $ = cheerio.load(data);
    // Get info for ajax load-list-episode
    const movie_id = $('#movie_id').attr("value");
    const default_ep = $('#default_ep').attr("value");
    const alias_anime = $('#alias_anime').attr("value");
    const ep_start = '0';
    const ep_end = $('#episode_page').children("li").last().children("a").attr("ep_end");
    // Fetch Episodes Text
    //console.log(`https://ajax.gogocdn.net/ajax/load-list-episode?ep_start=${ep_start}&ep_end=${ep_end}&id=${movie_id}&default_ep=${default_ep}&alias=${alias_anime}`);
    const fetchLink = `https://ajax.gogocdn.net/ajax/load-list-episode?ep_start=${ep_start}&ep_end=${ep_end}&id=${movie_id}&default_ep=${default_ep}&alias=${alias_anime}` 
    const Epfetch = await fetch(fetchLink);
    const response = await Epfetch.text();
    // Extract Episodes
    const $ep = cheerio.load(response);
    const episode_related_lis = $ep('#episode_related').children("li");
    // ALl items to put in arry
    const ep_Arry = [];
    episode_related_lis.each((inddx, e) => {
        let link = $(e).children("a").attr("href").replace(' /', '');
        let epNumber = $(e).children("a").children(".name").text().replace('EP ', '');
        // Put into Arry
        ep_Arry.push({ "link": link, "epNumber": 'Episode ' + epNumber });
    })
    return ep_Arry.reverse();
}

async function extractCategory(data) {
    // Using Cheerio
    const $ = cheerio.load(data);
    // Items we need
    const anime_info_body_bg = $('.anime_info_body_bg');
    const img = anime_info_body_bg.children("img").attr("src");
    const title = anime_info_body_bg.children('h1').text();
    const types = anime_info_body_bg.children('.type');
    const typeArry = [];

    types.each((indx, e) => {
        let summary = $(e).children().text();
        if (indx === 1 || indx === 3 || indx === 5) {
            typeArry.push($(e).text().replace(/\s+/g, ' ').trim());
        } else {
            typeArry.push(summary);
        }
    })
    const episodes = await extractEpisodes(data);
   
    return { 'title': title, 'img': img, 'episodes': episodes, 'types': typeArry };
}

async function getCategoryPage(req, res) {
    // Category query
    const categoryQuery = req.params.category;
    // webpage to fetch
    const toFetch = 'https://gogoanime.vc/category/' + categoryQuery;
    // Fetch
    const catFetch = await fetch(toFetch);
    if (catFetch.status !== 200) {
        return res.send("No such Anime")
    }
    const catFetchData = await catFetch.text();
    // To respond
    const toRespond = await extractCategory(catFetchData)
    return res.send(toRespond);
}

async function getSearchPage(req, res) {
    // Search query
    const searchQuery = req.params.keyword;
    const page = req.params.page;
    // webpage to fetch
    const toFetch = "https://gogoanime3.co/search.html?keyword=" + searchQuery + '&page=' + page;
    // Actual fethc request
    const searchFetch = await fetch(toFetch);
    const searchFetchData = await searchFetch.text();
    // To respond
    const toRespond = extractItems(searchFetchData);
    // Respond back
    if (toRespond.length === 0){
        return res.send('No results');
    }
    return res.send(toRespond);
}

async function getWatchLink(req, res) {
    var linkToFetch = `https://webdis-44cz.onrender.com/vidcdn/watch/` + req.params.link;

    var fetchEmbedLink = await fetch(linkToFetch);
    try {
        var fetchEmbedLinkResponse = await fetchEmbedLink.json();
        var defaultLink = fetchEmbedLinkResponse.sources[0].file;
        return res.send(process.env.SERVERNAME + "animeApi/embed/link" + "?url=" + defaultLink);
    } catch (error) {
        return res.status(500).send("Error: " + error);
    }
}

async function getWatchPage(req, res) {
    return res.render('animeEmbed.pug', { "link": req.query.url });
}

module.exports = {
    getHomePageAnime,
    getCategoryPage,
    getSearchPage,
    getWatchPage,
    getWatchLink
}