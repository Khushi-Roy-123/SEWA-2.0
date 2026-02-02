
import * as tf from '@tensorflow/tfjs';
// import '@tensorflow/tfjs-node'; // Failed to load binaries
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix paths to be relative to CWD (root of project)
const DATA_PATH = path.resolve(process.cwd(), 'ai/survey.csv');
const MODEL_DIR = path.resolve(process.cwd(), 'public/models/mental-health-model');

// Feature columns to use
const FEATURES = [
    'Age', 'Gender', 'family_history', 'work_interfere', 'no_employees', 
    'remote_work', 'tech_company', 'benefits', 'care_options', 'wellness_program', 
    'seek_help', 'anonymity', 'leave', 'mental_health_consequence', 
    'phys_health_consequence', 'coworkers', 'supervisor', 
    'mental_health_interview', 'phys_health_interview', 'mental_vs_physical', 
    'obs_consequence'
];
const TARGET = 'treatment';

function normalizeGender(gender) {
    if (!gender) return 2; // Other/Unknown
    const g = gender.toString().toLowerCase().trim();
    if (['male', 'm', 'male-ish', 'maile', 'mal', 'male (cis)', 'make', 'male ', 'man', 'msle', 'mail', 'malr', 'cis man', 'cis male', 'guy (-ish) ^_^'].includes(g)) return 0;
    if (['female', 'cis female', 'f', 'woman', 'femake', 'female ', 'cis-female/femme', 'female (cis)', 'femail'].includes(g)) return 1;
    return 2; // Other/Non-binary
}

function encodeCategorical(value, mapping) {
    if (!mapping.has(value)) {
        mapping.set(value, mapping.size);
    }
    return mapping.get(value);
}

async function main() {
    console.log('CWD:', process.cwd());
    console.log('__dirname:', __dirname);
    console.log('Resolved DATA_PATH:', DATA_PATH);
    
    if (!fs.existsSync(DATA_PATH)) {
        console.error('Data file not found at:', DATA_PATH);
        try {
            console.log('Contents of ../ai:', fs.readdirSync(path.join(__dirname, '../ai')));
        } catch (e) {
            console.log('Cannot read ../ai:', e.message);
        }
        process.exit(1);
    }

    const fileContent = fs.readFileSync(DATA_PATH, 'utf8');
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
    });

    console.log(`Loaded ${records.length} records.`);

    // Preprocessing
    const mappings = {};
    FEATURES.forEach(f => {
        if (f !== 'Age' && f !== 'Gender') {
            mappings[f] = new Map();
        }
    });
    
    // Process data
    const xs = [];
    const ys = [];

    records.forEach(record => {
        // Filter invalid ages
        let age = parseInt(record.Age);
        if (isNaN(age) || age < 18 || age > 100) return; 

        const features = [];
        
        features.push((age - 18) / 82);
        features.push(normalizeGender(record.Gender));

        FEATURES.forEach(f => {
            if (f === 'Age' || f === 'Gender') return;
            const val = record[f] || 'NA';
            features.push(encodeCategorical(val, mappings[f]));
        });

        xs.push(features);

        // Target
        const targetVal = record[TARGET] === 'Yes' ? 1 : 0;
        ys.push(targetVal);
    });

    console.log(`Training on ${xs.length} valid records.`);

    // Convert mappings to object for saving
    const savedMappings = {};
    Object.keys(mappings).forEach(k => {
        savedMappings[k] = Object.fromEntries(mappings[k]);
    });

    // Save metadata
    if (!fs.existsSync(MODEL_DIR)) {
        fs.mkdirSync(MODEL_DIR, { recursive: true });
    }
    
    const metadata = {
        features: FEATURES,
        mappings: savedMappings,
        inputShape: [xs[0].length]
    };
    fs.writeFileSync(path.join(MODEL_DIR, 'metadata.json'), JSON.stringify(metadata));
    console.log('Metadata saved.');

    // Create Tensors
    const xTrain = tf.tensor2d(xs);
    const yTrain = tf.oneHot(tf.tensor1d(ys, 'int32'), 2); 

    // Model
    const model = tf.sequential();
    model.add(tf.layers.dense({ 
        units: 32, 
        activation: 'relu', 
        inputShape: [xs[0].length] 
    }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 2, activation: 'softmax' }));

    model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });

    console.log('Training model...');
    await model.fit(xTrain, yTrain, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                if ((epoch + 1) % 10 === 0) {
                    console.log(`Epoch ${epoch + 1}: loss=${logs.loss.toFixed(4)}, acc=${logs.acc.toFixed(4)}, val_acc=${logs.val_acc.toFixed(4)}`);
                }
            }
        }
    });

    // Save model custom handler
    try {
        await model.save(tf.io.withSaveHandler(async (artifacts) => {
            if (!fs.existsSync(MODEL_DIR)) fs.mkdirSync(MODEL_DIR, { recursive: true });

            const weightsManifest = [{
                paths: ['./weights.bin'],
                weights: artifacts.weightSpecs
            }];
            
            const modelJSON = {
                modelTopology: artifacts.modelTopology,
                format: artifacts.format,
                generatedBy: artifacts.generatedBy,
                convertedBy: artifacts.convertedBy,
                weightsManifest: weightsManifest
            };

            fs.writeFileSync(path.join(MODEL_DIR, 'model.json'), JSON.stringify(modelJSON));
            
            if (artifacts.weightData) {
                fs.writeFileSync(path.join(MODEL_DIR, 'weights.bin'), Buffer.from(artifacts.weightData));
            }
            
            return {
                modelArtifactsInfo: {
                    dateSaved: new Date(),
                    modelTopologyType: 'JSON'
                }
            };
        }));
        console.log(`Model saved to ${MODEL_DIR}`);
    } catch (e) {
        console.error("Error saving model:", e);
    }
}

main().catch(console.error);
