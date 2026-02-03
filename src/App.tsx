import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Medications from './pages/Medications';
import Records from './pages/Records';
import Profile from './pages/Profile';
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

// Placeholder Auth Wrapper (We will implement real auth guard later)
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // const { user } = useAuth(); // TODO: Implement Auth Hook
  // return user ? <>{children}</> : <Navigate to="/login" />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <TranslationsProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/public-profile/:userId" element={<PublicProfile />} />
          
          {/* Protected Routes (Wrapped in Layout) */}
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/appointments" element={<Layout><Appointments /></Layout>} />
          <Route path="/medications" element={<Layout><Medications /></Layout>} />
          <Route path="/records" element={<Layout><Records /></Layout>} />
          <Route path="/emergency-services" element={<Layout><EmergencyServices /></Layout>} />
          <Route path="/upload-record" element={<Layout><UploadRecord /></Layout>} />
          <Route path="/translated-record" element={<Layout><TranslatedRecord /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/symptoms" element={<Layout><SymptomInput /></Layout>} />
          <Route path="/recommendations" element={<Layout><Recommendations /></Layout>} />
          
          <Route path="/mental-health" element={<Layout><MentalHealth /></Layout>} />
          <Route path="/drug-prices" element={<Layout><DrugPrices /></Layout>} />
          <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
          <Route path="/share" element={<Layout><ShareProfile /></Layout>} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </TranslationsProvider>
  );
};

export default App;
