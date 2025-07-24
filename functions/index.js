const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cloudinary = require("cloudinary").v2;

admin.initializeApp();

// Production: Uses Google Cloud Secret Manager
const getCloudinaryConfig = async () => {
  if (process.env.FUNCTIONS_EMULATOR) {
    // Local development
    return {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    };
  }
  
  // Production - Using Google Cloud Secrets
  const [cloudName, apiKey, apiSecret] = await Promise.all([
    getSecret("CLOUDINARY_CLOUD_NAME"),
    getSecret("CLOUDINARY_API_KEY"),
    getSecret("CLOUDINARY_API_SECRET")
  ]);
  
  return { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret };
};

// Helper to access Google Cloud Secrets
const getSecret = async (name) => {
  const [version] = await admin.credential.applicationDefault()
    .getClient()
    .then(client => client.secretManagerClient.accessSecretVersion({
      name: `projects/${process.env.GCLOUD_PROJECT}/secrets/${name}/versions/latest`
    }));
  return version.payload.data.toString();
};

// Initialize Cloudinary
let cloudinaryInitialized = false;
const initCloudinary = async () => {
  if (!cloudinaryInitialized) {
    const config = await getCloudinaryConfig();
    cloudinary.config(config);
    cloudinaryInitialized = true;
  }
};

exports.deleteImage = functions.https.onCall(async (data, context) => {
  await initCloudinary();
  
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Auth required");
  }

  try {
    const result = await cloudinary.uploader.destroy(data.publicId);
    return { success: true, result };
  } catch (error) {
    throw new functions.https.HttpsError("internal", "Deletion failed");
  }
});
