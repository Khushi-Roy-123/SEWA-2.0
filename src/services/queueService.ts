import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    orderBy,
    updateDoc,
    doc,
    getDocs,
    limit
} from 'firebase/firestore';

export interface QueueEntry {
    id?: string;
    clinicId: string;
    patientId: string;
    patientName: string;
    sewaCode: string;
    status: 'waiting' | 'in-progress' | 'completed';
    checkInTime: string;
    notes?: string;
}

export const QueueService = {
    // 1. Patient checks in to a clinic
    async checkInPatient(clinicId: string, patientId: string, patientName: string, sewaCode: string) {
        const queueRef = collection(db, 'clinic_queues');

        // Check if already in queue to prevent duplicates
        const existingQ = query(
            queueRef,
            where('clinicId', '==', clinicId),
            where('patientId', '==', patientId),
            where('status', 'in', ['waiting', 'in-progress'])
        );
        const existingDocs = await getDocs(existingQ);

        if (!existingDocs.empty) {
            return existingDocs.docs[0].id; // Return existing waitlist ID
        }

        const newEntry = {
            clinicId,
            patientId,
            patientName,
            sewaCode,
            status: 'waiting',
            checkInTime: new Date().toISOString()
        };
        const docRef = await addDoc(queueRef, newEntry);
        return docRef.id;
    },

    // 2. Doctor updates status (e.g. from waiting to in-progress)
    async updateQueueStatus(queueId: string, status: 'waiting' | 'in-progress' | 'completed', notes?: string) {
        const queueRef = doc(db, 'clinic_queues', queueId);
        const updateData: any = { status };
        if (notes) updateData.notes = notes;
        await updateDoc(queueRef, updateData);
    },

    // 3. Real-time listener for the clinic's live dashboard
    subscribeToLiveQueue(clinicId: string, callback: (queue: QueueEntry[]) => void) {
        const queueRef = collection(db, 'clinic_queues');

        // Get all active patients (not completed) for this clinic
        const q = query(
            queueRef,
            where('clinicId', '==', clinicId),
            where('status', 'in', ['waiting', 'in-progress']),
            orderBy('checkInTime', 'asc')
        );

        return onSnapshot(q, (snapshot) => {
            const queue: QueueEntry[] = [];
            snapshot.forEach((doc) => {
                queue.push({ id: doc.id, ...doc.data() } as QueueEntry);
            });
            callback(queue);
        }, (error) => {
            console.error("Queue Sync Error:", error);

            // Fallback without orderBy if index is missing
            const fallbackQ = query(
                queueRef,
                where('clinicId', '==', clinicId),
                where('status', 'in', ['waiting', 'in-progress'])
            );

            onSnapshot(fallbackQ, (snapshot) => {
                const queue: QueueEntry[] = [];
                snapshot.forEach((doc) => {
                    queue.push({ id: doc.id, ...doc.data() } as QueueEntry);
                });
                // Sort manually since index failed
                callback(queue.sort((a, b) => a.checkInTime.localeCompare(b.checkInTime)));
            });
        });
    }
};
