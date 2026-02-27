import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Scan } from 'lucide-react';

import { getFaceDescriptor } from '../lib/faceRecognition';

interface FaceCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onCaptureWithDescriptor?: (imageDataUrl: string, descriptor: number[]) => void;
  onCancel?: () => void;
}

const FaceCapture: React.FC<FaceCaptureProps> = ({ onCapture, onCaptureWithDescriptor, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [faceBox, setFaceBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null);

  // New states for manual flow
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState<number[] | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setCapturedPhoto(null);
      setVerificationError(null);
      setCapturedDescriptor(null);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1024 },
          height: { ideal: 1024 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Camera access denied. Please enable camera permissions.");
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

  const captureImage = async () => {
    if (videoRef.current && canvasRef.current && !isCapturing) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        setIsCapturing(true);
        setVerificationError(null);

        // Resize canvas to a standard profile size to keep Firestore docs small
        const targetSize = 400;
        canvas.width = targetSize;
        canvas.height = targetSize;

        // Draw and scale the video frame to fit the target size
        context.translate(canvas.width, 0);
        context.scale(-1, 1);

        // Calculate crop to maintain aspect ratio and center the face
        const video = videoRef.current;
        const vWidth = video.videoWidth;
        const vHeight = video.videoHeight;
        const minDim = Math.min(vWidth, vHeight);
        const startX = (vWidth - minDim) / 2;
        const startY = (vHeight - minDim) / 2;

        context.drawImage(
          video,
          startX, startY, minDim, minDim, // Source
          0, 0, targetSize, targetSize    // Destination
        );

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setCapturedPhoto(dataUrl);

        // Stop the live stream to show preview
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }

        setIsVerifying(true);
        try {
          // VERIFY: Check if a face actually exists in the captured frame
          const descriptor = await getFaceDescriptor(canvas);

          if (descriptor) {
            setCapturedDescriptor(descriptor);
            setVerificationError(null);
          } else {
            setVerificationError("No face detected in this photo. Please try again with better lighting.");
          }
        } catch (e) {
          console.error("Verification failed:", e);
          setVerificationError("Verification system error. Please try again.");
        } finally {
          setIsVerifying(false);
          setIsCapturing(false);
        }
      }
    }
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      if (onCaptureWithDescriptor && capturedDescriptor) {
        onCaptureWithDescriptor(capturedPhoto, capturedDescriptor);
      } else {
        onCapture(capturedPhoto);
      }
    }
  };

  const handleRetake = () => {
    startCamera();
  };

  // Simplified Detection logic for real-time guidance ONLY
  useEffect(() => {
    if (!stream || !videoRef.current || capturedPhoto) return;

    let animationFrame: number;
    const detectFace = async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) {
        animationFrame = requestAnimationFrame(detectFace);
        return;
      }

      // We just use the simple skin-tone heuristic for the guidance box 
      // to keep it fast and low-resource while the camera is active.
      const scannerCanvas = document.createElement('canvas');
      const scannerCtx = scannerCanvas.getContext('2d', { willReadFrequently: true });

      if (scannerCtx) {
        scannerCanvas.width = 160;
        scannerCanvas.height = 120;
        scannerCtx.drawImage(videoRef.current, 0, 0, 160, 120);
        const imageData = scannerCtx.getImageData(48, 36, 64, 48).data;

        let skinPixels = 0;
        for (let i = 0; i < imageData.length; i += 4) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const isSkin = r > 95 && g > 40 && b > 20 && r > g && r > b && (r - g) > 15;
          if (isSkin) skinPixels++;
        }

        const hasFace = (skinPixels / (64 * 48)) > 0.25;
        setIsFaceDetected(hasFace);

        if (hasFace) {
          setFaceBox({
            x: videoRef.current!.videoWidth * 0.2,
            y: videoRef.current!.videoHeight * 0.15,
            width: videoRef.current!.videoWidth * 0.6,
            height: videoRef.current!.videoHeight * 0.7
          });
        } else {
          setFaceBox(null);
        }
      }
      animationFrame = requestAnimationFrame(detectFace);
    };

    detectFace();
    return () => cancelAnimationFrame(animationFrame);
  }, [stream, capturedPhoto]);

  // Draw Guidance Overlay
  useEffect(() => {
    if (!overlayRef.current || !videoRef.current || capturedPhoto) {
      if (overlayRef.current) {
        const ctx = overlayRef.current.getContext('2d');
        ctx?.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
      }
      return;
    }

    const video = videoRef.current;
    const canvas = overlayRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (faceBox) {
      ctx.strokeStyle = '#0ea5e9';
      ctx.lineWidth = 4;
      ctx.setLineDash([15, 10]);
      ctx.strokeRect(faceBox.x, faceBox.y, faceBox.width, faceBox.height);

      // Brackets
      ctx.setLineDash([]);
      const s = 40;
      ctx.lineWidth = 6;
      // TL
      ctx.beginPath(); ctx.moveTo(faceBox.x, faceBox.y + s); ctx.lineTo(faceBox.x, faceBox.y); ctx.lineTo(faceBox.x + s, faceBox.y); ctx.stroke();
      // TR
      ctx.beginPath(); ctx.moveTo(faceBox.x + faceBox.width - s, faceBox.y); ctx.lineTo(faceBox.x + faceBox.width, faceBox.y); ctx.lineTo(faceBox.x + faceBox.width, faceBox.y + s); ctx.stroke();
      // BL
      ctx.beginPath(); ctx.moveTo(faceBox.x, faceBox.y + faceBox.height - s); ctx.lineTo(faceBox.x, faceBox.y + faceBox.height); ctx.lineTo(faceBox.x + s, faceBox.y + faceBox.height); ctx.stroke();
      // BR
      ctx.beginPath(); ctx.moveTo(faceBox.x + faceBox.width - s, faceBox.y + faceBox.height); ctx.lineTo(faceBox.x + faceBox.width, faceBox.y + faceBox.height); ctx.lineTo(faceBox.x + faceBox.width, faceBox.y + faceBox.height - s); ctx.stroke();
    }
  }, [faceBox, capturedPhoto]);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-900 ring-1 ring-slate-200">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="text-red-500 mb-4" size={48} />
            <p className="text-sm text-white font-bold">{error}</p>
          </div>
        ) : capturedPhoto ? (
          <div className="absolute inset-0 w-full h-full bg-slate-800">
            <img src={capturedPhoto} alt="Review" className="w-full h-full object-cover" />
            {isVerifying && (
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                <RefreshCw className="animate-spin mb-4" size={48} />
                <p className="text-xs font-black uppercase tracking-widest">Verifying Face...</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            />
            <canvas
              ref={overlayRef}
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1] pointer-events-none"
            />
          </>
        )}

        {/* Status Indicators */}
        <div className="absolute top-6 inset-x-0 flex justify-center pointer-events-none">
          {verificationError ? (
            <div className="bg-red-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase flex items-center gap-2 shadow-lg">
              <AlertCircle size={14} /> {verificationError}
            </div>
          ) : capturedPhoto && !isVerifying && capturedDescriptor ? (
            <div className="bg-green-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase flex items-center gap-2 shadow-lg scale-110 transition-transform">
              <CheckCircle2 size={14} /> Face Verified Successfully
            </div>
          ) : null}
        </div>
      </div>

      <div className="w-full space-y-4">
        {capturedPhoto ? (
          <div className="flex gap-4 animate-in slide-in-from-bottom-4">
            <button
              onClick={handleRetake}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <RefreshCw size={20} />
              RETAKE
            </button>
            <button
              onClick={handleConfirm}
              disabled={isVerifying || !!verificationError}
              className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all active:scale-95 shadow-xl disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
            >
              <CheckCircle2 size={24} />
              {capturedDescriptor ? 'CONTINUE WITH THIS FACE' : 'CONFIRM PHOTO'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className={`p-4 rounded-2xl flex items-center justify-center gap-3 transition-colors ${isFaceDetected ? 'bg-sky-50 text-sky-600' : 'bg-slate-50 text-slate-400'}`}>
              {isFaceDetected ? <CheckCircle2 size={18} /> : <Scan size={18} className="animate-pulse" />}
              <span className="text-xs font-black uppercase tracking-widest">
                {isFaceDetected ? 'Face in Position' : 'Align Face in Square'}
              </span>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={captureImage}
                disabled={isCapturing}
                className="flex-1 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4"
              >
                <Camera size={28} />
                CAPTURE PHOTO
              </button>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-8 py-5 bg-slate-100 text-slate-500 rounded-[1.5rem] font-black hover:bg-slate-200 transition-all"
                >
                  CANCEL
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default FaceCapture;
