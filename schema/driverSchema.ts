import { z } from 'zod';

export const DriverSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseExpiry: z.string().or(z.date()).transform(val => new Date(val)),
  address: z.string().optional(),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string(),
  }).optional(),
  employmentStatus: z.enum(['active', 'inactive', 'on_leave', 'terminated']).default('active'),
  hireDate: z.string().or(z.date()).transform(val => new Date(val)),
  assignedVehicleId: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Driver = z.infer<typeof DriverSchema>;