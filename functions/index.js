import * as functions from "firebase-functions";
import cloudinary from "cloudinary";

// Configure Cloudinary using environment variables
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || ""
});

// Test connectivity to Cloudinary
export const testCloudinary = functions.https.onCall(async (_, context) => {
  try {
    // Just check if env is loaded
    const connected = !!process.env.CLOUDINARY_CLOUD_NAME;
    return {
      status: connected ? "Cloudinary environment loaded" : "Cloudinary environment missing",
      env_loaded: connected
    };
  } catch (err) {
    console.error("Error initializing Cloudinary:", err);
    return { status: "error", message: err.message };
  }
});

// Delete a Cloudinary image by public_id
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
