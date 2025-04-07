// Add a secret key check to prevent unauthorized access to your endpoint.//
const AUTH_TOKEN = process.env.CRON_SECRET;
export default async function handler(req, res) {
  // Verify secret token
  if (req.headers.authorization !== `Bearer ${AUTH_TOKEN}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
    
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
console.log("🔥 Firebase Debugging: ");
console.log("✅ Private Key Loaded:", !!process.env.FIREBASE_PRIVATE_KEY);
console.log("🔹 Project ID:", process.env.FIREBASE_PROJECT_ID);
console.log("🔹 Client Email:", process.env.FIREBASE_CLIENT_EMAIL);

// Check for required environment variables
const requiredEnvVars = [
    "FIREBASE_TYPE",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_PRIVATE_KEY_ID",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_CLIENT_ID",
    "FIREBASE_AUTH_URI",
    "FIREBASE_TOKEN_URI",
    "FIREBASE_AUTH_PROVIDER_CERT_URL",
    "FIREBASE_CLIENT_CERT_URL"
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
    process.exit(1);
}

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                type: process.env.FIREBASE_TYPE,
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"), // Replace \\n with \n
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                clientId: process.env.FIREBASE_CLIENT_ID,
                authUri: process.env.FIREBASE_AUTH_URI,
                tokenUri: process.env.FIREBASE_TOKEN_URI,
                authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
                clientC509CertUrl: process.env.FIREBASE_CLIENT_CERT_URL,
            }),
        });
    } catch (error) {
        console.error("Error initializing Firebase Admin SDK:", error);
        process.exit(1);
    }
}

const db = getFirestore();  // ✅ Correctly initialize Firestore
// Allowed types (exact values)
const ALLOWED_TYPES = ['vaccination', 'checkup', 'grooming'];
function generateReminderMessage(type, petName, dueDate) {
  const formattedDate = dueDate.toDate().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long'
  });

  switch(type) {
    case 'vaccination':
      return `${petName}'s vaccination is due on ${formattedDate} 🩺`;
    case 'checkup':
      return `${petName} health checkup is due on ${formattedDate} 🏥`;
    case 'grooming':
      return `${petName}'s grooming appointment is due on ${formattedDate} ✂️`;
    default:
      return `${petName} has a care item due on ${formattedDate}`;
  }
}
  
export default async function handler(req, res) {
    // Set CORS headers for all requests
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Allow only GET requests
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const now = new Date();

        const remindersSnapshot = await db.collection('reminders')
            .where('notified', '==', false)
            .where('dueDate', '<=', now)
            .get();

        if (remindersSnapshot.empty) {
            console.log("No pending reminders found.");
            return res.status(200).json({ message: "No pending reminders found" });
        }

        let remindersSent = [];

        remindersSnapshot.forEach(async (doc) => {
            const reminder = doc.data();
            const userId = reminder.userId;

            try {
                const userDoc = await db.collection('users').doc(userId).get(); // ✅ Correct
                const userData = userDoc.data();
                const userToken = userData ? userData.fcmToken : null; // Assuming FCM token is in the user document

                if (userToken) {
                    // Send notification
                    const message = {
                        notification: {
                            title: '🐾 Pet Reminder',
                            body: reminder.message
                        },
                        token: userToken,
                    };

                    const response = await admin.messaging().send(message);
                    console.log('Successfully sent message to user:', userId, response);

                    await doc.ref.update({ notified: true });
                    remindersSent.push({ id: doc.id, message: reminder.message, userId: userId, sent: true });

                } else {
                    console.warn('FCM token not found for user:', userId);
                    await doc.ref.update({ notified: true }); // Mark as notified to avoid repeated attempts
                    remindersSent.push({ id: doc.id, message: reminder.message, userId: userId, sent: false, error: 'FCM token not found' });
                }
            } catch (error) {
                console.error('Error fetching user document or sending message for user:', userId, error);
                remindersSent.push({ id: doc.id, message: reminder.message, userId: userId, sent: false, error: error.message });
            }
        });

        console.log("Reminder processing complete.", remindersSent);
        return res.status(200).json({ message: "Reminder processing complete", sentReminders: remindersSent });

    } catch (error) {
        console.error("Error fetching and sending reminders:", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}
