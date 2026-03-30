const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config();

async function testEnvConnection() {
  console.log("🔍 Testing Firestore connection using ENV variables...");
  
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
      credential: admin.credential.cert(serviceAccount)
    });

    const db = admin.firestore();
    const snapshot = await db.collection('projects').limit(1).get();
    console.log("✅ Firestore connection successful using ENV!");
    console.log(`Found ${snapshot.size} projects.`);
  } catch (error) {
    console.error("❌ Firestore connection failed using ENV:");
    console.error(error);
  }
}

testEnvConnection();
