const publicVapidKey = 'BKyhUO8OC44nSm7jC9y4JNwtiSD5Vx54vi4dAsW_LzuWgzlAkEGnaAnCO5JyXQd6shkykEawR9chC7frvDE0N2U';

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

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

async function updateSubscription(oldSubscription, newSubscription) {
    await fetch("/notification/updateSubscribe", {
        method: "POST",
        body: JSON.stringify({
            "oldSubscription": oldSubscription,
            "newSubscription": newSubscription
        }),
        headers: {
            "content-type": "application/json"
        }
    });

    console.log('re-subscribed')
}

function updatePushSubscription(subscription) {
    console.log('okay we need to update >>>>>>>>')
}

// show notifaction if recivd from the server
self.addEventListener('push', event => {
    const data = event.data.json();
    console.log('Push Recieved...', data);

    if (data.type == 'updatingSubscription') {
        /*
        // update  push subscription after all notifications have been received
        self.registration.pushManager.getSubscription().then( async function (subscription) {
            var oldSubscription = subscription;
            console.log(subscription);

            var newSubscription = await self.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
            })

            console.log(newSubscription)

            updateSubscription(oldSubscription, newSubscription)
            self.registration.showNotification('sub updated', {

            })
        })
        */
    } else {
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: "/images/navbar.brand.png",
            image: data.img,
            vibrate: [200, 100, 200, 100, 200, 100, 200],
            data: data
        });
    }

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