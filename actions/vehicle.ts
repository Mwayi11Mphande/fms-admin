// app/actions/vehicles.ts
'use server';

import { revalidatePath } from 'next/cache';
import { VehicleSchema } from '@/schema/vehicleSchema';
import { normalizeFirestoreData } from '@/lib/utils';
import { VehicleDataBaseSchema, firestoreDataBase } from '@/lib/firebase/firebaseDb';

// Generate a custom vehicle ID
function generateVehicleId(licensePlate: string): string {
  const timestamp = Date.now().toString().slice(-4);
  const platePart = licensePlate.replace(/[^A-Z0-9]/g, '').slice(-4).toUpperCase();
  return `VH-${timestamp}-${platePart}`;
}

// Helper function to clean data (remove undefined values)
function cleanData<T extends Record<string, any>>(data: T): T {
  const cleaned = { ...data };
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
}

// Create a new vehicle
export async function createVehicle(formData: FormData) {
  try {
    // Extract form data directly matching your form fields
    const vehicleData = {
      make: formData.get('model') as string, // Using model as make
      model: formData.get('model') as string,
      year: parseInt(formData.get('year') as string),
      licensePlate: formData.get('plateNumber') as string,
      vin: formData.get('vin') as string || '',
      vehicleType: (formData.get('type') as 'car' | 'truck' | 'van' | 'suv' | 'motorcycle' | 'bus') || 'car',
      color: formData.get('color') as string || '',
      purchaseDate: formData.get('purchaseDate') as string || new Date().toISOString(),
      currentMileage: 0,
      fuelType: (formData.get('fuelType') as 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'cng') || 'gasoline',
      status: 'available' as const,
      registrationNumber: formData.get('registrationNumber') as string,
      capacity: parseInt(formData.get('capacity') as string),
      notes: formData.get('notes') as string || '',
    };

    // Add optional fields only if they have values
    const purchasePrice = formData.get('purchasePrice');
    if (purchasePrice && purchasePrice.toString().trim()) {
      (vehicleData as any).purchasePrice = parseFloat(purchasePrice as string);
    }

    const engineSize = formData.get('engineSize');
    if (engineSize && engineSize.toString().trim()) {
      (vehicleData as any).engineSize = engineSize as string;
    }

    const transmission = formData.get('transmission');
    if (transmission && transmission.toString().trim()) {
      (vehicleData as any).transmission = transmission as string;
    }

    const fuelCapacity = formData.get('fuelCapacity');
    if (fuelCapacity && fuelCapacity.toString().trim()) {
      (vehicleData as any).fuelCapacity = parseFloat(fuelCapacity as string);
    }

    const insuranceProvider = formData.get('insuranceProvider');
    if (insuranceProvider && insuranceProvider.toString().trim()) {
      (vehicleData as any).insuranceProvider = insuranceProvider as string;
    }

    const insuranceExpiry = formData.get('insuranceExpiry');
    if (insuranceExpiry && insuranceExpiry.toString().trim()) {
      (vehicleData as any).insuranceExpiry = new Date(insuranceExpiry as string);
    }

    // Validate with Zod schema
    const validatedData = VehicleSchema.parse(vehicleData);
    
    // Generate vehicle ID
    const vehicleId = generateVehicleId(validatedData.licensePlate);
    
    // Check if vehicle with license plate already exists
    const existingVehicle = await firestoreDataBase.search<'vehicles'>(
      { path: 'vehicles' },
      'licensePlate' as any,
      validatedData.licensePlate,
      { limit: 1 }
    );
    
    if (existingVehicle.status === 'success' && existingVehicle.data && existingVehicle.data.length > 0) {
      return {
        success: false,
        error: 'A vehicle with this license plate already exists'
      };
    }

    // Check if VIN exists and is unique
    if (validatedData.vin && validatedData.vin.trim()) {
      const existingByVin = await firestoreDataBase.search<'vehicles'>(
        { path: 'vehicles' },
        'vin' as any,
        validatedData.vin,
        { limit: 1 }
      );
      
      if (existingByVin.status === 'success' && existingByVin.data && existingByVin.data.length > 0) {
        return {
          success: false,
          error: 'A vehicle with this VIN already exists'
        };
      }
    }
    
    // Prepare data for Firestore - simplified
    const firestoreData = {
      id: vehicleId,
      make: validatedData.make,
      model: validatedData.model,
      year: validatedData.year,
      licensePlate: validatedData.licensePlate,
      vin: validatedData.vin || '',
      vehicleType: validatedData.vehicleType,
      color: validatedData.color || '',
      purchaseDate: new Date(validatedData.purchaseDate),
      currentMileage: validatedData.currentMileage,
      fuelType: validatedData.fuelType,
      status: validatedData.status,
      registrationNumber: validatedData.registrationNumber,
      capacity: validatedData.capacity,
      notes: validatedData.notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add optional fields
    if (validatedData.purchasePrice !== undefined) {
      (firestoreData as any).purchasePrice = validatedData.purchasePrice;
    }

    if (validatedData.engineSize) {
      (firestoreData as any).engineSize = validatedData.engineSize;
    }

    if (validatedData.transmission) {
      (firestoreData as any).transmission = validatedData.transmission;
    }

    if (validatedData.fuelCapacity !== undefined) {
      (firestoreData as any).fuelCapacity = validatedData.fuelCapacity;
    }

    if (validatedData.insuranceProvider) {
      (firestoreData as any).insuranceProvider = validatedData.insuranceProvider;
    }

    if (validatedData.insuranceExpiry) {
      (firestoreData as any).insuranceExpiry = new Date(validatedData.insuranceExpiry);
    }

    // Clean undefined properties
    const cleanFirestoreData = cleanData(firestoreData);
    
    // Create in Firestore
    const result = await firestoreDataBase.createWithId<'vehicles'>(
      { path: 'vehicles', id: vehicleId },
      // cleanFirestoreData as VehicleDataBaseSchema
      cleanFirestoreData as VehicleDataBaseSchema
    );

    if (result.status === 'error') {
      return {
        success: false,
        error: result.message || 'Failed to create vehicle'
      };
    }

    revalidatePath('/dashboard/v-ma');
    
    return {
      success: true,
      data: cleanFirestoreData,
      message: 'Vehicle created successfully'
    };
  } catch (error: any) {
    console.error('Error creating vehicle:', error);
    
    // Handle Zod validation errors
    if (error.errors) {
      return {
        success: false,
        error: error.errors.map((err: any) => err.message).join(', ')
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to create vehicle'
    };
  }
}

// Get all vehicles with optional filtering
export async function getVehicles(filters?: {
  status?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const queryOptions: any = {
      where: [],
      limit: filters?.limit || 50
    };

    // Apply status filter
    if (filters?.status && filters.status !== 'all') {
      queryOptions.where.push({
        field: 'status',
        operator: '==',
        value: filters.status
      });
    }

    // Apply type filter
    if (filters?.type && filters.type !== 'all') {
      queryOptions.where.push({
        field: 'vehicleType',
        operator: '==',
        value: filters.type
      });
    }

    // Add orderBy if we have at least one filter
    if (queryOptions.where.length > 0) {
      queryOptions.orderBy = [{ field: 'createdAt', direction: 'desc' as const }];
    }

    const result = await firestoreDataBase.get<'vehicles'>(
      { path: 'vehicles' },
      queryOptions
    );

    if (result.status === 'error' || !result.data) {
      return {
        success: false,
        error: result.message || 'Failed to fetch vehicles',
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        }
      };
    }

    let vehicles = result.data as VehicleDataBaseSchema[];

    // Apply search filter on client side
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      vehicles = vehicles.filter(vehicle =>
        vehicle.make?.toLowerCase().includes(searchTerm) ||
        vehicle.model?.toLowerCase().includes(searchTerm) ||
        vehicle.licensePlate?.toLowerCase().includes(searchTerm) ||
        vehicle.vin?.toLowerCase().includes(searchTerm) ||
        vehicle.registrationNumber?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedVehicles = vehicles.slice(startIndex, endIndex);

    // Normalize data for client
    const normalizedVehicles = paginatedVehicles.map(normalizeFirestoreData);

    return {
      success: true,
      data: normalizedVehicles,
      pagination: {
        total: vehicles.length,
        page,
        limit,
        totalPages: Math.ceil(vehicles.length / limit)
      }
    };
  } catch (error: any) {
    console.error('Error getting vehicles:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch vehicles',
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      }
    };
  }
}
// Get vehicle by ID
export async function getVehicle(id: string) {
  try {
    const result = await firestoreDataBase.getById<'vehicles'>({
      path: 'vehicles',
      id: id
    });

    if (result.status === 'error' || !result.data || result.data.length === 0) {
      return {
        success: false,
        error: result.message || 'Vehicle not found'
      };
    }

    const vehicle = normalizeFirestoreData(result.data[0]) as VehicleDataBaseSchema;
    
    return {
      success: true,
      data: vehicle
    };
  } catch (error: any) {
    console.error('Error getting vehicle:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch vehicle'
    };
  }
}

// Update vehicle
export async function updateVehicle(id: string, formData: FormData) {
  try {
    // Get existing vehicle first to merge data
    const existingResult = await getVehicle(id);
    if (!existingResult.success) {
      return existingResult;
    }
    
    const existingVehicle = existingResult.data as VehicleDataBaseSchema;

    // Extract update data
    const updateData: Partial<VehicleDataBaseSchema> = {};
    const fields = [
      'make', 'model', 'year', 'licensePlate', 'vin', 'vehicleType',
      'color', 'purchaseDate', 'purchasePrice', 'currentMileage',
      'fuelType', 'fuelCapacity', 'status', 'assignedDriverId',
      'registrationNumber', 'capacity', 'engineSize', 'transmission',
      'insuranceProvider', 'insuranceExpiry', 'notes'
    ] as const;

    fields.forEach(field => {
      const value = formData.get(field);
      if (value !== null && value !== undefined && value !== '') {
        if (field === 'year' || field === 'currentMileage' || field === 'capacity') {
          (updateData as any)[field] = parseInt(value as string);
        } else if (field === 'purchasePrice' || field === 'fuelCapacity') {
          (updateData as any)[field] = parseFloat(value as string);
        } else if (field === 'purchaseDate' || field === 'insuranceExpiry') {
          (updateData as any)[field] = new Date(value as string);
        } else {
          (updateData as any)[field] = value;
        }
      }
    });

    // Update dates
    if (formData.get('lastMaintenanceDate')) {
      updateData.lastMaintenanceDate = new Date(formData.get('lastMaintenanceDate') as string);
    }

    // Add updatedAt
    updateData.updatedAt = new Date();

    // Update in Firestore
    const result = await firestoreDataBase.update<'vehicles'>(
      { path: 'vehicles', id: id },
      updateData as VehicleDataBaseSchema
    );

    if (result.status === 'error') {
      return {
        success: false,
        error: result.message || 'Failed to update vehicle'
      };
    }

    revalidatePath('/dashboard/v-ma');
    revalidatePath(`/dashboard/v-ma/${id}`);

    return {
      success: true,
      message: 'Vehicle updated successfully',
      data: { id, ...updateData }
    };
  } catch (error: any) {
    console.error('Error updating vehicle:', error);
    
    if (error.errors) {
      return {
        success: false,
        error: error.errors.map((err: any) => err.message).join(', ')
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to update vehicle'
    };
  }
}

// Delete vehicle
export async function deleteVehicle(id: string) {
  try {
    const result = await firestoreDataBase.delete({
      path: 'vehicles',
      id: id
    });

    if (result.status === 'error') {
      return {
        success: false,
        error: result.message || 'Failed to delete vehicle'
      };
    }

    revalidatePath('/dashboard/v-ma');

    return {
      success: true,
      message: 'Vehicle deleted successfully'
    };
  } catch (error: any) {
    console.error('Error deleting vehicle:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete vehicle'
    };
  }
}

// Update vehicle status
export async function updateVehicleStatus(id: string, status: 'available' | 'in_use' | 'maintenance' | 'out_of_service') {
  try {
    // Get existing vehicle first
    const existingResult = await getVehicle(id);
    if (!existingResult.success) {
      return existingResult;
    }
    
    const existingVehicle = existingResult.data as VehicleDataBaseSchema;
    
    // Prepare update data with required fields
    const updateData: VehicleDataBaseSchema = {
      ...existingVehicle,
      status: status,
      updatedAt: new Date()
    };

    const result = await firestoreDataBase.update<'vehicles'>(
      { path: 'vehicles', id: id },
      updateData
    );

    if (result.status === 'error') {
      return {
        success: false,
        error: result.message || 'Failed to update vehicle status'
      };
    }

    revalidatePath('/dashboard/v-ma');

    return {
      success: true,
      message: `Vehicle status updated to ${status}`
    };
  } catch (error: any) {
    console.error('Error updating vehicle status:', error);
    return {
      success: false,
      error: error.message || 'Failed to update vehicle status'
    };
  }
}

// Assign driver to vehicle
export async function assignDriverToVehicle(vehicleId: string, driverId: string) {
  try {
    // Get existing vehicle first
    const existingResult = await getVehicle(vehicleId);
    if (!existingResult.success) {
      return existingResult;
    }
    
    const existingVehicle = existingResult.data as VehicleDataBaseSchema;
    
    // Prepare update data with required fields
    const updateData: VehicleDataBaseSchema = {
      ...existingVehicle,
      assignedDriverId: driverId,
      status: 'in_use' as const,
      updatedAt: new Date()
    };

    const result = await firestoreDataBase.update<'vehicles'>(
      { path: 'vehicles', id: vehicleId },
      updateData
    );

    if (result.status === 'error') {
      return {
        success: false,
        error: result.message || 'Failed to assign driver'
      };
    }

    revalidatePath('/dashboard/v-ma');
    revalidatePath(`/dashboard/v-ma/${vehicleId}`);

    return {
      success: true,
      message: 'Driver assigned successfully'
    };
  } catch (error: any) {
    console.error('Error assigning driver:', error);
    return {
      success: false,
      error: error.message || 'Failed to assign driver'
    };
  }
}

// Unassign driver from vehicle
export async function unassignDriverFromVehicle(vehicleId: string) {
  try {
    // Get existing vehicle first
    const existingResult = await getVehicle(vehicleId);
    if (!existingResult.success) {
      return existingResult;
    }
    
    const existingVehicle = existingResult.data as VehicleDataBaseSchema;
    
    // Prepare update data with required fields
    const updateData: VehicleDataBaseSchema = {
      ...existingVehicle,
      assignedDriverId: undefined,
      status: 'available' as const,
      updatedAt: new Date()
    };

    const result = await firestoreDataBase.update<'vehicles'>(
      { path: 'vehicles', id: vehicleId },
      updateData
    );

    if (result.status === 'error') {
      return {
        success: false,
        error: result.message || 'Failed to unassign driver'
      };
    }

    revalidatePath('/dashboard/v-ma');
    revalidatePath(`/dashboard/v-ma/${vehicleId}`);

    return {
      success: true,
      message: 'Driver unassigned successfully'
    };
  } catch (error: any) {
    console.error('Error unassigning driver:', error);
    return {
      success: false,
      error: error.message || 'Failed to unassign driver'
    };
  }
}

// Get vehicle statistics
export async function getVehicleStats() {
  try {
    const result = await firestoreDataBase.get<'vehicles'>(
      { path: 'vehicles' }
    );

    if (result.status === 'error' || !result.data) {
      return {
        success: false,
        error: result.message || 'Failed to fetch vehicle statistics',
        data: {
          total: 0,
          available: 0,
          in_use: 0,
          maintenance: 0,
          out_of_service: 0,
          byType: {}
        }
      };
    }

    const vehicles = result.data as VehicleDataBaseSchema[];
    
    const byType: Record<string, number> = {};
    vehicles.forEach(vehicle => {
      const type = vehicle.vehicleType || 'unknown';
      byType[type] = (byType[type] || 0) + 1;
    });

    const stats = {
      total: vehicles.length,
      available: vehicles.filter(v => v.status === 'available').length,
      in_use: vehicles.filter(v => v.status === 'in_use').length,
      maintenance: vehicles.filter(v => v.status === 'maintenance').length,
      out_of_service: vehicles.filter(v => v.status === 'out_of_service').length,
      byType
    };

    return {
      success: true,
      data: stats
    };
  } catch (error: any) {
    console.error('Error getting vehicle stats:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch vehicle statistics',
      data: {
        total: 0,
        available: 0,
        in_use: 0,
        maintenance: 0,
        out_of_service: 0,
        byType: {}
      }
    };
  }
}

// Update vehicle mileage
export async function updateVehicleMileage(id: string, mileage: number) {
  try {
    // Get existing vehicle first
    const existingResult = await getVehicle(id);
    if (!existingResult.success) {
      return existingResult;
    }
    
    const existingVehicle = existingResult.data as VehicleDataBaseSchema;
    
    // Prepare update data
    const updateData: VehicleDataBaseSchema = {
      ...existingVehicle,
      currentMileage: mileage,
      updatedAt: new Date()
    };

    const result = await firestoreDataBase.update<'vehicles'>(
      { path: 'vehicles', id: id },
      updateData
    );

    if (result.status === 'error') {
      return {
        success: false,
        error: result.message || 'Failed to update mileage'
      };
    }

    revalidatePath('/dashboard/v-ma');
    revalidatePath(`/dashboard/v-ma/${id}`);

    return {
      success: true,
      message: 'Mileage updated successfully'
    };
  } catch (error: any) {
    console.error('Error updating mileage:', error);
    return {
      success: false,
      error: error.message || 'Failed to update mileage'
    };
  }
}