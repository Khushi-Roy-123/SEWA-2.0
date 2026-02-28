
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';

const GoogleFitCallback: React.FC = () => {
    const navigate = useNavigate();
    const { refreshFitData } = useData();
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) return; // Wait for auth to resolve

        // Parse the token from the hash fragment
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            const expiresIn = params.get('expires_in');

            if (accessToken) {
                // Store token PER-USER so switching accounts won't show stale data
                const uid = currentUser.uid;
                localStorage.setItem(`google_fit_token_${uid}`, accessToken);
                // Calculate expiry time
                if (expiresIn) {
                    const expiryDate = new Date().getTime() + parseInt(expiresIn) * 1000;
                    localStorage.setItem(`google_fit_token_expiry_${uid}`, expiryDate.toString());
                }

                // Refresh global fit data then navigate
                refreshFitData().then(() => {
                    navigate('/');
                });
            } else {
                navigate('/analytics?error=fit_auth_failed');
            }
        }
    }, [navigate, refreshFitData, currentUser]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mb-4"></div>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Connecting Google Fit...</p>
        </div>
    );
};

export default GoogleFitCallback;

