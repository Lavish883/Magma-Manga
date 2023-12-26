// for push notifications
const publicVapidKey = 'BKyhUO8OC44nSm7jC9y4JNwtiSD5Vx54vi4dAsW_LzuWgzlAkEGnaAnCO5JyXQd6shkykEawR9chC7frvDE0N2U';
const cacheName = 'offline-pagesv1-7';
// cache these resources
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
// on install it caches all the resources, in the precacheResources array
self.addEventListener('install', (event) => {
    console.log('The service worker is being installed....');
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
// on fetch, if the user is going to a page, then try to fetch it, if that fails then return the offline page
self.addEventListener('fetch', (event) => {
    // if u are going to a page
    if (event.request.mode === "navigate") { 
        event.respondWith(
            // try to respond with the page by fetching it, if that fails
            // meaning the user is offline, then return the offline page
            fetch(event.request).catch(async() => {
                const cache = await caches.open(cacheName);
                if (event.request.url.includes('/manga/offline/read')) {
                    return cache.match('/manga/offline/read');
                }
                return cache.match('/manga/offline');
            })
        );
    } else { 
        // To serve static files, so if the user is trying to acces any static file
        // with under the /offline/ directory, then serve it from the cache
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

// show notifaction if received from the server
self.addEventListener('push', event => {
    const data = event.data.json();
    console.log('Push Recieved...', data);

    self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/images/navbar.brand.png",
        image: data.img,
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        data: data
    });

    var init = { "status": 200, "statusText": "I am a custom service worker response!" };
    return new Response(null, init);
});

// what to do if the notification is clicked
self.addEventListener('notificationclick', (event) => {
    var notificationData = event.notification.data;

    console.log(notificationData, event.notification);
    event.notification.close();

    if (notificationData.link != null || notificationData.link != undefined) {
        clients.openWindow(notificationData.link + '-page-1');
    }
})