// app/actions/drivers.ts
'use server';

import { revalidatePath } from 'next/cache';
import { DriverSchema } from '@/schema/driverSchema';
import { normalizeFirestoreData } from '@/lib/utils';
import { DriverDataBaseSchema, firestoreDataBase } from '@/lib/firebase/firebaseDb';
import { db } from '@/lib/firebase/init';

// Generate a custom driver ID
function generateDriverId(firstName: string, lastName: string): string {
  const timestamp = Date.now().toString().slice(-4);
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  return `DRV-${timestamp}-${initials}`;
}

// Create a new driver
export async function createDriver(formData: FormData) {
  try {
    // Extract form data
    const driverData: any = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      licenseNumber: formData.get('licenseNumber') as string,
      licenseExpiry: formData.get('licenseExpiry') as string,
      address: formData.get('address') as string || undefined,
      employmentStatus: (formData.get('employmentStatus') as 'active' | 'inactive' | 'on_leave' | 'terminated') || 'active',
      hireDate: formData.get('hireDate') as string || new Date().toISOString(),
      assignedVehicleId: formData.get('assignedVehicleId') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    };

    // Handle emergency contact
    const emergencyName = formData.get('emergencyContactName');
    const emergencyPhone = formData.get('emergencyContactPhone');
    const emergencyRelationship = formData.get('emergencyContactRelationship');
    
    if (emergencyName && emergencyPhone && emergencyRelationship) {
      driverData.emergencyContact = {
        name: emergencyName as string,
        phone: emergencyPhone as string,
        relationship: emergencyRelationship as string,
      };
    }

    // Validate with Zod schema
    const validatedData = DriverSchema.parse(driverData);
    
    // Generate driver ID
    const driverId = generateDriverId(validatedData.firstName, validatedData.lastName);
    
    // Check if driver with email already exists
    const existingDriver = await firestoreDataBase.search<'drivers'>(
      { path: 'drivers' },
      'email' as any, // Type workaround
      validatedData.email,
      { limit: 1 }
    );
    
    if (existingDriver.status === 'success' && existingDriver.data && existingDriver.data.length > 0) {
      return {
        success: false,
        error: 'A driver with this email already exists'
      };
    }
    
    // Prepare data for Firestore (must match DriverDataBaseSchema)
    const firestoreData: DriverDataBaseSchema = {
      id: driverId,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      phone: validatedData.phone,
      licenseNumber: validatedData.licenseNumber,
      licenseExpiry: new Date(validatedData.licenseExpiry),
      address: validatedData.address,
      emergencyContact: validatedData.emergencyContact,
      employmentStatus: validatedData.employmentStatus,
      hireDate: new Date(validatedData.hireDate),
      assignedVehicleId: validatedData.assignedVehicleId,
      notes: validatedData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Create in Firestore
    const result = await firestoreDataBase.createWithId<'drivers'>(
      { path: 'drivers', id: driverId },
      firestoreData
    );

    if (result.status === 'error') {
      return {
        success: false,
        error: result.message || 'Failed to create driver'
      };
    }

    revalidatePath('/dashboard/driver_m');
    
    return {
      success: true,
      data: firestoreData,
      message: 'Driver created successfully'
    };
  } catch (error: any) {
    console.error('Error creating driver:', error);
    
    // Handle Zod validation errors
    if (error.errors) {
      return {
        success: false,
        error: error.errors.map((err: any) => err.message).join(', ')
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to create driver'
    };
  }
}

// Get all drivers with optional filtering
export async function getDrivers(filters?: {
  status?: string;
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
        field: 'employmentStatus',
        operator: '==',
        value: filters.status
      });
    }

    // Add orderBy if we have at least one filter
    if (queryOptions.where.length > 0) {
      queryOptions.orderBy = [{ field: 'createdAt', direction: 'desc' as const }];
    }

    const result = await firestoreDataBase.get<'drivers'>(
      { path: 'drivers' },
      queryOptions
    );

    if (result.status === 'error' || !result.data) {
      return {
        success: false,
        error: result.message || 'Failed to fetch drivers',
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        }
      };
    }

    let drivers = result.data as DriverDataBaseSchema[];

    // Apply search filter on client side
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      drivers = drivers.filter(driver =>
        driver.firstName?.toLowerCase().includes(searchTerm) ||
        driver.lastName?.toLowerCase().includes(searchTerm) ||
        driver.email?.toLowerCase().includes(searchTerm) ||
        driver.phone?.includes(searchTerm) ||
        driver.licenseNumber?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDrivers = drivers.slice(startIndex, endIndex);

    // Normalize data for client
    const normalizedDrivers = paginatedDrivers.map(normalizeFirestoreData);

    return {
      success: true,
      data: normalizedDrivers,
      pagination: {
        total: drivers.length,
        page,
        limit,
        totalPages: Math.ceil(drivers.length / limit)
      }
    };
  } catch (error: any) {
    console.error('Error getting drivers:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch drivers',
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

// Get driver by ID
export async function getDriver(id: string) {
  try {
    const result = await firestoreDataBase.getById<'drivers'>({
      path: 'drivers',
      id: id
    });

    if (result.status === 'error' || !result.data || result.data.length === 0) {
      return {
        success: false,
        error: result.message || 'Driver not found'
      };
    }

    const driver = normalizeFirestoreData(result.data[0]) as DriverDataBaseSchema;
    
    return {
      success: true,
      data: driver
    };
  } catch (error: any) {
    console.error('Error getting driver:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch driver'
    };
  }
}

// Update driver
export async function updateDriver(id: string, formData: FormData) {
  try {
    // Get existing driver first to merge data
    const existingResult = await getDriver(id);
    if (!existingResult.success) {
      return existingResult;
    }
    
    const existingDriver = existingResult.data as DriverDataBaseSchema;

    // Extract update data
    const updateData: Partial<DriverDataBaseSchema> = {};
    const fields = [
      'firstName', 'lastName', 'email', 'phone', 'licenseNumber',
      'licenseExpiry', 'address', 'employmentStatus', 'hireDate',
      'assignedVehicleId', 'notes'
    ] as const;

    fields.forEach(field => {
      const value = formData.get(field);
      if (value !== null && value !== undefined && value !== '') {
        if (field === 'licenseExpiry' || field === 'hireDate') {
          (updateData as any)[field] = new Date(value as string);
        } else {
          (updateData as any)[field] = value;
        }
      }
    });

    // Handle emergency contact update
    const emergencyName = formData.get('emergencyContactName');
    const emergencyPhone = formData.get('emergencyContactPhone');
    const emergencyRelationship = formData.get('emergencyContactRelationship');
    
    if (emergencyName || emergencyPhone || emergencyRelationship) {
      updateData.emergencyContact = {
        name: (emergencyName as string) || existingDriver.emergencyContact?.name || '',
        phone: (emergencyPhone as string) || existingDriver.emergencyContact?.phone || '',
        relationship: (emergencyRelationship as string) || existingDriver.emergencyContact?.relationship || '',
      };
    }

    // Add updatedAt
    updateData.updatedAt = new Date();

    // Update in Firestore
    const result = await firestoreDataBase.update<'drivers'>(
      { path: 'drivers', id: id },
      updateData as DriverDataBaseSchema
    );

    if (result.status === 'error') {
      return {
        success: false,
        error: result.message || 'Failed to update driver'
      };
    }

    revalidatePath('/dashboard/driver_m');
    revalidatePath(`/dashboard/driver_m/${id}`);

    return {
      success: true,
      message: 'Driver updated successfully',
      data: { id, ...updateData }
    };
  } catch (error: any) {
    console.error('Error updating driver:', error);
    
    if (error.errors) {
      return {
        success: false,
        error: error.errors.map((err: any) => err.message).join(', ')
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to update driver'
    };
  }
}

// Delete driver
export async function deleteDriver(id: string) {
  try {
    const result = await firestoreDataBase.delete({
      path: 'drivers',
      id: id
    });

    if (result.status === 'error') {
      return {
        success: false,
        error: result.message || 'Failed to delete driver'
      };
    }

    revalidatePath('/dashboard/driver_m');

    return {
      success: true,
      message: 'Driver deleted successfully'
    };
  } catch (error: any) {
    console.error('Error deleting driver:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete driver'
    };
  }
}

// Update driver status
export async function updateDriverStatus(id: string, status: 'active' | 'inactive' | 'on_leave' | 'terminated') {
  try {
    // Get existing driver first
    const existingResult = await getDriver(id);
    if (!existingResult.success) {
      return existingResult;
    }
    
    const existingDriver = existingResult.data as DriverDataBaseSchema;
    
    // Prepare update data with required fields
    const updateData: DriverDataBaseSchema = {
      ...existingDriver,
      employmentStatus: status,
      updatedAt: new Date()
    };

    const result = await firestoreDataBase.update<'drivers'>(
      { path: 'drivers', id: id },
      updateData
    );

    if (result.status === 'error') {
      return {
        success: false,
        error: result.message || 'Failed to update driver status'
      };
    }

    revalidatePath('/dashboard/driver_m');

    return {
      success: true,
      message: `Driver status updated to ${status}`
    };
  } catch (error: any) {
    console.error('Error updating driver status:', error);
    return {
      success: false,
      error: error.message || 'Failed to update driver status'
    };
  }
}

// Get driver statistics
export async function getDriverStats() {
  try {
    const result = await firestoreDataBase.get<'drivers'>(
      { path: 'drivers' }
    );

    if (result.status === 'error' || !result.data) {
      return {
        success: false,
        error: result.message || 'Failed to fetch driver statistics',
        data: {
          total: 0,
          active: 0,
          inactive: 0,
          on_leave: 0,
          terminated: 0
        }
      };
    }

    const drivers = result.data as DriverDataBaseSchema[];
    
    const stats = {
      total: drivers.length,
      active: drivers.filter(d => d.employmentStatus === 'active').length,
      inactive: drivers.filter(d => d.employmentStatus === 'inactive').length,
      on_leave: drivers.filter(d => d.employmentStatus === 'on_leave').length,
      terminated: drivers.filter(d => d.employmentStatus === 'terminated').length,
    };

    return {
      success: true,
      data: stats
    };
  } catch (error: any) {
    console.error('Error getting driver stats:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch driver statistics',
      data: {
        total: 0,
        active: 0,
        inactive: 0,
        on_leave: 0,
        terminated: 0
      }
    };
  }
}

// Assign vehicle to driver
export async function assignVehicleToDriver(driverId: string, vehicleId: string) {
  try {
    // Get existing driver first
    const existingResult = await getDriver(driverId);
    if (!existingResult.success) {
      return existingResult;
    }
    
    const existingDriver = existingResult.data as DriverDataBaseSchema;
    
    // Prepare update data with required fields
    const updateData: DriverDataBaseSchema = {
      ...existingDriver,
      assignedVehicleId: vehicleId,
      updatedAt: new Date()
    };

    const result = await firestoreDataBase.update<'drivers'>(
      { path: 'drivers', id: driverId },
      updateData
    );

    if (result.status === 'error') {
      return {
        success: false,
        error: result.message || 'Failed to assign vehicle'
      };
    }

    revalidatePath('/dashboard/driver_m');
    revalidatePath(`/dashboard/driver_m/${driverId}`);

    return {
      success: true,
      message: 'Vehicle assigned successfully'
    };
  } catch (error: any) {
    console.error('Error assigning vehicle:', error);
    return {
      success: false,
      error: error.message || 'Failed to assign vehicle'
    };
  }
}

export async function searchDrivers(query: string) {
  try {
    // Get all drivers first (since firestoreDataBase.search might not support complex queries)
    const result = await firestoreDataBase.get<'drivers'>(
      { path: 'drivers' },
      { limit: 100 }
    );

    if (result.status === 'error' || !result.data) {
      return {
        success: false,
        error: result.message || 'Failed to search drivers',
        data: []
      };
    }

    const drivers = result.data as any[];
    const queryLower = query.toLowerCase();

    // Filter drivers client-side
    const filteredDrivers = drivers.filter(driver => 
      driver.email?.toLowerCase().includes(queryLower) ||
      driver.firstName?.toLowerCase().includes(queryLower) ||
      driver.lastName?.toLowerCase().includes(queryLower) ||
      driver.phone?.includes(query) ||
      `${driver.firstName} ${driver.lastName}`.toLowerCase().includes(queryLower)
    );

    return {
      success: true,
      data: filteredDrivers.map(normalizeFirestoreData)
    };
  } catch (error: any) {
    console.error('Error searching drivers:', error);
    return {
      success: false,
      error: error.message || 'Failed to search drivers',
      data: []
    };
  }
}