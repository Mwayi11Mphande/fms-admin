"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Settings,
  User,
  Users,
  Building,
  Shield,
  Key,
  Mail,
  Phone,
  MapPin,
  Globe,
  Save,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Eye,
  EyeOff,
  Upload,
  Calendar,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Mock data
const mockUsers = [
  {
    id: "1",
    slug: "john-smith",
    name: "John Smith",
    email: "john@example.com",
    role: "admin",
    status: "active",
    phone: "+1234567890",
    joinedDate: new Date(2024, 0, 15),
    lastLogin: new Date(2024, 5, 14, 14, 30),
    permissions: ["all"],
  },
  {
    id: "2",
    slug: "maria-garcia",
    name: "Maria Garcia",
    email: "maria@example.com",
    role: "manager",
    status: "active",
    phone: "+1234567891",
    joinedDate: new Date(2024, 1, 20),
    lastLogin: new Date(2024, 5, 15, 9, 15),
    permissions: ["view", "edit", "reports"],
  },
  {
    id: "3",
    slug: "robert-johnson",
    name: "Robert Johnson",
    email: "robert@example.com",
    role: "dispatcher",
    status: "active",
    phone: "+1234567892",
    joinedDate: new Date(2024, 2, 10),
    lastLogin: new Date(2024, 5, 13, 16, 45),
    permissions: ["view", "dispatch"],
  },
  {
    id: "4",
    slug: "sarah-williams",
    name: "Sarah Williams",
    email: "sarah@example.com",
    role: "driver",
    status: "inactive",
    phone: "+1234567893",
    joinedDate: new Date(2024, 3, 5),
    lastLogin: new Date(2024, 4, 28, 11, 20),
    permissions: ["view"],
  },
  {
    id: "5",
    slug: "james-brown",
    name: "James Brown",
    email: "james@example.com",
    role: "viewer",
    status: "active",
    phone: "+1234567894",
    joinedDate: new Date(2024, 4, 12),
    lastLogin: new Date(2024, 5, 14, 8, 45),
    permissions: ["view"],
  },
];

const mockRoles = [
  {
    id: "admin",
    name: "Administrator",
    description: "Full system access",
    userCount: 1,
    permissions: ["all"],
  },
  {
    id: "manager",
    name: "Manager",
    description: "Manage operations and reports",
    userCount: 2,
    permissions: ["view", "edit", "reports", "users"],
  },
  {
    id: "dispatcher",
    name: "Dispatcher",
    description: "Schedule and dispatch vehicles",
    userCount: 3,
    permissions: ["view", "dispatch", "schedule"],
  },
  {
    id: "driver",
    name: "Driver",
    description: "Vehicle operation only",
    userCount: 15,
    permissions: ["view", "checkin", "reports"],
  },
  {
    id: "viewer",
    name: "Viewer",
    description: "Read-only access",
    userCount: 5,
    permissions: ["view"],
  },
];

const mockPermissions = [
  { id: "view", name: "View Dashboard", description: "View all dashboard data" },
  { id: "edit", name: "Edit Data", description: "Modify system data" },
  { id: "users", name: "User Management", description: "Manage users and roles" },
  { id: "reports", name: "Generate Reports", description: "Create and export reports" },
  { id: "dispatch", name: "Dispatch", description: "Schedule and dispatch vehicles" },
  { id: "schedule", name: "Schedule", description: "Manage schedules" },
  { id: "maintenance", name: "Maintenance", description: "Manage vehicle maintenance" },
  { id: "billing", name: "Billing", description: "Access billing information" },
  { id: "settings", name: "System Settings", description: "Modify system settings" },
  { id: "checkin", name: "Driver Check-in", description: "Driver check-in/check-out" },
];

