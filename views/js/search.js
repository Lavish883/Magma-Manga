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
        'filters': ['Any', 'Action', 'Adult', 'Adventure', 'Comedy', 'Doujinshi', 'Drama', 'Ecchi', 'Fantasy', 'Gender Bender', 'Harem', 'Hentai', 'Historical', 'Horror', 'Isekai', 'Josei', 'Lolicon', 'Martial Arts', 'Mature', 'Mecha', 'Mystery', 'Psychological', 'Romance', 'School Life', 'Sci-fi', 'Seinen', 'Shotacon', 'Shoujo', 'Shoujo Ai', 'Shounen', 'Shounen Ai', 'Slice of Life', 'Smut', 'Sports', 'Supernatural', 'Tragedy', 'Yaoi', 'Yuri']
    }
];
//fetch the serach directory and run functions to intilazie the page
async function getSearchDirectory() {
    let fetchData = await fetch('/api/searchPage');
    let data = await fetchData.json();

    directory = data;

    //get rid of the loading screen
    document.getElementById('loading').remove();
    document.getElementById('main').classList.remove('none');
    // show the number of manga
    document.getElementById('amountOfManga').innerText = '(' + directory.length.toLocaleString("en-us") + ')';
    generateResultsHTML(directory, 0, 30);
    generateFiltersHTML()

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
}
// toggle filters selection
function filterSelection(obj) {
    console.log(obj)
    var filterHead = obj.parentElement.parentElement.children[0];

    if (filterHead.innerText != 'Genres' || obj.innerText == 'Any') {
        obj.parentElement.querySelectorAll('.fas').forEach((checked) => {
            checked.remove();
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
// filter results for search based on filtersApplied
function filterResultsforSearch() {
    searchFilteredResults = JSON.parse(JSON.stringify(directory));

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
    }
    generateResultsHTML(searchFilteredResults, 0, 8);
}

getSearchDirectory();

