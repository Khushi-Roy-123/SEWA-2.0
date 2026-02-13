
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserService, UserProfile } from '@/services/userService';
import { LogOut, Loader2 } from 'lucide-react';

import { useData } from '@/contexts/DataContext';

const Profile: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const { userProfile: globalProfile, isPreloading } = useData();
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [profileData, setProfileData] = useState<Partial<UserProfile>>({
        name: currentUser?.displayName || '',
        email: currentUser?.email || '',
        gender: 'Male',
        dob: '',
        phone: '',
        address: '',
        bloodGroup: '',
        allergies: '',
        emergencyContact: {
            name: '',
            relationship: '',
            phone: '',
        },
    });
    const [formData, setFormData] = useState<Partial<UserProfile>>(profileData);

    useEffect(() => {
        if (globalProfile) {
            setProfileData(globalProfile);
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

  const handleEdit = () => {
      setFormData(profileData);
      setIsEditing(true);
  };

  const handleCancel = () => {
      setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser?.uid) return;

      setSaving(true);
      try {
          await UserService.updateUserProfile(currentUser.uid, formData);
          setProfileData(formData);
          setIsEditing(false);
          // Show a professional notification (alert for now, could be toast)
          alert("Profile updated successfully!");
      } catch (error) {
          console.error("Profile Save Error:", error);
          alert("Failed to save changes. We'll try again when you're online.");
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

  const getAvatarUrl = (gender?: string) => {
      // Use fixed seeds for a consistent gender-based avatar as requested
      if (gender === 'Female') return `https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&gender=female`;
      if (gender === 'Male') return `https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&gender=male`;
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=Felix`; // Default to male-ish if unknown
  };

  const inputClasses = "mt-1 block w-full px-5 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-bold shadow-sm placeholder-slate-300 focus:outline-none focus:border-sky-500 focus:bg-white transition-all";
  const infoLabelClasses = "font-black text-[10px] text-slate-400 uppercase tracking-widest";
  const infoValueClasses = "text-sm font-bold text-slate-800";

  if (isPreloading && !globalProfile) {
      return (
          <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
              <Loader2 className="w-10 h-10 animate-spin text-sky-600 mb-4" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Secure Profile</p>
          </div>
      );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Profile Management</h1>
                <p className="mt-1 text-slate-500 text-sm font-medium">Verify and update your digital medical identity.</p>
            </div>
            {!isEditing && (
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Verified Account</span>
                </div>
            )}
        </header>

        <form onSubmit={handleSave} className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 bg-sky-50 rounded-full h-64 w-64 opacity-50 blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="relative">
                    <img 
                        className="h-32 w-32 rounded-[2.5rem] object-cover border-4 border-white shadow-2xl bg-sky-100 p-1" 
                        src={getAvatarUrl(formData.gender)} 
                        alt="Profile" 
                    />
                    {!isEditing && (
                        <div className="absolute -bottom-2 -right-2 bg-sky-600 text-white p-2 rounded-2xl shadow-lg border-4 border-white">
                            <span className="text-[8px] font-black uppercase">Active</span>
                        </div>
                    )}
                </div>
                
                <div className="text-center md:text-left flex-grow">
                    {isEditing ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={infoLabelClasses}>Full Identity Name</label>
                                <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} className={inputClasses} placeholder="Full Name" />
                            </div>
                            <div>
                                <label className={infoLabelClasses}>Biological Gender</label>
                                <select name="gender" value={formData.gender || 'Male'} onChange={handleInputChange} className={inputClasses}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-slate-900 leading-none">{profileData.name}</h2>
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <span className="text-[10px] font-black bg-sky-100 text-sky-700 px-3 py-1 rounded-full uppercase tracking-widest">{profileData.gender || 'MALE'}</span>
                                <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-widest">{profileData.bloodGroup || 'O+'}</span>
                            </div>
                        </div>
                    )}
                    {!isEditing && (
                        <p className="text-slate-400 font-bold text-sm mt-3">{profileData.email}</p>
                    )}
                </div>

                 <div className="flex flex-col sm:flex-row gap-3">
                    {isEditing ? (
                        <>
                            <button 
                                type="submit" 
                                disabled={saving}
                                className="bg-slate-900 text-white font-black py-3 px-8 rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SAVE CHANGES'}
                            </button>
                             <button type="button" onClick={handleCancel} className="bg-white border-2 border-slate-100 text-slate-400 font-black py-3 px-8 rounded-2xl hover:bg-slate-50 transition-all active:scale-95">
                                CANCEL
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                type="button" 
                                onClick={handleEdit} 
                                className="bg-sky-600 text-white font-black py-3 px-8 rounded-2xl hover:bg-sky-700 transition-all shadow-lg shadow-sky-100 active:scale-95 flex items-center gap-2"
                            >
                                EDIT PROFILE
                            </button>
                            <button 
                                type="button" 
                                onClick={handleLogout} 
                                className="bg-slate-50 text-slate-400 font-black py-3 px-8 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
                            >
                                LOG OUT
                            </button>
                        </>
                    )}
                </div>
            </div>
            
            <div className="mt-12 pt-12 border-t border-slate-100 space-y-10 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div>
                        <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-sky-600 rounded-full"></div>
                            Clinical Identity
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold leading-relaxed">Critical medical identifiers used by emergency responders.</p>
                    </div>
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className={infoLabelClasses}>Blood Group Type</label>
                            {isEditing ? <input type="text" name="bloodGroup" value={formData.bloodGroup || ''} onChange={handleInputChange} className={inputClasses} /> : <p className={infoValueClasses}>{profileData.bloodGroup || 'Not specified'}</p>}
                        </div>
                        <div>
                            <label className={infoLabelClasses}>Known Medical Allergies</label>
                            {isEditing ? <input type="text" name="allergies" value={formData.allergies || ''} onChange={handleInputChange} className={inputClasses} /> : <p className={infoValueClasses}>{profileData.allergies || 'None recorded'}</p>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-10 border-t border-slate-50">
                    <div>
                        <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                            Personal Registry
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold leading-relaxed">Basic contact and demographic information.</p>
                    </div>
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className={infoLabelClasses}>Date of Birth</label>
                            {isEditing ? <input type="date" name="dob" value={formData.dob || ''} onChange={handleInputChange} className={inputClasses} /> : <p className={infoValueClasses}>{profileData.dob || 'Not set'}</p>}
                        </div>
                         <div>
                            <label className={infoLabelClasses}>Secure Phone</label>
                            {isEditing ? <input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} className={inputClasses} /> : <p className={infoValueClasses}>{profileData.phone || 'Not set'}</p>}
                        </div>
                        <div className="sm:col-span-2">
                            <label className={infoLabelClasses}>Residential Address</label>
                             {isEditing ? <input type="text" name="address" value={formData.address || ''} onChange={handleInputChange} className={inputClasses} /> : <p className={infoValueClasses}>{profileData.address || 'Not set'}</p>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-10 border-t border-slate-50">
                    <div>
                        <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                            Emergency Protocol
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold leading-relaxed">Who to contact in case of a medical crisis.</p>
                    </div>
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <div>
                            <label className={infoLabelClasses}>Contact Full Name</label>
                             {isEditing ? <input type="text" name="name" value={formData.emergencyContact?.name || ''} onChange={handleEmergencyContactChange} className={inputClasses} /> : <p className={infoValueClasses}>{profileData.emergencyContact?.name || 'Not set'}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={infoLabelClasses}>Relationship</label>
                                {isEditing ? <input type="text" name="relationship" value={formData.emergencyContact?.relationship || ''} onChange={handleEmergencyContactChange} className={inputClasses} /> : <p className={infoValueClasses}>{profileData.emergencyContact?.relationship || 'Not set'}</p>}
                            </div>
                            <div>
                                <label className={infoLabelClasses}>Contact Phone</label>
                                {isEditing ? <input type="tel" name="phone" value={formData.emergencyContact?.phone || ''} onChange={handleEmergencyContactChange} className={inputClasses} /> : <p className={infoValueClasses}>{profileData.emergencyContact?.phone || 'Not set'}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
        
        <div className="bg-sky-50 rounded-[2rem] p-8 border border-sky-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-2xl shadow-sm">
                    <svg className="w-6 h-6 text-sky-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L4 5v6.09c0 4.97 3.41 9.32 8 10.91 4.59-1.59 8-5.94 8-10.91V5l-8-3z"/>
                    </svg>
                </div>
                <div>
                    <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest leading-none mb-1">Bharat Digital Mission</p>
                    <p className="text-sm font-bold text-slate-700">Self-Reliant & Secure Data Infrastructure</p>
                </div>
            </div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Encrypted End-to-End</p>
        </div>
    </div>
  );
};

export default Profile;
