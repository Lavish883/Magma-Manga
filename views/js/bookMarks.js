
function getBookMarks(){
  var allBookMarks = JSON.parse(window.localStorage.getItem('bookmarks'));
  alert(JSON.stringify(allBookMarks))
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
  } catch(err){
    alert(err)
  }
}

alert('huh?')
window.addEventListener('storage', getBookMarks);
getBookMarks()


















