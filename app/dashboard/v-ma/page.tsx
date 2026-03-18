"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Search, Filter, MoreVertical, Plus, Car, Wrench, Download, Upload, Eye, Edit, Trash2,
  CheckCircle, Clock, Truck, Bus,
  RefreshCw,
} from 'lucide-react'
import Link from "next/link"
import { useVehicleActions } from "@/hooks/useVehicleActions"
import { formatDateSafe } from "@/lib/utils"

// Define the VehicleDataBaseSchema type
type VehicleDataBaseSchema = {
  id: string;
  createdAt: Date | { toDate: () => Date } | string;
  updatedAt: Date | { toDate: () => Date } | string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  vehicleType: 'car' | 'truck' | 'van' | 'suv' | 'motorcycle' | 'bus';
  color?: string;
  purchaseDate: Date | { toDate: () => Date } | string;
  purchasePrice?: number;
  currentMileage: number;
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'cng';
  fuelCapacity?: number;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  assignedDriverId?: string;
  registrationNumber?: string;
  capacity?: number;
  engineSize?: string;
  transmission?: string;
  insuranceProvider?: string;
  insuranceExpiry?: Date | { toDate: () => Date } | string;
  notes?: string;
};

const statusColors = {
  available: "bg-green-100 text-green-800 border-green-200",
  in_use: "bg-blue-100 text-blue-800 border-blue-200",
  maintenance: "bg-amber-100 text-amber-800 border-amber-200",
  out_of_service: "bg-red-100 text-red-800 border-red-200",
} as const;

const statusDisplayMap: Record<VehicleDataBaseSchema['status'], string> = {
  available: "Available",
  in_use: "In Use",
  maintenance: "Maintenance",
  out_of_service: "Out of Service",
};

const vehicleTypeMap = {
  car: "Car",
  truck: "Truck",
  van: "Van",
  suv: "SUV",
  motorcycle: "Motorcycle",
  bus: "Bus",
};

const fuelTypeMap = {
  gasoline: "Gasoline",
  diesel: "Diesel",
  electric: "Electric",
  hybrid: "Hybrid",
  cng: "CNG",
};

const vehicleTypeIcons = {
  car: Car,
  truck: Truck,
  van: Car,
  suv: Car,
  motorcycle: Car,
  bus: Bus,
};

// Type for vehicle stats
type VehicleStats = {
  total: number;
  available: number;
  in_use: number;
  maintenance: number;
  out_of_service: number;
  byType?: {
    car: number;
    truck: number;
    van: number;
    suv: number;
    motorcycle: number;
    bus: number;
  };
};

