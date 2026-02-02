
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
      name: user?.name || '',
      email: user?.email || '',
      dob: user?.dob || '',
      phone: user?.phone || '',
      address: user?.address || '',
      bloodGroup: user?.bloodGroup || '',
      allergies: user?.allergies || '',
      profilePhoto: user?.profilePhoto || '',
      emergencyContact: {
          name: user?.emergencyContact?.name || '',
          relationship: user?.emergencyContact?.relationship || '',
          phone: user?.emergencyContact?.phone || '',
      },
  });
  const [formData, setFormData] = useState(profileData);

  useEffect(() => {
    // If we have a user update, sync it. 
    // Ideally, we'd also have an API to update the user profile on the backend when 'Save' is clicked.
    // For now, we initialize from AuthContext.
    if (user) {
        setProfileData({
            name: user.name,
            email: user.email,
            dob: user.dob || '',
            phone: user.phone || '',
            address: user.address || '',
            bloodGroup: user.bloodGroup || '',
            allergies: user.allergies || '',
            profilePhoto: user.profilePhoto || '',
            emergencyContact: {
                name: user.emergencyContact?.name || '',
                relationship: user.emergencyContact?.relationship || '',
                phone: user.emergencyContact?.phone || '',
            }
        });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // console.log(`Changing ${name} to ${value}`);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmergencyContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      // console.log(`Changing EC ${name} to ${value}`);
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
      
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) throw new Error("No token found");

        const response = await fetch('/api/user/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'auth-token': token
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Failed to update profile');
        }
        
        // Refetch/Sync user data with context if possible, or just update local state
        // Since useAuth doesn't expose a 'setUser', we might need to reload or update manually.
        // For now, let's update localStorage so AuthContext picks it up on refresh, 
        // OR better, assuming user stays on page, local state is sufficient but we should warn user.
        // Ideally, AuthContext should have an update function. 
        // Let's assume a page reload for full sync or just update local UI.
        
        // Update local storage to keep it in sync for next load
        const data = await response.json();
        localStorage.setItem('user-data', JSON.stringify(data.user)); // Key used in AuthContext
        
        setProfileData(formData);
        setIsEditing(false);
        alert("Profile updated successfully!");
        window.location.reload(); // Simple way to refresh context
      } catch (err) {
          console.error(err);
          alert("Error updating profile");
      }
  };

  // Ref for file input
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePhotoClick = () => {
    if (isEditing && fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 500 * 1024) { // 500KB limit
            alert("File size too large. Please select an image under 500KB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
             // console.log("File converted to Base64");
             setFormData(prev => ({ ...prev, profilePhoto: reader.result as string }));
        };
        reader.readAsDataURL(file);
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
                <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
                     <img 
                        className={`h-24 w-24 rounded-full object-cover border-2 border-sky-100 ${isEditing ? 'opacity-75 group-hover:opacity-100' : ''}`} 
                        src={(isEditing && formData.profilePhoto) ? formData.profilePhoto : (profileData.profilePhoto || "https://picsum.photos/200")} 
                        alt="Profile" 
                    />
                    {isEditing && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs text-white font-bold">Change</span>
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        className="hidden" 
                    />
                </div>
                <div className="text-center md:text-left flex-grow">
                    {isEditing ? (
                        <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} className={`${inputClasses} text-2xl font-bold`} />
                    ) : (
                        <h2 className="text-2xl font-bold text-slate-800">{profileData.name}</h2>
                    )}
                    {isEditing ? (
                         <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} className={`${inputClasses} mt-2`} />
                    ) : (
                        <p className="text-slate-500">{profileData.email}</p>
                    )}
                </div>
                 <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <button type="submit" className="bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-700 transition-colors">
                                Save
                            </button>
                             <button type="button" onClick={handleCancel} className="bg-slate-100 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors">
                                Cancel
                            </button>
                        </>
                    ) : (
                         <button type="button" onClick={handleEdit} className="bg-slate-100 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors">
                            Edit Profile
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
                            {isEditing ? <input type="text" name="bloodGroup" value={formData.bloodGroup || ''} onChange={handleInputChange} className={`${inputClasses} inline-block w-auto`} /> : <span className={infoValueClasses}>{profileData.bloodGroup}</span>}
                        </div>
                        <div>
                            <span className={infoLabelClasses}>Allergies: </span>
                            {isEditing ? <input type="text" name="allergies" value={formData.allergies || ''} onChange={handleInputChange} className={inputClasses} /> : <span className={infoValueClasses}>{profileData.allergies}</span>}
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
