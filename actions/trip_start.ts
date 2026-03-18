// actions/trip_start.ts
'use server';

import { revalidatePath } from 'next/cache';
import { firestoreDataBase } from '@/lib/firebase/firebaseDb';
import { TripDatabaseSchema, ScheduleDataBaseSchema, VehicleDataBaseSchema, DriverDataBaseSchema } from '@/lib/firebase/firebaseDb';

interface StartTripResult {
  success: boolean;
  error?: string;
  data?: {
    tripId: string;
    scheduleId: string;
    vehicleId: string;
    driverId: string;
  };
  message?: string;
}

// Helper function to remove undefined values from objects
function removeUndefined<T extends Record<string, any>>(obj: T): T {
  const cleaned = {} as T;
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key as keyof T] = value;
    }
  }
  return cleaned;
}

export async function startTripFromSchedule(scheduleId: string): Promise<StartTripResult> {
  try {
    console.log('Starting trip for schedule:', scheduleId);
    
    // Get the schedule details
    const scheduleResult = await firestoreDataBase.getById<'schedules'>({
      path: 'schedules',
      id: scheduleId
    });

    // Check if schedule exists
    if (scheduleResult.status === 'error') {
      console.error('Error fetching schedule:', scheduleResult.message);
      return {
        success: false,
        error: scheduleResult.message || 'Failed to fetch schedule'
      };
    }

    if (!scheduleResult.data || scheduleResult.data.length === 0) {
      console.error('Schedule not found:', scheduleId);
      return {
        success: false,
        error: 'Schedule not found'
      };
    }

    const schedule = scheduleResult.data[0] as ScheduleDataBaseSchema;
    console.log('Found schedule:', schedule);

    // Check if schedule can be started - only 'scheduled' status can be started
    if (schedule.status !== 'scheduled') {
      return {
        success: false,
        error: `Cannot start trip. Schedule status is ${schedule.status}`
      };
    }

    // Check if vehicle is available
    const vehicleResult = await firestoreDataBase.getById<'vehicles'>({
      path: 'vehicles',
      id: schedule.vehicleId
    });

    if (vehicleResult.status === 'error') {
      console.error('Error fetching vehicle:', vehicleResult.message);
      return {
        success: false,
        error: vehicleResult.message || 'Failed to fetch vehicle'
      };
    }

    if (!vehicleResult.data || vehicleResult.data.length === 0) {
      return {
        success: false,
        error: 'Assigned vehicle not found'
      };
    }

    const vehicle = vehicleResult.data[0] as VehicleDataBaseSchema;
    console.log('Found vehicle:', vehicle);
    
    if (vehicle.status === 'in_use') {
      return {
        success: false,
        error: 'Vehicle is already in use'
      };
    }

    if (vehicle.status === 'maintenance') {
      return {
        success: false,
        error: 'Vehicle is under maintenance'
      };
    }

    // Check if driver is available
    const driverResult = await firestoreDataBase.getById<'drivers'>({
      path: 'drivers',
      id: schedule.driverId
    });

    if (driverResult.status === 'error') {
      console.error('Error fetching driver:', driverResult.message);
      return {
        success: false,
        error: driverResult.message || 'Failed to fetch driver'
      };
    }

    if (!driverResult.data || driverResult.data.length === 0) {
      return {
        success: false,
        error: 'Assigned driver not found'
      };
    }

    const driver = driverResult.data[0] as DriverDataBaseSchema;
    console.log('Found driver:', driver);
    
    if (driver.employmentStatus !== 'active') {
      return {
        success: false,
        error: 'Driver is not available'
      };
    }

    // Generate trip ID
    const tripId = `TRIP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Create trip data - IMPORTANT: DO NOT include undefined fields
    const tripData = {
      id: tripId,
      vehicleId: schedule.vehicleId,
      driverId: schedule.driverId,
      scheduleId: schedule.id,
      startTime: new Date(),
      // DO NOT include endTime at all (it will be added when trip completes)
      startLocation: {
        lat: schedule.location?.coordinates?.fromLat || 0,
        lng: schedule.location?.coordinates?.fromLng || 0,
        address: schedule.location?.from || ''
      },
      status: 'active',
      totalDistance: 0,
      totalDuration: 0,
      averageSpeed: 0,
      maxSpeed: 0,
      idleTime: 0,
      fuelConsumed: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Remove any undefined values just to be safe
    const cleanTripData = removeUndefined(tripData);

    console.log('Creating trip:', tripId, cleanTripData);

    // Create trip in Firestore
    const tripCreateResult = await firestoreDataBase.createWithId<'trips'>(
      { path: 'trips', id: tripId },
      cleanTripData as TripDatabaseSchema
    );

    if (tripCreateResult.status === 'error') {
      console.error('Failed to create trip:', tripCreateResult.message);
      return {
        success: false,
        error: tripCreateResult.message || 'Failed to create trip'
      };
    }

    // Update schedule status
    const scheduleUpdateData = {
      status: 'in_progress',
      updatedAt: new Date()
    };

    const scheduleUpdateResult = await firestoreDataBase.update<'schedules'>(
      { path: 'schedules', id: scheduleId },
      scheduleUpdateData as ScheduleDataBaseSchema
    );

    if (scheduleUpdateResult.status === 'error') {
      console.error('Failed to update schedule:', scheduleUpdateResult.message);
      return {
        success: false,
        error: scheduleUpdateResult.message || 'Failed to update schedule'
      };
    }

    // Update vehicle status
    const vehicleUpdateData = {
      status: 'in_use',
      assignedDriverId: schedule.driverId,
      updatedAt: new Date()
    };

    const vehicleUpdateResult = await firestoreDataBase.update<'vehicles'>(
      { path: 'vehicles', id: schedule.vehicleId },
      vehicleUpdateData as VehicleDataBaseSchema
    );

    if (vehicleUpdateResult.status === 'error') {
      console.error('Failed to update vehicle:', vehicleUpdateResult.message);
      return {
        success: false,
        error: vehicleUpdateResult.message || 'Failed to update vehicle'
      };
    }

    // Update driver status
    const driverUpdateData = {
      updatedAt: new Date()
    };

    await firestoreDataBase.update<'drivers'>(
      { path: 'drivers', id: schedule.driverId },
      driverUpdateData as DriverDataBaseSchema
    );

    // Revalidate relevant paths
    revalidatePath('/dashboard/schedules');
    revalidatePath('/dashboard/v-tracking');
    revalidatePath('/dashboard/vehicles');
    revalidatePath('/dashboard/driver_m');

    console.log('Trip started successfully:', tripId);

    return {
      success: true,
      data: {
        tripId,
        scheduleId,
        vehicleId: schedule.vehicleId,
        driverId: schedule.driverId
      },
      message: 'Trip started successfully'
    };

  } catch (error: any) {
    console.error('Error starting trip:', error);
    return {
      success: false,
      error: error.message || 'Failed to start trip'
    };
  }
}