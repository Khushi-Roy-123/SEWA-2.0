import { db } from '../lib/firebase';
import {
  doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, onSnapshot
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
  photoURL?: string; // Will store Base64 now
  faceDescriptor?: number[]; // Biometric data (128-d vector)
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

  // If navigator is offline, return a temporary fallback instead of hanging
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    console.warn("Generating offline SewaCode. Consistency not guaranteed.");
    return code;
  }

  const TIMEOUT_MS = 5000;

  while (!isUnique && attempts < 2) { // Reduced attempts for faster signup
    attempts++;
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('sewaCode', '==', code));

    try {
      console.log(`UserService: Checking SewaCode uniqueness (Attempt ${attempts})...`);
      // Use getDocs directly; Firestore handles its own retry/timeout logic
      // We only timeout if it's exceptionally long
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        isUnique = true;
        console.log(`UserService: SewaCode ${code} is unique.`);
      } else {
        console.warn(`UserService: SewaCode ${code} collision, retrying...`);
      }
    } catch (e) {
      console.warn(`UserService: SewaCode check attempt ${attempts} failed:`, e);
      // On network failure or timeout, we proceed with the current code to avoid blocking signup
      // 6 characters (36^6) is ~2 billion combinations, collisions are extremely rare
      isUnique = true;
    }
  }
  return code;
};

export const UserService = {
  // Create user profile
  async createUserProfile(uid: string, data: Partial<UserProfile>) {
    console.log(`UserService: Initiating profile creation for UID: ${uid}`);
    const userRef = doc(db, 'users', uid);

    try {
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
      console.log(`UserService: Profile successfully created for ${uid} with SewaCode: ${sewaCode}`);
    } catch (error) {
      console.error(`UserService: Profile creation failed for ${uid}`, error);
      throw error;
    }
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

  // Fetch all users with biometric data for matching
  async getAllUserBiometrics(): Promise<{ uid: string, faceDescriptor?: number[] }[]> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('faceDescriptor', '!=', null));

    try {
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        uid: doc.id,
        faceDescriptor: doc.data().faceDescriptor
      }));
    } catch (e) {
      console.error("UserService: Error fetching biometrics", e);
      return [];
    }
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
  },

  // Subscribe to user profile for real-time updates
  subscribeToUserProfile(uid: string, callback: (profile: UserProfile | null) => void) {
    const userRef = doc(db, 'users', uid);
    return onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as UserProfile);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error("UserService: Error subscribing to profile", error);
      callback(null);
    });
  }
};