// hooks/useVehicleActions.ts
import { useState } from 'react';
import { 
  createVehicle, 
  getVehicles, 
  getVehicle, 
  updateVehicle, 
  deleteVehicle,
  updateVehicleStatus,
  assignDriverToVehicle,
  unassignDriverFromVehicle,
  getVehicleStats,
  updateVehicleMileage
} from '@/actions/vehicle';

export const useVehicleActions = () => {
  const [loading, setLoading] = useState(false);

  return {
    loading,
    
    createVehicle: async (formData: FormData) => {
      setLoading(true);
      try {
        const result = await createVehicle(formData);
        return result;
      } finally {
        setLoading(false);
      }
    },

    getVehicles: async (filters?: {
      status?: string;
      type?: string;
      search?: string;
      page?: number;
      limit?: number;
    }) => {
      setLoading(true);
      try {
        const result = await getVehicles(filters);
        return result;
      } finally {
        setLoading(false);
      }
    },

    getVehicle: async (id: string) => {
      setLoading(true);
      try {
        const result = await getVehicle(id);
        return result;
      } finally {
        setLoading(false);
      }
    },

    updateVehicle: async (id: string, formData: FormData) => {
      setLoading(true);
      try {
        const result = await updateVehicle(id, formData);
        return result;
      } finally {
        setLoading(false);
      }
    },

    deleteVehicle: async (id: string) => {
      setLoading(true);
      try {
        const result = await deleteVehicle(id);
        return result;
      } finally {
        setLoading(false);
      }
    },

    updateVehicleStatus: async (id: string, status: 'available' | 'in_use' | 'maintenance' | 'out_of_service') => {
      setLoading(true);
      try {
        const result = await updateVehicleStatus(id, status);
        return result;
      } finally {
        setLoading(false);
      }
    },

    assignDriverToVehicle: async (vehicleId: string, driverId: string) => {
      setLoading(true);
      try {
        const result = await assignDriverToVehicle(vehicleId, driverId);
        return result;
      } finally {
        setLoading(false);
      }
    },

    unassignDriverFromVehicle: async (vehicleId: string) => {
      setLoading(true);
      try {
        const result = await unassignDriverFromVehicle(vehicleId);
        return result;
      } finally {
        setLoading(false);
      }
    },

    getVehicleStats: async () => {
      setLoading(true);
      try {
        const result = await getVehicleStats();
        return result;
      } finally {
        setLoading(false);
      }
    },

    updateVehicleMileage: async (id: string, mileage: number) => {
      setLoading(true);
      try {
        const result = await updateVehicleMileage(id, mileage);
        return result;
      } finally {
        setLoading(false);
      }
    },
  };
};