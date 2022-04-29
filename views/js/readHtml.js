function changeReadingStyle(obj){
  // check if either longstrip is actived or not
  try{
  if (obj.children[0].classList.includes("fa-arrows-alt-v")){
    obj.children[0].classList.remove("fa-arrows-alt-v");
    obj.children[0].classList.add("fas fa-columns");
  } else {
    obj.children[0].classList.remove("fa-arrows-alt-v");
    obj.children[0].classList.add("fas fa-columns");
  }
  } catch(err){
    alert(err)
  }
  alert('clicked')
  alert(obj.innerHTML)
  alert(obj.children[0].classList)
}