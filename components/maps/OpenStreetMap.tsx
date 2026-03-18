// components/maps/OpenStreetMap.tsx (updated)
'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Navigation, ZoomIn, ZoomOut, MapPin, Route } from 'lucide-react';

// Fix Leaflet marker icon issue in Next.js
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
  });
};

// Vehicle interface
export interface MapVehicle {
  id: string;
  make: string;
  model: string;
  plate: string;
  status: 'moving' | 'idle' | 'offline' | 'maintenance';
  driver?: string;
  driverName?: string;
  driverId?: string;
  speed: number;
  coordinates: { lat: number; lng: number };
  lastUpdate: Date;
  fuel?: number;
  batteryLevel?: number;
  signalStrength?: 'strong' | 'medium' | 'weak';
}

// Route point interface
export interface RoutePoint {
  lat: number;
  lng: number;
  label?: string;
  type: 'origin' | 'destination' | 'waypoint';
}

interface OpenStreetMapProps {
  vehicles: MapVehicle[];
  selectedVehicleId?: string;
  onVehicleSelect: (vehicleId: string) => void;
  height?: string;
  showControls?: boolean;
  center?: { lat: number; lng: number };
  zoom?: number;
  // New props for route display
  routePoints?: RoutePoint[];
  showRoute?: boolean;
  routeColor?: string;
}

