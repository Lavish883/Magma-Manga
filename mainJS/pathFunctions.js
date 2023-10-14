const fetch = require('node-fetch'); // fetchs html
const serverName = process.env['SERVERNAME'] || 'http://localhost:8080/';
var isPupServerLoaded = true;
const fs = require('fs');
const susManga = JSON.parse(fs.readFileSync('./json/susManga.json'));
const isTokenValid = require('./loginFunctions').isTokenValid;

async function indexHtml(req, res) {

    if (!isPupServerLoaded) {
        isPupServerLoaded = true;
        return res.render('loading')
    }

    let fetchAllData = await fetch(serverName + 'api/manga/all')
    let resp = await fetchAllData.json();
    resp.susManga = susManga;

    return res.render('index', resp)
}

async function readHtml(req, res) {

    if (!isPupServerLoaded) {
        isPupServerLoaded = true;
        return res.render('loading')
    }
    // get the chapter details
    let fetchAllData = await fetch(serverName + 'api/manga/read?chapter=' + req.params.mangaChapter)
    let resp = await fetchAllData.json();

    // still got do the spefic page 
    if (req.params.mangaChapter.includes('-page-')) {
        resp.title = resp.seriesName + ' Chapter ' + resp.currentChapter.Chapter + ' Page ' + '1'
    } else {
        resp.title = resp.seriesName + ' Chapter ' + resp.currentChapter.Chapter
    }
    resp.susManga = susManga;
    return res.render('read', resp)
}

function bookmarksHtml(req, res) {
    return res.render('bookmarks')
}

async function mangaHtml(req, res) {
    if (!isPupServerLoaded) {
        isPupServerLoaded = true;
        return res.render('loading')
    }

    // get the manga details
    let fetchAllData = await fetch(serverName + 'api/mangaName?manga=' + req.params.mangaName);
    let resp = await fetchAllData.json();

    resp.susManga = susManga;
    // add search links
    
    return res.render('manga', resp)
}

async function directoryHtml(req, res) {
    if (!isPupServerLoaded) {
        isPupServerLoaded = true;
        return res.render('loading')
    }

    // get the directory data
    let fetchDirectoryData = await fetch(serverName + 'api/manga/directory')
    let resp = await fetchDirectoryData.json();

    return res.render('directory', {'directory' :  resp, 'susManga' : susManga })
}

async function searchHtml(req, res) {
    if (!isPupServerLoaded) {
        isPupServerLoaded = true;
        return res.render('loading')
    }

    return res.render('search')
}

async function forgotPasswordHtml(req, res) {

    let token = await isTokenValid(req.params.token, process.env.FORGOT_PASSWORD_TOKEN_SECERT);
    if (token == false) {
        return res.send('Link has expired !!');
    }
    return res.render('forgotPassword', { 'token': req.params.token })
}

async function recentChaptersHtml(req, res) {
    return res.render('recentChapters')
}

async function offlineHtml(req, res) {
    return res.render('offline')
}

async function offlineReadHtml(req, res) {
    return res.render('readOffline')
}

module.exports = {
    indexHtml,
    readHtml,
    bookmarksHtml,
    mangaHtml,
    directoryHtml,
    searchHtml,
    recentChaptersHtml,
    forgotPasswordHtml,
    offlineHtml,
    offlineReadHtml
}