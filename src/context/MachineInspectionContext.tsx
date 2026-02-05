import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { MachineInspectionDto } from '../types/index';
import { API_BASE_URL, API_ENDPOINTS } from '../constants';
import axios from 'axios';

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
  const [isConnected, setIsConnected] = useState(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem('geartrack_token'));

  // Monitor token changes in localStorage
  useEffect(() => {
    const checkToken = () => {
      const currentToken = localStorage.getItem('geartrack_token');
      setToken(currentToken);
    };

    checkToken();

    window.addEventListener('storage', checkToken);
    const interval = setInterval(checkToken, 1000);

    return () => {
      window.removeEventListener('storage', checkToken);
      clearInterval(interval);
    };
  }, []);

  // Fetch initial data via REST API
  const fetchInitialData = useCallback(async () => {
    if (!token) {
      console.log('[MachineInspectionData] No token, skipping initial data fetch');
      return;
    }

    try {
      console.log('[MachineInspectionData] Fetching initial data via REST');
      const response = await axios.get<MachineInspectionDto[]>(
        `${API_BASE_URL}${API_ENDPOINTS.MACHINES.SCHEDULED_INSPECTIONS}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setInspections(response.data);
      console.log('[MachineInspectionData] Initial data loaded successfully');
    } catch (error) {
      console.error('[MachineInspectionData] Error fetching initial data:', error);
    }
  }, [token]);

  const connectSSE = useCallback(() => {
    if (!token) {
      console.log('[MachineInspectionSSE] No token, skipping SSE connection');
      return null;
    }

    const sseUrl = `${API_BASE_URL}${API_ENDPOINTS.MACHINES.STREAM}?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      console.log('[MachineInspectionSSE] Connection established');
      setIsConnected(true);
    };

    eventSource.addEventListener('CREATE', (event) => {
      console.log('[MachineInspectionSSE] Received CREATE event');
      try {
        const newInspection = JSON.parse(event.data) as MachineInspectionDto;
        if (newInspection.status === 'SCHEDULED') {
          setInspections(prev => [...prev, newInspection]);
        }
      } catch (error) {
        console.error('[MachineInspectionSSE] Error parsing CREATE data:', error);
      }
    });

    eventSource.addEventListener('UPDATE', (event) => {
      console.log('[MachineInspectionSSE] Received UPDATE event');
      try {
        const updatedInspection = JSON.parse(event.data) as MachineInspectionDto;
        if (updatedInspection.status === 'SCHEDULED') {
          setInspections(prev =>
            prev.map(i => i.uuid === updatedInspection.uuid ? updatedInspection : i)
          );
        } else {
          // If status changed to COMPLETED, remove from list
          setInspections(prev => prev.filter(i => i.uuid !== updatedInspection.uuid));
        }
      } catch (error) {
        console.error('[MachineInspectionSSE] Error parsing UPDATE data:', error);
      }
    });

    eventSource.addEventListener('DELETE', (event) => {
      console.log('[MachineInspectionSSE] Received DELETE event');
      try {
        const deletedInspection = JSON.parse(event.data) as MachineInspectionDto;
        setInspections(prev => prev.filter(i => i.uuid !== deletedInspection.uuid));
      } catch (error) {
        console.error('[MachineInspectionSSE] Error parsing DELETE data:', error);
      }
    });

    eventSource.onerror = (error) => {
      console.error('[MachineInspectionSSE] Error:', error);
      setIsConnected(false);
      eventSource.close();

      setTimeout(() => {
        console.log('[MachineInspectionSSE] Retrying connection...');
        connectSSE();
      }, 5000);
    };

    return eventSource;
  }, [token]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    const eventSource = connectSSE();

    return () => {
      if (eventSource) {
        console.log('[MachineInspectionSSE] Closing connection');
        eventSource.close();
      }
    };
  }, [connectSSE]);

  const getInspectionsByMachineId = useCallback((machineId: string): MachineInspectionDto[] => {
    return inspections.filter(i => i.machineId === machineId);
  }, [inspections]);

  const getMachineStatus = useCallback((machineId: string): 'overdue' | 'due-soon' | 'ok' => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

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

      if (inspectionDate >= today && inspectionDate <= sevenDaysFromNow) {
        return 'due-soon';
      }
    }

    return 'ok';
  }, [inspections]);

  const { overdueCount, dueSoonCount } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const overdue = inspections.filter(i => {
      const inspectionDate = new Date(i.inspectionDate);
      inspectionDate.setHours(0, 0, 0, 0);
      return inspectionDate < today;
    }).length;

    const dueSoon = inspections.filter(i => {
      const inspectionDate = new Date(i.inspectionDate);
      inspectionDate.setHours(0, 0, 0, 0);
      return inspectionDate >= today && inspectionDate <= sevenDaysFromNow;
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

// eslint-disable-next-line react-refresh/only-export-components
export const useMachineInspections = () => {
  const context = useContext(MachineInspectionContext);
  if (context === undefined) {
    throw new Error('useMachineInspections must be used within a MachineInspectionProvider');
  }
  return context;
};
