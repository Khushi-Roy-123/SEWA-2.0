import { db } from '../lib/firebase';
import { 
  collection, addDoc, getDocs, getDoc, doc, deleteDoc, query, where, orderBy, onSnapshot,
  getDocsFromCache, getDocsFromServer
} from 'firebase/firestore';

export interface MedicalRecord {
  id?: string;
  userId: string;
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
  // Add a new medical record
  async addRecord(data: Omit<MedicalRecord, 'id' | 'createdAt'>) {
    const recordsRef = collection(db, 'records');
    const newRecord = {
      ...data,
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(recordsRef, newRecord);
    return { id: docRef.id, ...newRecord } as MedicalRecord;
  },

  // Get all records - Professional speed optimization
  async getRecords(userId: string): Promise<MedicalRecord[]> {
    const recordsRef = collection(db, 'records');
    const q = query(
      recordsRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    // FASTEST PATH: Try cache first for instant UI response
    try {
        const cacheSnapshot = await getDocsFromCache(q);
        if (!cacheSnapshot.empty) {
            console.log("RecordService: Serving from cache (Instant)");
            return cacheSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MedicalRecord));
        }
    } catch (e) {
        // Silent fail for cache miss
    }

    // RELIABLE PATH: Use standard getDocs with a timeout race
    try {
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Network timeout')), 8000)
        );

        const snapshot = await Promise.race([
            getDocs(q),
            timeoutPromise
        ]) as any;

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MedicalRecord));
    } catch (e) {
        console.warn("RecordService: Network slow/fail, using fallback", e);
        // LAST RESORT: Try any available data even if not ordered
        try {
            const fallbackTimeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Fallback timeout')), 5000)
            );
            const fallbackQ = query(recordsRef, where('userId', '==', userId));
            const snapshot = await Promise.race([
                getDocs(fallbackQ),
                fallbackTimeout
            ]) as any;
            
            return snapshot.docs
                .map((doc: any) => ({ id: doc.id, ...doc.data() } as MedicalRecord))
                .sort((a: MedicalRecord, b: MedicalRecord) => b.createdAt.localeCompare(a.createdAt));
        } catch (err) {
            return [];
        }
    }
  },

  // Real-time subscription to records
  subscribeToRecords(userId: string, callback: (records: MedicalRecord[]) => void) {
    const recordsRef = collection(db, 'records');
    const q = query(
      recordsRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const records: MedicalRecord[] = [];
      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as MedicalRecord);
      });
      callback(records);
    }, (error) => {
      console.warn("Record Sync Error (missing index?):", error);
      const fallbackQ = query(recordsRef, where('userId', '==', userId));
      return onSnapshot(fallbackQ, (snapshot) => {
        const records: MedicalRecord[] = [];
        snapshot.forEach((doc) => {
          records.push({ id: doc.id, ...doc.data() } as MedicalRecord);
        });
        callback(records.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      });
    });
  },

  // Get a single record with all details
  async getRecordById(recordId: string): Promise<MedicalRecord | null> {
    const docRef = doc(db, 'records', recordId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as MedicalRecord;
    } else {
      return null;
    }
  },

  // Delete a record
  async deleteRecord(recordId: string) {
    const docRef = doc(db, 'records', recordId);
    await deleteDoc(docRef);
    return true;
  }
};
