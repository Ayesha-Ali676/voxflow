require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    // Attempting to use v1 instead of v1beta
    // Note: Some versions of the SDK might not directly support this in the constructor 
    // depending on the version, but let's try the common way or check the result.
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: "v1" });
    
    const result = await model.generateContent("Hi");
    console.log("✅ Success with v1:", result.response.text());
  } catch (e) {
    console.log("❌ Failed with v1:", e.message);
  }
}

test();
