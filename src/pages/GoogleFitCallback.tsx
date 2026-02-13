
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';

const GoogleFitCallback: React.FC = () => {
    const navigate = useNavigate();
    const { refreshFitData } = useData();

    useEffect(() => {
        // Parse the token from the hash fragment
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            const expiresIn = params.get('expires_in');

            if (accessToken) {
                localStorage.setItem('google_fit_token', accessToken);
                // Calculate expiry time
                if (expiresIn) {
                    const expiryDate = new Date().getTime() + parseInt(expiresIn) * 1000;
                    localStorage.setItem('google_fit_token_expiry', expiryDate.toString());
                }
                
                // Refresh global fit data then navigate
                refreshFitData().then(() => {
                    navigate('/');
                });
            } else {
                navigate('/analytics?error=fit_auth_failed');
            }
        }
    }, [navigate, refreshFitData]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mb-4"></div>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Connecting Google Fit...</p>
        </div>
    );
};

export default GoogleFitCallback;
