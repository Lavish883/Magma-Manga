var directory;
var searchFilteredResults = [];
var filtersApplied = {
    "Series Name": "",
    "Author": "",
    "Year": "",
    "Scan Status": "",
    "Publish Status": "",
    "Type": "",
    "Official Translation": "",
    "Genres": [],
    "GenresNot": [],
    "Sort By": ''
};

// Filters avaible for the user to select
const availableFilters = [
    {
        'name': 'Sort By',
        'filters': ['Alphabetical A-Z', 'Alphabetical Z-A', 'Recently Released Chapter', 'Year Released - Newest', 'Year Released - Oldest', 'Most Popular (All Time)', 'Most Popular (Monthly)', 'Least Popular']
    },
    {
        'name': 'Official Translation',
        'filters': ['Any', 'Offical Translation Only']
    },
    {
        'name': "Scan Status",
        'filters': ['Any', 'Cancelled', 'Complete', 'Discontinued', 'Hiatus', 'Ongoing']
    },
    {
        'name': "Publish Status",
        'filters': ['Any', 'Cancelled', 'Complete', 'Discontinued', 'Hiatus', 'Ongoing']
    },
    {
        'name': "Type",
        'filters': ['Any', 'Doujinshi', 'Manga', 'Manhua', 'Manhwa', 'OEL', 'One-shot']
    },
    {
        'name': "Genres",
        'filters': ['Any', 'Action', 'Adult', 'Adventure', 'Comedy', 'Doujinshi', 'Drama', 'Ecchi', 'Fantasy', 'Gender Bender', 'Harem', 'Hentai', 'Historical', 'Horror', 'Isekai', 'Josei', 'Lolicon', 'Martial Arts', 'Martial Arts  Shounen', 'Mature', 'Mecha', 'Mystery', 'Psychological', 'Romance', 'School Life', 'Sci-fi', 'Seinen', 'Shotacon', 'Shoujo', 'Shoujo Ai', 'Shounen', 'Shounen Ai', 'Slice of Life', 'Slice of Life  Supernatural', 'Smut', 'Sports', 'Supernatural', 'Tragedy', 'Yaoi', 'Yuri']
    }
];

// reduce the loading time of search page
// to do that what we can do the first time user comes to the page then fetch the directory
// then set that directory data to localStorage
// so we don't have to wait for fetch
// but we do fetch and wait for a callback of when it finishes
// after it finishes we compare what we have in localstorage and if same then we exit
// if not same save the new directory to localstroage and set the directory varible to the newDirectory

