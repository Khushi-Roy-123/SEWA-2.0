import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarIcon, 
  PillIcon, 
  StethoscopeIcon, 
  UploadIcon, 
  ChartBarIcon, 
  SparklesIcon,
  ShieldCheckIcon
} from '../components/Icons';
import { useTranslations } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment } from '../services/appointmentService';
import { GoogleFitService, FitData } from '../services/googleFitService';
import { useData } from '@/contexts/DataContext';

// Local Components for Dashboard
const StatCard: React.FC<{ label: string; value: string | number; unit?: string; icon: React.ReactNode; color: string }> = ({ label, value, unit, icon, color }) => (
  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold text-slate-800">{value}</span>
        {unit && <span className="text-xs font-medium text-slate-400">{unit}</span>}
      </div>
    </div>
  </div>
);

const PrimaryCard: React.FC<{ title: string; subtitle: string; icon: React.ReactNode; color: string; onClick: () => void }> = ({ title, subtitle, icon, color, onClick }) => (
  <button 
    onClick={onClick}
    className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all text-left group"
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${color}`}>
      {icon}
    </div>
    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
    <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
  </button>
);

const { LineChart, Line, ResponsiveContainer, YAxis } = (window as any).Recharts || {};

const Dashboard: React.FC = () => {
    const { t, language } = useTranslations();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { medications, appointments, userProfile, fitData, refreshFitData } = useData();
    
    const [nextMed, setNextMed] = useState<any>(null);
    const [nextApt, setNextApt] = useState<Appointment | null>(null);
    const [healthScore, setHealthScore] = useState<number | null>(null);
    const [trendData, setTrendData] = useState<any[]>([]);
    const [aiInsights, setAiInsights] = useState<string[]>([]);
    const [userName, setUserName] = useState(currentUser?.displayName?.split(' ')[0] || 'User');
    const [activeMedsCount, setActiveMedsCount] = useState(0);

    useEffect(() => {
        if (!currentUser) return;

        if (currentUser.displayName) {
             setUserName(currentUser.displayName.split(' ')[0]);
        }
        
        // Use Preloaded User Profile for Health Score and Trends
        if (userProfile?.lastHealthReport) {
            setHealthScore(userProfile.lastHealthReport.healthScore);
            if (userProfile.lastHealthReport.trendPoints) {
                setTrendData(userProfile.lastHealthReport.trendPoints);
            }
            if (userProfile.lastHealthReport.recommendations) {
                setAiInsights(userProfile.lastHealthReport.recommendations.slice(0, 2));
            }
        }

        refreshFitData();
    }, [currentUser, userProfile]);

    // Calculate Next Dose from preloaded medications
    useEffect(() => {
        const active = medications.filter(m => m.status === 'Active');
        setActiveMedsCount(active.length);

        const now = new Date();
        let upcoming: { name: string; time: string; dateTime: Date }[] = [];
        active.forEach((m) => {
            m.reminderTimes.forEach((time) => {
                const [h, min] = time.split(':').map(Number);
                const d = new Date(); 
                d.setHours(h, min, 0);
                if (d > now) upcoming.push({ name: m.name, time: time, dateTime: d });
            });
        });
        if (upcoming.length > 0) {
            upcoming.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
            setNextMed(upcoming[0]);
        } else {
            setNextMed(null);
        }
    }, [medications]);

    // Calculate Next Appointment from preloaded appointments
    useEffect(() => {
        const upcoming = appointments
            .filter(a => a.status === 'Upcoming' && new Date(a.date) >= new Date(new Date().setHours(0,0,0,0)))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        if (upcoming.length > 0) {
            setNextApt(upcoming[0]);
        } else {
            setNextApt(null);
        }
    }, [appointments]);

    const handleGoogleFitSync = () => {
        window.location.href = GoogleFitService.getAuthUrl();
    };

    const dateStr = useMemo(() => new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' }), [language]);

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-sky-600 font-bold text-sm uppercase tracking-widest">{dateStr}</p>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-1">
                        {t('welcomeBack', { name: userName })}
                    </h1>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-3 h-3 bg-sky-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{language === 'hi' ? 'प्रणाली सुरक्षित' : 'System Secure'}</span>
                </div>
            </div>

            {/* Top Stats Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    label={t('healthAnalytics')} 
                    value={healthScore || '--'} 
                    unit="/100" 
                    icon={<ChartBarIcon />} 
                    color="bg-sky-100 text-sky-600" 
                />

                <StatCard 
                    label={language === 'hi' ? 'दैनिक कदम' : 'Daily Steps'} 
                    value={fitData?.steps || '--'} 
                    unit="Steps"
                    icon={<div className="text-xl">🏃</div>} 
                    color="bg-orange-100 text-orange-600" 
                />
                <StatCard 
                    label={t('medications')} 
                    value={activeMedsCount} 
                    unit={language === 'hi' ? 'आइटम' : 'Items'}
                    icon={<PillIcon />} 
                    color="bg-emerald-100 text-emerald-600" 
                />
                <StatCard 
                    label="Calories" 
                    value={fitData?.calories || '--'} 
                    unit="kcal"
                    icon={<div className="text-xl">🔥</div>} 
                    color="bg-rose-100 text-rose-600" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Activities */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Google Fit Section */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <img src="https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png" alt="Google" className="w-24 h-24" />
                        </div>
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Google Fit Sync</h2>
                                <p className="text-sm text-slate-400 font-medium">Real-time activity and metabolic tracking</p>
                            </div>
                            {!fitData ? (
                                <button 
                                    onClick={handleGoogleFitSync}
                                    className="px-6 py-2 bg-slate-900 text-white font-black rounded-xl text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
                                >
                                    Connect Fit
                                </button>
                            ) : (
                                <button 
                                    onClick={handleGoogleFitSync}
                                    className="px-4 py-2 bg-emerald-50 text-emerald-600 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all"
                                >
                                    ✓ Synced
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-4 relative z-10">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Distance</p>
                                <p className="text-2xl font-black text-slate-900">{fitData ? (fitData.distance / 1000).toFixed(2) : '--'}</p>
                                <p className="text-[10px] font-bold text-slate-400">Kilometers</p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Active Time</p>
                                <p className="text-2xl font-black text-slate-900">{fitData ? Math.floor(fitData.steps / 100) : '--'}</p>
                                <p className="text-[10px] font-bold text-slate-400">Minutes</p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Intensity</p>
                                <p className="text-2xl font-black text-slate-900">{fitData ? (fitData.steps > 5000 ? 'High' : 'Low') : '--'}</p>
                                <p className="text-[10px] font-bold text-slate-400">Level</p>
                            </div>
                        </div>
                    </div>

                    {/* Health Index Graph Card */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{t('healthIndexTrend')}</h2>
                                <p className="text-sm text-slate-400">{language === 'hi' ? 'आपके रिकॉर्ड के आधार पर साप्ताहिक प्रगति' : 'Weekly progress based on your records'}</p>
                            </div>
                            <button onClick={() => navigate('/analytics')} className="text-sky-600 font-bold text-sm hover:underline">
                                {language === 'hi' ? 'पूरी रिपोर्ट देखें' : 'View Full Report'}
                            </button>
                        </div>
                        <div className="h-48 w-full">
                            {trendData.length > 0 && LineChart ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={trendData}>
                                        <YAxis domain={[0, 100]} hide />
                                        <Line 
                                            type="monotone" 
                                            dataKey="score" 
                                            stroke="#0ea5e9" 
                                            strokeWidth={4} 
                                            dot={{ fill: '#0ea5e9', r: 4 }} 
                                            activeDot={{ r: 8 }} 
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <p className="text-slate-400 text-sm font-medium">{language === 'hi' ? 'रुझान देखने के लिए अपना पहला विश्लेषण करें' : 'Generate your first analysis to see trends'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-8">
                    {/* Next Appointment Card */}
                    <PrimaryCard 
                        title={nextApt ? nextApt.doctor : (language === 'hi' ? 'कोई अपॉइंटमेंट नहीं' : "No appointments")}
                        subtitle={nextApt ? `${new Date(nextApt.date).toLocaleDateString()} at ${nextApt.time} • ${nextApt.specialty}` : (language === 'hi' ? 'अपनी अगली मुलाकात निर्धारित करें' : "Schedule your next visit")}
                        icon={<CalendarIcon />}
                        color="bg-sky-600 text-white"
                        onClick={() => navigate('/appointments')}
                    />

                    {/* Next Medication Card */}
                    <PrimaryCard 
                        title={nextMed ? nextMed.name : (language === 'hi' ? 'कोई खुराक लंबित नहीं' : "No pending doses")}
                        subtitle={nextMed ? (language === 'hi' ? `${nextMed.time} के लिए निर्धारित` : `Scheduled for ${nextMed.time}`) : (language === 'hi' ? 'अपनी दवाएं जोड़ें' : "Add your medications")}
                        icon={<PillIcon />}
                        color="bg-emerald-500 text-white"
                        onClick={() => navigate('/medications')}
                    />

                    {/* Quick Actions Panel */}
                    <div className="bg-sky-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 bg-sky-800 rounded-full h-32 w-32 opacity-20"></div>
                        <h2 className="text-lg font-bold mb-4 relative z-10">{t('quickActions')}</h2>
                        <div className="grid grid-cols-1 gap-3 relative z-10">
                            <button 
                                onClick={() => navigate('/symptoms')}
                                className="w-full flex items-center gap-3 bg-sky-800/50 hover:bg-sky-800 p-3 rounded-2xl transition-colors text-sm font-bold"
                            >
                                <div className="bg-sky-500 p-2 rounded-xl"><StethoscopeIcon /></div>
                                {t('symptomCheckerActionTitle')}
                            </button>
                            <button 
                                onClick={() => navigate('/upload-record')}
                                className="w-full flex items-center gap-3 bg-sky-800/50 hover:bg-sky-800 p-3 rounded-2xl transition-colors text-sm font-bold"
                            >
                                <div className="bg-sky-500 p-2 rounded-xl"><UploadIcon /></div>
                                {t('uploadRecordActionTitle')}
                            </button>

                        </div>
                    </div>

                    {/* AI Insights Card */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                            <SparklesIcon />
                            <h2 className="font-bold text-slate-800 uppercase text-xs tracking-widest">{language === 'hi' ? 'एआई वेलनेस टिप्स' : 'AI WELLNESS TIPS'}</h2>
                        </div>
                        <div className="space-y-4">
                            {aiInsights.length > 0 ? aiInsights.map((insight, i) => (
                                <div key={i} className="bg-sky-50 p-4 rounded-2xl text-sm text-sky-800 font-medium leading-relaxed border border-sky-100">
                                    {insight}
                                </div>
                            )) : (
                                <p className="text-xs text-slate-400 italic">{language === 'hi' ? 'कोई हालिया एआई सुझाव नहीं। व्यक्तिगत सिफारिशें प्राप्त करने के लिए स्वास्थ्य विश्लेषण करें।' : 'No recent AI tips. Perform a health analysis to get personalized recommendations.'}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;