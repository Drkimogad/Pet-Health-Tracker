import { db } from './firebase'; // Your Firebase config
import { sendPushNotification } from './pushNotifications'; // Your existing code

export async function checkAndSendReminders() {
  try {
    const now = new Date();
    
    // 1. Query Firestore for pending reminders
    const remindersSnapshot = await db.collection('reminders')
      .where('notified', '==', false)
      .where('dueDate', '<=', now)
      .get();

    if (remindersSnapshot.empty) {
      console.log('No reminders to process');
      return;
    }

    // 2. Process each reminder
    const promises = remindersSnapshot.docs.map(async doc => {
      const reminder = doc.data();
      
      try {
        // Get user's FCM token
        const userDoc = await db.collection('users').doc(reminder.userId).get();
        const fcmToken = userDoc.data()?.fcmToken;

        if (!fcmToken) {
          console.log(`No FCM token for user ${reminder.userId}`);
          return;
        }

        // 3. Send notification
        await sendPushNotification(fcmToken, {
          title: `🐾 ${reminder.petName} Reminder`,
          body: reminder.message
        });

        // 4. Mark as notified
        await doc.ref.update({ notified: true });
        console.log(`Sent reminder for ${reminder.petName}`);

      } catch (error) {
        console.error(`Failed to process reminder ${doc.id}:`, error);
      }
    });

    await Promise.all(promises);
    console.log('Finished processing reminders');
    
  } catch (error) {
    console.error('checkAndSendReminders failed:', error);
    throw error;
  }
}