function getDirectoryFromStorage() {
    var directoryInStorage = window.localStorage.getItem('directory');
    // see if directory in storage is valid json or not
    if (directoryInStorage != null || directoryInStorage != undefined) {
        try {
            directoryInStorage = JSON.parse(directoryInStorage);
        } catch (err) {
            // if error in json meaning that directory is not valid it needs to be fetched
            getSearchDirectory().then(() => {
                initiate();
                window.localStorage.setItem('directory', JSON.stringify(directory));
            });
        }
        directory = directoryInStorage;
        initiate(); // load the page
        // now see if any items updated in the directory by fetching new
        getSearchDirectory(false);
    } else {
        // if there exits no directory fetch it
        getSearchDirectory().then(() => {
            initiate();
            window.localStorage.setItem('directory', JSON.stringify(directory));
        });
    }

}
//fetch the serach directory and run functions to intilazie the page
async function getSearchDirectory(noCheckNeeded = true) {
    var fetchData = await fetch('/api/searchPage');
    var data = await fetchData.json();

    if (noCheckNeeded) {
        directory = data;
    } else {
        let localDirectory = window.localStorage.getItem('directory');
        if (localDirectory == JSON.stringify(data)) {
            return; // do nothing meaning that our local directory is all updated
        } else {
            window.localStorage.setItem('directory', JSON.stringify(data));
            directory = data;
        }
    }

}
// toggle if that list of filters is visible or not
function toggleListVisibility(obj) {
    // check if it is hidden rn or not
    let filterList = obj.parentElement.children[1];
    let isHidden = filterList.classList.contains('hidden');

    if (isHidden) {
        filterList.classList.remove('hidden');
        obj.children[0].classList.remove('fa-caret-down');
        obj.children[0].classList.add('fa-caret-up');
        obj.classList.add('noBorderRadius');
    } else {
        filterList.classList.add('hidden');
        obj.children[0].classList.remove('fa-caret-up');
        obj.children[0].classList.add('fa-caret-down');
        obj.classList.remove('noBorderRadius');
    }
    console.log(obj);
}
// generate results html based on the arry
function generateResultsHTML(mangaArry, indxStart, amount) {
    let htmlGenerated = [];

    if (amount > mangaArry.length) {
        amount = mangaArry.length;
    }

    // starting at a given index add more twenty items
    for (var i = indxStart; i < indxStart + amount; i++) {
        // i is index name, s is series name, y is year released
        // h is either its popular rn or not, a is an list list of authors
        // ss is scan staus ps is publish status
        htmlGenerated.push(`
           <div class="result_item">
             <a href="#" >
                <img src="https://temp.compsci88.com/cover/${mangaArry[i].indexName}.jpg" /> 
             </a>
             <div class="detailContainer">
                <a class="name" href="/manga/manga/${mangaArry[i].indexName}">${mangaArry[i].seriesName}</a>
                <div class="gray">
                    Author:${mangaArry[i].authors.map(author => `<span class="blue">&nbsp;${author}</span>`).join(',')}
                    &#183; Year:&nbsp;<span class="blue">${mangaArry[i].y}</span>
                </div>
                <div class="gray">
                    Status: <span class="blue">${mangaArry[i].ss} (Scan)</span>,
                    <span class="blue">${mangaArry[i].ps} (Publish)</span>
                </div>
                <div class="gray">
                    Latest: <a href="${mangaArry[i].chapterUrl}" class="blue">Chapter ${mangaArry[i].latestChapter} </a>
                    <span style="color:gray;">&#183; ${mangaArry[i].latestScan}</span>
                </div>
                <div class="gray">
                    Genres:${mangaArry[i].genres.map(genre => `<span class="blue">&nbsp;${genre}</span>`).join(',')}
                </div>
                ${mangaArry[i].offical == 'yes' ? `<div class="offical">Official Translation</div>` : ``}
             </div>
           </div>
        `)
    }
    document.getElementById('resultsContainer').innerHTML = htmlGenerated.join('');
}
// genreates html for all the avaible filters for user to select
function generateFiltersHTML() {
    let htmlGenerated = [];

    for (var i = 0; i < availableFilters.length; i++) {
        htmlGenerated.push(`
            <div class="filterContainer">
                <div class="filterHead" onclick="toggleListVisibility(this)" >
                    ${availableFilters[i].name}
                    <i class="fas fa-caret-down"></i>
                </div>
                <div class="filterItems hidden">
                    ${availableFilters[i].filters.map((filter, indx) => `<div onclick="filterSelection(this)" class="item">${filter}${indx == 0 ? `<i class="fas fa-check"></i>` : ''}</div>`).join('')}
                </div>
            </div>
        `)
    }
    document.getElementById('filters').innerHTML = htmlGenerated.join('');
}
// update filters applied 
function updateFilters(type, obj) {
    if (type != 'Genres') {
        filtersApplied[type] = obj.innerText;
    } else {
        // if it is any genres then empty the arry of genres and genres not
        if (obj.innerText == 'Any') {
            filtersApplied.Genres = [];
            filtersApplied.GenresNot = [];
            filterResultsforSearch();
            return;
        }

        if (obj.innerHTML.includes(`fa-check`)) {
            filtersApplied.Genres.push(obj.innerText);
        } else if (obj.innerHTML.includes(`fa-times`)) {
            filtersApplied.GenresNot.push(obj.innerText);
            // get rid of that genre from the genres filter
            filtersApplied.Genres.splice(filtersApplied.Genres.indexOf(obj.innerText), 1);
        } else {
            // get rid of it from gneresNot
            filtersApplied.GenresNot.splice(filtersApplied.GenresNot.indexOf(obj.innerText), 1);
        }
    }
    console.log(filtersApplied);
    filterResultsforSearch();
}
// toggle filters selection
function filterSelection(obj) {
    console.log(obj)
    var filterHead = obj.parentElement.parentElement.children[0];

    if (filterHead.innerText != 'Genres' || obj.innerText == 'Any') {
        obj.parentElement.querySelectorAll('.fas').forEach((checked) => {
            checked.remove(); // remove all signage from other elements
        })
        obj.innerHTML += `<i class="fas fa-check"></i>`
    } else {
        // change sign on that spefic genre
        if (obj.childElementCount == 0) {
            obj.innerHTML += `<i class="fas fa-check"></i>`;
            obj.parentElement.children[0].innerHTML = obj.parentElement.children[0].innerText;
        } else if (obj.innerHTML.includes(`fa-check`)) {
            obj.children[0].remove();
            obj.innerHTML += `<i class="fas fa-times"></i>`
        } else if (obj.innerHTML.includes(`fa-times`)) {
            obj.children[0].remove();
        }
        // now see if there are no signs on genre then add a sign to any
        if (obj.parentElement.querySelectorAll('i').length == 0) {
            obj.parentElement.children[0].innerHTML += `<i class="fas fa-check"></i>`;
        }
    }

    updateFilters(filterHead.innerText, obj);
}
// handle value change of three inputs on top of page
function handleChangeInValue(obj) {
    // update that alue int he filtersApplied
    let type = obj.parentElement.children[0].innerText.replace(':', '');
    filtersApplied[type] = obj.value;
    filterResultsforSearch()
}
// geners filter, checks if the genres they want or dont want is in or not
// manga is object and wantTheGenre is booelan
function checkGenres(manga, wantTheGenre, genresApplied) {
    var amountNeeded = 0;
    for (var i = 0; i < manga.genres.length; i++) {
        for (var k = 0; k < genresApplied.length; k++) {
            if (genresApplied[k].replace(/\s+/g, "_") == manga.genres[i].replace(/\s+/g, "_")) {
                amountNeeded += 1;
                break;
            }
        }
    }
    if (wantTheGenre) {
        if (amountNeeded == genresApplied.length) {
            return true
        }
        return false
    } else {
        if (amountNeeded != 0) {
            return false
        }
        return true
    }
}
// sort manga arry based on user prefences
function sortMangaResults() {
    if (filtersApplied["Sort By"] != '' && filtersApplied['Sort By'] != 'Alphabetical A-Z') {
        let sortBy = filtersApplied["Sort By"];
        // sort by popularity all time
        if (sortBy == "Most Popular (All Time)") {
            searchFilteredResults.sort((a, b) => {
               return b.v - a.v;
            })
        }
        // sort by populatiorny but monthly
        if (sortBy == "Most Popular (Monthly)") {
            searchFilteredResults.sort((a, b) => {
                return b.vm - a.vm;
            } )
        }
        // sort by least popular
        if (sortBy === 'Least Popular') {
            searchFilteredResults.sort((a, b) => {
                return a.v - b.v;
            })
        }
        // sort by year released oldest
        if (sortBy === 'Year Released - Oldest') {
            searchFilteredResults.sort((a, b) => {
                return a.y - b.y;
            })
        }
        // sort by year released newest
        if (sortBy === 'Year Released - Newest') {
            searchFilteredResults.sort((a, b) => {
                return b.y - a.y;
            })
        }
        // sort by recently realesed chapter
        if (sortBy === 'Recently Released Chapter') {
            searchFilteredResults.sort((a, b) => {
                return b.lt - a.lt;
            })
        }
        // sort by opposite alphabetical order
        if (sortBy === 'Alphabetical Z-A') {
            searchFilteredResults.sort((a, b) => {
                return b.seriesName.localeCompare(a.seriesName);
            })
        }
    }
}
// filter results for search based on filtersApplied
function filterResultsforSearch() {
    searchFilteredResults = JSON.parse(JSON.stringify(directory));
    sortMangaResults();
    for (var i = searchFilteredResults.length - 1; i >= 0; i--) {
        var manga = searchFilteredResults[i];
        // see if their series name mathches or one of the alternate names
        if (filtersApplied["Series Name"] != '') {
            // if it doesn't inlcude the Series name get rid of it
            var doAnyMatch = false;
            if (manga.seriesName.toLowerCase().includes(filtersApplied["Series Name"].toLowerCase())) {
                doAnyMatch = true;
            }
            manga.alternateNames.map((name) => {
                if (name.toLowerCase().includes(filtersApplied["Series Name"].toLowerCase())) {
                    doAnyMatch = true;
                }
            })
            if (doAnyMatch == false) {
                searchFilteredResults.splice(i, 1);
                continue;
            }
        }
        // see if the year published matches
        if (filtersApplied["Year"] != '') {
            // if it doesn't inlcude the year get rid of it
            if (manga.y.toLowerCase().includes(filtersApplied["Year"].toLowerCase()) == false) {
                searchFilteredResults.splice(i, 1);
                continue;
            }
        }
        // see if the author name matches
        if (filtersApplied["Author"] != '') {
            // if it doesn't inlcude the author get rid of it
            var doAnyMatch = false;
            manga.authors.map((author) => {
                if (author.toLowerCase().includes(filtersApplied["Author"].toLowerCase())) {
                    doAnyMatch = true;
                }
            })
            if (doAnyMatch == false) {
                searchFilteredResults.splice(i, 1);
                continue;
            }
        }
        // see if offical translation matches
        if (filtersApplied["Official Translation"] == "Offical Translation Only") {
            if (manga.offical == "no") {
                searchFilteredResults.splice(i, 1);
                continue;
            }
        }
        // see if scan staus matches 
        if (filtersApplied["Scan Status"] != 'Any' && filtersApplied["Scan Status"] != '') {
            if (manga.ss.toLowerCase() != filtersApplied["Scan Status"].toLowerCase()) {
                searchFilteredResults.splice(i, 1);
                continue;
            }
        }
        // see if publish staus matches 
        if (filtersApplied["Publish Status"] != 'Any' && filtersApplied["Publish Status"] != '') {
            if (manga.ps.toLowerCase() != filtersApplied["Publish Status"].toLowerCase()) {
                searchFilteredResults.splice(i, 1);
                continue;
            }
        }
        // see if type matches
        if (filtersApplied["Type"] != 'Any' && filtersApplied["Type"] != '') {
            if (manga.t.toLowerCase() != filtersApplied['Type'].toLowerCase()) {
                searchFilteredResults.splice(i, 1);
                continue;
            }
        }
        // see if all genres mathc or not
        if (filtersApplied["Genres"].length != 0) {
            if (!checkGenres(manga, true, filtersApplied["Genres"])) { // ,meaning it doesnt include all genres we want
                searchFilteredResults.splice(i, 1);
                continue;
            }
        }
        // see if amnga contains genres they dont want 
        if (filtersApplied["GenresNot"].length != 0) {
            if (!checkGenres(manga, false, filtersApplied["GenresNot"])) {
                searchFilteredResults.splice(i, 1);
                continue;
            }
        }
    }
    generateResultsHTML(searchFilteredResults, 0, 8);
}
// run this fuction when all setup is done
function initiate() {
    //get rid of the loading screen
    document.getElementById('loading').remove();
    document.getElementById('main').classList.remove('none');
    // show the number of manga
    document.getElementById('amountOfManga').innerText = '(' + directory.length.toLocaleString("en-us") + ')';
    generateResultsHTML(directory, 0, 30);
    generateFiltersHTML()
}

getDirectoryFromStorage();

