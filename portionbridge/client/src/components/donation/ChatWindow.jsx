import { useState, useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!donationId || !isVolunteerAssigned) {
      setLoading(false);
      return;
    }

    loadMessages();
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
  }, [socket, connected, donationId, isVolunteerAssigned]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await chatApi.getMessages(donationId, { limit: 50 });
      
      if (result.success) {
        setMessages(result.data.messages || []);
      } else {
        setError(result.error || 'Failed to load messages');
      }
    } catch (err) {
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
    } catch (err) {
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
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <AlertCircle size={20} />
          <p>Chat is available once a volunteer accepts this donation.</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && messages.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <MessageSquare size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {donation.volunteer_name || 'Volunteer'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {connected ? 'Connected' : 'Connecting...'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
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
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isOwnMessage
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="text-sm break-words">{message.message}</p>
                  <div className={`flex items-center gap-2 mt-1 text-xs ${
                    isOwnMessage ? 'text-purple-200' : 'text-gray-500 dark:text-gray-400'
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
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending || !roomJoined}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim() || !roomJoined}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}
