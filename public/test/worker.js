console.log('Service Worker Loaded');

self.addEventListener('push', event => {
    const data = event.data.json();
    console.log('Push Recieved...');

    self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/images/navbar.brand.png",
        image: data.img,
        vibrate: [200, 100, 200, 100, 200, 100, 200]
    });
})