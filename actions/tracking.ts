// app/actions/tracking.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/init';
import * as admin from 'firebase-admin';
import { assignDriverToVehicle } from './vehicle';

interface VehicleLocation {
  lat: number;
  lng: number;
  timestamp: Date;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

interface StartTripData {
  scheduleId: string;
  vehicleId: string;
  driverId: string;
  startLocation: {
    lat: number;
    lng: number;
    address?: string;
  };
}

// Get all vehicles with their latest locations
export async function getAllVehiclesWithLocations() {
  try {
    const vehiclesSnapshot = await db
      .collection('trucks')
      .orderBy('lastUpdated', 'desc')
      .get();

    const vehicles = await Promise.all(
      vehiclesSnapshot.docs.map(async (doc) => {
        const data = doc.data();

        // Get the latest location from subcollection
        const locationsSnapshot = await db
          .collection('trucks')
          .doc(doc.id)
          .collection('locations')
          .orderBy('timestamp', 'desc')
          .limit(1)
          .get();

        const lastLocation = locationsSnapshot.docs[0]?.data();

        // Get driver info if assigned
        let driverName = 'Unassigned';
        const assignedDriverId = data.assignedDriverId;
        
        if (assignedDriverId) {
          try {
            const driverDoc = await db.collection('drivers').doc(assignedDriverId).get();
            if (driverDoc.exists) {
              const driverData = driverDoc.data();
              driverName = `${driverData?.firstName || ''} ${driverData?.lastName || ''}`.trim() || 'Unknown';
            }
          } catch (error) {
            console.error(`Error fetching driver ${assignedDriverId}:`, error);
          }
        }

        return {
          id: doc.id,
          make: data.make || 'Unknown',
          model: data.model || 'Vehicle',
          plate: data.licensePlate || 'N/A',
          status: determineVehicleStatus(data, lastLocation),
          driver: data.assignedDriverId || 'Unassigned',
          driverId: data.assignedDriverId,
          speed: lastLocation?.speed || 0,
          location: lastLocation
            ? `${lastLocation.lat?.toFixed(4)}, ${lastLocation.lng?.toFixed(4)}`
            : 'Location unknown',
          coordinates: {
            lat: lastLocation?.lat || 37.7749,
            lng: lastLocation?.lng || -122.4194,
          },
          fuel: data.fuelLevel || 75,
          lastUpdate: lastLocation?.timestamp?.toDate() || new Date(),
          batteryLevel: data.batteryLevel || 85,
          signalStrength: data.signalStrength || 'strong',
        };
      })
    );

    return {
      success: true,
      data: vehicles,
    };
  } catch (error: any) {
    console.error('Error fetching vehicles:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch vehicles',
      data: [],
    };
  }
}

// Helper function to determine vehicle status
function determineVehicleStatus(
  vehicleData: any,
  lastLocation: any
): 'moving' | 'idle' | 'offline' | 'maintenance' {
  if (vehicleData.status === 'maintenance') return 'maintenance';

  const lastUpdate = lastLocation?.timestamp?.toDate();
  if (!lastUpdate) return 'offline';

  const minutesSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60);

  if (minutesSinceUpdate > 30) return 'offline';

  const speed = lastLocation?.speed || 0;
  if (speed > 5) return 'moving';

  return 'idle';
}

// Get active trips
export async function getActiveTrips() {
  try {
    const tripsRef = db.collection('trips');
    const tripsQuery = tripsRef
      .where('status', '==', 'active')
      .orderBy('startTime', 'desc');

    const tripsSnapshot = await tripsQuery.get();

    const trips = tripsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      startTime: doc.data().startTime?.toDate(),
    }));

    return {
      success: true,
      data: trips,
    };
  } catch (error: any) {
    console.error('Error fetching trips:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch trips',
      data: [],
    };
  }
}

// Get scheduled trips
export async function getSchedules(filters?: { status?: string }) {
  try {
    const schedulesRef = db.collection('schedules');
    let schedulesQuery: admin.firestore.Query = schedulesRef;

    if (filters?.status) {
      schedulesQuery = schedulesQuery.where('status', '==', filters.status);
    }

    schedulesQuery = schedulesQuery.orderBy('startTime', 'asc');

    const schedulesSnapshot = await schedulesQuery.get();

    const schedules = schedulesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      startTime: doc.data().startTime?.toDate(),
      endTime: doc.data().endTime?.toDate(),
    }));

    return {
      success: true,
      data: schedules,
    };
  } catch (error: any) {
    console.error('Error fetching schedules:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch schedules',
      data: [],
    };
  }
}

