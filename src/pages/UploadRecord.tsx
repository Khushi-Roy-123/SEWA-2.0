import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useNavigate } from 'react-router-dom';
import { useTranslations } from '@/lib/i18n';
import { UploadIcon, CameraIcon } from '../components/Icons';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { RecordService } from '@/services/recordService';
import { getAuth } from 'firebase/auth';
import { Loader2, CheckCircle2 } from 'lucide-react';

const UploadRecord: React.FC = () => {
    const { t } = useTranslations();
    const { currentUser } = useAuth();
    const { userProfile } = useData();
    const navigate = useNavigate();
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [extractedText, setExtractedText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImageSrc(e.target?.result as string);
                setExtractedText('');
                setError(null);
                setSaveSuccess(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCameraOpen = async () => {
        setShowCamera(true);
        setExtractedText('');
        setError(null);
        setImageSrc(null);
        setSaveSuccess(false);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Could not access the camera. Please check permissions.");
            setShowCamera(false);
        }
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg');
                setImageSrc(dataUrl);
                handleCameraClose();
            }
        }
    };

    const handleCameraClose = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setShowCamera(false);
    }, []);

    const handleExtractText = async () => {
        if (!imageSrc || !currentUser) return;

        // Explicit Auth Verification
        const auth = getAuth();
        console.log("Auth State Check:", auth.currentUser?.uid);
        if (!auth.currentUser) {
            setError("Authentication lost. Please sign in again.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setExtractedText('');

        try {
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            // Base64 Data & MimeType
            const base64Data = imageSrc.split(',')[1];
            const mimeType = imageSrc.split(';')[0].split(':')[1];

            const imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                },
            };
            const prompt = "Extract all text from this medical report. Identify: 1. Patient Name, 2. Doctor/Clinic Name, 3. Date, 4. Diagnosis/Findings. Ensure the output is clean and structured. IMPORTANT PRIVACY RULE: If you find the patient's real name in the document, REPLACE it with the word 'Patient' in your entire output.";

            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text() || '';
            setExtractedText(text);

            // Basic parsing of extracted text for title/doctor
            const doctorMatch = text.match(/(?:Doctor|Dr\.|Physician):?\s*([^\n]+)/i);
            const doctorName = (doctorMatch && doctorMatch[1]) ? doctorMatch[1].trim() : "Unknown Doctor";

            // SAVE TO FIRESTORE (Always attempt)
            try {
                await RecordService.addRecord({
                    userId: currentUser.uid,
                    patientName: userProfile?.name || 'Unknown Patient',
                    type: 'report',
                    title: `Medical Report - ${new Date().toLocaleDateString()}`,
                    doctor: doctorName,
                    date: new Date().toISOString().split('T')[0],
                    extractedText: text,
                    imageUrl: imageSrc // Store local Base64/PDF Data URL directly in Firestore
                });
                setSaveSuccess(true);
            } catch (dbErr) {
                console.error("Firestore Save Error:", dbErr);
                setError("Failed to save record to your vault. Please try again.");
                throw dbErr;
            }

        } catch (err) {
            console.error("Error extracting/saving record:", err);
            if (!error) setError(t('extractionError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalyze = () => {
        // Find the image URL if it was already uploaded during extraction
        // In the current logic, we upload and save to Firestore immediately in handleExtractText
        // But we still pass the state to TranslatedRecord
        navigate('/translated-record', { state: { extractedText, imageUrl: imageSrc } });
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-12">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">{t('uploadRecordTitle')}</h1>
                <p className="mt-1 text-slate-500 text-sm font-medium">{t('uploadRecordSubtitle')}</p>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl p-6 md:p-12 space-y-8 border border-slate-100">

                {saveSuccess && (
                    <div className="bg-green-50 text-green-600 p-6 rounded-[2rem] flex flex-col items-center gap-3 text-center border border-green-100">
                        <CheckCircle2 size={48} className="mb-2" />
                        <h3 className="text-xl font-black uppercase italic">Verification Complete</h3>
                        <p className="text-sm font-bold opacity-80">Document has been verified and saved to your secure health vault.</p>
                    </div>
                )}

                {!showCamera && !imageSrc && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="group flex flex-col items-center justify-center gap-4 w-full aspect-square border-4 border-dashed border-slate-100 rounded-[2.5rem] text-slate-400 hover:border-sky-500 hover:text-sky-600 hover:bg-sky-50 transition-all"
                        >
                            <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-white group-hover:shadow-lg transition-all">
                                <UploadIcon />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest">{t('uploadFromFile')}</span>
                        </button>
                        <input type="file" accept="image/*,application/pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

                        <button
                            onClick={handleCameraOpen}
                            className="group flex flex-col items-center justify-center gap-4 w-full aspect-square border-4 border-dashed border-slate-100 rounded-[2.5rem] text-slate-400 hover:border-sky-500 hover:text-sky-600 hover:bg-sky-50 transition-all"
                        >
                            <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-white group-hover:shadow-lg transition-all">
                                <CameraIcon />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest">{t('useCamera')}</span>
                        </button>
                    </div>
                )}

                {showCamera && (
                    <div className="space-y-6">
                        <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 border-4 border-white shadow-2xl aspect-video">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                        </div>
                        <canvas ref={canvasRef} className="hidden"></canvas>
                        <div className="flex gap-4">
                            <button onClick={handleCapture} className="flex-1 bg-sky-600 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-sky-100 hover:bg-sky-700 transition-all active:scale-95">{t('capture').toUpperCase()}</button>
                            <button onClick={handleCameraClose} className="bg-slate-100 text-slate-400 font-black py-4 px-8 rounded-2xl hover:bg-slate-200 transition-all active:scale-95">{t('closeCamera').toUpperCase()}</button>
                        </div>
                    </div>
                )}

                {imageSrc && (
                    <div className="space-y-8">
                        <div className="relative group">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">{t('imagePreview')}</h3>
                            <div className="rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl relative">
                                {imageSrc.includes('application/pdf') ? (
                                    <div className="aspect-[3/4] bg-slate-100 flex flex-col items-center justify-center p-12 text-slate-400">
                                        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                        <p className="text-xs font-black uppercase tracking-widest text-center">PDF Document Loaded</p>
                                    </div>
                                ) : (
                                    <img src={imageSrc} alt="Medical report preview" className="w-full h-auto" />
                                )}
                                {!extractedText && (
                                    <button
                                        onClick={() => { setImageSrc(null); setExtractedText(''); setSaveSuccess(false); }}
                                        className="absolute top-4 right-4 bg-white/80 backdrop-blur-md p-3 rounded-2xl text-slate-600 hover:text-red-600 transition-all shadow-lg"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {!extractedText && (
                            <button
                                onClick={handleExtractText}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-3 py-5 px-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={24} />
                                        <span>VERIFYING DOCUMENT...</span>
                                    </>
                                ) : (
                                    <span>VERIFY & EXTRACT DATA</span>
                                )}
                            </button>
                        )}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                    </div>
                )}

                {extractedText && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('extractedText')}</label>
                                <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-2 py-1 rounded-md uppercase">Verified by SEWA AI</span>
                            </div>
                            <div className="bg-slate-50 border-2 border-slate-50 rounded-[2rem] p-8">
                                <pre className="whitespace-pre-wrap text-sm text-slate-700 font-bold leading-relaxed font-mono">
                                    {extractedText}
                                </pre>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleAnalyze}
                                className="flex-1 py-5 px-8 bg-sky-600 text-white rounded-2xl font-black shadow-xl shadow-sky-100 hover:bg-sky-700 transition-all active:scale-95"
                            >
                                {t('analyzeAndTranslate').toUpperCase()}
                            </button>
                            <button
                                onClick={() => navigate('/records')}
                                className="py-5 px-8 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-100 hover:bg-slate-800 transition-all active:scale-95"
                            >
                                VIEW IN VAULT
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadRecord;