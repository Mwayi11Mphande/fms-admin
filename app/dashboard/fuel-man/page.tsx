"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Fuel, 
  Plus, 
  TrendingDown, 
  DollarSign, 
  Car,
  Filter,
  CalendarIcon,
  Download,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Simple mock data
const mockFuelLogs = [
  {
    id: "1",
    vehicle: "Ford Transit - ABC123",
    date: new Date(2024, 5, 15),
    fuelAmount: 45.5,
    fuelType: "Diesel",
    cost: 185.25,
    odometer: 45230,
    station: "Shell Station",
    mpg: 18.5,
  },
  {
    id: "2",
    vehicle: "Mercedes Sprinter - DEF456",
    date: new Date(2024, 5, 14),
    fuelAmount: 55.0,
    fuelType: "Diesel",
    cost: 224.50,
    odometer: 78540,
    station: "BP Gas",
    mpg: 16.2,
  },
  {
    id: "3",
    vehicle: "Chevrolet Express - GHI789",
    date: new Date(2024, 5, 13),
    fuelAmount: 35.2,
    fuelType: "Gasoline",
    cost: 142.75,
    odometer: 12340,
    station: "Exxon",
    mpg: 21.3,
  },
  {
    id: "4",
    vehicle: "Toyota Hiace - MNO345",
    date: new Date(2024, 5, 12),
    fuelAmount: 40.8,
    fuelType: "Gasoline",
    cost: 165.20,
    odometer: 34210,
    station: "Chevron",
    mpg: 19.8,
  },
  {
    id: "5",
    vehicle: "Ford Transit - ABC123",
    date: new Date(2024, 5, 10),
    fuelAmount: 42.3,
    fuelType: "Diesel",
    cost: 172.50,
    odometer: 44850,
    station: "Shell Station",
    mpg: 18.2,
  },
];

const mockVehicles = [
  { id: "all", name: "All Vehicles" },
  { id: "v1", name: "Ford Transit - ABC123" },
  { id: "v2", name: "Mercedes Sprinter - DEF456" },
  { id: "v3", name: "Chevrolet Express - GHI789" },
  { id: "v4", name: "Toyota Hiace - MNO345" },
];

