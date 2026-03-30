const admin = require('firebase-admin');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
const envProjectId = process.env.FIREBASE_PROJECT_ID;

if (!admin.apps.length) {
  let initialized = false;

  // 1. Try ENV variables first if they match the desired project ID
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PROJECT_ID) {
    console.log(`🔄 Initializing Firebase Admin for project: ${envProjectId} using ENV variables...`);
    try {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.startsWith('"') 
        ? process.env.FIREBASE_PRIVATE_KEY.slice(1, -1).replace(/\\n/g, '\n')
        : process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
      console.log(`✅ Firebase Admin initialized for [${envProjectId}] via ENV.`);
      initialized = true;
    } catch (error) {
      console.error("❌ Failed to initialize Firebase with ENV variables:", error.message);
    }
  }

  // 2. Fallback to JSON key file only if not already initialized
  if (!initialized && fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      console.log(`🔄 Initializing Firebase Admin for project: ${serviceAccount.project_id} using JSON key file...`);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.firebasestorage.app`
      });
      console.log(`✅ Firebase Admin initialized for [${serviceAccount.project_id}] via JSON.`);
      initialized = true;
    } catch (error) {
      console.error("❌ Failed to initialize Firebase with JSON key file:", error.message);
    }
  }

  if (!initialized) {
    console.error("❌ CRITICAL: No valid Firebase credentials found (JSON or ENV). Backend will fail on DB calls.");
  }
}

let db = null;
let bucket = null;

if (admin.apps.length > 0) {
  try {
    db = admin.firestore();
    bucket = admin.storage().bucket();
  } catch (error) {
    console.error("❌ Failed to initialize Firestore or Storage instance:", error.message);
  }
}

module.exports = { admin, db, bucket };

