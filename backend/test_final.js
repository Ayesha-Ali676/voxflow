require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    console.log("Testing with GEMINI_API_KEY:", process.env.GEMINI_API_KEY.substring(0, 10) + "...");
    const result = await model.generateContent("Hello");
    console.log("✅ SUCCESS with gemini-1.5-flash:", result.response.text());
  } catch (e) {
    console.log("❌ FAILED with gemini-1.5-flash:", e.message);
  }
}

test();
