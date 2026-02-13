import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useSearchParams } from 'react-router-dom';
import { useTranslations } from '@/lib/i18n';
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
                const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                
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
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden mt-12 animate-in fade-in slide-in-from-bottom-8 duration-500 border border-slate-100">
                    <div className="bg-slate-900 p-8 text-white">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-4 rounded-2xl shadow-lg ${
                                    deepAnalysis.severityAssessment.level === 'Urgent' ? 'bg-red-500' : 
                                    deepAnalysis.severityAssessment.level === 'Routine' ? 'bg-sky-500' : 'bg-amber-500'
                                }`}>
                                    <ExclamationIcon />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight uppercase italic">Deep Health Analysis</h2>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">Sewa Advanced Diagnostics</p>
                                </div>
                            </div>
                            <div className="bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-md border border-white/10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Severity Level</p>
                                <p className={`text-xl font-black uppercase tracking-tighter ${
                                    deepAnalysis.severityAssessment.level === 'Urgent' ? 'text-red-400' : 
                                    deepAnalysis.severityAssessment.level === 'Routine' ? 'text-sky-400' : 'text-amber-400'
                                }`}>
                                    {deepAnalysis.severityAssessment.level}
                                </p>
                            </div>
                        </div>
                        <p className="mt-8 text-slate-300 text-sm font-medium leading-relaxed max-w-3xl">
                            {deepAnalysis.severityAssessment.reason}
                        </p>
                    </div>

                    <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Potential Conditions */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-sky-500 rounded-full"></div>
                                Potential Conditions
                            </h3>
                            <div className="space-y-4">
                                {deepAnalysis.potentialConditions.map((c, i) => (
                                    <div key={i} className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-lg transition-all duration-300 group">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-black text-slate-800 text-lg leading-tight">{c.name}</h4>
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter ${
                                                c.likelihood === 'High' ? 'bg-red-100 text-red-700' : 
                                                c.likelihood === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                                {c.likelihood} Likelihood
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{c.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Next Steps & Doctor Questions */}
                        <div className="space-y-8">
                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                    Recommended Next Steps
                                </h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {deepAnalysis.recommendedNextSteps.map((step, i) => (
                                        <div key={i} className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 text-xs font-bold text-emerald-800">
                                            <div className="w-5 h-5 bg-emerald-500 text-white rounded-lg flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</div>
                                            {step}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                    Questions for your Doctor
                                </h3>
                                <div className="bg-slate-900 rounded-[2rem] p-6 space-y-4 shadow-xl">
                                    {deepAnalysis.questionsForDoctor.map((q, i) => (
                                        <div key={i} className="flex gap-3 text-xs text-slate-300 font-medium leading-relaxed border-b border-white/5 pb-3 last:border-0 last:pb-0">
                                            <span className="text-sky-500 font-black">?</span>
                                            {q}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 p-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                            <ShieldCheckIcon />
                            <span>AI-GENERATED ANALYSIS • NOT A MEDICAL DIAGNOSIS</span>
                        </div>
                        <button 
                            onClick={() => window.print()}
                            className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-100 transition-all shadow-sm"
                        >
                            EXPORT REPORT (PDF)
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Recommendations;