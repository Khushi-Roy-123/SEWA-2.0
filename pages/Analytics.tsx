
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
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
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            // Collect records
            const storedRecords = localStorage.getItem('records') || '[]';
            const records = JSON.parse(storedRecords);
            
            if (records.length === 0) {
                setError(t('noRecordsToAnalyze'));
                setIsLoading(false);
                return;
            }

            const recordContext = records.map((r: any) => `${r.date}: ${r.title} (${r.type})`).join('\n');
            const profileContext = `Age: ${profile.age}, Weight: ${profile.weight}kg, Height: ${profile.height}cm`;

            const prompt = `Act as a senior medical data analyst. Analyze the following health records and physical profile.
            Profile: ${profileContext}
            Records: ${recordContext}

            Provide a comprehensive health report in JSON format ONLY:
            - healthScore: A number from 1-100 representing overall wellness.
            - summary: A 3-sentence summary of health status.
            - recommendations: Array of 4 actionable health steps.
            - dietPlan: An object with 'calories' (number), 'breakdown' (macro string), and 'suggestedFoods' (array of 5 items).
            - trendPoints: An array of up to 5 objects {date: string, score: number} visualizing health progress based on the dates of records provided.`;

            const schema = {
                type: Type.OBJECT,
                properties: {
                    healthScore: { type: Type.NUMBER },
                    summary: { type: Type.STRING },
                    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
                    dietPlan: {
                        type: Type.OBJECT,
                        properties: {
                            calories: { type: Type.NUMBER },
                            breakdown: { type: Type.STRING },
                            suggestedFoods: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    },
                    trendPoints: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                date: { type: Type.STRING },
                                score: { type: Type.NUMBER }
                            }
                        }
                    }
                }
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema
                }
            });

            const result = JSON.parse(response.text) as AnalyticsReport;
            result.timestamp = new Date().toISOString();
            
            setReport(result);
            localStorage.setItem('last_health_analytics', JSON.stringify(result));

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
                    <p className="text-slate-500 mt-1">{t('analyticsSubtitle')}</p>
                </div>
                <button
                    onClick={runAnalysis}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 text-white font-bold rounded-xl shadow-lg hover:bg-sky-700 transition-all disabled:bg-slate-300"
                >
                    {isLoading ? <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <SparklesIcon />}
                    {isLoading ? t('analyzingHistory') : t('runAnalysis')}
                </button>
            </header>

            {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Profile Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{t('physicalProfile')}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">{t('age')}</label>
                                <input 
                                    type="number" 
                                    value={profile.age} 
                                    onChange={e => setProfile({...profile, age: Number(e.target.value)})}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">{t('weight')}</label>
                                <input 
                                    type="number" 
                                    value={profile.weight} 
                                    onChange={e => setProfile({...profile, weight: Number(e.target.value)})}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">{t('height')}</label>
                                <input 
                                    type="number" 
                                    value={profile.height} 
                                    onChange={e => setProfile({...profile, height: Number(e.target.value)})}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
                                />
                            </div>
                            <button onClick={handleSaveProfile} className="w-full py-2 text-xs font-bold text-sky-600 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors">
                                {t('saveProfile')}
                            </button>
                        </div>
                    </section>
                </div>

                {/* Report Content */}
                <div className="lg:col-span-3 space-y-6">
                    {report ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Score & Trend */}
                                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-lg font-bold text-slate-800">{t('healthIndexTrend')}</h2>
                                        <div className="bg-sky-600 text-white px-3 py-1 rounded-full text-xl font-bold">
                                            {report.healthScore}
                                        </div>
                                    </div>
                                    <div className="h-48 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={report.trendPoints}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                                                <YAxis domain={[0, 100]} hide />
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                <Line type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={3} dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </section>

                                {/* Summary */}
                                <section className="bg-sky-900 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 -mr-8 -mt-8 bg-sky-800 rounded-full h-32 w-32 opacity-20"></div>
                                    <h2 className="text-lg font-bold mb-3 relative z-10">AI Insights</h2>
                                    <p className="text-sm text-sky-100 leading-relaxed relative z-10">{report.summary}</p>
                                    <div className="mt-6 space-y-2 relative z-10">
                                        {report.recommendations.map((rec, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs bg-sky-800/50 p-2 rounded-lg">
                                                <SparklesIcon />
                                                {rec}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            {/* Diet Plan */}
                            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                                <div className="flex flex-col md:flex-row gap-8">
                                    <div className="flex-1">
                                        <h2 className="text-xl font-bold text-slate-900">{t('dietPlanTitle')}</h2>
                                        <p className="text-slate-500 mt-1 text-sm">{t('dietPlanSubtitle')}</p>
                                        
                                        <div className="mt-8 grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-orange-50 rounded-2xl">
                                                <p className="text-xs font-bold text-orange-400 uppercase">Target Calories</p>
                                                <p className="text-2xl font-black text-orange-600">{report.dietPlan.calories} kcal</p>
                                            </div>
                                            <div className="p-4 bg-emerald-50 rounded-2xl">
                                                <p className="text-xs font-bold text-emerald-400 uppercase">Macro Breakdown</p>
                                                <p className="text-sm font-bold text-emerald-600">{report.dietPlan.breakdown}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-slate-50 p-6 rounded-2xl">
                                        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                            <SparklesIcon />
                                            Suggested Foods
                                        </h3>
                                        <ul className="grid grid-cols-1 gap-2">
                                            {report.dietPlan.suggestedFoods.map((food, i) => (
                                                <li key={i} className="bg-white px-4 py-2 rounded-lg text-sm text-slate-600 border border-slate-100">
                                                    {food}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </section>
                        </>
                    ) : (
                        <div className="bg-white p-20 rounded-2xl border border-dashed border-slate-300 text-center space-y-4">
                            <div className="mx-auto bg-slate-100 p-4 rounded-full w-16">
                                <FileTextIcon />
                            </div>
                            <h3 className="text-slate-400 font-medium">Ready for your first analysis?</h3>
                            <p className="text-sm text-slate-400 max-w-xs mx-auto">Click "Generate Health Report" to see AI-driven trends and a personalized diet plan.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
