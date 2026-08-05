import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const SocketContext = createContext(null);
const AuthSocketContext = createContext(null);

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
 * AuthSocketProvider - Manages authenticated socket connection for dashboard
 * Uses default namespace which requires JWT authentication
 */
export function AuthSocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('[Auth Socket] No token found, skipping connection');
      return;
    }

    // Prevent duplicate connections
    if (socketRef.current) {
      console.log('[Auth Socket] Already connected, skipping');
      return;
    }

    // Connect to authenticated namespace
    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('[Auth Socket] Connected');
      setConnected(true);
      socketRef.current = socketInstance;

      // Request initial unread count
      socketInstance.emit('get_unread_count', {}, (response) => {
        if (response.success) {
          setUnreadCount(response.data.unreadCount || 0);
        }
      });
    });

    socketInstance.on('disconnect', () => {
      console.log('[Auth Socket] Disconnected');
      setConnected(false);
      socketRef.current = null;
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[Auth Socket] Connection error:', error.message);
      setConnected(false);
    });

    socketInstance.on('token_expired', () => {
      console.log('[Auth Socket] Token expired, disconnecting');
      socketInstance.disconnect();
      socketRef.current = null;
    });

    // Listen for real-time notifications
    socketInstance.on('notification', (notification) => {
      console.log('[Auth Socket] New notification:', notification);
      setUnreadCount(prev => prev + 1);
    });

    // Listen for unread count updates
    socketInstance.on('notification_count_updated', ({ unreadCount }) => {
      console.log('[Auth Socket] Unread count updated:', unreadCount);
      setUnreadCount(unreadCount || 0);
    });

    // Listen for notification read events
    socketInstance.on('notification_read', ({ notificationId }) => {
      console.log('[Auth Socket] Notification read:', notificationId);
      setUnreadCount(prev => Math.max(0, prev - 1));
    });

    // Listen for all notifications read
    socketInstance.on('notifications_read', ({ updatedCount }) => {
      console.log('[Auth Socket] All notifications read:', updatedCount);
      setUnreadCount(0);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, []);

  const value = {
    socket,
    connected,
    unreadCount,
  };

  return <AuthSocketContext.Provider value={value}>{children}</AuthSocketContext.Provider>;
}

/**
 * useSocket - Hook to access public socket context
 * @returns {Object} Socket context value
 */
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

/**
 * useAuthSocket - Hook to access authenticated socket context
 * @returns {Object} Auth socket context value
 */
export function useAuthSocket() {
  const context = useContext(AuthSocketContext);
  if (!context) {
    throw new Error('useAuthSocket must be used within an AuthSocketProvider');
  }
  return context;
}
