async function getAllUserInfo() {
    const settings = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'accessToken': window.localStorage.getItem('accessToken'),
        })
    }

    let req = await fetch(window.location.origin + '/api/manga/allUserInfo', settings);
    if (req.status == 401) {
        await getNewAccesToken();
        return await getAllUserInfo();
    }
    let resp = await req.json();
    return resp;
}

async function makeSubscribedMangaList(arry) {
    let htmlArry = [];
    for (let i = 0; i < arry.length; i++) {
        let subscribed = (arry[i].subscribed == true || undefined) ? true : false;

        htmlArry.push(`
            <div style="display:flex; flex-direction:row;margin:10px 0px">
                <input type="checkbox" Series="${arry[i].Series}" Index="${arry[i].Index}" ${subscribed == true ? "checked": ""} />
                <div style="cursor:pointer;" onclick="toggleOptionSelect(this)">${arry[i].Series}</div>
            </div>
        `);
    }
    document.getElementById('subscribedMangaList').innerHTML = htmlArry.join('');
}

function toggleAllSelect(obj, selectAll) {
    let checkboxes = obj.parentElement.parentElement.querySelectorAll("[type='checkbox']");
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = selectAll;
    }
}

function getSubscribedMangaList() {
    let checkboxes = document.getElementById('subscribedMangaList').querySelectorAll("[type='checkbox']");
    let arry = [];
    for (let i = 0; i < checkboxes.length; i++) {
        arry.push({
            'Series': checkboxes[i].getAttribute('Series'),
            'Index': checkboxes[i].getAttribute('Index'),
            'subscribed': checkboxes[i].checked
        });
    }
    return arry;
}

async function updateSubscribedMangaList(obj = null) {
    const settings = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'accessToken': window.localStorage.getItem('accessToken'),
            'subscribed': getSubscribedMangaList()
        })
    }

    if (obj != null) {
        obj.innerHTML = 'Updating...';
        obj.setAttribute("disabled", true);
    }

    let req = await fetch(window.location.origin + '/api/manga/updateSubscribedMangaList', settings);
    if (req.status == 401) {
        await getNewAccesToken();
        return await updateSubscribedMangaList();
    }

    let resp = await req.text();

    if (req.status != 200) {
        alert("Error updating subscribed manga list. Please try again later.");
    } else {
        alert("Subscribed manga list updated successfully.");
    }

    if (obj != null) {
        obj.innerHTML = 'Update';
        obj.removeAttribute("disabled");
    }
}

function toggleOptionSelect(obj) {
    let checkbox = obj.parentElement.querySelector("[type='checkbox']");
    checkbox.checked = !checkbox.checked;
}

(async () => {
    let userInfo = await getAllUserInfo();
    await makeSubscribedMangaList(userInfo.subscribed);
})();