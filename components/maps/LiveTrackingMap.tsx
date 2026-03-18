// components/maps/LiveTrackingMap.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Navigation, 
  MapPin, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  Maximize2,
  Compass,
  Route,
  Clock,
  Fuel,
  User,
  Car
} from "lucide-react";

// Map container style
const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem',
};

// Default center (San Francisco)
const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194,
};

// Vehicle icon configurations
const vehicleIcons: Record<string, any> = {
  moving: {
    path: 'M29.395,0H17.636c-3.117,0-5.643,3.467-5.643,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644V6.584C35.037,3.467,32.511,0,29.395,0z M34.05,14.188v11.665l-2.729,0.351v-4.806L34.05,14.188z M32.618,10.773c-1.016,3.9-2.219,8.51-2.219,8.51H16.631l-2.222-8.51C14.409,10.773,23.293,7.755,32.618,10.773z M15.741,21.713v4.492l-2.73-0.349V14.502L15.741,21.713z M13.011,37.938V27.579l2.73,0.343v8.196L13.011,37.938z M14.568,40.882l2.218-3.336h13.771l2.219,3.336H14.568z M31.321,35.805v-7.872l2.729-0.355v10.048L31.321,35.805z',
    fillColor: '#10B981',
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: '#FFFFFF',
    scale: 1,
    rotation: 0,
  },
  idle: {
    path: 'M29.395,0H17.636c-3.117,0-5.643,3.467-5.643,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644V6.584C35.037,3.467,32.511,0,29.395,0z M34.05,14.188v11.665l-2.729,0.351v-4.806L34.05,14.188z M32.618,10.773c-1.016,3.9-2.219,8.51-2.219,8.51H16.631l-2.222-8.51C14.409,10.773,23.293,7.755,32.618,10.773z M15.741,21.713v4.492l-2.73-0.349V14.502L15.741,21.713z M13.011,37.938V27.579l2.73,0.343v8.196L13.011,37.938z M14.568,40.882l2.218-3.336h13.771l2.219,3.336H14.568z M31.321,35.805v-7.872l2.729-0.355v10.048L31.321,35.805z',
    fillColor: '#F59E0B',
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: '#FFFFFF',
    scale: 1,
    rotation: 0,
  },
  offline: {
    path: 'M29.395,0H17.636c-3.117,0-5.643,3.467-5.643,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644V6.584C35.037,3.467,32.511,0,29.395,0z M34.05,14.188v11.665l-2.729,0.351v-4.806L34.05,14.188z M32.618,10.773c-1.016,3.9-2.219,8.51-2.219,8.51H16.631l-2.222-8.51C14.409,10.773,23.293,7.755,32.618,10.773z M15.741,21.713v4.492l-2.73-0.349V14.502L15.741,21.713z M13.011,37.938V27.579l2.73,0.343v8.196L13.011,37.938z M14.568,40.882l2.218-3.336h13.771l2.219,3.336H14.568z M31.321,35.805v-7.872l2.729-0.355v10.048L31.321,35.805z',
    fillColor: '#EF4444',
    fillOpacity: 0.7,
    strokeWeight: 2,
    strokeColor: '#FFFFFF',
    scale: 1,
    rotation: 0,
  },
  maintenance: {
    path: 'M29.395,0H17.636c-3.117,0-5.643,3.467-5.643,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644V6.584C35.037,3.467,32.511,0,29.395,0z M34.05,14.188v11.665l-2.729,0.351v-4.806L34.05,14.188z M32.618,10.773c-1.016,3.9-2.219,8.51-2.219,8.51H16.631l-2.222-8.51C14.409,10.773,23.293,7.755,32.618,10.773z M15.741,21.713v4.492l-2.73-0.349V14.502L15.741,21.713z M13.011,37.938V27.579l2.73,0.343v8.196L13.011,37.938z M14.568,40.882l2.218-3.336h13.771l2.219,3.336H14.568z M31.321,35.805v-7.872l2.729-0.355v10.048L31.321,35.805z',
    fillColor: '#8B5CF6',
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: '#FFFFFF',
    scale: 1,
    rotation: 0,
  },
};

interface Vehicle {
  id: string;
  make: string;
  model: string;
  plate: string;
  status: 'moving' | 'idle' | 'offline' | 'maintenance';
  driver: string;
  speed: number;
  location: string;
  coordinates: { lat: number; lng: number };
  fuel: number;
  lastUpdate: Date;
  heading: string;
  distance: number;
}

interface LiveTrackingMapProps {
  vehicles: Vehicle[];
  selectedVehicleId?: string;
  onVehicleSelect?: (vehicleId: string) => void;
  height?: string;
  showControls?: boolean;
  apiKey: string;
}

