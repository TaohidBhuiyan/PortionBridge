import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const SocketContext = createContext(null);

/**
 * SocketProvider - Manages public socket connection for landing page
 * Uses /public namespace which does not require authentication
 */
export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect to public namespace (no authentication required)
    const socketInstance = io(`${SOCKET_URL}/public`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('[Public Socket] Connected');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Public Socket] Disconnected');
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[Public Socket] Connection error:', error.message);
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const value = {
    socket,
    connected,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

/**
 * useSocket - Hook to access socket context
 * @returns {Object} Socket context value
 */
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
