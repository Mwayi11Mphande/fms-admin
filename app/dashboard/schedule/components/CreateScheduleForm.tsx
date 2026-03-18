// app/dashboard/schedules/components/CreateScheduleForm.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Loader2, User, Truck, AlertCircle, MapPin, Navigation } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DriverOption {
  id: string;
  name: string;
  license: string;
  status: string;
}

interface VehicleOption {
  id: string;
  make: string;
  model: string;
  plate: string;
  status: string;
}

interface CreateScheduleFormProps {
  drivers: DriverOption[];
  vehicles: VehicleOption[];
  onSubmit: (data: any) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
}

export function CreateScheduleForm({ drivers, vehicles, onSubmit, onCancel }: CreateScheduleFormProps) {
  const [loading, setLoading] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    driverId: "",
    vehicleId: "",
    startTime: new Date(),
    endTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000), // 2 hours later
    scheduleType: "delivery" as const,
    fromLocation: "",
    toLocation: "",
    fromLat: "",
    fromLng: "",
    toLat: "",
    toLng: "",
    status: "scheduled" as const,
    estimatedDistance: "",
    estimatedDuration: "",
    notes: "",
  });

  console.log("Form props - Drivers:", drivers.length, "Vehicles:", vehicles.length);

  // Fallback data in case empty arrays
  const displayDrivers = drivers.length > 0 ? drivers : [
    { id: "no-drivers", name: "No drivers available", license: "", status: "inactive" }
  ];

  const displayVehicles = vehicles.length > 0 ? vehicles : [
    { id: "no-vehicles", name: "No vehicles available", make: "", model: "", plate: "", status: "unavailable" }
  ];

  // Function to geocode an address (simplified - you'd want to use a real geocoding service)
  const geocodeAddress = async (address: string, type: 'from' | 'to') => {
    try {
      // This is a placeholder - in production, use a geocoding service like Google Maps, Mapbox, etc.
      // For demo purposes, we'll set some default coordinates
      alert(`In production, this would geocode "${address}" to get coordinates.
            \nFor now, please enter coordinates manually or use a geocoding service.`);
      
      // Example of how you might implement with a geocoding API:
      // const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=YOUR_TOKEN`);
      // const data = await response.json();
      // if (data.features && data.features[0]) {
      //   const [lng, lat] = data.features[0].center;
      //   if (type === 'from') {
      //     setFormData(prev => ({ ...prev, fromLat: lat.toString(), fromLng: lng.toString() }));
      //   } else {
      //     setFormData(prev => ({ ...prev, toLat: lat.toString(), toLng: lng.toString() }));
      //   }
      // }
    } catch (error) {
      console.error('Geocoding failed:', error);
    }
  };

  // In your handleSubmit function, update the FormData creation:

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title || !formData.driverId || !formData.vehicleId || 
        !formData.fromLocation || !formData.toLocation) {
      alert("Please fill in all required fields");
      return;
    }

    if (formData.driverId === "no-drivers" || formData.vehicleId === "no-vehicles") {
      alert("Please ensure drivers and vehicles are available in the system");
      return;
    }

    // Validate coordinates if they're required for tracking
    if (showCoordinates && (!formData.fromLat || !formData.fromLng || !formData.toLat || !formData.toLng)) {
      alert("Please enter coordinates for both locations to enable tracking");
      return;
    }

    setLoading(true);
    
    try {
      // Prepare data for submission
      const submitData = new FormData();

      // Log what we're sending
      console.log('Sending form data:', {
        title: formData.title,
        driverId: formData.driverId,
        vehicleId: formData.vehicleId,
        startTime: formData.startTime.toISOString(),
        endTime: formData.endTime.toISOString(),
        scheduleType: formData.scheduleType,
        fromLocation: formData.fromLocation,
        toLocation: formData.toLocation,
      });
      
      // Add all form fields with null checks - ensure values are strings
      submitData.append('title', formData.title || '');
      if (formData.description) submitData.append('description', formData.description);
      submitData.append('driverId', formData.driverId || '');
      submitData.append('vehicleId', formData.vehicleId || '');
      submitData.append('startTime', formData.startTime.toISOString());
      submitData.append('endTime', formData.endTime.toISOString());
      submitData.append('scheduleType', formData.scheduleType || 'delivery');
      submitData.append('fromLocation', formData.fromLocation || '');
      submitData.append('toLocation', formData.toLocation || '');
      
      // Add coordinates if provided (with null checks)
      if (formData.fromLat) submitData.append('fromLat', formData.fromLat.toString());
      if (formData.fromLng) submitData.append('fromLng', formData.fromLng.toString());
      if (formData.toLat) submitData.append('toLat', formData.toLat.toString());
      if (formData.toLng) submitData.append('toLng', formData.toLng.toString());
      
      submitData.append('status', formData.status || 'scheduled');
      if (formData.estimatedDistance) submitData.append('estimatedDistance', formData.estimatedDistance.toString());
      if (formData.estimatedDuration) submitData.append('estimatedDuration', formData.estimatedDuration.toString());
      if (formData.notes) submitData.append('notes', formData.notes);

      // Log the form data for debugging
      console.log('Submitting form data:');
      for (let [key, value] of submitData.entries()) {
        console.log(key, value);
      }

      const result = await onSubmit(submitData);
      if (!result.success) {
        alert(`Error: ${result.error}`);
      } else {
        // Reset form on success
        setFormData({
          title: "",
          description: "",
          driverId: "",
          vehicleId: "",
          startTime: new Date(),
          endTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000),
          scheduleType: "delivery",
          fromLocation: "",
          toLocation: "",
          fromLat: "",
          fromLng: "",
          toLat: "",
          toLng: "",
          status: "scheduled",
          estimatedDistance: "",
          estimatedDuration: "",
          notes: "",
        });
        setShowCoordinates(false);
        alert("Schedule created successfully!");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to create schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Trip Schedule</CardTitle>
        <CardDescription>
          Assign driver, vehicle, and define trip details
        </CardDescription>
        {(drivers.length === 0 || vehicles.length === 0) && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">
              {drivers.length === 0 && vehicles.length === 0 
                ? "No drivers or vehicles found. Please add drivers and vehicles first." 
                : drivers.length === 0 
                  ? "No drivers found. Please add drivers first." 
                  : "No vehicles found. Please add vehicles first."}
            </span>
          </div>
        )}
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Trip Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Trip Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Trip Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Goods Delivery to Downtown"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Schedule Type *</Label>
                <Select
                  value={formData.scheduleType}
                  onValueChange={(value: any) => setFormData({...formData, scheduleType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Assign Driver & Vehicle */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Assign Resources</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="driver">Assign Driver *</Label>
                <Select
                  value={formData.driverId}
                  onValueChange={(value) => setFormData({...formData, driverId: value})}
                  required
                  disabled={displayDrivers.length === 0 || displayDrivers[0].id === "no-drivers"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={displayDrivers.length > 0 ? "Select driver" : "No drivers available"} />
                  </SelectTrigger>
                  <SelectContent>
                    {displayDrivers.map((driver) => (
                      <SelectItem 
                        key={driver.id} 
                        value={driver.id}
                        disabled={driver.id === "no-drivers"}
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div className="flex flex-col">
                            <span>{driver.name}</span>
                            {driver.license && (
                              <span className="text-xs text-muted-foreground">
                                License: {driver.license}
                              </span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {displayDrivers.length > 0 && displayDrivers[0].id !== "no-drivers" 
                    ? `${displayDrivers.length} driver(s) available` 
                    : "Please add drivers first"}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle">Assign Vehicle *</Label>
                <Select
                  value={formData.vehicleId}
                  onValueChange={(value) => setFormData({...formData, vehicleId: value})}
                  required
                  disabled={displayVehicles.length === 0 || displayVehicles[0].id === "no-vehicles"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={displayVehicles.length > 0 ? "Select vehicle" : "No vehicles available"} />
                  </SelectTrigger>
                  <SelectContent>
                    {displayVehicles.map((vehicle) => (
                      <SelectItem 
                        key={vehicle.id} 
                        value={vehicle.id}
                        disabled={vehicle.id === "no-vehicles"}
                      >
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          <div className="flex flex-col">
                            <span>{vehicle.make} {vehicle.model}</span>
                            <span className="text-xs text-muted-foreground">
                              Plate: {vehicle.plate}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {displayVehicles.length > 0 && displayVehicles[0].id !== "no-vehicles" 
                    ? `${displayVehicles.length} vehicle(s) available` 
                    : "Please add vehicles first"}
                </p>
              </div>
            </div>
          </div>

          {/* Trip Date & Route */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Trip Date & Route</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCoordinates(!showCoordinates)}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {showCoordinates ? "Hide Coordinates" : "Add Coordinates for Tracking"}
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date & Time *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startTime && "text-muted-foreground"
                      )}
                      type="button"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startTime ? format(formData.startTime, "PPP p") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.startTime}
                      onSelect={(date) => date && setFormData({...formData, startTime: date})}
                      initialFocus
                    />
                    <div className="p-3 border-t">
                      <Input
                        type="time"
                        value={format(formData.startTime, "HH:mm")}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':');
                          const newDate = new Date(formData.startTime);
                          newDate.setHours(parseInt(hours), parseInt(minutes));
                          setFormData({...formData, startTime: newDate});
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date & Time *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.endTime && "text-muted-foreground"
                      )}
                      type="button"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endTime ? format(formData.endTime, "PPP p") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.endTime}
                      onSelect={(date) => date && setFormData({...formData, endTime: date})}
                      initialFocus
                    />
                    <div className="p-3 border-t">
                      <Input
                        type="time"
                        value={format(formData.endTime, "HH:mm")}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':');
                          const newDate = new Date(formData.endTime);
                          newDate.setHours(parseInt(hours), parseInt(minutes));
                          setFormData({...formData, endTime: newDate});
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* From Location with Coordinates */}
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromLocation">From Location *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="fromLocation"
                      placeholder="e.g., Warehouse A, 123 Main St"
                      value={formData.fromLocation}
                      onChange={(e) => setFormData({...formData, fromLocation: e.target.value})}
                      required
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => geocodeAddress(formData.fromLocation, 'from')}
                      title="Get coordinates from address"
                    >
                      <Navigation className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {showCoordinates && (
                  <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-muted">
                    <div className="space-y-2">
                      <Label htmlFor="fromLat">From Latitude</Label>
                      <Input
                        id="fromLat"
                        type="number"
                        step="any"
                        placeholder="e.g., 37.7749"
                        value={formData.fromLat}
                        onChange={(e) => setFormData({...formData, fromLat: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fromLng">From Longitude</Label>
                      <Input
                        id="fromLng"
                        type="number"
                        step="any"
                        placeholder="e.g., -122.4194"
                        value={formData.fromLng}
                        onChange={(e) => setFormData({...formData, fromLng: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* To Location with Coordinates */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="toLocation">To Location *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="toLocation"
                      placeholder="e.g., Downtown Mall, 456 Oak St"
                      value={formData.toLocation}
                      onChange={(e) => setFormData({...formData, toLocation: e.target.value})}
                      required
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => geocodeAddress(formData.toLocation, 'to')}
                      title="Get coordinates from address"
                    >
                      <Navigation className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {showCoordinates && (
                  <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-muted">
                    <div className="space-y-2">
                      <Label htmlFor="toLat">To Latitude</Label>
                      <Input
                        id="toLat"
                        type="number"
                        step="any"
                        placeholder="e.g., 37.7749"
                        value={formData.toLat}
                        onChange={(e) => setFormData({...formData, toLat: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="toLng">To Longitude</Label>
                      <Input
                        id="toLng"
                        type="number"
                        step="any"
                        placeholder="e.g., -122.4194"
                        value={formData.toLng}
                        onChange={(e) => setFormData({...formData, toLng: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Distance and Duration */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="estimatedDistance">Estimated Distance (km)</Label>
                <Input
                  id="estimatedDistance"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g., 45"
                  value={formData.estimatedDistance}
                  onChange={(e) => setFormData({...formData, estimatedDistance: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedDuration">Estimated Duration (hours)</Label>
                <Input
                  id="estimatedDuration"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g., 3"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({...formData, estimatedDuration: e.target.value})}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions or requirements..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Status</h3>
            <div className="flex flex-wrap gap-4">
              {["scheduled", "in_progress", "completed", "cancelled", "delayed"].map((status) => (
                <div key={status} className="flex items-center gap-2">
                  <input
                    type="radio"
                    id={status}
                    name="status"
                    value={status}
                    checked={formData.status === status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="h-4 w-4"
                  />
                  <Label htmlFor={status} className="capitalize cursor-pointer">
                    {status.replace('_', ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking Info Alert */}
          {showCoordinates && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">Tracking Enabled</h4>
                  <p className="text-sm text-blue-600">
                    Coordinates will be used for real-time vehicle tracking on the map.
                    {(!formData.fromLat || !formData.fromLng || !formData.toLat || !formData.toLng) && (
                      <span className="block mt-1 font-medium">
                        ⚠️ Please enter all coordinates to enable full tracking functionality.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading || displayDrivers.length === 0 || displayVehicles.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Schedule"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}