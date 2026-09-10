import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MessageSquare,
  AlertCircle,
  Search,
  X,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  Clock,
  MapPin,
  Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuthSocket } from '../context/SocketContext';
import { donationApi } from '../services/donationApi';
import { chatApi } from '../services/chatApi';
import { ChatWindow } from '../components/donation/ChatWindow';
import { Avatar } from '../components/common/Avatar';
import { StatusBadge } from '../components/donation/StatusBadge';
import { DashboardLayout } from '../components/dashboard';
import { formatNotificationTimestamp } from '../utils/notificationMeta';

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'active', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
];

/**
 * MessagesPage — Premium donor-volunteer real-time conversation hub.
 * Integrated within DashboardLayout with live search, status filters,
 * conversation metadata, unread counters, and rich chat drawer.
 */
export function MessagesPage() {
  const { user, userRole } = useAuth();
  const { connected, refreshUnreadMessageCount } = useAuthSocket();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
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

      // If a donation was already selected, update its reference with latest data
      setSelectedDonation((prevSelected) => {
        if (!prevSelected) return null;
        return withPreviews.find((d) => d.id === prevSelected.id) || prevSelected;
      });
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
    setConversations((prev) =>
      prev.map((c) => (c.id === donation.id ? { ...c, unreadCount: 0 } : c))
    );
    refreshUnreadMessageCount();
  };

  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((sum, item) => sum + (item.unreadCount || 0), 0);
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((item) => {
      // 1. Tab filter
      if (activeTab === 'unread' && (!item.unreadCount || item.unreadCount === 0)) {
        return false;
      }
      if (activeTab === 'active') {
        const activeStatuses = ['accepted', 'scheduled', 'on_the_way', 'picked_up'];
        if (!activeStatuses.includes(item.status)) return false;
      }
      if (activeTab === 'completed' && item.status !== 'completed') {
        return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = item.title?.toLowerCase().includes(q);
        const counterpartMatch = (item.volunteer_name || item.donor_name || '')
          .toLowerCase()
          .includes(q);
        const categoryMatch = item.category?.toLowerCase().includes(q);
        const messageMatch = item.latestMessage?.message?.toLowerCase().includes(q);
        const locationMatch = item.pickup_location?.toLowerCase().includes(q);

        return titleMatch || counterpartMatch || categoryMatch || messageMatch || locationMatch;
      }

      return true;
    });
  }, [conversations, activeTab, searchQuery]);

  const counterpartLabel = userRole === 'volunteer' ? 'Donor' : 'Volunteer';

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* 1. Page Header & Stats Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                Messages
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-dash-primary-soft text-dash-primary border border-dash-primary/20">
                <Sparkles size={12} />
                Live Chat
              </span>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Direct real-time conversations with your {counterpartLabel.toLowerCase()}s about active donations.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Connection status indicator */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                connected
                  ? 'bg-success-soft text-success border-success/30'
                  : 'bg-warning-soft text-warning border-warning/30'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  connected ? 'bg-success animate-pulse' : 'bg-warning'
                }`}
              />
              {connected ? 'Socket Live' : 'Reconnecting...'}
            </span>

            {/* Unread total badge */}
            {totalUnreadCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-danger text-white shadow-xs">
                {totalUnreadCount} Unread
              </span>
            )}

            {/* Refresh button */}
            <button
              onClick={loadConversations}
              disabled={loading}
              title="Refresh conversations"
              className="p-2 rounded-xl border border-border/80 bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50 shadow-xs"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-dash-primary' : ''} />
            </button>
          </div>
        </div>

        {error && (
          <div
            className="bg-danger-soft border border-danger/20 rounded-xl p-3.5 flex items-center gap-2.5 text-sm text-danger shadow-xs"
            role="alert"
          >
            <AlertCircle size={18} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* 2. Main Chat Workspace Card */}
        <div
          className="bg-surface border border-border/80 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row h-[780px] max-h-[calc(100vh-190px)] min-h-[560px]"
        >
          {/* Left Column: Conversation Sidebar */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-border/70 flex flex-col shrink-0 bg-surface/50 ${
              selectedDonation ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search Box */}
            <div className="p-3 border-b border-border/60">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search donations, volunteers, items..."
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-page border border-border/80 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-dash-primary focus:ring-1 focus:ring-dash-primary transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
                {FILTER_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-dash-primary text-white shadow-xs'
                          : 'bg-page text-text-secondary hover:bg-surface-hover border border-border/60'
                      }`}
                    >
                      {tab.label}
                      {tab.id === 'unread' && totalUnreadCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full bg-danger text-white text-[9px]">
                          {totalUnreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversation Feed */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/40">
              {loading ? (
                // Shimmer Skeletons
                <div className="p-3 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-border/40 bg-page/60 animate-pulse flex items-start gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-border/60 shrink-0" />
                      <div className="flex-1 space-y-2 py-0.5">
                        <div className="h-3.5 bg-border/60 rounded w-3/4" />
                        <div className="h-2.5 bg-border/40 rounded w-1/2" />
                        <div className="h-2 bg-border/30 rounded w-5/6" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-dash-primary-soft text-dash-primary flex items-center justify-center mb-3">
                    <MessageSquare size={24} />
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary mb-1">
                    {searchQuery ? 'No Results Found' : 'No Conversations'}
                  </h3>
                  <p className="text-xs text-text-secondary max-w-xs mb-3">
                    {searchQuery
                      ? `No conversations match "${searchQuery}". Try a different keyword.`
                      : `You don't have any conversations yet. When a volunteer is assigned to your donation, direct chat will appear here.`}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-3 py-1.5 text-xs bg-page border border-border rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                filteredConversations.map((donation) => {
                  const isSelected = selectedDonation?.id === donation.id;
                  const counterpart = userRole === 'volunteer'
                    ? (donation.donor_name || 'Donor')
                    : (donation.volunteer_name || 'Volunteer');
                  const hasUnread = donation.unreadCount > 0;

                  return (
                    <button
                      key={donation.id}
                      onClick={() => handleSelectConversation(donation)}
                      className={`w-full text-left p-3.5 transition-all flex items-start gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary/50 ${
                        isSelected
                          ? 'bg-dash-primary-soft/80 border-l-4 border-l-dash-primary shadow-xs'
                          : 'hover:bg-surface-hover/80 border-l-4 border-l-transparent'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <Avatar
                          item={{ name: counterpart }}
                          tone="dash"
                          className="w-10 h-10 text-xs font-bold mt-0.5 shadow-xs"
                        />
                        {hasUnread && (
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-danger rounded-full ring-2 ring-surface animate-pulse" />
                        )}
                      </div>

                      {/* Info & Snippet */}
                      <div className="min-w-0 flex-1">
                        {/* Top row: Counterpart & Status */}
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <p className={`text-xs font-semibold truncate ${hasUnread ? 'text-text-primary font-bold' : 'text-text-primary'}`}>
                            {counterpart}
                          </p>
                          <StatusBadge status={donation.status} size="small" />
                        </div>

                        {/* Middle row: Donation Title */}
                        <p className="text-xs text-text-secondary truncate font-medium flex items-center gap-1 mb-1">
                          <Package size={12} className="text-dash-primary shrink-0" />
                          <span className="truncate">{donation.title || `Donation #${donation.id}`}</span>
                        </p>

                        {/* Bottom row: Last Message Snippet + Time */}
                        <div className="flex items-center justify-between gap-2 text-[11px] text-text-muted">
                          <p className={`truncate max-w-[170px] ${hasUnread ? 'font-semibold text-text-primary' : ''}`}>
                            {donation.latestMessage ? (
                              <>
                                {donation.latestMessage.sender_id === user?.id && 'You: '}
                                {donation.latestMessage.message}
                              </>
                            ) : (
                              'Start coordination chat...'
                            )}
                          </p>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {donation.latestMessage?.created_at && (
                              <span>
                                {formatNotificationTimestamp(donation.latestMessage.created_at)}
                              </span>
                            )}
                            {hasUnread && (
                              <span className="px-1.5 py-0.2 bg-danger text-white text-[9px] font-bold rounded-full">
                                {donation.unreadCount > 99 ? '99+' : donation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Chat or Empty Desktop Slate */}
          <div
            className={`flex-1 min-w-0 flex flex-col bg-surface ${
              selectedDonation ? 'flex' : 'hidden md:flex'
            }`}
          >
            {selectedDonation ? (
              <ChatWindow
                donation={selectedDonation}
                currentUser={user}
                onBack={() => setSelectedDonation(null)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12 bg-surface">
                <div className="w-20 h-20 rounded-3xl bg-dash-primary-soft/70 border border-dash-primary/20 text-dash-primary flex items-center justify-center mb-5 shadow-sm">
                  <HeartHandshake size={42} />
                </div>
                <h2 className="text-lg font-bold text-text-primary mb-1">
                  PortionBridge Coordination Hub
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary max-w-md mb-8 leading-relaxed">
                  Select a donation conversation from the left to coordinate pickup schedules, provide location tips, and communicate directly with assigned volunteers.
                </p>

                {/* Helpful Guidelines Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-2xl text-left">
                  <div className="p-3.5 rounded-xl bg-page border border-border/70 hover:border-dash-primary/30 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-info-soft text-info flex items-center justify-center mb-2">
                      <Clock size={16} />
                    </div>
                    <h3 className="text-xs font-semibold text-text-primary mb-1">
                      Coordinate Timing
                    </h3>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      Confirm exact pickup times to prevent food items from staying out too long.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-page border border-border/70 hover:border-dash-primary/30 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-success-soft text-success flex items-center justify-center mb-2">
                      <MapPin size={16} />
                    </div>
                    <h3 className="text-xs font-semibold text-text-primary mb-1">
                      Smooth Handover
                    </h3>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      Share gate codes, packaging instructions, or landmark pointers easily.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-page border border-border/70 hover:border-dash-primary/30 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-dash-primary-soft text-dash-primary flex items-center justify-center mb-2">
                      <ShieldCheck size={16} />
                    </div>
                    <h3 className="text-xs font-semibold text-text-primary mb-1">
                      Verified Volunteers
                    </h3>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      Only verified, authorized volunteers assigned to your donation can message you.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
