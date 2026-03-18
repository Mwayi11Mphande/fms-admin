// app/dashboard/schedules/components/ScheduleDebug.tsx
"use client";

import React from "react";

interface ScheduleDebugProps {
  schedule: any;
}

export function ScheduleDebug({ schedule }: ScheduleDebugProps) {
  const formatDateForDebug = (date: any): string => {
    if (!date) return "null/undefined";
    
    try {
      if (date instanceof Date) {
        return `Date: ${date.toString()} (Valid: ${!isNaN(date.getTime())})`;
      }
      
      if (typeof date === 'string') {
        return `String: "${date}" -> Date: ${new Date(date).toString()} (Valid: ${!isNaN(new Date(date).getTime())})`;
      }
      
      if (date && typeof date === 'object') {
        if ('toDate' in date) {
          const jsDate = date.toDate();
          return `Firestore Timestamp -> Date: ${jsDate.toString()} (Valid: ${!isNaN(jsDate.getTime())})`;
        }
        return `Object: ${JSON.stringify(date)}`;
      }
      
      return `Type: ${typeof date}, Value: ${date}`;
    } catch (error) {
      return `Error: ${error}`;
    }
  };

  return (
    <div className="border border-red-300 bg-red-50 p-4 rounded-md mb-4">
      <h3 className="font-bold text-red-700 mb-2">Schedule Debug Info</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="font-medium">ID:</span> {schedule.id}
        </div>
        <div>
          <span className="font-medium">Title:</span> {schedule.title}
        </div>
        <div className="col-span-2">
          <span className="font-medium">startTime:</span> {formatDateForDebug(schedule.startTime)}
        </div>
        <div className="col-span-2">
          <span className="font-medium">endTime:</span> {formatDateForDebug(schedule.endTime)}
        </div>
        <div>
          <span className="font-medium">Type of startTime:</span> {typeof schedule.startTime}
        </div>
        <div>
          <span className="font-medium">Type of endTime:</span> {typeof schedule.endTime}
        </div>
      </div>
    </div>
  );
}