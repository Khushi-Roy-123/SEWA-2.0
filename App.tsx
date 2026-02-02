import React, { useState, useEffect } from 'react';
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
import VitalsMonitor from './pages/VitalsMonitor';
import MentalHealth from './pages/MentalHealth';
import MentalHealthPrediction from './pages/MentalHealthPrediction';
import DrugPrices from './pages/DrugPrices';
import Analytics from './pages/Analytics';
import ShareProfile from './pages/ShareProfile';
import PublicProfile from './pages/PublicProfile';
import Login from './pages/Login';
import Register from './pages/Register';
import { TranslationsProvider } from './lib/i18n';
import { AuthProvider, useAuth } from './context/AuthContext';

import { HashRouter, useLocation, useNavigate } from 'react-router-dom';

// Wrapper to handle hash changes for legacy components if needed, or fully migrate to Router
const AppContent: React.FC = () => {
    // We can now use useLocation and useNavigate!
    const location = useLocation();
    const navigate = useNavigate();
    const [symptomsForRec, setSymptomsForRec] = useState('');
    const [extractedRecordText, setExtractedRecordText] = useState('');
    const { user, loading } = useAuth();
  
    // Redirect to login if not authenticated
    useEffect(() => {
        // Simple route protection regex or logic
        const publicRoutes = ['/login', '/register', '/public-profile'];
        const isPublic = publicRoutes.some(path => location.pathname.startsWith(path));

        if (!loading && !user && !isPublic) {
            navigate('/login');
        }
        // Redirect to dashboard if authenticated and trying to access login/register
        if (!loading && user && (location.pathname === '/login' || location.pathname === '/register')) {
            navigate('/');
        }
    }, [user, loading, location, navigate]);
    
    // Legacy support: Map hash changes or just rely on router
    // For now, let's map the renderPage logic to Routes in the next step, but strictly 
    // replacing the manual renderPage with Routes is cleaner.
    // However, to keep it simple and consistent with the user's existing structure, 
    // let's reimplement renderPage using location.pathname
    
    const renderPage = () => {
        if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
        
        const path = location.pathname;

        // Route matching
        if (path === '/login') return <Login />;
        if (path === '/register') return <Register />;
        if (path.startsWith('/public-profile')) return <PublicProfile />;

        // Protected routes
        switch (path) {
            case '/appointments': return <Layout><Appointments /></Layout>;
            case '/medications': return <Layout><Medications /></Layout>;
            case '/records': return <Layout><Records /></Layout>;
            case '/upload-record': return <Layout><UploadRecord onTextExtracted={(text) => { setExtractedRecordText(text); navigate('/translated-record'); }} /></Layout>;
            case '/translated-record': return <Layout><TranslatedRecord extractedText={extractedRecordText} /></Layout>;
            case '/profile': return <Layout><Profile /></Layout>;
            case '/symptoms': return <Layout><SymptomInput onSubmit={(symptoms) => { setSymptomsForRec(symptoms); navigate('/recommendations'); }} /></Layout>;
            case '/recommendations': return <Layout><Recommendations symptoms={symptomsForRec} /></Layout>;
            case '/vitals': return <Layout><VitalsMonitor /></Layout>;
            case '/mental-health': return <Layout><MentalHealth /></Layout>;
            case '/mental-health-prediction': return <Layout><MentalHealthPrediction /></Layout>;
            case '/drug-prices': return <Layout><DrugPrices /></Layout>;
            case '/analytics': return <Layout><Analytics /></Layout>;
            case '/share': return <Layout><ShareProfile /></Layout>;
            case '/':
            default:
                if (!user) return <Login />;
                return <Layout><Dashboard /></Layout>;
        }
    };

    return <>{renderPage()}</>;
};

import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <TranslationsProvider>
        <AuthProvider>
          <HashRouter>
              <AppContent />
          </HashRouter>
        </AuthProvider>
      </TranslationsProvider>
    </ErrorBoundary>
  );
};

export default App;
