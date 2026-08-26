import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { chatApi } from '../services/chatApi';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Socket connection lifecycle/event tracing is useful while developing
// real-time features, but end users can see the browser console — so
// this is gated to dev builds only rather than always logging in
// production.
const devLog = () => {};

/**
 * Decodes the `id` claim out of a JWT access token without a signature
 * check (the token is already trusted here — it's the same one used to
 * authenticate this exact socket connection). Used only to tell "I just
 * read messages" apart from "the other participant just read messages"
 * on the shared 'messages_read' room broadcast, so the messages badge
 * only refreshes for the reader's own read events.
 */
function decodeUserIdFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload?.id ?? null;
  } catch {
    return null;
  }
}

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
      devLog('[Public Socket] Connected');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      devLog('[Public Socket] Disconnected');
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
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const socketRef = useRef(null);
  const currentUserIdRef = useRef(null);

  const refreshUnreadMessageCount = () => {
    chatApi.getUnreadCountForUser()
      .then((res) => {
        if (res?.success) {
          setUnreadMessageCount(res.data.unreadCount || 0);
        }
      })
      .catch(() => {
        // Non-critical — the badge just stays at its last known value;
        // the next real-time event or page load will resync it.
      });
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      devLog('[Auth Socket] No token found, skipping connection');
      return;
    }

    // Prevent duplicate connections
    if (socketRef.current) {
      devLog('[Auth Socket] Already connected, skipping');
      return;
    }

    currentUserIdRef.current = decodeUserIdFromToken(token);

    // Connect to authenticated namespace
    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      devLog('[Auth Socket] Connected');
      setConnected(true);
      socketRef.current = socketInstance;

      // Request initial unread count
      socketInstance.emit('get_unread_count', {}, (response) => {
        if (response.success) {
          setUnreadCount(response.data.unreadCount || 0);
        }
      });

      // Seed the initial unread MESSAGE count from the existing
      // GET /chat/unread-count endpoint — there's no equivalent socket
      // event for this (unlike notifications' 'get_unread_count'), so
      // this reuses the existing REST endpoint rather than adding a new
      // socket protocol message.
      refreshUnreadMessageCount();
    });

    socketInstance.on('disconnect', () => {
      devLog('[Auth Socket] Disconnected');
      setConnected(false);
      socketRef.current = null;
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[Auth Socket] Connection error:', error.message);
      setConnected(false);
    });

    socketInstance.on('token_expired', () => {
      devLog('[Auth Socket] Token expired, disconnecting');
      socketInstance.disconnect();
      socketRef.current = null;
    });

    // Listen for real-time notifications
    socketInstance.on('notification', (notification) => {
      devLog('[Auth Socket] New notification:', notification);
      setUnreadCount(prev => prev + 1);

      // Chat messages are delivered as a 'new_message'-typed notification
      // (see chat.service.js#sendMessage) alongside the regular
      // notification bell count — bump the dedicated messages badge too
      // without adding a second socket event for the same thing.
      if (notification.type === 'new_message') {
        setUnreadMessageCount(prev => prev + 1);
      }
    });

    // Listen for unread count updates
    socketInstance.on('notification_count_updated', ({ unreadCount }) => {
      devLog('[Auth Socket] Unread count updated:', unreadCount);
      setUnreadCount(unreadCount || 0);
    });

    // Listen for notification read events
    socketInstance.on('notification_read', ({ notificationId }) => {
      devLog('[Auth Socket] Notification read:', notificationId);
      setUnreadCount(prev => Math.max(0, prev - 1));
    });

    // Listen for all notifications read
    socketInstance.on('notifications_read', ({ updatedCount }) => {
      devLog('[Auth Socket] All notifications read:', updatedCount);
      setUnreadCount(0);
    });

    // Chat's own 'messages_read' event (already used by ChatWindow to
    // update message ticks locally) is broadcast to the whole room, so it
    // fires for BOTH participants — only resync the messages badge when
    // *this* user is the one who just read them (readBy === my own id),
    // not when the other participant reads what they sent.
    socketInstance.on('messages_read', ({ readBy }) => {
      if (readBy === currentUserIdRef.current) {
        devLog('[Auth Socket] Own messages read, refreshing message badge');
        refreshUnreadMessageCount();
      }
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
    unreadMessageCount,
    refreshUnreadMessageCount,
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
