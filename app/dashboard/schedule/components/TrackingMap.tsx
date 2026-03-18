// app/dashboard/schedules/components/TrackingMap.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, AlertCircle } from "lucide-react";

interface TrackingMapProps {
  fromLocation: string;
  toLocation: string;
  driverName?: string;
  vehicleInfo?: string;
  scheduleId?: string;
}

export function TrackingMap({ 
  fromLocation, 
  toLocation, 
  driverName, 
  vehicleInfo,
  scheduleId 
}: TrackingMapProps) {
  const [showMap, setShowMap] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<string>("Calculating...");
  const [distance, setDistance] = useState<string>("Calculating...");

  // This would integrate with Google Maps API
  // You'll need to add Google Maps JavaScript API to your project
  
  useEffect(() => {
    // Simulate fetching route information
    const fetchRouteInfo = async () => {
      // In a real implementation, you would call Google Maps Directions API
      setTimeout(() => {
        setEstimatedTime("2 hours 15 mins");
        setDistance("85 km");
      }, 1000);
    };

    fetchRouteInfo();
  }, [fromLocation, toLocation]);

  // For Google Maps integration, you'll need:
  // 1. Google Maps API key
  // 2. Add script to your app
  // 3. Use @react-google-maps/api library or similar

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Route Tracking
        </CardTitle>
        <CardDescription>
          Real-time tracking and route information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Pickup Location</p>
                <p className="text-sm text-muted-foreground">{fromLocation}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium">Destination</p>
                <p className="text-sm text-muted-foreground">{toLocation}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Estimated Time:</span>
              <span className="text-sm font-medium">{estimatedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Distance:</span>
              <span className="text-sm font-medium">{distance}</span>
            </div>
            {driverName && (
              <div className="flex justify-between">
                <span className="text-sm">Driver:</span>
                <span className="text-sm font-medium">{driverName}</span>
              </div>
            )}
            {vehicleInfo && (
              <div className="flex justify-between">
                <span className="text-sm">Vehicle:</span>
                <span className="text-sm font-medium">{vehicleInfo}</span>
              </div>
            )}
          </div>
        </div>

        <div className="h-[300px] border rounded-lg flex items-center justify-center bg-muted/20">
          <div className="text-center space-y-2">
            {showMap ? (
              <>
                <p className="text-muted-foreground">Google Maps would be displayed here</p>
                <p className="text-sm text-muted-foreground">
                  Showing route from {fromLocation} to {toLocation}
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">Map view</p>
                <p className="text-sm text-muted-foreground">
                  Enable Google Maps integration to see real-time tracking
                </p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => setShowMap(true)}
                >
                  Show Map Preview
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" disabled>
            <Navigation className="mr-2 h-4 w-4" />
            Start Navigation
          </Button>
          <Button variant="outline" className="flex-1">
            Get Directions
          </Button>
        </div>

        <div className="text-xs text-muted-foreground pt-2">
          <p>Note: For full Google Maps integration, you'll need to:</p>
          <ol className="list-decimal pl-4 mt-1 space-y-1">
            <li>Get a Google Maps API key</li>
            <li>Enable Directions API and Maps JavaScript API</li>
            <li>Add billing information to your Google Cloud account</li>
            <li>Implement @react-google-maps/api or similar library</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}