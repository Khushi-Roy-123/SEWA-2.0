import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useTranslations } from '@/lib/i18n';
import { QrCodeIcon, HeartbeatIcon, KeyIcon, ShieldCheckIcon } from '../components/Icons';
import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '../services/userService';

const ShareProfile: React.FC = () => {
    const { t } = useTranslations();
    const { currentUser } = useAuth();
    const [qrGenerated, setQrGenerated] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [copied, setCopied] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (currentUser) {
                const data = await UserService.getUserProfile(currentUser.uid);
                if (data) setProfile(data);
            }
        };
        fetchProfile();
    }, [currentUser]);

    const generateQRCode = async () => {
        setQrGenerated(true);
        // Wait for render
        setTimeout(async () => {
            if (canvasRef.current) {
                const shareUrl = `${window.location.origin}/public-profile/${currentUser?.uid}`; 
                
                try {
                    await QRCode.toCanvas(canvasRef.current, shareUrl, {
                        width: 256,
                        margin: 2,
                        color: {
                            dark: "#0c4a6e",
                            light: "#ffffff"
                        },
                        errorCorrectionLevel: 'H'
                    });
                } catch (err) {
                    console.error("QR Gen Error", err);
                }
            }
        }, 100);
    };

    const copySewaCode = () => {
        if (profile?.sewaCode) {
            navigator.clipboard.writeText(profile.sewaCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const getAvatarUrl = (gender?: string, name?: string) => {
        const seed = name || 'User';
        if (gender === 'Female') return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&gender=female`;
        if (gender === 'Male') return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&gender=male`;
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <QrCodeIcon />
                        {t('shareTitle')}
                    </h1>
                    <p className="text-slate-500 mt-1">{t('shareSubtitle')}</p>
                </div>
                <div className="flex items-center gap-2 bg-sky-50 px-4 py-2 rounded-2xl border border-sky-100">
                    <ShieldCheckIcon />
                    <span className="text-xs font-black text-sky-700 uppercase tracking-tighter">{t('atmanirbharBharat')}</span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* ID Preview Card */}
                {profile ? (
                    <div className="lg:col-span-1 bg-sky-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 bg-sky-800 rounded-full h-64 w-64 opacity-20"></div>
                        
                        <div className="flex items-center gap-4 mb-8">
                            <div className="bg-sky-500 p-2.5 rounded-2xl shadow-lg">
                                <HeartbeatIcon />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-widest italic leading-none">SEWA ID</h2>
                                <p className="text-[10px] text-sky-300 font-bold mt-1">{t('emergencyAccessOnly')}</p>
                            </div>
                        </div>

                        <div className="flex gap-6 mb-10">
                            <div className="relative">
                                <img src={profile.photoURL || getAvatarUrl(profile.gender, profile.name)} alt="Profile" className="w-24 h-24 rounded-3xl border-2 border-sky-400 object-cover bg-sky-800 p-1" />
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-1.5 rounded-full border-4 border-sky-900 shadow-lg">
                                    <ShieldCheckIcon />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-black tracking-tight">{profile.name}</p>
                                <div className="flex items-center gap-2">
                                    <span className="bg-sky-500 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">{t('bloodGroup')}</span>
                                    <span className="text-lg font-black">{profile.bloodGroup || '--'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="bg-sky-950/40 p-4 rounded-2xl border border-sky-800/50 backdrop-blur-sm">
                                <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-1">{t('allergies')}</p>
                                <p className="text-sm font-bold truncate">{profile.allergies || 'No known allergies'}</p>
                            </div>
                            <div className="bg-sky-950/40 p-4 rounded-2xl border border-sky-800/50 backdrop-blur-sm">
                                <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-1">Health Score</p>
                                <p className="text-2xl font-black text-emerald-400">{profile.lastHealthReport?.healthScore ? `${profile.lastHealthReport.healthScore}/100` : '--'}</p>
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-sky-800/50 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-sky-400 uppercase">{t('madeInIndia')}</span>
                                <span className="text-[10px] font-medium text-sky-300">{t('digitalIndia')}</span>
                            </div>
                            <div className="w-8 h-8 opacity-30 grayscale invert">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 5v6.09c0 4.97 3.41 9.32 8 10.91 4.59-1.59 8-5.94 8-10.91V5l-8-3z"/></svg>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[400px]">
                        <div className="w-12 h-12 border-4 border-sky-100 border-t-sky-600 rounded-full animate-spin"></div>
                        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Your SEWA ID</p>
                    </div>
                )}

                {/* Sewa Code Section */}
                <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center h-full">
                    <div className="bg-sky-50 p-4 rounded-2xl mb-6 text-sky-600">
                        <KeyIcon />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">{t('sewaCode')}</h2>
                    <p className="text-sm text-slate-500 mb-8 max-w-[200px] mx-auto">Share this 6-digit code with your doctor for immediate record access.</p>
                    
                    <div className="w-full bg-sky-50 border-2 border-sky-100 rounded-3xl p-8 mb-6 group relative">
                        {profile?.sewaCode ? (
                            <div className="flex flex-col items-center gap-4">
                                <span className="text-4xl font-black tracking-[0.3em] text-sky-900 font-mono">
                                    {profile.sewaCode}
                                </span>
                                <button 
                                    onClick={copySewaCode}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-200 text-sky-600 hover:bg-sky-300'}`}
                                >
                                    {copied ? 'Copied!' : 'Copy Code'}
                                </button>
                            </div>
                        ) : (
                            <div className="animate-pulse flex flex-col items-center gap-2">
                                <div className="h-10 w-40 bg-slate-200 rounded-lg"></div>
                                <div className="h-4 w-20 bg-slate-200 rounded-lg"></div>
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-slate-50 rounded-2xl p-4 w-full border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Security Advice</p>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Codes are unique and only provide view access. Never share with unverified individuals.</p>
                    </div>
                </div>

                {/* QR Code Section */}
                <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center h-full">
                    {!qrGenerated ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="bg-sky-50 p-12 rounded-[2rem] border-2 border-dashed border-sky-100 mb-8">
                                <QrCodeIcon />
                            </div>
                            <button
                                onClick={generateQRCode}
                                className="w-full py-4 px-8 bg-sky-600 text-white font-bold rounded-2xl shadow-lg hover:bg-sky-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                            >
                                <QrCodeIcon />
                                {t('generateQR')}
                            </button>
                        </div>
                    ) : (
                        <div className="animate-in fade-in zoom-in duration-500 h-full flex flex-col items-center">
                            <div className="p-4 bg-white border-8 border-sky-50 rounded-[2.5rem] shadow-inner mb-6">
                                <canvas ref={canvasRef}></canvas>
                            </div>
                            <p className="text-slate-900 font-black text-xl mb-2">{t('scanMe')}</p>
                            <p className="text-sm text-slate-400 max-w-xs mb-8">Scan to view the full medical profile instantly on any mobile device.</p>
                            <button onClick={() => setQrGenerated(false)} className="mt-auto text-sky-600 font-bold text-sm hover:underline">
                                Regenerate Code
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareProfile;
