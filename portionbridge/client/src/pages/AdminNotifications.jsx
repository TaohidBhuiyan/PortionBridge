import { useState, useEffect, useCallback } from 'react';
import { Megaphone, Users, HeartHandshake, UserCheck, Send, CheckCircle2, Search, X, Save, Trash2, ChevronDown, Clock, Sparkles, Bell } from 'lucide-react';
import { DashboardLayout, EmptyState, ErrorState } from '../components/dashboard';
import { SkeletonCard } from '../components/dashboard/skeletons';
import { adminApi } from '../services/adminApi';
import toast from 'react-hot-toast';

const AUDIENCES = [
  { value: 'all', label: 'Everyone', icon: Megaphone, description: 'All donors and volunteers platform-wide' },
  { value: 'donors', label: 'Donors', icon: HeartHandshake, description: 'All donor accounts' },
  { value: 'volunteers', label: 'Volunteers', icon: UserCheck, description: 'All volunteer accounts' },
  { value: 'team', label: 'A Team', icon: Users, description: "One team's members (reuses the team announcement feature)" },
  { value: 'specific', label: 'Specific People', icon: Users, description: 'Hand-picked donors and volunteers' },
];

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

/**
 * AdminNotifications — "Notifications" (Phase 8: admin announcement
 * sending + history).
 *
 * Everyone/Donors/Volunteers go through the new
 * notificationService.sendAdminAnnouncement (admin.service.js#sendAnnouncement);
 * "A Team" goes straight to the EXISTING notificationService.sendTeamAnnouncement
 * — the same mechanism a team leader already uses, not a reimplementation.
 * History only covers the first three (see admin.model.js#findSentAnnouncements
 * for why team announcements aren't attributable there).
 */
