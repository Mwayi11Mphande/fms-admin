import { z } from 'zod';

export const TrackingSchema = z.object({
  id: z.string().optional(),
  vehicleId: z.string().min(1, "Vehicle is required"),
  driverId: z.string().optional(),
  timestamp: z.string().or(z.date()).transform(val => new Date(val)),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
  }),
  speed: z.number().min(0).optional(),
  heading: z.string().optional(), // CHANGED from number to string
  odometer: z.number().min(0).optional(),
  fuelLevel: z.number().min(0).max(100).optional(),
  engineStatus: z.enum(['on', 'off', 'idle']).optional(),
  tripId: z.string().optional(),
  eventType: z.enum(['location_update', 'ignition_on', 'ignition_off', 'speeding', 'idle', 'geofence_enter', 'geofence_exit']).default('location_update'),
  geofenceId: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()), // ADDED THIS
});

export type Tracking = z.infer<typeof TrackingSchema>;

// Additional schemas for tracking-related data
export const GeofenceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(['circle', 'polygon']),
  coordinates: z.array(z.object({
    lat: z.number(),
    lng: z.number(),
  })),
  radius: z.number().optional(), // For circle type
  alertOnEntry: z.boolean().default(true),
  alertOnExit: z.boolean().default(true),
  assignedVehicles: z.array(z.string()).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Geofence = z.infer<typeof GeofenceSchema>;

export const TripSchema = z.object({
  id: z.string().optional(),
  vehicleId: z.string().min(1, "Vehicle is required"),
  driverId: z.string().optional(),
  startTime: z.string().or(z.date()).transform(val => new Date(val)),
  endTime: z.string().or(z.date()).optional().transform(val => val ? new Date(val) : undefined),
  startLocation: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
  }),
  endLocation: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
  }).optional(),
  totalDistance: z.number().min(0).optional(),
  totalDuration: z.number().min(0).optional(),
  averageSpeed: z.number().min(0).optional(),
  maxSpeed: z.number().min(0).optional(),
  idleTime: z.number().min(0).optional(),
  fuelConsumed: z.number().min(0).optional(),
  status: z.enum(['active', 'completed', 'interrupted']).default('active'),
  scheduleId: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Trip = z.infer<typeof TripSchema>;