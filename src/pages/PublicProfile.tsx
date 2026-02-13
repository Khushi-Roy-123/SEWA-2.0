import React, { useState, useEffect } from 'react';
import { HeartbeatIcon, ExclamationIcon, PillIcon, FileTextIcon, UserIcon, CalendarIcon, ShieldCheckIcon } from '../components/Icons';
import { useParams, useNavigate } from 'react-router-dom';
import { UserService } from '@/services/userService';
import { MedicationService, Medication } from '@/services/medicationService';
import { useTranslations } from '@/lib/i18n';

const PublicProfile: React.FC = () => {
    const { t } = useTranslations();
    const { userId } = useParams<{ userId: string }>();
    const [profile, setProfile] = useState<any>(null);
    const [meds, setMeds] = useState<Medication[]>([]);
    const [loading, setLoading] = useState(true);

    const getAvatarUrl = (gender?: string, name?: string) => {
        const seed = name || 'User';
        if (gender === 'Female') return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&gender=female`;
        if (gender === 'Male') return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&gender=male`;
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    };

    useEffect(() => {
// ... rest same
        const fetchAllData = async () => {
            if (userId) {
                setLoading(true);
                try {
                    const [profileData, medicationData] = await Promise.all([
                        UserService.getUserProfile(userId),
                        MedicationService.getMedicationsByUserId(userId)
                    ]);
                    
                    if (profileData) {
                        setProfile(profileData);
                    }
                    setMeds(medicationData.filter(m => m.status === 'Active'));
                } catch (error) {
                    console.error("Error fetching public profile:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchAllData();
    }, [userId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-sky-100 rounded-full animate-ping opacity-20 scale-150"></div>
                    <div className="relative bg-white p-6 rounded-full shadow-2xl shadow-sky-100 border border-slate-50">
                        <div className="bg-sky-600 p-4 rounded-3xl text-white shadow-lg">
                            <HeartbeatIcon />
                        </div>
                    </div>
                </div>
                <div className="text-center space-y-3">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic">SEWA VERIFY</h2>
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 bg-sky-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-sky-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-sky-600 rounded-full animate-bounce"></div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pt-4">Retrieving Secure Medical Records</p>
                    <p className="text-[8px] font-bold text-sky-500 uppercase tracking-widest">Bharat Digital Mission Initiative</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
                <div className="bg-red-100 p-4 rounded-full text-red-600 mb-4">
                    <ExclamationIcon />
                </div>
                <h1 className="text-xl font-bold text-slate-800">Profile Not Found</h1>
                <p className="text-slate-500 mt-2">This link may be expired or invalid. Please request a new Sewa Code or QR from the patient.</p>
            </div>
        );
    }

    const allergyList = typeof profile.allergies === 'string' 
        ? profile.allergies.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '')
        : (Array.isArray(profile.allergies) ? profile.allergies : []);

    const healthReport = profile.lastHealthReport;

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 p-4 space-y-6 pb-20">
             {/* Blue Accent Line */}
             <div className="h-1.5 w-full flex rounded-full overflow-hidden shadow-sm">
                <div className="h-full flex-1 bg-sky-400"></div>
                <div className="h-full flex-1 bg-sky-500"></div>
                <div className="h-full flex-1 bg-sky-600"></div>
            </div>

            {/* Professional Header */}
            <header className="bg-sky-900 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-12 -mt-12 bg-sky-800 rounded-full h-48 w-48 opacity-20"></div>
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-2">
                        <HeartbeatIcon />
                        <span className="font-black text-xs uppercase tracking-widest italic">SEWA VERIFY</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="bg-emerald-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase shadow-lg shadow-emerald-900/20">Verified Identity</span>
                        <span className="text-[7px] font-bold text-sky-400 mt-1 uppercase tracking-tighter">Bharat Digital Mission</span>
                    </div>
                </div>
                
                <div className="flex gap-4 items-center mb-6 relative z-10">
                    <div className="relative">
                        <img 
                            src={getAvatarUrl(profile.gender, profile.name)} 
                            className="w-20 h-20 rounded-2xl border-2 border-sky-400 bg-sky-800 p-1" 
                            alt={profile.name}
                        />
                        <div className="absolute -bottom-1 -right-1 bg-sky-400 p-1 rounded-full border-2 border-sky-900">
                            <ShieldCheckIcon />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black leading-tight tracking-tight">{profile.name}</h1>
                        <p className="text-sky-300 text-[10px] font-bold uppercase tracking-widest mt-1">Patient Profile</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 relative z-10">
                    <div className="bg-sky-800/50 backdrop-blur-md p-3 rounded-2xl border border-sky-700/50">
                        <p className="text-[9px] font-bold text-sky-400 uppercase tracking-tighter mb-1">Blood Group</p>
                        <p className="text-xl font-black">{profile.bloodGroup || '--'}</p>
                    </div>
                    <div className="bg-sky-800/50 backdrop-blur-md p-3 rounded-2xl border border-sky-700/50">
                        <p className="text-[9px] font-bold text-sky-400 uppercase tracking-tighter mb-1">Emergency Contact</p>
                        <p className="text-sm font-bold truncate">{profile.emergencyContact?.name || 'None'}</p>
                        {profile.emergencyContact?.phone && (
                            <p className="text-[9px] font-mono mt-0.5 text-sky-300">{profile.emergencyContact.phone}</p>
                        )}
                    </div>
                </div>
            </header>

            {/* Health Score Summary (from AI) */}
            {healthReport && (
                <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-slate-800 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-sky-500 rounded-full"></div>
                             AI Health Insights
                        </h2>
                        <div className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                            <span className={`text-sm font-black ${healthReport.healthScore > 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {healthReport.healthScore}%
                            </span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-bold italic">
                        "{healthReport.summary}"
                    </p>
                </section>
            )}

            {/* Critical Allergies */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="flex items-center gap-2 text-red-600 font-bold mb-4 uppercase text-[10px] tracking-widest">
                    <ExclamationIcon />
                    Medical Alerts
                </h2>
                <div className="space-y-2">
                    {allergyList.length > 0 ? (
                        allergyList.map((allergy: string, index: number) => (
                            <div key={index} className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-700 font-black flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                {allergy}
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 p-4 rounded-2xl text-xs font-bold">
                             <ShieldCheckIcon />
                             No known medical allergies.
                        </div>
                    )}
                </div>
            </section>

            {/* Current Medications */}
            {meds.length > 0 && (
                <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h2 className="flex items-center gap-2 text-slate-800 font-bold mb-4 uppercase text-[10px] tracking-widest">
                        <PillIcon />
                        Active Medications
                    </h2>
                    <div className="grid grid-cols-1 gap-3">
                        {meds.map((med, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="font-black text-slate-800 text-xs">{med.name}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">{med.dosage} • {med.days.length === 7 ? 'Daily' : 'Scheduled'}</p>
                                </div>
                                <div className="text-slate-200"><PillIcon /></div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Physical Profile */}
            {(profile.weight || profile.height || profile.age) && (
                <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h2 className="flex items-center gap-2 text-slate-800 font-bold mb-4 uppercase text-[10px] tracking-widest">
                        <UserIcon />
                        Physical Profile
                    </h2>
                    <div className="grid grid-cols-3 gap-2">
                        {profile.age && (
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Age</p>
                                <p className="text-sm font-black text-slate-800">{profile.age}</p>
                            </div>
                        )}
                        {profile.weight && (
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Weight</p>
                                <p className="text-sm font-black text-slate-800">{profile.weight}kg</p>
                            </div>
                        )}
                        {profile.height && (
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Height</p>
                                <p className="text-sm font-black text-slate-800">{profile.height}cm</p>
                            </div>
                        )}
                    </div>
                </section>
            )}
            
            <div className="bg-sky-50 p-6 rounded-[2rem] border border-sky-100 text-center space-y-3">
                <div className="flex justify-center gap-2">
                    <div className="h-1 w-6 bg-sky-500 rounded-full"></div>
                    <div className="h-1 w-6 bg-slate-300 rounded-full"></div>
                    <div className="h-1 w-6 bg-sky-600 rounded-full"></div>
                </div>
                <h3 className="text-[10px] font-black text-sky-700 uppercase tracking-widest">{t('atmanirbharBharat')}</h3>
                <p className="text-[9px] text-sky-800 font-bold leading-relaxed">
                    Sewa is an indigenous, secure, and self-reliant digital health platform built to empower India's healthcare ecosystem.
                </p>
                <div className="pt-2 border-t border-sky-200/50">
                    <p className="text-[8px] text-sky-600 font-black uppercase">{t('madeInIndia')}</p>
                </div>
            </div>

            <footer className="text-center text-[9px] text-slate-400 pt-4 space-y-1 pb-10">
                <p className="font-black text-slate-500 uppercase tracking-tighter">Verified Medical Identity Summary</p>
                <p className="font-bold">Sewa Code: <span className="text-slate-900 font-black">{profile.sewaCode}</span></p>
                <p>Sync: {new Date().toLocaleString()}</p>
            </footer>
        </div>
    );
};

export default PublicProfile;
