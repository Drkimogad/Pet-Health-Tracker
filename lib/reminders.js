// lib/reminders.js
import { firestore } from './firebase.config'; // Your Firebase instance
import { sendPushNotification } from './pushNotifications';

export async function checkAndSendReminders() {
  try {
    const now = new Date();
    const remindersRef = firestore.collection('reminders');
    
    // 1. Query for pending reminders
    const snapshot = await remindersRef
      .where('notified', '==', false)
      .where('dueDate', '<=', now)
      .get();

    if (snapshot.empty) {
      console.log('No due reminders found');
      return { processed: 0 };
    }

    // 2. Process reminders in parallel
    const results = await Promise.allSettled(
      snapshot.docs.map(async doc => {
        try {
          const { userId, message, petName } = doc.data();
          
          // Get user's notification permission
          const userDoc = await firestore.collection('users').doc(userId).get();
          const { notificationEnabled } = userDoc.data();

          if (!notificationEnabled) {
            await doc.ref.update({ notified: true });
            return 'skipped (notifications disabled)';
          }

          // Send notification
          await sendPushNotification(
            `${petName} Reminder`,
            message
          );

          // Mark as notified
          await doc.ref.update({ notified: true });
          return 'success';
        } catch (error) {
          console.error(`Reminder ${doc.id} failed:`, error);
          return 'error';
        }
      })
    );

    // 3. Return processing summary
    const stats = results.reduce((acc, { status, value }) => {
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});

    console.log('Reminder processing complete:', stats);
    return stats;

  } catch (error) {
    console.error('Reminder check failed:', error);
    throw error;
  }
}
