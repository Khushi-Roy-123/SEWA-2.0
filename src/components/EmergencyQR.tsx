import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../contexts/AuthContext';
import { UserService } from '@/services/userService';
import { ArrowLeft, Phone, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmergencyQR: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [qrUrl, setQrUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const generateQR = async () => {
            if (currentUser?.uid) {
                try {
                    const data = await UserService.getUserProfile(currentUser.uid);
                    if (data) {
                        setProfile(data);
                        
                        // Construct minimal emergency payload
                        const emergencyData = {
                            n: data.name,
                            b: data.bloodGroup || 'N/A',
                            a: data.allergies || 'None',
                            ec: {
                                n: data.emergencyContact?.name || 'N/A',
                                r: data.emergencyContact?.relationship || 'N/A',
                                p: data.emergencyContact?.phone || 'N/A'
                            }
                        };

                        const url = await QRCode.toDataURL(JSON.stringify(emergencyData), {
                            width: 300,
                            margin: 2,
                            color: {
                                dark: '#000000',
                                light: '#ffffff'
                            }
                        });
                        setQrUrl(url);
                    }
                } catch (err) {
                    console.error("Error generating QR", err);
                } finally {
                    setLoading(false);
                }
            }
        };

        generateQR();
    }, [currentUser]);

    if (loading) return <div className="flex justify-center items-center h-screen">Loading ID...</div>;

    if (!profile) return (
            <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
                <AlertCircle className="text-red-500 w-12 h-12 mb-4" />
                <h2 className="text-xl font-bold">Profile Not Found</h2>
                <p className="text-gray-600 mt-2">Please complete your profile first.</p>
                <button onClick={() => navigate('/profile')} className="mt-4 text-blue-600 font-semibold underline">Go to Profile</button>
            </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4">
            <div className="w-full max-w-md">
                <button onClick={() => navigate('/')} className="flex items-center text-slate-600 mb-6 hover:text-slate-900 transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Dashboard
                </button>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
                    <div className="bg-red-600 p-4 text-center">
                        <h1 className="text-white font-bold text-xl uppercase tracking-widest">Emergency Medical ID</h1>
                    </div>

                    <div className="p-8 flex flex-col items-center">
                        {qrUrl && (
                            <div className="bg-white p-2 rounded-xl border-4 border-slate-900 shadow-sm mb-6">
                                <img src={qrUrl} alt="Emergency QR Code" className="w-64 h-64" />
                            </div>
                        )}
                        
                        <p className="text-xs text-slate-400 font-mono mb-6 uppercase tracking-wider">Scan for Medical Info</p>

                        <div className="w-full space-y-4">
                            <div className="text-center pb-6 border-b border-slate-100">
                                <h2 className="text-2xl font-black text-slate-900">{profile.name}</h2>
                                <p className="text-slate-500 text-sm">Born: {profile.dob || 'N/A'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-2">
                                <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                                    <p className="text-xs font-bold text-red-400 uppercase">Blood Type</p>
                                    <p className="text-xl font-black text-red-700">{profile.bloodGroup || 'N/A'}</p>
                                </div>
                                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-center">
                                    <p className="text-xs font-bold text-amber-500 uppercase">Allergies</p>
                                    <p className="text-sm font-bold text-amber-800 line-clamp-2">{profile.allergies || 'None'}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-3">Emergency Contact</p>
                                <div className="flex items-center gap-4">
                                    <div className="bg-green-100 p-2 rounded-full text-green-700">
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{profile.emergencyContact?.name || 'Not set'}</p>
                                        <p className="text-sm text-slate-500">{profile.emergencyContact?.relationship} • {profile.emergencyContact?.phone}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                        <p className="text-xs text-slate-400">Powered by SEWA Health System</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmergencyQR;
