import * as functions from "firebase-functions";
import cloudinary from "cloudinary";
import admin from "firebase-admin";

// ✅ Safe Firebase initialization
if (!admin.apps.length) {
  admin.initializeApp();
}

// ---------------------------
// Helper: Load Cloudinary Config
// ---------------------------
function loadCloudinaryConfig() {
  const cfg = functions.config().cloudinary || {};
  const cloud_name = cfg.cloud_name || process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = cfg.api_key || process.env.CLOUDINARY_API_KEY;
  const api_secret = cfg.api_secret || process.env.CLOUDINARY_API_SECRET;

  if (!cloud_name || !api_key || !api_secret) {
    throw new Error("Cloudinary credentials missing");
  }

  cloudinary.v2.config({ cloud_name, api_key, api_secret });
  return { cloud_name, api_key };
}

// ---------------------------
// DELETE IMAGE - HTTPS FUNCTION
// ---------------------------
export const deleteImage = functions.https.onRequest(async (request, response) => {
  const setCors = () => {
    response.set('Access-Control-Allow-Origin', 'https://drkimogad.github.io');
    response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  };

  setCors();

  // Handle preflight OPTIONS
  if (request.method === 'OPTIONS') {
    response.status(200).send();
    return;
  }

  try {
    // --- Auth Validation ---
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      setCors();
      response.status(401).json({ error: "Authentication required" });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    await admin.auth().verifyIdToken(token);

    // --- Input Validation ---
    const { public_id } = request.body;
    if (!public_id) {
      setCors();
      response.status(400).json({ error: "Missing public_id" });
      return;
    }

    // --- Cloudinary deletion ---
    loadCloudinaryConfig();
    const result = await cloudinary.v2.uploader.destroy(public_id);
    console.log("🗑️ Cloudinary deletion response:", result);

    setCors();
    response.json({ status: "success", result });

  } catch (error) {
    console.error("❌ Deletion failed:", error);
    setCors();
    response.status(500).json({ error: error.message });
  }
});





// currently firebase is using this
//const functions = require("firebase-functions");
//const cloudinary = require("cloudinary").v2;

//cloudinary.config({
//  cloud_name: functions.config().cloudinary.cloud_name,
//  api_key: functions.config().cloudinary.api_key,
//  api_secret: functions.config().cloudinary.api_secret,
//});
//→ This pulls values from functions.config(). Works, but will die in 2026.


//import * as functions from "firebase-functions";
//import { v2 as cloudinary } from "cloudinary";

//cloudinary.config({
//  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//  api_key: process.env.CLOUDINARY_API_KEY,
//  api_secret: process.env.CLOUDINARY_API_SECRET,
// });
//→ This pulls values from .env automatically (no need for dotenv/config import, the Firebase CLI now handles it).



