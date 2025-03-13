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
        var image = 'https://temp.compsci88.com/cover/normal/' + manga.id + '.webp';
      }
      bookmarksHTML.push(
        `
          <div draggable="true" class="BookMark_Container">
            <a mangaId="${manga.id}" Index="${manga.Index}" Series="${manga.Series}" draggable="false" href="${'/manga/manga/' + manga.Index}">
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
    load: function (el) {
      el.src = el.dataset.src;
      el.onload = function () {
        el.classList.add('fade')
      }
    }
  })
  observer.observe();
}

window.addEventListener('storage', (event)=> {
  console.log(event);
  if(event.key == 'bookmarks') {
    getBookMarks();
  }
});
getBookMarks();


$("#BookMarksContainer").sortable({
  cursor: "move",
  scroll: true,
  containment: "body",
  stop: doneSorting
});

function doneSorting() {
  let ArryToreplace = [];
  document.querySelectorAll('.BookMark_Container').forEach(function (manga) {
    let seriesManga = manga.querySelector('a').getAttribute('Series');
    let indexManga = manga.querySelector('a').getAttribute('Index');
    let mangaId = manga.querySelector('a').getAttribute('mangaId');
  
    ArryToreplace.push({ "Index": indexManga, "Series": seriesManga, "id": mangaId });
  })
  window.localStorage.setItem('bookmarks', JSON.stringify(ArryToreplace));
  updateBookmarks();
}

async function updateBookmarks() {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'accessToken': window.localStorage.getItem('accessToken'),
      'bookmarks': JSON.parse(window.localStorage.getItem('bookmarks'))
    })
  }
  let req = await fetch(window.location.origin + '/api/manga/updateBookmarks', options);
  if (req.status == 401) {
    await getNewAccesToken();
    return await updateBookmarks();
  }
  let resp = await req.text();
  return resp;
}