import * as functions from "firebase-functions";
import { v2 as cloudinaryV2 } from "cloudinary";

// ---------------------------
// Configure Cloudinary
// ---------------------------
cloudinaryV2.config({
  cloud_name: functions.config().cloudinary?.cloud_name || "",
  api_key: functions.config().cloudinary?.api_key || "",
  api_secret: functions.config().cloudinary?.api_secret || ""
});

// ---------------------------
// Test Cloudinary connectivity
// ---------------------------
export const testCloudinary = functions.https.onCall(async (_, context) => {
  try {
    const envLoaded = !!functions.config().cloudinary?.cloud_name;
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
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Request had no valid user context."
      );
    }

    if (!data?.public_id) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing 'public_id' in request data"
      );
    }

    const result = await cloudinaryV2.uploader.destroy(data.public_id);

    if (result.result === "ok") {
      return { status: "success", message: "Image deleted successfully", result };
    } else if (result.result === "not found") {
      return { status: "warning", message: "Image already deleted", result };
    } else {
      console.warn("Cloudinary deletion warning:", result);
      return { status: "warning", message: "Image not fully deleted", result };
    }
  } catch (err) {
    console.error("Cloudinary deletion error:", err);
    throw new functions.https.HttpsError("internal", err.message);
  }
});
