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
      var image = 'https://temp.compsci88.com/cover/normal/' + arry[i].id + '.webp';
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

let typingTimer;
const typingDelay = 200; // delay in milliseconds

async function filterResults() {
  var searchValue = searchInput.value.toLowerCase();
  console.log(searchValue);

  if (searchValue.length < 2) {
    searchResults.innerHTML = '';
    return;
  }

  let req = await fetch(`/api/manga/quickSearch?search=${searchValue}`);
  let resp = await req.json();

  showResults(resp);
}

searchInput.addEventListener('keyup', () => {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(filterResults, typingDelay);
});

searchInput.addEventListener('keydown', () => {
  clearTimeout(typingTimer);
});