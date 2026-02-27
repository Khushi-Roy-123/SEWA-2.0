import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import { XIcon, CameraIcon } from './Icons';

interface QRScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose }) => {
    const webcamRef = useRef<Webcam>(null);
    const [hasCameraError, setHasCameraError] = useState(false);
    const isScanningRef = useRef(true);

    const captureAndScan = useCallback(() => {
        if (!isScanningRef.current) return;

        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, img.width, img.height);
                    const imageData = ctx.getImageData(0, 0, img.width, img.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert",
                    });

                    if (code && code.data) {
                        isScanningRef.current = false;
                        onScanSuccess(code.data);
                        return; // Stop looping on success
                    }
                }

                // Continue scanning if no code found
                if (isScanningRef.current) requestAnimationFrame(captureAndScan);
            };
            img.src = imageSrc;
        } else {
            // Keep trying if camera not ready yet
            if (isScanningRef.current) requestAnimationFrame(captureAndScan);
        }
    }, [onScanSuccess]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Downscale image if it is too large for jsQR to reliably process
                const MAX_DIMENSION = 800;
                let width = img.width;
                let height = img.height;

                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const imageData = ctx.getImageData(0, 0, width, height);

                    // attemptBoth improves detection on uploaded static images
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "attemptBoth",
                    });

                    if (code && code.data) {
                        isScanningRef.current = false;
                        onScanSuccess(code.data);
                    } else {
                        alert("No QR code found in the uploaded image. Please try another.");
                    }
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 bg-slate-900 flex justify-between items-center text-white">
                    <h3 className="font-bold">Scan Patient QR Code</h3>
                    <button onClick={() => { isScanningRef.current = false; onClose(); }} className="p-1 hover:bg-slate-800 rounded-full transition-colors">
                        <XIcon />
                    </button>
                </div>

                <div className="relative bg-black min-h-[300px] flex items-center justify-center">
                    {hasCameraError ? (
                        <div className="text-white text-center p-6 space-y-4">
                            <CameraIcon />
                            <p className="text-sm font-bold">Camera access denied.</p>
                            <p className="text-xs text-slate-400">Please upload an image instead.</p>
                        </div>
                    ) : (
                        <>
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{ facingMode: "environment" }}
                                onUserMedia={() => requestAnimationFrame(captureAndScan)}
                                onUserMediaError={() => setHasCameraError(true)}
                                className="w-full h-full object-cover"
                            />
                            {/* Scanning Overlay UI */}
                            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                                <div className="absolute inset-0 border-2 border-sky-500 rounded-lg">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-sky-400 -mt-2 -ml-2 rounded-tl-lg" />
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-sky-400 -mt-2 -mr-2 rounded-tr-lg" />
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-sky-400 -mb-2 -ml-2 rounded-bl-lg" />
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-sky-400 -mb-2 -mr-2 rounded-br-lg" />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="p-6 bg-slate-50 flex flex-col items-center gap-4">
                    <p className="text-center text-xs font-bold text-slate-500">
                        Position the QR code within the frame, or upload a photo from your gallery.
                    </p>

                    <div className="w-full relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-sky-100 text-sky-700 font-bold rounded-xl border border-sky-200 hover:bg-sky-200 transition-colors pointer-events-none">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            Upload QR Image
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRScanner;
