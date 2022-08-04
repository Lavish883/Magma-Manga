const schemas = require('../schemas/schema'); // schemas
const mongoose = require('mongoose') // for accesing databse;
const moment = require('moment')
// Connect to mongodb database
const dbURI = "mongodb+srv://lavishRoot:qq2nMOUee49oEjOr@lavish-anime-manga-logi.nclfo.mongodb.net/manga-anime-hold?retryWrites=true&w=majority";
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });

async function stuffToChange(user) {
    for (var i = 0; i < user.recentRead.length; i++) {
        user.recentRead[i] = user.recentRead[i].replace('?read', '');
        //user.recentRead[i] = user.recentRead[i].split('-page-')[0].replace('?read=', '');
    }
    console.log(user.recentRead[user.recentRead.length - 2]);

    await user.save();
}

async function migrate() {
    /*
    const allUsers = await schemas.USERS.find();

    console.log(allUsers.length);
    var i = 0;
    while (i < allUsers.length) {
        var user = allUsers[i];

        stuffToChange(user);

        i++;
    }
    //await allUsers.save();
    console.log('done');
    */
    const mangaSubbed = (await schemas.subbedManga.findOne());
    mangaSubbed.latestCheck = '';
    mangaSubbed.save();

}

migrate();