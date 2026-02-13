import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppointmentService, Appointment } from '../services/appointmentService';
import { PlusIcon, CalendarIcon, XIcon, TrashIcon } from '../components/Icons';
import { useData } from '@/contexts/DataContext';

const Appointments: React.FC = () => {
    const { currentUser } = useAuth();
    const { appointments, isPreloading } = useData();
    const [showModal, setShowModal] = useState(false);
    const [newApt, setNewApt] = useState({ doctor: '', specialty: '', date: '', time: '' });

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'Upcoming': return 'bg-sky-100 text-sky-800';
            case 'Completed': return 'bg-emerald-100 text-emerald-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleAddAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !newApt.doctor || !newApt.specialty || !newApt.date || !newApt.time) return;

        try {
            await AppointmentService.addAppointment({
                userId: currentUser.uid,
                doctor: newApt.doctor,
                specialty: newApt.specialty,
                date: newApt.date,
                time: newApt.time,
                status: 'Upcoming'
            });
            setShowModal(false);
            setNewApt({ doctor: '', specialty: '', date: '', time: '' });
        } catch (error) {
            console.error("Error adding appointment:", error);
            alert("Failed to add appointment.");
        }
    };

    const handleCancelAppointment = async (id: string) => {
        if (window.confirm("Are you sure you want to cancel this appointment?")) {
            try {
                await AppointmentService.updateAppointmentStatus(id, 'Cancelled');
            } catch (error) {
                console.error("Error cancelling appointment:", error);
            }
        }
    };

    const handleDeleteAppointment = async (id: string) => {
        if (window.confirm("Are you sure you want to permanently remove this appointment?")) {
            try {
                await AppointmentService.deleteAppointment(id);
            } catch (error) {
                console.error("Error deleting appointment:", error);
            }
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Appointments</h1>
                    <p className="text-slate-500">Manage your upcoming visits with healthcare providers.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-sky-600 text-white font-semibold py-2.5 px-6 rounded-xl shadow-md hover:bg-sky-700 transition-all transform active:scale-95"
                >
                    <PlusIcon />
                    <span>New Appointment</span>
                </button>
            </div>

            {isPreloading && appointments.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {appointments.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                            <div className="bg-slate-50 p-4 rounded-full mb-4">
                                <CalendarIcon />
                            </div>
                            <p className="font-medium">No appointments scheduled.</p>
                            <p className="text-sm mt-1">Add a new appointment to stay on track with your health visits.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Date & Time</th>
                                        <th className="p-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Provider</th>
                                        <th className="p-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Specialty</th>
                                        <th className="p-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="p-4 font-bold text-xs text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {appointments.map(apt => (
                                        <tr key={apt.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-semibold text-slate-800">{new Date(apt.date).toLocaleDateString()}</div>
                                                <div className="text-xs text-slate-500">{apt.time}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-slate-900">{apt.doctor}</div>
                                            </td>
                                            <td className="p-4 text-slate-600 text-sm">
                                                {apt.specialty}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusClass(apt.status)}`}>
                                                    {apt.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {apt.status === 'Upcoming' && (
                                                        <button 
                                                            onClick={() => handleCancelAppointment(apt.id!)}
                                                            className="text-amber-600 hover:text-amber-700 font-bold text-sm hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleDeleteAppointment(apt.id!)}
                                                        className="text-red-600 hover:text-red-700 font-bold text-sm hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                                        title="Delete Appointment"
                                                    >
                                                        <TrashIcon />
                                                        <span className="hidden sm:inline">Delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Appointment Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="bg-sky-600 p-6 flex justify-between items-center text-white">
                            <h2 className="text-xl font-bold">New Appointment</h2>
                            <button onClick={() => setShowModal(false)} className="hover:rotate-90 transition-transform"><XIcon /></button>
                        </div>
                        <form onSubmit={handleAddAppointment} className="p-8 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Doctor Name</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g., Dr. Sarah Wilson"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                                    value={newApt.doctor}
                                    onChange={e => setNewApt({...newApt, doctor: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Specialty</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g., Cardiology"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                                    value={newApt.specialty}
                                    onChange={e => setNewApt({...newApt, specialty: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date</label>
                                    <input 
                                        type="date" 
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                                        value={newApt.date}
                                        onChange={e => setNewApt({...newApt, date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Time</label>
                                    <input 
                                        type="time" 
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                                        value={newApt.time}
                                        onChange={e => setNewApt({...newApt, time: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 px-4 py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition-colors shadow-lg shadow-sky-200"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Appointments;