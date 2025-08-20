import * as functions from "firebase-functions";
import cloudinary from "cloudinary";
import cors from "cors";
import * as admin from "firebase-admin";

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const corsHandler = cors({ origin: true });

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
// DELETE IMAGE - WITH PROPER CORS HANDLING
// ---------------------------
export const deleteImage = functions.https.onRequest(async (request, response) => {
  // Handle OPTIONS request (preflight)
  if (request.method === 'OPTIONS') {
    response.set('Access-Control-Allow-Origin', 'https://drkimogad.github.io');
    response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.set('Access-Control-Max-Age', '3600');
    response.status(204).send('');
    return;
  }

  // Handle actual request
  corsHandler(request, response, async () => {
    try {
      // --- Auth Validation ---
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        response.status(401).json({ error: "Authentication required" });
        return;
      }

      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      // --- Input Validation ---
      const { public_id } = request.body;
      if (!public_id) {
        response.status(400).json({ error: "Missing 'public_id'" });
        return;
      }

      // --- Config & Deletion ---
      loadCloudinaryConfig();
      const result = await cloudinary.v2.uploader.destroy(public_id);
      console.log("🗑️ Cloudinary deletion response:", result);

      response.json({
        status: "success",
        message: "Image deleted successfully",
        result
      });

    } catch (err) {
      console.error("Deletion failed:", err);
      response.status(500).json({ error: err.message });
    }
  });
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



