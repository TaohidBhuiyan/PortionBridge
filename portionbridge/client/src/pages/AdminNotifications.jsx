import { useState, useEffect, useCallback } from 'react';
import { Megaphone, Users, HeartHandshake, UserCheck, Send, CheckCircle2, Search, X, Save, Trash2, ChevronDown } from 'lucide-react';
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
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Notifications</h1>
          <p className="text-text-secondary text-sm">Send announcements and review what's already gone out.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Send form */}
          <form onSubmit={handleSend} className="bg-surface rounded-lg border border-border/50 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-text-primary">Send Announcement</h2>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">Audience</label>
              <div className="grid grid-cols-2 gap-2">
                {AUDIENCES.map((a) => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => setAudience(a.value)}
                      className={`text-left p-3 rounded-lg border transition-colors ${
                        audience === a.value
                          ? 'border-dash-primary bg-dash-primary-soft'
                          : 'border-border/50 hover:bg-surface-hover'
                      }`}
                    >
                      <Icon size={14} className={audience === a.value ? 'text-dash-primary' : 'text-text-secondary'} />
                      <p className="text-xs font-medium text-text-primary mt-1">{a.label}</p>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-text-secondary mt-1.5">
                {AUDIENCES.find((a) => a.value === audience)?.description}
              </p>
            </div>

            {audience === 'team' && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5" htmlFor="team-select">Team</label>
                <select
                  id="team-select"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
                >
                  <option value="">Select a team...</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}

            {audience !== 'team' && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5" htmlFor="announcement-title">Title</label>
                <div className="relative">
                  <input
                    id="announcement-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={150}
                    placeholder="e.g. Scheduled maintenance tonight"
                    className="w-full px-3 py-2 pr-20 border border-border rounded-lg bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                    className="absolute right-1 top-1 flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-colors"
                  >
                    <ChevronDown size={14} />
                  </button>
                  {showTemplateDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-surface border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {templatesLoading ? (
                        <div className="p-3 text-xs text-text-secondary">Loading templates...</div>
                      ) : templates.length === 0 ? (
                        <div className="p-3 text-xs text-text-secondary">No templates saved yet</div>
                      ) : (
                        templates.map(t => (
                          <div key={t.id} className="flex items-center justify-between px-3 py-2 hover:bg-surface-hover group">
                            <button
                              type="button"
                              onClick={() => handleLoadTemplate(t)}
                              className="flex-1 text-left text-xs text-text-primary truncate"
                            >
                              {t.title}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTemplate(t.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-danger transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {audience === 'specific' && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Recipients</label>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search donors and volunteers..."
                    className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
                  />
                  {searchingUsers && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-dash-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {userSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full bg-surface border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {userSearchResults.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleAddUser(user)}
                        className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-hover transition-colors border-b border-border/50 last:border-0"
                      >
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-text-secondary">{user.email} · {user.role}</div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedUsers.map(user => (
                      <div key={user.id} className="flex items-center gap-1.5 px-2 py-1 bg-dash-primary-soft text-dash-primary rounded-full text-xs">
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
              <label className="block text-xs font-medium text-text-secondary mb-1.5" htmlFor="announcement-message">Message</label>
              <textarea
                id="announcement-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Write your announcement..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
              />
            </div>

            {sendError && <p className="text-xs text-danger">{sendError}</p>}
            {sendResult && (
              <p className="text-xs text-success flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Sent to {sendResult.recipientCount} recipient{sendResult.recipientCount !== 1 ? 's' : ''}.
              </p>
            )}

            <div className="flex gap-2">
              {audience !== 'team' && title.trim() && message.trim() && (
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-border text-text-primary text-sm font-medium hover:bg-surface-hover transition-colors"
                >
                  <Save size={14} /> Save Template
                </button>
              )}
              <button
                type="submit"
                disabled={!canSubmit || sending}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-dash-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={14} /> {sending ? 'Sending...' : 'Send Announcement'}
              </button>
            </div>
          </form>

          {/* History */}
          <div className="bg-surface rounded-lg border border-border/50 p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Announcement History</h2>
            {historyLoading ? (
              <SkeletonCard count={4} />
            ) : historyError ? (
              <ErrorState title="Failed to load history" message={historyError} onRetry={() => setRefreshTrigger((t) => t + 1)} size="small" />
            ) : history.length === 0 ? (
              <EmptyState icon={Megaphone} title="No announcements sent yet" showAction={false} size="small" />
            ) : (
              <ul className="divide-y divide-border/50 max-h-[420px] overflow-y-auto">
                {history.map((a) => (
                  <li key={a.id} className="py-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-medium text-text-primary truncate">{a.title}</p>
                      <span className="text-[11px] text-text-secondary whitespace-nowrap">{formatDateTime(a.created_at)}</span>
                    </div>
                    <p className="text-xs text-text-secondary mb-1.5 line-clamp-2">{a.message}</p>
                    <p className="text-[11px] text-text-secondary">
                      Sent to {a.recipientCount} · Read by {a.readCount}
                    </p>
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
