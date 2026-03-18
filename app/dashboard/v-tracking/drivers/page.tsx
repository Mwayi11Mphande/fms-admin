// app/dashboard/v-tracking/drivers/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Navigation, 
  MapPin, 
  Clock, 
  Car, 
  User, 
  Phone, 
  Mail,
  AlertCircle,
  RefreshCw,
  Eye,
  Truck,
  Fuel,
  Gauge,
  Activity
} from "lucide-react";
import { getDrivers } from "@/actions/drivers";
import { getVehicles } from "@/actions/vehicle";
import { getAllVehiclesWithLocations } from "@/actions/tracking";
import { formatDistanceToNow } from "date-fns";
import { OpenStreetMap, MapVehicle } from "@/components/maps/OpenStreetMap";
import { syncDriverVehicleAssignments } from "@/actions/vehicle-assignment";

// Types
interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employmentStatus: 'active' | 'inactive' | 'on_leave' | 'terminated';
  assignedVehicleId?: string;
  currentLocation?: {
    lat: number;
    lng: number;
    timestamp: Date;
    speed?: number;
  };
  lastActive?: Date;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  plate: string;
  status: string;
  driverId?: string;
  coordinates: { lat: number; lng: number };
  speed: number;
  lastUpdate: Date;
}

// Helper function to convert vehicle status to map status type
const getMapStatus = (status: string, speed: number): 'moving' | 'idle' | 'offline' | 'maintenance' => {
  if (status === 'maintenance') return 'maintenance';
  if (status === 'offline') return 'offline';
  if (speed > 5) return 'moving';
  return 'idle';
};

