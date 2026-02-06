import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL, API_ENDPOINTS, STORAGE_KEYS } from '../constants';

type SseEventHandler = (data: any) => void;

interface SseContextType {
  isConnected: boolean;
  subscribe: (eventType: string, handler: SseEventHandler) => () => void;
}

const SseContext = createContext<SseContextType | undefined>(undefined);

export const SseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const handlersRef = useRef<Map<string, Set<SseEventHandler>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connectSSE = useCallback(async () => {
    cleanup();

    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) return;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const url = `${API_BASE_URL}${API_ENDPOINTS.SSE.STREAM}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
      },
      signal: abortController.signal,
    });

    setIsConnected(true);

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        const eventMatch = line.match(/^event:\s*(.+)$/m);
        const dataMatch = line.match(/^data:\s*(.+)$/m);

        if (eventMatch && dataMatch) {
          const eventType = eventMatch[1].trim();
          const parsedData = JSON.parse(dataMatch[1].trim());
          const handlers = handlersRef.current.get(eventType);
          if (handlers) {
            handlers.forEach(handler => handler(parsedData));
          }
        }
      }
    }

    setIsConnected(false);
    reconnectTimeoutRef.current = setTimeout(connectSSE, 5000);
  }, [cleanup]);

  useEffect(() => {
    connectSSE();

    return () => {
      cleanup();
    };
  }, [connectSSE, cleanup]);

  const subscribe = useCallback((eventType: string, handler: SseEventHandler) => {
    if (!handlersRef.current.has(eventType)) {
      handlersRef.current.set(eventType, new Set());
    }
    handlersRef.current.get(eventType)!.add(handler);

    return () => {
      const handlers = handlersRef.current.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          handlersRef.current.delete(eventType);
        }
      }
    };
  }, []);

  return (
    <SseContext.Provider value={{ isConnected, subscribe }}>
      {children}
    </SseContext.Provider>
  );
};

export const useSse = () => {
  return useContext(SseContext)!;
};
