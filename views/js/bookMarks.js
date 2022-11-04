
function getBookMarks() {
  var allBookMarks = JSON.parse(window.localStorage.getItem('bookmarks'));

  if (allBookMarks != null && allBookMarks.length != 0) {
    genreateBookmarksHTML(allBookMarks)
  }
}

function genreateBookmarksHTML(allBookMarks) {
  var bookmarksHTML = [];
  try {
    for (var i = 0; i < allBookMarks.length; i++) {
      let manga = allBookMarks[i];
      if (window.location.href.includes("mangaapi")) {
        var image = '//axiostrailbaby.lavishkumar1.repl.co/sendImage/' + ('temp.compsci88.com cover ' + manga.Index + '.jpg')
      } else {
        var image = 'https://temp.compsci88.com/cover/' + manga.Index + '.jpg';
      }
      bookmarksHTML.push(
        `
          <div draggable="true" class="BookMark_Container">
            <a draggable="false" href="${'/manga/manga/' + manga.Index}">
              <div class="hot_update_item_name">${manga.Series}</div>
              <img class="lozad" data-src="${image}">
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
    load: function(el) {
      el.src = el.dataset.src;
      el.onload = function() {
        el.classList.add('fade')
      }
    }
  })
  observer.observe();
}

window.addEventListener('storage', getBookMarks);
getBookMarks()


















