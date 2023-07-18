const schemas = require('../schemas/schema'); // schemas
const moment = require('moment'); // to get the current time
const sanitizeHtml = require('sanitize-html'); // to sanitize converted html
const showdown = require('showdown'); // to convert markdown to html
const mdConverter = new showdown.Converter();
const loginFunctions = require('../mainJS/loginFunctions'); // all fucntions that handle login and stuff


async function getComments(req, res) {
    let mangaPathName = req.query.mangaPathName;
    // now see if this manga exists in the comments collection in the database
    var manga = await schemas.comments.findOne({ "pathName": mangaPathName });

    if (manga == null) {
        return res.send([]);
    }

    return res.send(manga.comments);
}

async function postComment(req, res) {
    let tokenValid = loginFunctions.isTokenValid(req.body.accessToken, process.env.ACCESS_TOKEN_SECERT)
    let isMarkdown = req.body.isMarkdown;
    let comment = req.body.comment;

    let mangaPathName = req.body.mangaPathName;

    // if token is not valid return error
    if (!tokenValid) {
        return res.status(401).send("Invalid Access token");
    }
    // find a user with the given access token
    const user = await schemas.USERS.findOne({ name: tokenValid.name });
    // now see if this manga exists in the comments collection in the database
    var manga = await schemas.comments.findOne({ "pathName": mangaPathName });

    if (manga === null) { // if it does not exist
        // create a new manga object
        const newManga = new schemas.comments({
            "pathName": mangaPathName,
            "comments": []
        });
        await newManga.save();
        manga = await schemas.comments.findOne({ "pathName": mangaPathName });
    }

    // now we can add the comment to the manga
    if (isMarkdown) {
        comment = mdConverter.makeHtml(comment);
    }
    // sanitize the comment
    console.log(sanitizeHtml.defaults.allowedAttributes)
    comment = sanitizeHtml(comment, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        allowedAttributes: {
            "a": ['href', 'name', 'target', 'style'],
            "img": [
                'src', 'srcset',
                'alt', 'title',
                'width', 'height',
                'loading', 'style',
            ],
            '*': ['style']
        }
    });

    // add the comment to the manga
    manga.comments.unshift({
        "user": user.name,
        "comment": comment,
        "time": moment.now(),
        "likes": 0,
        "dislikes": 0,
        "replies": [],
        "id": manga.comments.length
    });

    // save the manga
    await manga.save();

    return res.send("Comment added");
}

async function deleteComment(req, res) {
    console.log(req.body);
    return res.send("ok");
}


module.exports = {
    getComments,
    postComment,
    deleteComment
}