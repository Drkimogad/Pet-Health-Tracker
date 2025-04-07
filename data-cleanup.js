const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json'); // Get from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "your-project-url.firebaseio.com"
});

const db = admin.firestore();

async function cleanRemindersData() {
  try {
    const reminders = await db.collection('reminders').get();
    let count = 0;

    for (const doc of reminders.docs) {
      const data = doc.data();
      
      // 1. Clean up type field
      const cleanedType = data.type
        .toLowerCase()
        .replace(/['"]/g, '') // Remove quotes
        .trim();

      // 2. Validate type
      const validTypes = ['vaccination', 'checkup', 'grooming'];
      if (!validTypes.includes(cleanedType)) {
        console.log(`Skipping invalid type: ${cleanedType} in doc ${doc.id}`);
        continue;
      }

      // 3. Get pet name
      const petDoc = await db.doc(data.petId).get();
      const petName = petDoc.exists ? petDoc.data().name : 'Unknown Pet';

      // 4. Generate standardized message
      const dueDate = data.dueDate.toDate();
      const formattedDate = dueDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long'
      });

      let newMessage;
      switch(cleanedType) {
        case 'vaccination':
          newMessage = `${petName}'s vaccination is due on ${formattedDate} 🩺`;
          break;
        case 'checkup':
          newMessage = `${petName} needs a health checkup on ${formattedDate} 🏥`;
          break;
        case 'grooming':
          newMessage = `${petName}'s grooming appointment on ${formattedDate} ✂️`;
          break;
      }

      // 5. Update document
      await doc.ref.update({
        type: cleanedType,
        message: newMessage
      });

      count++;
      console.log(`Updated doc ${doc.id} (${count}/${reminders.size})`);
    }

    console.log(`Successfully updated ${count} reminders!`);
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

cleanRemindersData();
