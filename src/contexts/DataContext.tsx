import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { MedicationService, Medication } from '../services/medicationService';
import { AppointmentService, Appointment } from '../services/appointmentService';
import { RecordService, MedicalRecord } from '../services/recordService';
import { UserService, UserProfile } from '../services/userService';

import { GoogleFitService, FitData } from '../services/googleFitService';

interface DataContextType {
  medications: Medication[];
  appointments: Appointment[];
  records: MedicalRecord[];
  userProfile: UserProfile | null;
  fitData: FitData | null;
  isPreloading: boolean;
  isFitLoading: boolean;
  refreshFitData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [fitData, setFitData] = useState<FitData | null>(null);
  const [isPreloading, setIsPreloading] = useState(false);
  const [isFitLoading, setIsFitLoading] = useState(false);

  const refreshFitData = async () => {
    const token = localStorage.getItem('google_fit_token');
    const expiry = localStorage.getItem('google_fit_token_expiry');
    const isExpired = expiry && new Date().getTime() > parseInt(expiry);

    if (token && !isExpired) {
        setIsFitLoading(true);
        try {
            const data = await GoogleFitService.fetchDailyMetrics(token);
            setFitData(data);
        } catch (error) {
            console.error("Error fetching Fit data", error);
            if (error instanceof Error && error.message.includes('401')) {
                localStorage.removeItem('google_fit_token');
            }
        } finally {
            setIsFitLoading(false);
        }
    } else {
        setFitData(null);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setMedications([]);
      setAppointments([]);
      setRecords([]);
      setUserProfile(null);
      setFitData(null);
      setIsPreloading(false);
      return;
    }

    setIsPreloading(true);

    // Track which initial data sets have arrived
    let medsLoaded = false;
    let aptsLoaded = false;
    let recordsLoaded = false;

    const checkPreloadingComplete = () => {
        if (medsLoaded && aptsLoaded && recordsLoaded) {
            setIsPreloading(false);
        }
    };

    // Initial fetch of profile and fit data - these are non-blocking for "preloading" 
    // but we still want them as soon as possible
    UserService.getUserProfile(currentUser.uid).then(profile => {
      if (profile) setUserProfile(profile);
    });
    
    refreshFitData();

    // Real-time subscriptions for instant updates across the app
    const unsubMeds = MedicationService.subscribeToMedications(currentUser.uid, (data) => {
      setMedications(data);
      if (!medsLoaded) {
          medsLoaded = true;
          checkPreloadingComplete();
      }
    });

    const unsubApts = AppointmentService.subscribeToAppointments(currentUser.uid, (data) => {
      setAppointments(data);
      if (!aptsLoaded) {
          aptsLoaded = true;
          checkPreloadingComplete();
      }
    });

    const unsubRecords = RecordService.subscribeToRecords(currentUser.uid, (data) => {
      setRecords(data);
      if (!recordsLoaded) {
          recordsLoaded = true;
          checkPreloadingComplete();
      }
    });

    // Fallback to ensure we don't get stuck in preloading if a subscription fails or is empty
    const preloadingTimeout = setTimeout(() => {
        setIsPreloading(false);
    }, 2000); // Max fallback timeout

    return () => {
      unsubMeds();
      unsubApts();
      unsubRecords();
      clearTimeout(preloadingTimeout);
    };
  }, [currentUser]);

  const value = {
    medications,
    appointments,
    records,
    userProfile,
    fitData,
    isPreloading,
    isFitLoading,
    refreshFitData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
