// to make the random manga on the navbar work

// just get the directory once and store it in localstorage
function getDirectoryFromStorage() {
    var directoryInStorage = window.localStorage.getItem('directory');
    // see if directory in storage is valid json or not
    if (directoryInStorage != null || directoryInStorage != undefined) {
        try {
            directoryInStorage = JSON.parse(directoryInStorage);
        } catch (err) {
            // if error in json meaning that directory is not valid it needs to be fetched
            return getSearchDirectory();
        }
    } else {
        // if there exits no directory fetch it
        return getSearchDirectory();
    }
    // set The link now
    document.getElementById('randomManga').href = `/manga/manga/${directoryInStorage[Math.floor(Math.random() * directoryInStorage.length)].indexName}`;
}
//fetch the serach directory and run functions to intilazie the page
async function getSearchDirectory() {
    var fetchData = await fetch('/api/searchPage');
    var data = await fetchData.json();
    window.localStorage.setItem('directory', JSON.stringify(data));
    getDirectoryFromStorage();
}

getDirectoryFromStorage();