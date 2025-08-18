import * as functions from "firebase-functions";
import cloudinary from "cloudinary";
import 'dotenv/config'; // loads .env automatically

// ---------------------------
// Test Cloudinary connectivity
// ---------------------------
export const testCloudinary = functions.https.onCall(async (_, context) => {
  try {
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
      api_key: process.env.CLOUDINARY_API_KEY || "",
      api_secret: process.env.CLOUDINARY_API_SECRET || ""
    });

    const envLoaded = !!process.env.CLOUDINARY_CLOUD_NAME;

    return {
      status: envLoaded
        ? "Cloudinary environment loaded"
        : "Cloudinary environment missing",
      env_loaded: envLoaded
    };
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
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    if (!data?.public_id) throw new functions.https.HttpsError("invalid-argument", "Missing 'public_id'");

    // --- Fail-Safe Credential Loading ---
    const { cloud_name, api_key, api_secret } = {
      // Priority 1: Firebase Config (production)
      ...functions.config().cloudinary,
      // Priority 2: .env (local/backup)
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    };

    if (!cloud_name || !api_key || !api_secret) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Cloudinary credentials missing in both Firebase Config and .env."
      );
    }

    // --- Initialize Cloudinary ---
    cloudinary.v2.config({ cloud_name, api_key, api_secret });

    // --- Execute Deletion ---
    const result = await cloudinary.v2.uploader.destroy(data.public_id);
    console.log("Deletion successful. Cloudinary response:", result);

    return { status: "success", result };
  } catch (err) {
    console.error("Deletion failed:", err);
    throw new functions.https.HttpsError("internal", err.message);
  }
});
