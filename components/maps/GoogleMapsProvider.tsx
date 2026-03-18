// components/maps/GoogleMapsProvider.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: null,
});

interface GoogleMapsProviderProps {
  children: ReactNode;
  apiKey: string;
}

export function GoogleMapsProvider({ children, apiKey }: GoogleMapsProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if Google Maps script is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const loadGoogleMaps = () => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&v=beta`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setIsLoaded(true);
      };
      
      script.onerror = () => {
        setLoadError(new Error('Failed to load Google Maps'));
      };

      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, [apiKey]);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export const useGoogleMaps = () => useContext(GoogleMapsContext);