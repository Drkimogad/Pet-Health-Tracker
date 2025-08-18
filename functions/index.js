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

    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
      api_key: process.env.CLOUDINARY_API_KEY || "",
      api_secret: process.env.CLOUDINARY_API_SECRET || ""
    });

    const result = await cloudinary.v2.uploader.destroy(data.public_id);

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
    return { status: "error", message: err.message };
  }
});
