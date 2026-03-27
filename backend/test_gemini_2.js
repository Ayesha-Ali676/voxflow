require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    const result = await model.generateContent("Respond with the word SUCCESS.");
    console.log("Result:", result.response.text());
  } catch (e) {
    console.log("Error:", e.message);
  }
}

test();
