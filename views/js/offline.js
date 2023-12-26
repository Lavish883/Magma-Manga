const isDarkModeOn = window.localStorage.getItem('darkMode');

if (isDarkModeOn === null || isDarkModeOn === 'false') {
  console.log('Dark Mode is off')
  document.getElementById('Darkmode').innerHTML = `<i class="fas fa-sun"></i> <span>Dark Mode off</span>`
} else {
  document.body.classList.add('darkModeBody')
  document.getElementById('Darkmode').innerHTML = `<i class="fas fa-moon"></i> <span>Dark Mode on</span>`
}


function handleDarkModeToggle() {
  if (window.localStorage.getItem('darkMode') === 'true') {
    window.localStorage.setItem('darkMode', 'false')
    document.body.classList.remove('darkModeBody')
    document.getElementById('Darkmode').innerHTML = `<i class="fas fa-sun"></i> <span>Dark Mode off</span>`
  } else {
    window.localStorage.setItem('darkMode', 'true')
    document.body.classList.add('darkModeBody')
    document.getElementById('Darkmode').innerHTML = `<i class="fas fa-moon"></i> <span>Dark Mode on</span>`
  }
}

// Scroll To top
document.getElementById('scroll_to_top').addEventListener('click', function () {
  window.scrollTo({ top: 0, behavior: 'smooth' });
})

// show Scroll to top button or not
window.addEventListener('scroll', function () {
  if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
    document.getElementById('scroll_to_top').style.opacity = "1";
  } else {
    document.getElementById('scroll_to_top').style.opacity = "0";
  }
})


async function makeChaptersArry() {
  var keys = await caches.keys();
  // {manga: [chapter1, chapter2, chapter3]}
  var mangaAvailble = {};

  for (var i = 0; i < keys.length; i++) {
    if (keys[i].includes('(￣︶￣) (￣︶￣) -INDEX-（￣︶￣) - (￣︶￣)')) {
      mangaAvailble[keys[i].replace('(￣︶￣) (￣︶￣) -INDEX-（￣︶￣) - (￣︶￣)', '')] = [];
    } else {
      // chapter names will be like mangaName-chapter-chapterNumber
      try {
        var mangaName = keys[i].split('-chapter-')[0];
        var chapterNumber = keys[i].split('-chapter-')[1];

        if (chapterNumber.includes('-index-')) {
          chapterNumber = chapterNumber.split('-index-')[0];
        }

        mangaAvailble[mangaName].push({
          chapterNumber: chapterNumber,
          chapterKey: keys[i]
        })
      } catch (e) {
        continue;
      }
    }
  }

  return mangaAvailble;
}

async function makeMangaChaptersHTML(mangaAvailble) {
  var htmlArry = [];

  for (var i = 0; i < mangaAvailble.length; i++) {
    // Access the cache, to get the chapter type
    var cacheName = mangaAvailble[i].chapterKey;
    var cache = await caches.open(cacheName);
    var cachedItems = await cache.keys();

    var req = await fetch(cachedItems[0].url)
    var resp = await req.json();

    htmlArry.push(`
      <a class="chapterLinkButton" href="/manga/offline/read?${mangaAvailble[i].chapterKey}-page-1" title="Chapter ${mangaAvailble[i].chapterNumber}">
        <span>${resp.Type} ${mangaAvailble[i].chapterNumber}</span>
      </a>
    `)
  }

  return htmlArry.join('');
}

async function makeAvailableMangaHTML() {
  var mangaAvailble = await makeChaptersArry();

  var mangas = Object.keys(mangaAvailble);
  var htmlArry = [];

  for (var i = 0; i < mangas.length; i++) {
    try {
    var manga = await caches.match(`/api/offline/mangaName?manga=${mangas[i]}`);
    manga = await manga.json();

    htmlArry.push(`
      <div class="mangaInfoCont">
        <div class="hot_update_item">
          <a title="${manga.SeriesName}">
              <div class="hot_update_item_name">
                  <span>${manga.SeriesName}</span>
              </div>
              <img alt="${manga.SeriesName} Picture" src="/api/offline/manga/downloadImage?url=https://temp.compsci88.com/cover/${manga.IndexName}.jpg" style="max-width:145px;" />
          </a>
        </div>
        <div class="AllChapterCont">
          ${await makeMangaChaptersHTML(mangaAvailble[mangas[i]])}
        </div>
      </div>
    `)
    } catch (e) {
      continue;
    }
  }

  document.querySelector('.MangaAvailableCont').innerHTML = htmlArry.join('');
}


if (document.querySelector('.MangaAvailableCont') != null) {
  makeAvailableMangaHTML();
}