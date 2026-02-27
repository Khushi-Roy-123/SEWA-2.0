import { db } from '../lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
  orderBy
} from 'firebase/firestore';

export interface MedicalRecord {
  id?: string;
  userId: string;
  patientName: string;
  type: 'prescription' | 'report' | 'lab';
  title: string;
  doctor: string;
  date: string;
  extractedText?: string;
  translatedText?: string;
  criticalPhrases?: string[];
  summary?: string;
  imageUrl?: string;
  createdAt: string;
}

export const RecordService = {
  // Add a new medical record to Firestore
  async addRecord(data: Omit<MedicalRecord, 'id' | 'createdAt'>) {
    const recordsRef = collection(db, 'records');
    const newRecord = {
      ...data,
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(recordsRef, newRecord);
    return { id: docRef.id, ...newRecord } as MedicalRecord;
  },

  // Get all records for a user from Firestore
  async getRecords(userId: string): Promise<MedicalRecord[]> {
    try {
      const recordsRef = collection(db, 'records');
      const q = query(recordsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const records: MedicalRecord[] = [];
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as MedicalRecord);
      });
      return records;
    } catch (e) {
      console.error("RecordService: Error fetching records", e);
      // Fallback to unordered if index is missing
      const recordsRef = collection(db, 'records');
      const q = query(recordsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const records: MedicalRecord[] = [];
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as MedicalRecord);
      });
      return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  },

  // Real-time subscription for records
  subscribeToRecords(userId: string, callback: (records: MedicalRecord[]) => void) {
    const recordsRef = collection(db, 'records');
    const q = query(recordsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));

    let unsubscribeFallback: (() => void) | null = null;
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: MedicalRecord[] = [];
      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as MedicalRecord);
      });
      callback(records);
    }, (error) => {
      console.warn("Record Sync Error (missing index?):", error);
      // Fallback
      const fallbackQ = query(recordsRef, where('userId', '==', userId));
      unsubscribeFallback = onSnapshot(fallbackQ, (snapshot) => {
        const records: MedicalRecord[] = [];
        snapshot.forEach((doc) => {
          records.push({ id: doc.id, ...doc.data() } as MedicalRecord);
        });
        callback(records.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      });
    });

    return () => {
      unsubscribe();
      if (unsubscribeFallback) unsubscribeFallback();
    };
  },

  // Get a single record by ID
  async getRecordById(recordId: string): Promise<MedicalRecord | null> {
    try {
      const docRef = doc(db, 'records', recordId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as MedicalRecord;
      }
      return null;
    } catch (e) {
      console.error("RecordService: Error getting record", e);
      return null;
    }
  },

  // Delete a record
  async deleteRecord(recordId: string) {
    try {
      const docRef = doc(db, 'records', recordId);
      await deleteDoc(docRef);
      return true;
    } catch (e) {
      console.error("RecordService: Error deleting record", e);
      return false;
    }
  }
};
