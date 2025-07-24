// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

admin.initializeApp();

// 🔐 Configure Cloudinary from .env variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 🌩️ HTTPS Callable Function
exports.deleteCloudinaryImage = functions.https.onCall(async (data, context) => {
  const { publicId } = data;

  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be signed in.");
  }

  if (!publicId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing publicId.");
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return { success: true, result };
  } catch (error) {
    console.error("❌ Cloudinary deletion failed:", error);
    throw new functions.https.HttpsError("internal", "Failed to delete image.");
  }
});
