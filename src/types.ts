export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: 'patient' | 'doctor';
}

export interface MedicalRecord {
  id: string;
  userId: string;
  title: string;
  date: string;
  type: 'Lab Report' | 'Prescription' | 'Imaging' | 'Other';
  fileUrl?: string; // If we implement storage later
  extractedText?: string;
  aiSummary?: string;
}

export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: string; 
  startDate: string;
  endDate?: string;
}

export interface EmergencyProfile {
  userId: string;
  fullName: string;
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface ConsentFlags {
  shareEmergencyProfile: boolean;
  shareDataWithResearch: boolean;
}
