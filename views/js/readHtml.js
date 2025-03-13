var longStrip = !window.location.href.includes("-page-");
var currentlyOnPage = window.location.href.split(`-page-`)[1] == 'end' ? currentChapter.Page : parseInt(window.location.href.split(`-page-`)[1]);
var params = new URLSearchParams(window.location.search);


//add to recentread localstorage array
function addToRecentRead(chapterLink) {
    // get previous stuff
    var recentRead = JSON.parse(window.localStorage.getItem("recentRead"));
    if (recentRead == null || recentRead.length == 0 || recentRead == undefined) {
        recentRead = [];
        console.log('made it an arry')
    }
    // add to localstorage
    if (!checkIfItRead(chapterLink, recentRead)) {
        recentRead.push(chapterLink)
        window.localStorage.setItem("recentRead", JSON.stringify(recentRead));
        console.log('added')
    }
    if (window.localStorage.getItem('accessToken') != undefined || window.localStorage.getItem("accessToken") != null) {
        getUserInfo();
    }
}
// check if this chapter has been read or not
function checkIfItRead(chapterLink, recentRead) {
    for (var i = 0; i < recentRead.length; i++) {
        if (chapterLink == recentRead[i]) {
            return true;
        }
    }

    return false;
}

// check if the chapter has been downloaded to the cache or not
function checkIfItDownloaded(chapterLink, downloaded) {

}

// check if manga is bookmarked or not
function checkIfBookmarked() {
    var bookMarks = JSON.parse(window.localStorage.getItem('bookmarks'));
    if (bookMarks == null) {
        bookMarks = [];
    }
    for (var i = 0; i < bookMarks.length; i++) {
        let manga = bookMarks[i];
        if (manga.Index == currentChapter.indexName) {
            return true
        }
    }
    return false
}
// change the staus of bookmark that is displayed to the user
function changeBookMarkStatus(obj) {
    if (checkIfBookmarked()) {
        obj.children[0].classList.remove('fa-thumbtack');
        obj.children[0].classList.add('fa-eraser');
        obj.children[1].innerText = 'Bookmarked'
    } else {
        obj.children[0].classList.add('fa-thumbtack');
        obj.children[0].classList.remove('fa-eraser');
        obj.children[1].innerText = 'Bookmark'
    }
}
// bookmark and change the user webpage
function bookMark(obj) {
    var bookMarks = JSON.parse(window.localStorage.getItem('bookmarks'));
    var bookMarked = checkIfBookmarked()

    if (bookMarks == null) {
        bookMarks = [];
    }

    if (!bookMarked) {
        bookMarks.push({ 'Series': currentChapter.seriesName, 'Index': currentChapter.indexName });
        addBookmark({ 'Series': currentChapter.seriesName, 'Index': currentChapter.indexName });
    } else {
        // remove the manga
        for (var i = bookMarks.length - 1; i >= 0; i--) {
            let manga = bookMarks[i];
            if (manga.Index == currentChapter.indexName) {
                bookMarks.splice(i, 1);
                console.log('removed')
                removeBookmark(manga);
                break;
            }
        }
    }
    window.localStorage.setItem('bookmarks', JSON.stringify(bookMarks));
    changeBookMarkStatus(obj)
}

function changeReadingStyle(obj, userClicked = true) {
    // check if either longstrip is actived or not
    if (longStrip == true) {
        obj.children[0].classList.remove("fa-arrows-alt-v");
        obj.children[0].classList.add("fa-columns");
        obj.children[1].innerText = "Single Page";
        showImages('F');
        console.log(currentlyOnPage);
        if (currentlyOnPage != undefined && currentlyOnPage != 'null' && !isNaN(currentlyOnPage)) {
            document.getElementById('imgs').children[currentlyOnPage - 1].scrollIntoView();
        }
        currentlyOnPage = 'F';
    } else {
        obj.children[0].classList.add("fa-arrows-alt-v");
        obj.children[0].classList.remove("fa-columns");
        obj.children[1].innerText = "Long Strip"
        if (userClicked) {
            currentlyOnPage = 1;
            showImages(currentlyOnPage);
        }
    }
    if (userClicked) {
        updateURL();
        updateContineReading();
    }
}
// show Images in single Page mode
function showImages(page) {
    // make all the pages display:none;
    var allImgs = document.getElementById('imgs');
    for (var i = 0; i < allImgs.childElementCount; i++) {
        if (!isNaN(page)) {
            allImgs.children[i].style.display = 'none';
        } else {
            console.log('block')
            allImgs.children[i].style.display = 'block';
        }
    }
    if (!isNaN(page)) {
        allImgs.children[page - 1].style.display = 'block';
        document.getElementById("pageNumber").innerText = 'Page ' + page
        window.scrollTo(0, 0);
    }
}

function getOffset(element) {
    if (!element.getClientRects().length) {
        return { top: 0, left: 0 };
    }

    let rect = element.getBoundingClientRect();
    let win = element.ownerDocument.defaultView;
    return (
        {
            top: rect.top + win.pageYOffset,
            left: rect.left + win.pageXOffset
        });
}

// listen to page clicks either it is left or right

