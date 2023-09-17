var gifSearchLastCalled = 0;
var gifSearchOpenedBy;


function autoResize(obj) {
    obj.style.height = 'auto';
    obj.style.height = obj.scrollHeight + 'px';
}

// scroll to the comment that was replied to
function scrollToReplied(obj) {
    let repliedObj = document.querySelector(`[commentId="${obj.parentElement.getAttribute("replyingTo")}"]`);
    window.scrollTo({
        "behavior": "smooth",
        "top": repliedObj.offsetTop - 200
    })

    var repliedBody = repliedObj.querySelector(".commentBody");
    // make the replied comment shake, if it has already been shaken, then reset the animation
    if (repliedBody.style.animation.includes("shake")) {
        repliedBody.style = "none";
        repliedBody.offsetHeight;
    } 
    repliedBody.style.animation = "shake 1s ease-in-out";
    
}

function makeCommentHTML(comment, isReply = false) {
    return `
    <div class="comment" commentId="${comment.id}" replyingTo="${isReply ? comment.replyingToId : ''}">
        ${isReply ? `<div onclick="scrollToReplied(this)" class="replyingToText">@Replying to ${comment.replyingTo}</div>` : ""}
        <div class="commentHeader">
            <div>
                <span class="commentUser">${comment.user}</span>
                <span class="commentTime">&middot; ${moment(comment.time).fromNow()}</span>
                <span class="commentTime">${comment.wasEdited == true ? "(Edited)" : ""}</span>
            </div>
            ${comment.isOwner == true ?
            `<div class="commentOptions">
                <div onclick="openEditComment(this)" title="Edit Comment" class="commentEdit">
                    <i class="fa-regular fa-pen-to-square"></i>
                </div>    
                <div onclick="deleteComment(this)" title="Delete Comment" class="commentDelete">
                    <i class="fa-solid fa-xmark"></i>
                </div>
            </div>`: ""
            }
        </div>
        <div class="commentBody">${comment.comment}</div>
        <div class="commentFooter">
            <div style="color:${comment.isLiked == true ? "#FF4500": ""}" onclick="likeOrDislikeComment(this, '/api/comments/likeComment')" class="commentLike">
                <i class="fa-solid fa-arrow-up-long"></i> &middot; ${comment.likes.length}
            </div>
            <div style="color:${comment.isDisliked == true ? "#7193FF": ""}" onclick="likeOrDislikeComment(this, '/api/comments/dislikeComment')" class="commentDislike">
                <i class="fa-solid fa-arrow-down-long"></i> &middot; ${comment.dislikes.length}
            </div>
            <div onclick="openReply(this)" class="commentReply">
                <i class="fa-solid fa-reply"></i> Reply
            </div>
        </div>
        <div class="replies">
            ${comment.replies == undefined ? "" : makeRepliesHTML(comment.replies)}
        </div>
    </div>
    `
}

function makeRepliesHTML(replies) {
    let htmlArry = [];
    for (var reply of replies) {
        htmlArry.push(makeCommentHTML(reply, true));
    }

    return htmlArry.join("");
}

async function getComments() {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "mangaPathName": window.location.pathname.split("-page-")[0],
            "accessToken": window.localStorage.getItem("accessToken"),
        })
    }

    let resp = await fetch("/api/comments/getComments", options);

    if (resp.status == 401) {
        await getNewAccesToken();
        return getComments();
    }

    let data = await resp.json();

    let commentHTML = [];
    for (var comment of data) {
        commentHTML.push(makeCommentHTML(comment));
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
    if (checkIfUserIsLoggedIn() == false) return;

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
            "mangaPathName": window.location.pathname.split("-page-")[0]
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
    autoResize(obj.parentElement.parentElement.parentElement.querySelector(".commentInput"));
}

