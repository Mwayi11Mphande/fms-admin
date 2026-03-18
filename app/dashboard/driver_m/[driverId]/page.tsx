// app/dashboard/driver_m/[driverId]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Car,
  Calendar,
  Clock,
  Award,
  Star,
  TrendingUp,
  Truck,
  Navigation,
  AlertCircle,
  CheckCircle2,
  Fuel,
  Gauge,
  Package,
  DollarSign,
  Download,
  FileText,
  Activity
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { getDriver } from "@/actions/drivers";
import { getVehicles } from "@/actions/vehicle";
import { getAllVehiclesWithLocations, getVehicleLocationHistory } from "@/actions/tracking";
import { getDriverScheduleStats, getDriverRecentSchedules } from "@/actions/schedules";
import { OpenStreetMap } from "@/components/maps/OpenStreetMap";
import { useToast } from "@/components/ui/toast"; // Fixed import

// Types
interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: Date;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  employmentStatus: 'active' | 'inactive' | 'on_leave' | 'terminated';
  hireDate: Date;
  assignedVehicleId?: string;
  notes?: string;
  createdAt: Date;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  plate: string;
  status: string;
  coordinates: { lat: number; lng: number };
  speed: number;
  lastUpdate: Date;
  fuel?: number;
  odometer?: number;
  assignedDriverId?: string; // Added this field
}

interface Schedule {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  from: string;
  to: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'delayed';
  type: string;
  distance?: number;
}

interface LocationHistory {
  lat: number;
  lng: number;
  timestamp: Date;
  speed?: number;
}

// Transform functions
const transformDriver = (data: any): Driver | null => {
  if (!data) return null;
  return {
    id: data.id || '',
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email || '',
    phone: data.phone || '',
    licenseNumber: data.licenseNumber || '',
    licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : new Date(),
    address: data.address,
    emergencyContact: data.emergencyContact,
    employmentStatus: data.employmentStatus || 'inactive',
    hireDate: data.hireDate ? new Date(data.hireDate) : new Date(),
    assignedVehicleId: data.assignedVehicleId,
    notes: data.notes,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
  };
};

const transformVehicle = (data: any): Vehicle => ({
  id: data.id || '',
  make: data.make || '',
  model: data.model || '',
  plate: data.plate || data.licensePlate || 'N/A',
  status: data.status || 'offline',
  coordinates: data.coordinates || { lat: 37.7749, lng: -122.4194 },
  speed: data.speed || 0,
  lastUpdate: data.lastUpdate ? new Date(data.lastUpdate) : new Date(),
  fuel: data.fuel,
  odometer: data.odometer,
  assignedDriverId: data.assignedDriverId || data.driverId,
});

const transformSchedule = (data: any): Schedule => ({
  id: data.id || '',
  title: data.title || '',
  startTime: data.startTime ? new Date(data.startTime) : new Date(),
  endTime: data.endTime ? new Date(data.endTime) : new Date(),
  from: data.from || data.location?.from || '',
  to: data.to || data.location?.to || '',
  status: data.status || 'scheduled',
  type: data.type || data.scheduleType || 'delivery',
  distance: data.distance || data.estimatedDistance,
});

const transformLocationHistory = (data: any): LocationHistory => ({
  lat: data.lat || 0,
  lng: data.lng || 0,
  timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
  speed: data.speed,
});

