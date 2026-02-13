import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from '@/lib/i18n';
import { LogIn, UserPlus, AlertCircle, Loader2, Globe } from 'lucide-react';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { currentUser, login, signup } = useAuth();
  const { t, language, setLanguage } = useTranslations();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser && !loading) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate, loading]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) { // Reduced to 500KB for Firestore stability
        setError('Photo must be less than 500KB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || (!isLogin && (!name || !photo))) {
      setError(!isLogin && !photo ? 'Profile photo is required' : t('validation_emailRequired'));
      return;
    }

    if (password.length < 6) {
      setError(t('validation_passwordLength'));
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, name, photo!);
      }
      
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(isLogin ? t('auth_loginError') : t('auth_signupError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
        <div className="p-8 sm:p-12">
          <div className="text-center mb-10">
            <div className="flex justify-center items-center mb-6">
                <div className="bg-sky-600 p-3 rounded-2xl shadow-lg shadow-sky-200">
                    <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L4 5v6.09c0 4.97 3.41 9.32 8 10.91 4.59-1.59 8-5.94 8-10.91V5l-8-3zm-1 15v-4H7v-2h4V7h2v4h4v2h-4v4h-2z"/>
                    </svg>
                </div>
                <h1 className="ml-4 text-4xl font-black text-slate-900 tracking-tighter italic">SEWA</h1>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">
              {isLogin ? t('loginToYourAccount') : t('createAnAccount')}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              {t('atmanirbharBharat')} • {t('digitalIndia')}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 flex items-center gap-3 text-sm font-bold border border-red-100">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="flex flex-col items-center mb-6">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 text-center w-full">Profile Photo (Mandatory)</label>
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                      {photo ? (
                        <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <UserPlus size={32} className="text-slate-300" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-sky-600 p-2 rounded-full text-white shadow-lg cursor-pointer hover:bg-sky-700 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{t('fullName')}</label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-sky-500 focus:ring-0 outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{t('emailAddress')}</label>
              <input
                type="email"
                required
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-sky-500 focus:ring-0 outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{t('password')}</label>
              <input
                type="password"
                required
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-sky-500 focus:ring-0 outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-slate-200 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : isLogin ? (
                <>
                  <LogIn size={20} />
                  {t('login').toUpperCase()}
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  {t('signup').toUpperCase()}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 font-bold">
              {isLogin ? t('dontHaveAccount') : t('alreadyHaveAccount')}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sky-600 hover:text-sky-700 font-black ml-2 underline underline-offset-4"
              >
                {isLogin ? t('signup') : t('login')}
              </button>
            </p>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
              <button 
                onClick={() => setLanguage('en')} 
                className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all ${language === 'en' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                ENGLISH
              </button>
              <button 
                onClick={() => setLanguage('hi')} 
                className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all ${language === 'hi' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                हिन्दी
              </button>
            </div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                {t('madeInIndia')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;