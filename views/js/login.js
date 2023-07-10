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
    if (id === 'Register') {
        document.getElementById('loginBackground').innerHTML = `
                        <div class="" style="display:flex;flex-direction:column;">
                    <div id="headingForLog" class="headerofL">
                        <div><i class="fas fa-user-plus"></i> New Account</div>
                        <div onclick="toggleLoginModal()"><i class="fas fa-times"></i></div>
                    </div>
                    <div id="LoginError" class="error"></div>
                    <div class="contain_input">
                        <label for="userName">Username:</label>
                        <input spellcheck="false" autocomplete="off" id="userName" name="userName" />

                    <label id="userEmailLabel" for="userEmail">Email:</label>
                    <input type="email" style="margin:5px 0px" id="userEmail" name="userEmail" />

                    <label for="userPassword">Password:</label>
                        <input type="password" style="margin:5px 0px" id="userPassword" name="userPassword" /><i class="far fa-eye-slash"></i>

                    </div>
                    <div class="contain_switch_buttons">
                        <a onclick="changeSystem('Login')" id="changeRegister">&middot; Login</a>
                        <a onclick="changeSystem('Forgot')" id="changePassword">&nbsp;&nbsp;&middot; Forgot Password</a>
                    </div>
                    <div class="contain_close_button">
                        <a onclick="toggleLoginModal()">Close</a>
                        <a onclick="registerAccount()" class="register">Register</a>
                    </div>
                </div>
                    `
    } else if (id === 'Login') {
        document.getElementById('loginBackground').innerHTML = `
                        <div class="" style="display:flex;flex-direction:column;">
                    <div id="headingForLog" class="headerofL">
                        <div><i class="fas fa-sign-in-alt"></i> Login</div>
                        <div onclick="toggleLoginModal()"><i class="fas fa-times"></i></div>
                    </div>
                    <div id="LoginError" class="error"></div>
                    <div class="contain_input">
                        <label for="userName">Username/Email:</label>
                        <input autocomplete="off" spellcheck="false" id="userName" name="userName" />
                        <label for="userPassword">Password:</label>
                        <input type="password" style="margin:5px 0px" id="userPassword" name="userPassword" /><i class="far fa-eye-slash"></i>

                    </div>
                    <div class="contain_switch_buttons">
                        <a onclick="changeSystem('Register')">&middot; Register</a>
                        <a onclick="changeSystem('Forgot')">&nbsp;&nbsp;&middot; Forgot Password</a>
                    </div>
                    <div class="contain_close_button">
                        <a onclick="toggleLoginModal()">Close</a>
                        <a onclick="loginToAccount()" class="login">Login</a>
                    </div>
                </div>
                    `
    } else if (id === 'Forgot') {
        document.getElementById('loginBackground').innerHTML = `
                        <div class="" style="display:flex;flex-direction:column;">
                    <div id="headingForLog" class="headerofL">
                        <div><i class="fas fa-key"></i> Reset Password</div>
                        <div onclick="toggleLoginModal()"><i class="fas fa-times"></i></div>
                    </div>
                    <div id="LoginError" class="error"></div>
                    <div class="contain_input">

                    <label id="userEmailLabel" for="userEmail">Email:</label>
                    <input type="email" style="margin:5px 0px" id="userEmail" name="userEmail" />

                    </div>
                    <div class="contain_switch_buttons">
                        <a onclick="changeSystem('Register')">&middot; Register</a>
                        <a onclick="changeSystem('Login')">&nbsp;&nbsp;&middot; Login</a>
                    </div>
                    <div class="contain_close_button">
                        <a onclick="toggleLoginModal()">Close</a>
                        <a onclick="processLogin()" class="forgot">Reset Password</a>
                    </div>
                </div>
                    `
    }
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
async function loginToAccount() {
    let userName = document.querySelector('[name=userName]')
    let password = document.querySelector('[name=userPassword]')

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
        alert('wrong username or password')
    }
    let resp = await loginRequest.json();

    window.localStorage.setItem('accessToken', resp.accessToken);
    window.localStorage.setItem('refreshToken', resp.refreshToken);

    await getUserInfo()
    alert('logged in')
    window.location.reload();
}
// register an account
async function registerAccount() {
    let userName = document.querySelector('[name=userName]')
    let password = document.querySelector('[name=userPassword]')
    let email = document.querySelector('[name=userEmail]')

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

    alert(resp)

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
    const url = window.location.origin + '/api/login/userInfo';
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