
import React, { useState } from 'react';
import { TruckIcon, HomeIcon, PhoneIcon, MapPinIcon } from '../components/Icons';

const EmergencyServices: React.FC = () => {
    const [bookingStatus, setBookingStatus] = useState<'idle' | 'searching' | 'found'>('idle');
    const [ambulanceEta, setAmbulanceEta] = useState<string | null>(null);

    const hospitals = [
        { id: 1, name: "City General Hospital", distance: "1.2 km", waitTime: "10 mins", type: "General" },
        { id: 2, name: "St. Mary's Trauma Center", distance: "3.5 km", waitTime: "5 mins", type: "Trauma" },
        { id: 3, name: "Apollo Heart Institute", distance: "5.0 km", waitTime: "25 mins", type: "Specialized" },
    ];

    const handleBookAmbulance = () => {
        setBookingStatus('searching');
        setTimeout(() => {
            setBookingStatus('found');
            setAmbulanceEta('8 mins');
        }, 3000); // Simulate 3s search
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Emergency Services</h1>
                <p className="mt-1 text-slate-500">Immediate assistance and booking.</p>
            </div>

            {/* Ambulance Section */}
            <div className="bg-red-50 border border-red-100 rounded-3xl p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-red-100 p-3 rounded-2xl text-red-600">
                        <TruckIcon />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-red-700">Request Ambulance</h2>
                        <p className="text-red-500 font-medium">Emergency Response Team</p>
                    </div>
                </div>

                {bookingStatus === 'idle' && (
                    <div className="text-center py-8">
                        <p className="text-slate-600 mb-6 max-w-md mx-auto">
                            Click below to request an ambulance immediately. Your location will be shared with the nearest driver.
                        </p>
                        <button 
                            onClick={handleBookAmbulance}
                            className="bg-red-600 hover:bg-red-700 text-white font-black text-xl py-4 px-12 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 animate-pulse"
                        >
                            BOOK AMBULANCE NOW
                        </button>
                    </div>
                )}

                {bookingStatus === 'searching' && (
                    <div className="text-center py-12">
                        <div className="animate-spin h-12 w-12 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <h3 className="text-xl font-bold text-slate-800">Locating nearest driver...</h3>
                        <p className="text-slate-500">Please wait, do not close this app.</p>
                    </div>
                )}

                {bookingStatus === 'found' && (
                    <div className="bg-white rounded-2xl p-6 shadow-md border border-red-100 max-w-lg mx-auto">
                        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
                            <h3 className="text-xl font-bold text-emerald-600 flex items-center gap-2">
                                <span className="text-2xl">✓</span> Ambulance On The Way
                            </h3>
                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">ETA: {ambulanceEta}</span>
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold">
                                JD
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">John Driver</p>
                                <p className="text-sm text-slate-500">Vehicle: KA-01-EQ-9999</p>
                            </div>
                            <a href="tel:102" className="ml-auto bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-md">
                                <PhoneIcon />
                            </a>
                        </div>
                        <p className="text-xs text-slate-400 text-center">Do not optimize battery or close app.</p>
                    </div>
                )}
            </div>

            {/* Hospital Booking Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Nearby Hospitals</h2>
                    <span className="text-sky-600 font-semibold cursor-pointer">View Map</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hospitals.map(hospital => (
                        <div key={hospital.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{hospital.name}</h3>
                                    <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                                        <MapPinIcon />
                                        <span>{hospital.distance} • {hospital.type}</span>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${hospital.waitTime === '5 mins' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    Wait: {hospital.waitTime}
                                </span>
                            </div>
                            <div className="flex gap-3 mt-4">
                                <button className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 rounded-lg transition-colors">
                                    Book Emergency Slot
                                </button>
                                <button className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
                                    <PhoneIcon />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EmergencyServices;
