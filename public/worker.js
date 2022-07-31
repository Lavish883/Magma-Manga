console.log('Service Worker Loaded');

self.addEventListener('push', event => {
    const data = event.data.json();
    console.log('Push Recieved...');

    self.registration.showNotification(data.title, {
        body: "Notified by Traversy Media!",
        icon: "http://image.ibb.co/frYOFd/tmlogo.png"
    });
})