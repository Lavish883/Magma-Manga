const schemas = require('../schemas/schema'); // schemas
const moment = require('moment'); // to get the current time
const sanitizeHtml = require('sanitize-html'); // to sanitize converted html
const showdown = require('showdown'); // to convert markdown to html
const mdConverter = new showdown.Converter();
const loginFunctions = require('../mainJS/loginFunctions'); // all fucntions that handle login and stuff
const fetch = require('node-fetch');

function sanitizeComment(comment, isMarkdown) {
    // now we can add the comment to the manga
    if (isMarkdown) {
        comment = mdConverter.makeHtml(comment);
    }
    // sanitize the comment
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
    return comment;
}

async function getComments(req, res) {
    let mangaPathName = req.body.mangaPathName;
    // now see if this manga exists in the comments collection in the database
    var manga = await schemas.comments.findOne({ "pathName": mangaPathName });

    if (manga == null) {
        return res.send([]);
    }

    if (req.body.accessToken != null || req.body.accessToken != undefined) {
        // first check if the token is valid
        let tokenValid = loginFunctions.isTokenValid(req.body.accessToken, process.env.ACCESS_TOKEN_SECERT)
        if (tokenValid) {
            // now go through each comment and see if the user has liked or disliked it
            for (var i = 0; i < manga.comments.length; i++) {
                manga.comments[i] = personalizeComments(manga.comments[i], tokenValid.name);
            }
        } else {
            return res.status(401).send("Invalid Access token");
        }
    }

    //console.log(manga.comments);
    return res.send(manga.comments);
}

function personalizeComments(comment, userName) {
    // check if the user has liked this comment
    if (comment.likes.includes(userName)) {
        comment.isLiked = true;
    }
    // check if the user has disliked this comment
    if (comment.dislikes.includes(userName)) {
        comment.isDisliked = true;
    }
    // check if the user is the owner of the comment
    if (comment.user == userName) {
        comment.isOwner = true;
    }
    // Go through each reply and personalize it
    if (comment.replies == undefined) return comment; 

    for (var i = 0; i < comment.replies.length; i++) {
        comment.replies[i] = personalizeComments(comment.replies[i], userName);
    }

    return comment;
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

        // if the manga is a chapter, remove the -page- from the pathName
        if (mangaPathName.includes("-page-")) {
            mangaPathName = mangaPathName.split("-page-")[0];
        }

        const newManga = new schemas.comments({
            "pathName": mangaPathName,
            "comments": []
        });
        await newManga.save();
        manga = await schemas.comments.findOne({ "pathName": mangaPathName });
    }

    comment = sanitizeComment(comment, isMarkdown);
    // add the comment to the manga
    manga.comments.unshift({
        "user": user.name,
        "comment": comment,
        "time": moment.now(),
        "likes": [],
        "dislikes": [],
        "replies": [],
        "id": Math.floor(Math.floor((manga.comments.length * Math.random(0, 1))) + moment.now() * Math.random(0, 1)) // can not do manga.comments.length, as user can delete comments
    });

    // save the manga
    await manga.save();

    return res.send("Comment added");
}

async function getGifs(req, res) {
    var fetchURL = `https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_API_KEY}&q=${req.query.q}&limit=10&offset=${req.query.offset}`;
    var response = await fetch(fetchURL);
    var data = await response.json();
    // parse data to only get the urls
    var newData = [];
    // /return res.send(data.data);
    
    for (var i = 0; i < data.data.length; i++) {
        newData.push(data.data[i].images.fixed_width.webp)
    }
    return res.json(newData);
}

async function deleteComment(req, res) {
    console.log(req.body);
    return res.send("ok");
}

function findComment(manga, commentId) {
    // now find the comment with the given id
    var comment = manga.comments.find(comment => comment.id == commentId);
    // will be string if it is a reply
    if (commentId.includes(" ")) {
        // first half is the comment id, second half is the reply id
        let cID = commentId.split(" ")[0];

        // now find the comment with the given id
        var replyArry = manga.comments.find(comment => comment.id == cID);
        comment = replyArry.replies.find(reply => reply.id == commentId);
    }

    return comment;
}

async function likeComment(req, res){
    let mangaPathName = req.body.mangaPathName;
    let commentId = req.body.commentId;
    let isTokenValid = loginFunctions.isTokenValid(req.body.accessToken, process.env.ACCESS_TOKEN_SECERT);

    // if token is not valid return error, we don't need to find user as we just need their name
    if (!isTokenValid) {
        return res.status(401).send("Invalid Access token");
    }

    // now find the manga with the given pathName
    var manga = await schemas.comments.findOne({ "pathName": mangaPathName });
    
    var comment = findComment(manga, commentId);
    
    // now see if the user has already liked this comment
    var hasLiked = comment.likes.includes(isTokenValid.name);
    var hasDisliked = comment.dislikes.includes(isTokenValid.name);

    // if the user has already liked this comment, then remove their like
    if (hasLiked) {
        comment.likes.splice(comment.likes.indexOf(isTokenValid.name), 1);
    } else {
        // if the user has already disliked this comment, then remove their dislike
        if (hasDisliked) {
            comment.dislikes.splice(comment.dislikes.indexOf(isTokenValid.name), 1);
        }
        // now add the like
        comment.likes.push(isTokenValid.name);
    }

    // save the manga
    manga.markModified("comments");
    await manga.save();
    return res.send("Done with liking stuff");
}

