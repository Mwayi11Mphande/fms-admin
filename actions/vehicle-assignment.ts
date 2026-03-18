// app/actions/vehicle-assignment.ts
'use server';

import { db } from '@/lib/firebase/init';
import { revalidatePath } from 'next/cache';
import { firestoreDataBase } from '@/lib/firebase/firebaseDb';

// Assign vehicle to driver (bidirectional)
export async function assignVehicleToDriver(driverId: string, vehicleId: string) {
  try {
    // Start a batch operation
    const batch = db.batch();
    
    // Update driver document
    const driverRef = db.collection('drivers').doc(driverId);
    batch.update(driverRef, {
      assignedVehicleId: vehicleId,
      updatedAt: new Date()
    });
    
    // Update vehicle document
    const vehicleRef = db.collection('trucks').doc(vehicleId);
    batch.update(vehicleRef, {
      assignedDriverId: driverId,
      updatedAt: new Date()
    });
    
    await batch.commit();
    
    revalidatePath('/dashboard/driver_m');
    revalidatePath('/dashboard/v-tracking/drivers');
    revalidatePath('/dashboard/tracking');
    
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

// Unassign vehicle from driver
export async function unassignVehicleFromDriver(driverId: string, vehicleId: string) {
  try {
    const batch = db.batch();
    
    // Update driver document
    const driverRef = db.collection('drivers').doc(driverId);
    batch.update(driverRef, {
      assignedVehicleId: null,
      updatedAt: new Date()
    });
    
    // Update vehicle document
    const vehicleRef = db.collection('trucks').doc(vehicleId);
    batch.update(vehicleRef, {
      assignedDriverId: null,
      updatedAt: new Date()
    });
    
    await batch.commit();
    
    revalidatePath('/dashboard/driver_m');
    revalidatePath('/dashboard/v-tracking/drivers');
    
    return {
      success: true,
      message: 'Vehicle unassigned successfully'
    };
  } catch (error: any) {
    console.error('Error unassigning vehicle:', error);
    return {
      success: false,
      error: error.message || 'Failed to unassign vehicle'
    };
  }
}

// Get all unassigned vehicles
export async function getUnassignedVehicles() {
  try {
    const vehiclesSnapshot = await db
      .collection('trucks')
      .where('assignedDriverId', '==', null)
      .get();
    
    const vehicles = vehiclesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    return {
      success: true,
      data: vehicles
    };
  } catch (error: any) {
    console.error('Error fetching unassigned vehicles:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch unassigned vehicles',
      data: []
    };
  }
}

// Bulk sync driver-vehicle assignments
export async function syncDriverVehicleAssignments() {
  try {
    // Get all drivers with assigned vehicles
    const driversSnapshot = await db
      .collection('drivers')
      .where('assignedVehicleId', '!=', null)
      .get();
    
    const batch = db.batch();
    let updateCount = 0;
    
    driversSnapshot.docs.forEach((driverDoc) => {
      const driverData = driverDoc.data();
      const vehicleId = driverData.assignedVehicleId;
      
      if (vehicleId) {
        const vehicleRef = db.collection('trucks').doc(vehicleId);
        batch.update(vehicleRef, {
          assignedDriverId: driverDoc.id,
          updatedAt: new Date()
        });
        updateCount++;
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
    }
    
    return {
      success: true,
      message: `Synced ${updateCount} driver-vehicle assignments`,
      count: updateCount
    };
  } catch (error: any) {
    console.error('Error syncing assignments:', error);
    return {
      success: false,
      error: error.message || 'Failed to sync assignments'
    };
  }
}