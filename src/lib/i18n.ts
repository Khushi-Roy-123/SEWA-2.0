
import React, { createContext, useContext, useState, useMemo } from 'react';

const translations = {
  en: {
    // Auth
    login: 'Login',
    signup: 'Sign Up',
    emailAddress: 'Email Address',
    password: 'Password',
    fullName: 'Full Name',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    rememberMe: 'Remember me',
    loginToYourAccount: 'Login to your account',
    dontHaveAccount: "Don't have an account?",
    createAnAccount: 'Create an account',
    alreadyHaveAccount: 'Already have an account?',
    validation_emailRequired: 'Email is required',
    validation_emailInvalid: 'Invalid email format',
    validation_passwordRequired: 'Password is required',
    validation_passwordLength: 'Password must be at least 6 characters',
    validation_nameRequired: 'Full name is required',
    validation_confirmPasswordRequired: 'Please confirm your password',
    validation_passwordsNoMatch: 'Passwords do not match',
    auth_loginSuccess: 'Login successful! Redirecting...',
    auth_loginError: 'Invalid credentials. Please try again.',
    auth_signupSuccess: 'Account created successfully! Please log in.',
    auth_signupError: 'An error occurred during sign up.',
    auth_resetPasswordEmailSent: 'Password reset email sent!',
    logout: 'Logout',
    language: 'Language',
    
    // Layout / Navigation
    dashboard: 'Dashboard',
    symptomChecker: 'Symptom Checker',
    appointments: 'Appointments',
    medications: 'Medications',
    records: 'Records',
    profile: 'Profile',
    vitalSigns: 'Vital Signs',
    mentalHealth: 'Mental Health',
    drugPrices: 'Drug Prices',
    healthAnalytics: 'Health Analytics',
    shareProfile: 'Share Profile',

    // Dashboard
    welcomeBack: 'Hello, {name}',
    healthSummaryToday: "Your health status today",
    upcomingAppointment: 'Next Appointment',
    appointmentTomorrow: 'Tomorrow at 10:30 AM',
    nextMedication: 'Next Medication',
    checkingMedications: 'Syncing...',
    addMedicationPrompt: 'Add medication',
    noMedicationsToday: 'All doses completed',
    dueAtTime: 'Due at {time}',
    quickActions: 'Services',
    symptomCheckerActionTitle: 'Check Symptoms',
    symptomCheckerActionDesc: 'AI-powered diagnostic assistance.',
    uploadRecordActionTitle: 'Upload record',
    uploadRecordActionDesc: 'Digitize your medical history.',
    monitorVitalsActionTitle: 'Live Monitor',
    monitorVitalsActionDesc: 'Real-time heart rate and SpO2 tracking.',
    status: 'Status',
    
    // Analytics
    analyticsTitle: 'AI Health Analytics',
    analyticsSubtitle: 'AI-driven insights based on your complete medical history and physical profile.',
    runAnalysis: 'Generate Health Report',
    analyzingHistory: 'Processing records...',
    healthIndexTrend: 'Health Index Trend',
    dietPlanTitle: 'AI Personalized Diet Plan',
    dietPlanSubtitle: 'Optimized for your weight, height, and age.',
    physicalProfile: 'Physical Profile',
    weight: 'Weight (kg)',
    height: 'Height (cm)',
    age: 'Age',
    saveProfile: 'Save Profile',
    noRecordsToAnalyze: 'Not enough records to perform analysis. Try uploading some medical documents first!',
    lastAnalysis: 'Last Analysis',
    analysisRecommendations: 'AI Recommendations',
    bloodGroup: 'Blood Group',
    allergies: 'Allergies',

    // Share
    shareTitle: 'Sewa Share',
    shareSubtitle: 'Generate a secure QR code to share your medical summary with doctors or emergency responders.',
    generateQR: 'Generate QR Code',
    scanMe: 'Scan to View Medical ID',
    medicalID: 'Verified Medical ID',
    emergencyAccessOnly: 'For medical professional use only.',

    // Symptom Checker & Recommendations
    describeSymptomsPrompt: 'Describe your symptoms for an accurate AI-powered analysis.',
    symptoms: 'Symptoms',
    symptomsPlaceholder: 'e.g., I have a persistent cough...',
    selectLanguage: 'Language',
    voiceInput: 'Voice',
    startRecording: 'Record',
    stopRecording: 'Stop',
    recording: 'Listening...',
    submitSymptoms: 'Analyze Symptoms',
    commonSymptoms: 'Common',
    headache: 'Headache',
    fever: 'Fever',
    cough: 'Cough',
    fatigue: 'Fatigue',
    nausea: 'Nausea',
    shortBreath: 'Shortness of breath',
    recommendationsTitle: 'Specialist Recommendations',
    recommendationsSubtitle: 'Suggested consultation paths.',
    loadingRecommendations: 'Processing symptoms...',
    errorRecommendations: 'Consultation failed. Try again.',
    reasonForRecommendation: 'Context',
    sampleDoctors: 'Specialists',
    bookAppointment: 'Book Visit',
    deepAnalysisTitle: "Deep Analysis",
    disclaimerTitle: "Disclaimer",
    disclaimerText: "AI provided information is not medical advice.",
    potentialConditions: "Possible Conditions",
    likelihood: "Likelihood",
    severity: "Severity",
    recommendedNextSteps: "Next Steps",
    questionsForDoctor: "Doctor Questions",
    sources: "Sources",
    severityUrgent: "URGENT",
    severityRoutine: "ROUTINE",
    severityMonitor: "MONITOR",
    getDeeperAnalysis: "Detailed Report",
    analyzing: "Analyzing...",

    // Records
    uploadRecordTitle: 'Upload Record',
    uploadRecordSubtitle: 'Digitize your medical documents.',
    uploadFromFile: 'Select File',
    useCamera: 'Open Camera',
    capture: 'Capture',
    closeCamera: 'Exit Camera',
    imagePreview: 'Preview',
    extractText: 'Run OCR',
    extractingText: 'Extracting...',
    extractionError: 'Scan failed.',
    extractedText: 'Extracted Content',
    analyzeAndTranslate: 'Analyze & Translate',
    
    analyzedRecordTitle: 'AI Analysis',
    analyzedRecordSubtitle: 'Summary of scanned document.',
    selectTranslationLanguage: 'Target Language',
    translationLoading: 'Translating...',
    translationError: 'Translation failed.',
    translatedText: 'Translation',
    originalText: 'Source',
    
    // Medications
    addMedication: 'Add Medication',
    editMedication: 'Edit Medication',
    medicationName: 'Medication Name',
    dosage: 'Dosage',
    active: 'Active',
    inactive: 'Inactive',
    reminderTimes: 'Schedules',
    addTime: 'Add Time',
    daysOfWeek: 'Days',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    notificationPermission: 'Enable alerts.',
    notificationsEnabled: 'Alerts Active',
    notificationsEnabledDesc: 'Reminders are on.',
    notificationsBlocked: 'Alerts Blocked',
    notificationsBlockedDesc: 'Check browser settings.',
    getMedicationReminders: 'Medication Alerts',
    getMedicationRemindersDesc: 'Get dosage notifications.',
    enableNotifications: 'Enable Alerts',
    
    // Drug Prices
    drugPricesTitle: 'Pharmacy Pricing',
    drugPricesSubtitle: 'Compare brand vs generic costs.',
    searchDrugPlaceholder: 'Search medication...',
    search: 'Search',
    searching: 'Syncing...',
    errorDrugPrices: 'Data unavailable.',
    brandNamePrice: 'Brand Cost',
    genericAlternatives: 'Generics',
    manufacturer: 'Maker',
    potentialSavings: 'Savings',
    
    // Vitals Monitor
    vitalsTitle: 'Live Monitor',
    vitalsSubtitle: 'Connected medical tracking.',
    statusDisconnected: 'Off',
    statusConnecting: 'Linking...',
    statusConnected: 'Active',
    statusError: 'Error',
    connectDevice: 'Pair Device',
    disconnectDevice: 'Unpair',
    heartRate: 'Heart Rate',
    bpm: 'BPM',
    bloodPressure: 'BP',
    oxygenSaturation: 'SpO2',
    sendEmergencyAlert: 'EMERGENCY ALERT',
    sendingAlert: 'Transmitting...',
    alertSent: 'SOS Sent',
    emergencyMessagePreview: 'Alert transmission:',
    alertGenerationError: 'SOS failure.',
    resetZoom: 'Reset',
    
    // Mental Health
    mentalHealthTitle: 'Mental Wellness',
    mentalHealthSubtitle: 'Emotional health tools.',
    moodTrackerTitle: "Daily Mood",
    moodRecorded: "Saved",
    yourMoodThisWeek: 'Weekly Trend',
    meditationTitle: "Meditation",
    meditationDesc: "Relaxation tools.",
    aiCompanionTitle: "AI Companion",
    aiCompanionPlaceholder: "Say something...",
    aiCompanionSend: "Send",
    aiCompanionTyping: 'Typing...',
    suggestMeditationAction: 'Start Session',
    moodStarterHappy: "Great! What made it so?",
    moodStarterGood: "Excellent. Highlights?",
    moodStarterNeutral: "Checking in. Thoughts?",
    moodStarterWorried: "I'm here. What's on your mind?",
    moodStarterSad: "Let's talk. I'm listening.",
    aiCompanionSystemInstruction: "Friendly AI wellness support.",
    myJournal: "Journal",
    journalPlaceholder: "Write your thoughts...",
    saveEntry: "Save",
    editEntry: "Edit",
    deleteEntry: "Delete",
    readMore: "More",
    readLess: "Less",
    deleteConfirmation: "Delete this?",
  },
  es: {
    // Parity mapping can be added here
  },
};

type Language = 'en' | 'es';

interface TranslationsContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof typeof translations.en, params?: Record<string, string | number>) => string;
}

const TranslationsContext = createContext<TranslationsContextType | undefined>(undefined);

export const TranslationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('en');

    const t = useMemo(() => (key: keyof typeof translations.en, params?: Record<string, string | number>): string => {
        let translation = (translations[language] as any)[key] || (translations.en as any)[key];
        if (!translation) return key;
        if (params) {
            Object.keys(params).forEach(paramKey => {
                translation = translation.replace(`{${paramKey}}`, String(params[paramKey]));
            });
        }
        return translation;
    }, [language]);

    const value = {
        language,
        setLanguage,
        t,
    };

    return React.createElement(TranslationsContext.Provider, { value }, children);
};

export const useTranslations = () => {
    const context = useContext(TranslationsContext);
    if (context === undefined) {
        throw new Error('useTranslations must be used within a TranslationsProvider');
    }
    return context;
};
