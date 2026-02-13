import React, { useState, useEffect, useCallback } from 'react';
import { TruckIcon, PhoneIcon, MapPinIcon, ExclamationIcon, HeartbeatIcon } from '../components/Icons';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

interface Hospital {
    id: string;
    name: string;
    distance: string;
    address: string;
    phoneNumber: string;
    rating?: number;
    location: {
        lat: number;
        lng: number;
    };
}

const mapContainerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '1.5rem'
};

const MOCK_HOSPITALS: Hospital[] = [
    {
        id: 'mock1',
        name: 'City General Hospital',
        distance: '2.5 km',
        address: '123 Healthcare Blvd, Medical District',
        phoneNumber: '102',
        rating: 4.5,
        location: { lat: 0, lng: 0 }
    },
    {
        id: 'mock2',
        name: 'St. Mary’s Emergency Center',
        distance: '4.1 km',
        address: '456 Wellness Way',
        phoneNumber: '102',
        rating: 4.2,
        location: { lat: 0, lng: 0 }
    },
    {
        id: 'mock3',
        name: 'Community Health Clinic',
        distance: '1.2 km',
        address: '789 Local Lane',
        phoneNumber: '102',
        rating: 4.0,
        location: { lat: 0, lng: 0 }
    }
];

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ['places', 'geometry'];

