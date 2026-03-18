// app/actions/schedules.ts
'use server';

import { revalidatePath } from 'next/cache';
import { ScheduleSchema } from '@/schema/scheduleSchema';
import { normalizeFirestoreData } from '@/lib/utils';
import { firestoreDataBase } from '@/lib/firebase/firebaseDb';
import { db } from '@/lib/firebase/init';

// Define a proper type for schedule data with optional properties
interface ScheduleData {
  id?: string;
  title: string;
  description?: string;
  driverId: string;
  vehicleId: string;
  startTime: Date;
  endTime: Date;
  scheduleType: 'delivery' | 'pickup' | 'maintenance' | 'training' | 'meeting' | 'other';
  location: {
    from: string;
    to: string;
    coordinates?: {
      fromLat?: number;
      fromLng?: number;
      toLat?: number;
      toLng?: number;
    };
  };
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'delayed';
  estimatedDistance?: number;
  estimatedDuration?: number;
  notes?: string;
  recurring?: {
    pattern?: 'daily' | 'weekly' | 'monthly' | 'custom';
    interval?: number;
    endDate?: Date;
  };
  actualStartTime?: Date;
  actualEndTime?: Date;
  actualDistance?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Generate a custom schedule ID
function generateScheduleId(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SCH-${timestamp.slice(-6)}-${random}`;
}

// Helper function to clean undefined properties
function cleanData<T extends Record<string, any>>(data: T): T {
  const cleaned = { ...data };
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
}

// Create a new schedule
export async function createSchedule(formData: FormData) {
  try {
    // Extract form data
    const scheduleData: any = {
      title: formData.get('title') as string,
      description: formData.get('description') as string || undefined,
      driverId: formData.get('driverId') as string,
      vehicleId: formData.get('vehicleId') as string,
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      scheduleType: formData.get('scheduleType') as 'delivery' | 'pickup' | 'maintenance' | 'training' | 'meeting' | 'other',
      location: {
        from: formData.get('fromLocation') as string,
        to: formData.get('toLocation') as string,
      },
      status: (formData.get('status') as 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'delayed') || 'scheduled',
      notes: formData.get('notes') as string || undefined,
    };

    // Handle estimated distance and duration
    const estimatedDistance = formData.get('estimatedDistance');
    if (estimatedDistance && estimatedDistance.toString().trim()) {
      scheduleData.estimatedDistance = parseFloat(estimatedDistance as string);
    }

    const estimatedDuration = formData.get('estimatedDuration');
    if (estimatedDuration && estimatedDuration.toString().trim()) {
      scheduleData.estimatedDuration = parseFloat(estimatedDuration as string);
    }

    // Handle coordinates if provided
    const fromLat = formData.get('fromLat');
    const fromLng = formData.get('fromLng');
    const toLat = formData.get('toLat');
    const toLng = formData.get('toLng');
    
    if (fromLat && fromLng && toLat && toLng) {
      scheduleData.location.coordinates = {
        fromLat: parseFloat(fromLat as string),
        fromLng: parseFloat(fromLng as string),
        toLat: parseFloat(toLat as string),
        toLng: parseFloat(toLng as string),
      };
    }

    // Handle recurring schedule
    const recurringPattern = formData.get('recurringPattern');
    const recurringInterval = formData.get('recurringInterval');
    const recurringEndDate = formData.get('recurringEndDate');
    
    if (recurringPattern) {
      const recurring: any = {
        pattern: recurringPattern as 'daily' | 'weekly' | 'monthly' | 'custom',
      };
      
      if (recurringInterval && recurringInterval.toString().trim()) {
        recurring.interval = parseInt(recurringInterval as string);
      }
      
      if (recurringEndDate && recurringEndDate.toString().trim()) {
        recurring.endDate = new Date(recurringEndDate as string);
      }
      
      scheduleData.recurring = recurring;
    }

    // Validate with Zod schema
    const validatedData = ScheduleSchema.parse(scheduleData);
    
    // Generate schedule ID
    const scheduleId = generateScheduleId();
    
    
    // Check for overlapping schedules for the same driver
    const overlappingSchedules = await firestoreDataBase.search<'schedules'>(
      { path: 'schedules' },
      'driverId' as any,
      validatedData.driverId,
      { limit: 10 }
    );
    
    if (overlappingSchedules.status === 'success' && overlappingSchedules.data) {
      const existingSchedules = overlappingSchedules.data;
      const startTime = new Date(validatedData.startTime);
      const endTime = new Date(validatedData.endTime);
      
      const hasOverlap = existingSchedules.some((schedule: any) => {
        const existingStart = new Date(schedule.startTime);
        const existingEnd = new Date(schedule.endTime);
        
        // Check if time periods overlap
        return (
          (startTime >= existingStart && startTime < existingEnd) ||
          (endTime > existingStart && endTime <= existingEnd) ||
          (startTime <= existingStart && endTime >= existingEnd)
        );
      });
      
      if (hasOverlap) {
        return {
          success: false,
          error: 'Driver already has a schedule during this time period'
        };
      }
    }
    
    // Check for overlapping schedules for the same vehicle
    const overlappingVehicleSchedules = await firestoreDataBase.search<'schedules'>(
      { path: 'schedules' },
      'vehicleId' as any,
      validatedData.vehicleId,
      { limit: 10 }
    );
    
    if (overlappingVehicleSchedules.status === 'success' && overlappingVehicleSchedules.data) {
      const existingSchedules = overlappingVehicleSchedules.data;
      const startTime = new Date(validatedData.startTime);
      const endTime = new Date(validatedData.endTime);
      
      const hasOverlap = existingSchedules.some((schedule: any) => {
        const existingStart = new Date(schedule.startTime);
        const existingEnd = new Date(schedule.endTime);
        
        // Check if time periods overlap
        return (
          (startTime >= existingStart && startTime < existingEnd) ||
          (endTime > existingStart && endTime <= existingEnd) ||
          (startTime <= existingStart && endTime >= existingEnd)
        );
      });
      
      if (hasOverlap) {
        return {
          success: false,
          error: 'Vehicle already has a schedule during this time period'
        };
      }
    }
    
    // Prepare data for Firestore
    const firestoreData: ScheduleData = {
      id: scheduleId,
      title: validatedData.title,
      driverId: validatedData.driverId,
      vehicleId: validatedData.vehicleId,
      startTime: new Date(validatedData.startTime),
      endTime: new Date(validatedData.endTime),
      scheduleType: validatedData.scheduleType,
      location: {
        from: validatedData.location.from,
        to: validatedData.location.to,
        coordinates: validatedData.location.coordinates,
      },
      status: validatedData.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add optional fields if they exist
    if (validatedData.description) {
      firestoreData.description = validatedData.description;
    }
    
    if (validatedData.estimatedDistance !== undefined) {
      firestoreData.estimatedDistance = validatedData.estimatedDistance;
    }
    
    if (validatedData.estimatedDuration !== undefined) {
      firestoreData.estimatedDuration = validatedData.estimatedDuration;
    }
    
    if (validatedData.notes) {
      firestoreData.notes = validatedData.notes;
    }
    
    if (validatedData.recurring) {
      firestoreData.recurring = validatedData.recurring;
    }
    
    if (validatedData.location.coordinates) {
      firestoreData.location.coordinates = validatedData.location.coordinates;
    }

    // Clean undefined properties
    const cleanFirestoreData = cleanData(firestoreData);
    
    // Create in Firestore
    const result = await firestoreDataBase.createWithId<'schedules'>(
      { path: 'schedules', id: scheduleId },
      cleanFirestoreData as any // Type assertion needed
    );

    if (result.status === 'error') {
      return {
        success: false,
        error: result.message || 'Failed to create schedule'
      };
    }

    revalidatePath('/dashboard/schedules');
    
    return {
      success: true,
      data: cleanFirestoreData,
      message: 'Schedule created successfully'
    };
  } catch (error: any) {
    console.error('Error creating schedule:', error);
    
    // Handle Zod validation errors
    if (error.errors) {
      return {
        success: false,
        error: error.errors.map((err: any) => err.message).join(', ')
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to create schedule'
    };
  }
}

// Get all schedules with optional filtering
export async function getSchedules(filters?: {
  status?: string;
  driverId?: string;
  vehicleId?: string;
  startDate?: string;
  endDate?: string;
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

    // Apply driver filter
    if (filters?.driverId) {
      queryOptions.where.push({
        field: 'driverId',
        operator: '==',
        value: filters.driverId
      });
    }

    // Apply vehicle filter
    if (filters?.vehicleId) {
      queryOptions.where.push({
        field: 'vehicleId',
        operator: '==',
        value: filters.vehicleId
      });
    }

    // Add orderBy
    queryOptions.orderBy = [{ field: 'startTime', direction: 'asc' as const }];

    const result = await firestoreDataBase.get<'schedules'>(
      { path: 'schedules' },
      queryOptions
    );

    if (result.status === 'error' || !result.data) {
      return {
        success: false,
        error: result.message || 'Failed to fetch schedules',
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        }
      };
    }

    let schedules = result.data as ScheduleData[];

    // Apply date range filter
    if (filters?.startDate) {
      const startDate = new Date(filters.startDate);
      schedules = schedules.filter(schedule => 
        new Date(schedule.startTime) >= startDate
      );
    }

    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      schedules = schedules.filter(schedule => 
        new Date(schedule.endTime) <= endDate
      );
    }

    // Apply search filter on client side
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      schedules = schedules.filter(schedule =>
        schedule.title?.toLowerCase().includes(searchTerm) ||
        schedule.description?.toLowerCase().includes(searchTerm) ||
        schedule.location?.from?.toLowerCase().includes(searchTerm) ||
        schedule.location?.to?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSchedules = schedules.slice(startIndex, endIndex);

    // Normalize data for client
    const normalizedSchedules = paginatedSchedules.map(normalizeFirestoreData);

    return {
      success: true,
      data: normalizedSchedules,
      pagination: {
        total: schedules.length,
        page,
        limit,
        totalPages: Math.ceil(schedules.length / limit)
      }
    };
  } catch (error: any) {
    console.error('Error getting schedules:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch schedules',
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

// Get schedule by ID
export async function getSchedule(id: string) {
  try {
    const result = await firestoreDataBase.getById<'schedules'>({
      path: 'schedules',
      id: id
    });

    if (result.status === 'error' || !result.data || result.data.length === 0) {
      return {
        success: false,
        error: result.message || 'Schedule not found'
      };
    }

    const schedule = normalizeFirestoreData(result.data[0]) as ScheduleData;
    
    return {
      success: true,
      data: schedule
    };
  } catch (error: any) {
    console.error('Error getting schedule:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch schedule'
    };
  }
}

// Update schedule
export async function updateSchedule(id: string, formData: FormData) {
  try {
    // Get existing schedule first to merge data
    const existingResult = await getSchedule(id);
    if (!existingResult.success) {
      return existingResult;
    }
    
    const existingSchedule = existingResult.data as ScheduleData;
    if (!existingSchedule) {
      return {
        success: false,
        error: 'Schedule not found'
      };
    }

    // Extract update data
    const updateData: Partial<ScheduleData> = {};
    const fields = [
      'title', 'description', 'driverId', 'vehicleId', 'startTime', 'endTime',
      'scheduleType', 'status', 'estimatedDistance', 'estimatedDuration', 'notes'
    ] as const;

    fields.forEach(field => {
      const value = formData.get(field);
      if (value !== null && value !== undefined && value !== '') {
        if (field === 'startTime' || field === 'endTime') {
          (updateData as any)[field] = new Date(value as string);
        } else if (field === 'estimatedDistance' || field === 'estimatedDuration') {
          (updateData as any)[field] = parseFloat(value as string);
        } else {
          (updateData as any)[field] = value;
        }
      }
    });

    // Update location if provided
    const fromLocation = formData.get('fromLocation');
    const toLocation = formData.get('toLocation');
    if (fromLocation || toLocation) {
      updateData.location = {
        ...existingSchedule.location,
        from: (fromLocation as string) || existingSchedule.location.from,
        to: (toLocation as string) || existingSchedule.location.to,
      };
    }

    // Update coordinates if provided
    const fromLat = formData.get('fromLat');
    const fromLng = formData.get('fromLng');
    const toLat = formData.get('toLat');
    const toLng = formData.get('toLng');
    
    if (fromLat || fromLng || toLat || toLng) {
      const coordinates: any = {};
      
      if (fromLat && fromLat.toString().trim()) {
        coordinates.fromLat = parseFloat(fromLat as string);
      }
      if (fromLng && fromLng.toString().trim()) {
        coordinates.fromLng = parseFloat(fromLng as string);
      }
      if (toLat && toLat.toString().trim()) {
        coordinates.toLat = parseFloat(toLat as string);
      }
      if (toLng && toLng.toString().trim()) {
        coordinates.toLng = parseFloat(toLng as string);
      }
      
      updateData.location = {
        ...updateData.location || existingSchedule.location,
        coordinates: coordinates,
      };
    }

    // Add updatedAt
    updateData.updatedAt = new Date();

    // Clean undefined properties
    const cleanUpdateData = cleanData(updateData);

    // Update in Firestore
    const result = await firestoreDataBase.update<'schedules'>(
      { path: 'schedules', id: id },
      cleanUpdateData as any // Type assertion needed
    );

    if (result.status === 'error') {
      return {
        success: false,
        error: result.message || 'Failed to update schedule'
      };
    }

    revalidatePath('/dashboard/schedules');
    revalidatePath(`/dashboard/schedules/${id}`);

    return {
      success: true,
      message: 'Schedule updated successfully',
      data: { id, ...cleanUpdateData }
    };
  } catch (error: any) {
    console.error('Error updating schedule:', error);
    
    if (error.errors) {
      return {
        success: false,
        error: error.errors.map((err: any) => err.message).join(', ')
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to update schedule'
    };
  }
}

// Delete schedule
export async function deleteSchedule(id: string) {
  try {
    const result = await firestoreDataBase.delete({
      path: 'schedules',
      id: id
    });

    if (result.status === 'error') {
      return {
        success: false,
        error: result.message || 'Failed to delete schedule'
      };
    }

    revalidatePath('/dashboard/schedules');

    return {
      success: true,
      message: 'Schedule deleted successfully'
    };
  } catch (error: any) {
    console.error('Error deleting schedule:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete schedule'
    };
  }
}

// Update schedule status
export async function updateScheduleStatus(id: string, status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'delayed') {
  try {
    // Get existing schedule first
    const existingResult = await getSchedule(id);
    if (!existingResult.success) {
      return existingResult;
    }
    
    const existingSchedule = existingResult.data as ScheduleData;
    if (!existingSchedule) {
      return {
        success: false,
        error: 'Schedule not found'
      };
    }
    
    // Prepare update data
    const updateData: Partial<ScheduleData> = {
      status: status,
      updatedAt: new Date()
    };

    // Add actual timestamps based on status
    if (status === 'in_progress' && !existingSchedule.actualStartTime) {
      updateData.actualStartTime = new Date();
    } else if (status === 'completed' && !existingSchedule.actualEndTime) {
      updateData.actualEndTime = new Date();
    }

    const cleanUpdateData = cleanData(updateData);

    const result = await firestoreDataBase.update<'schedules'>(
      { path: 'schedules', id: id },
      cleanUpdateData as any // Type assertion needed
    );

    if (result.status === 'error') {
      return {
        success: false,
        error: result.message || 'Failed to update schedule status'
      };
    }

    revalidatePath('/dashboard/schedules');

    return {
      success: true,
      message: `Schedule status updated to ${status}`
    };
  } catch (error: any) {
    console.error('Error updating schedule status:', error);
    return {
      success: false,
      error: error.message || 'Failed to update schedule status'
    };
  }
}

// Get schedule statistics
export async function getScheduleStats() {
  try {
    const result = await firestoreDataBase.get<'schedules'>(
      { path: 'schedules' }
    );

    if (result.status === 'error' || !result.data) {
      return {
        success: false,
        error: result.message || 'Failed to fetch schedule statistics',
        data: {
          total: 0,
          scheduled: 0,
          in_progress: 0,
          completed: 0,
          cancelled: 0,
          delayed: 0,
          byType: {}
        }
      };
    }

    const schedules = result.data as ScheduleData[];
    
    const byType: Record<string, number> = {};
    schedules.forEach(schedule => {
      const type = schedule.scheduleType || 'unknown';
      byType[type] = (byType[type] || 0) + 1;
    });

    const stats = {
      total: schedules.length,
      scheduled: schedules.filter(s => s.status === 'scheduled').length,
      in_progress: schedules.filter(s => s.status === 'in_progress').length,
      completed: schedules.filter(s => s.status === 'completed').length,
      cancelled: schedules.filter(s => s.status === 'cancelled').length,
      delayed: schedules.filter(s => s.status === 'delayed').length,
      byType
    };

    return {
      success: true,
      data: stats
    };
  } catch (error: any) {
    console.error('Error getting schedule stats:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch schedule statistics',
      data: {
        total: 0,
        scheduled: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
        delayed: 0,
        byType: {}
      }
    };
  }
}

// Get today's schedules
export async function getTodaysSchedules() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all schedules and filter client-side
    const result = await firestoreDataBase.get<'schedules'>(
      { path: 'schedules' }
    );

    if (result.status === 'error' || !result.data) {
      return {
        success: false,
        error: result.message || 'Failed to fetch today\'s schedules',
        data: []
      };
    }

    // Filter schedules that start today
    const todaysSchedules = result.data.filter((schedule: any) => {
      const scheduleDate = new Date(schedule.startTime);
      return scheduleDate >= today && scheduleDate < tomorrow;
    });

    // Normalize data for client
    const normalizedSchedules = todaysSchedules.map(normalizeFirestoreData);

    return {
      success: true,
      data: normalizedSchedules
    };
  } catch (error: any) {
    console.error('Error getting today\'s schedules:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch today\'s schedules',
      data: []
    };
  }
}


// Get driver's recent schedules
export async function getDriverRecentSchedules(driverId: string, limit: number = 10) {
  try {
    const result = await firestoreDataBase.search<'schedules'>(
      { path: 'schedules' },
      'driverId' as any,
      driverId,
      { limit }
    );

    if (result.status === 'error' || !result.data) {
      return {
        success: false,
        error: result.message || 'Failed to fetch schedules',
        data: [],
      };
    }

    // Sort by startTime descending and limit
    const schedules = result.data
      .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, limit)
      .map(normalizeFirestoreData);

    return {
      success: true,
      data: schedules,
    };
  } catch (error: any) {
    console.error('Error fetching driver schedules:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch schedules',
      data: [],
    };
  }
}

// Get driver schedule statistics
export async function getDriverScheduleStats(driverId: string) {
  try {
    const result = await firestoreDataBase.search<'schedules'>(
      { path: 'schedules' },
      'driverId' as any,
      driverId,
      { limit: 1000 } // Get all schedules for this driver
    );

    if (result.status === 'error' || !result.data) {
      return {
        success: false,
        error: result.message || 'Failed to fetch stats',
        data: {
          totalTrips: 0,
          completedTrips: 0,
          cancelledTrips: 0,
          totalDistance: 0,
          totalHours: 0,
          onTimeRate: 0,
          averageSpeed: 0,
        },
      };
    }

    const schedules = result.data;
    
    const totalTrips = schedules.length;
    const completedTrips = schedules.filter((s: any) => s.status === 'completed').length;
    const cancelledTrips = schedules.filter((s: any) => s.status === 'cancelled').length;
    
    // Calculate on-time rate (simplified)
    const onTimeRate = completedTrips > 0 ? 95 : 0; // Placeholder
    
    // Calculate total distance
    const totalDistance = schedules.reduce((sum: number, s: any) => sum + (s.estimatedDistance || 0), 0);
    
    // Calculate total hours
    const totalHours = schedules.reduce((sum: number, s: any) => {
      if (s.startTime && s.endTime) {
        const hours = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }
      return sum;
    }, 0);
    
    // Average speed (km/h)
    const averageSpeed = totalHours > 0 ? Math.round(totalDistance / totalHours) : 0;

    return {
      success: true,
      data: {
        totalTrips,
        completedTrips,
        cancelledTrips,
        totalDistance: Math.round(totalDistance),
        totalHours: Math.round(totalHours * 10) / 10,
        onTimeRate,
        averageSpeed,
      },
    };
  } catch (error: any) {
    console.error('Error fetching driver stats:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch stats',
      data: {
        totalTrips: 0,
        completedTrips: 0,
        cancelledTrips: 0,
        totalDistance: 0,
        totalHours: 0,
        onTimeRate: 0,
        averageSpeed: 0,
      },
    };
  }
}

// app/actions/schedules.ts (add this function)
export async function getDriverSchedule(driverId: string) {
  try {
    // Get active trip for driver
    const tripsRef = db.collection('trips');
    const activeTripSnapshot = await tripsRef
      .where('driverId', '==', driverId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (!activeTripSnapshot.empty) {
      const trip = activeTripSnapshot.docs[0];
      const tripData = trip.data();
      
      // Get associated schedule
      if (tripData.scheduleId) {
        const scheduleDoc = await db.collection('schedules').doc(tripData.scheduleId).get();
        if (scheduleDoc.exists) {
          return {
            success: true,
            data: {
              id: scheduleDoc.id,
              ...normalizeFirestoreData(scheduleDoc.data())
            }
          };
        }
      }
    }

    return {
      success: true,
      data: null
    };
  } catch (error: any) {
    console.error('Error getting driver schedule:', error);
    return {
      success: false,
      error: error.message || 'Failed to get driver schedule',
      data: null
    };
  }
}