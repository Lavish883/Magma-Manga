var longStrip = !window.location.href.includes("-page-");
var currentlyOnPage = window.location.href.split(`-page-`)[1];
var currentChapter;

document.getElementById("Login_nav").style.display = "none";
document.querySelector("[title='HomePage'] img").src = '/offline/navbar.png';

async function getImageURl() {
    var htmlArry = [];
    var cacheName = window.location.search.split("?")[1];
    // if cacheName has -page- then get rid of it
    if (cacheName.includes("-page-")) {
        cacheName = cacheName.split("-page-")[0];
    }
    console.log(cacheName);
    // open cache and get all the items in there
    var cache = await caches.open(cacheName);
    var cachedItems = await cache.keys();

    var req = await fetch(cachedItems[0].url)
    var resp = await req.json();

    currentChapter = resp;

    for (var i = 1; i < cachedItems.length; i++) {
        let item = cachedItems[i];
        htmlArry.push(`
            <img src="${item.url}" class="manga_page" />
        `)
    }

    document.getElementById("imgs").innerHTML = htmlArry.join('');
    intialize();
}

function changeReadingStyle(obj, userClicked = true) {
    // check if either longstrip is actived or not
    if (longStrip == true) {
        obj.children[0].classList.remove("fa-arrows-alt-v");
        obj.children[0].classList.add("fa-columns");
        obj.children[1].innerText = "Single Page";
        showImages('F');
        //console.log(currentlyOnPage);
        if (currentlyOnPage != undefined) {
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
}

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

// check if this chapter has been read or not
function checkIfItRead(chapterLink, recentRead) {
    for (var i = 0; i < recentRead.length; i++) {
        if (chapterLink == recentRead[i]) {
            return true;
        }
    }

    return false;
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

// show Images in single Page mode
function showImages(page) {
    // make all the pages display:none;
    var allImgs = document.getElementById('imgs');
    for (var i = 0; i < allImgs.childElementCount; i++) {
        if (!isNaN(page)) {
            allImgs.children[i].style.display = 'none';
        } else {
            //console.log('block')
            allImgs.children[i].style.display = 'block';
        }
    }
    if (!isNaN(page)) {
        allImgs.children[page - 1].style.display = 'block';
        document.getElementById("pageNumber").innerText = 'Page ' + page
        window.scrollTo(0, 0);
    }
}

function getOffset(element)
{
    if (!element.getClientRects().length)
    {
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
}

function intialize() {
    changeReadingStyle(document.getElementById("readingStyle"), false);
    showImages(parseInt(currentlyOnPage))
    document.querySelector("#read_options span").innerText = currentChapter.seriesName;
    document.querySelectorAll("#read_options span")[1].innerText = currentChapter.Type != null ? currentChapter.Type + ' ' + currentChapter.Chapter : 'Chapter ' + currentChapter.Chapter;

    window.addEventListener('scroll', function () {
        if (longStrip) {
            if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
                document.querySelector('header').style.display = 'none';
            } else {
                document.querySelector('header').style.display = 'block';
            }
        }
    })
    // add event listeners
    document.getElementById('imgs').addEventListener("click", movePage);
    document.body.addEventListener('keyup', movePage);
    changeBookMarkStatus(document.getElementById('bookMark'));
    setTimeout(addToRecentRead(currentChapter.ChapterLink), 1500)
}

// listen to page clicks either it is left or right
// if left go to previous page, if right go to next page
function movePage(event) {
    if (event.key == "ArrowDown" || event.key == "ArrowUp") return;
    
    if (event.type == 'click') {
        // varibles to check of the page clikc is lef tor right
        //console.log(event)
        let pWidth = parseInt(window.getComputedStyle(event.target).width);
        let pOffset = getOffset(event.target);
        var x = event.pageX - pOffset.left;

        if (pWidth / 2 > x) {   
            //console.log('left')
            currentlyOnPage--; // Left side of page is clicked
        } else {
            //console.log('right')
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
            alert('Chapter Ended')
            currentlyOnPage = currentChapter.Page;
            return;
        } else if (currentlyOnPage < 1) {
            alert('First Page');
            currentlyOnPage = 1;
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
}

getImageURl();