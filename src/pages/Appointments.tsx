import React, { useState } from 'react';
import { appointments } from '../lib/data';

const Appointments: React.FC = () => {
    const [appointmentList, setAppointmentList] = useState(appointments);
    const [showModal, setShowModal] = useState(false);
    const [newApt, setNewApt] = useState({ doctor: '', specialty: '', date: '', time: '' });

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'Upcoming': return 'bg-sky-100 text-sky-800';
            case 'Completed': return 'bg-slate-100 text-slate-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleAddAppointment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newApt.doctor || !newApt.specialty || !newApt.date || !newApt.time) return;

        const appointment = {
            id: appointmentList.length + 1,
            ...newApt,
            status: 'Upcoming'
        };

        setAppointmentList([appointment, ...appointmentList]);
        setShowModal(false);
        setNewApt({ doctor: '', specialty: '', date: '', time: '' });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900">Appointments</h1>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-sky-700 transition-colors"
                >
                    + New Appointment
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {appointmentList.length === 0 ? (
                    <p className="p-6 text-center text-slate-500">No appointments scheduled.</p>
                ) : (
                    <ul className="divide-y divide-slate-200">
                        {appointmentList.map(apt => (
                            <li key={apt.id} className="p-4 sm:p-6 hover:bg-slate-50">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between">
                                    <div className="mb-4 sm:mb-0">
                                        <p className="text-lg font-semibold text-slate-800">{apt.doctor}</p>
                                        <p className="text-sm text-slate-500">{apt.specialty}</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4 w-full sm:w-auto">
                                        <p className="text-slate-600 sm:text-right">{apt.date} at {apt.time}</p>
                                        <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${getStatusClass(apt.status)} mt-2 sm:mt-0`}>
                                            {apt.status}
                                        </span>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Simple Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Add New Appointment</h2>
                        <form onSubmit={handleAddAppointment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Doctor Name</label>
                                <input 
                                    type="text" 
                                    required
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 border p-2"
                                    value={newApt.doctor}
                                    onChange={e => setNewApt({...newApt, doctor: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Specialty</label>
                                <input 
                                    type="text" 
                                    required
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 border p-2"
                                    value={newApt.specialty}
                                    onChange={e => setNewApt({...newApt, specialty: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Date</label>
                                    <input 
                                        type="date" 
                                        required
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 border p-2"
                                        value={newApt.date}
                                        onChange={e => setNewApt({...newApt, date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Time</label>
                                    <input 
                                        type="time" 
                                        required
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 border p-2"
                                        value={newApt.time}
                                        onChange={e => setNewApt({...newApt, time: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700"
                                >
                                    Add Appointment
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
