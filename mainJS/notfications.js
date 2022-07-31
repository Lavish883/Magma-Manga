const webpush = require('web-push');


// subscribes to our notifactions service
async function subscribe(req, res) {
    // Get pushSubscription object
    const subscription = req.body;
    console.log(subscription);
    res.status(201).json({});

    // Create Payload
    const payload = JSON.stringify({ 'title': 'Push Test' });

    // Pass object into the subscription
    try {
        webpush.sendNotification(subscription, payload);
    } catch (err) {
        console.log(err);
    }
}


module.exports = {
    subscribe
}