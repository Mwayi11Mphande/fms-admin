// app/dashboard/tracking/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Navigation, 
  MapPin, 
  RefreshCw, 
  Car, 
  Clock,
  AlertTriangle,
  Route,
  Filter,
  Download,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Wifi,
  WifiOff,
  Truck,
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  Award
} from "lucide-react";
import { OpenStreetMap, RoutePoint } from "@/components/maps/OpenStreetMap";
import { 
  getAllVehiclesWithLocations, 
  getActiveTrips, 
  getSchedules,
  createTrip,
  completeTrip 
} from "@/actions/tracking";
import { searchDrivers } from "@/actions/drivers"; // You'll need to create this
import { getDriverSchedule } from "@/actions/schedules"; // You'll need to create this
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";

// Types
interface Vehicle {
  id: string;
  make: string;
  model: string;
  plate: string;
  status: 'moving' | 'idle' | 'offline' | 'maintenance';
  driver: string;
  driverId?: string;
  driverEmail?: string;
  driverPhone?: string;
  speed: number;
  location: string;
  coordinates: { lat: number; lng: number };
  fuel: number;
  lastUpdate: Date;
  batteryLevel?: number;
  signalStrength?: 'strong' | 'medium' | 'weak';
  currentTrip?: {
    id: string;
    from: string;
    to: string;
    fromLat?: number;
    fromLng?: number;
    toLat?: number;
    toLng?: number;
    progress?: number;
  };
}

interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  startTime: Date;
  startLocation: { lat: number; lng: number; address?: string };
  currentLocation?: { lat: number; lng: number };
  status: 'active' | 'completed' | 'interrupted';
  scheduleId?: string;
  estimatedEndTime?: Date;
  distance?: number;
  fromAddress?: string;
  toAddress?: string;
  fromLat?: number;
  fromLng?: number;
  toLat?: number;
  toLng?: number;
}

interface Schedule {
  id: string;
  title: string;
  driverId: string;
  vehicleId: string;
  from: string;
  to: string;
  fromLat?: number;
  fromLng?: number;
  toLat?: number;
  toLng?: number;
  status: string;
  startTime?: Date;
  endTime?: Date;
}

interface SearchResult {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  vehicle?: {
    id: string;
    make: string;
    model: string;
    plate: string;
  };
  currentLocation?: {
    lat: number;
    lng: number;
    lastUpdate: Date;
  };
}

