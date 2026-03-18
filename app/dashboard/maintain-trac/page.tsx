// app/dashboard/maintenance/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Wrench, 
  CalendarIcon, 
  Plus, 
  CheckCircle, 
  Clock,
  Car,
  Filter,
  AlertCircle,
  Loader2,
  X
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getVehicles } from "@/actions/vehicle";
import { 
  getMaintenanceRecords, 
  createMaintenanceRecord,
  updateMaintenanceStatus,
  deleteMaintenanceRecord 
} from "@/actions/maintenance";
import { useToast } from "@/components/ui/toast"; // Fixed import

// Types
interface Vehicle {
  id: string;
  make: string;
  model: string;
  licensePlate: string; // Changed from 'plate' to match VehicleDataBaseSchema
}

interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: 'routine' | 'repair' | 'emergency' | 'inspection' | 'tire_change' | 'oil_change';
  title: string;
  description?: string;
  scheduledDate: Date;
  completedDate?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  odometerReading: number;
  cost?: number;
  notes?: string;
  createdAt: Date;
}

// Helper function to transform vehicle data
const transformVehicle = (vehicle: any): Vehicle => ({
  id: vehicle.id,
  make: vehicle.make || '',
  model: vehicle.model || '',
  licensePlate: vehicle.licensePlate || vehicle.plate || 'N/A', // Handle both field names
});

// Helper function to transform maintenance data
const transformMaintenance = (record: any): MaintenanceRecord => ({
  id: record.id,
  vehicleId: record.vehicleId || '',
  type: record.type || 'routine',
  title: record.title || '',
  description: record.description,
  scheduledDate: record.scheduledDate ? new Date(record.scheduledDate) : new Date(),
  completedDate: record.completedDate ? new Date(record.completedDate) : undefined,
  status: record.status || 'scheduled',
  odometerReading: record.odometerReading || 0,
  cost: record.cost,
  notes: record.notes,
  createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
});

