const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    "name": {
        type: String,
        required: true
    },
    "password": {
        type: String,
        required: true
    },
    "email": {
        type: String,
        required: true
    },
    "recentRead": {
        type: Array,
        required: true
    },
    "bookMarks": {
        type: Array,
        required: true,
        default: []
    },
    "bookmarks": {
        type:Array
    },
    "subscribed": {
        type: Array,
        default: []
    },
    "pfp": {
        type: String,
        required: true,
        default: '/images/favicon.ico'
    }
}, { timestamps: true });

const refreshTokenSchema = new Schema({
    "token": {
        type: String,
        required: true
    },
    "email": {
        type: String,
        required: true
    }
})

const forgotPasswordSchema = new Schema({
    "token": {
        type: String,
        required: true
    }
})

const commentsSchema = new Schema({
    "pathName": {
        type: String,
        required: true
    },
    "comments": {
        type: Array,
        required: true
    }
})

const commentId = new Schema({
    "current": {
        type: String,
        required: true
    }
})

const subscriptionSchema = new Schema({
    "subscription": {
        type: Array,
        required: true,
    },
    "user": {
        type: Array,
        required: true
    }
})

const subbedMangaSchema = new Schema({
    'subbed': {
        type: Array,
        required: true
    },
    'latestCheck': {
        type: String
    },
    'latestSubCheck': {
        type: String
    }
})

const mangaUsingV2Schema = new Schema({
    'mangaLink': {
        type: String,
        required: true
    }
})

const USERS = mongoose.model('Users', userSchema);
const refreshTokens = mongoose.model('refreshTokens', refreshTokenSchema);
const subscription = mongoose.model('notificationSubs', subscriptionSchema);
const subbedManga = mongoose.model('subbedManga', subbedMangaSchema);
const forgotPasswordTokens = mongoose.model('forgotPasswordTokens', forgotPasswordSchema);
const comments = mongoose.model('CommentModels', commentsSchema);
const mangaUsingV2 = mongoose.model('mangaUsingV2', mangaUsingV2Schema);

const commentIdModals = mongoose.model('commentId', commentId);

module.exports = {
    USERS,
    refreshTokens,
    subscription,
    subbedManga,
    forgotPasswordTokens,
    comments,
    mangaUsingV2,
}