const EmergencyServices: React.FC = () => {
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: libraries,
        preventGoogleFontsLoading: true
    });

    const fetchNearbyHospitals = useCallback((location: { lat: number; lng: number }) => {
        if (!GOOGLE_MAPS_API_KEY || !window.google || !isLoaded) {
            setHospitals(MOCK_HOSPITALS);
            setLoading(false);
            return;
        }

        const service = new google.maps.places.PlacesService(document.createElement('div'));
        const request: google.maps.places.PlaceSearchRequest = {
            location: new google.maps.LatLng(location.lat, location.lng),
            radius: 5000,
            type: 'hospital'
        };

        service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                const hospitalData = results.slice(0, 6).map(place => {
                    const hospitalLoc = {
                        lat: place.geometry?.location?.lat() || 0,
                        lng: place.geometry?.location?.lng() || 0
                    };
                    
                    const distanceInMeters = google.maps.geometry.spherical.computeDistanceBetween(
                        new google.maps.LatLng(location.lat, location.lng),
                        new google.maps.LatLng(hospitalLoc.lat, hospitalLoc.lng)
                    );

                    return {
                        id: place.place_id || Math.random().toString(),
                        name: place.name || "Unknown Hospital",
                        address: place.vicinity || "No address available",
                        location: hospitalLoc,
                        rating: place.rating,
                        phoneNumber: "102", // Default emergency number
                        distance: `${(distanceInMeters / 1000).toFixed(1)} km`
                    };
                });
                setHospitals(hospitalData);
                
                // Fetch details (phone numbers) for each hospital
                hospitalData.forEach((h) => {
                    service.getDetails({ placeId: h.id, fields: ['international_phone_number', 'formatted_phone_number'] }, (place, status) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                            setHospitals(prev => prev.map(item => 
                                item.id === h.id ? { ...item, phoneNumber: place.formatted_phone_number || place.international_phone_number || "102" } : item
                            ));
                        }
                    });
                });

                setLoading(false);
            } else {
                setHospitals(MOCK_HOSPITALS); // Fallback to mocks if no results
                setLoading(false);
            }
        });
    }, [isLoaded]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUserLocation(loc);
                    if (GOOGLE_MAPS_API_KEY && isLoaded) {
                        fetchNearbyHospitals(loc);
                    } else {
                         setHospitals(MOCK_HOSPITALS);
                         setLoading(false);
                    }
                },
                () => {
                    setError("Location access denied. Showing default recommendations.");
                    setHospitals(MOCK_HOSPITALS);
                    setLoading(false);
                }
            );
        } else {
            setError("Geolocation is not supported by your browser.");
            setHospitals(MOCK_HOSPITALS);
            setLoading(false);
        }
    }, [isLoaded, fetchNearbyHospitals]);

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Emergency Services</h1>
                <p className="mt-1 text-slate-500">Immediate assistance and hospital locator.</p>
            </div>

            {!GOOGLE_MAPS_API_KEY && (
                 <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 text-blue-700 text-sm">
                    <ExclamationIcon />
                    <div>
                        <p className="font-bold">Demo Mode Active</p>
                        <p>Google Maps API Key is missing. Showing mock data for demonstration.</p>
                    </div>
                </div>
            )}

            {/* Ambulance Section */}
            <div className="bg-red-50 border border-red-100 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-red-100 rounded-full opacity-50 blur-xl"></div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="bg-red-100 p-4 rounded-2xl text-red-600 shadow-sm">
                            <TruckIcon />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-red-700">Request Ambulance</h2>
                            <p className="text-red-500 font-medium flex items-center gap-2">
                                Emergency Response Team
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                    24/7
                                </span>
                            </p>
                        </div>
                    </div>
                    
                    <a 
                        href="tel:102"
                        className="flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white font-black text-xl py-4 px-10 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 animate-pulse"
                    >
                        <PhoneIcon />
                        Call Emergency Team (102)
                    </a>
                </div>
                
                <p className="mt-6 text-slate-600 text-center md:text-left relative z-10 max-w-2xl leading-relaxed">
                    If you or someone around you is in immediate danger, call the emergency response team right away. 
                    Our medical professionals are available 24/7 to provide life-saving assistance.
                </p>
            </div>

            {/* Map Section */}
            {GOOGLE_MAPS_API_KEY && isLoaded && userLocation ? (
                <div className="overflow-hidden rounded-3xl shadow-sm border border-slate-200 relative">
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={userLocation}
                        zoom={14}
                        options={{
                            disableDefaultUI: false,
                            zoomControl: true,
                            streetViewControl: false,
                            mapTypeControl: false,
                        }}
                    >
                        <Marker position={userLocation} label="You" />
                        {hospitals.map(hospital => (
                            <Marker 
                                key={hospital.id} 
                                position={hospital.location} 
                                icon="http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                            />
                        ))}
                    </GoogleMap>
                </div>
            ) : (
                <div className="rounded-3xl shadow-sm border border-slate-200 bg-slate-100 h-[300px] flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <MapPinIcon />
                    <p className="mt-2 font-medium">Map Unavailable</p>
                    <p className="text-sm">
                        {GOOGLE_MAPS_API_KEY ? "Waiting for location..." : "Configure Google Maps API Key to view live map."}
                    </p>
                </div>
            )}

            {/* Hospital List Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Nearby Hospitals</h2>
                    {loading && <span className="text-slate-400 animate-pulse flex items-center gap-2"><HeartbeatIcon /> Finding nearby care...</span>}
                </div>

                {error && !loading && (
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-amber-800 flex items-center gap-3">
                        <ExclamationIcon />
                        <p>{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hospitals.map(hospital => (
                        <div key={hospital.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 group-hover:text-red-600 transition-colors">{hospital.name}</h3>
                                    <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                                        <MapPinIcon />
                                        <span className="truncate max-w-[200px]">{hospital.distance} • {hospital.address}</span>
                                    </div>
                                </div>
                                {hospital.rating && (
                                    <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">
                                        ★ {hospital.rating}
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-3 mt-4">
                                <a 
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.name}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold py-2.5 rounded-xl transition-colors text-center border border-sky-100"
                                >
                                    Get Directions
                                </a>
                                <a 
                                    href={`tel:${hospital.phoneNumber}`}
                                    className="p-2.5 bg-green-50 hover:bg-green-100 border border-green-100 rounded-xl text-green-700 flex items-center justify-center transition-colors"
                                >
                                    <PhoneIcon />
                                </a>
                            </div>
                        </div>
                    ))}
                    {!loading && hospitals.length === 0 && !error && (
                        <p className="text-slate-500 col-span-2 text-center py-8">No hospitals found within 5km.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmergencyServices;
