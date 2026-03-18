// app/dashboard/page.tsx
"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Activity, Car, Fuel, Users, Wrench, AlertTriangle, MapPin, LogOut } from 'lucide-react'
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getVehicles } from "@/actions/vehicle";
import { getDrivers } from "@/actions/drivers";
import { getVehicleStats } from "@/actions/vehicle";
import { getDriverStats } from "@/actions/drivers";
import { getSchedules } from "@/actions/schedules";
import { getActiveTrips, getAllVehiclesWithLocations } from "@/actions/tracking";
import { formatDistanceToNow } from "date-fns";

// Types
interface DashboardStats {
  vehicles: {
    total: number;
    active: number;
    inMaintenance: number;
    available: number;
    inUse: number;
  };
  drivers: {
    total: number;
    active: number;
    onLeave: number;
    terminated: number;
    inactive: number;
  };
  fuel: {
    totalUsage: number;
    averagePerVehicle: number;
    efficiency: number;
    cost: number;
  };
  alerts: {
    critical: number;
    warning: number;
    info: number;
  };
  activeVehicles: Array<{
    id: string;
    driver: string;
    location: string;
    status: 'moving' | 'idle' | 'parked' | 'offline';
    speed: number;
    lastUpdate?: Date;
  }>;
}

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    vehicles: {
      total: 0,
      active: 0,
      inMaintenance: 0,
      available: 0,
      inUse: 0,
    },
    drivers: {
      total: 0,
      active: 0,
      onLeave: 0,
      terminated: 0,
      inactive: 0,
    },
    fuel: {
      totalUsage: 0,
      averagePerVehicle: 0,
      efficiency: 0,
      cost: 0,
    },
    alerts: {
      critical: 0,
      warning: 0,
      info: 0,
    },
    activeVehicles: [],
  });
  const [todayStats, setTodayStats] = useState({
    totalDistance: 0,
    avgSpeed: 0,
    activeHours: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Load dashboard data
  useEffect(() => {
    if (!user) return;

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Load vehicle stats
        const vehicleStatsResult = await getVehicleStats();
        const driverStatsResult = await getDriverStats();
        const vehiclesWithLocationsResult = await getAllVehiclesWithLocations();
        const activeTripsResult = await getActiveTrips();
        
        // Process vehicle stats
        if (vehicleStatsResult.success && vehicleStatsResult.data) {
          const vehicleData = vehicleStatsResult.data;
          setStats(prev => ({
            ...prev,
            vehicles: {
              total: vehicleData.total || 0,
              active: vehicleData.in_use || 0,
              inMaintenance: vehicleData.maintenance || 0,
              available: vehicleData.available || 0,
              inUse: vehicleData.in_use || 0,
            }
          }));
        }

        // Process driver stats
        if (driverStatsResult.success && driverStatsResult.data) {
          const driverData = driverStatsResult.data;
          setStats(prev => ({
            ...prev,
            drivers: {
              total: driverData.total || 0,
              active: driverData.active || 0,
              onLeave: driverData.on_leave || 0,
              terminated: driverData.terminated || 0,
              inactive: driverData.inactive || 0,
            }
          }));
        }

        // Process active vehicles for the list
        if (vehiclesWithLocationsResult.success && vehiclesWithLocationsResult.data) {
          const vehicles = vehiclesWithLocationsResult.data;
          
          // Calculate fuel stats (mock for now - you can implement actual fuel tracking)
          const totalFuel = vehicles.reduce((acc, v: any) => acc + (v.fuelLevel || 0), 0);
          const avgFuel = vehicles.length > 0 ? totalFuel / vehicles.length : 0;
          
          setStats(prev => ({
            ...prev,
            fuel: {
              totalUsage: Math.round(totalFuel * 10), // Mock calculation
              averagePerVehicle: Math.round(avgFuel * 10) / 10,
              efficiency: 76, // Mock value
              cost: Math.round(totalFuel * 15 * 10), // Mock cost calculation
            },
            activeVehicles: vehicles
              .filter((v: any) => v.status !== 'offline')
              .slice(0, 5)
              .map((v: any) => ({
                id: v.id,
                driver: v.driverName || 'Unassigned',
                location: `${v.coordinates.lat.toFixed(4)}, ${v.coordinates.lng.toFixed(4)}`,
                status: v.status === 'moving' ? 'moving' : 
                        v.status === 'idle' ? 'idle' : 
                        v.status === 'offline' ? 'offline' : 'parked',
                speed: Math.round(v.speed),
                lastUpdate: v.lastUpdate,
              }))
          }));

          // Calculate today's stats
          const movingVehicles = vehicles.filter((v: any) => v.status === 'moving');
          const avgSpeed = movingVehicles.length > 0 
            ? movingVehicles.reduce((acc: number, v: any) => acc + v.speed, 0) / movingVehicles.length 
            : 0;
          
          setTodayStats({
            totalDistance: Math.round(vehicles.length * 45), // Mock calculation
            avgSpeed: Math.round(avgSpeed),
            activeHours: Math.round(vehicles.length * 3.5), // Mock calculation
          });
        }

        // Calculate alerts based on vehicle status
        if (vehiclesWithLocationsResult.success && vehiclesWithLocationsResult.data) {
          const vehicles = vehiclesWithLocationsResult.data;
          
          // Count vehicles that need attention
          const criticalAlerts = vehicles.filter((v: any) => 
            v.status === 'maintenance' || (v.fuelLevel && v.fuelLevel < 15)
          ).length;
          
          const warningAlerts = vehicles.filter((v: any) => 
            v.status === 'offline' || (v.fuelLevel && v.fuelLevel < 30 && v.fuelLevel >= 15)
          ).length;
          
          const infoAlerts = vehicles.filter((v: any) => 
            v.status === 'idle' && v.speed === 0
          ).length;

          setStats(prev => ({
            ...prev,
            alerts: {
              critical: criticalAlerts,
              warning: warningAlerts,
              info: infoAlerts,
            }
          }));
        }

      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          {/* Custom Header with Auth Info */}
          <div className="flex items-center justify-between p-6 pb-2 border-b">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Fleet Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {user.name || user.email?.split('@')[0]} • {user.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium">{user.role || 'Admin'} Dashboard</p>
                <p className="text-xs text-muted-foreground">
                  {stats.vehicles.active} vehicles active
                </p>
              </div>
              <Button onClick={logout} variant="outline" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 p-6 md:gap-6">
              
              {/* First Row: Summary Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                
                {/* Vehicle Summary Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Vehicles</CardTitle>
                    <Car className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.vehicles.total}</div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span className="text-xs text-muted-foreground">In Use</span>
                        </div>
                        <div className="text-lg font-semibold">{stats.vehicles.inUse}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                          <span className="text-xs text-muted-foreground">Maintenance</span>
                        </div>
                        <div className="text-lg font-semibold">{stats.vehicles.inMaintenance}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          <span className="text-xs text-muted-foreground">Available</span>
                        </div>
                        <div className="text-lg font-semibold">{stats.vehicles.available}</div>
                      </div>
                    </div>
                    <Progress 
                      value={(stats.vehicles.inUse / stats.vehicles.total) * 100} 
                      className="mt-4"
                    />
                  </CardContent>
                </Card>

                {/* Driver Summary Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Drivers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.drivers.total}</div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span className="text-xs text-muted-foreground">Active</span>
                        </div>
                        <div className="text-lg font-semibold">{stats.drivers.active}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                          <span className="text-xs text-muted-foreground">On Leave</span>
                        </div>
                        <div className="text-lg font-semibold">{stats.drivers.onLeave}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                          <span className="text-xs text-muted-foreground">Inactive</span>
                        </div>
                        <div className="text-lg font-semibold">{stats.drivers.inactive}</div>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground">
                      Active: {((stats.drivers.active / stats.drivers.total) * 100 || 0).toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>

                {/* Fuel Usage Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fuel Usage</CardTitle>
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.fuel.totalUsage}L</div>
                    <p className="text-xs text-muted-foreground mt-2">Estimated consumption</p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Avg/Vehicle</p>
                        <p className="text-sm font-semibold">{stats.fuel.averagePerVehicle}L</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Efficiency</p>
                        <div className="flex items-center gap-2">
                          <Progress value={stats.fuel.efficiency} className="h-2 flex-1" />
                          <span className="text-xs font-medium">{stats.fuel.efficiency}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground">Est. Cost</p>
                      <p className="text-lg font-semibold">${stats.fuel.cost.toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Alerts Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Alerts</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-red-100 p-3">
                          <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="mt-2 text-center">
                          <div className="text-2xl font-bold text-red-600">{stats.alerts.critical}</div>
                          <div className="text-xs text-muted-foreground">Critical</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-amber-100 p-3">
                          <AlertTriangle className="h-6 w-6 text-amber-600" />
                        </div>
                        <div className="mt-2 text-center">
                          <div className="text-2xl font-bold text-amber-600">{stats.alerts.warning}</div>
                          <div className="text-xs text-muted-foreground">Warning</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-blue-100 p-3">
                          <AlertTriangle className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="mt-2 text-center">
                          <div className="text-2xl font-bold text-blue-600">{stats.alerts.info}</div>
                          <div className="text-xs text-muted-foreground">Info</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button className="w-full text-sm font-medium text-blue-600 hover:underline">
                        View all alerts →
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Second Row: Map and Active Vehicles */}
              <div className="grid gap-4 lg:grid-cols-3">
                
                {/* Active Vehicles List */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Active Vehicles ({stats.activeVehicles.length})
                    </CardTitle>
                    <CardDescription>Real-time vehicle status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.activeVehicles.length > 0 ? (
                        stats.activeVehicles.map((vehicle) => (
                          <div key={vehicle.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${
                                vehicle.status === 'moving' ? 'bg-green-100' :
                                vehicle.status === 'idle' ? 'bg-amber-100' :
                                'bg-gray-100'
                              }`}>
                                <Car className={`h-4 w-4 ${
                                  vehicle.status === 'moving' ? 'text-green-600' :
                                  vehicle.status === 'idle' ? 'text-amber-600' :
                                  'text-gray-600'
                                }`} />
                              </div>
                              <div>
                                <div className="font-medium">{vehicle.id}</div>
                                <div className="text-sm text-muted-foreground">{vehicle.driver}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  vehicle.status === 'moving' ? 'default' :
                                  vehicle.status === 'idle' ? 'secondary' :
                                  'outline'
                                }>
                                  {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {vehicle.speed > 0 ? `${vehicle.speed} km/h` : 'Stopped'}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate max-w-[100px]">{vehicle.location}</span>
                              </div>
                              {vehicle.lastUpdate && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(vehicle.lastUpdate)} ago
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No active vehicles
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Map View */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Live Vehicle Locations
                    </CardTitle>
                    <CardDescription>Interactive map showing all active vehicles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative h-[400px] rounded-lg border bg-gradient-to-br from-blue-50 to-gray-50 overflow-hidden">
                      {/* Mock Map - Replace with actual Map component */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <MapPin className="h-8 w-8 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-semibold">Live Map View</h3>
                          <p className="text-sm text-muted-foreground mt-2">
                            {stats.activeVehicles.length} vehicles currently active
                          </p>
                          <div className="mt-6 flex justify-center space-x-4">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <span className="text-sm">Moving</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                              <span className="text-sm">Idle</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                              <span className="text-sm">Parked</span>
                            </div>
                          </div>
                          
                          {/* Mock vehicle markers */}
                          <div className="mt-8 relative h-48">
                            {stats.activeVehicles.map((vehicle, index) => {
                              const positions = [
                                { top: '20%', left: '30%' },
                                { top: '40%', left: '60%' },
                                { top: '60%', left: '40%' },
                                { top: '30%', left: '70%' },
                                { top: '50%', left: '20%' },
                              ];
                              const pos = positions[index % positions.length];
                              
                              return (
                                <div
                                  key={vehicle.id}
                                  className={`absolute w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-lg ${
                                    vehicle.status === 'moving' ? 'bg-green-500 animate-pulse' :
                                    vehicle.status === 'idle' ? 'bg-amber-500' :
                                    'bg-gray-500'
                                  }`}
                                  style={pos}
                                  title={`${vehicle.id} - ${vehicle.driver}`}
                                >
                                  <Car className="h-4 w-4 text-white" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="text-center p-3 rounded-lg border">
                        <div className="text-sm text-muted-foreground">Total Distance Today</div>
                        <div className="text-lg font-semibold">{todayStats.totalDistance} km</div>
                      </div>
                      <div className="text-center p-3 rounded-lg border">
                        <div className="text-sm text-muted-foreground">Avg Speed</div>
                        <div className="text-lg font-semibold">{todayStats.avgSpeed} km/h</div>
                      </div>
                      <div className="text-center p-3 rounded-lg border">
                        <div className="text-sm text-muted-foreground">Active Hours</div>
                        <div className="text-lg font-semibold">{todayStats.activeHours} hrs</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Third Row: Additional Metrics */}
              <div className="grid gap-4 md:grid-cols-3">
                
                {/* Maintenance Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      Maintenance Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">In Maintenance</span>
                        <span className="font-semibold">{stats.vehicles.inMaintenance} vehicles</span>
                      </div>
                      <Progress value={(stats.vehicles.inMaintenance / stats.vehicles.total) * 100} className="h-2" />
                      
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-sm">Available</span>
                        <span className="font-semibold">{stats.vehicles.available} vehicles</span>
                      </div>
                      <Progress value={(stats.vehicles.available / stats.vehicles.total) * 100} className="h-2" />
                      
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-sm">In Use</span>
                        <span className="font-semibold">{stats.vehicles.inUse} vehicles</span>
                      </div>
                      <Progress value={(stats.vehicles.inUse / stats.vehicles.total) * 100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">Vehicle Utilization</span>
                          <span className="text-sm font-medium">
                            {((stats.vehicles.inUse / stats.vehicles.total) * 100 || 0).toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={(stats.vehicles.inUse / stats.vehicles.total) * 100} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">Driver Activity</span>
                          <span className="text-sm font-medium">
                            {((stats.drivers.active / stats.drivers.total) * 100 || 0).toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={(stats.drivers.active / stats.drivers.total) * 100} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">Maintenance Rate</span>
                          <span className="text-sm font-medium">
                            {((stats.vehicles.inMaintenance / stats.vehicles.total) * 100 || 0).toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={(stats.vehicles.inMaintenance / stats.vehicles.total) * 100} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Alerts */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.alerts.critical > 0 && (
                        <div className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50">
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <div className="font-medium">Critical Alerts</div>
                            <div className="text-sm text-muted-foreground">{stats.alerts.critical} vehicles need immediate attention</div>
                          </div>
                        </div>
                      )}
                      
                      {stats.alerts.warning > 0 && (
                        <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50">
                          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                          <div>
                            <div className="font-medium">Warning Alerts</div>
                            <div className="text-sm text-muted-foreground">{stats.alerts.warning} vehicles need attention</div>
                          </div>
                        </div>
                      )}
                      
                      {stats.alerts.info > 0 && (
                        <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50">
                          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <div className="font-medium">Information</div>
                            <div className="text-sm text-muted-foreground">{stats.alerts.info} vehicles idle</div>
                          </div>
                        </div>
                      )}

                      {stats.alerts.critical === 0 && stats.alerts.warning === 0 && stats.alerts.info === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No alerts at this time
                        </div>
                      )}
                      
                      <button className="w-full text-sm font-medium text-blue-600 hover:underline text-center">
                        View all alerts
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}