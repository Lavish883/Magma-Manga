const cacheName = 'offline-pagesv1-7';

const precacheResources = [
'/manga/offline', 
'/offline/navbar.png', 
'/offline/all.css', 
'/webfonts/fa-solid-900.woff2',
'/webfonts/fa-regular-400.woff2',
'/webfonts/fa-solid-900.ttf',
'/webfonts/fa-regular-400.ttf',
'/offline/all.js',
'/manga/offline/read'
]

self.addEventListener('install', (event) => {
    console.log('used to register the service worker');
    event.waitUntil(caches.open(cacheName).then(function (cache) {
        for (var i = 0; i < precacheResources.length; i++) {
            try {
                cache.add(precacheResources[i]);
            } catch (error) {
                console.log(error, precacheResources[i]);
            }
        }
    }));
})

self.addEventListener('activate', (event) => {
    console.log('this event triggers when the service worker activates');
})

self.addEventListener('fetch', (event) => {
    if (event.request.mode === "navigate") { // if u are going to a page
        event.respondWith(
            fetch(event.request).catch(async() => {
                const cache = await caches.open(cacheName);
                if (event.request.url.includes('/manga/offline/read')) {
                    return cache.match('/manga/offline/read');
                }
                return cache.match('/manga/offline');
            })
        );
    } else { // To serve static files
        if (!event.request.url.includes('/offline') && !event.request.url.includes('/webfonts')) {
            return;
        }
        event.respondWith(
            (async () => {
                const cachedResponse = await caches.match(event.request);
                return cachedResponse || fetch(event.request);
            })()
        );
    }
});
