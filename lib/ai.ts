import { GoogleGenAI } from "@google/genai";

// We keep the old SDK for now if the user still has a key for it, 
// but we prioritize OpenRouter if available. 
// Actually, to fully migrate we should probably stick to one, but let's provide a fallback 
// or just standard fetch implementation for OpenRouter.

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Default model to use via OpenRouter
const DEFAULT_MODEL = "google/gemini-2.0-flash-001"; 

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  error?: {
    message: string;
  };
}

/**
 * Validates that an API key is available.
 */
export const checkApiKey = (): boolean => {
  if (OPENROUTER_API_KEY) return true;
  if (GEMINI_API_KEY) return true;
  return false;
};

/**
 * Generic function to call OpenRouter API
 */
async function callOpenRouter(
  messages: any[], 
  model: string = DEFAULT_MODEL, 
  responseFormat?: any
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API Key is missing. Please add VITE_OPENROUTER_API_KEY to your .env file.");
  }

  const headers = {
    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
    "HTTP-Referer": window.location.origin, // Required by OpenRouter for some tiers
    "X-Title": "SEWA App", // Optional
    "Content-Type": "application/json"
  };

  const body: any = {
    model: model,
    messages: messages,
  };

  if (responseFormat) {
    // OpenRouter/OpenAI usually expects { type: "json_object" } for JSON mode
    // But specific models might behave differently. 
    // For now we will try standard OpenAI compatible json mode if requested.
    if (responseFormat.type === 'json_object') {
        body.response_format = { type: "json_object" };
    }
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as OpenRouterResponse;
  
  if (data.error) {
    throw new Error(data.error.message);
  }

  if (!data.choices || data.choices.length === 0) {
    throw new Error("No response from AI model.");
  }

  return data.choices[0].message.content || "";
}

/**
 * Generates text from a prompt.
 */
export async function generateText(prompt: string): Promise<string> {
// Check OpenRouter FIRST
  if (OPENROUTER_API_KEY) {
      return callOpenRouter([{ role: "user", content: prompt }]);
  }

  // Fallback to Gemini
  if (GEMINI_API_KEY) {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      // Use flash model by default
      const modelName = 'gemini-2.0-flash'; 
      const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
      });
      return response.text;
  }
}

/**
 * Generates text from a prompt + image (multimodal).
 */
export async function generateMultimodal(prompt: string, imageBase64: string, mimeType: string = "image/jpeg"): Promise<string> {
// Check OpenRouter FIRST
  if (OPENROUTER_API_KEY) {
      // OpenRouter supports multimodal messages with standard OpenAI format
      const dataUrl = `data:${mimeType};base64,${imageBase64}`;
      
      const messages = [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: dataUrl
              }
            }
          ]
        }
      ];

      return callOpenRouter(messages);
  }

  // Fallback to Gemini
   if (GEMINI_API_KEY) {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const imagePart = {
          inlineData: {
              data: imageBase64,
              mimeType: mimeType,
          },
      };
      const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: { parts: [imagePart, { text: prompt }] },
      });
      return response.text;
  }
  
  throw new Error("No API Key available for AI generation.");
}

/**
 * Generates structured JSON output.
 * Note: 'schema' parameter might need adjustment depending on strictness of the model.
 * For robust JSON, we often just prompt the model to return JSON and parse it.
 */
export async function generateJSON(prompt: string, schema?: any): Promise<any> {
// Check OpenRouter FIRST
  if (OPENROUTER_API_KEY) {
      // Append instruction to ensure JSON
      const systemMessage = {
          role: "system", 
          content: "You are a helpful assistant. Output valid JSON only."
      };
      
      const fullPrompt = `${prompt}\n\nPlease output the result as a valid JSON object.`;

      const messages = [
        systemMessage,
        { role: "user", content: fullPrompt }
      ];

      const responseText = await callOpenRouter(messages, DEFAULT_MODEL, { type: 'json_object' });
      // Clean up markdown code blocks if present
      const cleanJson = responseText.replace(/```json\n?|```/g, "").trim();
      
      try {
        return JSON.parse(cleanJson);
      } catch (e) {
        console.error("Failed to parse JSON:", responseText);
        throw new Error("AI response was not valid JSON.");
      }
  }

  // Fallback to Gemini
  if (GEMINI_API_KEY) {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
          config: {
              responseMimeType: "application/json",
              responseSchema: schema,
          }
      });
      return JSON.parse(response.text);
  }
  
  throw new Error("No API Key available for AI generation.");
}
  

