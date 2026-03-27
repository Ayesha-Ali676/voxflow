const admin = require('firebase-admin');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');

if (!admin.apps.length) {
  if (fs.existsSync(serviceAccountPath)) {
    console.log("🔄 Initializing Firebase Admin with JSON key file...");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
    console.log("✅ Firebase Admin initialized using JSON key file.");
  } else if (process.env.FIREBASE_PRIVATE_KEY) {
    console.log("🔄 Initializing Firebase Admin with environment variables...");
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
    console.log("✅ Firebase Admin initialized using environment variables.");
  } else {
    throw new Error("❌ No Firebase credentials found (JSON or ENV).");
  }
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

module.exports = { admin, db, bucket };
