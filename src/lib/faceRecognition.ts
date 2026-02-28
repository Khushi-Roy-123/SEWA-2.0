// @ts-ignore - face-api types are bundled but TS resolution can lag
import * as faceapi from '@vladmandic/face-api';

// Use jsDelivr CDN for reliable model loading (more stable than GitHub raw)
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

let modelsLoaded = false;

export const loadFaceModels = async () => {
    if (modelsLoaded) return;

    try {
        // Use TinyFaceDetector — faster and more reliable for webcam scenarios
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        modelsLoaded = true;
        console.log("Face Recognition Models Loaded (TinyFaceDetector)");
    } catch (error) {
        console.error("Failed to load face models:", error);
        // Fallback: try SSD MobileNet if Tiny fails
        try {
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);
            modelsLoaded = true;
            console.log("Face Recognition Models Loaded (SSD MobileNet fallback)");
        } catch (fallbackError) {
            console.error("All face model loading failed:", fallbackError);
        }
    }
};

// Determine which detector options to use based on what's loaded
const getDetectorOptions = () => {
    if (faceapi.nets.tinyFaceDetector.isLoaded) {
        return new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 });
    }
    return new faceapi.SsdMobilenetv1Options({ minConfidence: 0.7 });
};

export const getFaceDescriptor = async (imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<number[] | null> => {
    await loadFaceModels();

    const options = getDetectorOptions();

    // Use tiny landmarks if TinyFaceDetector is loaded, otherwise full
    let detection;
    if (faceapi.nets.tinyFaceDetector.isLoaded) {
        detection = await faceapi.detectSingleFace(imageElement, options)
            .withFaceLandmarks(true) // true = use tiny landmarks
            .withFaceDescriptor();
    } else {
        detection = await faceapi.detectSingleFace(imageElement, options)
            .withFaceLandmarks()
            .withFaceDescriptor();
    }

    if (!detection) return null;

    return Array.from(detection.descriptor);
};

// Detect ALL faces in a frame — returns array of {descriptor, box}
export const detectAllFaces = async (
    imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<{ descriptor: number[], box: { x: number, y: number, width: number, height: number } }[]> => {
    await loadFaceModels();

    const options = getDetectorOptions();

    let detections;
    if (faceapi.nets.tinyFaceDetector.isLoaded) {
        detections = await faceapi.detectAllFaces(imageElement, options)
            .withFaceLandmarks(true)
            .withFaceDescriptors();
    } else {
        detections = await faceapi.detectAllFaces(imageElement, options)
            .withFaceLandmarks()
            .withFaceDescriptors();
    }

    return detections.map((d: any) => ({
        descriptor: Array.from(d.descriptor) as number[],
        box: {
            x: d.detection.box.x,
            y: d.detection.box.y,
            width: d.detection.box.width,
            height: d.detection.box.height
        }
    }));
};

// Extract face descriptor from an uploaded image file (File/Blob)
export const getFaceDescriptorFromFile = (file: File): Promise<{ descriptor: number[] | null, dataUrl: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            const dataUrl = reader.result as string;
            const img = new Image();
            img.onload = async () => {
                try {
                    const descriptor = await getFaceDescriptor(img);
                    resolve({ descriptor, dataUrl });
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = dataUrl;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
};

export const findMatchingUser = (
    queryDescriptor: number[],
    users: { uid: string, faceDescriptor?: number[] }[],
    threshold = 0.7 // Balanced threshold — lower = stricter, higher = more lenient
): string | null => {
    let bestMatch = { uid: null as string | null, distance: 1.0 };

    for (const user of users) {
        if (!user.faceDescriptor) continue;

        // Euclidean distance between descriptors
        const distance = faceapi.euclideanDistance(queryDescriptor, user.faceDescriptor);

        if (distance < bestMatch.distance && distance < threshold) {
            bestMatch = { uid: user.uid, distance };
        }
    }

    return bestMatch.uid;
};
