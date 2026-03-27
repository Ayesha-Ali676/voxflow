const { db } = require('./src/config/firebase');

async function testConnection() {
  console.log("🔍 Testing Firestore connection...");
  try {
    const snapshot = await db.collection('projects').limit(1).get();
    console.log("✅ Firestore connection successful!");
    console.log(`Found ${snapshot.size} projects.`);
  } catch (error) {
    console.error("❌ Firestore connection FAILED:");
    console.error(error);
  }
}

testConnection();
