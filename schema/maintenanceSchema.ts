import { z } from 'zod';

export const MaintenanceSchema = z.object({
  id: z.string().optional(),
  vehicleId: z.string().min(1, "Vehicle is required"),
  type: z.enum(['routine', 'repair', 'emergency', 'inspection', 'tire_change', 'oil_change']),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  scheduledDate: z.string().or(z.date()).transform(val => new Date(val)),
  completedDate: z.string().or(z.date()).optional().transform(val => val ? new Date(val) : undefined),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('scheduled'),
  odometerReading: z.number().min(0),
  cost: z.number().min(0).optional(),
  parts: z.array(z.object({
    name: z.string(),
    partNumber: z.string().optional(),
    quantity: z.number(),
    unitPrice: z.number(),
  })).optional(),
  laborHours: z.number().optional(),
  laborRate: z.number().optional(),
  serviceProvider: z.object({
    name: z.string(),
    contact: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  nextService: z.object({
    date: z.string().or(z.date()).optional().transform(val => val ? new Date(val) : undefined),
    odometer: z.number().optional(),
    notes: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(), // URLs to uploaded files
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Maintenance = z.infer<typeof MaintenanceSchema>;