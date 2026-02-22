require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testVerbose() {
    const models = ["gemini-2.5-flash"];
    
    for (const m of models) {
        console.log(`\n--- Testing ${m} ---`);
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Say hello");
            console.log(`✅ Success! Response: ${result.response.text()}`);
            return; // Exit on first success
        } catch (error) {
            console.error(`❌ Error details for ${m}:`);
            if (error.response) {
                console.error("Status:", error.response.status);
                onsole.error("StatusText:", error.response.statusText);
            }
            console.error("Message:", error.message);
            // console.dir(error, { depth: null });
        }
    }
}

testVerbose();
