import { db } from '../lib/firebase';
import { 
  doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs
} from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  gender?: 'Male' | 'Female' | 'Other';
  sewaCode?: string;
  dob?: string;
  phone?: string;
  address?: string;
  bloodGroup?: string;
  allergies?: string;
  weight?: number;
  height?: number;
  age?: number;
  photoURL?: string;
  lastHealthReport?: any;
  lastAnalysisHash?: string;
  lastAnalysisLanguage?: string;
  lastAnalysisDate?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  createdAt: string;
}

const generateUniqueSewaCode = async (): Promise<string> => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let isUnique = false;
  let code = '';
  let attempts = 0;
  
  // Use a timeout to prevent infinite hanging on slow networks
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 10000)
  );

  while (!isUnique && attempts < 5) {
    attempts++;
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('sewaCode', '==', code));
    
    try {
        // Race the query against a timeout
        const querySnapshot = await Promise.race([
            getDocs(q),
            timeoutPromise
        ]) as any;
        
        if (querySnapshot.empty) {
            isUnique = true;
        }
    } catch (e) {
        console.warn("Retrying sewaCode generation due to network lag or timeout...");
        // If we timed out or errored, we continue the loop to try again or exit
        if (attempts >= 5) break;
    }
  }
  return code;
};

export const UserService = {
  // Create user profile
  async createUserProfile(uid: string, data: Partial<UserProfile>) {
    const userRef = doc(db, 'users', uid);
    const sewaCode = await generateUniqueSewaCode();
    const profile = {
      uid,
      email: data.email || '',
      name: data.name || 'User',
      sewaCode,
      createdAt: new Date().toISOString(),
      ...data
    };
    await setDoc(userRef, profile);
  },

  // Get user profile - Professional optimization for speed
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', uid);
    
    try {
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const userData = docSnap.data() as UserProfile;
        // Migration: ONLY generate sewaCode if missing entirely
        if (!userData.sewaCode) {
          const code = await generateUniqueSewaCode();
          await updateDoc(userRef, { sewaCode: code });
          userData.sewaCode = code;
        }
        return userData;
      }
    } catch (e: any) {
        console.error("UserService: Error fetching profile", e);
    }
    
    return null;
  },

  // Get profile by Sewa Code
  async getUserBySewaCode(code: string): Promise<UserProfile | null> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('sewaCode', '==', code.toUpperCase()));
    
    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].data() as UserProfile;
        }
    } catch (e) {
        console.error("UserService: Error searching by sewaCode", e);
    }
    return null;
  },

  // Update user profile
  async updateUserProfile(uid: string, data: Partial<UserProfile>) {
    const userRef = doc(db, 'users', uid);
    
    try {
        await setDoc(userRef, data, { merge: true });
    } catch (error: any) {
        console.error("Error updating profile:", error);
        throw error;
    }
  }
};