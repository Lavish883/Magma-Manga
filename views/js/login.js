// toggle Login modal turn on and off
function toggleLoginModal() {
    var modalBackground = document.getElementById('modal_background');
    var loginBackground = document.getElementById('loginBackground');
    // if the login modal is set siaply none mean turn it on and vice versa
    if (modalBackground.style.display == 'none') {
        modalBackground.style.display = 'block';
        loginBackground.style.top = '50px';
        loginBackground.style.opacity = '1';
    } else {
        modalBackground.style.display = 'none';
        loginBackground.style.top = '-500px';
        loginBackground.style.opacity = '0';
    }
}
// toggle bewteen register, login, and forgot password
function changeSystem(id) {
    var idArry = ['login', 'register', 'forgotPassword'];
    for (var i = 0; i < idArry.length; i++) {
        document.getElementById(idArry[i]).style.display = 'none';
    }

    document.getElementById(id).style.display = 'flex';
}
// activate dropdown on click
function activateDropdown(obj) {
    obj.nextElementSibling.style.display = 'flex';
}
// toogle password shown and not
function togglePasswordVisbilty(obj) {
    if (obj.parentElement.children[0].type == 'password') {
        obj.parentElement.children[0].type = '';
        obj.classList.add('fa-eye');
        obj.classList.remove('fa-eye-slash');
    } else {
        obj.parentElement.children[0].type = 'password';
        obj.classList.remove('fa-eye');
        obj.classList.add('fa-eye-slash');
    }
}
// login 
async function loginToAccount(obj) {
    let userName = document.querySelector('#login [name=userName]')
    let password = document.querySelector('#login [name=userPassword]')

    // now show loading 
    obj.innerHTML += '&nbsp;<i class="fas fa-spinner fa-spin"></i>'
    obj.setAttribute("onclick", "")
    obj.style.cursor = 'not-allowed';
    obj.style.backgroundColor = "#80bdff";

    if (userName.value == '' || password.value == '') {
        document.querySelector('#login .errorBox').innerText = 'Please fill out all fields before submitting!!'
        document.querySelector('#login .errorBox').style.display = 'block';

        // now show loading 
        obj.innerHTML = 'Login'
        obj.setAttribute("onclick", "loginToAccount(this)")
        obj.style = '';
        return;
    }

    const url = window.location.origin + '/api/login/login';
    const settings = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "userName": userName.value,
            "password": password.value
        })
    }

    let loginRequest = await fetch(url, settings);

    if (loginRequest.status == 401) {
        document.querySelector('#login .errorBox').innerText = 'Wrong username or password!!'
        document.querySelector('#login .errorBox').style.display = 'block';

        // now show loading 
        obj.innerHTML = 'Login'
        obj.setAttribute("onclick", "loginToAccount(this)")
        obj.style = '';
        return;
    }

    let resp = await loginRequest.json();

    window.localStorage.setItem('accessToken', resp.accessToken);
    window.localStorage.setItem('refreshToken', resp.refreshToken);

    await getUserInfo()
    window.location.reload();
}
// register an account
async function registerAccount(obj) {
    let userName = document.querySelector('#register [name=userName]')
    let password = document.querySelector('#register [name=userPassword]')
    let email = document.querySelector('#register [name=userEmail]')

    // now show loading 
    obj.innerHTML += '&nbsp;<i class="fas fa-spinner fa-spin"></i>'
    obj.setAttribute("onclick", "")
    obj.style.cursor = 'not-allowed';
    obj.style.backgroundColor = "#28a745b0";


    if (userName.value == '' || password.value == '' || email.value == '') {
        document.querySelector('#register .errorBox').classList.remove('successBox');
        document.querySelector('#register .errorBox').innerText = 'Please fill out all fields before submitting!!'
        document.querySelector('#register .errorBox').style.display = 'block';

        obj.innerHTML = 'Register'
        obj.setAttribute("onclick", "registerAccount(this)")
        obj.style = '';        
        return;
    }

    const url = window.location.origin + '/api/login/register';
    const settings = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "name": userName.value,
            "password": password.value,
            "email": email.value,
            "recentRead": JSON.parse(window.localStorage.getItem('recentRead')),
            "bookmarks": JSON.parse(window.localStorage.getItem('bookmarks'))
        })
    }

    let registerRequest = await fetch(url, settings);
    let resp = await registerRequest.text();

    obj.innerHTML = 'Register'
    obj.setAttribute("onclick", "registerAccount(this)")
    obj.style = '';

    if (registerRequest.status != 200) {
        document.querySelector('#register .errorBox').classList.remove('successBox');
        document.querySelector('#register .errorBox').innerText = resp
        document.querySelector('#register .errorBox').style.display = 'block';
        return;
    }

    document.querySelector('#register .errorBox').innerText = resp
    document.querySelector('#register .errorBox').classList.add('successBox');
    document.querySelector('#register .errorBox').style.display = 'block';
}
// forgot password
async function forgotPassword(obj) {
    let email = document.querySelector('#forgotPassword [name=userEmail]')

    // now show loading 
    obj.innerHTML += '&nbsp;<i class="fas fa-spinner fa-spin"></i>'
    obj.setAttribute("onclick", "")
    obj.style.cursor = 'not-allowed';
    obj.style.backgroundColor = "#dc3545bd";

    if (email.value == '') {
        document.querySelector('#forgotPassword .errorBox').innerText = 'Please fill out all fields before submitting!!'
        document.querySelector('#forgotPassword .errorBox').style.display = 'block';
        
        obj.innerHTML = 'Reset Password';
        obj.setAttribute("onclick", "forgotPassword(this)")
        obj.style = '';
        return;
    }

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "email": email.value,
        })
    }

    let forgotPasswordRequest = await fetch('/api/login/forgotPassword', options);
    let resp = await forgotPasswordRequest.text();

    obj.innerHTML = 'Reset Password';
    obj.setAttribute("onclick", "forgotPassword(this)")
    obj.style = '';

    if (forgotPasswordRequest.status != 200) {
        document.querySelector('#register .errorBox').classList.remove('successBox');
        document.querySelector('#forgotPassword .errorBox').innerText = resp
        document.querySelector('#forgotPassword .errorBox').style.display = 'block';
        return;
    }

    document.querySelector('#forgotPassword .errorBox').innerText = resp
    document.querySelector('#forgotPassword .errorBox').classList.add('successBox');
    document.querySelector('#forgotPassword .errorBox').style.display = 'block';
}

