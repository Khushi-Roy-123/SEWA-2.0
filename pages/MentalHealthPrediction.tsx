import React, { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { useTranslations } from '../lib/i18n';
import { SparklesIcon } from '../components/Icons';

interface ModelMetadata {
    features: string[];
    mappings: { [key: string]: { [key: string]: number } };
    inputShape: number[];
}

const MentalHealthPrediction: React.FC = () => {
    const { t } = useTranslations();
    const [model, setModel] = useState<tf.LayersModel | null>(null);
    const [metadata, setMetadata] = useState<ModelMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<{ [key: string]: string | number }>({});
    const [prediction, setPrediction] = useState<string | null>(null);
    const [probability, setProbability] = useState<number | null>(null);

    useEffect(() => {
        const loadModel = async () => {
            try {
                const loadedModel = await tf.loadLayersModel('/models/mental-health-model/model.json');
                const metaResponse = await fetch('/models/mental-health-model/metadata.json');
                const loadedMetadata = await metaResponse.json();
                
                setModel(loadedModel);
                setMetadata(loadedMetadata);
                
                // Initialize form data
                const initialData: any = {};
                loadedMetadata.features.forEach((f: string) => {
                    initialData[f] = f === 'Age' ? '' : '';
                });
                setFormData(initialData);
            } catch (err) {
                console.error("Failed to load model", err);
            } finally {
                setLoading(false);
            }
        };
        loadModel();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const normalizeGender = (gender: string) => {
        if (!gender) return 2;
        const g = gender.toString().toLowerCase().trim();
        if (['male', 'm', 'male-ish', 'maile', 'mal', 'male (cis)', 'make', 'male ', 'man', 'msle', 'mail', 'malr', 'cis man', 'cis male', 'guy (-ish) ^_^'].includes(g)) return 0;
        if (['female', 'cis female', 'f', 'woman', 'femake', 'female ', 'cis-female/femme', 'female (cis)', 'femail'].includes(g)) return 1;
        return 2;
    };

    const predict = async () => {
        if (!model || !metadata) return;

        try {
            const inputTensor = tf.tidy(() => {
                const features = metadata.features.map(f => {
                    const val = formData[f];
                    if (f === 'Age') {
                         return (Number(val) - 18) / 82; // Normalize age
                    }
                    if (f === 'Gender') {
                        return normalizeGender(String(val));
                    }
                    // Categorical mapping
                    const mapping = metadata.mappings[f];
                    return mapping && mapping[String(val)] !== undefined ? mapping[String(val)] : (Object.values(mapping)[0] || 0); // Default fallback
                });
                
                return tf.tensor2d([features]);
            });

            const output = model.predict(inputTensor) as tf.Tensor;
            const probs = await output.data();
            inputTensor.dispose();
            output.dispose();

            const yesProb = probs[1];
            setProbability(yesProb);
            setPrediction(yesProb > 0.5 ? "Yes" : "No");

        } catch (err) {
            console.error("Prediction error", err);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading AI Model...</div>;

    const labels: {[key: string]: string} = {
        Age: "Age",
        Gender: "Gender",
        family_history: "Family History of Mental Illness",
        work_interfere: "Does mental health interfere with work?",
        no_employees: "Number of Employees",
        remote_work: "Do you work remotely?",
        tech_company: "Is your employer a tech company?",
        benefits: "Does your employer provide mental health benefits?",
        care_options: "Do you know the options for mental health care?",
        wellness_program: "Has your employer discussed mental health as part of a wellness program?",
        seek_help: "Does your employer provide resources to learn more about mental health issues and how to seek help?",
        anonymity: "Is your anonymity protected if you choose to take advantage of mental health or substance abuse treatment resources?",
        leave: "How easy is it for you to take medical leave for a mental health condition?",
        mental_health_consequence: "Do you think that discussing a mental health issue with your employer would have negative consequences?",
        phys_health_consequence: "Do you think that discussing a physical health issue with your employer would have negative consequences?",
        coworkers: "Would you be willing to discuss a mental health issue with your coworkers?",
        supervisor: "Would you be willing to discuss a mental health issue with your direct supervisor?",
        mental_health_interview: "Would you bring up a mental health issue with a potential employer in an interview?",
        phys_health_interview: "Would you bring up a physical health issue with a potential employer in an interview?",
        mental_vs_physical: "Do you feel that your employer takes mental health as seriously as physical health?",
        obs_consequence: "Have you heard of or observed negative consequences for coworkers with mental health conditions in your workplace?"
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-2">
                    <SparklesIcon /> Mental Health Assessment AI
                </h1>
                <p className="text-slate-600">
                    This AI model analyzes your workplace environment and personal factors to predict if seeking mental health treatment might be beneficial for you.
                    <br/><span className="text-xs text-slate-400">Based on OSMI Mental Health in Tech Survey 2014 data.</span>
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {metadata?.features.map(feature => (
                        <div key={feature} className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">
                                {labels[feature] || feature}
                            </label>
                            {feature === 'Age' ? (
                                <input
                                    type="number"
                                    name={feature}
                                    value={formData[feature]}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                                    placeholder="Enter age"
                                />
                            ) : feature === 'Gender' ? (
                                <select
                                    name={feature}
                                    value={formData[feature]}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                                >
                                    <option value="">Select...</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Non-binary">Non-binary / Other</option>
                                </select>
                            ) : (
                                <select
                                    name={feature}
                                    value={formData[feature]}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                                >
                                    <option value="">Select...</option>
                                    {metadata && metadata.mappings[feature] && Object.keys(metadata.mappings[feature]).map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-center">
                    <button
                        onClick={predict}
                        className="bg-sky-600 text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-sky-700 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-1"
                    >
                        Analyze My Profile
                    </button>
                </div>
            </div>

            {prediction && (
                <div className={`rounded-xl shadow-lg p-8 text-center transform transition-all duration-500 ${prediction === 'Yes' ? 'bg-amber-50 border-2 border-amber-200' : 'bg-green-50 border-2 border-green-200'}`}>
                    <h2 className="text-2xl font-bold mb-4">AI Analysis Result</h2>
                    <div className="text-4xl mb-2 font-extrabold">
                        {prediction === 'Yes' ? 'High Likelihood of Seeking Treatment' : 'Lower Likelihood'}
                    </div>
                    <p className="text-lg text-slate-700">
                        Probability Score: <span className="font-mono font-bold">{(probability! * 100).toFixed(1)}%</span>
                    </p>
                    <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
                        {prediction === 'Yes' 
                            ? "Based on your inputs, similar profiles often seek mental health treatment. It might be beneficial to consult with a professional."
                            : "Your profile suggests you might be coping well, but always listen to your own feelings and seek help if needed."}
                    </p>
                </div>
            )}
        </div>
    );
};

export default MentalHealthPrediction;
