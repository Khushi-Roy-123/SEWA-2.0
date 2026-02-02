
import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarIcon, 
  PillIcon, 
  StethoscopeIcon, 
  UploadIcon, 
  HeartbeatIcon, 
  ChartBarIcon, 
  FaceSmileIcon,
  SparklesIcon
} from '../components/Icons';
import { useTranslations } from '../lib/i18n';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
    const { t } = useTranslations();
    const { user } = useAuth(); // Access user from context
    const navigate = useNavigate(); // Hook for navigation
    const [nextMed, setNextMed] = useState<any>(null);
    const [upcomingAppointment, setUpcomingAppointment] = useState<any>(null); // Placeholder for now
    const [healthScore, setHealthScore] = useState<number | null>(null);
    const [lastVital, setLastVital] = useState<number | null>(null);
    const [trendData, setTrendData] = useState<any[]>([]);
    const [aiInsights, setAiInsights] = useState<string[]>([]);
    
    // Fallback to "User" if no name, though auth should ensure user exists
    const userName = user?.name ? user.name.split(' ')[0] : 'User';

    useEffect(() => {
        // Load Analytics
        const analytics = localStorage.getItem('last_health_analytics');
        if (analytics) {
            const data = JSON.parse(analytics);
            setHealthScore(data.healthScore);
            setTrendData(data.trendPoints || []);
            setAiInsights(data.recommendations?.slice(0, 2) || []);
        }

        // Load Vitals (Mock or Last)
        const storedVitals = localStorage.getItem('vitals_history');
        if (storedVitals) {
            const v = JSON.parse(storedVitals);
            if (v.length > 0) setLastVital(v[v.length - 1].hr);
        }

        // Load Medications
        const storedMeds = localStorage.getItem('medications');
        if (storedMeds) {
            const meds = JSON.parse(storedMeds);
            const now = new Date();
            let upcoming = [];
            meds.forEach((m: any) => {
                if (m.status === 'Active') {
                    m.reminderTimes.forEach((time: string) => {
                        const [h, min] = time.split(':').map(Number);
                        const d = new Date(); d.setHours(h, min, 0);
                        if (d > now) upcoming.push({ name: m.name, time: time, dateTime: d });
                    });
                }
            });
            if (upcoming.length > 0) {
                upcoming.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
                setNextMed(upcoming[0]);
            }
        }
    }, []);

    const dateStr = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }), []);

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
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">System Secure</span>
                </div>
            </div>

            {/* Top Stats Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    label="Health Score" 
                    value={healthScore || '--'} 
                    unit="/100" 
                    icon={<ChartBarIcon />} 
                    color="bg-sky-100 text-sky-600" 
                />
                <StatCard 
                    label="Heart Rate" 
                    value={lastVital || '--'} 
                    unit="BPM" 
                    icon={<HeartbeatIcon />} 
                    color="bg-rose-100 text-rose-600" 
                />
                <StatCard 
                    label="Today's Mood" 
                    value="--" 
                    icon={<FaceSmileIcon />} 
                    color="bg-amber-100 text-amber-600" 
                />
                <StatCard 
                    label="Active Meds" 
                    value={nextMed ? '1 Pending' : '0 Pending'} 
                    icon={<PillIcon />} 
                    color="bg-emerald-100 text-emerald-600" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Activities */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Primary Engagement Row */}
                    <div className="flex flex-col sm:flex-row gap-6">
                        <PrimaryCard 
                            title={upcomingAppointment ? upcomingAppointment.doctor : "No Appointments"}
                            subtitle={upcomingAppointment ? `${upcomingAppointment.date} • ${upcomingAppointment.specialty}` : "Schedule a check-up"}
                            icon={<CalendarIcon />}
                            color="bg-sky-600 text-white"
                            onClick={() => navigate('/appointments')}
                        />
                        <PrimaryCard 
                            title={nextMed ? nextMed.name : "No pending doses"}
                            subtitle={nextMed ? `Scheduled for ${nextMed.time}` : "Great job keeping up!"}
                            icon={<PillIcon />}
                            color="bg-emerald-500 text-white"
                            onClick={() => navigate('/medications')}
                        />
                    </div>

                    {/* Health Index Graph Card */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Health Index Trend</h2>
                                <p className="text-sm text-slate-400">Weekly progress based on your records</p>
                            </div>
                            <button onClick={() => navigate('/analytics')} className="text-sky-600 font-bold text-sm hover:underline">
                                View Full Report
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
                                    <p className="text-slate-400 text-sm font-medium">Generate your first analysis to see trends</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-8">
                    {/* Quick Actions Panel */}
                    <div className="bg-sky-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 bg-sky-800 rounded-full h-32 w-32 opacity-20"></div>
                        <h2 className="text-lg font-bold mb-4 relative z-10">Quick Actions</h2>
                        <div className="grid grid-cols-1 gap-3 relative z-10">
                            <button 
                                onClick={() => navigate('/symptoms')}
                                className="w-full flex items-center gap-3 bg-sky-800/50 hover:bg-sky-800 p-3 rounded-2xl transition-colors text-sm font-bold"
                            >
                                <div className="bg-sky-500 p-2 rounded-xl"><StethoscopeIcon /></div>
                                Check Symptoms
                            </button>
                            <button 
                                onClick={() => navigate('/upload-record')}
                                className="w-full flex items-center gap-3 bg-sky-800/50 hover:bg-sky-800 p-3 rounded-2xl transition-colors text-sm font-bold"
                            >
                                <div className="bg-sky-500 p-2 rounded-xl"><UploadIcon /></div>
                                Upload Record
                            </button>
                            <button 
                                onClick={() => navigate('/vitals')}
                                className="w-full flex items-center gap-3 bg-sky-800/50 hover:bg-sky-800 p-3 rounded-2xl transition-colors text-sm font-bold"
                            >
                                <div className="bg-sky-500 p-2 rounded-xl"><HeartbeatIcon /></div>
                                Live Monitor
                            </button>
                        </div>
                    </div>

                    {/* AI Insights Card */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                            <SparklesIcon />
                            <h2 className="font-bold text-slate-800 uppercase text-xs tracking-widest">AI Wellness Tips</h2>
                        </div>
                        <div className="space-y-4">
                            {aiInsights.length > 0 ? aiInsights.map((insight, i) => (
                                <div key={i} className="bg-sky-50 p-4 rounded-2xl text-sm text-sky-800 font-medium leading-relaxed border border-sky-100">
                                    {insight}
                                </div>
                            )) : (
                                <p className="text-xs text-slate-400 italic">No recent AI tips. Perform a health analysis to get personalized recommendations.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
