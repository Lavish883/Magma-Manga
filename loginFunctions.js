const bcrypt = require('bcrypt') // hash passwords beforing put in database
const jwt = require('jsonwebtoken'); // json web tokens using in authentaction
const fs = require("fs")


// check if an user already exsits with that name or email
function doesUserExist(userName, userEmail) {
    var allUsers = JSON.parse(fs.readFileSync('users.json'));


    for (var i = 0; i < allUsers.length; i++) {

        if (allUsers[i].email == userEmail || allUsers[i].name == userName) {
            return true
        }
    }
    return false;
}

function allUsers(req, res) {
    return res.send(fs.readFileSync('users.json'))
}

// token to authectiate the user
function generateAccesToken(userName) {
    let user = { name: userName };

    return jwt.sign(user, process.env.ACCESS_TOKEN_SECERT, { expiresIn: '30min' }); // access token expires in 30 mins
}
// token that allows user to get new accestoken when that one expires
// when refresh token expires means user has beem signed out and needs to log in
function generateRefreshToken(userName) {
    let user = { name: userName };

    return jwt.sign(user, process.env.REFRESH_TOKEN_SECERT, { expiresIn: '30d' }); // refresh token expires in 30 days
}
// middleware to check if the token given is actually valid
function isTokenValid(token, secert) {
    if (token == null) return false

    try {
        // returns the user name if it is valid otherwise creates an err
        return jwt.verify(token, secert)
    } catch (err) {
        // if err meaning that token is expired or is invalid 
        return false
    }

}

// register a new user
async function registerUser(req, res) {
    var allUsers = JSON.parse(fs.readFileSync('users.json'));
    var user = req.body
    // if someone already exists with the name and eamil tell that it is taken
    if (doesUserExist(user.name, user.email)) {
        return res.send('exits')
    }
    // hash the password so someone with access to the file can't steal it
    const hashedPassword = await bcrypt.hash(user.password, 10)

    allUsers.push({
        "name": user.name,
        "email": user.email,
        "password": hashedPassword,
        "bookmarks": user.bookmarks,
        "recentRead": user.recentRead
    })

    fs.writeFileSync('users.json', JSON.stringify(allUsers, '', 3));

    return res.send('done')
}
// login the user return accestoken and refreshtoken 
async function loginUser(req, res) {
    var allUsers = JSON.parse(fs.readFileSync('users.json'));
    var refreshTokens = JSON.parse(fs.readFileSync('refreshTokens.json'))
    // find the actual user got to check with email and name becuase user can login with both
    //so then we can comapre passwords
    var user = allUsers.find(user => user.name == req.body.userName);

    if (user == undefined) {
        user = allUsers.find(user => user.email == req.body.userName);
    }

    if (user == undefined) {
        return res.sendStatus(401)
    }

    // check with bcrpyt either password is correct or not
    // if correct give them the accestokens
    if (await bcrypt.compare(req.body.password, user.password)) {
        let accessToken = generateAccesToken(user.name);
        let refreshToken = generateRefreshToken(user.name);
        refreshTokens.push(refreshToken);
        fs.writeFileSync('refreshTokens.json', JSON.stringify(refreshTokens, null, 3));

        return res.json({ accessToken: accessToken, refreshToken: refreshToken });
    }

    return res.sendStatus(401)
}
// get users info like bookamrks and recentread based on the accestoken
async function getUserInfo(req, res) {

    var allUsers = JSON.parse(fs.readFileSync('users.json'));
    let tokenValid = isTokenValid(req.body.accessToken, process.env.ACCESS_TOKEN_SECERT)
    
    if (tokenValid == false) {
        return res.sendStatus(401);
    }
    // info about bookmarks and recentRead we have on the server
    var userCloud = allUsers.find(user => user.name == tokenValid.name);
    var reqRecentRead = req.body.recentRead;
    var reqBookmarks = req.body.bookmarks;
    // now combine what the user has on their local machine and update that to our server
    // combine recentread

    if (reqRecentRead != undefined || reqRecentRead != null) {
        // deconstruct the arry and push all elements to cloud save
        // then use the spread and new syntax to get rid of duplciate items in the arry
        userCloud.recentRead.push(...reqRecentRead)
        userCloud.recentRead = [... new Set(userCloud.recentRead)]
    }

    if (reqBookmarks != undefined || reqBookmarks != null) {
        // go through all the bookmarks in the req if it doesn't include in our cloudsave then push it otherwise ignore and move on
        for (var i = 0; i < reqBookmarks.length; i++) {
            var isUnique = true;

            for (var k = 0; k < userCloud.bookmarks.length; k++) {
                if (userCloud.bookmarks[k].indexName == reqBookmarks[i].indexName) {
                    isUnique = false;
                    break;
                }
            }

            if (isUnique) {
                userCloud.bookmarks.push(reqBookmarks[i]);
            }
        }
    }

    fs.writeFileSync('users.json', JSON.stringify(allUsers, '', 3));

    return res.send({ 'bookmarks': userCloud.bookmarks, 'recentRead': userCloud.recentRead });
}
// new accestoken with the refresh token
async function getNewToken(req, res) {
    let allRefreshTokens = JSON.parse(fs.readFileSync('refreshTokens.json'));

    let refreshToken = req.body.refreshToken;
    let tokenValid = isTokenValid(refreshToken, process.env.REFRESH_TOKEN_SECERT);

    if (tokenValid == false || allRefreshTokens.includes(refreshToken) == false) {
        return res.sendStatus(401);
    }

    let newAcessToken = generateAccesToken(tokenValid.name);

    return res.send(newAcessToken);

}
// log out of the account
async function logOutUser(req, res) {
    let allRefreshTokens = JSON.parse(fs.readFileSync('refreshTokens.json'));

    let refreshToken = req.body.refreshToken;
    // get rid of the specfifc refreshtoken the user has so even if someone
    // somehow gets it its useless
    for (var i = 0; i < allRefreshTokens.length; i++) {
        if (allRefreshTokens[i] == refreshToken) {
            allRefreshTokens.splice(i, 1);
        }
    }
    fs.writeFileSync('refreshTokens.json', JSON.stringify(allRefreshTokens));
}

module.exports = {
    allUsers,
    registerUser,
    loginUser,
    getUserInfo,
    getNewToken,
    logOutUser
}