import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Loader2, AlertCircle, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuthSocket } from '../context/SocketContext';
import { donationApi } from '../services/donationApi';
import { chatApi } from '../services/chatApi';
import { ChatWindow } from '../components/donation/ChatWindow';
import { Avatar } from '../components/common/Avatar';
import { formatNotificationTimestamp } from '../utils/notificationMeta';

/**
 * MessagesPage — conversation list + chat, for both donors and volunteers.
 *
 * This does NOT reimplement chat: it lists the donations a user is
 * authorized to chat about (same rule chatService.authorizeRoomAccess
 * already enforces server-side — a volunteer must be assigned and the
 * donation must be past 'pending') and renders the existing, unmodified
 * <ChatWindow> for whichever conversation is selected. All message
 * sending/receiving, room joining, and read-marking logic lives in
 * ChatWindow/SocketContext exactly as before.
 */
export function MessagesPage() {
  const { user, userRole } = useAuth();
  const { refreshUnreadMessageCount } = useAuthSocket();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(null);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Reuses the existing donor/volunteer history endpoints — no new
      // backend route. Chat is only available once a volunteer is
      // assigned (status past 'pending'), same rule the backend already
      // enforces in chatService.authorizeRoomAccess.
      const result = userRole === 'volunteer'
        ? await donationApi.getVolunteerHistory({ limit: 50 })
        : await donationApi.getDonorHistory({ limit: 50 });

      if (!result.success) {
        setError(result.error || 'Failed to load conversations.');
        return;
      }

      const eligible = (result.data.donations || []).filter(
        (donation) => donation.volunteer_id && donation.status !== 'pending'
      );

      const withPreviews = await Promise.all(
        eligible.map(async (donation) => {
          try {
            const [latestRes, unreadRes] = await Promise.all([
              chatApi.getLatestMessage(donation.id),
              chatApi.getUnreadCount(donation.id),
            ]);
            return {
              ...donation,
              latestMessage: latestRes?.success ? latestRes.data.message : null,
              unreadCount: unreadRes?.success ? unreadRes.data.unreadCount || 0 : 0,
            };
          } catch {
            return { ...donation, latestMessage: null, unreadCount: 0 };
          }
        })
      );

      // Most recently active conversation first.
      withPreviews.sort((a, b) => {
        const aTime = new Date(a.latestMessage?.created_at || a.updated_at || 0).getTime();
        const bTime = new Date(b.latestMessage?.created_at || b.updated_at || 0).getTime();
        return bTime - aTime;
      });

      setConversations(withPreviews);
    } catch {
      setError('Failed to load conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversations();
  }, [loadConversations]);

  const handleSelectConversation = (donation) => {
    setSelectedDonation(donation);
    // Opening a conversation marks its messages read server-side (via
    // ChatWindow's existing join_room call) — clear this conversation's
    // own unread count locally right away for a snappy UI, and let the
    // shared 'messages_read' listener in SocketContext resync the
    // navbar/sidebar badge total in the background.
    setConversations((prev) =>
      prev.map((c) => (c.id === donation.id ? { ...c, unreadCount: 0 } : c))
    );
    refreshUnreadMessageCount();
  };

  const counterpartLabel = userRole === 'volunteer' ? 'Donor' : 'Volunteer';

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Messages</h1>
        <p className="text-sm text-text-secondary">
          Conversations with your {counterpartLabel.toLowerCase()}s about active donations.
        </p>
      </div>

      {error && (
        <div className="bg-danger-soft border border-danger/20 rounded-lg p-4 mb-6 flex items-center gap-2" role="alert">
          <AlertCircle size={16} className="text-danger shrink-0" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <div className="bg-surface border border-border/50 rounded-xl overflow-hidden flex" style={{ minHeight: '32rem' }}>
        {/* Conversation list */}
        <div className={`w-full sm:w-72 border-r border-border/50 flex-shrink-0 overflow-y-auto ${selectedDonation ? 'hidden sm:block' : ''}`}>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 size={20} className="animate-spin text-text-secondary" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 px-4 text-center">
              <MessageSquare size={24} className="text-text-secondary mb-2" />
              <p className="text-sm text-text-secondary">No conversations yet.</p>
            </div>
          ) : (
            <ul>
              {conversations.map((donation) => (
                <li key={donation.id}>
                  <button
                    onClick={() => handleSelectConversation(donation)}
                    className={`w-full text-left px-4 py-3 border-b border-border/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary/50 focus-visible:ring-inset ${
                      selectedDonation?.id === donation.id
                        ? 'bg-dash-primary-soft'
                        : 'hover:bg-surface-hover'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Avatar
                        item={{ name: donation.title || `Donation #${donation.id}` }}
                        tone="dash"
                        className="w-9 h-9 text-xs mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm truncate ${donation.unreadCount > 0 ? 'font-semibold text-text-primary' : 'text-text-primary'}`}>
                            {donation.title || `Donation #${donation.id}`}
                          </p>
                          {donation.unreadCount > 0 && (
                            <span className="shrink-0 bg-danger text-white text-[9px] leading-none px-1.5 py-0.5 rounded-full">
                              {donation.unreadCount > 99 ? '99+' : donation.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${donation.unreadCount > 0 ? 'font-medium text-text-primary' : 'text-text-secondary'}`}>
                          {donation.latestMessage?.message || `Chat with your ${counterpartLabel.toLowerCase()}`}
                        </p>
                        {donation.latestMessage?.created_at && (
                          <p className="text-[11px] text-text-muted mt-1">
                            {formatNotificationTimestamp(donation.latestMessage.created_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Chat pane */}
        <div className={`flex-1 min-w-0 flex flex-col ${selectedDonation ? '' : 'hidden sm:flex'}`}>
          {selectedDonation ? (
            <>
              <div className="sm:hidden flex items-center gap-2 px-3 py-2 border-b border-border/50">
                <button
                  onClick={() => setSelectedDonation(null)}
                  aria-label="Back to conversations"
                  className="p-1 rounded-md hover:bg-surface-hover text-text-secondary transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <Avatar
                  item={{ name: selectedDonation.title || `Donation #${selectedDonation.id}` }}
                  tone="dash"
                  className="w-7 h-7 text-[10px]"
                />
                <p className="text-sm font-medium text-text-primary truncate">
                  {selectedDonation.title || `Donation #${selectedDonation.id}`}
                </p>
              </div>
              <div className="flex-1 min-h-0">
                <ChatWindow donation={selectedDonation} currentUser={user} />
              </div>
            </>
          ) : (
            <div className="hidden sm:flex flex-1 flex-col items-center justify-center text-center px-4">
              <MessageSquare size={28} className="text-text-secondary mb-2" />
              <p className="text-sm text-text-secondary">Select a conversation to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
