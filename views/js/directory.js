function generateOptionsHTML(id, currentDirectory) {
    var HTMLArry = [];

    for (var i = 0; i < ableToFilter.length; i++) {
        var cssClass;
        let option = ableToFilter[i];

        // decide what css class to give
        if (option == currentDirectory) {
            cssClass = 'active'
        } else if (ableToFilter[i + 1] == currentDirectory) {
            cssClass = 'borderrightNone'
        } else {
            cssClass = ''
        }
        HTMLArry.push(`
            <div onclick="handleFilterChange(this)" class="${cssClass}">${option}</div>
        `)
    }

    id.innerHTML = HTMLArry.join('')
}

// main handler when a filter changes 
function handleFilterChange(obj) {
    currentDirectory = obj.innerText;

    generateOptionsHTML(obj.parentElement, currentDirectory)

    let filteredResults = filterDirectoryManga(directoryBackup.Directory, currentDirectory);
    let resultsHTML = generateFilterdArryHTML(filteredResults, directoryBackup.AllGenres, 0);

    document.getElementById('manga_list').innerHTML = resultsHTML;
}
// Load more manga
function loadMoreManga() {
    let filteredResults = filterDirectoryManga(directoryBackup.Directory, currentDirectory);
    let resultsHTML = generateFilterdArryHTML(filteredResults, directoryBackup.AllGenres, document.getElementById("MangaFilters").childElementCount);

    document.getElementById('manga_list').innerHTML += resultsHTML;
}

// given a arry of numbers convert that into genres according to genreslist
// => [0,3,2,9] => Action, Comdey, ....
function convertGenres(genresList, mangaGenres) {
    var genres = [];
    for (var i = 0; i < mangaGenres.length; i++) {
        genres.push(genresList[mangaGenres[i]])
    }
    return genres.join(', ')
}

// arry of manga which we display
// needed te arry of manga and arry of genres
// return a string of HTML that which can use inner html 
function generateFilterdArryHTML(mangaList, genresList, indxStart) {
    var htmlArry = [];


    for (var i = indxStart; i < indxStart + 20; i++) {
        if (i >= mangaList.length) {
            document.getElementById('load_more').style.display = 'none';
            return htmlArry.join('')
        }
        let manga = mangaList[i];
        htmlArry.push(`
            <li>
                <a class="tooltip" href="/manga/manga/${manga.i}">${manga.s}
                    <div class="tooltiptext">
                        ${isMangaSus(manga.i) ? `<div class="red_overlay_directory"><i class="fa-solid fa-circle-question" title="This manga might be Hentai (manga porn)"></i></div>` : ''}
                        <img src="https://temp.compsci88.com/cover/${manga.i}.jpg" />
                        <span class="status">Status:
                            <span>&nbsp;${manga.st}</span>
                        </span>
                        <span class="status">Genre:
                            ${convertGenres(genresList, manga.g)}
                        </span>
                    </div>
                </a>
                <span style="color:gray;font-style:italic">${manga.st == 'Complete' ? '&nbsp;&nbsp;Complete': ''}</span>
            </li>
        `)
    }

    document.getElementById('load_more').style.display = 'flex';
    return htmlArry.join('')
}

// to chekc if manga is potientally sus
function isMangaSus(mangaName) {
    if (susManga[mangaName] == undefined) {
        return false
    }
    return true
}

// filter is a string => 'All', 'A' or 'B'
// go thorough the direcory and see which manga include that filter
function filterDirectoryManga(directory, filter) {

    if (filter == 'All') {
        return directory
    }

    var filteredResults = [];
    // go through each manga and see if it amtches the filter
    for (var i = 0; i < directory.length; i++) {
        if (directory[i].s.charAt(0) == filter) {
            filteredResults.push(directory[i])
        }
    }
    return filteredResults;
}

generateOptionsHTML(document.getElementById('MangaFilters'), currentDirectory);
handleFilterChange(document.getElementById("MangaFilters").children[0])