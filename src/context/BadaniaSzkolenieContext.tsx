import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { BadanieSzkolenieDto } from '../types/index';
import { API_BASE_URL, API_ENDPOINTS } from '../constants';
import axios from 'axios';
import { useSse } from './SseContext';

interface BadaniaSzkolenieContextType {
  badaniaSzkolenia: BadanieSzkolenieDto[];
  expiredCount: number;
  expiringSoonCount: number;
  getBadaniaSzkoleniaByEmployeeId: (employeeId: string) => BadanieSzkolenieDto[];
  getUpcomingByEmployeeId: (employeeId: string) => BadanieSzkolenieDto | null;
  isConnected: boolean;
}

const BadaniaSzkolenieContext = createContext<BadaniaSzkolenieContextType | undefined>(undefined);

export const BadaniaSzkolenieProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [badaniaSzkolenia, setBadaniaSzkolenia] = useState<BadanieSzkolenieDto[]>([]);
  const { isConnected, subscribe } = useSse();

  const fetchInitialData = useCallback(async () => {
    const token = localStorage.getItem('geartrack_token');
    if (!token) return;

    const response = await axios.get<BadanieSzkolenieDto[]>(
      `${API_BASE_URL}${API_ENDPOINTS.BADANIA_SZKOLENIA.BASE}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setBadaniaSzkolenia(response.data);
  }, []);

  useEffect(() => {
    fetchInitialData();

    const unsubscribeCreate = subscribe('BADANIE_SZKOLENIE.CREATE', (newBadanie: BadanieSzkolenieDto) => {
      setBadaniaSzkolenia(prev => [...prev, newBadanie]);
    });

    const unsubscribeUpdate = subscribe('BADANIE_SZKOLENIE.UPDATE', (updatedBadanie: BadanieSzkolenieDto) => {
      setBadaniaSzkolenia(prev =>
        prev.map(b => b.id === updatedBadanie.id ? updatedBadanie : b)
      );
    });

    const unsubscribeDelete = subscribe('BADANIE_SZKOLENIE.DELETE', (deletedBadanie: BadanieSzkolenieDto) => {
      setBadaniaSzkolenia(prev => prev.filter(b => b.id !== deletedBadanie.id));
    });

    return () => {
      unsubscribeCreate();
      unsubscribeUpdate();
      unsubscribeDelete();
    };
  }, [fetchInitialData, subscribe]);

  const getBadaniaSzkoleniaByEmployeeId = useCallback((employeeId: string): BadanieSzkolenieDto[] => {
    return badaniaSzkolenia.filter(b => b.employeeId === employeeId);
  }, [badaniaSzkolenia]);

  const getUpcomingByEmployeeId = useCallback((employeeId: string): BadanieSzkolenieDto | null => {
    const today = new Date();
    const fourteenDaysFromNow = new Date();
    fourteenDaysFromNow.setDate(today.getDate() + 14);

    const upcoming = badaniaSzkolenia
      .filter(b =>
        b.employeeId === employeeId &&
        b.status === 'OCZEKUJACY' &&
        new Date(b.date) >= today &&
        new Date(b.date) <= fourteenDaysFromNow
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return upcoming.length > 0 ? upcoming[0] : null;
  }, [badaniaSzkolenia]);

  const { expiredCount, expiringSoonCount } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const expired = badaniaSzkolenia.filter(b => {
      const badanieDate = new Date(b.date);
      badanieDate.setHours(0, 0, 0, 0);
      return b.status === 'OCZEKUJACY' && badanieDate < today;
    }).length;

    const expiringSoon = badaniaSzkolenia.filter(b => {
      const badanieDate = new Date(b.date);
      badanieDate.setHours(0, 0, 0, 0);
      return b.status === 'OCZEKUJACY' && badanieDate >= today && badanieDate <= sevenDaysFromNow;
    }).length;

    return { expiredCount: expired, expiringSoonCount: expiringSoon };
  }, [badaniaSzkolenia]);

  return (
    <BadaniaSzkolenieContext.Provider
      value={{
        badaniaSzkolenia,
        expiredCount,
        expiringSoonCount,
        getBadaniaSzkoleniaByEmployeeId,
        getUpcomingByEmployeeId,
        isConnected
      }}
    >
      {children}
    </BadaniaSzkolenieContext.Provider>
  );
};

export const useBadaniaSzkolenia = () => {
  return useContext(BadaniaSzkolenieContext)!;
};
