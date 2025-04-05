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
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];
    // Fetch reminders from Firestore
    const remindersSnapshot = await db.collection("reminders").where("date", "==", today).get();
    if (remindersSnapshot.empty) {
      console.log("No reminders for today.");
      return res.status(200).json({ message: "No reminders today" });
    }
    // Extract reminder data
    let reminders = [];
    remindersSnapshot.forEach((doc) => {
      const reminder = doc.data();
      reminders.push(reminder);
      // Construct the personalized message

      const notificationMessage = `It's ${reminder.petname}'s (vaccinations, medical check-up,grooming) today. We wish our pawsome friend a fabulous day! 🐾`;
      // Send push notification
      const message = {
        notification: {
          title: 'Pet-Health-Tracker Reminder',
          body: notificationMessage,
        },
        token: reminder.token, // Assuming you store the token in the reminder document
      };
      admin.messaging().send(message)
        .then((response) => {
          console.log('Successfully sent message:', response);

        })
        .catch((error) => {
          console.error('Error sending message:', error);
        });
    });
    console.log("Reminders found and notifications sent:", reminders);
    return res.status(200).json({ reminders });

  } catch (error) {
    console.error("Error fetching reminders:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

