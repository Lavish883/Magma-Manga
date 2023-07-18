const bcrypt = require('bcrypt') // hash passwords beforing put in database
const jwt = require('jsonwebtoken'); // json web tokens using in authentaction
const schemas = require('../schemas/schema'); // schemas
const mailFunctions = require('./mailFunctions'); // mail functions
const userNameRegexExpression = "^[A-Za-z][A-Za-z0-9_]{7,29}$"; 

// check if an user already exsits with that name or email
async function findUser(userName, userEmail) {
    console.log(userName, userEmail);
    var user = await schemas.USERS.find({ 'name': userName }); // Get user from the database
    if (user.length == 0) { // Meaning user doesn't exist with name
        user =  await schemas.USERS.find({ 'email': userEmail }); // see with the email
    }
    return user;
}

async function allUsers(req, res) {
    var users = await schemas.USERS.find();
    return res.send(users);
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
    var user = req.body
    // if someone already exists with the name and email tell that it is taken
    var userInDatabase = await findUser(user.name, user.email);

    if (userInDatabase.length != 0) {
        return res.status(400).send('User already exists with that name or email !!')
    }
    
    // see if the username is valid
    var regex = new RegExp(userNameRegexExpression);

    if (!regex.test(user.name)) {
        return res.status(400).send('Username must be 6-30 characters long and can only contain letters, numbers, and underscores. It must start with a letter.')
    }

    // hash the password so someone with access to the database can't steal it
    const hashedPassword = await bcrypt.hash(user.password, 10)

    try {
        // make a new user based on the schema 
        const newUser = new schemas.USERS({
            name: req.body.name,
            password: hashedPassword,
            email: req.body.email,
            recentRead: [],
            bookMarks: []
        })
        // save the server
        await newUser.save();

        return res.status(200).send('Done Registering');

    } catch (err) {
        return res.status(500).send(err);
    }
}
// login the user return accestoken and refreshtoken 
async function loginUser(req, res) {
    // find the actual user got to check with email and name becuase user can login with both
    //so then we can comapre passwords
    var user = await findUser(req.body.userName, req.body.userName);

    if (user.length == 0) {
        return res.sendStatus(401)
    }

    // check with bcrpyt either password is correct or not
    // if correct give them the accestokens
    if (await bcrypt.compare(req.body.password, user[0].password)) {
        let accessToken = generateAccesToken(user[0].name);
        let refreshToken = generateRefreshToken(user[0].name);
        // add that refresh token to the server
        var toServerRefreshToken = new schemas.refreshTokens({ 'token': refreshToken, 'email': user[0].email });
        await toServerRefreshToken.save();
        //console.log(accessToken);
        return res.json({ accessToken: accessToken, refreshToken: refreshToken });
    }

    return res.sendStatus(401)
}
// get users info like bookamrks and recentread based on the accestoken
async function getUserInfo(req, res) {

    let tokenValid = isTokenValid(req.body.accessToken, process.env.ACCESS_TOKEN_SECERT)
    
    if (tokenValid == false) {
        return res.sendStatus(401);
    }
    //console.log(tokenValid)
    // info about bookmarks and recentRead we have on the server
    var userCloud = await findUser(tokenValid.name, tokenValid.name);
    userCloud = userCloud[0];
    //console.log(userCloud)
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
    //console.log(userCloud);
    //console.log(userCloud.bookmarks);
    // combine bookmarks

    if (reqBookmarks != undefined || reqBookmarks != null) {
        // go through all the bookmarks in the req if it doesn't include in our cloudsave then push it otherwise ignore and move on
        for (var i = 0; i < reqBookmarks.length; i++) {
            var isUnique = true;

            for (var k = 0; k < userCloud.bookmarks.length; k++) {
                if (userCloud.bookmarks[k].Index == reqBookmarks[i].Index) {
                    isUnique = false;
                    break;
                }
            }

            if (isUnique) {
                userCloud.bookmarks.push(reqBookmarks[i]);
            }
        }
    }
    // now save the user on the cloud with updated bookmarks and recentread
    await userCloud.save();
    
    return res.send({ 'bookmarks': userCloud.bookmarks, 'recentRead': userCloud.recentRead });
}
// new accestoken with the refresh token
async function getNewToken(req, res) {
    let refreshToken = req.body.refreshToken;
    let isTokeninServer = await schemas.refreshTokens.find({ 'token': refreshToken }); // => returns token if there otherwise an empty arry
    let tokenValid = isTokenValid(refreshToken, process.env.REFRESH_TOKEN_SECERT);

    if (tokenValid == false || isTokeninServer.length == 0) {
        console.log('uh ?')
        return res.sendStatus(401);
    }

    let newAcessToken = generateAccesToken(tokenValid.name);

    return res.send(newAcessToken);

}
// log out of the account
async function logOutUser(req, res) {
    
    let refreshToken = req.body.refreshToken;
    // get rid of the specfifc refreshtoken the user has so even if someone
    // somehow gets it its useless
    try {
        schemas.refreshTokens.findOneAndRemove({ 'token': refreshToken });
        return res.send('done');
    } catch (err) {
        console.log(err);
        return res.status(500).send(err);
    }
}

