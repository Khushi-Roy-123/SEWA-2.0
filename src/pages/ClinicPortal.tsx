import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { QueueService, QueueEntry } from '../services/queueService';
import { UserService, UserProfile } from '../services/userService';
import { RecordService, MedicalRecord } from '../services/recordService';
import { StethoscopeIcon, UserIcon, ClockIcon, FileTextIcon, HeartbeatIcon, SparklesIcon, XIcon } from '../components/Icons';
import { Search, QrCode, User, Shield, AlertCircle, Loader2, Plus } from 'lucide-react';
import FaceCapture from '../components/FaceCapture';
import { findMatchingUser } from '../lib/faceRecognition';
import QRScanner from '../components/QRScanner';

const ClinicPortal: React.FC = () => {
    const { currentUser } = useAuth();
    const [queue, setQueue] = useState<QueueEntry[]>([]);
    const [activePatient, setActivePatient] = useState<UserProfile | null>(null);
    const [activePatientRecords, setActivePatientRecords] = useState<MedicalRecord[]>([]);
    const [activeQueueEntry, setActiveQueueEntry] = useState<QueueEntry | null>(null);
    const [isLoadingPatient, setIsLoadingPatient] = useState(false);

    // Check-in Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [checkInMethod, setCheckInMethod] = useState<'code' | 'face' | 'qr' | null>(null);
    const [sewaCodeCheckIn, setSewaCodeCheckIn] = useState('');
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [checkInError, setCheckInError] = useState('');

    useEffect(() => {
        if (!currentUser) return;

        // Subscribe to live queue for this "clinic"
        const unsubscribe = QueueService.subscribeToLiveQueue(currentUser.uid, (liveQueue) => {
            setQueue(liveQueue);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const performCheckIn = async (patientUid: string, code: string) => {
        setIsCheckingIn(true);
        setCheckInError('');
        try {
            const patient = await UserService.getUserProfile(patientUid);
            if (!patient) throw new Error("Patient not found in SEWA registry.");

            await QueueService.checkInPatient(
                currentUser!.uid,
                patientUid,
                patient.name || 'Unknown Patient',
                code
            );

            // Success
            setIsAddModalOpen(false);
            setCheckInMethod(null);
            setSewaCodeCheckIn('');
        } catch (err: any) {
            setCheckInError(err.message || "Failed to check in patient.");
        } finally {
            setIsCheckingIn(false);
        }
    };

    const handleManualCodeCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (sewaCodeCheckIn.length !== 6) return;
        setIsCheckingIn(true);
        setCheckInError('');
        try {
            const patient = await UserService.getUserBySewaCode(sewaCodeCheckIn);
            if (!patient) throw new Error("Invalid SEWA Code.");
            await performCheckIn(patient.uid, sewaCodeCheckIn);
        } catch (err: any) {
            setCheckInError(err.message || "Invalid SEWA Code.");
            setIsCheckingIn(false);
        }
    };

    const handleFaceMatch = async (img: string, descriptor: number[]) => {
        setIsCheckingIn(true);
        setCheckInError('');
        try {
            const biometrics = await UserService.getAllUserBiometrics();
            const matchUid = findMatchingUser(descriptor, biometrics);

            if (matchUid) {
                const patient = await UserService.getUserProfile(matchUid);
                await performCheckIn(matchUid, patient?.sewaCode || 'FACE-ID');
            } else {
                setCheckInError("No matching biometric profile found.");
            }
        } catch (err) {
            setCheckInError("Biometric search failed.");
        } finally {
            setIsCheckingIn(false);
        }
    };

    const handleQRScan = async (decodedText: string) => {
        setIsCheckingIn(true);
        setCheckInError('');
        try {
            let codeToLookup = decodedText.trim();

            // 1. Try parsing as JSON (e.g. {"sewaCode":"ABC123"})
            try {
                const json = JSON.parse(codeToLookup);
                if (json.sewaCode) codeToLookup = json.sewaCode;
                else if (json.code) codeToLookup = json.code;
                else if (json.uid) codeToLookup = json.uid;
            } catch (e) {
                // Not JSON – continue
            }

            // 2. Try parsing as URL (e.g. https://app.com/public-profile/userId123)
            if (codeToLookup.startsWith('http')) {
                try {
                    const url = new URL(codeToLookup);
                    const parts = url.pathname.split('/').filter(Boolean);
                    // Look for a public-profile/{uid} pattern
                    const profileIdx = parts.indexOf('public-profile');
                    if (profileIdx !== -1 && parts[profileIdx + 1]) {
                        const uid = parts[profileIdx + 1];
                        const patient = await UserService.getUserProfile(uid);
                        if (patient) {
                            await performCheckIn(uid, patient.sewaCode || uid);
                            return;
                        }
                    }
                    // Otherwise use the last path segment as a code
                    codeToLookup = parts[parts.length - 1] || codeToLookup;
                } catch (e) {
                    // Not a valid URL – continue with raw text
                }
            }

            // 3. Try direct SEWA code lookup (any length)
            const upperCode = codeToLookup.toUpperCase();
            const patient = await UserService.getUserBySewaCode(upperCode);
            if (patient) {
                await performCheckIn(patient.uid, upperCode);
                return;
            }

            // 4. Try as a 6-char substring if longer
            if (codeToLookup.length > 6) {
                const shortCode = codeToLookup.substring(0, 6).toUpperCase();
                const shortPatient = await UserService.getUserBySewaCode(shortCode);
                if (shortPatient) {
                    await performCheckIn(shortPatient.uid, shortCode);
                    return;
                }
            }

            setCheckInError(`QR code scanned: "${codeToLookup}" — No matching patient found in database.`);
        } catch (err) {
            setCheckInError("QR Scan failed. Please try again.");
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
        <div className="flex flex-col h-screen bg-slate-100">
            {/* Header Area */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 shrink-0">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-sky-50 rounded-xl text-sky-600"><StethoscopeIcon /></div>
                        Live Clinic Operations
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Real-time queue management & instant record access.</p>
                </div>

                <button
                    onClick={() => { setIsAddModalOpen(true); setCheckInMethod(null); setCheckInError(''); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-md active:scale-95"
                >
                    <Plus size={18} />
                    Check-in Patient
                </button>
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
                            <div className="w-16 h-16"><UserIcon /></div>
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
                                    <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-sky-200 shrink-0">
                                        {activePatient.name?.charAt(0) || <div className="w-8 h-8"><UserIcon /></div>}
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

                                <div className="flex gap-2 w-full sm:w-auto shrink-0">
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
                                                <div className="w-4 h-4"><SparklesIcon /></div> AI Patient Brief
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
                                                        <div className="w-8 h-8 text-slate-400"><FileTextIcon /></div>
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

            {/* Injection Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-black text-slate-900">Check-in Patient</h2>
                            <button onClick={() => { setIsAddModalOpen(false); setCheckInMethod(null); }} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors">
                                <XIcon />
                            </button>
                        </div>
                        <div className="p-8 pb-10 flex-1 overflow-y-auto">

                            {checkInError && (
                                <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-bold flex items-center gap-2 mb-6 border border-red-100">
                                    <AlertCircle size={18} /> {checkInError}
                                </div>
                            )}

                            {isCheckingIn ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 className="w-12 h-12 text-sky-600 animate-spin mb-4" />
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Verifying Patient...</p>
                                </div>
                            ) : checkInMethod === 'face' ? (
                                <div className="max-w-md mx-auto">
                                    <button onClick={() => setCheckInMethod(null)} className="text-sky-600 text-sm font-bold hover:underline mb-4">&larr; Back to methods</button>
                                    <FaceCapture
                                        onCapture={() => { }}
                                        onCaptureWithDescriptor={handleFaceMatch}
                                        onCancel={() => setCheckInMethod(null)}
                                    />
                                </div>
                            ) : checkInMethod === 'qr' ? (
                                <div className="max-w-md mx-auto">
                                    <button onClick={() => setCheckInMethod(null)} className="text-sky-600 text-sm font-bold hover:underline mb-4">&larr; Back to methods</button>
                                    <QRScanner onScanSuccess={handleQRScan} onClose={() => setCheckInMethod(null)} />
                                </div>
                            ) : checkInMethod === 'code' ? (
                                <div className="max-w-xs mx-auto text-center py-8">
                                    <button onClick={() => setCheckInMethod(null)} className="text-sky-600 text-sm font-bold hover:underline mb-8">&larr; Back to methods</button>
                                    <form onSubmit={handleManualCodeCheckIn} className="space-y-6">
                                        <input
                                            type="text"
                                            maxLength={6}
                                            value={sewaCodeCheckIn}
                                            onChange={(e) => setSewaCodeCheckIn(e.target.value.toUpperCase())}
                                            className="w-full text-4xl font-black tracking-[0.5em] text-center border-b-4 border-sky-100 focus:border-sky-600 outline-none p-4 font-mono uppercase transition-all"
                                            placeholder="------"
                                            autoFocus
                                        />
                                        <button
                                            type="submit"
                                            disabled={sewaCodeCheckIn.length !== 6}
                                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl disabled:opacity-30 transition-all hover:bg-slate-800 active:scale-95"
                                        >
                                            VERIFY & ADD
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <button onClick={() => setCheckInMethod('face')} className="group flex flex-col items-center gap-4 bg-white p-6 rounded-3xl border-2 border-slate-100 hover:border-sky-300 hover:bg-sky-50 shadow-sm transition-all text-center">
                                        <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <User size={32} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">Face Scan</h3>
                                            <p className="text-xs text-slate-500 mt-1">Instant biometric recognition</p>
                                        </div>
                                    </button>
                                    <button onClick={() => setCheckInMethod('qr')} className="group flex flex-col items-center gap-4 bg-white p-6 rounded-3xl border-2 border-slate-100 hover:border-sky-300 hover:bg-sky-50 shadow-sm transition-all text-center">
                                        <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <QrCode size={32} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">QR Code</h3>
                                            <p className="text-xs text-slate-500 mt-1">Scan physical or digital card</p>
                                        </div>
                                    </button>
                                    <button onClick={() => setCheckInMethod('code')} className="group flex flex-col items-center gap-4 bg-white p-6 rounded-3xl border-2 border-slate-100 hover:border-sky-300 hover:bg-sky-50 shadow-sm transition-all text-center">
                                        <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Search size={32} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">Sewa Code</h3>
                                            <p className="text-xs text-slate-500 mt-1">Manual 6-digit PIN entry</p>
                                        </div>
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClinicPortal;