export function OpenStreetMap({
  vehicles,
  selectedVehicleId,
  onVehicleSelect,
  height = '600px',
  showControls = true,
  center = { lat: 15.7719, lng: 35.0826 },
  zoom = 12,
  routePoints = [],
  showRoute = false,
  routeColor = '#3b82f6'
}: OpenStreetMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [showRouteLayer, setShowRouteLayer] = useState(showRoute);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    fixLeafletIcon();

    mapRef.current = L.map(mapContainerRef.current).setView(
      [center.lat, center.lng],
      zoom
    );

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Initialize route layer
    routeLayerRef.current = L.layerGroup().addTo(mapRef.current);

    setMapInitialized(true);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center.lat, center.lng, zoom]);

  // Draw route when routePoints change
  useEffect(() => {
    if (!mapRef.current || !mapInitialized || !routeLayerRef.current) return;

    // Clear existing route
    routeLayerRef.current.clearLayers();

    if (!showRouteLayer || routePoints.length < 2) return;

    const points = routePoints.map(p => [p.lat, p.lng] as [number, number]);
    
    // Draw the route line
    const polyline = L.polyline(points, {
      color: routeColor,
      weight: 4,
      opacity: 0.7,
      dashArray: showRouteLayer ? undefined : '10, 10',
    }).addTo(routeLayerRef.current);

    // Add markers for origin and destination
    routePoints.forEach((point, index) => {
      const isOrigin = point.type === 'origin';
      const isDestination = point.type === 'destination';
      
      if (isOrigin || isDestination) {
        const markerIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div class="route-marker ${isOrigin ? 'origin' : 'destination'}">
              <div class="marker-pulse" style="background: ${isOrigin ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'};">
                <div class="marker-inner" style="background: ${isOrigin ? '#22c55e' : '#ef4444'}; border-color: white;">
                  <span class="marker-label">${isOrigin ? 'A' : 'B'}</span>
                </div>
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20]
        });

        const marker = L.marker([point.lat, point.lng], { icon: markerIcon })
          .addTo(routeLayerRef.current!)
          .bindPopup(`
            <div class="p-2">
              <div class="font-bold">${isOrigin ? 'Origin' : 'Destination'}</div>
              ${point.label ? `<div class="text-sm">${point.label}</div>` : ''}
              <div class="text-xs text-gray-500">
                ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}
              </div>
            </div>
          `);

        if (isOrigin) {
          marker.on('click', () => {
            // Optional: handle origin click
          });
        }
      }
    });

    // Fit bounds to show entire route
    if (routePoints.length > 0) {
      const bounds = L.latLngBounds(routePoints.map(p => [p.lat, p.lng]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

  }, [routePoints, showRouteLayer, mapInitialized, routeColor]);

  // Update vehicle markers
  useEffect(() => {
    if (!mapRef.current || !mapInitialized) return;

    // Create or update markers for each vehicle
    vehicles.forEach(vehicle => {
      const { lat, lng } = vehicle.coordinates;
      
      const markerColor = 
        vehicle.status === 'moving' ? '#22c55e' :
        vehicle.status === 'idle' ? '#eab308' :
        vehicle.status === 'offline' ? '#ef4444' : '#a855f7';

      const markerHtml = `
        <div class="vehicle-marker ${vehicle.id === selectedVehicleId ? 'selected' : ''}">
          <div class="marker-pulse" style="background: ${markerColor}20;">
            <div class="marker-inner" style="background: ${markerColor}; border-color: white;">
              ${vehicle.speed > 0 ? `<div class="marker-speed">${Math.round(vehicle.speed)}</div>` : ''}
            </div>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: markerHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
      });

      const driverName = vehicle.driverName || vehicle.driver || 'Unknown';

      if (markersRef.current[vehicle.id]) {
        // Update existing marker
        markersRef.current[vehicle.id].setLatLng([lat, lng]);
        markersRef.current[vehicle.id].setIcon(customIcon);
        markersRef.current[vehicle.id].setPopupContent(`
          <div class="p-2">
            <div class="font-bold">${vehicle.make} ${vehicle.model}</div>
            <div class="text-sm">${vehicle.plate}</div>
            <div class="text-sm">Driver: ${driverName}</div>
            <div class="text-sm">Speed: ${Math.round(vehicle.speed)} km/h</div>
            <div class="text-xs text-gray-500">
              Last: ${new Date(vehicle.lastUpdate).toLocaleTimeString()}
            </div>
          </div>
        `);
      } else {
        // Create new marker
        const marker = L.marker([lat, lng], { icon: customIcon })
          .addTo(mapRef.current!)
          .bindPopup(`
            <div class="p-2">
              <div class="font-bold">${vehicle.make} ${vehicle.model}</div>
              <div class="text-sm">${vehicle.plate}</div>
              <div class="text-sm">Driver: ${driverName}</div>
              <div class="text-sm">Speed: ${Math.round(vehicle.speed)} km/h</div>
              <div class="text-xs text-gray-500">
                Last: ${new Date(vehicle.lastUpdate).toLocaleTimeString()}
              </div>
            </div>
          `);

        marker.on('click', () => {
          onVehicleSelect(vehicle.id);
        });

        markersRef.current[vehicle.id] = marker;
      }
    });

    // Remove markers for vehicles that no longer exist
    Object.keys(markersRef.current).forEach(id => {
      if (!vehicles.find(v => v.id === id)) {
        mapRef.current?.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });

    // If a vehicle is selected, center map on it (but not if we're showing a route)
    if (selectedVehicleId && markersRef.current[selectedVehicleId] && !showRouteLayer) {
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      if (vehicle) {
        mapRef.current.setView(
          [vehicle.coordinates.lat, vehicle.coordinates.lng],
          15
        );
        markersRef.current[selectedVehicleId].openPopup();
      }
    }

  }, [vehicles, selectedVehicleId, mapInitialized, onVehicleSelect, showRouteLayer]);

  // Handle map controls
  const zoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const zoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const centerOnSelected = () => {
    if (selectedVehicleId && markersRef.current[selectedVehicleId]) {
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      if (vehicle) {
        mapRef.current?.setView(
          [vehicle.coordinates.lat, vehicle.coordinates.lng],
          15
        );
      }
    }
  };

  const toggleRoute = () => {
    setShowRouteLayer(!showRouteLayer);
  };

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full rounded-lg" />
      
      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <Button
            variant="secondary"
            size="icon"
            className="shadow-lg"
            onClick={zoomIn}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="shadow-lg"
            onClick={zoomOut}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="shadow-lg"
            onClick={centerOnSelected}
            disabled={!selectedVehicleId}
          >
            <Navigation className="h-4 w-4" />
          </Button>
          {routePoints.length > 0 && (
            <Button
              variant={showRouteLayer ? "default" : "secondary"}
              size="icon"
              className="shadow-lg"
              onClick={toggleRoute}
            >
              <Route className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
        <div className="text-sm font-medium mb-2">Vehicle Status</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs">Moving</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-xs">Idle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs">Offline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-xs">Maintenance</span>
          </div>
        </div>
        {routePoints.length > 0 && (
          <>
            <div className="border-t my-2 pt-2">
              <div className="text-sm font-medium mb-2">Route</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs">Origin (A)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs">Destination (B)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-blue-500 rounded"></div>
                  <span className="text-xs">Route</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        .vehicle-marker {
          cursor: pointer;
          transition: transform 0.2s;
        }
        
        .vehicle-marker.selected .marker-pulse {
          transform: scale(1.2);
        }
        
        .route-marker {
          cursor: pointer;
        }
        
        .route-marker.origin .marker-pulse,
        .route-marker.destination .marker-pulse {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 1.5s ease-out infinite;
        }
        
        .marker-pulse {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 1.5s ease-out infinite;
        }
        
        .marker-inner {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .marker-label {
          color: white;
          font-size: 12px;
          font-weight: bold;
        }
        
        .marker-speed {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.8);
          color: white;
          font-size: 10px;
          padding: 2px 4px;
          border-radius: 4px;
          white-space: nowrap;
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
        
        .leaflet-popup-content {
          margin: 8px;
          min-width: 200px;
        }
      `}</style>
    </div>
  );
}