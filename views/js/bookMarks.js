
function getBookMarks(){
  var allBookMarks = JSON.parse(window.localStorage.getItem('bookmarks'));

  if (allBookMarks != null && allBookMarks.length != 0 ){
    genreateBookmarksHTML(allBookMarks)
  }
}

function genreateBookmarksHTML(allBookMarks){
    var bookmarksHTML = [];
    try{
    for (var i = 0; i < allBookMarks.length; i++){
      let manga =  allBookMarks[i];
      bookmarksHTML.push(
        `
          <div draggable="true" class="BookMark_Container">
            <a draggable="false" href="${'manga.html?manga=' + manga.indexName}">
              <div class="hot_update_item_name">${manga.seriesName}</div>
              <img class="lozad" data-src="${'https://cover.nep.li/cover/' + manga.indexName + '.jpg'}">
            </a>
          </div>
        `
      )
    }

    document.getElementById("BookMarksContainer").innerHTML = bookmarksHTML.join('');
    loadLazyImages()
    } catch (err) {
      alert(err)
    }
}

function loadLazyImages() {
    const observer = lozad('.lozad', {
        load: function (el) {
            el.src = el.dataset.src;
            el.onload = function () {
                el.classList.add('fade')
            }
        }
    })
    observer.observe();
}

window.addEventListener('storage', getBookMarks);
getBookMarks()


















