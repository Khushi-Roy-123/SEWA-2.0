import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DataProvider, useData } from '@/contexts/DataContext';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Appointments from '@/pages/Appointments';
import Medications from '@/pages/Medications';
import Records from '@/pages/Records';
import Profile from '@/pages/Profile';
import SymptomInput from '@/pages/SymptomInput';
import Recommendations from '@/pages/Recommendations';
import UploadRecord from '@/pages/UploadRecord';
import TranslatedRecord from '@/pages/TranslatedRecord';
import MentalHealth from '@/pages/MentalHealth';
import DrugPrices from '@/pages/DrugPrices';
import Analytics from '@/pages/Analytics';
import ClinicPortal from '@/pages/ClinicPortal';
import ShareProfile from '@/pages/ShareProfile';
import PublicProfile from '@/pages/PublicProfile';
import PatientLookup from '@/pages/PatientLookup';
import EmergencyServices from '@/pages/EmergencyServices';
import GoogleFitCallback from '@/pages/GoogleFitCallback';
import { Loader2 } from 'lucide-react';
import { SpeedInsights } from "@vercel/speed-insights/react";

// Professional Error Boundary for the whole app
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("App Error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
          <h1 className="text-2xl font-black text-slate-900 mb-2">Something went wrong</h1>
          <p className="text-slate-500 mb-6">We encountered an unexpected error. Please try refreshing the page.</p>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-sky-600 text-white font-black rounded-2xl shadow-lg">Refresh App</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-sky-600" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Authenticating Secure Session</p>
        </div>
      </div>
    );
  }

  return currentUser ? <ErrorBoundary>{children}</ErrorBoundary> : <Navigate to="/login" />;
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/public-profile/:userId" element={<PublicProfile />} />

        <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
        <Route path="/appointments" element={<PrivateRoute><Layout><Appointments /></Layout></PrivateRoute>} />
        <Route path="/medications" element={<PrivateRoute><Layout><Medications /></Layout></PrivateRoute>} />
        <Route path="/records" element={<PrivateRoute><Layout><Records /></Layout></PrivateRoute>} />
        <Route path="/emergency-services" element={<PrivateRoute><Layout><EmergencyServices /></Layout></PrivateRoute>} />
        <Route path="/upload-record" element={<PrivateRoute><Layout><UploadRecord /></Layout></PrivateRoute>} />
        <Route path="/translated-record" element={<PrivateRoute><Layout><TranslatedRecord /></Layout></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
        <Route path="/symptoms" element={<PrivateRoute><Layout><SymptomInput /></Layout></PrivateRoute>} />
        <Route path="/recommendations" element={<PrivateRoute><Layout><Recommendations /></Layout></PrivateRoute>} />
        <Route path="/mental-health" element={<PrivateRoute><Layout><MentalHealth /></Layout></PrivateRoute>} />
        <Route path="/drug-prices" element={<PrivateRoute><Layout><DrugPrices /></Layout></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute><Layout><Analytics /></Layout></PrivateRoute>} />
        <Route path="/clinic" element={<PrivateRoute><ClinicPortal /></PrivateRoute>} />
        <Route path="/share" element={<PrivateRoute><Layout><ShareProfile /></Layout></PrivateRoute>} />
        <Route path="/lookup" element={<PrivateRoute><Layout><PatientLookup /></Layout></PrivateRoute>} />
        <Route path="/google-fit-callback" element={<GoogleFitCallback />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <DataProvider>
        <AppContent />
        <SpeedInsights />
      </DataProvider>
    </ErrorBoundary>
  );
};

export default App;