// app/dashboard/admin/assignments/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast"; // Changed import
import { getDrivers } from "@/actions/drivers";
import { getVehicles } from "@/actions/vehicle";
import { assignVehicleToDriver, unassignVehicleFromDriver, syncDriverVehicleAssignments } from "@/actions/vehicle-assignment";
import { RefreshCw, User, Truck, Link2, Unlink } from "lucide-react";

export default function AssignmentsPage() {
  const { toast } = useToast(); // Initialize toast hook
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [driversResult, vehiclesResult] = await Promise.all([
        getDrivers({ limit: 100 }),
        getVehicles({ limit: 100 })
      ]);
      
      if (driversResult.success) {
        setDrivers(driversResult.data);
      } else {
        toast({
          title: "Error",
          description: driversResult.error || "Failed to load drivers",
          variant: "destructive",
        });
      }
      
      if (vehiclesResult.success) {
        setVehicles(vehiclesResult.data);
      } else {
        toast({
          title: "Error",
          description: vehiclesResult.error || "Failed to load vehicles",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = async (driverId: string, vehicleId: string) => {
    try {
      const result = await assignVehicleToDriver(driverId, vehicleId);
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        loadData();
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error assigning:", error);
      toast({
        title: "Error",
        description: "Failed to assign vehicle",
        variant: "destructive",
      });
    }
  };

  const handleUnassign = async (driverId: string, vehicleId: string) => {
    try {
      const result = await unassignVehicleFromDriver(driverId, vehicleId);
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        loadData();
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error unassigning:", error);
      toast({
        title: "Error",
        description: "Failed to unassign vehicle",
        variant: "destructive",
      });
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncDriverVehicleAssignments();
      if (result.success) {
        toast({
          title: "Sync Complete",
          description: result.message,
        });
        loadData();
      } else {
        toast({
          title: "Sync Failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error syncing:", error);
      toast({
        title: "Error",
        description: "Failed to sync assignments",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const getAssignedVehicle = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver?.assignedVehicleId) return null;
    return vehicles.find(v => v.id === driver.assignedVehicleId);
  };

  const getAssignedDriver = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle?.assignedDriverId) return null;
    return drivers.find(d => d.id === vehicle.assignedDriverId);
  };

  // Find inconsistencies
  const inconsistencies = drivers.filter(driver => {
    if (!driver.assignedVehicleId) return false;
    const vehicle = vehicles.find(v => v.id === driver.assignedVehicleId);
    return !vehicle || vehicle.assignedDriverId !== driver.id;
  });

  // Loading state
  if (loading && drivers.length === 0 && vehicles.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading assignments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Driver-Vehicle Assignments</h1>
          <p className="text-muted-foreground mt-1">
            Manage which vehicles are assigned to which drivers
          </p>
        </div>
        <Button onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          Sync Assignments
        </Button>
      </div>

      {inconsistencies.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <span className="font-medium">⚠️ Found {inconsistencies.length} inconsistent assignments</span>
              <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                Fix Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Unassigned Drivers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Unassigned Drivers
            </CardTitle>
            <CardDescription>
              Drivers without a vehicle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {drivers.filter(d => !d.assignedVehicleId).length === 0 ? (
              <p className="text-center text-muted-foreground py-4">All drivers have vehicles assigned</p>
            ) : (
              drivers.filter(d => !d.assignedVehicleId).map(driver => (
                <div key={driver.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium">{driver.firstName} {driver.lastName}</h3>
                      <p className="text-sm text-muted-foreground">{driver.email}</p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-50">
                      No Vehicle
                    </Badge>
                  </div>
                  <Select onValueChange={(vehicleId) => handleAssign(driver.id, vehicleId)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign a vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles
                        .filter(v => !v.assignedDriverId)
                        .map(vehicle => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.make} {vehicle.model} - {vehicle.plate}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Unassigned Vehicles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Unassigned Vehicles
            </CardTitle>
            <CardDescription>
              Vehicles without a driver
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {vehicles.filter(v => !v.assignedDriverId).length === 0 ? (
              <p className="text-center text-muted-foreground py-4">All vehicles have drivers assigned</p>
            ) : (
              vehicles.filter(v => !v.assignedDriverId).map(vehicle => (
                <div key={vehicle.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium">{vehicle.make} {vehicle.model}</h3>
                      <p className="text-sm text-muted-foreground">{vehicle.plate}</p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-50">
                      No Driver
                    </Badge>
                  </div>
                  <Select onValueChange={(driverId) => handleAssign(driverId, vehicle.id)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign a driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers
                        .filter(d => !d.assignedVehicleId)
                        .map(driver => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.firstName} {driver.lastName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Current Assignments */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Current Assignments</CardTitle>
            <CardDescription>
              Active driver-vehicle pairs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {drivers.filter(d => d.assignedVehicleId).length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No active assignments</p>
            ) : (
              <div className="grid gap-4">
                {drivers
                  .filter(d => d.assignedVehicleId)
                  .map(driver => {
                    const vehicle = getAssignedVehicle(driver.id);
                    if (!vehicle) return null;
                    
                    const isConsistent = vehicle.assignedDriverId === driver.id;
                    
                    return (
                      <div key={driver.id} className={`p-4 border rounded-lg ${!isConsistent ? 'border-yellow-300 bg-yellow-50' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-blue-100 rounded-full">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">{driver.firstName} {driver.lastName}</p>
                                <p className="text-sm text-muted-foreground">{driver.email}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Link2 className="h-4 w-4 text-green-600" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-4 justify-end">
                              <div className="text-right">
                                <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                                <p className="text-sm text-muted-foreground">{vehicle.plate}</p>
                              </div>
                              <div className="p-2 bg-purple-100 rounded-full">
                                <Truck className="h-4 w-4 text-purple-600" />
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnassign(driver.id, vehicle.id)}
                            className="ml-4"
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {!isConsistent && (
                          <div className="mt-2 text-sm text-yellow-700 bg-yellow-100 p-2 rounded">
                            ⚠️ Inconsistent: Vehicle shows different driver assigned
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}