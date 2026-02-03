import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Medications from './pages/Medications';
import Records from './pages/Records';
import Profile from './pages/Profile';
import EmergencyQR from './components/EmergencyQR';
import SymptomInput from './pages/SymptomInput';
import Recommendations from './pages/Recommendations';
import UploadRecord from './pages/UploadRecord';
import TranslatedRecord from './pages/TranslatedRecord';
import MentalHealth from './pages/MentalHealth';
import DrugPrices from './pages/DrugPrices';
import Analytics from './pages/Analytics';
import ShareProfile from './pages/ShareProfile';
import PublicProfile from './pages/PublicProfile';
import EmergencyServices from './pages/EmergencyServices';
import { TranslationsProvider } from './lib/i18n';
import { Loader2 } from 'lucide-react';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <TranslationsProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/public-profile/:userId" element={<PublicProfile />} />
            
            {/* Protected Routes (Wrapped in PrivateRoute + Layout) */}
            <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
            <Route path="/appointments" element={<PrivateRoute><Layout><Appointments /></Layout></PrivateRoute>} />
            <Route path="/medications" element={<PrivateRoute><Layout><Medications /></Layout></PrivateRoute>} />
            <Route path="/records" element={<PrivateRoute><Layout><Records /></Layout></PrivateRoute>} />
            <Route path="/emergency-services" element={<PrivateRoute><Layout><EmergencyServices /></Layout></PrivateRoute>} />
            <Route path="/upload-record" element={<PrivateRoute><Layout><UploadRecord /></Layout></PrivateRoute>} />
            <Route path="/translated-record" element={<PrivateRoute><Layout><TranslatedRecord /></Layout></PrivateRoute>} />
            <Route path="/profile" element={
            <PrivateRoute>
              <Layout>
                <Profile />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/emergency-card" element={
            <PrivateRoute>
              <Layout>
                <EmergencyQR />
              </Layout>
            </PrivateRoute>
          } /> <Route path="/symptoms" element={<PrivateRoute><Layout><SymptomInput /></Layout></PrivateRoute>} />
            <Route path="/recommendations" element={<PrivateRoute><Layout><Recommendations /></Layout></PrivateRoute>} />
            
            <Route path="/mental-health" element={<PrivateRoute><Layout><MentalHealth /></Layout></PrivateRoute>} />
            <Route path="/drug-prices" element={<PrivateRoute><Layout><DrugPrices /></Layout></PrivateRoute>} />
            <Route path="/analytics" element={<PrivateRoute><Layout><Analytics /></Layout></PrivateRoute>} />
            <Route path="/share" element={<PrivateRoute><Layout><ShareProfile /></Layout></PrivateRoute>} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </TranslationsProvider>
    </AuthProvider>
  );
};

export default App;
