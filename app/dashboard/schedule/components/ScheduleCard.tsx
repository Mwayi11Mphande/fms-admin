// app/dashboard/schedules/components/ScheduleCard.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Truck, MapPin, Clock, CalendarIcon, Loader2, PlayCircle } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast"; // Import useToast, not Toast

interface ScheduleCardProps {
  schedule: {
    id: string;
    title: string;
    startTime: Date | string;
    endTime: Date | string;
    driver: string;
    driverId?: string;
    vehicle: string;
    vehicleId?: string;
    from: string;
    to: string;
    status: string;
    estimatedDuration: string;
    distance: string;
    description?: string;
  };
  onViewDetails?: (id: string) => void;
  onStartTrip?: (id: string) => Promise<void>;
  isStarting?: boolean;
}

// Helper function to safely parse dates
const safeParseDate = (dateInput: Date | string | any): Date => {
  try {
    if (dateInput instanceof Date) {
      return isValid(dateInput) ? dateInput : new Date();
    }
    
    if (typeof dateInput === 'string') {
      const date = parseISO(dateInput);
      return isValid(date) ? date : new Date();
    }
    
    // Handle Firestore Timestamp
    if (dateInput && typeof dateInput === 'object' && 'toDate' in dateInput) {
      const date = dateInput.toDate();
      return isValid(date) ? date : new Date();
    }
    
    // Handle timestamp number
    if (typeof dateInput === 'number') {
      const date = new Date(dateInput);
      return isValid(date) ? date : new Date();
    }
    
    return new Date();
  } catch (error) {
    console.error('Error parsing date:', error, dateInput);
    return new Date();
  }
};

// Helper function to safely format dates
const safeFormatDate = (dateInput: Date | string | any, formatStr: string = "PPP"): string => {
  const date = safeParseDate(dateInput);
  return isValid(date) ? format(date, formatStr) : "Invalid date";
};

// Helper function to safely format time
const safeFormatTime = (dateInput: Date | string | any): string => {
  const date = safeParseDate(dateInput);
  return isValid(date) ? format(date, "p") : "Invalid time";
};

export function ScheduleCard({ schedule, onViewDetails, onStartTrip, isStarting = false }: ScheduleCardProps) {
  const router = useRouter();
  const { toast } = useToast(); // Initialize toast
  const [isStartingLocal, setIsStartingLocal] = useState(false); // Add local state

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      scheduled: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
      pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200",
      in_progress: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
      completed: "bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200",
      cancelled: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
      delayed: "bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200",
    };
    return variants[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      scheduled: "Scheduled",
      pending: "Pending",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
      delayed: "Delayed",
    };
    return texts[status] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  const canStartTrip = () => {
    return schedule.status === "scheduled" || schedule.status === "pending";
  };

  const handleStartTrip = async () => {
    if (!canStartTrip()) {
      toast({
        title: "Cannot Start Trip",
        description: `This schedule is ${schedule.status} and cannot be started.`,
        variant: "destructive",
      });
      return;
    }

    if (!schedule.vehicleId) {
      toast({
        title: "No Vehicle Assigned",
        description: "This schedule doesn't have a vehicle assigned.",
        variant: "destructive",
      });
      return;
    }

    if (!schedule.driverId) {
      toast({
        title: "No Driver Assigned",
        description: "This schedule doesn't have a driver assigned.",
        variant: "destructive",
      });
      return;
    }

    setIsStartingLocal(true);
    try {
      if (onStartTrip) {
        await onStartTrip(schedule.id);
      } else {
        // Default behavior if no handler provided
        toast({
          title: "Starting Trip",
          description: "Redirecting to tracking page...",
        });
        setTimeout(() => {
          router.push(`/dashboard/tracking/drivers?vehicle=${schedule.vehicleId}`);
        }, 1500);
      }
    } catch (error) {
      console.error("Error starting trip:", error);
      toast({
        title: "Error",
        description: "Failed to start trip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStartingLocal(false);
    }
  };

  // Safely parse dates
  const startTime = safeParseDate(schedule.startTime);
  const endTime = safeParseDate(schedule.endTime);

  // Determine if button should be disabled
  const isButtonDisabled = isStarting || isStartingLocal;

  return (
    <Card className="hover:shadow-lg transition-shadow relative overflow-hidden">
      {/* Status indicator line at top */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        schedule.status === "in_progress" ? "bg-green-500" :
        schedule.status === "scheduled" ? "bg-blue-500" :
        schedule.status === "completed" ? "bg-purple-500" :
        schedule.status === "cancelled" ? "bg-red-500" :
        schedule.status === "delayed" ? "bg-orange-500" :
        "bg-gray-500"
      )} />
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-1">{schedule.title}</CardTitle>
          <Badge className={cn(getStatusBadge(schedule.status))}>
            {getStatusText(schedule.status)}
          </Badge>
        </div>
        <CardDescription>
          <div className="flex items-center gap-2 text-sm">
            <CalendarIcon className="h-3 w-3 flex-shrink-0" />
            <span className="line-clamp-1">
              {safeFormatDate(startTime, "PPP")} • {safeFormatTime(startTime)} - {safeFormatTime(endTime)}
            </span>
          </div>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="font-medium line-clamp-1">{schedule.driver || "No driver assigned"}</span>
          {schedule.driverId && (
            <Badge variant="outline" className="text-xs ml-auto">
              ID: {schedule.driverId.slice(-6)}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="line-clamp-1">{schedule.vehicle || "No vehicle assigned"}</span>
          {schedule.vehicleId && (
            <Badge variant="outline" className="text-xs ml-auto">
              {schedule.vehicleId.slice(-6)}
            </Badge>
          )}
        </div>
        
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-medium">From:</div>
            <div className="text-muted-foreground line-clamp-1">{schedule.from}</div>
            <div className="font-medium mt-1">To:</div>
            <div className="text-muted-foreground line-clamp-1">{schedule.to}</div>
          </div>
        </div>
        
        {schedule.description && (
          <p className="text-sm text-muted-foreground pt-2 line-clamp-2 border-t">
            {schedule.description}
          </p>
        )}
        
        <div className="flex items-center gap-4 text-sm pt-2">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{schedule.estimatedDuration}</span>
          </div>
          <div className="text-muted-foreground">{schedule.distance}</div>
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2 pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={() => onViewDetails?.(schedule.id)}
          disabled={isButtonDisabled}
        >
          View Details
        </Button>
        
        {canStartTrip() ? (
          <Button 
            size="sm" 
            className="flex-1 gap-2"
            onClick={handleStartTrip}
            disabled={isButtonDisabled}
          >
            {isButtonDisabled ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                Start Trip
              </>
            )}
          </Button>
        ) : schedule.status === "in_progress" ? (
          <Button 
            size="sm" 
            className="flex-1 gap-2"
            variant="outline"
            onClick={() => router.push(`/dashboard/v-tracking/drivers?vehicle=${schedule.vehicleId}`)}
          >
            Track Vehicle
          </Button>
        ) : schedule.status === "completed" ? (
          <Button 
            size="sm" 
            className="flex-1 gap-2"
            variant="outline"
            disabled
          >
            Completed
          </Button>
        ) : (
          <Button 
            size="sm" 
            className="flex-1 gap-2"
            variant="outline"
            disabled
          >
            {getStatusText(schedule.status)}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}