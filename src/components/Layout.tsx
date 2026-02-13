import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HomeIcon, CalendarIcon, PillIcon, FileTextIcon, UserIcon, StethoscopeIcon, HeartbeatIcon, FaceSmileIcon, CurrencyDollarIcon, ChartBarIcon, QrCodeIcon, TruckIcon, KeyIcon, ShieldCheckIcon, XIcon } from './Icons';
import { useTranslations } from '@/lib/i18n';
import GlobalSearch from './GlobalSearch';
import { UserService } from '../services/userService';
import { useData } from '@/contexts/DataContext';

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ href, icon, label, isActive }) => {
  const activeClasses = 'bg-sky-100 text-sky-600';
  const inactiveClasses = 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';
  
  return (
    <Link
      to={href}
      className={`group flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 text-left ${isActive ? activeClasses : inactiveClasses}`}
    >
      {icon}
      <span className="ml-4">{label}</span>
    </Link>
  );
};

const MobileNavLink: React.FC<NavLinkProps> = ({ href, icon, label, isActive }) => {
    const activeClasses = 'text-sky-600';
    const inactiveClasses = 'text-slate-500 hover:text-sky-600';

    return (
        <Link to={href} className={`flex flex-col items-center justify-center space-y-1 w-full ${isActive ? activeClasses : inactiveClasses}`}>
            {icon}
            <span className="text-xs">{label}</span>
        </Link>
    );
}

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { t, language, setLanguage } = useTranslations();
  const { isPreloading } = useData();
  const [isSewaModalOpen, setIsSewaModalOpen] = useState(false);
  const [sewaCodeInput, setSewaCodeInput] = useState('');
  const [sewaError, setSewaError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const isCanceledRef = React.useRef(false);

  const navItems = [
    { href: '/', label: t('dashboard'), icon: <HomeIcon /> },
    { href: '/analytics', label: t('healthAnalytics'), icon: <ChartBarIcon /> },
    { href: '/symptoms', label: t('symptomChecker'), icon: <StethoscopeIcon /> },
    { href: '/appointments', label: t('appointments'), icon: <CalendarIcon /> },
    { href: '/medications', label: t('medications'), icon: <PillIcon /> },
    { href: '/records', label: t('records'), icon: <FileTextIcon /> },
    { href: '/mental-health', label: t('mentalHealth'), icon: <FaceSmileIcon /> },
    { href: '/emergency-services', label: t('emergencyServices'), icon: <TruckIcon /> },
    { href: '/drug-prices', label: t('drugPrices'), icon: <CurrencyDollarIcon /> },
    { href: '/share', label: t('shareProfile'), icon: <QrCodeIcon /> },
  ];
  
  const bottomNavItems = [ ...navItems.slice(0, 4), { href: '/profile', label: t('profile'), icon: <UserIcon /> } ];
  const desktopNavItems = [ ...navItems, { href: '/profile', label: t('profile'), icon: <UserIcon /> } ];

  const handleSewaCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSewaError('');
    if (sewaCodeInput.length < 6) {
        setSewaError('Code must be 6 characters');
        return;
    }
    
    isCanceledRef.current = false;
    setIsVerifying(true);
    try {
        const user = await UserService.getUserBySewaCode(sewaCodeInput);
        
        // Check if user clicked cancel during the async request
        if (isCanceledRef.current) return;

        if (user) {
            setIsSewaModalOpen(false);
            setIsVerifying(false);
            setSewaCodeInput('');
            navigate(`/public-profile/${user.uid}`);
        } else {
            setSewaError('Invalid Sewa Code');
            setIsVerifying(false);
        }
    } catch (err) {
        if (isCanceledRef.current) return;
        setSewaError('Verification failed');
        setIsVerifying(false);
    }
  };

  const closeSewaModal = () => {
    isCanceledRef.current = true;
    setIsSewaModalOpen(false);
    setIsVerifying(false);
    setSewaCodeInput('');
    setSewaError('');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100 text-slate-800">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col fixed inset-y-0 z-20">
        <div className="flex flex-col flex-grow border-r border-slate-200 bg-white pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 justify-between">
            <div className="flex items-center">
                <svg className="h-8 w-auto text-sky-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4 5v6.09c0 4.97 3.41 9.32 8 10.91 4.59-1.59 8-5.94 8-10.91V5l-8-3zm-1 15v-4H7v-2h4V7h2v4h4v2h-4v4h-2z"/>
                </svg>
                <span className="ml-3 text-xl font-black text-slate-800 tracking-tight italic">SEWA</span>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[8px] font-bold text-sky-600 leading-none">आत्मनिर्भर</span>
                <span className="text-[8px] font-bold text-sky-800 leading-none text-right">भारत</span>
            </div>
          </div>
          
          <nav className="mt-8 flex-1 px-4 space-y-1">
            {desktopNavItems.map(item => (
              <NavLink key={item.href} {...item} isActive={currentPath === item.href} />
            ))}
          </nav>

          <div className="px-4 py-4 mt-auto border-t border-slate-100">
             <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('digitalIndia')}</p>
                <div className="flex items-center gap-2">
                    <ShieldCheckIcon />
                    <span className="text-xs font-bold text-slate-700">{t('atmanirbharBharat')}</span>
                </div>
                <p className="text-[9px] text-slate-500 mt-2 font-medium">{t('madeInIndia')}</p>
             </div>
          </div>
        </div>
      </aside>

      <div className="md:pl-64 flex flex-col flex-1">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
            {/* Blue Accent Line */}
            <div className="h-1 w-full flex">
                <div className="h-full flex-1 bg-sky-400"></div>
                <div className="h-full flex-1 bg-sky-500"></div>
                <div className="h-full flex-1 bg-sky-600"></div>
            </div>
            <div className="mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-1 max-w-lg flex items-center gap-4">
                        <GlobalSearch />
                        {isPreloading && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-sky-50 rounded-full border border-sky-100 animate-pulse">
                                <div className="w-1.5 h-1.5 bg-sky-500 rounded-full"></div>
                                <span className="text-[10px] font-bold text-sky-700 uppercase tracking-tighter">Syncing</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3 ml-4">
                        <button 
                            onClick={() => setIsSewaModalOpen(true)}
                            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-700 border border-sky-100 rounded-xl text-xs font-bold hover:bg-sky-100 transition-all active:scale-95"
                        >
                            <KeyIcon />
                            {t('enterSewaCode')}
                        </button>

                        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1">
                            <button 
                                onClick={() => setLanguage('en')} 
                                className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${language === 'en' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                EN
                            </button>
                            <button 
                                onClick={() => setLanguage('hi')} 
                                className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${language === 'hi' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                HI
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
        <main className="flex-1 pb-20 md:pb-0">
            <div className="p-4 sm:p-6 lg:p-8">
                {children}
            </div>
        </main>
      </div>

      {/* Sewa Code Modal */}
      {isSewaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 bg-sky-600 text-white relative">
                    {!isVerifying && (
                        <button onClick={closeSewaModal} className="absolute top-4 right-4 p-1 hover:bg-sky-700 rounded-full transition-colors">
                            <XIcon />
                        </button>
                    )}
                    <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                        <KeyIcon />
                    </div>
                    <h2 className="text-xl font-bold">{t('enterSewaCode')}</h2>
                    <p className="text-sky-100 text-xs mt-1">Access medical records securely using the 6-digit code.</p>
                </div>
                <form onSubmit={handleSewaCodeSubmit} className="p-8 space-y-4">
                    <div>
                        <input 
                            type="text"
                            maxLength={6}
                            value={sewaCodeInput}
                            onChange={(e) => setSewaCodeInput(e.target.value.toUpperCase())}
                            placeholder="E.g. A1B2C3"
                            disabled={isVerifying}
                            className={`w-full text-center text-3xl font-black tracking-[0.5em] py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-sky-500 focus:ring-0 outline-none transition-all placeholder:tracking-normal placeholder:text-sm placeholder:font-medium ${isVerifying ? 'opacity-50 cursor-not-allowed' : ''}`}
                            autoFocus
                        />
                        {sewaError && <p className="text-red-500 text-center text-xs mt-2 font-bold">{sewaError}</p>}
                    </div>
                    <div className="flex flex-col gap-3">
                        <button 
                            type="submit"
                            disabled={isVerifying || sewaCodeInput.length < 6}
                            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-70"
                        >
                            {isVerifying ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                t('viewReport')
                            )}
                        </button>
                        {isVerifying && (
                            <button 
                                type="button"
                                onClick={closeSewaModal}
                                className="w-full py-2 text-slate-400 font-bold text-xs hover:text-slate-600 transition-colors uppercase tracking-widest"
                            >
                                Cancel Verification
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-md border-t border-slate-200 shadow-lg z-10">
        <div className="flex justify-around h-16 items-center overflow-x-auto">
            {bottomNavItems.map(item => (
                <MobileNavLink key={item.href} {...item} isActive={currentPath === item.href} />
            ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;