import * as functions from "firebase-functions";
import cloudinary from "cloudinary";

// ---------------------------
// Configure Cloudinary
// ---------------------------
cloudinary.v2.config({
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
    if (!data?.public_id) {
      throw new Error("Missing 'public_id' in request data");
    }

    const result = await cloudinary.v2.uploader.destroy(data.public_id);

    if (result.result !== "ok") {
      console.warn("Cloudinary deletion warning:", result);
      return { status: "warning", message: "Image not fully deleted", result };
    }

    return { status: "success", message: "Image deleted successfully", result };
  } catch (err) {
    console.error("Cloudinary deletion error:", err);
    return { status: "error", message: err.message };
  }
});
