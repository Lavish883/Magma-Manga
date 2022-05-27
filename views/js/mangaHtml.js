function isChapterRead(chapterLink) {
    // conditon which checks if any elm is equal to chapterLink
    for (var i = 0; i < allChaptersRead.length; i++) {
        if (allChaptersRead[i] == chapterLink) {
            return true
        }
    }
    return false
}
// makes automated html for the cahpters
function generateMangaChaptersHTML(chapter) {
    // if the chapter read then give gre font otherwise let it be normal
    let fontColor = isChapterRead(chapter.ChapterLink) ? 'grey' : 'inherit'
    return `
        <li>
           <a href=${window.location.origin + '/manga/read/' + chapter.ChapterLink + '-page-1'} style="color:${fontColor};">${chapter.Type + ' ' + chapter.Chapter}
              ${chapter.isNew ? `<span class="newChapter">New</span>` : ''}
              <span>${chapter.Date}</span>     
           </a>
        </li>
    `
}

// getRid ofPrev if passed true gets all of previous chapters first
function generateMangaChapters(start, end, getRidOfprev = false, firstNeeded = false) {
    var chaptersHtml = [];

    for (var i = start; i < end; i++) {
        if (allChapters[i].Chapter != 1) {
            chaptersHtml.push(generateMangaChaptersHTML(allChapters[i]));
        } else if (allChapters[i].Chapter == 1 && firstNeeded) {
            chaptersHtml.push(generateMangaChaptersHTML(allChapters[i]));
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
    generateMangaChapters(0, allChapters.length);
} else {
    generateMangaChapters(0, 10);
}
// Add show all chapters button
document.getElementById('Chapters_List').innerHTML += `<li><a onclick="generateMangaChapters(0,allChapters.length, true, true)" style="color:green;cursor:pointer;">Show All Chapters<i style="float:right;marign-top:7px;margin-right:7px;" class="fas fa-chevron-down"><i></a></li>`;
// genreates the first chapter of the manga
generateMangaChapters(allChapters.length - 1, allChapters.length, false, true)