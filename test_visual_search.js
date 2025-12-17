
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyCS_BF4fF_ILPNw5D1rq-CVYaOTA7csEuE");

async function run() {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        tools: [{ googleSearch: {} }],
    });

    const prompt = "best padel rockets 2025";
    console.log("Searching for:", prompt);

    const result = await model.generateContent(prompt);
    const response = await result.response;

    if (response.candidates && response.candidates[0].groundingMetadata && response.candidates[0].groundingMetadata.groundingChunks) {
        console.log("\nGrounding Chunks:");
        console.log(JSON.stringify(response.candidates[0].groundingMetadata.groundingChunks, null, 2));
    } else {
        console.log("\nNo grounding chunks found.");
        if (response.candidates[0].groundingMetadata) {
            console.log("Metadata keys:", Object.keys(response.candidates[0].groundingMetadata));
        }
    }
}

run();
