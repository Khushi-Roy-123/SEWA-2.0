
import * as tf from '@tensorflow/tfjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load tfjs-node for speed, fallback to cpu if not available
// In ESM, dynamic import might be needed or just skip native optimization for simplicity in this script
// considering the mixed environment. We'll stick to pure JS tfjs for reliability here.
// import '@tensorflow/tfjs-node'; 

const DATA_PATH = path.join(__dirname, '../server/data/triage_dataset.json');
const MODEL_DIR = path.join(__dirname, '../public/models/triage-model');

const SEVERITIES = ["Urgent", "Routine", "Monitor"];

// Simple tokenizer
function tokenize(text) {
    return text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2);
}

async function main() {
    if (!fs.existsSync(DATA_PATH)) {
        console.error("Data file not found:", DATA_PATH);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(DATA_PATH));
    console.log(`Loaded ${data.length} training examples.`);

    // Build vocabulary
    const vocabulary = new Set();
    data.forEach(item => {
        tokenize(item.text).forEach(word => vocabulary.add(word));
    });
    
    const vocabList = Array.from(vocabulary).sort();
    const wordIndex = {};
    vocabList.forEach((w, i) => wordIndex[w] = i + 1); // 1-based index, 0 is padding
    
    // Save metadata (vocab) for frontend
    const metadata = {
        wordIndex: wordIndex,
        maxLen: 20, // fixed input length
        classes: SEVERITIES
    };

    if (!fs.existsSync(MODEL_DIR)) {
        fs.mkdirSync(MODEL_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(MODEL_DIR, 'metadata.json'), JSON.stringify(metadata));

    // Prepare Tensors
    const xs = [];
    const ys = [];

    data.forEach(item => {
        const tokens = tokenize(item.text);
        const sequence = tokens.map(t => wordIndex[t] || 0).slice(0, metadata.maxLen);
        // Pad
        while (sequence.length < metadata.maxLen) sequence.push(0);
        
        xs.push(sequence);
        ys.push(SEVERITIES.indexOf(item.label));
    });

    const xTrain = tf.tensor2d(xs, [xs.length, metadata.maxLen]);
    const yTrain = tf.oneHot(tf.tensor1d(ys, 'int32'), SEVERITIES.length);

    // Define Model
    const model = tf.sequential();
    model.add(tf.layers.embedding({
        inputDim: vocabList.length + 1,
        outputDim: 16,
        inputLength: metadata.maxLen
    }));
    model.add(tf.layers.globalAveragePooling1d());
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: SEVERITIES.length, activation: 'softmax' }));

    model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });

    console.log("Training model...");
    await model.fit(xTrain, yTrain, {
        epochs: 30,
        batchSize: 4,
        shuffle: true,
        validationSplit: 0.1, // Small dataset, small split
        callbacks: {
            onEpochEnd: (epoch, logs) => console.log(`Epoch ${epoch + 1}: loss=${logs.loss.toFixed(4)}, acc=${logs.acc.toFixed(4)}`)
        }
    });

    // Save model
    // Note: file:// protocol is needed for tfjs-node to save to filesystem
    // But since we might be running without node backend, we use 'file://' scheme 
    // which relies on node interactions that tfjs handles if available, 
    // or we might need to use `tf.io.withSaveHandler` if base tfjs doesn't support file:// save in pure node env without tfjs-node.
    // However, tfjs-node is usually required for file:// usage.
    // Let's try to see if it works. If not, we serialize weights manually (worst case).
    
    try {
        // Try importing tfjs-node dynamic if possible, or just assume it might work if we are lucky
        // Actually, without tfjs-node, model.save('file://...') might fail.
        // We will try.
        await model.save(`file://${MODEL_DIR}`);
        console.log(`Model saved to ${MODEL_DIR}`);
    } catch (e) {
        console.error("Error saving model (likely missing tfjs-node):", e.message);
        console.log("Saving weights manifest manually not implemented in this script, please install @tensorflow/tfjs-node");
        // For now, if this fails, we can't easily save to disk without tfjs-node.
        // I will install tfjs-node if this fails.
    }
}

main();
