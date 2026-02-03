import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useTranslations } from '../lib/i18n';
import { ChartBarIcon, SparklesIcon, FileTextIcon } from '../components/Icons';

declare global {
  interface Window {
    Recharts: any;
  }
}

const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = window.Recharts || {};

interface AnalyticsReport {
    timestamp: string;
    healthScore: number;
    summary: string;
    recommendations: string[];
    dietPlan: {
        calories: number;
        breakdown: string;
        suggestedFoods: string[];
    };
    trendPoints: { date: string; score: number }[];
}

const Analytics: React.FC = () => {
    const { t } = useTranslations();
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<AnalyticsReport | null>(null);
    const [profile, setProfile] = useState({ weight: 70, height: 175, age: 30 });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const storedProfile = localStorage.getItem('user_physical_profile');
        if (storedProfile) setProfile(JSON.parse(storedProfile));
        
        const lastReport = localStorage.getItem('last_health_analytics');
        if (lastReport) setReport(JSON.parse(lastReport));
    }, []);

    const handleSaveProfile = () => {
        localStorage.setItem('user_physical_profile', JSON.stringify(profile));
        alert('Profile saved!');
    };

    const runAnalysis = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_OPENROUTER_API_KEY || '');
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            const storedRecords = localStorage.getItem('records') || '[]';
            const records = JSON.parse(storedRecords);
            
            if (records.length === 0) {
                setError(t('noRecordsToAnalyze'));
                setIsLoading(false);
                return;
            }

            const recordContext = records.map((r: any) => `${r.date}: ${r.title} (${r.type})`).join('\n');
            const profileContext = `Age: ${profile.age}, Weight: ${profile.weight}kg, Height: ${profile.height}cm`;

            const prompt = `Analyze:
            Profile: ${profileContext}
            Records: ${recordContext}

            Provide JSON ONLY with:
            - healthScore: 1-100 number.
            - summary: 3 sentences.
            - recommendations: Array of 4 strings.
            - dietPlan: { calories: number, breakdown: string, suggestedFoods: string[] }
            - trendPoints: Array of { date: string, score: number } for dates in records.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let jsonText = response.text().trim();
             if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/^```json/, '').replace(/```$/, '');
            } else if (jsonText.startsWith('```')) {
                 jsonText = jsonText.replace(/^```/, '').replace(/```$/, '');
            }

            const parsed = JSON.parse(jsonText);
            parsed.timestamp = new Date().toISOString();
            
            setReport(parsed);
            localStorage.setItem('last_health_analytics', JSON.stringify(parsed));

        } catch (err) {
            console.error(err);
            setError('Failed to analyze records. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                        <ChartBarIcon />
                        {t('analyticsTitle')}
                    </h1>
                </div>
                <button
                    onClick={runAnalysis}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 text-white font-bold rounded-xl shadow-lg hover:bg-sky-700 disabled:bg-slate-300"
                >
                    {isLoading ? t('analyzingHistory') : t('runAnalysis')}
                </button>
            </header>

            {error && <div className="text-red-500">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                 {/* Profile Sync */}
                 <div className="lg:col-span-1 space-y-6">
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{t('physicalProfile')}</h2>
                        <input type="number" value={profile.age} onChange={e => setProfile({...profile, age: Number(e.target.value)})} className="w-full border p-2 rounded mb-2" placeholder="Age" />
                        <input type="number" value={profile.weight} onChange={e => setProfile({...profile, weight: Number(e.target.value)})} className="w-full border p-2 rounded mb-2" placeholder="Weight" />
                        <input type="number" value={profile.height} onChange={e => setProfile({...profile, height: Number(e.target.value)})} className="w-full border p-2 rounded mb-2" placeholder="Height" />
                        <button onClick={handleSaveProfile} className="w-full bg-sky-50 text-sky-600 p-2 rounded font-bold">{t('saveProfile')}</button>
                    </section>
                </div>

                <div className="lg:col-span-3 space-y-6">
                    {report ? (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm">
                                <h2 className="text-xl font-bold">Health Score: {report.healthScore}</h2>
                                <p>{report.summary}</p>
                            </div>
                             <div className="bg-white p-6 rounded-2xl shadow-sm">
                                <h2 className="text-xl font-bold">Recommendations</h2>
                                <ul>{report.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-12 text-slate-400">Run analysis to see report</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
