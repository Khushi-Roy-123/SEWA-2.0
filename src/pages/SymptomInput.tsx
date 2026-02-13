
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslations } from '@/lib/i18n';
import { MicrophoneIcon, StethoscopeIcon } from '../components/Icons';

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: any) => void;
  onend: () => void;
  onerror: (event: any) => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

const supportedLanguages = [
  { code: 'en-IN', name: 'English (India)' },
  { code: 'hi-IN', name: 'हिन्दी (Hindi)' },
  { code: 'bn-IN', name: 'বাংলা (Bengali)' },
  { code: 'gu-IN', name: 'ગુજરાતી (Gujarati)' },
  { code: 'kn-IN', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml-IN', name: 'മലയാളം (Malayalam)' },
  { code: 'mr-IN', name: 'मMarathi)' },
  { code: 'ta-IN', name: 'தமிழ் (Tamil)' },
  { code: 'te-IN', name: 'తెలుగు (Telugu)' },
  { code: 'ur-IN', name: 'اردو (Urdu)' },
];

const SymptomInput: React.FC = () => {
  const { t } = useTranslations();
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState('');
  const [selectedLang, setSelectedLang] = useState('en-IN');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const commonSymptomTags = [
    { key: 'headache', icon: '🧠' },
    { key: 'fever', icon: '🌡️' },
    { key: 'cough', icon: '💨' },
    { key: 'fatigue', icon: '😴' },
    { key: 'nausea', icon: '🤢' },
    { key: 'shortBreath', icon: '🫁' },
  ];

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setSymptoms(prev => prev.trim() ? prev + ' ' + finalTranscript : finalTranscript);
      }
    };

    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);
    recognitionRef.current = recognition;

    return () => {
      if(recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);
  
  const handleVoiceInput = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.lang = selectedLang;
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const addTag = (tagKey: string) => {
    const tagName = t(tagKey as any);
    setSymptoms(prev => prev.trim() ? `${prev}, ${tagName}` : tagName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) return;
    navigate(`/recommendations?q=${encodeURIComponent(symptoms)}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 bg-sky-50 rounded-full h-64 w-64 opacity-50 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="bg-sky-100 p-4 rounded-2xl">
            <StethoscopeIcon />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {t('symptomChecker')}
            </h1>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl leading-relaxed">
              {t('describeSymptomsPrompt')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Area */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <label htmlFor="symptoms" className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  {t('symptoms')}
                </label>
                <span className="text-xs font-medium text-slate-400">
                  {symptoms.length} characters
                </span>
              </div>
              <div className="relative group">
                <textarea
                  id="symptoms"
                  rows={8}
                  className="block w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder={t('symptomsPlaceholder')}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
                <div className="absolute inset-0 rounded-xl pointer-events-none group-focus-within:ring-2 group-focus-within:ring-sky-500/20"></div>
              </div>
            </div>

            {/* Quick Suggestions */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t('commonSymptoms')}
              </p>
              <div className="flex flex-wrap gap-2">
                {commonSymptomTags.map(tag => (
                  <button
                    key={tag.key}
                    type="button"
                    onClick={() => addTag(tag.key)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200"
                  >
                    <span>{tag.icon}</span>
                    <span>{t(tag.key as any)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={!symptoms.trim()}
                className="w-full py-4 px-6 bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-sky-200 hover:bg-sky-700 hover:shadow-sky-300 transition-all duration-300 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              >
                {t('submitSymptoms')}
              </button>
            </div>
          </form>
        </div>

        {/* Controls Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 space-y-6">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Voice & Language
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="language" className="block text-xs font-semibold text-slate-500 mb-2">
                  {t('selectLanguage')}
                </label>
                <select
                  id="language"
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                >
                  {supportedLanguages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`w-full flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 group ${
                    isRecording 
                    ? 'bg-rose-50 border-rose-200 text-rose-600' 
                    : 'bg-white border-slate-100 text-slate-600 hover:border-sky-200 hover:bg-sky-50'
                  }`}
                >
                  <div className={`p-4 rounded-full transition-transform duration-300 ${
                    isRecording ? 'bg-rose-600 text-white animate-pulse scale-110' : 'bg-slate-100 group-hover:bg-sky-600 group-hover:text-white'
                  }`}>
                    <MicrophoneIcon />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm">
                      {isRecording ? t('recording') : t('voiceInput')}
                    </p>
                    <p className="text-xs mt-1 text-slate-400 font-medium">
                      {isRecording ? t('stopRecording') : 'Tap to speak your symptoms'}
                    </p>
                  </div>
                </button>
                {isRecording && (
                  <div className="absolute top-4 right-4 flex gap-1">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-sky-900 rounded-2xl p-6 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 bg-sky-800 rounded-full h-24 w-24"></div>
            <h3 className="font-bold mb-2 relative z-10">AI-Powered Analysis</h3>
            <p className="text-xs text-sky-100/80 leading-relaxed relative z-10">
              Your data is analyzed using private, secure AI models. This tool provides specialist recommendations and health insights, not a formal medical diagnosis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SymptomInput;
