import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Video, VideoOff, Users, UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { detectAllFaces, findMatchingUser } from '../lib/faceRecognition';
import { UserService, UserProfile } from '../services/userService';
import { QueueService } from '../services/queueService';

interface RecognizedFace {
    uid: string | null;
    name: string;
    box: { x: number; y: number; width: number; height: number };
    photoURL?: string;
}

interface QueueToast {
    id: string;
    name: string;
    timestamp: number;
}

interface LiveFaceQueueProps {
    clinicId: string;
    onPatientAutoAdded?: (name: string) => void;
}

const LiveFaceQueue: React.FC<LiveFaceQueueProps> = ({ clinicId, onPatientAutoAdded }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [recognizedFaces, setRecognizedFaces] = useState<RecognizedFace[]>([]);
    const [toasts, setToasts] = useState<QueueToast[]>([]);
    const [scanCount, setScanCount] = useState(0);

    // Cache to avoid spamming queue — track recently added UIDs with timestamps
    const recentlyAddedRef = useRef<Map<string, number>>(new Map());
    const biometricsRef = useRef<{ uid: string; faceDescriptor?: number[] }[]>([]);
    const profileCacheRef = useRef<Map<string, UserProfile>>(new Map());
    const isRunningRef = useRef(false);

    const COOLDOWN_MS = 30_000; // 30 second cooldown per user

    // Load biometric data once
    useEffect(() => {
        const loadBiometrics = async () => {
            try {
                const biometrics = await UserService.getAllUserBiometrics();
                biometricsRef.current = biometrics;
                setIsModelLoading(false);
            } catch (err) {
                console.error('Failed to load biometrics:', err);
                setIsModelLoading(false);
            }
        };
        loadBiometrics();
    }, []);

    // Start camera
    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError(null);
        } catch (err) {
            console.error('Camera error:', err);
            setError('Camera access denied. Please enable camera permissions.');
        }
    }, []);

    useEffect(() => {
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [startCamera]);

    // Auto-dismiss toasts after 4s
    useEffect(() => {
        if (toasts.length === 0) return;
        const timer = setTimeout(() => {
            setToasts(prev => prev.filter(t => Date.now() - t.timestamp < 4000));
        }, 4000);
        return () => clearTimeout(timer);
    }, [toasts]);

    // Main scan loop
    useEffect(() => {
        if (!stream || !videoRef.current || isModelLoading) return;

        let animationId: number;
        let lastScanTime = 0;
        const SCAN_INTERVAL = 1500; // Scan every 1.5 seconds

        const scanLoop = async (timestamp: number) => {
            if (!videoRef.current || videoRef.current.readyState !== 4) {
                animationId = requestAnimationFrame(scanLoop);
                return;
            }

            if (timestamp - lastScanTime < SCAN_INTERVAL) {
                animationId = requestAnimationFrame(scanLoop);
                return;
            }

            if (isRunningRef.current) {
                animationId = requestAnimationFrame(scanLoop);
                return;
            }

            lastScanTime = timestamp;
            isRunningRef.current = true;

            try {
                const faces = await detectAllFaces(videoRef.current!);
                setScanCount(prev => prev + 1);

                const recognized: RecognizedFace[] = [];

                for (const face of faces) {
                    const matchUid = findMatchingUser(face.descriptor, biometricsRef.current);

                    if (matchUid) {
                        // Get or cache profile
                        let profile = profileCacheRef.current.get(matchUid);
                        if (!profile) {
                            profile = await UserService.getUserProfile(matchUid) || undefined;
                            if (profile) profileCacheRef.current.set(matchUid, profile);
                        }

                        recognized.push({
                            uid: matchUid,
                            name: profile?.name || 'Patient',
                            box: face.box,
                            photoURL: profile?.photoURL
                        });

                        // Auto-add to queue with cooldown check
                        const lastAdded = recentlyAddedRef.current.get(matchUid);
                        const now = Date.now();
                        if (!lastAdded || (now - lastAdded) > COOLDOWN_MS) {
                            recentlyAddedRef.current.set(matchUid, now);
                            try {
                                await QueueService.checkInPatient(
                                    clinicId,
                                    matchUid,
                                    profile?.name || 'Patient',
                                    profile?.sewaCode || 'FACE-ID'
                                );
                                // Show toast
                                setToasts(prev => [...prev, {
                                    id: `${matchUid}-${now}`,
                                    name: profile?.name || 'Patient',
                                    timestamp: now
                                }]);
                                onPatientAutoAdded?.(profile?.name || 'Patient');
                            } catch (e) {
                                // Queue already has them — silently ignore
                            }
                        }
                    } else {
                        recognized.push({
                            uid: null,
                            name: 'Unknown',
                            box: face.box
                        });
                    }
                }

                setRecognizedFaces(recognized);
            } catch (err) {
                console.error('Face scan error:', err);
            } finally {
                isRunningRef.current = false;
            }

            animationId = requestAnimationFrame(scanLoop);
        };

        animationId = requestAnimationFrame(scanLoop);
        return () => cancelAnimationFrame(animationId);
    }, [stream, isModelLoading, clinicId, onPatientAutoAdded]);

    // Draw overlay boxes with names
    useEffect(() => {
        if (!overlayCanvasRef.current || !videoRef.current) return;

        const video = videoRef.current;
        const canvas = overlayCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const face of recognizedFaces) {
            const isKnown = face.uid !== null;
            const color = isKnown ? '#10b981' : '#f59e0b';

            // Draw bounding box
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.strokeRect(face.box.x, face.box.y, face.box.width, face.box.height);

            // Bracket corners
            const s = 20;
            ctx.lineWidth = 5;
            ctx.strokeStyle = color;
            // TL
            ctx.beginPath(); ctx.moveTo(face.box.x, face.box.y + s); ctx.lineTo(face.box.x, face.box.y); ctx.lineTo(face.box.x + s, face.box.y); ctx.stroke();
            // TR
            ctx.beginPath(); ctx.moveTo(face.box.x + face.box.width - s, face.box.y); ctx.lineTo(face.box.x + face.box.width, face.box.y); ctx.lineTo(face.box.x + face.box.width, face.box.y + s); ctx.stroke();
            // BL
            ctx.beginPath(); ctx.moveTo(face.box.x, face.box.y + face.box.height - s); ctx.lineTo(face.box.x, face.box.y + face.box.height); ctx.lineTo(face.box.x + s, face.box.y + face.box.height); ctx.stroke();
            // BR
            ctx.beginPath(); ctx.moveTo(face.box.x + face.box.width - s, face.box.y + face.box.height); ctx.lineTo(face.box.x + face.box.width, face.box.y + face.box.height); ctx.lineTo(face.box.x + face.box.width, face.box.y + face.box.height - s); ctx.stroke();

            // Name label
            const label = isKnown ? face.name : 'Unknown Visitor';
            const fontSize = Math.max(14, face.box.width * 0.08);
            ctx.font = `900 ${fontSize}px system-ui, sans-serif`;
            const textWidth = ctx.measureText(label).width;

            // Label background
            const padding = 8;
            const labelY = face.box.y - fontSize - padding * 2;
            ctx.fillStyle = isKnown ? 'rgba(16, 185, 129, 0.9)' : 'rgba(245, 158, 11, 0.9)';
            ctx.beginPath();
            ctx.roundRect(face.box.x, labelY > 0 ? labelY : face.box.y, textWidth + padding * 2, fontSize + padding, 8);
            ctx.fill();

            // Label text
            ctx.fillStyle = '#fff';
            ctx.fillText(label, face.box.x + padding, (labelY > 0 ? labelY : face.box.y) + fontSize + padding / 2 - 2);
        }
    }, [recognizedFaces]);

    return (
        <div className="flex flex-col h-full relative">
            {/* Camera Feed */}
            <div className="flex-1 relative bg-slate-900 rounded-2xl overflow-hidden">
                {error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
                        <AlertCircle className="text-red-400" size={48} />
                        <p className="text-red-300 font-bold text-sm">{error}</p>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <canvas
                            ref={overlayCanvasRef}
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        />

                        {/* Models loading overlay */}
                        {isModelLoading && (
                            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                <Loader2 className="w-12 h-12 text-sky-400 animate-spin mb-4" />
                                <p className="text-[10px] font-black text-sky-300 uppercase tracking-[0.2em]">
                                    Loading Face Recognition Models...
                                </p>
                            </div>
                        )}

                        {/* Status Bar */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-20">
                            <div className="flex items-center gap-2 bg-slate-900/70 backdrop-blur-md text-white px-4 py-2 rounded-xl">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Live Camera</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-900/70 backdrop-blur-md text-white px-3 py-2 rounded-xl flex items-center gap-2">
                                    <Users size={14} />
                                    <span className="text-xs font-bold">{recognizedFaces.filter(f => f.uid).length} Recognized</span>
                                </div>
                                <div className="bg-slate-900/70 backdrop-blur-md text-slate-300 px-3 py-2 rounded-xl">
                                    <span className="text-[10px] font-mono">Scan #{scanCount}</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Auto-Queue Toasts */}
            <div className="absolute bottom-4 right-4 space-y-2 z-30 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className="bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-5 fade-in duration-300"
                    >
                        <UserPlus size={18} />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Auto Check-in</p>
                            <p className="font-bold text-sm">{toast.name}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LiveFaceQueue;
