
import React from 'react';
import { HeartbeatIcon, ExclamationIcon, PillIcon, FileTextIcon } from '../components/Icons';

const PublicProfile: React.FC = () => {
    // This page is reached by scanning the QR code
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
                    <img src="https://picsum.photos/200" className="w-20 h-20 rounded-2xl border-2 border-sky-400" />
                    <div>
                        <h1 className="text-2xl font-bold">Alex Doe</h1>
                        <p className="text-sky-300 text-sm font-medium">DOB: 01 Jan 1980 (44Y)</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-sky-800 p-3 rounded-2xl">
                        <p className="text-[10px] font-bold text-sky-400 uppercase tracking-tighter">Blood Type</p>
                        <p className="text-xl font-black">O Positive</p>
                    </div>
                    <div className="bg-sky-800 p-3 rounded-2xl">
                        <p className="text-[10px] font-bold text-sky-400 uppercase tracking-tighter">Emergency Contact</p>
                        <p className="text-sm font-bold">Jane Doe</p>
                        <p className="text-[10px] font-medium">+1 555-765-4321</p>
                    </div>
                </div>
            </header>

            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h2 className="flex items-center gap-2 text-red-600 font-bold mb-4 uppercase text-xs tracking-widest">
                    <ExclamationIcon />
                    Critical Alerts
                </h2>
                <div className="space-y-3">
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-800 font-medium">
                        Allergic to Penicillin - Extreme Sensitivity
                    </div>
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-800 font-medium">
                        Peanut Allergy
                    </div>
                </div>
            </section>

            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h2 className="flex items-center gap-2 text-slate-800 font-bold mb-4 uppercase text-xs tracking-widest">
                    <PillIcon />
                    Current Medications
                </h2>
                <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                        <span className="text-sm font-bold text-slate-700">Lisinopril</span>
                        <span className="text-xs text-slate-500 font-medium">10mg / Once Daily</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                        <span className="text-sm font-bold text-slate-700">Metformin</span>
                        <span className="text-xs text-slate-500 font-medium">500mg / Twice Daily</span>
                    </div>
                </div>
            </section>

            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h2 className="flex items-center gap-2 text-slate-800 font-bold mb-4 uppercase text-xs tracking-widest">
                    <FileTextIcon />
                    Recent Summary
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed italic">
                    "Patient has hypertension. Blood pressure monitored daily. Recent lab work shows stable creatinine levels."
                </p>
            </section>
            
            <footer className="text-center text-[10px] text-slate-400 pb-12">
                This data is provided by the Sewa Healthcare Platform. <br/> 
                Verification code: 8821-X992-SEWA
            </footer>
        </div>
    );
};

export default PublicProfile;