export default function VehiclesPage() {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<VehicleDataBaseSchema[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  
  const { 
    getVehicles, 
    getVehicleStats, 
    deleteVehicle,
    updateVehicleStatus 
  } = useVehicleActions()

  const [statusStats, setStatusStats] = useState({
    total: 0,
    available: 0,
    in_use: 0,
    maintenance: 0,
    out_of_service: 0,
  })

  const [typeStats, setTypeStats] = useState({
    car: 0,
    truck: 0,
    van: 0,
    suv: 0,
    motorcycle: 0,
    bus: 0,
  })

  // Load vehicles and stats
  useEffect(() => {
    loadVehicles()
    loadVehicleStats()
  }, [statusFilter, typeFilter, searchQuery])

  const loadVehicles = async () => {
    setLoading(true)
    const result = await getVehicles({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      search: searchQuery || undefined,
    })
    
    if (result.success && result.data) {
      setVehicles(result.data as VehicleDataBaseSchema[])
    }
    setLoading(false)
  }

  const loadVehicleStats = async () => {
    const result = await getVehicleStats()
    if (result.success && result.data) {
      const stats = result.data as VehicleStats
      setStatusStats({
        total: stats.total || 0,
        available: stats.available || 0,
        in_use: stats.in_use || 0,
        maintenance: stats.maintenance || 0,
        out_of_service: stats.out_of_service || 0,
      })
      
      // Update type stats
      if (stats.byType) {
        setTypeStats({
          car: stats.byType.car || 0,
          truck: stats.byType.truck || 0,
          van: stats.byType.van || 0,
          suv: stats.byType.suv || 0,
          motorcycle: stats.byType.motorcycle || 0,
          bus: stats.byType.bus || 0,
        })
      }
    }
  }

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      const result = await deleteVehicle(vehicleId)
      if (result.success) {
        alert("Vehicle deleted successfully")
        loadVehicles()
        loadVehicleStats()
      } else {
        const errorMsg = (result as any).error || "Failed to delete vehicle"
        alert(`Error: ${errorMsg}`)
      }
    }
  }

  const handleStatusChange = async (vehicleId: string, newStatus: 'available' | 'in_use' | 'maintenance' | 'out_of_service') => {
    const result = await updateVehicleStatus(vehicleId, newStatus)
    if (result.success) {
      alert("Vehicle status updated successfully")
      loadVehicles()
      loadVehicleStats()
    } else {
      const errorMsg = (result as any).error || "Failed to update vehicle status"
      alert(`Error: ${errorMsg}`)
    }
  }

  // Get Vehicle Type Icon
  const getVehicleTypeIcon = (type: keyof typeof vehicleTypeIcons) => {
    const IconComponent = vehicleTypeIcons[type] || Car;
    return <IconComponent className="h-4 w-4" />;
  };

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
          <div className="@container/main flex flex-1 flex-col gap-2">
            
            {/* Header */}
            <div className="flex flex-col gap-4 p-6 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Vehicle Management</h1>
                    <p className="text-muted-foreground">
                      Manage and monitor all vehicles in your fleet
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={async () => {
                        if (confirm('This will reset all vehicles stuck in "In Use" status. Continue?')) {
                          const { resetStuckVehicles } = await import('@/actions/vehicle-cleanup');
                          const result = await resetStuckVehicles();
                          if (result.success) {
                            alert(result.message);
                            loadVehicles();
                            loadVehicleStats();
                          } else {
                            alert('Failed to reset vehicles: ' + result.error);
                          }
                        }
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reset Stuck
                    </Button>
                    <Link href="/dashboard/v-ma/add">
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Vehicle
                      </Button>
                    </Link>
                  </div>
                </div>

              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Vehicles</p>
                        <p className="text-3xl font-bold">{statusStats.total}</p>
                      </div>
                      <div className="rounded-full bg-blue-100 p-3">
                        <Car className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Available</p>
                        <p className="text-3xl font-bold text-green-600">{statusStats.available}</p>
                      </div>
                      <div className="rounded-full bg-green-100 p-3">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">In Use</p>
                        <p className="text-3xl font-bold text-blue-600">{statusStats.in_use}</p>
                      </div>
                      <div className="rounded-full bg-blue-100 p-3">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Maintenance</p>
                        <p className="text-3xl font-bold text-amber-600">{statusStats.maintenance}</p>
                      </div>
                      <div className="rounded-full bg-amber-100 p-3">
                        <Wrench className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Vehicle Type Distribution */}
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {Object.entries(typeStats).map(([type, count]) => (
                      <div key={type} className="text-center">
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-sm text-muted-foreground capitalize flex items-center justify-center gap-1">
                          {getVehicleTypeIcon(type as keyof typeof vehicleTypeIcons)}
                          {vehicleTypeMap[type as keyof typeof vehicleTypeMap] || type}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="flex flex-col gap-4 p-6">
              {/* Controls */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 items-center gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search vehicles by plate, model, or ID..."
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="gap-2">
                            <Filter className="h-4 w-4" />
                            Filter
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                            All Vehicles ({statusStats.total})
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter("available")}>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500"></div>
                              Available ({statusStats.available})
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter("in_use")}>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                              In Use ({statusStats.in_use})
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter("maintenance")}>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                              Maintenance ({statusStats.maintenance})
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter("out_of_service")}>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-red-500"></div>
                              Out of Service ({statusStats.out_of_service})
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Upload className="h-4 w-4" />
                        Import
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Loading State */}
              {loading ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="text-muted-foreground mt-2">Loading vehicles...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Vehicles Grid */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {vehicles.map((vehicle) => {
                      const VehicleTypeIcon = vehicleTypeIcons[vehicle.vehicleType] || Car;
                      
                      return (
                        <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                          <CardContent className="p-0">
                            {/* Vehicle Image Header */}
                            <div className="relative h-48 bg-gradient-to-br from-gray-900 to-gray-700">
                              {/* Mock vehicle image with overlay */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                  <VehicleTypeIcon className="h-16 w-16 text-white/50 mx-auto" />
                                  <div className="mt-2 text-white/70 font-medium">{vehicle.make} {vehicle.model}</div>
                                </div>
                              </div>
                              
                              {/* Status Badge */}
                              <div className="absolute top-3 right-3">
                                <Badge 
                                  variant="outline" 
                                  className={`${statusColors[vehicle.status]} backdrop-blur-sm`}
                                >
                                  {statusDisplayMap[vehicle.status]}
                                </Badge>
                              </div>
                              
                              {/* Vehicle ID */}
                              <div className="absolute bottom-3 left-3">
                                <div className="text-white font-bold text-lg">{vehicle.id}</div>
                                <div className="text-white/80 text-sm">{vehicle.licensePlate}</div>
                              </div>
                            </div>

                            {/* Vehicle Details */}
                            <div className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h3 className="text-xl font-bold">{vehicle.make} {vehicle.model}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="capitalize">
                                      {vehicleTypeMap[vehicle.vehicleType]}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">{vehicle.year}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-blue-600">
                                    {vehicle.currentMileage.toLocaleString()}
                                  </div>
                                  <div className="text-sm text-muted-foreground">km</div>
                                </div>
                              </div>

                              {/* Specifications */}
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="space-y-1">
                                  <div className="text-sm text-muted-foreground">Fuel Type</div>
                                  <div className="font-medium">{fuelTypeMap[vehicle.fuelType]}</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-sm text-muted-foreground">Capacity</div>
                                  <div className="font-medium">{vehicle.capacity || 5} seats</div>
                                </div>
                                {vehicle.transmission && (
                                  <div className="space-y-1">
                                    <div className="text-sm text-muted-foreground">Transmission</div>
                                    <div className="font-medium capitalize">{vehicle.transmission}</div>
                                  </div>
                                )}
                                <div className="space-y-1">
                                  <div className="text-sm text-muted-foreground">Color</div>
                                  <div className="font-medium">{vehicle.color || 'N/A'}</div>
                                </div>
                              </div>

                              {/* Additional Info */}
                              <div className="space-y-3 mb-6">
                                {vehicle.insuranceProvider && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Insurance</span>
                                    <span className="font-medium">{vehicle.insuranceProvider}</span>
                                  </div>
                                )}
                                {vehicle.insuranceExpiry && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Insurance Expires</span>
                                    <span className="font-medium">{formatDateSafe(vehicle.insuranceExpiry)}</span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Purchase Date</span>
                                  <span className="font-medium">{formatDateSafe(vehicle.purchaseDate)}</span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                <Link href={`/dashboard/v-ma/${vehicle.id}`} className="flex-1">
                                  <Button variant="outline" className="w-full gap-2">
                                    <Eye className="h-4 w-4" />
                                    View Details
                                  </Button>
                                </Link>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/v-ma/${vehicle.id}`)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Full Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/v-ma/${vehicle.id}/edit`)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Vehicle
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleStatusChange(vehicle.id, "available")}
                                      disabled={vehicle.status === "available"}
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Mark as Available
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleStatusChange(vehicle.id, "in_use")}
                                      disabled={vehicle.status === "in_use"}
                                    >
                                      <Clock className="mr-2 h-4 w-4" />
                                      Mark as In Use
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleStatusChange(vehicle.id, "maintenance")}
                                      disabled={vehicle.status === "maintenance"}
                                    >
                                      <Wrench className="mr-2 h-4 w-4" />
                                      Mark for Maintenance
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-red-600"
                                      onClick={() => handleDeleteVehicle(vehicle.id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Vehicle
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Empty State */}
                  {vehicles.length === 0 && (
                    <Card>
                      <CardContent className="py-12">
                        <div className="text-center">
                          <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold">No vehicles found</h3>
                          <p className="text-muted-foreground mt-2">
                            {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' 
                              ? "Try adjusting your search or filter to find what you're looking for."
                              : "No vehicles have been added yet. Add your first vehicle to get started!"}
                          </p>
                          {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? (
                            <Button 
                              variant="outline" 
                              className="mt-4"
                              onClick={() => {
                                setSearchQuery("")
                                setStatusFilter("all")
                                setTypeFilter("all")
                              }}
                            >
                              Clear filters
                            </Button>
                          ) : (
                            <Link href="/dashboard/v-ma/add">
                              <Button className="mt-4 gap-2">
                                <Plus className="h-4 w-4" />
                                Add First Vehicle
                              </Button>
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}