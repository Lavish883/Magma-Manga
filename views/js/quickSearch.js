const searchResults = document.getElementById("search_results");
const searchInput = document.getElementById("Search_input");

var mangaDirectory;
var filteredResults = [];

function filterResults(event) {
  
}
// fwtch data that allows for searching
async function getQuickSearchData (){
  let link = window.location.origin + '/api/manga/quickSearch'
  
  let fetchQuickSearch = await fetch(link);
  let resp = await fetchQuickSearch.json();

  mangaDirectory = resp;
}


getQuickSearchData()


document.getElementById("Search_input").addEventListener('keyup', handleQuickSearchInput)
document.getElementById("Search_input").addEventListener('click', getQuickSearchData)