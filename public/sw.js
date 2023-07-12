const cacheName = 'offline-pages';

const precacheResources = ['/manga/offline', '/images/navbar.brand.png']

self.addEventListener('install', (event) => {
    console.log('used to register the service worker');
})

self.addEventListener('activate', (event) => {
    console.log('this event triggers when the service worker activates');
    event.waitUntil(caches.open(cacheName).then(function (cache) {
        cache.addAll(precacheResources);
    }));
})

self.addEventListener('fetch', (event) => {
    if (event.request.mode === "navigate") { // if u are going to a page
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('/manga/offline');
            })
        );
    } else { // To serve static files
        event.respondWith(
            (async () => {
                const cache = await caches.open(cacheName);
                const cachedResponse = await cache.match(event.request);
                return cachedResponse || fetch(event.request);
            })()
        );
    }
});
