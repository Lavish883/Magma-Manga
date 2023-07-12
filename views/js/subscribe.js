document.addEventListener('DOMContentLoaded', init, false);

async function init() {
  if ('serviceWorker' in navigator) {
    try {
      var status = await navigator.serviceWorker.controller;
      
      if (status  == null) {
        var reg = await navigator.serviceWorker.register('/sw.js');
        console.log('Service worker registered! 😎', reg);
      } else {
        console.log('Service worker already registered 😅');
      }
    } catch (error){
      console.error('Error: ', error)
    }
  }
}