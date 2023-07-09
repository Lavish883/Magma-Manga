self.addEventListener('install', function (event) {
    console.log('used to register the service worker')
})

self.addEventListener('activate', function (event) {
    console.log('this event triggers when the service worker activates')
})