import React, { useState, useEffect } from 'react';
import { useTranslations } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { MedicationService, Medication } from '../services/medicationService';
import { XIcon, PillIcon, PlusIcon } from '../components/Icons';
import { useData } from '@/contexts/DataContext';

const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Medications: React.FC = () => {
    const { t } = useTranslations();
    const { currentUser } = useAuth();
    const { medications, isPreloading } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMed, setEditingMed] = useState<Medication | null>(null);
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

    useEffect(() => {
        const interval = setInterval(() => {
            if (Notification.permission !== notificationPermission) {
                setNotificationPermission(Notification.permission);
            }
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [notificationPermission]);

    // Notification Effect
    useEffect(() => {
        if (notificationPermission !== 'granted' || medications.length === 0) {
            return;
        }

        const checkReminders = () => {
            const now = new Date();
            const currentDay = now.toLocaleString('en-US', { weekday: 'long' });
            const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

            medications.forEach((med) => {
                if (med.status === 'Active' && med.days.includes(currentDay) && med.reminderTimes.includes(currentTime)) {
                    // Removed localStorage notification tracking
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.ready.then(registration => {
                            registration.showNotification(`Time for your medication: ${med.name}`, {
                                body: `Take ${med.dosage}. Tap to view your medications.`,
                                icon: '/pills.png',
                                tag: `med-${med.id}-${currentTime}`,
                                data: { url: '#/medications' }
                            });
                        });
                    }
                }
            });
        };
        
        checkReminders();
        const intervalId = setInterval(checkReminders, 60000);
        return () => clearInterval(intervalId);
    }, [medications, notificationPermission]);

    const handleSave = async (med: any) => {
        if (!currentUser) return;

        try {
            if (med.id) {
                const { id, ...updateData } = med;
                await MedicationService.updateMedication(id, updateData);
            } else {
                await MedicationService.addMedication({
                    ...med,
                    userId: currentUser.uid
                });
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving medication:", error);
            alert("Failed to save medication.");
        }
    };

    const handleDelete = async (medId: string) => {
        if (window.confirm('Are you sure you want to delete this medication?')) {
            try {
                await MedicationService.deleteMedication(medId);
                setIsModalOpen(false);
            } catch (error) {
                console.error("Error deleting medication:", error);
            }
        }
    };

    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{t('medications')}</h1>
                    <p className="text-slate-500">Track your prescriptions and get timely reminders.</p>
                </div>
                <button 
                    onClick={() => { setEditingMed(null); setIsModalOpen(true); }} 
                    className="flex items-center gap-2 bg-emerald-600 text-white font-semibold py-2.5 px-6 rounded-xl shadow-md hover:bg-emerald-700 transition-all transform active:scale-95"
                >
                    <PlusIcon />
                    <span>{t('addMedication')}</span>
                </button>
            </div>

            {/* Permission Banner */}
            {notificationPermission !== 'granted' && (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                             <span className="text-xl">🔔</span>
                        </div>
                        <div>
                            <p className="font-bold text-amber-900">{t('getMedicationReminders')}</p>
                            <p className="text-sm text-amber-700">Enable notifications to never miss a dose.</p>
                        </div>
                    </div>
                                <button 
                                    onClick={requestNotificationPermission} 
                                    className="bg-amber-200 hover:bg-amber-300 text-amber-800 font-bold py-2 px-4 rounded-xl transition-colors text-sm"
                                >
                                    {t('enableNotifications')}
                                </button>
                            </div>
                        )}
                    
                        {isPreloading && medications.length === 0 ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">                    {medications.map(med => (
                        <div 
                            key={med.id} 
                            onClick={() => { setEditingMed(med); setIsModalOpen(true); }} 
                            className={`bg-white rounded-2xl shadow-sm p-6 border-t-4 cursor-pointer hover:shadow-md transition-all group ${med.status === 'Active' ? 'border-emerald-500' : 'border-slate-300'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-slate-50 p-3 rounded-xl text-slate-400 group-hover:text-emerald-500 transition-colors">
                                    <PillIcon />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${med.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {med.status}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{med.name}</h3>
                                <p className="text-slate-500 font-medium">{med.dosage}</p>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-50 space-y-2">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="font-bold text-slate-400 uppercase">Times:</span>
                                    <span className="bg-slate-100 px-2 py-0.5 rounded-md font-bold">{med.reminderTimes.join(', ') || 'None'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="font-bold text-slate-400 uppercase">Days:</span>
                                    <span>{med.days.length === 7 ? 'Every day' : med.days.join(', ')}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {medications.length === 0 && (
                        <div className="col-span-full py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                            <PillIcon />
                            <p className="mt-4 font-medium">No medications found.</p>
                            <button onClick={() => { setEditingMed(null); setIsModalOpen(true); }} className="text-emerald-600 font-bold hover:underline mt-2">Add your first prescription</button>
                        </div>
                    )}
                </div>
            )}
            
            {isModalOpen && <MedicationModal med={editingMed} onSave={handleSave} onClose={() => setIsModalOpen(false)} onDelete={handleDelete} />}
        </div>
    );
};

const MedicationModal: React.FC<{ med: Medication | null; onSave: (med: any) => void; onClose: () => void; onDelete: (id: string) => void }> = ({ med, onSave, onClose, onDelete }) => {
    const { t } = useTranslations();
    const [formData, setFormData] = useState<any>(med || {
        name: '',
        dosage: '',
        status: 'Active',
        reminderTimes: [],
        days: WEEK_DAYS
    });
    const [newTime, setNewTime] = useState('');

    const handleTimeAdd = () => {
        if (newTime && !formData.reminderTimes.includes(newTime)) {
            setFormData({ ...formData, reminderTimes: [...formData.reminderTimes, newTime].sort() });
            setNewTime('');
        }
    };
    
    const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all";

    return (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
                <div className="bg-emerald-600 p-6 flex justify-between items-center text-white">
                    <h2 className="text-xl font-bold">{med ? t('editMedication') : t('addMedication')}</h2>
                    <button onClick={onClose} className="hover:rotate-90 transition-transform"><XIcon /></button>
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-8 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('medicationName')}</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className={inputClasses} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('dosage')}</label>
                            <input type="text" value={formData.dosage} onChange={e => setFormData({...formData, dosage: e.target.value})} placeholder="e.g., 10mg" className={inputClasses} />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('status')}</label>
                            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className={inputClasses}>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reminder Time</label>
                            <div className="flex gap-2">
                                <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className={inputClasses} />
                                <button type="button" onClick={handleTimeAdd} className="bg-emerald-50 text-emerald-600 px-4 rounded-xl font-bold">+</button>
                            </div>
                        </div>
                    </div>

                    {formData.reminderTimes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {formData.reminderTimes.map((time: string) => (
                                <span key={time} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2">
                                    {time}
                                    <button type="button" onClick={() => setFormData({...formData, reminderTimes: formData.reminderTimes.filter((t: string) => t !== time)})} className="text-slate-400 hover:text-red-500">&times;</button>
                                </span>
                            ))}
                        </div>
                    )}
                    
                    <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{t('daysOfWeek')}</label>
                         <div className="flex flex-wrap gap-2">
                             {WEEK_DAYS.map(day => (
                                 <button
                                     key={day}
                                     type="button"
                                     onClick={() => {
                                         const days = formData.days.includes(day) ? formData.days.filter((d: string) => d !== day) : [...formData.days, day];
                                         setFormData({ ...formData, days });
                                     }}
                                     className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all border ${formData.days.includes(day) ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                                 >
                                    {day.substring(0, 3)}
                                 </button>
                             ))}
                         </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                        {med ? (
                            <button type="button" onClick={() => handleDelete(med.id!)} className="text-red-500 font-bold hover:bg-red-50 px-4 py-2 rounded-xl transition-colors">
                                Delete
                            </button>
                        ) : <div></div>}
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">Save</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Medications;
