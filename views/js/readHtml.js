var longStrip = !window.location.href.includes("-page-")
var currentlyOnPage = window.location.href.split(`-page-`)[1]



function changeReadingStyle(obj, userClicked = true) {
  // check if either longstrip is actived or not
  if (longStrip == true){
      obj.children[0].classList.remove("fa-arrows-alt-v");
      obj.children[0].classList.add("fa-columns");
      obj.children[1].innerText = "Single Page";
      currentlyOnPage = 'F';
      showImages(currentlyOnPage);
      document.getElementById('imgs').children[0].scrollIntoView();
;  } else {
      obj.children[0].classList.add("fa-arrows-alt-v");
      obj.children[0].classList.remove("fa-columns");
      obj.children[1].innerText = "Long Strip"
      if (userClicked) {
          currentlyOnPage = 1;
          showImages(currentlyOnPage);
      }
  }
}
// show Images in single Page mode
function showImages(page) {
    // make all the pages display:none;
    var allImgs = document.getElementById('imgs');
    for (var i = 0; i < allImgs.childElementCount; i++) {
        if (!isNaN(page)) {
            allImgs.children[i].style.display = 'none';
        } else {
            console.log('block')
            allImgs.children[i].style.display = 'block';
        }
    }
    if (!isNaN(page)) {
        allImgs.children[page - 1].style.display = 'block';
        document.getElementById("pageNumber").innerText =  'Page ' + page
        window.scrollTo(0, 0);
    }
}

// listen to page clicks either it is left or right
function movePage(event) {
    let pWidth = $(this).innerWidth();
    let pOffset = $(this).offset();
    var x = event.pageX - pOffset.left;
    if (pWidth / 2 > x) {
        currentlyOnPage--;
    } else {
        currentlyOnPage++;
    }
    if (longStrip == false) {
        showImages(currentlyOnPage)
    } else {
        var ScrollToPlease = window.pageYOffset + 700 || document.documentElement.scrollTop + 700
        console.log('Scroll T please')
        console.log(ScrollToPlease)
        window.scroll({
            top: ScrollToPlease,
            left: 0,
            behavior: 'smooth'
        })
    }
}
// go to the next chapter
// direction meaning either next chapter or previous chapter
function moveChapter(direction) {
    var chapterToLook = direction == 'next' ? currentChapter.Chapter + 1 : currentChapter.Chapter - 1;

    for (var i = 0; i < chapters.length; i++) {
        if (chapters[i].Chapter == chapterToLook) {
            if (longStrip) {
                window.location.href = window.location.origin + '/manga/read/' + chapters[i].ChapterLink;
            } else {
                let chapterPageToStart = direction == 'next' ? '-page-1' : '-page-' + chapters[i].Page;
                window.location.href = window.location.origin + '/manga/read/' + chapters[i].ChapterLink + chapterPageToStart;
            }
            return;
        }
    }
    alert('No more next chapters. You are all caught up')
}
// updtae url accordingly


// event listeners 
    // listen for page clicks
document.getElementById('imgs').addEventListener("click", movePage);

// function calls
changeReadingStyle(document.getElementById("readingStyle"), false)
showImages(parseInt(currentlyOnPage))