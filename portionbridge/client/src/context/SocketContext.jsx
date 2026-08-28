import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { chatApi } from '../services/chatApi';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Socket connection lifecycle/event tracing is useful while developing
// real-time features, but end users can see the browser console — so
// this is gated to dev builds only rather than always logging in
// production.
const devLog = import.meta.env.DEV ? console.log : () => {};

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

/**
 * Creates and configures a public socket connection
 * @param {Object} options - Configuration options
 * @param {Function} options.onConnect - Callback when socket connects
 * @param {Function} options.onDisconnect - Callback when socket disconnects
 * @param {Function} options.onConnectError - Callback on connection error
 * @param {string} options.socketUrl - Socket server URL
 * @returns {Object} Socket instance with disconnect method
 */
// eslint-disable-next-line react-refresh/only-export-components -- exported for testability; see useSocket/useAuthSocket for same pattern
export function createPublicSocketConnection({ onConnect, onDisconnect, onConnectError, socketUrl }) {
  const socketInstance = io(`${socketUrl}/public`, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socketInstance.on('connect', () => {
    devLog('[Public Socket] Connected');
    onConnect?.();
  });

  socketInstance.on('disconnect', () => {
    devLog('[Public Socket] Disconnected');
    onDisconnect?.();
  });

  socketInstance.on('connect_error', (error) => {
    console.error('[Public Socket] Connection error:', error.message);
    onConnectError?.(error);
  });

  return socketInstance;
}

/**
 * Creates and configures an authenticated socket connection
 * @param {Object} options - Configuration options
 * @param {string} options.token - JWT access token
 * @param {Function} options.onConnect - Callback when socket connects
 * @param {Function} options.onDisconnect - Callback when socket disconnects
 * @param {Function} options.onConnectError - Callback on connection error
 * @param {Function} options.onTokenExpired - Callback when token expires
 * @param {Function} options.onNotification - Callback for new notifications
 * @param {Function} options.onNotificationCountUpdated - Callback for unread count updates
 * @param {Function} options.onNotificationRead - Callback for notification read events
 * @param {Function} options.onNotificationsRead - Callback for all notifications read
 * @param {Function} options.onMessagesRead - Callback for messages read events
 * @param {Function} options.refreshUnreadMessageCount - Function to refresh message count
 * @param {string} options.socketUrl - Socket server URL
 * @returns {Object} Socket instance with disconnect method
 */
// eslint-disable-next-line react-refresh/only-export-components -- exported for testability; see useSocket/useAuthSocket for same pattern
export function createAuthSocketConnection({
  token,
  onConnect,
  onDisconnect,
  onConnectError,
  onTokenExpired,
  onNotification,
  onNotificationCountUpdated,
  onNotificationRead,
  onNotificationsRead,
  onMessagesRead,
  refreshUnreadMessageCount,
  socketUrl,
}) {
  const currentUserId = decodeUserIdFromToken(token);

  const socketInstance = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socketInstance.on('connect', () => {
    devLog('[Auth Socket] Connected');
    onConnect?.(socketInstance);
  });

  socketInstance.on('disconnect', () => {
    devLog('[Auth Socket] Disconnected');
    onDisconnect?.();
  });

  socketInstance.on('connect_error', (error) => {
    console.error('[Auth Socket] Connection error:', error.message);
    onConnectError?.(error);
  });

  socketInstance.on('token_expired', () => {
    devLog('[Auth Socket] Token expired, disconnecting');
    onTokenExpired?.(socketInstance);
  });

  socketInstance.on('notification', (notification) => {
    devLog('[Auth Socket] New notification:', notification);
    onNotification?.(notification);
  });

  socketInstance.on('notification_count_updated', ({ unreadCount }) => {
    devLog('[Auth Socket] Unread count updated:', unreadCount);
    onNotificationCountUpdated?.(unreadCount || 0);
  });

  socketInstance.on('notification_read', ({ notificationId }) => {
    devLog('[Auth Socket] Notification read:', notificationId);
    onNotificationRead?.(notificationId);
  });

  socketInstance.on('notifications_read', ({ updatedCount }) => {
    devLog('[Auth Socket] All notifications read:', updatedCount);
    onNotificationsRead?.(updatedCount);
  });

  socketInstance.on('messages_read', ({ readBy }) => {
    if (readBy === currentUserId) {
      devLog('[Auth Socket] Own messages read, refreshing message badge');
      onMessagesRead?.();
      refreshUnreadMessageCount?.();
    }
  });

  return socketInstance;
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
    const socketInstance = createPublicSocketConnection({
      socketUrl: SOCKET_URL,
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
      onConnectError: () => setConnected(false),
    });

    // Synchronizing with an external system (creating the socket
    // connection) is a textbook valid effect use case.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

    const socketInstance = createAuthSocketConnection({
      token,
      socketUrl: SOCKET_URL,
      refreshUnreadMessageCount,
      onConnect: (socket) => {
        setConnected(true);
        socketRef.current = socket;

        // Request initial unread count
        socket.emit('get_unread_count', {}, (response) => {
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
      },
      onDisconnect: () => {
        setConnected(false);
        socketRef.current = null;
      },
      onConnectError: () => {
        setConnected(false);
      },
      onTokenExpired: (socket) => {
        socket.disconnect();
        socketRef.current = null;
      },
      onNotification: (notification) => {
        setUnreadCount(prev => prev + 1);

        // Chat messages are delivered as a 'new_message'-typed notification
        // (see chat.service.js#sendMessage) alongside the regular
        // notification bell count — bump the dedicated messages badge too
        // without adding a second socket event for the same thing.
        if (notification.type === 'new_message') {
          setUnreadMessageCount(prev => prev + 1);
        }
      },
      onNotificationCountUpdated: (count) => {
        setUnreadCount(count || 0);
      },
      onNotificationRead: () => {
        setUnreadCount(prev => Math.max(0, prev - 1));
      },
      onNotificationsRead: () => {
        setUnreadCount(0);
      },
      onMessagesRead: () => {
        refreshUnreadMessageCount();
      },
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
// eslint-disable-next-line react-refresh/only-export-components -- standard Context+hook co-location pattern; see AuthContext.jsx useAuth for the same reasoning
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
// eslint-disable-next-line react-refresh/only-export-components -- standard Context+hook co-location pattern; see AuthContext.jsx useAuth for the same reasoning
export function useAuthSocket() {
  const context = useContext(AuthSocketContext);
  if (!context) {
    throw new Error('useAuthSocket must be used within an AuthSocketProvider');
  }
  return context;
}
