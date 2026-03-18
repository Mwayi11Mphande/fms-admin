// hooks/useDriverActions.ts (simpler fix)
'use client';

import { useState, useCallback } from 'react';
import {
  createDriver,
  getDrivers,
  getDriver,
  updateDriver,
  deleteDriver,
  updateDriverStatus,
  getDriverStats,
  assignVehicleToDriver,
} from '@/actions/drivers';

export function useDriverActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateDriver = useCallback(async (formData: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createDriver(formData);
      if (!result.success) {
        setError((result as any).error || null);
      }
      return result;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to create driver";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGetDrivers = useCallback(async (filters?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDrivers(filters);
      if (!result.success) {
        setError((result as any).error || null);
      }
      return result;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to fetch drivers";
      setError(errorMsg);
      return { success: false, error: errorMsg, data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGetDriver = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDriver(id);
      if (!result.success) {
        setError((result as any).error || null);
      }
      return result;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to fetch driver";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateDriver = useCallback(async (id: string, formData: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await updateDriver(id, formData);
      if (!result.success) {
        setError((result as any).error || null);
      }
      return result;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to update driver";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteDriver = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await deleteDriver(id);
      if (!result.success) {
        setError((result as any).error || null);
      }
      return result;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to delete driver";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateDriverStatus = useCallback(async (id: string, status: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await updateDriverStatus(id, status as any);
      if (!result.success) {
        setError((result as any).error || null);
      }
      return result;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to update driver status";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGetDriverStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDriverStats();
      if (!result.success) {
        setError((result as any).error || null);
      }
      return result;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to fetch driver statistics";
      setError(errorMsg);
      return { success: false, error: errorMsg, data: { total: 0, active: 0, inactive: 0, on_leave: 0, terminated: 0 } };
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAssignVehicle = useCallback(async (driverId: string, vehicleId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await assignVehicleToDriver(driverId, vehicleId);
      if (!result.success) {
        setError((result as any).error || null);
      }
      return result;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to assign vehicle";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createDriver: handleCreateDriver,
    getDrivers: handleGetDrivers,
    getDriver: handleGetDriver,
    updateDriver: handleUpdateDriver,
    deleteDriver: handleDeleteDriver,
    updateDriverStatus: handleUpdateDriverStatus,
    getDriverStats: handleGetDriverStats,
    assignVehicle: handleAssignVehicle,
  };
}