import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, getDocs } from 'firebase/firestore';

export interface Medication {
  id?: string;
  userId: string;
  name: string;
  dosage: string;
  status: 'Active' | 'Inactive';
  reminderTimes: string[];
  days: string[];
  createdAt: string;
}

export const MedicationService = {
  async addMedication(data: Omit<Medication, 'id' | 'createdAt'>) {
    const medsRef = collection(db, 'medications');
    const newMed = {
      ...data,
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(medsRef, newMed);
    return { id: docRef.id, ...newMed } as Medication;
  },

  async updateMedication(id: string, data: Partial<Medication>) {
    const medRef = doc(db, 'medications', id);
    await updateDoc(medRef, data);
  },

  async deleteMedication(id: string) {
    const medRef = doc(db, 'medications', id);
    await deleteDoc(medRef);
  },

  subscribeToMedications(userId: string, callback: (meds: Medication[]) => void) {
    const medsRef = collection(db, 'medications');
    const q = query(medsRef, where('userId', '==', userId));
    
    return onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const meds: Medication[] = [];
      snapshot.forEach((doc) => {
        meds.push({ id: doc.id, ...doc.data() } as Medication);
      });
      callback(meds);
    });
  },

  async getMedications(userId: string): Promise<Medication[]> {
    return this.getMedicationsByUserId(userId);
  },

  async getMedicationsByUserId(userId: string): Promise<Medication[]> {
    const medsRef = collection(db, 'medications');
    const q = query(medsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const meds: Medication[] = [];
    querySnapshot.forEach((doc) => {
      meds.push({ id: doc.id, ...doc.data() } as Medication);
    });
    return meds;
  }
};