const defaultCompanyInfo = {
  name: "Fleet Management Inc.",
  email: "contact@fleetmanagement.com",
  phone: "+1 (555) 123-4567",
  address: "123 Business Street, Suite 100",
  city: "San Francisco",
  state: "CA",
  zipCode: "94107",
  country: "United States",
  website: "www.fleetmanagement.com",
  taxId: "12-3456789",
  founded: "2020",
  timezone: "America/Los_Angeles",
  currency: "USD",
  logo: "",
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company");
  const [companyInfo, setCompanyInfo] = useState(defaultCompanyInfo);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("admin");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "driver",
    sendInvite: true,
  });
  
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>(
    mockPermissions.reduce((acc, perm) => ({ ...acc, [perm.id]: false }), {})
  );

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleCompanyChange = (field: string, value: string) => {
    setCompanyInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleNewUserChange = (field: string, value: string | boolean) => {
    setNewUser(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateUser = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    
    if (!newUser.name || !newUser.email) {
      alert("Please fill in required fields");
      return;
    }

    const slug = generateSlug(newUser.name);
    const newUserData = {
      id: `user-${Date.now()}`,
      slug,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      status: "pending",
      joinedDate: new Date(),
      lastLogin: null,
      permissions: mockRoles.find(r => r.id === newUser.role)?.permissions || ["view"],
    };

    console.log("New user created:", newUserData);
    
    // In real app, this would send invite email and save to database
    alert(`Invitation sent to ${newUser.email}`);
    
    // Reset form
    setNewUser({
      name: "",
      email: "",
      phone: "",
      role: "driver",
      sendInvite: true,
    });
  };

  const handleSaveCompany = () => {
    console.log("Company info saved:", companyInfo);
    alert("Company information saved successfully!");
  };

  const handleSavePermissions = () => {
    console.log("Permissions saved:", userPermissions);
    alert("Permissions saved successfully!");
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-100 text-purple-800",
      manager: "bg-blue-100 text-blue-800",
      dispatcher: "bg-green-100 text-green-800",
      driver: "bg-orange-100 text-orange-800",
      viewer: "bg-gray-100 text-gray-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage system profiles, roles, and company information</p>
        </div>
        <Button className="gap-2" onClick={() => {
          if (activeTab === "company") handleSaveCompany();
          if (activeTab === "permissions") handleSavePermissions();
        }}>
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="company" className="gap-2">
            <Building className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            Roles & Permissions
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
        </TabsList>

        {/* Company Information Tab */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your company details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-4">
                <Label>Company Logo</Label>
                <div className="flex items-center gap-6">
                  <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                    {companyInfo.logo ? (
                      <img src={companyInfo.logo} alt="Company Logo" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center space-y-2">
                        <Building className="h-8 w-8 text-muted-foreground mx-auto" />
                        <p className="text-xs text-muted-foreground">Upload logo</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Logo
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Recommended: 300x300px, PNG or JPG
                    </p>
                  </div>
                </div>
              </div>

              {/* Company Details */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={companyInfo.name}
                      onChange={(e) => handleCompanyChange("name", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Email Address *</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="companyEmail"
                        type="email"
                        value={companyInfo.email}
                        onChange={(e) => handleCompanyChange("email", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Phone Number</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="companyPhone"
                        value={companyInfo.phone}
                        onChange={(e) => handleCompanyChange("phone", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyWebsite">Website</Label>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="companyWebsite"
                        value={companyInfo.website}
                        onChange={(e) => handleCompanyChange("website", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Address & Legal</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Address</Label>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="companyAddress"
                        value={companyInfo.address}
                        onChange={(e) => handleCompanyChange("address", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyCity">City</Label>
                      <Input
                        id="companyCity"
                        value={companyInfo.city}
                        onChange={(e) => handleCompanyChange("city", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyState">State</Label>
                      <Input
                        id="companyState"
                        value={companyInfo.state}
                        onChange={(e) => handleCompanyChange("state", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyZip">ZIP Code</Label>
                      <Input
                        id="companyZip"
                        value={companyInfo.zipCode}
                        onChange={(e) => handleCompanyChange("zipCode", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyCountry">Country</Label>
                      <Input
                        id="companyCountry"
                        value={companyInfo.country}
                        onChange={(e) => handleCompanyChange("country", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyTaxId">Tax ID</Label>
                      <Input
                        id="companyTaxId"
                        value={companyInfo.taxId}
                        onChange={(e) => handleCompanyChange("taxId", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyFounded">Founded Year</Label>
                      <Input
                        id="companyFounded"
                        value={companyInfo.founded}
                        onChange={(e) => handleCompanyChange("founded", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* System Settings */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">System Settings</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={companyInfo.timezone} 
                      onValueChange={(value) => handleCompanyChange("timezone", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={companyInfo.currency} 
                      onValueChange={(value) => handleCompanyChange("currency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="CAD">CAD (C$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select defaultValue="MM/DD/YYYY">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Reset</Button>
              <Button onClick={handleSaveCompany}>
                <Save className="h-4 w-4 mr-2" />
                Save Company Information
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* User List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Create New User */}
              <Card>
                <CardHeader>
                  <CardTitle>Create New User</CardTitle>
                  <CardDescription>Add new users to the system</CardDescription>
                </CardHeader>
                <form onSubmit={handleCreateUser}>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="userName">Full Name *</Label>
                        <Input
                          id="userName"
                          placeholder="John Smith"
                          value={newUser.name}
                          onChange={(e) => handleNewUserChange("name", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="userEmail">Email Address *</Label>
                        <Input
                          id="userEmail"
                          type="email"
                          placeholder="john@example.com"
                          value={newUser.email}
                          onChange={(e) => handleNewUserChange("email", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="userPhone">Phone Number</Label>
                        <Input
                          id="userPhone"
                          placeholder="+1234567890"
                          value={newUser.phone}
                          onChange={(e) => handleNewUserChange("phone", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="userRole">Role</Label>
                        <Select 
                          value={newUser.role} 
                          onValueChange={(value) => handleNewUserChange("role", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {mockRoles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newUser.sendInvite}
                        onCheckedChange={(checked) => handleNewUserChange("sendInvite", checked)}
                      />
                      <Label>Send invitation email</Label>
                    </div>

                    {newUser.name && (
                      <div className="text-sm text-muted-foreground">
                        User slug will be:{" "}
                        <code className="bg-muted px-2 py-1 rounded">
                          {generateSlug(newUser.name)}
                        </code>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full gap-2">
                      <Plus className="h-4 w-4" />
                      Create User & Send Invite
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              {/* Users Table */}
              <Card>
                <CardHeader>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>Manage system users and their access</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {user.email}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Slug: {user.slug}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(user.role)}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(user.status)}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {user.lastLogin ? (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{format(user.lastLogin, "MMM d, h:mm a")}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Never</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {mockUsers.length} users
                  </div>
                  <Button variant="outline">Export Users</Button>
                </CardFooter>
              </Card>
            </div>

            {/* User Statistics & Quick Actions */}
            <div className="space-y-6">
              {/* User Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>User Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Users</span>
                      <span className="font-medium">{mockUsers.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Active Users</span>
                      <span className="font-medium text-green-600">
                        {mockUsers.filter(u => u.status === "active").length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Pending Invites</span>
                      <span className="font-medium text-yellow-600">
                        {mockUsers.filter(u => u.status === "pending").length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Last 30 Days</span>
                      <span className="font-medium">+3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Role Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Role Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockRoles.map((role) => (
                    <div key={role.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{role.name}</span>
                        <span>{role.userCount} users</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            role.id === "admin" ? "bg-purple-500" :
                            role.id === "manager" ? "bg-blue-500" :
                            role.id === "dispatcher" ? "bg-green-500" :
                            role.id === "driver" ? "bg-orange-500" : "bg-gray-500"
                          )}
                          style={{ width: `${(role.userCount / mockUsers.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Mail className="h-4 w-4" />
                    Send Bulk Invites
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Download className="h-4 w-4" />
                    Export User List
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Key className="h-4 w-4" />
                    Reset All Passwords
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule User Audit
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Roles & Permissions Tab */}
        <TabsContent value="roles" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Roles List */}
            <Card>
              <CardHeader>
                <CardTitle>Roles</CardTitle>
                <CardDescription>Define user roles and their permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockRoles.map((role) => (
                  <Card 
                    key={role.id} 
                    className={cn(
                      "cursor-pointer hover:bg-muted/50 transition-colors",
                      selectedRole === role.id && "border-blue-500"
                    )}
                    onClick={() => setSelectedRole(role.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{role.name}</h3>
                            <Badge variant="outline">{role.userCount} users</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {role.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {role.permissions.map((perm) => (
                              <Badge key={perm} variant="secondary" className="text-xs">
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
              <CardFooter>
                <Button className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Role
                </Button>
              </CardFooter>
            </Card>

            {/* Permissions Management */}
            <Card>
              <CardHeader>
                <CardTitle>Permissions</CardTitle>
                <CardDescription>Manage system permissions for {mockRoles.find(r => r.id === selectedRole)?.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Role Details</Label>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{mockRoles.find(r => r.id === selectedRole)?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {mockRoles.find(r => r.id === selectedRole)?.description}
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>System Permissions</Label>
                  <div className="space-y-2">
                    {mockPermissions.map((permission) => (
                      <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{permission.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {permission.description}
                          </div>
                        </div>
                        <Switch
                          checked={userPermissions[permission.id]}
                          onCheckedChange={(checked) => 
                            setUserPermissions(prev => ({ ...prev, [permission.id]: checked }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Module Access</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Dashboard", "Vehicles", "Drivers", "Scheduling",
                      "Maintenance", "Fuel", "Tracking", "Reports",
                      "Billing", "Notifications", "Settings"
                    ].map((module) => (
                      <div key={module} className="flex items-center gap-2 p-2 border rounded">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{module}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleSavePermissions}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Permissions
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profileName">Full Name</Label>
                    <Input id="profileName" defaultValue="Admin User" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profileEmail">Email Address</Label>
                    <Input id="profileEmail" type="email" defaultValue="admin@example.com" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profilePhone">Phone Number</Label>
                    <Input id="profilePhone" defaultValue="+1234567890" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profileRole">Your Role</Label>
                    <Input id="profileRole" defaultValue="Administrator" disabled />
                  </div>
                </div>

                {/* Security */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Security</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input 
                        id="currentPassword" 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input 
                      id="newPassword" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                    />
                  </div>

                  <div className="space-y-2 pt-4">
                    <Label>Two-Factor Authentication</Label>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">2FA Status</div>
                        <div className="text-sm text-muted-foreground">
                          Add extra security to your account
                        </div>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Notification Preferences</h3>
                <div className="space-y-3">
                  {[
                    "Email notifications",
                    "Push notifications",
                    "SMS alerts",
                    "Weekly reports",
                    "Maintenance reminders",
                    "Security alerts",
                  ].map((preference) => (
                    <div key={preference} className="flex items-center justify-between">
                      <Label htmlFor={preference}>{preference}</Label>
                      <Switch id={preference} defaultChecked />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Update Profile
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Add missing import
const Download = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);