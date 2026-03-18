"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Car, Save, Upload } from 'lucide-react'
import Link from "next/link"
import { useVehicleActions } from "@/hooks/useVehicleActions"

export default function AddVehiclePage() {
  const router = useRouter()
  const { createVehicle, loading } = useVehicleActions()
  const [formData, setFormData] = useState({
    plateNumber: "",
    model: "",
    type: "",
    fuelType: "",
    capacity: "",
    registrationNumber: "",
    year: new Date().getFullYear(),
    vin: "",
    color: "",
    purchaseDate: "",
    purchasePrice: "",
    insuranceProvider: "",
    insuranceExpiry: "",
    engineSize: "",
    transmission: "",
    fuelCapacity: "",
    notes: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const formDataObj = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== "") {
        formDataObj.append(key, value.toString())
      }
    })

    const result = await createVehicle(formDataObj)
    
    if (result.success) {
      alert("Vehicle added successfully!")
      router.push("/dashboard/v-ma")
    } else {
      alert(`Error: ${result.error || "Failed to add vehicle"}`)
    }
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
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Add New Vehicle</h1>
                  <p className="text-muted-foreground">
                    Register a new vehicle to your fleet
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-6 p-6">
              <form onSubmit={handleSubmit}>
                <div className="grid gap-8">
                  
                  {/* Basic Information Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Car className="h-5 w-5" />
                        Basic Information
                      </CardTitle>
                      <CardDescription>
                        Enter the vehicle's basic details
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="plateNumber">License Plate Number *</Label>
                            <Input
                              id="plateNumber"
                              name="plateNumber"
                              placeholder="ABC-123"
                              value={formData.plateNumber}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="registrationNumber">Registration Number *</Label>
                            <Input
                              id="registrationNumber"
                              name="registrationNumber"
                              placeholder="REG-456789"
                              value={formData.registrationNumber}
                              onChange={handleChange}
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="model">Model *</Label>
                            <Input
                              id="model"
                              name="model"
                              placeholder="Toyota Camry"
                              value={formData.model}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="type">Vehicle Type *</Label>
                            <Select
                              value={formData.type}
                              onValueChange={(value) => handleSelectChange("type", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="car">Car</SelectItem>
                                <SelectItem value="truck">Truck</SelectItem>
                                <SelectItem value="van">Van</SelectItem>
                                <SelectItem value="suv">SUV</SelectItem>
                                <SelectItem value="motorcycle">Motorcycle</SelectItem>
                                <SelectItem value="bus">Bus</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="year">Year *</Label>
                            <Input
                              id="year"
                              name="year"
                              type="number"
                              min="2000"
                              max={new Date().getFullYear() + 1}
                              value={formData.year}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="color">Color</Label>
                            <Input
                              id="color"
                              name="color"
                              placeholder="White"
                              value={formData.color}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="capacity">Passenger Capacity *</Label>
                            <Input
                              id="capacity"
                              name="capacity"
                              type="number"
                              min="1"
                              placeholder="5"
                              value={formData.capacity}
                              onChange={handleChange}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="vin">Vehicle Identification Number (VIN) *</Label>
                          <Input
                            id="vin"
                            name="vin"
                            placeholder="1HGCM82633A123456"
                            value={formData.vin}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Fuel & Technical Specifications */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Technical Specifications</CardTitle>
                      <CardDescription>
                        Vehicle technical details and specifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="fuelType">Fuel Type *</Label>
                          <Select
                            value={formData.fuelType}
                            onValueChange={(value) => handleSelectChange("fuelType", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select fuel type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gasoline">Gasoline</SelectItem>
                              <SelectItem value="diesel">Diesel</SelectItem>
                              <SelectItem value="electric">Electric</SelectItem>
                              <SelectItem value="hybrid">Hybrid</SelectItem>
                              <SelectItem value="cng">CNG</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="engineSize">Engine Size (cc)</Label>
                          <Input
                            id="engineSize"
                            name="engineSize"
                            placeholder="2000"
                            value={formData.engineSize}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="transmission">Transmission</Label>
                          <Select 
                            value={formData.transmission}
                            onValueChange={(value) => handleSelectChange("transmission", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select transmission" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="automatic">Automatic</SelectItem>
                              <SelectItem value="manual">Manual</SelectItem>
                              <SelectItem value="semi-automatic">Semi-Automatic</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="fuelCapacity">Fuel Tank Capacity (L)</Label>
                          <Input
                            id="fuelCapacity"
                            name="fuelCapacity"
                            type="number"
                            placeholder="60"
                            value={formData.fuelCapacity}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Purchase & Insurance */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Purchase & Insurance Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="purchaseDate">Purchase Date</Label>
                          <Input
                            id="purchaseDate"
                            name="purchaseDate"
                            type="date"
                            value={formData.purchaseDate}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
                          <Input
                            id="purchasePrice"
                            name="purchasePrice"
                            type="number"
                            placeholder="25000"
                            value={formData.purchasePrice}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                          <Input
                            id="insuranceProvider"
                            name="insuranceProvider"
                            placeholder="ABC Insurance Co."
                            value={formData.insuranceProvider}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="insuranceExpiry">Insurance Expiry Date</Label>
                          <Input
                            id="insuranceExpiry"
                            name="insuranceExpiry"
                            type="date"
                            value={formData.insuranceExpiry}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Additional Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="notes">Notes & Remarks</Label>
                          <Textarea
                            id="notes"
                            name="notes"
                            placeholder="Any additional information about the vehicle..."
                            rows={4}
                            value={formData.notes}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Vehicle Photos</Label>
                          <div className="border-2 border-dashed rounded-lg p-8 text-center">
                            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-sm text-muted-foreground mb-2">
                              Drag & drop vehicle photos here, or click to browse
                            </p>
                            <Button variant="outline" type="button">
                              Browse Files
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Form Actions */}
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/dashboard/v-ma")}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="gap-2">
                      {loading ? (
                        "Adding Vehicle..."
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Add Vehicle
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}