// get new acces token when it is expired
async function getNewAccesToken() {
    const url = window.location.origin + '/api/login/newAccessToken';
    const settings = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "refreshToken": window.localStorage.getItem("refreshToken"),
        })
    }

    let newTokenRequest = await fetch(url, settings);
    // if the refresh token is expired log out
    if (newTokenRequest.status == 401) {
        alert('your session has expired');
        await logOutUser();
        return;
    }
    let resp = await newTokenRequest.text();

    window.localStorage.setItem('accessToken', resp)
}
// get info from the cloud and combine it with yours
async function getUserInfo() {
    const url = window.location.origin + '/api/login/userInfo';
    const settings = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "accessToken": window.localStorage.getItem("accessToken"),
            "recentRead": JSON.parse(window.localStorage.getItem('recentRead')),
            "bookmarks": JSON.parse(window.localStorage.getItem('bookmarks'))
        })
    }

    let userInfoRequest = await fetch(url, settings)

    if (userInfoRequest.status == 401) {
        await getNewAccesToken();
        return getUserInfo();
    }

    let resp = await userInfoRequest.json();

    window.localStorage.setItem('recentRead', JSON.stringify(resp.recentRead))
    window.localStorage.setItem('bookmarks', JSON.stringify(resp.bookmarks))

    console.log(resp);
}
// logout of the user
async function logOutUser() {
    const url = window.location.origin + '/api/login/logout';
    const settings = {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "refreshToken": window.localStorage.getItem("refreshToken"),
        })
    }

    let logOutRequest = await fetch(url, settings);
    let resp = await logOutRequest.text();

    alert('finished logging out')
    console.log(resp);

    window.localStorage.clear();
    window.location.reload();
}

async function removeBookmark(bookmark) {
    const options = {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "accessToken": window.localStorage.getItem("accessToken"),
            "bookmark": bookmark
        })
    }
    
    let removeBookmarkRequest = await fetch('/api/login/removeBookmark', options);
    if (removeBookmarkRequest.status == 401) {
        await getNewAccesToken();
        return removeBookmark(bookmark);
    }

    let resp = await removeBookmarkRequest.text();
    console.log(resp);
}


// get the updated info from the cloud when u go to the bookmarks
if (window.location.href.includes('bookmarks')) {
    if (window.localStorage.getItem('accessToken') != null && window.localStorage.getItem('refreshToken') != null) {
        console.log('updating all info')
        getUserInfo();
    }
}