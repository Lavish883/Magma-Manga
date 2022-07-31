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
        required: true
    },
    "bookmarks": {
        type:Array
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
    }
})

const comments = new Schema({
    "name": {
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

const USERS = mongoose.model('Users', userSchema);
const refreshTokens = mongoose.model('refreshTokens', refreshTokenSchema);
const CommentModels = mongoose.model('CommentModels', comments);
const commentIdModals = mongoose.model('commentId', commentId);

module.exports = {
    USERS,
    refreshTokens
}