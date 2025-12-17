import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const genAI = new GoogleGenerativeAI(process.env.VITE_GOOGLE_API_KEY);

async function listModels() {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.VITE_GOOGLE_API_KEY}`
        );
        const data = await response.json();

        console.log("Available Models:");
        data.models.forEach(model => {
            if (model.supportedGenerationMethods.includes('generateContent')) {
                console.log(`- ${model.name} (${model.displayName})`);
            }
        });

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
