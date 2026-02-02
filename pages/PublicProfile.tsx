import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HeartbeatIcon, ExclamationIcon, PillIcon, FileTextIcon, PhoneIcon } from '../components/Icons';

const PublicProfile: React.FC = () => {
    const [searchParams] = useSearchParams();
    const userId = searchParams.get('id'); // Changed from 'user' (name) to 'id'
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        // Fetch public profile from backend
        fetch(`${import.meta.env.VITE_API_BASE_URL}/user/public/${userId}`)
            .then(res => {
                if (!res.ok) throw new Error('User not found');
                return res.json();
            })
            .then(data => {
                setUserData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError('Profile not available');
                setLoading(false);
            });
    }, [userId]);

    if (!userId) return <div className="p-8 text-center">Invalid QR Code</div>;
    if (loading) return <div className="p-8 text-center">Loading Medical ID...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    // Use fetched data or defaults
    const { name, dob, bloodGroup, allergies, emergencyContact, profilePhoto } = userData;

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 p-4 space-y-6">
            <header className="bg-sky-900 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <HeartbeatIcon />
                        <span className="font-black text-sm uppercase tracking-widest">Sewa Verify</span>
                    </div>
                    <span className="bg-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Verified Patient</span>
                </div>
                
                <div className="flex gap-4 items-center mb-6">
                     <img 
                        src={profilePhoto || "https://picsum.photos/200"} 
                        className="w-20 h-20 rounded-2xl border-2 border-sky-400 object-cover bg-slate-200"
                        alt="Profile"
                    />
                    <div>
                        <h1 className="text-2xl font-bold">{name}</h1>
                        <p className="text-sky-300 text-sm font-medium">DOB: {dob || '--'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="flex-grow text-center md:text-left">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Medical ID</h2>
                        <h1 className="text-2xl font-bold">{userId?.slice(-6).toUpperCase()}</h1>
                    </div>
                     <div className="flex-grow text-center md:text-left">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Blood Type</h2>
                         <h1 className="text-2xl font-bold">{bloodGroup || '--'}</h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Emergency Contact</p>
                        <p className="text-sm font-bold text-slate-900">{emergencyContact?.name || '--'}</p>
                         <p className="text-xs text-slate-400">Relationship: {emergencyContact?.relationship || '--'}</p>
                        {emergencyContact?.phone ? (
                             <a href={`tel:${emergencyContact.phone}`} className="mt-2 inline-flex items-center gap-2 text-sky-600 font-bold text-sm hover:underline">
                                <PhoneIcon /> Call Emergency
                            </a>
                        ) : (
                            <span className="mt-2 inline-flex items-center gap-2 text-slate-400 font-bold text-sm cursor-not-allowed">
                                <PhoneIcon /> Call Emergency
                            </span>
                        )}
                       
                    </div>
                </div>
            </header>

            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h2 className="flex items-center gap-2 text-red-600 font-bold mb-4 uppercase text-xs tracking-widest">
                    <ExclamationIcon />
                    Critical Alerts / Allergies
                </h2>
                <div className="space-y-3">
                    {allergies ? (
                         <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-800 font-medium">
                            {allergies}
                        </div>
                    ) : (
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-400 font-medium italic">
                            No known allergies listed.
                        </div>
                    )}
                </div>
            </section>

             {/* Medications Section - Still empty/placeholder as it's not in User model yet */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h2 className="flex items-center gap-2 text-slate-800 font-bold mb-4 uppercase text-xs tracking-widest">
                    <PillIcon />
                    Current Medications
                </h2>
                 <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-400 font-medium italic">
                    No active medications recorded.
                </div>
            </section>
            
            <footer className="text-center text-[10px] text-slate-400 pb-12">
                This data is provided by the Sewa Healthcare Platform. <br/> 
                Verification code: {userId?.slice(0,8).toUpperCase()}-SEWA
            </footer>
        </div>
    );
};

export default PublicProfile;
