const publicVapidKey = 'BKyhUO8OC44nSm7jC9y4JNwtiSD5Vx54vi4dAsW_LzuWgzlAkEGnaAnCO5JyXQd6shkykEawR9chC7frvDE0N2U';

// check if we can use service worker in the browser
if ('serviceWorker' in navigator) {
    send().catch(err => alert(err));
}

// Register SW, Register Push, Send Push
async function send() {
    // Register Service Worker
    console.log("Registering service worker...");

    const register = await navigator.serviceWorker.register("worker.js", {
        scope: "/test/not.html"
    });

    console.log("Service Worker Registered...");

    // Register Push
    console.log("Registering Push...");

    const subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });

    console.log("Push Registered...");

    // Send Push Notification
    console.log("Sending Push...");

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
    console.log("Push Sent...");

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