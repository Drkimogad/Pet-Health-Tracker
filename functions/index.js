const functions = require('firebase-functions');
const cloudinary = require('cloudinary').v2;

exports.testCloudinary = functions.https.onCall((data, context) => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
      api_key: process.env.CLOUDINARY_API_KEY || "",
      api_secret: process.env.CLOUDINARY_API_SECRET || ""
    });

    return {
      status: "Cloudinary connection attempted",
      env_loaded: !!process.env.CLOUDINARY_CLOUD_NAME
    };
  } catch (err) {
    return { status: "Error initializing Cloudinary", error: err.message };
  }
});
