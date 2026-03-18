"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Car, Fuel, Wrench, MapPin, Users, Calendar, Battery,
  Zap, Shield, Settings, AlertTriangle, Clock, TrendingUp,
  FileText, History, Navigation, Edit, Download, Printer,
  Share2, MoreVertical, ChevronLeft,
  Plus,
  RefreshCw
} from 'lucide-react'
import Link from "next/link"
import { useVehicleActions } from "@/hooks/useVehicleActions"
import { useDriverActions } from "@/hooks/useDriverActions"
import { formatDateSafe } from "@/lib/utils"

// Define types
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
  lastMaintenanceDate?: Date | { toDate: () => Date } | string;
  notes?: string;
};

type DriverDataBaseSchema = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employmentStatus: string;
};

export default function VehicleProfilePage() {
  const params = useParams()
  const router = useRouter()
  const vehicleId = params.vehicleId as string
  const [activeTab, setActiveTab] = useState("overview")
  const [vehicle, setVehicle] = useState<VehicleDataBaseSchema | null>(null)
  const [assignedDriver, setAssignedDriver] = useState<DriverDataBaseSchema | null>(null)
  const [loading, setLoading] = useState(true)
  
  const { getVehicle } = useVehicleActions()
  const { getDriver } = useDriverActions()

  useEffect(() => {
    loadVehicle()
  }, [vehicleId])

  const loadVehicle = async () => {
    setLoading(true)
    const result = await getVehicle(vehicleId)
    
    if (result.success && result.data) {
      const vehicleData = result.data as VehicleDataBaseSchema
      setVehicle(vehicleData)
      
      // Load assigned driver if exists
      if (vehicleData.assignedDriverId) {
        const driverResult = await getDriver(vehicleData.assignedDriverId)
        if (driverResult.success && driverResult.data) {
          setAssignedDriver(driverResult.data as DriverDataBaseSchema)
        }
      }
    }
    setLoading(false)
  }

  const statusColors = {
    available: "bg-green-100 text-green-800 border-green-200",
    in_use: "bg-blue-100 text-blue-800 border-blue-200",
    maintenance: "bg-amber-100 text-amber-800 border-amber-200",
    out_of_service: "bg-red-100 text-red-800 border-red-200",
  } as const;

  const statusDisplayMap = {
    available: "Available",
    in_use: "In Use",
    maintenance: "In Maintenance",
    out_of_service: "Out of Service",
  };

  const fuelTypeMap = {
    gasoline: "Gasoline",
    diesel: "Diesel",
    electric: "Electric",
    hybrid: "Hybrid",
    cng: "CNG",
  };

  const vehicleTypeMap = {
    car: "Car",
    truck: "Truck",
    van: "Van",
    suv: "SUV",
    motorcycle: "Motorcycle",
    bus: "Bus",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading vehicle...</p>
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Vehicle Not Found</h2>
          <p className="text-muted-foreground mt-2">The vehicle you're looking for doesn't exist.</p>
          <Button className="mt-4" onClick={() => router.push('/dashboard/v-ma')}>
            Back to Vehicles
          </Button>
        </div>
      </div>
    )
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
          <div className="@container/main flex flex-1 flex-col gap-2">
            
            {/* Header */}
            <div className="flex flex-col gap-4 p-6 pb-2">
              <div className="flex items-center gap-4">
                <Link href="/dashboard/v-ma">
                  <Button variant="ghost" size="icon">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    {vehicle.make} {vehicle.model}
                    <span className="text-muted-foreground ml-2">{vehicle.licensePlate}</span>
                  </h1>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline">
                      {vehicleTypeMap[vehicle.vehicleType]}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={statusColors[vehicle.status]}
                    >
                      {statusDisplayMap[vehicle.status]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      ID: {vehicle.id}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={async () => {
                    if (confirm('Reset this vehicle to Available status?')) {
                      const { forceResetVehicleStatus } = await import('@/actions/vehicle-cleanup');
                      const result = await forceResetVehicleStatus(vehicle.id);
                      if (result.success) {
                        alert(result.message);
                        loadVehicle();
                      } else {
                        alert('Failed to reset: ' + result.error);
                      }
                    }
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset Status
                </Button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col gap-6 p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-6">
                  <TabsList>
                    <TabsTrigger value="overview">
                      <Car className="h-4 w-4 mr-2" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="specifications">
                      <Settings className="h-4 w-4 mr-2" />
                      Specifications
                    </TabsTrigger>
                    <TabsTrigger value="documents">
                      <FileText className="h-4 w-4 mr-2" />
                      Documents
                    </TabsTrigger>
                  </TabsList>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => router.push(`/dashboard/v-ma/${vehicleId}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {/* Vehicle Stats */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Mileage</p>
                            <p className="text-3xl font-bold">{vehicle.currentMileage.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">kilometers</p>
                          </div>
                          <div className="rounded-full bg-blue-100 p-3">
                            <TrendingUp className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Fuel Type</p>
                            <p className="text-3xl font-bold">{fuelTypeMap[vehicle.fuelType]}</p>
                          </div>
                          <div className="rounded-full bg-green-100 p-3">
                            <Fuel className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Year</p>
                            <p className="text-3xl font-bold">{vehicle.year}</p>
                            <p className="text-sm text-muted-foreground">manufactured</p>
                          </div>
                          <div className="rounded-full bg-amber-100 p-3">
                            <Calendar className="h-6 w-6 text-amber-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Capacity</p>
                            <p className="text-3xl font-bold">{vehicle.capacity || 5}</p>
                            <p className="text-sm text-muted-foreground">passengers</p>
                          </div>
                          <div className="rounded-full bg-purple-100 p-3">
                            <Users className="h-6 w-6 text-purple-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Driver & Information */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Assigned Driver */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Assigned Driver
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {assignedDriver ? (
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-16 w-16">
                                <AvatarFallback className="text-lg">
                                  {assignedDriver.firstName?.charAt(0)}{assignedDriver.lastName?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="text-xl font-bold">{assignedDriver.firstName} {assignedDriver.lastName}</h3>
                                <p className="text-muted-foreground">{assignedDriver.email}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline">{assignedDriver.phone}</Badge>
                                  <Badge 
                                    variant="secondary" 
                                    className={
                                      assignedDriver.employmentStatus === 'active' 
                                        ? "bg-green-100 text-green-800" 
                                        : "bg-gray-100 text-gray-800"
                                    }
                                  >
                                    {assignedDriver.employmentStatus}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex gap-4">
                              <Button variant="outline" className="flex-1">
                                Contact Driver
                              </Button>
                              <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => router.push(`/dashboard/driver_m/${assignedDriver.id}`)}
                              >
                                View Profile
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold">No Driver Assigned</h3>
                            <p className="text-muted-foreground mt-2">
                              This vehicle is currently not assigned to any driver.
                            </p>
                            <Button className="mt-4">Assign Driver</Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Vehicle Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Car className="h-5 w-5" />
                          Vehicle Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm font-medium text-muted-foreground">Registration Number</div>
                              <div className="font-medium">{vehicle.registrationNumber}</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-muted-foreground">VIN</div>
                              <div className="font-medium font-mono">{vehicle.vin}</div>
                            </div>
                          </div>
                          <Separator />
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm font-medium text-muted-foreground">Color</div>
                              <div className="font-medium">{vehicle.color || 'Not specified'}</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-muted-foreground">Transmission</div>
                              <div className="font-medium">{vehicle.transmission || 'Not specified'}</div>
                            </div>
                          </div>
                          <Separator />
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">Purchase Date</div>
                            <div className="font-medium">{formatDateSafe(vehicle.purchaseDate)}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Specifications Tab */}
                <TabsContent value="specifications" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Technical Specifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-muted-foreground">Make</div>
                          <div className="font-medium">{vehicle.make}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-muted-foreground">Model</div>
                          <div className="font-medium">{vehicle.model}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-muted-foreground">Year</div>
                          <div className="font-medium">{vehicle.year}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-muted-foreground">Vehicle Type</div>
                          <div className="font-medium">{vehicleTypeMap[vehicle.vehicleType]}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-muted-foreground">Fuel Type</div>
                          <div className="font-medium">{fuelTypeMap[vehicle.fuelType]}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-muted-foreground">Engine Size</div>
                          <div className="font-medium">{vehicle.engineSize || 'Not specified'}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-muted-foreground">Fuel Capacity</div>
                          <div className="font-medium">{vehicle.fuelCapacity ? `${vehicle.fuelCapacity}L` : 'Not specified'}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-muted-foreground">Passenger Capacity</div>
                          <div className="font-medium">{vehicle.capacity || 'Not specified'}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Vehicle Documents</CardTitle>
                      <CardDescription>
                        All related documents and certificates
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="rounded-lg bg-blue-100 p-3">
                              <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold">Vehicle Registration</h4>
                              <p className="text-sm text-muted-foreground">
                                Expires: {vehicle.registrationNumber ? formatDateSafe(vehicle.insuranceExpiry) : 'Not available'}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Download
                          </Button>
                        </div>

                        {vehicle.insuranceProvider && (
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="rounded-lg bg-green-100 p-3">
                                <Shield className="h-6 w-6 text-green-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold">Insurance Certificate</h4>
                                <p className="text-sm text-muted-foreground">
                                  Provider: {vehicle.insuranceProvider}
                                </p>
                                {vehicle.insuranceExpiry && (
                                  <p className="text-sm text-muted-foreground">
                                    Expires: {formatDateSafe(vehicle.insuranceExpiry)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              Download
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}