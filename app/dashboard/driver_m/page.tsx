// app/dashboard/driver_m/page.tsx
"use client"

import { useState, useEffect } from "react"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Search, Filter, MoreVertical, Plus, Eye, Edit, Trash2, Download, Upload, UserPlus, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { format } from "date-fns"
import { useDriverActions } from "@/hooks/useDriverActions"

// Define the DriverDataBaseSchema type
type DriverDataBaseSchema = {
  id: string;
  createdAt: Date | { toDate: () => Date } | string;
  updatedAt: Date | { toDate: () => Date } | string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: Date | { toDate: () => Date } | string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  employmentStatus: 'active' | 'inactive' | 'on_leave' | 'terminated';
  hireDate: Date | { toDate: () => Date } | string;
  assignedVehicleId?: string;
  notes?: string;
};

const statusColors = {
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-gray-100 text-gray-800 border-gray-200",
  on_leave: "bg-blue-100 text-blue-800 border-blue-200",
  terminated: "bg-red-100 text-red-800 border-red-200",
} as const;

const statusDisplayMap: Record<DriverDataBaseSchema['employmentStatus'], string> = {
  active: "Active",
  inactive: "Inactive",
  on_leave: "On Leave",
  terminated: "Terminated",
};

// Helper function to safely convert any date-like object to Date
const safeToDate = (dateInput: Date | { toDate: () => Date } | string | undefined): Date | null => {
  if (!dateInput) return null;
  
  try {
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? null : dateInput;
    }
    
    // Handle Firestore Timestamp
    if (typeof dateInput === 'object' && dateInput !== null && 'toDate' in dateInput) {
      const date = (dateInput as any).toDate();
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Handle string
    if (typeof dateInput === 'string') {
      const date = new Date(dateInput);
      return isNaN(date.getTime()) ? null : date;
    }
    
    return null;
  } catch (error) {
    console.error('Error converting to date:', error);
    return null;
  }
};

