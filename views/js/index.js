// Generate hmtl 
function makeLatestChapterHTML(manga, isPopular, isCompleted) {
    return `
    <div class="latest_chapters_item">
        <a href="manga.html?manga=${manga.IndexName}" title="${manga.SeriesName}">
            <img src="${"https://cover.nep.li/cover/" + manga.IndexName + '.jpg'}" width="90" />
        </a>
        <a style="display:contents;" href="${"/manga/read/" + manga.ChapterLink + '-page-1'}" title="${manga.SeriesName + "&nbsp;Chapter&nbsp;" + manga.Chapter}">
            <div style="margin-left:15px; margin-top:8px;">
                <div class="latest_chapters_info">
                    ${isPopular ? `<i style="color:red" class="fas fa-fire-alt"></i>` : ''}
                    ${isCompleted ? `<i style="color:darkorange" class="fas fa-check-circle"></i>`: ''}
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
} else if (window.location.pathname.includes('/directory.html')) {
    document.getElementById('Directory_nav').classList.add('small_nav_active')
} else if (window.location.pathname.includes('/search.html')) {
    document.getElementById('Search_nav').classList.add('small_nav_active')
} else if (window.location.pathname.includes('/Bookmarks.html')) {
    document.getElementById('Bookmark_nav').classList.add('small_nav_active')
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