// app/actions/maintenance.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/init';
import { MaintenanceSchema } from '@/schema/maintenanceSchema';
import { normalizeFirestoreData } from '@/lib/utils';

// Get all maintenance records
export async function getMaintenanceRecords(filters?: {
  vehicleId?: string;
  status?: string;
}) {
  try {
    let query: FirebaseFirestore.Query = db.collection('maintenance');
    
    if (filters?.vehicleId) {
      query = query.where('vehicleId', '==', filters.vehicleId);
    }
    
    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }
    
    query = query.orderBy('scheduledDate', 'desc');
    
    const snapshot = await query.get();
    
    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...normalizeFirestoreData(doc.data()),
    }));
    
    return {
      success: true,
      data: records,
    };
  } catch (error: any) {
    console.error('Error fetching maintenance records:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch maintenance records',
      data: [],
    };
  }
}

// Create new maintenance record
export async function createMaintenanceRecord(formData: FormData) {
  try {
    const maintenanceData = {
      vehicleId: formData.get('vehicleId') as string,
      type: formData.get('type') as any,
      title: formData.get('title') as string,
      description: formData.get('description') as string || undefined,
      scheduledDate: new Date(formData.get('scheduledDate') as string),
      odometerReading: parseFloat(formData.get('odometerReading') as string),
      cost: formData.get('cost') ? parseFloat(formData.get('cost') as string) : undefined,
      notes: formData.get('notes') as string || undefined,
      status: 'scheduled',
    };

    // Validate with schema
    const validatedData = MaintenanceSchema.parse(maintenanceData);
    
    // Add timestamps
    const recordData = {
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to Firestore
    const docRef = await db.collection('maintenance').add(recordData);
    
    revalidatePath('/dashboard/maintenance');
    
    return {
      success: true,
      data: { id: docRef.id, ...recordData },
      message: 'Maintenance record created successfully',
    };
  } catch (error: any) {
    console.error('Error creating maintenance record:', error);
    
    if (error.errors) {
      return {
        success: false,
        error: error.errors.map((err: any) => err.message).join(', '),
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to create maintenance record',
    };
  }
}

// Update maintenance status
export async function updateMaintenanceStatus(id: string, status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled') {
  try {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };
    
    if (status === 'completed') {
      updateData.completedDate = new Date();
    }
    
    await db.collection('maintenance').doc(id).update(updateData);
    
    revalidatePath('/dashboard/maintenance');
    
    return {
      success: true,
      message: `Maintenance marked as ${status}`,
    };
  } catch (error: any) {
    console.error('Error updating maintenance status:', error);
    return {
      success: false,
      error: error.message || 'Failed to update status',
    };
  }
}

// Delete maintenance record
export async function deleteMaintenanceRecord(id: string) {
  try {
    await db.collection('maintenance').doc(id).delete();
    
    revalidatePath('/dashboard/maintenance');
    
    return {
      success: true,
      message: 'Maintenance record deleted',
    };
  } catch (error: any) {
    console.error('Error deleting maintenance record:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete record',
    };
  }
}

// Get maintenance statistics
export async function getMaintenanceStats() {
  try {
    const snapshot = await db.collection('maintenance').get();
    
    const records = snapshot.docs.map(doc => doc.data());
    const now = new Date();
    
    const stats = {
      total: records.length,
      scheduled: records.filter(r => r.status === 'scheduled').length,
      inProgress: records.filter(r => r.status === 'in_progress').length,
      completed: records.filter(r => r.status === 'completed').length,
      cancelled: records.filter(r => r.status === 'cancelled').length,
      overdue: records.filter(r => 
        r.status === 'scheduled' && 
        new Date(r.scheduledDate) < now
      ).length,
      totalCost: records
        .filter(r => r.cost)
        .reduce((sum, r) => sum + (r.cost || 0), 0),
    };
    
    return {
      success: true,
      data: stats,
    };
  } catch (error: any) {
    console.error('Error getting maintenance stats:', error);
    return {
      success: false,
      error: error.message || 'Failed to get statistics',
    };
  }
}