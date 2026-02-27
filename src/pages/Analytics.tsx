import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useTranslations } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { getAuth } from 'firebase/auth';
import { RecordService } from '../services/recordService';
import { UserService, UserProfile } from '../services/userService';
import { ChartBarIcon, SparklesIcon, ShieldCheckIcon } from '../components/Icons';

declare global {
    interface Window {
        Recharts: any;
    }
}

const { LineChart, Line, ResponsiveContainer, YAxis } = window.Recharts || {};

const targetLanguages = [
    { code: 'English', name: 'English' },
    { code: 'Hindi', name: 'Hindi (हिन्दी)' },
    { code: 'Bengali', name: 'Bengali (বাংলা)' },
    { code: 'Telugu', name: 'Telugu (తెలుగు)' },
    { code: 'Marathi', name: 'Marathi (मराठी)' },
    { code: 'Tamil', name: 'Tamil (தமிழ்)' },
    { code: 'Urdu', name: 'Urdu (اردो)' },
    { code: 'Gujarati', name: 'Gujarati (ગુજરાती)' },
    { code: 'Kannada', name: 'Kannada (कन्नड़)' },
    { code: 'Malayalam', name: 'Malayalam (മലയാളം)' },
    { code: 'Odia', name: 'Odia (ଓଡ଼िआ)' },
    { code: 'Punjabi', name: 'Punjabi (ਪੰਜਾਬी)' },
    { code: 'Assamese', name: 'Assamese (অসমীয়ा)' },
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

interface AnalyticsReport {
    timestamp: string;
    healthScore: number;
    summary: string;
    recommendations: string[];
    dietPlan: {
        calories: number;
        breakdown: string;
        suggestedFoods: string[];
        restrictedFoods: string[];
    };
    trendPoints: { date: string; score: number }[];
    detailedAnalysis?: {
        metric: string;
        value: string;
        status: 'Normal' | 'High' | 'Low' | 'Critical';
        insight: string;
    }[];
}

import { useData } from '@/contexts/DataContext';

const Analytics: React.FC = () => {
    const { t } = useTranslations();
    const { currentUser } = useAuth();
    const { records, userProfile: globalProfile, isPreloading } = useData();
    const [isLoading, setIsLoading] = useState(false);
    const [localReport, setLocalReport] = useState<AnalyticsReport | null>(null);
    const [profile, setProfile] = useState<{ weight: number | '', height: number | '', age: number | '' }>({ weight: '', height: '', age: '' });
    const [error, setError] = useState<string | null>(null);
    const [reportLanguage, setReportLanguage] = useState('English');
    const [isTranslating, setIsTranslating] = useState(false);

    // Computed report: use locally generated one if present, otherwise fall back to global profile
    const report = useMemo(() => localReport || globalProfile?.lastHealthReport || null, [localReport, globalProfile?.lastHealthReport]);

    useEffect(() => {
        if (globalProfile && !isLoading && !isTranslating) {
            setProfile({
                weight: globalProfile.weight ?? '',
                height: globalProfile.height ?? '',
                age: globalProfile.age ?? ''
            });
            if (globalProfile.lastAnalysisLanguage && !localReport) {
                setReportLanguage(globalProfile.lastAnalysisLanguage);
            }
        }
    }, [globalProfile, isLoading, isTranslating, localReport]);

    const handleSaveProfile = async () => {
        if (!currentUser) return;
        try {
            await UserService.updateUserProfile(currentUser.uid, {
                weight: profile.weight === '' ? undefined : profile.weight,
                height: profile.height === '' ? undefined : profile.height,
                age: profile.age === '' ? undefined : profile.age,
            });
            alert('Physical profile saved!');
        } catch (err) {
            console.error(err);
            alert('Failed to save profile.');
        }
    };

    const translateReport = async () => {
        // Explicit Auth Verification
        const auth = getAuth();
        console.log("Auth State Check (Translate):", auth.currentUser?.uid);
        if (!auth.currentUser) {
            setError("Authentication lost. Please sign in again.");
            return;
        }

        setIsTranslating(true);
        setError(null);
        try {
            const targetLangObj = targetLanguages.find(l => l.code === reportLanguage);
            const nativeLangName = targetLangObj ? `${targetLangObj.code} (${targetLangObj.name})` : reportLanguage;

            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `You are a professional medical translator. Translate the following health report JSON into ${nativeLangName}. 
            
            STRICT RULES:
            1. DO NOT change ANY numbers, scores, dates, or clinical values.
            2. Translate ONLY the descriptive text strings (summary, recommendations, insights, breakdown, suggestedFoods, restrictedFoods, etc.).
            3. The "status" fields (Normal, High, Low, Critical) MUST remain in English for clinical standard.
            4. Keep the JSON structure EXACTLY identical.
            5. Return ONLY the valid JSON object.
            6. CRITICAL: Use the correct script for ${nativeLangName}. Do not confuse ${nativeLangName} with other similar languages (e.g., distinguish clearly between Tamil and Telugu).

            Report to Translate:
            ${JSON.stringify(report)}

            Output the translated JSON only.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("Invalid JSON response");

            const translated = JSON.parse(jsonMatch[0]);

            // 1. Update local report state immediately
            setLocalReport(translated);

            // 2. Persist to Firebase in background
            // Note: On refresh, the app will still reset the selector to English
            await UserService.updateUserProfile(currentUser.uid, {
                lastHealthReport: translated,
                lastAnalysisLanguage: reportLanguage
            });

        } catch (err) {
            console.error("Translation Error:", err);
            setError('Translation failed. Please try again.');
        } finally {
            setIsTranslating(false);
        }
    };

    const runAnalysis = async () => {
        if (!currentUser) return;

        // Explicit Auth Verification
        const auth = getAuth();
        console.log("Auth State Check (Analysis):", auth.currentUser?.uid);
        if (!auth.currentUser) {
            setError("Authentication lost. Please sign in again.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            if (records.length === 0) {
                setError(t('noRecordsToAnalyze'));
                setIsLoading(false);
                return;
            }

            const recentRecords = records.slice(0, 10);
            const contextSignature = `${records.length}-${records[0]?.id || ''}-${profile.age}-${profile.weight}-${profile.height}`;

            if (globalProfile?.lastAnalysisHash === contextSignature && report) {
                setError(t('noChangesDetected'));
                setIsLoading(false);
                return;
            }

            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            const recordContext = recentRecords.map((r: any) => `
            Date: ${r.date}
            Type: ${r.type}
            Title: ${r.title}
            Summary: ${r.summary || 'N/A'}
            Content: ${r.extractedText || r.translatedText || 'N/A'}
            `).join('\n---\n');

            const profileContext = `Age: ${profile.age}, Weight: ${profile.weight}kg, Height: ${profile.height}cm`;

            const prompt = `Perform a high-integrity, professional medical record analysis.
            Target Language for textual output: English.

            STRICT RULES:
            1. DO NOT change medical values, dates, or lab results.
            2. Calculate "healthScore" (1-100) based on clinical data.
            3. Provide specific, actionable, and medically-sound recommendations.

            Patient Context:
            Profile: ${profileContext}
            Recent Medical Records:
            ${recordContext}

            Tasks:
            1. Calculate a "healthScore" (1-100).
            2. Write a comprehensive "summary" (3-5 sentences).
            3. Provide 5-7 specific "recommendations".
            4. Create a "dietPlan": "calories" (number), "breakdown" (text), "suggestedFoods" (array), "restrictedFoods" (array).
            5. Generate "trendPoints": Array of { date: string, score: number }.
            6. Provide "detailedAnalysis": Array of { metric, value, status, insight }.

            Output JSON only matching the schema.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("Invalid JSON response from Health Engine");

            const parsed = JSON.parse(jsonMatch[0]);
            parsed.timestamp = new Date().toISOString();

            // 1. Force state updates immediately
            setLocalReport(parsed);
            setReportLanguage('English');
            setError(null);

            // 2. Persist to Firebase in background
            UserService.updateUserProfile(currentUser.uid, {
                lastHealthReport: parsed,
                lastAnalysisHash: contextSignature,
                lastAnalysisLanguage: 'English'
            }).catch(err => {
                console.error("Background analysis save failed:", err);
            });

        } catch (err) {
            console.error("Analysis Error:", err);
            setError('Analysis failed. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isPreloading && !report) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mb-4"></div>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Loading Analytics Dashboard</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {globalProfile?.photoURL && (
                        <img
                            src={globalProfile.photoURL}
                            alt="Profile"
                            className="w-14 h-14 rounded-2xl border-2 border-white shadow-lg object-cover bg-sky-100"
                        />
                    )}
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 italic tracking-tighter">
                            <ChartBarIcon />
                            {t('analyticsTitle')}
                        </h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">AI-driven clinical insights and personalized wellness tracking.</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 pl-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Language:</span>
                        <select
                            id="report-lang"
                            value={reportLanguage}
                            onChange={(e) => setReportLanguage(e.target.value)}
                            disabled={isLoading || isTranslating}
                            className="border-none p-2 rounded-xl focus:ring-0 outline-none transition-all bg-transparent text-sm font-bold text-sky-600"
                        >
                            {targetLanguages.map(lang => (
                                <option key={lang.code} value={lang.code}>{lang.name}</option>
                            ))}
                        </select>
                    </div>

                    {report && reportLanguage !== (globalProfile?.lastAnalysisLanguage || 'English') && (
                        <button
                            onClick={translateReport}
                            disabled={isTranslating}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-sky-100 text-sky-600 font-black rounded-2xl hover:bg-sky-200 disabled:opacity-50 transition-all active:scale-95 text-xs uppercase tracking-widest"
                        >
                            {isTranslating ? (
                                <div className="w-4 h-4 border-2 border-sky-600/20 border-t-sky-600 rounded-full animate-spin"></div>
                            ) : 'Translate'}
                        </button>
                    )}

                    <button
                        onClick={runAnalysis}
                        disabled={isLoading || isTranslating}
                        className="flex items-center justify-center gap-2 px-8 py-3 bg-slate-900 text-white font-black rounded-2xl shadow-lg hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-95"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                <span>{t('analyzingHistory')}</span>
                            </>
                        ) : (
                            <>
                                <SparklesIcon />
                                <span>{t('runAnalysis')}</span>
                            </>
                        )}
                    </button>
                </div>
            </header>

            {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Profile Sync */}
                <div className="lg:col-span-1 space-y-6">
                    <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-sky-500 rounded-full"></div>
                            {t('physicalProfile')}
                        </h2>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Age (Years)</label>
                                <input
                                    type="number"
                                    value={profile.age}
                                    onChange={e => setProfile({ ...profile, age: e.target.value === '' ? '' : Math.floor(Number(e.target.value)) })}
                                    className="w-full bg-slate-50 border-2 border-slate-50 p-3 rounded-2xl focus:bg-white focus:border-sky-500 outline-none transition-all font-bold"
                                    placeholder={profile.age ? String(profile.age) : "e.g. 25"}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Weight (kg)</label>
                                <input
                                    type="number"
                                    value={profile.weight}
                                    onChange={e => setProfile({ ...profile, weight: e.target.value === '' ? '' : Math.floor(Number(e.target.value)) })}
                                    className="w-full bg-slate-50 border-2 border-slate-50 p-3 rounded-2xl focus:bg-white focus:border-sky-500 outline-none transition-all font-bold"
                                    placeholder={profile.weight ? String(profile.weight) : "e.g. 70"}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Height (cm)</label>
                                <input
                                    type="number"
                                    value={profile.height}
                                    onChange={e => setProfile({ ...profile, height: e.target.value === '' ? '' : Math.floor(Number(e.target.value)) })}
                                    className="w-full bg-slate-50 border-2 border-slate-50 p-3 rounded-2xl focus:bg-white focus:border-sky-500 outline-none transition-all font-bold"
                                    placeholder={profile.height ? String(profile.height) : "e.g. 175"}
                                />
                            </div>

                            <button onClick={handleSaveProfile} className="w-full bg-sky-50 text-sky-600 p-4 rounded-2xl font-black text-xs hover:bg-sky-100 transition-all uppercase tracking-widest active:scale-95 mt-2">
                                {t('saveProfile')}
                            </button>
                        </div>
                    </section>

                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 bg-sky-500/20 rounded-full h-32 w-32"></div>
                        <h3 className="text-sm font-black uppercase tracking-widest mb-4 italic leading-none">Security Note</h3>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Your medical data is encrypted and analyzed using secure, self-reliant AI models dedicated to Atmanirbhar Bharat.</p>
                        <div className="mt-6 flex items-center gap-2">
                            <ShieldCheckIcon />
                            <span className="text-[10px] font-black text-sky-400 uppercase tracking-tighter">Verified Analysis</span>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 space-y-8">
                    {report ? (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {/* Score Card */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Overall Health Score</p>
                                    <div className="relative">
                                        <svg className="w-32 h-32 transform -rotate-90">
                                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-50" />
                                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent"
                                                strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * report.healthScore) / 100}
                                                className={`${report.healthScore > 70 ? 'text-emerald-500' : report.healthScore > 40 ? 'text-sky-500' : 'text-rose-500'} transition-all duration-1000 ease-out`}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-3xl font-black text-slate-900">{report.healthScore}%</span>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase">Synchronized: {new Date(report.timestamp).toLocaleDateString()}</p>
                                </div>

                                <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                        Clinical Summary
                                    </h3>
                                    <p className="text-slate-700 text-sm font-bold leading-relaxed italic flex-grow">
                                        "{report.summary}"
                                    </p>
                                    <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Sewa Health Engine v2.5</span>
                                        <div className="flex gap-1">
                                            <div className="w-1 h-1 bg-sky-500 rounded-full"></div>
                                            <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                            <div className="w-1 h-1 bg-green-600 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-sky-500 rounded-full"></div>
                                    AI Clinical Recommendations
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(report.recommendations || []).map((r, i) => (
                                        <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                                            <div className="w-6 h-6 bg-sky-600 text-white rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg shadow-sky-100">{i + 1}</div>
                                            <p className="text-xs font-bold text-slate-700 leading-relaxed">{r}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Metrics Table */}
                            {report.detailedAnalysis && report.detailedAnalysis.length > 0 && (
                                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                                    <div className="p-8 border-b border-slate-50">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                            Vital Metrics Analysis
                                        </h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-50/50">
                                                <tr className="border-b border-slate-100">
                                                    <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Metric</th>
                                                    <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Value</th>
                                                    <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                    <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Insight</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {report.detailedAnalysis.map((item, index) => (
                                                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="py-5 px-8 font-black text-slate-800 text-xs">{item.metric}</td>
                                                        <td className="py-5 px-8 text-sky-600 font-black text-xs">{item.value}</td>
                                                        <td className="py-5 px-8">
                                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm border ${item.status === 'Normal' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                item.status === 'Critical' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                    'bg-amber-50 text-amber-600 border-amber-100'
                                                                }`}>
                                                                {item.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-5 px-8 text-slate-500 text-[11px] font-bold italic leading-relaxed">{item.insight}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Diet Plan */}
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-orange-600 rounded-full"></div>
                                    Indigenous Diet Protocol
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 -mr-4 -mt-4 bg-orange-200/20 rounded-full h-24 w-24"></div>
                                        <div className="flex justify-between items-center mb-4 relative z-10">
                                            <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Daily Energy Target</span>
                                            <span className="text-3xl font-black text-orange-600">{report.dietPlan?.calories || 0} <span className="text-xs">kcal</span></span>
                                        </div>
                                        <p className="text-xs font-bold text-orange-800 leading-relaxed italic">"{report.dietPlan?.breakdown || 'N/A'}"</p>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Therapeutic Foods</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {(report.dietPlan?.suggestedFoods || []).map((food, i) => (
                                                    <span key={i} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter">
                                                        {food}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-3">Restricted Items</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {(report.dietPlan?.restrictedFoods || []).map((food, i) => (
                                                    <span key={i} className="bg-rose-50 text-rose-700 border border-rose-100 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter line-through decoration-rose-300">
                                                        {food}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                            <div className="bg-slate-50 p-6 rounded-full text-slate-300 mb-4">
                                <ChartBarIcon />
                            </div>
                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Initialize Clinical Analysis</p>
                            <button onClick={runAnalysis} className="mt-6 px-8 py-3 bg-sky-600 text-white font-black rounded-2xl shadow-lg shadow-sky-100 hover:bg-sky-700 transition-all active:scale-95 uppercase text-[10px] tracking-widest">
                                Run Health Engine
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Analytics;