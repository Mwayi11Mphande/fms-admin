// app/dashboard/schedules/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { ScheduleCard } from "./components/ScheduleCard";
import { CreateScheduleForm } from "./components/CreateScheduleForm";
import { ScheduleFilters } from "./components/ScheduleFilters";
import { ScheduleStats } from "./components/ScheduleStats";
import { CalendarView } from "./components/CalendarView";
import { useToast } from "@/components/ui/toast"; // Import useToast
import { getSchedules, createSchedule, getScheduleStats } from "@/actions/schedules";
import { getDrivers } from "@/actions/drivers";
import { getVehicles } from "@/actions/vehicle";
import { startTripFromSchedule } from "@/actions/trip_start"; // Import the trip action

// Define types for dropdown options
interface DriverOption {
  id: string;
  name: string;
  license: string;
  status: string;
  firstName?: string;
  lastName?: string;
}

interface VehicleOption {
  id: string;
  make: string;
  model: string;
  plate: string;
  status: string;
  licensePlate?: string;
}

interface ScheduleDisplay {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  driver: string;
  driverId?: string;
  vehicle: string;
  vehicleId?: string;
  from: string;
  to: string;
  status: string;
  distance: string;
  estimatedDuration: string;
  description?: string;
}

export default function SchedulesPage() {
  const router = useRouter();
  const { toast } = useToast(); // Initialize toast
  const [activeTab, setActiveTab] = useState("schedules");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [schedules, setSchedules] = useState<ScheduleDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingScheduleId, setStartingScheduleId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    inProgress: 0,
    completed: 0,
    pending: 0,
  });

  // Load data from Firestore
  const loadData = async () => {
    setLoading(true);
    try {
      console.log("Loading drivers and vehicles...");
      
      // Load drivers
      const driversResult = await getDrivers({ limit: 100 });
      console.log("Drivers result:", driversResult);
      
      if (driversResult.success && driversResult.data) {
        const formattedDrivers: DriverOption[] = driversResult.data.map((driver: any) => ({
          id: driver.id,
          name: `${driver.firstName || ''} ${driver.lastName || ''}`.trim(),
          license: driver.licenseNumber || 'No license',
          status: driver.employmentStatus || 'active',
          firstName: driver.firstName,
          lastName: driver.lastName,
        }));
        console.log('Formatted drivers for dropdown:', formattedDrivers);
        setDrivers(formattedDrivers);
      } else {
        console.error("Failed to load drivers:", driversResult.error);
        setDrivers([]);
      }

      // Load vehicles
      const vehiclesResult = await getVehicles({ limit: 100 });
      console.log("Vehicles result:", vehiclesResult);
      
      if (vehiclesResult.success && vehiclesResult.data) {
        const formattedVehicles: VehicleOption[] = vehiclesResult.data.map((vehicle: any) => ({
          id: vehicle.id,
          make: vehicle.make || 'Unknown',
          model: vehicle.model || 'Unknown',
          plate: vehicle.licensePlate || 'N/A',
          status: vehicle.status || 'available',
          licensePlate: vehicle.licensePlate,
        }));
        console.log('Formatted vehicles for dropdown:', formattedVehicles);
        setVehicles(formattedVehicles);
      } else {
        console.error("Failed to load vehicles:", vehiclesResult.error);
        setVehicles([]);
      }

      // Load schedules
      const schedulesResult = await getSchedules();
      console.log("Schedules result:", schedulesResult);
      
      if (schedulesResult.success && schedulesResult.data) {
        const scheduleData = schedulesResult.data as any[];
        const formattedSchedules = scheduleData.map((schedule: any) => {
          // Helper function to safely parse dates
          const safeParseDate = (dateInput: any): Date => {
            try {
              if (dateInput instanceof Date) {
                return dateInput;
              }
              
              if (typeof dateInput === 'string') {
                const date = new Date(dateInput);
                return isNaN(date.getTime()) ? new Date() : date;
              }
              
              // Handle Firestore Timestamp
              if (dateInput && typeof dateInput === 'object' && 'toDate' in dateInput) {
                const date = dateInput.toDate();
                return isNaN(date.getTime()) ? new Date() : date;
              }
              
              // Handle timestamp number
              if (typeof dateInput === 'number') {
                const date = new Date(dateInput);
                return isNaN(date.getTime()) ? new Date() : date;
              }
              
              return new Date();
            } catch (error) {
              console.error('Error parsing date:', error, dateInput);
              return new Date();
            }
          };

          // Find driver and vehicle details
          const driver = driversResult.success && driversResult.data 
            ? driversResult.data.find((d: any) => d.id === schedule.driverId)
            : null;
          
          const vehicle = vehiclesResult.success && vehiclesResult.data
            ? vehiclesResult.data.find((v: any) => v.id === schedule.vehicleId)
            : null;
          
          return {
            id: schedule.id,
            title: schedule.title || 'Untitled Schedule',
            startTime: safeParseDate(schedule.startTime),
            endTime: safeParseDate(schedule.endTime),
            driver: driver 
              ? `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || 'Unknown Driver'
              : 'Unknown Driver',
            driverId: schedule.driverId,
            vehicle: vehicle 
              ? `${vehicle.make || ''} ${vehicle.model || ''} - ${vehicle.licensePlate || ''}`.trim() || 'Unknown Vehicle'
              : 'Unknown Vehicle',
            vehicleId: schedule.vehicleId,
            from: schedule.location?.from || 'Location not specified',
            to: schedule.location?.to || 'Location not specified',
            status: schedule.status || 'scheduled',
            distance: schedule.estimatedDistance ? `${schedule.estimatedDistance} km` : 'N/A',
            estimatedDuration: schedule.estimatedDuration ? `${schedule.estimatedDuration} hours` : 'N/A',
            description: schedule.description,
          };
        });
        
        setSchedules(formattedSchedules);
      } else {
        console.error("Failed to load schedules:", schedulesResult.error);
        setSchedules([]);
      }

      // Load stats
      const statsResult = await getScheduleStats();
      if (statsResult.success && statsResult.data) {
        setStats({
          total: statsResult.data.total || 0,
          scheduled: statsResult.data.scheduled || 0,
          inProgress: statsResult.data.in_progress || 0,
          completed: statsResult.data.completed || 0,
          pending: 0,
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load schedules data",
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

  const handleCreateSchedule = async (formData: any) => {
    setLoading(true);
    
    try {
      // Convert form data to FormData object
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value instanceof Date) {
          submitData.append(key, value.toISOString());
        } else if (value !== undefined && value !== null && value !== '') {
          submitData.append(key, value.toString());
        }
      });

      const result = await createSchedule(submitData);
      if (result.success) {
        setActiveTab("schedules");
        await loadData();
        toast({
          title: "Success!",
          description: "Schedule created successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create schedule",
          variant: "destructive",
        });
      }
      return result;
    } catch (error: any) {
      console.error("Error creating schedule:", error);
      toast({
        title: "Error",
        description: `Failed to create schedule: ${error.message}`,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Handle starting a trip
  const handleStartTrip = async (scheduleId: string) => {
    setStartingScheduleId(scheduleId);
    try {
      const result = await startTripFromSchedule(scheduleId);
      
      if (result.success) {
        toast({
          title: "Trip Started!",
          description: "The trip has been started successfully. Redirecting to tracking...",
        });
        
        // Refresh data
        await loadData();
        
        // Optionally redirect to tracking page after 2 seconds
        setTimeout(() => {
          router.push("/dashboard/tracking/drivers");
        }, 2000);
      } else {
        toast({
          title: "Failed to Start Trip",
          description: result.error || "An error occurred while starting the trip",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error starting trip:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start trip",
        variant: "destructive",
      });
    } finally {
      setStartingScheduleId(null);
    }
  };

  // Filter available drivers and vehicles for dropdown
  const availableDrivers = drivers.filter(d => 
    d.status === "active" || d.status === "available"
  );
  
  const availableVehicles = vehicles.filter(v => 
    v.status === "available"
  );

  // Filter schedules based on search and status
  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = schedule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.to.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || schedule.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (id: string) => {
    console.log("View details for schedule:", id);
    // You can implement navigation here
    // router.push(`/dashboard/schedules/${id}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scheduling</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage trip schedules, assign drivers and vehicles
          </p>
        </div>
        <Button 
          className="gap-2" 
          onClick={() => setActiveTab("create")}
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
          Create New Schedule
        </Button>
      </div>

      {loading && activeTab === "schedules" ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading schedules...</span>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="schedules">All Schedules</TabsTrigger>
            <TabsTrigger value="create">Create Schedule</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>

          {/* All Schedules Tab */}
          <TabsContent value="schedules" className="space-y-4">
            {/* Filters and Search */}
            <ScheduleFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />

            {/* Stats */}
            <ScheduleStats stats={stats} />

            {/* Schedules Grid */}
            {filteredSchedules.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <p className="text-lg text-muted-foreground">
                  {searchTerm || statusFilter !== "all" 
                    ? "No schedules match your filters" 
                    : "No schedules found. Create your first schedule!"}
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => setActiveTab("create")}
                >
                  Create Schedule
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSchedules.map((schedule) => (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    onViewDetails={handleViewDetails}
                    onStartTrip={handleStartTrip}
                    isStarting={startingScheduleId === schedule.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Create Schedule Tab */}
          <TabsContent value="create">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading form data...</span>
              </div>
            ) : (
              <CreateScheduleForm
                drivers={availableDrivers}
                vehicles={availableVehicles}
                onSubmit={handleCreateSchedule}
                onCancel={() => setActiveTab("schedules")}
              />
            )}
          </TabsContent>

          {/* Calendar View Tab */}
          <TabsContent value="calendar">
            <CalendarView schedules={schedules} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}