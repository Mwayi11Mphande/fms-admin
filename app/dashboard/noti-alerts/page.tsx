"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  AlertCircle, 
  Fuel, 
  Wrench, 
  Navigation,
  MessageSquare,
  Mail,
  Smartphone,
  Send,
  Filter,
  CheckCircle,
  Clock,
  User,
  Truck,
  Settings,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Mock data
const mockDrivers = [
  { id: "1", name: "John Smith", phone: "+1234567890", email: "john@example.com" },
  { id: "2", name: "Maria Garcia", phone: "+1234567891", email: "maria@example.com" },
  { id: "3", name: "Robert Johnson", phone: "+1234567892", email: "robert@example.com" },
  { id: "4", name: "Sarah Williams", phone: "+1234567893", email: "sarah@example.com" },
];

const mockCustomers = [
  { id: "c1", name: "Acme Corporation", contact: "John Doe", phone: "+1234567800", email: "acme@example.com" },
  { id: "c2", name: "Global Logistics", contact: "Jane Smith", phone: "+1234567801", email: "global@example.com" },
  { id: "c3", name: "Tech Solutions Inc", contact: "Mike Brown", phone: "+1234567802", email: "tech@example.com" },
];

const mockNotifications = [
  {
    id: "1",
    type: "maintenance",
    title: "Scheduled Maintenance Due",
    message: "Ford Transit ABC123 requires oil change in 3 days",
    priority: "high",
    status: "unread",
    time: new Date(Date.now() - 15 * 60000), // 15 minutes ago
    vehicle: "Ford Transit - ABC123",
    icon: <Wrench className="h-5 w-5 text-yellow-600" />,
  },
  {
    id: "2",
    type: "speed",
    title: "Over-speed Alert",
    message: "Mercedes Sprinter DEF456 exceeded speed limit (75 mph)",
    priority: "high",
    status: "read",
    time: new Date(Date.now() - 30 * 60000), // 30 minutes ago
    vehicle: "Mercedes Sprinter - DEF456",
    icon: <AlertCircle className="h-5 w-5 text-red-600" />,
  },
  {
    id: "3",
    type: "fuel",
    title: "Low Fuel Alert",
    message: "Toyota Hiace MNO345 fuel level below 20%",
    priority: "medium",
    status: "read",
    time: new Date(Date.now() - 2 * 3600000), // 2 hours ago
    vehicle: "Toyota Hiace - MNO345",
    icon: <Fuel className="h-5 w-5 text-orange-600" />,
  },
  {
    id: "4",
    type: "trip",
    title: "Trip Warning",
    message: "Chevrolet Express GHI789 delayed by 45 minutes",
    priority: "medium",
    status: "unread",
    time: new Date(Date.now() - 4 * 3600000), // 4 hours ago
    vehicle: "Chevrolet Express - GHI789",
    icon: <Navigation className="h-5 w-5 text-blue-600" />,
  },
  {
    id: "5",
    type: "maintenance",
    title: "Brake Service Required",
    message: "Ram Promaster JKL012 brake pads need replacement",
    priority: "high",
    status: "unread",
    time: new Date(Date.now() - 6 * 3600000), // 6 hours ago
    vehicle: "Ram Promaster - JKL012",
    icon: <Wrench className="h-5 w-5 text-red-600" />,
  },
  {
    id: "6",
    type: "system",
    title: "System Update",
    message: "Tracking system will be offline for maintenance tonight",
    priority: "low",
    status: "read",
    time: new Date(Date.now() - 24 * 3600000), // 24 hours ago
    vehicle: null,
    icon: <Settings className="h-5 w-5 text-gray-600" />,
  },
];