export default function DriverTrackingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [mapVehicles, setMapVehicles] = useState<MapVehicle[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>();
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isDriverDialogOpen, setIsDriverDialogOpen] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [syncing, setSyncing] = useState(false);


  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      // Get all drivers
      const driversResult = await getDrivers({ limit: 100 });
      let driversData: Driver[] = [];
      if (driversResult.success) {
        driversData = driversResult.data as Driver[];
        setDrivers(driversData);
      }

      // Get all vehicles with locations
      const vehiclesResult = await getAllVehiclesWithLocations();
      if (vehiclesResult.success) {
        const vehiclesData = vehiclesResult.data as Vehicle[];
        setVehicles(vehiclesData);
        
        // Transform vehicles to MapVehicle type for the map
        const transformedVehicles: MapVehicle[] = vehiclesData.map(vehicle => {
          const driver = driversData.find(d => d.assignedVehicleId === vehicle.id);
          return {
            id: vehicle.id,
            make: vehicle.make,
            model: vehicle.model,
            plate: vehicle.plate,
            status: getMapStatus(vehicle.status, vehicle.speed),
            driverName: driver ? `${driver.firstName} ${driver.lastName}` : undefined,
            driverId: vehicle.driverId,
            speed: vehicle.speed,
            coordinates: vehicle.coordinates,
            lastUpdate: vehicle.lastUpdate
          };
        });
        setMapVehicles(transformedVehicles);
      }

      setLastUpdateTime(new Date());
    } catch (error) {
      console.error("Error loading tracking data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Auto refresh
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      loadData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncDriverVehicleAssignments();
      if (result.success) {
        // Show success message
        alert(`Sync complete: ${result.message}`);
        await loadData();
      } else {
        alert(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Error syncing:", error);
    } finally {
      setSyncing(false);
    }
  };

  // Filter drivers based on search
  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = 
      driver.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone?.includes(searchQuery);
    
    const matchesStatus = statusFilter === "all" || driver.employmentStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

 // Get vehicle for a driver - using both directions
const getDriverVehicle = (driverId: string) => {
  // First check if vehicle has this driver assigned (from tracking data)
  const vehicleFromTracking = vehicles.find(v => v.driverId === driverId);
  if (vehicleFromTracking) return vehicleFromTracking;
  
  // Then check if driver has vehicle assigned (from driver data)
  const driver = drivers.find(d => d.id === driverId);
  if (driver?.assignedVehicleId) {
    return vehicles.find(v => v.id === driver.assignedVehicleId);
  }
  
  return null;
};

  // Get map vehicle for a driver
  const getDriverMapVehicle = (driverId: string) => {
    const vehicle = getDriverVehicle(driverId);
    if (!vehicle) return null;
    return mapVehicles.find(v => v.id === vehicle.id);
  };

  // Handle driver selection for tracking
  const handleTrackDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    if (driver.assignedVehicleId) {
      setSelectedDriverId(driver.assignedVehicleId);
    }
    setIsDriverDialogOpen(true);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800 border-green-200",
      inactive: "bg-gray-100 text-gray-800 border-gray-200",
      on_leave: "bg-yellow-100 text-yellow-800 border-yellow-200",
      terminated: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  // Get vehicle status color
  const getVehicleStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      moving: "bg-green-100 text-green-800",
      idle: "bg-yellow-100 text-yellow-800",
      offline: "bg-red-100 text-red-800",
      maintenance: "bg-purple-100 text-purple-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Get driver initials
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Driver Tracking</h1>
          <p className="text-muted-foreground mt-1">
            Search and track drivers in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            Last update: {formatDistanceToNow(lastUpdateTime)} ago
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
          >
            {isAutoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync Assignments
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Drivers</p>
                <p className="text-2xl font-bold">{drivers.length}</p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Drivers</p>
                <p className="text-2xl font-bold text-green-600">
                  {drivers.filter(d => d.employmentStatus === 'active').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On Road</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {mapVehicles.filter(v => v.status === 'moving').length}
                </p>
              </div>
              <Navigation className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">With Vehicle</p>
                <p className="text-2xl font-bold">
                  {drivers.filter(d => d.assignedVehicleId).length}
                </p>
              </div>
              <Car className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Find Drivers</CardTitle>
          <CardDescription>
            Search by name, email, or phone number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search drivers..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Drivers Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <Card className="col-span-full">
            <CardContent className="py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading drivers...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredDrivers.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12">
              <div className="text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No drivers found</h3>
                <p className="text-muted-foreground mt-2">
                  Try adjusting your search or filter
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredDrivers.map((driver) => {
            const vehicle = getDriverVehicle(driver.id);
            const mapVehicle = getDriverMapVehicle(driver.id);
            
            return (
              <Card key={driver.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10">
                          {getInitials(driver.firstName, driver.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{driver.firstName} {driver.lastName}</h3>
                        <p className="text-sm text-muted-foreground">{driver.email}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(driver.employmentStatus)}>
                      {driver.employmentStatus.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{driver.phone}</span>
                    </div>
                    
                    {mapVehicle ? (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span>{mapVehicle.make} {mapVehicle.model} - {mapVehicle.plate}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">
                            {mapVehicle.coordinates.lat.toFixed(4)}, {mapVehicle.coordinates.lng.toFixed(4)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Gauge className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{Math.round(mapVehicle.speed)} km/h</span>
                          </div>
                          <Badge variant="outline" className={getVehicleStatusColor(mapVehicle.status)}>
                            {mapVehicle.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Last update: {formatDistanceToNow(mapVehicle.lastUpdate)} ago</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-amber-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>No vehicle assigned</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => handleTrackDriver(driver)}
                      disabled={!mapVehicle}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Track Driver
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => router.push(`/dashboard/driver_m/${driver.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Driver Tracking Dialog */}
      <Dialog open={isDriverDialogOpen} onOpenChange={setIsDriverDialogOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Track Driver: {selectedDriver?.firstName} {selectedDriver?.lastName}</DialogTitle>
            <DialogDescription>
              Real-time location and vehicle information
            </DialogDescription>
          </DialogHeader>

          {selectedDriver && (
            <Tabs defaultValue="map" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="map">Live Map</TabsTrigger>
                <TabsTrigger value="details">Driver Details</TabsTrigger>
                <TabsTrigger value="history">Location History</TabsTrigger>
              </TabsList>

              <TabsContent value="map" className="mt-4">
                {selectedDriver.assignedVehicleId ? (
                  <div className="space-y-4">
                    <OpenStreetMap
                      vehicles={mapVehicles.filter(v => v.id === selectedDriver.assignedVehicleId)}
                      selectedVehicleId={selectedDriver.assignedVehicleId}
                      onVehicleSelect={() => {}}
                      height="500px"
                      showControls={true}
                    />
                    
                    {/* Vehicle Info Panel */}
                    {(() => {
                      const vehicle = mapVehicles.find(v => v.id === selectedDriver.assignedVehicleId);
                      return vehicle ? (
                        <Card>
                          <CardContent className="p-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Vehicle</p>
                                <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                                <p className="text-xs">{vehicle.plate}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Speed</p>
                                <p className="font-medium">{Math.round(vehicle.speed)} km/h</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Status</p>
                                <Badge className={getVehicleStatusColor(vehicle.status)}>
                                  {vehicle.status}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Last Update</p>
                                <p className="text-sm">{formatDistanceToNow(vehicle.lastUpdate)} ago</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : null;
                    })()}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold">No Vehicle Assigned</h3>
                        <p className="text-muted-foreground mt-2">
                          This driver doesn't have a vehicle assigned
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="details" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold">Personal Information</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{selectedDriver.firstName} {selectedDriver.lastName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{selectedDriver.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{selectedDriver.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(selectedDriver.employmentStatus)}>
                              {selectedDriver.employmentStatus}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-semibold">Vehicle Information</h3>
                        {(() => {
                          const vehicle = mapVehicles.find(v => v.id === selectedDriver.assignedVehicleId);
                          return vehicle ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{vehicle.make} {vehicle.model}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono">{vehicle.plate}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Fuel className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Fuel: 75%</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No vehicle assigned</p>
                          );
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">Location History</h3>
                      <p className="text-muted-foreground mt-2">
                        View past locations and routes
                      </p>
                      <Button className="mt-4" variant="outline">
                        Load History
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}