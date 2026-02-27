import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslations } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { getAuth } from 'firebase/auth';
import { RecordService } from '../services/recordService';
import { UserService } from '../services/userService';
import { useData } from '@/contexts/DataContext';

interface AnalyzedData {
    translations: { [key: string]: string };
    criticalPhrases: string[];
    title: string;
    doctor: string;
    summary: string;
    bloodGroup?: string;
    allergies?: string;
}

const targetLanguages = [
    { code: 'English', name: 'English' },
    { code: 'Hindi', name: 'Hindi (हिन्दी)' },
    { code: 'Bengali', name: 'Bengali (বাংলা)' },
    { code: 'Telugu', name: 'Telugu (తెలుగు)' },
    { code: 'Marathi', name: 'Marathi (मराठी)' },
    { code: 'Tamil', name: 'Tamil (தமிழ்)' },
    { code: 'Urdu', name: 'Urdu (اردو)' },
    { code: 'Gujarati', name: 'Gujarati (ગુજરાતી)' },
    { code: 'Kannada', name: 'Kannada (ಕನ್ನಡ)' },
    { code: 'Malayalam', name: 'Malayalam (മലയാളം)' },
    { code: 'Odia', name: 'Odia (ଓଡ଼ିଆ)' },
    { code: 'Punjabi', name: 'Punjabi (ਪੰਜਾਬੀ)' },
    { code: 'Assamese', name: 'Assamese (অসমীয়া)' },
    { code: 'Maithili', name: 'Maithili (मैथिली)' },
    { code: 'Santali', name: 'Santali (संथाली)' },
    { code: 'Kashmiri', name: 'Kashmiri (कॉशुर)' },
    { code: 'Nepali', name: 'Nepali (नेपाली)' },
    { code: 'Konkani', name: 'Konkani (कोंकणी)' },
    { code: 'Sindhi', name: 'Sindhi (सिन्धी)' },
    { code: 'Dogri', name: 'Dogri (डोगरी)' },
    { code: 'Manipuri', name: 'Manipuri (ꯃꯅꯤꯄꯨꯔꯤ)' },
    { code: 'Bodo', name: 'Bodo (बड़ो)' },
    { code: 'Sanskrit', name: 'Sanskrit (संस्कृतम्)' },
];

