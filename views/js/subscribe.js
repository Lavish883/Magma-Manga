const publicVapidKey = 'BKyhUO8OC44nSm7jC9y4JNwtiSD5Vx54vi4dAsW_LzuWgzlAkEGnaAnCO5JyXQd6shkykEawR9chC7frvDE0N2U';

// check if we can use service worker in the browser
if ('serviceWorker' in navigator) {
    send().catch(err => console.log(err));
}

async function subscribeToServer(subscription) {
    await fetch("/notifaction/subscribe", {
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

// Register SW and Register Push notification
async function send() {
    var refreshToken = window.localStorage.getItem("refreshToken");
    // sees if user is logged in or not kinda
    if (refreshToken == undefined || refreshToken == null || refreshToken.length < 10) {
        console.log('not logged in');
        return;
    }

    // Register Service Worker
    const register = await navigator.serviceWorker.register("/sw.js", {
        scope: "/test/not.html"
    });

    // Register Push if user isnt already subscribed
    if (!(await register.pushManager.getSubscription())) { // checks if we already subscribed
        const subscription = await register.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
        subscribeToServer(subscription)
    } else {
        console.log('already subscribed');
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}