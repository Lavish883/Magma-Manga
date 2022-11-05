const fetch = require('node-fetch'); // fetchs websites
const schemas = require('../schemas/schema'); // schemas
const mongoose = require('mongoose') // for accesing databse;
const serverName = process.env['SERVERNAME'] || 'http://localhost:5832/';
const moment = require('moment');

// Connect to mongodb database
const dbURI = "mongodb+srv://lavishRoot:qq2nMOUee49oEjOr@lavish-anime-manga-logi.nclfo.mongodb.net/manga-anime-hold?retryWrites=true&w=majority";
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });

// to use .env files
require('dotenv').config();

// for notifications setup
const webpush = require('web-push');

const publicKey = process.env.PUBLIC_KEY;
const privateKey = process.env.PRIVATE_KEY;


webpush.setVapidDetails('mailto:lavishk750@gmail.com', publicKey, privateKey);

// delete invlaid subscriptions
async function deleteInvalid(subscription) {
    await schemas.subscription.findOneAndRemove({
        'subscription': subscription
    })
    console.log('deleted');
}

async function sendNotification(subscription, manga) {
    //console.log(subscription.subscription[0])
    //https://temp.compsci88.com/cover/${manga.IndexName}.jpg
    //Create Payload for notifications
    const payload = JSON.stringify({
        'title': `New ${manga.seriesName} Chapter ${manga.latestChapter} !! ^_^`,
        'body': '',
        'img': `https://temp.compsci88.com/cover/${manga.indexName}.jpg`,
        'link': manga.chapterUrl,
    });

    // Notfiy the user that they have been subscribed
    webpush.sendNotification(subscription, payload).catch(err => {
        console.log(err.statusCode)
        // meaning that subscription is invlaid and should be deleted
        if (err.statusCode == 410 || err.statusCode == 404) {
            deleteInvalid(subscription);
        }
    });
}

async function findSubscriptions(manga) {
    console.log('finding subsccriptions')
    // get users with a speficic bookmark
    let user = await schemas.USERS.find({
        'subscribed.Index': manga.indexName
    });
    // for each user find their corresponding subscription
    for (var j = 0; j < user.length; j++) {
        console.log(user[j].name, user[j].id);
        let subscriptions = await schemas.subscription.find({
            'user.userName': user[j].name,
            'user.userId': user[j].id
        })

        // for each subscriptions send the notifications
        for (var k = 0; k < subscriptions.length; k++) {
            console.log(subscriptions[k].subscription[0]);
            sendNotification(subscriptions[k].subscription[0], manga)
        }
    }
}

async function fetchManga(manga) {
    let link = serverName + 'api/mangaName?manga=' + manga;
    console.log(link);
    // fetch the data
    try {
        let fetchAllData = await fetch(link);
        let resp = await fetchAllData.json();
        return resp;
    } catch (err) {
        console.log(err);
    }
    return;
}

// so basically first fetch the search page and the get the directory
// then go through the direcctory anf get the manga that people are subscribed to
// then check if that chapter has been released or not


async function main() {
    var subbedManga = (await schemas.subbedManga.findOne()).subbed;
    //subbedManga = ['Jujutsu-Kaisen','Suppose-a-Kid-from-the-Last-Dungeon-Boonies-Moved-to-a-Starter-Town'];
    let fetchDirectory = await fetch(serverName + 'api/searchPage');
    let directory = await fetchDirectory.json();
    console.log(directory.length);
    // now go through the directory and see any manga matches what we are looking for
    for (var i = 0; i < directory.length; i++) {
        let manga = directory[i];
        //console.log(manga.indexName);
        let isMangaSubbed = subbedManga.indexOf(manga.indexName);
        // if it isnt subbed we dont care
        if (isMangaSubbed == -1) continue;
        // now see if that chapter was released in last 24 hours
        let timeReleased = moment.unix(manga.lt);
        console.log(moment().diff(timeReleased, "hours") < 24);
        if (moment().diff(timeReleased, "hours") > 24) continue;
        findSubscriptions(manga);
    }
}

main()

module.exports = {
    main
}