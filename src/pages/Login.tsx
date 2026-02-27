import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from '@/lib/i18n';
import { LogIn, UserPlus, AlertCircle, Loader2, Globe, CheckCircle2, Camera } from 'lucide-react';
import FaceCapture from '@/components/FaceCapture';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [descriptor, setDescriptor] = useState<number[] | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const { currentUser, login, signup } = useAuth();
  const { t, language, setLanguage } = useTranslations();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser && !loading && !success) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate, loading, success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || (!isLogin && (!name || !photo))) {
      setError(!isLogin && !photo ? 'Live face capture is mandatory' : t('validation_emailRequired'));
      return;
    }

    if (password.length < 6) {
      setError(t('validation_passwordLength'));
      return;
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      if (isLogin) {
        console.log("Login: Initiating login...");
        await login(email, password);
        console.log("Login: Successful. Navigating to Dashboard.");
        navigate('/');
      } else {
        console.log("Login: Initiating signup Flow...");
        await signup(email, password, name, photo!, descriptor!);
        console.log("Login: Signup Flow complete. Redirecting to Dashboard.");
        navigate('/');
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.');
      } else if (err.code === 'storage/unauthorized' || err.message?.includes('CORS')) {
        setError('Profile photo upload failed due to server CORS policy. Please check console for fix.');
      } else {
        setError(isLogin ? t('auth_loginError') : (err.message || t('auth_signupError')));
      }
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
                  <path d="M12 2L4 5v6.09c0 4.97 3.41 9.32 8 10.91 4.59-1.59 8-5.94 8-10.91V5l-8-3zm-1 15v-4H7v-2h4V7h2v4h4v2h-4v4h-2z" />
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

          {success && (
            <div className="bg-green-50 text-green-600 p-4 rounded-2xl mb-6 flex items-center gap-3 text-sm font-bold border border-green-100">
              <CheckCircle2 size={18} />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="flex flex-col items-center mb-6">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 text-center w-full">Face ID Registration (Mandatory)</label>

                  {showCamera ? (
                    <FaceCapture
                      onCapture={(data) => {
                        setPhoto(data);
                        setShowCamera(false);
                      }}
                      onCaptureWithDescriptor={(data, desc) => {
                        setPhoto(data);
                        setDescriptor(desc);
                        setShowCamera(false);
                      }}
                      onCancel={() => setShowCamera(false)}
                    />
                  ) : (
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                        {photo ? (
                          <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <UserPlus size={32} className="text-slate-300" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCamera(true)}
                        className="absolute bottom-0 right-0 bg-sky-600 p-2 rounded-full text-white shadow-lg hover:bg-sky-700 transition-all"
                      >
                        <Camera size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {!showCamera && (
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
                )}
              </>
            )}

            {!showCamera && (
              <>
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
              </>
            )}
          </form>

          {!showCamera && (
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500 font-bold">
                {isLogin ? t('dontHaveAccount') : t('alreadyHaveAccount')}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setSuccess('');
                    setError('');
                  }}
                  className="text-sky-600 hover:text-sky-700 font-black ml-2 underline underline-offset-4"
                >
                  {isLogin ? t('signup') : t('login')}
                </button>
              </p>
            </div>
          )}

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