
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Setup dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Error: GEMINI_API_KEY not found in .env file");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateExampleWithRetry(retries = 3) {
  const prompt = `Generate 5 realistic patient symptom descriptions for medical triage. 
  Focus on varied vocabulary and sentence structures.
  
  For each description, assign one of the following labels based on medical urgency:
  - Urgent: Immediate medical attention required (life-threatening or serious).
  - Routine: Needs medical attention but not immediately life-threatening.
  - Monitor: Can likely be managed at home or waited out, low risk.

  Format the output as a strictly valid JSON array of objects:
  [
    { "text": "Patient complaining of sharp chest pain radiating to left arm", "label": "Urgent" },
    ...
  ]
  `;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Add delay between requests
      if (attempt > 1) {
        console.log(`Retry attempt ${attempt}...`);
        await sleep(2000 * attempt);
      }

      const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
          config: {
              responseMimeType: "application/json"
          }
      });

      const json = JSON.parse(response.text);
      if (Array.isArray(json) && json.length > 0) {
        return json;
      }
    } catch (error) {
       if (attempt === retries) {
         console.error(`Failed after ${retries} attempts. Last error:`, error.message);
       }
    }
  }
  return [];
}

async function main() {
  const targetFile = path.join(__dirname, '../server/data/triage_dataset.json');
  let dataset = [];

  // Load existing if exists
  if (fs.existsSync(targetFile)) {
    try {
        dataset = JSON.parse(fs.readFileSync(targetFile));
        console.log(`Loaded ${dataset.length} existing examples.`);
    } catch (e) {
        console.log("Existing file corrupted or empty, starting fresh.");
    }
  }

  console.log("Generating synthetic data...");
  const ITERATIONS = 3; // Reduced to 3 to be safer
  
  for (let i = 0; i < ITERATIONS; i++) {
    process.stdout.write(`Batch ${i + 1}/${ITERATIONS}... `);
    const examples = await generateExampleWithRetry();
    if (examples.length > 0) {
        dataset.push(...examples);
        console.log(`Added ${examples.length} examples.`);
    } else {
        console.log("Skipping batch due to errors.");
    }
    // Delay between batches
    await sleep(2000);
  }

  // Ensure dir exists
  const dir = path.dirname(targetFile);
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(targetFile, JSON.stringify(dataset, null, 2));
  console.log(`\nDone! Saved ${dataset.length} examples to ${targetFile}`);
}

main();