export default function DriverDetailPage() {
  const { driverId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  const [stats, setStats] = useState({
    totalTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    totalDistance: 0,
    totalHours: 0,
    onTimeRate: 0,
    averageSpeed: 0,
  });

  // Load all driver data
  const loadDriverData = async () => {
    setLoading(true);
    try {
      // Get driver details
      const driverResult = await getDriver(driverId as string);
      if (!driverResult.success || !driverResult.data) {
        toast({
          title: "Error",
          description: "Driver not found",
          variant: "destructive",
        });
        router.push('/dashboard/driver_m');
        return;
      }
      
      const transformedDriver = transformDriver(driverResult.data);
      setDriver(transformedDriver);

      // Get all vehicles with locations
      const vehiclesResult = await getAllVehiclesWithLocations();
      if (vehiclesResult.success && vehiclesResult.data) {
        const vehicles = vehiclesResult.data.map(transformVehicle);
        
        // Find assigned vehicle
        const assignedVehicle = vehicles.find(v => 
          v.id === transformedDriver?.assignedVehicleId || v.assignedDriverId === driverId
        );
        setVehicle(assignedVehicle || null);

        // Get location history if vehicle assigned
        if (assignedVehicle) {
          const historyResult = await getVehicleLocationHistory(assignedVehicle.id, 50);
          if (historyResult.success && historyResult.data) {
            setLocationHistory(historyResult.data.map(transformLocationHistory));
          }
        }
      }

      // Get driver's schedules
      const schedulesResult = await getDriverRecentSchedules(driverId as string);
      if (schedulesResult.success && schedulesResult.data) {
        setSchedules(schedulesResult.data.map(transformSchedule));
      }

      // Get driver statistics
      const statsResult = await getDriverScheduleStats(driverId as string);
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }

    } catch (error) {
      console.error("Error loading driver data:", error);
      toast({
        title: "Error",
        description: "Failed to load driver data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (driverId) {
      loadDriverData();
    }
  }, [driverId]);

  // Helper functions
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      on_leave: "bg-yellow-100 text-yellow-800",
      terminated: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getScheduleStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      delayed: "bg-orange-100 text-orange-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getVehicleStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      moving: "bg-green-100 text-green-800",
      idle: "bg-yellow-100 text-yellow-800",
      offline: "bg-red-100 text-red-800",
      maintenance: "bg-purple-100 text-purple-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading driver information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Driver Not Found</h3>
              <p className="text-muted-foreground mt-2">
                The driver you're looking for doesn't exist.
              </p>
              <Button className="mt-4" onClick={() => router.push('/dashboard/driver_m')}>
                Back to Drivers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Driver Profile</h1>
          <p className="text-muted-foreground">
            View driver information, history, and performance
          </p>
        </div>
      </div>

      {/* Driver Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-primary/10">
              <AvatarFallback className="text-2xl bg-primary/10">
                {getInitials(driver.firstName, driver.lastName)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{driver.firstName} {driver.lastName}</h2>
                <Badge className={getStatusColor(driver.employmentStatus)}>
                  {driver.employmentStatus.replace('_', ' ')}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{driver.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{driver.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Hired: {format(new Date(driver.hireDate), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>

            <Button variant="outline" onClick={() => window.print()}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Trips</p>
                <p className="text-2xl font-bold">{stats.totalTrips}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedTrips}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On-Time Rate</p>
                <p className="text-2xl font-bold">{stats.onTimeRate}%</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Distance</p>
                <p className="text-2xl font-bold">{stats.totalDistance} km</p>
              </div>
              <Navigation className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Speed</p>
                <p className="text-2xl font-bold">{stats.averageSpeed} km/h</p>
              </div>
              <Gauge className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="live">Live Tracking</TabsTrigger>
          <TabsTrigger value="history">Trip History</TabsTrigger>
          <TabsTrigger value="accomplishments">Accomplishments</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Personal Information */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Driver details and emergency contact</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">License Number</p>
                    <p className="font-medium">{driver.licenseNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">License Expiry</p>
                    <p className="font-medium">
                      {format(new Date(driver.licenseExpiry), 'MMM d, yyyy')}
                      {new Date(driver.licenseExpiry) < new Date() && (
                        <Badge variant="destructive" className="ml-2">Expired</Badge>
                      )}
                    </p>
                  </div>
                  {driver.address && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{driver.address}</p>
                    </div>
                  )}
                </div>

                {driver.emergencyContact && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Emergency Contact</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{driver.emergencyContact.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{driver.emergencyContact.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Relationship</p>
                        <p className="font-medium">{driver.emergencyContact.relationship}</p>
                      </div>
                    </div>
                  </div>
                )}

                {driver.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-sm">{driver.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Current Assignment</CardTitle>
                <CardDescription>Vehicle and status</CardDescription>
              </CardHeader>
              <CardContent>
                {vehicle ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <Car className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">{vehicle.make} {vehicle.model}</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Plate</span>
                          <span className="font-mono">{vehicle.plate}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Status</span>
                          <Badge className={getVehicleStatusColor(vehicle.status)}>
                            {vehicle.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Speed</span>
                          <span>{Math.round(vehicle.speed)} km/h</span>
                        </div>
                        {vehicle.fuel && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Fuel</span>
                              <span>{vehicle.fuel}%</span>
                            </div>
                            <Progress value={vehicle.fuel} className="h-2" />
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Last Update</span>
                          <span>{formatDistanceToNow(vehicle.lastUpdate)} ago</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full"
                      onClick={() => router.push(`/dashboard/tracking?vehicle=${vehicle.id}`)}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Track Vehicle
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No vehicle currently assigned
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Last 30 days performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <p className="text-sm text-muted-foreground">On-Time Rate</p>
                    </div>
                    <p className="text-2xl font-bold">{stats.onTimeRate}%</p>
                    <Progress value={stats.onTimeRate} className="h-2 mt-2" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <p className="text-sm text-muted-foreground">Rating</p>
                    </div>
                    <p className="text-2xl font-bold">4.8</p>
                    <div className="flex mt-2">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <p className="text-sm text-muted-foreground">Avg Trip Time</p>
                    </div>
                    <p className="text-2xl font-bold">2.4 hrs</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <p className="text-sm text-muted-foreground">Revenue</p>
                    </div>
                    <p className="text-2xl font-bold">$3,450</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Live Tracking Tab */}
        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {vehicle ? (
                <div className="h-[500px]">
                  <OpenStreetMap
                    vehicles={[{
                      id: vehicle.id,
                      make: vehicle.make,
                      model: vehicle.model,
                      plate: vehicle.plate,
                      status: vehicle.status as any,
                      driverName: `${driver.firstName} ${driver.lastName}`,
                      speed: vehicle.speed,
                      coordinates: vehicle.coordinates,
                      lastUpdate: vehicle.lastUpdate,
                    }]}
                    selectedVehicleId={vehicle.id}
                    onVehicleSelect={() => {}}
                    height="500px"
                    showControls={true}
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <Navigation className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No Active Vehicle</h3>
                  <p className="text-muted-foreground">
                    This driver doesn't have an active vehicle to track
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {locationHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Locations</CardTitle>
                <CardDescription>Last 10 location updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {locationHistory.slice(0, 10).map((loc, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm p-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono">
                          {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        {loc.speed && (
                          <span className="text-muted-foreground">{Math.round(loc.speed)} km/h</span>
                        )}
                        <span className="text-muted-foreground text-xs">
                          {format(loc.timestamp, 'HH:mm:ss')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trip History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trip History</CardTitle>
              <CardDescription>Recent and past trips</CardDescription>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No trip history available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <Card key={schedule.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{schedule.title}</h3>
                              <Badge className={getScheduleStatusColor(schedule.status)}>
                                {schedule.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-green-600" />
                                <span className="text-muted-foreground">From:</span>
                                <span className="truncate max-w-[200px]">{schedule.from}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-red-600" />
                                <span className="text-muted-foreground">To:</span>
                                <span className="truncate max-w-[200px]">{schedule.to}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(schedule.startTime), 'MMM d, yyyy')}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {format(new Date(schedule.startTime), 'h:mm a')} - 
                                  {format(new Date(schedule.endTime), 'h:mm a')}
                                </span>
                              </div>
                              {schedule.distance && (
                                <div className="flex items-center gap-1">
                                  <Navigation className="h-3 w-3" />
                                  <span>{schedule.distance} km</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/dashboard/schedules/${schedule.id}`)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accomplishments Tab */}
        <TabsContent value="accomplishments" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Achievements
                </CardTitle>
                <CardDescription>Milestones and recognitions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-yellow-50 rounded-lg">
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Safe Driver Award</p>
                    <p className="text-sm text-muted-foreground">6 months without accidents</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Top Performer</p>
                    <p className="text-sm text-muted-foreground">March 2024 - 98% on-time rate</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Truck className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">10,000 km Club</p>
                    <p className="text-sm text-muted-foreground">Total distance milestone</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Upcoming Goals
                </CardTitle>
                <CardDescription>Next milestones to achieve</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Yearly Safety Goal</span>
                    <span className="text-sm">75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Total Trips (Target: 200)</span>
                    <span className="text-sm">{stats.totalTrips}/200</span>
                  </div>
                  <Progress value={(stats.totalTrips / 200) * 100} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Fuel Efficiency</span>
                    <span className="text-sm">8.2 L/100km</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Certifications */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Certifications & Training</CardTitle>
                <CardDescription>Completed training and certifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Defensive Driving</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Completed: Jan 2024</p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium">HazMat Certification</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Valid until: Dec 2024</p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium">First Aid/CPR</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Completed: Mar 2024</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}