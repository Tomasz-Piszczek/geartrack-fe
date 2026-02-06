import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UrlopDto } from '../types/index';
import { API_BASE_URL, API_ENDPOINTS } from '../constants';
import axios from 'axios';
import { useSse } from './SseContext';

interface UrlopContextType {
  urlopy: UrlopDto[];
  pendingCount: number;
  getUrlopByEmployeeId: (employeeId: string) => UrlopDto[];
  isConnected: boolean;
}

const UrlopContext = createContext<UrlopContextType | undefined>(undefined);

export const UrlopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [urlopy, setUrlopy] = useState<UrlopDto[]>([]);
  const { isConnected, subscribe } = useSse();

  const fetchInitialData = useCallback(async () => {
    const token = localStorage.getItem('geartrack_token');
    if (!token) return;

    const response = await axios.get<UrlopDto[]>(`${API_BASE_URL}${API_ENDPOINTS.URLOPY.BASE}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setUrlopy(response.data);
  }, []);

  useEffect(() => {
    fetchInitialData();

    const unsubscribeCreate = subscribe('URLOP.CREATE', (newUrlop: UrlopDto) => {
      setUrlopy(prev => [...prev, newUrlop]);
    });

    const unsubscribeUpdate = subscribe('URLOP.UPDATE', (updatedUrlop: UrlopDto) => {
      setUrlopy(prev =>
        prev.map(u => u.id === updatedUrlop.id ? updatedUrlop : u)
      );
    });

    const unsubscribeDelete = subscribe('URLOP.DELETE', (deletedUrlop: UrlopDto) => {
      setUrlopy(prev => prev.filter(u => u.id !== deletedUrlop.id));
    });

    return () => {
      unsubscribeCreate();
      unsubscribeUpdate();
      unsubscribeDelete();
    };
  }, [fetchInitialData, subscribe]);

  const getUrlopByEmployeeId = useCallback((employeeId: string): UrlopDto[] => {
    return urlopy.filter(u => u.employeeId === employeeId);
  }, [urlopy]);

  const pendingCount = urlopy.filter(u => u.status === 'PENDING').length;

  return (
    <UrlopContext.Provider
      value={{
        urlopy,
        pendingCount,
        getUrlopByEmployeeId,
        isConnected
      }}
    >
      {children}
    </UrlopContext.Provider>
  );
};

export const useUrlopy = () => {
  return useContext(UrlopContext)!;
};
