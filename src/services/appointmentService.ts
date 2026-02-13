import { db } from '../lib/firebase';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, orderBy, 
  getDocsFromCache, getDocsFromServer 
} from 'firebase/firestore';

export interface Appointment {
  id?: string;
  userId: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export const AppointmentService = {
  async addAppointment(data: Omit<Appointment, 'id' | 'createdAt'>) {
    const appointmentsRef = collection(db, 'appointments');
    const newAppointment = {
      ...data,
      createdAt: new Date().toISOString()
    };
    // addDoc updates local cache immediately
    const docRef = await addDoc(appointmentsRef, newAppointment);
    return { id: docRef.id, ...newAppointment } as Appointment;
  },

  async deleteAppointment(id: string) {
    const docRef = doc(db, 'appointments', id);
    await deleteDoc(docRef);
  },

  async updateAppointmentStatus(id: string, status: Appointment['status']) {
    const docRef = doc(db, 'appointments', id);
    await updateDoc(docRef, { status });
  },

  async getAppointments(userId: string): Promise<Appointment[]> {
    const appointmentsRef = collection(db, 'appointments');
    const q = query(appointmentsRef, where('userId', '==', userId));
    
    // Cache First
    try {
        const cacheSnapshot = await getDocsFromCache(q);
        if (!cacheSnapshot.empty) {
            return cacheSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
        }
    } catch (e) {}

    try {
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 8000)
        );

        const snapshot = await Promise.race([
            getDocs(q),
            timeoutPromise
        ]) as any;

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    } catch (e) {
        console.error("AppointmentService: Error fetching appointments", e);
        return [];
    }
  },

  subscribeToAppointments(userId: string, callback: (appointments: Appointment[]) => void) {
    const appointmentsRef = collection(db, 'appointments');
    const q = query(
      appointmentsRef, 
      where('userId', '==', userId),
      orderBy('date', 'asc')
    );
    
    // onSnapshot automatically provides cached data first if available, 
    // and then updates from the server. This is the fastest way.
    return onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const appointments: Appointment[] = [];
      snapshot.forEach((doc) => {
        appointments.push({ id: doc.id, ...doc.data() } as Appointment);
      });
      callback(appointments);
    }, (error) => {
        console.warn("Appointment Sync Error (missing index?):", error);
        // Fallback to unordered query
        const fallbackQ = query(appointmentsRef, where('userId', '==', userId));
        return onSnapshot(fallbackQ, (snapshot) => {
            const appointments: Appointment[] = [];
            snapshot.forEach((doc) => {
                appointments.push({ id: doc.id, ...doc.data() } as Appointment);
            });
            callback(appointments.sort((a, b) => a.date.localeCompare(b.date)));
        });
    });
  }
};
