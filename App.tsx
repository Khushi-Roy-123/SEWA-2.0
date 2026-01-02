
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
import DrugPrices from './pages/DrugPrices';
import Analytics from './pages/Analytics';
import ShareProfile from './pages/ShareProfile';
import PublicProfile from './pages/PublicProfile';
import { TranslationsProvider } from './lib/i18n';

const App: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash);
  const [symptomsForRec, setSymptomsForRec] = useState('');
  const [extractedRecordText, setExtractedRecordText] = useState('');

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
  
  const handleSymptomSubmit = (symptoms: string) => {
    setSymptomsForRec(symptoms);
    window.location.hash = '#/recommendations';
  };

  const handleTextExtracted = (text: string) => {
    setExtractedRecordText(text);
    window.location.hash = '#/translated-record';
  };

  const renderPage = () => {
    // Check for public profile (simplified sharing)
    if (route.startsWith('#/public-profile')) {
      return <PublicProfile />;
    }

    switch (route) {
      case '#/appointments':
        return <Appointments />;
      case '#/medications':
        return <Medications />;
      case '#/records':
        return <Records />;
      case '#/upload-record':
        return <UploadRecord onTextExtracted={handleTextExtracted} />;
      case '#/translated-record':
        return <TranslatedRecord extractedText={extractedRecordText} />;
      case '#/profile':
        return <Profile />;
      case '#/symptoms':
        return <SymptomInput onSubmit={handleSymptomSubmit} />;
      case '#/recommendations':
        return <Recommendations symptoms={symptomsForRec} />;
      case '#/vitals':
        return <VitalsMonitor />;
      case '#/mental-health':
        return <MentalHealth />;
      case '#/drug-prices':
        return <DrugPrices />;
      case '#/analytics':
        return <Analytics />;
      case '#/share':
        return <ShareProfile />;
      case '#/':
      default:
        return <Dashboard />;
    }
  };

  return (
    <TranslationsProvider>
      <Layout>
        {renderPage()}
      </Layout>
    </TranslationsProvider>
  );
};

export default App;
