// schema/vehicleSchema.ts
import { z } from 'zod';

export const VehicleSchema = z.object({
  id: z.string().optional(),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  licensePlate: z.string().min(1, "License plate is required"),
  vin: z.string().optional(), // Changed from required to optional
  vehicleType: z.enum(['car', 'truck', 'van', 'suv', 'motorcycle', 'bus']),
  color: z.string().optional(),
  purchaseDate: z.string().or(z.date()).transform(val => new Date(val)),
  purchasePrice: z.number().optional(),
  currentMileage: z.number().min(0),
  fuelType: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'cng']),
  fuelCapacity: z.number().optional(),
  status: z.enum(['available', 'in_use', 'maintenance', 'out_of_service']).default('available'),
  assignedDriverId: z.string().optional(),
  registrationNumber: z.string().optional(),
  capacity: z.number().optional(),
  engineSize: z.string().optional(),
  transmission: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceExpiry: z.string().or(z.date()).optional().transform(val => val ? new Date(val) : undefined),
  lastMaintenanceDate: z.string().or(z.date()).optional().transform(val => val ? new Date(val) : undefined),
  insurance: z.object({
    provider: z.string(),
    policyNumber: z.string(),
    expiryDate: z.string().or(z.date()).transform(val => new Date(val)),
    coverageType: z.string(),
  }).optional(),
  registration: z.object({
    expiryDate: z.string().or(z.date()).transform(val => new Date(val)),
    state: z.string(),
  }).optional(),
  notes: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Vehicle = z.infer<typeof VehicleSchema>;