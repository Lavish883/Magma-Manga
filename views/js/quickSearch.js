const searchResults = document.getElementById("search_results");
const searchInput = document.getElementById("Search_input");

var mangaDirectory;

function showResults(arry) {

  if (arry.length == 0) {
    searchResults.innerHTML = `<li style="height:35px;"><a style="justify-content:center;"><span>No Search Results :(</span></a></li>`
    return;
  }

  var resultsHTML = [];
  // to limit the results to 8, getting rid of it now becuase it reduces lag rather than using .length method
  var toGoThrough = arry.length > 7 ? 7 : arry.length;
  for (var i = 0; i < toGoThrough; i++) {
    if (window.location.href.includes("mangaapi")) {
      var image = '//axiostrailbaby.lavishkumar1.repl.co/sendImage/' + ('temp.compsci88.com cover ' + arry[i].i + '.jpg')
    } else {
      var image = 'https://temp.compsci88.com/cover/' + arry[i].i + '.jpg';
    }

    resultsHTML.push(
      `
                <li>
                    <a href="${'/manga/manga/' + arry[i].i}">
                        <img src="${image}" >
                        <span>${arry[i].s}</span>
                </li>
            `
    )
  }
  searchResults.innerHTML = resultsHTML.join('');
}

function filterResults(event) {

  let filteredResults = [];
  let userSearch = event.target.value;

  if (userSearch == '') {
    searchResults.innerHTML = "";
    return;
  }

  for (var i = 0; i < mangaDirectory.length; i++) {
    let manga = mangaDirectory[i];
    // Check if what the user typed 
    if (manga.s.toLowerCase().includes(userSearch.toLowerCase())) {
      filteredResults.push(manga)
      continue;
    }

    for (var k = 0; k < manga.a.length; k++) {
      if (manga.a[k].toLowerCase().includes(userSearch.toLowerCase())) {
        filteredResults.push(manga)
        break;
      }
    }
  }


  showResults(filteredResults)
}
// fetch data that allows for searching
async function getQuickSearchData() {
  let link = window.location.origin + '/api/manga/quickSearch'

  let fetchQuickSearch = await fetch(link);
  let resp = await fetchQuickSearch.json();

  mangaDirectory = resp;
}


getQuickSearchData()


document.getElementById("Search_input").addEventListener('keyup', filterResults)
document.getElementById("Search_input").addEventListener('click', getQuickSearchData)