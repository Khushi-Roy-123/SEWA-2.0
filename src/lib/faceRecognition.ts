import * as faceapi from 'https://esm.sh/@vladmandic/face-api';

const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

let modelsLoaded = false;

export const loadFaceModels = async () => {
    if (modelsLoaded) return;

    try {
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        modelsLoaded = true;
        console.log("Face Recognition Models Loaded");
    } catch (error) {
        console.error("Failed to load face models:", error);
    }
};

export const getFaceDescriptor = async (imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<number[] | null> => {
    await loadFaceModels();

    const detection = await faceapi.detectSingleFace(imageElement)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detection) return null;

    return Array.from(detection.descriptor);
};

export const findMatchingUser = (
    queryDescriptor: number[],
    users: { uid: string, faceDescriptor?: number[] }[],
    threshold = 0.6
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
