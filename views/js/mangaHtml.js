function isChapterRead(chapterLink) {
    if (allChaptersRead == null || allChaptersRead == undefined) {
        allChaptersRead = [];
    }
    // conditon which checks if any elm is equal to chapterLink
    for (var i = 0; i < allChaptersRead.length; i++) {
        if (allChaptersRead[i] == chapterLink) {
            return true
        }
    }
    return false
}

// check if the chapter has been downloaded to the cache or not
function isChapterDownloaded(chapterLink, downloaded) {
    for (var i = 0; i < downloaded.length; i++) {
        if (downloaded[i] == chapterLink) {
            return true
        }
    }
    return false
}

async function cacheInfoAboutManga(){
    // see if we have some info about the manga in cache
    var mangaInfoInCache = await caches.keys();    
    for (var i = 0; i < mangaInfoInCache.length; i++) {
        if (mangaInfoInCache[i] == IndexName) {
            return true;
        }
    }
    // save the image of the manga in cache
    // do (￣︶￣) this so we can identify that this is the cache for the manga info
    mangaInfoCache = await caches.open(IndexName + '(￣︶￣) (￣︶￣) -INDEX-（￣︶￣) - (￣︶￣)');
    
    try {
        await mangaInfoCache.addAll([
        '/api/offline/manga/downloadImage?url=https://' + `temp.compsci88.com/cover/normal/${mangaId}.webp`,
        `/api/offline/mangaName?manga=${IndexName}`
        ]);
    } catch (error) {
        console.log(error);
        await caches.delete(IndexName + '(￣︶￣) (￣︶￣) -INDEX-（￣︶￣) - (￣︶￣)');
    }
}

async function saveChapter(obj) {
    // do it so window doesnt go to the link
    event.preventDefault();
    // if the chapter is already downloaded then delete it
    if (obj.children[0].classList.contains("fa-xmark")) {
        if (confirm('Are you sure you want to delete this chapter?')) {
            // delete the cache
            await caches.delete(obj.parentElement.href.split('/').pop().replace('-page-1', ''));
            obj.innerHTML = `<i class="fas fa-floppy-disk"></i>`;
            return;
        }
    }
    // show the loading icon
    obj.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
    
    try {
        await cacheInfoAboutManga();
    } catch (error) {
        console.log(error);
        obj.innerHTML = `<i class="fas fa-floppy-disk"></i>`;
        alert('Error in downloading the chapter, please try again later.');
        return;
    }
    // delete the cache if it exists
    await caches.delete(chapterLink);

    
    var chapterLink = obj.parentElement.href.split('/').pop().replace('-page-1', '');
    // now cache the chapter, [0] being CurrentChapterInfo
    var cachingURLS = [
        `/api/offline/getMangaChapterPageOffline?chapter=${chapterLink}&download=true`
    ];

    var chapterCache = await caches.open(chapterLink);
    var images = [];
    // fetch the current chapter, get all the images and cache them
    try {
        var pageFetch = await fetch('/api/offline/getMangaChapterPageOffline?chapter=' + chapterLink + '&download=true');
        var page = await pageFetch.json();
        images = page.imageURlS;
    }   catch (error) {
        console.log(error);
        console.log(chapterLink);
        await caches.delete(chapterLink);
        obj.innerHTML = `<i class="fas fa-floppy-disk"></i>`;
        alert('Error in downloading the chapter, please try again later.');
        return;
    }

    // cache all the images
    for (var i = 0; i < images.length; i++) {
        cachingURLS.push('/api/offline/manga/downloadImage?url=' + images[i]);
    }

    try {
        await chapterCache.addAll(cachingURLS);
    } catch (error) {
        console.log(error);
        console.log(chapterLink);
        await caches.delete(chapterLink);
        obj.innerHTML = `<i class="fas fa-floppy-disk"></i>`;
        alert('Error in downloading the chapter, please try again later.');
        return;
    }
    // now show the check icon
    obj.innerHTML = `<i style="color:red;" class="fas fa-xmark"></i>`;
}
// makes automated html for the cahpters
function generateMangaChaptersHTML(chapter, chaptersInCache) {
    // if the chapter read then give gre font otherwise let it be normal
    let fontColor = isChapterRead(chapter.ChapterLink) ? 'grey' : 'inherit';
    let downloadedHTML = isChapterDownloaded(chapter.ChapterLink, chaptersInCache) ? `<i class="fas fa-xmark" style="color:red;"></i>` : `<i class="fas fa-floppy-disk"></i>`;
    return `
        <li>
           <a href=${window.location.origin + '/manga/read/' + chapter.ChapterLink + '-page-1'} style="color:${fontColor};">${chapter.chapterName}
              ${chapter.isNew ? `<span class="newChapter">New</span>` : ''}
              <span>${chapter.Date}</span>     
              <span onClick="saveChapter(this)" class="downloadIcon">${downloadedHTML}</span>
           </a>
        </li>
    `
}