async function dislikeComment(req, res){
    let mangaPathName = req.body.mangaPathName;
    let commentId = req.body.commentId;
    let isTokenValid = loginFunctions.isTokenValid(req.body.accessToken, process.env.ACCESS_TOKEN_SECERT);

    // if token is not valid return error, we don't need to find user as we just need their name
    if (!isTokenValid) {
        return res.status(401).send("Invalid Access token");
    }

    // now find the manga with the given pathName
    var manga = await schemas.comments.findOne({ "pathName": mangaPathName });
    
    // now find the comment with the given id
    var comment = findComment(manga, commentId);
    
    // now see if the user has already liked this comment
    var hasLiked = comment.likes.includes(isTokenValid.name);
    var hasDisliked = comment.dislikes.includes(isTokenValid.name);
    
    // if the user has already disliked this comment, then remove their dislike
    if (hasDisliked){
        comment.dislikes.splice(comment.dislikes.indexOf(isTokenValid.name), 1);
    } else {
        // if the user has already liked this comment, then remove their like
        if (hasLiked){
            comment.likes.splice(comment.likes.indexOf(isTokenValid.name), 1);
        }
        // now add the dislike
        comment.dislikes.push(isTokenValid.name);
    }

    // save the manga
    manga.markModified("comments");
    await manga.save();
    return res.send("Done with disliking stuff");
}

async function replyToComment(req, res){
    let body = req.body;
    let tokenValid = loginFunctions.isTokenValid(body.accessToken, process.env.ACCESS_TOKEN_SECERT)

    // if token is not valid return error
    if (!tokenValid) {
        return res.status(401).send("Invalid Access token");
    }

    console.log(body);
    
    var manga = await schemas.comments.findOne({ "pathName": body.mangaPathName });
    var comment = manga.comments.find(comment => comment.id == body.commentId);
    // means that this is a reply to a reply, and need to get the comment with the array of replies
    if (body.commentId.includes(" ")) {
        comment = manga.comments.find(comment => comment.id == body.commentId.split(" ")[0]);
    }

    // add that comment to the replies
    comment.replies.push({
        "replyingToId": body.commentId,
        "replyingTo": body.replyingTo,
        "user": tokenValid.name,
        "comment": sanitizeComment(body.comment, body.isMarkdown),
        "time": moment.now(),
        "likes": [],
        "dislikes": [], // id will also hold the comment id with it so we can find it easily
        "id": comment.id + " " + Math.floor(Math.floor((comment.replies.length * Math.random(0, 1))) + moment.now() * Math.random(0, 1)) 
    });

    // save the manga
    manga.markModified("comments");
    await manga.save();

    return res.send("Done with replying stuff");
}

async function editComment(req, res){
    let body = req.body;
    let tokenValid = loginFunctions.isTokenValid(body.accessToken, process.env.ACCESS_TOKEN_SECERT)

    // if token is not valid return error
    if (!tokenValid) {
        return res.status(401).send("Invalid Access token");
    }

    var manga = await schemas.comments.findOne({ "pathName": body.mangaPathName });
    var comment = findComment(manga, body.commentId);

    // now see if the user is the owner of the comment, just to be safe
    if (comment.user != tokenValid.name){
        return res.status(403).send("You are not the owner of this comment");
    }

    // now edit the comment
    comment.comment = sanitizeComment(body.comment, body.isMarkdown);
    comment.wasEdited = true;

    // save the manga
    manga.markModified("comments");
    await manga.save();

    return res.send("Done with editing stuff");
}

async function deleteComment(req, res){
    let body = req.body;
    let tokenValid = loginFunctions.isTokenValid(body.accessToken, process.env.ACCESS_TOKEN_SECERT)

    // if token is not valid return error
    if (!tokenValid) {
        return res.status(401).send("Invalid Access token");
    }

    var manga = await schemas.comments.findOne({ "pathName": body.mangaPathName });
    
    if (body.commentId.includes(" ")) {
        let comment = findComment(manga, body.commentId.split(" ")[0]);
        let reply = comment.replies.find(reply => reply.id == body.commentId);
        // verify just to be safe
        if (reply.user != tokenValid.name) return res.status(403).send("You are not the owner of this comment");

        comment.replies.splice(comment.replies.indexOf(reply), 1);
    } else {
        var comment = findComment(manga, body.commentId);
        // verify just to be safe
        if (comment.user != tokenValid.name) return res.status(403).send("You are not the owner of this comment");

        manga.comments.splice(manga.comments.indexOf(comment), 1);
    }    

    // save the manga
    manga.markModified("comments");
    await manga.save();

    return res.send("Done with deleting stuff");
}

module.exports = {
    getComments,
    postComment,
    deleteComment,
    getGifs,
    likeComment,
    dislikeComment,
    replyToComment,
    editComment
}