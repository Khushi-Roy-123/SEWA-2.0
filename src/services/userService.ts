import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  dob?: string;
  phone?: string;
  address?: string;
  bloodGroup?: string;
  allergies?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  createdAt: string;
}

export const UserService = {
  // Create user profile in Firestore
  async createUserProfile(uid: string, data: Partial<UserProfile>) {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      const newUser: UserProfile = {
        uid,
        email: data.email || '',
        name: data.name || 'User',
        createdAt: new Date().toISOString(),
        ...data
      };
      await setDoc(userRef, newUser);
    }
  },

  // Get user profile
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  },

  // Update user profile
  async updateUserProfile(uid: string, data: Partial<UserProfile>) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
  }
};