// Start a new trip
export async function createTrip(formData: FormData) {
  try {
    const tripData: StartTripData = {
      scheduleId: formData.get('scheduleId') as string,
      vehicleId: formData.get('vehicleId') as string,
      driverId: formData.get('driverId') as string,
      startLocation: {
        lat: parseFloat(formData.get('startLat') as string),
        lng: parseFloat(formData.get('startLng') as string),
        address: (formData.get('startAddress') as string) || undefined,
      },
    };

    const tripRef = await db.collection('trips').add({
      ...tripData,
      startTime: new Date(),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Update vehicle status
    await db.collection('trucks').doc(tripData.vehicleId).update({
      status: 'in_use',
      assignedDriverId: tripData.driverId,
      updatedAt: new Date(),
    });

    // Update schedule status
    await db.collection('schedules').doc(tripData.scheduleId).update({
      status: 'in_progress',
      startedAt: new Date(),
      updatedAt: new Date(),
    });

    revalidatePath('/dashboard/v-tracking');
    revalidatePath('/dashboard/v-ma');

    return {
      success: true,
      data: { id: tripRef.id, ...tripData },
      message: 'Trip started successfully',
    };
  } catch (error: any) {
    console.error('Error starting trip:', error);
    return {
      success: false,
      error: error.message || 'Failed to start trip',
    };
  }
}

// Complete a trip
export async function completeTrip(tripId: string, formData: FormData) {
  try {
    const endLocation = {
      lat: parseFloat(formData.get('endLat') as string),
      lng: parseFloat(formData.get('endLng') as string),
      address: (formData.get('endAddress') as string) || undefined,
    };

    const tripRef = db.collection('trips').doc(tripId);
    const tripDoc = await tripRef.get();

    if (!tripDoc.exists) {
      return {
        success: false,
        error: 'Trip not found',
      };
    }

    const tripData = tripDoc.data();

    await tripRef.update({
      status: 'completed',
      endTime: new Date(),
      endLocation,
      updatedAt: new Date(),
    });

    // Update vehicle status back to available
    if (tripData?.vehicleId) {
      await db.collection('trucks').doc(tripData.vehicleId).update({
        status: 'available',
        assignDriverId: null, //clear assigned driver
        updatedAt: new Date(),
      });
    }

    // Update schedule status
    if (tripData?.scheduleId) {
      await db.collection('schedules').doc(tripData.scheduleId).update({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      });
    }

    revalidatePath('/dashboard/v-tracking');

    return {
      success: true,
      message: 'Trip completed successfully',
    };
  } catch (error: any) {
    console.error('Error completing trip:', error);
    return {
      success: false,
      error: error.message || 'Failed to complete trip',
    };
  }
}

// Get vehicle location history
export async function getVehicleLocationHistory(
  vehicleId: string,
  limitCount: number = 100
) {
  try {
    const locationsSnapshot = await db
      .collection('trucks')
      .doc(vehicleId)
      .collection('locations')
      .orderBy('timestamp', 'desc')
      .limit(limitCount)
      .get();

    const locations = locationsSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      }))
      .reverse(); // Return in chronological order

    return {
      success: true,
      data: locations,
    };
  } catch (error: any) {
    console.error('Error fetching location history:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch location history',
      data: [],
    };
  }
}

// Update vehicle location (called from Flutter app)
export async function updateVehicleLocation(
  vehicleId: string,
  location: VehicleLocation
) {
  try {
    const batch = db.batch();

    // Update vehicle's last known location
    const vehicleRef = db.collection('trucks').doc(vehicleId);
    batch.update(vehicleRef, {
      lastKnownLocation: {
        lat: location.lat,
        lng: location.lng,
        timestamp: location.timestamp,
        speed: location.speed,
        heading: location.heading,
      },
      lastUpdated: new Date(),
    });

    // Add to location history
    const locationRef = db
      .collection('trucks')
      .doc(vehicleId)
      .collection('locations')
      .doc();

    batch.set(locationRef, {
      lat: location.lat,
      lng: location.lng,
      timestamp: location.timestamp,
      speed: location.speed,
      heading: location.heading,
      accuracy: location.accuracy,
    });

    await batch.commit();

    // Cleanup old locations (keep last 1000)
    const oldLocations = await db
      .collection('trucks')
      .doc(vehicleId)
      .collection('locations')
      .orderBy('timestamp', 'desc')
      .offset(1000)
      .limit(100)
      .get();

    if (!oldLocations.empty) {
      const deleteBatch = db.batch();
      oldLocations.docs.forEach((doc) => {
        deleteBatch.delete(doc.ref);
      });
      await deleteBatch.commit();
    }

    return {
      success: true,
      message: 'Location updated successfully',
    };
  } catch (error: any) {
    console.error('Error updating location:', error);
    return {
      success: false,
      error: error.message || 'Failed to update location',
    };
  }
}

// Add this to handle cancelled trips
export async function cancelTrip(tripId: string) {
  try {
    const tripRef = db.collection('trips').doc(tripId);
    const tripDoc = await tripRef.get();

    if (!tripDoc.exists) {
      return {
        success: false,
        error: 'Trip not found',
      };
    }

    const tripData = tripDoc.data();

    // Update trip status
    await tripRef.update({
      status: 'cancelled',
      endTime: new Date(),
      updatedAt: new Date(),
    });

    // Update vehicle status back to available
    if (tripData?.vehicleId) {
      await db.collection('trucks').doc(tripData.vehicleId).update({
        status: 'available',
        assignedDriverId: null,
        updatedAt: new Date(),
      });
    }

    // Update schedule status
    if (tripData?.scheduleId) {
      await db.collection('schedules').doc(tripData.scheduleId).update({
        status: 'cancelled',
        updatedAt: new Date(),
      });
    }

    revalidatePath('/dashboard/v-tracking');
    revalidatePath('/dashboard/v-ma');

    return {
      success: true,
      message: 'Trip cancelled successfully',
    };
  } catch (error: any) {
    console.error('Error cancelling trip:', error);
    return {
      success: false,
      error: error.message || 'Failed to cancel trip',
    };
  }
}