// getRid ofPrev if passed true gets all of previous chapters first
async function generateMangaChapters(start, end, getRidOfprev = false, firstNeeded = false) {
    var chaptersHtml = [];
    var chaptersInCache = [];
    
    try {
        chaptersInCache = await caches.keys();
    } catch (error) {
        console.log(error);
    }

    for (var i = start; i < end; i++) {
        if (allChapters[i].Chapter != 1) {
            chaptersHtml.push(generateMangaChaptersHTML(allChapters[i], chaptersInCache));
        } else if (allChapters[i].Chapter == 1 && firstNeeded) {
            chaptersHtml.push(generateMangaChaptersHTML(allChapters[i], chaptersInCache));
        }
    }

    if (getRidOfprev) {
        document.getElementById('Chapters_List').innerHTML = chaptersHtml.join('')
        return;
    }
    document.getElementById('Chapters_List').innerHTML += chaptersHtml.join('')

}
// genreates the first 10 latest chapters if avaible
if (allChapters.length < 10) {
    (async () => {
        await generateMangaChapters(0, allChapters.length);
        // Add show all chapters button
        document.getElementById('Chapters_List').innerHTML += `<li><a onclick="generateMangaChapters(0,allChapters.length, true, true)" style="color:green;cursor:pointer;">Show All Chapters<i style="float:right;marign-top:7px;margin-right:7px;" class="fas fa-chevron-down"><i></a></li>`;
    })()
} else {
    (async () => {
        await generateMangaChapters(0, 10);
        // Add show all chapters button
        document.getElementById('Chapters_List').innerHTML += `<li><a onclick="generateMangaChapters(0,allChapters.length, true, true)" style="color:green;cursor:pointer;">Show All Chapters<i style="float:right;marign-top:7px;margin-right:7px;" class="fas fa-chevron-down"><i></a></li>`;
    })()
}

function fixLinksinDescription() {
    var li = document.querySelectorAll('.manga_info_ul li');
    li.forEach(elm => {
        var describing = elm.querySelectorAll('span')[0];
        if (describing == undefined) return;
        describing = describing.innerText;

        if (describing.includes('Author')) {
            elm.querySelectorAll('a').forEach(anchorTag => {
                anchorTag.setAttribute('href', "/manga/search?&Author=" + anchorTag.innerText)
            })
            return;
        }

        if (describing.includes('Genre')) {
            elm.querySelectorAll('a').forEach(anchorTag => {
                anchorTag.setAttribute('href', "/manga/search?&Genres=" + anchorTag.innerText)
            })
            return;
        }
        if (describing.includes('Status')) {
            elm.querySelectorAll('a').forEach(anchorTag => {
                if (anchorTag.innerText.includes('Scan')) {
                    anchorTag.setAttribute('href', "/manga/search?&Scan Status=" + anchorTag.innerText.replace(' (Scan)', ''))
                } else {
                    anchorTag.setAttribute('href', "/manga/search?&Publish Status=" + anchorTag.innerText.replace(' (Publish)', ''))
                }
            })
            return;
        }
        if (describing.includes("Released")) {
            elm.querySelectorAll('a').forEach(anchorTag => {
                anchorTag.setAttribute('href', "/manga/search?&Year=" + anchorTag.innerText)
            })
            return;
        }

        if (describing.includes("Type")) {
            elm.querySelectorAll('a').forEach(anchorTag => {
                anchorTag.setAttribute('href', "/manga/search?&Type=" + anchorTag.innerText)
            })
            return;
        }
    });
}
fixLinksinDescription();

// genreates the first chapter of the manga
generateMangaChapters(allChapters.length - 1, allChapters.length, false, true)