export function AdminNotifications() {
  const [audience, setAudience] = useState('all');
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sendResult, setSendResult] = useState(null);

  // Specific audience state
  const [userSearch, setUserSearch] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Templates state
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Debounced user search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (userSearch.trim().length >= 2) {
        setSearchingUsers(true);
        const result = await adminApi.listUsers({ search: userSearch, limit: 10, status: 'active' });
        if (result.success) {
          setUserSearchResults((result.data || []).filter(u => u.role !== 'admin'));
        }
        setSearchingUsers(false);
      } else {
        setUserSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch]);

  // Load templates
  useEffect(() => {
    let cancelled = false;
    const loadTemplates = async () => {
      setTemplatesLoading(true);
      const result = await adminApi.listNotificationTemplates();
      if (!cancelled && result.success) {
        setTemplates(result.data || []);
      }
      setTemplatesLoading(false);
    };
    loadTemplates();
    return () => { cancelled = true; };
  }, [refreshTrigger]);

  // Default templates for different sectors
  const DEFAULT_TEMPLATES = [
    {
      title: 'Food Donation Campaign',
      message: '🍽️ Help fight hunger! Join our food donation campaign this week. Every meal makes a difference in someone\'s life. Visit your dashboard to see available donation opportunities near you.',
      category: 'food'
    },
    {
      title: 'Volunteer Recruitment Drive',
      message: '🤝 We need your help! Join our community of dedicated volunteers and make a real impact. Sign up today and start connecting with donors in your area. Training provided!',
      category: 'volunteer'
    },
    {
      title: 'Platform Maintenance Notice',
      message: '🔧 Scheduled maintenance: Our platform will be temporarily unavailable for maintenance on [DATE] from [TIME] to [TIME]. We apologize for any inconvenience and appreciate your patience.',
      category: 'system'
    },
    {
      title: 'Holiday Food Drive',
      message: '🎄 This holiday season, let\'s come together to help those in need. Our special holiday food drive is now accepting donations. Share the joy of giving with your community!',
      category: 'food'
    },
    {
      title: 'Safety Guidelines Update',
      message: '⚠️ Important: We\'ve updated our safety guidelines for food handling and pickup procedures. Please review the new guidelines in your dashboard to ensure safe and effective donations.',
      category: 'safety'
    },
    {
      title: 'Thank You - Community Impact',
      message: '💚 Thank you for your incredible support! Together, we\'ve served [X] meals and helped [Y] families this month. Your dedication makes our community stronger every day.',
      category: 'gratitude'
    },
    {
      title: 'Emergency Relief Request',
      message: '🚨 Urgent: Our community needs immediate support for emergency relief efforts. If you can donate food or volunteer your time, please check your dashboard for current needs in your area.',
      category: 'emergency'
    },
    {
      title: 'New Feature Announcement',
      message: '✨ Exciting news! We\'ve launched a new feature to help you connect better with donors/volunteers. Check out the improved matching system and real-time notifications in your dashboard.',
      category: 'system'
    },
    {
      title: 'Volunteer Appreciation Week',
      message: '🌟 It\'s Volunteer Appreciation Week! We want to thank all our amazing volunteers who work tirelessly to help our community. Your dedication inspires us every day!',
      category: 'volunteer'
    },
    {
      title: 'Clothing Donation Drive',
      message: '👕 Spring cleaning? Donate your gently used clothes to help those in need. Our clothing donation drive is accepting items in good condition. Drop-off locations available across the city.',
      category: 'clothes'
    },
    {
      title: 'Weekly Success Story',
      message: '📖 This week\'s success story: Thanks to our amazing community, we helped [X] families receive food donations and [Y] volunteers completed [Z] pickups. Together, we\'re making a difference!',
      category: 'community'
    },
    {
      title: 'Pickup Reminder',
      message: '📦 Reminder: You have pending pickups scheduled for today. Please check your dashboard for details and ensure timely collection. Thank you for your commitment!',
      category: 'reminder'
    }
  ];

  useEffect(() => {
    let cancelled = false;
    adminApi.listTeams({ limit: 100 }).then((result) => {
      if (!cancelled && result.success) setTeams(result.data || []);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setHistoryLoading(true);
      setHistoryError(null);
      const result = await adminApi.getAnnouncementHistory();
      if (cancelled) return;
      if (result.success) {
        setHistory(result.data || []);
      } else {
        setHistoryError(result.error);
      }
      setHistoryLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [refreshTrigger]);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setSendError(null);
    setSendResult(null);

    const result = await adminApi.sendAnnouncement({
      audience,
      teamId: audience === 'team' ? Number(teamId) : undefined,
      userIds: audience === 'specific' ? selectedUsers.map(u => u.id) : undefined,
      title: audience !== 'team' ? title : undefined,
      message,
    });

    setSending(false);
    if (result.success) {
      setSendResult(result.data);
      setTitle('');
      setMessage('');
      setTeamId('');
      setSelectedUsers([]);
      setUserSearch('');
      setRefreshTrigger((t) => t + 1);
    } else {
      setSendError(result.error);
    }
  };

  const canSubmit = message.trim() && (audience !== 'team' ? title.trim() : teamId) && (audience !== 'specific' ? true : selectedUsers.length > 0);

  const handleAddUser = (user) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setUserSearch('');
    setUserSearchResults([]);
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleSaveTemplate = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required to save as template');
      return;
    }
    const result = await adminApi.createNotificationTemplate({ title, message });
    if (result.success) {
      toast.success('Template saved successfully');
      setRefreshTrigger(t => t + 1);
    } else {
      toast.error(result.error);
    }
  };

  const handleLoadTemplate = (template) => {
    setTitle(template.title);
    setMessage(template.message);
    setShowTemplateDropdown(false);
  };

  const filterTemplatesByCategory = (category) => {
    setSelectedCategory(category);
  };

  const getFilteredTemplates = () => {
    if (selectedCategory === 'all') {
      return DEFAULT_TEMPLATES;
    }
    return DEFAULT_TEMPLATES.filter(t => t.category === selectedCategory);
  };

  const handleDeleteTemplate = async (templateId) => {
    const result = await adminApi.deleteNotificationTemplate(templateId);
    if (result.success) {
      toast.success('Template deleted');
      setRefreshTrigger(t => t + 1);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 dark:from-violet-800 dark:via-purple-800 dark:to-indigo-900 shadow-pb-elevated p-6 md:p-8">
          {/* Decorative elements */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-pink-400/20 blur-3xl" />

          <div className="relative flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 border border-white/30 backdrop-blur-sm">
              <Bell size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Notifications</h1>
              <p className="text-white/70 text-sm mt-1">Send announcements and review what's already gone out</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Send form */}
          <form onSubmit={handleSend} className="bg-surface rounded-xl border border-border/60 shadow-pb-card p-6 space-y-5">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <Megaphone size={16} className="text-violet-600 dark:text-violet-400" />
              </div>
              <h2 className="text-base font-semibold text-text-primary">Send Announcement</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-3">Audience</label>
              <div className="grid grid-cols-2 gap-3">
                {AUDIENCES.map((a) => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => setAudience(a.value)}
                      className={`text-left p-4 rounded-xl border-2 transition-all duration-200 group ${
                        audience === a.value
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-sm'
                          : 'border-border/60 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-surface-hover'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg transition-colors ${
                          audience === a.value
                            ? 'bg-violet-500 text-white'
                            : 'bg-surface-hover text-text-secondary group-hover:bg-violet-100 dark:group-hover:bg-violet-800 group-hover:text-violet-600 dark:group-hover:text-violet-400'
                        }`}>
                          <Icon size={14} />
                        </div>
                        <p className={`text-xs font-semibold transition-colors ${
                          audience === a.value ? 'text-violet-700 dark:text-violet-300' : 'text-text-primary'
                        }`}>{a.label}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-start gap-2 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
                <Sparkles size={14} className="text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
                <p className="text-xs text-violet-700 dark:text-violet-300">
                  {AUDIENCES.find((a) => a.value === audience)?.description}
                </p>
              </div>
            </div>

            {audience === 'team' && (
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-2" htmlFor="team-select">Select Team</label>
                <select
                  id="team-select"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border/60 rounded-xl bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                >
                  <option value="">Choose a team...</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}

            {audience !== 'team' && (
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-2" htmlFor="announcement-title">Title</label>
                <div className="relative">
                  <input
                    id="announcement-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={150}
                    placeholder="e.g. Scheduled maintenance tonight"
                    className="w-full px-4 py-2.5 pr-24 border border-border/60 rounded-xl bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
                  >
                    <Sparkles size={14} />
                    <span>Templates</span>
                    <ChevronDown size={14} />
                  </button>
                  {showTemplateDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border/60 rounded-xl shadow-lg z-10 max-h-96 overflow-y-auto">
                      <div className="p-3 border-b border-border/40">
                        <p className="text-xs font-semibold text-text-primary mb-2">Quick Templates</p>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCategory('all')}
                            className={`px-2 py-1 text-[10px] font-medium rounded-full transition-colors capitalize ${
                              selectedCategory === 'all'
                                ? 'bg-violet-500 text-white'
                                : 'bg-surface-hover text-text-secondary hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400'
                            }`}
                          >
                            All
                          </button>
                          {['food', 'volunteer', 'system', 'emergency', 'community'].map(category => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => setSelectedCategory(category)}
                              className={`px-2 py-1 text-[10px] font-medium rounded-full transition-colors capitalize ${
                                selectedCategory === category
                                  ? 'bg-violet-500 text-white'
                                  : 'bg-surface-hover text-text-secondary hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400'
                              }`}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      </div>
                      {templatesLoading ? (
                        <div className="p-4 text-xs text-text-secondary flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                          Loading templates...
                        </div>
                      ) : (
                        <>
                          {getFilteredTemplates().map((t, index) => (
                            <div key={`default-${index}`} className="flex items-center justify-between px-4 py-3 hover:bg-surface-hover group border-b border-border/40 last:border-0">
                              <button
                                type="button"
                                onClick={() => handleLoadTemplate(t)}
                                className="flex-1 text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 capitalize">
                                    {t.category}
                                  </span>
                                  <span className="text-xs text-text-primary font-medium truncate">{t.title}</span>
                                </div>
                              </button>
                            </div>
                          ))}
                          {templates.length > 0 && (
                            <div className="p-3 border-t border-border/40 bg-surface-hover">
                              <p className="text-xs font-semibold text-text-primary mb-2">Your Saved Templates</p>
                              {templates.map(t => (
                                <div key={t.id} className="flex items-center justify-between px-3 py-2 hover:bg-surface-hover group rounded-lg">
                                  <button
                                    type="button"
                                    onClick={() => handleLoadTemplate(t)}
                                    className="flex-1 text-left text-xs text-text-primary font-medium truncate"
                                  >
                                    {t.title}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTemplate(t.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-text-secondary hover:text-danger hover:bg-danger-soft rounded-lg transition-all"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {audience === 'specific' && (
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-2">Recipients</label>
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search donors and volunteers..."
                    className="w-full pl-10 pr-10 py-2.5 border border-border/60 rounded-xl bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  />
                  {searchingUsers && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {userSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full bg-surface border border-border/60 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {userSearchResults.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleAddUser(user)}
                        className="w-full px-4 py-3 text-left text-sm text-text-primary hover:bg-surface-hover transition-colors border-b border-border/40 last:border-0 flex items-center gap-3"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-text-primary">{user.name}</div>
                          <div className="text-xs text-text-secondary">{user.email} · {user.role}</div>
                        </div>
                        <div className="text-violet-600 dark:text-violet-400">
                          <UserCheck size={16} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedUsers.map(user => (
                      <div key={user.id} className="flex items-center gap-2 px-3 py-1.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-xs font-medium border border-violet-200 dark:border-violet-800">
                        <span>{user.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(user.id)}
                          className="hover:text-danger transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-2" htmlFor="announcement-message">Message</label>
              <textarea
                id="announcement-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Write your announcement..."
                className="w-full px-4 py-3 border border-border/60 rounded-xl bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
              />
              <div className="flex justify-between mt-1.5">
                <span className="text-[11px] text-text-secondary">{message.length}/500</span>
              </div>
            </div>

            {sendError && (
              <div className="flex items-center gap-2 p-3 bg-danger-soft text-danger rounded-lg text-xs">
                <X size={14} />
                {sendError}
              </div>
            )}
            {sendResult && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-medium">
                <CheckCircle2 size={14} />
                Sent to {sendResult.recipientCount} recipient{sendResult.recipientCount !== 1 ? 's' : ''}.
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {audience !== 'team' && title.trim() && message.trim() && (
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border/60 text-text-primary text-sm font-medium hover:bg-surface-hover transition-colors"
                >
                  <Save size={14} /> Save Template
                </button>
              )}
              <button
                type="submit"
                disabled={!canSubmit || sending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={14} /> Send Announcement
                  </>
                )}
              </button>
            </div>
          </form>

          {/* History */}
          <div className="bg-surface rounded-xl border border-border/60 shadow-pb-card p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Clock size={16} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-base font-semibold text-text-primary">Announcement History</h2>
            </div>
            {historyLoading ? (
              <SkeletonCard count={4} />
            ) : historyError ? (
              <ErrorState title="Failed to load history" message={historyError} onRetry={() => setRefreshTrigger((t) => t + 1)} size="small" />
            ) : history.length === 0 ? (
              <EmptyState icon={Megaphone} title="No announcements sent yet" showAction={false} size="small" />
            ) : (
              <ul className="divide-y divide-border/40 max-h-[500px] overflow-y-auto space-y-1">
                {history.map((a) => (
                  <li key={a.id} className="py-4 hover:bg-surface-hover rounded-lg transition-colors px-2 -mx-2">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">{a.title}</p>
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2">{a.message}</p>
                      </div>
                      <div className="text-[11px] text-text-secondary whitespace-nowrap pt-0.5">
                        {formatDateTime(a.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <Users size={12} />
                        <span>Sent to {a.recipientCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <CheckCircle2 size={12} />
                        <span>Read by {a.readCount}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
