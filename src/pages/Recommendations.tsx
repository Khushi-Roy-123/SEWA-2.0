import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useSearchParams } from 'react-router-dom';
import { useTranslations } from '../lib/i18n';
import { CardiologyIcon, NeurologyIcon, DermatologyIcon, GastroenterologyIcon, DefaultSpecialistIcon, SpeakerIcon, ExclamationIcon } from '../components/Icons';

interface Recommendation {
    specialty: string;
    reason: string;
    sampleDoctors: string[];
}

interface DeepAnalysisData {
    severityAssessment: {
        level: 'Urgent' | 'Routine' | 'Monitor';
        reason: string;
    };
    potentialConditions: {
        name: string;
        description: string;
        likelihood: 'High' | 'Medium' | 'Low';
    }[];
    recommendedNextSteps: string[];
    questionsForDoctor: string[];
}

const specialistIcons: { [key: string]: React.ReactNode } = {
    'cardiologist': <CardiologyIcon />,
    'neurologist': <NeurologyIcon />,
    'dermatologist': <DermatologyIcon />,
    'gastroenterologist': <GastroenterologyIcon />,
};

const getSpecialistIcon = (specialty: string): React.ReactNode => {
    const key = specialty.toLowerCase();
    return specialistIcons[key] || <DefaultSpecialistIcon />;
};

const Recommendations: React.FC = () => {
    const { t } = useTranslations();
    const [searchParams] = useSearchParams();
    const symptoms = searchParams.get('q') || '';
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deepAnalysis, setDeepAnalysis] = useState<DeepAnalysisData | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState<string | null>(null);

    useEffect(() => {
        if (!symptoms) {
            setIsLoading(false);
            return;
        }

        const fetchRecommendations = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const genAI = new GoogleGenerativeAI(import.meta.env.VITE_OPENROUTER_API_KEY || '');
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                
                const prompt = `Based on the following symptoms, recommend up to 3 relevant medical specialists. For each specialist, provide a brief, user-friendly reason for the recommendation and list 2-3 sample doctor names. Symptoms: "${symptoms}". Output only valid JSON with a "recommendations" array containing objects with "specialty", "reason", and "sampleDoctors" (array of strings). Do NOT use markdown code blocks.`;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                let jsonText = response.text().trim();
                // Strip markdown code blocks if present
                if (jsonText.startsWith('```json')) {
                    jsonText = jsonText.replace(/^```json/, '').replace(/```$/, '');
                } else if (jsonText.startsWith('```')) {
                     jsonText = jsonText.replace(/^```/, '').replace(/```$/, '');
                }

                const parsedJson = JSON.parse(jsonText);

                if (parsedJson.recommendations) {
                    setRecommendations(parsedJson.recommendations);
                } else {
                    throw new Error("Invalid response structure.");
                }

            } catch (err) {
                console.error("Error fetching recommendations:", err);
                setError(t('errorRecommendations'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecommendations();
    }, [symptoms, t]);
    
    const handleDeepAnalysis = async () => {
        setIsAnalyzing(true);
        setDeepAnalysis(null);
        setError(null);

        try {
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_OPENROUTER_API_KEY || '');
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `Based on these symptoms: "${symptoms}", conduct a deep analysis. Provide a JSON object with:
            1. 'severityAssessment': { level: 'Urgent'|'Routine'|'Monitor', reason: string }
            2. 'potentialConditions': Array of { name: string, description: string, likelihood: 'High'|'Medium'|'Low' }
            3. 'recommendedNextSteps': Array of strings
            4. 'questionsForDoctor': Array of strings.
            Output ONLY valid JSON. Do not use markdown blocks.`;
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let jsonText = response.text().trim();
             if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/^```json/, '').replace(/```$/, '');
            } else if (jsonText.startsWith('```')) {
                 jsonText = jsonText.replace(/^```/, '').replace(/```$/, '');
            }
            
            const parsedJson = JSON.parse(jsonText);
            setDeepAnalysis(parsedJson);

        } catch (err) {
            console.error("Error fetching deep analysis:", err);
            setError("Failed to generate a deeper analysis. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleTextToSpeech = (text: string) => {
        if (isSpeaking) return;
        setIsSpeaking(text);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(null);
        window.speechSynthesis.speak(utterance);
    };


    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center text-center h-64">
                <svg className="animate-spin h-8 w-8 text-sky-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h2 className="text-xl font-semibold text-slate-700">{t('loadingRecommendations')}</h2>
            </div>
        );
    }
    
    if (error && !isAnalyzing) {
        return <div className="text-red-500 p-4">{error}</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">{t('recommendationsTitle')}</h1>
                <p className="mt-1 text-slate-500">{t('recommendationsSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((rec, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-lg p-6 flex flex-col">
                        <div className="flex items-center">
                            <div className="bg-sky-100 text-sky-600 p-3 rounded-full">
                                {getSpecialistIcon(rec.specialty)}
                            </div>
                            <h3 className="ml-4 text-xl font-bold text-slate-800">{rec.specialty}</h3>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-200 flex-grow">
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold text-slate-600">{t('reasonForRecommendation')}</h4>
                                <button onClick={() => handleTextToSpeech(rec.reason)} disabled={!!isSpeaking} className="text-slate-500 hover:text-sky-600 disabled:text-slate-300">
                                     {isSpeaking === rec.reason ? <span className="animate-pulse">🔊</span> : <SpeakerIcon />}
                                </button>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">{rec.reason}</p>
                            
                            <h4 className="font-semibold text-slate-600 mt-4">{t('sampleDoctors')}</h4>
                             <ul className="list-disc list-inside text-sm text-slate-500 mt-1 space-y-1">
                                {rec.sampleDoctors.map((doctor, i) => <li key={i}>{doctor}</li>)}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
            
            {recommendations.length > 0 && !deepAnalysis && (
                <div className="text-center pt-4">
                    <button onClick={handleDeepAnalysis} disabled={isAnalyzing} className="bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-slate-800 transition-colors disabled:bg-slate-400">
                        {isAnalyzing ? t('analyzing') : t('getDeeperAnalysis')}
                    </button>
                </div>
            )}
            
            {deepAnalysis && (
                <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
                    <h2 className="text-2xl font-bold mb-4">Deep Analysis</h2>
                    <div className="mb-4">
                        <span className="font-bold">Severity:</span> {deepAnalysis.severityAssessment.level} - {deepAnalysis.severityAssessment.reason}
                    </div>
                    <div>
                        <h3 className="font-bold">Potential Conditions:</h3>
                        <ul>
                            {deepAnalysis.potentialConditions.map((c, i) => (
                                <li key={i}><b>{c.name}</b> ({c.likelihood}): {c.description}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Recommendations;