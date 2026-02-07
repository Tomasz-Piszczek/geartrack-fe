import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { MachineInspectionDto } from '../types/index';
import { API_BASE_URL, API_ENDPOINTS } from '../constants';
import axios from 'axios';
import { useSse } from './SseContext';

interface MachineInspectionContextType {
  inspections: MachineInspectionDto[];
  overdueCount: number;
  dueSoonCount: number;
  getInspectionsByMachineId: (machineId: string) => MachineInspectionDto[];
  getMachineStatus: (machineId: string) => 'overdue' | 'due-soon' | 'ok';
  isConnected: boolean;
}

const MachineInspectionContext = createContext<MachineInspectionContextType | undefined>(undefined);

export const MachineInspectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inspections, setInspections] = useState<MachineInspectionDto[]>([]);
  const { isConnected, subscribe } = useSse();

  const fetchInitialData = useCallback(async () => {
    const token = localStorage.getItem('geartrack_token');
    if (!token) return;

    const response = await axios.get<MachineInspectionDto[]>(
      `${API_BASE_URL}${API_ENDPOINTS.MACHINES.SCHEDULED_INSPECTIONS}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setInspections(response.data);
  }, []);

  useEffect(() => {
    fetchInitialData();

    const unsubscribeCreate = subscribe('MACHINE_INSPECTION.CREATE', (newInspection: MachineInspectionDto) => {
      if (newInspection.status === 'SCHEDULED') {
        setInspections(prev => [...prev, newInspection]);
      }
    });

    const unsubscribeUpdate = subscribe('MACHINE_INSPECTION.UPDATE', (updatedInspection: MachineInspectionDto) => {
      if (updatedInspection.status === 'SCHEDULED') {
        setInspections(prev =>
          prev.map(i => i.uuid === updatedInspection.uuid ? updatedInspection : i)
        );
      } else {
        setInspections(prev => prev.filter(i => i.uuid !== updatedInspection.uuid));
      }
    });

    const unsubscribeDelete = subscribe('MACHINE_INSPECTION.DELETE', (deletedInspection: MachineInspectionDto) => {
      setInspections(prev => prev.filter(i => i.uuid !== deletedInspection.uuid));
    });

    return () => {
      unsubscribeCreate();
      unsubscribeUpdate();
      unsubscribeDelete();
    };
  }, [fetchInitialData, subscribe]);

  const getInspectionsByMachineId = useCallback((machineId: string): MachineInspectionDto[] => {
    return inspections.filter(i => i.machineId === machineId);
  }, [inspections]);

  const getMachineStatus = useCallback((machineId: string): 'overdue' | 'due-soon' | 'ok' => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twentyDaysFromNow = new Date(today);
    twentyDaysFromNow.setDate(today.getDate() + 20);

    const machineInspections = inspections.filter(i => i.machineId === machineId);

    for (const inspection of machineInspections) {
      const inspectionDate = new Date(inspection.inspectionDate);
      inspectionDate.setHours(0, 0, 0, 0);

      if (inspectionDate < today) {
        return 'overdue';
      }
    }

    for (const inspection of machineInspections) {
      const inspectionDate = new Date(inspection.inspectionDate);
      inspectionDate.setHours(0, 0, 0, 0);

      if (inspectionDate >= today && inspectionDate <= twentyDaysFromNow) {
        return 'due-soon';
      }
    }

    return 'ok';
  }, [inspections]);

  const { overdueCount, dueSoonCount } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twentyDaysFromNow = new Date(today);
    twentyDaysFromNow.setDate(today.getDate() + 20);

    const overdue = inspections.filter(i => {
      const inspectionDate = new Date(i.inspectionDate);
      inspectionDate.setHours(0, 0, 0, 0);
      return inspectionDate < today;
    }).length;

    const dueSoon = inspections.filter(i => {
      const inspectionDate = new Date(i.inspectionDate);
      inspectionDate.setHours(0, 0, 0, 0);
      return inspectionDate >= today && inspectionDate <= twentyDaysFromNow;
    }).length;

    return { overdueCount: overdue, dueSoonCount: dueSoon };
  }, [inspections]);

  return (
    <MachineInspectionContext.Provider
      value={{
        inspections,
        overdueCount,
        dueSoonCount,
        getInspectionsByMachineId,
        getMachineStatus,
        isConnected
      }}
    >
      {children}
    </MachineInspectionContext.Provider>
  );
};

export const useMachineInspections = () => {
  return useContext(MachineInspectionContext)!;
};
