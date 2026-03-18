// app/actions/vehicle-cleanup.ts
'use server';

import { db } from '@/lib/firebase/init';
import { revalidatePath } from 'next/cache';

// Fix all vehicles stuck in "in_use" status
export async function resetStuckVehicles() {
  try {
    // Get all vehicles that are marked as "in_use"
    const vehiclesSnapshot = await db
      .collection('trucks')
      .where('status', '==', 'in_use')
      .get();

    const batch = db.batch();
    let updateCount = 0;

    for (const doc of vehiclesSnapshot.docs) {
      const vehicleData = doc.data();
      
      // Check if there's actually an active trip for this vehicle
      const activeTripsSnapshot = await db
        .collection('trips')
        .where('vehicleId', '==', doc.id)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      // If no active trips found, reset the vehicle status
      if (activeTripsSnapshot.empty) {
        batch.update(doc.ref, {
          status: 'available',
          assignedDriverId: null,
          updatedAt: new Date()
        });
        updateCount++;
      }
    }

    if (updateCount > 0) {
      await batch.commit();
    }

    revalidatePath('/dashboard/v-ma');
    revalidatePath('/dashboard/tracking');

    return {
      success: true,
      message: `Reset ${updateCount} stuck vehicles to available status`,
      count: updateCount
    };
  } catch (error: any) {
    console.error('Error resetting vehicles:', error);
    return {
      success: false,
      error: error.message || 'Failed to reset vehicles'
    };
  }
}

// Force reset a specific vehicle
export async function forceResetVehicleStatus(vehicleId: string) {
  try {
    const vehicleRef = db.collection('trucks').doc(vehicleId);
    
    await vehicleRef.update({
      status: 'available',
      assignedDriverId: null,
      updatedAt: new Date()
    });

    revalidatePath('/dashboard/v-ma');
    revalidatePath(`/dashboard/v-ma/${vehicleId}`);

    return {
      success: true,
      message: 'Vehicle status reset to available'
    };
  } catch (error: any) {
    console.error('Error resetting vehicle:', error);
    return {
      success: false,
      error: error.message || 'Failed to reset vehicle'
    };
  }
}