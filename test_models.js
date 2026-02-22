require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Dummy init to check connection
    // There isn't a direct "listModels" method in the simplified standard usage often, 
    // but usually 404 means the specific model string is wrong.
    // Let's try to just run a simple test with a known stable model to verify the key/connection first.
    
    console.log("Testing specific models...");
    
    const modelsToTest = ["gemini-2.5-flash", "gemini-2.5-pro"];
    
    for (const modelName of modelsToTest) {
        process.stdout.write(`Testing ${modelName}... `);
        try {
            const m = genAI.getGenerativeModel({ model: modelName });
            const result = await m.generateContent("Hello");
            console.log("✅ SUCCESS");
        } catch (e) {
            console.log("❌ FAILED (" + e.message.split(' ')[0] + "...)");
        }
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

listModels();
