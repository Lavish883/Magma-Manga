const publicVapidKey = 'BKyhUO8OC44nSm7jC9y4JNwtiSD5Vx54vi4dAsW_LzuWgzlAkEGnaAnCO5JyXQd6shkykEawR9chC7frvDE0N2U';

async function subscribeToServer(subscription) {
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
  console.log('subscribed');
}

async function init() {
  if ('serviceWorker' in navigator) {
    try {
      var reg = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registered! 😎', reg);
      send(reg).catch(err => console.log(err));
    } catch (error) {
      console.error('Error: ', error)
    }
  }
}

// Register Push notification
async function send(reg) {
  var refreshToken = window.localStorage.getItem("refreshToken");
  // sees if user is logged in or not kinda
  if (refreshToken == undefined || refreshToken == null || refreshToken.length < 10) {
      console.log('not logged in');
      return;
  }

  // Register Push if user isn't already subscribed
  var subStatus = await reg.pushManager.getSubscription();
  
  if (subStatus === null) { // checks if we already subscribed
      var subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });
      
      console.log(subscription);
      subscribeToServer(subscription)
  } else {
    console.log('already subscribed', subStatus);
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

document.addEventListener('DOMContentLoaded', init, false);