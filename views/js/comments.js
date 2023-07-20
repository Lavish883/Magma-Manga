var gifSearchLastCalled = 0;
var gifSearchOpenedBy;


function autoResize(obj) {
    obj.style.height = 'auto';
    obj.style.height = obj.scrollHeight + 'px';
}

async function getComments() {
    let resp = await fetch("/api/comments/getComments?mangaPathName=" + window.location.pathname);
    let data = await resp.json();

    let commentHTML = [];
    for (var comment of data) {
        commentHTML.push(`
        <div class="comment" commentId="${comment.id}">
            <div class="commentHeader">
                <div>
                    <span class="commentUser">${comment.user}</span>
                    <span class="commentTime">&middot; ${moment(comment.time).fromNow()}</span>
                </div>
                <div class="commentOptions">
                    <div class="commentEdit">Edit</div>    
                    <div class="commentDelete">Delete</div>
                </div>
            </div>
            <div class="commentBody">${comment.comment}</div>
            <div class="commentFooter">
                <div class="commentLike">Like</div>
                <div class="commentDislike">Dislike</div>
                <div class="commentReply">Reply</div>
            </div>
        </div>
        `);
    }
    document.querySelector("#comments").innerHTML = commentHTML.join("");
    document.getElementById("commentCount").innerHTML = `Comments (${data.length})`
}

function unescapeHTML(str) {
    str = str.replaceAll(/&lt;/g, '<');
    str = str.replaceAll(/&gt;/g, '>')
    str = str.replaceAll(/&amp;/g, '&');
    return str;
}

async function submitComment(obj, fetchedCount = 1) {
    // fetchedCount is used to prevent infinite calls to getNewAccessToken

    // check if the user is logged in
    if (window.localStorage.getItem("accessToken") == undefined || window.localStorage.getItem("refreshToken") == undefined) {
        alert("You must be logged in to comment! Log in or register now!");
        return;
    }

    let isMarkdown = obj.parentElement.parentElement.querySelector("[type='checkbox'").checked;
    let comment = unescapeHTML(obj.parentElement.parentElement.parentElement.querySelector(".commentInput").innerHTML);

    // try to submit comment, if it fails and the reason of failing is
    // expired token, then refresh the token and try again
    // if it fails again, then refreshToken failed, so log out

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "comment": comment,
            "isMarkdown": isMarkdown,
            "accessToken": window.localStorage.getItem("accessToken"),
            "mangaPathName": window.location.pathname
        })
    }

    let response = await fetch("/api/comments/postComment", options);

    if (response.status == 401) {
        if (fetchedCount > 8) {
            alert("Failed to submit comment, please try again later");
            return;
        }
        await getNewAccesToken();
        return submitComment(obj, fetchedCount + 1);
    }

    let data = await response.text();
    if (response.status == 200) {
        obj.parentElement.parentElement.parentElement.querySelector(".commentInput").innerHTML = "";
        obj.parentElement.parentElement.parentElement.querySelector("[type='checkbox'").checked = false;
    }

    getComments();
}

async function getGifs(obj) {
    let response = await fetch(`/api/comments/getGifs?q=${obj.value}&offset=0`);
    let data = await response.json();

    var gifHTML = [];
    for (var gif of data) {
        gifHTML.push(`
        <div onclick="selectGif(this)" class="gif">
            <image src="${gif}" ></video>
        </div>
        `);
    }
    document.querySelector(".giphyResults").innerHTML = gifHTML.join("");
}

function debounce(obj) {
    if (Date.now() - gifSearchLastCalled > 500) {
        gifSearchLastCalled = Date.now();
        getGifs(obj);
    }
}

function selectGif(obj) {
    var commentArea = gifSearchOpenedBy.parentElement.parentElement.parentElement.querySelector(".commentInput");

    commentArea.innerText += `<img width="200" src="${obj.querySelector("img").src}" />`;

    toggleGifSearch();
}

function toggleGifSearch(obj = null) {
    if (document.querySelector(".giphyModal").style.display == "flex") {
        document.querySelector(".giphyModal").style.display = "none";
    } else {
        document.querySelector(".giphyModal").style.display = "flex";
        gifSearchOpenedBy = obj;
    }
}


getComments();