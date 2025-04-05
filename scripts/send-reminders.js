const admin = require('firebase-admin');
const { getSubscriptions } = require('./db'); // Implement DB helper

admin.initializeApp({
  credential: admin.credential.cert(require('./service-account.json')),
  databaseURL: "https://pet-health-tracker-7164d.firebaseio.com"
});

async function sendReminders() {
  const subscriptions = await getSubscriptions();
  
  subscriptions.forEach(async (sub) => {
    await admin.messaging().sendToDevice(sub.token, {
      notification: {
        title: '🐾 Pet Reminder',
        body: 'Upcoming care reminder for your pet!'
      },
      data: {
        url: '/reminders' // Deep link to your app
      }
    });
  });
}

// Run daily at 9AM
sendReminders().catch(console.error);
