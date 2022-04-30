function changeReadingStyle(obj) {
  console.log('clciked')
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
      currentlyOnPage = 1;
      showImages(currentlyOnPage);
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

document.getElementById('imgs').addEventListener("click", movePage);
