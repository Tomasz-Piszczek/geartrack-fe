import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { BadanieSzkolenieDto } from '../types/index';
import { API_BASE_URL, API_ENDPOINTS } from '../constants';
import axios from 'axios';

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
  const [isConnected, setIsConnected] = useState(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem('geartrack_token'));

  // Monitor token changes in localStorage
  useEffect(() => {
    const checkToken = () => {
      const currentToken = localStorage.getItem('geartrack_token');
      setToken(currentToken);
    };

    // Check immediately
    checkToken();

    // Listen for storage events (token changes from other tabs)
    window.addEventListener('storage', checkToken);

    // Poll for token changes in same tab (since storage events don't fire in same tab)
    const interval = setInterval(checkToken, 1000);

    return () => {
      window.removeEventListener('storage', checkToken);
      clearInterval(interval);
    };
  }, []);

  // Fetch initial data via REST API
  const fetchInitialData = useCallback(async () => {
    if (!token) {
      console.log('[BadaniaSzkolenieData] No token, skipping initial data fetch');
      return;
    }

    try {
      console.log('[BadaniaSzkolenieData] Fetching initial data via REST');
      const response = await axios.get<BadanieSzkolenieDto[]>(
        `${API_BASE_URL}${API_ENDPOINTS.BADANIA_SZKOLENIA.BASE}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setBadaniaSzkolenia(response.data);
      console.log('[BadaniaSzkolenieData] Initial data loaded successfully');
    } catch (error) {
      console.error('[BadaniaSzkolenieData] Error fetching initial data:', error);
    }
  }, [token]);

  const connectSSE = useCallback(() => {
    if (!token) {
      console.log('[BadaniaSzkolenieSSE] No token, skipping SSE connection');
      return null;
    }

    const sseUrl = `${API_BASE_URL}${API_ENDPOINTS.BADANIA_SZKOLENIA.STREAM}?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      console.log('[BadaniaSzkolenieSSE] Connection established');
      setIsConnected(true);
    };

    eventSource.addEventListener('CREATE', (event) => {
      console.log('[BadaniaSzkolenieSSE] Received CREATE event');
      try {
        const newBadanie = JSON.parse(event.data) as BadanieSzkolenieDto;
        setBadaniaSzkolenia(prev => [...prev, newBadanie]);
      } catch (error) {
        console.error('[BadaniaSzkolenieSSE] Error parsing CREATE data:', error);
      }
    });

    eventSource.addEventListener('UPDATE', (event) => {
      console.log('[BadaniaSzkolenieSSE] Received UPDATE event');
      try {
        const updatedBadanie = JSON.parse(event.data) as BadanieSzkolenieDto;
        setBadaniaSzkolenia(prev =>
          prev.map(b => b.id === updatedBadanie.id ? updatedBadanie : b)
        );
      } catch (error) {
        console.error('[BadaniaSzkolenieSSE] Error parsing UPDATE data:', error);
      }
    });

    eventSource.addEventListener('DELETE', (event) => {
      console.log('[BadaniaSzkolenieSSE] Received DELETE event');
      try {
        const deletedBadanie = JSON.parse(event.data) as BadanieSzkolenieDto;
        setBadaniaSzkolenia(prev => prev.filter(b => b.id !== deletedBadanie.id));
      } catch (error) {
        console.error('[BadaniaSzkolenieSSE] Error parsing DELETE data:', error);
      }
    });

    eventSource.onerror = (error) => {
      console.error('[BadaniaSzkolenieSSE] Error:', error);
      setIsConnected(false);
      eventSource.close();

      setTimeout(() => {
        console.log('[BadaniaSzkolenieSSE] Retrying connection...');
        connectSSE();
      }, 5000);
    };

    return eventSource;
  }, [token]);

  // Fetch initial data when token changes
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Connect SSE for real-time updates
  useEffect(() => {
    const eventSource = connectSSE();

    return () => {
      if (eventSource) {
        console.log('[BadaniaSzkolenieSSE] Closing connection');
        eventSource.close();
      }
    };
  }, [connectSSE]);

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

// eslint-disable-next-line react-refresh/only-export-components
export const useBadaniaSzkolenia = () => {
  const context = useContext(BadaniaSzkolenieContext);
  if (context === undefined) {
    throw new Error('useBadaniaSzkolenia must be used within a BadaniaSzkolenieProvider');
  }
  return context;
};
