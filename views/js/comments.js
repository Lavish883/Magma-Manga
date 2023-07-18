function autoResize(obj) {
    obj.style.height = 'auto';
    obj.style.height = obj.scrollHeight + 'px';
}

async function getComments() {
    let resp = await fetch("/api/comments/getComments?mangaPathName=" + window.location.pathname);
    let data = await resp.json();

    let commentHTML =  [];
    for (let i = 0; i < data.length; i++) {
        commentHTML.push(`
        <div class="comment" commentId="${data[i].id}">
            <div class="commentHeader">
                <div class="commentUser">${data[i].user}</div>
                <div class="commentTime">${moment(data[i].time).fromNow()}</div>
            </div>
            <div class="commentBody">${data[i].comment}</div>
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


async function submitComment(obj, fetchedCount = 1) {
    // fetchedCount is used to prevent infinite calls to getNewAccessToken

    // check if the user is logged in
    if (window.localStorage.getItem("accessToken") == undefined || window.localStorage.getItem("refreshToken") == undefined) {
        alert("You must be logged in to comment! Log in or register now!");
        return;
    }

    let isMarkdown = obj.parentElement.querySelector("[type='checkbox'").checked;
    let comment = obj.parentElement.parentElement.querySelector(".commentInput").value

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

    getComments();
}

getComments();