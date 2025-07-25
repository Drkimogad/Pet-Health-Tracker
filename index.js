const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cloudinary = require("cloudinary").v2;
require('dotenv').config(); // Load .env for local development

admin.initializeApp();

// Simplified config loader (works in both environments)
const getCloudinaryConfig = () => {
  // Local development (using .env)
  if (process.env.FUNCTIONS_EMULATOR) {
    return {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    };
  }
  
  // Production (using Google Cloud Secrets)
  return {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 
               functions.config().cloudinary?.cloud_name,
    api_key: process.env.CLOUDINARY_API_KEY || 
             functions.config().cloudinary?.api_key,
    api_secret: process.env.CLOUDINARY_API_SECRET || 
                functions.config().cloudinary?.api_secret
  };
};

// Initialize Cloudinary once
cloudinary.config(getCloudinaryConfig());

exports.deleteImage = functions
  .runWith({
    timeoutSeconds: 30,
    memory: "256MB",
    minInstances: 0,
    maxInstances: 3 // Cost control
  })
  .https.onCall(async (data, context) => {
    // Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Auth required");
    }

    // Input validation
    if (!data.publicId) {
      throw new functions.https.HttpsError(
        "invalid-argument", 
        "Missing image ID"
      );
    }

    try {
      const result = await cloudinary.uploader.destroy(data.publicId);
      return { success: true, result };
    } catch (error) {
      functions.logger.error("Cloudinary deletion failed:", error);
      throw new functions.https.HttpsError(
        "internal", 
        "Deletion failed",
        error.message
      );
    }
  });