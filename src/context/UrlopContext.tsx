import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UrlopDto } from '../types/index';
import { API_BASE_URL, API_ENDPOINTS } from '../constants';

interface UrlopContextType {
  urlopy: UrlopDto[];
  pendingCount: number;
  getUrlopByEmployeeId: (employeeId: string) => UrlopDto[];
  isConnected: boolean;
}

const UrlopContext = createContext<UrlopContextType | undefined>(undefined);

export const UrlopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [urlopy, setUrlopy] = useState<UrlopDto[]>([]);
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

  const connectSSE = useCallback(() => {
    if (!token) {
      console.log('[UrlopSSE] No token, skipping SSE connection');
      return null;
    }

    // Pass token as query parameter since EventSource doesn't support custom headers
    const sseUrl = `${API_BASE_URL}${API_ENDPOINTS.URLOPY.STREAM}?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      console.log('[UrlopSSE] Connection established');
      setIsConnected(true);
    };

    eventSource.addEventListener('INITIAL', (event) => {
      console.log('[UrlopSSE] Received initial data');
      try {
        const data = JSON.parse(event.data) as UrlopDto[];
        setUrlopy(data);
      } catch (error) {
        console.error('[UrlopSSE] Error parsing initial data:', error);
      }
    });

    eventSource.addEventListener('CREATE', (event) => {
      console.log('[UrlopSSE] Received CREATE event');
      try {
        const newUrlop = JSON.parse(event.data) as UrlopDto;
        setUrlopy(prev => [...prev, newUrlop]);
      } catch (error) {
        console.error('[UrlopSSE] Error parsing CREATE data:', error);
      }
    });

    eventSource.addEventListener('UPDATE', (event) => {
      console.log('[UrlopSSE] Received UPDATE event');
      try {
        const updatedUrlop = JSON.parse(event.data) as UrlopDto;
        setUrlopy(prev =>
          prev.map(u => u.id === updatedUrlop.id ? updatedUrlop : u)
        );
      } catch (error) {
        console.error('[UrlopSSE] Error parsing UPDATE data:', error);
      }
    });

    eventSource.addEventListener('DELETE', (event) => {
      console.log('[UrlopSSE] Received DELETE event');
      try {
        const deletedUrlop = JSON.parse(event.data) as UrlopDto;
        setUrlopy(prev => prev.filter(u => u.id !== deletedUrlop.id));
      } catch (error) {
        console.error('[UrlopSSE] Error parsing DELETE data:', error);
      }
    });

    eventSource.onerror = (error) => {
      console.error('[UrlopSSE] Error:', error);
      setIsConnected(false);
      eventSource.close();

      // Retry connection after 5 seconds
      setTimeout(() => {
        console.log('[UrlopSSE] Retrying connection...');
        connectSSE();
      }, 5000);
    };

    return eventSource;
  }, [token]);

  useEffect(() => {
    const eventSource = connectSSE();

    return () => {
      if (eventSource) {
        console.log('[UrlopSSE] Closing connection');
        eventSource.close();
      }
    };
  }, [connectSSE]);

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

// eslint-disable-next-line react-refresh/only-export-components
export const useUrlopy = () => {
  const context = useContext(UrlopContext);
  if (context === undefined) {
    throw new Error('useUrlopy must be used within a UrlopProvider');
  }
  return context;
};
