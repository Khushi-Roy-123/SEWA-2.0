
import React, { useState, useRef } from 'react';
import { useTranslations } from '../lib/i18n';
import { QrCodeIcon, UserIcon, HeartbeatIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';

const ShareProfile: React.FC = () => {
    const { t } = useTranslations();
    const { user } = useAuth();
    const [qrGenerated, setQrGenerated] = useState(false);
    const [copied, setCopied] = useState(false);
    
    // Construct the share URL
    const shareUrl = `${window.location.origin}${window.location.pathname}#/public-profile?id=${user?.id || 'mock-user-123'}`;

    const handleGenerate = () => {
        setQrGenerated(true);
    };
    
    const handleCopyLink = async () => {
         try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy URL:', err);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                    <QrCodeIcon />
                    {t('shareTitle')}
                </h1>
                <p className="text-slate-500 mt-1">{t('shareSubtitle')}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* ID Preview */}
                <div className="bg-sky-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 bg-sky-800 rounded-full h-64 w-64 opacity-20"></div>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="bg-sky-500 p-2 rounded-xl">
                            <HeartbeatIcon />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-widest">Sewa Medical ID</h2>
                            <p className="text-xs text-sky-300 font-bold">{t('emergencyAccessOnly')}</p>
                        </div>
                    </div>

                    <div className="flex gap-6 mb-8">
                        <img src={user?.profilePhoto || "https://picsum.photos/200"} alt="Profile" className="w-24 h-24 rounded-2xl border-2 border-sky-400 object-cover" />
                        <div className="space-y-1">
                            <p className="text-2xl font-bold">{user?.name || 'Guest User'}</p>
                            <div className="flex items-center gap-2">
                                <span className="bg-sky-500 text-xs font-bold px-2 py-0.5 rounded uppercase">{t('bloodGroup')}</span>
                                <span className="text-lg font-bold">{user?.bloodGroup || 'O+'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-sky-950/40 p-4 rounded-2xl">
                            <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-1">{t('allergies')}</p>
                            <p className="text-sm font-medium">{user?.allergies || 'No known allergies'}</p>
                        </div>
                        <div className="bg-sky-950/40 p-4 rounded-2xl">
                            <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-1">Medications</p>
                            <p className="text-sm font-medium italic">Lisinopril 10mg, Vitamin D</p>
                        </div>
                    </div>
                </div>

                {/* QR Section */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                    {!qrGenerated ? (
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-12 rounded-2xl border-2 border-dashed border-slate-200">
                                <QrCodeIcon />
                            </div>
                            <button
                                onClick={handleGenerate}
                                className="w-full py-4 bg-sky-600 text-white font-bold rounded-2xl shadow-lg hover:bg-sky-700 transition-all flex items-center justify-center gap-2"
                            >
                                <QrCodeIcon />
                                {t('generateQR')}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in zoom-in duration-500 w-full flex flex-col items-center">
                            <div className="p-4 bg-white border-8 border-sky-50 rounded-3xl shadow-inner">
                                <QRCodeCanvas
                                    value={shareUrl}
                                    size={256}
                                    bgColor={"#ffffff"}
                                    fgColor={"#0c4a6e"}
                                    level={"H"}
                                    includeMargin={true}
                                />
                            </div>
                            <p className="text-slate-800 font-bold text-lg">{t('scanMe')}</p>
                            <p className="text-sm text-slate-400 max-w-xs mx-auto">Scan this code to access the verified patient profile.</p>
                            
                            <div className="flex gap-4 justify-center w-full">
                                <button onClick={handleCopyLink} className="text-sky-600 font-bold text-sm hover:underline">
                                    {copied ? 'Link Copied!' : 'Copy Link'}
                                </button>
                                <span className="text-slate-300">|</span>
                                <button onClick={() => setQrGenerated(false)} className="text-slate-500 font-bold text-sm hover:underline">
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareProfile;
