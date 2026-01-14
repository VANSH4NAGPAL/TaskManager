import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { z } from "zod";

// Try to import from the new SDK
// Note: Types might differ, ensuring compatibility
// usage: import { GoogleGenerativeAI } from "@google/genai"; 
// Wait, the user said utilize the NEW SDK @google/genai. 
// The export might be 'GenAI' or similar. 
// I will try standard import.

const router = Router();

const generateSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
});

router.post("/generate-subtasks", requireAuth, async (req: AuthRequest, res) => {
    try {
        const { title, description } = generateSchema.parse(req.body);

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "Server AI configuration missing" });
        }

        // Implementation using the new @google/genai SDK
        const { GoogleGenAI } = require("@google/genai");

        const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const prompt = `You are a helpful project manager. Break down the following task into 3-5 actionable subtasks AND suggest 1-3 relevant short tags (e.g. "design", "backend", "urgent").
    
    Task Title: ${title}
    ${description ? `Description: ${description}` : ""}
    
    Return the result as a valid JSON object with this exact structure:
    {
      "subtasks": "- Subtask 1\n- Subtask 2...",
      "tags": ["tag1", "tag2"]
    }
    Do not include markdown formatting (like \`\`\`json). Return raw JSON only.
    `;

        const response = await client.models.generateContent({
            model: "gemini-3-flash-preview", // Using reliable model for JSON
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        // Debug log
        console.log("AI Response keys:", Object.keys(response || {}));

        const candidate = response.candidates?.[0];
        const generatedText = candidate?.content?.parts?.[0]?.text;

        if (!generatedText) {
            console.error("No text in response:", JSON.stringify(response, null, 2));
            throw new Error("AI returned no content");
        }

        // Parse JSON
        let result;
        try {
            // Remove any potential markdown fence if the model ignores the instruction
            const cleanJson = generatedText.replace(/```json/g, "").replace(/```/g, "").trim();
            result = JSON.parse(cleanJson);
        } catch (e) {
            console.error("Failed to parse JSON:", generatedText);
            // Fallback for plain text if it fails
            result = { subtasks: generatedText, tags: [] };
        }

        res.json(result);

    } catch (error: any) {
        console.error("AI Error:", error);
        res.status(500).json({ error: error.message || "Failed to generate subtasks" });
    }
});

export default router;