function movePage(event) {
    if (event.type == "keyup" && event.key != "ArrowLeft" && event.key != "ArrowRight") {
        return;
    }

    if (event.type == 'click') {
        // varibles to check of the page clikc is lef tor right
        let pWidth = parseInt(window.getComputedStyle(event.target).width);
        let pOffset = getOffset(event.target);
        var x = event.pageX - pOffset.left;

        if (pWidth / 2 > x) {
            currentlyOnPage--; // Left side of page is clicked
        } else {
            currentlyOnPage++; // Right Side of the page is clicked
        }
    } else {
        if (event.key == "ArrowLeft") { // Left Side of the page is clicked
            currentlyOnPage--;
        } else if (event.key == "ArrowRight") { // Right side of page is clicked
            currentlyOnPage++;
        }
    }

    if (longStrip == false) { // see if we need to go on the next chapter or not
        if (currentlyOnPage > currentChapter.Page) {
            moveChapter('next')
            return;
        } else if (currentlyOnPage < 1) {
            moveChapter('prev')
            return;
        }
    }

    if (longStrip == false) {
        showImages(currentlyOnPage)
    } else {
        var ScrollToPlease = window.pageYOffset + 700 || document.documentElement.scrollTop + 700
        window.scroll({
            top: ScrollToPlease,
            left: 0,
            behavior: 'smooth'
        })
    }
    updateURL();
    updateContineReading();
}

// go to the next chapter
// direction meaning either next chapter or previous chapter
function moveChapter(direction, goToBeginning = false) {
    var currentChapterIndx = chapters.findIndex(elem => elem.ChapterLink == currentChapter.ChapterLink)
    var chapterToLookIndx = direction == 'next' ? currentChapterIndx - 1 : currentChapterIndx + 1;
    try {
        if (longStrip) {
            window.location.href = window.location.origin + '/manga/read/' + chapters[chapterToLookIndx].ChapterLink;
            return;
        } else {
            let pageToStart = goToBeginning ? 1 : 'end';
            let chapterPageToStart = direction == 'next' ? '-page-1' : '-page-' + pageToStart;
            window.location.href = window.location.origin + '/manga/read/' + chapters[chapterToLookIndx].ChapterLink + chapterPageToStart;
            return;
        }
    } catch (err) {
        alert('No more next chapters. You are all caught up');
        console.log(err);
    }
}

// update url accordingly
function updateURL() {
    if (longStrip) {
        window.history.pushState({}, '', window.location.origin + '/manga/read/' + currentChapter.ChapterLink);
    } else {
        window.history.pushState({}, '', window.location.origin + '/manga/read/' + currentChapter.ChapterLink + '-page-' + currentlyOnPage);
    }
}
// fixes thin navbar
function fixNavbar() {
    document.querySelector('#thinNavbarChapters').style.display = 'block';
    document.querySelector('#thinNavbarChapters #chapterNum').innerText = currentChapter.chapterName;
}
// event listeners 
// listen for page clicks
document.getElementById('imgs').addEventListener("click", movePage);
document.body.addEventListener('keyup', movePage);


// function calls
changeReadingStyle(document.getElementById("readingStyle"), false)
showImages(parseInt(currentlyOnPage))
updateURL();
setTimeout(() => { addContinueReading() }, 500)
document.body.addEventListener('click', checkIfBookmarked)
fixNavbar();
changeBookMarkStatus(document.getElementById("bookMark"));

window.addEventListener('scroll', function () {
    if (longStrip) {
        if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
            document.querySelector('header').style.display = 'none';
        } else {
            document.querySelector('header').style.display = 'block';
        }
    }
    if (longStrip) {
        updateContineReading();
    }
})

window.onload = function () {
    if (params.has('scrollTo')) {
        var scrollToYPos = parseFloat(params.get('scrollTo'));
        if (!isNaN(scrollToYPos)) {
            window.scrollTo(0, scrollToYPos);
        }
    }
}

function findIndxInList(itemToFind, arry, key) {
    for (var i = 0; i < arry.length; i++) {
        if (arry[i][key] == itemToFind) {
            return i;
        }
    }
    return -1;
}

// add to continue reading
async function addContinueReading() {
    var continueReading = JSON.parse(window.localStorage.getItem("continueReading"));
    if (continueReading == null || continueReading.length == 0 || continueReading == undefined) {
        continueReading = [];
    }
    var indx = findIndxInList(currentChapter.indexName, continueReading, 'index');
    // if the same series is already in the list then update the chapter and so on
    if (indx != -1) continueReading.splice(indx, 1);

    continueReading.unshift({
        'chapterLink': currentChapter.ChapterLink,
        'series': currentChapter.seriesName,
        'chapter': currentChapter.chapterName,
        'index': currentChapter.indexName,
        'page': currentlyOnPage,
        'longStrip': longStrip,
        'scrollPosY': window.scrollY
    });
    window.localStorage.setItem("continueReading", JSON.stringify(continueReading));
    if (window.localStorage.getItem('accessToken') != undefined && window.localStorage.getItem("accessToken") != null && window.localStorage.getItem('refreshToken') != undefined && window.localStorage.getItem("refreshToken") != null) {
        await updateCReadingOnServer();
        setTimeout(() => { addToRecentRead(window.location.pathname.replace(`/manga/read/`, '').split(`-page-`)[0]) }, 1000)
    }
}

function updateContineReading() {
    var continueReading = JSON.parse(window.localStorage.getItem("continueReading"));
    for (var i = 0; i < continueReading.length; i++) {
        if (continueReading[i].chapterLink == currentChapter.ChapterLink) {
            continueReading[i].page = currentlyOnPage;
            continueReading[i].longStrip = longStrip;
            continueReading[i].scrollPosY = window.scrollY
            window.localStorage.setItem("continueReading", JSON.stringify(continueReading));
        }
    }
}