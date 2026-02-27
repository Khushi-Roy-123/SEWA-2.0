import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, QrCode, User, Shield, AlertCircle, Loader2 } from 'lucide-react';
import FaceCapture from '../components/FaceCapture';
import { UserService } from '../services/userService';
import { findMatchingUser } from '../lib/faceRecognition';
import { useTranslations } from '@/lib/i18n';

const PatientLookup: React.FC = () => {
    const { t } = useTranslations();
    const navigate = useNavigate();
    const [method, setMethod] = useState<'code' | 'face' | null>(null);
    const [sewaCode, setSewaCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCodeSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (sewaCode.length !== 6) return;

        setLoading(true);
        setError(null);
        try {
            const user = await UserService.getUserBySewaCode(sewaCode);
            if (user) {
                navigate(`/public-profile/${user.uid}`);
            } else {
                setError("Patient not found. Please check the Sewa Code.");
            }
        } catch (err) {
            setError("Search failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleFaceMatch = async (img: string, descriptor: number[]) => {
        setLoading(true);
        setError(null);
        try {
            const biometrics = await UserService.getAllUserBiometrics();
            const matchUid = findMatchingUser(descriptor, biometrics);

            if (matchUid) {
                navigate(`/public-profile/${matchUid}`);
            } else {
                setError("No matching biometric profile found in our secure database.");
                setMethod(null);
            }
        } catch (err) {
            setError("Biometric search failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <header className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 bg-sky-50 px-4 py-2 rounded-full border border-sky-100 mb-2">
                    <Shield className="text-sky-600" size={16} />
                    <span className="text-[10px] font-black text-sky-700 uppercase tracking-widest italic">Digital Identity Verification</span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">PATIENT LOOKUP</h1>
                <p className="text-slate-500 max-w-md mx-auto">Access secure medical records instantly using advanced biometric or code-based verification.</p>
            </header>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-700 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                    <Loader2 className="w-12 h-12 text-sky-600 animate-spin mb-4" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Verifying Identity against SEWA Core...</p>
                </div>
            ) : method === 'face' ? (
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-black text-slate-800">Biometric Scan</h2>
                        <button onClick={() => setMethod(null)} className="text-xs font-bold text-sky-600 hover:underline">Change Method</button>
                    </div>
                    <FaceCapture
                        onCapture={() => { }}
                        onCaptureWithDescriptor={handleFaceMatch}
                        onCancel={() => setMethod(null)}
                    />
                </div>
            ) : method === 'code' ? (
                <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm text-center">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-black text-slate-800">Enter Sewa Code</h2>
                        <button onClick={() => setMethod(null)} className="text-xs font-bold text-sky-600 hover:underline">Change Method</button>
                    </div>

                    <form onSubmit={handleCodeSearch} className="space-y-6 max-w-xs mx-auto">
                        <input
                            type="text"
                            maxLength={6}
                            value={sewaCode}
                            onChange={(e) => setSewaCode(e.target.value.toUpperCase())}
                            className="w-full text-4xl font-black tracking-[0.5em] text-center border-b-4 border-sky-100 focus:border-sky-600 outline-none p-4 font-mono uppercase transition-all"
                            placeholder="------"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={sewaCode.length !== 6}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl disabled:opacity-30 transition-all hover:bg-slate-800 active:scale-95"
                        >
                            INITIATE VERIFICATION
                        </button>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                        onClick={() => setMethod('face')}
                        className="group bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:border-sky-300 transition-all text-center space-y-6"
                    >
                        <div className="w-20 h-20 bg-sky-50 rounded-[2rem] flex items-center justify-center mx-auto text-sky-600 group-hover:scale-110 transition-transform">
                            <User size={40} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">Biometric Match</h3>
                            <p className="text-sm text-slate-500">Scan patient's face to find their profile instantly.</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setMethod('code')}
                        className="group bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:border-sky-300 transition-all text-center space-y-6"
                    >
                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-600 group-hover:scale-110 transition-transform">
                            <Search size={40} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">Sewa Code</h3>
                            <p className="text-sm text-slate-500">Search using the patient's unique 6-digit access code.</p>
                        </div>
                    </button>
                </div>
            )}

            <div className="bg-sky-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 bg-sky-800 rounded-full h-64 w-64 opacity-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                    <div className="p-6 bg-sky-800/50 rounded-3xl border border-sky-700/50">
                        <QrCode size={64} className="text-sky-300" />
                    </div>
                    <div className="space-y-2 flex-1">
                        <h3 className="text-2xl font-black italic tracking-tight uppercase">Emergency QR Ready</h3>
                        <p className="text-sky-200 text-sm leading-relaxed">Scanning a SEWA ID or QR code from a mobile device or physical card redirects here after one-tap authentication.</p>
                    </div>
                    <div className="hidden lg:block border-l border-sky-700/50 pl-8 space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-sky-400">Security Layer</p>
                        <p className="text-xs font-bold select-none opacity-40 leading-tight">256-BIT • AES • RSA<br />END-TO-END CLINICAL</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientLookup;
