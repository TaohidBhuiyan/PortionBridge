import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, AlertCircle, MessageSquare } from 'lucide-react';
import { useAuthSocket } from '../../context/SocketContext';
import { chatApi } from '../../services/chatApi';

/**
 * ChatWindow - Real-time chat component for donor-volunteer communication
 * Only available when volunteer is assigned to the donation
 */
export function ChatWindow({ donation, currentUser }) {
  const { socket, connected } = useAuthSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [roomJoined, setRoomJoined] = useState(false);
  
  const messagesEndRef = useRef(null);
  const roomJoinedRef = useRef(false);

  const donationId = donation?.id;
  const isVolunteerAssigned = donation?.volunteer_id && donation?.status !== 'pending';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!donationId || !isVolunteerAssigned) {
      // No setState needed here — the render logic below already checks
      // `!isVolunteerAssigned` before ever looking at `loading`, so this
      // early return doesn't need to touch loading state at all.
      return undefined;
    }

    let cancelled = false;

    const loadMessages = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await chatApi.getMessages(donationId, { limit: 50 });
        if (cancelled) return;

        if (result.success) {
          setMessages(result.data.messages || []);
        } else {
          setError(result.error || 'Failed to load messages');
        }
      } catch {
        if (!cancelled) setError('Failed to load messages. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMessages();
    return () => {
      cancelled = true;
    };
  }, [donationId, isVolunteerAssigned]);

  useEffect(() => {
    if (!socket || !connected || !donationId || !isVolunteerAssigned) return;

    // Join chat room
    if (!roomJoinedRef.current) {
      socket.emit('join_room', { donationId }, (response) => {
        if (response.success) {
          setRoomJoined(true);
          roomJoinedRef.current = true;
        } else {
          setError(response.error || 'Failed to join chat room');
        }
      });
    }

    // Listen for new messages
    const handleNewMessage = (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    };

    // Listen for messages read
    const handleMessagesRead = (data) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.sender_id !== data.readBy ? { ...msg, is_read: 1 } : msg
        )
      );
    };

    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      
      if (roomJoinedRef.current) {
        socket.emit('leave_room', { donationId });
        roomJoinedRef.current = false;
        setRoomJoined(false);
      }
    };
  }, [socket, connected, donationId, isVolunteerAssigned, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending || !roomJoined) return;

    setSending(true);
    setError(null);

    try {
      socket.emit('send_message', { donationId, message: newMessage.trim() }, (response) => {
        if (response.success) {
          setNewMessage('');
        } else {
          setError(response.error || 'Failed to send message');
        }
        setSending(false);
      });
    } catch {
      setError('Failed to send message. Please try again.');
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Show empty state if no volunteer assigned
  if (!isVolunteerAssigned) {
    return (
      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 text-text-secondary">
          <AlertCircle size={20} />
          <p>Chat is available once a volunteer accepts this donation.</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center justify-center gap-2 text-text-secondary">
          <Loader2 size={20} className="animate-spin" />
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && messages.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 text-danger">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-dash-primary-soft flex items-center justify-center">
            <MessageSquare size={20} className="text-dash-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary">
              {donation.volunteer_name || 'Volunteer'}
            </h3>
            <p className="text-sm text-text-secondary">
              {connected ? 'Connected' : 'Connecting...'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary">
            <MessageSquare size={48} className="mb-2 opacity-50" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === currentUser?.id;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                style={{ animation: 'rowIn 0.2s ease' }}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isOwnMessage
                      ? 'bg-dash-primary text-white'
                      : 'bg-page border border-border text-text-primary'
                  }`}
                >
                  <p className="text-sm break-words">{message.message}</p>
                  <div className={`flex items-center gap-2 mt-1 text-xs ${
                    isOwnMessage ? 'text-dash-primary-soft' : 'text-text-secondary'
                  }`}>
                    <span>{formatTime(message.created_at)}</span>
                    {isOwnMessage && (
                      <span>
                        {message.is_read ? 'Read' : 'Sent'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending || !roomJoined}
            className="flex-1 px-4 py-2 rounded-lg border border-border bg-page text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-dash-primary disabled:opacity-50"
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim() || !roomJoined}
            aria-label="Send message"
            className="px-4 py-2 bg-dash-primary text-white rounded-lg hover:bg-dash-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
        {error && (
          <p className="text-sm text-danger mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}
