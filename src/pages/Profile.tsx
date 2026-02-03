
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserService } from '@/services/userService';
import { LogOut } from 'lucide-react';
import { LogIn } from 'lucide-react'; // Removing this since it's unused, assuming you meant LogOut

const Profile: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
      name: currentUser?.displayName || '',
      email: currentUser?.email || '',
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
  const [formData, setFormData] = useState(profileData);

  useEffect(() => {
    const fetchProfile = async () => {
        if (currentUser?.uid) {
            try {
                const data = await UserService.getUserProfile(currentUser.uid);
                if (data) {
                    setProfileData(prev => ({ ...prev, ...data }));
                    setFormData(prev => ({ ...prev, ...data }));
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            }
        }
    };
    fetchProfile();
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmergencyContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
          ...prev,
          emergencyContact: {
              ...prev.emergencyContact,
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

      // Check if changes were actually made
      if (JSON.stringify(formData) === JSON.stringify(profileData)) {
          setIsEditing(false);
          return;
      }

      try {
          await UserService.updateUserProfile(currentUser.uid, formData);
          setProfileData(formData);
          setIsEditing(false);
          alert("Profile updated successfully!");
      } catch (error) {
          console.error("Error updating profile:", error);
          alert("Failed to update profile.");
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

  const inputClasses = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500";
  const infoLabelClasses = "font-medium text-slate-800";
  const infoValueClasses = "text-slate-700";

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Profile & Settings</h1>
            <p className="mt-1 text-slate-500">Manage your personal information and preferences.</p>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                <img 
                    className="h-24 w-24 rounded-full object-cover border-2 border-sky-100" 
                    src="https://picsum.photos/200" 
                    alt="Profile" 
                />
                <div className="text-center md:text-left flex-grow">
                    {isEditing ? (
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={`${inputClasses} text-2xl font-bold`} />
                    ) : (
                        <h2 className="text-2xl font-bold text-slate-800">{profileData.name}</h2>
                    )}
                    {isEditing ? (
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={`${inputClasses} mt-2`} />
                    ) : (
                        <p className="text-slate-500">{profileData.email || 'No email provided'}</p>
                    )}
                </div>
                 <div className="flex gap-2">
                    {isEditing && (
                        <>
                            <button type="submit" className="bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2">
                                <span className="w-4 h-4">✓</span> Save Changes
                            </button>
                             <button type="button" onClick={handleCancel} className="bg-white border border-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-50 transition-colors">
                                Cancel
                            </button>
                        </>
                    )}
                    
                    {!isEditing && (
                        <button 
                            type="button" 
                            onClick={handleLogout} 
                            className="bg-red-50 text-red-600 font-semibold py-2 px-4 rounded-lg hover:bg-red-100 transition-colors shadow-sm flex items-center gap-2 border border-red-200"
                        >
                            <LogOut size={18} />
                            Log Out
                        </button>
                    )}
                </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-200 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <h3 className="font-semibold text-slate-600 uppercase text-xs tracking-widest">Medical ID Info</h3>
                    <div className="md:col-span-2 space-y-3 text-slate-800">
                        <div>
                            <span className={infoLabelClasses}>Blood Group: </span>
                            {isEditing ? <input type="text" name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} className={`${inputClasses} inline-block w-auto`} /> : <span className={infoValueClasses}>{profileData.bloodGroup}</span>}
                        </div>
                        <div>
                            <span className={infoLabelClasses}>Allergies: </span>
                            {isEditing ? <input type="text" name="allergies" value={formData.allergies} onChange={handleInputChange} className={inputClasses} /> : <span className={infoValueClasses}>{profileData.allergies}</span>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <h3 className="font-semibold text-slate-600 uppercase text-xs tracking-widest">Personal Info</h3>
                    <div className="md:col-span-2 space-y-3 text-slate-800">
                        <div>
                            <span className={infoLabelClasses}>Date of Birth: </span>
                            {isEditing ? <input type="text" name="dob" value={formData.dob} onChange={handleInputChange} className={`${inputClasses} inline-block w-auto`} /> : <span className={infoValueClasses}>{profileData.dob}</span>}
                        </div>
                         <div>
                            <span className={infoLabelClasses}>Phone: </span>
                            {isEditing ? <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className={`${inputClasses} inline-block w-auto`} /> : <span className={infoValueClasses}>{profileData.phone}</span>}
                        </div>
                        <div>
                            <span className={infoLabelClasses}>Address: </span>
                             {isEditing ? <input type="text" name="address" value={formData.address} onChange={handleInputChange} className={inputClasses} /> : <span className={infoValueClasses}>{profileData.address}</span>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <h3 className="font-semibold text-slate-600 uppercase text-xs tracking-widest">Emergency Contact</h3>
                    <div className="md:col-span-2 space-y-3 text-slate-800">
                         <div>
                            <span className={infoLabelClasses}>Name: </span>
                             {isEditing ? <input type="text" name="name" value={formData.emergencyContact.name} onChange={handleEmergencyContactChange} className={`${inputClasses} inline-block w-auto`} /> : <span className={infoValueClasses}>{profileData.emergencyContact.name}</span>}
                        </div>
                        <div>
                            <span className={infoLabelClasses}>Relationship: </span>
                            {isEditing ? <input type="text" name="relationship" value={formData.emergencyContact.relationship} onChange={handleEmergencyContactChange} className={`${inputClasses} inline-block w-auto`} /> : <span className={infoValueClasses}>{profileData.emergencyContact.relationship}</span>}
                        </div>
                        <div>
                            <span className={infoLabelClasses}>Phone: </span>
                            {isEditing ? <input type="tel" name="phone" value={formData.emergencyContact.phone} onChange={handleEmergencyContactChange} className={`${inputClasses} inline-block w-auto`} /> : <span className={infoValueClasses}>{profileData.emergencyContact.phone}</span>}
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>
  );
};

export default Profile;
