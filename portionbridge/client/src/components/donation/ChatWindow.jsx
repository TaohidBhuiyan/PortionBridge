import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Loader2,
  AlertCircle,
  MessageSquare,
  Package,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  CheckCheck,
  Smile,
  MapPin,
  Calendar,
  Phone,
  ArrowDown,
  Sparkles,
} from 'lucide-react';
import { useAuthSocket } from '../../context/SocketContext';
import { chatApi } from '../../services/chatApi';
import { Avatar } from '../common/Avatar';
import { StatusBadge } from './StatusBadge';

const QUICK_REPLIES = [
  '👋 Hi, thanks for volunteering!',
  '📦 Donation is packed and ready for pickup.',
  '📍 What is your current location?',
  '⏰ What is your estimated arrival time?',
  '🔔 Please ring the bell when you arrive.',
  '🙏 Thank you so much for your support!',
];

const EMOJI_OPTIONS = ['👍', '🙏', '📦', '🚚', '⏰', '🥗', '😊', '❤️'];

/**
 * ChatWindow - Real-time chat component for donor-volunteer communication
 * Enhanced with premium UI, donation context drawer, read receipts,
 * quick replies, date dividers, and copy actions.
 */
export function ChatWindow({ donation, currentUser, onBack }) {
  const { socket, connected } = useAuthSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [roomJoined, setRoomJoined] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const roomJoinedRef = useRef(false);
  const inputRef = useRef(null);

  const donationId = donation?.id;
  const isVolunteerAssigned = donation?.volunteer_id && donation?.status !== 'pending';

  const isCurrentUserDonor = currentUser?.role === 'donor' || donation?.donor_id === currentUser?.id;
  const counterpartName = isCurrentUserDonor
    ? (donation?.volunteer_name || donation?.volunteer?.name || 'Assigned Volunteer')
    : (donation?.donor_name || donation?.donor?.name || 'Donor');
  const counterpartRole = isCurrentUserDonor ? 'Volunteer' : 'Donor';
  const counterpartPhoto = isCurrentUserDonor
    ? (donation?.volunteer_photo || donation?.volunteer?.photo)
    : (donation?.donor_photo || donation?.donor?.photo);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setIsScrolledUp(distanceFromBottom > 150);
  };

  useEffect(() => {
    if (!donationId || !isVolunteerAssigned) {
      return undefined;
    }

    let cancelled = false;

    const loadMessages = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await chatApi.getMessages(donationId, { limit: 100 });
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

    const handleNewMessage = (message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      setTimeout(() => scrollToBottom('smooth'), 50);
    };

    const handleMessagesRead = (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
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
    if (messages.length > 0 && !isScrolledUp) {
      scrollToBottom('auto');
    }
  }, [messages.length, scrollToBottom, isScrolledUp]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();

    const trimmed = newMessage.trim();
    if (!trimmed || sending || !roomJoined) return;

    setSending(true);
    setError(null);

    try {
      socket.emit('send_message', { donationId, message: trimmed }, (response) => {
        if (response.success) {
          setNewMessage('');
          setShowEmojis(false);
        } else {
          setError(response.error || 'Failed to send message');
        }
        setSending(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      });
    } catch {
      setError('Failed to send message. Please try again.');
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = async (messageId, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 1800);
    } catch {
      // ignore
    }
  };

  const handleQuickReply = (text) => {
    setNewMessage(text);
    inputRef.current?.focus();
  };

  const handleInsertEmoji = (emoji) => {
    setNewMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getDateLabel = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((today - msgDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Show empty state if no volunteer assigned
  if (!isVolunteerAssigned) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-surface">
        <div className="w-14 h-14 rounded-2xl bg-warning-soft text-warning flex items-center justify-center mb-4 shadow-sm">
          <AlertCircle size={28} />
        </div>
        <h3 className="text-base font-semibold text-text-primary mb-1">
          Chat Not Available Yet
        </h3>
        <p className="text-sm text-text-secondary max-w-sm">
          Direct messaging becomes active once a dedicated volunteer accepts your donation request.
        </p>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-surface">
        <div className="w-12 h-12 rounded-2xl bg-dash-primary-soft text-dash-primary flex items-center justify-center mb-3">
          <Loader2 size={24} className="animate-spin" />
        </div>
        <p className="text-sm font-medium text-text-primary">Connecting to conversation...</p>
        <p className="text-xs text-text-secondary mt-1">Decrypting message history</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface relative">
      {/* 1. Chat Header */}
      <div className="px-4 py-3 border-b border-border/70 bg-surface/90 backdrop-blur shrink-0 z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Back to conversations"
              className="sm:hidden p-1.5 -ml-1 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
            >
              <ChevronDown size={20} className="rotate-90" />
            </button>
          )}

          <div className="relative shrink-0">
            <Avatar
              item={{ name: counterpartName, photo: counterpartPhoto }}
              tone="dash"
              className="w-10 h-10 text-xs font-semibold shadow-xs"
            />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface ${
                connected && roomJoined ? 'bg-success ring-1 ring-success/30 animate-pulse' : 'bg-warning'
              }`}
              title={connected && roomJoined ? 'Connected' : 'Connecting...'}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-text-primary truncate">
                {counterpartName}
              </h2>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-dash-primary-soft text-dash-primary border border-dash-primary/20 shrink-0">
                {counterpartRole}
              </span>
            </div>
            <p className="text-xs text-text-secondary flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${connected && roomJoined ? 'bg-success' : 'bg-warning'}`} />
              <span className="truncate">
                {connected && roomJoined ? 'Active in room' : 'Connecting...'}
              </span>
              {donation?.title && (
                <>
                  <span className="text-text-muted">•</span>
                  <span className="truncate max-w-[140px] sm:max-w-[200px] text-text-muted">
                    {donation.title}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Header Action Tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          {donation.volunteer_phone && (
            <a
              href={`tel:${donation.volunteer_phone}`}
              title="Call Volunteer"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-text-secondary bg-surface-hover hover:text-text-primary transition-colors border border-border/50"
            >
              <Phone size={13} className="text-success" />
              <span>Call</span>
            </a>
          )}

          <Link
            to={`/donations/${donation.id}`}
            title="View Full Donation Details"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-dash-primary bg-dash-primary-soft hover:bg-dash-primary hover:text-white transition-colors border border-dash-primary/20"
          >
            <span className="hidden sm:inline">Details</span>
            <ExternalLink size={13} />
          </Link>

          <button
            onClick={() => setShowDetails(!showDetails)}
            title={showDetails ? 'Hide donation summary' : 'Show donation summary'}
            aria-expanded={showDetails}
            className={`p-1.5 rounded-lg border transition-colors ${
              showDetails
                ? 'bg-dash-primary text-white border-dash-primary'
                : 'text-text-secondary border-border/60 hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* 2. Collapsible Donation Context Banner */}
      {showDetails && (
        <div
          className="border-b border-border/70 bg-surface-hover/50 dark:bg-slate-900/40 px-4 py-3 text-xs transition-all animate-fadeIn"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-primary">
                {donation.title || `Donation #${donation.id}`}
              </span>
              <StatusBadge status={donation.status} size="small" />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-text-secondary">
              {donation.category && (
                <span className="capitalize font-medium flex items-center gap-1">
                  <Package size={13} className="text-dash-primary" />
                  {donation.category}
                </span>
              )}
              {donation.quantity && (
                <span>
                  Qty: <strong className="text-text-primary">{donation.quantity}</strong> {donation.quantity_unit || ''}
                </span>
              )}
              {donation.pickup_location && (
                <span className="flex items-center gap-1 truncate max-w-xs" title={donation.pickup_location}>
                  <MapPin size={13} className="text-danger shrink-0" />
                  <span className="truncate">{donation.pickup_location}</span>
                </span>
              )}
              {donation.pickup_time && (
                <span className="flex items-center gap-1">
                  <Calendar size={13} className="text-info shrink-0" />
                  {new Date(donation.pickup_time).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Messages Stream */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-page/30"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
            <div className="w-16 h-16 rounded-2xl bg-dash-primary-soft/80 text-dash-primary flex items-center justify-center mb-3 shadow-sm">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-1">
              Start the Conversation
            </h3>
            <p className="text-xs text-text-secondary max-w-xs mb-4">
              Send a message to coordinate pickup timing, give directions, or share instructions with {counterpartName}.
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {QUICK_REPLIES.slice(0, 3).map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickReply(reply)}
                  className="px-3 py-1.5 text-xs bg-surface border border-border/80 rounded-full text-text-secondary hover:text-dash-primary hover:border-dash-primary/40 hover:bg-dash-primary-soft transition-all"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.sender_id === currentUser?.id;
            const prevMessage = messages[index - 1];
            const showDateDivider =
              index === 0 ||
              getDateLabel(message.created_at) !== getDateLabel(prevMessage?.created_at);
            const isConsecutive =
              prevMessage &&
              prevMessage.sender_id === message.sender_id &&
              !showDateDivider;

            return (
              <div key={message.id || index} className="space-y-2">
                {/* Date separator pill */}
                {showDateDivider && (
                  <div className="flex items-center justify-center my-3">
                    <span className="px-3 py-0.5 bg-surface border border-border/60 text-text-muted text-[11px] font-medium rounded-full shadow-xs">
                      {getDateLabel(message.created_at)}
                    </span>
                  </div>
                )}

                <div
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group items-end gap-2`}
                  style={{ animation: 'rowIn 0.2s ease' }}
                >
                  {/* Counterpart avatar for incoming messages */}
                  {!isOwnMessage && !isConsecutive && (
                    <Avatar
                      item={{ name: counterpartName, photo: counterpartPhoto }}
                      tone="dash"
                      className="w-7 h-7 text-[10px] font-semibold shrink-0 mb-1"
                    />
                  )}
                  {!isOwnMessage && isConsecutive && (
                    <div className="w-7 shrink-0" />
                  )}

                  {/* Copy message button on hover */}
                  {isOwnMessage && (
                    <button
                      onClick={() => handleCopyMessage(message.id, message.message)}
                      title={copiedMessageId === message.id ? 'Copied!' : 'Copy message'}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-text-muted hover:text-text-primary rounded"
                    >
                      {copiedMessageId === message.id ? (
                        <Check size={13} className="text-success" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-xs transition-shadow relative ${
                      isOwnMessage
                        ? 'bg-dash-primary text-white rounded-br-xs'
                        : 'bg-surface dark:bg-slate-800/95 border border-border/80 text-text-primary rounded-bl-xs'
                    }`}
                  >
                    {!isOwnMessage && !isConsecutive && (
                      <p className="text-[11px] font-semibold text-dash-primary mb-1">
                        {message.sender_name || counterpartName}
                      </p>
                    )}

                    <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                      {message.message}
                    </p>

                    <div
                      className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] select-none ${
                        isOwnMessage ? 'text-white/80' : 'text-text-muted'
                      }`}
                    >
                      <span>{formatTime(message.created_at)}</span>
                      {isOwnMessage && (
                        <span>
                          {message.is_read ? (
                            <CheckCheck size={13} className="text-white inline" title="Read by recipient" />
                          ) : (
                            <Check size={13} className="text-white/70 inline" title="Delivered" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Copy button for incoming messages */}
                  {!isOwnMessage && (
                    <button
                      onClick={() => handleCopyMessage(message.id, message.message)}
                      title={copiedMessageId === message.id ? 'Copied!' : 'Copy message'}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-text-muted hover:text-text-primary rounded"
                    >
                      {copiedMessageId === message.id ? (
                        <Check size={13} className="text-success" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom button */}
      {isScrolledUp && (
        <button
          onClick={() => scrollToBottom('smooth')}
          aria-label="Scroll to bottom"
          className="absolute bottom-28 right-6 p-2 rounded-full bg-surface border border-border/80 shadow-md hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-all z-20 flex items-center justify-center animate-bounce"
        >
          <ArrowDown size={16} />
        </button>
      )}

      {/* 4. Quick Replies Strip */}
      <div className="px-4 py-2 border-t border-border/50 bg-surface/80 backdrop-blur overflow-x-auto no-scrollbar flex items-center gap-2">
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1 shrink-0">
          <Sparkles size={12} className="text-dash-primary" />
          Quick:
        </span>
        {QUICK_REPLIES.map((reply, idx) => (
          <button
            key={idx}
            onClick={() => handleQuickReply(reply)}
            className="px-2.5 py-1 text-xs whitespace-nowrap bg-page border border-border/70 rounded-full text-text-secondary hover:text-dash-primary hover:border-dash-primary/40 hover:bg-dash-primary-soft transition-colors shrink-0"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* 5. Message Input & Controls */}
      <div className="p-3 md:p-4 border-t border-border/70 bg-surface">
        {/* Emoji Bar popup */}
        {showEmojis && (
          <div className="flex items-center gap-2 p-2 mb-2 bg-page border border-border/70 rounded-xl animate-fadeIn shadow-xs">
            <span className="text-xs text-text-muted ml-1">Reactions:</span>
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleInsertEmoji(emoji)}
                className="text-lg hover:scale-125 transition-transform p-1 rounded"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          {/* Emoji toggle */}
          <button
            type="button"
            onClick={() => setShowEmojis(!showEmojis)}
            aria-label="Insert emoji"
            className={`p-2.5 rounded-xl border transition-colors ${
              showEmojis
                ? 'bg-dash-primary-soft text-dash-primary border-dash-primary/40'
                : 'text-text-secondary border-border/70 hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            <Smile size={18} />
          </button>

          {/* Text input */}
          <div className="flex-1 relative flex items-center rounded-xl border border-border/80 bg-page focus-within:border-dash-primary focus-within:ring-2 focus-within:ring-dash-primary/20 transition-all">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              disabled={sending || !roomJoined}
              rows={1}
              maxLength={2000}
              className="w-full px-3.5 py-2.5 bg-transparent text-sm text-text-primary placeholder-text-secondary/70 resize-none focus:outline-none max-h-32 disabled:opacity-50"
              style={{ minHeight: '40px' }}
            />
            {newMessage.length > 50 && (
              <span className="text-[10px] text-text-muted pr-3 select-none">
                {newMessage.length}/2000
              </span>
            )}
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={sending || !newMessage.trim() || !roomJoined}
            aria-label="Send message"
            className="p-2.5 rounded-xl bg-dash-primary text-white hover:bg-dash-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center shrink-0"
          >
            {sending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-danger mt-2">
            <AlertCircle size={13} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
