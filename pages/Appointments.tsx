import React, { useState } from 'react';
// import { appointments } from '../lib/data'; // Removed default data

const Appointments: React.FC = () => {
    const [appointments, setAppointments] = useState<any[]>([]); 
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        doctor: '',
        specialty: '',
        date: '',
        time: '',
        notes: ''
    });

    const token = localStorage.getItem('auth-token');

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/appointments', {
                headers: { 'auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setAppointments(data);
            }
        } catch (err) {
            console.error("Failed to fetch appointments", err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': token || ''
                },
                body: JSON.stringify(formData)
            });
            
            if (res.ok) {
                const newAppt = await res.json();
                setAppointments([...appointments, newAppt]);
                setShowModal(false);
                setFormData({ doctor: '', specialty: '', date: '', time: '', notes: '' });
            } else {
                alert("Failed to create appointment");
            }
        } catch (err) {
            console.error(err);
            alert("Error creating appointment");
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'Upcoming': return 'bg-sky-100 text-sky-800';
            case 'Completed': return 'bg-slate-100 text-slate-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900">Appointments</h1>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-sky-700 transition-colors"
                >
                    + New Appointment
                </button>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-900">New Appointment</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Doctor Name</label>
                                <input required type="text" name="doctor" value={formData.doctor} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" placeholder="Dr. Smith" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Specialty</label>
                                <input required type="text" name="specialty" value={formData.specialty} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" placeholder="Cardiology" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                    <input required type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                                    <input required type="time" name="time" value={formData.time} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-sky-600 text-white font-bold py-3 rounded-xl hover:bg-sky-700 transition-colors shadow-lg shadow-sky-200">
                                Confirm Appointment
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-lg overflow-hidden min-h-[300px]">
                {loading ? (
                    <div className="p-8 text-center text-slate-400 animate-pulse">Loading appointments...</div>
                ) : (
                    <ul className="divide-y divide-slate-200">
                        {appointments.length > 0 ? (
                            appointments.map(apt => (
                                <li key={apt._id || apt.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors group">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between">
                                        <div className="mb-4 sm:mb-0">
                                            <p className="text-lg font-bold text-slate-800 group-hover:text-sky-700 transition-colors">{apt.doctor}</p>
                                            <p className="text-sm text-slate-500 font-medium">{apt.specialty}</p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4 w-full sm:w-auto">
                                            <div className="text-right mr-4">
                                                 <p className="text-slate-800 font-bold">{apt.date}</p>
                                                 <p className="text-slate-500 text-sm">{apt.time}</p>
                                            </div>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusClass(apt.status)}`}>
                                                {apt.status}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="bg-slate-50 p-4 rounded-full mb-4">
                                    <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-slate-900 font-medium mb-1">No appointments yet</h3>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto">Click the button above to schedule your first appointment.</p>
                            </div>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Appointments;
