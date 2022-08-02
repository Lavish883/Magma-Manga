const webpush = require('web-push');
const schemas = require('../schemas/schema'); // schemas
const loginFunctions = require('../mainJS/loginFunctions')

async function updateSubbedManga(mangaToAdd) { // updates maga that is subbed in the databse so we dont hae to check every manga
    let subbedManga = await schemas.subbedManga.findOne();

    for (var i = 0; i < mangaToAdd.length; i++) { // only add the Index so it makes it easier to get rid of duplicates
        subbedManga.subbed.push(mangaToAdd[i].Index);
    }
    // now get rid of any duplicates
    subbedManga.subbed = [... new Set(subbedManga.subbed)];
    // save to the server
    await subbedManga.save();
}

// saves subscription to the server
async function saveSubscription(body) {
    let tokenValid = loginFunctions.isTokenValid(body.token, process.env.REFRESH_TOKEN_SECERT);
    /*
    // get users with a speficic bookmark
    let user = await schemas.USERS.find({
       'bookmarks.Index': 'Boruto'
    });
    */
    //console.log(user[0].bookmarks);

    if (tokenValid != false) { // meaning the token has a user and isValid
        let user = await schemas.USERS.findOne({ 'name': tokenValid.name });

        if (user.subscribed.length == 0) { // if the user has no subscribed manga add their bookmarks to it
            user.subscribed = user.bookmarks
            await user.save();
        }

        updateSubbedManga(user.subscribed);

        // Add the subscription to the server
        let newSubscription = new schemas.subscription({ 
            'subscription': body.subscription,
            'user': { 'userId': user.id, 'userName': user.name }
        });

        await newSubscription.save();
        
        //console.log(user[0]._id, user[0].name, user[0].email);
    }
}

// subscribes to our notifactions service
async function subscribe(req, res) {
    // Get pushSubscription object
    const subscription = req.body.subscription;
    console.log(req.body);

    saveSubscription(req.body)

    res.status(201).json({});


    // Create Payload for notifications
    const payload = JSON.stringify({
        'title': 'You will be notifed when new manga is released !! ^_^',
        'body': '',
        'img': 'https://thumbs.gfycat.com/FaintHappyAddax-size_restricted.gif'
    });

    // Notfiy the user that they have been subscribed
    try {
        webpush.sendNotification(subscription, payload);
    } catch (err) {
        console.log(err);
    }
    //sendOne();
}

async function sendOne() {
    let subscription = (await schemas.subscription.findOne()).subscription[0];
    //console.log(subscription.subscription[0])
    //Create Payload for notifications
    const payload = JSON.stringify({
        'title': 'New Boruto Chapter 149 !! ^_^',
        'body': '',
        'img': 'https://m.media-amazon.com/images/I/71upvIrs3nL._SL1500_.jpg'
    });

    // Notfiy the user that they have been subscribed
    try {
        webpush.sendNotification(subscription, payload);
    } catch (err) {
        console.log(err);
    }

}


module.exports = {
    subscribe
}