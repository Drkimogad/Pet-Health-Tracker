import * as functions from "firebase-functions";
import cloudinary from "cloudinary";
import cors from "cors";
import * as admin from "firebase-admin";
// import "dotenv/config"; // loads .env locally deploymend succedded when it was commented out

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
    throw new Error(
      "Cloudinary credentials missing. Set with `firebase functions:config:set cloudinary.cloud_name=XXX cloudinary.api_key=XXX cloudinary.api_secret=XXX`"
    );
  }

  cloudinary.v2.config({ cloud_name, api_key, api_secret });
  return { cloud_name, api_key };
}

// ---------------------------
// Test Cloudinary connectivity (keep as callable)
// ---------------------------
export const testCloudinary = functions.https.onCall(async () => {
  try {
    loadCloudinaryConfig();
    return { status: "ok", message: "Cloudinary environment loaded" };
  } catch (err) {
    console.error("Cloudinary test error:", err);
    return { status: "error", message: err.message };
  }
});

// ---------------------------
// DELETE IMAGE - NOW AS REGULAR HTTP FUNCTION (NOT CALLABLE)
// ---------------------------
export const deleteImage = functions.https.onRequest(async (request, response) => {
  // Handle CORS first
  corsHandler(request, response, async () => {
    try {
      // --- Auth Validation ---
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        response.status(401).json({ error: "Authentication required" });
        return;
      }

      const token = authHeader.split('Bearer ')[1];
      
      // Verify Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      // --- Input Validation ---
      const { public_id } = request.body;
      if (!public_id) {
        response.status(400).json({ error: "Missing 'public_id'" });
        return;
      }

      // --- Config ---
      loadCloudinaryConfig();

      // --- Execute Deletion ---
      const result = await cloudinary.v2.uploader.destroy(public_id);
      console.log("🗑️ Cloudinary deletion response:", result);

      if (result.result === "ok") {
        response.json({ status: "success", message: "Image deleted successfully", result });
      } else if (result.result === "not found") {
        response.json({ status: "warning", message: "Image not found (already deleted?)", result });
      } else {
        response.json({ status: "warning", message: "Unexpected response", result });
      }

    } catch (err) {
      console.error("Deletion failed:", err);
      
      if (err.code === 'auth/id-token-expired') {
        response.status(401).json({ error: "Token expired" });
      } else if (err.code === 'auth/argument-error') {
        response.status(401).json({ error: "Invalid token" });
      } else {
        response.status(500).json({ error: err.message });
      }
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
});
//→ This pulls values from .env automatically (no need for dotenv/config import, the Firebase CLI now handles it).



