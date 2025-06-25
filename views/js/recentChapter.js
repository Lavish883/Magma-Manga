/*
async function getSearchDirectory() {
    let searchPageInfo = await fetch(window.location.origin + '/api/searchPage');
    let resp = await searchPageInfo.json();

    // set the directory in local storage
    //window.localStorage.setItem('directory', JSON.stringify(resp));
    //return resp;

    filterManga(resp);
}

// makes loading time faster by loading it instalty from local storage and then in background fething the new data
async function getDirectoryFromStorage() {
    var directoryInStorage = window.localStorage.getItem('directory');
    // see if directory in storage is valid json or not
    if (directoryInStorage != null || directoryInStorage != undefined) {
        try {
            directoryInStorage = JSON.parse(directoryInStorage);
        } catch (err) {
            // if error in json meaning that directory is not valid it needs to be fetched
            var newDirectory = await getSearchDirectory();
            window.localStorage.setItem('directory', JSON.stringify(newDirectory));
            return filterManga(newDirectory);
        }
        directory = directoryInStorage;
        filterManga(directory);
        getSearchDirectory();
    } else {
        // if there exits no directory fetch it
        var newDirectory = await getSearchDirectory();
        window.localStorage.setItem('directory', JSON.stringify(newDirectory));
        return filterManga(newDirectory);
    }
}

// fix date on the manga
function calcDateForMangaPage(e) {
    var t = moment(e).subtract(9, "hour")
    n = moment(),
        m = n.diff(t, "hours");
    return n.isSame(t, "d") ? moment(e).subtract(9, "hour").fromNow() : m < 24 ? moment(e).subtract(9, "hour").calendar() : moment(e).subtract(9, "hour").format("L");
}
*/
function makeSubbedNewManga(manga) {

  if (window.location.href.includes("mangaapi")) {
    var image = '//axiostrailbaby.lavishkumar1.repl.co/sendImage/' + ('temp.compsci88.com/cover/' + manga.IndexName + '.jpg').replaceAll('/', ' ')
  } else {
    var image = "//temp.compsci88.com/cover/normal/" + manga.mangaId + ".webp";
  }

  return `
    <div class="latest_chapters_item">
        <a href="/manga/manga/${manga.IndexName}" title="${manga.SeriesName}">
            ${manga.isSus ? `<div class="red_overlay"><i class="fa-solid fa-circle-question" title="This manga might be Hentai (manga porn)"></i></div>` : ''}
            <img src="${image}" width="90" />
        </a>
        <a style="display:contents;" href="${"/manga/read/" + manga.ChapterLink + '-page-1'}" title="${manga.SeriesName + "&nbsp;" + manga.Chapter}">
            <div style="margin-left:15px; margin-top:8px;">
                <div class="latest_chapters_info">
                    ${manga.isPopular ? `<i style="color:red" class="fas fa-fire-alt"></i>` : ''}
                    ${manga.isCompleted ? `<i style="color:darkorange" class="fas fa-check-circle"></i>` : ''}
                    <span>${manga.SeriesName}</span>
                </div>
                <div style="margin-top:0px;">
                    <i style="font-size:15px;color:black;" class="far fa-file"></i>
                <span style="font-size:14px;font-weight:500;color:black;">${manga.Chapter}</span>
            </div>
            <div style="margin-top:1px;">
                <i style="font-size:15px;color:black;" class="far fa-clock"></i>
                <span style="font-size:14px;font-weight:500;color:black;">${manga.Date}</span>
            </div>
            </div>
        </a>
    </div>
    `
}

async function filterManga(directory) {
    var userBookmarks = window.localStorage.getItem('bookmarks');
    if (userBookmarks == null || userBookmarks == undefined) {
        document.getElementById('newSubscribedChapters').innerHTML = `<div style="color:black;">You have no bookmarks. Add some to use this feauture !!</div>`
        displayNewChapters();
        return;
    }

    userBookmarks = JSON.parse(userBookmarks);

    // make an array of all the manga bookmarked to just index names
    var subbedManga = [];
    var newMangaHTML = [];
    for (var i = 0; i < userBookmarks.length; i++) {
        subbedManga.push(userBookmarks[i].Index);
    }

    // now go through the directory and see any manga matches what we are looking for
    for (var i = 0; i < directory.length; i++) {
        let manga = directory[i];
        let isMangaSubbed = subbedManga.indexOf(manga.IndexName);
        // if it isnt subbed we dont care
        if (isMangaSubbed == -1) continue;
       // if it is more than a day old we dont care
        if (manga.Date.includes('day')) continue; 
        newMangaHTML.push(makeSubbedNewManga(manga));
    }
    document.getElementById('newSubscribedChapters').innerHTML = newMangaHTML.join('');
    displayNewChapters();
}


function displayNewChapters() {
    document.getElementById('main').classList.remove('none');
    document.getElementById('loading').classList.add('none');
}

async function getLatestChapters(){
    let latestChapters = await fetch(window.location.origin + '/api/manga/latestChapters');
    let resp = await latestChapters.json();
    console.log(resp);
    filterManga(resp);
}

getLatestChapters();