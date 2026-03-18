// app/dashboard/schedules/components/CalendarView.tsx
"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, AlertCircle } from "lucide-react";

interface CalendarViewProps {
  schedules: Array<{
    id: string;
    title: string;
    startTime: Date | string | any;
    endTime: Date | string | any;
    status: string;
    driver: string;
  }>;
}

// Helper function to safely parse dates
const safeParseDate = (dateInput: Date | string | any): Date => {
  try {
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? new Date() : dateInput;
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
    console.error('Error parsing date in CalendarView:', error, dateInput);
    return new Date();
  }
};

// Helper to check if date is valid
const isValidDate = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

export function CalendarView({ schedules }: CalendarViewProps) {
  // Safely parse all schedules first
  const validSchedules = schedules.map(schedule => ({
    ...schedule,
    startTime: safeParseDate(schedule.startTime),
    endTime: safeParseDate(schedule.endTime),
  })).filter(schedule => 
    isValidDate(schedule.startTime) && isValidDate(schedule.endTime)
  );

  // Count invalid schedules for debugging
  const invalidSchedules = schedules.length - validSchedules.length;
  
  // Group valid schedules by date for calendar view
  const schedulesByDate = validSchedules.reduce((acc, schedule) => {
    try {
      const dateKey = schedule.startTime.toDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(schedule);
    } catch (error) {
      console.error('Error grouping schedule by date:', error, schedule);
    }
    return acc;
  }, {} as Record<string, typeof validSchedules>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar View</CardTitle>
        <CardDescription>
          View and manage schedules on calendar
        </CardDescription>
        {invalidSchedules > 0 && (
          <div className="flex items-center gap-2 text-amber-600 text-sm mt-2">
            <AlertCircle className="h-4 w-4" />
            <span>{invalidSchedules} schedule(s) have invalid dates</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[600px] border rounded-lg flex items-center justify-center bg-muted/20">
          <div className="text-center space-y-2">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">Calendar View</h3>
            <p className="text-muted-foreground">
              {validSchedules.length} valid schedule(s) loaded
              {invalidSchedules > 0 && ` (${invalidSchedules} invalid)`}
            </p>
            <p className="text-sm text-muted-foreground">
              Interactive calendar will be displayed here
            </p>
            
            {validSchedules.length > 0 ? (
              <div className="mt-4 space-y-2">
                <p className="text-sm">Upcoming schedules by date:</p>
                {Object.entries(schedulesByDate)
                  .slice(0, 3)
                  .map(([date, daySchedules]) => (
                    <div key={date} className="text-sm">
                      <strong>{date}:</strong> {daySchedules.length} schedule(s)
                    </div>
                  ))}
                {Object.keys(schedulesByDate).length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    ... and {Object.keys(schedulesByDate).length - 3} more dates
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 p-4 bg-amber-50 rounded-md">
                <p className="text-sm text-amber-700">
                  No valid schedules found with proper dates.
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Check that schedules have valid start and end times.
                </p>
              </div>
            )}
            
            <Button variant="outline" className="mt-4">
              Switch to Week View
            </Button>
          </div>
        </div>
        
        {/* Schedule Status Legend */}
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-sm">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <span className="text-sm">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-sm">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-purple-500" />
            <span className="text-sm">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-sm">Cancelled</span>
          </div>
        </div>

        {/* Debug Info - Remove in production */}
        <div className="mt-4 p-3 border rounded-md bg-gray-50">
          <p className="text-sm font-medium mb-2">Debug Info:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-medium">Total schedules:</span> {schedules.length}
            </div>
            <div>
              <span className="font-medium">Valid schedules:</span> {validSchedules.length}
            </div>
            <div>
              <span className="font-medium">Invalid schedules:</span> {invalidSchedules}
            </div>
            <div>
              <span className="font-medium">Unique dates:</span> {Object.keys(schedulesByDate).length}
            </div>
          </div>
          {validSchedules.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium">Sample schedule dates:</p>
              <div className="text-xs text-gray-600 space-y-1 mt-1">
                {validSchedules.slice(0, 2).map((schedule, index) => (
                  <div key={index}>
                    {schedule.title}: {schedule.startTime.toDateString()} {schedule.startTime.toLocaleTimeString()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}