const mockAlertSettings = [
  {
    id: "a1",
    name: "Over-speed Alert",
    enabled: true,
    description: "Alert when vehicle exceeds speed limit",
    threshold: 70,
    unit: "mph",
    channels: ["push", "email"],
  },
  {
    id: "a2",
    name: "Low Fuel Alert",
    enabled: true,
    description: "Alert when fuel level is low",
    threshold: 20,
    unit: "%",
    channels: ["push", "whatsapp"],
  },
  {
    id: "a3",
    name: "Maintenance Reminder",
    enabled: true,
    description: "Notify before scheduled maintenance",
    threshold: 3,
    unit: "days",
    channels: ["push", "email", "whatsapp"],
  },
  {
    id: "a4",
    name: "Idle Time Alert",
    enabled: false,
    description: "Alert when vehicle is idle for too long",
    threshold: 30,
    unit: "minutes",
    channels: ["push"],
  },
  {
    id: "a5",
    name: "Geofence Alert",
    enabled: true,
    description: "Alert when vehicle enters/exits defined area",
    threshold: null,
    unit: "",
    channels: ["push", "email"],
  },
];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("notifications");
  const [notificationFilter, setNotificationFilter] = useState("all");
  const [sendMode, setSendMode] = useState("whatsapp");
  const [messageType, setMessageType] = useState("alert");
  const [recipientType, setRecipientType] = useState("driver");
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [message, setMessage] = useState("");
  
  const [newAlert, setNewAlert] = useState({
    name: "",
    description: "",
    threshold: "",
    unit: "mph",
    enabled: true,
    channels: [] as string[],
  });

  const getPriorityColor = (priority: "high" | "medium" | "low") => {
    const colors = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-blue-100 text-blue-800",
    };
    return colors[priority];
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      maintenance: "bg-yellow-100 text-yellow-800",
      speed: "bg-red-100 text-red-800",
      fuel: "bg-orange-100 text-orange-800",
      trip: "bg-blue-100 text-blue-800",
      system: "bg-gray-100 text-gray-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const filteredNotifications = notificationFilter === "all" 
    ? mockNotifications 
    : mockNotifications.filter(n => n.type === notificationFilter);

  const unreadCount = mockNotifications.filter(n => n.status === "unread").length;

  const handleSendMessage = () => {
    if (!selectedRecipient || !message.trim()) {
      alert("Please select a recipient and enter a message");
      return;
    }

    const recipient = recipientType === "driver" 
      ? mockDrivers.find(d => d.id === selectedRecipient)
      : mockCustomers.find(c => c.id === selectedRecipient);

    console.log(`Sending ${sendMode} message to ${recipient?.name}:`, message);
    
    // In real app, this would send to Firebase/WhatsApp/Email API
    alert(`Message sent to ${recipient?.name} via ${sendMode.toUpperCase()}`);
    
    // Reset form
    setSelectedRecipient("");
    setMessage("");
  };

  const handleChannelToggle = (channel: string) => {
    setNewAlert(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Alerts & Notifications</h1>
          <p className="text-muted-foreground">Manage alerts and send notifications</p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Bell className="h-4 w-4" />
          {unreadCount} unread
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Alerts</p>
                <p className="text-2xl font-bold">{mockNotifications.length}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Maintenance</p>
                <p className="text-2xl font-bold">{mockNotifications.filter(n => n.type === "maintenance").length}</p>
              </div>
              <Wrench className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Over-speed</p>
                <p className="text-2xl font-bold">{mockNotifications.filter(n => n.type === "speed").length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Fuel</p>
                <p className="text-2xl font-bold">{mockNotifications.filter(n => n.type === "fuel").length}</p>
              </div>
              <Fuel className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications">All Notifications</TabsTrigger>
          <TabsTrigger value="send">Send Messages</TabsTrigger>
          <TabsTrigger value="alerts">Alert Settings</TabsTrigger>
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={notificationFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNotificationFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={notificationFilter === "maintenance" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNotificationFilter("maintenance")}
                >
                  Maintenance
                </Button>
                <Button
                  variant={notificationFilter === "speed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNotificationFilter("speed")}
                >
                  Over-speed
                </Button>
                <Button
                  variant={notificationFilter === "fuel" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNotificationFilter("fuel")}
                >
                  Low Fuel
                </Button>
                <Button
                  variant={notificationFilter === "trip" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNotificationFilter("trip")}
                >
                  Trip Warnings
                </Button>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Mark All as Read
            </Button>
          </div>

          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <Card key={notification.id} className={cn(
                notification.status === "unread" && "border-l-4 border-l-blue-500"
              )}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {notification.icon}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{notification.title}</h3>
                          <Badge className={getPriorityColor(notification.priority as "high" | "medium" | "low")}>
                            {notification.priority}
                          </Badge>
                          <Badge variant="outline" className={getTypeColor(notification.type)}>
                            {notification.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        {notification.vehicle && (
                          <div className="flex items-center gap-1 text-sm">
                            <Truck className="h-3 w-3" />
                            <span>{notification.vehicle}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{format(notification.time, "MMM d, h:mm a")}</span>
                          <span>•</span>
                          <span>{notification.status === "unread" ? "Unread" : "Read"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost">
                        Mark as Read
                      </Button>
                      <Button size="sm">
                        Take Action
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredNotifications.length === 0 && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold">No Notifications</h3>
                      <p className="text-muted-foreground">
                        No notifications found for the selected filter.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Send Messages Tab */}
        <TabsContent value="send">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Send Message Form */}
            <Card>
              <CardHeader>
                <CardTitle>Send Message</CardTitle>
                <CardDescription>Send notifications to drivers or customers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Send Mode Selection */}
                <div className="space-y-2">
                  <Label>Send Via</Label>
                  <div className="flex gap-2">
                    {["whatsapp", "email", "push"].map((mode) => (
                      <Button
                        key={mode}
                        type="button"
                        variant={sendMode === mode ? "default" : "outline"}
                        className="flex-1 gap-2"
                        onClick={() => setSendMode(mode)}
                      >
                        {mode === "whatsapp" && <MessageSquare className="h-4 w-4" />}
                        {mode === "email" && <Mail className="h-4 w-4" />}
                        {mode === "push" && <Smartphone className="h-4 w-4" />}
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Message Type */}
                <div className="space-y-2">
                  <Label>Message Type</Label>
                  <div className="flex gap-2">
                    {["alert", "update", "reminder", "custom"].map((type) => (
                      <Button
                        key={type}
                        type="button"
                        variant={messageType === type ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMessageType(type)}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Recipient Selection */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Recipient Type</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={recipientType === "driver" ? "default" : "outline"}
                        className="gap-2"
                        onClick={() => setRecipientType("driver")}
                      >
                        <User className="h-4 w-4" />
                        Driver
                      </Button>
                      <Button
                        type="button"
                        variant={recipientType === "customer" ? "default" : "outline"}
                        className="gap-2"
                        onClick={() => setRecipientType("customer")}
                      >
                        <User className="h-4 w-4" />
                        Customer
                      </Button>
                      <Button
                        type="button"
                        variant={recipientType === "all" ? "default" : "outline"}
                        className="gap-2"
                        onClick={() => setRecipientType("all")}
                      >
                        <User className="h-4 w-4" />
                        All
                      </Button>
                    </div>
                  </div>

                  {recipientType !== "all" && (
                    <div className="space-y-2">
                      <Label>Select {recipientType}</Label>
                      <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                        <SelectTrigger>
                          <SelectValue placeholder={`Select a ${recipientType}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {(recipientType === "driver" ? mockDrivers : mockCustomers).map((person) => (
                            <SelectItem key={person.id} value={person.id}>
                              <div className="flex flex-col">
                                <span>{person.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {recipientType === "driver" ? (person as typeof mockDrivers[0]).phone : (person as typeof mockCustomers[0]).contact}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className="space-y-2">
                  <Label htmlFor="message">Message Content</Label>
                  <Textarea
                    id="message"
                    placeholder={
                      messageType === "alert" ? "🚨 Alert: Vehicle ABC123 exceeded speed limit by 15 mph. Please drive safely." :
                      messageType === "update" ? "📋 Update: Your delivery schedule has been updated to 2:00 PM." :
                      messageType === "reminder" ? "⏰ Reminder: Maintenance scheduled for tomorrow at 10 AM." :
                      "Type your custom message here..."
                    }
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground">
                    {sendMode === "whatsapp" && "WhatsApp messages support emojis and links"}
                    {sendMode === "email" && "Email messages support HTML formatting"}
                    {sendMode === "push" && "Push notifications are limited to 240 characters"}
                  </div>
                </div>

                {/* Message Preview */}
                {message && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="py-3">
                      <div className="p-3 bg-muted rounded text-sm">
                        {message}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Length: {message.length} characters
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full gap-2"
                  onClick={handleSendMessage}
                  disabled={!message.trim() || (recipientType !== "all" && !selectedRecipient)}
                >
                  <Send className="h-4 w-4" />
                  Send {sendMode === "whatsapp" ? "WhatsApp" : sendMode === "email" ? "Email" : "Push"} Message
                </Button>
              </CardFooter>
            </Card>

            {/* Quick Templates */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Templates</CardTitle>
                  <CardDescription>Pre-defined message templates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    {
                      title: "Maintenance Alert",
                      content: "🚨 Maintenance Required: Your vehicle requires scheduled maintenance. Please visit the service center.",
                      type: "maintenance"
                    },
                    {
                      title: "Over-speed Warning",
                      content: "⚠️ Speed Alert: You have exceeded the speed limit. Please maintain safe driving speed.",
                      type: "speed"
                    },
                    {
                      title: "Low Fuel Reminder",
                      content: "⛽ Low Fuel: Your vehicle fuel is below 20%. Please refuel at the nearest station.",
                      type: "fuel"
                    },
                    {
                      title: "Trip Delay",
                      content: "⏰ Trip Update: Your delivery is delayed by 30 minutes. New ETA is 3:30 PM.",
                      type: "trip"
                    },
                    {
                      title: "Welcome Message",
                      content: "👋 Welcome to Fleet Management System! Your account has been activated successfully.",
                      type: "system"
                    },
                  ].map((template, index) => (
                    <Card key={index} className="cursor-pointer hover:bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{template.title}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {template.content}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setMessage(template.content)}
                          >
                            Use
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              {/* Send History */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Messages</CardTitle>
                  <CardDescription>Last 5 sent messages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { to: "John Smith", via: "WhatsApp", time: "5 min ago", status: "sent" },
                    { to: "Acme Corporation", via: "Email", time: "1 hour ago", status: "delivered" },
                    { to: "All Drivers", via: "Push", time: "3 hours ago", status: "sent" },
                    { to: "Maria Garcia", via: "WhatsApp", time: "5 hours ago", status: "read" },
                    { to: "Tech Solutions Inc", via: "Email", time: "1 day ago", status: "delivered" },
                  ].map((msg, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <div className="font-medium text-sm">{msg.to}</div>
                        <div className="text-xs text-muted-foreground">
                          Via {msg.via} • {msg.time}
                        </div>
                      </div>
                      <Badge variant={msg.status === "read" ? "default" : "outline"}>
                        {msg.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    View All Messages
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Alert Settings Tab */}
        <TabsContent value="alerts">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Alert Settings List */}
            <Card>
              <CardHeader>
                <CardTitle>Alert Settings</CardTitle>
                <CardDescription>Configure automated alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockAlertSettings.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{alert.name}</h3>
                        <Switch checked={alert.enabled} />
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                      <div className="flex items-center gap-4 text-xs">
                        {alert.threshold && (
                          <span>Threshold: {alert.threshold} {alert.unit}</span>
                        )}
                        <span className="text-muted-foreground">
                          Channels: {alert.channels.join(", ")}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Add New Alert Rule
                </Button>
              </CardFooter>
            </Card>

            {/* New Alert Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create Alert Rule</CardTitle>
                <CardDescription>Set up new automated alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="alertName">Alert Name</Label>
                  <Input
                    id="alertName"
                    placeholder="e.g., High Temperature Alert"
                    value={newAlert.name}
                    onChange={(e) => setNewAlert({...newAlert, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Alert when vehicle temperature exceeds safe limit"
                    value={newAlert.description}
                    onChange={(e) => setNewAlert({...newAlert, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="threshold">Threshold</Label>
                    <Input
                      id="threshold"
                      type="number"
                      placeholder="85"
                      value={newAlert.threshold}
                      onChange={(e) => setNewAlert({...newAlert, threshold: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select 
                      value={newAlert.unit} 
                      onValueChange={(value) => setNewAlert({...newAlert, unit: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mph">mph</SelectItem>
                        <SelectItem value="%">%</SelectItem>
                        <SelectItem value="°C">°C</SelectItem>
                        <SelectItem value="days">days</SelectItem>
                        <SelectItem value="minutes">minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notification Channels</Label>
                  <div className="flex gap-4">
                    {["push", "email", "whatsapp", "sms"].map((channel) => (
                      <div key={channel} className="flex items-center gap-2">
                        <Switch
                          checked={newAlert.channels.includes(channel)}
                          onCheckedChange={() => handleChannelToggle(channel)}
                        />
                        <Label className="text-sm capitalize">{channel}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Target Vehicles</Label>
                  <div className="flex flex-wrap gap-2">
                    {["All Vehicles", "Ford Transit", "Mercedes Sprinter", "Chevrolet Express"].map((vehicle) => (
                      <Badge key={vehicle} variant="outline" className="cursor-pointer">
                        {vehicle}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Alert Priority</Label>
                  <div className="flex gap-2">
                    {["low", "medium", "high"].map((priority) => (
                      <Button
                        key={priority}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="capitalize"
                      >
                        {priority}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Alert Rule
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Message Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Message Templates</CardTitle>
              <CardDescription>Manage your notification templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    name: "Maintenance Alert",
                    category: "maintenance",
                    channels: ["whatsapp", "email", "push"],
                    content: "Your vehicle {vehicle} requires {service_type} maintenance on {date}.",
                  },
                  {
                    name: "Speed Violation",
                    category: "speed",
                    channels: ["whatsapp", "push"],
                    content: "⚠️ Alert: {vehicle} exceeded speed limit at {speed} mph. Location: {location}",
                  },
                  {
                    name: "Low Fuel Warning",
                    category: "fuel",
                    channels: ["whatsapp", "push"],
                    content: "⛽ Low Fuel: {vehicle} fuel level is at {fuel_level}%. Please refuel.",
                  },
                  {
                    name: "Trip Delay",
                    category: "trip",
                    channels: ["whatsapp", "email"],
                    content: "Your trip to {destination} is delayed by {delay_time}. New ETA: {new_eta}",
                  },
                  {
                    name: "Welcome Message",
                    category: "system",
                    channels: ["email"],
                    content: "Welcome to our fleet management system, {name}! Your account is now active.",
                  },
                  {
                    name: "Payment Reminder",
                    category: "billing",
                    channels: ["email", "whatsapp"],
                    content: "Reminder: Invoice #{invoice_number} for {amount} is due on {due_date}.",
                  },
                ].map((template, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="capitalize">{template.category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm p-3 bg-muted rounded">
                          {template.content}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {template.channels.map((channel) => (
                            <Badge key={channel} variant="outline" className="capitalize">
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Edit
                      </Button>
                      <Button size="sm" className="flex-1">
                        Use Template
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Create New Template
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}