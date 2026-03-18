// schema/schedule.ts (simplified version)
import { z } from 'zod';

export const ScheduleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  driverId: z.string().min(1, "Driver is required"),
  vehicleId: z.string().min(1, "Vehicle is required"),
  startTime: z.string().or(z.date()).transform(val => new Date(val)),
  endTime: z.string().or(z.date()).transform(val => new Date(val)),
  scheduleType: z.enum(['delivery', 'pickup', 'maintenance', 'training', 'meeting', 'other']),
  location: z.object({
    from: z.string().min(1, "From location is required"),
    to: z.string().min(1, "To location is required"),
    coordinates: z.object({
      fromLat: z.number().optional(),
      fromLng: z.number().optional(),
      toLat: z.number().optional(),
      toLng: z.number().optional(),
    }).optional(),
  }),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'delayed']).default('scheduled'),
  estimatedDistance: z.number().optional(),
  estimatedDuration: z.number().optional(),
  notes: z.string().optional(),
  recurring: z.object({
    pattern: z.enum(['daily', 'weekly', 'monthly', 'custom']).optional(),
    interval: z.number().optional(),
    endDate: z.string().or(z.date()).optional().transform(val => val ? new Date(val) : undefined),
  }).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Schedule = z.infer<typeof ScheduleSchema>;