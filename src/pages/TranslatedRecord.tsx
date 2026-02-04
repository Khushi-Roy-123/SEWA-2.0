import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslations } from '../lib/i18n';
import { useAuth } from '../context/AuthContext';
import { RecordService } from '../services/recordService';

interface AnalyzedData {
    translatedText: string;
    criticalPhrases: string[];
}

const targetLanguages = [
    { code: 'English', name: 'English' },
    { code: 'Spanish', name: 'Español' },
    { code: 'French', name: 'Français' },
    { code: 'German', name: 'Deutsch' },
    { code: 'Hindi', name: 'हिन्दी' },
    { code: 'Mandarin Chinese', name: '中文' },
];

const TranslatedRecord: React.FC = () => {
    const { t } = useTranslations();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const extractedText = location.state?.extractedText || '';
    
    const [analysis, setAnalysis] = useState<AnalyzedData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [targetLanguage, setTargetLanguage] = useState('English');

    useEffect(() => {
        if (!extractedText) {
            setIsLoading(false);
            return;
        }

        const fetchAnalysis = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const genAI = new GoogleGenerativeAI(import.meta.env.VITE_OPENROUTER_API_KEY || '');
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                
                const prompt = `Analyze the following medical text. First, translate it to ${targetLanguage}. Then, from your translation, identify and extract an array of critical phrases. Provide JSON with keys "translatedText" and "criticalPhrases" (array of strings). Text: "${extractedText}". Output JSON only.`;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                let jsonText = response.text().trim();
                if (jsonText.startsWith('```json')) {
                    jsonText = jsonText.replace(/^```json/, '').replace(/```$/, '');
                } else if (jsonText.startsWith('```')) {
                     jsonText = jsonText.replace(/^```/, '').replace(/```$/, '');
                }

                const parsedJson = JSON.parse(jsonText);

                if (parsedJson.translatedText && Array.isArray(parsedJson.criticalPhrases)) {
                    setAnalysis(parsedJson);
                } else {
                    throw new Error("Invalid response structure.");
                }

            } catch (err) {
                console.error("Error fetching analysis:", err);
                setError(t('translationError'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalysis();
    }, [extractedText, targetLanguage, t]);

    const handleSave = async () => {
        if (!user || !analysis) return;
        
        const title = window.prompt("Enter a title for this record (e.g. Blood Test Report):");
        if (!title) return;
        
        const doctor = window.prompt("Enter provider/doctor name (optional):") || "Unknown";
        
        setIsSaving(true);
        try {
            await RecordService.addRecord({
                userId: user.uid,
                type: 'report', 
                title,
                doctor,
                date: new Date().toISOString(),
                extractedText,
                translatedText: analysis.translatedText,
                criticalPhrases: analysis.criticalPhrases
            });
            navigate('/records');
        } catch (err) {
            console.error("Error saving record:", err);
            alert("Failed to save record.");
        } finally {
            setIsSaving(false);
        }
    };

    const renderHighlightedText = () => {
        if (!analysis) return null;

        const { translatedText, criticalPhrases } = analysis;
        if (criticalPhrases.length === 0) return translatedText;

        const regex = new RegExp(`(${criticalPhrases.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
        const parts = translatedText.split(regex);
        
        return parts.map((part, index) => {
            const isHighlight = criticalPhrases.some(phrase => phrase.toLowerCase() === part.toLowerCase());
            return isHighlight ? (
                <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark>
            ) : (
                <span key={index}>{part}</span>
            );
        });
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{t('analyzedRecordTitle')}</h1>
                    <p className="mt-1 text-slate-500">{t('analyzedRecordSubtitle')}</p>
                </div>
                {user && analysis && !isLoading && (
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-sky-700 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save to Records'}
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-6">
                <div>
                    <label htmlFor="language-select" className="block text-sm font-medium text-slate-700">{t('selectTranslationLanguage')}</label>
                    <select
                        id="language-select"
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        disabled={isLoading}
                        className="mt-1 block w-full sm:w-1/2"
                    >
                        {targetLanguages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                    </select>
                </div>
                
                {isLoading && (
                    <div className="text-center">
                        <h2 className="text-lg font-semibold text-slate-700">{t('translationLoading')}</h2>
                    </div>
                )}
                
                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                
                {!isLoading && analysis && (
                    <div className="space-y-6 pt-4 border-t border-slate-200">
                        <div>
                            <h3 className="text-lg font-medium text-slate-800 mb-2">{t('translatedText')}</h3>
                            <div className="w-full p-3 border border-slate-300 rounded-md bg-slate-50 text-sm text-slate-800 whitespace-pre-wrap">
                                {renderHighlightedText()}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TranslatedRecord;