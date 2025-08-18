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
    // --- Auth & Input Checks (Unchanged) ---
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "No user context.");
    if (!data?.public_id) throw new functions.https.HttpsError("invalid-argument", "Missing 'public_id'");

    // --- Explicit Credential Check ---
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    if (!cloudName || !apiKey || !apiSecret) {
      throw new functions.https.HttpsError(
        "failed-precondition", 
        "Cloudinary credentials not configured. Check Firebase Environment Variables."
      );
    }

    // --- Initialize Cloudinary ---
    cloudinary.v2.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

    // --- Delete Image ---
    const result = await cloudinary.v2.uploader.destroy(data.public_id);
    console.log("Cloudinary deletion result:", result); // Log full response

    // --- Handle Response ---
    if (result.result === "ok") {
      return { status: "success", message: "Image deleted", result };
    } else {
      throw new functions.https.HttpsError(
        "internal", 
        `Cloudinary error: ${result.result || "Unknown failure"}`,
        result
      );
    }
  } catch (err) {
    console.error("DELETE ERROR:", err); // Detailed log
    throw new functions.https.HttpsError(
      "internal", 
      err.message || "Failed to delete image"
    );
  }
});
