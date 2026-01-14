require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

async function main() {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.error("No GEMINI_API_KEY found in .env");
            return;
        }
        console.log("Using API Key:", process.env.GEMINI_API_KEY.substring(0, 5) + "...");

        const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        console.log("Fetching models...");
        const response = await client.models.list();
        const models = response.models || [];
        console.log("Found models:", models.length);
        models.forEach(m => {
            console.log(`MODEL: ${m.name}`);
        });

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

main();
