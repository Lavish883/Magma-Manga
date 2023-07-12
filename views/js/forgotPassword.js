async function changePassword(obj){
    let newPassword = document.querySelector('#ResetPassword [name=newPassword]')
    let confirmPassword = document.querySelector('#ResetPassword [name=confirmPassword]')


    if (newPassword.value != confirmPassword.value) {
        document.querySelector('#ResetPassword .errorBox').innerText = 'Please make sure passwords match !!'
        document.querySelector('#ResetPassword .errorBox').style.display = 'block';
        return;
    }

    if (newPassword.value == '' || confirmPassword.value == '') {
        document.querySelector('#ResetPassword .errorBox').innerText = 'Please fill all the fields !!'
        document.querySelector('#ResetPassword .errorBox').style.display = 'block';
        return;
    }

    // now show loading 
    obj.innerHTML += '&nbsp;<i class="fas fa-spinner fa-spin"></i>'
    obj.setAttribute("onclick", "")
    obj.style.cursor = 'not-allowed';
    obj.style.backgroundColor = "#247d8fb0";

    const settings = {
        method: 'POST',
        body: JSON.stringify({
            newPassword: newPassword.value,
            token: token
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    }

    const changePasswordReq = await fetch('/api/login/changePassword', settings)
    const res = await changePasswordReq.text();

    obj.innerHTML = 'Change Password';
    obj.setAttribute("onclick", "changePassword(this)")
    obj.style = '';

    if (changePasswordReq.status != 200){
        document.querySelector('#register .errorBox').classList.remove('successBox');
        document.querySelector('#ResetPassword .errorBox').innerText = res;
        document.querySelector('#ResetPassword .errorBox').style.display = 'block';
        return;
    }

    document.querySelector('#ResetPassword .errorBox').classList.add('successBox');
    document.querySelector('#ResetPassword .errorBox').innerText = 'Password changed successfully. Page will be redirected in 5 seconds !!';
    document.querySelector('#ResetPassword .errorBox').style.display = 'block';
    
    setTimeout(() => {
        window.location.href = '/manga/';
    }, 5000);
}