const TranslatedRecord: React.FC = () => {
    const { t } = useTranslations();
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { userProfile } = useData();
    const extractedText = location.state?.extractedText || '';
    const imageUrl = location.state?.imageUrl || '';

    const [analysis, setAnalysis] = useState<AnalyzedData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
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
                const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
                const model = genAI.getGenerativeModel({
                    model: "gemini-2.5-flash",
                    generationConfig: { responseMimeType: "application/json" }
                });

                const prompt = `Analyze this medical text and provide a detailed report in JSON format.
                Target Language for translation: ${targetLanguage}.

                Requirements:
                1. "translation": A full, accurate translation of the medical text into ${targetLanguage}.
                2. "criticalPhrases": An array of important medical terms or findings found in the text (in English).
                3. "title": A concise, professional title for this record (in English).
                4. "doctor": The name of the doctor or healthcare provider, or "Unknown" if not found.
                5. "summary": A clear, empathetic medical summary in plain English explaining the report's significance. Mention if the report belongs to "${userProfile?.name || 'the patient'}" based on any names found in the text.
                6. "bloodGroup": The patient's blood group if mentioned (e.g., "A+", "O-").
                7. "allergies": Any mentioned allergies or "None" if not found.

                Medical Text: "${extractedText}"`;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const jsonText = response.text().trim();

                const parsedJson = JSON.parse(jsonText);

                if (parsedJson.translation && Array.isArray(parsedJson.criticalPhrases)) {
                    setAnalysis({
                        translations: { [targetLanguage]: parsedJson.translation },
                        criticalPhrases: parsedJson.criticalPhrases,
                        title: parsedJson.title || "Medical Record",
                        doctor: parsedJson.doctor || "Unknown",
                        summary: parsedJson.summary || "No summary available.",
                        bloodGroup: parsedJson.bloodGroup || undefined,
                        allergies: parsedJson.allergies || undefined
                    });
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
    }, [extractedText, t, targetLanguage]);

    const handleSave = async () => {
        if (!currentUser || !analysis) return;

        // Explicit Auth Verification
        const auth = getAuth();
        console.log("Auth State Check (Save):", auth.currentUser?.uid);
        if (!auth.currentUser) {
            setError("Authentication lost. Please sign in again.");
            return;
        }

        setIsSaving(true);
        try {
            // Task 1: Save the medical record (await this for confirmation)
            await RecordService.addRecord({
                userId: currentUser.uid,
                patientName: userProfile?.name || 'Unknown Patient',
                type: 'report',
                title: analysis.title,
                doctor: analysis.doctor,
                date: new Date().toISOString(),
                extractedText,
                translatedText: analysis.translations[targetLanguage] || analysis.translations['English'] || '',
                criticalPhrases: analysis.criticalPhrases,
                summary: analysis.summary,
                imageUrl: imageUrl
            });

            // Task 2: Update profile if new information is found (background)
            const profileUpdate: any = {};
            if (analysis.bloodGroup && analysis.bloodGroup.length < 5) {
                profileUpdate.bloodGroup = analysis.bloodGroup;
            }
            if (analysis.allergies && analysis.allergies.toLowerCase() !== 'none' && analysis.allergies.toLowerCase() !== 'unknown') {
                profileUpdate.allergies = analysis.allergies;
            }

            if (Object.keys(profileUpdate).length > 0) {
                UserService.updateUserProfile(currentUser.uid, profileUpdate).catch(err => {
                    console.error("Background profile update failed:", err);
                });
            }

            setSaved(true);
            setIsSaving(false);

            // Navigate immediately to records to show the new entry
            navigate('/records');
        } catch (err) {
            console.error("Error saving record:", err);
            alert("Failed to save record.");
            setIsSaving(false);
        }
    };

    const renderHighlightedText = () => {
        if (!analysis) return null;

        const translatedText = analysis.translations[targetLanguage] || analysis.translations['English'] || '';
        const { criticalPhrases } = analysis;
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
                {currentUser && analysis && !isLoading && (
                    <button
                        onClick={handleSave}
                        disabled={isSaving || saved}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black text-sm shadow-lg transition-all active:scale-95 ${saved ? 'bg-emerald-500 text-white' : 'bg-sky-600 text-white hover:bg-sky-700'
                            } disabled:opacity-70`}
                    >
                        {saved ? (
                            <>
                                <span>✓ SAVED</span>
                            </>
                        ) : isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>SAVING...</span>
                            </>
                        ) : (
                            'SAVE TO RECORDS'
                        )}
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
                        <div className="bg-sky-50 p-6 rounded-xl border border-sky-100">
                            <h3 className="text-lg font-bold text-sky-900 mb-2">AI Medical Analysis</h3>
                            <p className="text-sky-800 leading-relaxed">{analysis.summary}</p>
                        </div>

                        {(analysis.bloodGroup || analysis.allergies) && (
                            <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                                <h3 className="text-lg font-bold text-emerald-900 mb-2">Profile Updates Detected</h3>
                                <div className="space-y-2">
                                    {analysis.bloodGroup && (
                                        <p className="text-emerald-800">
                                            <span className="font-semibold">Blood Group:</span> {analysis.bloodGroup}
                                        </p>
                                    )}
                                    {analysis.allergies && (
                                        <p className="text-emerald-800">
                                            <span className="font-semibold">Allergies:</span> {analysis.allergies}
                                        </p>
                                    )}
                                    <p className="text-xs text-emerald-600 italic mt-2">These details will be automatically updated in your Profile when you save this record.</p>
                                </div>
                            </div>
                        )}

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