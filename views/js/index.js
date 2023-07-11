// Generate hmtl 
function makeLatestChapterHTML(manga, isPopular = false, isCompleted = false) {

  if (window.location.href.includes("mangaapi")) {
    var image = '//axiostrailbaby.lavishkumar1.repl.co/sendImage/' + ('temp.compsci88.com/cover/' + manga.IndexName + '.jpg').replaceAll('/', ' ')
  } else {
    var image = '//temp.compsci88.com/cover/' + manga.IndexName + '.jpg';
  }

  return `
    <div class="latest_chapters_item">
        <a href="/manga/manga/${manga.IndexName}" title="${manga.SeriesName}">
            ${isMangaSus(manga.IndexName) ? `<div class="red_overlay"><i class="fa-solid fa-circle-question" title="This manga might be Hentai (manga porn)"></i></div>` : ''}
            <img src="${image}" width="90" />
        </a>
        <a style="display:contents;" href="${"/manga/read/" + manga.ChapterLink + '-page-1'}" title="${manga.SeriesName + "&nbsp;Chapter&nbsp;" + manga.Chapter}">
            <div style="margin-left:15px; margin-top:8px;">
                <div class="latest_chapters_info">
                    ${isPopular ? `<i style="color:red" class="fas fa-fire-alt"></i>` : ''}
                    ${isCompleted ? `<i style="color:darkorange" class="fas fa-check-circle"></i>` : ''}
                    <span>${manga.SeriesName}</span>
                </div>
                <div style="margin-top:0px;">
                    <i style="font-size:15px;color:black;" class="far fa-file"></i>
                <span style="font-size:14px;font-weight:500;color:black;">Chapter ${manga.Chapter}</span>
            </div>
            <div style="margin-top:1px;">
                <i style="font-size:15px;color:black;" class="far fa-clock"></i>
                <span style="font-size:14px;font-weight:500;color:black;">${manga.Date}</span>
            </div>
            </div>
        </a>
    </div>
    `
}

// to chekc if manga is potientally sus
function isMangaSus(mangaName) {
  if (susManga[mangaName] == undefined) {
      return false
  }
  return true
}

// View more chapters that are latest on index.html
function viewMoreChapters() {
  var chaptersShown = $('#latestChapters .latest_chapters_item').length;
  var chaptersHTMLArry = [];

  for (var i = chaptersShown; i < chaptersShown + 18; i++) {
    let isPopular = false;
    try {
      var isCompleted = latestChapters[i].ScanStatus == 'Complete' ? true : false
      for (var h = 0; h < hotManga.length; h++) {
        if (hotManga[h].SeriesID === latestChapters[i].SeriesID) {
          isPopular = true;
          break;
        }
      }
      chaptersHTMLArry.push(makeLatestChapterHTML(latestChapters[i], isPopular, isCompleted))
      // Get rid of view more chapters button
      if (latestChapters.length - 1 === i) {
        document.getElementById('viewMoreChapters').classList.add('none');
      }
    } catch (err) {
      console.log(err)
    }
  }
  $('#latestChapters')[0].innerHTML += chaptersHTMLArry.join('')
}

// Set what nav_option is active
if (window.location.pathname.includes('/index.html') || window.location.pathname === '/manga/') {
  document.getElementById('Home_nav').classList.add('small_nav_active')
} else if (window.location.pathname.includes('/directory')) {
  document.getElementById('Directory_nav').classList.add('small_nav_active')
} else if (window.location.pathname.includes('/search')) {
  document.getElementById('Search_nav').classList.add('small_nav_active')
} else if (window.location.pathname.includes('manga/bookmarks')) {
  document.getElementById('Bookmark_nav').classList.add('small_nav_active')
} else if (window.location.pathname.includes('manga/recentChapters')) {
  document.getElementById('Read_nav').classList.add('small_nav_active')
}

// Dark Mode
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

