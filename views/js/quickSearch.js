var mangaDirectory;

function handleQuickSearchInput(event) {
  
}

async function getQuickSearchData (){
  alert(window.location.origin + '/api/manga/quickSearch')
  let link = window.location.origin + '/api/manga/quickSearch'
  
  let fetchQuickSearch = fetch(link)
  
}






document.getElementById("Search_input").addEventListener('keyup', handleQuickSearchInput)
document.getElementById("Search_input").addEventListener('click', getQuickSearchData)