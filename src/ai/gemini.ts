import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || ''; 

// If using OpenRouter, you might need to change the baseUrl. 
// However, the standard SDK points to Google. 
// Assuming the user provided a Google Key or OpenRouter Key that works with a compatible endpoint 
// OR simply using the Google SDK for Gemini.
// If using OpenRouter with this SDK, the setup is different. 
// But let's stick to the standard Google SDK usage for simplicity as requested "Google Gemini".

const genAI = new GoogleGenerativeAI(API_KEY);

export async function getGeminiResponse(prompt: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Sorry, I couldn't process that request.";
  }
}