async function getGifs(obj, add = false) {
    let offset = document.querySelector(".giphyResults").children.length;
    if (!add) {
        offset = 0;
    }
    let response = await fetch(`/api/comments/getGifs?q=${obj.value}&offset=${offset}`);
    let data = await response.json();

    var gifHTML = [];
    // if there are no results, then display a message
    if (data.length == 0 && add == false) {
        document.querySelector(".loadMoreCont").style.display = "none";
        document.querySelector(".giphyResults").innerHTML = "No results found";
    }

    if (add && data.length == 0) {
        document.querySelector(".loadMoreCont").style.display = "none";
    }

    for (var gif of data) {
        gifHTML.push(`
        <div onclick="selectGif(this)" class="gif">
            <image src="${gif}" ></video>
        </div>
        `);
    }

    if (add) {
        document.querySelector(".giphyResults").innerHTML += gifHTML.join("");
        document.querySelector(".loadMoreCont").style.display = "block";
    } else {
        document.querySelector(".giphyResults").innerHTML = gifHTML.join("");
        document.querySelector(".loadMoreCont").style.display = "block";
    }
}

function debounce(obj) {
    if (Date.now() - gifSearchLastCalled > 500) {
        gifSearchLastCalled = Date.now();
        getGifs(obj);
    } else {
        return setTimeout(() => {
            debounce(obj)
        }, 150)
    }
}

function selectGif(obj) {
    var commentArea = gifSearchOpenedBy.parentElement.parentElement.parentElement.querySelector(".commentInput");

    commentArea.innerHTML += `<img width="200" src="${obj.querySelector("img").src}" />`;

    toggleGifSearch();
    autoResize(commentArea);
}

function toggleGifSearch(obj = null) {
    if (document.querySelector(".giphyModal").style.display == "flex") {
        document.querySelector(".giphyModal").style.display = "none";
    } else {
        document.querySelector(".giphyModal").style.display = "flex";
        gifSearchOpenedBy = obj;
    }
}

async function likeOrDislikeComment(obj, url, fetchedCount = 1) {
    // first check if the user is logged in
    if (checkIfUserIsLoggedIn() == false) return;
    // fetchedCount is used to prevent infinite calls to getNewAccessToken
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "commentId": obj.parentElement.parentElement.getAttribute("commentId"),
            "accessToken": window.localStorage.getItem("accessToken"),
            "mangaPathName": window.location.pathname.split("-page-")[0]
        })
    }

    let resp = await fetch(url, options);
    
    if (resp.status == 401) {
        if (fetchedCount > 8) {
            alert("Failed to like comment, please try again later");
            return;
        }
        await getNewAccesToken();
        return likeComment(obj, url, fetchedCount + 1);
    }

    let data = await resp.text();
    getComments();
}

// basically html string that is used to create where the user can edit their comment or reply or post
// as they use the same base we can use the same function
function returnCommentEditorString(innerHtml = "", isEditing = false) {
    return `
    <div class="commentInput" contenteditable="true" placeholder="Write Comment Here ..." type="text" oninput="autoResize(this)">${innerHtml}</div>
    <div class="submitCommentFooter">
        <div style="display:flex;align-items:end;">
            <input type="checkbox">
            <span>Is Markdown ? </span>
        </div>  
        <div style="display:flex;align-items:center;justify-content:space-between;flex-direction:row;">
            <div class="submitButton" style="margin-right:10px;" onclick="toggleGifSearch(this)">
                <i class="fa-solid fa-image">&nbsp;</i>
                <span>Add GIF </span>
            </div>
            <div class="submitButton" onclick="${isEditing ? 'editComment(this)' :'replyToComment(this)'}">${isEditing ? "Finish Editing" : "Comment"}</div>
        </div>
    </div>
    `
}