// Helper function to safely format dates
const formatDateSafe = (dateInput: Date | { toDate: () => Date } | string | undefined, formatStr: string = "MMM dd, yyyy"): string => {
  const date = safeToDate(dateInput);
  if (!date) return "Not specified";
  
  try {
    return format(date, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return "Invalid date";
  }
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverDataBaseSchema[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<DriverDataBaseSchema | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  })

  const { 
    loading, 
    getDrivers, 
    getDriverStats, 
    createDriver,
    deleteDriver,
    updateDriverStatus 
  } = useDriverActions()

  // Load drivers and stats
  useEffect(() => {
    loadDrivers()
    loadDriverStats()
  }, [statusFilter, searchQuery, pagination.page])

  const loadDrivers = async () => {
    const result = await getDrivers({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchQuery || undefined,
      page: pagination.page,
      limit: pagination.limit
    })
    
    if (result.success && result.data) {
      setDrivers(result.data as DriverDataBaseSchema[])
      if (result.pagination) {
        setPagination(result.pagination)
      }
    } else if (result && typeof result === 'object' && 'error' in result) {
      console.error("Error loading drivers:", (result as any).error)
    }
  }

  const loadDriverStats = async () => {
    const result = await getDriverStats()
    if (result.success && result.data) {
      setStatusStats(result.data)
    }
  }

  const [statusStats, setStatusStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    on_leave: 0,
    terminated: 0,
  })

  const handleViewDetails = (driver: DriverDataBaseSchema) => {
    setSelectedDriver(driver)
    setIsViewDialogOpen(true)
  }

  const handleStatusChange = async (driverId: string, newStatus: 'active' | 'inactive' | 'on_leave' | 'terminated') => {
    const result = await updateDriverStatus(driverId, newStatus)
    if (result.success) {
      alert("Driver status updated successfully")
      loadDrivers()
      loadDriverStats()
    } else {
      const errorMsg = (result as any).error || "Failed to update driver status"
      alert(`Error: ${errorMsg}`)
    }
  }

  const handleDeleteDriver = async (driverId: string) => {
    if (window.confirm("Are you sure you want to delete this driver?")) {
      const result = await deleteDriver(driverId)
      if (result.success) {
        alert("Driver deleted successfully")
        loadDrivers()
        loadDriverStats()
      } else {
        const errorMsg = (result as any).error || "Failed to delete driver"
        alert(`Error: ${errorMsg}`)
      }
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  // Format driver name
  const formatDriverName = (driver: DriverDataBaseSchema) => {
    return `${driver.firstName} ${driver.lastName}`
  }

  // Get status display text
  const getStatusDisplay = (status: DriverDataBaseSchema['employmentStatus']) => {
    return statusDisplayMap[status] || status.charAt(0).toUpperCase() + status.slice(1)
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
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Driver Management</h1>
                  <p className="text-muted-foreground">
                    Manage and monitor all drivers in your fleet
                  </p>
                </div>
                <Dialog open={isAddDriverOpen} onOpenChange={setIsAddDriverOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Add New Driver
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Add New Driver</DialogTitle>
                      <DialogDescription>
                        Enter the driver's information to add them to the system.
                      </DialogDescription>
                    </DialogHeader>
                    <AddDriverForm 
                      onClose={() => {
                        setIsAddDriverOpen(false)
                        loadDrivers()
                        loadDriverStats()
                      }} 
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Drivers</p>
                        <p className="text-3xl font-bold">{statusStats.total}</p>
                      </div>
                      <div className="rounded-full bg-blue-100 p-3">
                        <UserPlus className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active</p>
                        <p className="text-3xl font-bold text-green-600">{statusStats.active}</p>
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
                        <p className="text-sm font-medium text-muted-foreground">On Leave</p>
                        <p className="text-3xl font-bold text-blue-600">{statusStats.on_leave}</p>
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
                        <p className="text-sm font-medium text-muted-foreground">Terminated</p>
                        <p className="text-3xl font-bold text-red-600">{statusStats.terminated}</p>
                      </div>
                      <div className="rounded-full bg-red-100 p-3">
                        <XCircle className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                          placeholder="Search drivers by name, email, or ID..."
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
                            All Drivers ({statusStats.total})
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500"></div>
                              Active ({statusStats.active})
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                              Inactive ({statusStats.inactive})
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter("on_leave")}>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                              On Leave ({statusStats.on_leave})
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter("terminated")}>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-red-500"></div>
                              Terminated ({statusStats.terminated})
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

              {/* Drivers Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Driver List</CardTitle>
                  <CardDescription>
                    {loading ? "Loading..." : `${drivers.length} drivers found`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-2 text-sm text-muted-foreground">Loading drivers...</p>
                      </div>
                    </div>
                  ) : drivers.length === 0 ? (
                    <div className="text-center p-8">
                      <p className="text-muted-foreground">No drivers found. Add your first driver!</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Driver</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>License</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {drivers.map((driver) => {
                          const licenseExpiryDate = safeToDate(driver.licenseExpiry);
                          const isLicenseExpired = licenseExpiryDate && licenseExpiryDate < new Date();
                          
                          return (
                            <TableRow key={driver.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarFallback>
                                      {driver.firstName?.charAt(0)}{driver.lastName?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{formatDriverName(driver)}</div>
                                    <div className="text-sm text-muted-foreground">{driver.id}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="text-sm">{driver.email}</div>
                                  <div className="text-sm text-muted-foreground">{driver.phone}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="text-sm">{driver.licenseNumber}</div>
                                  <div className={`text-xs ${
                                    isLicenseExpired
                                      ? "text-red-600 font-medium"
                                      : "text-muted-foreground"
                                  }`}>
                                    {licenseExpiryDate ? (
                                      <>
                                        Expires: {formatDateSafe(driver.licenseExpiry, "MMM dd, yyyy")}
                                        {isLicenseExpired && (
                                          <span className="ml-1">(Expired)</span>
                                        )}
                                      </>
                                    ) : (
                                      "No expiry date"
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {driver.assignedVehicleId ? (
                                    <Badge variant="outline">{driver.assignedVehicleId}</Badge>
                                  ) : (
                                    <span className="text-muted-foreground">No vehicle assigned</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={statusColors[driver.employmentStatus]}
                                >
                                  {getStatusDisplay(driver.employmentStatus)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => handleViewDetails(driver)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    View
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuItem onClick={() => handleViewDetails(driver)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Driver
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => handleStatusChange(driver.id, "active")}
                                        disabled={driver.employmentStatus === "active"}
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Mark as Active
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleStatusChange(driver.id, "inactive")}
                                        disabled={driver.employmentStatus === "inactive"}
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Mark as Inactive
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleStatusChange(driver.id, "on_leave")}
                                        disabled={driver.employmentStatus === "on_leave"}
                                      >
                                        <Clock className="mr-2 h-4 w-4" />
                                        Mark as On Leave
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleStatusChange(driver.id, "terminated")}
                                        disabled={driver.employmentStatus === "terminated"}
                                      >
                                        <AlertCircle className="mr-2 h-4 w-4" />
                                        Terminate Driver
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        className="text-red-600"
                                        onClick={() => handleDeleteDriver(driver.id)}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Driver
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
                <CardFooter>
                  <div className="flex w-full items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {drivers.length} of {pagination.total} drivers
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1 || loading}
                      >
                        Previous
                      </Button>
                      <Button variant="outline" size="sm">
                        {pagination.page}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages || loading}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* View Driver Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          {selectedDriver && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {selectedDriver.firstName?.charAt(0)}{selectedDriver.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle>{formatDriverName(selectedDriver)}</DialogTitle>
                    <DialogDescription>
                      {selectedDriver.id} • {selectedDriver.email}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Contact Information</Label>
                        <div className="rounded-lg border p-3">
                          <div className="text-sm font-medium">Phone</div>
                          <div>{selectedDriver.phone}</div>
                          <Separator className="my-2" />
                          <div className="text-sm font-medium">Email</div>
                          <div>{selectedDriver.email}</div>
                          {selectedDriver.address && (
                            <>
                              <Separator className="my-2" />
                              <div className="text-sm font-medium">Address</div>
                              <div>{selectedDriver.address}</div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>License Information</Label>
                        <div className="rounded-lg border p-3">
                          <div className="text-sm font-medium">License Number</div>
                          <div>{selectedDriver.licenseNumber}</div>
                          <Separator className="my-2" />
                          <div className="text-sm font-medium">Expiry Date</div>
                          <div className={
                            safeToDate(selectedDriver.licenseExpiry) && safeToDate(selectedDriver.licenseExpiry)! < new Date()
                              ? "text-red-600 font-medium"
                              : ""
                          }>
                            {formatDateSafe(selectedDriver.licenseExpiry, "MMMM dd, yyyy")}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {selectedDriver.emergencyContact && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Emergency Contact</Label>
                          <div className="rounded-lg border p-3">
                            <div className="text-sm font-medium">Name</div>
                            <div>{selectedDriver.emergencyContact.name}</div>
                            <Separator className="my-2" />
                            <div className="text-sm font-medium">Phone</div>
                            <div>{selectedDriver.emergencyContact.phone}</div>
                            <Separator className="my-2" />
                            <div className="text-sm font-medium">Relationship</div>
                            <div>{selectedDriver.emergencyContact.relationship}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <div>
                          <Badge 
                            variant="outline" 
                            className={`text-lg ${statusColors[selectedDriver.employmentStatus]}`}
                          >
                            {getStatusDisplay(selectedDriver.employmentStatus)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Assigned Vehicle</Label>
                        <div className="text-lg font-medium">
                          {selectedDriver.assignedVehicleId ? (
                            <Badge variant="secondary">{selectedDriver.assignedVehicleId}</Badge>
                          ) : (
                            <span className="text-muted-foreground">No vehicle assigned</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Hire Date</Label>
                        <div className="text-lg font-medium">
                          {formatDateSafe(selectedDriver.hireDate, "MMM dd, yyyy")}
                        </div>
                      </div>
                    </div>
                    
                    {selectedDriver.notes && (
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <div className="rounded-lg border p-3">
                          <p className="text-sm">{selectedDriver.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="documents" className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">
                      Driver documents will be displayed here.
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="activity" className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">
                      Recent driver activity will be displayed here.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsViewDialogOpen(false)
                  // You can implement edit functionality here
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Driver
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}

// Add Driver Form Component
function AddDriverForm({ onClose }: { onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const { createDriver } = useDriverActions()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget)
    
    const result = await createDriver(formData)
    
    if (result.success) {
      alert("Driver created successfully")
      onClose()
    } else {
      const errorMsg = (result as any).error || "Failed to create driver"
      alert(`Error: ${errorMsg}`)
    }
    
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input id="firstName" name="firstName" placeholder="John" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input id="lastName" name="lastName" placeholder="Doe" required />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input id="email" name="email" type="email" placeholder="john@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input id="phone" name="phone" placeholder="+1 (555) 123-4567" required />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">License Number *</Label>
            <Input id="licenseNumber" name="licenseNumber" placeholder="DL-123456789" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="licenseExpiry">License Expiry Date *</Label>
            <Input id="licenseExpiry" name="licenseExpiry" type="date" required />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" placeholder="123 Main St, City, State" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hireDate">Hire Date</Label>
            <Input id="hireDate" name="hireDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employmentStatus">Employment Status</Label>
            <Select name="employmentStatus" defaultValue="active">
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="assignedVehicleId">Assign Vehicle</Label>
            <Input id="assignedVehicleId" name="assignedVehicleId" placeholder="VH-001" />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" name="notes" placeholder="Additional notes..." />
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium">Emergency Contact (Optional)</Label>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName" className="text-xs">Name</Label>
              <Input id="emergencyContactName" name="emergencyContactName" placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone" className="text-xs">Phone</Label>
              <Input id="emergencyContactPhone" name="emergencyContactPhone" placeholder="+1 (555) 987-6543" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="emergencyContactRelationship" className="text-xs">Relationship</Label>
              <Input id="emergencyContactRelationship" name="emergencyContactRelationship" placeholder="Spouse" />
            </div>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Adding..." : "Add Driver"}
        </Button>
      </DialogFooter>
    </form>
  )
}