export function LiveTrackingMap({ 
  vehicles, 
  selectedVehicleId, 
  onVehicleSelect, 
  height = '500px',
  showControls = true,
  apiKey 
}: LiveTrackingMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ['places', 'marker'],
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(10);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle vehicle selection
  useEffect(() => {
    if (selectedVehicleId) {
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      if (vehicle) {
        setSelectedVehicle(vehicle);
        setMapCenter(vehicle.coordinates);
        if (mapRef.current) {
          mapRef.current.panTo(vehicle.coordinates);
          mapRef.current.setZoom(15);
        }
      }
    }
  }, [selectedVehicleId, vehicles]);

  // Calculate bounds to fit all vehicles
  const calculateBounds = () => {
    if (vehicles.length === 0) return null;
    
    const bounds = new window.google.maps.LatLngBounds();
    vehicles.forEach(vehicle => {
      bounds.extend(vehicle.coordinates);
    });
    return bounds;
  };

  // Fit map to show all vehicles
  const fitToBounds = () => {
    if (mapRef.current && vehicles.length > 0) {
      const bounds = calculateBounds();
      if (bounds) {
        mapRef.current.fitBounds(bounds);
      }
    }
  };

  // Center on selected vehicle
  const centerOnSelected = () => {
    if (selectedVehicle && mapRef.current) {
      mapRef.current.panTo(selectedVehicle.coordinates);
      mapRef.current.setZoom(15);
    }
  };

  // Get directions between two points
  const getDirections = (origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) => {
    if (!isLoaded) return;

    const directionsService = new google.maps.DirectionsService();
    
    directionsService.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        }
      }
    );
  };

  // Handle map load
  const onLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    if (vehicles.length > 0) {
      setTimeout(() => fitToBounds(), 100);
    }
  };

  // Handle marker click
  const handleMarkerClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    if (onVehicleSelect) {
      onVehicleSelect(vehicle.id);
    }
    if (mapRef.current) {
      mapRef.current.panTo(vehicle.coordinates);
      mapRef.current.setZoom(15);
    }
  };

  // Handle map click
  const handleMapClick = () => {
    setSelectedVehicle(null);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (loadError) {
    return (
      <Card className="w-full" style={{ height }}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-red-500 font-semibold">Failed to load Google Maps</div>
            <div className="text-sm text-muted-foreground mt-2">
              Please check your API key and internet connection
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className="w-full" style={{ height }}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <div className="mt-2">Loading Google Maps...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${isFullscreen ? 'fixed inset-0 z-50' : ''}`} style={{ height: isFullscreen ? '100vh' : height }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Live Tracking Map</CardTitle>
            <CardDescription>
              Real-time vehicle positions • {vehicles.length} vehicle(s) online
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {showControls && (
              <>
                <Button variant="outline" size="sm" onClick={fitToBounds}>
                  <Compass className="h-4 w-4 mr-2" />
                  View All
                </Button>
                <Button variant="outline" size="sm" onClick={centerOnSelected} disabled={!selectedVehicle}>
                  <Navigation className="h-4 w-4 mr-2" />
                  Center
                </Button>
                <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        {showControls && (
          <div className="flex gap-2 pt-2">
            <div className="flex-1">
              <Input
                placeholder="Search location or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0 relative" style={{ height: 'calc(100% - 120px)' }}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={zoom}
          onLoad={onLoad}
          onClick={handleMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: false,
            zoomControl: false,
            styles: [
              {
                featureType: "poi.business",
                elementType: "labels",
                stylers: [{ visibility: "off" }],
              },
            ],
          }}
        >
          {/* Directions */}
          {directions && <DirectionsRenderer directions={directions} />}

          {/* Vehicle Markers */}
          {vehicles.map((vehicle) => {
            const iconConfig = vehicleIcons[vehicle.status] || vehicleIcons.idle;
            
            // Calculate rotation based on heading
            const rotation = {
              'N': 0,
              'NE': 45,
              'E': 90,
              'SE': 135,
              'S': 180,
              'SW': 225,
              'W': 270,
              'NW': 315,
            }[vehicle.heading] || 0;

            return (
              <Marker
                key={vehicle.id}
                position={vehicle.coordinates}
                icon={{
                  ...iconConfig,
                  rotation,
                }}
                onClick={() => handleMarkerClick(vehicle)}
                animation={vehicle.status === 'moving' ? google.maps.Animation.BOUNCE : undefined}
              />
            );
          })}

          {/* Selected Vehicle Info Window */}
          {selectedVehicle && (
            <InfoWindow
              position={selectedVehicle.coordinates}
              onCloseClick={() => setSelectedVehicle(null)}
            >
              <div className="p-2 max-w-xs">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    <div>
                      <div className="font-semibold">{selectedVehicle.make} {selectedVehicle.model}</div>
                      <div className="text-sm text-muted-foreground">{selectedVehicle.plate}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{selectedVehicle.driver}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={vehicleIcons[selectedVehicle.status].fillColor.replace('#', 'bg-') + '100 text-' + vehicleIcons[selectedVehicle.status].fillColor.replace('#', '') + '800'}>
                      {selectedVehicle.status}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Navigation className="h-3 w-3" />
                      <span className="text-sm">{selectedVehicle.speed} mph</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>Fuel</span>
                      <span>{selectedVehicle.fuel}%</span>
                    </div>
                    <Progress value={selectedVehicle.fuel} className="h-1" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last update: {Math.floor((Date.now() - selectedVehicle.lastUpdate.getTime()) / 60000)} min ago
                    </div>
                  </div>
                  <Button size="sm" className="w-full mt-2" onClick={() => {
                    // Get directions from current location to vehicle
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition((position) => {
                        getDirections(
                          { lat: position.coords.latitude, lng: position.coords.longitude },
                          selectedVehicle.coordinates
                        );
                      });
                    }
                  }}>
                    <Route className="h-3 w-3 mr-2" />
                    Get Directions
                  </Button>
                </div>
              </div>
            </InfoWindow>
          )}

          {/* Map Controls */}
          {showControls && (
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button
                size="icon"
                variant="secondary"
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.setZoom(mapRef.current.getZoom()! + 1);
                  }
                }}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.setZoom(mapRef.current.getZoom()! - 1);
                  }
                }}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </GoogleMap>
      </CardContent>

      {/* Legend */}
      <div className="p-4 border-t">
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-sm font-medium">Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">Moving</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm">Idle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm">Offline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-sm">Maintenance</span>
          </div>
        </div>
      </div>
    </Card>
  );
}