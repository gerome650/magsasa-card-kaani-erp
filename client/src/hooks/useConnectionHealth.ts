import { useEffect, useState } from 'react';

export type ConnectionStatus = 'online' | 'offline' | 'reconnecting';

export interface ConnectionHealth {
  status: ConnectionStatus;
  isOnline: boolean;
  isSSEConnected: boolean;
  lastConnected: Date | null;
  lastDisconnected: Date | null;
}

/**
 * Hook to monitor connection health including:
 * - Browser online/offline status
 * - SSE connection state
 * - Connection timestamps
 */
export function useConnectionHealth() {
  const [health, setHealth] = useState<ConnectionHealth>({
    status: 'online',
    isOnline: navigator.onLine,
    isSSEConnected: false,
    lastConnected: navigator.onLine ? new Date() : null,
    lastDisconnected: null,
  });

  useEffect(() => {
    // Handle browser online event
    const handleOnline = () => {
      setHealth((prev) => ({
        ...prev,
        status: 'online',
        isOnline: true,
        lastConnected: new Date(),
      }));
    };

    // Handle browser offline event
    const handleOffline = () => {
      setHealth((prev) => ({
        ...prev,
        status: 'offline',
        isOnline: false,
        isSSEConnected: false,
        lastDisconnected: new Date(),
      }));
    };

    // Listen to browser online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Function to update SSE connection state (called from KaAniChat)
  const setSSEConnected = (connected: boolean) => {
    setHealth((prev) => ({
      ...prev,
      isSSEConnected: connected,
      status: !prev.isOnline
        ? 'offline'
        : connected
        ? 'online'
        : 'reconnecting',
      lastConnected: connected ? new Date() : prev.lastConnected,
      lastDisconnected: !connected ? new Date() : prev.lastDisconnected,
    }));
  };

  // Function to set reconnecting state (called during retry)
  const setReconnecting = () => {
    setHealth((prev) => ({
      ...prev,
      status: 'reconnecting',
    }));
  };

  return {
    ...health,
    setSSEConnected,
    setReconnecting,
  };
}