export default function MaintenancePage() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: "",
    type: "routine" as const,
    title: "",
    description: "",
    scheduledDate: new Date(),
    odometerReading: "",
    cost: "",
    notes: "",
  });

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const [vehiclesResult, maintenanceResult] = await Promise.all([
        getVehicles({ limit: 100 }),
        getMaintenanceRecords()
      ]);

      if (vehiclesResult.success && vehiclesResult.data) {
        setVehicles(vehiclesResult.data.map(transformVehicle));
      }

      if (maintenanceResult.success && maintenanceResult.data) {
        setMaintenance(maintenanceResult.data.map(transformMaintenance));
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load maintenance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId || !formData.title || !formData.odometerReading) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('vehicleId', formData.vehicleId);
      formDataObj.append('type', formData.type);
      formDataObj.append('title', formData.title);
      formDataObj.append('description', formData.description);
      formDataObj.append('scheduledDate', formData.scheduledDate.toISOString());
      formDataObj.append('odometerReading', formData.odometerReading);
      formDataObj.append('cost', formData.cost);
      formDataObj.append('notes', formData.notes);

      const result = await createMaintenanceRecord(formDataObj);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Maintenance record created successfully",
        });
        setShowForm(false);
        setFormData({
          vehicleId: "",
          type: "routine",
          title: "",
          description: "",
          scheduledDate: new Date(),
          odometerReading: "",
          cost: "",
          notes: "",
        });
        loadData();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create maintenance record",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting:", error);
      toast({
        title: "Error",
        description: "Failed to create maintenance record",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: MaintenanceRecord['status']) => {
    try {
      const result = await updateMaintenanceStatus(id, status);
      if (result.success) {
        toast({
          title: "Success",
          description: `Maintenance marked as ${status.replace('_', ' ')}`,
        });
        loadData();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this maintenance record?")) return;
    
    try {
      const result = await deleteMaintenanceRecord(id);
      if (result.success) {
        toast({
          title: "Success",
          description: "Maintenance record deleted",
        });
        loadData();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive",
      });
    }
  };

  // Helper functions
  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} - ${vehicle.licensePlate}` : 'Unknown Vehicle';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'oil_change': return '🛢️';
      case 'tire_change': return '🛞';
      case 'routine': return '🔧';
      case 'repair': return '⚙️';
      case 'emergency': return '🚨';
      case 'inspection': return '🔍';
      default: return '🔧';
    }
  };

  const isOverdue = (record: MaintenanceRecord) => {
    return record.status === 'scheduled' && new Date(record.scheduledDate) < new Date();
  };

  // Filter maintenance
  const filteredMaintenance = selectedVehicle === "all" 
    ? maintenance 
    : maintenance.filter(item => item.vehicleId === selectedVehicle);

  // Stats
  const stats = {
    total: maintenance.length,
    scheduled: maintenance.filter(m => m.status === 'scheduled').length,
    inProgress: maintenance.filter(m => m.status === 'in_progress').length,
    completed: maintenance.filter(m => m.status === 'completed').length,
    overdue: maintenance.filter(m => m.status === 'scheduled' && new Date(m.scheduledDate) < new Date()).length,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance Tracking</h1>
          <p className="text-muted-foreground mt-1">
            Track vehicle maintenance and service records
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Maintenance
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Wrench className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedVehicle === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedVehicle("all")}
          >
            All Vehicles
          </Button>
          {vehicles.map((vehicle) => (
            <Button
              key={vehicle.id}
              variant={selectedVehicle === vehicle.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedVehicle(vehicle.id)}
            >
              {vehicle.licensePlate}
            </Button>
          ))}
        </div>
      </div>

      {/* Maintenance Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Record New Maintenance</CardTitle>
            <CardDescription>Add vehicle maintenance details</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Vehicle Selection */}
                <div className="space-y-2">
                  <Label htmlFor="vehicle">Vehicle *</Label>
                  <Select
                    value={formData.vehicleId}
                    onValueChange={(value) => setFormData({...formData, vehicleId: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.make} {vehicle.model} - {vehicle.licensePlate}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Maintenance Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">Maintenance Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({...formData, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine Maintenance</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="tire_change">Tire Change</SelectItem>
                      <SelectItem value="oil_change">Oil Change</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Service Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Oil Change, Brake Service"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>

                {/* Scheduled Date */}
                <div className="space-y-2">
                  <Label>Scheduled Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.scheduledDate && "text-muted-foreground"
                        )}
                        type="button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.scheduledDate ? format(formData.scheduledDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.scheduledDate}
                        onSelect={(date) => date && setFormData({...formData, scheduledDate: date})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Odometer Reading */}
                <div className="space-y-2">
                  <Label htmlFor="odometer">Odometer Reading (km) *</Label>
                  <Input
                    id="odometer"
                    type="number"
                    min="0"
                    placeholder="e.g., 45000"
                    value={formData.odometerReading}
                    onChange={(e) => setFormData({...formData, odometerReading: e.target.value})}
                    required
                  />
                </div>

                {/* Cost */}
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost ($)</Label>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g., 120.50"
                    value={formData.cost}
                    onChange={(e) => setFormData({...formData, cost: e.target.value})}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the maintenance work..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional information..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Save Record
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Maintenance List */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading maintenance records...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredMaintenance.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Wrench className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">No Maintenance Records</h3>
                <p className="text-muted-foreground">
                  No maintenance records found for the selected vehicle.
                </p>
              </div>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Record
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredMaintenance.map((item) => (
            <Card key={item.id} className={cn(isOverdue(item) && "border-red-200 bg-red-50/50")}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Section - Main Info */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getTypeIcon(item.type)}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{item.title}</h3>
                          <Badge className={cn(getStatusColor(item.status), "ml-2")}>
                            {getStatusText(item.status)}
                          </Badge>
                          {isOverdue(item) && (
                            <Badge variant="destructive">Overdue</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Car className="h-3 w-3" />
                          <span>{getVehicleName(item.vehicleId)}</span>
                        </div>
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-sm text-gray-600">{item.description}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Scheduled</p>
                        <p className="font-medium">{format(new Date(item.scheduledDate), "MMM d, yyyy")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Odometer</p>
                        <p className="font-medium">{item.odometerReading.toLocaleString()} km</p>
                      </div>
                      {item.cost && (
                        <div>
                          <p className="text-xs text-muted-foreground">Cost</p>
                          <p className="font-medium">${item.cost.toFixed(2)}</p>
                        </div>
                      )}
                      {item.completedDate && (
                        <div>
                          <p className="text-xs text-muted-foreground">Completed</p>
                          <p className="font-medium">{format(new Date(item.completedDate), "MMM d, yyyy")}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex flex-row md:flex-col gap-2 justify-end">
                    {item.status === 'scheduled' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusUpdate(item.id, 'in_progress')}
                      >
                        Start
                      </Button>
                    )}
                    {item.status === 'in_progress' && (
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => handleStatusUpdate(item.id, 'completed')}
                      >
                        Complete
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {item.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground">Notes:</p>
                    <p className="text-sm">{item.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}