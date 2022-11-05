console.log('Service Worker Loaded');
importScripts('/test/localforage.min.js');

// chekcs if 12 hours have passed ebfore we last updated our subscription to the server
async function isItTime() {
    var lastTimeUpdated = new Date(await localforage.getItem('lastSubscribed'));
    console.log(lastTimeUpdated);

    var currentTime = new Date();
    // check how many miliiseconds and if its more than 12 hrs of it
    // 12 hrs to ms => 4.32 * Math.pow(10, 7)
    if (currentTime.getTime() - lastTimeUpdated.getTime() >= 4.32 * Math.pow(10, 7)) {
        return true;
    }
    return false;
}

async function updateSubscription(subscription) {
    await fetch("/notification/subscribe", {
        method: "POST",
        body: JSON.stringify({
            "subscription": subscription,
            "token": window.localStorage.getItem("refreshToken")
        }),
        headers: {
            "content-type": "application/json"
        }
    });
    console.log('subscribed')
}

function updatePushSubscription(subscription) {
    console.log(subscription);
    if (isItTime()) {
        console.log('letssssssssssssssss goooooooo')
    }
}

// show notifaction if recivd from the server
self.addEventListener('push', event => {
    const data = event.data.json();
    console.log('Push Recieved...');

    // update  push subscription after all notifications have been received
    setTimeout(() => {
        self.registration.pushManager.getSubscription().then((subscription) => {
            updatePushSubscription(subscription);
        })
    }, 1000) // 1 second

    console.log()
    self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/images/navbar.brand.png",
        image: data.img,
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        data: data
    });
    var init = { "status": 200, "statusText": "I am a custom service worker response!" };
    return new Response(null, init);
})

// what to do if the notifaction is clicked
self.addEventListener('notificationclick', (event) => {
    var notificationData = event.notification.data;

    event.notification.close();
    console.log(notificationData, event);

    if (notificationData.link != null || notificationData.link != undefined) {
        clients.openWindow(notificationData.link)
    }
})