export default function FuelManagementPage() {
  const [selectedVehicle, setSelectedVehicle] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [newRecord, setNewRecord] = useState({
    vehicle: "",
    date: format(new Date(), "yyyy-MM-dd"),
    fuelAmount: "",
    fuelType: "Diesel",
    cost: "",
    odometer: "",
    station: "",
  });

  // Calculate stats
  const filteredLogs = selectedVehicle === "all" 
    ? mockFuelLogs 
    : mockFuelLogs.filter(log => log.vehicle === mockVehicles.find(v => v.id === selectedVehicle)?.name);

  const totalFuel = filteredLogs.reduce((sum, log) => sum + log.fuelAmount, 0);
  const totalCost = filteredLogs.reduce((sum, log) => sum + log.cost, 0);
  const avgMpg = filteredLogs.length > 0 
    ? (filteredLogs.reduce((sum, log) => sum + log.mpg, 0) / filteredLogs.length).toFixed(1)
    : 0;

  const handleInputChange = (field: string, value: string) => {
    setNewRecord(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    // In a real app, you would save to database here
    console.log("New fuel record:", newRecord);
    setShowForm(false);
    setNewRecord({
      vehicle: "",
      date: format(new Date(), "yyyy-MM-dd"),
      fuelAmount: "",
      fuelType: "Diesel",
      cost: "",
      odometer: "",
      station: "",
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fuel Management</h1>
          <p className="text-muted-foreground">Track fuel consumption and expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Fuel Record
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Fuel Used</p>
                <p className="text-2xl font-bold">{totalFuel.toFixed(1)} L</p>
              </div>
              <Fuel className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg MPG</p>
                <p className="text-2xl font-bold">{avgMpg}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Filter */}
      <div className="flex gap-2 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-wrap gap-2">
          {mockVehicles.map((vehicle) => (
            <Button
              key={vehicle.id}
              variant={selectedVehicle === vehicle.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedVehicle(vehicle.id)}
            >
              {vehicle.id === "all" ? "All" : vehicle.name.split(" - ")[1]}
            </Button>
          ))}
        </div>
      </div>

      {/* Add Fuel Record Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Fuel Record</CardTitle>
            <CardDescription>Enter fuel consumption details</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vehicle">Vehicle *</Label>
                  <Select 
                    value={newRecord.vehicle} 
                    onValueChange={(value) => handleInputChange("vehicle", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockVehicles.filter(v => v.id !== "all").map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.name}>
                          {vehicle.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newRecord.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fuelAmount">Fuel Amount (L) *</Label>
                  <Input
                    id="fuelAmount"
                    type="number"
                    step="0.1"
                    placeholder="45.5"
                    value={newRecord.fuelAmount}
                    onChange={(e) => handleInputChange("fuelAmount", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fuelType">Fuel Type</Label>
                  <Select 
                    value={newRecord.fuelType} 
                    onValueChange={(value) => handleInputChange("fuelType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="Gasoline">Gasoline</SelectItem>
                      <SelectItem value="Electric">Electric</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Cost ($) *</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    placeholder="185.25"
                    value={newRecord.cost}
                    onChange={(e) => handleInputChange("cost", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="odometer">Odometer (km) *</Label>
                  <Input
                    id="odometer"
                    type="number"
                    placeholder="45230"
                    value={newRecord.odometer}
                    onChange={(e) => handleInputChange("odometer", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="station">Fuel Station</Label>
                  <Input
                    id="station"
                    placeholder="Shell Station"
                    value={newRecord.station}
                    onChange={(e) => handleInputChange("station", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Plus className="h-4 w-4 mr-2" />
                Save Record
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Fuel Logs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Fuel Logs</h2>
            <Badge variant="outline">
              {filteredLogs.length} records
            </Badge>
          </div>

          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <Card key={log.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Vehicle & Date */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold">{log.vehicle}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          <span>{format(log.date, "MMM d, yyyy")}</span>
                        </div>
                        <Badge variant="outline">{log.fuelType}</Badge>
                      </div>
                    </div>

                    {/* Fuel Details */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Fuel Amount</p>
                        <p className="font-medium">{log.fuelAmount} L</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Cost</p>
                        <p className="font-medium">${log.cost.toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">MPG</p>
                        <p className="font-medium">{log.mpg}</p>
                      </div>
                    </div>
                  </div>

                  {/* Station & Odometer */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="text-muted-foreground">Station: </span>
                        <span>{log.station}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Odometer: </span>
                        <span>{log.odometer.toLocaleString()} km</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredLogs.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <Fuel className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold">No Fuel Records</h3>
                    <p className="text-muted-foreground">
                      No fuel records found for the selected vehicle.
                    </p>
                  </div>
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Record
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Consumption & Expenses */}
        <div className="space-y-6">
          {/* Consumption Graph */}
          <Card>
            <CardHeader>
              <CardTitle>Consumption Graph</CardTitle>
              <CardDescription>Last 7 days fuel usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end justify-between gap-2 pt-8">
                {[45.5, 55.0, 35.2, 40.8, 42.3, 38.5, 47.2].map((amount, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                      style={{ height: `${(amount / 60) * 100}%` }}
                    />
                    <div className="text-xs mt-2 text-muted-foreground">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Liters per day
              </div>
            </CardContent>
          </Card>

          {/* Expenses Report */}
          <Card>
            <CardHeader>
              <CardTitle>Expenses Report</CardTitle>
              <CardDescription>Monthly fuel costs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {mockVehicles.filter(v => v.id !== "all").map((vehicle, index) => {
                  const vehicleCost = mockFuelLogs
                    .filter(log => log.vehicle === vehicle.name)
                    .reduce((sum, log) => sum + log.cost, 0);
                  const percentage = (vehicleCost / totalCost) * 100;
                  
                  return (
                    <div key={vehicle.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{vehicle.name.split(" - ")[1]}</span>
                        <span className="font-medium">${vehicleCost.toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            index === 0 ? "bg-blue-500" :
                            index === 1 ? "bg-green-500" :
                            index === 2 ? "bg-purple-500" : "bg-yellow-500"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>${totalCost.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full gap-2">
                <BarChart3 className="h-4 w-4" />
                View Full Report
              </Button>
            </CardFooter>
          </Card>

          {/* Cost Per Vehicle */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Per Vehicle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockVehicles.filter(v => v.id !== "all").map((vehicle) => {
                const vehicleLogs = mockFuelLogs.filter(log => log.vehicle === vehicle.name);
                const vehicleCost = vehicleLogs.reduce((sum, log) => sum + log.cost, 0);
                const vehicleFuel = vehicleLogs.reduce((sum, log) => sum + log.fuelAmount, 0);
                const costPerLiter = vehicleFuel > 0 ? vehicleCost / vehicleFuel : 0;
                
                return (
                  <div key={vehicle.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <div className="font-medium text-sm">{vehicle.name.split(" - ")[1]}</div>
                      <div className="text-xs text-muted-foreground">
                        {vehicleFuel.toFixed(1)}L @ ${costPerLiter.toFixed(2)}/L
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${vehicleCost.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        {vehicleLogs.length} refills
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}