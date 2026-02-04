import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
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
  imageUrl?: string;
  createdAt: string;
}

export const RecordService = {
  // Add a new medical record
  async addRecord(data: Omit<MedicalRecord, 'id' | 'createdAt'>) {
    try {
      const recordsRef = collection(db, 'records');
      const newRecord = {
        ...data,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(recordsRef, newRecord);
      return { id: docRef.id, ...newRecord };
    } catch (error) {
      console.error('Error adding record:', error);
      throw error;
    }
  },

  // Get all records for a specific user
  async getRecords(userId: string): Promise<MedicalRecord[]> {
    try {
      const recordsRef = collection(db, 'records');
      const q = query(
        recordsRef, 
        where('userId', '==', userId)
        // Note: You might need to create a composite index in Firestore for userId + createdAt to sort
        // orderBy('createdAt', 'desc') 
      );
      
      const querySnapshot = await getDocs(q);
      const records: MedicalRecord[] = [];
      
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as MedicalRecord);
      });
      
      // Sort by date manually if index is not ready
      return records.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (error) {
      console.error('Error getting records:', error);
      throw error;
    }
  },

  // Delete a record
  async deleteRecord(recordId: string) {
    try {
      const recordRef = doc(db, 'records', recordId);
      await deleteDoc(recordRef);
      return true;
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }
};
