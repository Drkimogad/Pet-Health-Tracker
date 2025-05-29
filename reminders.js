import { firestore } from './firebase.config';
import { sendPushNotification } from './pushNotifications';

export async function checkAndSendReminders() {
  try {
    // 1. Get current Nairobi time
    const nairobiNow = new Date().toLocaleString("en-US", {
      timeZone: process.env.TZ
    });
    const nowDate = new Date(nairobiNow);
    console.log('Processing reminders for:', nowDate);

    // 2. Query Firestore
    const remindersRef = firestore.collection('reminders');
    const snapshot = await remindersRef
      .where('notified', '==', false)
      .where('dueDate', '<=', firestore.Timestamp.fromDate(nowDate))
      .get();

    // 3. Process reminders
    const results = await Promise.allSettled(
      snapshot.docs.map(async doc => {
        try {
          const reminder = doc.data();
          
          // Convert Firestore timestamp to Nairobi time
          const dueDate = reminder.dueDate.toDate().toLocaleString("en-US", {
            timeZone: process.env.TZ
          });
          console.log(`Processing reminder for ${dueDate}`);

          // Your notification logic
          await sendPushNotification(
            `🔔 ${reminder.petName} Reminder`,
            reminder.message
          );

          await doc.ref.update({ notified: true });
          return { id: doc.id, status: 'success' };
        } catch (error) {
          return { id: doc.id, status: 'failed', error: error.message };
        }
      })
    );

    return {
      total: results.length,
      success: results.filter(r => r.value?.status === 'success').length,
      failures: results.filter(r => r.value?.status === 'failed').length
    };

  } catch (error) {
    console.error('Reminder processing failed:', error);
    throw error;
  }
}
