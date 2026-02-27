
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserService, UserProfile } from '@/services/userService';
import { LogOut, Loader2, Camera, User, Phone, MapPin, Droplets, AlertTriangle, Shield, Edit3, X, Check } from 'lucide-react';
import FaceCapture from '@/components/FaceCapture';

import { useData } from '@/contexts/DataContext';

const Profile: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const { userProfile: globalProfile, isPreloading } = useData();
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showFaceCapture, setShowFaceCapture] = useState(false);

    const [formData, setFormData] = useState<Partial<UserProfile>>({});

    useEffect(() => {
        if (globalProfile) {
            setFormData(globalProfile);
        }
    }, [globalProfile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEmergencyContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            emergencyContact: {
                name: '',
                relationship: '',
                phone: '',
                ...(prev.emergencyContact || {}),
                [name]: value,
            },
        }));
    };

    const handlePhotoRetaken = (dataUrl: string, descriptor?: number[]) => {
        setFormData(prev => ({
            ...prev,
            photoURL: dataUrl,
            faceDescriptor: descriptor || prev.faceDescriptor
        }));
        setShowFaceCapture(false);
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setFormData(globalProfile || {});
        setIsEditing(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.uid) return;

        setSaving(true);
        try {
            await UserService.updateUserProfile(currentUser.uid, formData);
            setIsEditing(false);
        } catch (error) {
            console.error("Profile Save Error:", error);
            alert("Failed to save changes. Please check your connection.");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const inputClasses = "mt-1 block w-full px-5 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-bold shadow-sm placeholder-slate-300 focus:outline-none focus:border-sky-500 focus:bg-white transition-all";
    const infoLabelClasses = "font-black text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1";

    if (isPreloading && !globalProfile) {
        return (
            <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-sky-600 mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Secure Profile</p>
            </div>
        );
    }

    const profile = isEditing ? formData : (globalProfile || {});

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20 animate-in fade-in duration-700">
            {/* Header section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-sky-600 p-2 rounded-xl shadow-lg shadow-sky-100">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Medical Identity</h1>
                    </div>
                    <p className="text-slate-500 text-sm font-bold ml-1">Secure biometric profile managed by SEWA-2.0</p>
                </div>

                <div className="flex gap-3">
                    {!isEditing ? (
                        <>
                            <button
                                onClick={handleEdit}
                                className="bg-slate-900 text-white font-black py-3 px-8 rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center gap-2"
                            >
                                <Edit3 size={18} />
                                EDIT PROFILE
                            </button>
                            <button
                                onClick={handleLogout}
                                className="bg-white border-2 border-slate-100 text-slate-400 font-black py-3 px-6 rounded-2xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all active:scale-95"
                            >
                                <LogOut size={18} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-emerald-600 text-white font-black py-3 px-8 rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check size={20} />}
                                SAVE CHANGES
                            </button>
                            <button
                                onClick={handleCancel}
                                className="bg-white border-2 border-slate-100 text-slate-500 font-black py-3 px-8 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <X size={20} />
                                CANCEL
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Profile Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Visual Identity Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-slate-50 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-sky-600 to-sky-400 opacity-10"></div>

                        <div className="relative flex flex-col items-center pt-4">
                            <div className="relative mb-6">
                                {profile.photoURL ? (
                                    <img
                                        className="h-48 w-48 rounded-[3.5rem] object-cover border-8 border-white shadow-2xl bg-sky-50 transition-transform duration-500 group-hover:scale-105"
                                        src={profile.photoURL}
                                        alt="Profile"
                                    />
                                ) : (
                                    <div className="h-48 w-48 rounded-[3.5rem] bg-sky-50 border-8 border-white shadow-2xl flex items-center justify-center animate-pulse">
                                        <User className="w-16 h-16 text-sky-200" />
                                    </div>
                                )}

                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={() => setShowFaceCapture(true)}
                                        className="absolute -bottom-2 -right-2 bg-sky-600 text-white p-4 rounded-[1.5rem] shadow-xl border-4 border-white hover:bg-sky-700 transition-all active:scale-90"
                                    >
                                        <Camera size={24} />
                                    </button>
                                )}
                            </div>

                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{profile.name || 'SEWA User'}</h2>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{profile.sewaCode || 'ID PENDING'}</p>
                                <div className="flex items-center justify-center gap-2 pt-2">
                                    <span className="bg-sky-50 text-sky-700 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{profile.gender || 'MALE'}</span>
                                    <span className="bg-rose-50 text-rose-700 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{profile.bloodGroup || '--'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Secure Fingerprint</p>
                            <p className="text-[9px] font-mono text-slate-300 break-all text-center leading-tight">
                                {profile.faceDescriptor ? profile.faceDescriptor.slice(0, 16).join('') + '...' : 'Biometric Hash Pending'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-sky-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-sky-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-sky-800 rounded-full opacity-50"></div>
                        <h3 className="text-lg font-black italic uppercase tracking-tighter mb-4 flex items-center gap-2 relative z-10">
                            <Shield size={20} className="text-sky-400" />
                            Data Security
                        </h3>
                        <p className="text-xs font-bold text-sky-200/80 leading-relaxed relative z-10">
                            Your biometric data and medical history are stored locally and encrypted. Only authorized medical staff with your unique SewaCode can access this information.
                        </p>
                    </div>
                </div>

                {/* Information Fields */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Primary Medical Data */}
                    <section className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-50">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-1.5 h-8 bg-sky-600 rounded-full"></div>
                            <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Clinical Record</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <label className={infoLabelClasses}>
                                    <Droplets size={12} className="text-rose-500" />
                                    Blood Group
                                </label>
                                {isEditing ? (
                                    <select name="bloodGroup" value={profile.bloodGroup || ''} onChange={handleInputChange} className={inputClasses}>
                                        <option value="">Select Type</option>
                                        <option value="A+">A Positive (A+)</option>
                                        <option value="A-">A Negative (A-)</option>
                                        <option value="B+">B Positive (B+)</option>
                                        <option value="B-">B Negative (B-)</option>
                                        <option value="AB+">AB Positive (AB+)</option>
                                        <option value="AB-">AB Negative (AB-)</option>
                                        <option value="O+">O Positive (O+)</option>
                                        <option value="O-">O Negative (O-)</option>
                                    </select>
                                ) : (
                                    <p className="text-lg font-black text-slate-700">{profile.bloodGroup || 'Not provided'}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className={infoLabelClasses}>
                                    <AlertTriangle size={12} className="text-amber-500" />
                                    Known Allergies
                                </label>
                                {isEditing ? (
                                    <input type="text" name="allergies" value={profile.allergies || ''} onChange={handleInputChange} className={inputClasses} placeholder="e.g. Penicillin, Peanuts" />
                                ) : (
                                    <p className="text-lg font-black text-slate-700">{profile.allergies || 'NONE RECORDED'}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className={infoLabelClasses}>Height (cm)</label>
                                {isEditing ? (
                                    <input type="number" name="height" value={profile.height || ''} onChange={handleInputChange} className={inputClasses} placeholder="175" />
                                ) : (
                                    <p className="text-lg font-black text-slate-700">{profile.height ? `${profile.height} cm` : '---'}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className={infoLabelClasses}>Weight (kg)</label>
                                {isEditing ? (
                                    <input type="number" name="weight" value={profile.weight || ''} onChange={handleInputChange} className={inputClasses} placeholder="70" />
                                ) : (
                                    <p className="text-lg font-black text-slate-700">{profile.weight ? `${profile.weight} kg` : '---'}</p>
                                )}
                            </div>

                            {!isEditing && profile.height && profile.weight && (
                                <div className="md:col-span-2 bg-sky-50 p-6 rounded-[2rem] border border-sky-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1">Body Mass Index (BMI)</p>
                                        <p className="text-2xl font-black text-sky-900 leading-none">
                                            {(profile.weight / ((profile.height / 100) ** 2)).toFixed(1)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1">Status</p>
                                        <p className="font-bold text-sky-800">
                                            {(() => {
                                                const bmi = profile.weight / ((profile.height / 100) ** 2);
                                                if (bmi < 18.5) return 'Underweight';
                                                if (bmi < 25) return 'Normal';
                                                if (bmi < 30) return 'Overweight';
                                                return 'Obese';
                                            })()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Personal Registry */}
                    <section className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-50">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-1.5 h-8 bg-emerald-500 rounded-full"></div>
                            <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Personal Registry</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <label className={infoLabelClasses}>Date of Birth</label>
                                {isEditing ? <input type="date" name="dob" value={profile.dob || ''} onChange={handleInputChange} className={inputClasses} /> : <p className="font-bold text-slate-700">{profile.dob || 'NOT SET'}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className={infoLabelClasses}>
                                    <Phone size={12} className="text-emerald-500" />
                                    Contact Phone
                                </label>
                                {isEditing ? <input type="tel" name="phone" value={profile.phone || ''} onChange={handleInputChange} className={inputClasses} /> : <p className="font-bold text-slate-700">{profile.phone || 'NOT SET'}</p>}
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className={infoLabelClasses}>
                                    <MapPin size={12} className="text-sky-500" />
                                    Registry Address
                                </label>
                                {isEditing ? <input type="text" name="address" value={profile.address || ''} onChange={handleInputChange} className={inputClasses} /> : <p className="font-bold text-slate-700 leading-relaxed">{profile.address || 'RESIDENTIAL ADDRESS NOT SET'}</p>}
                            </div>
                        </div>
                    </section>

                    {/* Emergency Protocol */}
                    <section className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-50 relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 p-4 opacity-5">
                            <AlertTriangle size={80} className="text-rose-500" />
                        </div>

                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-1.5 h-8 bg-rose-500 rounded-full"></div>
                            <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Emergency Protocol</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            <div className="space-y-1">
                                <label className={infoLabelClasses}>Primary Guardian Name</label>
                                {isEditing ? (
                                    <input type="text" name="name" value={profile.emergencyContact?.name || ''} onChange={handleEmergencyContactChange} className={inputClasses} placeholder="Contact Person Name" />
                                ) : (
                                    <p className="font-black text-slate-800 text-lg uppercase">{profile.emergencyContact?.name || 'Protocol Not Initiated'}</p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className={infoLabelClasses}>Relationship</label>
                                    {isEditing ? <input type="text" name="relationship" value={profile.emergencyContact?.relationship || ''} onChange={handleEmergencyContactChange} className={inputClasses} /> : <p className="font-bold text-slate-600">{profile.emergencyContact?.relationship || '---'}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className={infoLabelClasses}>Emergency No.</label>
                                    {isEditing ? <input type="tel" name="phone" value={profile.emergencyContact?.phone || ''} onChange={handleEmergencyContactChange} className={inputClasses} /> : <p className="font-bold text-sky-600">{profile.emergencyContact?.phone || '---'}</p>}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Photo Capture Modal */}
            {showFaceCapture && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] p-8 w-full max-w-2xl relative shadow-2xl">
                        <button
                            onClick={() => setShowFaceCapture(false)}
                            className="absolute top-6 right-6 p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all active:scale-90"
                        >
                            <X size={24} className="text-slate-500" />
                        </button>

                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-black text-slate-900 italic uppercase">Retake Identity Photo</h2>
                            <p className="text-slate-400 font-bold mt-2">Maintain medical accuracy with high-quality biometrics.</p>
                        </div>

                        <FaceCapture
                            onCaptureWithDescriptor={handlePhotoRetaken}
                            onCapture={(url) => handlePhotoRetaken(url)}
                            onCancel={() => setShowFaceCapture(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
