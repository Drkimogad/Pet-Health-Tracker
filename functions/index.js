import * as functions from "firebase-functions";
import cloudinary from "cloudinary";
import cors from "cors"; // ADDED: Import cors
// import "dotenv/config"; // loads .env locally deploymend succedded when it was commented out

// ---------------------------
// CORS handler setup
// ---------------------------
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

  console.log("✅ Cloudinary config loaded from", 
    functions.config().cloudinary ? "Firebase config" : ".env");

  return { cloud_name, api_key };
}

// ---------------------------
// Test Cloudinary connectivity
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
// Delete a Cloudinary image by public_id (WITH CORS)
// ---------------------------
export const deleteImage = functions.https.onCall((data, context) => {
  return new Promise((resolve, reject) => {
    corsHandler(context.rawRequest, context.rawResponse, async () => {
      try {
        // --- Auth & Input Validation ---
        if (!context.auth) {
          throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
        }
        if (!data?.public_id) {
          throw new functions.https.HttpsError("invalid-argument", "Missing 'public_id'");
        }

        // --- Config ---
        loadCloudinaryConfig();

        // --- Execute Deletion ---
        const result = await cloudinary.v2.uploader.destroy(data.public_id);
        console.log("🗑️ Cloudinary deletion response:", result);

        if (result.result === "ok") {
          resolve({ status: "success", message: "Image deleted successfully", result });
        } else if (result.result === "not found") {
          resolve({ status: "warning", message: "Image not found (already deleted?)", result });
        } else {
          resolve({ status: "warning", message: "Unexpected response", result });
        }
      } catch (err) {
        console.error("Deletion failed:", err);
        reject(new functions.https.HttpsError("internal", err.message));
      }
    });
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



