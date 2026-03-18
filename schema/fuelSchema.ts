import { z } from 'zod';

export const FuelSchema = z.object({
  id: z.string().optional(),
  vehicleId: z.string().min(1, "Vehicle is required"),
  driverId: z.string().min(1, "Driver is required"),
  date: z.string().or(z.date()).transform(val => new Date(val)),
  odometerReading: z.number().min(0),
  fuelAmount: z.number().positive("Fuel amount must be positive"),
  fuelType: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'cng']),
  fuelCost: z.number().positive("Fuel cost must be positive"),
  fuelStation: z.string().optional(),
  location: z.object({
    address: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).optional(),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
  mpg: z.number().optional(),
  totalCost: z.number().optional(),
  paymentMethod: z.enum(['cash', 'card', 'fleet_card', 'company_account']).optional(),
  attachments: z.array(z.string()).optional(), // URLs to receipt images
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Fuel = z.infer<typeof FuelSchema>;