export default function TrackingPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("live");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>();
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<SearchResult | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);

  // Load data
  const loadData = async () => {
    try {
      const [vehiclesResult, tripsResult, schedulesResult] = await Promise.all([
        getAllVehiclesWithLocations(),
        getActiveTrips(),
        getSchedules({ status: 'scheduled' })
      ]);

      if (vehiclesResult.success) {
        setVehicles(vehiclesResult.data as Vehicle[]);
      }

      if (tripsResult.success) {
        setTrips(tripsResult.data as Trip[]);
      }

      if (schedulesResult.success) {
        setSchedules(schedulesResult.data as Schedule[]);
      }

      setLastUpdateTime(new Date());
    } catch (error) {
      console.error("Error loading tracking data:", error);
      toast({
        title: "Error",
        description: "Failed to load tracking data",
        variant: "destructive",
      });
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
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [isAutoRefresh, refreshInterval]);

  // Search drivers
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setShowSearchResults(true);

    try {
      // Search drivers by email, name, or phone
      const result = await searchDrivers(searchQuery);
      
      if (result.success) {
        // Enhance search results with vehicle and location data
        const enhancedResults = result.data.map((driver: any) => {
          const vehicle = vehicles.find(v => v.driverId === driver.id);
          return {
            id: driver.id,
            name: `${driver.firstName} ${driver.lastName}`,
            email: driver.email,
            phone: driver.phone,
            status: driver.employmentStatus,
            vehicle: vehicle ? {
              id: vehicle.id,
              make: vehicle.make,
              model: vehicle.model,
              plate: vehicle.plate,
            } : undefined,
            currentLocation: vehicle ? {
              lat: vehicle.coordinates.lat,
              lng: vehicle.coordinates.lng,
              lastUpdate: vehicle.lastUpdate,
            } : undefined,
          };
        });
        setSearchResults(enhancedResults);
      }
    } catch (error) {
      console.error("Error searching drivers:", error);
      toast({
        title: "Error",
        description: "Failed to search drivers",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  // Select a driver from search results
  const handleSelectDriver = (driver: SearchResult) => {
    setSelectedDriver(driver);
    setShowSearchResults(false);
    setSearchQuery("");

    if (driver.vehicle) {
      setSelectedVehicleId(driver.vehicle.id);

      // Find active trip for this driver
      const activeTrip = trips.find(t => t.driverId === driver.id);
      
      if (activeTrip && activeTrip.fromLat && activeTrip.fromLng && activeTrip.toLat && activeTrip.toLng) {
        // Set route points for the trip
        setRoutePoints([
          {
            lat: activeTrip.fromLat,
            lng: activeTrip.fromLng,
            label: activeTrip.fromAddress || "Origin",
            type: 'origin'
          },
          {
            lat: activeTrip.toLat,
            lng: activeTrip.toLng,
            label: activeTrip.toAddress || "Destination",
            type: 'destination'
          }
        ]);
      } else {
        // Clear route points if no active trip
        setRoutePoints([]);
      }

      // Switch to live map tab
      setActiveTab('live');
      
      toast({
        title: "Driver Found",
        description: `Tracking ${driver.name}`,
      });
    } else {
      toast({
        title: "No Vehicle",
        description: "This driver doesn't have an active vehicle",
        variant: "destructive",
      });
    }
  };

  const handleStartTrip = async (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    try {
      const formData = new FormData();
      formData.append('scheduleId', schedule.id);
      formData.append('vehicleId', schedule.vehicleId);
      formData.append('driverId', schedule.driverId);
      formData.append('startLat', (schedule.fromLat || 37.7749).toString());
      formData.append('startLng', (schedule.fromLng || -122.4194).toString());
      formData.append('startAddress', schedule.from);
      formData.append('fromLat', (schedule.fromLat || 37.7749).toString());
      formData.append('fromLng', (schedule.fromLng || -122.4194).toString());
      formData.append('toLat', (schedule.toLat || 37.3382).toString());
      formData.append('toLng', (schedule.toLng || -121.8863).toString());
      formData.append('toAddress', schedule.to);

      const result = await createTrip(formData);
      if (result.success) {
        toast({
          title: "Success",
          description: "Trip started successfully!",
        });
        loadData();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to start trip",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error starting trip:", error);
      toast({
        title: "Error",
        description: "Failed to start trip",
        variant: "destructive",
      });
    }
  };

  const handleCompleteTrip = async (tripId: string) => {
    try {
      const formData = new FormData();
      const trip = trips.find(t => t.id === tripId);
      const schedule = schedules.find(s => s.id === trip?.scheduleId);
      
      formData.append('endLat', (schedule?.toLat || 37.3382).toString());
      formData.append('endLng', (schedule?.toLng || -121.8863).toString());
      formData.append('endAddress', schedule?.to || '');
      
      const result = await completeTrip(tripId, formData);
      if (result.success) {
        toast({
          title: "Success",
          description: "Trip completed successfully!",
        });
        loadData();
        setRoutePoints([]); // Clear route points
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to complete trip",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error completing trip:", error);
      toast({
        title: "Error",
        description: "Failed to complete trip",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      moving: "bg-green-100 text-green-800 border-green-200",
      idle: "bg-yellow-100 text-yellow-800 border-yellow-200",
      offline: "bg-red-100 text-red-800 border-red-200",
      maintenance: "bg-purple-100 text-purple-800 border-purple-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Calculate statistics
  const stats = {
    total: vehicles.length,
    moving: vehicles.filter(v => v.status === 'moving').length,
    idle: vehicles.filter(v => v.status === 'idle').length,
    offline: vehicles.filter(v => v.status === 'offline').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    activeTrips: trips.length,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Tracking</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            Real-time vehicle tracking and trip management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">
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
            {isAutoRefresh ? (
              <>
                <PauseCircle className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Resume
              </>
            )}
          </Button>
          <Select 
            value={refreshInterval.toString()} 
            onValueChange={(val) => setRefreshInterval(parseInt(val))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Refresh" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10s</SelectItem>
              <SelectItem value="30">30s</SelectItem>
              <SelectItem value="60">1m</SelectItem>
              <SelectItem value="300">5m</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search driver by email, name, or phone..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Find Driver
                </>
              )}
            </Button>
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="mt-4 border rounded-lg divide-y max-h-80 overflow-y-auto">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleSelectDriver(result)}
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{getInitials(result.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{result.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{result.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{result.phone}</span>
                          </div>
                        </div>
                        <Badge variant={result.vehicle ? "default" : "secondary"}>
                          {result.vehicle ? "Active" : "No Vehicle"}
                        </Badge>
                      </div>
                      {result.vehicle && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <Car className="h-3 w-3" />
                          <span>{result.vehicle.make} {result.vehicle.model}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">{result.vehicle.plate}</span>
                        </div>
                      )}
                      {result.currentLocation && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Last seen: {formatDistanceToNow(result.currentLocation.lastUpdate)} ago
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showSearchResults && searchResults.length === 0 && !searching && (
            <div className="mt-4 p-8 text-center border rounded-lg">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold">No drivers found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try searching by email, name, or phone number
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Driver Info */}
      {selectedDriver && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-primary">
                  <AvatarFallback>{getInitials(selectedDriver.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    {selectedDriver.name}
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      {selectedDriver.status}
                    </Badge>
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {selectedDriver.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedDriver.phone}
                    </span>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedDriver(null);
                  setSelectedVehicleId(undefined);
                  setRoutePoints([]);
                }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Moving</p>
                <p className="text-2xl font-bold text-green-600">{stats.moving}</p>
              </div>
              <Navigation className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Idle</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.idle}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Offline</p>
                <p className="text-2xl font-bold text-red-600">{stats.offline}</p>
              </div>
              <WifiOff className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Maintenance</p>
                <p className="text-2xl font-bold text-purple-600">{stats.maintenance}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Trips</p>
                <p className="text-2xl font-bold">{stats.activeTrips}</p>
              </div>
              <Route className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="live">Live Map</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="trips">Active Trips</TabsTrigger>
          <TabsTrigger value="schedules">Schedule</TabsTrigger>
        </TabsList>

        {/* Live Tracking Map Tab */}
        <TabsContent value="live" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <OpenStreetMap
                    vehicles={vehicles}
                    selectedVehicleId={selectedVehicleId}
                    onVehicleSelect={setSelectedVehicleId}
                    height="600px"
                    showControls={true}
                    routePoints={routePoints}
                    showRoute={routePoints.length > 0}
                  />
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-4">
              {/* Selected Vehicle Details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Vehicle Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedVehicleId ? (
                    (() => {
                      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
                      return vehicle ? (
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{vehicle.make} {vehicle.model}</h3>
                              <p className="text-sm text-muted-foreground">{vehicle.plate}</p>
                            </div>
                            <Badge className={getStatusColor(vehicle.status)}>
                              {vehicle.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Driver</span>
                              <span className="font-medium">{vehicle.driver}</span>
                            </div>
                            {vehicle.driverEmail && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Email</span>
                                <span className="font-medium">{vehicle.driverEmail}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Speed</span>
                              <span className="font-medium">{Math.round(vehicle.speed)} km/h</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Last Update</span>
                              <span className="font-medium">
                                {formatDistanceToNow(vehicle.lastUpdate)} ago
                              </span>
                            </div>
                          </div>

                          {/* Fuel Level */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Fuel</span>
                              <span>{vehicle.fuel}%</span>
                            </div>
                            <Progress value={vehicle.fuel} className="h-2" />
                          </div>

                          {/* Coordinates */}
                          <div className="bg-gray-50 p-2 rounded-md">
                            <p className="text-xs font-mono">
                              Lat: {vehicle.coordinates.lat.toFixed(6)}<br />
                              Lng: {vehicle.coordinates.lng.toFixed(6)}
                            </p>
                          </div>

                          {/* Trip Info if available */}
                          {vehicle.currentTrip && (
                            <div className="bg-blue-50 p-3 rounded-md">
                              <h4 className="text-sm font-medium mb-2">Current Trip</h4>
                              <div className="space-y-1 text-xs">
                                <div className="flex items-start gap-1">
                                  <MapPin className="h-3 w-3 text-green-600 mt-0.5" />
                                  <span className="text-muted-foreground">From:</span>
                                  <span className="font-medium">{vehicle.currentTrip.from}</span>
                                </div>
                                <div className="flex items-start gap-1">
                                  <MapPin className="h-3 w-3 text-red-600 mt-0.5" />
                                  <span className="text-muted-foreground">To:</span>
                                  <span className="font-medium">{vehicle.currentTrip.to}</span>
                                </div>
                                {vehicle.currentTrip.progress !== undefined && (
                                  <div className="mt-2">
                                    <Progress value={vehicle.currentTrip.progress} className="h-1" />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <Button className="w-full" size="sm">
                            <Navigation className="h-4 w-4 mr-2" />
                            Get Directions
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          Vehicle not found
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Select a vehicle on the map or search for a driver</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter Vehicles
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Vehicle List Tab */}
        <TabsContent value="vehicles">
          <Card>
            <CardHeader>
              <CardTitle>All Vehicles</CardTitle>
              <CardDescription>Real-time status and location of all vehicles</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading vehicles...</span>
                </div>
              ) : vehicles.length === 0 ? (
                <div className="text-center py-12">
                  <Truck className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground mt-2">No vehicles found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vehicles.map((vehicle) => (
                    <div 
                      key={vehicle.id}
                      className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedVehicleId === vehicle.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => {
                        setSelectedVehicleId(vehicle.id);
                        setActiveTab('live');
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          vehicle.status === 'moving' ? 'bg-green-100' :
                          vehicle.status === 'idle' ? 'bg-yellow-100' :
                          vehicle.status === 'offline' ? 'bg-red-100' : 'bg-purple-100'
                        }`}>
                          <Truck className={`h-5 w-5 ${
                            vehicle.status === 'moving' ? 'text-green-600' :
                            vehicle.status === 'idle' ? 'text-yellow-600' :
                            vehicle.status === 'offline' ? 'text-red-600' : 'text-purple-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-medium">{vehicle.make} {vehicle.model}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{vehicle.plate}</span>
                            <span>•</span>
                            <span>{vehicle.driver}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Last update: {formatDistanceToNow(vehicle.lastUpdate)} ago
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(vehicle.status)}>
                          {vehicle.status}
                        </Badge>
                        <div className="text-sm font-medium mt-1">
                          {Math.round(vehicle.speed)} km/h
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Trips Tab */}
        <TabsContent value="trips">
          <Card>
            <CardHeader>
              <CardTitle>Active Trips</CardTitle>
              <CardDescription>Currently running trips and their progress</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading trips...</span>
                </div>
              ) : trips.length === 0 ? (
                <div className="text-center py-12">
                  <Route className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground mt-2">No active trips</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trips.map((trip) => {
                    const vehicle = vehicles.find(v => v.id === trip.vehicleId);
                    
                    return (
                      <div key={trip.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">
                              Trip to {vehicle?.model || 'Unknown'}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Truck className="h-3 w-3" />
                              <span>{vehicle?.make} {vehicle?.model} ({vehicle?.plate})</span>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                        
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Started</p>
                            <p className="text-sm font-medium">
                              {formatDistanceToNow(trip.startTime)} ago
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Duration</p>
                            <p className="text-sm font-medium">
                              {Math.floor((Date.now() - trip.startTime.getTime()) / 60000)} min
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setSelectedVehicleId(trip.vehicleId);
                              if (trip.fromLat && trip.fromLng && trip.toLat && trip.toLng) {
                                setRoutePoints([
                                  { lat: trip.fromLat, lng: trip.fromLng, label: trip.fromAddress || "Origin", type: 'origin' },
                                  { lat: trip.toLat, lng: trip.toLng, label: trip.toAddress || "Destination", type: 'destination' }
                                ]);
                              }
                              setActiveTab('live');
                            }}
                          >
                            <Navigation className="h-4 w-4 mr-2" />
                            Track
                          </Button>
                          <Button 
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleCompleteTrip(trip.id)}
                          >
                            <StopCircle className="h-4 w-4 mr-2" />
                            Complete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Trips Tab */}
        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Trips</CardTitle>
              <CardDescription>Upcoming trips ready to start</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading schedules...</span>
                </div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground mt-2">No scheduled trips available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {schedules.map((schedule) => {
                    const vehicle = vehicles.find(v => v.id === schedule.vehicleId);
                    
                    return (
                      <div key={schedule.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{schedule.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {vehicle && (
                                <>
                                  <Truck className="h-3 w-3" />
                                  <span>{vehicle.make} {vehicle.model}</span>
                                </>
                              )}
                              <span>•</span>
                              <Badge variant="outline" className="bg-blue-50">
                                {schedule.status}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-green-600" />
                            <span className="font-medium">From:</span>
                            <span>{schedule.from}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm mt-1">
                            <MapPin className="h-4 w-4 text-red-600" />
                            <span className="font-medium">To:</span>
                            <span>{schedule.to}</span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <Button 
                            className="w-full"
                            onClick={() => handleStartTrip(schedule.id)}
                          >
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Start Trip Now
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}