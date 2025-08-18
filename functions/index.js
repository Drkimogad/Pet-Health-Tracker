import * as functions from "firebase-functions";
import cloudinary from "cloudinary";
import "dotenv/config"; // loads .env locally

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
// Delete a Cloudinary image by public_id
// ---------------------------
export const deleteImage = functions.https.onCall(async (data, context) => {
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
      return { status: "success", message: "Image deleted successfully", result };
    } else if (result.result === "not found") {
      return { status: "warning", message: "Image not found (already deleted?)", result };
    } else {
      return { status: "warning", message: "Unexpected response", result };
    }
  } catch (err) {
    console.error("Deletion failed:", err);
    throw new functions.https.HttpsError("internal", err.message);
  }
});
