require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // There isn't a direct listModels in the SDK for the genAI object usually, 
    // it's often done via the REST API or specific methods.
    // However, let's try a simple generation with a known model that usually works everywhere.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hi");
    console.log("Success with gemini-1.5-flash:", result.response.text());
  } catch (e) {
    console.log("Error with gemini-1.5-flash:", e.message);
    
    // Try gemini-1.5-pro
    try {
        const modelPro = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const resultPro = await modelPro.generateContent("Hi");
        console.log("Success with gemini-1.5-pro:", resultPro.response.text());
    } catch (e2) {
        console.log("Error with gemini-1.5-pro:", e2.message);
        
        // Try gemini-pro (Gemini 1.0)
        try {
            const modelLegacy = genAI.getGenerativeModel({ model: "gemini-pro" });
            const resultLegacy = await modelLegacy.generateContent("Hi");
            console.log("Success with gemini-pro:", resultLegacy.response.text());
        } catch (e3) {
            console.log("Error with gemini-pro:", e3.message);
        }
    }
  }
}

test();