if (window.localStorage.getItem('accessToken') != undefined || window.localStorage.getItem("accessToken") != null) {
  document.getElementById('Login_nav').setAttribute('onclick', 'activateDropdown(this)');
  document.getElementById('Login_nav').innerHTML = `<i class="fas fa-user" aria-hidden="true"></i><span> Account</span>`

}

// Scroll To top
document.getElementById('scroll_to_top').addEventListener('click', function() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
})

function genreateRecdHTML(manga) {
  var htmlArry = [];

  for (var i = 0; i < manga.length; i++) {
    if (manga[i].s > 18) {
      manga[i].s = manga.SeriesName.substr(0, 18) + '... '
    }
    htmlArry.push(`
            <div class="hot_update_item">
                <a href="/manga/read/${manga[i].chapterLink}-page-1" title="${manga[i].s} ${manga[i].l}">
                    <div class="hot_update_item_name"> <span>${manga[i].s} ${manga[i].l}</span>
                    </div>
                    <img alt="${manga[i].s}" src="https://temp.compsci88.com/cover/${manga[i].i}.jpg" style="max-width:145px;">
                </a>
            </div>
        `)
  }

  return htmlArry.join('');
}

// get recommend manga for the user 
// to do that fetch a url, need to give two params manga1 and manga2 they handle the rest
// the parmas need to be in indexName format => Sakamato-days, One-piece
// get two random manga that isn't the same from recentread and bookmarks
// after getting the response make that into htl and display it to the user
// id => for what html elemnt to fill the html with
async function getRecommendedManga(obj) {
  var userReadManga = [];
  // turn recentRead and bookmarks to param format
  try {
    JSON.parse(window.localStorage.getItem('recentRead')).forEach(function(e) {
      userReadManga.push(e.split(`-chapter-`)[0])
    })

    JSON.parse(window.localStorage.getItem('bookmarks')).forEach(function(e) {
      userReadManga.push(e.indexName)
    })
  } catch (err) {
    console.log(err)
  }
  // if user has no recentread or bookamarks then get two random popular manga
  if (userReadManga.length == 0) {
    userReadManga.push(hotManga[Math.floor(Math.random() * hotManga.length)].IndexName)
    userReadManga.push(hotManga[Math.floor(Math.random() * hotManga.length)].IndexName)
  }

  // different indx so we can get different manga
  var indx1 = Math.floor(Math.random() * userReadManga.length)
  var indx2 = Math.floor(Math.random() * userReadManga.length)

  while (userReadManga.length > 1 && indx1 == indx2) {
    indx2 = Math.floor(Math.random() * userReadManga.length)
  }


  let manga1 = userReadManga[indx1];
  let manga2 = userReadManga[indx2];


  if (manga1 == undefined){
    manga1 = hotManga[Math.floor(Math.random() * hotManga.length)].IndexName
  }

  if (manga2 == undefined){
    manga2 = hotManga[Math.floor(Math.random() * hotManga.length)].IndexName
  }

  let fetchRecd = await fetch(window.location.origin + `/api/manga/recommend?manga1=${manga1}&manga2=${manga2}`)
  let data = await fetchRecd.json();

  if (data.length < 6) {
    getRecommendedManga(obj);
    return;
  }

  let htmlGenreated = genreateRecdHTML(data);

  obj.innerHTML = htmlGenreated;

}

// show Scroll to top button or not
window.addEventListener('scroll', function() {
  if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
    document.getElementById('scroll_to_top').style.opacity = "1";
  } else {
    document.getElementById('scroll_to_top').style.opacity = "0";
  }
})

// chnge image url so if it is blocked people can unblock it
function changeImagesURL() {
  document.querySelectorAll('img').forEach((img) => {
    if (img.getAttribute('src').includes('axiostrailbaby')) {
      //https://axiostrailbaby.lavishkumar1.repl.co/sendImage/temp.compsci88.com%20cover%20The-World-After-the-Fall.jpg
      img.setAttribute('src', '//' + img.getAttribute('src').split('sendImage/')[1].replace('%20', '/'));
    }
  })
}