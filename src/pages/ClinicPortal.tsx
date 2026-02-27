import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { QueueService, QueueEntry } from '../services/queueService';
import { UserService, UserProfile } from '../services/userService';
import { RecordService, MedicalRecord } from '../services/recordService';
import { StethoscopeIcon, UserIcon, ClockIcon, FileTextIcon, CameraIcon, ExclamationIcon, HeartbeatIcon, SparklesIcon } from '../components/Icons';

const ClinicPortal: React.FC = () => {
    const { currentUser } = useAuth();
    const [queue, setQueue] = useState<QueueEntry[]>([]);
    const [activePatient, setActivePatient] = useState<UserProfile | null>(null);
    const [activePatientRecords, setActivePatientRecords] = useState<MedicalRecord[]>([]);
    const [activeQueueEntry, setActiveQueueEntry] = useState<QueueEntry | null>(null);
    const [isLoadingPatient, setIsLoadingPatient] = useState(false);

    // Quick Check-in simulation
    const [sewaCodeCheckIn, setSewaCodeCheckIn] = useState('');
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [checkInError, setCheckInError] = useState('');

    useEffect(() => {
        if (!currentUser) return;

        // Subscribe to live queue for this "clinic" (the current user acting as a clinic)
        const unsubscribe = QueueService.subscribeToLiveQueue(currentUser.uid, (liveQueue) => {
            setQueue(liveQueue);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleSimulatedCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setCheckInError('');
        if (!currentUser || !sewaCodeCheckIn) return;

        setIsCheckingIn(true);
        try {
            // Find patient by code
            const patient = await UserService.getUserBySewaCode(sewaCodeCheckIn);
            if (!patient) throw new Error("Patient not found");

            // Add to live queue
            await QueueService.checkInPatient(
                currentUser.uid,
                patient.uid,
                patient.name || 'Unknown Patient',
                sewaCodeCheckIn
            );

            setSewaCodeCheckIn('');
        } catch (err: any) {
            setCheckInError(err.message || "Check-in failed");
        } finally {
            setIsCheckingIn(false);
        }
    };

    const handleSelectPatient = async (entry: QueueEntry) => {
        setActiveQueueEntry(entry);
        setIsLoadingPatient(true);
        setActivePatient(null);
        setActivePatientRecords([]);

        try {
            // Fetch live profile details
            await new Promise(resolve => {
                const unsub = UserService.subscribeToUserProfile(entry.patientId, (p) => {
                    setActivePatient(p);
                    unsub(); // Get just once for this view
                    resolve(true);
                });
            });

            // Fetch live medical records
            const records = await RecordService.getRecords(entry.patientId);
            setActivePatientRecords(records);

        } catch (err) {
            console.error("Failed to load patient data:", err);
        } finally {
            setIsLoadingPatient(false);
        }
    };

    const handleUpdateStatus = async (status: 'in-progress' | 'completed') => {
        if (!activeQueueEntry) return;
        await QueueService.updateQueueStatus(activeQueueEntry.id!, status);
        if (status === 'completed') {
            setActiveQueueEntry(null);
            setActivePatient(null);
            setActivePatientRecords([]);
        } else {
            setActiveQueueEntry({ ...activeQueueEntry, status });
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        if (status === 'waiting') return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><ClockIcon /> Waiting</span>;
        if (status === 'in-progress') return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><HeartbeatIcon /> Consulting</span>;
        return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest hidden md:inline">Done</span>;
    };

    return (
        <div className="flex flex-col h-[calc(100vh-5rem)] max-w-7xl mx-auto -m-6 sm:-m-8">
            {/* Header Area */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 shrink-0">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-sky-50 rounded-xl text-sky-600"><StethoscopeIcon /></div>
                        Live Clinic Operations
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Real-time queue management & instant record access.</p>
                </div>

                {/* Patient Check-in Simulation */}
                <form onSubmit={handleSimulatedCheckIn} className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Scan SEWA Code (e.g. A1B2)"
                        value={sewaCodeCheckIn}
                        maxLength={6}
                        onChange={e => setSewaCodeCheckIn(e.target.value.toUpperCase())}
                        className="px-4 py-2 border-2 border-slate-200 rounded-xl text-sm font-bold placeholder:font-medium focus:border-sky-500 focus:ring-0 outline-none w-48 sm:w-64"
                    />
                    <button
                        type="submit"
                        disabled={isCheckingIn || !sewaCodeCheckIn}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50 transition-colors"
                    >
                        Check-in
                    </button>
                </form>
            </div>

            {/* Split View Workspace */}
            <div className="flex flex-1 overflow-hidden bg-slate-50">

                {/* Left: Live Queue */}
                <div className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <span>Waiting List ({queue.filter(q => q.status === 'waiting').length})</span>
                        <div className="flex gap-1 items-center">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live Updates
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {queue.length === 0 ? (
                            <div className="text-center p-8 text-slate-400 font-medium text-sm">
                                No patients in queue.
                            </div>
                        ) : (
                            queue.map(entry => (
                                <button
                                    key={entry.id}
                                    onClick={() => handleSelectPatient(entry)}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${activeQueueEntry?.id === entry.id
                                            ? 'border-sky-500 bg-sky-50 shadow-sm'
                                            : 'border-slate-100 hover:border-slate-300 bg-white'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">{entry.patientName}</span>
                                            <span className="text-xs font-mono font-bold text-slate-400">{entry.sewaCode}</span>
                                        </div>
                                        <StatusBadge status={entry.status} />
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                                        <ClockIcon /> Arrived {new Date(entry.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Active Patient Console */}
                <div className="flex-1 relative overflow-hidden flex flex-col">
                    {!activeQueueEntry ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-4">
                            <UserIcon />
                            <p className="font-medium">Select a patient from the queue to start consulting.</p>
                        </div>
                    ) : isLoadingPatient ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-sky-100 border-t-sky-600 rounded-full animate-spin"></div>
                        </div>
                    ) : activePatient ? (
                        <div className="flex-1 overflow-y-auto">
                            {/* Patient Header Banner */}
                            <div className="bg-white border-b border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-sky-200">
                                        {activePatient.name?.charAt(0) || <UserIcon />}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900">{activePatient.name}</h2>
                                        <div className="flex flex-wrap items-center gap-3 mt-1">
                                            <span className="font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-xs font-bold tracking-widest">{activePatient.sewaCode}</span>
                                            {activePatient.bloodGroup && <span className="text-rose-600 font-black text-xs bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">{activePatient.bloodGroup}</span>}
                                            {activePatient.age && <span className="text-slate-500 text-xs font-bold">Age: {activePatient.age}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 w-full sm:w-auto">
                                    {activeQueueEntry.status === 'waiting' ? (
                                        <button
                                            onClick={() => handleUpdateStatus('in-progress')}
                                            className="flex-1 sm:flex-none px-6 py-2.5 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 shadow-md transition-all active:scale-95"
                                        >
                                            Begin Consult
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleUpdateStatus('completed')}
                                            className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-md transition-all active:scale-95"
                                        >
                                            Complete Consult
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 sm:p-8 space-y-8">
                                {/* AI Health Summary */}
                                {activePatient.lastHealthReport && (
                                    <div className="bg-sky-50 rounded-[2rem] p-6 sm:p-8 border border-sky-100 shadow-inner">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-black text-sky-900 uppercase tracking-widest flex items-center gap-2 text-xs">
                                                <SparklesIcon /> AI Patient Brief
                                            </h3>
                                            <span className="bg-white text-sky-700 font-black text-xs px-3 py-1 rounded-full shadow-sm">
                                                Score: {activePatient.lastHealthReport.healthScore}/100
                                            </span>
                                        </div>
                                        <p className="text-sky-800 leading-relaxed font-medium">{activePatient.lastHealthReport.summary}</p>
                                    </div>
                                )}

                                {/* Medical Vault Viewer */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-black text-slate-800">Medical Vault</h3>
                                        <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded-lg">{activePatientRecords.length} Documents</span>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {activePatientRecords.map(record => (
                                            <div key={record.id} className="bg-white border-2 border-slate-100 rounded-2xl p-5 flex gap-4 hover:border-sky-200 transition-colors group">
                                                <div className="w-20 h-20 shrink-0 bg-slate-50 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
                                                    {record.imageUrl?.startsWith('data:application/pdf') ? (
                                                        <div className="text-red-500 text-[10px] font-black tracking-widest uppercase flex flex-col items-center gap-1">
                                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                            PDF
                                                        </div>
                                                    ) : record.imageUrl ? (
                                                        <img src={record.imageUrl} alt="Document" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <FileTextIcon />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(record.date).toLocaleDateString()}</span>
                                                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase">{record.type}</span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-900 truncate text-sm">{record.title}</h4>
                                                    <p className="text-xs text-slate-500 truncate">{record.doctor}</p>
                                                    {record.imageUrl && (
                                                        <a
                                                            href={record.imageUrl}
                                                            download={record.title.replace(/\s+/g, '_') + (record.imageUrl.startsWith('data:application/pdf') ? '.pdf' : '.jpg')}
                                                            className="mt-2 text-[10px] font-black text-sky-600 uppercase hover:underline inline-flex self-start"
                                                        >
                                                            Download File
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {activePatientRecords.length === 0 && (
                                            <div className="col-span-full py-12 text-center text-slate-400 font-medium">
                                                No medical records stored in vault.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default ClinicPortal;
