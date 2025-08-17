import * as functions from "firebase-functions";
import cloudinary from "cloudinary";

// ==============================
// Cloudinary Configuration
// ==============================
cloudinary.v2.config({
  cloud_name: functions.config().cloudinary.cloud_name || "",
  api_key: functions.config().cloudinary.api_key || "",
  api_secret: functions.config().cloudinary.api_secret || ""
});

// ==============================
// Test Cloudinary Connectivity
// ==============================
export const testCloudinary = functions.https.onCall(async (_, context) => {
  try {
    const connected = !!functions.config().cloudinary.cloud_name;
    return {
      status: connected ? "Cloudinary environment loaded" : "Cloudinary environment missing",
      env_loaded: connected
    };
  } catch (err) {
    console.error("Error initializing Cloudinary:", err);
    return { status: "error", message: err.message };
  }
});

// ==============================
// Delete Cloudinary Image
// ==============================
export const deleteImage = functions.https.onCall(async (data, context) => {
  try {
    if (!data?.public_id) {
      throw new Error("Missing 'public_id' in request data");
    }

    const result = await cloudinary.v2.uploader.destroy(data.public_id);

    if (result.result !== "ok") {
      console.warn("Cloudinary deletion result:", result);
      return { status: "warning", message: "Image not fully deleted", result };
    }

    return { status: "success", message: "Image deleted successfully", result };
  } catch (err) {
    console.error("Cloudinary deletion error:", err);
    return { status: "error", message: err.message };
  }
});

// ==============================
// Optional: Add more functions here
// e.g., batch delete, image transformation, etc.
// ==============================