// remove the bookmark from the server
async function removeBookmark(req, res) {
    let tokenValid = isTokenValid(req.body.accessToken, process.env.ACCESS_TOKEN_SECERT)
    if (tokenValid == false) {
        return res.sendStatus(401);
    }
    var userCloud = await findUser(tokenValid.name, tokenValid.name);
    userCloud = userCloud[0];

    var reqBookmark = req.body.bookmark;

    // go through all the bookmarks of the user and remove the one that matches the req
    for (var i = 0; i < userCloud.bookmarks.length; i++) {
        if (userCloud.bookmarks[i].Index == reqBookmark.Index) {
            userCloud.bookmarks.splice(i, 1);
            break;
        }
    }
    await userCloud.save();
}

async function makeForgotPasswordLink(req, res) {
    let email = req.body.email;
    let user = await schemas.USERS.find({ 'email': email });

    if (user.length == 0) {
        return res.status(401).send('No user with that email!!');
    }

    user = user[0];
    userArry = {'name': user.name, 'email': user.email };

    let token = jwt.sign(userArry, process.env.FORGOT_PASSWORD_TOKEN_SECERT, { expiresIn: '15m' });
    console.log(token);

    let url = process.env.SERVER_LINK + 'manga/forgotPassword/' + token;
    
    var sentEmailResponse = await mailFunctions.sendMail(email, 'Reset Password', 'Click the link to reset your password: ' + url + '\n\nIf you did not request this email, please ignore it. Do not share this link with anyone.');
    // add the token to the database so we can check if its valid later
    await schemas.forgotPasswordTokens.create({ 'token': token });

    if (!sentEmailResponse) {
        return res.status(500).send('Error sending email!!');
    }

    return res.send('Email sent to ' + email + ' with link to change password !!');
}

async function changePassword(req, res) {
    let token = req.body.token;
    let newPassword = req.body.newPassword;
    let tokenValid = isTokenValid(token, process.env.FORGOT_PASSWORD_TOKEN_SECERT);
    let tokenInDatabase = await schemas.forgotPasswordTokens.findOne({ 'token': token });

    if (tokenValid == false || tokenInDatabase == null) {
        return res.status(401).send('Forgot password link expired!!');
    }
    

    let user = await schemas.USERS.find({ 'email': tokenValid.email });

    if (user.length == 0) {
        return res.status(401).send('No user with that email!!');
    }

    user = user[0];
    // save the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword;
    await user.save();

    // delete the token from the database so it can't be used again
    await schemas.forgotPasswordTokens.findOneAndRemove({ 'token': token });

    // remove all the refresh tokens for the user so they have to log in again
    await schemas.refreshTokens.deleteMany({ 'email': user.email });

    return res.status(200).send('done');
}

module.exports = {
    allUsers,
    registerUser,
    loginUser,
    getUserInfo,
    getNewToken,
    logOutUser,
    isTokenValid,
    removeBookmark,
    makeForgotPasswordLink,
    changePassword
}