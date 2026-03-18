// components/maps/VehicleTrackingMap.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue in Next.js
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
  });
};

interface VehicleTrackingMapProps {
  vehicleId: string;
  initialLocation?: { lat: number; lng: number };
  height?: string;
  showRoute?: boolean;
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

export default function VehicleTrackingMap({ 
  vehicleId,
  initialLocation = { lat: 37.7749, lng: -122.4194 },
  height = '500px',
  showRoute = true,
  onLocationUpdate
}: VehicleTrackingMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([
    initialLocation.lat,
    initialLocation.lng
  ]);

  useEffect(() => {
    fixLeafletIcon();

    // Initialize map
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(
        [initialLocation.lat, initialLocation.lng], 
        13
      );

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Create initial marker
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="marker-pulse">
            <div class="marker-inner"></div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      markerRef.current = L.marker([initialLocation.lat, initialLocation.lng], { 
        icon: customIcon 
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [initialLocation.lat, initialLocation.lng]);

  // Function to update vehicle location (call this from parent component)
  const updateLocation = (lat: number, lng: number, speed?: number) => {
    const newLocation: [number, number] = [lat, lng];
    setCurrentLocation(newLocation);
    
    // Update route points
    if (showRoute) {
      setRoutePoints(prev => {
        const updated = [...prev, newLocation];
        return updated.slice(-100); // Keep last 100 points
      });
    }

    // Update map view
    if (mapRef.current) {
      mapRef.current.setView(newLocation, 15);
    }

    // Update marker position
    if (markerRef.current) {
      markerRef.current.setLatLng(newLocation);
      markerRef.current.setPopupContent(`
        <b>Vehicle: ${vehicleId}</b><br/>
        Speed: ${speed?.toFixed(1) || 0} km/h<br/>
        Last Update: ${new Date().toLocaleString()}
      `);
    }

    // Update polyline
    if (showRoute && mapRef.current && routePoints.length > 1) {
      const allPoints = [...routePoints, newLocation];
      if (polylineRef.current) {
        polylineRef.current.setLatLngs(allPoints);
      } else {
        polylineRef.current = L.polyline(allPoints, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.6,
        }).addTo(mapRef.current);
      }
    }

    onLocationUpdate?.({ lat, lng });
  };

  // Expose updateLocation method to parent components
  useEffect(() => {
    // This allows parent components to call updateLocation via ref
    if (mapRef.current) {
      (mapRef.current as any).updateLocation = updateLocation;
    }
  }, [routePoints]);

  // Add CSS for custom marker
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .marker-pulse {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: rgba(59, 130, 246, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 1.5s ease-out infinite;
      }
      
      .marker-inner {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #3b82f6;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      
      @keyframes pulse {
        0% {
          transform: scale(1);
          opacity: 0.8;
        }
        70% {
          transform: scale(1.5);
          opacity: 0;
        }
        100% {
          transform: scale(1);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full rounded-lg" />
      
      {/* Info Overlay */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
        <p className="text-sm font-medium">📍 Vehicle {vehicleId}</p>
        <p className="text-xs text-gray-600">
          Lat: {currentLocation[0].toFixed(6)}<br />
          Lng: {currentLocation[1].toFixed(6)}
        </p>
      </div>
    </div>
  );
}