function openReply(obj) {
    let replyingToUser = obj.parentElement.parentElement.querySelector(".commentUser").innerText;
    let divElement = document.createElement("div");
    divElement.classList.add("submitCommentCont");
    let htmlToInsert = `
        <span class="replyingToText">@Replying to ${replyingToUser}</span>
        ${returnCommentEditorString()}
    `
    divElement.innerHTML = htmlToInsert;
    obj.parentElement.parentElement.appendChild(divElement);
    
    window.scrollTo({
        "behavior": "smooth",
        "top": divElement.offsetTop - 200
    })
}

function checkIfUserIsLoggedIn() {
    // first check if the user is logged in
    if (window.localStorage.getItem("accessToken") == undefined || window.localStorage.getItem("refreshToken") == undefined) {
        alert("You must be logged in to like a comment! Log in or register now!");
        return false;
    }
    return true;
}

async function replyToComment(obj, fetchedCount = 1) {
    if (checkIfUserIsLoggedIn() == false) return;

    let isMarkdown = obj.parentElement.parentElement.querySelector("[type='checkbox'").checked;
    let comment = unescapeHTML(obj.parentElement.parentElement.parentElement.querySelector(".commentInput").innerHTML);

    const options = {
        method: "POST",
        headers: {  
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "comment": comment,
            "isMarkdown": isMarkdown,
            "accessToken": window.localStorage.getItem("accessToken"),
            "mangaPathName": window.location.pathname.split("-page-")[0],
            "commentId": obj.parentElement.parentElement.parentElement.parentElement.getAttribute("commentId"),
            "replyingTo": obj.parentElement.parentElement.parentElement.parentElement.querySelector(".commentUser").innerText
        })
    }

    let response = await fetch('/api/comments/replyToComment', options);

    if (response.status == 401) {
        if (fetchedCount > 8) {
            alert("Failed to submit comment, please try again later");
            return;
        }
        await getNewAccesToken();
        return replyToComment(obj, fetchedCount + 1);
    }

    let data = await response.text();
    getComments();
}

function openEditComment(obj) {
    obj.parentElement.parentElement.parentElement.querySelector(".commentBody").innerHTML = `
        <div class="submitCommentCont">
            ${returnCommentEditorString(obj.parentElement.parentElement.parentElement.querySelector(".commentBody").innerHTML, true)}
        </div>
    `
}

async function editComment(obj, fetchedCount = 1) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "comment": unescapeHTML(obj.parentElement.parentElement.parentElement.querySelector(".commentInput").innerHTML),
            "isMarkdown": obj.parentElement.parentElement.parentElement.querySelector("[type='checkbox'").checked,
            "accessToken": window.localStorage.getItem("accessToken"),
            "mangaPathName": window.location.pathname.split("-page-")[0],
            "commentId": obj.parentElement.parentElement.parentElement.parentElement.parentElement.getAttribute("commentid")
        })
    }

    let resp = await fetch("/api/comments/editComment", options);
    if (resp.status == 401) {
        if (fetchedCount > 8) {
            alert("Failed to edit comment, please try again later");
            return;
        }
        await getNewAccesToken();
        return editComment(obj, fetchedCount + 1);
    }

    let data = await resp.text();
    if (resp.status != 200) {
        alert(data);
    }

    getComments();
}

async function deleteComment(obj, fetchedCount = 1) {
    if (!confirm("Are you sure you want to delete this comment? It can not be recovered.")) return;

    const options = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "accessToken": window.localStorage.getItem("accessToken"),
            "mangaPathName": window.location.pathname.split("-page-")[0],
            "commentId": obj.parentElement.parentElement.parentElement.getAttribute("commentid")
        })
    }

    let resp = await fetch("/api/comments/deleteComment", options);
    if (resp.status == 401) {
        if (fetchedCount > 8) {
            alert("Failed to delete comment, please try again later");
            return;
        }
        await getNewAccesToken();
        return deleteComment(obj, fetchedCount + 1);
    }

    let data = await resp.text();
    if (resp.status != 200) {
        alert(data);
    }

    getComments();
}
        

getComments();